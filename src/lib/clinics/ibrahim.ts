import type { ClinicConfig } from "./types";

/** Dr. Ibrahim Salah — Consultant Cosmetic Dentist. */
export const ibrahim: ClinicConfig = {
  slug: "ibrahim",
  brand: { en: "Dr. Ibrahim Salah", ar: "د. إبراهيم صلاح" },
  doctorName: { en: "Dr. Ibrahim Salah", ar: "د. إبراهيم صلاح" },
  role: { en: "Consultant Cosmetic Dentist", ar: "استشاري تجميل الأسنان" },

  hero: {
    badge: { en: "100% Patient Recommended · Cosmetic Dentistry", ar: "يوصي به ١٠٠٪ من المرضى · تجميل الأسنان" },
    title1: { en: "Craft Your Perfect Smile with", ar: "اصنع ابتسامتك المثالية مع" },
    title2: { en: "Expert Cosmetic Dentistry", ar: "خبرة تجميل الأسنان" },
    subtitle: {
      en: "Consultant cosmetic dentist crafting natural, confident smiles — veneers, implants and complete smile makeovers with a gentle, precise touch.",
      ar: "استشاري تجميل الأسنان — نصمّم لك ابتسامة طبيعية وواثقة بالعدسات والزراعة وتجميل الابتسامة الكامل بلمسة دقيقة ولطيفة.",
    },
    photo: "/doctor-ibrahim.png",
  },

  about: {
    role: { en: "Consultant Cosmetic Dentist", ar: "استشاري تجميل الأسنان" },
    bio1: {
      en: "Dr. Ibrahim Salah is a consultant cosmetic dentist dedicated to crafting natural, confident smiles — from porcelain veneers and smile design to dental implants and full-mouth rehabilitation.",
      ar: "د. إبراهيم صلاح استشاري تجميل الأسنان، متخصص في تصميم الابتسامات الطبيعية والواثقة — من عدسات البورسلين وتصميم الابتسامة إلى زراعة الأسنان وإعادة تأهيل الفم بالكامل.",
    },
    bio2: {
      en: "Combining international expertise with modern, fully-sterilized facilities, he delivers pain-free treatment and natural-looking results in a calm, welcoming environment.",
      ar: "يجمع بين الخبرة الدولية والتجهيزات الحديثة المعقّمة بالكامل لتقديم علاج خالٍ من الألم ونتائج طبيعية في بيئة هادئة ومريحة.",
    },
    point1: { en: "Cosmetic & smile-design expert", ar: "خبير تجميل وتصميم الابتسامة" },
    point2: { en: "Pain-free, modern techniques", ar: "تقنيات حديثة بلا ألم" },
    point3: { en: "Fully sterilized, modern clinic", ar: "عيادة حديثة ومعقّمة بالكامل" },
  },

  team: [
    { name: { en: "Dr. Ibrahim Salah", ar: "د. إبراهيم صلاح" }, role: { en: "Consultant Cosmetic Dentist", ar: "استشاري تجميل الأسنان" }, photo: "/doctor-ibrahim.png" },
    { name: { en: "Clinical Team", ar: "الفريق الطبي" }, role: { en: "Cosmetic & Restorative Dentistry", ar: "تجميل وترميم الأسنان" }, photo: "/clinic/doctor-2.jpg" },
  ],

  theme: {
    primary: "#a87f2b",
    primaryDark: "#876419",
    accent: "#d9b659",
    background: "#f7f5f1",
    surface: "#ffffff",
    surface2: "#f1ece3",
  },

  contact: {
    phone: "+201222156274",
    phoneDisplay: "+20 122 215 6274",
    whatsapp: "201222156274",
    email: "info@dribrahimsalah.clinic",
    address: { street: "", locality: "Cairo", region: "Cairo", country: "EG", postalCode: "" },
    geo: { lat: 30.0444, lng: 31.2357 },
    mapQuery: "Dr Ibrahim Salah Dental Clinic Cairo",
    social: [],
  },

  seo: {
    description:
      "Dr. Ibrahim Salah — consultant cosmetic dentist. Veneers, dental implants, orthodontics and complete smile makeovers for a confident, natural smile. Book your appointment today.",
    descriptionAr:
      "د. إبراهيم صلاح — استشاري تجميل الأسنان. عدسات، زراعة أسنان، تقويم، وتجميل الابتسامة الكامل لابتسامة طبيعية وواثقة. احجز موعدك اليوم.",
    keywords: [
      "cosmetic dentist Cairo",
      "veneers Egypt",
      "Hollywood smile Cairo",
      "dental implants Egypt",
      "Dr Ibrahim Salah",
      "تجميل الأسنان",
      "عدسات الأسنان",
      "ابتسامة هوليوود",
      "زراعة الأسنان",
      "دكتور اسنان القاهرة",
    ],
  },

  dbFile: "ibrahim.db",
};
