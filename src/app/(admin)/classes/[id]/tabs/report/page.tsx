import { prisma } from '@/lib/prisma'
import { aggregateBuckets, neededG2ForApproval, neededPFForApproval, semaphoreColor } from '@/src/lib/grades'

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

  return (
    <div className="space-y-4">
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
          <input name="until" type="date" defaultValue={searchParams?.until} className="border px-3 py-2 rounded-md" />
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
  )
}

