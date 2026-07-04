/**
 * Single source of truth for clinic identity used by SEO (metadata, JSON-LD,
 * sitemap, Open Graph) and anywhere else that needs canonical business data.
 * Keep this in sync with the visible content in `content.ts`.
 */

export const site = {
  name: "Dr. Ibrahim Salah",
  shortName: "Dr. Ibrahim Salah",
  nameAr: "د. إبراهيم صلاح",
  /** Public base URL — override per environment via NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "http://localhost:3000",
  description:
    "Dr. Ibrahim Salah — consultant cosmetic dentist. Veneers, dental implants, orthodontics and complete smile makeovers for a confident, natural smile. Book your appointment today.",
  descriptionAr:
    "د. إبراهيم صلاح — استشاري تجميل الأسنان. عدسات، زراعة أسنان، تقويم، وتجميل الابتسامة الكامل لابتسامة طبيعية وواثقة. احجز موعدك اليوم.",
  locale: "en_US",
  localeAlt: "ar_EG",
  keywords: [
    "dental implants Cairo",
    "dentist Maadi",
    "Badawi Dental",
    "Hollywood smile Egypt",
    "teeth whitening Cairo",
    "orthodontics Maadi",
    "زراعة الأسنان",
    "طبيب أسنان المعادي",
    "ابتسامة هوليوود",
    "مركز أسنان القاهرة",
  ],
  phone: "+201222156274",
  phoneDisplay: "+20 122 215 6274",
  /**
   * WhatsApp number patients message to confirm/book (digits only, no +).
   * Set NEXT_PUBLIC_CLINIC_WHATSAPP to the dedicated bot number once you have it;
   * falls back to the main line until then.
   */
  whatsapp: process.env.NEXT_PUBLIC_CLINIC_WHATSAPP || "201222156274",
  email: "info@bdic.clinic",
  address: {
    street: "3/3 El Laselky St.",
    locality: "Maadi",
    region: "Cairo",
    country: "EG",
    postalCode: "11431",
  },
  /** Approximate geo for Maadi, Cairo (update with exact clinic coordinates). */
  geo: { lat: 29.9602, lng: 31.2569 },
  /** Sat–Thu 12:00–22:00 (Friday closed). */
  openingHours: [
    {
      days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "12:00",
      closes: "22:00",
    },
  ],
  priceRange: "$$",
  logo: "/bdic-logo.jpg",
  ogImage: "/opengraph-image",
  social: [
    "https://www.facebook.com/badawidentalcenter",
    "https://instagram.com/badawi_implant_center",
    "https://wa.me/201222156274",
  ],
  services: [
    "Dental Implants",
    "Hollywood Smile / Veneers",
    "Orthodontics",
    "Teeth Whitening",
    "Root Canal Treatment",
    "Crowns & Bridges",
    "Pediatric Dentistry",
    "Full-Mouth Rehabilitation",
  ],
} as const;

/**
 * Build a wa.me link that opens WhatsApp with a prefilled message FROM the
 * customer TO the clinic. This is the "free trick": because the customer sends
 * the first message, it opens WhatsApp's free 24-hour service window, so the
 * clinic's confirmation reply costs nothing on the official Meta Cloud API.
 */
export function confirmOnWhatsAppLink(opts: { code?: string | null; lang: "ar" | "en"; service?: string; when?: string }): string {
  const { code, lang, service, when } = opts;
  const text =
    lang === "ar"
      ? `مرحبًا، أريد تأكيد حجزي في ${site.nameAr}` +
        (service ? `\nالخدمة: ${service}` : "") +
        (when ? `\nالموعد: ${when}` : "") +
        (code ? `\nكود الحجز: ${code}` : "")
      : `Hi, I'd like to confirm my booking at ${site.name}` +
        (service ? `\nService: ${service}` : "") +
        (when ? `\nWhen: ${when}` : "") +
        (code ? `\nBooking code: ${code}` : "");
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

/** Build the schema.org JSON-LD for the clinic (Dentist + LocalBusiness). */
export function clinicJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": `${site.url}/#clinic`,
    name: site.name,
    alternateName: site.nameAr,
    description: site.description,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    image: `${site.url}${site.logo}`,
    logo: `${site.url}${site.logo}`,
    priceRange: site.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.lat,
      longitude: site.geo.lng,
    },
    openingHoursSpecification: site.openingHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    sameAs: site.social,
    areaServed: { "@type": "City", name: "Cairo" },
    makesOffer: site.services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s },
    })),
  };
}
