/**
 * Per-clinic configuration. Everything that differs between clinics lives here:
 * branding, hero copy, the doctor(s), theme colours, contact details, SEO and
 * the database file. Generic UI (service list, nav labels, section structure,
 * dashboard, API routes, the WhatsApp bot) is SHARED across every clinic.
 *
 * A new clinic = a new ClinicConfig (+ its own assets and database). The active
 * clinic is chosen once per deployment via the CLINIC / NEXT_PUBLIC_CLINIC env
 * var — so splitting each clinic onto its own host/domain needs zero code change.
 */
export type Bi = { en: string; ar: string };

export type ClinicTheme = {
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  surface2: string;
};

export type ClinicTeamMember = {
  name: Bi;
  role: Bi;
  photo: string;
};

/** A single cutout figure in the hero stage (a team member or the solo doctor). */
export type ClinicHeroFigure = {
  photo: string;
  name?: Bi;
  role?: Bi;
};

/**
 * One before/after showcase item. Grid galleries use a single combined `src`
 * image (tap to open in a lightbox); slider galleries use separate `before` +
 * `after` images (drag-to-compare).
 */
export type GalleryCase = {
  src?: string;
  before?: string;
  after?: string;
  title: Bi;
  tag: Bi;
};

export type ClinicGallery = {
  /** "grid" = before/after cards + lightbox; "slider" = drag-to-compare handle. */
  style: "grid" | "slider";
  headline: Bi;
  subtitle: Bi;
  cases: GalleryCase[];
};

export type ClinicConfig = {
  /** URL-safe id, also the default database file name (e.g. "badawi"). */
  slug: string;

  /** Short brand shown in the navbar/footer/dashboard. */
  brand: Bi;
  /** Full doctor/clinic name shown in the hero. */
  doctorName: Bi;
  role: Bi;

  hero: {
    badge: Bi;
    title1: Bi;
    title2: Bi;
    subtitle: Bi;
    /** Solo hero cutout photo (public path). Used when `lineup` is empty. */
    photo: string;
    /** Optional multi-figure cutout lineup (e.g. the whole team). When present,
     *  the hero shows these figures instead of the single `photo`. */
    lineup?: ClinicHeroFigure[];
    /** Pill label for an active lineup figure that has no explicit name. */
    lineupLabel?: Bi;
    /** Small hint line shown beneath the hero figure(s). */
    tagline?: Bi;
  };

  about: {
    role: Bi;
    bio1: Bi;
    bio2: Bi;
    point1: Bi;
    point2: Bi;
    point3: Bi;
  };

  team: ClinicTeamMember[];

  /** Before/After results section (grid of cases or drag-to-compare sliders). */
  gallery: ClinicGallery;

  theme: ClinicTheme;

  contact: {
    phone: string; // E.164, e.g. +2012...
    phoneDisplay: string;
    /** WhatsApp number, digits only (no +). Drives the booking bot + wa.me links. */
    whatsapp: string;
    email: string;
    address: { street: string; locality: string; region: string; country: string; postalCode: string };
    geo: { lat: number; lng: number };
    /** Google-Maps search query for the directions link. */
    mapQuery: string;
    social: string[];
  };

  seo: {
    description: string;
    descriptionAr: string;
    keywords: string[];
  };

  /** SQLite database file name under prisma/ (defaults to `${slug}.db`). */
  dbFile: string;
};
