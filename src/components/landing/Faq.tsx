'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'How fast can I withdraw my earnings?',
    a: 'Withdrawals are processed automatically. Once you request a payout, funds typically reach your bank account within a few minutes, depending on your bank.'
  },
  {
    q: 'Is there a minimum balance to withdraw?',
    a: 'No. You can withdraw any amount at any time — there\u2019s no arbitrary threshold standing between you and your money.'
  },
  {
    q: 'What kind of tasks will I see?',
    a: 'Tasks range from product reviews to Talent Core submissions and network opportunities. Tasks are matched to your profile so what you see stays relevant.'
  },
  {
    q: 'Is Incossify free to join?',
    a: 'Yes, creating an account and accessing tasks costs nothing. There are no hidden charges at any point.'
  }
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <span className="font-body text-xs font-semibold uppercase tracking-wide text-brand-500">
            Questions, answered
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
            Everything before you start
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-ink/5 bg-white/60 backdrop-blur-xs"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-sm font-semibold text-ink">{item.q}</span>
                  <Plus
                    className={`h-4 w-4 flex-none text-brand-500 transition-transform ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden px-6">
                    <p className="pb-5 font-body text-sm leading-relaxed text-ink/60">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
