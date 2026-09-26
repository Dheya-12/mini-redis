const MAKES = ['Ford', 'Chevrolet', 'GMC', 'Dodge', 'Jeep', 'Ram', 'Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Tesla', 'Subaru', 'Lexus', 'Cadillac', 'Lincoln'];

export default function Ticker() {
  const items = [...MAKES, ...MAKES];
  return (
    <div className="ticker" aria-label="Makes we service">
      <div className="ticker-track">{items.map((m, i) => <span key={i} aria-hidden={i >= MAKES.length}>{m}</span>)}</div>
    </div>
  );
}
