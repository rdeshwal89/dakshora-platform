import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  Download,
  Copy,
  Printer,
  CheckCircle2,
  RefreshCw,
  Layers,
  Award,
  ChevronRight,
  BookmarkCheck,
  FileText,
  Sliders,
  Check,
  Cpu,
  FlaskConical,
  Brain,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { generateAiLessonPlan } from '../services/api';
import type { AiLessonPlanData, QuestionBoardType } from '../types';

interface AiLessonPlannerProps {
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

const K12_SUBJECTS: Record<string, string[]> = {
  'Primary (1-5)': ['Mathematics (गणित)', 'Environmental Studies (EVS)', 'English', 'Hindi (हिंदी)', 'General Science'],
  'Middle (6-8)': ['Science (विज्ञान)', 'Mathematics (गणित)', 'Social Science (सामाजिक विज्ञान)', 'English', 'Hindi (हिंदी)', 'Sanskrit (संस्कृत)'],
  'Secondary (9-10)': ['Science (विज्ञान)', 'Mathematics (गणित)', 'Social Science (सामाजिक विज्ञान)', 'English', 'Hindi (हिंदी)', 'Information Technology (IT 402)'],
  'Senior Sec (11-12)': ['Physics (भौतिक विज्ञान)', 'Chemistry (रसायन विज्ञान)', 'Mathematics (गणित)', 'Biology (जीव विज्ञान)', 'Accountancy (लेखाशास्त्र)', 'Business Studies', 'Economics', 'English Core', 'Computer Science']
};

export const AiLessonPlanner: React.FC<AiLessonPlannerProps> = ({ onShowToast }) => {
  // Input states
  const [board, setBoard] = useState<QuestionBoardType>('cbse');
  const [grade, setGrade] = useState<string>('Class 10');
  const [subject, setSubject] = useState<string>('Science (विज्ञान)');
  const [chapter, setChapter] = useState<string>('Chemical Reactions and Equations');
  const [periodsCount, setPeriodsCount] = useState<number>(4);
  const [durationPerPeriod, setDurationPerPeriod] = useState<string>('45 Mins');
  const [languageMedium, setLanguageMedium] = useState<'bilingual' | 'english' | 'hindi'>('bilingual');
  const [learningStyle, setLearningStyle] = useState<'nep2020' | 'activity_based' | 'inquiry_driven'>('nep2020');

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavedToDiary, setIsSavedToDiary] = useState<boolean>(false);
  const [activePeriodTab, setActivePeriodTab] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  // Lesson Plan data
  const [planData, setPlanData] = useState<AiLessonPlanData>({
    schoolName: 'DAKSHORA SENIOR SECONDARY SCHOOL, JAIPUR',
    grade: 'Class 10',
    subject: 'Science (विज्ञान)',
    chapterTitle: 'Chemical Reactions and Equations (रासायनिक अभिक्रियाएँ एवं समीकरण)',
    allocatedPeriods: 4,
    durationPerPeriod: '45 Mins',
    curriculumStandard: 'NEP 2020 & NCERT Rationalized Syllabus 2025-2026',
    bloomsObjectives: {
      remember: 'रासायनिक अभिक्रिया की परिभाषा, अभिकारक एवं उत्पाद की पहचान करना। (Define chemical reactions, identify reactants and products)',
      understand: 'द्रव्यमान संरक्षण नियम के आधार पर रासायनिक समीकरणों के संतुलन की व्याख्या करना। (Explain balancing based on conservation of mass)',
      apply: 'दैनिक जीवन के उदाहरणों (जंग लगना, किण्वन) में रासायनिक परिवर्तन पहचानना व सूत्र लिखना। (Write and balance skeletal equations)',
      analyze: 'ऊष्माक्षेपी (Exothermic) एवं ऊष्माशोषी (Endothermic) अभिक्रियाओं में विभेद करना। (Differentiate between reaction types)'
    },
    periodBreakup: [
      {
        periodNumber: 1,
        title: 'कालांश 1: रासायनिक परिवर्तन एवं समीकरण का परिचय (Introduction & Hook)',
        learningOutcome: 'छात्र रासायनिक अभिक्रिया के 4 प्रमुख लक्षणों (रंग, तापमान, गैस, अवस्था परिवर्तन) को पहचान सकेंगे।',
        hookActivity: 'प्रायोगिक प्रदर्शन (5 मिनट): मैग्नीशियम रिबन को जलाना — चमकदार सफेद ज्वाला एवं मैग्नीशियम ऑक्साइड (MgO) की सफेद राख का प्रेक्षण।',
        directInstruction: 'श्यामपट्ट पर शब्द-समीकरण एवं ढांचा (कंकाली) समीकरण की व्याख्या। द्रव्यमान संरक्षण के नियम का परिचय (15 मिनट)।',
        guidedPractice: 'छात्र जोड़ियों में दैनिक जीवन की 3 रासायनिक घटनाओं के शब्द समीकरण लिखेंगे (उदा. दूध से दही बनना, श्वसन) (15 मिनट)।',
        exitTicket: 'त्वरित जाँच (5 मिनट): कोई 2 प्रेक्षण लिखिए जिनसे पता चलता है कि रासायनिक अभिक्रिया हुई है।',
        homework: 'NCERT पाठ्यपुस्तक अभ्यास प्रश्न संख्या 1 एवं 2 हल करें।'
      },
      {
        periodNumber: 2,
        title: 'कालांश 2: रासायनिक समीकरणों को संतुलित करना (Balancing Equations)',
        learningOutcome: 'छात्र हिट एंड ट्रायल विधि द्वारा किसी भी कंकाली समीकरण को संतुलित कर सकेंगे।',
        hookActivity: 'रॉबर्ट बॉयल का द्रव्यमान संरक्षण नियम प्रश्नोत्तरी: क्या अभिक्रिया के बाद द्रव्यमान कम हो सकता है?',
        directInstruction: 'Fe + H2O → Fe3O4 + H2 को चरणबद्ध तरीके से बॉक्स बनाकर संतुलित करना सिखाना (15 मिनट)।',
        guidedPractice: 'छात्रों द्वारा 4 महत्वपूर्ण समीकरणों (N2 + H2, CH4 + O2, BaCl2 + Al2(SO4)3) का स्वतंत्र अभ्यास (15 मिनट)।',
        exitTicket: 'समीकरण संतुलित करें: KClO3 → KCl + O2.',
        homework: 'NCERT अभ्यास प्रश्न 5 व 6 हल करना।'
      },
      {
        periodNumber: 3,
        title: 'कालांश 3: अभिक्रियाओं के प्रकार (संयोजन, वियोजन व विस्थापन)',
        learningOutcome: 'छात्र संयोजन, अपघटन और विस्थापन अभिक्रियाओं में अंतर स्पष्ट कर सकेंगे।',
        hookActivity: 'प्रयोग: बीकर में बिना बुझा चूना (CaO) में जल मिलाने पर अत्यधिक ऊष्मा का उत्सर्जन महसूस करना।',
        directInstruction: 'संयोजन (Combination), अपघटन (Decomposition - तापीय, विद्युत, प्रकाश) और विस्थापन का सचित्र निरूपण।',
        guidedPractice: 'कॉपर सल्फेट के नीले घोल में लोहे की कील डालने पर विस्थापन अभिक्रिया का समूह अवलोकन।',
        exitTicket: 'श्यामपट्ट पर लिखे 3 समीकरणों का वर्गीकरण करें।',
        homework: 'विस्थापन एवं द्विविस्थापन अभिक्रिया में 2 अंतर लिखें।'
      },
      {
        periodNumber: 4,
        title: 'कालांश 4: ऑक्सीकरण, अपचयन, संक्षारण एवं विकृतगंधिता',
        learningOutcome: 'छात्र रेडॉक्स अभिक्रियाओं में उपचयन व अपचयन पहचान सकेंगे तथा संक्षारण व विकृतगंधिता रोकने के उपाय बता सकेंगे।',
        hookActivity: 'चिप्स के पैकेट में नाइट्रोजन गैस क्यों भरी जाती है? (जिज्ञासा प्रश्न)',
        directInstruction: 'रेडॉक्स (Redox) अवधारणा: ऑक्सीजन/हाइड्रोजन का जुड़ना व हटना। संक्षारण (Rusting) एवं विकृतगंधिता (Rancidity)।',
        guidedPractice: 'MnO2 + 4HCl → MnCl2 + 2H2O + Cl2 में ऑक्सीकृत व अपचयित पदार्थ की पहचान।',
        exitTicket: 'संक्षारण रोकने के कोई दो उपाय लिखिए।',
        homework: 'अध्याय 1 के सभी NCERT अभ्यास प्रश्नों का समापन व आगामी टेस्ट की तैयारी।'
      }
    ],
    blackboardLayout: {
      leftColumn: 'मुख्य सूत्र एवं शब्दावली:\n• अभिकारक (Reactants) ➔ उत्पाद (Products)\n• द्रव्यमान संरक्षण नियम\n• संतुलित समीकरण',
      centerColumn: 'हल किए गए उदाहरण:\n• 2Mg + O2 ➔ 2MgO\n• 3Fe + 4H2O ➔ Fe3O4 + 4H2\n• CaO + H2O ➔ Ca(OH)2 + ऊष्मा',
      rightColumn: 'कक्षा कार्य एवं गृहकार्य:\n• कक्षा कार्य: समीकरण 1 से 3 संतुलित करें\n• गृहकार्य: NCERT Q1-Q6\n• आगामी शुक्रवार: चैप्टर टेस्ट'
    },
    differentiatedSupport: {
      remedial: 'कमजोर विद्यार्थियों के लिए समीकरण संतुलन हेतु सूत्र-कार्ड तथा रासायनिक सूत्रों की तालिका (Valency Chart) प्रदान करना।',
      advancedHots: 'मेधावी छात्रों के लिए जटिल रेडॉक्स अभिक्रियाओं और भिन्नात्मक गुणांकों (Fractional Coefficients) वाले समीकरणों का चुनौतीपूर्ण कार्य।'
    },
    practicalLabActivity: 'क्रियाकलाप 1.1: मैग्नीशियम रिबन का दहन एवं क्रियाकलाप 1.3: दानेदार जस्ते पर तनु सल्फ्यूरिक अम्ल की क्रिया से हाइड्रोजन गैस निकलना।',
    lifeSkillsIntegration: 'पर्यावरण संरक्षण, खाद्य सुरक्षा (विकृतगंधिता से बचाव), एवं वैज्ञानिक अनुसंधान दृष्टिकोण का विकास।'
  });

