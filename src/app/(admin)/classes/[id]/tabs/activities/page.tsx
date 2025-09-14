import { prisma } from '@/lib/prisma'
import { createActivity, deleteActivity } from '../../actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { HiddenSelect } from '@/components/ui/hidden-select'

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
      <Card>
        <CardHeader>
          <CardTitle>Adicionar atividade</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addAction} className="grid grid-cols-1 sm:grid-cols-8 gap-3 items-end">
            <div className="sm:col-span-4 space-y-1">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Bucket</Label>
              <HiddenSelect
                name="bucket"
                defaultValue="G1"
                options={[
                  { value: 'G1', label: 'G1' },
                  { value: 'G2', label: 'G2' },
                  { value: 'FINAL', label: 'FINAL' },
                ]}
              />
            </div>
            <div className="sm:col-span-1 space-y-1">
              <Label htmlFor="weight">Peso</Label>
              <Input id="weight" name="weight" type="number" step="0.1" min={0} />
            </div>
            <div className="sm:col-span-1 space-y-1">
              <Label htmlFor="dueAt">Data</Label>
              <Input id="dueAt" name="dueAt" type="date" />
            </div>
            <div className="sm:col-span-8">
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Bucket</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Data</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="py-2">{a.title}</TableCell>
                  <TableCell>{a.bucket}</TableCell>
                  <TableCell>{a.weight}</TableCell>
                  <TableCell>{new Date(a.dueAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <form action={delAction}>
                      <input type="hidden" name="id" value={a.id} />
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
