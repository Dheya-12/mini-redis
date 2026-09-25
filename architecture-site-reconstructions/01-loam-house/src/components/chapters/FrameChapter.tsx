import type { CSSProperties, ReactNode } from "react";
import type { CineChapterData, Figure } from "@/content/site";
import { ChapterPlate, Headline } from "./ChapterPlate";

export function Stat({ figure }: { figure: Figure }) {
  return (
    <div className="stat">
      <strong className="stat__value" data-ticker>
        {figure.value}
      </strong>
      <span className="stat__caption">{figure.label}</span>
    </div>
  );
}

/** Full-bleed render with a desktop and a phone crop. */
export function FrameImage({
  image,
  className = "frame__image",
}: {
  image: CineChapterData["image"];
  className?: string;
}) {
  return (
    <picture>
      {image.mobile ? <source media="(max-width: 800px)" srcSet={image.mobile} /> : null}
      <img
        className={className}
        src={image.src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        style={
          image.mobilePosition
            ? ({ ["--mobile-position" as string]: image.mobilePosition } as CSSProperties)
            : undefined
        }
      />
    </picture>
  );
}

/** One cinematic frame chapter (01–03 and the collection beats). */
export function FrameChapter({
  data,
  tall = false,
  children,
}: {
  data: CineChapterData;
  tall?: boolean;
  children?: ReactNode;
}) {
  const classes = ["frame", "chapter", data.centered && "frame--centered", tall && "frame--tall"]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={classes} id={data.id} data-chapter="frame">
      {data.plate ? <ChapterPlate num={data.plate.num} title={data.plate.title} /> : null}
      <FrameImage image={data.image} />
      <div className="frame__shade" />
      <div className="frame__copy">
        <div className="frame__inner">
          {data.eyebrow ? (
            <p className="eyebrow frame__eyebrow" data-reveal="eyebrow">
              {data.eyebrow}
            </p>
          ) : null}
          <Headline lines={data.headline} className="frame__title" />
          <p className="frame__lede" data-reveal="body">
            {data.lede}
          </p>
          {data.collection ? (
            <div className="stats" data-reveal="stats">
              <div className="stats__label">
                <p className="eyebrow" data-reveal="stats-label">
                  {data.collection.label}
                </p>
              </div>
              {data.collection.figures.map((f) => (
                <Stat key={f.label} figure={f} />
              ))}
            </div>
          ) : null}
          {children}
        </div>
        {data.wideFigures ? (
          <div className="stats stats--wide" data-reveal="stats">
            {data.wideFigures.map((f) => (
              <Stat key={f.label} figure={f} />
            ))}
          </div>
        ) : null}
      </div>
      <span className="impression">Artist’s impression</span>
    </section>
  );
}
