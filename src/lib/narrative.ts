export interface NarrativeInput {
  className?: string
  counts: { red: number; yellow: number; green: number }
  avgG1: number
  avgG2: number
  avgMF: number
  medianMF: number
  totalStudents: number
  worstActivities: Array<{ title: string; bucket: string; avg: number; missingRate: number }>
}

export function getNarrative(n: NarrativeInput): string {
  const { counts, avgG1, avgG2, avgMF, medianMF, totalStudents, worstActivities } = n
  const pct = (v: number) => (totalStudents > 0 ? Math.round((v / totalStudents) * 100) : 0)
  const parts: string[] = []

  parts.push(
    `Visão geral: média G1 ${avgG1.toFixed(1)}, média G2 ${avgG2.toFixed(1)}, média final ${avgMF.toFixed(1)} (mediana ${medianMF.toFixed(1)}).`
  )
  parts.push(
    `Distribuição por semáforo: em risco ${counts.red} (${pct(counts.red)}%), atenção ${counts.yellow} (${pct(counts.yellow)}%), ok ${counts.green} (${pct(counts.green)}%).`
  )

  if (worstActivities.length > 0) {
    const top = worstActivities.slice(0, 2)
    const items = top
      .map(w => `${w.title} (${w.bucket}) — média ${w.avg.toFixed(1)}${w.missingRate > 0 ? 
        `, ${Math.round(w.missingRate * 100)}% sem lançamento` : ''}`)
      .join('; ')
    parts.push(`Atividades mais críticas: ${items}.`)
  } else {
    parts.push(`Não há atividades críticas no período analisado.`)
  }

  parts.push(
    `Recomendações: priorizar recuperação dos alunos em vermelho; revisar conteúdos associados às atividades críticas; comunicar metas individuais (G2/PF) aos alunos próximos do corte.`
  )

  return parts.join(' ')
}

