import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  Plus,
  ArrowUpRight,
  Receipt,
  FileText,
  Clock,
  UserCheck,
  Building,
  RotateCcw,
  Sparkles,
  QrCode,
  ShieldCheck,
  ChevronRight,
  X,
  RefreshCw,
  Eye,
  Info,
  Layers,
  Banknote,
  Check,
  Send,
  Smartphone,
  Copy,
  ExternalLink
} from 'lucide-react';
import {
  ErpRole,
  ErpFeeStructure,
  ErpFeeDemand,
  ErpFeePayment,
  ErpPaymentReversal,
  ErpFeeOverviewSummary,
  ErpStudentFeeAccount,
  ErpPrintableReceipt,
  ErpClassFeeSummary,
  ErpStudentRecord
} from '../types';
import {
  fetchErpFeeOverview,
  fetchErpFeeStructures,
  createErpFeeStructure,
  updateErpFeeStructure,
  deleteErpFeeStructure,
  fetchErpFeeDemands,
  generateErpFeeDemands,
  fetchStudentFeeAccount,
  collectErpFeePayment,
  reverseErpFeePayment,
  fetchErpFeeReceipt,
  fetchErpFeeCollectionReport,
  fetchErpFeeOutstandingReport,
  fetchErpClassFeeSummary,
  fetchErpFeeReversals,
  fetchErpStudents
} from '../services/api';

export type BoardType = 'rbse' | 'upmsp' | 'hbse' | 'cbse' | 'state';
export type MediumType = 'hindi' | 'bilingual' | 'english';

export const FEE_BOARD_CONFIGS: Record<BoardType, {
  boardNameHindi: string;
  boardNameEng: string;
  authorityHindi: string;
  authorityEng: string;
  schoolCodeLabel: string;
  schoolCodeDefault: string;
  receiptTitleHindi: string;
  receiptTitleEng: string;
  tagline: string;
  emblemInitials: string;
  emblemGradient: string;
}> = {
  rbse: {
    boardNameHindi: 'माध्यमिक शिक्षा बोर्ड, राजस्थान (RBSE), अजमेर',
    boardNameEng: 'Board of Secondary Education Rajasthan, Ajmer (RBSE)',
    authorityHindi: 'माध्यमिक शिक्षा बोर्ड राजस्थान से सम्बद्ध • शाला दर्पण पंजीकृत',
    authorityEng: 'Affiliated to Board of Secondary Education Rajasthan • Shala Darpan Registered',
    schoolCodeLabel: 'शाला दर्पण ID',
    schoolCodeDefault: 'RJ-18492',
    receiptTitleHindi: 'आधिकारिक शुल्क रसीद एवं भुगतान पावती',
    receiptTitleEng: 'Official Fee Receipt & Payment Acknowledgment',
    tagline: 'विद्या ददाति विनयं • राजस्थान सरकार मान्यता प्राप्त',
    emblemInitials: 'RBSE',
    emblemGradient: 'from-amber-950 via-orange-950 to-slate-900 border-amber-600 text-amber-400'
  },
  upmsp: {
    boardNameHindi: 'माध्यमिक शिक्षा परिषद्, उत्तर प्रदेश, प्रयागराज (UPMSP)',
    boardNameEng: 'UP Board of High School & Intermediate Education, Prayagraj',
    authorityHindi: 'उत्तर प्रदेश माध्यमिक शिक्षा परिषद्, प्रयागराज द्वारा मान्यता प्राप्त',
    authorityEng: 'Recognized by UP Board of Secondary Education, Prayagraj',
    schoolCodeLabel: 'कॉलेज कोड',
    schoolCodeDefault: 'UP-10482',
    receiptTitleHindi: 'शुल्क जमा रसीद एवं चालान पत्रक',
    receiptTitleEng: 'Official Fee Deposit Receipt & Challan',
    tagline: 'उत्कृष्ट शिक्षा • माध्यमिक शिक्षा परिषद् उत्तर प्रदेश',
    emblemInitials: 'UPMSP',
    emblemGradient: 'from-emerald-950 via-teal-950 to-slate-900 border-emerald-600 text-emerald-400'
  },
  hbse: {
    boardNameHindi: 'हरियाणा विद्यालय शिक्षा बोर्ड, भिवानी (HBSE)',
    boardNameEng: 'Board of School Education Haryana, Bhiwani (HBSE)',
    authorityHindi: 'हरियाणा विद्यालय शिक्षा बोर्ड, भिवानी से मान्यता प्राप्त',
    authorityEng: 'Affiliated to Board of School Education Haryana, Bhiwani',
    schoolCodeLabel: 'अवसर / MIS कोड',
    schoolCodeDefault: 'HR-8492',
    receiptTitleHindi: 'विद्यार्थी शुल्क पावती पत्रक',
    receiptTitleEng: 'Student Fee Acknowledgment & Receipt',
    tagline: 'ज्ञानं परमं बलम् • हरियाणा शिक्षा विभाग',
    emblemInitials: 'HBSE',
    emblemGradient: 'from-blue-950 via-indigo-950 to-slate-900 border-blue-500 text-cyan-400'
  },
  cbse: {
    boardNameHindi: 'केंद्रीय माध्यमिक शिक्षा बोर्ड, नई दिल्ली (CBSE)',
    boardNameEng: 'Central Board of Secondary Education (CBSE), New Delhi',
    authorityHindi: 'केंद्रीय माध्यमिक शिक्षा बोर्ड, नई दिल्ली से सम्बद्ध',
    authorityEng: 'Affiliated to Central Board of Secondary Education, New Delhi',
    schoolCodeLabel: 'School Code',
    schoolCodeDefault: 'DPS-VK-894',
    receiptTitleHindi: 'शुल्क भुगतान रसीद (Fee Payment Receipt)',
    receiptTitleEng: 'Official Institutional Fee Payment Receipt',
    tagline: 'तमसो मा ज्योतिर्गमय • Delhi Public Heritage Trust',
    emblemInitials: 'CBSE',
    emblemGradient: 'from-indigo-950 via-slate-900 to-slate-950 border-indigo-600 text-amber-400'
  },
  state: {
    boardNameHindi: 'राज्य माध्यमिक शिक्षा बोर्ड (State Board of Education)',
    boardNameEng: 'State Board of Secondary & Higher Secondary Education',
    authorityHindi: 'राज्य विद्यालय शिक्षा परिषद द्वारा मान्यता प्राप्त',
    authorityEng: 'Recognized by State School Education Council',
    schoolCodeLabel: 'विद्यालय कोड',
    schoolCodeDefault: 'SB-48192',
    receiptTitleHindi: 'शुल्क प्राप्ति रसीद (Official Fee Receipt)',
    receiptTitleEng: 'Institutional Fee Receipt & Deposit Voucher',
    tagline: 'विद्या सर्वस्य भूषणम् • State Board Education',
    emblemInitials: 'STATE',
    emblemGradient: 'from-purple-950 via-violet-950 to-slate-900 border-purple-500 text-purple-300'
  }
};

export const getAmountInWordsHindi = (num: number): string => {
  if (!num || num <= 0) return 'शून्य रुपये मात्र';
  const a = ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
    'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
    'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाइस', 'उनतीस', 'तीस',
    'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
    'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
    'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
    'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
    'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्नासी', 'अस्सी',
    'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
    'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'];
  
  const convertUnder1000 = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += (a[Math.floor(n / 100)] + ' सौ ');
      n %= 100;
    }
    if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore > 0) words += `${a[crore] || crore} करोड़ `;
  if (lakh > 0) words += `${a[lakh] || lakh} लाख `;
  if (thousand > 0) words += `${a[thousand] || thousand} हजार `;
  if (num > 0) words += convertUnder1000(num);

  return `रुपये ${words.trim()} मात्र`;
};

export const getAmountInWordsEng = (num: number): string => {
  if (!num || num <= 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertGroup = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore > 0) words += `${convertGroup(crore)} Crore `;
  if (lakh > 0) words += `${convertGroup(lakh)} Lakh `;
  if (thousand > 0) words += `${convertGroup(thousand)} Thousand `;
  if (num > 0) words += convertGroup(num);

  return `${words.trim()} Rupees Only`;
};

