"use client"

import { dicebearAvatarUrl } from "@/app/lib/dicebear"

interface NomineeCardProps {
  name: string
  count: number
}

export function NomineeCard({ name, count }: NomineeCardProps) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3">
      <img
        src={dicebearAvatarUrl(name)}
        alt={name}
        className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 truncate capitalize">{name}</p>
        <p className="text-xs text-slate-500">
          {count} nomination{count !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}
