/**
 * Builds a URL for the self-hosted Dicebear avatar route
 * (spotix-backend/v1/dicebear.js). Mirrors
 * spotix-booker/app/lib/dicebear.ts so nominee avatars look consistent
 * with the rest of Spotix.
 */
export function dicebearAvatarUrl(
  seed: string,
  opts?: { style?: "avataaars" | "micah" | "identicon"; size?: number }
) {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || ""
  const style = opts?.style || "avataaars"
  const size = opts?.size || 128
  const cleanSeed = (seed || "unknown").trim().toLowerCase()
  return `${backend}/v1/dicebear/${encodeURIComponent(cleanSeed)}?style=${style}&size=${size}`
}

/**
 * Resolves the image to render for a contestant:
 *   - If the contestant was set up with a generated avatar (imageType
 *     "generated"), always render it from its Dicebear seed — this is the
 *     source of truth, not whatever URL happened to be cached in `image`.
 *   - Otherwise, use the provided `image` if present (an uploaded photo).
 *   - If neither yields anything usable, fall back to generating one from
 *     the seed/contestantId anyway, so a contestant is never left with a
 *     broken image.
 */
export function resolveContestantImage(contestant: {
  contestantId: string
  image?: string | null
  imageType?: "uploaded" | "generated" | null
  imageSeed?: string | null
}): string {
  if (contestant.imageType === "generated") {
    return dicebearAvatarUrl(contestant.imageSeed || contestant.contestantId)
  }
  if (contestant.image) return contestant.image
  return dicebearAvatarUrl(contestant.imageSeed || contestant.contestantId)
}
