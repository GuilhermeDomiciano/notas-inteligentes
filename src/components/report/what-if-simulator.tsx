"use client"

import { useMemo, useState } from 'react'

export type WhatIfItem = {
  id: string
  name: string
  G1: number
  G2: number
  MF: number
}

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x))
}

export function WhatIfSimulator({ items }: { items: WhatIfItem[] }) {
  const [deltaG2, setDeltaG2] = useState(0)

  const result = useMemo(() => {
    const updated = items.map(it => {
      const newG2 = clamp(it.G2 + deltaG2, 0, 10)
      const newMF = (it.G1 + 2 * newG2) / 3
      const crossed = it.MF < 6 && newMF >= 6
      return { ...it, newG2, newMF, crossed }
    })
    const gained = updated.filter(u => u.crossed)
    const totals = {
      beforeOk: items.filter(i => i.MF >= 6).length,
      afterOk: updated.filter(u => u.newMF >= 6).length,
    }
    return { updated, gained, totals }
  }, [items, deltaG2])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Ajuste hipotético na G2</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={-2}
            max={2}
            step={0.1}
            value={deltaG2}
            onChange={e => setDeltaG2(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-sm w-12 text-right">{deltaG2.toFixed(1)}</span>
        </div>
        <p className="text-xs text-muted-foreground">Simula um ganho/perda uniformes na G2 (c/ limite 0..10). Calcula quantos alunos passam a atingir MF ≥ 6.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground">Aprovados antes</div>
          <div className="text-2xl font-semibold">{result.totals.beforeOk}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground">Aprovados após</div>
          <div className="text-2xl font-semibold">{result.totals.afterOk}</div>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Alunos que cruzam o corte</div>
        {result.gained.length === 0 ? (
          <div className="text-xs text-muted-foreground">Nenhum aluno cruza o corte com o ajuste atual.</div>
        ) : (
          <div className="space-y-1 text-sm">
            {result.gained.map(g => (
              <div key={g.id} className="flex items-center justify-between">
                <span className="truncate">{g.name}</span>
                <div className="text-xs text-muted-foreground">MF {g.MF.toFixed(1)} → <span className="text-emerald-600 font-medium">{g.newMF.toFixed(1)}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

