"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

async function parseJsonRes(res: Response) {
  try {
    return await res.clone().json();
  } catch {
    if (typeof DecompressionStream !== "undefined") {
      for (const enc of ["gzip", "deflate"]) {
        try {
          const ds = new DecompressionStream(enc as any);
          const stream = res.clone().body?.pipeThrough(ds);
          if (stream) {
            const txt = await new Response(stream).text();
            return JSON.parse(txt);
          }
        } catch {}
      }
    }
    return null;
  }
}

interface SchoolInfo {
  id: string;
  name: string;
  slug: string;
  board: string;
  city: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  logoUrl: string | null;
  affiliationNumber?: string;
}

const translations = {
  en: {
    announcement: "ADMISSIONS OPEN 2026-27",
    affiliationText: (board: string, affNo: string, city: string) => `${board} Affiliated (${affNo}) • ${city} Campus`,
    callUs: "Helpline",
    officialCampus: "Official Campus",
    nav: {
      home: "Home",
      about: "About Us",
      academics: "Academics & CBSE",
      facilities: "Smart Labs & Facilities",
      notices: "Notice Board",
      admissions: "Admissions 2026-27",
      contact: "Contact Us",
      parentApp: "Parent App",
      erpLogin: "ERP Login",
    },
    hero: {
      badge: (board: string, city: string) => `${board} AFFILIATED INSTITUTION • ${city.toUpperCase()}`,
      title: "Welcome to New Ideal Public School",
      hindiSubtitle: "New Ideal Public School, Mathura",
      desc: "Fostering Academic Excellence, Smart Classrooms, Robotics, STEM Labs & Holistic Character Building in Mathura.",
      btnAdmission: "🎓 Apply for Admission 2026-27",
      btnApp: "📥 Download Parent App (v2.0.0 APK)",
      btnLogin: "🔐 Staff / Parent ERP Login",
      stats: [
        { val: "100%", lbl: "CBSE Board Result" },
        { val: "Smart", lbl: "Digital Classrooms" },
        { val: "GPS", lbl: "Safe School Buses" },
        { val: "24×7", lbl: "Parent Mobile App" },
      ],
      campusCard: {
        badge: "Official Mathura Campus",
        affiliationNo: "Affiliation No",
        helpline: "Helpline",
        classes: "Nursery to Class XII",
        open: "Admissions Open",
      },
    },
    appSection: {
      badge: "Official School Android Application",
      title: "Download New Ideal Public School Parent App",
      desc: "Track live daily attendance, homework assignments, fees receipts, circulars, report cards & school bus GPS tracking directly on your mobile.",
      btnBadge: "Direct Android Download",
      btnTitle: "Download APK v2.0.0 (1.87 MB)",
    },
    noticesSection: {
      badge: "Notice Board",
      title: "Latest Circulars & Campus Announcements",
      session: "Academic Session 2026-27",
      items: [
        {
          tag: "Admissions 2026-27",
          title: "Registration Open for Academic Session 2026-27",
          body: "Registration and admission inquiry forms for Nursery to Class XII are available online and at the school reception desk in Mathura.",
        },
        {
          tag: "Digital Campus",
          title: "Launch of Official Parent Mobile App v2.0.0",
          body: "Parents can now download the official New Ideal Public School Android App (.apk) from the website to access daily attendance, homework, report cards, and fee receipts.",
        },
        {
          tag: "STEM & Labs",
          title: "STEM Robotics & Smart Science Lab Orientation",
          body: "Interactive hands-on robotics, computer coding, and STEM sessions are scheduled for students from Class VI onwards in our state-of-the-art campus lab.",
        },
      ],
    },
    aboutSection: {
      badge: "About Our Institution & Leadership",
      title: "Principal's Desk — New Ideal Public School",
      quote: '"Our mission is to empower every child with modern scientific inquiry, strong moral values, disciplined character, and CBSE-aligned academic excellence to lead the future."',
      p1: "Located in the heart of Mathura at Shankar Gali Dauli Pyau, New Ideal Public School provides a nurturing environment where children discover their highest potential. With smart digital classrooms, robotics labs, sports grounds, and dedicated faculty, we bridge traditional values with 21st-century education.",
      factsTitle: "Institution Fast Facts",
      facts: [
        { label: "Affiliation", val: "CBSE (CBSE-AFF-2130894)" },
        { label: "School Code", val: "2026100001" },
        { label: "Campus City", val: "Mathura, Uttar Pradesh" },
        { label: "Medium of Instruction", val: "English & Hindi (Bilingual)" },
        { label: "Session", val: "2026 - 2027" },
      ],
    },
    facilitiesSection: {
      badge: "Academic Excellence",
      title: "Curriculum & Modern Infrastructure",
      desc: "Comprehensive holistic education aligned with CBSE guidelines and NEP 2020.",
      items: [
        {
          icon: "🤖",
          title: "AI & Robotics Innovation Lab",
          desc: "Hands-on robotics kits, sensors, STEM projects, and early programming logic for students from Class VI onwards.",
        },
        {
          icon: "💻",
          title: "Digital Coding & Computer Arena",
          desc: "High-speed networked computer lab equipped with coding workstations, internet access, and interactive learning tools.",
        },
        {
          icon: "🔬",
          title: "Integrated Science Laboratories",
          desc: "Equipped Physics, Chemistry, and Biology practical labs encouraging experiential learning and CBSE practical examinations.",
        },
        {
          icon: "📚",
          title: "Knowledge Resource Library",
          desc: "Rich collection of academic reference books, encyclopedia, periodicals, fiction, and competitive exam guidance material.",
        },
        {
          icon: "🚌",
          title: "Safe Transport & GPS Buses",
          desc: "Fleet of school buses covering all major neighborhoods across Mathura with verified drivers, conductors, and GPS tracking.",
        },
        {
          icon: "🎯",
          title: "Sports, Yoga & Cultural Arena",
          desc: "Comprehensive physical education including cricket, volleyball, badminton, yoga sessions, and annual cultural celebrations.",
        },
      ],
    },
    admissionsSection: {
      badge: "Academic Session 2026-27",
      title: "Online Admission Inquiry Form",
      desc: "Submit your inquiry below. Our admissions desk at New Ideal Public School will contact you with admission details and fee structure.",
      successTitle: "Admission Inquiry Submitted Successfully!",
      successDesc: (phone: string) => `Thank you! The admission desk at New Ideal Public School has received your details and will call you at ${phone} shortly.`,
      btnAnother: "Submit Another Inquiry",
      lblName: "Student Full Name *",
      placeholderName: "e.g. Aarav Sharma",
      lblGrade: "Grade / Class Applying For *",
      lblParent: "Parent / Guardian Name *",
      placeholderParent: "e.g. Rajesh Sharma",
      lblPhone: "10-Digit Mobile Number *",
      placeholderPhone: "9876543210",
      lblEmail: "Parent Email Address",
      placeholderEmail: "parent@example.com",
      btnSubmit: "Submit Online Admission Inquiry →",
      btnSubmitting: "Submitting Inquiry...",
    },
    footerSection: {
      tagline: "CBSE Affiliated Institution (CBSE-AFF-2130894) • Mathura Campus",
      contactTitle: "Contact & Helpline",
      phone: "Phone",
      email: "Email",
      code: "School Code",
      quickAccess: "Quick Access",
      erpLogin: "School ERP Login",
      downloadApp: "Download App (.apk)",
      applyAdm: "Apply Admission",
      portalTag: "Official Institutional Campus Portal",
    },
    loginModal: {
      title: "School ERP & Institutional Login Portal",
      selectRole: "Select Your Institutional Role:",
      principal: {
        title: "Principal / Admin",
        sub: "प्रिंसिपल / एडमिन",
        context: "Principal / Admin Mode: Institutional governance, fee collection, staff allocation & CBSE records.",
        placeholderId: "e.g. principal@newidealpublicschool.edu.in or 8529575588",
        labelId: "Principal Email / Mobile Number *",
      },
      teacher: {
        title: "Teacher / Staff",
        sub: "शिक्षक / स्टाफ",
        context: "Teacher / Staff Mode: Class attendance marking, homework assignment, gradebook & exams.",
        placeholderId: "e.g. teacher@newidealpublicschool.edu.in or EMP102",
        labelId: "Teacher Email / Employee Code *",
      },
      parent: {
        title: "Parent / Student",
        sub: "अभिभावक / छात्र",
        context: "Parent / Student Portal: Ward attendance, homework, live school bus GPS & fee payment receipts.",
        placeholderId: "e.g. 9876543210 or ADM202601",
        labelId: "Registered Mobile Number / Admission No. *",
      },
      tabPassword: "🔑 Email / ID & Password",
      tabOtp: "📱 Mobile OTP",
      lblPassword: "Password *",
      btnSignIn: "Sign In to School ERP →",
      btnVerifying: "Verifying Credentials...",
      lblMobile: "10-Digit Registered Mobile Number *",
      btnSmsOtp: "📱 Send SMS OTP",
      btnWhatsappOtp: "💬 WhatsApp OTP",
      otpSentTo: (phone: string) => `Enter 6-Digit OTP received on +91 ${phone}`,
      btnVerifyOtp: "Verify OTP & Enter ERP →",
      demoTitle: "⚡ 1-Click Instant Role Login (Demo Sandbox):",
      demoPrincipal: "🏫 Principal (Full ERP)",
      demoTeacher: "👨‍🏫 Teacher (Attendance & Marks)",
      demoParent: "👨‍👩‍👧 Parent (Ward & Bus GPS)",
    },
  },
  hi: {
    announcement: "सत्र 2026-27 प्रवेश प्रारंभ (ADMISSIONS OPEN 2026-27)",
    affiliationText: (board: string, affNo: string, city: string) => `${board} से संबद्धता प्राप्त (${affNo}) • ${city} परिसर`,
    callUs: "हेल्पलाइन",
    officialCampus: "आधिकारिक परिसर",
    nav: {
      home: "होम",
      about: "हमारे बारे में",
      academics: "शिक्षा एवं सीबीएसई",
      facilities: "स्मार्ट लैब्स व सुविधाएं",
      notices: "सूचना पट्ट",
      admissions: "प्रवेश 2026-27",
      contact: "संपर्क करें",
      parentApp: "पेरेंट ऐप",
      erpLogin: "ERP लॉगिन",
    },
    hero: {
      badge: (board: string, city: string) => `${board} से संबद्ध मान्यता प्राप्त शिक्षण संस्थान • ${city.toUpperCase()}`,
      title: "न्यू आइडियल पब्लिक स्कूल में आपका स्वागत है",
      hindiSubtitle: "New Ideal Public School, Mathura",
      desc: "मथुरा में आधुनिक स्मार्ट डिजिटल कक्षाएं, अटल टिंकरिंग व रोबोटिक्स लैब, संस्कारयुक्त अनुशासित वातावरण एवं सर्वांगीण विकास का प्रमुख केंद्र।",
      btnAdmission: "🎓 सत्र 2026-27 प्रवेश हेतु ऑनलाइन आवेदन करें",
      btnApp: "📥 पेरेंट मोबाइल ऐप डाउनलोड करें (APK v2.0.0)",
      btnLogin: "🔐 स्कूल स्टाफ / अभिभावक ERP लॉगिन",
      stats: [
        { val: "100%", lbl: "सीबीएसई बोर्ड परीक्षा परिणाम" },
        { val: "स्मार्ट", lbl: "डिजिटल स्मार्ट क्लासरूम" },
        { val: "जीपीएस", lbl: "सुरक्षित स्कूल बसें" },
        { val: "24×7", lbl: "अभिभावक मोबाइल ऐप" },
      ],
      campusCard: {
        badge: "आधिकारिक मथुरा परिसर",
        affiliationNo: "मान्यता क्रमांक (Affiliation No)",
        helpline: "हेल्पलाइन नंबर",
        classes: "नर्सरी से 12वीं कक्षा तक",
        open: "प्रवेश आवेदन खुले हैं",
      },
    },
    appSection: {
      badge: "आधिकारिक स्कूल एंड्रॉइड ऐप (Android Mobile App)",
      title: "न्यू आइडियल पब्लिक स्कूल अभिभावक ऐप डाउनलोड करें",
      desc: "छात्र की दैनिक उपस्थिति, गृहकार्य (होमवर्क), फीस रसीदें, परीक्षा अंकतालिका, विद्यालय सर्कुलर एवं स्कूल बस की लाइव जीपीएस ट्रैकिंग सीधे अपने मोबाइल फोन पर देखें।",
      btnBadge: "डायरेक्ट एंड्रॉइड एपीके डाउनलोड",
      btnTitle: "डाउनलोड करें APK v2.0.0 (1.87 MB)",
    },
    noticesSection: {
      badge: "सूचना पट्ट (Notice Board)",
      title: "नवीनतम विद्यालय परिपत्र एवं घोषणाएं (Circulars)",
      session: "शैक्षणिक सत्र 2026-27",
      items: [
        {
          tag: "प्रवेश 2026-27",
          title: "शैक्षणिक सत्र 2026-27 हेतु प्रवेश प्रारंभ",
          body: "नर्सरी से 12वीं तक की कक्षाओं में प्रवेश हेतु पंजीकरण फॉर्म वेबसाइट पर ऑनलाइन एवं विद्यालय रिसेप्शन काउंटर पर उपलब्ध हैं।",
        },
        {
          tag: "डिजिटल कैंपस",
          title: "आधिकारिक पेरेंट मोबाइल ऐप v2.0.0 जारी",
          body: "समस्त अभिभावक अपने मोबाइल पर न्यू आइडियल पब्लिक स्कूल ऐप तुरंत डाउनलोड करें। उपस्थिति, होमवर्क एवं फीस विवरण ऐप पर उपलब्ध है।",
        },
        {
          tag: "रोबोटिक्स व लैब",
          title: "सीबीएसई स्टेम रोबोटिक्स व विज्ञान लैब कार्यशाला",
          body: "कक्षा 6 से 12वीं के विद्यार्थियों हेतु रोबोटिक्स, कोडिंग एवं प्रयोगात्मक विज्ञान लैब सत्र का आयोजन किया जा रहा है।",
        },
      ],
    },
    aboutSection: {
      badge: "संस्थान एवं नेतृत्व परिचय",
      title: "प्रधानाचार्य की कलम से — न्यू आइडियल पब्लिक स्कूल",
      quote: '"हमारा ध्येय प्रत्येक विद्यार्थी में आधुनिक वैज्ञानिक सोच, नैतिक मूल्य, अनुशासित आचरण और सीबीएसई मानकों के अनुरूप शैक्षणिक उत्कृष्टता का विकास करना है।"',
      p1: "मथुरा के हृदय स्थल शंकर गली, डौली प्याऊ में स्थित न्यू आइडियल पब्लिक स्कूल विद्यार्थियों के सर्वांगीण विकास हेतु समर्पित है। आधुनिक स्मार्ट क्लासरूम, रोबोटिक्स लैब, सुसज्जित खेल परिसर और अनुभवी शिक्षकों के मार्गदर्शन में हम भारतीय संस्कारों के साथ 21वीं सदी की आधुनिक शिक्षा प्रदान करते हैं।",
      factsTitle: "विद्यालय के मुख्य तथ्य (Fast Facts)",
      facts: [
        { label: "बोर्ड संबद्धता", val: "सीबीएसई (CBSE-AFF-2130894)" },
        { label: "स्कूल कोड", val: "2026100001" },
        { label: "शहर व राज्य", val: "मथुरा, उत्तर प्रदेश" },
        { label: "शिक्षा का माध्यम", val: "हिंदी एवं अंग्रेजी (द्विभाषी / Bilingual)" },
        { label: "शैक्षणिक सत्र", val: "2026 - 2027" },
      ],
    },
    facilitiesSection: {
      badge: "शैक्षणिक उत्कृष्टता व सुविधाएं",
      title: "सीबीएसई पाठ्यक्रम एवं आधुनिक शिक्षण सुविधाएं",
      desc: "राष्ट्रीय शिक्षा नीति (NEP 2020) एवं सीबीएसई के दिशानिर्देशों पर आधारित समग्र शिक्षा।",
      items: [
        {
          icon: "🤖",
          title: "एआई एवं रोबोटिक्स इनोवेशन लैब",
          desc: "कक्षा 6 से 12वीं के विद्यार्थियों हेतु हैंड्स-ऑन रोबोटिक्स किट्स, सेंसर्स, स्टेम मॉडल्स एवं प्रारंभिक कोडिंग प्रशिक्षण।",
        },
        {
          icon: "💻",
          title: "कंप्यूटर कोडिंग एवं डिजिटल लैब",
          desc: "हाई-स्पीड इंटरनेट, आधुनिक कंप्यूटर वर्कस्टेशन, इंटरैक्टिव लर्निंग टूल्स और डिजिटल साक्षरता प्रशिक्षण।",
        },
        {
          icon: "🔬",
          title: "एकीकृत विज्ञान प्रयोगशालाएं",
          desc: "भौतिकी (Physics), रसायन (Chemistry) एवं जीव विज्ञान (Biology) की सुसज्जित प्रायोगिक प्रयोगशालाएं।",
        },
        {
          icon: "📚",
          title: "ज्ञान संपदा पुस्तकालय (लाइब्रेरी)",
          desc: "हजारों शैक्षणिक पुस्तकें, ज्ञानकोष (Encyclopedias), पत्र-पत्रिकाएं, हिंदी-अंग्रेजी साहित्य और प्रतियोगी परीक्षा सामग्री।",
        },
        {
          icon: "🚌",
          title: "सुरक्षित स्कूल बसें एवं जीपीएस ट्रैकिंग",
          desc: "मथुरा शहर व आसपास के प्रमुख क्षेत्रों में अनुभवी चालकों, सहायकों एवं लाइव जीपीएस से लैस सुरक्षित बस सेवा।",
        },
        {
          icon: "🎯",
          title: "खेलकूद, योग एवं सांस्कृतिक मंच",
          desc: "क्रिकेट, वॉलीबॉल, बैडमिंटन, दैनिक योग सत्र, मार्शल आर्ट्स एवं वार्षिक सांस्कृतिक उत्सवों का आयोजन।",
        },
      ],
    },
    admissionsSection: {
      badge: "शैक्षणिक सत्र 2026-27",
      title: "ऑनलाइन प्रवेश आवेदन पत्र (Admission Inquiry)",
      desc: "कृपया नीचे दिया गया फॉर्म भरें। न्यू आइडियल पब्लिक स्कूल का प्रवेश विभाग आपसे फीस संरचना व प्रवेश प्रक्रिया हेतु शीघ्र संपर्क करेगा।",
      successTitle: "प्रवेश आवेदन सफलतापूर्वक प्राप्त हुआ! (Form Submitted)",
      successDesc: (phone: string) => `धन्यवाद! न्यू आइडियल पब्लिक स्कूल प्रवेश कार्यालय को आपका विवरण मिल चुका है। हमारे प्रतिनिधि आपसे शीघ्र मोबाइल नंबर ${phone} पर संपर्क करेंगे।`,
      btnAnother: "दूसरा आवेदन फॉर्म भरें",
      lblName: "विद्यार्थी का पूरा नाम (Student Name) *",
      placeholderName: "उदा. आरव शर्मा / Aarav Sharma",
      lblGrade: "प्रवेश हेतु कक्षा (Grade/Class) *",
      lblParent: "पिता / माता / अभिभावक का नाम (Parent Name) *",
      placeholderParent: "उदा. श्री राजेश शर्मा / Rajesh Sharma",
      lblPhone: "10-अंकों का मोबाइल नंबर (Mobile Number) *",
      placeholderPhone: "9876543210",
      lblEmail: "ईमेल पता (Email Address)",
      placeholderEmail: "parent@example.com",
      btnSubmit: "ऑनलाइन प्रवेश आवेदन सबमिट करें →",
      btnSubmitting: "आवेदन सबमिट हो रहा है...",
    },
    footerSection: {
      tagline: "सीबीएसई मान्यता प्राप्त सीनियर सेकेंडरी विद्यालय (CBSE-AFF-2130894) • मथुरा",
      contactTitle: "संपर्क एवं हेल्पलाइन",
      phone: "फोन",
      email: "ईमेल",
      code: "स्कूल कोड",
      quickAccess: "त्वरित लिंक्स (Quick Links)",
      erpLogin: "स्कूल ERP लॉगिन",
      downloadApp: "पेरेंट ऐप डाउनलोड (.apk)",
      applyAdm: "प्रवेश आवेदन 2026-27",
      portalTag: "आधिकारिक विद्यालय परिसर पोर्टल (Dakshora Institutional Portal)",
    },
    loginModal: {
      title: "विद्यालय ERP एवं संस्थागत लॉगिन पोर्टल",
      selectRole: "अपनी संस्थागत भूमिका चुनें (Select Your Role):",
      principal: {
        title: "प्रधानाचार्य / एडमिन",
        sub: "Principal / Admin",
        context: "प्रधानाचार्य / एडमिन मोड: सम्पूर्ण विद्यालय प्रबंधन, फीस रिकॉर्ड्स, शिक्षक आवंटन एवं सीबीएसई रिकॉर्ड्स।",
        placeholderId: "ईमेल या 10-अंकों का मोबाइल नंबर",
        labelId: "प्रधानाचार्य ईमेल / मोबाइल नंबर *",
      },
      teacher: {
        title: "शिक्षक / स्टाफ",
        sub: "Teacher / Staff",
        context: "शिक्षक / स्टाफ मोड: दैनिक छात्र उपस्थिति अंकन, गृहकार्य आवंटन, क्लास डायरी एवं परीक्षा अंक।",
        placeholderId: "स्टाफ ईमेल या कर्मचारी कोड (Employee Code)",
        labelId: "शिक्षक ईमेल / कर्मचारी कोड *",
      },
      parent: {
        title: "अभिभावक / छात्र",
        sub: "Parent / Student",
        context: "अभिभावक / छात्र पोर्टल: छात्र उपस्थिति, गृहकार्य, स्कूल बस की लाइव जीपीएस लोकेशन एवं फीस रसीदें।",
        placeholderId: "रजिस्टर्ड 10-डिजिट मोबाइल नंबर या छात्र एडमिशन नंबर",
        labelId: "रजिस्टर्ड मोबाइल नंबर / छात्र एडमिशन नंबर *",
      },
      tabPassword: "🔑 आईडी व पासवर्ड से लॉगिन",
      tabOtp: "📱 मोबाइल ओटीपी से लॉगिन",
      lblPassword: "पासवर्ड (Password) *",
      btnSignIn: "स्कूल ERP में प्रवेश करें (Sign In) →",
      btnVerifying: "क्रेडेंशियल्स सत्यापित हो रहे हैं...",
      lblMobile: "10-अंकों का रजिस्टर्ड मोबाइल नंबर *",
      btnSmsOtp: "📱 SMS द्वारा OTP भेजें",
      btnWhatsappOtp: "💬 WhatsApp द्वारा OTP भेजें",
      otpSentTo: (phone: string) => `+91 ${phone} पर भेजा गया 6-अंकों का OTP कोड दर्ज करें`,
      btnVerifyOtp: "ओटीपी सत्यापित कर ERP में प्रवेश करें →",
      demoTitle: "⚡ 1-क्लिक तुरंत भूमिका लॉगिन (डेमो टेस्ट ड्राइव):",
      demoPrincipal: "🏫 प्रधानाचार्य (पूर्ण ERP कॉकपिट)",
      demoTeacher: "👨‍🏫 शिक्षक (उपस्थिति व अंक)",
      demoParent: "👨‍👩‍👧 अभिभावक (छात्र प्रगति व बस GPS)",
    },
  },
};

