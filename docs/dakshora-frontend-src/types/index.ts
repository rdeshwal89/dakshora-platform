export type ClientSurface = 'public_website' | 'admin_panel' | 'customer_dashboard' | 'school_erp' | 'school_saas' | 'parent_portal' | 'school_onboarding' | 'school_app';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: any;
  token?: string;
  users?: any[];
  organizations?: OrganizationRecord[];
  organization?: OrganizationRecord;
  websites?: WebsiteRecord[];
  website?: WebsiteRecord;
  templates?: TemplateRecord[];
  leads?: LeadRecord[];
  lead?: LeadRecord;
  media?: MediaRecord[];
  metrics?: AnalyticsMetrics;
  plans?: BillingPlan[];
  invoices?: InvoiceRecord[];
  logs?: AuditLogRecord[];
  persona?: string;
  error?: string;
  [key: string]: any;
}

export interface UserRecord {
  id?: string | number;
  name: string;
  email: string;
  created_at?: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  plan?: string;
  status?: string;
  created_at?: string;
}

export interface WebsiteRecord {
  id: string;
  name: string;
  domain?: string;
  template?: string;
  status?: string;
  organization_id?: string;
  created_at?: string;
}

export interface TemplateRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  pages: string[];
}

export interface LeadRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: 'website' | 'mobile_app' | 'direct';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'archived';
  notes?: string;
  organization_id?: string;
  created_at?: string;
}

export interface MediaRecord {
  id: string;
  filename: string;
  url: string;
  size_bytes: number;
  mime_type: string;
  created_at: string;
}

export interface AnalyticsMetrics {
  totalPageViews: number;
  activeOrganizations: number;
  totalLeadsCaptured: number;
  conversionRatePercent: number;
  aiConversationsCount: number;
  monthlyRecurringRevenueINR: number;
}

export interface BillingPlanLimits {
  max_students: number | null;
  max_staff: number | null;
  max_campuses: number | null;
  max_ai_requests: number | null;
  max_communication_messages: number | null;
  max_storage_gb: number;
}

export interface BillingPlan {
  id: string;
  code?: string;
  name: string;
  priceINR: number;
  interval: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
  features: string[];
  modules?: string[];
  limits?: BillingPlanLimits;
}

export interface SaasPlan extends BillingPlan {}

export interface SaasSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  plan?: string;
  planCode?: string;
  status: 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';
  billing_interval: string;
  amountINR: number;
  currency: string;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  planDetails?: BillingPlan;
}

export interface ResourceUsageMetric {
  current: number;
  limit: number | null;
  percentage: number;
  unlimited: boolean;
}

export interface SaasUsageMetrics {
  organizationId: string;
  planId: string;
  planName: string;
  status: string;
  renewalDate: string;
  usage: {
    students: ResourceUsageMetric;
    staff: ResourceUsageMetric;
    campuses: ResourceUsageMetric;
    aiRequests: ResourceUsageMetric;
    communications: ResourceUsageMetric;
    storageGb: ResourceUsageMetric;
  };
}

export interface SaasEntitlementOverride {
  id: string;
  organization_id: string;
  feature_key: string;
  override_type: 'limit' | 'feature';
  value: any;
  reason?: string;
  created_by?: string;
  created_at: string;
}

export interface SaasEntitlements {
  organizationId: string;
  subscriptionId: string;
  planId: string;
  planName: string;
  status: string;
  isRestricted: boolean;
  renewalDate: string;
  billingInterval: string;
  modules: string[];
  features: string[];
  limits: BillingPlanLimits;
  overrides: SaasEntitlementOverride[];
}

export interface InvoiceRecord {
  id: string;
  organization_id?: string;
  orgName: string;
  subscription_id?: string;
  invoiceNumber?: string;
  plan: string;
  planId?: string;
  amountINR: number;
  subtotalINR?: number;
  taxGstINR?: number;
  currency?: string;
  status: string;
  billingPeriod?: string;
  periodStart?: string;
  periodEnd?: string;
  issueDate?: string;
  dueDate?: string;
  paidDate?: string;
  date: string;
  receiptUrl?: string;
}

export interface AuditLogRecord {
  id: string;
  user_email: string;
  action: string;
  target_type: string;
  ip_address: string;
  timestamp: string;
}

