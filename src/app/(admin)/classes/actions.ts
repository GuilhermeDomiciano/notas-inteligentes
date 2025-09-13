"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'


export async function listClasses() {
  return prisma.class.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function getClass(id: string) {
  const cid = z.string().min(1).parse(id)
  return prisma.class.findUnique({ where: { id: cid } })
}

export async function createClass(input: { name: string; term: string }) {
  const schema = z.object({ name: z.string().min(1), term: z.string().min(1) })
  const data = schema.parse(input)
  const klass = await prisma.class.create({ data })
  revalidatePath('/classes')
  return klass
}

export async function updateClass(id: string, input: Partial<{ name: string; term: string }>) {
  const cid = z.string().min(1).parse(id)
  const schema = z.object({ name: z.string().min(1).optional(), term: z.string().min(1).optional() })
  const data = schema.parse(input)
  const klass = await prisma.class.update({ where: { id: cid }, data })
  revalidatePath('/classes')
  revalidatePath(`/classes/${cid}`)
  return klass
}

