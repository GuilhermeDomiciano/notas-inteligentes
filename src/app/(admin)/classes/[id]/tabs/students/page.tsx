import { prisma } from '@/lib/prisma'
import { createStudent, softDeleteStudent } from '../../actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'

export default async function StudentsTab({ params, searchParams }: { params: Promise<{ id: string }>, searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params
  const sp = (searchParams ? await searchParams : {}) as Record<string, string | string[] | undefined>
  const q = typeof sp.q === 'string' ? sp.q : ''

  const students = await prisma.student.findMany({
    where: {
      classId: id,
      deletedAt: null,
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    },
    orderBy: { createdAt: 'asc' }
  })

  async function addAction(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '')
    const academicNo = String(formData.get('academicNo') || '')
    await createStudent(id, { name, academicNo })
  }

  async function delAction(formData: FormData) {
    'use server'
    const studentId = String(formData.get('id') || '')
    await softDeleteStudent(id, studentId)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Novo aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addAction} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
              <div className="sm:col-span-4 space-y-1">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" placeholder="Nome completo" />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="academicNo">Acadêmico</Label>
                <Input id="academicNo" name="academicNo" placeholder="2025xxx" />
              </div>
              <div className="sm:col-span-6">
                <Button type="submit" className="w-full">Adicionar</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="mb-4 flex gap-2">
              <Input name="q" placeholder="Buscar por nome" defaultValue={q} className="max-w-xs" />
              <Button type="submit" variant="secondary">Buscar</Button>
            </form>
            {students.length === 0 ? (
              <div className="text-sm text-muted-foreground py-10 text-center">Nenhum aluno cadastrado ainda.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Número Acadêmico</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="py-2">{s.name}</TableCell>
                      <TableCell>{s.academicNo}</TableCell>
                      <TableCell className="text-right">
                        <form action={delAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <Button variant="link" className="text-red-600">Remover</Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

