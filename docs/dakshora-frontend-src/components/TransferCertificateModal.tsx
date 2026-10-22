import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Building,
  Award,
  AlertTriangle,
  RefreshCw,
  Stamp
} from 'lucide-react';
import { ErpStudentRecord } from '../types';
import { updateErpStudent } from '../services/api';

export type TCBoardType = 'rbse' | 'upmsp' | 'hbse' | 'cbse' | 'state_board';

interface TransferCertificateModalProps {
  student: ErpStudentRecord | null;
  onClose: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onStudentUpdated?: (updated: ErpStudentRecord) => void;
}

// Convert Date of Birth to Hindi and English Words
function formatDobWords(dobStr: string): { eng: string; hindi: string } {
  if (!dobStr) {
    return {
      eng: 'Fifteenth August Two Thousand Eleven',
      hindi: 'पंद्रह अगस्त दो हज़ार ग्यारह'
    };
  }

  try {
    const d = new Date(dobStr);
    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    const dayEng = [
      '', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
      'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth',
      'Twenty First', 'Twenty Second', 'Twenty Third', 'Twenty Fourth', 'Twenty Fifth', 'Twenty Sixth', 'Twenty Seventh', 'Twenty Eighth', 'Twenty Ninth', 'Thirtieth', 'Thirty First'
    ];

    const dayHindi = [
      '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
      'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
      'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस', 'इकतीस'
    ];

    const monthsEng = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthsHindi = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

    const yearWordsEng = `Two Thousand ${year - 2000}`;
    const yearWordsHindi = `दो हज़ार ${year - 2000}`;

    return {
      eng: `${dayEng[day] || day} ${monthsEng[month]} ${yearWordsEng}`,
      hindi: `${dayHindi[day] || day} ${monthsHindi[month]} ${yearWordsHindi}`
    };
  } catch {
    return {
      eng: 'Fifteenth August Two Thousand Eleven',
      hindi: 'पंद्रह अगस्त दो हज़ार ग्यारह'
    };
  }
}

