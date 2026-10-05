export type Coffee = {
  id: string;
  name: string;
  origin: string;
  producer: string;
  process: string;
  variety: string;
  altitude: string;
  notes: string[];
  score: number | null;
  roast: string;
  price: number;
  weight: string;
};

export const coffees: Coffee[] = [
  {
    id: "kii",
    name: "Kii AA",
    origin: "Kirinyaga, Kenya",
    producer: "Rungeto Farmers' Co-op",
    process: "Washed",
    variety: "SL28 · SL34",
    altitude: "1,700–1,900",
    notes: ["Blackcurrant", "Pink grapefruit", "Cane sugar"],
    score: 88.5,
    roast: "Light",
    price: 24,
    weight: "250 g",
  },
  {
    id: "la-loma",
    name: "La Loma",
    origin: "Huila, Colombia",
    producer: "Yeimi Ortiz",
    process: "Washed, 72 h ferment",
    variety: "Pink Bourbon",
    altitude: "1,850",
    notes: ["Rhubarb", "Rose", "Lime zest"],
    score: 87.75,
    roast: "Light",
    price: 22,
    weight: "250 g",
  },
  {
    id: "halo-beriti",
    name: "Halo Beriti",
    origin: "Gedeb, Ethiopia",
    producer: "Halo Beriti washing station",
    process: "Natural, raised beds",
    variety: "Ethiopian landrace",
    altitude: "2,100",
    notes: ["Strawberry jam", "Jasmine", "Cacao nib"],
    score: 88,
    roast: "Light–medium",
    price: 23,
    weight: "250 g",
  },
  {
    id: "night-shift",
    name: "Night Shift",
    origin: "Brazil · Guatemala",
    producer: "House espresso blend",
    process: "Natural + washed",
    variety: "Yellow Catuaí · Caturra",
    altitude: "1,150–1,700",
    notes: ["Dark chocolate", "Hazelnut", "Blood orange"],
    score: null,
    roast: "Medium",
    price: 18,
    weight: "250 g",
  },
];

export type Drink = { name: string; spec: string; price: string; note?: string };

export const bar: { group: string; items: Drink[] }[] = [
  {
    group: "Espresso",
    items: [
      { name: "Espresso", spec: "18 g in · 38 g out · 28 s", price: "4.00" },
      { name: "Cortado", spec: "Double shot · 60 ml milk", price: "4.50" },
      { name: "Flat white", spec: "Double ristretto · 150 ml", price: "5.00" },
      { name: "Cappuccino", spec: "Double shot · 180 ml", price: "5.25" },
    ],
  },
  {
    group: "Filter",
    items: [
      { name: "V60 pour-over", spec: "1 : 16 · 94 °C · 3:10", price: "5.50", note: "Any single origin" },
      { name: "Batch brew", spec: "1 : 17 · brewed every 40 min", price: "3.50" },
      { name: "Cold brew", spec: "1 : 8 concentrate · 18 h steep", price: "5.00" },
    ],
  },
  {
    group: "From the bar",
    items: [
      { name: "First Crack tonic", spec: "Espresso · demerara · orange peel · tonic", price: "6.50", note: "House signature" },
      { name: "Cascara fizz", spec: "Dried coffee cherry tea · soda · lemon", price: "5.50" },
      { name: "Cupping flight", spec: "Three origins · 90 ml each", price: "9.00" },
    ],
  },
];

export type Method = { id: string; name: string; ratio: number; temp: number; grind: string; time: string; bloom: boolean };

export const methods: Method[] = [
  { id: "v60", name: "V60", ratio: 16, temp: 94, grind: "Medium-fine, like table salt", time: "3:00–3:30", bloom: true },
  { id: "chemex", name: "Chemex", ratio: 15, temp: 95, grind: "Medium-coarse, like kosher salt", time: "4:00–4:30", bloom: true },
  { id: "press", name: "French press", ratio: 14, temp: 96, grind: "Coarse, like raw sugar", time: "4:00 steep", bloom: false },
  { id: "aeropress", name: "AeroPress", ratio: 13, temp: 88, grind: "Fine, like caster sugar", time: "1:45 total", bloom: true },
];

export const hours: { day: string; open: string }[] = [
  { day: "Monday – Friday", open: "07:00 – 17:00" },
  { day: "Saturday", open: "08:00 – 17:00" },
  { day: "Sunday", open: "08:00 – 15:00" },
];
