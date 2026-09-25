/** All page copy and per-chapter data, kept out of the components. */

export const NAV_LINKS = [
  { href: "#proposition", label: "Proposition" },
  { href: "#size", label: "Size" },
  { href: "#storage", label: "Storage" },
  { href: "#finishes", label: "Finishes" },
  { href: "#amenities", label: "Precinct" },
  { href: "#place", label: "Place" },
  { href: "#contact", label: "Contact" },
] as const;

export const WORDMARK = "/assets/loam-house-wordmark.png";

/** Integrations are stubbed in this reconstruction — see DECISIONS.md. */
export const BROCHURE_URL = process.env.NEXT_PUBLIC_BROCHURE_URL || "#";
export const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL || "";

export const HERO = {
  eyebrow: "Final release · Sandringham",
  headline: ["House-sized.", "Bayside living."] as const,
  summary: ["Bayside’s largest apartments.", "86–275m² residences from $850,000."] as const,
  media: {
    introWebm: "/assets/hero-video/hero-skyline-1080.webm",
    introMp4: "/assets/hero-video/hero-skyline-1080.mp4",
    ambientWebm: "/assets/hero-video/hero-ambient-1080.webm",
    ambientMp4: "/assets/hero-video/hero-ambient-1080.mp4",
    poster: "/assets/hero-video/hero-skyline-poster.jpg",
    mobileStill: "/assets/mobile/hero-mobile-still.jpg",
  },
};

export const ENQUIRY = {
  brochure: {
    eyebrow: "The Loam House brochure",
    intro: "Floorplans, finishes and amenities, sent directly to your inbox.",
    send: "Send me the brochure",
    toggle: "Request a call back",
  },
  callback: {
    eyebrow: "Request a call back",
    intro: "Leave your number and we’ll phone you within one business day.",
    send: "Request a call back",
    toggle: "← Just send the brochure",
  },
  /** Copy the brochure mode switches back to after a round trip through call-back mode. */
  brochureIntroReturn: "Floorplans, finishes, amenities and current pricing, sent directly to your inbox.",
  appointment: "Book a private appointment",
  trust: "No spam, no obligation. Your details stay with Auyin.",
  background: { src: "/assets/form_bg2.jpg", mobile: "/assets/mobile/form_bg2.jpg" },
  error:
    "Something went wrong sending your details. Please call Leone Steele on 0422 299 202 or Edwina Smith on 0497 126 202, and we’ll look after you directly.",
};

export type Figure = { value: string; label: string };

export type CineChapterData = {
  id?: string;
  plate?: { num: string; title: string };
  image: { src: string; mobile?: string; alt: string; mobilePosition?: string };
  eyebrow?: string;
  headline: [string, string];
  lede: string;
  /** Stat block below the copy column (spans the full content width). */
  wideFigures?: Figure[];
  /** Stat block inside the copy column, with its own collection label. */
  collection?: { label: string; figures: Figure[] };
  centered?: boolean;
};

const img = (name: string) => ({ src: `/assets/${name}`, mobile: `/assets/mobile/${name}` });

