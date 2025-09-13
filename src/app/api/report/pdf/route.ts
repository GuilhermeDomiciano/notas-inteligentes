import { NextRequest } from 'next/server'
import { renderPdfFromUrl } from '@/lib/pdf'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const classId = searchParams.get('classId')
  if (!classId) return new Response('Missing classId', { status: 400 })

  const params = new URLSearchParams()
  for (const [k, v] of searchParams.entries()) {
    if (k === 'classId') continue
    params.set(k, v)
  }
  const url = `${origin}/classes/${classId}/tabs/report/print?${params.toString()}`
  const pdf = await renderPdfFromUrl(url)
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="relatorio.pdf"',
    },
  })
}
