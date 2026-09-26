import Reveal from './Reveal';
import { SPRITES } from '@/components/pro-airbags-hero/generated/assets';

const REVIEWS = [
  { cat: 'Full rebuild', date: 'AUG 14, 2026', dt: '2026-08-14', title: 'Insurance called my Explorer a total loss. Pro Airbags rebuilt four bags and two belts in three days.', body: 'The adjuster wanted to write the car off over the restraint system. Pro Airbags quoted it for a fraction of that, rebuilt everything to OEM spec and the dash is clean. It passed inspection the same week and the readiness report closed the claim without a single question.', name: 'Marcus T.', car: '2019 Ford Explorer · Dearborn', img: '/assets/img/pa-car.jpg', icon: 'nav_airbags' },
  { cat: 'Module reset', date: 'JUL 02, 2026', dt: '2026-07-02', title: 'Mailed my SRS module Monday, plugged it back in Wednesday. Light gone.', body: 'I expected to wait a week. It came back reset, bench-tested and still coded to my car, so no dealer visit. The report they emailed listed every hard code that was cleared. Exactly what they said would happen, for exactly what they quoted.', name: 'Danielle R.', car: '2017 Honda Accord · Ann Arbor', img: '/assets/img/pa-module.jpg', icon: 'nav_module' },
  { cat: 'Seatbelt repair', date: 'MAY 21, 2026', dt: '2026-05-21', title: 'They rebuilt my original belts, so the trim still matches. Honest shop, real expertise.', body: 'Both front pretensioners locked after a minor bump. Instead of new belts in the wrong color they rebuilt mine with a new charge, checked the buckles and sensors, and walked me through the readiness report line by line before I paid.', name: 'Andre K.', car: '2020 Jeep Grand Cherokee · Troy', img: '/assets/img/pa-seatbelt.jpg', icon: 'nav_seatbelt' },
];

/* huly.io blog article layout: category and date, headline, author with avatar, excerpt and cover image. */
export default function Reviews() {
  return (
    <section className="relative bg-grey-1 px-safe" id="reviews">
      <div className="container-ultra-narrow pt-24 lg:max-w-5xl md:pt-16 sm:pt-12">
        <Reveal>
          <h2 className="font-title text-56 font-medium leading-[0.9] tracking-snugger text-white lg:text-48 md:text-40 sm:text-32">Hundreds of drivers back on the road</h2>
          <p className="mt-4 max-w-[580px] leading-snug tracking-tight text-grey-60">Trusted in Detroit by owners, adjusters and body shops.</p>
        </Reveal>
      </div>
      <div className="container-ultra-narrow order-3 mb-16 mt-12 grid gap-x-8 gap-y-[66px] lg:max-w-5xl md:mb-14 md:gap-y-14 sm:mb-10 sm:mt-10 sm:gap-y-11">
        {REVIEWS.map((r, i) => (
          <Reveal key={r.name} as="article" delay={0.05} className="flex flex-wrap justify-between sm:gap-y-0">
            <div className="flex items-center gap-1 w-full sm:order-2 sm:mt-4">
              <a className="transition-colors duration-200 text-blue font-medium text-14 font-medium leading-none tracking-snugger text-orange" href="#pricing">{r.cat}</a>
              <div aria-hidden="true" className="mx-1 h-[3px] w-[3px] shrink-0 rounded-full bg-grey-30" />
              <time className="whitespace-nowrap text-14 leading-none tracking-snugger text-grey-50" dateTime={r.dt}>{r.date}</time>
            </div>
            <a className="transition-colors duration-200 mt-4 w-full max-w-[608px] md:max-w-[calc(65%-16px)] sm:order-3 sm:mt-2.5 sm:w-full sm:max-w-none" href="#start">
              <h3 className="text-balance font-medium leading-tight tracking-tight text-white text-32 md:text-24 md:leading-snug sm:text-20">{r.title}</h3>
            </a>
            <div className="flex gap-x-4 w-full max-w-64 justify-end self-end md:max-w-[210px] sm:order-5 sm:mt-2.5 sm:justify-start">
              <div className="flex items-center gap-x-2 sm:gap-x-[5px]">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-grey-10 ring-1 ring-white/10 sm:h-5 sm:w-5"><img alt="" className="h-4 w-4 object-contain" decoding="async" src={SPRITES[r.icon].uri} /></span>
                <span className="text-14 font-medium leading-none tracking-snugger text-white sm:text-13">{r.name}</span>
              </div>
            </div>
            <div className="mt-2.5 w-full max-w-md pr-8 lg:pr-0 md:max-w-[calc(50%-16px)] sm:order-4 sm:mt-1.5 sm:w-full sm:max-w-none">
              <p className="line-clamp-6 text-18 font-light tracking-snugger text-grey-70 md:text-16 md:leading-snug">{r.body}</p>
              <span className="mt-3 block text-13 text-grey-50">{r.car}</span>
              <a className="transition-colors duration-200 leading-none inline-flex items-center text-14 text-blue font-medium mt-4 hover:text-white md:text-13 sm:hidden" href="#start">
                Start a repair
                <svg className="ml-1.5 h-[11px] w-1.5 shrink-0 rotate-180 text-inherit transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 6 9" xmlns="http://www.w3.org/2000/svg"><path d="m5 8.5-4-4 4-4" stroke="currentColor" strokeWidth="1.2" /></svg>
              </a>
            </div>
            <a className="transition-colors duration-200 mt-2.5 w-1/2 md:w-[calc(50%-16px)] sm:order-1 sm:mt-0 sm:w-full" href="#start">
              <img alt="" className="aspect-video w-full rounded-lg object-cover" decoding="async" loading="lazy" src={r.img} />
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
