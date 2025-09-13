"use server"

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const classIdSchema = z.string().min(1)

export async function createStudent(classId: string, input: { name: string; academicNo: string }) {
  const cid = classIdSchema.parse(classId)
  const schema = z.object({ name: z.string().min(1), academicNo: z.string().min(1) })
  const data = schema.parse(input)
  const student = await prisma.student.create({ data: { classId: cid, ...data } })
  revalidatePath(`/classes/${cid}`)
  return student
}

export async function updateStudent(classId: string, studentId: string, input: { name?: string; academicNo?: string; notes?: string | null }) {
  const cid = classIdSchema.parse(classId)
  const sid = z.string().min(1).parse(studentId)
  const schema = z.object({ name: z.string().min(1).optional(), academicNo: z.string().min(1).optional(), notes: z.string().nullable().optional() })
  const data = schema.parse(input)
  const student = await prisma.student.update({ where: { id: sid }, data })
  revalidatePath(`/classes/${cid}`)
  return student
}

export async function softDeleteStudent(classId: string, studentId: string) {
  const cid = classIdSchema.parse(classId)
  const sid = z.string().min(1).parse(studentId)
  await prisma.student.update({ where: { id: sid }, data: { deletedAt: new Date() } })
  revalidatePath(`/classes/${cid}`)
}

export async function createActivity(classId: string, input: { title: string; bucket: 'G1'|'G2'|'FINAL'; weight: number; dueAt: Date; order?: number }) {
  const cid = classIdSchema.parse(classId)
  const schema = z.object({
    title: z.string().min(1),
    bucket: z.enum(['G1','G2','FINAL']),
    weight: z.number().min(0),
    dueAt: z.coerce.date(),
    order: z.number().int().optional()
  })
  const data = schema.parse(input)
  const last = await prisma.activity.findFirst({ where: { classId: cid, bucket: data.bucket }, orderBy: { order: 'desc' }, select: { order: true } })
  const nextOrder = data.order ?? ((last?.order ?? 0) + 1)
  const activity = await prisma.activity.create({ data: { classId: cid, title: data.title, bucket: data.bucket, weight: data.weight, dueAt: data.dueAt, order: nextOrder } })
  revalidatePath(`/classes/${cid}`)
  return activity
}

export async function updateActivity(classId: string, activityId: string, input: Partial<{ title: string; bucket: 'G1'|'G2'|'FINAL'; weight: number; dueAt: Date; order: number }>) {
  const cid = classIdSchema.parse(classId)
  const aid = z.string().min(1).parse(activityId)
  const schema = z.object({
    title: z.string().min(1).optional(),
    bucket: z.enum(['G1','G2','FINAL']).optional(),
    weight: z.number().min(0).optional(),
    dueAt: z.coerce.date().optional(),
    order: z.number().int().optional(),
  })
  const data = schema.parse(input)
  const activity = await prisma.activity.update({ where: { id: aid }, data })
  revalidatePath(`/classes/${cid}`)
  return activity
}

export async function deleteActivity(classId: string, activityId: string) {
  const cid = classIdSchema.parse(classId)
  const aid = z.string().min(1).parse(activityId)
  await prisma.activity.delete({ where: { id: aid } })
  revalidatePath(`/classes/${cid}`)
}

export async function upsertGrade(classId: string, params: { studentId: string; activityId: string; points: number | null; changedBy?: string }) {
  const cid = classIdSchema.parse(classId)
  const schema = z.object({
    studentId: z.string().min(1),
    activityId: z.string().min(1),
    points: z.number().nullable(),
    changedBy: z.string().default('admin').optional(),
  })
  const { studentId, activityId, points, changedBy } = schema.parse(params)

  // Validate bounds with activity weight
  const activity = await prisma.activity.findUnique({ where: { id: activityId } })
  if (!activity) throw new Error('Atividade não encontrada')
  if (points != null && (points < 0 || points > activity.weight)) {
    throw new Error(`Valor inválido: 0..${activity.weight}`)
  }

  const existing = await prisma.studentActivityGrade.findFirst({ where: { studentId, activityId } })
  let gradeId: string
  let oldPoints: number | null = null
  if (existing) {
    oldPoints = existing.points ?? null
    const updated = await prisma.studentActivityGrade.update({ where: { id: existing.id }, data: { points, gradedAt: new Date() } })
    gradeId = updated.id
  } else {
    const created = await prisma.studentActivityGrade.create({ data: { studentId, activityId, points, gradedAt: new Date() } })
    gradeId = created.id
  }

  await prisma.gradeAudit.create({ data: { gradeId, oldPoints, newPoints: points, changedBy: changedBy ?? 'admin' } })
  revalidatePath(`/classes/${cid}`)
}

