export type Bucket = 'G1' | 'G2' | 'FINAL'

export function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x))
}

// Calculadoras conforme Agent.md
export function neededG2ForApproval(G1: number) {
  // MF = (G1 + 2*G2)/3; aprovado com 6
  // 6 <= (G1 + 2*G2)/3 => G2 >= (3*6 - G1)/2
  return clamp((3 * 6 - G1) / 2, 0, 10)
}

export function neededPFForApproval(MF: number) {
  // MR = (MF + 2*PF)/3; aprovado com 6
  // 6 <= (MF + 2*PF)/3 => PF >= (3*6 - MF)/2
  return clamp((3 * 6 - MF) / 2, 0, 10)
}

export function semaphoreColor(avg: number) {
  if (avg < 5) return 'red'
  if (avg < 6) return 'yellow'
  return 'green'
}

export interface ActivityLike {
  id: string
  bucket: Bucket
  weight: number
  dueAt?: Date | string
}

export interface GradeLike {
  activityId: string
  points: number | null
}

export interface AggregateOptions {
  until?: Date // considerar somente atividades com dueAt <= until
  hideUndefined?: boolean // ignorar notas não lançadas
}

// Soma por bucket considerando pesos; assume que pesos no bucket somam até 10
export function aggregateBuckets(
  activities: ActivityLike[],
  grades: GradeLike[],
  opts: AggregateOptions = {}
) {
  const { until, hideUndefined } = opts
  const byId = new Map(activities.map(a => [a.id, a]))

  const filteredActs = activities.filter(a =>
    until ? new Date(a.dueAt ?? 0) <= until : true
  )

  const buckets: Record<Bucket, { total: number; filled: number; max: number }> = {
    G1: { total: 0, filled: 0, max: 0 },
    G2: { total: 0, filled: 0, max: 0 },
    FINAL: { total: 0, filled: 0, max: 0 },
  }

  for (const a of filteredActs) {
    buckets[a.bucket].max += a.weight
  }

  for (const g of grades) {
    const a = byId.get(g.activityId)
    if (!a) continue
    if (until && a.dueAt && new Date(a.dueAt) > until) continue
    if (g.points == null) {
      if (hideUndefined) continue
      // conta como zero lançado
      buckets[a.bucket].filled += 0
      continue
    }
    buckets[a.bucket].total += g.points
    buckets[a.bucket].filled += g.points
  }

  // Normaliza para escala 0..10 caso o total de pesos do bucket não seja 10
  const normalize = (sum: number, max: number) => (max > 0 ? (sum * 10) / max : 0)

  const G1 = normalize(buckets.G1.total, buckets.G1.max)
  const G2 = normalize(buckets.G2.total, buckets.G2.max)
  const PF = normalize(buckets.FINAL.total, buckets.FINAL.max)

  const MF = (G1 + 2 * G2) / 3
  const MR = (MF + 2 * PF) / 3

  return { buckets, G1, G2, PF, MF, MR }
}

