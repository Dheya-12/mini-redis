'use client';
import { useState } from 'react';
import Reveal from './Reveal';
import { CHEVRON } from './Buttons';

const QA = [
  ['Is it safe to repair airbags instead of replacing the whole system?', 'Yes, when it is done to the manufacturer\'s procedure. Every deployed component is replaced with a new unit, modules are reset or replaced, and the system is verified with the same diagnostic tooling a dealer uses. You receive a readiness report showing it is fully armed.'],
  ['Why is my SRS light still on after the airbags were replaced?', 'The control module stores hard crash codes after a deployment. New airbags alone will not clear them. The module needs a crash-data reset or replacement and VIN coding, and any locked pretensioners or damaged sensors have to be addressed too.'],
  ['Can I mail in my SRS module?', 'Yes. Remove the module, note the VIN, and ship it to us. Most modules are reset, bench-tested and shipped back within one business day of arrival, still carrying their original coding.'],
  ['Do you rebuild my original seatbelts or swap them?', 'We rebuild your originals. The pretensioner receives a new pyrotechnic charge and the retractor is restored, so color, trim and mounting all match. Webbing is replaced only if it is cut, frayed or blown.'],
  ['How long does a full post-collision SRS repair take?', 'Most vehicles are complete within 24 to 48 hours once parts are in hand. Complex systems with multiple curtain airbags and occupant sensors can take a little longer, and we tell you up front.'],
  ['Do you work with insurance companies and body shops?', 'Every day. We provide itemized estimates and a documented readiness report that adjusters and shops accept, and we pick up and deliver within the metro area for shop accounts.'],
];

/* Questions, in huly.io's dropdown panel styling: grey-5 panels with grey-10 borders and hover rows. */
export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="relative bg-grey-1 pb-[120px] pt-24 px-safe lg:pb-[100px] md:pb-20 md:pt-16 sm:pb-16 sm:pt-12" id="faq">
      <div className="container-ultra-narrow lg:max-w-5xl">
        <Reveal>
          <h2 className="font-title text-56 font-medium leading-[0.9] tracking-snugger text-white lg:text-48 md:text-40 sm:text-32">Straight answers before you book</h2>
          <p className="mt-4 max-w-[580px] leading-snug tracking-tight text-grey-60">Not covered here? Call the shop and talk to a technician, not a call center.</p>
        </Reveal>
        <Reveal delay={0.1}>
          <ul className="mt-12 flex flex-col gap-y-2.5 md:mt-9 sm:mt-7">
            {QA.map(([q, a], i) => {
              const isOpen = open === i;
              return (
                <li key={q} className={'faq rounded-[14px] border border-grey-10 bg-grey-5 p-2.5 shadow-[0px_14px_20px_rgba(0,0,0,0.5)]' + (isOpen ? ' open' : '')}>
                  <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)} className="transition-colors duration-200 flex w-full items-center rounded-[14px] p-2 text-left transition-colors duration-200 hover:bg-grey-10">
                    <span className="ml-2 text-16 leading-dense tracking-snugger text-white sm:text-15">{q}</span>
                    <img alt="" className={'ml-auto mr-1 shrink-0 transition-transform duration-200 ' + (isOpen ? 'rotate-180' : '')} decoding="async" height="6" src={CHEVRON} style={{ color: 'transparent' }} width="10" />
                  </button>
                  <div className="faq-a"><div><p className="px-4 pb-3 pt-2 text-15 font-light leading-snug tracking-snugger text-grey-60">{a}</p></div></div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
