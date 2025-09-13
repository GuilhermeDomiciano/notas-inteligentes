import { prisma } from '@/lib/prisma'
import { aggregateBuckets, neededG2ForApproval, neededPFForApproval, semaphoreColor } from '@/lib/grades'

export default async function ReportPrintPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params
  const sp = (searchParams ? await searchParams : {}) as Record<string, string | string[] | undefined>
  const activities = await prisma.activity.findMany({ where: { classId: id }, orderBy: [{ bucket: 'asc' }, { order: 'asc' }] })
  const students = await prisma.student.findMany({ where: { classId: id, deletedAt: null }, orderBy: { name: 'asc' }, include: { grades: true } })

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

  return (
    <div className="p-8 print:p-0">
      <h1 className="text-xl font-semibold mb-4">Relatório de Notas</h1>
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

