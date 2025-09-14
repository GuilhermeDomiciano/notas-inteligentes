import Link from 'next/link'
import { listClasses, createClass } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'

export default async function ClassesPage() {
  const classes = await listClasses()
  async function action(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '')
    const term = String(formData.get('term') || '')
    await createClass({ name, term })
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Turmas"
        subtitle="Gerencie disciplinas e períodos da demonstração."
        actions={<Badge variant="secondary">Total: {classes.length}</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Nova turma</CardTitle>
            <CardDescription>Crie uma turma rapidamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
              <div className="sm:col-span-4 space-y-1">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" placeholder="Disciplina X" />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="term">Período</Label>
                <Input id="term" name="term" placeholder="2025/2" />
              </div>
              <div className="sm:col-span-6">
                <Button type="submit" className="w-full">Criar</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lista de turmas</CardTitle>
            <CardDescription>Abra uma turma para lançar notas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.term}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" asChild>
                        <Link href={`/classes/${c.id}/tabs/students`}>Abrir</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
