export type Lang = "en" | "ar";

export type Service = {
  icon: string;
  title: { en: string; ar: string };
  desc: { en: string; ar: string };
};

export type TeamMember = {
  name: { en: string; ar: string };
  role: { en: string; ar: string };
  photo: string;
};

export type Testimonial = {
  name: { en: string; ar: string };
  text: { en: string; ar: string };
  rating: number;
};

export type CaseItem = {
  title: { en: string; ar: string };
  tag: { en: string; ar: string };
  image: string;
};

export const services: Service[] = [
  {
    icon: "implant",
    title: { en: "Dental Implants", ar: "زراعة الأسنان" },
    desc: {
      en: "Permanent, titanium-rooted replacements that look, feel and function like your own teeth.",
      ar: "بدائل دائمة بجذور من التيتانيوم تبدو وتعمل تمامًا كأسنانك الطبيعية.",
    },
  },
  {
    icon: "sparkle",
    title: { en: "Hollywood Smile", ar: "ابتسامة هوليوود" },
    desc: {
      en: "Custom-designed veneers for a flawless, natural-looking smile.",
      ar: "قشور تجميلية مصممة خصيصًا لابتسامة مثالية وطبيعية المظهر.",
    },
  },
  {
    icon: "align",
    title: { en: "Orthodontics", ar: "تقويم الأسنان" },
    desc: {
      en: "Invisible aligners and modern braces for perfectly aligned teeth.",
      ar: "تقويم شفاف وحديث للحصول على أسنان مصطفة بشكل مثالي.",
    },
  },
  {
    icon: "tooth",
    title: { en: "Endodontics", ar: "علاج الجذور" },
    desc: {
      en: "Pain-free root canal therapy using advanced rotary technology.",
      ar: "علاج جذور خالٍ من الألم باستخدام أحدث التقنيات الدوارة.",
    },
  },
  {
    icon: "shield",
    title: { en: "Gum Treatment", ar: "علاج اللثة" },
    desc: {
      en: "Laser-assisted care to restore healthy, pink, infection-free gums.",
      ar: "رعاية بالليزر لاستعادة لثة صحية وردية وخالية من الالتهابات.",
    },
  },
  {
    icon: "whiten",
    title: { en: "Teeth Whitening", ar: "تبييض الأسنان" },
    desc: {
      en: "Professional whitening that brightens your smile several shades.",
      ar: "تبييض احترافي يمنح ابتسامتك إشراقًا بعدة درجات.",
    },
  },
  {
    icon: "crown",
    title: { en: "Crowns & Bridges", ar: "التيجان والجسور" },
    desc: {
      en: "Durable ceramic restorations that rebuild damaged or missing teeth.",
      ar: "ترميمات خزفية متينة تعيد بناء الأسنان التالفة أو المفقودة.",
    },
  },
  {
    icon: "kids",
    title: { en: "Pediatric Dentistry", ar: "طب أسنان الأطفال" },
    desc: {
      en: "Gentle, friendly dental care designed for kids of all ages.",
      ar: "رعاية أسنان لطيفة وودودة مصممة للأطفال من جميع الأعمار.",
    },
  },
];

export const cases: CaseItem[] = [
  {
    title: { en: "Full Smile Makeover", ar: "تجميل كامل للابتسامة" },
    tag: { en: "Veneers", ar: "قشور تجميلية" },
    image:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: { en: "Implant Restoration", ar: "ترميم بالزراعة" },
    tag: { en: "Implants", ar: "زراعة" },
    image:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: { en: "Invisible Alignment", ar: "تقويم شفاف" },
    tag: { en: "Orthodontics", ar: "تقويم" },
    image:
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: { en: "Professional Whitening", ar: "تبييض احترافي" },
    tag: { en: "Whitening", ar: "تبييض" },
    image:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: { en: "Ceramic Crowns", ar: "تيجان خزفية" },
    tag: { en: "Crowns", ar: "تيجان" },
    image:
      "https://images.unsplash.com/photo-1571772996211-2f02c9727629?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: { en: "Healthy Gums", ar: "لثة صحية" },
    tag: { en: "Gum Care", ar: "علاج اللثة" },
    image:
      "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=800&q=80",
  },
];

