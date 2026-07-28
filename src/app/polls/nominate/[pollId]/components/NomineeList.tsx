"use client"

import { Users } from "lucide-react"
import { NomineeCard } from "./NomineeCard"

interface Nominee {
  name: string
  count: number
}

interface NomineeListProps {
  nominees: Nominee[]
  loading: boolean
}

export function NomineeList({ nominees, loading }: NomineeListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (nominees.length === 0) {
    return (
      <div className="text-center py-10 bg-white/50 rounded-2xl border-2 border-dashed border-slate-300">
        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500 text-sm font-medium">No nominees yet — be the first!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {nominees.map((n) => (
        <NomineeCard key={n.name} name={n.name} count={n.count} />
      ))}
    </div>
  )
}
