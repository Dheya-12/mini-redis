import Reveal from './Reveal';

const TILE = 'relative rounded-[30px] outline outline-white/60 md:rounded-3xl sm:m-0 sm:aspect-[1.45] sm:h-auto sm:w-full sm:overflow-hidden sm:rounded-[20px] sm:outline-4 xs:aspect-[1.65]';
const CAP = 'absolute inset-0 bottom-auto z-10 px-6 py-[19px] text-15 font-light leading-tight text-white/65 xl:py-[21px] md:p-4 md:text-14 sm:p-5 sm:text-15';
const MOBILE = 'pointer-events-none absolute left-1/2 top-1/2 hidden min-w-full -translate-x-1/2 -translate-y-1/2 rounded-[20px] sm:block';

/* huly.io "Huly MetaBrain": the bento of outlined tiles with Huly's own tile art, markup and class strings verbatim. */
export default function Bento() {
  return (
    <div className="bg-[#f6f6f6]">
      <section className="source-of-truth relative overflow-hidden pb-[180px] pt-[247px] xl:py-32 md:pb-24 md:pt-[100px] sm:pb-[72px] sm:pt-16" id="specialties">
        <div className="container-wide relative z-10 xl:max-w-[864px] md:max-w-3xl xs:max-w-md">
          <Reveal>
            <h2 className="ml-64 font-title text-80 font-semibold leading-h2 tracking-tighter text-black xl:ml-64 xl:max-w-[450px] xl:text-80 xl:leading-none md:ml-56 md:max-w-none md:text-54 sm:ml-0 sm:text-36">Pro Airbags Workbench</h2>
            <p className="ml-64 mt-5 max-w-[640px] text-18 leading-tight tracking-tight text-grey-30 xl:ml-64 xl:mt-3 md:ml-56 md:mt-3 sm:ml-0 sm:mt-2 sm:text-16">
              Every job lives in one place: the booking, the scan, the parts, the technician’s notes and the sign-off. Owners and shops follow along from their phone.
            </p>
          </Reveal>
          <div className="mt-14 flex w-full gap-4.5 xl:mt-12 xl:flex-col xl:gap-3.5 md:mt-10 sm:mt-6 sm:gap-3">
            <ul className="flex w-[808px] flex-wrap items-center gap-4.5 xl:w-full xl:justify-between xl:gap-3.5 md:gap-4 sm:grid sm:grid-cols-2 sm:gap-3 xs:grid-cols-1">
              <li id="airbag-replacement" className={TILE + ' ml-64 h-[250px] w-[270px] rounded-none outline-0 md:ml-56 md:h-[218px] md:w-[234px]'}>
                <p className={CAP + ' sm:max-w-[240px]'}><strong className="font-medium text-white">Book a job.</strong> Pick the service and a drop-off slot.</p>
                <img alt="" className="pointer-events-none rounded-[30px] md:rounded-3xl sm:hidden absolute -right-1 -top-1 h-[508px] w-[534px] rounded-none max-w-max md:h-[444px] md:w-[466px]" decoding="async" height="508" loading="lazy" src="/assets/img/tasks-notes.69743ddd.png" srcSet="/assets/img/tasks-notes.69743ddd.png 2x" style={{ color: 'transparent' }} width="534" />
                <img alt="" className={MOBILE} decoding="async" height="220" loading="lazy" src="/assets/img/tasks-mobile.abb306cb.jpg" srcSet="/assets/img/tasks-mobile.abb306cb.jpg 2x" style={{ color: 'transparent' }} width="320" />
              </li>
              <li id="clock-spring-repair" className={TILE + ' outline-4 xl:h-[250px] xl:w-[250px] md:h-[218px] md:w-[230px]'}>
                <p className={CAP + ' xl:pr-[21px] sm:max-w-[260px]'}><strong className="font-medium text-white">Plan the bay.</strong> See when your car is on the lift.</p>
                <img alt="" className="pointer-events-none rounded-[30px] md:rounded-3xl sm:hidden xl:h-full xl:w-full xl:object-cover xl:object-left" decoding="async" height="250" loading="lazy" src="/assets/img/plan-work.26bcf442.jpg" srcSet="/assets/img/plan-work.26bcf442.jpg 2x" style={{ color: 'transparent' }} width="264" />
                <img alt="" className={MOBILE} decoding="async" height="220" loading="lazy" src="/assets/img/plan-work-mobile.d9e8f583.jpg" srcSet="/assets/img/plan-work-mobile.d9e8f583.jpg 2x" style={{ color: 'transparent' }} width="320" />
              </li>
              <li id="seat-and-curtain-airbags" className={TILE + ' h-[232px] w-[270px] rounded-none outline-0 md:h-[202px] md:w-[234px]'}>
                <p className={CAP + ' pt-0 -top-0.5 after:relative after:left-[6px] after:-mt-1 after:top-[5px] after:inline-block after:h-4.5 after:w-px after:bg-[#D1D4FA] after:opacity-80 xl:pt-1.5 xl:after:top-1.5 md:max-w-[195px] md:pt-4 md:pl-5 md:top-[-17px] md:left-[-3px] md:pr-0 md:after:h-4 md:after:top-1 sm:max-w-[280px] sm:top-[-7px]'}>
                  <img alt="" className="mb-[7px] md:mb-1.5 md:h-auto md:w-3 sm:w-3.5" decoding="async" height="14" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAxNCAxNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTExLjM3NS4yMTlINS4xM2MtMS44ODQgMC0zLjUwNiAxLjQ0OC0zLjU5NSAzLjMzYTMuNSAzLjUgMCAwIDAgMy40OTYgMy42N2guNDM4djYuMzQ0YS4yMi4yMiAwIDAgMCAuMjE5LjIxOGguNDM3YS4yMi4yMiAwIDAgMCAuMjE5LS4yMTlWMS4wOTVoMi42MjV2MTIuNDY5YS4yMi4yMiAwIDAgMCAuMjE5LjIxOGguNDM3YS4yMi4yMiAwIDAgMCAuMjE5LS4yMTlWMS4wOTVoMS41MzFhLjIyLjIyIDAgMCAwIC4yMTktLjIxOVYuNDM4YS4yMi4yMiAwIDAgMC0uMjE5LS4yMiIvPjwvc3ZnPg==" style={{ color: 'transparent' }} width="14" />
                  <strong className="font-medium text-white">Tech notes.</strong><br className="sm:hidden" /> What was found, in plain words
                </p>
                <img alt="" className={MOBILE} decoding="async" height="220" loading="lazy" src="/assets/img/notes-mobile.2bf5fcba.jpg" srcSet="/assets/img/notes-mobile.2bf5fcba.jpg 2x" style={{ color: 'transparent' }} width="320" />
              </li>
              <li id="pretensioner-rebuild" className={TILE + ' outline-4 xl:w-[515px] md:w-[453px]'}>
                <p className={CAP + ' max-w-[425px] xl:px-5 sm:max-w-[290px]'}><strong className="font-medium text-white">Live status.</strong> Owner, adjuster and shop watch the same job move from scan to sign-off.</p>
                <img alt="" className="pointer-events-none rounded-[30px] md:rounded-3xl sm:hidden xl:h-full xl:w-full xl:object-cover" decoding="async" height="232" loading="lazy" src="/assets/img/teammates.c5a8e1bf.jpg" srcSet="/assets/img/teammates.c5a8e1bf.jpg 2x" style={{ color: 'transparent' }} width="520" />
                <img alt="" className={MOBILE + ' xs:top-[47.5%]'} decoding="async" height="220" loading="lazy" src="/assets/img/teammates-mobile.8dc948be.jpg" srcSet="/assets/img/teammates-mobile.8dc948be.jpg 2x" style={{ color: 'transparent' }} width="320" />
              </li>
            </ul>
            <ul className="flex flex-1 flex-wrap items-center gap-4.5 xl:flex-nowrap xl:items-end sm:grid sm:grid-cols-2 sm:gap-3 xs:grid-cols-1">
              <li id="webbing-replacement" className={TILE + ' h-[236px] w-[236px] rounded-none outline-0 xl:h-[250px] xl:w-[270px] xl:p-2 md:h-[218px] md:w-[235px] sm:hidden'}>
                <img alt="" className="pointer-events-none rounded-[30px] md:rounded-3xl sm:hidden -m-1 h-[244px] w-[244px] max-w-max rounded-none xl:mx-auto md:h-[218px] md:w-[235px]" decoding="async" height="244" loading="lazy" src="/assets/img/calendar.74569b09.png" srcSet="/assets/img/calendar.74569b09.png 2x" style={{ color: 'transparent' }} width="244" />
              </li>
              <li id="buckle-and-sensor-repair" className={TILE + ' outline-4 xl:h-[250px] xl:w-[250px] md:h-[218px] md:w-[218px]'}>
                <p className={CAP + ' sm:max-w-60'}><strong className="font-medium text-white">Message the tech.</strong> Ask about the job, get a straight answer.</p>
                <img alt="" className="pointer-events-none rounded-[30px] md:rounded-3xl sm:hidden xl:h-full xl:w-full xl:object-cover xl:object-left" decoding="async" height="250" loading="lazy" src="/assets/img/collab.aa5fcd89.jpg" srcSet="/assets/img/collab.aa5fcd89.jpg 2x" style={{ color: 'transparent' }} width="264" />
                <img alt="" className={MOBILE + ' xs:top-[47.5%]'} decoding="async" height="220" loading="lazy" src="/assets/img/collab-mobile.a7137137.jpg" srcSet="/assets/img/collab-mobile.a7137137.jpg 2x" style={{ color: 'transparent' }} width="320" />
              </li>
              <li id="retractor-repair" className={TILE + ' h-[232px] w-[422px] outline-4 xl:h-[250px] xl:w-[250px] md:h-[218px] md:w-[218px]'}>
                <p className={CAP + ' max-w-[85%] xl:max-w-full xl:pr-[5px] md:pr-[9px] sm:max-w-[260px]'}><strong className="font-medium text-white">Fleet view.</strong> Shops see every car they have with us at once.</p>
                <img alt="" className="pointer-events-none rounded-[30px] md:rounded-3xl sm:hidden h-full w-full object-cover" decoding="async" height="250" loading="lazy" src="/assets/img/pm.57044e5b.jpg" srcSet="/assets/img/pm.57044e5b.jpg 2x" style={{ color: 'transparent' }} width="422" />
                <img alt="" className={MOBILE + ' xs:top-[55%]'} decoding="async" height="220" loading="lazy" src="/assets/img/pm-mobile.39d0b377.jpg" srcSet="/assets/img/pm-mobile.39d0b377.jpg 2x" style={{ color: 'transparent' }} width="320" />
              </li>
            </ul>
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-[51px] h-[1061px] w-full max-w-[1600px] -translate-x-1/2 xl:bottom-0 xl:top-auto xl:h-[930px] sm:hidden">
          <img alt="" className="absolute left-[2%] top-[20%] w-[32%]" height="466" loading="lazy" src="/assets/media/9d5c77b6877e0fb053b9e6a6c6e031fe.svg" width="512" />
          <img alt="" className="absolute bottom-[5%] right-[-6%] w-[48%]" height="699" loading="lazy" src="/assets/media/4471f334ae899aaa11c9921e0d3e65bc.svg" width="768" />
          <img alt="" className="absolute bottom-[0%] left-[-12%] w-[47%]" height="689" loading="lazy" src="/assets/media/97e21ae98ab58474a251361eee0aa8c0.svg" width="752" />
        </div>
      </section>
      <Knowledge />
      <div className="relative z-0">
        <div className="container-wide relative">
          <img alt="" className="pointer-events-none absolute -bottom-[247px] -left-[153px] -z-10 xl:-left-[80px] lg:-bottom-[230px] lg:-left-[135px] md:-bottom-[280px] md:-left-[128px] md:max-w-[480px] sm:hidden" decoding="async" height="3167" loading="lazy" src="/assets/img/lines-bg.dffccec4.png" srcSet="/assets/img/lines-bg.dffccec4.png 2x" style={{ color: 'transparent' }} width="595" />
        </div>
      </div>
    </div>
  );
}