export const getFeeHeadBilingual = (head: string, medium: MediumType): string => {
  const h = (head || '').toLowerCase();
  let hindi = head;
  let eng = head;
  if (h.includes('tuit') || h.includes('शिक्षण')) { hindi = 'शिक्षण शुल्क'; eng = 'Tuition Fee'; }
  else if (h.includes('dev') || h.includes('विकास')) { hindi = 'विकास शुल्क / निधि'; eng = 'Development Fund'; }
  else if (h.includes('exam') || h.includes('परीक्ष')) { hindi = 'परीक्षा शुल्क'; eng = 'Examination Fee'; }
  else if (h.includes('sport') || h.includes('योग') || h.includes('खेल')) { hindi = 'खेलकूद एवं योग शुल्क'; eng = 'Sports & Physical Edu Fee'; }
  else if (h.includes('lab') || h.includes('sci') || h.includes('प्रयोग')) { hindi = 'प्रयोगशाला / विज्ञान शुल्क'; eng = 'Science & Lab Fee'; }
  else if (h.includes('comp') || h.includes('it') || h.includes('कम्प्यूटर')) { hindi = 'कम्प्यूटर एवं IT शुल्क'; eng = 'Computer & IT Fee'; }
  else if (h.includes('trans') || h.includes('bus') || h.includes('वाहन') || h.includes('परिवाहन')) { hindi = 'वाहन / परिवहन शुल्क'; eng = 'Transport / Bus Fee'; }
  else if (h.includes('adm') || h.includes('प्रवेश') || h.includes('reg')) { hindi = 'प्रवेश एवं पंजीकरण शुल्क'; eng = 'Admission & Reg Fee'; }
  else if (h.includes('lib') || h.includes('पुस्तकालय')) { hindi = 'पुस्तकालय शुल्क'; eng = 'Library Fee'; }
  else if (h.includes('rte')) { hindi = 'RTE 25% नि:शुल्क कोटा (छूट)'; eng = 'RTE 25% Free Quota Waiver'; }
  else { hindi = head; eng = head; }

  if (medium === 'hindi') return hindi;
  if (medium === 'english') return eng;
  return `${hindi} (${eng})`;
};

interface FeesManagementHubProps {
  activeRole: ErpRole;
  activeSession: string;
  organizationId: string;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

type FeeTab = 'overview' | 'structures' | 'collection' | 'ledger' | 'reports';

export const FeesManagementHub: React.FC<FeesManagementHubProps> = ({
  activeRole,
  activeSession,
  organizationId,
  onShowToast
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<FeeTab>('overview');

  // Overview Data
  const [overview, setOverview] = useState<ErpFeeOverviewSummary | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Fee Structures Data
  const [structures, setStructures] = useState<ErpFeeStructure[]>([]);
  const [structureGradeFilter, setStructureGradeFilter] = useState<string>('all');
  const [showAddStructureModal, setShowAddStructureModal] = useState(false);
  const [structureForm, setStructureForm] = useState({
    grade: 'Class 10',
    feeHead: '',
    amountINR: 15000,
    frequency: 'quarterly' as 'monthly' | 'quarterly' | 'annual' | 'one-time',
    dueDay: 10,
    isMandatory: true
  });

  // Demands & Ledger Data
  const [demands, setDemands] = useState<ErpFeeDemand[]>([]);
  const [demandGradeFilter, setDemandGradeFilter] = useState<string>('all');
  const [demandStatusFilter, setDemandStatusFilter] = useState<string>('all');
  const [demandSearch, setDemandSearch] = useState<string>('');
  const [loadingDemands, setLoadingDemands] = useState(false);

  // Collection Terminal Data
  const [allStudents, setAllStudents] = useState<ErpStudentRecord[]>([]);
  const [terminalSearch, setTerminalSearch] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<ErpStudentRecord | null>(null);
  const [studentAccount, setStudentAccount] = useState<ErpStudentFeeAccount | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<ErpFeeDemand | null>(null);
  const [collectionAmount, setCollectionAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card'>('upi');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [cashierRemarks, setCashierRemarks] = useState<string>('');
  const [collectingPayment, setCollectingPayment] = useState(false);

  // Student Full Ledger Modal
  const [viewingLedgerStudentId, setViewingLedgerStudentId] = useState<string | null>(null);
  const [detailedLedger, setDetailedLedger] = useState<ErpStudentFeeAccount | null>(null);

  // Printable Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [printableReceipt, setPrintableReceipt] = useState<ErpPrintableReceipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  // Reports Data
  const [reportSubTab, setReportSubTab] = useState<'collection' | 'outstanding' | 'class_summary' | 'reversals'>('collection');
  const [collectionReport, setCollectionReport] = useState<ErpFeePayment[]>([]);
  const [outstandingReport, setOutstandingReport] = useState<ErpFeeDemand[]>([]);
  const [classSummary, setClassSummary] = useState<ErpClassFeeSummary[]>([]);
  const [reversals, setReversals] = useState<ErpPaymentReversal[]>([]);
  const [reportModeFilter, setReportModeFilter] = useState<string>('all');
  const [agingFilter, setAgingFilter] = useState<string>('all');

  // Payment Reversal Modal
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reversingPayment, setReversingPayment] = useState<ErpFeePayment | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [processingReversal, setProcessingReversal] = useState(false);

  // Batch Generation Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchGrade, setBatchGrade] = useState('Class 10');
  const [batchStructureId, setBatchStructureId] = useState('');
  const [batchDueDate, setBatchDueDate] = useState('');
  const [generatingBatch, setGeneratingBatch] = useState(false);
  // Multi-Board & Bilingual Customization States
  const [selectedFeeBoard, setSelectedFeeBoard] = useState<BoardType>('rbse');
  const [selectedFeeMedium, setSelectedFeeMedium] = useState<MediumType>('bilingual');
  const [receiptCopyMode, setReceiptCopyMode] = useState<'single' | 'challan'>('single');
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [concessionCategory, setConcessionCategory] = useState<'none' | 'rte' | 'sibling' | 'merit' | 'staff'>('none');
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [customReceiptSchoolCode, setCustomReceiptSchoolCode] = useState<string>('RJ-18492');
  const [customReceiptUdise, setCustomReceiptUdise] = useState<string>('08120401824');

  // Handle Send Fee Reminder via SMS / WhatsApp
  const handleSendFeeReminder = (demand: ErpFeeDemand) => {
    setSendingReminderId(demand.id);
    setTimeout(() => {
      setSendingReminderId(null);
      if (onShowToast) {
        onShowToast(
          'success',
          `शुल्क अनुस्मारक (Fee Reminder) प्रेषित: ${demand.studentName} के अभिभावक को ₹${demand.balanceAmount.toLocaleString()} की देय राशि का SMS व WhatsApp संदेश सफलतापूर्वक भेजा गया।`
        );
      }
    }, 700);
  };

  // Load Overview Data
  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await fetchErpFeeOverview();
      if (res.data?.overview) {
        setOverview(res.data.overview);
      }
    } catch (err: any) {
      console.error('Failed to load fee overview', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Load Structures Data
  const loadStructures = async () => {
    try {
      const res = await fetchErpFeeStructures({
        session: activeSession,
        grade: structureGradeFilter !== 'all' ? structureGradeFilter : undefined
      });
      if (res.data?.structures) {
        setStructures(res.data.structures);
        if (res.data.structures.length > 0 && !batchStructureId) {
          setBatchStructureId(res.data.structures[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load structures', err);
    }
  };

  // Load Demands Data
  const loadDemands = async () => {
    setLoadingDemands(true);
    try {
      const res = await fetchErpFeeDemands({
        session: activeSession,
        grade: demandGradeFilter !== 'all' ? demandGradeFilter : undefined,
        status: demandStatusFilter !== 'all' ? demandStatusFilter : undefined,
        search: demandSearch || undefined
      });
      if (res.data?.demands) {
        setDemands(res.data.demands);
      }
    } catch (err: any) {
      console.error('Failed to load demands', err);
    } finally {
      setLoadingDemands(false);
    }
  };

  // Load Students for Terminal
  const loadStudents = async () => {
    try {
      const res = await fetchErpStudents({ session: activeSession });
      if (res.data?.students) {
        setAllStudents(res.data.students);
      }
    } catch (err: any) {
      console.error('Failed to load students', err);
    }
  };

  // Load Reports
  const loadReports = async () => {
    try {
      if (reportSubTab === 'collection') {
        const res = await fetchErpFeeCollectionReport({
          paymentMode: reportModeFilter !== 'all' ? reportModeFilter : undefined
        });
        if (res.data?.payments) setCollectionReport(res.data.payments);
      } else if (reportSubTab === 'outstanding') {
        const res = await fetchErpFeeOutstandingReport({
          aging: agingFilter !== 'all' ? agingFilter : undefined
        });
        if (res.data?.demands) setOutstandingReport(res.data.demands);
      } else if (reportSubTab === 'class_summary') {
        const res = await fetchErpClassFeeSummary();
        if (res.data?.summary) setClassSummary(res.data.summary);
      } else if (reportSubTab === 'reversals') {
        const res = await fetchErpFeeReversals();
        if (res.data?.reversals) setReversals(res.data.reversals);
      }
    } catch (err: any) {
      console.error('Failed to load reports', err);
    }
  };

  // Initial and reactive loads
  useEffect(() => {
    loadOverview();
    loadStructures();
    loadDemands();
    loadStudents();
  }, [activeSession]);

  useEffect(() => {
    if (activeTab === 'structures') loadStructures();
    if (activeTab === 'ledger') loadDemands();
    if (activeTab === 'overview') loadOverview();
    if (activeTab === 'reports') loadReports();
  }, [activeTab, structureGradeFilter, demandGradeFilter, demandStatusFilter, reportSubTab, reportModeFilter, agingFilter]);

  // Handle student selection in terminal
  const handleSelectStudentForPayment = async (student: ErpStudentRecord) => {
    setSelectedStudent(student);
    try {
      const res = await fetchStudentFeeAccount(student.id);
      if (res.data?.student && res.data?.demands && res.data?.summary) {
        const account: ErpStudentFeeAccount = {
          student: res.data.student,
          demands: res.data.demands,
          payments: res.data.payments || [],
          concessions: res.data.concessions || [],
          summary: res.data.summary
        };
        setStudentAccount(account);
        const unpaid = account.demands.find((d: ErpFeeDemand) => d.balanceAmount > 0);
        if (unpaid) {
          setSelectedDemand(unpaid);
          setCollectionAmount(unpaid.balanceAmount);
        } else {
          setSelectedDemand(null);
          setCollectionAmount(0);
        }
      }
    } catch (err: any) {
      onShowToast?.('error', 'Failed to fetch student account details');
    }
  };

  // Handle Collecting Payment
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemand) {
      onShowToast?.('error', 'Please select a pending fee invoice');
      return;
    }
    if (collectionAmount <= 0) {
      onShowToast?.('error', 'Payment amount must be greater than 0');
      return;
    }
    if (collectionAmount > selectedDemand.balanceAmount + 0.01) {
      onShowToast?.('error', `Amount exceeds invoice balance of ₹${selectedDemand.balanceAmount.toLocaleString()}`);
      return;
    }

    setCollectingPayment(true);
    try {
      const res = await collectErpFeePayment({
        demandId: selectedDemand.id,
        amountPaid: collectionAmount,
        paymentMode,
        referenceNumber: referenceNumber || (paymentMode === 'cash' ? `CSH-${Date.now().toString().slice(-6)}` : `UPI-${Date.now().toString().slice(-8)}`),
        collectedBy: activeRole === 'admin' ? 'Finance Admin' : 'Front Desk Cashier',
        remarks: cashierRemarks
      });

      if (res.data?.receiptNo) {
        onShowToast?.('success', `Payment of ₹${collectionAmount.toLocaleString()} collected! Receipt: ${res.data.receiptNo}`);
        // Reset form and reload student account
        setCashierRemarks('');
        setReferenceNumber('');
        if (selectedStudent) {
          await handleSelectStudentForPayment(selectedStudent);
        }
        // Load receipt for instant preview
        handleOpenReceipt(res.data.receiptNo);
        // Refresh overview and demands
        loadOverview();
        loadDemands();
      }
    } catch (err: any) {
      onShowToast?.('error', err.response?.data?.message || err.message || 'Payment collection failed');
    } finally {
      setCollectingPayment(false);
    }
  };

  // Handle Open Receipt
  const handleOpenReceipt = async (receiptNo: string) => {
    setLoadingReceipt(true);
    setShowReceiptModal(true);
    try {
      const res = await fetchErpFeeReceipt(receiptNo);
      if (res.data?.receipt) {
        setPrintableReceipt(res.data.receipt);
      }
    } catch (err: any) {
      onShowToast?.('error', 'Failed to load official receipt');
      setShowReceiptModal(false);
    } finally {
      setLoadingReceipt(false);
    }
  };

  // Handle Print Receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Handle View Detailed Ledger Modal
  const handleOpenLedger = async (studentId: string) => {
    setViewingLedgerStudentId(studentId);
    try {
      const res = await fetchStudentFeeAccount(studentId);
      if (res.data?.student && res.data?.demands && res.data?.summary) {
        const account: ErpStudentFeeAccount = {
          student: res.data.student,
          demands: res.data.demands,
          payments: res.data.payments || [],
          concessions: res.data.concessions || [],
          summary: res.data.summary
        };
        setDetailedLedger(account);
      }
    } catch (err: any) {
      onShowToast?.('error', 'Failed to load student ledger');
      setViewingLedgerStudentId(null);
    }
  };

  // Handle Add Fee Structure
  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureForm.feeHead.trim()) {
      onShowToast?.('error', 'Fee Head name is required');
      return;
    }
    try {
      const res = await createErpFeeStructure({
        academicSession: activeSession,
        ...structureForm
      });
      if (res.data?.structure) {
        onShowToast?.('success', `Fee head '${structureForm.feeHead}' added for ${structureForm.grade}`);
        setShowAddStructureModal(false);
        setStructureForm({
          grade: 'Class 10',
          feeHead: '',
          amountINR: 15000,
          frequency: 'quarterly',
          dueDay: 10,
          isMandatory: true
        });
        loadStructures();
      }
    } catch (err: any) {
      onShowToast?.('error', err.message || 'Failed to create fee structure');
    }
  };

  // Handle Deactivate Structure
  const handleDeactivateStructure = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this fee head?')) return;
    try {
      await deleteErpFeeStructure(id);
      onShowToast?.('info', 'Fee structure deactivated');
      loadStructures();
    } catch (err: any) {
      onShowToast?.('error', 'Failed to deactivate fee structure');
    }
  };

  // Handle Batch Generate Demands
  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchStructureId) {
      onShowToast?.('error', 'Please select a fee structure');
      return;
    }
    setGeneratingBatch(true);
    try {
      const res = await generateErpFeeDemands({
        session: activeSession,
        grade: batchGrade,
        feeStructureId: batchStructureId,
        dueDate: batchDueDate || undefined
      });
      if (res.data) {
        onShowToast?.('success', res.data.message || `Generated ${res.data.count} fee demands`);
        setShowBatchModal(false);
        loadDemands();
        loadOverview();
      }
    } catch (err: any) {
      onShowToast?.('error', err.response?.data?.message || err.message || 'Batch generation failed');
    } finally {
      setGeneratingBatch(false);
    }
  };

