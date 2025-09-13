import { prisma } from '@/lib/prisma'
import { createActivity, deleteActivity } from '../../actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default async function ActivitiesTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const activities = await prisma.activity.findMany({ where: { classId: id }, orderBy: [{ bucket: 'asc' }, { order: 'asc' }] })

  async function addAction(formData: FormData) {
    'use server'
    const title = String(formData.get('title') || '')
    const bucket = String(formData.get('bucket') || 'G1') as 'G1'|'G2'|'FINAL'
    const weight = Number(formData.get('weight') || 0)
    const dueAt = new Date(String(formData.get('dueAt') || new Date().toISOString()))
    await createActivity(id, { title, bucket, weight, dueAt })
  }

  async function delAction(formData: FormData) {
    'use server'
    const activityId = String(formData.get('id') || '')
    await deleteActivity(id, activityId)
  }

  return (
    <div className="space-y-4">
      <form action={addAction} className="grid grid-cols-5 gap-2 items-end">
        <div className="flex flex-col col-span-2">
          <label className="text-sm">Título</label>
          <Input name="title" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Bucket</label>
          <select name="bucket" className="border px-3 py-2 rounded-md">
            <option value="G1">G1</option>
            <option value="G2">G2</option>
            <option value="FINAL">FINAL</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Peso</label>
          <Input name="weight" type="number" step="0.1" min={0} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Data</label>
          <Input name="dueAt" type="date" />
        </div>
        <div className="col-span-5">
          <Button type="submit">Adicionar</Button>
        </div>
      </form>

      <div className="rounded-2xl shadow-sm p-4 border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2">Título</th>
              <th>Bucket</th>
              <th>Peso</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {activities.map(a => (
              <tr key={a.id} className="border-t">
                <td className="py-2">{a.title}</td>
                <td>{a.bucket}</td>
                <td>{a.weight}</td>
                <td>{new Date(a.dueAt).toLocaleDateString()}</td>
                <td className="text-right">
                  <form action={delAction}>
                    <input type="hidden" name="id" value={a.id} />
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

