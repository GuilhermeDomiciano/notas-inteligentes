import { prisma } from '@/lib/prisma'
import { upsertGrade } from '../../actions'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'

export default async function GradesTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [students, activities, grades] = await Promise.all([
    prisma.student.findMany({ where: { classId: id, deletedAt: null }, orderBy: { name: 'asc' } }),
    prisma.activity.findMany({ where: { classId: id }, orderBy: [{ bucket: 'asc' }, { order: 'asc' }] }),
    prisma.studentActivityGrade.findMany({ where: { student: { classId: id } } }),
  ])

  const byKey = new Map<string, typeof grades[number]>(
    grades.map((g: typeof grades[number]) => [`${g.studentId}:${g.activityId}`, g])
  )

  async function saveAction(formData: FormData) {
    'use server'
    const studentId = String(formData.get('studentId') || '')
    const activityId = String(formData.get('activityId') || '')
    const raw = formData.get('points')
    const points = raw === '' || raw === null ? null : Number(raw)
    await upsertGrade(id, { studentId, activityId, points })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lançamentos</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48 sticky left-0 bg-background z-10">Aluno</TableHead>
              {activities.map((a: typeof activities[number]) => (
                <TableHead key={a.id} className="whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>{a.title}</span>
                    <span className={`inline-flex items-center gap-1 text-xs ${a.bucket==='G1'?'text-blue-600':a.bucket==='G2'?'text-emerald-600':'text-purple-600'}`}>
                      <span className={`h-2 w-2 rounded-full ${a.bucket==='G1'?'bg-blue-500':a.bucket==='G2'?'bg-emerald-500':'bg-purple-500'}`}></span>
                      {a.bucket} • {a.weight}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s: typeof students[number], rowIndex: number) => (
              <TableRow key={s.id} className={rowIndex % 2 === 1 ? 'bg-muted/30' : ''}>
                <TableCell className="font-medium whitespace-nowrap pr-4 sticky left-0 bg-background z-10">{s.name}</TableCell>
                {activities.map((a: typeof activities[number]) => {
                  const k = `${s.id}:${a.id}`
                  const g = byKey.get(k)
                  const val: number | '' = g?.points ?? ''
                  return (
                    <TableCell key={k} className="px-2 py-1">
                      <form action={saveAction} className="flex items-center gap-1">
                        <input type="hidden" name="studentId" value={s.id} />
                        <input type="hidden" name="activityId" value={a.id} />
                        <Input name="points" defaultValue={val} placeholder="-" className="w-20" />
                        <span className="text-[10px] text-muted-foreground">/ {a.weight}</span>
                      </form>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-2">Dica: altere um valor e pressione Enter para salvar.</p>
      </CardContent>
    </Card>
  )
}
