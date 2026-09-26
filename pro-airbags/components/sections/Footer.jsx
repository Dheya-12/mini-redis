const COLS = [
  ['Services', [['Airbag replacement', '#airbags'], ['SRS module reset', '#module'], ['Seatbelt repair', '#seatbelt'], ['Programming', '#programming']]],
  ['Company', [['Why Pro Airbags', '#about'], ['How a repair runs', '#process'], ['Reviews', '#reviews'], ['FAQ', '#faq']]],
  ['Contact', [['Start a repair', '#start'], ['(313) 555-0142', 'tel:+13135550142'], ['Detroit, Michigan', '#start']]],
];

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <a className="wordmark" href="#top" aria-label="Pro Airbags home"><span className="pro">Pro</span><span className="air">Airbags</span></a>
            <p>Airbag &amp; safety system specialists. Airbag repair, module resetting, seatbelt repair and programming — professional solutions to get you back on the road safely.</p>
          </div>
          {COLS.map(([h, links]) => (
            <div key={h}><h4>{h}</h4><ul>{links.map(([l, href]) => <li key={l}><a href={href}>{l}</a></li>)}</ul></div>
          ))}
        </div>
        <div className="foot-bar">
          <span>© {new Date().getFullYear()} Pro Airbags. All rights reserved.</span>
          <span className="chip"><i />SRS System · Online</span>
        </div>
      </div>
    </footer>
  );
}