export const team: TeamMember[] = [
  {
    name: { en: "Dr. Mohamed Badawi", ar: "د. محمد بدوي" },
    role: { en: "Founder & Implant Specialist", ar: "المؤسس وأخصائي زراعة الأسنان" },
    photo: "/clinic/doctor-badawi.jpg",
  },
  {
    name: { en: "BDIC Dental Team", ar: "فريق BDIC الطبي" },
    role: { en: "Implant & Cosmetic Dentistry", ar: "زراعة وتجميل الأسنان" },
    photo: "/clinic/doctor-2.jpg",
  },
];

export const testimonials: Testimonial[] = [
  {
    name: { en: "Sara M.", ar: "سارة م." },
    rating: 5,
    text: {
      en: "Absolutely the best dental experience I've ever had. My new smile changed my life!",
      ar: "أفضل تجربة أسنان مررت بها على الإطلاق. ابتسامتي الجديدة غيّرت حياتي!",
    },
  },
  {
    name: { en: "Ahmed K.", ar: "أحمد ك." },
    rating: 5,
    text: {
      en: "Painless implants and a caring team. The clinic feels modern and spotless.",
      ar: "زراعة بدون ألم وفريق يهتم بك. العيادة حديثة ونظيفة تمامًا.",
    },
  },
  {
    name: { en: "Nour H.", ar: "نور ح." },
    rating: 5,
    text: {
      en: "They explained every step clearly. I finally found a dentist I trust.",
      ar: "شرحوا لي كل خطوة بوضوح. أخيرًا وجدت طبيب أسنان أثق به.",
    },
  },
];

