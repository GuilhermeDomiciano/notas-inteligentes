
import { prisma } from '@/lib/prisma'
import { createActivity, deleteActivity } from '../../actions'

export default async function ActivitiesTab({ params }: { params: { id: string } }) {
  const activities = await prisma.activity.findMany({ where: { classId: params.id }, orderBy: [{ bucket: 'asc' }, { order: 'asc' }] })

  async function addAction(formData: FormData) {
    'use server'
    const title = String(formData.get('title') || '')
    const bucket = String(formData.get('bucket') || 'G1') as 'G1'|'G2'|'FINAL'
    const weight = Number(formData.get('weight') || 0)
    const dueAt = new Date(String(formData.get('dueAt') || new Date().toISOString()))
    await createActivity(params.id, { title, bucket, weight, dueAt })
  }

  async function delAction(formData: FormData) {
    'use server'
    const id = String(formData.get('id') || '')
    await deleteActivity(params.id, id)
  }

  return (
    <div className="space-y-4">
      <form action={addAction} className="grid grid-cols-5 gap-2 items-end">
        <div className="flex flex-col col-span-2">
          <label className="text-sm">Título</label>
          <input name="title" className="border px-3 py-2 rounded-md" />
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
          <input name="weight" type="number" step="0.1" min="0" className="border px-3 py-2 rounded-md" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Data</label>
          <input name="dueAt" type="date" className="border px-3 py-2 rounded-md" />
        </div>
        <div className="col-span-5">
          <button className="px-4 py-2 rounded-md bg-black text-white">Adicionar</button>
        </div>
      </form>

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
  )
}

