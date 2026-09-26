'use client';
import {useState} from 'react';
import {Plus} from './Icons';

const QA = [
  ['Is it safe to repair airbags instead of replacing the whole system?', 'Yes, when it is done to the manufacturer\'s procedure. Every deployed component is replaced with a new unit, not a used one. Modules are reset or replaced and then verified with the same diagnostic tooling a dealer uses. You receive a readiness report showing the system is fully armed.'],
  ['Why is my SRS light still on after the airbags were replaced?', 'The control module stores hard crash codes after a deployment. New airbags alone will not clear them. The module needs a crash-data reset (or replacement and VIN coding), and any locked pretensioners or damaged sensors have to be addressed too. A scan tells us exactly what is left.'],
  ['Can I mail in my SRS module?', 'Yes. Remove the module, note the VIN, and ship it to us. Most modules are reset, bench-tested and shipped back within one business day of arrival. Your original module keeps its coding, so no dealer programming is needed when you reinstall it.'],
  ['Do you rebuild my original seatbelts or swap them?', 'We rebuild your originals. The pretensioner receives a new pyrotechnic charge and the retractor is restored, so the color, trim and mounting all match. Webbing is replaced only if it is cut, frayed or blown.'],
  ['How long does a full post-collision SRS repair take?', 'Most vehicles are complete within 24 to 48 hours once parts are in hand. Complex systems with multiple curtain airbags and occupant sensors can take a little longer, and we will tell you up front.'],
  ['Do you work with insurance companies and body shops?', 'Every day. We provide itemized estimates and a documented readiness report that adjusters and shops accept, and we can pick up and deliver within the metro area for shop accounts.'],
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section" id="faq">
      <div className="wrap faq-grid">
        <div data-reveal>
          <div className="eyebrow-row"><i /><span>Questions</span></div>
          <h2 className="hd hd-lg"><span className="silver">Straight answers</span><br /><span className="redtxt">before you book.</span></h2>
          <p className="lead muted" style={{marginTop: 22}}>Not covered here? Call the shop and talk to a technician, not a call center.</p>
        </div>
        <div className="faq-list" data-reveal>
          {QA.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q} className={'faq panel panel-plain' + (isOpen ? ' open' : '')}>
                <button className="faq-q" type="button" aria-expanded={isOpen} aria-controls={'faq-a-' + i} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span>{q}</span><span className="plus"><Plus /></span>
                </button>
                <div className="faq-a" id={'faq-a-' + i} role="region"><div><p>{a}</p></div></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
