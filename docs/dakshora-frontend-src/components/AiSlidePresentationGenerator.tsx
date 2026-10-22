import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  Copy,
  Printer,
  CheckCircle2,
  RefreshCw,
  Layers,
  Award,
  BookOpen,
  Calendar,
  Clock,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Check,
  Eye,
  EyeOff,
  Cpu,
  FlaskConical,
  Brain,
  Sliders,
  Play
} from 'lucide-react';
import { generateAiPresentation } from '../services/api';
import type { AiPresentationData, PresentationSlide, PresentationQuizItem, QuestionBoardType } from '../types';

interface AiSlidePresentationGeneratorProps {
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

const K12_SUBJECTS: Record<string, string[]> = {
  'Primary (1-5)': ['Mathematics (गणित)', 'Environmental Studies (EVS)', 'English', 'Hindi (हिंदी)', 'General Science'],
  'Middle (6-8)': ['Science (विज्ञान)', 'Mathematics (गणित)', 'Social Science (सामाजिक विज्ञान)', 'English', 'Hindi (हिंदी)', 'Sanskrit (संस्कृत)'],
  'Secondary (9-10)': ['Science (विज्ञान)', 'Mathematics (गणित)', 'Social Science (सामाजिक विज्ञान)', 'English', 'Hindi (हिंदी)', 'Information Technology (IT 402)'],
  'Senior Sec (11-12)': ['Physics (भौतिक विज्ञान)', 'Chemistry (रसायन विज्ञान)', 'Mathematics (गणित)', 'Biology (जीव विज्ञान)', 'Accountancy (लेखाशास्त्र)', 'Business Studies', 'Economics', 'English Core', 'Computer Science']
};

export const AiSlidePresentationGenerator: React.FC<AiSlidePresentationGeneratorProps> = ({ onShowToast }) => {
  // Input states
  const [board, setBoard] = useState<QuestionBoardType>('cbse');
  const [grade, setGrade] = useState<string>('Class 10');
  const [subject, setSubject] = useState<string>('Science (विज्ञान)');
  const [topic, setTopic] = useState<string>('Light: Reflection and Refraction (प्रकाश: परावर्तन एवं अपवर्तन)');
  const [targetAudience, setTargetAudience] = useState<string>('Board Exam Prep & Concept Clarity');
  const [languageMedium, setLanguageMedium] = useState<'bilingual' | 'english' | 'hindi'>('bilingual');
  const [slideCount, setSlideCount] = useState<number>(8);

  // Generation & View states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAiPowered, setIsAiPowered] = useState<boolean>(false);
  const [aiModelUsed, setAiModelUsed] = useState<string>('');
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTeacherNotes, setShowTeacherNotes] = useState<boolean>(true);
  const [revealedQuizAnswers, setRevealedQuizAnswers] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState<boolean>(false);
  const [theme, setTheme] = useState<'slate' | 'oled' | 'ocean' | 'emerald'>('slate');

