"use client"

import { useState } from 'react'

export type HeatmapActivity = {
  id: string
  title: string
  bucket: 'G1' | 'G2' | 'FINAL'
  weight: number
}

export type HeatmapStudent = {
  id: string
  name: string
  grades: Array<{ activityId: string; points: number | null }>
}

export function Heatmap({
  activities,
  students,
  defaultTreatUndefinedAsZero = false,
}: {
  activities: HeatmapActivity[]
  students: HeatmapStudent[]
  defaultTreatUndefinedAsZero?: boolean
}) {
  const [treatUndefinedAsZero, setTreatUndefinedAsZero] = useState(defaultTreatUndefinedAsZero)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={treatUndefinedAsZero}
            onChange={e => setTreatUndefinedAsZero(e.target.checked)}
          />
          <span>Tratar não definidas como zero</span>
        </label>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>0</span>
          <div className="h-2 w-28 rounded bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
          <span>10</span>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="text-xs min-w-max">
          <thead>
            <tr>
              <th className="text-left p-1 pr-3 sticky left-0 bg-background">Aluno</th>
              {activities.map(a => (
                <th key={a.id} className="text-left p-1 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${a.bucket==='G1'?'bg-blue-500':a.bucket==='G2'?'bg-emerald-500':'bg-purple-500'}`} />
                    {a.title}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td className="p-1 pr-3 sticky left-0 bg-background whitespace-nowrap">{s.name}</td>
                {activities.map(a => {
                  const g = s.grades.find(g => g.activityId === a.id)
                  const normalized = g?.points == null
                    ? (treatUndefinedAsZero ? 0 : null)
                    : Math.max(0, Math.min(1, (g.points as number) / (a.weight as number)))
                  const hue = normalized == null ? 0 : Math.round(120 * normalized)
                  const bg = normalized == null ? 'bg-muted' : ''
                  const style = normalized == null ? {} : { backgroundColor: `hsl(${hue} 70% 45%)` }
                  return (
                    <td key={`${s.id}:${a.id}`} className="p-0.5">
                      <div
                        className={`h-5 w-8 rounded ${bg}`}
                        style={style as React.CSSProperties}
                        title={`${a.title} — ${g?.points ?? '-'} / ${a.weight}`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