const TOOL = 'transition-all duration-200 ml-1 md:ml-0.5';
const TSVG = 'h-7 w-7 transition-colors hover:fill-white md:h-[21px] md:w-[21px] fill-grey-60';
const CURSOR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAxMCAzNiI+PHBhdGggZmlsbD0iIzMwMzIzNiIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNNCAyNi4xQTUuMDAyIDUuMDAyIDAgMCAwIDUgMzZhNSA1IDAgMCAwIDEtOS45VjBINHoiIGNsaXAtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==';
const SENTENCE = <><span className="font-semibold">Guides from the bench</span> explain what an SRS light means, why a deployed module stores hard codes, and what an adjuster needs to see before a claim can close.</>;

function Pin({ color, img, line, className }) {
  return (
    <span aria-hidden="true" className={'absolute z-40 flex flex-col items-center hover:cursor-grab active:cursor-grabbing group ' + className} draggable="false" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}>
      <img alt="" className={'pointer-events-none z-10 max-w-none rounded-full border-2 shadow-[0px_6px_25px_0px_#00000080] transition-all duration-200 group-active:translate-y-[-15px] group-active:scale-[1.05] group-active:shadow-[0px_14px_30px_0px_#00000080] md:max-w-[45px] sm:max-w-[36px] ' + (color === 'blue' ? 'border-blue' : 'border-orange')} decoding="async" height="66" loading="lazy" src={img} srcSet={img + ' 2x'} style={{ color: 'transparent' }} width="66" />
      <span className="flex flex-col items-center transition-transform duration-200 group-active:-translate-y-[25px]">
        <span className={line + ' w-0.5 md:w-px ' + (color === 'blue' ? 'bg-blue' : 'bg-orange')} />
        <span className={'-mt-px h-2.5 w-2.5 rounded-full md:h-[7px] md:w-[7px] ' + (color === 'blue' ? 'bg-blue' : 'bg-orange')} />
      </span>
    </span>
  );
}

