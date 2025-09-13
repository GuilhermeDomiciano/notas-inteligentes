import Link from 'next/link'
import { ReactNode } from 'react'
import { prisma } from '@/lib/prisma'

export default async function ClassLayout({ params, children }: { params: { id: string }, children: ReactNode }) {
  const klass = await prisma.class.findUnique({ where: { id: params.id } })
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{klass?.name} — {klass?.term}</h1>
        <Link href="/classes" className="text-sm text-blue-600 underline">Voltar</Link>
      </div>
      <nav className="flex gap-4 border-b pb-2 text-sm">
        <Link href={`/classes/${params.id}/tabs/students`} className="hover:underline">Alunos</Link>
        <Link href={`/classes/${params.id}/tabs/activities`} className="hover:underline">Atividades</Link>
        <Link href={`/classes/${params.id}/tabs/grades`} className="hover:underline">Lançamentos</Link>
        <Link href={`/classes/${params.id}/tabs/report`} className="hover:underline">Relatório</Link>
      </nav>
      <div>
        {children}
      </div>
    </div>
  )
}

