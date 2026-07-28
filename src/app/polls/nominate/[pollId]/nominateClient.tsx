"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { CategoryTabs, type NominationCategory } from "./components/CategoryTabs"
import { NominationForm } from "./components/NominationForm"
import { NomineeList } from "./components/NomineeList"
import { useDeviceId, hasNominatedLocally, markNominatedLocally } from "./hooks/useDeviceId"

interface NominationPoll {
  pollId: string
  pollName: string
  pollImage: string
  pollDescription: string
  categories: NominationCategory[]
  status: "active" | "closed"
}

interface Nominee {
  name: string
  count: number
}

export default function NominateClient({ pollId }: { pollId: string }) {
  const deviceId = useDeviceId()

  const [poll, setPoll] = useState<NominationPoll | null>(null)
  const [pollLoading, setPollLoading] = useState(true)
  const [pollError, setPollError] = useState<string | null>(null)

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [nominees, setNominees] = useState<Nominee[]>([])
  const [nomineesLoading, setNomineesLoading] = useState(false)

  // ── Fetch poll metadata ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await fetch(`/api/v1/polls/nominations/${pollId}`)
        const data = await res.json()
        if (!res.ok) {
          setPollError(data.error || "Failed to load nomination poll")
          return
        }
        setPoll(data.poll)
        if (data.poll.categories.length > 0) {
          setActiveCategoryId(data.poll.categories[0].categoryId)
        }
      } catch {
        setPollError("An unexpected error occurred while loading this poll.")
      } finally {
        setPollLoading(false)
      }
    }
    fetchPoll()
  }, [pollId])

  // ── Fetch nominees for the active category ─────────────────────────────
  const fetchNominees = useCallback(async () => {
    if (!activeCategoryId) return
    setNomineesLoading(true)
    try {
      const res = await fetch(
        `/api/v1/polls/nominations/${pollId}/nominees?categoryId=${activeCategoryId}`
      )
      const data = await res.json()
      if (res.ok) setNominees(data.nominees ?? [])
    } catch {
      // Non-fatal — leave the previous list in place
    } finally {
      setNomineesLoading(false)
    }
  }, [pollId, activeCategoryId])

  useEffect(() => {
    fetchNominees()
  }, [fetchNominees])

  if (pollLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6b2fa5] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (pollError || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-700 font-semibold">{pollError || "Nomination poll not found"}</p>
          <Link href="/vote" className="text-[#6b2fa5] text-sm mt-2 inline-block">
            ← Back to Polls
          </Link>
        </div>
      </div>
    )
  }

  const activeCategory = poll.categories.find((c) => c.categoryId === activeCategoryId)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/vote" className="inline-flex items-center text-[#6b2fa5] hover:text-[#5a1f8a] text-sm font-medium mb-6">
        ← Back to Polls
      </Link>

      <div className="bg-white/80 rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 mb-6">
        <div className="mb-5 h-40 sm:h-56 rounded-xl overflow-hidden bg-slate-100">
          <img src={poll.pollImage || "/placeholder.svg"} alt={poll.pollName} className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{poll.pollName}</h1>
        {poll.pollDescription && <p className="text-slate-600 mb-1">{poll.pollDescription}</p>}
        {poll.status === "closed" && (
          <p className="mt-3 inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
            Nominations closed
          </p>
        )}
      </div>

      <div className="mb-4">
        <CategoryTabs
          categories={poll.categories}
          activeCategoryId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />
      </div>

      {activeCategory && poll.status === "active" && (
        <div className="mb-6">
          <NominationForm
            pollId={poll.pollId}
            categoryId={activeCategory.categoryId}
            categoryName={activeCategory.name}
            deviceId={deviceId}
            alreadyNominated={hasNominatedLocally(poll.pollId, activeCategory.categoryId)}
            onNominated={() => {
              markNominatedLocally(poll.pollId, activeCategory.categoryId)
              fetchNominees()
            }}
          />
        </div>
      )}

      <h2 className="text-lg font-bold text-slate-900 mb-3">
        Nominees {activeCategory ? `— ${activeCategory.name}` : ""}
      </h2>
      <NomineeList nominees={nominees} loading={nomineesLoading} />
    </div>
  )
}
