import { prisma } from '@/lib/prisma'
import { aggregateBuckets, neededG2ForApproval, neededPFForApproval, semaphoreColor } from '@/lib/grades'
import { getNarrative } from '@/lib/narrative'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HiddenSelect } from '@/components/ui/hidden-select'
import { Badge } from '@/components/ui/badge'
import { WhatIfSimulator } from '@/components/report/what-if-simulator'
import { Heatmap } from '@/components/report/heatmap'
import { ExportButtons } from '@/components/report/export-buttons'

export default async function ReportTab({ params, searchParams }: { params: Promise<{ id: string }>, searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params
  const sp = (searchParams ? await searchParams : {}) as Record<string, string | string[] | undefined>
  const activities = await prisma.activity.findMany({ where: { classId: id }, orderBy: [{ bucket: 'asc' }, { order: 'asc' }] })
  const students = await prisma.student.findMany({ where: { classId: id, deletedAt: null }, orderBy: { name: 'asc' }, include: { grades: true } })

  const bucket = (sp.bucket as 'G1'|'G2'|'ALL'|undefined) ?? 'ALL'
  const until = sp.until ? new Date(sp.until as string) : undefined
  const hideUndefined = sp.hideUndefined === '1'
  const sort = (sp.sort as 'asc'|'desc'|undefined) ?? 'desc'
  const orderBy = (sp.orderBy as 'mf'|'risk'|undefined) ?? 'mf'

  const data = students.map(s => {
    const agg = aggregateBuckets(activities, s.grades, { until, hideUndefined })
    const MF = agg.MF
    const needG2 = neededG2ForApproval(agg.G1)
    const needPF = neededPFForApproval(MF)
    const color = semaphoreColor(MF)
    return { s, agg, MF, needG2, needPF, color }
  }).sort((a,b)=> {
    if (orderBy === 'risk') {
      const order = { red: 0, yellow: 1, green: 2 } as const
      const byColor = order[a.color as 'red'|'yellow'|'green'] - order[b.color as 'red'|'yellow'|'green']
      if (byColor !== 0) return byColor
      return sort==='asc' ? a.MF - b.MF : b.MF - a.MF
    }
    return sort==='asc' ? a.MF - b.MF : b.MF - a.MF
  })

  const counts = data.reduce((acc, d) => { acc[d.color as 'red'|'yellow'|'green']++; return acc }, { red: 0, yellow: 0, green: 0 } as Record<'red'|'yellow'|'green', number>)

  // Resumo e insights
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const mfValues = data.map(d => d.MF)
  const g1Values = data.map(d => d.agg.G1)
  const g2Values = data.map(d => d.agg.G2)
  const avgG1 = avg(g1Values)
  const avgG2 = avg(g2Values)
  const avgMF = avg(mfValues)
  const medianMF = (() => {
    const arr = [...mfValues].sort((a, b) => a - b)
    const n = arr.length
    if (!n) return 0
    return n % 2 === 1 ? arr[(n - 1) / 2] : (arr[n / 2 - 1] + arr[n / 2]) / 2
  })()
  const atRiskTop5 = data.filter(d => d.color === 'red').sort((a, b) => a.MF - b.MF).slice(0, 5)
  const bestTop5 = [...data].sort((a, b) => b.MF - a.MF).slice(0, 5)
  const evolutionTop5 = until
    ? [...data]
        .map(d => ({ ...d, delta: d.MF - d.agg.G1 }))
        .sort((a, b) => (b.delta - a.delta))
        .slice(0, 5)
    : []

  // Histograma de MF (0–4.9, 5–5.9, 6–6.9, 7–7.9, 8–8.9, 9–10)
  const mfBins = [ [0,4.9],[5,5.9],[6,6.9],[7,7.9],[8,8.9],[9,10] ] as const
  const mfDist = mfBins.map(([lo,hi]) => {
    const count = data.filter(d => d.MF >= lo && d.MF <= hi).length
    const pct = data.length ? Math.round((count / data.length) * 100) : 0
    return { label: `${lo.toFixed(0)}–${hi.toFixed(1)}`, count, pct }
  })

  // Estatísticas por atividade (para narrativa/heatmap)
  const activityStats = activities
    .filter(a => !until || new Date(a.dueAt) <= until)
    .map(a => {
      const values: number[] = []
      let missing = 0
      for (const st of students) {
        const g = st.grades.find(g => g.activityId === a.id)
        if (!g || g.points == null) {
          if (!hideUndefined) values.push(0)
          missing += 1
        } else {
          values.push((g.points / a.weight) * 10)
        }
      }
      const avg = values.length ? values.reduce((x,y)=>x+y,0) / values.length : 0
      const missingRate = students.length ? missing / students.length : 0
      return { id: a.id, title: a.title, bucket: a.bucket, avg, missingRate, weight: a.weight, dueAt: a.dueAt as any }
    })
    .sort((a,b)=> a.avg - b.avg)

  // Build PDF export URL preserving filters
  const qs = new URLSearchParams()
  qs.set('classId', id)
  if (bucket) qs.set('bucket', bucket)
  if (sp.until) qs.set('until', String(sp.until))
  if (hideUndefined) qs.set('hideUndefined', '1')
  if (sort) qs.set('sort', sort)
  const pdfHref = `/api/report/pdf?${qs.toString()}`
  const docxHref = `/api/report/docx?${qs.toString()}`

  const narrative = getNarrative({
    counts,
    avgG1, avgG2, avgMF, medianMF,
    totalStudents: data.length,
    worstActivities: activityStats.slice(0,3)
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-2">
              <HiddenSelect
                name="bucket"
                defaultValue={bucket}
                options={[
                  { value: 'ALL', label: 'Todos' },
                  { value: 'G1', label: 'G1' },
                  { value: 'G2', label: 'G2' },
                ]}
                placeholder="Bucket"
              />
            </div>
            <div className="sm:col-span-3">
              <input name="until" type="date" defaultValue={(sp.until as string | undefined) ?? ''} className="border px-3 py-2 rounded-md w-full" />
            </div>
            <div className="sm:col-span-3 flex items-center gap-2">
              <input id="hideUndefined" type="checkbox" name="hideUndefined" value="1" defaultChecked={hideUndefined} />
              <label htmlFor="hideUndefined" className="text-sm">Ocultar não definidas</label>
            </div>
            <div className="sm:col-span-2">
              <HiddenSelect
                name="sort"
                defaultValue={sort}
                options={[
                  { value: 'desc', label: 'Maior → menor' },
                  { value: 'asc', label: 'Menor → maior' },
                ]}
                placeholder="Ordenação"
              />
            </div>
            <div className="sm:col-span-2">
              <HiddenSelect
                name="orderBy"
                defaultValue={orderBy}
                options={[
                  { value: 'mf', label: 'Ordenar por média' },
                  { value: 'risk', label: 'Ordenar por risco' },
                ]}
                placeholder="Ordenar por"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full">Aplicar</Button>
            </div>
          </form>
          <ExportButtons pdfHref={pdfHref} docxHref={docxHref} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alunos e Médias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl p-0 border">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2 px-2">Aluno</th>
                  <th>G1</th>
                  <th>G2</th>
                  <th>MF</th>
                  <th>Necessário G2</th>
                  <th>Necessário PF</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr>
                    <td className="py-6 px-2 text-muted-foreground" colSpan={7}>Nenhum dado para exibir com os filtros atuais.</td>
                  </tr>
                )}
                {data.map(({ s, agg, MF, needG2, needPF, color }) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2 px-2">{s.name}</td>
                    <td>{agg.G1.toFixed(1)}</td>
                    <td>{agg.G2.toFixed(1)}</td>
                    <td>
                      <span className={
                        color==='red' ? 'text-red-600' : color==='yellow' ? 'text-yellow-600' : 'text-green-600'
                      }>
                        {MF.toFixed(1)}
                      </span>
                    </td>
                    <td>{needG2.toFixed(1)}</td>
                    <td>{MF < 6 ? needPF.toFixed(1) : '-'}</td>
                    <td>
                      <Badge className={
                        color==='red' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' :
                        color==='yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      }>
                        {color==='red'?'Em risco':color==='yellow'?'Atenção':'OK'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vermelho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="h-8 w-8 rounded-full bg-red-500" />
              <div className="text-2xl font-semibold">{counts.red}</div>
              <div className="text-sm text-muted-foreground">em risco</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Amarelo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="h-8 w-8 rounded-full bg-yellow-500" />
              <div className="text-2xl font-semibold">{counts.yellow}</div>
              <div className="text-sm text-muted-foreground">atenção</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Verde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="h-8 w-8 rounded-full bg-green-500" />
              <div className="text-2xl font-semibold">{counts.green}</div>
              <div className="text-sm text-muted-foreground">ok</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Narrativa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{narrative}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição de MF</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mfDist.map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="w-20 text-xs text-muted-foreground">{b.label}</span>
                <div className="flex-1 bg-muted rounded h-2">
                  <div className="bg-primary h-2 rounded" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="w-12 text-right text-xs">{b.pct}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium mb-2">Resumo da turma</div>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  <div className="text-muted-foreground">Média G1</div>
                  <div className="font-medium">{avgG1.toFixed(1)}</div>
                  <div className="text-muted-foreground">Média G2</div>
                  <div className="font-medium">{avgG2.toFixed(1)}</div>
                  <div className="text-muted-foreground">Média MF</div>
                  <div className="font-medium">{avgMF.toFixed(1)}</div>
                  <div className="text-muted-foreground">Mediana MF</div>
                  <div className="font-medium">{medianMF.toFixed(1)}</div>
                  <div className="text-muted-foreground">Em risco</div>
                  <div className="font-medium">{counts.red}</div>
                  <div className="text-muted-foreground">Atenção</div>
                  <div className="font-medium">{counts.yellow}</div>
                  <div className="text-muted-foreground">OK</div>
                  <div className="font-medium">{counts.green}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Em risco (Top 5)</div>
                <div className="space-y-2">
                  {atRiskTop5.length === 0 && (
                    <div className="text-xs text-muted-foreground">Sem alunos em risco.</div>
                  )}
                  {atRiskTop5.map(({ s, MF, needG2, needPF }) => (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm">{s.name}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-red-600 font-medium">MF {MF.toFixed(1)}</span>
                        <span className="text-muted-foreground">G2 {needG2.toFixed(1)}</span>
                        <span className="text-muted-foreground">PF {needPF.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{until ? 'Maior evolução até a data' : 'Destaques (Top 5)'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(!until && bestTop5.length === 0) && (
                <div className="text-xs text-muted-foreground">Sem destaques no momento.</div>
              )}
              {until ? (
                evolutionTop5.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Sem evolução a exibir.</div>
                ) : (
                  evolutionTop5.map(({ s, MF, agg, delta, color }) => (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">G1 {agg.G1.toFixed(1)} → MF {MF.toFixed(1)}</div>
                      </div>
                      <span className={(delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-muted-foreground')}>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                      </span>
                    </div>
                  ))
                )
              ) : (
                bestTop5.map(({ s, MF, agg, color }) => (
                  <div key={s.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">G1 {agg.G1.toFixed(1)} • G2 {agg.G2.toFixed(1)}</div>
                    </div>
                    <span className={color==='red'?'text-red-600':color==='yellow'?'text-yellow-600':'text-green-600'}>
                      {MF.toFixed(1)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Simulador (What‑if)</CardTitle>
          </CardHeader>
          <CardContent>
            <WhatIfSimulator items={data.map(d => ({ id: d.s.id, name: d.s.name, G1: d.agg.G1, G2: d.agg.G2, MF: d.MF }))} />
          </CardContent>
        </Card>
        <Card>
        <CardHeader>
          <CardTitle>Heatmap (Aluno × Atividade)</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap
            activities={activities
              .filter(a => !until || new Date(a.dueAt) <= until)
              .map(a => ({ id: a.id, title: a.title, bucket: a.bucket as 'G1'|'G2'|'FINAL', weight: a.weight }))}
            students={data.map(d => ({ id: d.s.id, name: d.s.name, grades: d.s.grades.map(g => ({ activityId: g.activityId, points: g.points as number | null })) }))}
            defaultTreatUndefinedAsZero={false}
          />
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
