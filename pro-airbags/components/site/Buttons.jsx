/* Buttons ported from huly.io: the light glowing pill, the grey bordered pill and the dark pill. Class strings are verbatim. */
export function LightButton({ href, children, className = '', arrow = true, onClick, type, as }) {
  const Tag = as || (href ? 'a' : 'button');
  return (
    <div className="light-btn relative inline-flex items-center z-10">
      <div className="light-ring-a border-button-light-blur absolute left-1/2 top-1/2 h-[calc(100%+9px)] w-[calc(100%+9px)] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform" style={{ opacity: 1 }}>
        <div className="border-button-light relative h-full w-full rounded-full" />
      </div>
      <div className="light-ring-b border-button-light-blur absolute left-1/2 top-1/2 h-[calc(100%+9px)] w-[calc(100%+9px)] -translate-x-1/2 -translate-y-1/2 scale-x-[-1] transform rounded-full will-change-transform" style={{ opacity: 0 }}>
        <div className="border-button-light relative h-full w-full rounded-full" />
      </div>
      <Tag className={'transition-colors duration-200 transition-all duration-200 uppercase font-bold flex items-center justify-center h-10 px-16 text-12 text-black -tracking-[0.015em] relative z-10 overflow-hidden rounded-full border border-white/60 bg-[#d1d1d1] space-x-1 ' + className} href={href} onClick={onClick} type={type}>
        <div className="light-glow absolute -z-10 flex w-[204px] items-center justify-center" style={{ transform: 'translateX(105px) translateZ(0)' }}>
          <div className="absolute top-1/2 h-[121px] w-[121px] -translate-y-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,#FFFFF5_3.5%,_#FFAA81_26.5%,#FFDA9F_37.5%,rgba(255,170,129,0.50)_49%,rgba(210,106,58,0.00)_92.5%)]" />
          <div className="absolute top-1/2 h-[103px] w-[204px] -translate-y-1/2 bg-[radial-gradient(43.3%_44.23%_at_50%_49.51%,_#FFFFF7_29%,_#FFFACD_48.5%,_#F4D2BF_60.71%,rgba(214,211,210,0.00)_100%)] blur-[5px]" />
        </div>
        <span className="text-[#5A250A]">{children}</span>
        {arrow && (
          <svg className="h-[9px] w-[17px] text-[#5A250A]" fill="none" viewBox="0 0 17 9" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" d="m12.495 0 4.495 4.495-4.495 4.495-.99-.99 2.805-2.805H0v-1.4h14.31L11.505.99z" fill="currentColor" fillRule="evenodd" />
          </svg>
        )}
      </Tag>
    </div>
  );
}

export function GreyButton({ href, children, className = '', onClick }) {
  return (
    <a className={'transition-colors duration-200 transition-all duration-200 uppercase font-bold flex items-center justify-center h-8 px-4 text-11 border-button-grey relative text-white tracking-snug ' + className} href={href} onClick={onClick}>
      {children}
    </a>
  );
}

export function DarkButton({ href, children, className = '', icon }) {
  return (
    <a className={'transition-colors duration-200 transition-all duration-200 uppercase font-bold flex items-center justify-center h-10 px-16 text-12 relative flex w-[174px] items-center gap-x-1.5 rounded-full border border-white/10 bg-[#0B0C0F] pl-5 pr-6 tracking-snug text-white hover:border-white/15 ' + className} href={href}>
      {icon}
      <span className="z-10">{children}</span>
    </a>
  );
}

export const CHEVRON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAxMCA2Ij48cGF0aCBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMS40IiBkPSJtMSAxIDQgNCA0LTQiIG9wYWNpdHk9Ii42Ii8+PC9zdmc+';
export const CHECK = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggc3Ryb2tlPSIjZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS44MjkiIGQ9Im0xMy4zMyA0LTcuMzMzIDcuMzMzTDIuNjY0IDgiLz48L3N2Zz4=';
export const CALL_USER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCA4IDgiPjxnIGNsaXAtcGF0aD0idXJsKCNjYWxsLXVzZXJfc3ZnX19hKSI+PHBhdGggZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNNS44MzkgMS44MzNhMS44MzMgMS44MzMgMCAxIDEtMy42NjcgMCAxLjgzMyAxLjgzMyAwIDAgMSAzLjY2NyAwTS4zNjkgNy42MzZhMy42NDcgMy42NDcgMCAwIDEgNy4yNjMgMCAuMzMuMzMgMCAwIDEtLjMzMi4zNjdILjdhLjM0LjM0IDAgMCAxLS4yNDctLjExLjM0LjM0IDAgMCAxLS4wODQtLjI1NyIgY2xpcC1ydWxlPSJldmVub2RkIi8+PC9nPjxkZWZzPjxjbGlwUGF0aCBpZD0iY2FsbC11c2VyX3N2Z19fYSI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTAgMGg4djhIMHoiLz48L2NsaXBQYXRoPjwvZGVmcz48L3N2Zz4=';

export function Wordmark({ className = '' }) {
  return (
    <span className={'inline-flex items-baseline gap-x-1.5 font-title text-20 font-semibold leading-none tracking-snugger text-white ' + className}>
      Pro<span className="text-orange">Airbags</span>
    </span>
  );
}