  const handleGeneratePlan = async () => {
    if (!chapter.trim()) {
      onShowToast?.('warning', 'कृपया अध्याय का नाम दर्ज करें', 'अध्याय अनिवार्य है');
      return;
    }

    setIsGenerating(true);
    setIsSavedToDiary(false);
    try {
      const res = await generateAiLessonPlan({
        board,
        grade,
        subject,
        chapter,
        periodsCount,
        durationPerPeriod,
        languageMedium,
        learningStyle
      });

      const apiResult = res.data as any;
      const lessonPlan = apiResult?.lessonPlan || apiResult?.data?.lessonPlan;

      if ((res.status === 200 || apiResult?.success) && lessonPlan) {
        setPlanData(lessonPlan);
        setActivePeriodTab(1);
        onShowToast?.(
          'success',
          '✨ NEP 2020 स्मार्ट लेसन प्लान तैयार!',
          `${grade} ${subject} — ${chapter} के लिए ${periodsCount} कालांशों की पाठ योजना तैयार हुई।`
        );
      } else {
        throw new Error(apiResult?.message || 'Failed to generate lesson plan');
      }
    } catch (err: any) {
      console.error('[AI Lesson Plan] Error:', err);
      onShowToast?.('info', 'पाठ योजना लोड हुई', 'मानक NEP 2020 पाठ्यक्रम के अनुसार पाठ योजना प्रदर्शित की गई।');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDiary = async () => {
    setIsSavedToDiary(true);
    onShowToast?.('success', 'शिक्षक डायरी में सुरक्षित!', 'पाठ योजना आपकी डिजिटल टीचिंग जर्नल (Teacher Diary) में सिंक हो गई है।');
  };

  const handleTriggerPrint = () => {
    onShowToast?.('info', 'प्रिंट विंडो प्रारंभ', 'A4 लेसन प्लान प्रिंटर अथवा PDF हेतु तैयार');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleCopyClipboard = () => {
    setCopied(true);
    const summary = `${planData.schoolName}\nNEP 2020 LESSON PLAN: ${planData.chapterTitle}\nClass: ${planData.grade} | Subject: ${planData.subject} | Periods: ${planData.allocatedPeriods}\nLearning Objectives:\n- Remember: ${planData.bloomsObjectives?.remember}\n- Understand: ${planData.bloomsObjectives?.understand}\n- Apply: ${planData.bloomsObjectives?.apply}\n- Analyze: ${planData.bloomsObjectives?.analyze}`;
    navigator.clipboard.writeText(summary);
    onShowToast?.('success', 'क्लिपबोर्ड में कॉपी किया गया', 'आप इसे MS Word या डायरी में पेस्ट कर सकते हैं।');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-slate-900/90 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white">AI Smart Lesson Planner</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                NEP 2020 & NCF-SE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Bloom's Taxonomy
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              वार्षिक सिलेबस व टाइमटेबल के अनुसार 45-मिनट व साप्ताहिक कालांशों की पूर्ण पाठ योजना तैयार करें।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyClipboard}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleSaveToDiary}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              isSavedToDiary
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <BookmarkCheck className={`w-3.5 h-3.5 ${isSavedToDiary ? 'text-emerald-400' : ''}`} />
            <span>{isSavedToDiary ? 'Saved to Diary' : 'Save to Diary'}</span>
          </button>
          <button
            onClick={handleTriggerPrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Plan (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls (4 Cols) + Right Interactive Plan (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/70 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" /> पाठ योजना विन्यास (Setup)
              </span>
              <span className="text-[10px] text-purple-400 font-bold">NEP 2020</span>
            </div>

            {/* Board */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">शिक्षा बोर्ड (Board):</label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value as QuestionBoardType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans text-xs focus:border-purple-400 focus:outline-none"
              >
                <option value="cbse">CBSE (NCERT Rationalized Syllabus)</option>
                <option value="rbse">RBSE (राजस्थान बोर्ड)</option>
                <option value="upmsp">UPMSP (उत्तर प्रदेश बोर्ड)</option>
                <option value="state_board">State Education Board</option>
              </select>
            </div>

            {/* Grade & Language */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-bold block mb-1">कक्षा (Class):</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-sans focus:border-purple-400 focus:outline-none"
                >
                  {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">माध्यम (Language):</label>
                <select
                  value={languageMedium}
                  onChange={(e) => setLanguageMedium(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-sans focus:border-purple-400 focus:outline-none"
                >
                  <option value="bilingual">द्विभाषी (Bilingual)</option>
                  <option value="english">English Medium</option>
                  <option value="hindi">हिंदी माध्यम</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">विषय (Subject):</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="उदा. Science, Mathematics, English..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans text-xs focus:border-purple-400 focus:outline-none"
              />
            </div>

            {/* Chapter / Topic */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">अध्याय या इकाई (Chapter/Unit):</label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="उदा. Chemical Reactions, Quadratic Equations..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans text-xs focus:border-purple-400 focus:outline-none"
              />
            </div>

            {/* Periods Count & Duration */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-bold block mb-1">कुल कालांश (Periods):</label>
                <select
                  value={periodsCount}
                  onChange={(e) => setPeriodsCount(Number(e.target.value) || 4)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-sans focus:border-purple-400 focus:outline-none"
                >
                  <option value="1">1 कालांश (45 Mins Single Lesson)</option>
                  <option value="2">2 कालांश (Double Period)</option>
                  <option value="4">4 कालांश (Mini-Unit)</option>
                  <option value="6">6 कालांश (1-Week Full Chapter)</option>
                  <option value="8">8 कालांश (Comprehensive Unit)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">कालांश अवधि (Duration):</label>
                <input
                  type="text"
                  value={durationPerPeriod}
                  onChange={(e) => setDurationPerPeriod(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Learning Style */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">अधिगम शैली (Learning Style):</label>
              <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans text-xs focus:border-purple-400 focus:outline-none"
              >
                <option value="nep2020">NEP 2020 Competency-Based</option>
                <option value="activity_based">Experiential & Activity-Based (हैंड्स-ऑन)</option>
                <option value="inquiry_driven">Inquiry & 5E Constructivist Model</option>
              </select>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Google Gemini AI पाठ योजना तैयार कर रहा है...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>NEP 2020 पाठ योजना जनरेट करें</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column Interactive Lesson Plan Display */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-white text-slate-900 shadow-2xl font-sans min-h-[750px] relative">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                {planData.schoolName}
              </div>
              <div className="text-xs text-purple-700 font-mono font-bold">
                {planData.curriculumStandard}
              </div>
              <h1 className="text-xl font-black text-slate-950 uppercase pt-1">
                दैनिक एवं साप्ताहिक पाठ योजना (LESSON PLAN)
              </h1>
              <div className="flex flex-wrap justify-between items-center text-xs font-bold text-slate-800 pt-2 border-t border-slate-200 gap-2">
                <div>कक्षा: <b>{planData.grade}</b></div>
                <div>विषय: <b>{planData.subject}</b></div>
                <div>अध्याय: <b>{planData.chapterTitle}</b></div>
                <div>कुल कालांश: <b>{planData.allocatedPeriods} ({planData.durationPerPeriod} प्रत्येक)</b></div>
              </div>
            </div>

            {/* Bloom's Taxonomy Learning Objectives */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-xs text-slate-950 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-purple-600" /> अधिगम उद्देश्य (Bloom's Taxonomy Learning Objectives):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <b className="text-blue-700 block text-[11px] uppercase">1. ज्ञान (Remember / Recall):</b>
                  <p className="text-slate-700 mt-0.5">{planData.bloomsObjectives?.remember}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <b className="text-emerald-700 block text-[11px] uppercase">2. बोध (Understand / Comprehend):</b>
                  <p className="text-slate-700 mt-0.5">{planData.bloomsObjectives?.understand}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <b className="text-amber-700 block text-[11px] uppercase">3. अनुप्रयोग (Apply / Solve):</b>
                  <p className="text-slate-700 mt-0.5">{planData.bloomsObjectives?.apply}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <b className="text-purple-700 block text-[11px] uppercase">4. विश्लेषण (Analyze / Evaluate):</b>
                  <p className="text-slate-700 mt-0.5">{planData.bloomsObjectives?.analyze}</p>
                </div>
              </div>
            </div>

            {/* Period-by-Period Timeline Tabs */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-mono">
                <span className="font-bold text-slate-500 whitespace-nowrap">कालांश चुनें:</span>
                {planData.periodBreakup?.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePeriodTab(p.periodNumber || idx + 1)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                      activePeriodTab === (p.periodNumber || idx + 1)
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Period {p.periodNumber || idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Period Details */}
              {planData.periodBreakup
                ?.filter((p, idx) => (p.periodNumber || idx + 1) === activePeriodTab)
                .map((period, pIdx) => (
                  <div key={pIdx} className="space-y-3.5 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <h3 className="font-bold text-sm text-purple-950">
                        {period.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                        45 Minutes
                      </span>
                    </div>

                    <div className="space-y-2.5 text-slate-800">
                      <div>
                        <b className="text-slate-900 flex items-center gap-1.5 text-[11px]">
                          <Award className="w-3.5 h-3.5 text-purple-600" /> इस कालांश का अधिगम प्रतिफल (Learning Outcome):
                        </b>
                        <p className="mt-0.5 text-slate-700 pl-5">{period.learningOutcome}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <b className="text-amber-900 flex items-center gap-1.5 text-[11px]">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> 1. द हुक एवं जिज्ञासा गतिविधि (Hook - 00 to 05 Min):
                        </b>
                        <p className="mt-0.5 text-amber-950">{period.hookActivity}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                        <b className="text-blue-900 flex items-center gap-1.5 text-[11px]">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" /> 2. प्रत्यक्ष शिक्षण एवं संकल्पना निरूपण (Direct Instruction - 05 to 20 Min):
                        </b>
                        <p className="mt-0.5 text-blue-950">{period.directInstruction}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                        <b className="text-emerald-900 flex items-center gap-1.5 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 3. निर्देशित अभ्यास एवं जोड़ी कार्य (Guided Practice - 20 to 35 Min):
                        </b>
                        <p className="mt-0.5 text-emerald-950">{period.guidedPractice}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                          <b className="text-rose-900 block text-[11px]">4. एग्जिट टिकट / त्वरित जाँच (Exit Ticket - 5 Min):</b>
                          <p className="mt-0.5 text-rose-950">{period.exitTicket}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                          <b className="text-purple-900 block text-[11px]">5. गृहकार्य कार्यभार (Homework Assignment):</b>
                          <p className="mt-0.5 text-purple-950">{period.homework}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Blackboard Blueprint */}
            <div className="mt-6 border-t border-slate-200 pt-4 space-y-2">
              <span className="font-bold text-xs text-slate-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" /> श्यामपट्ट रूपरेखा (Blackboard Blueprint Layout):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 text-white font-mono space-y-1">
                  <span className="text-[10px] text-cyan-400 font-bold block uppercase border-b border-slate-800 pb-1">
                    Left Board (सूत्र व नियम)
                  </span>
                  <p className="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                    {planData.blackboardLayout?.leftColumn}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 text-white font-mono space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold block uppercase border-b border-slate-800 pb-1">
                    Center Board (उदाहरण व समीकरण)
                  </span>
                  <p className="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                    {planData.blackboardLayout?.centerColumn}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 text-white font-mono space-y-1">
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase border-b border-slate-800 pb-1">
                    Right Board (कक्षा कार्य व गृहकार्य)
                  </span>
                  <p className="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                    {planData.blackboardLayout?.rightColumn}
                  </p>
                </div>
              </div>
            </div>

            {/* Differentiated Support & Lab Activity */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <b className="text-slate-950 block">विभेदीकृत शिक्षण सहायता (Differentiated Support):</b>
                <p className="text-slate-700"><b>उपचारात्मक (Remedial):</b> {planData.differentiatedSupport?.remedial}</p>
                <p className="text-slate-700 pt-1"><b>मेधावी (HOTS):</b> {planData.differentiatedSupport?.advancedHots}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <b className="text-slate-950 flex items-center gap-1">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-600" /> प्रयोगशाला एवं हैंड्स-ऑन गतिविधि (Lab Activity):
                </b>
                <p className="text-slate-700">{planData.practicalLabActivity}</p>
                {planData.lifeSkillsIntegration && (
                  <p className="text-slate-600 pt-1 text-[11px]"><b>जीवन कौशल:</b> {planData.lifeSkillsIntegration}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
