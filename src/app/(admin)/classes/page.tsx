import Link from 'next/link'
import { listClasses, createClass } from './actions'

export default async function ClassesPage() {
  const classes = await listClasses()
  async function action(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '')
    const term = String(formData.get('term') || '')
    await createClass({ name, term })
  }
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Turmas</h1>
      <form action={action} className="flex gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-sm">Nome</label>
          <input name="name" className="border px-3 py-2 rounded-md" placeholder="Disciplina X" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Período</label>
          <input name="term" className="border px-3 py-2 rounded-md" placeholder="2025/2" />
        </div>
        <button className="px-4 py-2 rounded-md bg-black text-white">Criar</button>
      </form>
      <ul className="divide-y">
        {classes.map(c => (
          <li key={c.id} className="py-3">
            <Link className="text-blue-600 underline" href={`/classes/${c.id}/tabs/students`}>{c.name} — {c.term}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

