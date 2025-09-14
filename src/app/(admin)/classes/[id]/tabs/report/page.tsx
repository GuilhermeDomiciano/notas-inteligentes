import { prisma } from '@/lib/prisma'
import { aggregateBuckets, neededG2ForApproval, neededPFForApproval, semaphoreColor } from '@/lib/grades'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HiddenSelect } from '@/components/ui/hidden-select'
import { Badge } from '@/components/ui/badge'

export default async function ReportTab({ params, searchParams }: { params: Promise<{ id: string }>, searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params
  const sp = (searchParams ? await searchParams : {}) as Record<string, string | string[] | undefined>
  const activities = await prisma.activity.findMany({ where: { classId: id }, orderBy: [{ bucket: 'asc' }, { order: 'asc' }] })
  const students = await prisma.student.findMany({ where: { classId: id, deletedAt: null }, orderBy: { name: 'asc' }, include: { grades: true } })

  const bucket = (sp.bucket as 'G1'|'G2'|'ALL'|undefined) ?? 'ALL'
  const until = sp.until ? new Date(sp.until as string) : undefined
  const hideUndefined = sp.hideUndefined === '1'
  const sort = (sp.sort as 'asc'|'desc'|undefined) ?? 'desc'

  const data = students.map(s => {
    const agg = aggregateBuckets(activities, s.grades, { until, hideUndefined })
    const MF = agg.MF
    const needG2 = neededG2ForApproval(agg.G1)
    const needPF = neededPFForApproval(MF)
    const color = semaphoreColor(MF)
    return { s, agg, MF, needG2, needPF, color }
  }).sort((a,b)=> sort==='asc' ? a.MF - b.MF : b.MF - a.MF)

  const counts = data.reduce((acc, d) => { acc[d.color as 'red'|'yellow'|'green']++; return acc }, { red: 0, yellow: 0, green: 0 } as Record<'red'|'yellow'|'green', number>)
  const maxMF = Math.max(10, ...data.map(d=>d.MF))
  // Build PDF export URL preserving filters
  const qs = new URLSearchParams()
  qs.set('classId', id)
  if (bucket) qs.set('bucket', bucket)
  if (sp.until) qs.set('until', String(sp.until))
  if (hideUndefined) qs.set('hideUndefined', '1')
  if (sort) qs.set('sort', sort)
  const pdfHref = `/api/report/pdf?${qs.toString()}`

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
              <Button type="submit" className="w-full">Aplicar</Button>
            </div>
          </form>
          <div className="mt-4 flex justify-end">
            <Button asChild>
              <a href={pdfHref} target="_blank" rel="noreferrer">Exportar PDF</a>
            </Button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Semáforo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 h-32">
              {(['red','yellow','green'] as const).map((c) => {
                const v = counts[c]
                const h = data.length ? Math.round((v / data.length) * 100) : 0
                return (
                  <div key={c} className="flex flex-col items-center gap-1">
                    <div className={`w-10 rounded-t ${c==='red'?'bg-red-500':c==='yellow'?'bg-yellow-500':'bg-green-500'}`} style={{height: `${h}%`}} />
                    <span className="text-xs text-muted-foreground">{c}</span>
                    <span className="text-xs">{v}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Médias Finais (MF)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.map(({ s, MF }) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-40 truncate text-xs text-muted-foreground">{s.name}</span>
                  <div className="flex-1 bg-muted rounded h-2">
                    <div className="bg-blue-500 h-2 rounded" style={{ width: `${(MF / maxMF) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs">{MF.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