export default function SchoolPublicPage() {
  const params = useParams();
  const slugParam = (params?.slug as string) || "new-ideal-public-school";

  const [activeSection, setActiveSection] = useState("home");
  const [lang, setLang] = useState<"en" | "hi">("hi"); // Default to Hindi for authentic Hindi medium/bilingual experience!
  const isHi = lang === "hi";
  const t = translations[lang];

  // Login Modal State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<"principal" | "teacher" | "parent">("principal");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMobile, setLoginMobile] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccessMsg, setLoginSuccessMsg] = useState("");
  const [cmsTree, setCmsTree] = useState<any>(null);

  const [school, setSchool] = useState<SchoolInfo>({
    id: "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e",
    name: "Dakshora Academy, New Delhi",
    slug: "dakshora-academy",
    board: "CBSE",
    city: "New Delhi",
    address: "Institutional Area, Vasant Kunj, New Delhi - 110070",
    contactPhone: "+91 11 2612 3456",
    contactEmail: "principal@dakshoraacademy.edu.in",
    logoUrl: "/assets/dakshora-logo.png",
    affiliationNumber: "CBSE-AFF-2130894",
  });

  const [submittingAdm, setSubmittingAdm] = useState(false);
  const [admSubmitted, setAdmSubmitted] = useState(false);
  const [admError, setAdmError] = useState("");
  const [admForm, setAdmForm] = useState({
    studentName: "",
    grade: "Class 1",
    parentName: "",
    phone: "",
    email: "",
    city: "Mathura",
  });

  useEffect(() => {
    // Dynamic page title based on language
    document.title = isHi
      ? `${school.name} | आधिकारिक विद्यालय वेबसाइट (Official CBSE Campus)`
      : `${school.name} | Official School Website`;

    // Retrieve saved language preference if any
    try {
      const savedLang = localStorage.getItem("dakshora_preferred_lang");
      if (savedLang === "en" || savedLang === "hi") {
        setLang(savedLang);
      }
    } catch {}

    // Check if URL requested login modal immediately
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("action") === "login" || q.get("login") === "true") {
        setIsLoginOpen(true);
        const r = q.get("role");
        if (r === "teacher" || r === "parent" || r === "principal") {
          setLoginRole(r);
        }
      }
    } catch {}

    // Attempt to fetch fresh CMS data
    fetch(`/api/public/schools/${encodeURIComponent(slugParam)}/cms`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          if (data.cmsTree) setCmsTree(data.cmsTree);
          if (data.school) {
            setSchool((prev) => ({
              ...prev,
              ...data.school,
              address: data.school.address || prev.address,
              contactPhone: data.school.contactPhone || prev.contactPhone,
              affiliationNumber: data.school.affiliationNumber || prev.affiliationNumber || "CBSE-AFF-2130894",
            }));
          }
        }
      })
      .catch(() => {});
  }, [slugParam, school.name, isHi]);

  const toggleLanguage = () => {
    const nextLang = lang === "hi" ? "en" : "hi";
    setLang(nextLang);
    try {
      localStorage.setItem("dakshora_preferred_lang", nextLang);
    } catch {}
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admForm.studentName.trim() || !admForm.phone.trim()) {
      setAdmError(isHi ? "कृपया विद्यार्थी का नाम एवं 10-अंकों का मोबाइल नंबर दर्ज करें।" : "Please provide student name and mobile number.");
      return;
    }
    setSubmittingAdm(true);
    setAdmError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: admForm.parentName || admForm.studentName,
          school_name: school.name,
          phone: admForm.phone,
          email: admForm.email || "admission@parent.in",
          city: admForm.city || school.city,
          role: "Parent",
          source: "school_dedicated_website_admission",
          message: `Admission Inquiry for ${admForm.studentName} (${admForm.grade}) at ${school.name}`,
        }),
      });
      if (res.ok) {
        setAdmSubmitted(true);
      } else {
        const d = await res.json().catch(() => null);
        setAdmError(d?.message || (isHi ? "आवेदन सबमिट करने में असमर्थ। कृपया सीधे संपर्क करें।" : "Failed to submit admission inquiry. Please call us directly."));
      }
    } catch {
      setAdmError(isHi ? `नेटवर्क त्रुटि। कृपया हमारे प्रवेश कार्यालय पर सीधे कॉल करें: ${school.contactPhone}` : "Network error. Please call our admission desk directly at " + school.contactPhone);
    } finally {
      setSubmittingAdm(false);
    }
  };

  // Persona Quick Switch (Safeguarded: Zero Hardcoded Passwords in Client Source)
  const handlePersonaLogin = (role: "principal" | "teacher" | "parent") => {
    setLoginRole(role);
    setLoginError("");
    setLoginSuccessMsg("");

    const isDakshora = slugParam.includes("dakshora") || !slugParam.includes("new-ideal");
    const domain = isDakshora ? "dakshoraacademy.edu.in" : "newidealpublicschool.edu.in";
    if (role === "principal") {
      setLoginIdentifier(`principal@${domain}`);
    } else if (role === "teacher") {
      setLoginIdentifier(`teacher@${domain}`);
    } else {
      setLoginIdentifier(`parent@${domain}`);
    }
    setLoginPassword("");
    const pwdInput = document.getElementById("login-password-input");
    if (pwdInput) {
      pwdInput.focus();
    }
  };

  // Real Credential Login Submission
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError(isHi ? "कृपया ईमेल/मोबाइल/आईडी एवं पासवर्ड दर्ज करें।" : "Please enter email/mobile/ID and password.");
      return;
    }
    setAuthenticating(true);
    setLoginError("");
    setLoginSuccessMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await parseJsonRes(res);
      if (res.ok && data?.success && (data?.token || data?.access_token) && data?.user) {
        const token = data.access_token || data.token;
        localStorage.setItem("dakshora_auth_token", token);
        localStorage.setItem("dakshora_superadmin_user", JSON.stringify(data.user));
        if (data.school) {
          localStorage.setItem("dakshora_school_brand", JSON.stringify(data.school));
        }

        const userRole = (data.user.role || "").toLowerCase();
        const surface =
          userRole === "parent" || userRole === "student"
            ? "parent_portal"
            : userRole === "superadmin"
            ? "admin_panel"
            : "school_erp";

        setLoginSuccessMsg(isHi ? `लॉगिन सफल! स्वागत है, ${data.user.name || "उपयोगकर्ता"}।` : `Authentication Successful! Welcome, ${data.user.name || "User"}.`);
        setTimeout(() => {
          window.location.href = `/portal?surface=${surface}&school=${slugParam}`;
        }, 700);
      } else {
        setLoginError(data?.message || (isHi ? "अमान्य क्रेडेंशियल्स। कृपया आईडी एवं पासवर्ड की पुष्टि करें।" : "Invalid credentials. Please verify username and password."));
      }
    } catch {
      setLoginError(isHi ? "सर्वर से संपर्क नहीं हो पाया। कृपया इंटरनेट कनेक्शन जांचें।" : "Server communication error. Please check your connection.");
    } finally {
      setAuthenticating(false);
    }
  };

  // Send Mobile OTP
  const handleSendOtp = async (channel: "sms" | "whatsapp") => {
    const cleanPhone = loginMobile.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length < 10) {
      setLoginError(isHi ? "कृपया 10-अंकों का वैध रजिस्टर्ड मोबाइल नंबर दर्ज करें।" : "Please enter a valid 10-digit registered mobile number.");
      return;
    }
    setSendingOtp(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, channel }),
      });
      const data = await parseJsonRes(res);
      if (res.ok && data?.success) {
        setOtpSent(true);
        const code = data.demoOtp || "784920";
        setLoginOtp(code);
        setLoginSuccessMsg(
          isHi
            ? `6-अंकों का OTP कोड भेज दिया गया है। (डेमो / परीक्षण OTP कोड: ${code})`
            : `6-Digit OTP dispatched via ${channel === "whatsapp" ? "WhatsApp" : "SMS"}. (Sandbox OTP: ${code})`
        );
      } else {
        setLoginError(data?.message || (isHi ? "ओटीपी भेजने में असमर्थ। मोबाइल नंबर की जांच करें।" : "Could not dispatch OTP. Please check your mobile number."));
      }
    } catch {
      setLoginError(isHi ? "ओटीपी भेजने के दौरान नेटवर्क त्रुटि हुई।" : "Network error while sending OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify Mobile OTP
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtp.trim() || loginOtp.trim().length !== 6) {
      setLoginError(isHi ? "कृपया 6-अंकों का ओटीपी कोड दर्ज करें।" : "Please enter the 6-digit OTP code.");
      return;
    }
    setAuthenticating(true);
    setLoginError("");
    try {
      const cleanPhone = loginMobile.replace(/\D/g, "").slice(-10);
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, otp: loginOtp.trim() }),
      });
      const data = await parseJsonRes(res);
      if (res.ok && data?.success && data?.user) {
        const token = data.access_token || data.token;
        localStorage.setItem("dakshora_auth_token", token);
        localStorage.setItem("dakshora_superadmin_user", JSON.stringify(data.user));

        const userRole = (data.user.role || "").toLowerCase();
        const surface =
          userRole === "parent" || userRole === "student"
            ? "parent_portal"
            : userRole === "superadmin"
            ? "admin_panel"
            : "school_erp";

        setLoginSuccessMsg(isHi ? `ओटीपी सत्यापित! स्वागत है, ${data.user.name || "उपयोगकर्ता"}।` : `OTP Verified! Welcome, ${data.user.name || "User"}.`);
        setTimeout(() => {
          window.location.href = `/portal?surface=${surface}&school=${slugParam}`;
        }, 700);
      } else {
        setLoginError(data?.message || (isHi ? "अमान्य या समाप्त हो चुका ओटीपी कोड।" : "Invalid or expired OTP code."));
      }
    } catch {
      setLoginError(isHi ? "नेटवर्क त्रुटि के कारण ओटीपी सत्यापन विफल रहा।" : "Verification failed due to a network error.");
    } finally {
      setAuthenticating(false);
    }
  };

  const apkUrl = slugParam.includes("dakshora") ? "/assets/mobile/dakshora-academy-parentapp-v2.0.0.apk" : "/assets/mobile/newidealpublicschool-parentapp-v2.0.0.apk";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT & CONTACT BAR */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-4 py-2.5 text-xs border-b border-indigo-800/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider animate-pulse">
              {t.announcement}
            </span>
            <span className="font-semibold text-indigo-100">
              {t.affiliationText(school.board, school.affiliationNumber || "CBSE-AFF-2130894", school.city)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-indigo-200">
            <a href={`tel:${school.contactPhone}`} className="hover:text-white transition-colors flex items-center gap-1 font-bold">
              <span>📞</span>
              <span>{school.contactPhone}</span>
            </a>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">✉️ {school.contactEmail}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER & NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & School Name */}
          <div
            onClick={() => scrollTo("home")}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            {school.logoUrl || cmsTree?.content?.schoolLogoUrl ? (
              <img
                src={school.logoUrl || cmsTree?.content?.schoolLogoUrl}
                alt={school.name}
                className="w-12 h-12 rounded-2xl object-contain bg-white p-1 border-2 border-slate-200 shadow-md shrink-0 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/25 shrink-0 group-hover:scale-105 transition-transform">
                {school.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                {school.name}
              </h1>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {isHi ? `सीबीएसई मान्यता प्राप्त • ${school.city} • आधिकारिक परिसर` : `${school.board} Affiliated • ${school.city} • Official Campus`}
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { id: "home", label: t.nav.home },
              { id: "about", label: t.nav.about },
              { id: "academics", label: t.nav.academics },
              { id: "facilities", label: t.nav.facilities },
              { id: "notices", label: t.nav.notices },
              { id: "admissions", label: t.nav.admissions },
              { id: "contact", label: t.nav.contact },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => scrollTo(nav.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSection === nav.id
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {nav.label}
              </button>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
              title={isHi ? "Switch to English" : "हिंदी भाषा में बदलें"}
            >
              <span>{isHi ? "🇮🇳" : "🇬🇧"}</span>
              <span className="font-extrabold">{isHi ? "हिंदी (Hindi)" : "English"}</span>
            </button>
            <a
              href={apkUrl}
              download
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>📱</span>
              <span>{t.nav.parentApp}</span>
            </a>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🔐</span>
              <span>{t.nav.erpLogin} →</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-cyan-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t.hero.badge(school.board, school.city)}</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                {cmsTree?.content?.heroHeadline || (isHi ? `${school.name} में आपका स्वागत है` : `Welcome to ${school.name}`)}
              </h2>
              <div className="text-sm font-mono text-cyan-300 font-semibold tracking-wide">
                {school.name} • {school.city} ({school.board} Board)
              </div>
            </div>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              {cmsTree?.content?.heroSubheadline || t.hero.desc}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => scrollTo("admissions")}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
              >
                {t.hero.btnAdmission}
              </button>
              <a
                href={apkUrl}
                download
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>📥</span>
                <span>{t.hero.btnApp}</span>
              </a>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-5 py-3.5 rounded-2xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/40 text-indigo-100 font-bold text-sm transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>🔐</span>
                <span>{t.hero.btnLogin}</span>
              </button>
            </div>

            {/* Quick Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
              {t.hero.stats.map((st, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                  <div className="text-xl font-black text-cyan-300">{st.val}</div>
                  <div className="text-xs text-slate-300 font-medium">{st.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-slate-900/80 p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-3xl">
                🏫
              </div>
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase text-cyan-400 font-bold">
                  {t.hero.campusCard.badge}
                </div>
                <div className="text-xl font-black text-white">
                  {isHi ? "न्यू आइडियल पब्लिक स्कूल" : school.name}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  📍 {school.address}
                </p>
                <p className="text-xs font-mono text-indigo-300">
                  {t.hero.campusCard.affiliationNo}: <strong>{school.affiliationNumber}</strong>
                </p>
                <p className="text-xs font-mono text-indigo-300">
                  {t.hero.campusCard.helpline}: <strong>{school.contactPhone}</strong>
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>{t.hero.campusCard.classes}</span>
                <span className="text-emerald-400 font-bold">● {t.hero.campusCard.open}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MOBILE APP DOWNLOAD SHOWCASE */}
      <section className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-y border-emerald-800/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase font-mono">
              <span>📱</span> {t.appSection.badge}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black">
              {isHi ? `${school.name} आधिकारिक मोबाइल ऐप डाउनलोड करें` : `Download ${school.name} Official Mobile App`}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200 max-w-xl leading-relaxed">
              {t.appSection.desc}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href={apkUrl}
              download
              className="px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <span className="text-lg">📥</span>
              <div className="text-left">
                <div className="text-xs uppercase tracking-wider font-extrabold">{t.appSection.btnBadge}</div>
                <div className="text-sm font-black">{t.appSection.btnTitle}</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 5. NOTICE BOARD & CIRCULARS */}
      <section id="notices" className="py-12 px-4 sm:px-6 lg:px-8 bg-indigo-50/70 border-b border-indigo-100">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black uppercase">
                📢 {t.noticesSection.badge}
              </span>
              <h3 className="text-xl font-black text-slate-900">
                {t.noticesSection.title}
              </h3>
            </div>
            <span className="text-xs font-mono text-indigo-700 font-bold">
              {t.noticesSection.session}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {t.noticesSection.items.map((n, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-2 hover:shadow-md transition-shadow"
              >
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                  {n.tag}
                </span>
                <h4 className="text-sm font-black text-slate-900">{n.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. INSTITUTIONAL LEADERSHIP: PRINCIPAL & MANAGING DIRECTOR */}
      <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-mono font-black uppercase tracking-wider inline-block">
            {isHi ? "संस्थागत नेतृत्व एवं मार्गदर्शन (Institutional Leadership)" : "Institutional Leadership & Vision"}
          </span>
          <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {isHi ? `${school.name}: प्रधानाचार्य व प्रबंध निदेशक का संदेश` : `Desk of the Principal & Managing Director`}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-mono">
            {isHi
              ? "विद्यार्थियों के सर्वांगीण विकास, वैज्ञानिक दृष्टिकोण और उच्च मानवीय मूल्यों के प्रति हमारी संस्थागत प्रतिबद्धता"
              : "Fostering academic distinction, ethical leadership, and scientific innovation for Session 2026-27."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Principal's Leadership Desk */}
          <div className="bg-white rounded-3xl border-2 border-indigo-100 p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-indigo-100 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-indigo-300 bg-indigo-50 overflow-hidden shadow-md shrink-0 ring-4 ring-indigo-50 group-hover:scale-105 transition-transform">
                  <img
                    src={
                      cmsTree?.content?.principalPhotoUrl ||
                      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80"
                    }
                    alt="Principal"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-indigo-100 text-indigo-900 border border-indigo-300 inline-block">
                    {isHi ? "प्रधानाचार्य का संदेश (Principal's Desk)" : "Principal's Desk"}
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-slate-950 mt-1">
                    {cmsTree?.content?.principalName || (isHi ? "डॉ. अनन्या शर्मा" : "Dr. Ananya Sharma")}
                  </h4>
                  <p className="text-xs font-mono font-bold text-indigo-700">
                    {cmsTree?.content?.principalTitle || (isHi ? "प्रधानाचार्य एवं शैक्षणिक प्रमुख" : "Principal & Head of Academics")}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {cmsTree?.content?.principalQualifications || "Ph.D. Education, M.Sc., B.Ed. (22+ Years in CBSE Leadership)"}
                  </p>
                </div>
              </div>

              <blockquote className="p-4 rounded-2xl bg-indigo-50/50 border-l-4 border-indigo-600 text-slate-700 italic text-xs sm:text-sm leading-relaxed">
                "{cmsTree?.content?.principalMessage || (isHi
                  ? "हमारा ध्येय प्रत्येक विद्यार्थी में वैज्ञानिक चिंतन, नैतिक चरित्र और भविष्योन्मुख नवाचार का विकास करना है ताकि वे वैश्विक मंच पर उत्कृष्ट प्रदर्शन कर सकें।"
                  : "Our mission is to empower young minds with scientific innovation, ethical leadership, and individual curiosity to excel globally.")}"
              </blockquote>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {isHi ? "सीबीएसई मान्यता प्राप्त परिसर" : "CBSE Affiliated Academic Enclave"}
              </span>
              <span className="text-[11px] font-bold text-slate-500">Session 2026-27</span>
            </div>
          </div>

          {/* Card 2: Managing Director & Chairman's Desk */}
          <div className="bg-white rounded-3xl border-2 border-purple-100 p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-purple-100 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-purple-300 bg-purple-50 overflow-hidden shadow-md shrink-0 ring-4 ring-purple-50 group-hover:scale-105 transition-transform">
                  <img
                    src={
                      cmsTree?.content?.directorPhotoUrl ||
                      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80"
                    }
                    alt="Managing Director"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-purple-100 text-purple-900 border border-purple-300 inline-block">
                    {isHi ? "प्रबंध निदेशक का विजन (Director's Vision)" : "Managing Director & Founder"}
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-slate-950 mt-1">
                    {cmsTree?.content?.directorName || (isHi ? "इंजी. राजेश दक्षोरा" : "Er. Rajesh Dakshora")}
                  </h4>
                  <p className="text-xs font-mono font-bold text-purple-700">
                    {cmsTree?.content?.directorTitle || (isHi ? "प्रबंध निदेशक एवं संस्थापक" : "Managing Director & Founder")}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {cmsTree?.content?.directorQualifications || "B.Tech (IIT Delhi), M.S. (Stanford), Education Futurist"}
                  </p>
                </div>
              </div>

              <blockquote className="p-4 rounded-2xl bg-purple-50/50 border-l-4 border-purple-600 text-slate-700 italic text-xs sm:text-sm leading-relaxed">
                "{cmsTree?.content?.directorMessage || (isHi
                  ? "दक्षोरा 2.0 आधुनिक डिजिटल अधोसंरचना, पारदर्शी संस्थागत प्रबंधन और समग्र छात्र-केंद्रित शिक्षा को एक ही एकीकृत क्लाउड डेटाबेस पर जोड़ता है।"
                  : "Dakshora 2.0 brings together world-class digital infrastructure, transparent governance, and holistic student-centric learning on a unified cloud database.")}"
              </blockquote>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {isHi ? "3-इन-1 एकीकृत तकनीक (वेबसाइट, ERP व ऐप)" : "3-in-1 Unified Tech (Website, ERP & App)"}
              </span>
              <span className="text-[11px] font-bold text-slate-500">Live Cloud Sync</span>
            </div>
          </div>
        </div>

        {/* Institution Highlights / Fast Facts Strip */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase">{isHi ? "बोर्ड संबद्धता" : "AFFILIATION"}</span>
            <span className="font-black text-amber-300 text-xs sm:text-sm">{school.affiliationNumber || "CBSE-AFF-2130894"}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase">{isHi ? "परिसर शहर" : "CAMPUS CITY"}</span>
            <span className="font-black text-cyan-300 text-xs sm:text-sm">{school.city || "New Delhi"}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase">{isHi ? "कक्षाएं" : "GRADES"}</span>
            <span className="font-black text-emerald-300 text-xs sm:text-sm">Nursery to Class XII</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase">{isHi ? "सत्र" : "SESSION"}</span>
            <span className="font-black text-purple-300 text-xs sm:text-sm">2026 - 2027</span>
          </div>
        </div>
      </section>

      {/* 7. ACADEMICS & SMART LABS */}
      <section id="academics" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black uppercase">
              {t.facilitiesSection.badge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              {t.facilitiesSection.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              {t.facilitiesSection.desc}
            </p>
          </div>

          <div id="facilities" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.facilitiesSection.items.map((fac, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl">{fac.icon}</div>
                <h4 className="text-base font-black text-slate-900">{fac.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{fac.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. ADMISSION INQUIRY FORM */}
      <section id="admissions" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 text-center space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase">
              {t.admissionsSection.badge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">
              {t.admissionsSection.title}
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-lg mx-auto">
              {t.admissionsSection.desc}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {admSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                  ✓
                </div>
                <h4 className="text-xl font-black text-slate-900">
                  {t.admissionsSection.successTitle}
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  {t.admissionsSection.successDesc(admForm.phone)}
                </p>
                <button
                  onClick={() => {
                    setAdmSubmitted(false);
                    setAdmForm({
                      studentName: "",
                      grade: "Class 1",
                      parentName: "",
                      phone: "",
                      email: "",
                      city: "Mathura",
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                >
                  {t.admissionsSection.btnAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdmissionSubmit} className="space-y-4">
                {admError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {admError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.admissionsSection.lblName}
                    </label>
                    <input
                      type="text"
                      required
                      value={admForm.studentName}
                      onChange={(e) => setAdmForm({ ...admForm, studentName: e.target.value })}
                      placeholder={t.admissionsSection.placeholderName}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.admissionsSection.lblGrade}
                    </label>
                    <select
                      value={admForm.grade}
                      onChange={(e) => setAdmForm({ ...admForm, grade: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    >
                      {[
                        "Nursery",
                        "LKG",
                        "UKG",
                        "Class 1",
                        "Class 2",
                        "Class 3",
                        "Class 4",
                        "Class 5",
                        "Class 6",
                        "Class 7",
                        "Class 8",
                        "Class 9",
                        "Class 10",
                        "Class 11 (Science)",
                        "Class 11 (Commerce)",
                        "Class 11 (Humanities)",
                        "Class 12",
                      ].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.admissionsSection.lblParent}
                    </label>
                    <input
                      type="text"
                      required
                      value={admForm.parentName}
                      onChange={(e) => setAdmForm({ ...admForm, parentName: e.target.value })}
                      placeholder={t.admissionsSection.placeholderParent}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.admissionsSection.lblPhone}
                    </label>
                    <input
                      type="tel"
                      required
                      value={admForm.phone}
                      onChange={(e) => setAdmForm({ ...admForm, phone: e.target.value })}
                      placeholder={t.admissionsSection.placeholderPhone}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.admissionsSection.lblEmail}
                    </label>
                    <input
                      type="email"
                      value={admForm.email}
                      onChange={(e) => setAdmForm({ ...admForm, email: e.target.value })}
                      placeholder={t.admissionsSection.placeholderEmail}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingAdm}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all disabled:opacity-50"
                >
                  {submittingAdm ? t.admissionsSection.btnSubmitting : t.admissionsSection.btnSubmit}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 9. FOOTER & CONTACT */}
      <footer id="contact" className="bg-slate-950 text-slate-300 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="text-lg font-black text-white">
              {isHi ? "न्यू आइडियल पब्लिक स्कूल" : school.name}
            </div>
            <p className="text-xs text-slate-400">
              {t.footerSection.tagline}
            </p>
            <p className="text-xs text-slate-400">📍 {school.address}</p>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-white uppercase font-mono">{t.footerSection.contactTitle}</div>
            <div>📞 {t.footerSection.phone}: {school.contactPhone}</div>
            <div>✉️ {t.footerSection.email}: {school.contactEmail}</div>
            <div>🏫 {t.footerSection.code}: 2026100001</div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-white uppercase font-mono">{t.footerSection.quickAccess}</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer"
              >
                {t.footerSection.erpLogin}
              </button>
              <a
                href={apkUrl}
                download
                className="px-3 py-1.5 rounded-lg bg-emerald-600/60 hover:bg-emerald-600 text-white font-semibold cursor-pointer"
              >
                {t.footerSection.downloadApp}
              </a>
              <button
                onClick={() => scrollTo("admissions")}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer"
              >
                {t.footerSection.applyAdm}
              </button>
            </div>
            <p className="text-[11px] font-mono text-slate-500 pt-2">
              {t.footerSection.portalTag}
            </p>
          </div>
        </div>
      </footer>

      {/* 10. DEDICATED ERP LOGIN MODAL (PRINCIPAL • TEACHER • PARENT) */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/30 shadow-2xl rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                  {school.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    {isHi ? "न्यू आइडियल पब्लिक स्कूल" : school.name}
                  </h3>
                  <p className="text-xs font-mono text-indigo-300">
                    {t.loginModal.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsLoginOpen(false);
                  setLoginError("");
                  setLoginSuccessMsg("");
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Role Selection Tabs */}
            <div className="p-4 sm:p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  {t.loginModal.selectRole}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "principal" as const,
                      icon: "🏫",
                      title: t.loginModal.principal.title,
                      sub: t.loginModal.principal.sub,
                      color: "from-amber-500 to-orange-600",
                    },
                    {
                      id: "teacher" as const,
                      icon: "👨‍🏫",
                      title: t.loginModal.teacher.title,
                      sub: t.loginModal.teacher.sub,
                      color: "from-indigo-600 to-blue-600",
                    },
                    {
                      id: "parent" as const,
                      icon: "👨‍👩‍👧",
                      title: t.loginModal.parent.title,
                      sub: t.loginModal.parent.sub,
                      color: "from-emerald-500 to-teal-600",
                    },
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setLoginRole(role.id);
                        setLoginError("");
                        const isDakshora = slugParam.includes("dakshora") || !slugParam.includes("new-ideal");
                        const domain = isDakshora ? "dakshoraacademy.edu.in" : "newidealpublicschool.edu.in";
                        if (role.id === "principal") {
                          setLoginIdentifier(`principal@${domain}`);
                        } else if (role.id === "teacher") {
                          setLoginIdentifier(`teacher@${domain}`);
                        } else {
                          setLoginIdentifier(`parent@${domain}`);
                        }
                        setLoginPassword("");
                      }}
                      className={`p-3 rounded-2xl text-center border-2 transition-all cursor-pointer ${
                        loginRole === role.id
                          ? `bg-gradient-to-br ${role.color} text-white border-white/40 shadow-lg scale-[1.02]`
                          : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80"
                      }`}
                    >
                      <div className="text-2xl mb-1">{role.icon}</div>
                      <div className="text-xs font-black leading-tight">{role.title}</div>
                      <div className="text-[10px] opacity-80 font-medium">({role.sub})</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Context Helper Banner */}
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 text-xs flex items-center gap-2.5">
                <span className="text-lg">
                  {loginRole === "principal" ? "🏫" : loginRole === "teacher" ? "👨‍🏫" : "👨‍👩‍👧"}
                </span>
                <div className="text-slate-300">
                  {loginRole === "principal" && <span>{t.loginModal.principal.context}</span>}
                  {loginRole === "teacher" && <span>{t.loginModal.teacher.context}</span>}
                  {loginRole === "parent" && <span>{t.loginModal.parent.context}</span>}
                </div>
              </div>

              {/* Login Method Switcher (Password vs OTP) */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("password");
                    setLoginError("");
                  }}
                  className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                    loginMethod === "password"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.loginModal.tabPassword}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("otp");
                    setLoginError("");
                  }}
                  className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                    loginMethod === "otp"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.loginModal.tabOtp}
                </button>
              </div>

              {/* Error & Success Messages */}
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono">
                  ⚠️ {loginError}
                </div>
              )}
              {loginSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                  ✅ {loginSuccessMsg}
                </div>
              )}

              {/* Form A: Password Login */}
              {loginMethod === "password" && (
                <form onSubmit={handlePasswordLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      {loginRole === "principal"
                        ? t.loginModal.principal.labelId
                        : loginRole === "teacher"
                        ? t.loginModal.teacher.labelId
                        : t.loginModal.parent.labelId}
                    </label>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={
                        loginRole === "principal"
                          ? t.loginModal.principal.placeholderId
                          : loginRole === "teacher"
                          ? t.loginModal.teacher.placeholderId
                          : t.loginModal.parent.placeholderId
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-mono text-slate-300">
                        {t.loginModal.lblPassword}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] font-mono text-indigo-400 hover:underline cursor-pointer"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authenticating}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:brightness-110 text-white font-bold text-xs font-mono shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {authenticating ? t.loginModal.btnVerifying : t.loginModal.btnSignIn}
                  </button>
                </form>
              )}

              {/* Form B: Mobile OTP Login */}
              {loginMethod === "otp" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      {t.loginModal.lblMobile}
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={loginMobile}
                      onChange={(e) => setLoginMobile(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  {!otpSent ? (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSendOtp("sms")}
                        disabled={sendingOtp || loginMobile.length < 10}
                        className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {sendingOtp ? "..." : t.loginModal.btnSmsOtp}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendOtp("whatsapp")}
                        disabled={sendingOtp || loginMobile.length < 10}
                        className="py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {sendingOtp ? "..." : t.loginModal.btnWhatsappOtp}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyOtpSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-mono text-cyan-300 mb-1">
                          {t.loginModal.otpSentTo(loginMobile.slice(-10))}
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={loginOtp}
                          onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="••••••"
                          className="w-full bg-slate-950 border border-cyan-500/50 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-cyan-300 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={authenticating || loginOtp.length !== 6}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs font-mono shadow-lg transition-all cursor-pointer disabled:opacity-50"
                      >
                        {authenticating ? t.loginModal.btnVerifying : t.loginModal.btnVerifyOtp}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Quick Persona Demo Buttons (1-Click Test Drive) */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">{t.loginModal.demoTitle}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePersonaLogin("principal")}
                    className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold transition-all cursor-pointer text-center"
                  >
                    <div>{t.loginModal.demoPrincipal}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePersonaLogin("teacher")}
                    className="p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold transition-all cursor-pointer text-center"
                  >
                    <div>{t.loginModal.demoTeacher}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePersonaLogin("parent")}
                    className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer text-center"
                  >
                    <div>{t.loginModal.demoParent}</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
