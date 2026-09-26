import { Wordmark } from './Buttons';

const grad = id => (
  <defs><linearGradient gradientUnits="userSpaceOnUse" id={id} x1="9" x2="9" y1="0" y2="18"><stop stopColor="#C9CBCF" /><stop offset="1" stopColor="#C9CBCF" stopOpacity="0.8" /></linearGradient></defs>
);
const ICON = 'h-4.5 w-4.5 translate-y-0 opacity-80 transition-opacity duration-300 hover:opacity-100';

/* huly.io footer: absolutely positioned at the bottom of the closing call-to-action section. */
export default function SiteFooter() {
  return (
    <footer className="absolute bottom-0 z-10 w-full overflow-hidden py-[17px] px-safe md:py-3.5">
      <div className="container flex items-center text-14 leading-none tracking-snugger lg:flex-wrap lg:justify-between lg:gap-y-3 md:justify-start md:gap-y-2 sm:text-center">
        <p className="text-grey-40 lg:order-3 sm:mt-2 sm:w-full">
          <span>Copyright © {new Date().getFullYear()} <a aria-label="Pro Airbags" className="transition-colors duration-200 hover:text-white" href="#top">Pro Airbags</a></span>
          <span className="2xs:mt-1 2xs:block">. All rights reserved.</span>
        </p>
        <ul className="z-10 ml-[70px] flex items-center gap-x-[26px] lg:order-2 lg:-mb-1.5 lg:ml-0 lg:w-1/2 lg:justify-end lg:gap-x-6 md:mb-0 md:ml-0 md:gap-x-4 sm:mt-9 sm:w-full sm:justify-center">
          <li><a className="transition-colors duration-200 leading-none inline-flex items-center text-14 text-grey-80 tracking-tight hover:text-white !tracking-snugger" href="#faq">Terms of Service</a></li>
          <li><a className="transition-colors duration-200 leading-none inline-flex items-center text-14 text-grey-80 tracking-tight hover:text-white !tracking-snugger" href="#faq">Privacy Policy</a></li>
        </ul>
        <ul className="ml-[70px] flex gap-x-4.5 lg:order-1 lg:-mb-1.5 lg:ml-0 lg:w-1/2 md:mb-0 sm:w-full sm:justify-center">
          <li><a aria-label="X" className="transition-colors duration-200" href="#top">
            <svg className={ICON} fill="none" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M12.045 16.75h5.377L5.512 1H-.003l6.776 8.858-6.142 7.017h2.673l4.716-5.385zm2.218-1.6h-1.48L3.118 2.516h1.589zM9.589 6.18l4.42-5.055h2.672L10.827 7.82z" fill="url(#f_x)" fillRule="evenodd" />{grad('f_x')}</svg>
          </a></li>
          <li><a aria-label="LinkedIn" className="transition-colors duration-200" href="#top">
            <svg className={ICON} fill="none" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M16.425.9H1.575C1.17.9.9 1.17.9 1.575v14.85c0 .405.27.675.675.675h14.85c.405 0 .675-.27.675-.675V1.575c0-.405-.27-.675-.675-.675M5.693 14.737H3.33V6.975h2.43v7.762zM4.478 5.895A1.426 1.426 0 0 1 3.06 4.477c0-.742.608-1.417 1.418-1.417.742 0 1.417.607 1.417 1.417s-.607 1.418-1.417 1.418m10.26 8.842h-2.43v-3.78c0-.877 0-2.025-1.215-2.025-1.283 0-1.418.945-1.418 1.958v3.847h-2.43V6.975H9.54v1.08c.338-.608 1.08-1.215 2.295-1.215 2.43 0 2.903 1.62 2.903 3.712z" fill="url(#f_li)" />{grad('f_li')}</svg>
          </a></li>
          <li><a aria-label="YouTube" className="transition-colors duration-200" href="#top">
            <svg className={ICON} fill="none" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.775 5.4c-.225-1.463-.9-2.475-2.475-2.7-2.475-.45-6.3-.45-6.3-.45s-3.825 0-6.3.45C1.125 2.925.337 3.937.225 5.4 0 6.862 0 9 0 9s0 2.137.225 3.6.9 2.475 2.475 2.7c2.475.45 6.3.45 6.3.45s3.825 0 6.3-.45c1.575-.338 2.25-1.238 2.475-2.7S18 9 18 9s0-2.137-.225-3.6M6.75 12.375v-6.75L12.375 9z" fill="url(#f_yt)" />{grad('f_yt')}</svg>
          </a></li>
          <li><a aria-label="Telegram" className="transition-colors duration-200" href="#top">
            <svg className={ICON} fill="none" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M9 18A9 9 0 1 0 9 0a9 9 0 0 0 0 18M4.078 8.878l8.625-3.384c.375-.15.706.062.581.562l.003-.003-1.54 7.3c-.1.419-.375.538-.75.325l-2.138-1.584-1.028.984c-.112.113-.206.206-.425.206l.15-2.175 3.947-3.584c.175-.15-.037-.24-.262-.09L6.42 10.53 4.329 9.87c-.406-.125-.412-.438.094-.619z" fill="url(#f_tg)" />{grad('f_tg')}</svg>
          </a></li>
        </ul>
        <div className="ml-auto flex h-12 items-center bg-[linear-gradient(90deg,#F58041_0%,#AC795C_25.6%,#887064_41.58%,#716A69_56.98%,#61656B_69.44%)] bg-clip-text text-right text-grey-50 text-transparent lg:order-4 lg:mr-0 md:order-3 md:ml-auto md:h-11 sm:ml-0 sm:mt-2 sm:w-full sm:justify-center">
          <img alt="" className="-mr-3 sm:-ml-4" decoding="async" height="68" loading="lazy" src="/assets/media/451c327bbe05656f879fee8b8cac7a62.svg" style={{ color: 'transparent' }} width="68" />
          Made with passion in Detroit
        </div>
      </div>
    </footer>
  );
}
