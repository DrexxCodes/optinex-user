"use client"

import { Tag } from "lucide-react"

export interface NominationCategory {
  categoryId: string
  name: string
}

interface CategoryTabsProps {
  categories: NominationCategory[]
  activeCategoryId: string | null
  onSelect: (categoryId: string) => void
}

export function CategoryTabs({ categories, activeCategoryId, onSelect }: CategoryTabsProps) {
  if (categories.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      {categories.map((cat) => {
        const active = cat.categoryId === activeCategoryId
        return (
          <button
            key={cat.categoryId}
            onClick={() => onSelect(cat.categoryId)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0
              ${active
                ? "bg-[#6b2fa5] text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-[#6b2fa5]/40"}`}
          >
            <Tag className="w-3.5 h-3.5" />
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
