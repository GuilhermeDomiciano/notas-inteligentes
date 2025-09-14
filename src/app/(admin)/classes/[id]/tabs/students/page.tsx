import { prisma } from '@/lib/prisma'
import { createStudent, softDeleteStudent } from '../../actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'

export default async function StudentsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const students = await prisma.student.findMany({ where: { classId: id, deletedAt: null }, orderBy: { createdAt: 'asc' } })

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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar aluno</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addAction} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
            <div className="sm:col-span-4 space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="academicNo">Número Acadêmico</Label>
              <Input id="academicNo" name="academicNo" />
            </div>
            <div className="sm:col-span-6">
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Número Acadêmico</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(s => (
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
        </CardContent>
      </Card>
    </div>
  )
}

