import type { ClinicConfig } from "./types";

/**
 * Dental Center of Egypt — Heliopolis, Cairo.
 * Founded 1987 by Dr. Medhat Basseem; one of Egypt's largest specialized dental
 * centers — 20 specialized clinics covering every branch of dentistry plus a
 * dedicated pediatric wing. Clinic-first (center) branding.
 *
 * NOTE: hero lineup / gallery / team currently reuse shared placeholder imagery.
 * Swap for real Dental Center of Egypt photos + logo when the client provides them
 * (drop them under public/dce/ and point the paths here).
 */
export const dce: ClinicConfig = {
  slug: "dce",
  brand: { en: "Dental Center of Egypt", ar: "دينتال سنتر أوف إيجيبت" },
  doctorName: { en: "Dental Center of Egypt", ar: "دينتال سنتر أوف إيجيبت" },
  role: {
    en: "Comprehensive Dental Care Since 1987 · Heliopolis, Cairo",
    ar: "رعاية أسنان متكاملة منذ عام ١٩٨٧ · مصر الجديدة، القاهرة",
  },

  hero: {
    badge: {
      en: "20 Specialized Clinics · Trusted Since 1987",
      ar: "٢٠ عيادة متخصصة · ثقة منذ عام ١٩٨٧",
    },
    title1: { en: "We Build Trust Before Any Treatment at", ar: "نبني الثقة قبل أي علاج في" },
    title2: { en: "Dental Center of Egypt", ar: "دينتال سنتر أوف إيجيبت" },
    subtitle: {
      en: "Egypt's largest specialized dental center — 20 fully-equipped clinics and a dedicated pediatric wing, led by Dr. Medhat Basseem. From EMax veneers and implants to clear aligners and whitening, we craft smiles that last.",
      ar: "أكبر مركز أسنان متخصص في مصر — ٢٠ عيادة مجهزة بالكامل وجناح مخصص لأسنان الأطفال، بقيادة د. مدحت بسيم. من عدسات الإيماكس والزراعة إلى التقويم الشفاف والتبييض، نرسم ابتسامات تدوم.",
    },
    photo: "/clinic/doctor-2.jpg",
    lineup: [
      { photo: "/clinic/team/person-1.png", name: { en: "Cosmetic & Veneers", ar: "تجميل وعدسات" }, role: { en: "EMax · Hollywood Smile", ar: "إيماكس · ابتسامة هوليوود" } },
      { photo: "/clinic/team/person-3.png", name: { en: "Implantology", ar: "زراعة الأسنان" }, role: { en: "Implants · Full-Mouth", ar: "زراعة · ترميم كامل" } },
      { photo: "/clinic/team/person-5.png", name: { en: "Orthodontics", ar: "تقويم الأسنان" }, role: { en: "Clear Aligners", ar: "تقويم شفاف" } },
      { photo: "/clinic/team/person-2.png", name: { en: "Pediatric Dentistry", ar: "أسنان الأطفال" }, role: { en: "Dedicated Kids Wing", ar: "جناح مخصص للأطفال" } },
    ],
    lineupLabel: { en: "Our Specialists", ar: "نخبة المتخصصين" },
    tagline: {
      en: "20 specialized clinics under one roof — a specialist for every smile",
      ar: "٢٠ عيادة متخصصة تحت سقف واحد — متخصص لكل ابتسامة",
    },
    stats: [
      { value: "39", label: { en: "Years of Trust", ar: "عامًا من الثقة" } },
      { value: "20", label: { en: "Specialized Clinics", ar: "عيادة متخصصة" } },
      { value: "50K+", label: { en: "Happy Patients", ar: "مريض سعيد" } },
    ],
    video: { src: "/clinic/videos/case-video-1.mp4", poster: "/clinic/smile-1.jpg" },
  },

  about: {
    role: { en: "Egypt's Largest Specialized Dental Center", ar: "أكبر مركز أسنان متخصص في مصر" },
    bio1: {
      en: "Founded in 1987 by Dr. Medhat Basseem, Dental Center of Egypt has grown into one of the country's largest and most trusted dental destinations — 20 specialized clinics covering every branch of dentistry, plus a dedicated wing for children.",
      ar: "تأسس مركز دينتال سنتر أوف إيجيبت عام ١٩٨٧ على يد د. مدحت بسيم، وأصبح واحدًا من أكبر وأوثق مراكز الأسنان في مصر — ٢٠ عيادة متخصصة تغطي جميع فروع طب الأسنان، بالإضافة إلى جناح مخصص للأطفال.",
    },
    bio2: {
      en: "For nearly four decades we've built trust before any treatment — combining experienced consultants, modern fully-sterilized technology and a warm, welcoming environment to craft natural smiles that last a lifetime.",
      ar: "على مدى أربعة عقود تقريبًا، نبني الثقة قبل أي علاج — نجمع بين نخبة من الاستشاريين وأحدث التقنيات المعقّمة بالكامل وبيئة دافئة ومريحة لنرسم ابتسامات طبيعية تدوم مدى الحياة.",
    },
    point1: { en: "20 specialized clinics — all branches of dentistry", ar: "٢٠ عيادة متخصصة — كل فروع طب الأسنان" },
    point2: { en: "Dedicated pediatric-dentistry wing", ar: "جناح مخصص لطب أسنان الأطفال" },
    point3: { en: "Trusted since 1987 — nearly 40 years", ar: "ثقة منذ عام ١٩٨٧ — قرابة ٤٠ عامًا" },
    profile: {
      name: { en: "Dr. Medhat Basseem", ar: "د. مدحت بسيم" },
      title: {
        en: "Founder & Director · Dental Center of Egypt",
        ar: "المؤسس والمدير · دينتال سنتر أوف إيجيبت",
      },
      languages: { en: "Arabic · English", ar: "العربية · الإنجليزية" },
    },
  },

  credentials: [
    { en: "Established 1987 — 39 years of care", ar: "تأسس عام ١٩٨٧ — ٣٩ عامًا من الرعاية" },
    { en: "20 Specialized Clinics", ar: "٢٠ عيادة متخصصة" },
    { en: "Dedicated Pediatric Wing", ar: "جناح مخصص للأطفال" },
  ],

  team: [
    { name: { en: "Dr. Medhat Basseem", ar: "د. مدحت بسيم" }, role: { en: "Founder & Director", ar: "المؤسس والمدير" }, photo: "/clinic/doctor-2.jpg" },
    { name: { en: "Our Specialist Team", ar: "فريقنا المتخصص" }, role: { en: "20 Clinics · Every Specialty", ar: "٢٠ عيادة · كل التخصصات" }, photo: "/clinic/team/person-3.png" },
  ],

  gallery: {
    style: "grid",
    headline: { en: "Real Patient Results", ar: "نتائج حقيقية لمرضانا" },
    subtitle: {
      en: "A glimpse of the smiles we've crafted at Dental Center of Egypt — veneers, implants, aligners and more.",
      ar: "لمحة من الابتسامات التي صنعناها في دينتال سنتر أوف إيجيبت — عدسات وزراعة وتقويم والمزيد.",
    },
    cases: [
      { src: "/clinic/case-veneers.jpg", title: { en: "EMax Veneers", ar: "عدسات إيماكس" }, tag: { en: "Hollywood Smile", ar: "ابتسامة هوليوود" } },
      { src: "/clinic/case-fullmouth.jpg", title: { en: "Implants & Full-Mouth", ar: "زراعة وترميم كامل" }, tag: { en: "Implants", ar: "زراعة" } },
      { src: "/clinic/case-gap.jpg", title: { en: "Zirconium Crowns", ar: "تركيبات زيركون" }, tag: { en: "Crowns", ar: "تيجان" } },
      { src: "/clinic/case-gum.jpg", title: { en: "Smile Design", ar: "تصميم الابتسامة" }, tag: { en: "Cosmetic", ar: "تجميلي" } },
      { src: "/clinic/smile-1.jpg", title: { en: "Teeth Whitening", ar: "تبييض الأسنان" }, tag: { en: "Whitening", ar: "تبييض" } },
      { src: "/clinic/smile-2.jpg", title: { en: "Clear Aligners", ar: "تقويم شفاف" }, tag: { en: "Orthodontics", ar: "تقويم" } },
    ],
  },

  videos: [
    { src: "/clinic/videos/case-video-1.mp4", title: { en: "Inside Our Center", ar: "داخل مركزنا" }, tag: { en: "Reel", ar: "ريـل" }, duration: "0:20", rotate: true },
    { src: "/clinic/videos/case-video-2.mp4", title: { en: "Patient Journey", ar: "رحلة المريض" }, tag: { en: "Showcase", ar: "عرض" }, duration: "0:31", orientation: "landscape", ratio: "1080 / 719" },
  ],
  videosIntro: {
    en: "A closer look inside Dental Center of Egypt — real moments from our clinics.",
    ar: "نظرة أقرب داخل دينتال سنتر أوف إيجيبت — لحظات حقيقية من عياداتنا.",
  },

  theme: {
    primary: "#0e7c8a",
    primaryDark: "#0a5c66",
    accent: "#2bb8cc",
    background: "#f4f8f9",
    surface: "#ffffff",
    surface2: "#e8f1f3",
  },

  logo: "/dce/logo.png",

  contact: {
    phone: "+201003940003",
    phoneDisplay: "+20 100 394 0003",
    whatsapp: "201003940003",
    email: "dental.center.egypt@gmail.com",
    address: { street: "67 Abu Bakr El Sadik St, Safir Square", locality: "Heliopolis", region: "Cairo", country: "EG", postalCode: "39828" },
    addressDisplay: {
      en: "67 Abu Bakr El Sadik St, Safir Square, Heliopolis, Cairo",
      ar: "٦٧ شارع أبو بكر الصديق، ميدان سفير، مصر الجديدة، القاهرة",
    },
    hours: { en: "Open daily — call to book your visit", ar: "مفتوح يوميًا — اتصل لحجز موعدك" },
    geo: { lat: 30.0989, lng: 31.339 },
    mapQuery: "Dental Center of Egypt, 67 Abu Bakr El Sadik, Safir Square, Heliopolis, Cairo",
    social: [
      "https://www.facebook.com/dr.medhatbasseemdentalcenter",
      "https://www.instagram.com/dentalcenter_medhatbasseem",
      "https://wa.me/201003940003",
    ],
  },

  seo: {
    description:
      "Dental Center of Egypt — Egypt's largest specialized dental center in Heliopolis, Cairo. Founded 1987 by Dr. Medhat Basseem: 20 specialized clinics, EMax veneers, implants, clear aligners, whitening and a dedicated pediatric wing. Book your appointment today.",
    descriptionAr:
      "دينتال سنتر أوف إيجيبت — أكبر مركز أسنان متخصص في مصر الجديدة، القاهرة. تأسس عام ١٩٨٧ على يد د. مدحت بسيم: ٢٠ عيادة متخصصة، عدسات إيماكس، زراعة، تقويم شفاف، تبييض وجناح مخصص للأطفال. احجز موعدك اليوم.",
    keywords: [
      "Dental Center of Egypt",
      "Dr Medhat Basseem",
      "dentist Heliopolis",
      "cosmetic dentist Cairo",
      "veneers Egypt",
      "EMax veneers",
      "Hollywood smile Cairo",
      "dental implants Egypt",
      "clear aligners Cairo",
      "pediatric dentistry Cairo",
      "مركز أسنان مصر الجديدة",
      "دينتال سنتر",
      "دكتور مدحت بسيم",
      "عدسات الأسنان",
      "ابتسامة هوليوود",
      "زراعة الأسنان",
      "تقويم شفاف",
      "أسنان الأطفال",
    ],
  },

  dbFile: "dce.db",
};
