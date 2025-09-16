import { prisma } from '@/lib/prisma'
import { aggregateBuckets, neededG2ForApproval, neededPFForApproval, semaphoreColor } from '@/lib/grades'
import { getNarrative } from '@/lib/narrative'

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

  const counts = data.reduce((acc, d) => { acc[d.color as 'red'|'yellow'|'green']++; return acc }, { red: 0, yellow: 0, green: 0 } as Record<'red'|'yellow'|'green', number>)
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const avgG1 = avg(data.map(d=>d.agg.G1))
  const avgG2 = avg(data.map(d=>d.agg.G2))
  const avgMF = avg(data.map(d=>d.MF))
  const medianMF = (()=>{ const arr=[...data.map(d=>d.MF)].sort((a,b)=>a-b); const n=arr.length; return n? (n%2?arr[(n-1)/2]:(arr[n/2-1]+arr[n/2])/2):0 })()
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
      const avgA = values.length ? values.reduce((x,y)=>x+y,0) / values.length : 0
      const missingRate = students.length ? missing / students.length : 0
      return { id: a.id, title: a.title, bucket: a.bucket, avg: avgA, missingRate }
    })
    .sort((a,b)=> a.avg - b.avg)

  const narrative = getNarrative({ counts, avgG1, avgG2, avgMF, medianMF, totalStudents: data.length, worstActivities: activityStats.slice(0,3) })

  const distText = (() => {
    const bins = [ [0,4.9],[5,5.9],[6,6.9],[7,7.9],[8,8.9],[9,10] ] as const
    const parts = bins.map(([lo,hi]) => {
      const count = data.filter(d => d.MF >= lo && d.MF <= hi).length
      const pct = data.length ? Math.round((count / data.length) * 100) : 0
      return `${lo.toFixed(0)}–${hi.toFixed(1)}: ${pct}%`
    })
    return parts.join(' • ')
  })()

  return (
    <div className="p-8 print:p-0">
      <h1 className="text-xl font-semibold mb-4">Relatório de Notas</h1>
      <p className="text-sm text-muted-foreground mb-6">{narrative}</p>
      <div className="mb-6 text-xs"><strong>Distribuição de MF:</strong> {distText}</div>

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

