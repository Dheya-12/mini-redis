/** Chapter plate: the serif numeral over the caps title, each masked for its reveal. */
export function ChapterPlate({ num, title }: { num: string; title: string }) {
  return (
    <div className="plate">
      <span className="plate__mask">
        <span className="plate__num" data-reveal="plate-num">
          {num}
        </span>
      </span>
      <span className="plate__mask">
        <span className="plate__title" data-reveal="plate-title">
          {title}
        </span>
      </span>
    </div>
  );
}

/** The two-line display headline: a roman line over an italic line. */
export function Headline({
  lines,
  className,
  role = "heading",
  as: Tag = "h2",
}: {
  lines: readonly [string, string];
  className?: string;
  role?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag className={className} data-reveal={role}>
      {lines[0]}
      <br />
      <em>{lines[1]}</em>
    </Tag>
  );
}
