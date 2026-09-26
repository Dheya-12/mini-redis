const STEPS = [
  ['01', 'Diagnose', 'Full SRS scan with dealer-level tools. We read every stored code, map what deployed and quote the exact parts and labor before touching the car.', 'Scan complete'],
  ['02', 'Repair', 'Airbags, pretensioners, sensors and wiring replaced or rebuilt to OEM spec with new single-use hardware.', 'Parts installed'],
  ['03', 'Reset', 'Crash data erased and the control module reset or coded to the VIN. Occupant sensors recalibrated.', 'Module online'],
  ['04', 'Verify', 'Readiness check and road test. The SRS light goes out and stays out — documented on your report.', 'System OK'],
];

export default function Process() {
  return (
    <section className="section" id="process">
      <div className="wrap">
        <div data-reveal style={{maxWidth: 720}}>
          <div className="eyebrow-row"><i /><span>How a repair runs</span></div>
          <h2 className="hd hd-lg"><span className="silver">From SRS light</span> <span className="redtxt">to system online.</span></h2>
        </div>
        <ol className="steps" style={{listStyle: 'none', padding: 0}}>
          {STEPS.map(([n, t, body, chip]) => (
            <li key={n} className="step" data-reveal>
              <div className="step-dot">{n}</div>
              <h3 className="hd hd-sm">{t}</h3>
              <p>{body}</p>
              <span className="chip"><i />{chip}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
