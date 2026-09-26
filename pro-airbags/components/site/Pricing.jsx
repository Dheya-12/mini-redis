import Reveal from './Reveal';
import { CHECK } from './Buttons';

const PLANS = [
  { name: 'Module reset', price: '149', unit: '/module', body: 'Mail-in or drop-off. Crash data and hard codes cleared on your original SRS module.', items: ['Same-day turnaround', 'Bench tested before it ships', 'Keeps original coding', 'Free return shipping', '12-month warranty'], cta: 'Reset my module' },
  { name: 'Seatbelt rebuild', price: '89', unit: '/belt', body: 'Locked or fired pretensioners rebuilt on your original belt assembly.', items: ['New pyrotechnic charge', 'Retractor restored', 'Trim and color untouched', 'Buckle and sensor check', '12-month warranty'], cta: 'Rebuild my belts' },
  { name: 'Airbag service', price: '299', unit: '/from', body: 'Driver, passenger, knee, seat or curtain airbag replaced and the system reset.', items: ['OEM-spec airbag unit', 'New single-use hardware', 'Clock spring inspected', 'SRS light cleared', 'Readiness report included'], cta: 'Book airbag service' },
  { name: 'Full rebuild', price: 'Quote', unit: '', body: 'Post-collision restraint rebuild for insurers and body shops. Everything that deployed.', items: ['Itemized estimate for the claim', 'All bags, belts and sensors', 'Module reset or coded', 'Road test and report', 'Metro pick-up and delivery'], cta: 'Request a quote' },
];

/* huly.io pricing plans: horizontally snapping cards with the glow and frame that light up on hover. */
export default function Pricing() {
  return (
    <section className="relative overflow-hidden bg-grey-1 pb-[120px] pt-[152px] px-safe lg:pb-[100px] lg:pt-[109px] md:pb-20 md:pt-[77px] sm:pb-16 sm:pt-16" id="pricing">
      <div className="container-ultra-narrow">
        <Reveal>
          <h2 className="max-w-2xl font-title text-80 font-medium leading-[0.9] tracking-snugger text-white lg:text-72 md:max-w-md md:text-56 sm:max-w-96 sm:text-36">Straight prices. No surprises.</h2>
          <p className="mt-4 max-w-[580px] leading-snug tracking-tight text-grey-60">
            Every job is quoted before work starts. The three services below are fixed-price; a full post-collision rebuild is itemized for the claim.
          </p>
        </Reveal>
      </div>
      <div className="safe-paddings relative left-1/2 z-10 -ml-[50vw] w-screen [mask-image:linear-gradient(270deg,rgba(115,115,115,0.00)_9.82%,#D9D9D9_30.43%,#D9D9D9_78.87%,rgba(217,217,217,0.00)_99.54%)] sm:[mask-image:none]">
        <div className="container-ultra-narrow relative">
          <div className="relative xs:px-5">
            <div className="no-scrollbars -mx-[calc((100vw-100%)/2)] flex snap-x snap-mandatory overflow-x-auto px-[calc((100vw-100%)/2)] py-16 md:py-12 xs:px-[calc((100vw-122%)/2)]" style={{ scrollbarWidth: 'none' }}>
              <div className="flex w-[3000px] flex-shrink-0">
                {PLANS.map((p, i) => (
                  <div key={p.name} className="plan item relative mr-14 flex aspect-[0.7372] w-[390px] flex-shrink-0 cursor-pointer snap-center flex-col rounded-[24px] border border-[rgba(255,255,255,0.05)] p-[28px] pb-[25px] text-white transition-all duration-200 lg:mr-12 md:w-[366px] sm:mr-5 sm:w-[91%] sm:max-w-[366px] sm:p-[18px] xs:w-[288px]">
                    <h3 className="text-20 font-semibold leading-snug tracking-tight sm:text-16">{p.name}</h3>
                    <p className="mt-2.5 leading-snug">
                      <span className="text-64 font-semibold tracking-tight lg:text-56 md:text-48 sm:text-36">{p.unit ? '$' : ''}{p.price}</span>
                      {p.unit && <span className="ml-1 text-20 font-medium tracking-tight text-grey-80 sm:text-16">{p.unit}</span>}
                    </p>
                    <p className="mt-1 pr-3 text-18 leading-snug -tracking-[0.03em] md:mt-0 sm:pr-0 sm:text-16">{p.body}</p>
                    <span aria-hidden="true" className="mt-[18px] block h-px bg-[rgba(255,255,255,0.10)] sm:mt-4" />
                    <ul className="mt-6 flex flex-col gap-y-4 lg:mt-8 md:mt-7 sm:mt-4 sm:gap-y-3">
                      {p.items.map(it => (
                        <li key={it} className="flex items-center gap-x-2 text-18 leading-none tracking-snugger text-white/90 sm:gap-x-1.5 sm:whitespace-nowrap sm:text-16 sm:tracking-tight">
                          <img alt="" decoding="async" height="16" loading="lazy" src={CHECK} style={{ color: 'transparent' }} width="16" />
                          {it}
                        </li>
                      ))}
                    </ul>
                    <a className="transition-colors duration-200 transition-all duration-200 uppercase font-bold flex items-center justify-center h-14 w-full text-18 text-white tracking-snugger rounded-full border border-white/20 transition-all duration-200 mt-auto hover:border-white/40" href="#start">{p.cta}</a>
                    <div className="pointer-events-none select-none rounded-[inherit]">
                      <div className="plan-glow absolute -left-[70%] -top-[300px] -z-20 aspect-[0.925925] w-[1000px] rounded-[inherit] transition-opacity duration-300 md:-top-[282px] md:w-[932px] sm:-left-[68.666%] sm:-top-[56%] sm:w-[255%]" style={{ opacity: 0 }}>
                        <img alt="" className="absolute left-0 top-0 z-10 aspect-[0.925925] w-[1000px] max-w-none rounded-[inherit] md:w-[932px] xs:w-[692px]" decoding="async" height="540" loading="lazy" src="/assets/img/video-fade.8c7d3d5c.png" style={{ color: 'transparent' }} width="500" />
                      </div>
                    </div>
                    <div className="plan-frame pointer-events-none absolute -inset-px -z-10 select-none rounded-[inherit] opacity-0 transition-opacity duration-300 [backdrop-filter:blur(1px)] sm:rounded-[18px]">
                      <img alt="" decoding="async" height="530" loading="lazy" src="/assets/media/a83ee981cdeb0c2c0bc39fbbdf2c8021.svg" style={{ color: 'transparent' }} width="391" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
