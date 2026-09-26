'use client';
import {useEffect, useRef} from 'react';
import {SPRITES} from '@/components/pro-airbags-hero/generated/assets';
import {Arrow} from './Icons';

const SERVICES = [
  {key: 'airbags', n: '01', title: 'Airbag repair & replacement', body: 'Driver, passenger, knee, seat and curtain airbags replaced with OEM or OEM-equivalent units, matched to your VIN and installed with new hardware and covers.', items: ['Airbag replacement', 'SRS light diagnosis', 'Clock spring repair', 'Seat and curtain airbags']},
  {key: 'module', n: '02', title: 'SRS module reset', body: 'After a deployment the control module stores hard crash codes that block the system. We clear crash data and hard codes on your original module — no need for a new unit or dealer programming.', items: ['Crash data clearing', 'SRS module reset', 'Hard code removal', 'Module bench test']},
  {key: 'seatbelt', n: '03', title: 'Seatbelt repair', body: 'Locked or fired pretensioners rebuilt on your original belt assembly with a new pyrotechnic charge, so colors, trim and mounting points match perfectly.', items: ['Pretensioner rebuild', 'Webbing replacement', 'Buckle and sensor repair', 'Retractor repair']},
  {key: 'programming', n: '04', title: 'Programming & coding', body: 'Replacement modules, occupant classification systems and sensors coded and calibrated to the vehicle with factory-level tooling, then a full system readiness check.', items: ['Module coding', 'VIN programming', 'Occupant sensor calibration', 'System setup']},
];
const slug = s => s.toLowerCase().replace(/[^a-z]+/g, '-');

export default function Services() {
  const ref = useRef(null);
  useEffect(() => {
    const cards = [...ref.current.querySelectorAll('.svc')];
    const handlers = cards.map(c => {
      const glow = c.querySelector('.svc-glow');
      const move = e => { const r = c.getBoundingClientRect(); glow.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%'); };
      c.addEventListener('pointermove', move);
      return () => c.removeEventListener('pointermove', move);
    });
    return () => handlers.forEach(f => f());
  }, []);
  return (
    <section className="section" id="services-detail" ref={ref}>
      <div className="wrap">
        <div className="svc-head">
          <div data-reveal>
            <div className="eyebrow-row"><i /><span>What we do</span></div>
            <h2 className="hd hd-lg"><span className="silver">Every part of the</span><br /><span className="redtxt">restraint system.</span></h2>
          </div>
          <p className="lead muted" data-reveal style={{maxWidth: '40ch'}}>Four specialties, one bay. Most vehicles are diagnosed, repaired, reset and verified within two working days.</p>
        </div>
        <div className="svc-grid">
          {SERVICES.map(s => (
            <article key={s.key} id={s.key} className="svc panel panel-plain corner" data-reveal>
              <span className="svc-glow" />
              <span className="svc-num" aria-hidden="true">{s.n}</span>
              <div className="svc-ico"><img alt="" src={SPRITES['nav_' + s.key].uri} /></div>
              <div>
                <span className="mono-tag">Service {s.n}</span>
                <h3 className="hd hd-md silver">{s.title}</h3>
                <p>{s.body}</p>
                <ul>{s.items.map(it => <li key={it} id={slug(it)}>{it}</li>)}</ul>
                <a className="svc-link" href="#start"><span>Start a repair</span><Arrow w={16} /></a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