export interface HealthState {
  backend: {
    status: 'online' | 'offline' | 'checking';
    message: string;
    latencyMs: number | null;
    lastChecked: string | null;
  };
  supabase: {
    status: 'connected' | 'error' | 'checking' | 'unknown';
    message: string;
    errorDetails?: string;
    lastChecked: string | null;
  };
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  status: number;
  durationMs: number;
  response: any;
  isError: boolean;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

// =========================================================================
// 🏫 DAKSHORA 2.0 - SCHOOL ERP ARCHITECTURE TYPES
// =========================================================================

export type ErpRole = 'admin' | 'teacher' | 'account' | 'reception' | 'parent' | 'student';

export type ErpModule =
  | 'dashboard'
  | 'journal'
  | 'students'
  | 'staff'
  | 'attendance'
  | 'academics'
  | 'exams'
  | 'fees'
  | 'admissions'
  | 'communication'
  | 'transport'
  | 'library'
  | 'payroll'
  | 'reports'
  | 'ai'
  | 'settings'
  | 'timetable'
  | 'portal'
  | 'robotics';

export interface TeachingJournalEntry {
  id: string;
  organization_id?: string;
  staff_id?: string;
  staff_name?: string;
  date: string;
  grade: string;
  section: string;
  subject: string;
  period: number;
  period_time?: string;
  topic: string;
  learning_objectives?: string;
  what_taught?: string;
  student_response?: string;
  homework?: string;
  doubts?: string;
  topics_pending?: string;
  next_lesson?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AiTeacherGenerateRequest {
  mode: 'lesson_plan' | 'mcqs' | 'worksheet' | 'bilingual_hindi' | 'differentiated';
  grade?: string;
  subject?: string;
  topic: string;
}

export interface AiTeacherGenerateResponse {
  success: boolean;
  title: string;
  content: string;
  aiPowered?: boolean;
  model?: string;
}

export interface AiQuestionPaperQuestion {
  questionNumber: number;
  question: string;
  marks: number;
  options?: string[];
  hasInternalChoice?: boolean;
  orQuestion?: string;
  caseStudyText?: string;
  subQuestions?: Array<{ number: string; question: string; marks: number }>;
  pyqTag?: string;
}

export interface AiQuestionPaperSection {
  sectionName: string;
  description: string;
  marksPerQuestion: number;
  questions: AiQuestionPaperQuestion[];
}

export interface AiQuestionPaperMarkingItem {
  questionNumber: number;
  answer: string;
  stepMarks?: string[];
}

export interface AiQuestionPaperBlueprintItem {
  chapter: string;
  mcq: number;
  vsa: number;
  sa: number;
  la: number;
  caseBased: number;
  totalMarks: number;
}

export interface AiQuestionPaperData {
  schoolName: string;
  examTitle: string;
  grade: string;
  subject: string;
  board: string;
  timeAllowed: string;
  maxMarks: number;
  generalInstructions: string[];
  sections: AiQuestionPaperSection[];
  markingScheme: AiQuestionPaperMarkingItem[];
  blueprint: AiQuestionPaperBlueprintItem[];
}

export interface AiQuestionPaperRequest {
  board?: string;
  grade?: string;
  subject?: string;
  chapters?: string[];
  examType?: 'term_exam' | 'unit_test' | 'pre_board';
  difficulty?: 'standard' | 'foundation' | 'advanced';
  languageMedium?: 'bilingual' | 'english' | 'hindi';
  totalMarks?: number;
  timeAllowed?: string;
  schoolName?: string;
  pyqMode?: boolean;
  highYieldOnly?: boolean;
  boardExamPredictor?: boolean;
}

export interface AiQuestionPaperResponse {
  success: boolean;
  aiPowered?: boolean;
  model?: string;
  message?: string;
  paper: AiQuestionPaperData;
}

// =========================================================================
// 📝 PHASE 2: NEP 2020 SMART LESSON PLANNER TYPES
// =========================================================================

export interface AiLessonPlanPeriod {
  periodNumber: number;
  title: string;
  learningOutcome: string;
  hookActivity: string;
  directInstruction: string;
  guidedPractice: string;
  exitTicket: string;
  homework: string;
}

export interface AiLessonPlanData {
  schoolName: string;
  grade: string;
  subject: string;
  chapterTitle: string;
  allocatedPeriods: number;
  durationPerPeriod: string;
  curriculumStandard: string;
  bloomsObjectives: {
    remember: string;
    understand: string;
    apply: string;
    analyze: string;
  };
  periodBreakup: AiLessonPlanPeriod[];
  blackboardLayout: {
    leftColumn: string;
    centerColumn: string;
    rightColumn: string;
  };
  differentiatedSupport: {
    remedial: string;
    advancedHots: string;
  };
  practicalLabActivity?: string;
  lifeSkillsIntegration?: string;
}

export interface AiLessonPlanRequest {
  board?: string;
  grade?: string;
  subject?: string;
  chapter?: string;
  periodsCount?: number;
  durationPerPeriod?: string;
  languageMedium?: 'bilingual' | 'english' | 'hindi';
  learningStyle?: 'nep2020' | 'activity_based' | 'inquiry_driven';
  schoolName?: string;
}

export interface AiLessonPlanResponse {
  success: boolean;
  aiPowered?: boolean;
  model?: string;
  message?: string;
  lessonPlan: AiLessonPlanData;
}

// =========================================================================
// 📽️ PHASE 3: AI SMART BOARD PPT & PRESENTATION TYPES
// =========================================================================

export type QuestionBoardType = 'cbse' | 'rbse' | 'upmsp' | 'hbse' | 'state_board';

export interface PresentationQuizItem {
  q?: string;
  question?: string;
  options: string[];
  ans?: string;
  correctAnswer?: string;
  explanation?: string;
}

export interface PresentationSlide {
  slideNumber: number;
  slideType: 'title' | 'hook' | 'concept' | 'diagram' | 'application' | 'real_world' | 'mistakes' | 'quiz' | 'summary' | string;
  title: string;
  subtitle?: string;
  bulletPoints?: string[];
  visualDescription?: string;
  visualPrompt?: string;
  speakerNotes?: string;
  teacherNote?: string;
  keyTakeaway?: string;
  formulaBox?: string;
  formulaOrCode?: string;
  quiz?: PresentationQuizItem[];
  quizQuestions?: PresentationQuizItem[];
}

export interface AiPresentationData {
  schoolName: string;
  presentationTitle?: string;
  board?: string;
  grade: string;
  subject: string;
  topic?: string;
  targetAudience?: string;
  languageMedium?: 'bilingual' | 'english' | 'hindi';
  slideCount?: number;
  totalSlides?: number;
  estimatedDuration?: string;
  slides: PresentationSlide[];
}

export interface AiPresentationRequest {
  board?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  targetAudience?: string;
  slideCount?: number;
  languageMedium?: 'bilingual' | 'english' | 'hindi';
  schoolName?: string;
}

export interface AiPresentationResponse {
  success: boolean;
  aiPowered?: boolean;
  model?: string;
  message?: string;
  presentation: AiPresentationData;
}

export interface ErpStudentDocument {
  id: string;
  name: string;
  type: string;
  verified: boolean;
  uploadedAt: string;
  fileSize?: string;
  url?: string;
  category?: 'aadhaar' | 'birth_cert' | 'transfer_cert' | 'marksheet' | 'caste_cert' | 'rte_proof' | 'other';
  documentNumber?: string;
}

export interface ErpStudentRecord {
  id: string;
  admissionNo?: string;
  penNo?: string;
  rollNo: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name: string;
  grade: string;
  section: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  avatarUrl?: string;
  admissionDate?: string;
  academicSession?: string;
  status: 'active' | 'inactive' | 'suspended' | 'alumni' | 'withdrawn';
  phone?: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  pinCode?: string;
  parentName: string;
  parentRelation?: string;
  parentPhone: string;
  parentAltPhone?: string;
  parentEmail: string;
  parentOccupation?: string;
  parentAddress?: string;
  motherName?: string;
  category?: string;
  religion?: string;
  tcIssued?: boolean;
  tcNumber?: string;
  tcIssueDate?: string;
  tcReason?: string;
  transportRoute?: string;
  documents?: ErpStudentDocument[];
  attendancePercent: number;
  duesINR: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentSummaryKPIs {
  total: number;
  active: number;
  newAdmissions: number;
  male: number;
  female: number;
  totalDuesINR: number;
}

export interface StudentListResponse {
  success: boolean;
  students: ErpStudentRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: StudentSummaryKPIs;
}

export interface ErpStudentProfile {
  success: boolean;
  student: ErpStudentRecord;
  academic: {
    grade: string;
    section: string;
    rollNo: string;
    session: string;
    admissionNo: string;
    penNo?: string;
    admissionDate?: string;
    classTeacher: string;
  };
  attendance: {
    overallPercent: number;
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    leavesApproved: number;
  };
  fees: {
    totalDue: number;
    invoices: Array<{
      id: string;
      invoiceNo: string;
      feeType: string;
      amountINR: number;
      dueDate: string;
      status: 'paid' | 'pending' | 'overdue';
      paidAt?: string;
      paymentMethod?: string;
    }>;
  };
  documents: ErpStudentDocument[];
  parents: {
    name: string;
    relation: string;
    phone: string;
    altPhone?: string;
    email: string;
    occupation?: string;
    address?: string;
  };
  activity: Array<{
    id: string;
    action: string;
    user_email: string;
    target_type?: string;
    target_id?: string;
    timestamp: string;
  }>;
}

export interface StudentImportResult {
  success: boolean;
  message?: string;
  dryRun?: boolean;
  totalRows?: number;
  validCount?: number;
  invalidCount?: number;
  importedCount?: number;
  failedCount?: number;
  preview?: ErpStudentRecord[];
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

export interface ErpStaffDocument {
  id: string;
  name: string;
  type: string;
  verified: boolean;
  uploadedAt: string;
  fileSize?: string;
  url?: string;
}

export interface TeacherAssignmentRecord {
  id: string;
  staffId: string;
  staffName?: string;
  academicSession: string;
  grade: string;
  section: string;
  subject: string;
  createdAt: string;
}

export interface ErpStaffRecord {
  id: string;
  empId: string; // Employee Code
  firstName?: string;
  lastName?: string;
  name: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  photoUrl?: string;
  role: 'teacher' | 'accountant' | 'admin' | 'librarian' | 'driver' | 'receptionist' | 'principal' | 'support' | string;
  staffType?: string; // 'Teacher' | 'Principal' | 'Vice Principal' | 'Accountant' | 'Receptionist' | 'Librarian' | 'Lab Assistant' | 'Support Staff' | 'Other'
  designation: string;
  department: string;
  employmentType?: string; // 'Full-time' | 'Part-time' | 'Contract' | 'Visiting'
  joiningDate: string;
  qualification?: string;
  experienceYears?: number;
  subjectSpecialization?: string;
  email: string;
  phone: string;
  altPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  salaryINR?: number;
  status: 'active' | 'on_leave' | 'inactive' | 'resigned';
  isActive?: boolean;
  documents?: ErpStaffDocument[];
  assignedClasses?: TeacherAssignmentRecord[];
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeachingFacultyKPI {
  total: number;
  pgt: number;
  tgt: number;
  prt: number;
  other: number;
  present: number;
  onDuty: number;
  onLeave: number;
}

export interface NonTeachingStaffKPI {
  total: number;
  admin: number;
  transport: number;
  support: number;
  present: number;
  onDuty: number;
  onLeave: number;
}

export interface LeaveBreakdownKPI {
  total: number;
  cl: number;
  el: number;
  medical: number;
  other: number;
}

export interface PayrollKPI {
  totalEnrolled: number;
  activeOnPayroll: number;
  monthlyGrossINR: number;
}

export interface StaffSummaryKPIs {
  total: number;
  active: number;
  teachers: number;
  nonTeaching: number;
  onLeaveToday: number;
  teachingBreakdown?: TeachingFacultyKPI;
  nonTeachingBreakdown?: NonTeachingStaffKPI;
  leaveBreakdown?: LeaveBreakdownKPI;
  payroll?: PayrollKPI;
}

export interface InstitutionalDutyRecord extends StaffResponsibilityRecord {
  empId?: string;
  designation?: string;
  department?: string;
  phone?: string;
  email?: string;
  photoUrl?: string | null;
}

export interface StaffListResponse {
  success: boolean;
  staff: ErpStaffRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: StaffSummaryKPIs;
}

export interface ErpStaffProfile {
  success: boolean;
  staff: ErpStaffRecord;
  assignments: TeacherAssignmentRecord[];
  attendance: {
    statusToday: 'present' | 'on_leave' | 'absent' | 'half_day';
    monthlyRate: number;
    totalWorkingDays: number;
    presentDays: number;
    leaveDays: number;
  };
  documents: ErpStaffDocument[];
  activity: Array<{
    id: string;
    action: string;
    user_email: string;
    target_type?: string;
    target_id?: string;
    timestamp: string;
  }>;
}

export interface StaffImportResult {
  success: boolean;
  message?: string;
  dryRun?: boolean;
  totalRows?: number;
  validCount?: number;
  invalidCount?: number;
  importedCount?: number;
  failedCount?: number;
  preview?: ErpStaffRecord[];
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'on_leave';

export interface ErpAttendanceRecord {
  id: string;
  studentId: string;
  student_id?: string;
  admissionNo?: string;
  rollNo?: string;
  studentName: string;
  grade: string;
  section?: string;
  date: string;
  attendanceDate?: string;
  status: AttendanceStatus;
  remarks?: string;
  marked_by?: string;
  academicSession?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentDailyAttendanceItem {
  id: string | null;
  studentId: string;
  admissionNo: string;
  rollNo: string;
  studentName: string;
  grade: string;
  section: string;
  date: string;
  status: AttendanceStatus;
  remarks: string;
  marked_by?: string | null;
}

export interface StaffDailyAttendanceItem {
  id: string | null;
  staffId: string;
  empId: string;
  name: string;
  designation: string;
  department: string;
  staffType: string;
  date: string;
  status: AttendanceStatus;
  remarks: string;
  marked_by?: string | null;
}

export interface AttendanceDashboardSummary {
  success: boolean;
  date: string;
  students: {
    total: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    leave: number;
    attendancePercent: number;
  };
  staff: {
    total: number;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    attendancePercent: number;
  };
  classStats: Array<{
    grade: string;
    section: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    leave: number;
    attendancePercent: number;
  }>;
}

export interface MonthlyAttendanceStudentRow {
  studentId: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  records: Record<number, AttendanceStatus>;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  halfDays: number;
  totalRecordedDays: number;
  attendancePercent: number;
}

export interface MonthlyAttendanceGridData {
  success: boolean;
  academicSession: string;
  grade: string;
  section: string;
  year: number;
  month: number;
  monthName: string;
  daysInMonth: number;
  students: MonthlyAttendanceStudentRow[];
}

export interface LowAttendanceReportItem {
  studentId: string;
  admissionNo: string;
  rollNo: string;
  studentName: string;
  grade: string;
  section: string;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePercent: number;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
}

export interface AttendanceSettings {
  lowAttendanceThreshold: number;
  allowFutureDates: boolean;
  defaultStatus: AttendanceStatus;
}

export interface ErpSchoolSettings {
  schoolName: string;
  affiliationNo: string;
  schoolCode: string;
  board: string;
  activeSession: string;
  sessionStartDate: string;
  sessionEndDate: string;
  principalName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  smsGatewayEnabled: boolean;
  upiQrVpa: string;
}

export interface ErpTimetablePeriod {
  periodNumber: number;
  timeSlot: string;
  subject: string;
  teacher: string;
  room: string;
}

export interface ErpClassRecord {
  id: string;
  grade: string;
  section: string;
  classTeacher: string;
  roomNumber: string;
  totalStudents: number;
  subjects: string[];
  timetable: {
    day: string;
    periods: ErpTimetablePeriod[];
  }[];
}

export interface ErpExamRecord {
  id: string;
  title: string;
  grade: string;
  term: 'Term 1' | 'Term 2' | 'Unit Test 1' | 'Unit Test 2' | 'Pre-Board';
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'ongoing' | 'published';
  marks: {
    studentId: string;
    studentName: string;
    subjects: {
      subject: string;
      maxMarks: number;
      obtainedMarks: number;
    }[];
    percentage: number;
    gradeResult: string;
  }[];
}

export interface ErpFeeInvoiceRecord {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  grade: string;
  feeType: 'Tuition Fee' | 'Transport Fee' | 'Lab & Sports' | 'Annual Development' | string;
  amountINR: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'partially_paid' | 'cancelled';
  paidAt?: string;
  paymentMethod?: 'UPI' | 'NetBanking' | 'Card' | 'Cash' | string;
  receiptNo?: string;
}

export interface ErpFeeStructure {
  id: string;
  academicSession: string;
  grade: string;
  feeHead: string;
  amountINR: number;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  dueDay: number;
  isMandatory: boolean;
  status: 'active' | 'inactive';
  organization_id?: string;
  created_at?: string;
}

export interface ErpFeeConcession {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo?: string;
  grade?: string;
  section?: string;
  concessionType: 'sibling' | 'merit_scholarship' | 'staff_child' | 'special_hardship' | 'ews_rte' | string;
  discountPercentage: number;
  discountAmountINR: number;
  reason: string;
  approvedBy: string;
  academicSession: string;
  organization_id?: string;
  created_at?: string;
}

export interface ErpFeeDemand {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  admissionNo?: string;
  grade: string;
  section: string;
  academicSession: string;
  feeStructureId?: string;
  feeHead: string;
  feeType?: string;
  baseAmount: number;
  discountAmount: number;
  fineAmount: number;
  fineWaived?: boolean;
  fineWaivedBy?: string;
  fineWaivedReason?: string;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  paidAt?: string;
  paymentMethod?: string;
  receiptNo?: string;
  amountINR?: number;
  daysOverdue?: number;
  agingCategory?: 'current' | 'lt30' | '30to60' | 'gt60';
  organization_id?: string;
  created_at?: string;
}

export interface ErpFeePayment {
  id: string;
  receiptNo: string;
  demandId: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  admissionNo?: string;
  grade: string;
  section: string;
  feeHead: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card';
  referenceNumber: string;
  collectedBy: string;
  remarks?: string;
  status: 'completed' | 'reversed';
  organization_id?: string;
  created_at?: string;
}

export interface ErpPaymentReversal {
  id: string;
  paymentId: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  reversalAmount: number;
  reason: string;
  reversedBy: string;
  reversedAt: string;
  organization_id?: string;
}

export interface ErpFeeOverviewSummary {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  todayCollected: number;
  totalDemandsCount: number;
  paidCount: number;
  partiallyPaidCount: number;
  pendingCount: number;
  overdueCount: number;
  collectionRatePercentage: number;
  modeBreakdown: {
    cash: number;
    upi: number;
    bank_transfer: number;
    cheque: number;
    card: number;
  };
  recentPayments: ErpFeePayment[];
}

export interface ErpStudentFeeAccount {
  student: ErpStudentRecord;
  demands: ErpFeeDemand[];
  payments: ErpFeePayment[];
  concessions: ErpFeeConcession[];
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    currentBalance: number;
    overdueBalance: number;
  };
}

export interface ErpPrintableReceipt {
  receiptNo: string;
  paymentDate: string;
  paymentMode: string;
  referenceNumber: string;
  collectedBy: string;
  remarks?: string;
  amountPaid: number;
  status: string;
  school: {
    name: string;
    affiliationNo: string;
    schoolCode: string;
    address: string;
    phone: string;
    email: string;
    gstin?: string;
  };
  student: {
    id: string;
    name: string;
    admissionNo: string;
    rollNo: string;
    grade: string;
    section: string;
    parentName: string;
    phone: string;
  };
  feeDetails: {
    invoiceNo: string;
    academicSession: string;
    feeHead: string;
    baseAmount: number;
    discountAmount: number;
    fineAmount: number;
    netAmount: number;
    currentPayment: number;
    totalPaidToDate: number;
    remainingBalance: number;
  };
}

export interface ErpClassFeeSummary {
  grade: string;
  totalStudents?: number;
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalDemands: number;
  paidDemands: number;
  collectionRatePercentage: number;
}

export interface ErpAdmissionDocument {
  id: string;
  admissionId: string;
  documentType: 'birth_certificate' | 'previous_marksheet' | 'transfer_certificate' | 'photograph' | 'aadhaar_card' | 'address_proof' | string;
  documentName: string;
  fileUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string | null;
  uploadedBy?: string;
  uploadedAt: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

export interface ErpAdmissionNote {
  id: string;
  admissionId: string;
  authorName: string;
  authorRole: string;
  noteType: 'internal' | 'interview' | 'verification' | 'decision';
  content: string;
  createdAt: string;
}

export interface ErpAdmissionTimelineEvent {
  id: string;
  admissionId: string;
  eventType: string;
  title: string;
  description?: string;
  actorName: string;
  createdAt: string;
}

export interface ErpAdmissionApplication {
  id: string;
  applicationNo?: string;
  inquiryNo?: string;
  academicSession?: string;
  studentName: string;
  dob?: string | null;
  gender?: string;
  parentName: string;
  parentRelation?: string;
  parentEmail?: string;
  phone: string;
  altPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  appliedGrade: string;
  previousSchool?: string;
  source?: 'website' | 'walk_in' | 'phone' | 'referral' | 'direct' | string;
  status: 'new' | 'under_review' | 'documents_pending' | 'verified' | 'interview_scheduled' | 'approved' | 'admitted' | 'rejected' | 'waitlisted' | 'cancelled' | 'inquiry' | 'form_submitted' | 'entrance_tested' | 'enrolled';
  interviewScore?: number | null;
  interviewNotes?: string;
  rejectionReason?: string | null;
  leadId?: string | null;
  studentId?: string | null;
  applicationDate: string;
  admittedAt?: string;
  notes?: string;
  documentsCount?: number;
  verifiedDocsCount?: number;
  pendingDocsCount?: number;
  created_at?: string;
  updated_at?: string;
}

// Alias to maintain 100% backward-compatibility
export type ErpAdmissionRecord = ErpAdmissionApplication;

export interface ErpAdmissionOverview {
  totalInquiries: number;
  totalApplications: number;
  newCount: number;
  underReviewCount: number;
  documentsPendingCount: number;
  verifiedCount: number;
  approvedCount: number;
  admittedCount: number;
  rejectedCount: number;
  waitlistedCount: number;
  pendingDocsCount: number;
  verifiedDocsCount: number;
  conversionRatePct: number;
  stageBreakdown: {
    new: number;
    under_review: number;
    documents_pending: number;
    verified: number;
    approved: number;
    admitted: number;
    rejected: number;
    waitlisted: number;
  };
  sourceBreakdown: {
    website: number;
    walk_in: number;
    phone: number;
    referral: number;
    direct: number;
  };
  gradeDemandBreakdown: Array<{ grade: string; count: number }>;
  recentApplications: ErpAdmissionApplication[];
}

export interface ErpDuplicateStudentMatch {
  studentId: string;
  name: string;
  admissionNo: string;
  grade: string;
  section: string;
  parentName: string;
  parentPhone: string;
  dob?: string;
  matchType: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ErpConfirmAdmissionPayload {
  grade?: string;
  section?: string;
  bloodGroup?: string;
  parentOccupation?: string;
}

export interface ErpNoticeRecord {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'academic' | 'urgent' | 'holiday' | 'exam';
  targetAudience: 'all' | 'teachers' | 'parents' | 'students';
  isUrgent: boolean;
  postedBy: string;
  postedAt: string;
  smsBroadcastSent: boolean;
}

export interface ErpTransportRoute {
  id: string;
  routeNumber: string;
  routeName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  assignedStudentsCount: number;
  currentStatus: 'on_route' | 'idle' | 'delayed';
  stops: {
    stopName: string;
    pickupTime: string;
    dropTime: string;
  }[];
}

export interface ErpLibraryBook {
  id: string;
  organization_id?: string;
  title: string;
  subtitle?: string;
  isbn: string;
  authorId?: string | null;
  author: string;
  authorName?: string;
  publisherId?: string | null;
  publisherName?: string;
  categoryId?: string | null;
  category: string;
  categoryName?: string;
  edition?: string;
  publicationYear?: number;
  language?: string;
  subject?: string;
  description?: string;
  pages?: number;
  shelfLocation: string;
  coverImageUrl?: string;
  totalCopies: number;
  availableCopies: number;
  status?: ErpLibraryBookStatus;
  createdAt?: string;
  updatedAt?: string;
  circulationCount?: number;
  copies?: ErpLibraryBookCopy[];
  activeLoans?: ErpLibraryTransaction[];
  reservations?: ErpLibraryReservation[];
  borrowedHistory?: {
    borrowerName: string;
    borrowerRole: 'student' | 'teacher';
    borrowedAt: string;
    dueDate: string;
    isReturned: boolean;
  }[];
}

export interface ErpPayrollRecord {
  id: string;
  empId: string;
  staffName: string;
  monthYear: string;
  basicSalaryINR: number;
  hraINR: number;
  daINR: number;
  allowanceINR: number;
  pfDeductionINR: number;
  taxDeductionINR: number;
  netPayoutINR: number;
  paymentStatus: 'processed' | 'pending';
  disbursedDate?: string;
}

// =========================================================================
// 🚀 LIVE SCHOOL ERP DASHBOARD TYPES
// =========================================================================

export interface DashboardSchoolContext {
  name: string;
  campus: string;
  affiliationNo: string;
  academicSession: string;
  currentDate: string;
}

export interface DashboardStudentKPI {
  total: number;
  active: number;
  newAdmissions: number;
  byGender: {
    male: number;
    female: number;
    other: number;
  };
}

export interface DashboardStaffKPI {
  total: number;
  active: number;
  teachers: number;
  nonTeaching: number;
}

export interface DashboardAttendanceMetric {
  totalEligible: number;
  present: number;
  absent: number;
  late: number;
  halfDay?: number;
  leave?: number;
  onLeave?: number;
  attendancePercent: number;
  isMarked: boolean;
}

export interface DashboardClassDistribution {
  grade: string;
  totalStudents: number;
  activeStudents: number;
  sectionBreakdown: Record<string, number>;
}

export interface DashboardAttendanceTrendDay {
  date: string;
  dayName: string;
  totalRecorded: number;
  present: number;
  absent: number;
  late: number;
  attendancePercent: number;
}

export interface DashboardLowAttendanceStudent {
  studentId: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  grade: string;
  section: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays?: number;
  attendancePercent: number;
  parentPhone?: string;
  parentName?: string;
}

export interface DashboardRecentActivity {
  id: string;
  action: string;
  title: string;
  description: string;
  userEmail: string;
  timestamp: string;
  badgeColor?: 'cyan' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo' | 'violet';
}

export interface DashboardTeacherClassSummary {
  grade: string;
  section: string;
  subject: string;
  studentCount: number;
  todayMarked: boolean;
  todayPresent: number;
  todayAbsent: number;
  todayAttendancePercent: number;
}

export interface DashboardAbsentStaff {
  staffId: string;
  empId: string;
  name: string;
  role: string;
  designation: string;
  department: string;
  status: string;
  remarks?: string;
}

export interface DashboardAiInsight {
  id: string;
  type: 'positive' | 'warning' | 'info';
  category: string;
  headline: string;
  detail: string;
  metric?: string;
}

export interface DashboardAcademicOverview {
  totalClasses: number;
  totalSections: number;
  totalSubjects: number;
  activeSessions: number;
}

export interface DashboardPendingTasks {
  unmarkedAttendanceClasses: number;
  pendingAdmissions: number;
  staffOnLeave: number;
}

export interface LiveErpDashboardData {
  success: boolean;
  school: DashboardSchoolContext;
  role: ErpRole;
  staffId?: string | null;
  assignedClasses: TeacherAssignmentRecord[];
  teacherClassSummaries: DashboardTeacherClassSummary[];
  students: DashboardStudentKPI;
  staff: DashboardStaffKPI;
  attendance: {
    students: DashboardAttendanceMetric;
    staff: DashboardAttendanceMetric;
  };
  studentDistribution: DashboardClassDistribution[];
  attendanceTrend: DashboardAttendanceTrendDay[];
  lowAttendanceStudents: DashboardLowAttendanceStudent[];
  recentActivities: DashboardRecentActivity[];
  absentStaffToday: DashboardAbsentStaff[];
  aiInsights?: DashboardAiInsight[];
  academicOverview?: DashboardAcademicOverview;
  pendingTasks?: DashboardPendingTasks;
}

// =========================================================================
// ACADEMICS MANAGEMENT MODULE INTERFACES
// =========================================================================

export type AcademicSessionStatus = 'upcoming' | 'active' | 'closed';

export interface AcademicSessionRecord {
  id: string;
  name: string;
  sessionName?: string;
  startDate: string;
  endDate: string;
  status: AcademicSessionStatus;
  isCurrent: boolean;
  organization_id?: string;
  createdAt?: string;
}

export interface AcademicClassRecord {
  id: string;
  grade: string;
  order: number;
  wing: string;
  status: 'active' | 'inactive';
  sectionsCount?: number;
  studentCount?: number;
  organization_id?: string;
}

export interface AcademicSectionRecord {
  id: string;
  grade: string;
  section: string;
  roomNumber?: string | null;
  capacity: number;
  classTeacherId?: string | null;
  classTeacherName?: string | null;
  status: 'active' | 'inactive';
  studentCount?: number;
  subjectsCount?: number;
  subjects?: SectionSubjectMappingRecord[];
  organization_id?: string;
}

export type SubjectCategory = 'Core' | 'Elective' | 'Language' | 'Skill/Vocational' | 'Activity' | string;

export interface AcademicSubjectRecord {
  id: string;
  name: string;
  code: string;
  category: SubjectCategory;
  maxMarks: number;
  passMarks: number;
  status: 'active' | 'inactive';
  organization_id?: string;
}

export interface SectionSubjectMappingRecord {
  id: string;
  grade: string;
  section: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  assignedTeacherId?: string | null;
  assignedTeacherName?: string | null;
  academicSession: string;
  organization_id?: string;
}

export type HomeworkStatus = 'assigned' | 'submitted' | 'evaluated' | 'cancelled';

export interface AcademicHomeworkRecord {
  id: string;
  academicSession: string;
  grade: string;
  section: string;
  subject: string;
  teacherId?: string | null;
  teacherName: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  status: HomeworkStatus;
  attachments?: string[];
  organization_id?: string;
  createdAt?: string;
}

export interface AcademicsOverviewSummary {
  activeSession: string;
  currentSession: AcademicSessionRecord;
  totalSessions: number;
  totalClasses: number;
  totalSections: number;
  totalSubjects: number;
  totalStudentsEnrolled: number;
  assignedClassTeachers: number;
  unassignedClassTeachers: number;
  totalSectionSubjectMappings: number;
  totalHomeworkAssigned: number;
}

export interface AcademicsOverviewResponse {
  success: boolean;
  overview: AcademicsOverviewSummary;
  sections: AcademicSectionRecord[];
  sessions: AcademicSessionRecord[];
}

// ==========================================
// EXAMINATION & REPORT CARD MANAGEMENT TYPES
// ==========================================

export type ExamType = 'Unit Test' | 'Periodic Assessment' | 'Half Yearly' | 'Annual' | 'Pre-Board' | 'Practical' | string;

export type ExamStatus = 'draft' | 'scheduled' | 'marks_entry' | 'evaluation_complete' | 'published' | 'locked' | 'archived';

export interface ExamRecord {
  id: string;
  title: string;
  examType: ExamType;
  academicSession: string;
  grade: string;
  section: string;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  isLocked: boolean;
  publishedAt?: string | null;
  lockedAt?: string | null;
  organization_id?: string;
  createdAt?: string;
  subjectsCount?: number;
  marksCount?: number;
}

export interface ExamSubjectRecord {
  id: string;
  examId: string;
  subjectId?: string;
  subjectName: string;
  subjectCode: string;
  maxMarks: number;
  passMarks: number;
  examDate?: string;
  assignedTeacherId?: string | null;
  assignedTeacherName?: string | null;
  marksEnteredCount?: number;
  organization_id?: string;
}

export interface ExamMarkItem {
  id?: string;
  examId?: string;
  subjectId?: string;
  studentId: string;
  studentName?: string;
  rollNumber?: string;
  grade?: string;
  section?: string;
  marksObtained: number | null;
  maxMarks: number;
  passMarks?: number;
  status: 'present' | 'absent' | 'not_appeared' | 'exempted';
  remarks?: string;
  isLocked?: boolean;
}

export interface BulkMarksSavePayload {
  examId: string;
  subjectId: string;
  marks: {
    studentId: string;
    marksObtained: number | null;
    status: 'present' | 'absent' | 'not_appeared' | 'exempted';
    remarks?: string;
  }[];
}

export interface MarkCorrectionPayload {
  markId?: string;
  examId: string;
  studentId: string;
  subjectId: string;
  marksObtained: number | null;
  status?: 'present' | 'absent' | 'not_appeared' | 'exempted';
  reason: string;
  remarks?: string;
}

export interface StudentExamSubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  marksObtained: number | null;
  maxMarks: number;
  passMarks: number;
  percentage: number;
  grade: string;
  status: 'present' | 'absent' | 'not_appeared' | 'exempted';
  remarks?: string;
}

export interface StudentExamResultRecord {
  id: string;
  examId: string;
  examTitle?: string;
  examType?: string;
  academicSession?: string;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  grade: string;
  section: string;
  totalMarksObtained: number;
  maxTotalMarks: number;
  percentage: number;
  overallGrade: string;
  resultStatus: 'PASS' | 'FAIL' | 'COMPARTMENT';
  classRank: number | null;
  sectionRank: number | null;
  isPublished: boolean;
  isLocked: boolean;
  calculatedAt?: string;
  subjects?: StudentExamSubjectResult[];
}

export interface ReportCardAttendanceSnapshot {
  totalDays: number;
  presentDays: number;
  attendancePercentage: number;
}

export interface ReportCardGradingScaleItem {
  grade: string;
  range: string;
  description: string;
}

export interface ReportCardPayload {
  reportCardId: string;
  generatedAt: string;
  school: {
    name: string;
    affiliationNumber: string;
    board: string;
    address: string;
    contact: string;
    academicSession: string;
  };
  student: {
    id: string;
    name: string;
    rollNumber: string;
    admissionNumber: string;
    grade: string;
    section: string;
    dateOfBirth: string;
    guardianName: string;
    address?: string;
  };
  exam: {
    id: string;
    title: string;
    examType: string;
    academicSession: string;
    startDate: string;
    endDate: string;
    isLocked: boolean;
    publishedAt: string | null;
  };
  subjects: StudentExamSubjectResult[];
  result: {
    totalMarksObtained: number;
    maxTotalMarks: number;
    percentage: number;
    overallGrade: string;
    resultStatus: 'PASS' | 'FAIL' | 'COMPARTMENT';
    classRank: number | null;
    sectionRank: number | null;
  };
  attendance: ReportCardAttendanceSnapshot;
  gradingScale: ReportCardGradingScaleItem[];
  remarks: string;
}

export interface MarkCorrectionAuditRecord {
  id: string;
  action: string;
  userEmail?: string;
  details: {
    markId?: string;
    examId: string;
    studentId: string;
    subjectId: string;
    oldMarksObtained: number | null;
    newMarksObtained: number | null;
    oldStatus: string;
    newStatus: string;
    reason: string;
    correctedBy?: string;
  };
  created_at: string;
}

export interface ExamsOverviewSummary {
  totalExams: number;
  activeExams: number;
  publishedExams: number;
  lockedExams: number;
  totalMarksEntries: number;
  totalResultsCalculated: number;
  overallPassRate: number;
  schoolAveragePct: number;
  activeSession: string;
}

// =========================================================================
// 📢 MODULE: COMMUNICATION & NOTIFICATION MANAGEMENT TYPES
// =========================================================================

export type ErpNoticeCategory =
  | 'general'
  | 'announcement'
  | 'circular'
  | 'academic'
  | 'holiday'
  | 'exam'
  | 'fee'
  | 'attendance'
  | 'transport'
  | 'library'
  | 'hr';

export type ErpNoticePriority = 'low' | 'normal' | 'high' | 'urgent';

export type ErpNoticeStatus = 'draft' | 'scheduled' | 'published' | 'expired' | 'archived';

export type ErpAudienceType =
  | 'entire_school'
  | 'campus'
  | 'all_students'
  | 'all_parents'
  | 'all_teachers'
  | 'all_staff'
  | 'class'
  | 'section'
  | 'class_parents'
  | 'selected_students'
  | 'selected_parents'
  | 'selected_staff';

export type ErpCommunicationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp' | 'all';

export type ErpDeliveryStatus = 'queued' | 'processing' | 'sent' | 'delivered' | 'failed' | 'read' | 'cancelled';

export interface ErpNotice {
  id: string;
  title: string;
  content: string;
  body?: string;
  category: ErpNoticeCategory | string;
  priority: ErpNoticePriority | string;
  targetAudience?: string;
  audienceType?: ErpAudienceType | string;
  audienceFilter?: {
    grade?: string;
    section?: string;
    session?: string;
    routeNumber?: string;
    ids?: string[];
  };
  attachmentUrl?: string;
  isUrgent?: boolean;
  status: ErpNoticeStatus | string;
  publishAt?: string;
  expiresAt?: string | null;
  postedBy?: string;
  publishedBy?: string;
  postedAt?: string;
  smsBroadcastSent?: boolean;
  organization_id?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErpMessageTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  channel: ErpCommunicationChannel | string;
  subject: string;
  body: string;
  variables: string[];
  status: 'active' | 'draft' | 'archived' | string;
  createdBy?: string;
  organization_id?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErpCommunicationMessage {
  id: string;
  title: string;
  templateId?: string | null;
  templateCode?: string | null;
  channel: ErpCommunicationChannel | string;
  audienceType: ErpAudienceType | string;
  audienceFilter?: any;
  subject: string;
  body: string;
  priority: ErpNoticePriority | string;
  recipientCount: number;
  status: 'draft' | 'scheduled' | 'processing' | 'sent' | 'partially_failed' | 'failed' | 'cancelled' | string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdBy: string;
  organization_id?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErpMessageDelivery {
  id: string;
  messageId: string;
  recipientId: string;
  recipientType: 'student' | 'parent' | 'staff' | 'user' | string;
  recipientName: string;
  recipientContact?: string;
  channel: ErpCommunicationChannel | string;
  status: ErpDeliveryStatus;
  providerMessageId?: string | null;
  failureReason?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  organization_id?: string;
}

export interface ErpInAppNotification {
  id: string;
  recipientUserId: string;
  recipientRole?: string;
  title: string;
  message: string;
  notificationType: 'admission' | 'fee' | 'attendance' | 'exam' | 'homework' | 'notice' | 'transport' | 'library' | 'hr' | 'general' | string;
  relatedEntityType?: string;
  relatedEntityId?: string | null;
  priority: ErpNoticePriority | string;
  readAt?: string | null;
  createdAt: string;
  organization_id?: string;
}

export interface ErpCommunicationSettings {
  organization_id: string;
  autoAdmissionNotifications: boolean;
  autoFeeDueReminders: boolean;
  autoFeePaymentReceipts: boolean;
  autoLowAttendanceAlerts: boolean;
  autoExamResultAlerts: boolean;
  autoTransportUpdates: boolean;
  autoLibraryDueAlerts: boolean;
  autoHrPayrollAlerts: boolean;
  preferredChannels: {
    in_app: boolean;
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  updatedAt?: string;
}

export interface ErpCommunicationPreferences {
  organization_id: string;
  userId: string;
  channelInApp: boolean;
  channelEmail: boolean;
  channelSms: boolean;
  channelWhatsapp: boolean;
  updatedAt?: string;
}

export interface ErpAudienceRecipientPreview {
  id: string;
  name: string;
  type: string;
  role: string;
  contact: string;
  email?: string;
  grade?: string;
  section?: string;
  wardName?: string;
}

export interface ErpAudiencePreviewResult {
  total: number;
  audienceType: string;
  audienceFilter: any;
  sampleRecipients: ErpAudienceRecipientPreview[];
  summary: string;
}

export interface ErpCommunicationOverview {
  totalMessages: number;
  sent: number;
  delivered: number;
  failed: number;
  scheduled: number;
  unreadNotifications: number;
  activeNotices: number;
  totalDeliveries: number;
  deliveryRatePercent: number;
  channelBreakdown: {
    in_app: number;
    email: number;
    sms: number;
    whatsapp: number;
  };
  recentNotices: ErpNotice[];
  recentMessages: ErpCommunicationMessage[];
  recentDeliveries: ErpMessageDelivery[];
  failedDeliveries: ErpMessageDelivery[];
  recentNotifications: ErpInAppNotification[];
  mostUsedTemplates: { code: string; count: number }[];
}

// =========================================================================
// 📚 LIBRARY MANAGEMENT TYPES
// =========================================================================

export type ErpLibraryBookStatus = 'active' | 'inactive' | 'archived';
export type ErpBookCopyCondition = 'new' | 'good' | 'fair' | 'damaged';
export type ErpBookCopyStatus = 'available' | 'issued' | 'reserved' | 'lost' | 'damaged' | 'maintenance' | 'retired';
export type ErpLibraryMemberType = 'student' | 'staff' | 'teacher';
export type ErpLibraryTransactionStatus = 'issued' | 'returned' | 'overdue' | 'lost' | 'damaged';
export type ErpLibraryReservationStatus = 'pending' | 'ready' | 'fulfilled' | 'cancelled' | 'expired';
export type ErpLibraryFineStatus = 'outstanding' | 'paid' | 'waived' | 'cancelled';
export type ErpLibraryFineReason = 'overdue' | 'lost_book' | 'damaged_book' | 'manual';

export interface ErpLibraryCategory {
  id: string;
  organization_id?: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  bookCount?: number;
}

export interface ErpLibraryAuthor {
  id: string;
  organization_id?: string;
  name: string;
  biography?: string;
  status: 'active' | 'inactive';
}

export interface ErpLibraryPublisher {
  id: string;
  organization_id?: string;
  name: string;
  contactEmail?: string;
  website?: string;
  status: 'active' | 'inactive';
}

export interface ErpLibraryBookCopy {
  id: string;
  organization_id?: string;
  bookId: string;
  accessionNumber: string;
  barcode?: string;
  copyNumber: number;
  condition: ErpBookCopyCondition;
  acquisitionDate?: string;
  acquisitionCost?: number;
  shelfLocation?: string;
  status: ErpBookCopyStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}



export interface ErpLibraryMember {
  id: string;
  memberId: string;
  memberType: ErpLibraryMemberType;
  name: string;
  identifier: string; // admission_number or emp_id
  email?: string;
  phone?: string;
  classGrade?: string;
  section?: string;
  department?: string;
  designation?: string;
  status: string;
  currentIssuedCount: number;
  overdueCount: number;
  outstandingFine: number;
  maxAllowedBooks: number;
  loanPeriodDays: number;
  activeLoans?: ErpLibraryTransaction[];
  pastLoans?: ErpLibraryTransaction[];
  fines?: ErpLibraryFine[];
  reservations?: ErpLibraryReservation[];
}

export interface ErpLibraryTransaction {
  id: string;
  organization_id?: string;
  bookId: string;
  bookTitle: string;
  bookCopyId: string;
  accessionNumber: string;
  memberType: ErpLibraryMemberType;
  memberId: string;
  memberName: string;
  memberIdentifier: string;
  issuedAt: string;
  dueAt: string;
  returnedAt?: string | null;
  renewalCount: number;
  status: ErpLibraryTransactionStatus;
  issuedBy?: string;
  returnedBy?: string | null;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
  overdueDays?: number;
  estimatedFine?: number;
}

export interface ErpLibraryReservation {
  id: string;
  organization_id?: string;
  bookId: string;
  bookTitle: string;
  memberType: ErpLibraryMemberType;
  memberId: string;
  memberName: string;
  memberIdentifier: string;
  requestedAt: string;
  priorityOrder: number;
  status: ErpLibraryReservationStatus;
  notifiedAt?: string | null;
  expiryAt?: string | null;
  fulfilledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ErpLibraryFine {
  id: string;
  organization_id?: string;
  transactionId?: string | null;
  memberType: ErpLibraryMemberType;
  memberId: string;
  memberName: string;
  memberIdentifier: string;
  bookTitle: string;
  amount: number;
  reason: ErpLibraryFineReason;
  overdueDays?: number;
  status: ErpLibraryFineStatus;
  paidAt?: string | null;
  waivedAt?: string | null;
  waivedBy?: string | null;
  paymentMethod?: string | null;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ErpLibrarySettings {
  id?: string;
  organization_id?: string;
  maxBooksStudent: number;
  maxBooksStaff: number;
  loanPeriodStudentDays: number;
  loanPeriodStaffDays: number;
  maxRenewals: number;
  finePerDay: number;
  gracePeriodDays: number;
  maxFineCap: number;
  blockOnOverdue: boolean;
  autoNotifyDue: boolean;
  updatedAt?: string;
}

export interface ErpLibraryOverview {
  metrics: {
    totalBooks: number;
    totalCopies: number;
    availableCopies: number;
    issuedBooks: number;
    overdueBooks: number;
    reservedBooks: number;
    outstandingFines: number;
    activeMembers: number;
    circulationRatePercent: number;
  };
  recentIssues: ErpLibraryTransaction[];
  recentReturns: ErpLibraryTransaction[];
  overdueList: ErpLibraryTransaction[];
  popularBooks: ErpLibraryBook[];
  booksDueToday: ErpLibraryTransaction[];
  lowStockBooks: ErpLibraryBook[];
  fineSummary: {
    totalFinesCollected: number;
    totalOutstanding: number;
    totalWaived: number;
    totalRecords: number;
  };
  categorySummary: {
    categoryId: string;
    categoryName: string;
    bookCount: number;
    copyCount: number;
  }[];
}

export interface ErpReportPreset {
  id: string;
  organization_id?: string;
  reportType: string;
  presetName: string;
  description?: string;
  filters: Record<string, any>;
  createdAt?: string;
}

export interface ErpReportsOverview {
  success: boolean;
  academicSession: string;
  students: {
    total: number;
    active: number;
    inactive: number;
    male: number;
    female: number;
  };
  staff: {
    total: number;
    teachers: number;
    nonTeaching: number;
    onLeave: number;
  };
  attendance: {
    todayRate: number;
    presentCount: number;
    absentCount: number;
    markedCount: number;
    date: string;
  };
  fees: {
    totalDemanded: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
  };
  exams: {
    totalExams: number;
    completedExams: number;
    distinctionsCount: number;
  };
  library: {
    totalBooks: number;
    totalCopies: number;
    issuedCopies: number;
    overdueLoans: number;
  };
  transport: {
    totalRoutes: number;
    totalCapacity: number;
    assignedStudents: number;
    occupancyRate: number;
  };
  admissions: {
    totalApplications: number;
    admittedCount: number;
    underReviewCount: number;
    approvedCount: number;
    conversionRate: number;
  };
  communication: {
    totalMessages: number;
    deliveredMessages: number;
    deliveryRate: number;
    unreadNotifications: number;
  };
  recentAuditActivities: {
    id: string;
    action: string;
    user_email: string;
    target_type?: string;
    target_id?: string;
    timestamp: string;
  }[];
}

export interface ErpStudentReportData {
  success: boolean;
  academicSession: string;
  strength: {
    total: number;
    active: number;
    inactive: number;
    male: number;
    female: number;
  };
  classDistribution: {
    className: string;
    sectionsCount: number;
    studentCount: number;
    maleCount: number;
    femaleCount: number;
  }[];
  records: any[];
  totalCount: number;
}

export interface ErpAttendanceReportData {
  success: boolean;
  date: string;
  threshold: number;
  summary: {
    totalStudents: number;
    present: number;
    absent: number;
    attendanceRate: number;
  };
  classBreakdown: {
    className: string;
    section: string;
    totalStudents: number;
    present: number;
    absent: number;
    rate: number;
  }[];
  lowAttendanceDefaulters: {
    id: string;
    name: string;
    rollNo: string;
    grade: string;
    section: string;
    attendanceRate: number;
    guardianName: string;
    guardianPhone: string;
    workingDays: number;
    attendedDays: number;
    absentDays: number;
  }[];
  staffSummary: {
    totalStaff: number;
    present: number;
    onLeave: number;
    absent: number;
    attendanceRate: number;
  };
}

export interface ErpAcademicsReportData {
  success: boolean;
  classes: {
    id: string;
    name: string;
    grade: string;
    sectionsCount: number;
    studentCount: number;
    subjectsCount: number;
  }[];
  teacherAllocations: {
    teacherId: string;
    teacherName: string;
    subjectName: string;
    subjectCode: string;
    className: string;
    section: string;
  }[];
  homeworkSummary: {
    id: string;
    title: string;
    subject: string;
    grade: string;
    section: string;
    assignedDate: string;
    dueDate: string;
    status: string;
  }[];
}

export interface ErpExamReportData {
  success: boolean;
  summary: {
    totalExams: number;
    conducted: number;
    scheduled: number;
    overallAveragePct: number;
    distinctionsCount: number;
    passPercentage: number;
  };
  examList: {
    id: string;
    title: string;
    examType: string;
    academicSession: string;
    grade: string;
    status: string;
    isLocked?: boolean;
  }[];
  resultsRoster: {
    studentId: string;
    studentName: string;
    rollNo: string;
    grade: string;
    totalMarks: number;
    maxMarks: number;
    percentage: number;
    gradeSymbol: string;
    rank: number;
    status: string;
  }[];
}

export interface ErpFeesReportData {
  success: boolean;
  summary: {
    totalDemanded: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
  };
  paymentModeBreakdown: Record<string, number>;
  defaultersList: {
    demandId: string;
    studentId: string;
    studentName: string;
    grade: string;
    balanceAmount: number;
    dueDate: string;
    agingCategory: string;
  }[];
  collectionRegister: {
    paymentId: string;
    receiptNumber: string;
    studentName: string;
    grade: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    cashier: string;
  }[];
}

export interface ErpAdmissionReportData {
  success: boolean;
  funnel: {
    totalLeads: number;
    totalInquiries: number;
    totalApplications: number;
    underReview: number;
    approved: number;
    admitted: number;
    conversionRate: number;
  };
  sourceDistribution: {
    source: string;
    count: number;
    percentage: number;
  }[];
  applicationsList: {
    id: string;
    applicationNumber: string;
    applicantName: string;
    appliedGrade: string;
    status: string;
    leadSource: string;
    appliedAt: string;
    parentName: string;
    parentPhone: string;
  }[];
}

export interface ErpStaffReportData {
  success: boolean;
  strength: {
    total: number;
    active: number;
    teachers: number;
    nonTeaching: number;
    onLeave: number;
  };
  departmentBreakdown: {
    department: string;
    count: number;
  }[];
  roster: {
    id: string;
    empId: string;
    name: string;
    designation: string;
    department: string;
    staffType: string;
    qualification?: string;
    experienceYears?: number;
    email: string;
    phone: string;
    status: string;
  }[];
}

export interface ErpTransportReportData {
  success: boolean;
  summary: {
    totalRoutes: number;
    totalVehicles: number;
    totalCapacity: number;
    assignedRiders: number;
    overallOccupancyRate: number;
  };
  routesList: {
    id: string;
    routeNumber: string;
    routeName: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    capacity: number;
    assignedStudentsCount: number;
    currentStatus: string;
    occupancyPct: number;
  }[];
}

export interface ErpLibraryReportData {
  success: boolean;
  summary: {
    totalTitles: number;
    totalBooks?: number;
    totalCopies: number;
    availableCopies: number;
    issuedCopies: number;
    overdueCount: number;
    circulationRate: number;
  };
  overdueList: {
    txId: string;
    bookTitle: string;
    accessionNumber: string;
    memberName: string;
    memberType: string;
    dueDate: string;
    overdueDays: number;
  }[];
  popularBooks: {
    bookId: string;
    title: string;
    author: string;
    categoryName: string;
    borrowCount: number;
  }[];
}

export interface ErpCommunicationReportData {
  success: boolean;
  summary: {
    totalMessages: number;
    delivered: number;
    failed: number;
    unreadNotifications: number;
    deliverySuccessRate: number;
  };
  channelBreakdown: {
    in_app: number;
    email: number;
    sms: number;
    whatsapp: number;
  };
  recentMessages: {
    id: string;
    title: string;
    channel: string;
    recipientType: string;
    sentAt: string;
    status: string;
  }[];
}

export interface ErpAuditReportData {
  success: boolean;
  totalLogs: number;
  logs: {
    id: string;
    action: string;
    user_email: string;
    target_type?: string;
    target_id?: string;
    ip_address?: string;
    timestamp: string;
  }[];
}

// ==========================================
// DAKSHORA AI ASSISTANT TYPES
// ==========================================

export interface ErpAiDataCard {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

export interface ErpAiTableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface ErpAiChartData {
  type: 'bar' | 'line' | 'doughnut' | 'metric';
  title?: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface ErpAiAction {
  label: string;
  module: string;
  tab?: string;
  exportType?: string;
}

export interface ErpAiStructuredData {
  summary: string[];
  dataCards?: ErpAiDataCard[];
  tableData?: ErpAiTableData | null;
  chartData?: ErpAiChartData | null;
  dataSources: string[];
  suggestedActions?: ErpAiAction[];
}

export interface ErpAiMessage {
  id: string;
  conversation_id: string;
  organization_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string;
  tools_invoked?: string[];
  data_sources?: string[];
  structured_data?: ErpAiStructuredData;
  created_at: string;
}

export interface ErpAiConversation {
  id: string;
  organization_id?: string;
  user_id?: string;
  school_id?: string;
  campus_id?: string;
  academic_session: string;
  role: string;
  title: string;
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ErpAiSettings {
  ai_enabled: boolean;
  allowed_roles: string[];
  monthly_quota: number;
  used_tokens?: number;
  sensitive_data_policy: string;
  model_name: string;
  school_context: {
    schoolName: string;
    campus: string;
    affiliation: string;
    academicSession: string;
  };
}

export interface ErpAiStatusResponse {
  success: boolean;
  status: string;
  organization_id: string;
  schoolContext: {
    schoolName: string;
    campus: string;
    affiliation: string;
    academicSession: string;
  };
  activeRole: string;
  model: string;
  quota: {
    monthlyLimit: number;
    used: number;
    remaining: number;
  };
  allowedRoles: string[];
  connectedPillars: string[];
}

export interface ErpAiChatResponse {
  success: boolean;
  conversationId: string;
  intent: string;
  toolsInvoked: string[];
  reply: string;
  dataSources: string[];
  structuredData?: ErpAiStructuredData;
}

// =========================================================================
// 15. DAKSHORA SCHOOL ERP PRODUCTION HARDENING & SETTINGS TYPES
// =========================================================================

export interface ErpCampus {
  id: string;
  organization_id?: string;
  name: string;
  code: string;
  address: string;
  city?: string;
  state?: string;
  pin?: string;
  contactPhone?: string;
  contactEmail?: string;
  principalName?: string;
  status: 'active' | 'inactive' | 'maintenance';
  isMain: boolean;
  capacity: number;
  studentCount?: number;
  staffCount?: number;
  createdAt?: string;
}

export interface SchoolProfileConfig {
  schoolName: string;
  schoolCode: string;
  board: string;
  affiliationNo: string;
  udiseNumber?: string;
  registrationNo?: string;
  address: string;
  city?: string;
  state?: string;
  pin?: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  principalName: string;
  establishedYear: number;
  timezone: string;
  currency: string;
  dateFormat: string;
  academicSession: string;
}

export interface AttendanceSettingsConfig {
  defaultStatus: 'present' | 'absent' | 'late';
  schoolWorkingDays: string[];
  lateThresholdTime: string;
  lowAttendanceThreshold: number;
  allowFutureDates: boolean;
  correctionWindowDays: number;
  requireCorrectionReason: boolean;
}

export interface ExamGradeRange {
  grade: string;
  minMarks: number;
  maxMarks: number;
  point: number;
  remark: string;
}

export interface ExaminationSettingsConfig {
  gradingSystem: 'cbse_9point' | 'percentage' | 'gpa' | 'custom';
  passPercentage: number;
  maxMarksDefault: number;
  gradeRanges: ExamGradeRange[];
  reportCardSettings: {
    showRank: boolean;
    showGradePoints: boolean;
    showAttendance: boolean;
    showPrincipalSignature: boolean;
  };
}

export interface FeeHeadItem {
  id: string;
  name: string;
  code: string;
  isMandatory: boolean;
  frequency: string;
}

export interface FeeSettingsConfig {
  feeHeads: FeeHeadItem[];
  frequency: string;
  dueDateDay: number;
  gracePeriodDays: number;
  lateFinePerDay: number;
  fineType: 'flat' | 'percentage';
  receiptPrefix: string;
  paymentModes: string[];
  concessionRules: {
    type: string;
    discountPercent: number;
    name: string;
  }[];
}

export interface CommunicationSettingsConfig {
  enabledChannels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    in_app: boolean;
  };
  senderInfo: {
    smsSenderId: string;
    emailFrom: string;
    whatsappBusinessNumber: string;
  };
  triggers: {
    absenceAlert: boolean;
    feeDueReminder: boolean;
    feeReceiptGenerated: boolean;
    examPublished: boolean;
    emergencyNotice: boolean;
    busDelayAlert: boolean;
  };
}

export interface TransportSettingsConfig {
  defaultSpeedLimitKmH: number;
  gpsUpdateIntervalSec: number;
  studentSeatValidation: boolean;
  autoOverCapacityAlert: boolean;
  driverDutyHoursMax: number;
  emergencySosContact: string;
}

export interface LibrarySettingsConfig {
  loanPeriodStudentDays: number;
  loanPeriodStaffDays: number;
  maxBooksStudent: number;
  maxBooksStaff: number;
  maxRenewals: number;
  finePerDay: number;
  gracePeriodDays: number;
  maxFineCap: number;
  reservationExpiryDays: number;
}

export interface LeaveTypeItem {
  code: string;
  name: string;
  daysPerYear: number;
  paid: boolean;
}

export interface LeaveSettingsConfig {
  leaveTypes: LeaveTypeItem[];
  requireHodApproval: boolean;
  allowHalfDay: boolean;
  carryForwardMaxDays: number;
}

export interface PayrollSettingsConfig {
  salaryComponents: {
    basicPercent: number;
    hraPercent: number;
    daPercent: number;
  };
  statutoryDeductions: {
    pfPercent: number;
    professionalTaxINR: number;
  };
  payrollCycle: string;
  salaryPayoutDay: number;
  autoGeneratePayslips: boolean;
}

export interface SecuritySettingsConfig {
  sessionTimeoutMinutes: number;
  mfaRequired: boolean;
  allowMultipleSessions: boolean;
  passwordPolicy: {
    minLength: number;
    requireSpecialChar: boolean;
    expiryDays: number;
  };
  dataSafetyMode: string;
}

export interface ErpRolePermissionMatrix {
  [role: string]: {
    read: string[];
    manage: string[];
    export: string[];
    sensitive: string[];
  };
}

export interface ErpMasterSettings {
  school_profile: SchoolProfileConfig;
  attendance_settings: AttendanceSettingsConfig;
  examination_settings: ExaminationSettingsConfig;
  fee_settings: FeeSettingsConfig;
  communication_settings: CommunicationSettingsConfig;
  transport_settings: TransportSettingsConfig;
  library_settings: LibrarySettingsConfig;
  leave_settings: LeaveSettingsConfig;
  payroll_settings: PayrollSettingsConfig;
  ai_settings: {
    aiEnabled: boolean;
    allowedRoles: string[];
    monthlyQuotaTokens: number;
    conversationRetentionDays: number;
    sensitiveDataPolicy: string;
    allowExports: boolean;
  };
  security_settings: SecuritySettingsConfig;
  roles_permissions: ErpRolePermissionMatrix;
}

export interface ErpGlobalSearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  type: 'student' | 'staff' | 'admission' | 'fee' | 'exam' | 'transport' | 'library';
  status?: string;
  grade?: string;
  section?: string;
  department?: string;
  designation?: string;
  phone?: string;
  balance?: number;
  available?: boolean;
}

export interface ErpGlobalSearchResponse {
  success: boolean;
  query: string;
  role: string;
  totalMatches: number;
  results: {
    students?: ErpGlobalSearchResultItem[];
    staff?: ErpGlobalSearchResultItem[];
    admissions?: ErpGlobalSearchResultItem[];
    fees?: ErpGlobalSearchResultItem[];
    exams?: ErpGlobalSearchResultItem[];
    transport?: ErpGlobalSearchResultItem[];
    library?: ErpGlobalSearchResultItem[];
  };
}

export interface ErpSystemHealth {
  success: boolean;
  service: string;
  status: string;
  version: string;
  environment: string;
  activeSession: string;
  activeCampus: string;
  uptimeSeconds: number;
  timestamp: string;
  subsystems: {
    database: { status: string; driver: string; latencyMs: number };
    authentication: { status: string; mode: string; activeSessionsTracked: number };
    aiEngine: { status: string; model: string; toolsLoaded: number; quotaUtilizationPercent: number };
    storage: { status: string; bucket: string; encryption: string };
    communicationGateways: {
      sms: { status: string; senderId: string };
      email: { status: string; provider: string };
      whatsapp: { status: string; provider: string };
    };
    dataSafety: { backupMode: string; lastSnapshot: string; status: string };
  };
}

export interface ErpOnboardingChecklistItem {
  key: string;
  name: string;
  isComplete: boolean;
  weight: number;
}

export interface ErpOnboardingChecklist {
  success: boolean;
  readinessPercent: number;
  status: string;
  completedCount: number;
  totalCount: number;
  items: ErpOnboardingChecklistItem[];
}

export interface ErpAuditLogEntry {
  id: string;
  action: string;
  user_email: string;
  target_type: string;
  target_id: string;
  ip_address?: string;
  timestamp: string;
}

// =========================================================================
// ⏰ TIMETABLE & PERIOD SCHEDULING ENGINE TYPES
// =========================================================================

export interface ErpBellPeriod {
  id: string;
  periodNumber: number;
  label: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isBreak: boolean;
  periodType: 'assembly' | 'regular' | 'lab' | 'recess' | 'zero_period' | 'activity';
}

export interface ErpBellScheduleResponse {
  success: boolean;
  serverTime: string;
  serverIstTime?: string;
  currentDayOfWeek?: string;
  liveStatus?: 'before_school' | 'assembly' | 'in_period' | 'recess' | 'school_over' | 'sunday';
  periods: ErpBellPeriod[];
  activePeriod: ErpBellPeriod | null;
  nextPeriod: ErpBellPeriod | null;
  minutesRemaining: number;
}

export interface ErpRoomResource {
  id: string;
  roomNumber: string;
  name: string;
  capacity: number;
  roomType: 'classroom' | 'physics_lab' | 'chemistry_lab' | 'biology_lab' | 'computer_lab' | 'robotics_lab' | 'library' | 'sports_complex' | 'music_room' | 'auditorium';
  buildingWing: string;
  floor: string;
  isActive: boolean;
  totalWeeklyBookings?: number;
  utilizationPercent?: number;
  isAvailableNow?: boolean;
}

export interface ErpTimetableSlot {
  id: string;
  session: string;
  grade: string;
  section: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periodNumber: number;
  subjectId?: string;
  subjectName: string;
  subjectCode?: string;
  teacherId?: string;
  teacherName?: string;
  roomId?: string;
  roomNumber?: string;
  slotType: 'regular' | 'lab' | 'activity' | 'assembly' | 'recess';
  organization_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ErpTeacherSchedule {
  success: boolean;
  teacher: {
    id: string;
    name: string;
    designation: string;
    department: string;
    subjectSpecialization?: string;
    photoUrl?: string;
  };
  weeklyPeriodsCount: number;
  maxWeeklyPeriods: number;
  utilizationPercent: number;
  periodsByDay: Record<string, number>;
  freePeriodsCount: number;
  freePeriods: Array<{
    dayOfWeek: string;
    periodNumber: number;
    periodLabel: string;
    startTime: string;
    endTime: string;
  }>;
  routine: ErpTimetableSlot[];
}

export interface ErpSubstitutionCandidate {
  teacherId: string;
  teacherName: string;
  designation: string;
  department: string;
  subjectSpecialization?: string;
  todayPeriodsCount: number;
  matchingDepartment: boolean;
  recommendationScore: number;
  isBestMatch: boolean;
}

export interface ErpSubstitutionRecommendation {
  periodNumber: number;
  dayOfWeek: string;
  grade: string;
  section: string;
  subjectName: string;
  roomNumber: string;
  absentTeacherId: string;
  absentTeacherName: string;
  availableCandidatesCount: number;
  candidates: ErpSubstitutionCandidate[];
}

export interface ErpSubstitutionRecord {
  id: string;
  date: string;
  dayOfWeek: string;
  periodNumber: number;
  absentTeacherId: string;
  absentTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  grade: string;
  section: string;
  subjectName: string;
  roomNumber: string;
  reason: 'sick_leave' | 'casual_leave' | 'school_duty' | 'training' | 'emergency';
  status: 'recommended' | 'assigned' | 'notified' | 'completed' | 'cancelled';
  assignedBy: string;
  assignedAt: string;
  notes?: string;
}

export interface ErpTimetableClashDiagnostic {
  type: 'teacher_clash' | 'room_clash' | 'class_clash' | 'workload_warning';
  message: string;
  conflictingSlot?: ErpTimetableSlot;
}

// =========================================================================
// 🎓 PARENT & STUDENT SELF-SERVICE PORTAL TYPES
// =========================================================================

export interface ErpPortalWardStudent {
  id: string;
  name: string;
  rollNo: string;
  admissionNo: string;
  grade: string;
  section: string;
  dob: string;
  bloodGroup: string;
  gender: string;
  avatarUrl?: string;
  attendancePercent: number;
  duesINR: number;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  penNo?: string;
  admissionDate?: string;
  academicSession?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  classTeacher?: string;
}

export interface ErpPortalStudentProfile extends ErpStudentRecord {
  classTeacher: string;
  transportRouteNumber: string;
  transportRouteName: string;
  qrPayload: string;
  schoolAffiliation: {
    schoolName: string;
    affiliationNo: string;
    schoolCode: string;
    board: string;
    principalName: string;
    phone: string;
    email: string;
    address: string;
    activeSession: string;
  };
}

export interface ErpPortalAttendanceMetric {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  halfDays: number;
}

export interface ErpPortalAttendanceCalendarDay {
  date: string;
  day: number;
  dayOfWeek: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'half_day' | 'holiday' | 'upcoming';
  remarks?: string;
}

export interface ErpPortalAttendanceSummary {
  studentId: string;
  studentName: string;
  grade: string;
  section: string;
  academicSession: string;
  attendancePercent: number;
  metrics: ErpPortalAttendanceMetric;
  monthlyCalendar: ErpPortalAttendanceCalendarDay[];
  recentRecords: ErpAttendanceRecord[];
}

export interface ErpPortalLeaveApplication {
  id: string;
  organization_id?: string;
  student_id: string;
  studentId?: string;
  studentName: string;
  grade: string;
  section: string;
  leaveType: 'sick' | 'casual' | 'emergency' | 'planned';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  attachmentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ErpPortalHomeworkItem {
  id: string;
  organization_id?: string;
  session: string;
  grade: string;
  section: string;
  subject: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  assignedBy: string;
  attachments?: Array<{ name: string; url: string }>;
  status: 'active' | 'evaluated' | 'closed';
  submission?: {
    id?: string;
    status: 'submitted' | 'pending' | 'evaluated';
    submittedAt?: string | null;
    submissionText?: string;
    attachmentUrl?: string;
    parentAcknowledged?: boolean;
    acknowledgedAt?: string | null;
    score?: string | null;
    teacherFeedback?: string | null;
  };
}

export interface ErpPortalReportCard {
  examId: string;
  title: string;
  term: string;
  startDate: string;
  endDate: string;
  status: string;
  subjects: Array<{
    subject: string;
    maxMarks: number;
    obtainedMarks: number;
    percentage: number;
    cbseGrade: string;
    gradePoint: number;
  }>;
  summary: {
    totalMaxMarks: number;
    totalObtainedMarks: number;
    aggregatePercentage: number;
    cumulativeGpa: number;
    overallGrade: string;
    classRank: number;
    resultStatus: string;
    teacherRemarks: string;
  };
}

export interface ErpPortalFeeSummary {
  totalInvoicedINR: number;
  totalPaidINR: number;
  outstandingBalanceINR: number;
  overdueCount: number;
  pendingCount: number;
}

export interface ErpPortalTransport {
  id: string;
  routeNumber: string;
  routeName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  assignedStudentsCount: number;
  currentStatus: string;
  pickupStop: string;
  pickupTime: string;
  dropTime: string;
  emergencySosContact: string;
  stops: Array<{ stopName: string; pickupTime: string; dropTime: string }>;
  liveGps?: {
    latitude: number;
    longitude: number;
    speedKmH: number;
    lastPingSecAgo: number;
    statusText: string;
  };
}

export interface ErpPortalEmergencyHelpline {
  department: string;
  contactPerson: string;
  phone: string;
  email: string;
  hours: string;
}



// =========================================================================
// 🚀 SCHOOL ERP SAAS ONBOARDING & CONFIGURATION WIZARD TYPES (MIGRATION 019)
// =========================================================================

export type OnboardingStatus = 'draft' | 'in_progress' | 'ready' | 'active' | 'suspended';

export interface SchoolOnboardingRecord {
  id: string;
  organization_id: string;
  school_id: string | null;
  status: OnboardingStatus;
  current_step: number;
  completed_steps: number[];
  draft_data: Record<string, any>;
  started_at: string;
  completed_at: string | null;
  activated_at: string | null;
  created_by: string;
  updated_at: string;
}

export interface OnboardingChecklistItem {
  id: string;
  label: string;
  status: 'complete' | 'warning' | 'missing';
  detail?: string;
}

export interface OnboardingChecklistCategory {
  title: string;
  status: 'complete' | 'warning';
  items: OnboardingChecklistItem[];
}

export interface OnboardingChecklist {
  categories: {
    core: OnboardingChecklistCategory;
    academics: OnboardingChecklistCategory;
    people: OnboardingChecklistCategory;
    finance: OnboardingChecklistCategory;
    communication: OnboardingChecklistCategory;
    ai: OnboardingChecklistCategory;
  };
  counts: {
    campuses: number;
    sessions: number;
    classes: number;
    subjects: number;
    staff: number;
    students: number;
    feeStructures: number;
  };
  isReadyForActivation: boolean;
  missingMandatoryItems: string[];
}

export interface OnboardingStatusResponse {
  success: boolean;
  onboarding: SchoolOnboardingRecord;
  checklist: OnboardingChecklist;
  progressPercentage: number;
  totalSteps: number;
  stepTitles: string[];
}

export interface OnboardingInvitationRecord {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  name: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  invited_by?: string;
  expires_at: string;
  created_at?: string;
}

export interface ImportPreviewSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: Array<{ row: number; field: string; message: string }>;
  duplicates: Array<{ row: number; rollNo?: string; empId?: string; email?: string; name?: string; message: string }>;
}

// =========================================================================
// 👑 DAKSHORA PLATFORM CONTROL CENTER (SUPER ADMIN / SAAS OPERATIONS)
// =========================================================================

export interface PlatformDashboardMetrics {
  organizations: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
  };
  schools: {
    totalSchools: number;
    totalCampuses: number;
  };
  subscriptions: {
    activeCount: number;
    expiringCount: number;
    monthlyRecurringRevenueINR: number;
    planDistribution: {
      starter: number;
      growth: number;
      enterprise: number;
      [key: string]: number;
    };
  };
  platformRoster: {
    totalStudentsAcrossPlatform: number;
    totalStaffAcrossPlatform: number;
  };
  telemetry: {
    totalAiRequests: number;
    totalCommunicationMessages: number;
    storageUsageGB: number;
  };
  operations: {
    openSupportTickets: number;
    activeSupportSessions: number;
    maintenanceMode: boolean;
  };
}

export interface PlatformDashboardData {
  success: boolean;
  metrics: PlatformDashboardMetrics;
  recentAuditLogs: AuditLogRecord[];
}

export interface PlatformSupportTicket {
  id: string;
  organization_id: string;
  organization_name: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string | null;
  created_by: string;
  resolution_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformSupportSession {
  id: string;
  admin_user_id: string;
  admin_email: string;
  target_organization_id: string;
  target_school_name: string;
  reason: string;
  status: 'active' | 'ended' | 'expired';
  session_token: string;
  started_at: string;
  ended_at?: string | null;
  expires_at: string;
}

export interface PlatformSettings {
  id: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  feature_flags: {
    ai: boolean;
    transport: boolean;
    library: boolean;
    payroll: boolean;
    advanced_reports: boolean;
    multi_campus: boolean;
    [key: string]: boolean;
  };
  updated_by?: string;
  updated_at?: string;
}

export interface PlatformHealthSubsystem {
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  message: string;
}

export interface PlatformHealthStatus {
  success: boolean;
  overallStatus: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  subsystems: {
    gatewayApi: PlatformHealthSubsystem;
    databasePostgres: PlatformHealthSubsystem;
    authService: PlatformHealthSubsystem;
    dakshoraAi: PlatformHealthSubsystem;
    communicationGateways: PlatformHealthSubsystem;
    billingWebhooks: PlatformHealthSubsystem;
    storageAssets: PlatformHealthSubsystem;
    [key: string]: PlatformHealthSubsystem;
  };
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: string | null;
  organizationName?: string;
  status: string;
  lastActive: string;
}

export interface PlatformSchool {
  id: string;
  name: string;
  schoolCode: string;
  organizationId: string;
  organizationName: string;
  campusesCount: number;
  currentSession: string;
  studentCount: number;
  staffCount: number;
  subscriptionPlan: string;
  status: string;
  board?: string;
  city?: string;
  createdAt?: string;
}

export interface PlatformOnboardingSummary {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  onboardingId: string;
  status: string;
  currentStep: number;
  completedStepsCount: number;
  progressPercentage: number;
  startedAt: string;
  activatedAt?: string | null;
}

// =========================================================================
// 🏛️ DAKSHORA 2.0: STAFF RESPONSIBILITIES & SCOPE ENGINE TYPES
// =========================================================================

export type ResponsibilityScopeType = 'SECTION' | 'DEPARTMENT' | 'SCHOOL' | 'CAMPUS' | 'PROGRAM' | 'HOUSE' | 'WING';

export interface ResponsibilityTypeRecord {
  id: string;
  organization_id?: string | null;
  school_id: string;
  code: string;
  name: string;
  description: string;
  category: 'academics' | 'examinations' | 'student_welfare' | 'special_programs' | 'co_curricular' | 'administration' | string;
  default_scope_type: ResponsibilityScopeType;
  is_system: boolean;
  is_active: boolean;
  display_order: number;
  permissions?: string[];
  activeHoldersCount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StaffResponsibilityRecord {
  id: string;
  organization_id: string;
  school_id: string;
  campus_id?: string | null;
  staff_id: string;
  staff_name: string;
  responsibility_type_id: string;
  responsibility_code: string;
  responsibility_name: string;
  scope_type: ResponsibilityScopeType;
  scope_id: string;
  scope_name: string;
  academic_session_id: string;
  is_primary: boolean;
  start_date: string;
  end_date?: string | null;
  status: 'active' | 'inactive' | 'expired';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AccessScopesSummary {
  staffId: string;
  teachingSections: Array<{ grade: string; section: string; subject: string; scopeKey: string }>;
  classTeacherSections: Array<{ scopeId: string; scopeName: string; grade: string; section: string; scopeKey: string }>;
  hasSchoolExamScope: boolean;
  departments: string[];
  programs: string[];
  houses: string[];
  responsibilitiesSummary: Array<{
    code: string;
    name: string;
    scopeType: string;
    scopeId: string;
    isPrimary: boolean;
  }>;
}

export interface EffectivePermissionsResponse {
  success: boolean;
  staffId: string;
  staffName: string;
  baseRole: string;
  designation?: string;
  effectivePermissions: string[];
  permissions?: string[];
  accessScopes?: AccessScopesSummary;
}

export interface TeacherWorkloadSummary {
  teachingClassesCount: number;
  activeResponsibilitiesCount: number;
  studentRosterCount: number;
  activeHomeworkCount: number;
  primaryResponsibility: StaffResponsibilityRecord | null;
}

// =========================================================================
// 📚 PHASE 11: SCHOOL RAG & KNOWLEDGE BASE TYPES
// =========================================================================

export interface KnowledgeBaseDocument {
  id: string;
  organization_id?: string;
  title: string;
  category: string;
  doc_type: string;
  size_kb: number;
  pages: number;
  status: string;
  confidence_score: number;
  tags: string[];
  summary: string;
  content?: string;
  uploaded_by: string;
  updated_at: string;
}

export interface KnowledgeBaseCitation {
  docTitle: string;
  section: string;
  page: number;
  confidence: string;
}

export interface KnowledgeBaseQueryResponse {
  success: boolean;
  query: string;
  groundedAnswer: string;
  citations: KnowledgeBaseCitation[];
  retrievalLatencyMs: number;
  organization_id?: string;
}

// =========================================================================
// 🤖 PHASE 13: ROBOTICS & STEAM ACADEMY TYPES
// =========================================================================

export interface RoboticsCourse {
  id: string;
  gradeRange: string;
  title: string;
  platform: string;
  modulesCount: number;
  durationWeeks: number;
  enrolledStudents: number;
  badgeAwarded: string;
  icon: string;
  color: string;
  description: string;
}

export interface RoboticsInventoryItem {
  id: string;
  name: string;
  category: string;
  totalQty: number;
  availableQty: number;
  location: string;
  condition: string;
}

export interface RoboticsProject {
  id: string;
  title: string;
  studentName: string;
  grade: string;
  category: string;
  mentor: string;
  status: string;
  rating: string;
  award: string;
  summary: string;
}

export interface RoboticsCompetition {
  id: string;
  name: string;
  dates: string;
  venue: string;
  teamSize: string;
  registrationDeadline: string;
  status: string;
  category: string;
}

// =========================================================================
// 🧩 PHASE 14 & 15: SOLUTION BUILDER & COMMERCIAL QUOTATION TYPES
// =========================================================================

export interface ItemizedQuotationModule {
  key: string;
  name: string;
  ratePerStudentMonthly: number;
  monthlyTotalINR: number;
}

export interface CommercialQuotation {
  quoteId: string;
  date: string;
  validUntil: string;
  schoolName: string;
  studentCount: number;
  billingCycle: 'monthly' | 'annual';
  itemizedModules: ItemizedQuotationModule[];
  pricing: {
    basePlatformFeeMonthly: number;
    effectivePerStudentMonthly: number;
    discountPercent: number;
    monthlyChargeableINR: number;
    annualSubtotalINR: number;
    gstRatePercent: number;
    hsnCode: string;
    gstAmountINR: number;
    grandTotalINR: number;
  };
  paymentTerms: string;
  includedServices: string[];
}




