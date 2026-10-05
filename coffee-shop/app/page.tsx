import RoastCurve from "@/components/RoastCurve";
import BrewCalculator from "@/components/BrewCalculator";
import { AddToBag, BagButton, BagProvider } from "@/components/Bag";
import Subscribe from "@/components/Subscribe";
import { bar, coffees, hours } from "@/lib/data";

export default function Home() {
  return (
    <BagProvider>
      <header className="nav">
        <div className="wrap nav__inner">
          <a className="brand" href="#top" aria-label="First Crack Coffee, home">
            <span className="brand__mark" aria-hidden="true" />
            First Crack
          </a>
          <nav className="nav__links" aria-label="Sections">
            <a href="#beans">Beans</a>
            <a href="#bar">Bar</a>
            <a href="#brew">Brew guide</a>
            <a href="#visit">Visit</a>
          </nav>
          <BagButton />
        </div>
      </header>

      <main id="top">
        <section className="hero wrap">
          <div className="hero__copy">
            <p className="label">Roastery &amp; espresso bar · 214 Larch Street</p>
            <h1 className="display">
              Roasted to the <em>second</em>, poured to the gram.
            </h1>
            <p className="lede">
              We roast twelve kilos at a time on a 1962 Probat, twice a week, and log every batch.
              The bar serves what came out of the drum that morning.
            </p>
            <div className="hero__actions">
              <a className="btn" href="#beans">Shop this week&apos;s beans</a>
              <a className="link" href="#visit">Watch a roast on Tuesday →</a>
            </div>
          </div>
          <RoastCurve />
        </section>

        <section className="section wrap" id="beans">
          <div className="section__head">
            <h2 className="h2">On the shelf this week</h2>
            <p className="section__aside">Roasted Friday 2 October. Best from day 5 to day 30.</p>
          </div>
          <ul className="beans">
            {coffees.map((c) => (
              <li key={c.id} className="bean">
                <div className="bean__top">
                  <span className="label">{c.origin}</span>
                  <span className="bean__score">{c.score ? `${c.score} SCA` : "Blend"}</span>
                </div>
                <h3 className="bean__name">{c.name}</h3>
                <p className="bean__producer">{c.producer}</p>
                <p className="bean__notes">{c.notes.join(" · ")}</p>
                <dl className="spec">
                  <div><dt>Process</dt><dd>{c.process}</dd></div>
                  <div><dt>Variety</dt><dd>{c.variety}</dd></div>
                  <div><dt>Altitude</dt><dd>{c.altitude} masl</dd></div>
                  <div><dt>Roast</dt><dd>{c.roast}</dd></div>
                </dl>
                <div className="bean__buy">
                  <span className="price">${c.price}<small> / {c.weight}</small></span>
                  <AddToBag name={c.name} price={c.price} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="section band" id="bar">
          <div className="wrap">
            <div className="section__head">
              <h2 className="h2">At the bar</h2>
              <p className="section__aside">Milk from Fernhill Dairy. Oat at no charge.</p>
            </div>
            <div className="menu">
              {bar.map((g) => (
                <div key={g.group} className="menu__group">
                  <h3 className="label menu__title">{g.group}</h3>
                  <ul>
                    {g.items.map((d) => (
                      <li key={d.name} className="drink">
                        <div className="drink__row">
                          <span className="drink__name">{d.name}</span>
                          <span className="drink__price">{d.price}</span>
                        </div>
                        <span className="drink__spec">{d.spec}</span>
                        {d.note && <span className="drink__note">{d.note}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section wrap brew" id="brew">
          <div className="brew__copy">
            <h2 className="h2">Brew it the way we do</h2>
            <p>
              Pick a brewer and a dose. We&apos;ll give you the recipe our baristas use on bar, down to the
              bloom. Weigh your water; scoops vary by up to 30%.
            </p>
            <p className="muted">Using a light roast? Add 1–2 °C and grind one step finer.</p>
          </div>
          <BrewCalculator />
        </section>

        <section className="section wrap visit" id="visit">
          <div>
            <h2 className="h2">Come in</h2>
            <address className="visit__addr">
              214 Larch Street<br />
              Northside, behind the old rail depot
            </address>
            <p className="muted">Roaster runs Tuesdays and Fridays from 09:30. First crack usually lands around 10:00, and you can hear it from the counter.</p>
          </div>
          <table className="hours">
            <caption className="label">Bar hours</caption>
            <tbody>
              {hours.map((h) => (
                <tr key={h.day}><th scope="row">{h.day}</th><td>{h.open}</td></tr>
              ))}
            </tbody>
          </table>
          <Subscribe />
        </section>
      </main>

      <footer className="foot wrap">
        <span className="brand">First Crack</span>
        <span className="muted">Roasting since 2019 · 12 kg per batch · 1 Probat</span>
      </footer>
    </BagProvider>
  );
}
