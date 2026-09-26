import Reveal from './Reveal';

/* huly.io "Unmatched productivity": four ring cards on the light backdrop with the blurred colour blobs. One image and one message per card. */
const CARDS = [
  { id: 'airbags', img: '/assets/img/pa-wheel.jpg', title: 'Airbags.', body: 'Driver, passenger, knee, seat and curtain units replaced to OEM spec.', wide: false, order: 'order-1' },
  { id: 'module', img: '/assets/img/pa-module.jpg', title: 'Module reset.', body: 'Crash data and hard codes cleared on your original SRS module.', wide: true, order: 'order-2' },
  { id: 'programming', img: '/assets/img/pa-screen.jpg', title: 'Programming.', body: 'Modules and occupant sensors coded and calibrated to the VIN.', wide: false, order: 'order-4' },
  { id: 'seatbelt', img: '/assets/img/pa-belt.jpg', title: 'Seatbelt repair.', body: 'Pretensioners rebuilt on your own belts, so the trim still matches.', wide: true, order: 'order-3' },
];

export default function Productivity() {
  return (
    <div className="overflow-hidden bg-[#f6f6f6]">
      <section className="stay-productive relative z-10 pt-40 lg:pt-32 md:pt-24 sm:pt-16" id="services-detail">
        <div className="container relative z-10 lg:max-w-[960px] md:max-w-3xl xs:max-w-md">
          <Reveal>
            <h2 className="font-title text-80 font-semibold leading-h2 tracking-tighter text-black lg:text-88 md:text-64 sm:text-36">Unmatched restraint repair</h2>
            <p className="mt-6 max-w-[705px] text-18 leading-tight tracking-tight lg:mt-5 sm:mt-3 sm:max-w-lg sm:text-15">
              Pro Airbags rebuilds the whole supplemental restraint system in one bay, from the bag in the wheel to the module under the seat, for owners, adjusters and body shops alike.
            </p>
          </Reveal>
          <ul className="mt-10 flex flex-wrap gap-5 lg:mt-9 lg:gap-4 md:mt-6 sm:mt-5 sm:grid sm:grid-cols-2 xs:grid-cols-1">
            {CARDS.map((c, i) => (
              <Reveal key={c.id} as="li" id={c.id} delay={i * 0.08} className={'relative grid h-[420px] grid-cols-1 grid-rows-1 overflow-hidden rounded-xl bg-grey-2 bg-clip-padding ring-[6px] ring-white/40 lg:h-[300px] md:h-[260px] sm:w-full scroll-mt-24 ' + c.order + (c.wide ? ' w-[768px] lg:w-[572px] md:w-[436px]' : ' w-[428px] lg:w-[308px] md:w-[252px]')}>
                <div className="absolute bottom-0 z-10 col-span-full flex w-full items-end px-6 pb-6 lg:px-5 lg:pb-5 md:px-4 md:pb-4 sm:px-5 sm:pb-5 md:after:absolute md:after:bottom-0 md:after:left-0 md:after:z-0 md:after:h-[180%] md:after:w-full md:after:bg-[linear-gradient(180deg,rgba(9,10,12,0)_0%,#090A0C_40.76%)] md:after:blur-md">
                  <p className={'relative z-10 font-light leading-snug tracking-snugger text-white/65 md:leading-[1.2] sm:text-15' + (c.wide ? ' max-w-[436px] md:max-w-[344px]' : '')}>
                    <span className="font-medium text-white">{c.title}</span> {c.body}
                  </p>
                </div>
                <div className="relative col-span-full row-span-full">
                  <span aria-hidden="true" className="absolute left-1/2 top-0 -z-10 h-full w-px" />
                  <img alt="" className="absolute inset-0 h-full w-full object-cover" decoding="async" loading="lazy" src={c.img} />
                  <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(180deg,rgba(12,12,13,0)_0%,#0C0C0D_78%)]" />
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[115px] z-0 h-[1245px] w-[1656px] -translate-x-1/2 lg:top-[134px] lg:h-[872px] lg:w-[1160px] md:top-24 md:h-[772px] md:w-[974px] sm:hidden">
          <div className="absolute bottom-0 right-[9%] h-[30.8%] w-[57.4%] scale-[0.5,0.6] rounded-[50%] bg-[radial-gradient(circle,rgba(210,208,208,0.6)_0%,transparent_100%)] opacity-50 blur-3xl" />
          <div className="absolute right-[3.5%] top-[7.5%] h-[42.5%] w-[31%] rounded-[50%] bg-[linear-gradient(-30deg,rgba(237,230,222,0)_33.3%,#DBE2F0_48.28%)] opacity-35 blur-3xl" />
          <div className="absolute right-[35.1%] top-0 h-[42.5%] w-[31%] rounded-[50%] bg-[linear-gradient(-30deg,rgba(246,242,238,0)_33.3%,#EDF1F7_54.49%)] opacity-35 blur-3xl" />
          <div className="absolute bottom-[2%] right-0 h-[54.6%] w-[39%] scale-90 rounded-[50%] bg-[linear-gradient(180deg,#F8E6DD_17.05%,rgba(248,230,221,0)_66.61%)] opacity-55 blur-3xl" />
          <div className="absolute bottom-[7%] left-0 h-[80.3%] w-[36.2%] scale-[1.35,1.15] rounded-[50%] bg-[linear-gradient(180deg,#F8E6DD_15%,#CBD3EB_83.5%)] opacity-60 blur-3xl" />
        </div>
      </section>
      <WorkTogether />
    </div>
  );
}

const STEPS = [
  { icon: '/assets/img/customize.03200dd0.png', title: 'Diagnose', body: 'A full SRS scan with dealer-level tools before anything is quoted.' },
  { icon: '/assets/img/video.e4ea1f4b.png', title: 'Repair and reset', body: 'Parts replaced or rebuilt, crash data erased, module back online.' },
  { icon: '/assets/img/invite.043fb941.png', title: 'Road test', body: 'The car goes out with the light off and comes back with it still off.' },
];
const BTN = 'flex aspect-square h-11 items-center justify-center rounded-full shadow-[0px_4px_16px_0px_#00000059] md:h-[29px] xs:h-4';

/* huly.io "Work together. Like in the office.": the framed video stage with its overlay chrome, then three icon columns. */
function WorkTogether() {
  return (
    <section className="work-together py-60 px-safe lg:py-32 md:py-24 sm:pb-[68px] sm:pt-20" id="process">
      <div className="container max-w-[1344px] lg:max-w-[960px] md:max-w-3xl md:px-0 sm:px-5">
        <div className="pl-80 pr-16 lg:px-0 md:pl-24 md:pr-9 sm:px-0">
          <Reveal>
            <h2 className="relative z-10 max-w-[550px] font-title text-80 font-semibold leading-[0.9] tracking-tighter text-black lg:text-72 md:max-w-[430px] md:text-56 sm:max-w-[250px] sm:text-36">Done in the bay. Like at the dealer.</h2>
            <p className="relative z-10 mt-3.5 max-w-[544px] text-18 leading-tight tracking-tight lg:mt-2.5 md:max-w-[450px] md:text-16 sm:mt-3">
              Factory tooling, OEM-spec parts and a technician who does nothing but restraint systems. Most cars are back on the road within two working days.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative z-0 mt-[60px] aspect-video h-[486px] lg:h-[432px] md:ml-2 md:mt-12 md:h-[316px] sm:mx-[5px] sm:mt-6 sm:h-auto sm:w-[calc(100%-10px)]">
              <div className="absolute left-[-69.792%] top-[-69.136%] aspect-[1.62025] w-[222.222%] max-w-none" />
              <img alt="" className="relative h-full w-full rounded-[10px] object-cover lg:rounded-lg md:rounded-[7px] sm:rounded" decoding="async" loading="lazy" src="/assets/img/pa-garage.jpg" />
              <div className="pointer-events-none absolute inset-0 rounded-[10px] text-white lg:rounded-lg md:rounded-[7px] sm:rounded">
                <div className="absolute left-5 top-5 flex flex-col lg:left-4 lg:top-4 md:left-[13px] md:top-[13px]">
                  <span className="text-18 font-medium leading-snug tracking-snugger opacity-90 lg:text-16 md:text-12">Bay 2 · SRS rebuild</span>
                  <span className="mt-0.5 flex items-center gap-x-1.5 text-12 font-medium leading-snug tracking-snugger opacity-60 lg:text-10 md:mt-0 md:text-8">
                    <img alt="" className="lg:h-auto lg:w-[13px] md:w-[9px]" decoding="async" height="14" loading="lazy" src="/assets/media/6cad5c6f35277cc12565a6826b9940bf.svg" style={{ color: 'transparent' }} width="14" />
                    2 technicians
                  </span>
                </div>
                {[['Front bags', true], ['Curtains', false], ['Belts', true]].map(([name, blue], i) => (
                  <div key={name} className="absolute h-[20.782%] w-[20.833%] right-[1.157%]" style={{ top: ['2.058%', '25.309%', '48.559%'][i] }}>
                    <div className={'absolute right-[3.333%] top-[5.94%] flex h-[19.802%] w-[11.111%] items-center justify-center rounded-full shadow-[0px_4px_6px_0px_#00000026] ' + (blue ? 'bg-[#3d7eff]' : 'bg-[#0b0d1033]')}>
                      <img alt="" className="h-1/2 w-1/2" decoding="async" height="10" loading="lazy" src={blue ? '/assets/media/93e08622f4a0bbef839d81e681f8bba7.svg' : '/assets/media/0e5b98ef7d38250f3aee6888407436e3.svg'} style={{ color: 'transparent' }} width="10" />
                    </div>
                    <span className="absolute bottom-[5.94%] left-[3.333%] flex items-center gap-x-1 text-10 font-medium leading-snug tracking-snugger opacity-80 lg:text-9 md:gap-x-0.5 md:text-[7px] sm:text-[4px]">
                      <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#5dff9b] shadow-[0_0_6px_rgba(93,255,155,.8)] md:h-[5px] md:w-[5px] sm:h-[3px] sm:w-[3px]" />
                      {name}
                    </span>
                  </div>
                ))}
                <div className="absolute inset-x-0 bottom-5 flex justify-center gap-x-3.5 lg:bottom-4.5 lg:gap-x-3 md:bottom-3 md:gap-x-[9px] sm:bottom-2 sm:gap-x-[5px]">
                  <div className={BTN + ' bg-[#68686a]'}><img alt="" className="h-auto md:w-3 xs:w-[7px]" decoding="async" height="20" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyMiAyMiI+PHBhdGggc3Ryb2tlPSIjZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS40IiBkPSJNMTUuMzc1IDIwLjM3NWgtOC43NU0xMS42MjUgMS42MjVoOC43NXYxNUgxLjYyNXYtNU0xLjYyNSA3Ljg3NXYtNi4yNWg2LjI1TTcuODc1IDcuODc1bC02LjI1LTYuMjUiLz48L3N2Zz4=" style={{ color: 'transparent' }} width="20" /></div>
                  <div className={BTN + ' bg-[#68686a]'}><img alt="" className="h-auto md:w-3 xs:w-[7px]" decoding="async" height="20" loading="lazy" src="/assets/media/0e5b98ef7d38250f3aee6888407436e3.svg" style={{ color: 'transparent' }} width="20" /></div>
                  <div className={BTN + ' bg-[#ff4d4d]'}><img alt="" className="h-auto md:w-3 xs:w-[7px]" decoding="async" height="18" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggc3Ryb2tlPSIjZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTE0LjM2NCAxLjM2NCA4IDcuNzI4bTAgMC02LjM2NCA2LjM2NE04IDcuNzI4IDEuNjM2IDEuMzY0TTggNy43MjhsNi4zNjQgNi4zNjQiLz48L3N2Zz4=" style={{ color: 'transparent' }} width="18" /></div>
                  <div className={BTN + ' bg-[#68686a]'}><img alt="" className="h-auto md:w-3.5 xs:w-2.5" decoding="async" height="22" loading="lazy" src="/assets/media/3ec2b3159fe89423fa1464d20ffea3b0.svg" style={{ color: 'transparent' }} width="22" /></div>
                  <div className={BTN + ' bg-[#68686a]'}><img alt="" className="h-auto md:w-3 xs:w-[7px]" decoding="async" height="20" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyMCAyMCI+PHBhdGggc3Ryb2tlPSIjZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS40IiBkPSJtMTguMTI1IDEuODc1LTYuMjUgNi4yNU04LjEyNSAxMS44NzVsLTYuMjUgNi4yNU0xMC42MjUgMS44NzVoNy41djcuNU0xLjg3NSAxMC42MjV2Ny41aDcuNSIvPjwvc3ZnPg==" style={{ color: 'transparent' }} width="20" /></div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <p className="relative z-10 mt-[66px] max-w-2xl text-24 font-medium leading-snug tracking-snugger lg:mt-[60px] lg:max-w-[544px] lg:text-20 md:mt-[72px] sm:mt-7 sm:text-18">
              A deployed airbag does not have to mean a totaled car. Bring it in, mail the module, or have us collect it from the body shop.
            </p>
          </Reveal>
          <ul className="relative z-10 mt-10 grid grid-cols-3 gap-16 lg:mt-9 md:gap-8 sm:mt-8 sm:grid-cols-1 sm:gap-y-7">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} as="li" delay={i * 0.1}>
                <img alt={s.title} className="md:h-9 md:w-9 sm:h-8 sm:w-8" decoding="async" height="40" loading="lazy" src={s.icon} srcSet={s.icon + ' 2x'} style={{ color: 'transparent' }} width="40" />
                <h3 className="mt-5 max-w-32 font-title text-28 leading-none tracking-snugger lg:mt-4 lg:max-w-28 lg:text-24 md:mt-3.5 sm:mt-2.5 sm:max-w-full sm:text-20">{s.title}</h3>
                <p className="mt-3.5 max-w-[204px] text-15 font-light leading-snug tracking-snugger lg:mt-2.5 md:mt-2 md:leading-tight sm:mt-1 sm:max-w-none">{s.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
