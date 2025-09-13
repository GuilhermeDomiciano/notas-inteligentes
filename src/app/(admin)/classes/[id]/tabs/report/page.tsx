import { prisma } from '@/lib/prisma'
import { aggregateBuckets, neededG2ForApproval, neededPFForApproval, semaphoreColor } from '@/lib/grades'

export default async function ReportTab({ params, searchParams }: { params: { id: string }, searchParams?: { bucket?: string, until?: string, hideUndefined?: string, sort?: string } }) {
  const activities = await prisma.activity.findMany({ where: { classId: params.id }, orderBy: [{ bucket: 'asc' }, { order: 'asc' }] })
  const students = await prisma.student.findMany({ where: { classId: params.id, deletedAt: null }, orderBy: { name: 'asc' }, include: { grades: true } })

  const bucket = (searchParams?.bucket as 'G1'|'G2'|'ALL'|undefined) ?? 'ALL'
  const until = searchParams?.until ? new Date(searchParams.until) : undefined
  const hideUndefined = searchParams?.hideUndefined === '1'
  const sort = (searchParams?.sort as 'asc'|'desc'|undefined) ?? 'desc'

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

  return (
    <div className="space-y-6">
      <form className="flex gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-sm">Bucket</label>
          <select name="bucket" defaultValue={bucket} className="border px-3 py-2 rounded-md">
            <option value="ALL">Todos</option>
            <option value="G1">G1</option>
            <option value="G2">G2</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Até data</label>
          <input name="until" type="date" defaultValue={searchParams?.until ?? ''} className="border px-3 py-2 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <input id="hideUndefined" type="checkbox" name="hideUndefined" value="1" defaultChecked={hideUndefined} />
          <label htmlFor="hideUndefined" className="text-sm">Ocultar não definidas</label>
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Ordenar por média</label>
          <select name="sort" defaultValue={sort} className="border px-3 py-2 rounded-md">
            <option value="desc">Maior → menor</option>
            <option value="asc">Menor → maior</option>
          </select>
        </div>
        <button className="px-4 py-2 rounded-md bg-black text-white">Aplicar</button>
      </form>

      <div className="rounded-2xl shadow-sm p-4 border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2">Aluno</th>
              <th>G1</th>
              <th>G2</th>
              <th>MF</th>
              <th>Necessário G2</th>
              <th>Necessário PF</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ s, agg, MF, needG2, needPF, color }) => (
              <tr key={s.id} className="border-t">
                <td className="py-2">{s.name}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl shadow-sm p-4 border">
          <h3 className="font-medium mb-2">Distribuição por Semáforo</h3>
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
        </div>
        <div className="rounded-2xl shadow-sm p-4 border">
          <h3 className="font-medium mb-2">Médias Finais (MF)</h3>
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
        </div>
      </div>
    </div>
  )
}