export const TransferCertificateModal: React.FC<TransferCertificateModalProps> = ({
  student,
  onClose,
  onShowToast,
  onStudentUpdated
}) => {
  if (!student) return null;

  const [boardType, setBoardType] = useState<TCBoardType>('rbse');
  const [bookNo, setBookNo] = useState<string>('B-18');
  const [tcSerialNo, setTcSerialNo] = useState<string>(student.tcNumber || `TC/2026/${Math.floor(1000 + Math.random() * 9000)}`);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [applicationDate, setApplicationDate] = useState<string>(new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]);
  const [reasonForLeaving, setReasonForLeaving] = useState<string>(student.tcReason || 'अभिभावक का स्थानांतरण (Parent Transfer / Relocation)');
  const [conduct, setConduct] = useState<string>('उत्तम (Exemplary & Good)');
  const [totalWorkingDays, setTotalWorkingDays] = useState<number>(218);
  const [attendedDays, setAttendedDays] = useState<number>(204);
  const [feeDuesUpto, setFeeDuesUpto] = useState<string>('March 2026 (सत्र अंत तक पूर्ण चुकता)');
  const [concessionDetails, setConcessionDetails] = useState<string>('कोई नहीं (None / Full Fee Paid)');
  const [promotionStatus, setPromotionStatus] = useState<string>('हां, अगली कक्षा में प्रोन्नत (Yes, Promoted to next higher class)');
  const [examResult, setExamResult] = useState<string>('वार्षिक परीक्षा उत्तीर्ण (Annual Examination Passed)');
  const [nccScout, setNccScout] = useState<string>('स्काउट दल का सक्रिय सदस्य (Active Scout)');
  const [otherRemarks, setOtherRemarks] = useState<string>('विद्यार्थी का आचरण संतोषजनक रहा एवं भविष्य उज्ज्वल हो।');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const dobFormatted = formatDobWords(student.dob);

  // Board details
  const boardConfigs = {
    rbse: {
      name: 'राजस्थान माध्यमिक शिक्षा बोर्ड, अजमेर',
      title: 'विद्यालय स्थानांतरण प्रमाण पत्र (TRANSFER CERTIFICATE)',
      sub: 'मान्यता क्रमांक: RBSE/SEC/RJ/2026/8421 • फॉर्म 5B (शाला दर्पण नियमानुसार)',
      shalaDarpan: '08120401824',
      codeLabel: 'शाला दर्पण विद्यालय कोड',
      codeVal: 'RJ-214081'
    },
    upmsp: {
      name: 'माध्यमिक शिक्षा परिषद, उत्तर प्रदेश, प्रयागराज',
      title: 'स्थानांतरण प्रमाण पत्र (TRANSFER CERTIFICATE)',
      sub: 'उत्तर प्रदेश शासन मान्यता क्रमांक: UPMSP/8821 • अशासकीय सहायता प्राप्त/स्ववित्तपोषित',
      shalaDarpan: '09210803411',
      codeLabel: 'DIOS विद्यालय कोड',
      codeVal: 'UP-7729'
    },
    hbse: {
      name: 'हरियाणा विद्यालय शिक्षा बोर्ड, भिवानी',
      title: 'स्कूल लिविंग सर्टिफिकेट / टीसी (SCHOOL LEAVING CERTIFICATE)',
      sub: 'हरियाणा विद्यालय शिक्षा बोर्ड मान्यता प्राप्त • अवसर/MIS पोर्टल अधिकृत प्रारूप',
      shalaDarpan: '06140301988',
      codeLabel: 'अवसर MIS कोड',
      codeVal: 'HR-MIS-4412'
    },
    cbse: {
      name: 'CENTRAL BOARD OF SECONDARY EDUCATION, DELHI',
      title: 'TRANSFER CERTIFICATE (TC)',
      sub: 'Affiliated to CBSE New Delhi • Affiliation No: 1730992 • School Code: 10482',
      shalaDarpan: '08120401824',
      codeLabel: 'CBSE Affiliation / School No',
      codeVal: 'AFF: 1730992 / 10482'
    },
    state_board: {
      name: 'STATE BOARD OF SECONDARY EDUCATION',
      title: 'TRANSFER CERTIFICATE / SCHOOL LEAVING CERTIFICATE',
      sub: 'Recognized by Department of School Education',
      shalaDarpan: '08120401824',
      codeLabel: 'Recognition No',
      codeVal: 'REC-2026-904'
    }
  };

  const activeBoard = boardConfigs[boardType];

  const handlePrintTC = () => {
    onShowToast?.('success', 'टीसी प्रिंटिंग विंडो प्रारंभ', 'स्थानांतरण प्रमाण पत्र A4 प्रिंटर या PDF हेतु तैयार');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleSaveAndIssueTC = async () => {
    setIsSubmitting(true);
    try {
      const updatedData: Partial<ErpStudentRecord> = {
        tcIssued: true,
        tcNumber: tcSerialNo,
        tcIssueDate: issueDate,
        tcReason: reasonForLeaving,
        status: 'withdrawn'
      };

      const res = await updateErpStudent(student.id, updatedData);
      if (res.data?.student) {
        onStudentUpdated?.(res.data.student);
      }

      onShowToast?.(
        'success',
        'टीसी सफलतापूर्वक जारी हुई',
        `प्रमाण पत्र क्रमांक: ${tcSerialNo} • छात्र की स्थिति 'Withdrawn' के रूप में दर्ज हुई।`
      );
    } catch (err: any) {
      onShowToast?.('error', 'टीसी जारी करने में त्रुटि', err.message || 'Server connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-5 my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/20">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>स्थानांतरण प्रमाण पत्र (Transfer Certificate / TC Generator)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Government & Board Compliant
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {student.name} • Scholar/SR #{student.admissionNo || 'SR-4819'} • PEN #{student.penNo || 'PEN260812049'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndIssueTC}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-2 border border-amber-500/30 transition-colors"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{student.tcIssued ? 'Update Issued TC' : 'Issue & Mark Inactive'}</span>
            </button>
            <button
              onClick={handlePrintTC}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official TC (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Board & Field Edit Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs font-mono">
          <div>
            <label className="text-slate-400 font-bold block mb-1">शिक्षा बोर्ड (Board):</label>
            <select
              value={boardType}
              onChange={(e) => setBoardType(e.target.value as TCBoardType)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans text-xs focus:border-amber-400 focus:outline-none"
            >
              <option value="rbse">RBSE (राजस्थान बोर्ड - Form 5B)</option>
              <option value="upmsp">UPMSP (उत्तर प्रदेश बोर्ड - DIOS)</option>
              <option value="hbse">HBSE (हरियाणा बोर्ड - अवसर SLC)</option>
              <option value="cbse">CBSE (Central Board TC Form)</option>
              <option value="state_board">State Education Board</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-bold block mb-1">टीसी क्रमांक (TC Serial No):</label>
            <input
              type="text"
              value={tcSerialNo}
              onChange={(e) => setTcSerialNo(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 font-bold block mb-1">विद्यालय छोड़ने का कारण (Reason):</label>
            <input
              type="text"
              value={reasonForLeaving}
              onChange={(e) => setReasonForLeaving(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 font-bold block mb-1">निर्गमन दिनांक (Issue Date):</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Live A4 TC Document Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex justify-center">
          <div className="w-[794px] min-h-[1123px] bg-white text-slate-900 p-8 shadow-2xl relative font-serif border-4 border-double border-amber-950/40 flex flex-col justify-between">
            {/* Security Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <span className="text-9xl font-black rotate-[-30deg]">DAKSHORA</span>
            </div>

            {/* Top Ornamental Header */}
            <div>
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3 relative">
                <div className="text-[11px] font-sans font-bold uppercase tracking-widest text-slate-600">
                  {activeBoard.name}
                </div>
                <h1 className="text-2xl font-black tracking-wide text-slate-950">
                  दक्षोरा सीनियर सेकेंडरी स्कूल / DAKSHORA SENIOR SECONDARY SCHOOL
                </h1>
                <p className="text-[11px] font-sans text-slate-700">
                  स्टेशन रोड, सिविल लाइन्स, जयपुर, राजस्थान • फोन: 0141-2894100 • ईमेल: principal@dakshora.co.in
                </p>
                <p className="text-[10px] font-sans font-bold text-amber-950">
                  {activeBoard.sub} • UDISE+ कोड: {activeBoard.shalaDarpan} • {activeBoard.codeLabel}: {activeBoard.codeVal}
                </p>

                <div className="pt-2">
                  <span className="inline-block px-4 py-1 text-sm font-sans font-black bg-slate-900 text-white rounded-md tracking-wider uppercase">
                    {activeBoard.title}
                  </span>
                </div>
              </div>

              {/* Serial & Registration Info */}
              <div className="flex justify-between items-center text-xs font-sans font-bold text-slate-800 py-2 border-b border-slate-300">
                <div>पुस्तक सं. (Book No.): <span className="font-mono text-slate-950">{bookNo}</span></div>
                <div>प्रमाण पत्र सं. (TC No.): <span className="font-mono text-slate-950">{tcSerialNo}</span></div>
                <div>प्रवेश सं. (Scholar No.): <span className="font-mono text-slate-950">{student.admissionNo || 'SR-4819'}</span></div>
                <div>राष्ट्रीय छात्र पहचान (PEN): <span className="font-mono text-slate-950">{student.penNo || 'PEN260812049'}</span></div>
              </div>

              {/* 22 Clauses Table */}
              <div className="py-3 text-[11px] font-sans space-y-1.5 text-slate-800 leading-relaxed">
                <div className="flex">
                  <span className="w-8 font-bold">1.</span>
                  <span className="w-72 font-semibold">विद्यार्थी का नाम / Name of Pupil:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400 uppercase">
                    {student.name}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">2.</span>
                  <span className="w-72 font-semibold">पिता / अभिभावक का नाम / Father's Name:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    श्री {student.parentName}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">3.</span>
                  <span className="w-72 font-semibold">माता का नाम / Mother's Name:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    श्रीमती {student.motherName || 'सुनीता देवी (Sunita Devi)'}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">4.</span>
                  <span className="w-72 font-semibold">राष्ट्रीयता / Nationality:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    भारतीय / Indian
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">5.</span>
                  <span className="w-72 font-semibold">क्या विद्यार्थी अ.जा./अ.ज.जा./ओ.बी.सी./ई.डब्ल्यू.एस. से है:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {student.category || 'सामान्य (General)'}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">6.</span>
                  <span className="w-72 font-semibold">विद्यालय में प्रथम प्रवेश की तिथि व कक्षा:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {student.admissionDate || '02-07-2022'} (Class 6)
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">7.</span>
                  <div className="w-72 font-semibold">
                    <div>जन्म तिथि (प्रवेश पंजिका के अनुसार):</div>
                    <div className="text-[9px] text-slate-500 font-normal">Date of Birth (in figures & words):</div>
                  </div>
                  <div className="flex-1 space-y-0.5 border-b border-dotted border-slate-400">
                    <div><b>अंकों में:</b> <span className="font-mono">{student.dob || '15-08-2011'}</span></div>
                    <div><b>शब्दों में:</b> {dobFormatted.hindi} ({dobFormatted.eng})</div>
                  </div>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">8.</span>
                  <span className="w-72 font-semibold">अंतिम अध्ययनरत कक्षा / Class last studied:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {student.grade} - Section {student.section}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">9.</span>
                  <span className="w-72 font-semibold">अंतिम वार्षिक परीक्षा परिणाम / Annual Result:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {examResult}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">10.</span>
                  <span className="w-72 font-semibold">क्या कभी अनुत्तीर्ण रहे / Whether failed:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    नहीं (No)
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">11.</span>
                  <span className="w-72 font-semibold">अध्ययन किए गए विषय / Subjects Studied:</span>
                  <span className="flex-1 font-medium text-slate-950 border-b border-dotted border-slate-400">
                    1. हिंदी, 2. अंग्रेजी, 3. गणित, 4. विज्ञान, 5. सामाजिक विज्ञान, 6. संस्कृत/कंप्यूटर
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">12.</span>
                  <span className="w-72 font-semibold">उच्चतर कक्षा में प्रोन्नति हेतु योग्य / Promotion:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {promotionStatus}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">13.</span>
                  <span className="w-72 font-semibold">विद्यालय शुल्क बेबाकी माह / Month dues paid:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {feeDuesUpto}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">14.</span>
                  <span className="w-72 font-semibold">क्या कोई शुल्क रियायत ली गई / Concession:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {concessionDetails}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">15.</span>
                  <span className="w-72 font-semibold">सत्र के कुल कार्य दिवस / Total Working Days:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {totalWorkingDays} दिवस (Days)
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">16.</span>
                  <span className="w-72 font-semibold">विद्यार्थी के उपस्थित दिवस / Days Attended:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {attendedDays} दिवस ({((attendedDays / totalWorkingDays) * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">17.</span>
                  <span className="w-72 font-semibold">एनसीसी / स्काउट / गाइड / NCC / Scout:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {nccScout}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">18.</span>
                  <span className="w-72 font-semibold">सामान्य आचरण / General Conduct:</span>
                  <span className="flex-1 font-bold text-emerald-800 border-b border-dotted border-slate-400">
                    {conduct}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">19.</span>
                  <span className="w-72 font-semibold">प्रमाण पत्र हेतु आवेदन दिनांक / Application Date:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {applicationDate}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">20.</span>
                  <span className="w-72 font-semibold">प्रमाण पत्र निर्गमन दिनांक / Issue Date:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {issueDate}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">21.</span>
                  <span className="w-72 font-semibold">विद्यालय छोड़ने का कारण / Reason for leaving:</span>
                  <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                    {reasonForLeaving}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-8 font-bold">22.</span>
                  <span className="w-72 font-semibold">अन्य कोई टिप्पणी / Any Other Remarks:</span>
                  <span className="flex-1 font-medium text-slate-950 border-b border-dotted border-slate-400">
                    {otherRemarks}
                  </span>
                </div>
              </div>
            </div>

            {/* Tri-Party Signatures & Circular Seal */}
            <div className="pt-8 border-t-2 border-slate-900 font-sans">
              <div className="grid grid-cols-3 gap-4 items-end text-center">
                {/* 1. Class Teacher */}
                <div className="space-y-1">
                  <div className="h-10 flex items-center justify-center font-serif italic text-sm text-slate-700">
                    Sunita Rao
                  </div>
                  <div className="border-t border-slate-800 pt-1 font-bold text-[11px] text-slate-950">
                    कक्षाध्यापक हस्ताक्षर
                  </div>
                  <div className="text-[9px] text-slate-500">(Class Teacher)</div>
                </div>

                {/* 2. Head Clerk & Seal */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-900/60 flex items-center justify-center text-center p-1 text-[8px] font-bold text-amber-900 leading-tight">
                    विद्यालय गोल मुहर<br />(Official Seal)
                  </div>
                  <div className="border-t border-slate-800 pt-1 font-bold text-[11px] text-slate-950 mt-1 w-full">
                    जाँचकर्ता / लिपिक
                  </div>
                  <div className="text-[9px] text-slate-500">(Checked by / In-charge)</div>
                </div>

                {/* 3. Principal */}
                <div className="space-y-1">
                  <div className="h-10 flex items-center justify-center font-serif italic font-bold text-sm text-slate-900">
                    Dr. R. K. Sharma
                  </div>
                  <div className="border-t border-slate-800 pt-1 font-bold text-[11px] text-slate-950">
                    प्रधानाचार्य हस्ताक्षर एवं मुहर
                  </div>
                  <div className="text-[9px] text-slate-500">(Principal & Official Stamp)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🖨️ PRINT ISOLATION CONTAINER FOR BROWSER PRINT DIALOGUE */}
      {/* ========================================================================= */}
      <div id="printable-tc-certificate" className="hidden print:block">
        <div className="w-full min-h-[1100px] bg-white text-slate-900 p-8 relative font-serif border-4 border-double border-slate-900 flex flex-col justify-between">
          <div>
            <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
              <div className="text-[11px] font-sans font-bold uppercase tracking-widest text-slate-600">
                {activeBoard.name}
              </div>
              <h1 className="text-2xl font-black tracking-wide text-slate-950">
                दक्षोरा सीनियर सेकेंडरी स्कूल / DAKSHORA SENIOR SECONDARY SCHOOL
              </h1>
              <p className="text-[11px] font-sans text-slate-700">
                स्टेशन रोड, सिविल लाइन्स, जयपुर, राजस्थान • फोन: 0141-2894100 • ईमेल: principal@dakshora.co.in
              </p>
              <p className="text-[10px] font-sans font-bold text-amber-950">
                {activeBoard.sub} • UDISE+ कोड: {activeBoard.shalaDarpan} • {activeBoard.codeLabel}: {activeBoard.codeVal}
              </p>

              <div className="pt-2">
                <span className="inline-block px-4 py-1 text-sm font-sans font-black bg-slate-900 text-white rounded-md tracking-wider uppercase">
                  {activeBoard.title}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-sans font-bold text-slate-800 py-2 border-b border-slate-300">
              <div>पुस्तक सं. (Book No.): <span className="font-mono text-slate-950">{bookNo}</span></div>
              <div>प्रमाण पत्र सं. (TC No.): <span className="font-mono text-slate-950">{tcSerialNo}</span></div>
              <div>प्रवेश सं. (Scholar No.): <span className="font-mono text-slate-950">{student.admissionNo || 'SR-4819'}</span></div>
              <div>राष्ट्रीय छात्र पहचान (PEN): <span className="font-mono text-slate-950">{student.penNo || 'PEN260812049'}</span></div>
            </div>

            <div className="py-3 text-[11px] font-sans space-y-1.5 text-slate-800 leading-relaxed">
              <div className="flex">
                <span className="w-8 font-bold">1.</span>
                <span className="w-72 font-semibold">विद्यार्थी का नाम / Name of Pupil:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400 uppercase">
                  {student.name}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">2.</span>
                <span className="w-72 font-semibold">पिता / अभिभावक का नाम / Father's Name:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  श्री {student.parentName}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">3.</span>
                <span className="w-72 font-semibold">माता का नाम / Mother's Name:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  श्रीमती {student.motherName || 'सुनीता देवी (Sunita Devi)'}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">4.</span>
                <span className="w-72 font-semibold">राष्ट्रीयता / Nationality:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  भारतीय / Indian
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">5.</span>
                <span className="w-72 font-semibold">क्या विद्यार्थी अ.जा./अ.ज.जा./ओ.बी.सी./ई.डब्ल्यू.एस. से है:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {student.category || 'सामान्य (General)'}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">6.</span>
                <span className="w-72 font-semibold">विद्यालय में प्रथम प्रवेश की तिथि व कक्षा:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {student.admissionDate || '02-07-2022'} (Class 6)
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">7.</span>
                <div className="w-72 font-semibold">
                  <div>जन्म तिथि (प्रवेश पंजिका के अनुसार):</div>
                  <div className="text-[9px] text-slate-500 font-normal">Date of Birth (in figures & words):</div>
                </div>
                <div className="flex-1 space-y-0.5 border-b border-dotted border-slate-400">
                  <div><b>अंकों में:</b> <span className="font-mono">{student.dob || '15-08-2011'}</span></div>
                  <div><b>शब्दों में:</b> {dobFormatted.hindi} ({dobFormatted.eng})</div>
                </div>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">8.</span>
                <span className="w-72 font-semibold">अंतिम अध्ययनरत कक्षा / Class last studied:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {student.grade} - Section {student.section}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">9.</span>
                <span className="w-72 font-semibold">अंतिम वार्षिक परीक्षा परिणाम / Annual Result:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {examResult}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">10.</span>
                <span className="w-72 font-semibold">क्या कभी अनुत्तीर्ण रहे / Whether failed:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  नहीं (No)
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">11.</span>
                <span className="w-72 font-semibold">अध्ययन किए गए विषय / Subjects Studied:</span>
                <span className="flex-1 font-medium text-slate-950 border-b border-dotted border-slate-400">
                  1. हिंदी, 2. अंग्रेजी, 3. गणित, 4. विज्ञान, 5. सामाजिक विज्ञान, 6. संस्कृत/कंप्यूटर
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">12.</span>
                <span className="w-72 font-semibold">उच्चतर कक्षा में प्रोन्नति हेतु योग्य / Promotion:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {promotionStatus}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">13.</span>
                <span className="w-72 font-semibold">विद्यालय शुल्क बेबाकी माह / Month dues paid:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {feeDuesUpto}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">14.</span>
                <span className="w-72 font-semibold">क्या कोई शुल्क रियायत ली गई / Concession:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {concessionDetails}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">15.</span>
                <span className="w-72 font-semibold">सत्र के कुल कार्य दिवस / Total Working Days:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {totalWorkingDays} दिवस (Days)
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">16.</span>
                <span className="w-72 font-semibold">विद्यार्थी के उपस्थित दिवस / Days Attended:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {attendedDays} दिवस ({((attendedDays / totalWorkingDays) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">17.</span>
                <span className="w-72 font-semibold">एनसीसी / स्काउट / गाइड / NCC / Scout:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {nccScout}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">18.</span>
                <span className="w-72 font-semibold">सामान्य आचरण / General Conduct:</span>
                <span className="flex-1 font-bold text-emerald-800 border-b border-dotted border-slate-400">
                  {conduct}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">19.</span>
                <span className="w-72 font-semibold">प्रमाण पत्र हेतु आवेदन दिनांक / Application Date:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {applicationDate}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">20.</span>
                <span className="w-72 font-semibold">प्रमाण पत्र निर्गमन दिनांक / Issue Date:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {issueDate}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">21.</span>
                <span className="w-72 font-semibold">विद्यालय छोड़ने का कारण / Reason for leaving:</span>
                <span className="flex-1 font-bold text-slate-950 border-b border-dotted border-slate-400">
                  {reasonForLeaving}
                </span>
              </div>
              <div className="flex">
                <span className="w-8 font-bold">22.</span>
                <span className="w-72 font-semibold">अन्य कोई टिप्पणी / Any Other Remarks:</span>
                <span className="flex-1 font-medium text-slate-950 border-b border-dotted border-slate-400">
                  {otherRemarks}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t-2 border-slate-900 font-sans">
            <div className="grid grid-cols-3 gap-4 items-end text-center">
              <div className="space-y-1">
                <div className="h-10 flex items-center justify-center font-serif italic text-sm text-slate-700">
                  Sunita Rao
                </div>
                <div className="border-t border-slate-800 pt-1 font-bold text-[11px] text-slate-950">
                  कक्षाध्यापक हस्ताक्षर
                </div>
                <div className="text-[9px] text-slate-500">(Class Teacher)</div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-900/60 flex items-center justify-center text-center p-1 text-[8px] font-bold text-amber-900 leading-tight">
                  विद्यालय गोल मुहर<br />(Official Seal)
                </div>
                <div className="border-t border-slate-800 pt-1 font-bold text-[11px] text-slate-950 mt-1 w-full">
                  जाँचकर्ता / लिपिक
                </div>
                <div className="text-[9px] text-slate-500">(Checked by / In-charge)</div>
              </div>

              <div className="space-y-1">
                <div className="h-10 flex items-center justify-center font-serif italic font-bold text-sm text-slate-900">
                  Dr. R. K. Sharma
                </div>
                <div className="border-t border-slate-800 pt-1 font-bold text-[11px] text-slate-950">
                  प्रधानाचार्य हस्ताक्षर एवं मुहर
                </div>
                <div className="text-[9px] text-slate-500">(Principal & Official Stamp)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
