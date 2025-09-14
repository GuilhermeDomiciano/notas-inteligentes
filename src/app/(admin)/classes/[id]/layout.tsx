import Link from 'next/link'
import { ReactNode } from 'react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ClassLayout({ params, children }: { params: Promise<{ id: string }>, children: ReactNode }) {
  const { id } = await params
  const klass = await prisma.class.findUnique({ where: { id } })
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-xl">{klass?.name} - {klass?.term}</CardTitle>
          <Link href="/classes" className="text-sm underline">Voltar</Link>
        </CardHeader>
        <CardContent>
          <nav className="bg-muted inline-flex h-9 items-center gap-2 rounded-lg p-1 text-sm">
            <Link href={`/classes/${id}/tabs/students`} className="px-3 py-1 rounded-md hover:bg-background">Alunos</Link>
            <Link href={`/classes/${id}/tabs/activities`} className="px-3 py-1 rounded-md hover:bg-background">Atividades</Link>
            <Link href={`/classes/${id}/tabs/grades`} className="px-3 py-1 rounded-md hover:bg-background">Lançamentos</Link>
            <Link href={`/classes/${id}/tabs/report`} className="px-3 py-1 rounded-md hover:bg-background">Relatório</Link>
          </nav>
        </CardContent>
      </Card>
      <div>
        {children}
      </div>
    </div>
  )
}

