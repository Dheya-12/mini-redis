import Reveal from './Reveal';

const FEATURES = [
  { icon: '/assets/media/2a9e454742efc41c8de5d3889bf55d34.svg', w: 37, title: 'Two-way with the adjuster', body: 'Estimates go out itemized. Approvals come back the same day.' },
  { icon: '/assets/media/4d5dd04473e9f2ebc5c49291c1f73681.svg', w: 40, title: 'Direct billing', body: 'We bill the carrier. You pay the deductible and nothing else.' },
  { icon: '/assets/media/7338cddab3021d50f73a3d36c88df490.svg', w: 44, title: 'Body shop accounts', body: 'Pick-up and delivery across the metro, on the shop’s schedule.' },
  { icon: '/assets/media/c1edb00984cbfb46dd8eda516738f4f0.svg', w: 40, title: 'Total-loss reviews', body: 'A second opinion before a car is written off over its airbags.' },
  { icon: '/assets/media/352118264d839bffe60735ff4aeed26f.svg', w: 60, title: 'Claim tracking', body: 'Every claim has one number, one contact and one status.' },
  { icon: '/assets/media/12b7898bd7ddbbbbcacf68c0f47c7c51.svg', w: 40, title: 'Twelve-month warranty', body: 'Workmanship covered for a year, honored at any location.' },
];
const REPORT = [
  ['B0001', 'Driver frontal deployment loop', 'cleared'], ['B0012', 'Passenger frontal stage 1', 'cleared'], ['B0028', 'Left curtain deployment', 'cleared'],
  ['B0100', 'Crash event data', 'erased'], ['B1000', 'SRS control module', 'reset'], ['B0050', 'Driver pretensioner', 'rebuilt'], ['B0051', 'Passenger pretensioner', 'rebuilt'],
  ['—', 'Occupant classification sensor', 'calibrated'], ['—', 'Readiness', 'complete'],
];
const COLOR = { cleared: '#47d18c', erased: '#ff990a', reset: '#4da6ff', rebuilt: '#bf6afb', calibrated: '#4da6ff', complete: '#47d18c' };

/* huly.io "Sync with GitHub. Both ways.": dark #111 backdrop, framed stage, six features with blue glows. */
export default function Insurance() {
  return (
    <section className="sync-with-github relative z-20 overflow-hidden bg-[#111111] pb-[180px] pt-[131px] px-safe lg:pb-[131px] lg:pt-24 md:py-24 sm:py-16" id="insurance">
      <div className="container-narrow">
        <Reveal className="relative z-10">
          <h2 className="max-w-2xl font-title text-80 font-medium leading-[0.9] tracking-snugger text-white lg:text-72 md:max-w-md md:text-56 sm:max-w-96 sm:text-36">Works with your insurer. Both ways.</h2>
          <p className="mt-4 max-w-[580px] leading-snug tracking-tight text-grey-60">
            Every job closes with a readiness report the carrier accepts: what deployed, what was replaced, what was reset, and the result of the final scan.
          </p>
        </Reveal>
        <div>
          <div className="relative -z-10 mt-[108px] aspect-[1.732851] w-full rounded-xl lg:mt-20 lg:rounded-[10px] md:mt-12 md:rounded-lg sm:mt-10 sm:rounded">
            <span aria-hidden="true" className="absolute left-1/2 top-0 -z-10 h-full w-px" />
            <div className="pointer-events-none absolute left-[-255px] top-[-204px] aspect-[1.39393939] w-[1472px] bg-[#111111] lg:-left-60 lg:top-[-191px] lg:w-[1376px] md:left-[-26.705%] md:top-[-36.921%] md:w-[153.409%]" />
            <div className="relative aspect-[1.732851] w-full overflow-hidden rounded-xl bg-[#111111] ring-1 ring-white/10 lg:rounded-[10px] md:rounded-lg sm:rounded">
              <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" decoding="async" loading="lazy" src="/assets/img/pa-car.jpg" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,#111111_0%,#111111_46%,rgba(17,17,17,0.35)_100%)]" />
              <div className="absolute inset-0 flex flex-col p-8 lg:p-6 md:p-5 sm:p-3">
                <div className="flex items-center gap-x-2 text-12 font-medium uppercase tracking-snug text-grey-60 sm:text-9">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#47d18c] shadow-[0_0_8px_rgba(71,209,140,.8)]" />
                  readiness-report.txt · 2021 Ford F-150 · VIN ····6120
                </div>
                <pre className="mt-4 !h-auto flex-1 justify-start overflow-hidden font-mono text-14 leading-[1.7] text-[#f9fafa] lg:text-13 md:text-11 sm:mt-2 sm:text-[7px] sm:leading-[1.5]">
                  <code>
                    {REPORT.map(([code, label, st]) => (
                      <span key={label} className="line block whitespace-pre">
                        <span style={{ color: '#ff4d89' }}>{code.padEnd(6)}</span><span className="text-grey-80">{label.padEnd(32)}</span><span style={{ color: COLOR[st] }}>{st}</span>
                      </span>
                    ))}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
        <ul className="gird mt-40 grid grid-cols-3 gap-x-24 gap-y-20 lg:mt-[102px] lg:gap-x-[76px] lg:gap-y-14 md:mt-16 md:gap-x-16 md:gap-y-12 sm:mt-12 sm:grid-cols-1 sm:gap-y-8">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} as="li" delay={(i % 3) * 0.08} className="relative">
              <div className="realtive after:pointer-events-none after:absolute after:-left-2 after:-top-2 after:h-8 after:w-8 after:rounded-[50%] after:bg-[linear-gradient(180deg,#478BEB_60%,rgba(71,139,235,0)_100%)] after:opacity-60 after:mix-blend-plus-lighter after:blur-2xl after:lg:h-7 after:lg:w-7">
                <img alt="" className="h-10 w-auto md:h-9 sm:h-8" decoding="async" height="40" loading="lazy" src={f.icon} style={{ color: 'transparent' }} width={f.w} />
              </div>
              <h3 className="mt-5 font-title text-32 leading-none tracking-snugger text-white lg:text-28 md:mt-4 md:text-24 sm:mt-2.5 sm:max-w-full sm:text-20">{f.title}</h3>
              <p className="mt-3 text-15 font-light leading-snug tracking-snugger text-grey-60 md:mt-2 md:leading-tight sm:mt-1">{f.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
