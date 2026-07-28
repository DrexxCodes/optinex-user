import type { Metadata } from "next"
import NominateClient from "./nominateClient"
import UserHeader from "@/components/UserHeader"
import Footer from "@/components/footer"

interface Props {
  params: Promise<{ pollId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pollId } = await params
  return {
    title: "Nominate — Spotix",
    description: "Nominate a candidate for this open-nomination poll on Spotix.",
    alternates: { canonical: `/polls/nominate/${pollId}` },
  }
}

export default async function NominatePage({ params }: Props) {
  const { pollId } = await params

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <UserHeader />
      <NominateClient pollId={pollId} />
      <Footer />
    </div>
  )
}