  // Live Presentation Data
  const [presentation, setPresentation] = useState<AiPresentationData>(() => ({
    schoolName: 'DAKSHORA SMART CLASSROOM',
    board: 'CBSE',
    grade: 'Class 10',
    subject: 'Science (विज्ञान)',
    topic: 'Light: Reflection and Refraction (प्रकाश: परावर्तन एवं अपवर्तन)',
    targetAudience: 'Secondary Students',
    languageMedium: 'bilingual',
    totalSlides: 8,
    estimatedDuration: '45 Mins Interactive Classroom Session',
    slides: [
      {
        slideNumber: 1,
        slideType: 'title',
        title: 'Light: Reflection & Spherical Mirrors',
        subtitle: 'प्रकाश का परावर्तन एवं गोलीय दर्पण — Master Key Concepts',
        bulletPoints: [
          'Laws of Reflection & Normal ray geometry (परावर्तन के नियम)',
          'Concave vs Convex Mirrors: Ray Diagrams (अवतल व उत्तल दर्पण)',
          'Mirror Formula & Sign Convention (दर्पण सूत्र व चिन्ह परिपाटी)',
          'High-Yield CBSE 2026 Board Questions & Numerical Practice'
        ],
        keyTakeaway: 'Mastering ray tracing ensures 5/5 marks in Section C & D Board Exam questions.',
        teacherNote: 'Begin class with a shiny spoon demonstration: show inverted image inside, erect image outside.'
      },
      {
        slideNumber: 2,
        slideType: 'hook',
        title: 'Curiosity Trigger: The Spoon & Rear-View Mystery',
        subtitle: 'Why does your reflection flip upside down inside a spoon?',
        bulletPoints: [
          'Inside curvature = Concave Mirror (कन्वर्जिंग / अभिसारी दर्पण)',
          'Outside curvature = Convex Mirror (डाइवर्जिंग / अपसारी दर्पण)',
          'Why do cars write AMBULANCE in reverse on the front hood?',
          'Lateral Inversion: Left appears right, right appears left.'
        ],
        keyTakeaway: 'Concave mirrors form both real (inverted) and virtual (erect) images based on object distance.',
        teacherNote: 'Ask 2 students to explain why rearview mirrors state "Objects in mirror are closer than they appear".'
      },
      {
        slideNumber: 3,
        slideType: 'concept',
        title: 'Core Rules of Ray Tracing (किरण आरेख के 4 स्वर्णिम नियम)',
        subtitle: 'How to draw flawless Ray Diagrams for Board Exams',
        bulletPoints: [
          'Rule 1: Ray parallel to Principal Axis passes through Focus (F) after reflection.',
          'Rule 2: Ray passing through Principal Focus (F) emerges parallel to Principal Axis.',
          'Rule 3: Ray passing through Center of Curvature (C) retraces its path back at 90° incidence.',
          'Rule 4: Ray incident at Pole (P) reflects at equal angle obeying Law of Reflection (∠i = ∠r).'
        ],
        keyTakeaway: 'Any two intersecting reflected rays determine the exact position, nature, and size of the image.',
        teacherNote: 'Have students draw Rules 1 & 3 in their notebooks simultaneously on blackboard.'
      },
      {
        slideNumber: 4,
        slideType: 'diagram',
        title: 'Mirror Formula & Cartesian Sign Convention',
        subtitle: 'चिन्ह परिपाटी एवं आंकिक प्रश्न (Numerical Mastery)',
        bulletPoints: [
          'Mirror Formula: 1/f = 1/v + 1/u',
          'Magnification (m): m = -v/u = h_i / h_o',
          'Object distance (u) is ALWAYS negative: u < 0 in all cases.',
          'Concave Mirror Focus: f is ALWAYS Negative (f < 0).',
          'Convex Mirror Focus: f is ALWAYS Positive (f > 0).'
        ],
        formulaOrCode: '1 / f = (1 / v) + (1 / u)\nm = - (v / u) = (h_image / h_object)\n[Real Image => m is Negative | Virtual Image => m is Positive]',
        keyTakeaway: 'Always assign signs to known variables BEFORE solving; never assign sign to unknown variable.',
        teacherNote: 'Highlight that 80% of students lose marks because they forget the minus sign in m = -v/u.'
      },
      {
        slideNumber: 5,
        slideType: 'application',
        title: 'Real-World Applications: Technology in Action',
        subtitle: 'जहाँ विज्ञान दैनिक जीवन में चमत्कार करता है',
        bulletPoints: [
          'Solar Cookers & Furnaces: Large concave mirrors concentrate sunlight at focus to reach >2000°C.',
          'Dentist Headlights & Shaving Mirrors: Object placed between Pole and Focus produces erect, enlarged image.',
          'ATM & Street Blind Turn Mirrors: Convex mirrors offer wide Field of View for driver & security.',
          'Headlights of Cars: Light source placed at Focus produces a powerful parallel beam into the distance.'
        ],
        keyTakeaway: 'Convex mirrors always produce virtual, erect, and diminished images regardless of object distance.',
        teacherNote: 'Show images of ATM mirrors or ask students where they noticed convex safety mirrors in Jaipur.'
      },
      {
        slideNumber: 6,
        slideType: 'mistakes',
        title: 'Board Exam Traps: Common Mistakes to Avoid ⚠️',
        subtitle: 'Where 70% of students lose marks in Class 10 Board Exams',
        bulletPoints: [
          'Mistake 1: Forgetting directional arrowheads on light rays (Instant 1 mark deduction per diagram).',
          'Mistake 2: Writing m = +v/u for mirrors (Lens formula has +, Mirror formula has -).',
          'Mistake 3: Confusing Center of Curvature (C = 2f) with Focus (F = R/2).',
          'Mistake 4: Not mentioning nature of image: Real & Inverted vs Virtual & Erect.'
        ],
        keyTakeaway: 'Never draw freehand rays. Always use a ruler, mark arrows, and state focal length with unit (cm).',
        teacherNote: 'Emphasize: "Arrowheads are the heartbeat of Ray Diagrams. No arrow, no marks!"'
      },
      {
        slideNumber: 7,
        slideType: 'quiz',
        title: 'Live Classroom Spot Quiz (तत्काल मूल्यांकन)',
        subtitle: 'Test your understanding before the bell rings!',
        bulletPoints: [
          'Identify the correct answer and justify with the Mirror Formula.'
        ],
        quiz: [
          {
            question: 'An object is placed at 20 cm in front of a concave mirror of focal length 15 cm. The nature and position of the image is:',
            options: [
              'A) Real, inverted and beyond 2F (v = -60 cm)',
              'B) Virtual, erect and behind mirror (v = +60 cm)',
              'C) Real, inverted and between F and 2F (v = -30 cm)',
              'D) Real, inverted and at 2F (v = -20 cm)'
            ],
            correctAnswer: 'A) Real, inverted and beyond 2F (v = -60 cm)',
            explanation: '1/f = 1/v + 1/u => 1/(-15) = 1/v + 1/(-20) => 1/v = 1/20 - 1/15 = (3-4)/60 = -1/60 => v = -60 cm. Since v is negative, image is Real, Inverted and Beyond 2F.'
          },
          {
            question: 'Which of the following mirrors is strictly used as a rear-view mirror in vehicles?',
            options: [
              'A) Plane mirror',
              'B) Concave mirror',
              'C) Convex mirror',
              'D) Cylindrical mirror'
            ],
            correctAnswer: 'C) Convex mirror',
            explanation: 'Convex mirrors always provide an erect, diminished image and have a significantly wider field of view than plane mirrors.'
          }
        ],
        keyTakeaway: 'Immediate formative feedback strengthens conceptual retention by 400%.',
        teacherNote: 'Conduct a quick thumbs up/down voting round before revealing the explanation!'
      },
      {
        slideNumber: 8,
        slideType: 'summary',
        title: 'Summary & Practice Assignment',
        subtitle: 'आज का सारांश एवं गृहकार्य (Daily Practice Sheet)',
        bulletPoints: [
          'Core Formula: 1/f = 1/v + 1/u with strict Cartesian sign convention.',
          'Concave: Versatile mirror (Real/Inverted normally, Virtual/Erect when object is between P and F).',
          'Convex: Security & safety mirror (Always Virtual, Erect, Diminished).',
          'Homework: Complete NCERT Page 171 In-Text Questions 1 to 4 in Science notebook.',
          'Tomorrow: Refraction of Light, Snell Law and Lens Formula.'
        ],
        keyTakeaway: 'Light behaves predictably. Practice drawing all 6 concave mirror cases once tonight.',
        teacherNote: 'Check notebooks tomorrow during the first 5 minutes.'
      }
    ]
  }));

