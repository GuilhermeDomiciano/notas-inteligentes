"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ExportButtons({ pdfHref, docxHref }: { pdfHref: string; docxHref: string }) {
  async function handleDocx() {
    try {
      const res = await fetch(docxHref)
      if (!res.ok) throw new Error(`Falha na geração do Word (${res.status})`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'relatorio.docx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Word gerado com sucesso')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao gerar Word. Verifique dependências.')
    }
  }

  return (
    <div className="mt-4 flex justify-end gap-2">
      <Button asChild title="Gera PDF pronto para impressão (com narrativa).">
        <a href={pdfHref} target="_blank" rel="noreferrer">Exportar PDF</a>
      </Button>
      <Button variant="secondary" onClick={handleDocx} title="Gera arquivo .docx com narrativa e tabela.">
        Exportar Word
      </Button>
    </div>
  )
}