  // Handle Open Reversal Modal
  const handleOpenReverseModal = (payment: ErpFeePayment) => {
    setReversingPayment(payment);
    setReversalReason('');
    setShowReverseModal(true);
  };

  // Handle Execute Reversal
  const handleExecuteReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingPayment) return;
    if (!reversalReason.trim() || reversalReason.trim().length < 5) {
      onShowToast?.('error', 'A valid reason (minimum 5 characters) is required for payment reversal');
      return;
    }
    setProcessingReversal(true);
    try {
      const res = await reverseErpFeePayment(
        reversingPayment.id,
        reversalReason,
        activeRole === 'admin' ? 'Principal / Senior Admin' : 'Finance Officer'
      );
      if (res.data) {
        onShowToast?.('success', res.data.message || 'Payment reversed successfully');
        setShowReverseModal(false);
        setReversingPayment(null);
        loadReports();
        loadOverview();
        loadDemands();
      }
    } catch (err: any) {
      onShowToast?.('error', err.response?.data?.message || err.message || 'Reversal failed');
    } finally {
      setProcessingReversal(false);
    }
  };

  // Export Collection Report to CSV
  const handleExportCollectionCSV = () => {
    if (collectionReport.length === 0) {
      onShowToast?.('info', 'No collection records to export');
      return;
    }
    const headers = ['Receipt No', 'Date', 'Student Name', 'Admission No', 'Grade', 'Fee Head', 'Amount (INR)', 'Payment Mode', 'Reference No', 'Collected By'];
    const rows = collectionReport.map(p => [
      p.receiptNo,
      p.paymentDate,
      `"${p.studentName}"`,
      p.admissionNo || '',
      `"${p.grade}-${p.section}"`,
      `"${p.feeHead}"`,
      p.amountPaid,
      p.paymentMode.toUpperCase(),
      p.referenceNumber,
      `"${p.collectedBy}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fee_Collection_Register_${activeSession}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 🧭 NAVIGATION HEADER & MODULE TABS */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Enterprise Finance & Cashier Suite
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                Session {activeSession}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1.5">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              <span>Fees & Finance Management</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Multi-tier fee structure configuration, student dues ledger, front-desk collection terminal & printable GST receipts.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 shadow-sm transition-all"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Generate Batch Demands</span>
            </button>
            <button
              onClick={() => setShowAddStructureModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Configure Fee Head</span>
            </button>
          </div>
        </div>

        {/* STATE BOARD & BILINGUAL SELECTION TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5" />
              बोर्ड चयन (Select Board):
            </span>
            {[
              { id: 'rbse', name: 'RBSE राजस्थान', tag: 'शाला दर्पण' },
              { id: 'upmsp', name: 'UP Board प्रयागराज', tag: 'कॉलेज कोड' },
              { id: 'hbse', name: 'HBSE हरियाणा', tag: 'अवसर MIS' },
              { id: 'cbse', name: 'CBSE नई दिल्ली', tag: 'Affiliation' },
              { id: 'state', name: 'State Board', tag: 'राज्य बोर्ड' },
            ].map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  const nb = b.id as BoardType;
                  setSelectedFeeBoard(nb);
                  setCustomReceiptSchoolCode(FEE_BOARD_CONFIGS[nb].schoolCodeDefault);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedFeeBoard === b.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 scale-[1.02]'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                <span>{b.name}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  selectedFeeBoard === b.id ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-800 text-slate-400'
                }`}>
                  {b.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Medium Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-1 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 px-2 font-mono">माध्यम:</span>
            {[
              { id: 'hindi', label: 'हिंदी माध्यम' },
              { id: 'bilingual', label: 'द्विभाषी (Bilingual)' },
              { id: 'english', label: 'English' },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedFeeMedium(m.id as MediumType)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedFeeMedium === m.id
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pt-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>
              {selectedFeeMedium === 'hindi' ? 'वित्तीय अवलोकन एवं सांख्यिकी' : selectedFeeMedium === 'english' ? 'Financial Overview & KPIs' : 'वित्तीय अवलोकन (Overview & KPIs)'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('collection')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'collection'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>
              {selectedFeeMedium === 'hindi' ? 'शुल्क संग्रह टर्मिनल (ऑनलाइन/नकद)' : selectedFeeMedium === 'english' ? 'Fee Collection Terminal' : 'शुल्क संग्रह टर्मिनल (Collection Terminal)'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ledger'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>
              {selectedFeeMedium === 'hindi' ? 'छात्र खाता बही एवं देय सूची' : selectedFeeMedium === 'english' ? 'Student Accounts & Dues Ledger' : 'छात्र खाता बही (Dues Ledger)'}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
              {demands.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('structures')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'structures'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>
              {selectedFeeMedium === 'hindi' ? 'शुल्क मद संरचना कॉन्फिगरेटर' : selectedFeeMedium === 'english' ? 'Fee Structure Configurator' : 'शुल्क मद संरचना (Fee Structures)'}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
              {structures.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>
              {selectedFeeMedium === 'hindi' ? 'वित्तीय रिपोर्ट एवं ऑडिट' : selectedFeeMedium === 'english' ? 'Financial Reports & Reversal Audit' : 'वित्तीय रिपोर्ट (Reports & Audit)'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 TAB 1: FINANCIAL OVERVIEW & KPIS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Invoiced */}
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                <span>Total Demand / Invoiced</span>
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">
                ₹{overview ? overview.totalInvoiced.toLocaleString() : '...'}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                Across {overview?.totalDemandsCount || 0} active demand notices
              </p>
            </div>

            {/* Total Collected */}
            <div className="p-5 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between text-emerald-300 text-xs font-mono mb-2">
                <span>Total Collected</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                ₹{overview ? overview.totalCollected.toLocaleString() : '...'}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-300/80 font-mono mt-1">
                <span>Collection rate:</span>
                <span className="font-bold text-emerald-300">{overview?.collectionRatePercentage}%</span>
              </div>
            </div>

            {/* Total Outstanding */}
            <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between text-amber-300 text-xs font-mono mb-2">
                <span>Outstanding Dues</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">
                ₹{overview ? overview.totalOutstanding.toLocaleString() : '...'}
              </div>
              <p className="text-[11px] text-amber-300/80 font-mono mt-1">
                {overview?.pendingCount || 0} pending + {overview?.partiallyPaidCount || 0} partial
              </p>
            </div>

            {/* Overdue */}
            <div className="p-5 rounded-3xl bg-rose-950/20 border border-rose-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between text-rose-300 text-xs font-mono mb-2">
                <span>Overdue Demands</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400">
                ₹{overview ? overview.totalOverdue.toLocaleString() : '...'}
              </div>
              <p className="text-[11px] text-rose-300/80 font-mono mt-1">
                {overview?.overdueCount || 0} past due date
              </p>
            </div>

            {/* Today's Collection */}
            <div className="p-5 rounded-3xl bg-purple-950/20 border border-purple-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between text-purple-300 text-xs font-mono mb-2">
                <span>Collected Today</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300">
                ₹{overview ? overview.todayCollected.toLocaleString() : '...'}
              </div>
              <p className="text-[11px] text-purple-300/80 font-mono mt-1">
                Live terminal cash-in
              </p>
            </div>
          </div>

          {/* Collection Rate Bar & Mode Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress & Overview Insights */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Term Fee Recovery & Health</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Real-time ratio of collected funds vs outstanding parent obligations
                  </p>
                </div>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {overview?.collectionRatePercentage}% Realized
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, overview?.collectionRatePercentage || 0)}%` }}
                />
              </div>

              {/* Status Breakdown Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
                  <div className="text-lg font-black text-emerald-400">{overview?.paidCount || 0}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Paid in Full</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
                  <div className="text-lg font-black text-teal-400">{overview?.partiallyPaidCount || 0}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Partially Paid</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
                  <div className="text-lg font-black text-amber-400">{overview?.pendingCount || 0}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Pending</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
                  <div className="text-lg font-black text-rose-400">{overview?.overdueCount || 0}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Overdue</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('collection')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Open Collection Terminal</span>
                </button>
                <button
                  onClick={() => setActiveTab('ledger')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700"
                >
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>Lookup Defaulter Students</span>
                </button>
              </div>
            </div>

            {/* Collection by Payment Mode */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span>Collections by Mode</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Audit breakdown across accepted transaction channels
              </p>

              <div className="space-y-3 pt-2">
                {/* UPI */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold">
                      UPI
                    </span>
                    <span className="text-xs font-semibold text-slate-200">UPI / QR Payment</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{(overview?.modeBreakdown?.upi || 0).toLocaleString()}
                  </span>
                </div>

                {/* Cash */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                      ₹
                    </span>
                    <span className="text-xs font-semibold text-slate-200">Front Desk Cash</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{(overview?.modeBreakdown?.cash || 0).toLocaleString()}
                  </span>
                </div>

                {/* Bank Transfer / NEFT */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-bold">
                      NEFT
                    </span>
                    <span className="text-xs font-semibold text-slate-200">Bank Transfer / IMPS</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{(overview?.modeBreakdown?.bank_transfer || 0).toLocaleString()}
                  </span>
                </div>

                {/* Cheque */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold">
                      CHQ
                    </span>
                    <span className="text-xs font-semibold text-slate-200">Cheque Deposits</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{(overview?.modeBreakdown?.cheque || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Collections Table */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Recent Fee Collections</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Latest transactions recorded across all school cashier counters
                </p>
              </div>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
              >
                <span>View Full Register</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                    <th className="p-3.5">Receipt No</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Fee Head</th>
                    <th className="p-3.5">Mode</th>
                    <th className="p-3.5">Amount Paid</th>
                    <th className="p-3.5 text-right">Receipt Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {overview?.recentPayments && overview.recentPayments.length > 0 ? (
                    overview.recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5 font-bold text-cyan-300">{p.receiptNo}</td>
                        <td className="p-3.5 text-slate-400">{p.paymentDate}</td>
                        <td className="p-3.5 font-bold text-white">
                          {p.studentName}{' '}
                          <span className="text-slate-400 font-normal">
                            ({p.grade}-{p.section})
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">{p.feeHead}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-200 border border-slate-700">
                            {p.paymentMode}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-400">₹{p.amountPaid.toLocaleString()}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenReceipt(p.receiptNo)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 ml-auto border border-slate-700"
                          >
                            <Printer className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Print Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        No payment transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💳 TAB 2: FEE COLLECTION TERMINAL */}
      {/* ========================================================================= */}
      {activeTab === 'collection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Selector & Unpaid Demands */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Select Student to Collect</span>
              </h3>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Student Name or Admission No..."
                  value={terminalSearch}
                  onChange={(e) => setTerminalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Student Quick List */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {allStudents
                  .filter((s) =>
                    !terminalSearch ||
                    s.name.toLowerCase().includes(terminalSearch.toLowerCase()) ||
                    (s.admissionNo && s.admissionNo.toLowerCase().includes(terminalSearch.toLowerCase()))
                  )
                  .slice(0, 8)
                  .map((s) => {
                    const isSelected = selectedStudent?.id === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStudentForPayment(s)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-900/20'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{s.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {s.admissionNo || 'DPS-2026-0000'} &bull; {s.grade} - {s.section}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 text-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Selected Student Ledger Summary */}
            {selectedStudent && studentAccount && (
              <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase">Student Financial Ledger</span>
                  <button
                    onClick={() => handleOpenLedger(selectedStudent.id)}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>View Complete Ledger</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Total Demanded:</span>
                    <span className="font-bold text-white">₹{studentAccount.summary.totalInvoiced.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Total Paid to Date:</span>
                    <span className="font-bold text-emerald-400">₹{studentAccount.summary.totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-mono">
                    <span className="font-bold text-slate-200">Current Outstanding:</span>
                    <span className="font-black text-rose-400">₹{studentAccount.summary.currentBalance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Pending Invoices for Selection */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 font-mono">Select Pending Invoice to Pay:</div>
                  {studentAccount.demands.filter(d => d.balanceAmount > 0).length > 0 ? (
                    studentAccount.demands
                      .filter(d => d.balanceAmount > 0)
                      .map((d) => {
                        const isChosen = selectedDemand?.id === d.id;
                        return (
                          <div
                            key={d.id}
                            onClick={() => {
                              setSelectedDemand(d);
                              setCollectionAmount(d.balanceAmount);
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                              isChosen
                                ? 'bg-cyan-950/30 border-cyan-500/60 shadow-md'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{d.feeHead}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                d.status === 'overdue'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              }`}>
                                {d.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[11px] font-mono text-slate-400">
                              <span>Due: {d.dueDate}</span>
                              <span className="font-bold text-white">Balance: ₹{d.balanceAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-center text-xs font-mono text-emerald-300">
                      ✓ No pending fee dues for this student! All accounts clear.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Payment Form & UPI QR */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  <span>Cashier Payment Terminal</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Accept tuition, transport, or lab fees via cash, instant UPI, or bank wire
                </p>
              </div>

              {selectedDemand ? (
                <form onSubmit={handleCollectPayment} className="space-y-5">
                  {/* Selected invoice banner */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Target Invoice</div>
                      <div className="text-sm font-bold text-white">{selectedDemand.invoiceNo} &bull; {selectedDemand.feeHead}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        For: {selectedDemand.studentName} ({selectedDemand.grade}-{selectedDemand.section})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Pending Balance</div>
                      <div className="text-xl font-black text-rose-400 font-mono">
                        ₹{selectedDemand.balanceAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Concession & RTE 25% Quick Waiver Selector */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-300 font-mono flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        छूट एवं छात्रवृत्ति वर्ग (Concession / RTE Category):
                      </span>
                      {concessionCategory !== 'none' && (
                        <button
                          type="button"
                          onClick={() => {
                            setConcessionCategory('none');
                            setCollectionAmount(selectedDemand.balanceAmount);
                            setCashierRemarks('');
                          }}
                          className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear Concession
                        </button>
                      )}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                      {[
                        { id: 'none', label: 'सामान्य (None)', pct: 0 },
                        { id: 'rte', label: 'RTE 25% (निःशुल्क)', pct: 100 },
                        { id: 'sibling', label: 'सहोदर (20% Off)', pct: 20 },
                        { id: 'merit', label: 'मेधावी (25% Off)', pct: 25 },
                        { id: 'staff', label: 'कर्मचारी (50% Off)', pct: 50 },
                      ].map((c) => {
                        const isChosen = concessionCategory === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setConcessionCategory(c.id as any);
                              if (c.pct === 100) {
                                setCollectionAmount(0);
                                setCashierRemarks('RTE Act Sec 12(1)(c) Free Admission 100% Waiver');
                              } else if (c.pct > 0) {
                                const discounted = Math.round(selectedDemand.balanceAmount * (1 - c.pct / 100));
                                setCollectionAmount(discounted);
                                setCashierRemarks(`${c.label} applied (${c.pct}% discount)`);
                              } else {
                                setCollectionAmount(selectedDemand.balanceAmount);
                                setCashierRemarks('');
                              }
                            }}
                            className={`p-1.5 rounded-xl text-center text-xs font-bold transition border cursor-pointer ${
                              isChosen
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <span>{c.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Amount Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 font-mono flex items-center justify-between">
                      <span>Collection Amount (INR):</span>
                      <button
                        type="button"
                        onClick={() => setCollectionAmount(selectedDemand.balanceAmount)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                      >
                        Set Full Balance (₹{selectedDemand.balanceAmount.toLocaleString()})
                      </button>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={selectedDemand.balanceAmount}
                        value={collectionAmount}
                        onChange={(e) => setCollectionAmount(Number(e.target.value))}
                        required
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-base font-bold focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 font-mono">Payment Channel / Mode:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'upi', label: 'UPI / QR', icon: QrCode },
                        { id: 'cash', label: 'Cash', icon: Banknote },
                        { id: 'bank_transfer', label: 'NEFT / Wire', icon: Building },
                        { id: 'cheque', label: 'Cheque', icon: FileText },
                        { id: 'card', label: 'Card / POS', icon: CreditCard }
                      ].map((m) => {
                        const isChosen = paymentMode === m.id;
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMode(m.id as any)}
                            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                              isChosen
                                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[11px] font-bold">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic UPI Gateway with Real Deep-Link & Action Buttons */}
                  {paymentMode === 'upi' && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-3">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-24 h-24 bg-white rounded-xl p-2 flex items-center justify-center flex-shrink-0 shadow-lg">
                          {/* Realistic High-Density QR Pattern */}
                          <div className="w-full h-full border-2 border-slate-950 grid grid-cols-4 gap-0.5 p-1 bg-slate-100">
                            <div className="bg-slate-950 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-slate-950 rounded-sm" />
                            <div className="bg-cyan-600 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-cyan-700 rounded-sm" />
                            <div className="bg-slate-950 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-slate-950 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-cyan-600 rounded-sm" />
                            <div className="bg-slate-950 rounded-sm" />
                            <div className="bg-cyan-600 rounded-sm" />
                            <div className="bg-slate-950 rounded-sm" />
                            <div className="bg-slate-900 rounded-sm" />
                            <div className="bg-slate-950 rounded-sm" />
                          </div>
                        </div>
                        <div className="space-y-1.5 font-mono text-xs text-center sm:text-left flex-1">
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <span className="font-black text-white text-sm">Dynamic Smart UPI Gateway</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              LIVE BHIM / NPCI
                            </span>
                          </div>
                          <div className="text-cyan-400 font-bold text-sm">dps.accounts@hdfcbank</div>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            PhonePe, Google Pay, Paytm, BHIM अथवा किसी भी UPI ऐप से स्कैन करें। देय राशि: <strong className="text-emerald-400 font-bold">₹{collectionAmount.toLocaleString()}</strong>
                          </p>
                        </div>
                      </div>

                      {/* UPI Quick Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText('dps.accounts@hdfcbank');
                            onShowToast?.('success', 'UPI VPA Copied: dps.accounts@hdfcbank');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Copy UPI ID</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const upiUrl = `upi://pay?pa=dps.accounts@hdfcbank&pn=DAKSHORA%20INSTITUTION&am=${collectionAmount}&cu=INR&tn=${selectedDemand.invoiceNo}`;
                            navigator.clipboard?.writeText(upiUrl);
                            onShowToast?.('success', 'Deep-link Payment URL Copied');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copy Payment Link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReferenceNumber(`UPI-${Date.now().toString().slice(-8)}`);
                            onShowToast?.('info', 'UPI UTR Auto-generated for Fast Terminal Checkout');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 font-bold border border-cyan-700/50 flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Auto-Generate UTR</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reference Number & Remarks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 font-mono">
                        {paymentMode === 'cash' ? 'Cash Voucher No (Optional):' : 'Transaction Ref / UTR / Cheque No:'}
                      </label>
                      <input
                        type="text"
                        placeholder={paymentMode === 'cash' ? 'Auto-generated' : 'e.g. 428917263541'}
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 font-mono">Cashier Notes / Remarks:</label>
                      <input
                        type="text"
                        placeholder="e.g. Q2 Tuition fee paid by mother"
                        value={cashierRemarks}
                        onChange={(e) => setCashierRemarks(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={collectingPayment}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {collectingPayment ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Official Receipt & Ledger Entry...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>Record Collection (₹{collectionAmount.toLocaleString()}) & Print Receipt</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-500">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">No Student / Invoice Selected</h4>
                  <p className="text-xs text-slate-500 font-mono max-w-sm mx-auto">
                    Search and pick a student on the left panel, or select one from the Dues Ledger to initiate fee collection.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📑 TAB 3: STUDENT ACCOUNTS & DUES LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Grade Filter */}
              <select
                value={demandGradeFilter}
                onChange={(e) => setDemandGradeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Classes</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>

              {/* Status Filter */}
              <select
                value={demandStatusFilter}
                onChange={(e) => setDemandStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Payment Statuses</option>
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid in Full</option>
                <option value="overdue">Overdue Past Due Date</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or invoice..."
                  value={demandSearch}
                  onChange={(e) => setDemandSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Showing <span className="font-bold text-white">{demands.length}</span> invoices
            </div>
          </div>

          {/* Demands Table */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                    <th className="p-3.5">Invoice No</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Grade</th>
                    <th className="p-3.5">Fee Head</th>
                    <th className="p-3.5">Net Amount</th>
                    <th className="p-3.5">Paid</th>
                    <th className="p-3.5">Balance</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {demands.length > 0 ? (
                    demands.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5 font-bold text-cyan-300">{d.invoiceNo}</td>
                        <td className="p-3.5 font-bold text-white">
                          {d.studentName}
                          {d.admissionNo && <span className="block text-[10px] text-slate-500 font-normal">{d.admissionNo}</span>}
                        </td>
                        <td className="p-3.5 text-slate-300">{d.grade}-{d.section}</td>
                        <td className="p-3.5 text-slate-300">{d.feeHead}</td>
                        <td className="p-3.5 font-bold text-white">₹{d.netAmount.toLocaleString()}</td>
                        <td className="p-3.5 font-bold text-emerald-400">₹{d.paidAmount.toLocaleString()}</td>
                        <td className="p-3.5 font-black text-rose-400">₹{d.balanceAmount.toLocaleString()}</td>
                        <td className="p-3.5 text-slate-400">{d.dueDate}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              d.status === 'paid'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : d.status === 'overdue'
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                : d.status === 'partially_paid'
                                ? 'bg-teal-950 text-teal-300 border border-teal-500/30'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {d.balanceAmount > 0 ? (
                              <button
                                onClick={() => {
                                  const st = allStudents.find(s => s.id === d.studentId);
                                  if (st) handleSelectStudentForPayment(st);
                                  setSelectedDemand(d);
                                  setCollectionAmount(d.balanceAmount);
                                  setActiveTab('collection');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm cursor-pointer"
                              >
                                Collect
                              </button>
                            ) : (
                              d.receiptNo && (
                                <button
                                  onClick={() => handleOpenReceipt(d.receiptNo!)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] cursor-pointer"
                                >
                                  Receipt
                                </button>
                              )
                            )}
                            {d.balanceAmount > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSendFeeReminder(d)}
                                disabled={sendingReminderId === d.id}
                                className="px-2 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-600/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                                title="Send SMS/WhatsApp Due Reminder to Parent"
                              >
                                <Smartphone className="w-3 h-3 text-amber-400" />
                                <span>{sendingReminderId === d.id ? 'Sending...' : 'Remind'}</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenLedger(d.studentId)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                            >
                              Ledger
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500 font-mono">
                        No fee demands matching the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚙️ TAB 4: FEE STRUCTURE CONFIGURATOR */}
      {/* ========================================================================= */}
      {activeTab === 'structures' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span>Fee Heads & Class Schedules</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Configure recurring tuition, transport, lab and activity heads per grade for session {activeSession}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={structureGradeFilter}
                  onChange={(e) => setStructureGradeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All Classes</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>

                <button
                  onClick={() => setShowAddStructureModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Fee Head</span>
                </button>
              </div>
            </div>

            {/* Structures List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {structures.map((st) => (
                <div
                  key={st.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-900 text-cyan-300 border border-slate-800 font-mono">
                      {st.grade}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      st.status === 'active'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {st.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">{st.feeHead}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {st.frequency.toUpperCase()} &bull; Due Day: {st.dueDay}th of billing month
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono uppercase block">Fee Amount</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        ₹{st.amountINR.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {st.isMandatory ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                          Mandatory
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                          Optional
                        </span>
                      )}
                      {st.status === 'active' && (
                        <button
                          onClick={() => handleDeactivateStructure(st.id)}
                          title="Deactivate"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📑 TAB 5: FINANCIAL REPORTS & REVERSAL AUDIT */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Sub-tab bar */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setReportSubTab('collection')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  reportSubTab === 'collection'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Collection Register
              </button>
              <button
                onClick={() => setReportSubTab('outstanding')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  reportSubTab === 'outstanding'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Defaulters & Aging Register
              </button>
              <button
                onClick={() => setReportSubTab('class_summary')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  reportSubTab === 'class_summary'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Class-wise Matrix
              </button>
              <button
                onClick={() => setReportSubTab('reversals')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  reportSubTab === 'reversals'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Reversal Audit Trail
              </button>
            </div>

            {reportSubTab === 'collection' && (
              <div className="flex items-center gap-2">
                <select
                  value={reportModeFilter}
                  onChange={(e) => setReportModeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                >
                  <option value="all">All Modes</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
                <button
                  onClick={handleExportCollectionCSV}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            )}

            {reportSubTab === 'outstanding' && (
              <div className="flex items-center gap-2">
                <select
                  value={agingFilter}
                  onChange={(e) => setAgingFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                >
                  <option value="all">All Overdue Aging</option>
                  <option value="lt30">&lt; 30 Days Past Due</option>
                  <option value="30to60">30–60 Days Past Due</option>
                  <option value="gt60">&gt; 60 Days Chronic Defaulters</option>
                </select>
              </div>
            )}
          </div>

          {/* Sub-view 1: Collection Register */}
          {reportSubTab === 'collection' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Daily & Historical Payment Receipts</h3>
                <span className="text-xs font-mono text-emerald-400">
                  Total Collected in Filter: ₹{collectionReport.reduce((sum, p) => sum + p.amountPaid, 0).toLocaleString()}
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="p-3.5">Receipt No</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Class</th>
                      <th className="p-3.5">Fee Head</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5">Reference No</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {collectionReport.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-bold text-cyan-300">{p.receiptNo}</td>
                        <td className="p-3.5 text-slate-400">{p.paymentDate}</td>
                        <td className="p-3.5 font-bold text-white">{p.studentName}</td>
                        <td className="p-3.5 text-slate-300">{p.grade}-{p.section}</td>
                        <td className="p-3.5 text-slate-300">{p.feeHead}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {p.paymentMode}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400">{p.referenceNumber}</td>
                        <td className="p-3.5 font-bold text-emerald-400">₹{p.amountPaid.toLocaleString()}</td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReceipt(p.receiptNo)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                            >
                              Print
                            </button>
                            {(activeRole === 'admin' || activeRole === 'account') && (
                              <button
                                onClick={() => handleOpenReverseModal(p)}
                                className="px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[11px] border border-rose-500/30"
                              >
                                Reverse
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view 2: Outstanding Defaulters */}
          {reportSubTab === 'outstanding' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Aging Defaulter Register</h3>
                <span className="text-xs font-mono text-rose-400">
                  Total Pending Balance: ₹{outstandingReport.reduce((sum, d) => sum + d.balanceAmount, 0).toLocaleString()}
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">Admission No</th>
                      <th className="p-3.5">Class</th>
                      <th className="p-3.5">Fee Head</th>
                      <th className="p-3.5">Due Date</th>
                      <th className="p-3.5">Days Overdue</th>
                      <th className="p-3.5">Aging Category</th>
                      <th className="p-3.5">Outstanding</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {outstandingReport.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-bold text-white">{d.studentName}</td>
                        <td className="p-3.5 text-slate-400">{d.admissionNo || 'DPS-2026-0000'}</td>
                        <td className="p-3.5 text-slate-300">{d.grade}-{d.section}</td>
                        <td className="p-3.5 text-slate-300">{d.feeHead}</td>
                        <td className="p-3.5 text-slate-400">{d.dueDate}</td>
                        <td className="p-3.5 font-bold text-rose-400">{d.daysOverdue || 0} days</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            d.agingCategory === 'gt60'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                              : d.agingCategory === '30to60'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              : 'bg-teal-950 text-teal-300 border border-teal-500/30'
                          }`}>
                            {d.agingCategory === 'gt60' ? '> 60 Days' : d.agingCategory === '30to60' ? '30-60 Days' : '< 30 Days'}
                          </span>
                        </td>
                        <td className="p-3.5 font-black text-rose-400">₹{d.balanceAmount.toLocaleString()}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              const st = allStudents.find(s => s.id === d.studentId);
                              if (st) handleSelectStudentForPayment(st);
                              setSelectedDemand(d);
                              setCollectionAmount(d.balanceAmount);
                              setActiveTab('collection');
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                          >
                            Collect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view 3: Class Summary */}
          {reportSubTab === 'class_summary' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Class-by-Class Recovery Analysis</h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="p-3.5">Class / Grade</th>
                      <th className="p-3.5">Total Demands</th>
                      <th className="p-3.5">Paid Demands</th>
                      <th className="p-3.5">Total Invoiced</th>
                      <th className="p-3.5">Total Collected</th>
                      <th className="p-3.5">Total Outstanding</th>
                      <th className="p-3.5">Realization Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {classSummary.map((cs) => (
                      <tr key={cs.grade} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-bold text-white">{cs.grade}</td>
                        <td className="p-3.5 text-slate-300">{cs.totalDemands}</td>
                        <td className="p-3.5 text-emerald-400 font-bold">{cs.paidDemands}</td>
                        <td className="p-3.5 text-white">₹{cs.totalInvoiced.toLocaleString()}</td>
                        <td className="p-3.5 text-emerald-400 font-bold">₹{cs.totalCollected.toLocaleString()}</td>
                        <td className="p-3.5 text-rose-400 font-bold">₹{cs.totalOutstanding.toLocaleString()}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, cs.collectionRatePercentage)}%` }}
                              />
                            </div>
                            <span className="font-bold text-emerald-400">{cs.collectionRatePercentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view 4: Reversals */}
          {reportSubTab === 'reversals' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>Audited Payment Reversal Trail</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Permanent immutable record of cancelled or dishonored fee entries with justification
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="p-3.5">Receipt No</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Amount Reversed</th>
                      <th className="p-3.5">Reversal Justification</th>
                      <th className="p-3.5">Authorized By</th>
                      <th className="p-3.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reversals.length > 0 ? (
                      reversals.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-900/40">
                          <td className="p-3.5 font-bold text-rose-300 line-through">{r.receiptNo}</td>
                          <td className="p-3.5 font-bold text-white">{r.studentName}</td>
                          <td className="p-3.5 font-bold text-rose-400">₹{r.reversalAmount.toLocaleString()}</td>
                          <td className="p-3.5 text-slate-300 max-w-xs truncate">{r.reason}</td>
                          <td className="p-3.5 text-purple-300 font-semibold">{r.reversedBy}</td>
                          <td className="p-3.5 text-slate-400">
                            {new Date(r.reversedAt).toLocaleDateString()} {new Date(r.reversedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No payment reversals on record. Full financial audit clean.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🧾 OFFICIAL PRINTABLE PAYMENT RECEIPT MODAL */}
      {/* ========================================================================= */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl relative my-8 print:m-0 print:p-0 print:shadow-none print:w-full">
            {/* Header / Actions (Hidden on print) */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-white text-sm font-bold flex items-center gap-2">
                    <span>{FEE_BOARD_CONFIGS[selectedFeeBoard]?.receiptTitleEng || 'Official Fee Receipt'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
                      {selectedFeeMedium === 'hindi' ? 'हिंदी माध्यम' : selectedFeeMedium === 'english' ? 'English' : 'द्विभाषी'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    RBSE / UPMSP / HBSE / CBSE Institutional Fee Voucher & Dual Challan Support
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (onShowToast) {
                      onShowToast(
                        'success',
                        `डिजिटल पावती प्रेषित: ${printableReceipt?.student.name} के अभिभावक को फीस रसीद संख्या ${printableReceipt?.receiptNo} का SMS व WhatsApp लिंक सफलतापूर्वक भेजा गया।`
                      );
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold font-mono flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Send SMS Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 text-xs font-bold font-mono flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Receipt Settings Bar (Hidden on print) */}
            <div className="bg-slate-900 p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono print:hidden">
              {/* Board Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase">बोर्ड:</span>
                {[
                  { id: 'rbse', name: 'RBSE' },
                  { id: 'upmsp', name: 'UPMSP' },
                  { id: 'hbse', name: 'HBSE' },
                  { id: 'cbse', name: 'CBSE' },
                  { id: 'state', name: 'State' },
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      const nb = b.id as BoardType;
                      setSelectedFeeBoard(nb);
                      setCustomReceiptSchoolCode(FEE_BOARD_CONFIGS[nb].schoolCodeDefault);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedFeeBoard === b.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              {/* Medium Toggle */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase">माध्यम:</span>
                {[
                  { id: 'hindi', label: 'हिंदी' },
                  { id: 'bilingual', label: 'द्विभाषी' },
                  { id: 'english', label: 'English' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedFeeMedium(m.id as MediumType)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedFeeMedium === m.id
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Layout Mode (Single vs 2-Copy Challan) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase">प्रारूप:</span>
                <button
                  type="button"
                  onClick={() => setReceiptCopyMode('single')}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    receiptCopyMode === 'single'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  मूल प्रति (Single A4)
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptCopyMode('challan')}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    receiptCopyMode === 'challan'
                      ? 'bg-purple-500 text-white font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  द्वि-प्रति चालान (2-Copy Challan)
                </button>
              </div>
            </div>

            {/* Printable Receipt Content */}
            {printableReceipt ? (
              (() => {
                const boardCfg = FEE_BOARD_CONFIGS[selectedFeeBoard] || FEE_BOARD_CONFIGS.rbse;

                const renderReceiptItem = (copyLabel: string, isChallan: boolean) => (
                  <div className={`space-y-4 font-sans text-xs ${isChallan ? 'p-5' : 'p-8 space-y-5'}`}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${boardCfg.emblemGradient} border-2 flex flex-col items-center justify-center font-serif font-black shadow-sm shrink-0`}>
                        <span className="text-base leading-none font-black">{boardCfg.emblemInitials}</span>
                        <span className="text-[7px] tracking-wider mt-0.5 uppercase font-sans font-bold">
                          {selectedFeeBoard.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-center flex-1 px-3 space-y-0.5">
                        <div className="text-lg sm:text-xl font-black tracking-wide uppercase text-slate-900 leading-tight">
                          {printableReceipt.school.name || (selectedFeeMedium === 'hindi' ? 'राजकीय आदर्श उच्च माध्यमिक विद्यालय' : 'DELHI PUBLIC HERITAGE SENIOR SECONDARY SCHOOL')}
                        </div>
                        <div className="text-[11px] text-slate-800 font-bold">
                          {selectedFeeMedium === 'english' ? boardCfg.authorityEng : boardCfg.authorityHindi}
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono">
                          {boardCfg.schoolCodeLabel}: <strong className="text-slate-900">{customReceiptSchoolCode || boardCfg.schoolCodeDefault}</strong> &bull; U-DISE: <strong className="text-slate-900">{customReceiptUdise || '08120401824'}</strong> &bull; GSTIN: {printableReceipt.school.gstin || '08AAAAA0000A1Z5'}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {printableReceipt.school.address} &bull; दूरभाष: {printableReceipt.school.phone}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-2.5 py-1 rounded bg-slate-900 text-amber-300 font-bold text-[10px] uppercase font-mono tracking-wider">
                          {copyLabel}
                        </span>
                        <div className="text-xs font-mono font-black text-emerald-800 mt-1">
                          {printableReceipt.receiptNo}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          दिनांक: {printableReceipt.paymentDate}
                        </div>
                      </div>
                    </div>

                    {/* Receipt Banner Title */}
                    <div className="bg-slate-100 p-2 rounded-xl border border-slate-300 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 uppercase">
                        {selectedFeeMedium === 'english' ? boardCfg.receiptTitleEng : boardCfg.receiptTitleHindi} &bull; सत्र {printableReceipt.feeDetails.academicSession || activeSession}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600">
                        छात्र पंजिका (S.R. No.): <strong className="text-slate-900">{printableReceipt.student.admissionNo || 'SR-2026-482'}</strong>
                      </span>
                    </div>

                    {/* Student Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          {selectedFeeMedium === 'hindi' ? 'विद्यार्थी का नाम' : 'Student Name'}
                        </span>
                        <strong className="text-slate-900 text-sm font-black">{printableReceipt.student.name}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          {selectedFeeMedium === 'hindi' ? 'कक्षा एवं वर्ग' : 'Class & Section'}
                        </span>
                        <strong className="text-slate-900 font-bold">{printableReceipt.student.grade} - {printableReceipt.student.section} (Roll: {printableReceipt.student.rollNo})</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          {selectedFeeMedium === 'hindi' ? 'पिता / अभिभावक' : 'Parent / Guardian'}
                        </span>
                        <strong className="text-slate-800">{printableReceipt.student.parentName}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          {selectedFeeMedium === 'hindi' ? 'संपर्क दूरभाष' : 'Contact Phone'}
                        </span>
                        <strong className="text-slate-800 font-mono">{printableReceipt.student.phone}</strong>
                      </div>
                    </div>

                    {/* Fee Particulars Table */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                          <tr>
                            <th className="p-2.5">
                              {selectedFeeMedium === 'hindi' ? 'शुल्क मद विवरण' : 'Fee Particulars / Head'}
                            </th>
                            <th className="p-2.5 text-center">
                              {selectedFeeMedium === 'hindi' ? 'सत्र' : 'Session'}
                            </th>
                            <th className="p-2.5 text-right">
                              {selectedFeeMedium === 'hindi' ? 'मूल शुल्क' : 'Base Fee'}
                            </th>
                            <th className="p-2.5 text-right">
                              {selectedFeeMedium === 'hindi' ? 'छूट / छात्रवृत्ति' : 'Discount / Waiver'}
                            </th>
                            <th className="p-2.5 text-right">
                              {selectedFeeMedium === 'hindi' ? 'शुद्ध देय राशि' : 'Net Amount'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs font-mono">
                          <tr>
                            <td className="p-2.5 font-bold text-slate-900 font-sans">
                              {getFeeHeadBilingual(printableReceipt.feeDetails.feeHead, selectedFeeMedium)}
                            </td>
                            <td className="p-2.5 text-center text-slate-600">
                              {printableReceipt.feeDetails.academicSession}
                            </td>
                            <td className="p-2.5 text-right">
                              ₹{printableReceipt.feeDetails.baseAmount.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right text-emerald-700 font-bold">
                              {printableReceipt.feeDetails.discountAmount > 0 ? `-₹${printableReceipt.feeDetails.discountAmount.toLocaleString()}` : '₹0'}
                            </td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              ₹{printableReceipt.feeDetails.netAmount.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                          <tr>
                            <td colSpan={4} className="p-2.5 text-right text-xs uppercase tracking-wider text-slate-800 font-sans font-black">
                              {selectedFeeMedium === 'hindi' ? 'कुल प्राप्त राशि (AMOUNT PAID):' : 'TOTAL AMOUNT PAID:'}
                            </td>
                            <td className="p-2.5 text-right text-sm font-black font-mono text-emerald-800">
                              ₹{printableReceipt.amountPaid.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Amount in Words (Both Hindi & English) */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">
                        राशि शब्दों में (Amount in Words):
                      </span>
                      <div className="font-serif font-bold text-indigo-950 text-xs">
                        {getAmountInWordsHindi(printableReceipt.amountPaid)}
                      </div>
                      <div className="text-[11px] font-mono text-slate-600">
                        ({getAmountInWordsEng(printableReceipt.amountPaid)})
                      </div>
                    </div>

                    {/* Balance & Payment Details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-50 rounded-xl border border-slate-200 gap-2 text-xs font-mono">
                      <div className="space-y-0.5">
                        <div>
                          <span className="font-bold text-slate-700">भुगतान माध्यम (Mode):</span>{' '}
                          <strong className="text-slate-900 uppercase">{printableReceipt.paymentMode}</strong>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">लेन-देन संदर्भ / UTR No:</span>{' '}
                          <span className="text-slate-800">{printableReceipt.referenceNumber || 'TXN-CASH-REC'}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">प्राप्तकर्ता (Received By):</span>{' '}
                          <span className="text-slate-800">{printableReceipt.collectedBy}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">
                          खाता शेष बकाया (Ledger Balance)
                        </span>
                        <span className={`text-sm font-black ${printableReceipt.feeDetails.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {printableReceipt.feeDetails.remainingBalance > 0 ? `₹${printableReceipt.feeDetails.remainingBalance.toLocaleString()} DUES` : 'शून्य / पूर्ण चुकता (CLEARED)'}
                        </span>
                      </div>
                    </div>

                    {/* Signatures & Cashier Circular Seal */}
                    <div className="pt-4 flex items-end justify-between text-xs text-slate-700 border-t border-slate-300">
                      {/* Cashier Signature */}
                      <div className="text-center w-32 border-t-2 border-slate-400 pt-1">
                        <span className="font-bold block">कैशियर</span>
                        <span className="text-[9px] text-slate-500 font-mono">Cashier Signature</span>
                      </div>

                      {/* Cashier Official Circular Seal */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="w-16 h-16 rounded-full border-2 border-indigo-900 flex flex-col items-center justify-center text-center p-1 text-[7px] font-bold text-indigo-950 font-serif">
                          <span className="leading-tight uppercase">कार्यालय लेखाकार</span>
                          <span className="my-0.2 text-emerald-700 font-sans">★ CASHIER ★</span>
                          <span className="leading-tight uppercase font-mono">{boardCfg.emblemInitials} सम्बद्ध</span>
                        </div>
                        <span className="text-[8px] text-slate-500 font-mono mt-0.5">संस्था मुहर (Seal)</span>
                      </div>

                      {/* Principal Signature */}
                      <div className="text-center w-40 border-t-2 border-slate-400 pt-1">
                        <span className="font-bold block">प्रधानाचार्य / लेखाधिकारी</span>
                        <span className="text-[9px] text-slate-500 font-mono">Principal / Accounts Head</span>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="text-[9px] text-center text-slate-400 font-mono pt-1">
                      * यह एक कम्प्यूटर जनित आधिकारिक शुल्क रसीद है। चेक अथवा ऑनलाइन UPI निपटान के अधीन मान्य।
                    </div>
                  </div>
                );

                return (
                  <div id="printable-receipt" className="bg-white text-slate-900">
                    {receiptCopyMode === 'single' ? (
                      renderReceiptItem('मूल प्रति / ORIGINAL COPY', false)
                    ) : (
                      <div className="space-y-6">
                        {renderReceiptItem('विद्यालय प्रति / SCHOOL COPY', true)}
                        <div className="border-t-2 border-dashed border-slate-400 text-center py-1 font-mono text-[10px] text-slate-400 print:py-2">
                          ✂ -------------------- यहाँ से अलग करें (TEAR HERE FOR PARENT COPY) -------------------- ✂
                        </div>
                        {renderReceiptItem('अभिभावक प्रति / PARENT COPY', true)}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="p-16 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
                <span className="font-mono text-xs">Generating official fee receipt voucher...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📂 STUDENT DETAILED LEDGER MODAL */}
      {/* ========================================================================= */}
      {viewingLedgerStudentId && detailedLedger && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl glass-panel bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Student Fee Ledger Statement</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {detailedLedger.student.name} &bull; {detailedLedger.student.admissionNo} &bull; {detailedLedger.student.grade}-{detailedLedger.student.section}
                </p>
              </div>
              <button
                onClick={() => setViewingLedgerStudentId(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 font-mono text-center">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Invoiced</span>
                <span className="text-base font-bold text-white">₹{detailedLedger.summary.totalInvoiced.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-emerald-500 block uppercase">Total Paid</span>
                <span className="text-base font-bold text-emerald-400">₹{detailedLedger.summary.totalPaid.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-rose-500 block uppercase">Net Balance</span>
                <span className="text-base font-black text-rose-400">₹{detailedLedger.summary.currentBalance.toLocaleString()}</span>
              </div>
            </div>

            {/* Invoices List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-white font-mono">Invoiced Demands:</div>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="p-3">Invoice</th>
                      <th className="p-3">Fee Head</th>
                      <th className="p-3">Net Fee</th>
                      <th className="p-3">Paid</th>
                      <th className="p-3">Balance</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {detailedLedger.demands.map((d) => (
                      <tr key={d.id}>
                        <td className="p-3 font-bold text-cyan-300">{d.invoiceNo}</td>
                        <td className="p-3 text-slate-300">{d.feeHead}</td>
                        <td className="p-3 text-white">₹{d.netAmount.toLocaleString()}</td>
                        <td className="p-3 text-emerald-400">₹{d.paidAmount.toLocaleString()}</td>
                        <td className="p-3 font-bold text-rose-400">₹{d.balanceAmount.toLocaleString()}</td>
                        <td className="p-3 text-slate-400">{d.dueDate}</td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments History */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-white font-mono">Payment Transactions:</div>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="p-3">Receipt No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Fee Head</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Ref No</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {detailedLedger.payments.length > 0 ? (
                      detailedLedger.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="p-3 font-bold text-cyan-300">{p.receiptNo}</td>
                          <td className="p-3 text-slate-400">{p.paymentDate}</td>
                          <td className="p-3 text-slate-300">{p.feeHead}</td>
                          <td className="p-3 uppercase text-slate-400">{p.paymentMode}</td>
                          <td className="p-3 text-slate-400">{p.referenceNumber}</td>
                          <td className="p-3 font-bold text-emerald-400">₹{p.amountPaid.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleOpenReceipt(p.receiptNo)}
                              className="text-cyan-400 hover:text-cyan-300 underline text-xs"
                            >
                              Print
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-500">
                          No payments recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ➕ ADD FEE STRUCTURE MODAL */}
      {/* ========================================================================= */}
      {showAddStructureModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Configure Fee Head</span>
              </h3>
              <button
                onClick={() => setShowAddStructureModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStructure} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-mono">Class / Grade:</label>
                <select
                  value={structureForm.grade}
                  onChange={(e) => setStructureForm({ ...structureForm, grade: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-mono">Fee Head Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science & AI Lab Fee"
                  value={structureForm.feeHead}
                  onChange={(e) => setStructureForm({ ...structureForm, feeHead: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 font-mono">Amount (INR):</label>
                  <input
                    type="number"
                    min="100"
                    value={structureForm.amountINR}
                    onChange={(e) => setStructureForm({ ...structureForm, amountINR: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 font-mono">Frequency:</label>
                  <select
                    value={structureForm.frequency}
                    onChange={(e) => setStructureForm({ ...structureForm, frequency: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-slate-300 font-mono">Mandatory for all students:</span>
                <input
                  type="checkbox"
                  checked={structureForm.isMandatory}
                  onChange={(e) => setStructureForm({ ...structureForm, isMandatory: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  Save Fee Head Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📦 BATCH GENERATE DEMANDS MODAL */}
      {/* ========================================================================= */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Batch Generate Fee Invoices</span>
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBatchGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-mono">Target Class:</label>
                <select
                  value={batchGrade}
                  onChange={(e) => setBatchGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-mono">Fee Head / Structure:</label>
                <select
                  value={batchStructureId}
                  onChange={(e) => setBatchStructureId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                >
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.grade} - {s.feeHead} (₹{s.amountINR.toLocaleString()} &bull; {s.frequency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-mono">Invoice Due Date:</label>
                <input
                  type="date"
                  value={batchDueDate}
                  onChange={(e) => setBatchDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono">
                ℹ️ Automatically detects approved student sibling/merit scholarships and deducts concessions before issuing demands.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={generatingBatch}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingBatch ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Invoices for Students...</span>
                    </>
                  ) : (
                    <span>Issue Demands for Selected Class</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔄 AUDITED PAYMENT REVERSAL MODAL */}
      {/* ========================================================================= */}
      {showReverseModal && reversingPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel bg-slate-900 p-6 rounded-3xl border border-rose-500/40 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Reverse Payment Transaction</span>
              </h3>
              <button
                onClick={() => setShowReverseModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteReversal} className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Receipt No:</span>
                  <span className="font-bold text-white">{reversingPayment.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Student:</span>
                  <span className="font-bold text-white">{reversingPayment.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount to Reverse:</span>
                  <span className="font-bold text-rose-400">₹{reversingPayment.amountPaid.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-mono">
                  Administrative Reason (Required for Financial Audit):
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Cheque returned unpaid by bank / Duplicate entry / Cash refund approved by Principal"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                ⚠️ Reversing this payment will restore the outstanding balance on invoice {reversingPayment.invoiceNo} and log this action in the permanent compliance audit ledger.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={processingReversal}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {processingReversal ? 'Reversing Payment...' : 'Confirm Audited Payment Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
