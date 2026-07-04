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
    /** Hero cutout photo (public path). */
    photo: string;
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