  // Keyboard navigation for smart board presentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setActiveSlideIndex((prev) => Math.min(prev + 1, (presentation?.slides?.length || 1) - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentation]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      onShowToast?.('warning', 'कृपया विषय / टॉपिक दर्ज करें', 'टॉपिक अनिवार्य है');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateAiPresentation({
        board,
        grade,
        subject,
        topic,
        targetAudience,
        languageMedium,
        slideCount
      });

      const apiResult = (res.data as any);
      const generatedPres = apiResult?.presentation || apiResult?.data?.presentation;

      if ((res.status === 200 || apiResult?.success) && generatedPres && generatedPres.slides) {
        setPresentation(generatedPres);
        setActiveSlideIndex(0);
        setRevealedQuizAnswers({});
        const aiPowered = !!(apiResult.aiPowered ?? apiResult?.data?.aiPowered);
        const modelUsed = apiResult.model || apiResult?.data?.model || 'gemini-3-flash-preview';
        setIsAiPowered(aiPowered);
        setAiModelUsed(modelUsed);

        onShowToast?.(
          'success',
          aiPowered ? '✨ Google Gemini AI द्वारा स्मार्ट बोर्ड PPT तैयार!' : 'स्मार्ट बोर्ड प्रेजेंटेशन तैयार!',
          `${grade} ${subject} — "${topic}" की 8 स्लाइड प्रेजेंटेशन तैयार हुई।`
        );
      } else {
        throw new Error(apiResult?.message || 'Failed to generate presentation');
      }
    } catch (err: any) {
      console.error('[AI Presentation] Error:', err);
      onShowToast?.('info', 'स्थानीय टेम्पलेट लोड किया गया', 'AI बैकएंड व्यस्त है, स्मार्ट बोर्ड प्रेजेंटेशन प्रदर्शित है।');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentSlide: PresentationSlide = presentation?.slides?.[activeSlideIndex] || presentation?.slides?.[0];

  const toggleQuizAnswer = (qIdx: number) => {
    setRevealedQuizAnswers((prev) => ({
      ...prev,
      [qIdx]: !prev[qIdx]
    }));
  };

  const handleCopyPresentationText = () => {
    if (!presentation || !presentation.slides) return;
    const presTitle = presentation.topic || presentation.presentationTitle || 'Topic';
    const totalCount = presentation.totalSlides || presentation.slideCount || presentation.slides.length;
    let text = `${presentation.schoolName}\n${presentation.grade} | ${presentation.subject} | ${presTitle}\nTotal Slides: ${totalCount}\n\n`;

    presentation.slides.forEach((s) => {
      text += `--- SLIDE ${s.slideNumber}: ${s.title.toUpperCase()} ---\n`;
      if (s.subtitle) text += `Subtitle: ${s.subtitle}\n`;
      if (s.bulletPoints) {
        s.bulletPoints.forEach((b) => (text += `• ${b}\n`));
      }
      if (s.formulaOrCode) text += `Formula:\n${s.formulaOrCode}\n`;
      if (s.keyTakeaway) text += `Key Takeaway: ${s.keyTakeaway}\n`;
      if (s.teacherNote) text += `Teacher Note: ${s.teacherNote}\n`;
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast?.('success', 'स्लाइड कंटेंट कॉपी हुआ', 'प्रेजेंटेशन का टेक्स्ट क्लिपबोर्ड में कॉपी हो गया है।');
  };

  // Generate self-contained offline HTML slide presentation with embedded interactive viewer!
  const handleDownloadHtmlSlides = () => {
    if (!presentation || !presentation.slides) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${presentation.topic} - DAKSHORA Smart Board Slide Deck</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --accent: #38bdf8;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    header { background: #0b1120; border-bottom: 1px solid #334155; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
    .badge { background: #0284c7; color: #fff; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; position: relative; }
    .slide-card { background: var(--card); border: 2px solid #334155; border-radius: 16px; width: 100%; max-width: 1100px; height: 80vh; padding: 40px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    h1 { font-size: 2.2rem; color: #38bdf8; margin-bottom: 8px; }
    h2 { font-size: 1.2rem; color: #cbd5e1; font-weight: 400; margin-bottom: 24px; }
    .bullets { list-style: none; display: flex; flex-direction: column; gap: 14px; font-size: 1.25rem; flex: 1; }
    .bullets li { display: flex; align-items: flex-start; gap: 12px; line-height: 1.5; }
    .bullets li::before { content: "✦"; color: #38bdf8; font-weight: bold; }
    .takeaway-box { background: rgba(56, 189, 248, 0.1); border-left: 4px solid #38bdf8; padding: 14px 18px; border-radius: 8px; margin-top: 20px; font-size: 1rem; color: #e2e8f0; }
    .teacher-box { background: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; padding: 10px 16px; border-radius: 8px; margin-top: 10px; font-size: 0.9rem; color: #fef08a; }
    footer { background: #0b1120; border-top: 1px solid #334155; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
    button { background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    button:hover { background: #0369a1; }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    .slide { display: none; }
    .slide.active { display: flex; }
    .formula-box { background: #000; border: 1px solid #475569; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 1.1rem; color: #4ade80; margin: 16px 0; white-space: pre-wrap; }
  </style>
</head>
<body>
  <header>
    <div>
      <span class="badge">DAKSHORA SMART BOARD 2.0</span>
      <span style="margin-left: 12px; font-weight: 600;">${presentation.grade} | ${presentation.subject}</span>
    </div>
    <div style="font-size: 14px; color: var(--muted);">${presentation.topic || presentation.presentationTitle || ''}</div>
  </header>

  <main>
    ${presentation.slides
      .map(
        (s, idx) => `
    <div class="slide slide-card ${idx === 0 ? 'active' : ''}" id="slide-${idx}">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Slide ${s.slideNumber} of ${presentation.totalSlides || presentation.slideCount || presentation.slides.length} • ${(s.slideType || '').toUpperCase()}</span>
          <span class="badge">${presentation.board || 'CBSE'}</span>
        </div>
        <h1>${s.title}</h1>
        ${s.subtitle ? `<h2>${s.subtitle}</h2>` : ''}
      </div>

      <div style="flex: 1; overflow-y: auto;">
        ${
          s.formulaOrCode
            ? `<div class="formula-box">${s.formulaOrCode}</div>`
            : ''
        }
        <ul class="bullets">
          ${(s.bulletPoints || []).map((bp: string) => `<li>${bp}</li>`).join('')}
        </ul>
        ${
          s.quiz && s.quiz.length > 0
            ? `<div style="margin-top: 16px; background: rgba(30, 41, 59, 0.8); padding: 16px; border-radius: 12px; border: 1px solid #475569;">
                <b style="color: #38bdf8;">Classroom Quiz:</b>
                <div style="margin-top: 8px; font-size: 1.1rem;">${s.quiz[0].question || s.quiz[0].q || ''}</div>
                <div style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  ${(s.quiz[0].options || []).map((opt: string) => `<div style="background: #0f172a; padding: 8px 12px; border-radius: 6px; font-size: 0.95rem;">${opt}</div>`).join('')}
                </div>
                <div style="margin-top: 12px; padding: 8px 12px; background: #064e3b; border-radius: 6px; color: #a7f3d0; font-size: 0.9rem;">
                  <b>Answer:</b> ${s.quiz[0].correctAnswer || s.quiz[0].ans || ''}<br>
                  <span style="font-size: 0.85rem;">${s.quiz[0].explanation || ''}</span>
                </div>
              </div>`
            : ''
        }
      </div>

      <div>
        ${s.keyTakeaway ? `<div class="takeaway-box"><b>💡 Key Takeaway:</b> ${s.keyTakeaway}</div>` : ''}
        ${s.teacherNote ? `<div class="teacher-box"><b>👩‍🏫 Teacher Note:</b> ${s.teacherNote}</div>` : ''}
      </div>
    </div>
    `
      )
      .join('')}
  </main>

  <footer>
    <button id="prevBtn" onclick="changeSlide(-1)">◀ Previous</button>
    <div id="slideCounter" style="font-weight: 600;">Slide 1 of ${presentation.totalSlides || presentation.slideCount || presentation.slides.length}</div>
    <button id="nextBtn" onclick="changeSlide(1)">Next ▶</button>
  </footer>

  <script>
    let currentIndex = 0;
    const total = ${presentation.slides.length};
    function showSlide(index) {
      if (index < 0 || index >= total) return;
      document.querySelectorAll('.slide').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
      currentIndex = index;
      document.getElementById('slideCounter').innerText = 'Slide ' + (currentIndex + 1) + ' of ' + total;
      document.getElementById('prevBtn').disabled = currentIndex === 0;
      document.getElementById('nextBtn').disabled = currentIndex === total - 1;
    }
    function changeSlide(dir) {
      showSlide(currentIndex + dir);
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') changeSlide(1);
      if (e.key === 'ArrowLeft') changeSlide(-1);
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      }
    });
    showSlide(0);
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (presentation.topic || presentation.presentationTitle || 'SmartBoard_Classroom').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `${safeName}_SmartBoard_Slides.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onShowToast?.(
      'success',
      'स्मार्ट बोर्ड HTML फाइल डाउनलोड हुई!',
      'इस फाइल को किसी भी स्मार्ट बोर्ड (Interactive Flat Panel) या ब्राउज़र में बिना इंटरनेट चला सकते हैं।'
    );
  };

  const themeStyles = {
    slate: 'bg-slate-900 border-slate-700 text-slate-100',
    oled: 'bg-black border-zinc-800 text-zinc-100',
    ocean: 'bg-sky-950 border-sky-800 text-sky-100',
    emerald: 'bg-emerald-950 border-emerald-800 text-emerald-100'
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto' : ''}`}>
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
              Phase 3 Live • Smart Board AI
            </span>
            {isAiPowered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                <Sparkles className="w-3 h-3" />
                Gemini AI ({aiModelUsed})
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1">
            AI Smart Board PPT / Classroom Presentation
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            इंटरएक्टिव क्लासरूम स्लाइड जनरेटर — स्मार्ट बोर्ड, प्रोजेक्टर एवं डिजिटल स्क्रीन हेतु 8-स्लाइड्स पेडागोजी डेक
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            title="Toggle Smart Board Fullscreen Mode (Press F)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Smart Board Mode (F)'}</span>
          </button>

          <button
            onClick={handleCopyPresentationText}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Deck'}</span>
          </button>

          <button
            onClick={handleDownloadHtmlSlides}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Offline Smart Board (HTML)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls (if not in fullscreen) + Right Slide Viewer */}
      <div className={`grid grid-cols-1 ${isFullscreen ? 'lg:grid-cols-1 flex-1' : 'lg:grid-cols-12'} gap-6`}>
        {/* Left Settings Panel */}
        {!isFullscreen && (
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <Sliders className="w-4 h-4 text-violet-600" />
                  <span>Presentation Settings</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Classroom Deck</span>
              </div>

              {/* Board Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Board (बोर्ड)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['cbse', 'rbse', 'upmsp'] as QuestionBoardType[]).map((b) => (
                    <button
                      key={b}
                      onClick={() => setBoard(b)}
                      className={`py-1.5 px-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                        board === b
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Grade / Class (कक्षा)
                </label>
                <select
                  value={grade}
                  onChange={(e) => {
                    const newGrade = e.target.value;
                    setGrade(newGrade);
                    const gradeNum = parseInt(newGrade.replace(/[^0-9]/g, '')) || 10;
                    let cat = 'Secondary (9-10)';
                    if (gradeNum <= 5) cat = 'Primary (1-5)';
                    else if (gradeNum <= 8) cat = 'Middle (6-8)';
                    else if (gradeNum >= 11) cat = 'Senior Sec (11-12)';
                    const available = K12_SUBJECTS[cat] || [];
                    if (available.length > 0) setSubject(available[0]);
                  }}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  <optgroup label="Primary (कक्षा 1 से 5)">
                    <option value="Class 1">Class 1 (कक्षा 1)</option>
                    <option value="Class 2">Class 2 (कक्षा 2)</option>
                    <option value="Class 3">Class 3 (कक्षा 3)</option>
                    <option value="Class 4">Class 4 (कक्षा 4)</option>
                    <option value="Class 5">Class 5 (कक्षा 5)</option>
                  </optgroup>
                  <optgroup label="Middle (कक्षा 6 से 8)">
                    <option value="Class 6">Class 6 (कक्षा 6)</option>
                    <option value="Class 7">Class 7 (कक्षा 7)</option>
                    <option value="Class 8">Class 8 (कक्षा 8)</option>
                  </optgroup>
                  <optgroup label="Secondary (कक्षा 9 व 10)">
                    <option value="Class 9">Class 9 (कक्षा 9)</option>
                    <option value="Class 10">Class 10 (कक्षा 10)</option>
                  </optgroup>
                  <optgroup label="Senior Secondary (कक्षा 11 व 12)">
                    <option value="Class 11">Class 11 (कक्षा 11)</option>
                    <option value="Class 12">Class 12 (कक्षा 12)</option>
                  </optgroup>
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject (विषय)
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  {Object.entries(K12_SUBJECTS).map(([group, subjs]) => (
                    <optgroup key={group} label={group}>
                      {subjs.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Topic Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic / Chapter Name (पाठ / विषय)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="उदा. Light: Reflection, Thermodynamics, Trigonometry"
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              {/* Language Medium */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Language Medium (माध्यम)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'bilingual', label: 'Bilingual (द्विभाषी)' },
                    { id: 'english', label: 'English Only' },
                    { id: 'hindi', label: 'हिंदी केवल' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLanguageMedium(l.id as any)}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all text-center ${
                        languageMedium === l.id
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart Board Theme Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Smart Board Theme (स्क्रीन थीम)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'slate', label: 'Dark Slate' },
                    { id: 'oled', label: 'OLED Pure' },
                    { id: 'ocean', label: 'Ocean Blue' },
                    { id: 'emerald', label: 'Emerald' }
                  ].map((th) => (
                    <button
                      key={th.id}
                      onClick={() => setTheme(th.id as any)}
                      className={`py-1 text-[11px] font-bold rounded border transition-all ${
                        theme === th.id
                          ? 'bg-slate-800 text-white border-violet-500 ring-2 ring-violet-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Creating Smart Board Deck...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Smart Board PPT (AI)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Right Smart Board Slide Player */}
        <div className={`${isFullscreen ? 'lg:col-span-1 flex-1 flex flex-col justify-between' : 'lg:col-span-8'} space-y-4`}>
          {/* Slide Deck Screen */}
          <div
            className={`rounded-2xl border p-6 md:p-8 flex flex-col justify-between transition-all ${
              themeStyles[theme]
            } ${isFullscreen ? 'min-h-[75vh]' : 'min-h-[580px]'}`}
          >
            {/* Slide Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-black tracking-wider uppercase">
                  Slide {currentSlide?.slideNumber || activeSlideIndex + 1} of {presentation?.slides?.length || 8}
                </span>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  {currentSlide?.slideType}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTeacherNotes(!showTeacherNotes)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                >
                  {showTeacherNotes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showTeacherNotes ? 'Hide Notes' : 'Teacher Notes'}</span>
                </button>
                <span className="text-xs font-bold text-slate-400">
                  {presentation.board || 'CBSE'} • {presentation.grade}
                </span>
              </div>
            </div>

            {/* Slide Content Body */}
            <div className="flex-1 flex flex-col justify-center py-2 space-y-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2 leading-tight">
                  {currentSlide?.title}
                </h1>
                {currentSlide?.subtitle && (
                  <h2 className="text-sm md:text-base font-medium text-slate-300 leading-snug">
                    {currentSlide.subtitle}
                  </h2>
                )}
              </div>

              {/* Formula or Code box if provided */}
              {currentSlide?.formulaOrCode && (
                <div className="bg-slate-950/80 border border-violet-500/40 rounded-xl p-4 font-mono text-emerald-300 text-xs md:text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                  {currentSlide.formulaOrCode}
                </div>
              )}

              {/* Bullet Points */}
              {currentSlide?.bulletPoints && currentSlide.bulletPoints.length > 0 && (
                <ul className="space-y-3">
                  {currentSlide.bulletPoints.map((bp: string, bpIdx: number) => (
                    <li key={bpIdx} className="flex items-start gap-3 text-sm md:text-base leading-relaxed text-slate-100">
                      <span className="mt-1 text-violet-400 font-bold">✦</span>
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Spot Quiz Block for Quiz Slide */}
              {currentSlide?.slideType === 'quiz' && currentSlide?.quiz && currentSlide.quiz.length > 0 && (
                <div className="space-y-3 bg-slate-950/60 border border-slate-700/80 rounded-xl p-4 md:p-5 mt-2">
                  {currentSlide.quiz.map((qItem: PresentationQuizItem, qIdx: number) => (
                    <div key={qIdx} className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-violet-400">Q{qIdx + 1}.</span>
                        <div className="font-semibold text-slate-100 text-sm md:text-base">{qItem.question || qItem.q}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                        {(qItem.options || []).map((opt: string, oIdx: number) => (
                          <div
                            key={oIdx}
                            className="p-2.5 rounded-lg text-xs md:text-sm font-medium bg-slate-800/80 border border-slate-700 text-slate-200"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>

                      {/* Reveal Answer Button */}
                      <div className="pl-4 pt-1">
                        <button
                          onClick={() => toggleQuizAnswer(qIdx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{revealedQuizAnswers[qIdx] ? 'उत्तर छिपाएं (Hide Answer)' : 'उत्तर व समाधान देखें (Reveal Answer)'}</span>
                        </button>

                        {revealedQuizAnswers[qIdx] && (
                          <div className="mt-2 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs md:text-sm space-y-1 animate-fadeIn">
                            <div className="font-bold text-emerald-300">
                              ✓ सही उत्तर: {qItem.correctAnswer || qItem.ans}
                            </div>
                            {qItem.explanation && (
                              <div className="text-slate-300 text-xs">
                                {qItem.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Takeaway Box */}
              {currentSlide?.keyTakeaway && (
                <div className="bg-violet-950/40 border-l-4 border-violet-500 p-3.5 rounded-r-xl text-xs md:text-sm text-violet-200 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-violet-300">Key Takeaway: </span>
                    {currentSlide.keyTakeaway}
                  </div>
                </div>
              )}
            </div>

            {/* Teacher Note Drawer */}
            {showTeacherNotes && currentSlide?.teacherNote && (
              <div className="mt-4 pt-3 border-t border-slate-700/60 bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl flex items-start gap-2 text-xs text-amber-200">
                <span className="font-bold uppercase tracking-wider text-amber-400 shrink-0">👩‍🏫 Teacher Note:</span>
                <span>{currentSlide.teacherNote}</span>
              </div>
            )}
          </div>

          {/* Slide Navigation Controls & Thumbnails */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setActiveSlideIndex((prev) => Math.max(prev - 1, 0))}
              disabled={activeSlideIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Slide (←)</span>
            </button>

            {/* Slide Indicators / Quick Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
              {presentation?.slides?.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                    activeSlideIndex === idx
                      ? 'bg-violet-600 text-white ring-2 ring-violet-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={`Slide ${idx + 1}: ${s.title}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveSlideIndex((prev) => Math.min(prev + 1, (presentation?.slides?.length || 1) - 1))}
              disabled={activeSlideIndex === (presentation?.slides?.length || 1) - 1}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>Next Slide (→)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
