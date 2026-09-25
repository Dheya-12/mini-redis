/**
 * Cartography for the precinct map chapter.
 *
 * Two coordinate spaces are in play:
 *  - "plan" units: the precinct site plan (precinct_clean.svg), where the amenity dots
 *    and building labels live;
 *  - "area" units: the neighbourhood map (area_clean.svg), where roads, suburbs,
 *    stations and landmarks live.
 * The plan is placed onto the area map by PLAN_PLACEMENT (translate · scale · rotate).
 */

export const PLAN_PLACEMENT = { tx: 823.2, ty: 325.5, scale: 0.08, rotate: 10, pivotX: 730, pivotY: 470 };
/** Plan-space y above which the plan is cropped (its own road band). */
export const PLAN_CLIP = { x: 500, top: 170, width: 700, bottom: 830 };
export const DOT_RADIUS = 10; // plan units
export const AMENITY_COLOR = "#7a3b26";

export type AmenityCategory = "landscape" | "social" | "leisure" | "wellness" | "work" | "services";
export const CATEGORY_LABEL: Record<AmenityCategory, string> = {
  landscape: "Landscape",
  social: "Social",
  leisure: "Leisure",
  wellness: "Wellness",
  work: "Work",
  services: "Services",
};

export type Amenity = { id: string; name: string; category: AmenityCategory; x: number; y: number; blurb: string };

export const AMENITIES: Amenity[] = [
  { id: "01", name: "Landscaped Gardens", category: "landscape", x: 903.6, y: 596.0, blurb: "Curated native gardens that shift with the seasons, threaded through the precinct." },
  { id: "02", name: "Fire Pits", category: "social", x: 896.9, y: 511.6, blurb: "Gather close as the evening cools — open flame beneath open sky." },
  { id: "03", name: "Barbeques", category: "social", x: 884.0, y: 681.6, blurb: "Alfresco kitchens made for long lunches and easy entertaining." },
  { id: "04", name: "Resident Dining Room", category: "social", x: 866.7, y: 715.1, blurb: "A private dining room for the dinners too large for your own table." },
  { id: "05", name: "Terrace", category: "landscape", x: 857.2, y: 681.5, blurb: "An elevated outdoor room for morning coffee and golden-hour drinks." },
  { id: "06", name: "Wine Room", category: "social", x: 841.0, y: 715.1, blurb: "Temperature-controlled cellaring and a table made for tasting." },
  { id: "07", name: "Movie Room", category: "leisure", x: 872.2, y: 748.4, blurb: "Plush, dim and yours to book — cinema without leaving home." },
  { id: "08", name: "Work Space", category: "work", x: 820.8, y: 701.1, blurb: "Quiet desks and meeting nooks for the days you work from here." },
  { id: "09", name: "The Retreat", category: "wellness", x: 965.1, y: 505.0, blurb: "A calm sanctuary to slow down, stretch out and reset." },
  { id: "10", name: "Car and Dog Wash", category: "services", x: 748.1, y: 673.6, blurb: "A bay for the car and a bath for the dog — the practical made effortless." },
  { id: "11", name: "Multipurpose Gym", category: "wellness", x: 758.7, y: 264.9, blurb: "A fully-equipped gym downstairs, open whenever you are." },
  { id: "12", name: "Golf Simulator", category: "leisure", x: 767.2, y: 294.0, blurb: "Play St Andrews before breakfast on a full-swing simulator." },
  { id: "13", name: "Business Centre", category: "work", x: 809.7, y: 267.7, blurb: "A boardroom and private offices for when work gets serious." },
];

export type MultiLineLabel = { lines: string[]; x: number; y: number };

/** Building names on the plan (plan units). */
export const BUILDINGS: (MultiLineLabel & { name: string })[] = [
  { name: "Loam House", lines: ["LOAM", "HOUSE"], x: 796, y: 468 },
  { name: "Pavilion Green", lines: ["PAVILION", "GREEN"], x: 995, y: 467 },
  { name: "Sea & Sky", lines: ["SEA & SKY"], x: 935, y: 712 },
];

/** The building an amenity sits in: the nearest building label. */
export function buildingFor(a: Pick<Amenity, "x" | "y">): string {
  let best = BUILDINGS[0];
  for (const b of BUILDINGS) {
    if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (a.x - best.x) ** 2 + (a.y - best.y) ** 2) best = b;
  }
  return best.name;
}

/* ── neighbourhood layer (area units) ── */

