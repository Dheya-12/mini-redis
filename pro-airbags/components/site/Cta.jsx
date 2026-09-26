'use client';
import { useState } from 'react';
import Reveal from './Reveal';
import { LightButton, DarkButton } from './Buttons';
import SiteFooter from './SiteFooter';

const INPUT = 'remove-autocomplete-styles relative block h-[42px] w-full appearance-none rounded border !bg-black px-3 py-[9px] text-15 tracking-snugger text-white placeholder-white/20 outline-none autofill:!text-white focus:ring-[rgba(209,208,255,0.5)] md:h-[41px] sm:text-16 border-white/10';
const LABEL = 'block text-14 leading-snug tracking-snugger text-grey-60';
const SERVICES = ['Airbag repair / replacement', 'SRS module reset', 'Seatbelt / pretensioner repair', 'Programming & coding', 'Full post-collision rebuild', 'Not sure — diagnose it'];

/* huly.io "Join the Movement" closing section with its illustration and light/dark buttons, followed by the sign-in form
   styling from huly.io's auth pages for the repair request. The footer sits at the bottom of this section, as on the original. */
export default function Cta() {
  const [done, setDone] = useState(false);
  return (
    <div className="relative">
      <section className="relative overflow-hidden bg-grey-1 pb-[294px] pt-[152px] px-safe lg:pb-[251px] lg:pt-[109px] md:pb-[190px] md:pt-[77px] sm:relative sm:pb-[235px] sm:pt-[266px]" id="start">
        <div className="container grid-gap relative grid grid-cols-2 sm:static sm:grid-cols-1">
          <div className="relative z-10 col-start-2 -ml-16 lg:ml-0 md:ml-2.5 sm:col-start-1 sm:ml-0 sm:flex sm:flex-col sm:items-center sm:text-center">
            <Reveal>
              <h2 className="max-w-[510px] bg-gradient-to-br from-white from-30% via-[#d5d8f6] via-80% to-[#fdf7fe] bg-clip-text font-title text-80 font-medium leading-h2 -tracking-[0.03em] text-transparent lg:text-80 md:max-w-80 md:text-56 sm:text-44">Start a repair</h2>
              <p className="relative z-10 mb-7 mt-2 leading-snug tracking-tight text-grey-90 lg:mb-5 md:mb-[18px]">
                Tell us what deployed. A technician calls back with a plan<br />and an honest estimate, usually within one business hour.
              </p>
            </Reveal>
            <div className="relative z-0 flex h-fit w-fit gap-[31px] md:flex-col md:gap-4">
              <div className="relative">
                <LightButton href="#request" className="w-[174px] !px-0" arrow={false}>Request a call</LightButton>
                <img alt="" className="pointer-events-none absolute left-[202px] top-0 h-10 w-[174px] will-change-transform md:hidden" height="40" loading="lazy" src="/assets/media/fde311dabe5488a415db9fcd19cf3001.svg" style={{ opacity: 1 }} width="174" />
              </div>
              <DarkButton href="tel:+13135550142" icon={<svg className="z-10" width="22" height="22" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6.6 2.5h3.2l1.7 4.2-2.1 1.5a12.6 12.6 0 0 0 6.4 6.4l1.5-2.1 4.2 1.7v3.2a2.1 2.1 0 0 1-2.3 2.1A17.3 17.3 0 0 1 4.5 4.8a2.1 2.1 0 0 1 2.1-2.3Z" fill="#44BEDF" /></svg>}>Call the shop</DarkButton>
            </div>
          </div>
          <img alt="" className="absolute -left-80 bottom-0 top-36 my-auto max-w-[1920px] lg:-left-[253px] lg:top-32 lg:max-w-[1630px] md:-left-[255px] md:top-[62px] md:max-w-[1430px] sm:hidden" decoding="async" height="689" loading="lazy" src="/assets/img/cta-illustration.8178f665.jpg" srcSet="/assets/img/cta-illustration.8178f665.jpg 2x" style={{ color: 'transparent' }} width="1920" />
          <img alt="" className="absolute left-1/2 top-0 hidden max-w-[767px] -translate-x-1/2 sm:block" decoding="async" height="560" loading="lazy" src="/assets/img/cta-illustration-mobile.621dcd29.jpg" srcSet="/assets/img/cta-illustration-mobile.621dcd29.jpg 2x" style={{ color: 'transparent' }} width="767" />
          <div className="pointer-events-none absolute -top-7 left-20 aspect-square w-[403px] overflow-hidden rounded-full lg:left-24 lg:top-0 lg:w-[332px] md:left-14 md:top-[3px] md:w-[284px] sm:left-[49%] sm:top-7 sm:w-52 sm:-translate-x-1/2" />
        </div>

        <div className="container relative z-10 mt-[120px] grid grid-cols-2 gap-x-16 lg:mt-24 md:mt-20 md:grid-cols-1 md:gap-y-12 sm:mt-16" id="request">
          <Reveal>
            <h3 className="mt-[17px] font-title text-36 font-semibold leading-none tracking-snugger text-white lg:text-32 md:text-28 xs:mt-3 xs:text-24">Request a repair</h3>
            <p className="mt-3 max-w-[420px] text-15 leading-snug tracking-snugger text-grey-60">No obligation. We never sell or share your information.</p>
            <ul className="mt-8 flex flex-col gap-y-3 text-15 leading-snug tracking-snugger text-grey-70">
              <li><span className="text-white">Shop</span> · Detroit, Michigan · metro pick-up and delivery for shop accounts</li>
              <li><span className="text-white">Call or text</span> · <a className="transition-colors duration-200 hover:text-white" href="tel:+13135550142">(313) 555-0142</a></li>
              <li><span className="text-white">Hours</span> · Mon – Fri 8:00 – 6:00 · Sat 9:00 – 2:00</li>
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            {done ? (
              <div className="rounded-[14px] border border-grey-10 bg-grey-5 p-8 text-white shadow-[0px_14px_20px_rgba(0,0,0,0.5)]" role="status">
                <h3 className="font-title text-28 font-semibold leading-none tracking-snugger">Request received</h3>
                <p className="mt-3 text-15 leading-snug tracking-snugger text-grey-60">Your request is in the queue. A technician will call back during business hours with a plan and estimate.</p>
              </div>
            ) : (
              <form className="mt-7 flex flex-col lg:mt-6 xs:mt-5" noValidate onSubmit={e => { e.preventDefault(); setDone(true); }}>
                <div className="grid grid-cols-2 gap-x-4 xs:grid-cols-1 xs:gap-y-3">
                  <div>
                    <label className={LABEL} htmlFor="f-name">Name</label>
                    <div className="relative mt-0.5 xs:mb-2"><input autoComplete="name" className={INPUT} id="f-name" name="name" placeholder="Your name" required type="text" /></div>
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="f-phone">Phone</label>
                    <div className="relative mt-0.5 xs:mb-2"><input autoComplete="tel" className={INPUT} id="f-phone" name="phone" placeholder="(313) 555-0100" required type="tel" /></div>
                  </div>
                </div>
                <label className={LABEL + ' mt-[18px] xs:mt-2'} htmlFor="f-vehicle">Vehicle (year, make, model)</label>
                <div className="relative mt-0.5 xs:mb-2"><input className={INPUT} id="f-vehicle" name="vehicle" placeholder="2021 Ford F-150" required type="text" /></div>
                <label className={LABEL + ' mt-[18px] xs:mt-2'} htmlFor="f-service">Service</label>
                <div className="relative mt-0.5 xs:mb-2">
                  <select className={INPUT + ' pr-9'} id="f-service" name="service" defaultValue={SERVICES[0]}>{SERVICES.map(s => <option key={s}>{s}</option>)}</select>
                  <img alt="" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" height="6" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAxMCA2Ij48cGF0aCBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMS40IiBkPSJtMSAxIDQgNCA0LTQiIG9wYWNpdHk9Ii42Ii8+PC9zdmc+" width="10" />
                </div>
                <label className={LABEL + ' mt-[18px] xs:mt-2'} htmlFor="f-msg">What happened</label>
                <div className="relative mt-0.5 xs:mb-2"><textarea className={INPUT + ' !h-[104px] resize-y py-2.5'} id="f-msg" name="message" placeholder="Front-end collision, driver and passenger bags deployed, both front belts locked. SRS light on." /></div>
                <div className="mt-[27px] h-11 xs:mt-4 xs:h-10 [&>div]:w-full [&_button]:w-full">
                  <LightButton type="submit" className="!h-11 w-full !px-16 !text-13 sm:!pl-[59px] sm:!pr-[52px] xs:!h-10" arrow={false}><span className="whitespace-nowrap text-14 uppercase leading-[42px] text-black">Send request</span></LightButton>
                </div>
                <div className="relative mt-[25px] flex items-center lg:mt-[23px] xs:mt-4">
                  <div className="h-px w-full bg-[linear-gradient(90deg,#443D59_0%,#2D2F31_50.9%)]" />
                  <span className="px-3.5 text-13 uppercase text-grey-40">Or</span>
                  <div className="h-px w-full bg-[linear-gradient(90deg,_#2D2F31_49.1%,_#2D2F31_100%)]" />
                </div>
                <div className="mt-[25px] grid grid-cols-2 gap-x-4 lg:mt-[22px] md:gap-x-2 xs:mt-4 xs:grid-cols-1 xs:gap-y-3">
                  <a className="transition-colors duration-200 transition-all duration-200 uppercase font-bold flex items-center justify-center h-10 px-16 text-12 text-white tracking-snugger rounded bg-grey-5 ring-1 ring-white/10 transition-all duration-200 hover:ring-white/15 mx-px gap-x-2 !px-2 !text-13" href="tel:+13135550142"><span className="font-medium !normal-case">Call (313) 555-0142</span></a>
                  <a className="transition-colors duration-200 transition-all duration-200 uppercase font-bold flex items-center justify-center h-10 px-16 text-12 text-white tracking-snugger rounded bg-grey-5 ring-1 ring-white/10 transition-all duration-200 hover:ring-white/15 mx-px gap-x-2 !px-2 !text-13" href="sms:+13135550142"><span className="font-medium !normal-case">Text the shop</span></a>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
