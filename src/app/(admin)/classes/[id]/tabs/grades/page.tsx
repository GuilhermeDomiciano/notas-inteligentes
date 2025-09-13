import { prisma } from '@/lib/prisma'
import { upsertGrade } from '../../actions'
import { Input } from '@/components/ui/input'

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
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4">Aluno</th>
            {activities.map((a: typeof activities[number]) => (
              <th key={a.id} className="text-left px-2 whitespace-nowrap">{a.title} <span className="text-xs text-gray-500">({a.bucket} • {a.weight})</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((s: typeof students[number]) => (
            <tr key={s.id} className="border-t">
              <td className="py-2 pr-4 font-medium whitespace-nowrap">{s.name}</td>
              {activities.map((a: typeof activities[number]) => {
                const k = `${s.id}:${a.id}`
                const g = byKey.get(k)
                const val: number | '' = g?.points ?? ''
                return (
                  <td key={k} className="px-2 py-1">
                    <form action={saveAction}>
                      <input type="hidden" name="studentId" value={s.id} />
                      <input type="hidden" name="activityId" value={a.id} />
                      <Input name="points" defaultValue={val} placeholder="-" className="w-20" />
                    </form>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">Dica: altere um valor e pressione Enter para salvar.</p>
    </div>
  )
}
