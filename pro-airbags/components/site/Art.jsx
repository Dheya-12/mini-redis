/* Tile artwork rebuilt as HTML in the style of huly.io's tile images (dark plate, blue glow, stacked cards), with Pro Airbags content. */
import { SPRITES } from '@/components/pro-airbags-hero/generated/assets';

export function Plate({ glow = 'left', children, className = '' }) {
  return (
    <div className={'art-plate absolute inset-0 overflow-hidden rounded-[inherit] ' + className}>
      <div className={'art-glow art-glow-' + glow} />
      {children}
    </div>
  );
}

export function Avatar({ k, size = 28 }) {
  return <span className="art-avatar" style={{ width: size, height: size }}><img alt="" src={SPRITES[k].uri} /></span>;
}

const CHECK = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggc3Ryb2tlPSIjZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS44MjkiIGQ9Im0xMy4zMyA0LTcuMzMzIDcuMzMzTDIuNjY0IDgiLz48L3N2Zz4=';

/* Checklist: three stacked task rows, the first one done. */
export function Checklist() {
  const rows = [['Driver airbag replaced', true], ['SRS module reset', false], ['Road test and sign-off', false]];
  return (
    <Plate glow="left">
      <div className="art-stack">
        {rows.map(([t, done], i) => (
          <div key={t} className="art-row" style={{ marginLeft: 26 + i * 22, opacity: 1 - i * 0.28 }}>
            <span className={'art-box' + (done ? ' on' : '')}>{done && <img alt="" src={CHECK} width="12" height="12" />}</span>
            <span className={done ? 'line-through' : ''}>{t}</span>
          </div>
        ))}
      </div>
    </Plate>
  );
}

/* Schedule: the bay booking card with a second card behind it. */
export function Schedule() {
  return (
    <Plate glow="none">
      <div className="art-cards">
        <div className="art-card">
          <div className="art-card-t">Bay 2 · SRS rebuild<br />2021 Ford F-150</div>
          <div className="art-card-s">09:00 – 11:30 am</div>
          <div className="art-people"><Avatar k="nav_airbags" /><Avatar k="nav_module" /><Avatar k="nav_seatbelt" /><span className="art-more">+1</span></div>
        </div>
        <div className="art-card art-card-b"><div className="art-people"><Avatar k="nav_programming" size={22} /><span className="art-more">+1</span></div></div>
      </div>
    </Plate>
  );
}

/* Notes: the block-picker menu from the notes tile. */
export function Notes() {
  const items = [['Aa', 'Scan result', 'Every stored code, in plain words'], ['#', 'Parts list', 'What was replaced and why'], ['▣', 'Photos', 'Before and after, from the bay']];
  return (
    <Plate glow="right">
      <div className="art-menu">
        <div className="art-menu-h">Report blocks</div>
        {items.map(([ic, t, s]) => (
          <div key={t} className="art-menu-i"><span className="art-menu-ic">{ic}</span><span><b>{t}</b><br /><small>{s}</small></span></div>
        ))}
      </div>
    </Plate>
  );
}

/* Live status: the three parties on the same job, like the teammates strip. */
export function Status() {
  const p = [['nav_airbags', 'Owner'], ['nav_module', 'Adjuster'], ['nav_seatbelt', 'Body shop'], ['nav_programming', 'Technician']];
  return (
    <Plate glow="top">
      <div className="art-strip">
        {p.map(([k, l]) => <div key={l} className="art-person"><Avatar k={k} size={54} /><span>{l}</span></div>)}
      </div>
      <div className="art-pill">Job 48213 · Belts rebuilt · road test at 3:00</div>
    </Plate>
  );
}

/* Calendar: the big date tile. */
export function Calendar() {
  return (
    <Plate glow="left" className="art-cal">
      <div className="art-cal-n">14</div>
      <div className="art-cal-m">August</div>
      <div className="art-cal-plus">+</div>
    </Plate>
  );
}

/* Chat: two bubbles and the composer. */
export function Chat() {
  return (
    <Plate glow="right">
      <div className="art-chat">
        <div className="art-bubble r"><Avatar k="nav_module" size={22} /><span><b>@Marcus</b> Module is back on the bench, coding now</span></div>
        <div className="art-bubble l"><Avatar k="nav_seatbelt" size={22} /><span><b>@Shop</b> Both belts rebuilt, car ready at 3</span></div>
        <div className="art-compose">Type a message…<span>›</span></div>
      </div>
    </Plate>
  );
}

/* Fleet: the project card with a star, like the pm tile. */
export function Fleet() {
  const rows = [['2021 Ford F-150', 'Road test'], ['2019 Jeep Grand Cherokee', 'Module reset'], ['2017 Honda Accord', 'Waiting on parts']];
  return (
    <Plate glow="none">
      <div className="art-fleet">
        <div className="art-fleet-h">Metro Collision · 3 cars<span>★</span></div>
        {rows.map(([c, s]) => <div key={c} className="art-fleet-r"><span>{c}</span><em>{s}</em></div>)}
      </div>
    </Plate>
  );
}

/* Spec block: the code illustration from the Knowledge section, as a spec sheet in the site's shiki colours. */
export function Spec() {
  const L = [
    ['# Driver airbag · 2021 Ford F-150', '#777a88'], ['', ''],
    ['connector   C2286      2-pin, yellow', '#4da6ff'], ['torque      8 N·m      M6 × 2', '#47d18c'], ['part        ML3Z-58043B13-AB', '#ff990a'], ['clockspring inspect    replace if > 2.5 turns', '#bf6afb'], ['', ''],
    ['after fit:  clear B0001, run readiness', '#ff4d89'],
  ];
  return (
    <div className="art-spec">
      <span className="art-spec-copy">⧉</span>
      {L.map(([t, c], i) => <div key={i} style={{ color: c }}>{t || ' '}</div>)}
    </div>
  );
}
