import type { ClinicConfig } from "./types";

/** Badawi Dental Implant Center — Maadi, Cairo (the original clinic). */
export const badawi: ClinicConfig = {
  slug: "badawi",
  brand: { en: "BDIC", ar: "BDIC" },
  doctorName: { en: "Badawi Dental Implant Center", ar: "مركز بدوي لزراعة الأسنان" },
  role: { en: "Dental Implant Specialists · Maadi, Cairo", ar: "متخصصون في زراعة الأسنان · المعادي، القاهرة" },

  hero: {
    badge: { en: "100% Patient Recommended · Maadi, Cairo", ar: "يوصي به ١٠٠٪ من المرضى · المعادي، القاهرة" },
    title1: { en: "Rebuild Your Smile with", ar: "استعد ابتسامتك مع" },
    title2: { en: "Expert Dental Implants", ar: "خبراء زراعة الأسنان" },
    subtitle: {
      en: "At Badawi Dental Implant Center we replace missing teeth with world-class implant technology — for a confident, natural smile that lasts a lifetime.",
      ar: "في مركز بدوي لزراعة الأسنان نعوّض الأسنان المفقودة بأحدث تقنيات الزراعة العالمية — لابتسامة طبيعية وواثقة تدوم مدى الحياة.",
    },
    photo: "/bdic-logo.jpg",
  },

  about: {
    role: { en: "A Dedicated Dental Implant Center in Cairo", ar: "مركز متخصص في زراعة الأسنان بالقاهرة" },
    bio1: {
      en: "BDIC — Badawi Dental Implant Center is a specialized dental center in Cairo focused on restoring missing teeth with advanced implant techniques and full-mouth rehabilitation.",
      ar: "مركز بدوي لزراعة الأسنان (BDIC) مركز متخصص في القاهرة يهتم بتعويض الأسنان المفقودة بأحدث تقنيات الزراعة وإعادة تأهيل الفم بالكامل.",
    },
    bio2: {
      en: "Our team combines international expertise with modern, fully-sterilized facilities to deliver pain-free treatment and natural-looking results in a calm, welcoming environment.",
      ar: "يجمع فريقنا بين الخبرة الدولية والتجهيزات الحديثة المعقّمة بالكامل لتقديم علاج خالٍ من الألم ونتائج طبيعية في بيئة هادئة ومريحة.",
    },
    point1: { en: "Specialized dental implant experts", ar: "خبراء متخصصون في زراعة الأسنان" },
    point2: { en: "Pain-free, modern techniques", ar: "تقنيات حديثة بلا ألم" },
    point3: { en: "Fully sterilized, modern facility", ar: "تجهيزات حديثة ومعقّمة بالكامل" },
  },

  team: [
    { name: { en: "Dr. Mohamed Badawi", ar: "د. محمد بدوي" }, role: { en: "Founder & Implant Specialist", ar: "المؤسس وأخصائي زراعة الأسنان" }, photo: "/clinic/doctor-badawi.jpg" },
    { name: { en: "BDIC Dental Team", ar: "فريق BDIC الطبي" }, role: { en: "Implant & Cosmetic Dentistry", ar: "زراعة وتجميل الأسنان" }, photo: "/clinic/doctor-2.jpg" },
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
    email: "info@bdic.clinic",
    address: { street: "3/3 El Laselky St.", locality: "Maadi", region: "Cairo", country: "EG", postalCode: "11431" },
    geo: { lat: 29.9602, lng: 31.2569 },
    mapQuery: "Badawi Dental Implant Center El Laselky Maadi Cairo",
    social: [
      "https://www.facebook.com/badawidentalcenter",
      "https://instagram.com/badawi_implant_center",
      "https://wa.me/201222156274",
    ],
  },

  seo: {
    description:
      "Badawi Dental Implant Center (BDIC) — a specialized dental implant center in Maadi, Cairo. Replace missing teeth with world-class implants for a confident, natural smile. Book your appointment today.",
    descriptionAr:
      "مركز بدوي لزراعة الأسنان (BDIC) — مركز متخصص في زراعة الأسنان بالمعادي، القاهرة. عوّض أسنانك المفقودة بأحدث تقنيات الزراعة العالمية لابتسامة طبيعية وواثقة. احجز موعدك اليوم.",
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
  },

  dbFile: "dev.db",
};
