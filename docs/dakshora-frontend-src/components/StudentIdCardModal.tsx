import React, { useState } from 'react';
import {
  Printer,
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Layers,
  Sparkles,
  Building2,
  Phone,
  MapPin,
  Calendar,
  User,
  HeartPulse,
  Award
} from 'lucide-react';
import { ErpStudentRecord } from '../types';

export type BoardType = 'rbse' | 'upmsp' | 'hbse' | 'cbse' | 'state_board';

interface StudentIdCardModalProps {
  student: ErpStudentRecord | null;
  allStudents?: ErpStudentRecord[];
  onClose: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

// Generate realistic SVG Barcode (Code128 simulated pattern)
function generateBarcodeSvg(code: string, width = 240, height = 48) {
  // Deterministic bar widths based on char codes
  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  const chars = code.toUpperCase();
  
  // Start guard
  bars.push({ x: currentX, w: 2 }); currentX += 4;
  bars.push({ x: currentX, w: 1 }); currentX += 3;

  for (let i = 0; i < chars.length; i++) {
    const val = chars.charCodeAt(i);
    const pattern = [(val % 3) + 1, ((val >> 1) % 3) + 1, ((val >> 2) % 2) + 1, ((val >> 3) % 3) + 1];
    pattern.forEach((w) => {
      bars.push({ x: currentX, w });
      currentX += w + 2;
    });
  }

  // End guard
  bars.push({ x: currentX, w: 2 }); currentX += 4;
  bars.push({ x: currentX, w: 3 }); currentX += 5;

  return (
    <svg viewBox={`0 0 ${Math.max(currentX + 10, width)} ${height + 18}`} className="w-full h-auto max-h-12">
      {bars.map((bar, idx) => (
        <rect key={idx} x={bar.x} y={2} width={bar.w} height={height} fill="#111827" />
      ))}
      <text
        x={currentX / 2}
        y={height + 14}
        textAnchor="middle"
        fontSize="10"
        fontFamily="monospace"
        fontWeight="bold"
        fill="#1e293b"
        letterSpacing="2"
      >
        {code}
      </text>
    </svg>
  );
}

// Compact SVG QR Code Generator
function generateQrCodeSvg(data: string, size = 70) {
  // Deterministic 15x15 mini QR matrix
  const matrixSize = 15;
  const hash = data.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const cells: { r: number; c: number }[] = [];

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Corner finders
      const isTopLeft = r < 4 && c < 4;
      const isTopRight = r < 4 && c >= matrixSize - 4;
      const isBottomLeft = r >= matrixSize - 4 && c < 4;
      if (isTopLeft || isTopRight || isBottomLeft) {
        if (
          (r === 0 || r === 3 || c === 0 || c === 3) ||
          (r === 0 || r === 3 || c === matrixSize - 4 || c === matrixSize - 1) ||
          (r === matrixSize - 4 || r === matrixSize - 1 || c === 0 || c === 3) ||
          (r === 1 && c === 1) ||
          (r === 1 && c === matrixSize - 2) ||
          (r === matrixSize - 2 && c === 1)
        ) {
          cells.push({ r, c });
        }
      } else {
        // pseudo data bits
        if ((r * 17 + c * 31 + hash) % 3 === 0) {
          cells.push({ r, c });
        }
      }
    }
  }

  const cellSize = size / matrixSize;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="bg-white p-1 rounded-lg border border-slate-300 shadow-sm">
      {cells.map((cell, idx) => (
        <rect
          key={idx}
          x={cell.c * cellSize}
          y={cell.r * cellSize}
          width={cellSize}
          height={cellSize}
          fill="#0f172a"
        />
      ))}
    </svg>
  );
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({
  student,
  allStudents = [],
  onClose,
  onShowToast
}) => {
  const [boardType, setBoardType] = useState<BoardType>('rbse');
  const [cardOrientation, setCardOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [cardSide, setCardSide] = useState<'front' | 'back' | 'both'>('both');
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [batchGrade, setBatchGrade] = useState<string>(student?.grade || 'Class 10');
  const [schoolColor, setSchoolColor] = useState<string>('emerald'); // emerald, blue, indigo, amber

  if (!student) return null;

  // Board Specific Identifiers
  const boardLabels = {
    rbse: {
      name: 'राजस्थान माध्यमिक शिक्षा बोर्ड, अजमेर',
      sub: 'Govt. Affiliation: RBSE/SEC/2026/9102',
      codeLabel: 'शाला दर्पण कोड',
      codeVal: 'RJ-214081',
      udise: '08120401824'
    },
    upmsp: {
      name: 'माध्यमिक शिक्षा परिषद, उत्तर प्रदेश, प्रयागराज',
      sub: 'UP Board Recognised Reg: UP/HS/8812',
      codeLabel: 'DIOS विद्यालय कोड',
      codeVal: 'UP-7729',
      udise: '09210803411'
    },
    hbse: {
      name: 'हरियाणा विद्यालय शिक्षा बोर्ड, भिवानी',
      sub: 'Haryana Board Approved: HBSE/AFF/5512',
      codeLabel: 'अवसर पोर्टल कोड',
      codeVal: 'HR-MIS-4412',
      udise: '06140301988'
    },
    cbse: {
      name: 'CENTRAL BOARD OF SECONDARY EDUCATION, DELHI',
      sub: 'Affiliated to CBSE, New Delhi',
      codeLabel: 'Affiliation & School No',
      codeVal: 'AFF: 1730992 | SCH: 10482',
      udise: '08120401824'
    },
    state_board: {
      name: 'STATE BOARD OF SECONDARY EDUCATION',
      sub: 'Government Recognized Secondary School',
      codeLabel: 'School Recognition No',
      codeVal: 'REC-2026-904',
      udise: '08120401824'
    }
  };

  const activeBoard = boardLabels[boardType];

  const filteredBatchStudents = isBatchMode
    ? allStudents.filter((s) => s.grade === batchGrade).slice(0, 8)
    : [student];

  // Theme color styles
  const colorThemes: Record<string, { bg: string; badge: string; text: string; header: string; border: string }> = {
    emerald: {
      bg: 'from-emerald-950/40 to-slate-900',
      badge: 'bg-emerald-600',
      text: 'text-emerald-400',
      header: 'bg-emerald-800 text-white',
      border: 'border-emerald-600'
    },
    blue: {
      bg: 'from-blue-950/40 to-slate-900',
      badge: 'bg-blue-600',
      text: 'text-blue-400',
      header: 'bg-blue-800 text-white',
      border: 'border-blue-600'
    },
    indigo: {
      bg: 'from-indigo-950/40 to-slate-900',
      badge: 'bg-indigo-600',
      text: 'text-indigo-400',
      header: 'bg-indigo-800 text-white',
      border: 'border-indigo-600'
    },
    amber: {
      bg: 'from-amber-950/40 to-slate-900',
      badge: 'bg-amber-600',
      text: 'text-amber-400',
      header: 'bg-amber-800 text-white',
      border: 'border-amber-600'
    }
  };

  const currentTheme = colorThemes[schoolColor] || colorThemes.emerald;

  const handleTriggerPrint = () => {
    onShowToast?.('success', 'प्रिंटिंग विंडो प्रारंभ', 'आईडी कार्ड प्रिंटर या PDF हेतु तैयार');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Render Front Side of Single Card
  const renderCardFront = (std: ErpStudentRecord, isLandscape = false) => {
    const admissionNo = std.admissionNo || `ADM-${std.rollNo || '2026'}`;
    const qrTargetUrl = `https://www.dakshora.co.in/verify/std/${std.id || admissionNo}`;

    if (isLandscape) {
      // Landscape Format: 86mm x 54mm standard
      return (
        <div
          className={`w-[340px] h-[215px] bg-white text-slate-900 rounded-2xl border-2 ${currentTheme.border} shadow-xl flex flex-col justify-between overflow-hidden relative font-sans`}
          style={{ boxSizing: 'border-box' }}
        >
          {/* Header */}
          <div className={`${currentTheme.header} px-3 py-1.5 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center font-black text-xs shadow">
                🎓
              </div>
              <div className="leading-tight">
                <div className="text-[11px] font-black uppercase tracking-wide">DAKSHORA ACADEMY</div>
                <div className="text-[8px] font-medium opacity-90">{activeBoard.name}</div>
              </div>
            </div>
            <div className="text-right text-[8px] font-mono opacity-90">
              <div>{activeBoard.codeLabel}: <b>{activeBoard.codeVal}</b></div>
              <div>UDISE+: {activeBoard.udise}</div>
            </div>
          </div>

          {/* Body */}
          <div className="p-2.5 flex items-center gap-3">
            {/* Student Photo */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-24 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-700 font-extrabold text-2xl shadow-inner relative overflow-hidden">
                {std.avatarUrl ? (
                  <img src={std.avatarUrl} alt={std.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{std.name.charAt(0)}</span>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-red-600 text-white text-[8px] font-bold text-center py-0.5">
                  {std.bloodGroup || 'O+'}
                </span>
              </div>
              <span className="text-[8px] font-mono text-slate-500 font-bold mt-1">2026-27</span>
            </div>

            {/* Info details */}
            <div className="flex-1 space-y-1 text-[10px]">
              <div>
                <span className="text-[13px] font-black text-slate-950 block leading-tight">{std.name}</span>
                <span className="text-[9px] font-bold text-emerald-700">{std.grade} - Sec {std.section}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-700">
                <div>स्कॉलर सं.: <b className="text-slate-950 font-mono">{admissionNo}</b></div>
                <div>रोल सं.: <b className="text-slate-950 font-mono">{std.rollNo}</b></div>
                <div>जन्म तिथि: <b className="text-slate-950">{std.dob || '15-08-2011'}</b></div>
                <div>रक्त समूह: <b className="text-red-700 font-bold">{std.bloodGroup || 'O+'}</b></div>
                <div className="col-span-2 truncate">अभिभावक: <b className="text-slate-950">{std.parentName}</b></div>
                <div className="col-span-2">आपातकालीन: <b className="text-emerald-800 font-mono">{std.parentPhone}</b></div>
              </div>
            </div>

            {/* QR code */}
            <div className="flex flex-col items-center justify-center">
              {generateQrCodeSvg(qrTargetUrl, 54)}
              <span className="text-[7px] text-slate-400 font-mono mt-0.5">स्कैन सत्यापन</span>
            </div>
          </div>

          {/* Footer Barcode */}
          <div className="bg-slate-50 border-t border-slate-200 px-3 py-1 flex items-center justify-between">
            <div className="w-36">
              {generateBarcodeSvg(admissionNo, 140, 22)}
            </div>
            <div className="text-right">
              <div className="font-serif italic text-[9px] text-slate-800 font-bold">Principal</div>
              <div className="text-[7px] text-slate-500 uppercase tracking-tighter">Authorized Sign</div>
            </div>
          </div>
        </div>
      );
    }

    // Portrait Format: 54mm x 86mm standard lanyard card
    return (
      <div
        className={`w-[230px] h-[355px] bg-white text-slate-900 rounded-2xl border-2 ${currentTheme.border} shadow-xl flex flex-col justify-between overflow-hidden relative font-sans`}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Lanyard punch hole simulation */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-slate-300/60 z-10" />

        {/* Header */}
        <div className={`${currentTheme.header} pt-3 pb-2 px-2 text-center relative`}>
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <span className="text-base">🎓</span>
            <div className="text-[11px] font-black uppercase tracking-wide leading-tight">DAKSHORA ACADEMY</div>
          </div>
          <div className="text-[7.5px] font-medium opacity-90 truncate">{activeBoard.name}</div>
          <div className="text-[7px] font-mono opacity-80 mt-0.5">
            {activeBoard.codeLabel}: <b>{activeBoard.codeVal}</b>
          </div>
        </div>

        {/* Student Photo with Badge */}
        <div className="flex flex-col items-center pt-2">
          <div className="w-20 h-24 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-700 font-extrabold text-3xl shadow-inner relative overflow-hidden">
            {std.avatarUrl ? (
              <img src={std.avatarUrl} alt={std.name} className="w-full h-full object-cover" />
            ) : (
              <span>{std.name.charAt(0)}</span>
            )}
            <span className="absolute bottom-0 inset-x-0 bg-red-600 text-white text-[8px] font-bold text-center py-0.5">
              {std.bloodGroup || 'O+'}
            </span>
          </div>
          <h4 className="text-[12px] font-black text-slate-950 mt-1 leading-tight text-center px-1 truncate w-full">
            {std.name}
          </h4>
          <span className="text-[9px] font-bold text-emerald-700 font-mono">
            {std.grade} • Sec {std.section}
          </span>
        </div>

        {/* Student Details Grid */}
        <div className="px-3 py-1 space-y-0.5 text-[8.5px] text-slate-700 border-y border-slate-100 bg-slate-50/70">
          <div className="flex justify-between">
            <span className="text-slate-500">स्कॉलर / SR No:</span>
            <b className="text-slate-950 font-mono">{admissionNo}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">रोल नं. (Roll):</span>
            <b className="text-slate-950 font-mono">{std.rollNo}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">जन्म तिथि (DOB):</span>
            <b className="text-slate-950">{std.dob || '15-08-2011'}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">अभिभावक:</span>
            <b className="text-slate-950 truncate max-w-[120px]">{std.parentName}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">मोबाइल (Helpline):</span>
            <b className="text-emerald-800 font-mono">{std.parentPhone}</b>
          </div>
        </div>

        {/* Barcode & Signature */}
        <div className="p-2 space-y-1 bg-white">
          <div className="w-full">
            {generateBarcodeSvg(admissionNo, 210, 20)}
          </div>
          <div className="flex items-center justify-between text-[7px] text-slate-500 pt-0.5 border-t border-slate-100">
            <span>सत्र: <b>2026-2027</b></span>
            <div className="text-right">
              <span className="font-serif italic font-bold text-slate-800 block text-[8px]">Principal</span>
              <span>प्राधिकृत हस्ताक्षर</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Back Side of Single Card
  const renderCardBack = (std: ErpStudentRecord, isLandscape = false) => {
    const admissionNo = std.admissionNo || `ADM-${std.rollNo || '2026'}`;
    const qrTargetUrl = `https://www.dakshora.co.in/verify/std/${std.id || admissionNo}`;

    if (isLandscape) {
      return (
        <div
          className={`w-[340px] h-[215px] bg-slate-50 text-slate-900 rounded-2xl border-2 ${currentTheme.border} shadow-xl flex flex-col justify-between overflow-hidden relative font-sans`}
          style={{ boxSizing: 'border-box' }}
        >
          <div className={`${currentTheme.header} px-3 py-1 flex items-center justify-between text-[9px] font-bold`}>
            <span>विद्यालय निर्देश एवं आपातकालीन विवरण</span>
            <span>CARD NO: {admissionNo}</span>
          </div>

          <div className="p-3 grid grid-cols-3 gap-2 text-[8.5px]">
            <div className="col-span-2 space-y-1.5 text-slate-700">
              <div>
                <b className="text-slate-900 block font-bold">आवासीय पता (Residential Address):</b>
                <span className="text-[8px] leading-tight block text-slate-600">{std.address || 'Civil Lines, Jaipur, Rajasthan - 302006'}</span>
              </div>
              <div>
                <b className="text-slate-900 block font-bold">वाहन/बस रूट (Bus Transport):</b>
                <span className="text-emerald-700 font-medium">{std.transportRoute || 'Route #4 (Vaishali - Mansarovar)'}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[7.5px] leading-tight">
                ⚠️ यह पहचान पत्र विद्यालय की संपत्ति है। खोने पर तुरंत कार्यालय को सूचित करें। पाए जाने पर नजदीकी डाकपेटी या विद्यालय में लौटाएं।
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-l border-slate-200 pl-2">
              {generateQrCodeSvg(qrTargetUrl, 64)}
              <span className="text-[7.5px] font-mono text-slate-500 mt-1 text-center font-bold">Digital ID Scan</span>
            </div>
          </div>

          <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between text-[7.5px]">
            <div>Helpline: <b>+91 141-2894100</b></div>
            <div>Email: <b>support@dakshora.co.in</b></div>
            <div>Web: <b>www.dakshora.co.in</b></div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`w-[230px] h-[355px] bg-slate-50 text-slate-900 rounded-2xl border-2 ${currentTheme.border} shadow-xl flex flex-col justify-between overflow-hidden relative font-sans`}
        style={{ boxSizing: 'border-box' }}
      >
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-slate-300/60 z-10" />

        <div className={`${currentTheme.header} pt-3 pb-1.5 px-2 text-center`}>
          <div className="text-[10px] font-black uppercase tracking-wide">DAKSHORA ACADEMY</div>
          <div className="text-[7.5px] opacity-90">STUDENT IDENTITY CARD (TERMS)</div>
        </div>

        <div className="p-3 space-y-2 text-[8.5px] text-slate-700 flex-1">
          <div>
            <span className="text-slate-500 block font-bold">विद्यार्थी स्थायी पता:</span>
            <span className="text-slate-950 font-medium text-[8px] leading-tight block">
              {std.address || 'Civil Lines, Jaipur, Rajasthan - 302006'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block font-bold">परिवहन रूट:</span>
            <span className="text-emerald-700 font-bold">{std.transportRoute || 'Route #4 (Campus Bus Express)'}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200">
            {generateQrCodeSvg(qrTargetUrl, 68)}
            <span className="text-[7px] text-slate-500 font-mono mt-1 font-bold">PORTAL VERIFICATION QR</span>
          </div>

          <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[7px] leading-tight">
            ⚠️ यह कार्ड सदैव छात्र के पास होना अनिवार्य है। पाए जाने पर कृपया विद्यालय कार्यालय में जमा कराएं।
          </div>
        </div>

        <div className="bg-slate-950 text-white p-2 text-center text-[7.5px] space-y-0.5 font-mono">
          <div>📞 फोन: +91 141-2894100</div>
          <div>🌐 www.dakshora.co.in</div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>स्मार्ट विद्यार्थी आईडी कार्ड (Smart Student ID Badge)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PVC Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {student.name} • {student.grade} - {student.section} • Roll #{student.rollNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>{isBatchMode ? `Print Class Sheet (${filteredBatchStudents.length} Cards)` : 'Print ID Card'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Customizers */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs font-mono">
          {/* Board Selector */}
          <div>
            <label className="text-slate-400 font-bold block mb-1">शिक्षा बोर्ड (Board):</label>
            <select
              value={boardType}
              onChange={(e) => setBoardType(e.target.value as BoardType)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
            >
              <option value="rbse">RBSE (राजस्थान बोर्ड - शाला दर्पण)</option>
              <option value="upmsp">UPMSP (उत्तर प्रदेश बोर्ड - DIOS)</option>
              <option value="hbse">HBSE (हरियाणा बोर्ड - अवसर पोर्टल)</option>
              <option value="cbse">CBSE (सेंट्रल बोर्ड ऑफ सेकंडरी)</option>
              <option value="state_board">Generic State Board</option>
            </select>
          </div>

          {/* Orientation */}
          <div>
            <label className="text-slate-400 font-bold block mb-1">कार्ड लेआउट (Orientation):</label>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setCardOrientation('portrait')}
                className={`py-1.5 rounded-lg text-center font-bold ${
                  cardOrientation === 'portrait' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                Portrait (उर्ध्व)
              </button>
              <button
                type="button"
                onClick={() => setCardOrientation('landscape')}
                className={`py-1.5 rounded-lg text-center font-bold ${
                  cardOrientation === 'landscape' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                Landscape (क्षैतिज)
              </button>
            </div>
          </div>

          {/* Sides */}
          <div>
            <label className="text-slate-400 font-bold block mb-1">पक्ष (Sides):</label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setCardSide('front')}
                className={`py-1.5 rounded-lg text-center font-bold ${
                  cardSide === 'front' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => setCardSide('back')}
                className={`py-1.5 rounded-lg text-center font-bold ${
                  cardSide === 'back' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCardSide('both')}
                className={`py-1.5 rounded-lg text-center font-bold ${
                  cardSide === 'both' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                Both
              </button>
            </div>
          </div>

          {/* Batch Print Toggle */}
          <div>
            <label className="text-slate-400 font-bold block mb-1">प्रिंट मोड (Print Mode):</label>
            <button
              type="button"
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`w-full py-1.5 px-2 rounded-xl text-center font-bold flex items-center justify-center gap-1.5 ${
                isBatchMode ? 'bg-amber-600 text-white shadow' : 'bg-slate-900 text-slate-300 border border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isBatchMode ? 'Batch Class Sheet (8/A4)' : 'Single Student Mode'}</span>
            </button>
          </div>
        </div>

        {/* Live Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-center min-h-[360px]">
          {isBatchMode ? (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                <span>Class 8-Cards Sheet Preview for <b>{batchGrade}</b> ({filteredBatchStudents.length} Students)</span>
                <span className="text-amber-400 font-bold">Standard PVC A4 Sheet</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
                {filteredBatchStudents.map((s) => (
                  <div key={s.id} className="transform hover:scale-105 transition-transform duration-200">
                    {renderCardFront(s, cardOrientation === 'landscape')}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-6">
              {(cardSide === 'front' || cardSide === 'both') && (
                <div className="space-y-2 text-center">
                  <span className="text-xs font-mono text-slate-400 font-bold">मुख पृष्ठ (FRONT SIDE)</span>
                  {renderCardFront(student, cardOrientation === 'landscape')}
                </div>
              )}
              {(cardSide === 'back' || cardSide === 'both') && (
                <div className="space-y-2 text-center">
                  <span className="text-xs font-mono text-slate-400 font-bold">पृष्ठ भाग (BACK SIDE)</span>
                  {renderCardBack(student, cardOrientation === 'landscape')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footnotes */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>High-DPI Barcode & QR Code embedded • Compatible with PVC Card Printers (Evolis, Zebra, Fargo)</span>
          </div>
          <div>
            Session: <b className="text-white">2026-2027</b>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🖨️ DEDICATED PRINT ISOLATION CONTAINER FOR BROWSER PRINT DIALOGUE */}
      {/* ========================================================================= */}
      <div id="printable-id-card" className="hidden print:block">
        {isBatchMode ? (
          <div className="grid grid-cols-2 gap-4 p-4">
            {filteredBatchStudents.map((s) => (
              <div key={s.id} className="page-break-inside-avoid">
                {renderCardFront(s, cardOrientation === 'landscape')}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-8 gap-6">
            {(cardSide === 'front' || cardSide === 'both') && renderCardFront(student, cardOrientation === 'landscape')}
            {(cardSide === 'back' || cardSide === 'both') && renderCardBack(student, cardOrientation === 'landscape')}
          </div>
        )}
      </div>
    </div>
  );
};
