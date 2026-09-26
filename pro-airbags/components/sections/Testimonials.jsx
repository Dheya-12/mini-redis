import {Star} from './Icons';

const QUOTES = [
  ['Insurance called my Explorer a total loss over four airbags and two belts. Pro Airbags rebuilt everything in three days for a fraction of that and the dash is clean. Passed inspection the same week.', 'Marcus T.', '2019 Ford Explorer · Dearborn', 'Full rebuild'],
  ['I sent in my SRS module by mail expecting to wait a week. It was back, reset and coded, in two days. Plugged it in, light gone. Exactly what they said would happen.', 'Danielle R.', '2017 Honda Accord · Ann Arbor', 'Module reset'],
  ['My pretensioners had locked after a minor bump. They rebuilt my original belts so the trim still matches, and walked me through the readiness report. Honest shop, real expertise.', 'Andre K.', '2020 Jeep Grand Cherokee · Troy', 'Seatbelt repair'],
];

export default function Testimonials() {
  return (
    <section className="section" id="reviews">
      <div className="wrap">
        <div data-reveal style={{maxWidth: 720}}>
          <div className="eyebrow-row"><i /><span>Trusted in Detroit</span></div>
          <h2 className="hd hd-lg"><span className="silver">Hundreds of drivers</span> <span className="redtxt">back on the road.</span></h2>
        </div>
        <div className="quotes">
          {QUOTES.map(([q, name, car, chip]) => (
            <figure key={name} className="quote panel panel-plain" data-reveal style={{margin: 0}}>
              <div className="stars" aria-label="5 out of 5 stars">{[0, 1, 2, 3, 4].map(i => <Star key={i} />)}</div>
              <p>“{q}”</p>
              <footer><div><b>{name}</b><span>{car}</span></div><span className="chip"><i />{chip}</span></footer>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
