import { PLACE } from "@/content/site";
import { ChapterPlate, Headline } from "./ChapterPlate";

/** 06 — The place: the neighbourhood you keep, with drive/walk times. */
export function PlaceChapter() {
  return (
    <section className="place chapter" id="place" data-chapter="place">
      <picture>
        <source media="(max-width: 800px)" srcSet={PLACE.image.mobile} />
        <img className="place__bg" src={PLACE.image.src} alt={PLACE.image.alt} loading="lazy" decoding="async" />
      </picture>
      <div className="place__shade" />
      <ChapterPlate num={PLACE.plate.num} title={PLACE.plate.title} />
      <div className="place__grid">
        <div>
          <p className="eyebrow place__eyebrow" data-reveal="eyebrow">
            {PLACE.eyebrow}
          </p>
          <Headline lines={PLACE.headline} className="place__title" />
        </div>
        <div className="place__copy">
          <p data-reveal="body">{PLACE.copy}</p>
          <ul className="place__list" data-reveal="list">
            {PLACE.destinations.map((d) => (
              <li key={d.name} className="place__item">
                {d.name}
                <span className="place__time">{d.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="place__line" data-reveal="location">
        <span>{PLACE.locationLine[0]}</span>
        <i />
        <span>{PLACE.locationLine[1]}</span>
        <i />
        <span>{PLACE.locationLine[2]}</span>
      </div>
      <span className="impression">Artist’s impression</span>
    </section>
  );
}