/* huly.io "Knowledge at Your Fingertips": the document-editor demo with Huly's billboard image, document art and pins. */
function Knowledge() {
  return (
    <section className="knowledge relative mt-[50px] pb-[247px] px-safe lg:mt-0.5 lg:pb-[102px] md:pb-[94px] sm:pb-[72px]" id="knowledge">
      <div className="container-wide relative grid grid-cols-[264px_1fr] gap-x-[181px] xl:grid-cols-[337px_1fr] xl:gap-x-[108px] lg:grid-cols-[256px_1fr] lg:gap-x-16 md:grid-cols-[177px_1fr] md:gap-x-[37px] sm:grid-cols-1">
        <div className="relative pl-3 pr-[180px] text-22 leading-snug tracking-tight lg:max-w-2xl lg:pr-0 lg:text-20 md:max-w-none md:text-15 sm:px-0 sm:text-14">
          <Reveal className="doc-demo" threshold={0.15}>
            <h2 className="relative mt-[-40px] max-w-xl pt-[40px] font-title text-80 font-semibold leading-none tracking-tighter text-black lg:text-80 md:mt-[-30px] md:pt-[30px] md:text-54 sm:text-36 2xs:max-w-[268px]">
              <span aria-hidden="true" className="absolute left-1/2 top-0 -z-10 h-full w-px" />
              Knowledge at{' '}<br />
              <span className="relative">
                <span className="invisible">Your Fingertips</span>
                <span aria-hidden="true" className="absolute left-0 top-7 lg:top-5 sm:top-2.5">
                  <span />
                  <Pin color="blue" img="/assets/img/blue-pin-image.bb230dcd.jpg" line="h-[46px] md:h-[34px] sm:h-[26px]" className="right-[-38px] top-[-38px] text-blue lg:-right-10 lg:-top-10 md:-right-7 md:-top-8 sm:right-[-22px]" />
                </span>
              </span>
            </h2>
            <p className="mt-10 lg:mt-9 md:mt-4 sm:mt-3">
              The Pro Airbags knowledge base is written by the technicians who do the work, for the people who have to decide what to do with a car after a crash.
            </p>
            <div className="relative mt-[26px] lg:mt-[23px] md:mt-[20px] sm:mt-[22px]">
              <div className="doc-anim doc-toolbar absolute -left-4 -top-10 right-0 z-50 mx-auto flex h-10 w-fit min-w-[290px] items-center rounded-md bg-grey-20 px-2.5 shadow-[0px_10px_20px_0px_#00000080] lg:-top-10 lg:left-11 md:-top-8 md:left-7 md:h-[30px] md:min-w-[218px] md:px-2 sm:-top-6 sm:left-0 sm:h-[27px] sm:min-w-[190px]" style={{ opacity: 0, transform: 'translateY(14px) translateZ(0)' }}>
                <button className="transition-all duration-200 flex h-6 cursor-default items-center rounded bg-blue pl-2 pr-2.5 text-14 tracking-snugger text-white md:h-[19px] md:px-1 md:text-11 sm:text-10" type="button">
                  <svg className="mr-1.5 h-3 w-3 stroke-white" fill="none" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M6 1v10M1 6h10" /></svg> Link
                </button>
                <span aria-hidden="true" className="ml-3 h-full w-px bg-grey-30 md:ml-2.5 sm:ml-2" />
                <button className={TOOL} type="button"><svg className={TSVG} fill="none" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><path d="M9.197 19.5V7.621h4.756q1.31 0 2.186.389t1.317 1.079q.44.684.44 1.577 0 .696-.278 1.224-.277.522-.765.859-.482.33-1.102.47v.115q.678.03 1.27.383.597.354.969.992.37.633.37 1.508 0 .945-.469 1.688-.465.737-1.375 1.166t-2.244.429zm2.511-2.053h2.047q1.05 0 1.532-.4.48-.406.481-1.08 0-.492-.238-.87a1.6 1.6 0 0 0-.678-.591q-.435-.215-1.039-.215h-2.105zm0-4.855h1.862q.517 0 .916-.18.406-.186.638-.522.238-.336.238-.806 0-.644-.458-1.038-.452-.395-1.288-.395h-1.908z" /></svg><span className="sr-only">Bold</span></button>
                <button className={TOOL + ' sm:ml-0'} type="button"><svg className={TSVG} fill="none" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><path d="M21 8.556V7H10.889v1.556h3.998l-3.4 10.888H7V21h10.111v-1.556h-3.998l3.4-10.888z" /></svg><span className="sr-only">Italic</span></button>
                <button className={TOOL + ' sm:ml-0'} type="button"><svg className={TSVG} fill="none" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><path d="M15.944 7.621h1.798v7.813q0 1.247-.586 2.21-.586.957-1.647 1.508-1.062.545-2.488.545-1.421 0-2.483-.545-1.062-.55-1.647-1.508-.585-.963-.586-2.21V7.621h1.792v7.668q0 .806.354 1.433.36.626 1.015.986.655.354 1.555.354.905 0 1.56-.354a2.5 2.5 0 0 0 1.01-.986q.353-.627.353-1.433zM7 22.164h12.833v1.167H7z" /></svg><span className="sr-only">Underline</span></button>
                <button className={TOOL + ' sm:ml-0'} type="button"><svg className={TSVG} fill="none" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><path d="M15.944 7.621h1.798v7.813q0 1.247-.586 2.21-.586.957-1.647 1.508-1.062.545-2.488.545-1.421 0-2.483-.545-1.062-.55-1.647-1.508-.585-.963-.586-2.21V7.621h1.792v7.668q0 .806.354 1.433.36.626 1.015.986.655.354 1.555.354.905 0 1.56-.354a2.5 2.5 0 0 0 1.01-.986q.353-.627.353-1.433z" /><path d="M7 14h12.833v1.167H7z" /></svg><span className="sr-only">Line through</span></button>
                <span aria-hidden="true" className="ml-1 h-full w-px bg-grey-30 md:ml-1" />
                <button className="transition-all duration-200 ml-2.5 cursor-default md:ml-1.5 sm:ml-1" type="button"><svg className="h-5 w-5 stroke-grey-60 transition-colors md:h-[15px] md:w-[15px]" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.866 13.335c1.765 0 3.195-1.555 3.195-3.472S11.63 6.39 9.866 6.39 6.672 7.945 6.672 9.863s1.43 3.472 3.194 3.472" /><path d="M13.059 6.39v5.758c0 1.727 2.595 2.025 3.968-.31 1.165-1.975.88-4.988-.575-6.97C14.312 1.947 9.364.857 5.77 3.27 2.467 5.487 1.29 9.973 3.116 13.598c1.806 3.588 6.045 5.327 9.881 4.03" /></svg><span className="sr-only">Mention</span></button>
                <button className="transition-all duration-200 ml-3 cursor-default md:ml-2" type="button"><svg className="h-5 w-5 stroke-grey-60 transition-colors md:h-[15px] md:w-[15px]" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#light_inline_svg__a)"><path d="M10 .836v1.111M16.489 3.516l-.786.785M19.174 10h-1.111M3.523 3.516l.786.785M.836 10h1.111M15.282 10.004a5.283 5.283 0 0 0-6.419-5.158c-2.08.436-3.722 2.175-4.064 4.272A5.27 5.27 0 0 0 8.06 14.9v2.603c0 .613.498 1.111 1.111 1.111h1.667c.613 0 1.11-.497 1.11-1.11V14.9a5.27 5.27 0 0 0 3.334-4.897M7.664 14.727h4.673" /></g><defs><clipPath id="light_inline_svg__a"><path d="M0 0h20v20H0z" /></clipPath></defs></svg><span className="sr-only">Highlight</span></button>
              </div>
              <div className="relative">
                <span className="relative z-10 md:pr-2">
                  <span className="absolute -left-3 top-[-7px] md:-left-2 sm:-left-1.5" style={{ opacity: 0 }}>
                    <svg className="height-9 h-9 w-2.5 rotate-180 md:h-[26px] md:w-2 sm:h-[25px] sm:w-[7px]" fill="none" viewBox="0 0 10 36" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M4 26.1A5.002 5.002 0 0 0 5 36a5 5 0 0 0 1-9.9V0H4z" fill="currentColor" fillRule="evenodd" /></svg>
                  </span>
                  {SENTENCE}
                </span>
                <div className="doc-anim doc-highlight absolute top-0 scale-x-[1.02]" style={{ '--highlight-position': 0, opacity: 0 }}>
                  <span aria-hidden="true" className="pointer-events-none bg-no-repeat py-0.5 pr-3 text-transparent md:pr-2" style={{ background: 'linear-gradient(90deg, #ffeba4 50%, transparent 50%) 100% 0 / 200% 100% no-repeat', backgroundPosition: 'calc((1 - var(--highlight-position)) * 100%) 0' }}>{SENTENCE}</span>
                </div>
                <div className="doc-anim doc-cursor absolute left-4 top-0 w-full scale-[1.02] md:left-1" style={{ '--cursor-position': 0, opacity: 0 }}>
                  <span aria-hidden="true" className="pointer-events-none !bg-[length:10px_36px] bg-no-repeat py-2.5 text-transparent md:!bg-[length:8px_26px] md:pr-2 sm:!bg-[length:7px_25px]" style={{ background: `url(${CURSOR}) 100% 0 no-repeat`, backgroundPosition: 'calc(var(--cursor-position) * 100%) 8px' }}>{SENTENCE}</span>
                </div>
              </div>
            </div>
            <img alt="" className="mt-9 rounded-[10px] lg:mt-8 md:mt-7 md:h-auto md:w-full sm:mt-[19px]" decoding="async" height="423" loading="lazy" src="/assets/img/billboard.a71a6e72.jpg" srcSet="/assets/img/billboard.a71a6e72.jpg 2x" style={{ color: 'transparent' }} width="706" />
            <div className="absolute left-0 top-0 h-[31.5%] w-px xl:h-[33%] sm:hidden" />
            <p className="relative -mt-8 pb-3 pt-[68px] lg:-mt-9 md:mt-[-19px] md:pt-[47px] sm:mt-[-22px] sm:pt-[38px]">
              <span aria-hidden="true" className="absolute left-1/2 top-0 -z-10 h-full w-px" />
              With{' '}
              <span className="doc-underline relative bg-gradient-to-br from-grey-70 to-grey-70 bg-[left_14px] bg-no-repeat [transition:background_1s_0.5s,color_0.5s_0s] lg:bg-[left_12px] md:bg-[left_9px] bg-[length:0%_2px] text-grey-20 sm:bg-[length:0%_1px]">step-by-step</span>
              {' '}articles, owners learn whether a repair is worth it before they call, and body shops learn which modules can be reset and which must be replaced. Wiring diagrams, connector pinouts and torque specs are the{' '}
              <span className="doc-underline relative bg-gradient-to-br from-grey-70 to-grey-70 bg-[left_14px] bg-no-repeat [transition:background_1.5s_2s,color_0.5s_1.5s] lg:bg-[left_12px] md:bg-[left_9px] bg-[length:0%_2px] text-grey-20 sm:bg-[length:0%_1px]">technical references</span>
              {' '}
              <span className="relative pr-2 md:pr-1">
                <strong className="font-medium text-orange" />
                <span className="relative">
                  <Pin color="orange" img="/assets/img/orange-pin-image.5c9a9e65.jpg" line="h-[27px] md:h-[18px]" className="bottom-[-8px] left-[-30px] text-orange md:bottom-[-4px] md:left-[-21px] sm:left-[-16px]" />
                </span>
              </span>
              shops ask us for most.
            </p>
            <img alt="" className="mt-[22px] rounded-[10px] lg:mt-[22px] md:mt-[11px] md:h-auto md:w-full sm:mt-[3px]" decoding="async" height="336" loading="lazy" src="/assets/media/11129cb398cec0781980fa6071f63c4c.svg" style={{ color: 'transparent' }} width="704" />
            <p className="mt-9 lg:mt-8 md:mt-6 sm:mt-4">
              Articles carry photos from the bay, code tables and short clips of the tooling in use. New ones are added whenever a job teaches us something worth passing on.
            </p>
            <div className="mt-5 flex items-start md:mt-4 sm:mt-2.5">
              <svg className="mr-1 h-auto w-2.5 rotate-180 fill-black md:w-2 sm:w-1.5" fill="none" viewBox="0 0 10 36" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M4 26.1A5.002 5.002 0 0 0 5 36a5 5 0 0 0 1-9.9V0H4z" fill="currentColor" fillRule="evenodd" /></svg>
              <span className="mt-2 text-grey-70">Tap here to continue...</span>
            </div>
            <div className="mt-3 flex w-fit gap-x-1 rounded-full bg-grey-98 p-[5px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.15)] md:mt-1.5 sm:mt-2 sm:gap-x-0.5 sm:p-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-grey-20 md:h-[30px] md:w-[30px] sm:h-[27px] sm:w-[27px]"><svg className="m-auto h-auto w-3.5 stroke-white sm:w-3" fill="none" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M6 1v10M1 6h10" /></svg></div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-grey-94 md:h-[30px] md:w-[30px] sm:h-[27px] sm:w-[27px]"><img alt="" className="m-auto h-auto w-5 sm:w-3" height="20" loading="lazy" src="/assets/media/3025df96db45e17e4ce4a52f5eb60533.svg" width="20" /></div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-grey-94 md:h-[30px] md:w-[30px] sm:h-[27px] sm:w-[27px]"><img alt="" className="m-auto h-auto w-4.5 sm:w-3" height="18" loading="lazy" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAxOCAxOCI+PHBhdGggZmlsbD0iIzMwMzIzNiIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTMuODU0Ljc3MWEuNS41IDAgMCAwLS43MDcgMGwtMi4yNSAyLjI1LTkgOWEuNS41IDAgMCAwLS4xMzIuMjMzbC0xLjEyNSA0LjVhLjUuNSAwIDAgMCAuNjA2LjYwNmw0LjUtMS4xMjVhLjUuNSAwIDAgMCAuMjMzLS4xMzFsOS05IDIuMjUtMi4yNWEuNS41IDAgMCAwIDAtLjcwOHptLjc3MSA1LjI3MkwxNi4xNjggNC41IDEzLjUgMS44MzJsLTEuNTQzIDEuNTQzem0tMy4zNzUtMS45NkwyLjcwMSAxMi42M2wtLjg4OSAzLjU1NyAzLjU1Ny0uODkgOC41NDktOC41NDh6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=" width="18" /></div>
            </div>
          </Reveal>
        </div>
        <div className="order-first ml-2 pt-[222px] xl:ml-[81px] lg:ml-[63px] lg:pt-[202px] md:ml-6 md:pt-32 sm:hidden">
          <div className="sticky top-[222px] z-10 h-[282px] w-64 rounded-xl lg:top-[202px] lg:h-[227px] lg:w-[206px] md:top-32 md:h-[169px] md:w-[154px]">
            <div className="absolute bottom-0 left-0 px-4.5 pb-7 pt-4 transition-opacity duration-300 ease-in-out lg:pb-6 lg:pl-4 lg:pr-3 md:px-2.5 md:py-4 z-10 opacity-0">
              <h3 className="font-semibold leading-snug tracking-tight lg:text-13 md:text-10">Collaborate</h3>
              <p className="mt-1.5 text-15 leading-snug tracking-tight lg:text-12 md:mt-1 md:text-9">Owners, adjusters and shops read the same article.</p>
            </div>
            <div className="absolute bottom-0 left-0 px-4.5 pb-7 pt-4 transition-opacity duration-300 ease-in-out lg:pb-6 lg:pl-4 lg:pr-3 md:px-2.5 md:py-4 opacity-1 z-20">
              <h3 className="font-semibold leading-snug tracking-tight lg:text-13 md:text-10">Version history</h3>
              <p className="mt-1.5 text-15 leading-snug tracking-tight lg:text-12 md:mt-1 md:text-9">Every revision kept, so a spec is never lost.</p>
            </div>
            <div className="pointer-events-none absolute bottom-[-52.5%] left-1/2 aspect-[.912] w-[178.125%] -translate-x-1/2">
              <span aria-hidden="true" className="absolute left-1/2 top-0 -z-10 h-full w-px" />
              <div aria-hidden="true" className="relative h-full w-full [&_canvas]:!h-full [&_canvas]:!w-full [&_canvas]:rounded-xl" />
            </div>
          </div>
          <div className="absolute left-0 top-0 h-[31.5%] w-px xl:h-[33%]" />
        </div>
      </div>
    </section>
  );
}
