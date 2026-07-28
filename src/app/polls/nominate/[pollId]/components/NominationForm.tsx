"use client"

import { useState } from "react"
import { Loader2, CheckCircle, AlertCircle, UserPlus } from "lucide-react"

interface NominationFormProps {
  pollId: string
  categoryId: string
  categoryName: string
  deviceId: string | null
  alreadyNominated: boolean
  onNominated: () => void
}

export function NominationForm({
  pollId,
  categoryId,
  categoryName,
  deviceId,
  alreadyNominated,
  onNominated,
}: NominationFormProps) {
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError("Please enter a name (at least 2 characters).")
      return
    }
    if (!deviceId) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/v1/polls/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, categoryId, name: trimmed, deviceId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to submit nomination.")
        return
      }

      setSuccess(true)
      setName("")
      onNominated()
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (alreadyNominated || success) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-700">
          You've already nominated someone in <span className="font-semibold">{categoryName}</span>.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
      <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-[#6b2fa5]" />
        Nominate someone for {categoryName}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Enter a name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          maxLength={60}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-[#6b2fa5] focus:ring-2 focus:ring-[#6b2fa5]/20"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !deviceId}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#6b2fa5] text-white text-sm font-medium hover:bg-[#5a1f8a] disabled:opacity-60 transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Nominate"}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
      <p className="text-[11px] text-slate-400">One nomination per category, per device.</p>
    </div>
  )
}