export const SUBURBS: MultiLineLabel[] = [
  { lines: ["BRIGHTON"], x: 780.6, y: 51.7 },
  { lines: ["HAMPTON"], x: 808.4, y: 143.2 },
  { lines: ["HAMPTON", "EAST"], x: 955.0, y: 131.4 },
  { lines: ["SANDRINGHAM"], x: 811.7, y: 267.9 },
  { lines: ["BLACK ROCK"], x: 894.2, y: 555.7 },
  { lines: ["PORT PHILLIP BAY"], x: 690.8, y: 663.6 },
  { lines: ["BEAUMARIS"], x: 1032.2, y: 695.6 },
];

export const LANDMARKS: MultiLineLabel[] = [
  { lines: ["Brighton Public", "Golf Course"], x: 840.4, y: 14.4 },
  { lines: ["Dendy", "Park"], x: 902.4, y: 21.4 },
  { lines: ["Castlefield", "Reserve"], x: 782.8, y: 90.2 },
  { lines: ["R. J. Sillitoe", "Reserve"], x: 861.3, y: 104.4 },
  { lines: ["Hampton", "Beach"], x: 630.2, y: 159.3 },
  { lines: ["Moorabbin", "Baseball Club"], x: 934.6, y: 168.4 },
  { lines: ["Basterfield", "Park"], x: 973.7, y: 193.9 },
  { lines: ["Thomas Street", "South Reserve"], x: 845.1, y: 208.5 },
  { lines: ["Sandringham", "Dog Beach"], x: 656.3, y: 225.4 },
  { lines: ["Sandringham", "Yacht Club"], x: 626.0, y: 262.4 },
  { lines: ["Bay Road", "Reserve"], x: 942.1, y: 357.5 },
  { lines: ["Red Bluff Cliffs", "and Lookout"], x: 749.4, y: 456.1 },
  { lines: ["Sandringham", "Golf Course"], x: 945.7, y: 471.8 },
  { lines: ["Victoria", "Golf Course"], x: 1086.6, y: 471.8 },
  { lines: ["Half Moon", "Bay"], x: 754.8, y: 500.4 },
  { lines: ["Royal Melbourne", "Golf Course"], x: 945.7, y: 515.6 },
  { lines: ["Ricketts Point", "Marine Sanctuary"], x: 891.8, y: 776.6 },
];

export const ROAD_NAMES: { name: string; x: number; y: number }[] = [
  { name: "Hampton Street", x: 734.3, y: 28.0 },
  { name: "Were Street", x: 687.4, y: 27.0 },
  { name: "South Road", x: 790.3, y: 75.1 },
  { name: "Jasper Road", x: 1041.2, y: 78.7 },
  { name: "Tucker Road", x: 1122.4, y: 93.5 },
  { name: "Ludstone Street", x: 756.7, y: 111.9 },
  { name: "Boundary Road", x: 1176.3, y: 178.3 },
  { name: "Thomas Street", x: 845.1, y: 208.5 },
  { name: "Wickham Road", x: 977.9, y: 228.3 },
  { name: "Highett Road", x: 975.0, y: 266.8 },
  { name: "Route 822", x: 797.7, y: 314.7 },
  { name: "Nepean Hwy", x: 1111.2, y: 315.7 },
  { name: "Route 822", x: 1017.4, y: 349.7 },
  { name: "Beach Road", x: 763.2, y: 356.8 },
  { name: "Bay Road", x: 941.0, y: 343.0 },
  { name: "Bay Road", x: 1091.5, y: 372.9 },
  { name: "Tulip Street", x: 949.2, y: 438.5 },
  { name: "Park Road", x: 1084.5, y: 450.1 },
  { name: "Bluff Road", x: 844.8, y: 509.9 },
  { name: "Weatherall Road", x: 1081.6, y: 530.0 },
  { name: "Cherterville Road", x: 1157.6, y: 583.7 },
  { name: "Balcombe Road", x: 910.3, y: 588.0 },
  { name: "Cromer Road", x: 1088.3, y: 651.7 },
  { name: "Reserve Road", x: 974.1, y: 724.8 },
];

export const STATIONS: { name: string; x: number; y: number }[] = [
  { name: "Brighton Beach", x: 606.1, y: 31.6 },
  { name: "Hampton", x: 713.8, y: 164.5 },
  { name: "Sandringham", x: 734.4, y: 302.1 },
  { name: "Patterson", x: 1008.5, y: 27.8 },
  { name: "Moorabbin", x: 1019.6, y: 125.1 },
  { name: "Highett", x: 1063.8, y: 280.5 },
];

export const BUS_STOPS: { name: string; x: number; y: number }[] = [
  { name: "Sandringham Station", x: 798.5, y: 325.0 },
  { name: "Bay Road", x: 1017.4, y: 360.7 },
];

export const STATION_RADIUS = 4.5;
export const BUS_STOP_RADIUS = 5.15;
