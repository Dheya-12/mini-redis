const STATS = [['1,200', '+', 'Vehicles restored'], ['24', '–48h', 'Typical turnaround'], ['12', ' mo', 'Workmanship warranty'], ['100', '%', 'OEM-spec parts & procedures']];
const ROWS = [
  ['B0001', 'Driver frontal deployment loop', 'Cleared'],
  ['B0012', 'Passenger frontal stage 1', 'Cleared'],
  ['B0028', 'Left curtain deployment', 'Cleared'],
  ['B0100', 'Crash event data', 'Erased'],
  ['B1000', 'SRS control module', 'Reset'],
  ['B0050', 'Driver pretensioner', 'Rebuilt'],
];

export default function About() {
  return (
    <section className="section" id="about">
      <div className="wrap about-grid">
        <div data-reveal>
          <div className="eyebrow-row"><i /><span>Why Pro Airbags</span></div>
          <h2 className="hd hd-xl"><span className="silver">Factory-grade</span><br /><span className="redtxt">SRS repair.</span></h2>
          <p className="lead" style={{marginTop: 26}}>
            A deployed airbag does not have to mean a totaled car. We rebuild the entire supplemental restraint system — bags, belts, sensors and the control module — to the manufacturer's specification, then verify it with dealer-level diagnostics before the vehicle leaves the bay.
          </p>
          <p className="lead muted" style={{marginTop: 16}}>
            No dash lights. No stored crash data. No guesswork. Just a restraint system that will do its job the next time it matters.
          </p>
          <div className="stats">
            {STATS.map(([n, suf, label]) => (
              <div key={label} className="stat panel panel-plain"><b>{n}<em>{suf}</em></b><span>{label}</span></div>
            ))}
          </div>
        </div>
        <div data-reveal>
          <div className="diag panel corner" aria-label="Sample diagnostic report">
            <div className="diag-scan" />
            <div className="diag-head">
              <strong>Diagnostic report<small>2021 Ford F-150 · Post-collision SRS rebuild</small></strong>
              <span className="live"><i />Verified</span>
            </div>
            <ul className="diag-rows">
              {ROWS.map(([code, label, st]) => (
                <li key={code}><code>{code}</code><span>{label}</span><span className={'st' + (st === 'Erased' ? ' warn' : '')}>{st}</span></li>
              ))}
            </ul>
            <div className="diag-foot"><span>Module: OEM · Coded to VIN</span><span>Readiness · Complete</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
