import type { ClinicConfig } from "./types";

/**
 * Dental Center of Egypt — Dr. Medhat Basseem · Heliopolis, Cairo.
 *
 * Founded 1987; one of Egypt's largest specialised dental centers — 20
 * specialised clinics covering every branch of dentistry plus a dedicated
 * pediatric wing, 45+ specialist doctors & consultants, accepted by 55+ medical
 * insurance companies, with branches across Greater Cairo. Institution-first
 * (center) branding: the hero leads with the DCE heritage key visual (no
 * person-cutout stage) and a royal-blue theme drawn from the real logo.
 *
 * All imagery here is the client's OWN brand material (logo, heritage flag,
 * founder, real before/after cases) extracted from their Instagram/Facebook,
 * saved under public/dce/.
 */
export const dce: ClinicConfig = {
  slug: "dce",
  brand: { en: "Dental Center of Egypt", ar: "دينتال سنتر أوف إيجيبت" },
  doctorName: { en: "Dental Center of Egypt", ar: "دينتال سنتر أوف إيجيبت" },
  role: {
    en: "Trusted Since 1987 · 20 Specialised Clinics · Heliopolis, Cairo",
    ar: "ثقة منذ عام ١٩٨٧ · ٢٠ عيادة متخصصة · مصر الجديدة، القاهرة",
  },

  hero: {
    badge: {
      en: "Since 1987 · 39 Years of Trust",
      ar: "منذ عام ١٩٨٧ · ٣٩ سنة من الثقة",
    },
    title1: { en: "With You in Every Smile —", ar: "معاكم في كل ابتسامة —" },
    title2: { en: "Dental Center of Egypt", ar: "دينتال سنتر أوف إيجيبت" },
    subtitle: {
      en: "Since 1987 we build trust before any treatment. 20 specialised clinics under one roof, 45+ specialist doctors and consultants, a dedicated pediatric wing and branches across Greater Cairo — one place for the whole family, from Hollywood smiles and implants to clear aligners and whitening.",
      ar: "منذ عام ١٩٨٧ ونحن نبني الثقة قبل أي علاج. ٢٠ عيادة متخصصة تحت سقف واحد، وأكثر من ٤٥ طبيبًا واستشاريًا، وجناح مخصص للأطفال، وفروع في أنحاء القاهرة الكبرى — مكان واحد للعائلة كلها، من ابتسامة هوليوود والزراعة إلى التقويم الشفاف والتبييض.",
    },
    photo: "/dce/doctor-square.jpg",
    hideStage: true,
    image: "/dce/hero-heritage.jpg",
    lineupLabel: { en: "Our Specialists", ar: "نخبة المتخصصين" },
    tagline: {
      en: "من ١٩٨٧… معاكم في كل ابتسامة — ٣٩ سنة من الثقة",
      ar: "من ١٩٨٧… معاكم في كل ابتسامة — ٣٩ سنة من الثقة",
    },
    stats: [
      { value: "39", label: { en: "Years of Trust", ar: "عامًا من الثقة" } },
      { value: "45+", label: { en: "Specialist Doctors", ar: "طبيبًا متخصصًا" } },
      { value: "55+", label: { en: "Insurance Partners", ar: "شركة تأمين" } },
    ],
  },

  about: {
    role: { en: "Egypt's Largest Specialised Dental Center", ar: "أكبر مركز أسنان متخصص في مصر" },
    bio1: {
      en: "Founded in 1987 by Dr. Medhat Basseem, Dental Center of Egypt has grown into one of the country's largest and most trusted dental destinations — 20 specialised clinics covering every branch of dentistry, a dedicated wing for children, and a team of 45+ specialist doctors and consultants.",
      ar: "تأسس مركز دينتال سنتر أوف إيجيبت عام ١٩٨٧ على يد د. مدحت بسيم، وأصبح واحدًا من أكبر وأوثق مراكز الأسنان في مصر — ٢٠ عيادة متخصصة تغطي كل فروع طب الأسنان، وجناح مخصص للأطفال، وفريق من أكثر من ٤٥ طبيبًا واستشاريًا متخصصًا.",
    },
    bio2: {
      en: "For nearly four decades we've built trust before any treatment. With branches across Greater Cairo, acceptance by 55+ medical insurance companies and flexible installment plans, we make world-class dentistry easy for the whole family — natural smiles that last a lifetime.",
      ar: "على مدى أربعة عقود تقريبًا نبني الثقة قبل أي علاج. بفروعنا في أنحاء القاهرة الكبرى، والتعامل مع أكثر من ٥٥ شركة تأمين طبي، وأنظمة تقسيط مريحة، نجعل طب الأسنان العالمي في متناول العائلة كلها — ابتسامات طبيعية تدوم مدى الحياة.",
    },
    point1: { en: "20 specialised clinics — every branch of dentistry", ar: "٢٠ عيادة متخصصة — كل فروع طب الأسنان" },
    point2: { en: "45+ specialist doctors & consultants, plus a pediatric wing", ar: "أكثر من ٤٥ طبيبًا واستشاريًا، وجناح لأسنان الأطفال" },
    point3: { en: "Accepted by 55+ insurers · flexible installments · 5 branches", ar: "أكثر من ٥٥ شركة تأمين · تقسيط مريح · ٥ فروع" },
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
    { en: "Established 1987 — 39 Years of Care", ar: "تأسس عام ١٩٨٧ — ٣٩ عامًا من الرعاية" },
    { en: "20 Specialised Clinics + Pediatric Wing", ar: "٢٠ عيادة متخصصة + جناح للأطفال" },
    { en: "45+ Specialist Doctors & Consultants", ar: "أكثر من ٤٥ طبيبًا واستشاريًا" },
    { en: "Accepted by 55+ Insurance Companies", ar: "معتمد لدى أكثر من ٥٥ شركة تأمين" },
    { en: "Branches Across Greater Cairo", ar: "فروع في أنحاء القاهرة الكبرى" },
    { en: "Flexible Installment Plans", ar: "أنظمة تقسيط مريحة" },
  ],

  team: [
    {
      name: { en: "Dr. Medhat Basseem", ar: "د. مدحت بسيم" },
      role: { en: "Founder & Director", ar: "المؤسس والمدير" },
      photo: "/dce/doctor-square.jpg",
    },
  ],

  gallery: {
    style: "grid",
    headline: { en: "Real Patient Results", ar: "نتائج حقيقية لمرضانا" },
    subtitle: {
      en: "A glimpse of the smiles crafted at Dental Center of Egypt — veneers, crowns, orthodontics and more, by our specialist team.",
      ar: "لمحة من الابتسامات التي صنعناها في دينتال سنتر أوف إيجيبت — عدسات وتيجان وتقويم والمزيد، على يد فريقنا المتخصص.",
    },
    cases: [
      { src: "/dce/cases/ba-veneers-2.jpg", title: { en: "Hollywood Smile", ar: "ابتسامة هوليوود" }, tag: { en: "E-Max Veneers", ar: "عدسات إيماكس" } },
      { src: "/dce/cases/ba-veneers-1.jpg", title: { en: "Cosmetic Veneers", ar: "عدسات تجميلية" }, tag: { en: "Smile Restoration", ar: "ترميم الابتسامة" } },
      { src: "/dce/cases/ba-veneers-3.jpg", title: { en: "Crowns & Veneers", ar: "تيجان وعدسات" }, tag: { en: "Zirconium", ar: "زيركون" } },
      { src: "/dce/cases/ba-whitening.jpg", title: { en: "Smile Makeover", ar: "تجميل الابتسامة" }, tag: { en: "Veneers", ar: "عدسات" } },
      { src: "/dce/cases/ba-smile-1.jpg", title: { en: "Smile Alignment", ar: "تنسيق الابتسامة" }, tag: { en: "Orthodontics", ar: "تقويم" } },
      { src: "/dce/cases/ba-braces.jpg", title: { en: "Orthodontic Braces", ar: "تقويم بالأسلاك" }, tag: { en: "Orthodontics", ar: "تقويم" } },
    ],
  },

  theme: {
    primary: "#1b5fd6",
    primaryDark: "#123a86",
    accent: "#2f97e0",
    background: "#f3f7fd",
    surface: "#ffffff",
    surface2: "#e7eefb",
    onPrimary: "#ffffff",
  },

  logo: "/dce/logo.png",

  contact: {
    phone: "+201003940003",
    phoneDisplay: "+20 100 394 0003",
    whatsapp: "201003940003",
    email: "dental.center.egypt@gmail.com",
    address: { street: "67 Abu Bakr El Sadik St, Safir Square", locality: "Heliopolis", region: "Cairo", country: "EG", postalCode: "11341" },
    addressDisplay: {
      en: "67 Abu Bakr El Sadik St, Safir Square, next to Bastawisi, Heliopolis, Cairo",
      ar: "٦٧ شارع أبو بكر الصديق، ميدان سفير، بجوار بستاويسي، مصر الجديدة، القاهرة",
    },
    hours: { en: "Open daily — call or WhatsApp to book your visit", ar: "مفتوح يوميًا — اتصل أو راسلنا واتساب لحجز موعدك" },
    geo: { lat: 30.0989, lng: 31.339 },
    mapQuery: "Dental Center Dr Medhat Basseem, Abu Bakr El Sadik, Safir Square, Heliopolis, Cairo",
    social: [
      "https://www.facebook.com/dentalcenter.medhatbasseem",
      "https://www.instagram.com/dentalcenter_medhatbasseem",
      "https://wa.me/201003940003",
    ],
  },

  seo: {
    description:
      "Dental Center of Egypt (Dr. Medhat Basseem) — trusted since 1987 in Heliopolis, Cairo. 20 specialised clinics, 45+ specialist doctors, a pediatric wing, EMax veneers, implants, clear aligners and whitening. Accepted by 55+ insurers with flexible installments. Book today.",
    descriptionAr:
      "دينتال سنتر أوف إيجيبت (د. مدحت بسيم) — ثقة منذ عام ١٩٨٧ في مصر الجديدة، القاهرة. ٢٠ عيادة متخصصة، أكثر من ٤٥ طبيبًا، جناح للأطفال، عدسات إيماكس، زراعة، تقويم شفاف وتبييض. معتمد لدى أكثر من ٥٥ شركة تأمين مع تقسيط مريح. احجز اليوم.",
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
      "dental insurance Egypt",
      "مركز أسنان مصر الجديدة",
      "دينتال سنتر",
      "دكتور مدحت بسيم",
      "عدسات الأسنان",
      "ابتسامة هوليوود",
      "زراعة الأسنان",
      "تقويم شفاف",
      "أسنان الأطفال",
      "تأمين طبي أسنان",
    ],
  },

  dbFile: "dce.db",
};