export const CINE_CHAPTERS: CineChapterData[] = [
  {
    id: "proposition",
    plate: { num: "01", title: "The proposition" },
    image: { ...img("EXT_Terrace.jpg"), alt: "A private penthouse terrace overlooking leafy Bayside", mobilePosition: "36% center" },
    eyebrow: "A rare final release",
    headline: ["Leave the upkeep.", "Keep the life."],
    lede: "Loam House is made for people who have outgrown the maintenance, not the space. House-sized, single-level residences in the Bayside neighbourhood you already call home.",
    wideFigures: [
      { value: "88", label: "Residences" },
      { value: "86–275", label: "Square metres" },
      { value: "3 min", label: "Drive to the beach" },
    ],
  },
  {
    id: "size",
    plate: { num: "02", title: "The size" },
    image: { ...img("INT03_Courtyard-Living-Dining.jpg"), alt: "Ground-floor living opening to a private landscaped courtyard" },
    headline: ["A backyard oasis,", "without the mowing."],
    lede: "Two and three bedroom ground-floor homes opening to landscaped courtyards, with up to 154 square metres of private outdoor space.",
    collection: {
      label: "Garden apartments",
      figures: [
        { value: "112–156", label: "Internal m²" },
        { value: "2–3", label: "Bedrooms" },
      ],
    },
  },
  {
    image: { ...img("INT04_Kitchen-Light.jpg"), alt: "Light-filled kitchen and living of a lifestyle apartment" },
    headline: ["Everything you need.", "Nothing you don’t."],
    lede: "Light-filled two and three bedroom apartments with room-by-room storage and generous balcony living, and a study nook in select homes.",
    collection: {
      label: "Lifestyle collection",
      figures: [
        { value: "103–162", label: "Internal m²" },
        { value: "2–3", label: "Bedrooms" },
      ],
    },
  },
  {
    image: { ...img("INT01_Penthouse-Living.jpg"), alt: "Penthouse living with panoramic city views" },
    headline: ["Above the treetops.", "Beyond expectation."],
    lede: "Panoramic city views, stone fireplaces, travertine kitchens and bathrooms, butler’s pantries and expansive entertainer’s terraces.",
    collection: {
      label: "Penthouse collection",
      figures: [{ value: "246.5–275", label: "Internal m²" }],
    },
  },
  {
    id: "storage",
    plate: { num: "03", title: "The storage" },
    image: { ...img("INT_Storage.jpg"), alt: "Bespoke walk-in dressing and storage room" },
    eyebrow: "Keep your things",
    headline: ["A place for", "everything."],
    lede: "Walk-in robes, full-height linen and generous joinery, secure caged storage beside your car, and private lock-up garages for the penthouses. Somewhere for everything.",
    centered: true,
  },
];

export const FINISHES = {
  plate: { num: "04", title: "The finishes" },
  image: { ...img("INT05_Bathroom-Light.jpg"), alt: "Bathroom in the light finish palette", mobilePosition: "70% center" },
  eyebrow: "Tactile by nature",
  headline: ["Details you feel", "before you notice."] as [string, string],
  lede: "Integrated Miele appliances, stone benchtops, full-height tiling and custom joinery, in a light palette curated room by room.",
  tags: [
    { label: "Full-height tiling", ...img("finishes/tiling.jpg") },
    { label: "Custom joinery", ...img("finishes/joinery.jpg") },
    { label: "Stone", ...img("finishes/stone.jpg") },
  ],
};

export const PRECINCT = {
  plate: { num: "05", title: "The precinct" },
  eyebrow: "Keep your community",
  headline: ["A lifestyle", "already alive."] as [string, string],
  lede: "Beautifully curated shared spaces for residents to use. Each dot on the plan is one of them. Take a look.",
};

export const PLACE = {
  plate: { num: "06", title: "The place" },
  image: { ...img("place-bayside.jpg"), alt: "Sandringham rolling down to Port Phillip Bay at golden hour" },
  eyebrow: "Keep your neighbourhood",
  headline: ["Your life,", "still yours."] as [string, string],
  copy: "Keep your GP, your café, your tennis club and the grandchildren’s school run. Three minutes’ drive from the water, sixteen kilometres from the CBD.",
  destinations: [
    { name: "Sandringham Beach & Bay Trail", time: "3 min drive" },
    { name: "Sandringham Village & Station", time: "3 min drive" },
    { name: "Royal Melbourne & Sandringham Golf", time: "4 min drive" },
    { name: "Westfield Southland", time: "6 min drive" },
    { name: "Schools & Colleges", time: "7 min walk" },
  ],
  locationLine: ["LOAM HOUSE", "03 MIN DRIVE", "THE BAY"],
};

export const CONTACT = {
  image: { ...img("COM03_Office.jpg"), alt: "Loam House residents business lounge" },
  eyebrow: "Speak with the team",
  headline: ["Register your", "interest."] as [string, string],
  steps: ["You", "Reach you", "Enquiry"],
  enquiryTypes: ["General enquiry", "Pricing & availability", "Floorplans", "Private appointment"],
  agents: [
    { name: "Leone Steele", phone: "0422 299 202", tel: "+61422299202" },
    { name: "Edwina Smith", phone: "0497 126 202", tel: "+61497126202" },
  ],
  error:
    "Something went wrong sending your enquiry. Please call Leone Steele on 0422 299 202 or Edwina Smith on 0497 126 202, and we’ll look after you directly.",
};

export const FOOTER = {
  displaySuite: ["Display Suite", "216B Bay Road, Sandringham VIC 3191"],
  release: ["Final release by Auyin", "© 2026 Loam House"],
};
