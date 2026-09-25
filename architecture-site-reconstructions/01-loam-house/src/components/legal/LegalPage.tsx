import Link from "next/link";
import type { ReactNode } from "react";
import { WORDMARK } from "@/content/site";

/* eslint-disable @next/next/no-img-element -- static wordmark */

/**
 * Plain document page for the legal notices: none of the immersive site's motion,
 * smoothing or dark phone ground applies here.
 */
export function LegalPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper font-sans text-[16px] leading-[1.65] font-light text-ink antialiased max-tablet:bg-paper">
      <header className="flex items-center justify-between gap-5 border-b border-line px-[6vw] py-[22px] max-tablet:px-6 max-tablet:py-[18px]">
        <Link href="/" aria-label="Loam House home">
          <img src={WORDMARK} alt="Loam House" className="block h-auto w-[150px] max-tablet:w-[128px]" />
        </Link>
        <Link
          href="/"
          className="whitespace-nowrap text-[10px] leading-none font-medium tracking-[0.18em] text-ink uppercase no-underline opacity-70 hover:opacity-100"
        >
          ← Back to Loam House
        </Link>
      </header>
      <main className="legal mx-auto max-w-[70ch] px-[6vw] pt-[72px] pb-[110px] max-tablet:px-6 max-tablet:pt-[52px] max-tablet:pb-[90px]">
        <p className="mb-[22px] text-[10px] leading-none font-semibold tracking-[0.24em] text-olive uppercase">
          Loam House · Sandringham
        </p>
        <h1 className="mb-[18px] font-serif text-[clamp(44px,7vw,68px)] leading-[0.95] font-normal tracking-[-0.03em] text-balance">
          {title}
        </h1>
        <p className="mb-12 text-[13px] text-ink/60">{subtitle}</p>
        {children}
        <p className="mt-14 border-t border-line pt-[22px] text-[13px] text-ink/60">
          © 2026 Loam House · Final release by Auyin
        </p>
      </main>
    </div>
  );
}
