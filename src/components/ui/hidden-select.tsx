"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Option = { value: string; label: string }

export function HiddenSelect({
  name,
  defaultValue,
  placeholder,
  options,
  className,
}: {
  name: string
  defaultValue?: string
  placeholder?: string
  options: Option[]
  className?: string
}) {
  const [value, setValue] = useState<string | undefined>(defaultValue)
  const id = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.value = value ?? ""
  }, [value])

  return (
    <div className={className}>
      <input ref={inputRef} type="hidden" name={name} id={id} defaultValue={defaultValue} />
      <Select defaultValue={defaultValue} onValueChange={(v) => setValue(v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder ?? "Selecionar"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

