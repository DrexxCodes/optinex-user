import { s } from "@upstash/redis";

const REVIEWS = [
  {
    initials: 'CO',
    name: 'Chidinma O.',
    role: 'Graphic Designer, Lagos',
    quote:
      'I fit reviews in between client work and the payout still shows before I close my laptop. No stress, no chasing anybody.'
  },
  {
    initials: 'TB',
    name: 'Tunde B.',
    role: 'NYSC Corps Member, Abuja',
    quote:
      'Talent Core is my favourite — I record short voice tasks and get credited the same day. The dashboard makes it easy to track.'
  },
  {
    initials: 'AF',
    name: 'Amaka F.',
    role: 'Remote Support Agent, Enugu',
    quote:
      "No confusing point systems, just Naira I can actually withdraw. First platform like this that's felt straightforward to me."
  }
];

export default function Testimonials() {
  return (
    <section id="reviews" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-xl">
          <span className="font-body text-xs font-semibold uppercase tracking-wide text-brand-500">
            What earners say
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
            Real people, real payouts
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {REVIEWS.map((review) => (
            <figure
              key={review.name}
              className="flex h-full flex-col justify-between rounded-2xl border border-ink/5 bg-white/60 p-6 shadow-card backdrop-blur-xs"
            >
              <blockquote className="font-body text-sm leading-relaxed text-ink/70">
                &ldquo;{review.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-500/10 font-display text-xs font-bold text-brand-600">
                  {review.initials}
                </span>
                <div>
                  <p className="font-display text-sm font-semibold text-ink">{review.name}</p>
                  <p className="font-body text-xs text-ink/45">{review.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
