import { prisma } from '@/lib/prisma'
import { createStudent, softDeleteStudent } from '../../actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default async function StudentsTab({ params }: { params: { id: string } }) {
  const students = await prisma.student.findMany({ where: { classId: params.id, deletedAt: null }, orderBy: { createdAt: 'asc' } })

  async function addAction(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '')
    const academicNo = String(formData.get('academicNo') || '')
    await createStudent(params.id, { name, academicNo })
  }

  async function delAction(formData: FormData) {
    'use server'
    const id = String(formData.get('id') || '')
    await softDeleteStudent(params.id, id)
  }

  return (
    <div className="space-y-4">
      <form action={addAction} className="flex gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-sm">Nome</label>
          <Input name="name" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Número Acadêmico</label>
          <Input name="academicNo" />
        </div>
        <Button type="submit">Adicionar</Button>
      </form>

      <div className="rounded-2xl shadow-sm p-4 border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2">Nome</th>
              <th>Número Acadêmico</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-t">
                <td className="py-2">{s.name}</td>
                <td>{s.academicNo}</td>
                <td className="text-right">
                  <form action={delAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-red-600 underline">Remover</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