export const t = {
  brand: { en: "BDIC", ar: "BDIC" },
  nav: {
    home: { en: "Home", ar: "الرئيسية" },
    services: { en: "Services", ar: "الخدمات" },
    about: { en: "About", ar: "عن المركز" },
    offers: { en: "Offers", ar: "العروض" },
    cases: { en: "Results", ar: "النتائج" },
    videos: { en: "Videos", ar: "فيديوهات" },
    team: { en: "Team", ar: "الفريق" },
    reviews: { en: "Reviews", ar: "آراء العملاء" },
    contact: { en: "Contact", ar: "تواصل معنا" },
    book: { en: "Book Appointment", ar: "احجز موعد" },
  },
  hero: {
    badge: { en: "100% Patient Recommended · Maadi, Cairo", ar: "يوصي به ١٠٠٪ من المرضى · المعادي، القاهرة" },
    greeting: { en: "Welcome to", ar: "مرحبًا بك في" },
    doctorName: { en: "Badawi Dental Implant Center", ar: "مركز بدوي لزراعة الأسنان" },
    doctor1Name: { en: "Dr. Lamis", ar: "د. لميس" },
    doctor2Name: { en: "Dr. Omnia", ar: "د. أمنية" },
    doctorRole: { en: "Dental Implant Specialists · Maadi, Cairo", ar: "متخصصون في زراعة الأسنان · المعادي، القاهرة" },
    title1: { en: "Rebuild Your Smile with", ar: "استعد ابتسامتك مع" },
    title2: { en: "Expert Dental Implants", ar: "خبراء زراعة الأسنان" },
    subtitle: {
      en: "At Badawi Dental Implant Center we replace missing teeth with world-class implant technology — for a confident, natural smile that lasts a lifetime.",
      ar: "في مركز بدوي لزراعة الأسنان نعوّض الأسنان المفقودة بأحدث تقنيات الزراعة العالمية — لابتسامة طبيعية وواثقة تدوم مدى الحياة.",
    },
    ctaPrimary: { en: "Book Appointment", ar: "احجز موعدك" },
    ctaSecondary: { en: "Explore Services", ar: "استكشف الخدمات" },
    stat1: { en: "Years of Experience", ar: "سنوات الخبرة" },
    stat2: { en: "Happy Patients", ar: "مريض سعيد" },
    stat3: { en: "Successful Implants", ar: "زراعة ناجحة" },
  },
  services: {
    eyebrow: { en: "What We Offer", ar: "ماذا نقدم" },
    title: { en: "Comprehensive Dental Services", ar: "خدمات أسنان شاملة" },
    subtitle: {
      en: "From routine check-ups to complete smile transformations, we cover every aspect of dental health.",
      ar: "من الفحوصات الدورية إلى تحويل الابتسامة بالكامل، نغطي كل جوانب صحة الأسنان.",
    },
  },
  about: {
    eyebrow: { en: "About the Center", ar: "عن المركز" },
    name: { en: "Badawi Dental Implant Center", ar: "مركز بدوي لزراعة الأسنان" },
    role: {
      en: "A Dedicated Dental Implant Center in Cairo",
      ar: "مركز متخصص في زراعة الأسنان بالقاهرة",
    },
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
  cases: {
    eyebrow: { en: "Our Work", ar: "أعمالنا" },
    title: { en: "Real Smile Transformations", ar: "تحوّلات حقيقية للابتسامة" },
    subtitle: {
      en: "A glimpse of the life-changing results we create for our patients every day.",
      ar: "لمحة عن النتائج التي تغيّر الحياة والتي نصنعها لمرضانا كل يوم.",
    },
  },
  beforeAfter: {
    eyebrow: { en: "Before & After", ar: "قبل وبعد" },
    title: { en: "Drag to See the Difference", ar: "اسحب لترى الفرق" },
    subtitle: {
      en: "Slide the handle to reveal real before-and-after results from our clinic.",
      ar: "حرّك المؤشر لكشف نتائج حقيقية قبل وبعد من عيادتنا.",
    },
    before: { en: "Before", ar: "قبل" },
    after: { en: "After", ar: "بعد" },
  },
  team: {
    eyebrow: { en: "Our Doctors", ar: "أطباؤنا" },
    title: { en: "Meet the BDIC Team", ar: "تعرّف على فريق BDIC" },
    subtitle: {
      en: "Led by Dr. Mohamed Badawi, our specialists focus on dental implants and smile restoration.",
      ar: "بقيادة د. محمد بدوي، يتخصص فريقنا في زراعة الأسنان وتجميل الابتسامة.",
    },
  },
  reviews: {
    eyebrow: { en: "Reviews", ar: "آراء العملاء" },
    title: { en: "What Our Patients Say", ar: "ماذا يقول مرضانا" },
    subtitle: {
      en: "100% of our patients recommend us — based on verified reviews.",
      ar: "١٠٠٪ من مرضانا يوصون بنا — استنادًا إلى تقييمات موثّقة.",
    },
  },
  contact: {
    eyebrow: { en: "Get In Touch", ar: "تواصل معنا" },
    title: { en: "Book Your Visit Today", ar: "احجز زيارتك اليوم" },
    subtitle: {
      en: "Have a question or ready to book? Reach out and our friendly team will respond quickly.",
      ar: "لديك سؤال أو مستعد للحجز؟ تواصل معنا وسيرد فريقنا الودود بسرعة.",
    },
    nameLabel: { en: "Your Name", ar: "اسمك" },
    phoneLabel: { en: "Phone Number", ar: "رقم الهاتف" },
    messageLabel: { en: "How can we help?", ar: "كيف يمكننا مساعدتك؟" },
    send: { en: "Send Request", ar: "إرسال الطلب" },
    addressLabel: { en: "Address", ar: "العنوان" },
    address: { en: "3/3 El Laselky St., Maadi, Cairo, Egypt", ar: "٣/٣ شارع اللاسلكي، المعادي، القاهرة، مصر" },
    phoneValue: { en: "+20 122 215 6274", ar: "+20 122 215 6274" },
    hoursLabel: { en: "Working Hours", ar: "ساعات العمل" },
    hours: { en: "Sat - Thu: 12:00 PM - 10:00 PM", ar: "السبت - الخميس: ١٢ ظهرًا - ١٠ مساءً" },
  },
  footer: {
    tagline: {
      en: "Modern dental care designed around your comfort and confidence.",
      ar: "رعاية أسنان حديثة مصممة من أجل راحتك وثقتك.",
    },
    rights: { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
    quickLinks: { en: "Quick Links", ar: "روابط سريعة" },
    contactInfo: { en: "Contact", ar: "تواصل" },
  },
} as const;
