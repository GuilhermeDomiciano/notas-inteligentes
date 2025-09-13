import { prisma } from '@/lib/prisma'
import { upsertGrade } from '../../actions'

export default async function GradesTab({ params }: { params: { id: string } }) {
  const [students, activities, grades] = await Promise.all([
    prisma.student.findMany({ where: { classId: params.id, deletedAt: null }, orderBy: { name: 'asc' } }),
    prisma.activity.findMany({ where: { classId: params.id }, orderBy: [{ bucket: 'asc' }, { order: 'asc' }] }),
    prisma.studentActivityGrade.findMany({ where: { student: { classId: params.id } } }),
  ])

  const byKey = new Map(grades.map(g => [`${g.studentId}:${g.activityId}`, g] as const))

  async function saveAction(formData: FormData) {
    'use server'
    const studentId = String(formData.get('studentId') || '')
    const activityId = String(formData.get('activityId') || '')
    const raw = formData.get('points')
    const points = raw === '' || raw === null ? null : Number(raw)
    await upsertGrade(params.id, { studentId, activityId, points })
  }

  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4">Aluno</th>
            {activities.map(a => (
              <th key={a.id} className="text-left px-2 whitespace-nowrap">{a.title} <span className="text-xs text-gray-500">({a.bucket} • {a.weight})</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id} className="border-t">
              <td className="py-2 pr-4 font-medium whitespace-nowrap">{s.name}</td>
              {activities.map(a => {
                const k = `${s.id}:${a.id}`
                const g = byKey.get(k)
                const val = g?.points ?? ''
                return (
                  <td key={k} className="px-2 py-1">
                    <form action={saveAction}>
                      <input type="hidden" name="studentId" value={s.id} />
                      <input type="hidden" name="activityId" value={a.id} />
                      <input name="points" defaultValue={val as any} placeholder="-" className="w-20 border px-2 py-1 rounded" />
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

