import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aggregateBuckets, neededG2ForApproval, neededPFForApproval, semaphoreColor } from '@/lib/grades'
import { getNarrative } from '@/lib/narrative'
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')
  if (!classId) return new Response('Missing classId', { status: 400 })

  const until = searchParams.get('until') ? new Date(String(searchParams.get('until'))) : undefined
  const hideUndefined = searchParams.get('hideUndefined') === '1'
  const sort = (searchParams.get('sort') as 'asc'|'desc'|undefined) ?? 'desc'

  const [klass, activities, students] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId } }),
    prisma.activity.findMany({ where: { classId }, orderBy: [{ bucket: 'asc' }, { order: 'asc' }] }),
    prisma.student.findMany({ where: { classId, deletedAt: null }, orderBy: { name: 'asc' }, include: { grades: true } }),
  ])
  if (!klass) return new Response('Class not found', { status: 404 })

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

  // Build DOCX
  const title = `Relatório de Desempenho — ${klass.name} (${klass.term})`

  const rows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: 'Aluno', bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: 'G1', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: 'G2', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: 'MF', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: 'Nec. G2', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: 'Nec. PF', bold: true })] }),
      ]
    }),
    ...data.map(d => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(d.s.name)] }),
        new TableCell({ children: [new Paragraph(d.agg.G1.toFixed(1))], alignment: AlignmentType.RIGHT }),
        new TableCell({ children: [new Paragraph(d.agg.G2.toFixed(1))], alignment: AlignmentType.RIGHT }),
        new TableCell({ children: [new Paragraph(d.MF.toFixed(1))], alignment: AlignmentType.RIGHT }),
        new TableCell({ children: [new Paragraph(d.needG2.toFixed(1))], alignment: AlignmentType.RIGHT }),
        new TableCell({ children: [new Paragraph(d.MF < 6 ? d.needPF.toFixed(1) : '-')], alignment: AlignmentType.RIGHT }),
      ]
    }))
  ]

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: narrative }),
          new Paragraph({ text: ' ' }),
          new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }),
        ]
      }
    ]
  })

  const buffer = await Packer.toBuffer(doc)
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="relatorio.docx"',
    }
  })
}

