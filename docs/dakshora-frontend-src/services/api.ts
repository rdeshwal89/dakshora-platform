import {
  ApiResponse,
  UserRecord,
  OrganizationRecord,
  WebsiteRecord,
  TemplateRecord,
  LeadRecord,
  MediaRecord,
  BillingPlan,
  InvoiceRecord,
  SaasSubscription,
  SaasUsageMetrics,
  SaasEntitlements,
  SaasEntitlementOverride,
  AuditLogRecord,
  ErpStudentRecord,
  ErpStudentProfile,
  StudentListResponse,
  StudentImportResult,
  ErpStaffRecord,
  ErpStaffProfile,
  StaffListResponse,
  StaffImportResult,
  TeacherAssignmentRecord,
  AttendanceStatus,
  StudentDailyAttendanceItem,
  StaffDailyAttendanceItem,
  AttendanceDashboardSummary,
  MonthlyAttendanceGridData,
  LowAttendanceReportItem,
  AttendanceSettings,
  LiveErpDashboardData,
  AcademicSessionRecord,
  AcademicClassRecord,
  AcademicSectionRecord,
  AcademicSubjectRecord,
  SectionSubjectMappingRecord,
  AcademicHomeworkRecord,
  AcademicsOverviewResponse,
  ExamRecord,
  ExamSubjectRecord,
  ExamMarkItem,
  BulkMarksSavePayload,
  MarkCorrectionPayload,
  StudentExamResultRecord,
  ReportCardPayload,
  MarkCorrectionAuditRecord,
  ExamsOverviewSummary,
  ErpFeeStructure,
  ErpFeeConcession,
  ErpFeeDemand,
  ErpFeePayment,
  ErpPaymentReversal,
  ErpFeeOverviewSummary,
  ErpStudentFeeAccount,
  ErpPrintableReceipt,
  ErpClassFeeSummary,
  ErpAdmissionApplication,
  ErpAdmissionDocument,
  ErpAdmissionNote,
  ErpAdmissionTimelineEvent,
  ErpAdmissionOverview,
  ErpDuplicateStudentMatch,
  ErpConfirmAdmissionPayload,
  ErpNotice,
  ErpMessageTemplate,
  ErpCommunicationMessage,
  ErpMessageDelivery,
  ErpInAppNotification,
  ErpCommunicationSettings,
  ErpCommunicationPreferences,
  ErpAudiencePreviewResult,
  ErpCommunicationOverview,
  ErpLibraryCategory,
  ErpLibraryAuthor,
  ErpLibraryPublisher,
  ErpLibraryBookCopy,
  ErpLibraryBook,
  ErpLibraryMember,
  ErpLibraryTransaction,
  ErpLibraryReservation,
  ErpLibraryFine,
  ErpLibrarySettings,
  ErpLibraryOverview,
  ErpReportPreset,
  ErpReportsOverview,
  ErpStudentReportData,
  ErpAttendanceReportData,
  ErpAcademicsReportData,
  ErpExamReportData,
  ErpFeesReportData,
  ErpAdmissionReportData,
  ErpStaffReportData,
  ErpTransportReportData,
  ErpLibraryReportData,
  ErpCommunicationReportData,
  ErpAuditReportData,
  ErpAiMessage,
  ErpAiConversation,
  ErpAiSettings,
  ErpAiStatusResponse,
  ErpAiChatResponse,
  ErpCampus,
  ErpMasterSettings,
  ErpGlobalSearchResponse,
  ErpSystemHealth,
  ErpOnboardingChecklist,
  ErpAuditLogEntry,
  ErpBellPeriod,
  ErpBellScheduleResponse,
  ErpRoomResource,
  ErpTimetableSlot,
  ErpTeacherSchedule,
  ErpSubstitutionCandidate,
  ErpSubstitutionRecommendation,
  ErpSubstitutionRecord,
  ErpTimetableClashDiagnostic,
  ErpPortalWardStudent,
  ErpPortalStudentProfile,
  ErpPortalAttendanceSummary,
  ErpPortalLeaveApplication,
  ErpPortalHomeworkItem,
  ErpPortalReportCard,
  ErpPortalFeeSummary,
  ErpPortalTransport,
  ErpPortalEmergencyHelpline,
  OnboardingStatus,
  SchoolOnboardingRecord,
  OnboardingChecklist,
  OnboardingStatusResponse,
  OnboardingInvitationRecord,
  ImportPreviewSummary,
  PlatformDashboardData,
  PlatformSupportTicket,
  PlatformSupportSession,
  PlatformSettings,
  PlatformHealthStatus,
  PlatformUser,
  PlatformSchool,
  PlatformOnboardingSummary,
  ResponsibilityTypeRecord,
  StaffResponsibilityRecord,
  AccessScopesSummary,
  EffectivePermissionsResponse,
  TeacherWorkloadSummary,
  ResponsibilityScopeType,
  TeachingJournalEntry,
  AiTeacherGenerateRequest,
  AiTeacherGenerateResponse,
  AiQuestionPaperRequest,
  AiQuestionPaperResponse,
  AiQuestionPaperData,
  AiLessonPlanRequest,
  AiLessonPlanResponse,
  AiLessonPlanData,
  AiPresentationRequest,
  AiPresentationResponse,
  AiPresentationData,
  KnowledgeBaseDocument,
  KnowledgeBaseQueryResponse,
  RoboticsCourse,
  RoboticsInventoryItem,
  RoboticsProject,
  RoboticsCompetition,
  CommercialQuotation
} from '../types';

const STORAGE_KEY_BASE_URL = 'dakshora_backend_url';
export const LIVE_RENDER_BACKEND_URL = 'https://dakshora-api.onrender.com';

export const DEFAULT_BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || 
  (typeof window !== 'undefined'
    ? (
        window.location.hostname.includes('dakshora')
          ? LIVE_RENDER_BACKEND_URL
          : window.location.port === '3000' || /^192\.168\./.test(window.location.hostname) || /^10\./.test(window.location.hostname)
            ? ''
            : 'http://localhost:5000'
      )
    : 'http://localhost:5000');

export const getBackendBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_BASE_URL);
    if (saved) {
      const clean = saved.replace(/\/$/, '');
      // Auto-migrate stale unconfigured DNS records (api.dakshora.co.in / api.dakshora.in)
      if (clean.includes('api.dakshora.co.in') || clean.includes('api.dakshora.in')) {
        localStorage.removeItem(STORAGE_KEY_BASE_URL);
        return DEFAULT_BACKEND_URL ? DEFAULT_BACKEND_URL.replace(/\/$/, '') : '';
      }
      return clean;
    }
  }
  return DEFAULT_BACKEND_URL ? DEFAULT_BACKEND_URL.replace(/\/$/, '') : '';
};

export const setBackendBaseUrl = (url: string): void => {
  const cleanUrl = url.trim().replace(/\/$/, '');
  localStorage.setItem(STORAGE_KEY_BASE_URL, cleanUrl);
};

export const resetBackendBaseUrl = (): void => {
  localStorage.removeItem(STORAGE_KEY_BASE_URL);
};

export async function makeApiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: ApiResponse<T>; status: number; latencyMs: number }> {
  const baseUrl = getBackendBaseUrl();
  const fullUrl = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const startTime = performance.now();
  const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
    authHeaders['x-access-token'] = token;
    authHeaders['x-authorization'] = `Bearer ${token}`;
  }
  if (typeof window !== 'undefined') {
    try {
      const uStr = localStorage.getItem('dakshora_superadmin_user');
      if (uStr) {
        const u = JSON.parse(uStr);
        const org = u?.organizationId || u?.organization_id;
        if (org) authHeaders['x-organization-id'] = org;
      }
    } catch {}
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...authHeaders,
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: defaultHeaders,
    });

    const latencyMs = Math.round(performance.now() - startTime);
    let jsonData: ApiResponse<T>;
    try {
      jsonData = await response.clone().json();
    } catch {
      let decodedJson: any = null;
      if (typeof DecompressionStream !== 'undefined') {
        for (const enc of ['gzip', 'deflate']) {
          try {
            const ds = new DecompressionStream(enc as any);
            const stream = response.clone().body?.pipeThrough(ds);
            if (stream) {
              const text = await new Response(stream).text();
              decodedJson = JSON.parse(text);
              break;
            }
          } catch {}
        }
      }
      if (decodedJson) {
        jsonData = decodedJson;
      } else {
        jsonData = {
          success: response.ok,
          message: response.ok ? 'OK' : `HTTP ${response.status}`,
        };
      }
    }

    return {
      data: jsonData,
      status: response.status,
      latencyMs,
    };
  } catch (err: any) {
    // Self-healing fallback: If a custom baseUrl failed with network error, attempt relative cloud proxy retry
    if (baseUrl !== '' && typeof window !== 'undefined') {
      try {
        const fallbackUrl = `${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        const fallbackResponse = await fetch(fallbackUrl, {
          ...options,
          headers: defaultHeaders,
        });
        const latencyMs = Math.round(performance.now() - startTime);
        let fallbackJson: ApiResponse<T>;
        try {
          fallbackJson = await fallbackResponse.clone().json();
        } catch {
          let decodedJson: any = null;
          if (typeof DecompressionStream !== 'undefined') {
            for (const enc of ['gzip', 'deflate']) {
              try {
                const ds = new DecompressionStream(enc as any);
                const stream = fallbackResponse.clone().body?.pipeThrough(ds);
                if (stream) {
                  const text = await new Response(stream).text();
                  decodedJson = JSON.parse(text);
                  break;
                }
              } catch {}
            }
          }
          if (decodedJson) {
            fallbackJson = decodedJson;
          } else {
            fallbackJson = {
              success: fallbackResponse.ok,
              message: fallbackResponse.ok ? 'OK' : `HTTP ${fallbackResponse.status}`,
            };
          }
        }
        // If the relative proxy succeeded, auto-heal localStorage
        if (fallbackResponse.ok) {
          localStorage.removeItem(STORAGE_KEY_BASE_URL);
        }
        return {
          data: fallbackJson,
          status: fallbackResponse.status,
          latencyMs,
        };
      } catch {
        // Fallback also failed, report original error
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);
    return {
      data: {
        success: false,
        message: 'Network error or backend is not reachable',
        error: err.message || 'Failed to fetch',
      },
      status: 0,
      latencyMs,
    };
  }
}

// 1. Health Checks
export async function checkBackendHealth() {
  return makeApiCall<{ message: string; status?: string }>('/health');
}

export async function checkSupabaseConnection() {
  return makeApiCall<{ message: string }>('/api/supabase-test');
}

// 2. Auth & SuperAdmin
export async function loginSuperAdmin(data: { email: string; password: string }) {
  return makeApiCall<any>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createSuperAdmin(data: { email: string; password: string; name?: string }) {
  return makeApiCall<any>('/api/auth/create-superadmin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createClientUser(data: {
  email: string;
  password: string;
  name?: string;
  role?: string;
  organization_name?: string;
}) {
  return makeApiCall<any>('/api/auth/create-client-user', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function sendAuthOtp(data: { phone: string; channel?: 'sms' | 'whatsapp' }) {
  return makeApiCall<{ message: string; channel: string; phone: string }>('/api/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyAuthOtp(data: { phone: string; otp: string; name?: string; role?: string }) {
  return makeApiCall<any>('/api/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function signInWithGoogle(data: { email?: string; name?: string; avatar?: string } = {}) {
  return makeApiCall<any>('/api/auth/oauth/google', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function signInWithApple(data: { email?: string; name?: string } = {}) {
  return makeApiCall<any>('/api/auth/oauth/apple', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchAuthProviders() {
  return makeApiCall<{ providers: any[] }>('/api/auth/providers');
}

export async function forgotPassword(data: { email?: string; phone?: string; identity?: string }) {
  return makeApiCall<{ message: string; channel?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resetPassword(data: { email?: string; phone?: string; identifier?: string; otp: string; newPassword: string }) {
  return makeApiCall<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function changeSuperAdminPassword(data: { email: string; currentPassword?: string; newPassword: string }) {
  return makeApiCall<{ message: string }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifySuperAdminOtp(data: { email: string; otp: string; tempToken?: string }) {
  return makeApiCall<any>('/api/auth/superadmin/verify-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function registerSchoolAccountSendOtp(data: {
  name: string;
  email: string;
  phone: string;
  schoolName: string;
  password: string;
  confirmPassword?: string;
}) {
  return makeApiCall<{ message: string; identifier?: string; expiresInSeconds?: number }>('/api/auth/register/send-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function registerSchoolAccount(data: {
  name: string;
  email: string;
  phone: string;
  schoolName: string;
  password: string;
  otp: string;
}) {
  return makeApiCall<any>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyToken() {
  return makeApiCall<{ user: any; pipeline: string }>('/api/auth/verify-token', {
    method: 'POST',
  });
}

// 2.1 Two-Factor Authentication (TOTP / MFA)
export async function enrollMfa() {
  return makeApiCall<{
    factorId: string;
    secret: string;
    qrCode: string;
    uri: string;
  }>('/api/auth/mfa/enroll', {
    method: 'POST',
  });
}

export async function verifyMfa(data: { factorId: string; code: string; tempToken?: string }) {
  return makeApiCall<any>('/api/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMfaStatus() {
  return makeApiCall<{
    mfaEnabled: boolean;
    factors: Array<{ id: string; factor_type: string; status: string; friendly_name?: string }>;
  }>('/api/auth/mfa/status');
}

export async function unenrollMfa(factorId?: string) {
  return makeApiCall<{ message: string }>('/api/auth/mfa/unenroll', {
    method: 'POST',
    body: JSON.stringify({ factorId }),
  });
}

export async function fetchUserProfile() {
  return makeApiCall<{ user: any }>('/api/auth/me');
}

export async function fetchAuthAdmins() {
  return makeApiCall<{ users: any[] }>('/api/auth/users');
}

export async function deleteAuthUser(id: string) {
  return makeApiCall<any>(`/api/auth/users/${id}`, {
    method: 'DELETE',
  });
}

// 3. Organizations Module
export async function fetchOrganizations() {
  return makeApiCall<{ organizations: OrganizationRecord[] }>('/api/organizations');
}

export async function createOrganization(data: { name: string; slug: string; plan?: string }) {
  return makeApiCall<{ organization: OrganizationRecord }>('/api/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOrganizationStatus(id: string, status: string) {
  return makeApiCall<{ success: boolean; message: string; organization: OrganizationRecord }>(`/api/admin/organizations/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}

export async function updateOrganizationDetails(id: string, data: Partial<OrganizationRecord> & { mrr_inr?: number }) {
  return makeApiCall<{ success: boolean; message: string; organization: OrganizationRecord }>(`/api/admin/organizations/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function archiveOrganization(id: string) {
  return makeApiCall<{ success: boolean; message: string; organization: OrganizationRecord }>(`/api/admin/organizations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { ...superAdminHeaders }
  });
}

export async function onboardSchoolInstitution(data: {
  schoolName: string;
  principalName: string;
  email: string;
  phone: string;
  board?: string;
  city?: string;
  state?: string;
  plan?: string;
  mrr?: number;
  notes?: string;
}) {
  return makeApiCall<{
    success: boolean;
    message: string;
    tenantId: string;
    organization: OrganizationRecord;
    credentials: {
      email: string;
      principalName: string;
      initialPassword: string;
      role: string;
      loginUrl: string;
    };
    website?: any;
    erpBootstrapped: boolean;
  }>('/api/admin/onboard-school', {
    method: 'POST',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function resendSchoolAdminAccess(data: {
  organizationId: string;
  email: string;
  principalName?: string;
  phone?: string;
  newPassword?: string;
}) {
  return makeApiCall<{
    success: boolean;
    message: string;
    credentials: { email: string; newPassword: string; loginUrl: string };
    authResetOk: boolean;
    notifications: { whatsappSent: boolean; smsSent: boolean; emailSent: boolean };
  }>('/api/admin/resend-access', {
    method: 'POST',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function fetchPublicSchoolCms(slug: string) {
  return makeApiCall<{
    success: boolean;
    school: any;
    website: any;
    pages: any[];
    notices: any[];
  }>(`/api/public/schools/${slug}/cms`);
}

// 4. Websites & CMS Module
export async function fetchWebsites() {
  return makeApiCall<{ websites: WebsiteRecord[] }>('/api/websites');
}

export async function createWebsite(data: { name: string; domain?: string; template?: string; organization_id?: string }) {
  return makeApiCall<{ website: WebsiteRecord }>('/api/websites', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchTemplates() {
  return makeApiCall<{ templates: TemplateRecord[] }>('/api/templates');
}

export async function fetchWebsiteCms(id: string) {
  return makeApiCall<{ tree: any }>(`/api/websites/${id}/cms`);
}

export async function updateWebsiteCms(id: string, tree: any) {
  return makeApiCall<{ tree: any }>(`/api/websites/${id}/cms`, {
    method: 'PUT',
    body: JSON.stringify(tree),
  });
}

export async function publishWebsite(id: string) {
  return makeApiCall<{ publishing: any }>(`/api/websites/${id}/publish`, {
    method: 'POST',
  });
}

export async function autoSynthesizeWebsiteCms(payload: {
  websiteId?: string;
  schoolName?: string;
  domain?: string;
  templateId?: string;
  themeColor?: string;
  logoUrl?: string;
  city?: string;
  principal?: any;
  director?: any;
  slides?: any[];
}) {
  return makeApiCall<{ success: boolean; message: string; pipeline: any[]; website: any; tree: any }>(
    '/api/websites/auto-synthesize',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

// 5. Leads & CRM Module
export async function fetchLeads() {
  return makeApiCall<{ leads: LeadRecord[] }>('/api/leads');
}

export async function captureLead(data: { name: string; email: string; phone?: string; source?: string; notes?: string; organization_id?: string }) {
  return makeApiCall<{ lead: LeadRecord }>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLeadStatus(id: string, data: { status: string; notes?: string }) {
  return makeApiCall<any>(`/api/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// 6. Media Library
export async function fetchMedia() {
  return makeApiCall<{ media: MediaRecord[] }>('/api/media');
}

export async function uploadMedia(data: { filename: string; url: string; mime_type?: string; size_bytes?: number }) {
  return makeApiCall<{ media: MediaRecord }>('/api/media', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 7. Analytics Service
export async function fetchAnalyticsOverview() {
  return makeApiCall<any>('/api/analytics/overview');
}

// 8. Billing, Subscriptions & Entitlements
export async function fetchBillingPlans() {
  return makeApiCall<{ plans: BillingPlan[]; intervals?: string[]; currency?: string }>('/api/billing/plans');
}

export async function fetchBillingInvoices() {
  return makeApiCall<{ invoices: InvoiceRecord[]; total?: number }>('/api/billing/invoices');
}

export async function fetchBillingInvoice(id: string) {
  return makeApiCall<{ invoice: InvoiceRecord }>(`/api/billing/invoices/${id}`);
}

export async function fetchSubscription() {
  return makeApiCall<{ subscription: SaasSubscription }>('/api/billing/subscription');
}

export async function fetchUsageMetrics() {
  return makeApiCall<SaasUsageMetrics>('/api/billing/usage');
}

export async function fetchEntitlements() {
  return makeApiCall<{ entitlements: SaasEntitlements }>('/api/billing/entitlements');
}

export async function changeSubscriptionPlan(data: { planId: string; interval?: string }) {
  return makeApiCall<{ subscription: SaasSubscription; invoice: InvoiceRecord; message: string }>('/api/billing/change-plan', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function cancelSubscription(data?: { reason?: string; cancelImmediately?: boolean }) {
  return makeApiCall<{ subscription: SaasSubscription; message: string }>('/api/billing/cancel', {
    method: 'POST',
    body: JSON.stringify(data || {})
  });
}

export async function renewSubscription(data?: { interval?: string }) {
  return makeApiCall<{ subscription: SaasSubscription; invoice: InvoiceRecord; message: string }>('/api/billing/renew', {
    method: 'POST',
    body: JSON.stringify(data || {})
  });
}

export async function createBillingCheckout(data: { planId: string; interval?: string }) {
  return makeApiCall<{ orderId: string; amountINR: number; planName: string; planId: string; keyId: string }>('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function verifyBillingPayment(data: { orderId: string; paymentId: string; signature: string; planId?: string }) {
  return makeApiCall<{ message: string; paymentId: string; orderId: string }>('/api/billing/verify-payment', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function fetchBillingOverrides() {
  return makeApiCall<{ overrides: SaasEntitlementOverride[] }>('/api/billing/overrides');
}

export async function saveBillingOverride(data: { feature_key: string; override_type: 'limit' | 'feature'; value: any; reason?: string }) {
  return makeApiCall<{ override: SaasEntitlementOverride; message: string }>('/api/billing/overrides', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function deleteBillingOverride(id: string) {
  return makeApiCall<{ message: string }>(`/api/billing/overrides/${id}`, {
    method: 'DELETE'
  });
}

// 9. Audit Logs
export async function fetchAuditLogs() {
  return makeApiCall<{ logs: AuditLogRecord[] }>('/api/audit-logs');
}

// 10. DAKSHORA AI Engine
export async function sendDakshoraAiChat(data: { message: string; persona?: string; history?: any[] }) {
  try {
    const res = await makeApiCall<{ success: boolean; answer?: string; message?: string }>('/api/dakshora-ai', {
      method: 'POST',
      body: JSON.stringify({ message: data.message, persona: data.persona, messages: data.history }),
    });
    if (res.data && (res.data.answer || res.data.message)) {
      return {
        data: {
          success: true,
          message: res.data.answer || res.data.message || '',
          persona: data.persona || 'school_advisor',
          timestamp: new Date().toISOString(),
        },
        status: res.status,
        latencyMs: res.latencyMs,
      };
    }
  } catch {
    // Graceful fallback to backend /api/ai/chat
  }

  return makeApiCall<{ message: string; persona: string; timestamp: string }>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 11. School & Student Management ERP
export async function fetchSchoolStudents() {
  return makeApiCall<{ students: any[] }>('/api/school/students');
}

export async function enrollStudent(data: { name: string; grade: string; parentName?: string; phone?: string }) {
  return makeApiCall<{ student: any }>('/api/school/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchSchoolNotices() {
  return makeApiCall<{ notices: any[] }>('/api/school/notices');
}

export async function broadcastSchoolNotice(data: { title: string; category?: string; target?: string }) {
  return makeApiCall<{ notice: any }>('/api/school/notices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =========================================================================
// 🏫 DAKSHORA 2.0 FULL SCHOOL ERP 13-MODULE API CALLS
// =========================================================================

// 1. Students (Production SaaS Grade)
export interface StudentQueryParams {
  query?: string;
  search?: string;
  grade?: string;
  section?: string;
  gender?: string;
  status?: string;
  session?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  organization_id?: string;
}

export async function fetchErpStudents(options?: StudentQueryParams | string) {
  const queryParams = new URLSearchParams();
  if (typeof options === 'string') {
    if (options) queryParams.append('search', options);
  } else if (options) {
    if (options.query || options.search) queryParams.append('search', options.search || options.query || '');
    if (options.grade) queryParams.append('grade', options.grade);
    if (options.section) queryParams.append('section', options.section);
    if (options.gender) queryParams.append('gender', options.gender);
    if (options.status) queryParams.append('status', options.status);
    if (options.session) queryParams.append('session', options.session);
    if (options.sortBy) queryParams.append('sortBy', options.sortBy);
    if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.organization_id) queryParams.append('organization_id', options.organization_id);
  }
  const qs = queryParams.toString();
  return makeApiCall<StudentListResponse>(`/api/erp/students${qs ? `?${qs}` : ''}`);
}

export async function fetchErpStudentById(id: string) {
  return makeApiCall<{ student: ErpStudentRecord }>(`/api/erp/students/${id}`);
}

export async function fetchErpStudentProfile(id: string) {
  return makeApiCall<ErpStudentProfile>(`/api/erp/students/${id}/profile`);
}

export async function createErpStudent(data: Partial<ErpStudentRecord>) {
  return makeApiCall<{ student: ErpStudentRecord; message: string }>('/api/erp/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateErpStudent(id: string, data: Partial<ErpStudentRecord>) {
  return makeApiCall<{ student: ErpStudentRecord; message: string }>(`/api/erp/students/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteErpStudent(id: string, hard = false) {
  return makeApiCall<{ student: ErpStudentRecord; message: string }>(`/api/erp/students/${id}${hard ? '?hard=true' : ''}`, {
    method: 'DELETE',
  });
}

export async function importErpStudents(students: any[], dryRun = false) {
  return makeApiCall<StudentImportResult>('/api/erp/students/import', {
    method: 'POST',
    body: JSON.stringify({ students, dryRun }),
  });
}

export function getErpStudentExportUrl(filters?: Partial<StudentQueryParams>, format: 'csv' | 'json' = 'csv') {
  const queryParams = new URLSearchParams();
  queryParams.append('format', format);
  if (filters?.query || filters?.search) queryParams.append('search', filters.search || filters.query || '');
  if (filters?.grade && filters.grade !== 'all') queryParams.append('grade', filters.grade);
  if (filters?.section && filters.section !== 'all') queryParams.append('section', filters.section);
  if (filters?.gender && filters.gender !== 'all') queryParams.append('gender', filters.gender);
  if (filters?.status && filters.status !== 'all') queryParams.append('status', filters.status);
  if (filters?.session && filters.session !== 'all') queryParams.append('session', filters.session);
  if (filters?.organization_id) queryParams.append('organization_id', filters.organization_id);
  const baseUrl = getBackendBaseUrl();
  return `${baseUrl}/api/erp/students/export?${queryParams.toString()}`;
}

// 2. Staff & Faculty (Production SaaS Grade)
export interface StaffQueryParams {
  query?: string;
  search?: string;
  staffType?: string;
  designation?: string;
  department?: string;
  status?: string;
  gender?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  organization_id?: string;
}

export async function fetchErpStaff(options?: StaffQueryParams | { department?: string; organization_id?: string }) {
  const queryParams = new URLSearchParams();
  if (options) {
    if ('search' in options && options.search) queryParams.append('search', options.search);
    else if ('query' in options && options.query) queryParams.append('search', options.query);
    if ('staffType' in options && options.staffType) queryParams.append('staffType', options.staffType);
    if ('designation' in options && options.designation) queryParams.append('designation', options.designation);
    if (options.department) queryParams.append('department', options.department);
    if ('status' in options && options.status) queryParams.append('status', options.status);
    if ('gender' in options && options.gender) queryParams.append('gender', options.gender);
    if ('sortBy' in options && options.sortBy) queryParams.append('sortBy', options.sortBy);
    if ('sortOrder' in options && options.sortOrder) queryParams.append('sortOrder', options.sortOrder);
    if ('page' in options && options.page) queryParams.append('page', options.page.toString());
    if ('limit' in options && options.limit) queryParams.append('limit', options.limit.toString());
    if (options.organization_id) queryParams.append('organization_id', options.organization_id);
  }
  const qs = queryParams.toString();
  return makeApiCall<StaffListResponse>(`/api/erp/staff${qs ? `?${qs}` : ''}`);
}

export async function fetchErpStaffById(id: string) {
  return makeApiCall<{ staff: ErpStaffRecord }>(`/api/erp/staff/${id}`);
}

export async function fetchErpStaffProfile(id: string) {
  return makeApiCall<ErpStaffProfile>(`/api/erp/staff/${id}/profile`);
}

export async function createErpStaff(data: Partial<ErpStaffRecord>) {
  return makeApiCall<{ staff: ErpStaffRecord; message: string }>('/api/erp/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateErpStaff(id: string, data: Partial<ErpStaffRecord>) {
  return makeApiCall<{ staff: ErpStaffRecord; message: string }>(`/api/erp/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deactivateErpStaff(id: string) {
  return makeApiCall<{ staff: ErpStaffRecord; message: string }>(`/api/erp/staff/${id}/deactivate`, {
    method: 'POST',
  });
}

export async function deleteErpStaff(id: string, hard = false) {
  return makeApiCall<{ staff: ErpStaffRecord; message: string }>(`/api/erp/staff/${id}${hard ? '?hard=true' : ''}`, {
    method: 'DELETE',
  });
}

export async function fetchTeacherAssignments(staffId: string) {
  return makeApiCall<{ assignments: TeacherAssignmentRecord[] }>(`/api/erp/staff/${staffId}/assignments`);
}

export async function createTeacherAssignment(staffId: string, assignment: { academicSession?: string; grade: string; section: string; subject: string }) {
  return makeApiCall<{ assignment: TeacherAssignmentRecord; message: string }>(`/api/erp/staff/${staffId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(assignment),
  });
}

export async function deleteTeacherAssignment(staffId: string, assignmentId: string) {
  return makeApiCall<{ message: string }>(`/api/erp/staff/${staffId}/assignments/${assignmentId}`, {
    method: 'DELETE',
  });
}

export async function importErpStaff(staff: any[], dryRun = false) {
  return makeApiCall<StaffImportResult>('/api/erp/staff/import', {
    method: 'POST',
    body: JSON.stringify({ staff, dryRun }),
  });
}

export function getErpStaffExportUrl(filters?: Partial<StaffQueryParams>, format: 'csv' | 'json' = 'csv') {
  const queryParams = new URLSearchParams();
  queryParams.append('format', format);
  if (filters?.query || filters?.search) queryParams.append('search', filters.search || filters.query || '');
  if (filters?.staffType && filters.staffType !== 'all') queryParams.append('staffType', filters.staffType);
  if (filters?.designation && filters.designation !== 'all') queryParams.append('designation', filters.designation);
  if (filters?.department && filters.department !== 'all') queryParams.append('department', filters.department);
  if (filters?.status && filters.status !== 'all') queryParams.append('status', filters.status);
  if (filters?.gender && filters.gender !== 'all') queryParams.append('gender', filters.gender);
  if (filters?.organization_id) queryParams.append('organization_id', filters.organization_id);
  const baseUrl = getBackendBaseUrl();
  return `${baseUrl}/api/erp/staff/export?${queryParams.toString()}`;
}

// 2.5. Live School ERP Dashboard (Production SaaS Real Database Aggregations)
export async function fetchLiveErpDashboard(params?: {
  date?: string;
  session?: string;
  range?: number;
  organization_id?: string;
  role?: string;
  staffId?: string;
}) {
  const q = new URLSearchParams();
  if (params?.date) q.append('date', params.date);
  if (params?.session) q.append('session', params.session);
  if (params?.range) q.append('range', String(params.range));
  if (params?.organization_id) q.append('organization_id', params.organization_id);

  const headers: Record<string, string> = {};
  if (params?.role) headers['x-role'] = params.role;
  if (params?.staffId) headers['x-staff-id'] = params.staffId;

  return makeApiCall<LiveErpDashboardData>(`/api/erp/dashboard?${q.toString()}`, {
    headers
  });
}

// 3. Attendance REST API Suite (Production SaaS Grade)
export async function fetchErpAttendanceDashboard(date?: string) {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  return makeApiCall<AttendanceDashboardSummary>(`/api/erp/attendance/dashboard${qs}`);
}

export async function fetchStudentAttendanceRegister(params: { date: string; grade: string; section: string; session?: string }) {
  const q = new URLSearchParams();
  q.append('date', params.date);
  q.append('grade', params.grade);
  q.append('section', params.section);
  if (params.session) q.append('session', params.session);
  return makeApiCall<{
    success: boolean;
    date: string;
    grade: string;
    section: string;
    session: string;
    isAlreadyMarked: boolean;
    markedBy?: string;
    markedAt?: string;
    totalStudents: number;
    students: StudentDailyAttendanceItem[];
  }>(`/api/erp/attendance/student?${q.toString()}`);
}

export async function saveStudentAttendanceBulk(payload: {
  date: string;
  grade: string;
  section: string;
  session?: string;
  records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>;
  role?: string;
  staffId?: string;
}) {
  const headers: Record<string, string> = {};
  if (payload.role) headers['x-role'] = payload.role;
  if (payload.staffId) headers['x-staff-id'] = payload.staffId;

  return makeApiCall<{
    success: boolean;
    message: string;
    totalCount: number;
    createdCount: number;
    updatedCount: number;
  }>('/api/erp/attendance/student/bulk', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
}

export async function updateStudentAttendanceRecord(id: string, data: { status: AttendanceStatus; remarks?: string }) {
  return makeApiCall<{ success: boolean; message: string; record: any }>(`/api/erp/attendance/student/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function fetchStudentMonthlyAttendance(params: {
  grade: string;
  section: string;
  month?: number;
  year?: number;
  session?: string;
}) {
  const q = new URLSearchParams();
  q.append('grade', params.grade);
  q.append('section', params.section);
  if (params.month) q.append('month', String(params.month));
  if (params.year) q.append('year', String(params.year));
  if (params.session) q.append('session', params.session);
  return makeApiCall<MonthlyAttendanceGridData>(`/api/erp/attendance/student/monthly?${q.toString()}`);
}

export async function fetchAttendanceReports(type: string, filters?: {
  threshold?: number;
  grade?: string;
  section?: string;
  startDate?: string;
  endDate?: string;
}) {
  const q = new URLSearchParams();
  q.append('type', type);
  if (filters?.threshold) q.append('threshold', String(filters.threshold));
  if (filters?.grade) q.append('grade', filters.grade);
  if (filters?.section) q.append('section', filters.section);
  if (filters?.startDate) q.append('startDate', filters.startDate);
  if (filters?.endDate) q.append('endDate', filters.endDate);
  return makeApiCall<any>(`/api/erp/attendance/student/reports?${q.toString()}`);
}

export async function fetchStaffAttendanceRegister(params?: { date?: string }) {
  const q = new URLSearchParams();
  if (params?.date) q.append('date', params.date);
  return makeApiCall<{
    success: boolean;
    date: string;
    isAlreadyMarked: boolean;
    totalStaff: number;
    staff: StaffDailyAttendanceItem[];
  }>(`/api/erp/attendance/staff?${q.toString()}`);
}

export async function saveStaffAttendanceBulk(payload: {
  date: string;
  records: Array<{ staffId: string; status: AttendanceStatus; remarks?: string }>;
}) {
  return makeApiCall<{ success: boolean; message: string; count: number }>('/api/erp/attendance/staff/bulk', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateStaffAttendanceRecord(id: string, data: { status: AttendanceStatus; remarks?: string }) {
  return makeApiCall<{ success: boolean; message: string; record: any }>(`/api/erp/attendance/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function fetchAttendanceSettings() {
  return makeApiCall<{ success: boolean; settings: AttendanceSettings }>('/api/erp/attendance/settings');
}

export async function updateAttendanceSettings(settings: Partial<AttendanceSettings>) {
  return makeApiCall<{ success: boolean; message: string; settings: AttendanceSettings }>('/api/erp/attendance/settings', {
    method: 'POST',
    body: JSON.stringify(settings)
  });
}

// Legacy compatibility functions
export async function fetchErpAttendance(gradeOrOptions?: string | { grade?: string; date?: string; session?: string; organization_id?: string }, date?: string) {
  const params = new URLSearchParams();
  if (typeof gradeOrOptions === 'string') {
    if (gradeOrOptions) params.append('grade', gradeOrOptions);
    if (date) params.append('date', date);
  } else if (gradeOrOptions) {
    if (gradeOrOptions.grade) params.append('grade', gradeOrOptions.grade);
    if (gradeOrOptions.date) params.append('date', gradeOrOptions.date);
    if (gradeOrOptions.session) params.append('session', gradeOrOptions.session);
    if (gradeOrOptions.organization_id) params.append('organization_id', gradeOrOptions.organization_id);
  }
  return makeApiCall<{ attendance: any[] }>(`/api/erp/attendance?${params.toString()}`);
}

export async function markErpAttendance(records: any[]) {
  return makeApiCall<{ success: boolean; count: number }>('/api/erp/attendance', {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

// 4. Academics Management Suite (Production SaaS Grade)

export async function fetchAcademicsOverview(organization_id?: string) {
  const qs = organization_id ? `?organization_id=${encodeURIComponent(organization_id)}` : '';
  return makeApiCall<AcademicsOverviewResponse>(`/api/erp/academics/overview${qs}`);
}

export async function fetchAcademicSessions(organization_id?: string) {
  const qs = organization_id ? `?organization_id=${encodeURIComponent(organization_id)}` : '';
  return makeApiCall<{ sessions: AcademicSessionRecord[] }>(`/api/erp/academics/sessions${qs}`);
}

export async function createAcademicSession(data: {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  status?: string;
}) {
  return makeApiCall<{ success: boolean; message: string; session: AcademicSessionRecord }>('/api/erp/academics/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAcademicSession(id: string, data: Partial<AcademicSessionRecord>) {
  return makeApiCall<{ success: boolean; message: string; session: AcademicSessionRecord }>(`/api/erp/academics/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function activateAcademicSession(id: string) {
  return makeApiCall<{ success: boolean; message: string; session: AcademicSessionRecord }>(`/api/erp/academics/sessions/${id}/activate`, {
    method: 'POST',
  });
}

export async function fetchAcademicClasses(organization_id?: string) {
  const qs = organization_id ? `?organization_id=${encodeURIComponent(organization_id)}` : '';
  return makeApiCall<{ classes: AcademicClassRecord[] }>(`/api/erp/academics/classes${qs}`);
}

export async function createAcademicClass(data: {
  grade: string;
  wing?: string;
  order?: number;
  status?: string;
}) {
  return makeApiCall<{ success: boolean; message: string; class: AcademicClassRecord }>('/api/erp/academics/classes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAcademicClass(id: string, data: Partial<AcademicClassRecord>) {
  return makeApiCall<{ success: boolean; message: string; class: AcademicClassRecord }>(`/api/erp/academics/classes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchAcademicSections(grade?: string, organization_id?: string) {
  const q = new URLSearchParams();
  if (grade && grade !== 'all') q.append('grade', grade);
  if (organization_id) q.append('organization_id', organization_id);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{ sections: AcademicSectionRecord[] }>(`/api/erp/academics/sections${qs}`);
}

export async function createAcademicSection(data: {
  grade: string;
  section: string;
  roomNumber?: string;
  capacity?: number;
  classTeacherId?: string | null;
}) {
  return makeApiCall<{ success: boolean; message: string; section: AcademicSectionRecord }>('/api/erp/academics/sections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAcademicSection(id: string, data: Partial<AcademicSectionRecord>) {
  return makeApiCall<{ success: boolean; message: string; section: AcademicSectionRecord }>(`/api/erp/academics/sections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function assignClassTeacher(sectionId: string, teacherId: string | null) {
  return makeApiCall<{ success: boolean; message: string; section: AcademicSectionRecord }>(`/api/erp/academics/sections/${sectionId}/class-teacher`, {
    method: 'POST',
    body: JSON.stringify({ teacherId }),
  });
}

export async function fetchAcademicSubjects(params?: { category?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.category && params.category !== 'all') q.append('category', params.category);
  if (params?.status && params.status !== 'all') q.append('status', params.status);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{ subjects: AcademicSubjectRecord[] }>(`/api/erp/academics/subjects${qs}`);
}

export async function createAcademicSubject(data: {
  name: string;
  code: string;
  category?: string;
  maxMarks?: number;
  passMarks?: number;
  status?: string;
}) {
  return makeApiCall<{ success: boolean; message: string; subject: AcademicSubjectRecord }>('/api/erp/academics/subjects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAcademicSubject(id: string, data: Partial<AcademicSubjectRecord>) {
  return makeApiCall<{ success: boolean; message: string; subject: AcademicSubjectRecord }>(`/api/erp/academics/subjects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchSectionSubjectMappings(params?: { grade?: string; section?: string; session?: string }) {
  const q = new URLSearchParams();
  if (params?.grade && params.grade !== 'all') q.append('grade', params.grade);
  if (params?.section && params.section !== 'all') q.append('section', params.section);
  if (params?.session && params.session !== 'all') q.append('session', params.session);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{ mappings: SectionSubjectMappingRecord[] }>(`/api/erp/academics/section-subjects${qs}`);
}

export async function assignSubjectToSection(data: {
  grade: string;
  section: string;
  subjectId: string;
  assignedTeacherId?: string | null;
  academicSession?: string;
}) {
  return makeApiCall<{ success: boolean; message: string; mapping: SectionSubjectMappingRecord }>('/api/erp/academics/section-subjects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeSubjectFromSection(id: string) {
  return makeApiCall<{ success: boolean; message: string; mapping: SectionSubjectMappingRecord }>(`/api/erp/academics/section-subjects/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchAcademicHomework(params?: {
  grade?: string;
  section?: string;
  subject?: string;
  status?: string;
  session?: string;
  teacherId?: string;
  role?: string;
  staffId?: string;
}) {
  const q = new URLSearchParams();
  if (params?.grade && params.grade !== 'all') q.append('grade', params.grade);
  if (params?.section && params.section !== 'all') q.append('section', params.section);
  if (params?.subject && params.subject !== 'all') q.append('subject', params.subject);
  if (params?.status && params.status !== 'all') q.append('status', params.status);
  if (params?.session && params.session !== 'all') q.append('session', params.session);
  if (params?.teacherId) q.append('teacherId', params.teacherId);

  const headers: Record<string, string> = {};
  if (params?.role) headers['x-role'] = params.role;
  if (params?.staffId) headers['x-staff-id'] = params.staffId;

  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{ homework: AcademicHomeworkRecord[] }>(`/api/erp/academics/homework${qs}`, {
    headers,
  });
}

export async function createAcademicHomework(data: {
  grade: string;
  section: string;
  subject: string;
  title: string;
  description?: string;
  assignedDate?: string;
  dueDate: string;
  teacherId?: string;
  teacherName?: string;
  academicSession?: string;
  role?: string;
  staffId?: string;
}) {
  const headers: Record<string, string> = {};
  if (data.role) headers['x-role'] = data.role;
  if (data.staffId) headers['x-staff-id'] = data.staffId;

  return makeApiCall<{ success: boolean; message: string; homework: AcademicHomeworkRecord }>('/api/erp/academics/homework', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
}

export async function updateAcademicHomework(id: string, data: {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: string;
}) {
  return makeApiCall<{ success: boolean; message: string; homework: AcademicHomeworkRecord }>(`/api/erp/academics/homework/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAcademicHomework(id: string) {
  return makeApiCall<{ success: boolean; message: string; homework: AcademicHomeworkRecord }>(`/api/erp/academics/homework/${id}`, {
    method: 'DELETE',
  });
}

// Legacy helper for compatibility
export async function fetchErpAcademics() {
  return makeApiCall<{ classes: any[] }>('/api/erp/academics');
}

// 5. Examination & Report Card Management
export async function fetchExamsOverview(session?: string) {
  const qs = session ? `?session=${encodeURIComponent(session)}` : '';
  return makeApiCall<{ overview: ExamsOverviewSummary; recentExams: ExamRecord[] }>(`/api/erp/exams/overview${qs}`);
}

export async function fetchExamsList(params?: {
  academicSession?: string;
  grade?: string;
  status?: string;
  search?: string;
}) {
  const q = new URLSearchParams();
  if (params?.academicSession) q.set('academicSession', params.academicSession);
  if (params?.grade) q.set('grade', params.grade);
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{ exams: ExamRecord[]; count: number }>(`/api/erp/exams${qs}`);
}

export async function fetchExamById(examId: string) {
  return makeApiCall<{ exam: ExamRecord }>(`/api/erp/exams/${encodeURIComponent(examId)}`);
}

export async function createExam(payload: Partial<ExamRecord>) {
  return makeApiCall<{ exam: ExamRecord }>('/api/erp/exams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateExam(examId: string, payload: Partial<ExamRecord>) {
  return makeApiCall<{ exam: ExamRecord }>(`/api/erp/exams/${encodeURIComponent(examId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function publishExamResults(examId: string) {
  return makeApiCall<{ exam: ExamRecord; recalculatedCount: number }>(
    `/api/erp/exams/${encodeURIComponent(examId)}/publish`,
    { method: 'POST' }
  );
}

export async function lockExamResults(examId: string) {
  return makeApiCall<{ exam: ExamRecord }>(
    `/api/erp/exams/${encodeURIComponent(examId)}/lock`,
    { method: 'POST' }
  );
}

export async function fetchExamSubjects(examId: string) {
  return makeApiCall<{ subjects: ExamSubjectRecord[] }>(
    `/api/erp/exams/${encodeURIComponent(examId)}/subjects`
  );
}

export async function addExamSubject(
  examId: string,
  payload: {
    subjectName: string;
    subjectCode?: string;
    maxMarks?: number;
    passMarks?: number;
    examDate?: string;
    assignedTeacherId?: string;
    assignedTeacherName?: string;
  }
) {
  return makeApiCall<{ subject: ExamSubjectRecord }>(
    `/api/erp/exams/${encodeURIComponent(examId)}/subjects`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteExamSubject(examId: string, subjectId: string) {
  return makeApiCall<{ success: boolean }>(
    `/api/erp/exams/${encodeURIComponent(examId)}/subjects/${encodeURIComponent(subjectId)}`,
    { method: 'DELETE' }
  );
}

export async function fetchExamMarksRoster(
  params: {
    examId: string;
    subjectId: string;
    grade?: string;
    section?: string;
  },
  headers?: Record<string, string>
) {
  const q = new URLSearchParams();
  q.set('examId', params.examId);
  q.set('subjectId', params.subjectId);
  if (params.grade) q.set('grade', params.grade);
  if (params.section) q.set('section', params.section);
  return makeApiCall<{
    exam: ExamRecord;
    subject: ExamSubjectRecord;
    isLocked: boolean;
    students: ExamMarkItem[];
  }>(`/api/erp/marks?${q.toString()}`, {
    headers,
  });
}

export async function saveExamMarksBulk(payload: BulkMarksSavePayload, headers?: Record<string, string>) {
  return makeApiCall<{
    savedCount: number;
    marks: any[];
    recalculatedResults: number;
  }>('/api/erp/marks/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers,
  });
}

export async function correctExamMark(payload: MarkCorrectionPayload, headers?: Record<string, string>) {
  return makeApiCall<{
    mark: any;
    auditLogId: string;
  }>('/api/erp/marks/correct', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers,
  });
}

export async function fetchClassExamResults(examId: string, grade?: string, section?: string) {
  const q = new URLSearchParams();
  if (grade) q.set('grade', grade);
  if (section) q.set('section', section);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{
    exam: ExamRecord;
    results: StudentExamResultRecord[];
    summary: {
      totalStudents: number;
      passed: number;
      failed: number;
      compartment: number;
      passPercentage: number;
      classAveragePct: number;
      highestPct: number;
      lowestPct: number;
    };
  }>(`/api/erp/results/exam/${encodeURIComponent(examId)}${qs}`);
}

export async function fetchStudentExamResult(studentId: string, examId?: string) {
  const qs = examId ? `?examId=${encodeURIComponent(examId)}` : '';
  return makeApiCall<{ results: StudentExamResultRecord[] }>(
    `/api/erp/results/student/${encodeURIComponent(studentId)}${qs}`
  );
}

export async function fetchStudentReportCard(examId: string, studentId: string) {
  return makeApiCall<ReportCardPayload>(
    `/api/erp/report-cards/${encodeURIComponent(examId)}/${encodeURIComponent(studentId)}`
  );
}

// Legacy helpers for backward compatibility
export async function fetchErpExams() {
  return makeApiCall<{ exams: any[] }>('/api/erp/exams');
}

export async function submitExamMarks(data: { examId: string; studentId: string; studentName: string; subjects: any[] }) {
  return makeApiCall<{ exam: any }>('/api/erp/exams/marks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 6. Fees & Finance Suite
export async function fetchErpFeeOverview() {
  return makeApiCall<{ overview: ErpFeeOverviewSummary }>('/api/erp/fees/overview');
}

export async function fetchErpFeeStructures(params?: { session?: string; grade?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.session) q.set('session', params.session);
  if (params?.grade) q.set('grade', params.grade);
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return makeApiCall<{ structures: ErpFeeStructure[]; count: number }>(`/api/erp/fees/structures${qs ? `?${qs}` : ''}`);
}

export async function createErpFeeStructure(payload: Partial<ErpFeeStructure>) {
  return makeApiCall<{ structure: ErpFeeStructure }>('/api/erp/fees/structures', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateErpFeeStructure(id: string, payload: Partial<ErpFeeStructure>) {
  return makeApiCall<{ structure: ErpFeeStructure }>(`/api/erp/fees/structures/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteErpFeeStructure(id: string) {
  return makeApiCall<{ message: string }>(`/api/erp/fees/structures/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchErpFeeDemands(params?: { session?: string; grade?: string; section?: string; status?: string; search?: string }) {
  const q = new URLSearchParams();
  if (params?.session) q.set('session', params.session);
  if (params?.grade) q.set('grade', params.grade);
  if (params?.section) q.set('section', params.section);
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return makeApiCall<{ demands: ErpFeeDemand[]; count: number }>(`/api/erp/fees/demands${qs ? `?${qs}` : ''}`);
}

export async function generateErpFeeDemands(payload: { session?: string; grade: string; section?: string; feeStructureId: string; dueDate?: string }) {
  return makeApiCall<{ count: number; demands: ErpFeeDemand[] }>('/api/erp/fees/demands/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchStudentFeeAccount(studentId: string) {
  return makeApiCall<{
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
  }>(`/api/erp/fees/students/${studentId}/account`);
}

export async function collectErpFeePayment(payload: {
  demandId: string;
  amountPaid: number;
  paymentMode: string;
  referenceNumber?: string;
  collectedBy?: string;
  remarks?: string;
}) {
  return makeApiCall<{ receiptNo: string; payment: ErpFeePayment; demand: ErpFeeDemand }>('/api/erp/fees/collect', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function reverseErpFeePayment(id: string, reason: string, reversedBy?: string) {
  return makeApiCall<{ reversal: ErpPaymentReversal; payment: ErpFeePayment; demand: ErpFeeDemand }>(`/api/erp/fees/payments/${id}/reverse`, {
    method: 'POST',
    body: JSON.stringify({ reason, reversedBy }),
  });
}

export async function fetchErpFeeReceipt(receiptNo: string) {
  return makeApiCall<{ receipt: ErpPrintableReceipt }>(`/api/erp/fees/receipts/${encodeURIComponent(receiptNo)}`);
}

export async function fetchErpFeeCollectionReport(params?: { startDate?: string; endDate?: string; paymentMode?: string }) {
  const q = new URLSearchParams();
  if (params?.startDate) q.set('startDate', params.startDate);
  if (params?.endDate) q.set('endDate', params.endDate);
  if (params?.paymentMode) q.set('paymentMode', params.paymentMode);
  const qs = q.toString();
  return makeApiCall<{ totalCollected: number; count: number; payments: ErpFeePayment[] }>(`/api/erp/fees/reports/collection${qs ? `?${qs}` : ''}`);
}

export async function fetchErpFeeOutstandingReport(params?: { grade?: string; aging?: string }) {
  const q = new URLSearchParams();
  if (params?.grade) q.set('grade', params.grade);
  if (params?.aging) q.set('aging', params.aging);
  const qs = q.toString();
  return makeApiCall<{ totalOutstanding: number; count: number; demands: ErpFeeDemand[] }>(`/api/erp/fees/reports/outstanding${qs ? `?${qs}` : ''}`);
}

export async function fetchErpClassFeeSummary() {
  return makeApiCall<{ summary: ErpClassFeeSummary[] }>('/api/erp/fees/reports/class-summary');
}

export async function fetchErpFeeReversals() {
  return makeApiCall<{ reversals: ErpPaymentReversal[]; count: number }>('/api/erp/fees/reversals');
}

// Legacy compatibility functions
export async function fetchErpFees() {
  return makeApiCall<{ invoices: any[]; summary: any }>('/api/erp/fees');
}

export async function collectFeePayment(invoiceId: string, paymentMethod: string) {
  return makeApiCall<{ invoice: any }>('/api/erp/fees/pay', {
    method: 'POST',
    body: JSON.stringify({ invoiceId, paymentMethod }),
  });
}

// 7. Admissions & CRM Integration
export async function fetchErpAdmissionsOverview(session?: string) {
  const q = session ? `?session=${encodeURIComponent(session)}` : '';
  return makeApiCall<{ overview: ErpAdmissionOverview }>(`/api/erp/admissions/overview${q}`);
}

export async function fetchErpAdmissions(params?: { session?: string; grade?: string; status?: string; source?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.session) query.append('session', params.session);
  if (params?.grade && params.grade !== 'all') query.append('grade', params.grade);
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.source && params.source !== 'all') query.append('source', params.source);
  if (params?.search) query.append('search', params.search);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{ count: number; total: number; admissions: ErpAdmissionApplication[] }>(`/api/erp/admissions${qStr}`);
}

export async function fetchErpAdmissionById(id: string) {
  return makeApiCall<{
    admission: ErpAdmissionApplication;
    documents: ErpAdmissionDocument[];
    notes: ErpAdmissionNote[];
    timeline: ErpAdmissionTimelineEvent[];
    lead?: any;
    student?: any;
    feeDemand?: any;
  }>(`/api/erp/admissions/${encodeURIComponent(id)}`);
}

export async function createErpAdmission(data: Partial<ErpAdmissionApplication>) {
  return makeApiCall<{ admission: ErpAdmissionApplication }>('/api/erp/admissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateErpAdmission(id: string, data: Partial<ErpAdmissionApplication>) {
  return makeApiCall<{ admission: ErpAdmissionApplication }>(`/api/erp/admissions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateAdmissionStatus(id: string, status: string, reason?: string) {
  return makeApiCall<{ admission: ErpAdmissionApplication }>(`/api/erp/admissions/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, reason, id }),
  });
}

export async function uploadErpAdmissionDocument(admissionId: string, data: { documentType: string; documentName: string; fileUrl?: string; uploadedBy?: string }) {
  return makeApiCall<{ document: ErpAdmissionDocument }>(`/api/erp/admissions/${encodeURIComponent(admissionId)}/documents`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyErpAdmissionDocument(admissionId: string, docId: string, data: { status: 'verified' | 'rejected' | 'pending'; rejectionReason?: string; verifiedBy?: string }) {
  return makeApiCall<{ document: ErpAdmissionDocument }>(`/api/erp/admissions/${encodeURIComponent(admissionId)}/documents/${encodeURIComponent(docId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function addErpAdmissionNote(admissionId: string, data: { content: string; authorName?: string; authorRole?: string; noteType?: string; interviewScore?: number }) {
  return makeApiCall<{ note: ErpAdmissionNote }>(`/api/erp/admissions/${encodeURIComponent(admissionId)}/notes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchErpAdmissionTimeline(admissionId: string) {
  return makeApiCall<{ timeline: ErpAdmissionTimelineEvent[] }>(`/api/erp/admissions/${encodeURIComponent(admissionId)}/timeline`);
}

export async function checkErpAdmissionDuplicate(data: { studentName?: string; dob?: string; parentPhone?: string; admissionNo?: string }) {
  return makeApiCall<{ hasDuplicate: boolean; matchesCount: number; matches: ErpDuplicateStudentMatch[] }>('/api/erp/admissions/check-duplicate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function convertLeadToAdmission(leadId: string, data?: { appliedGrade?: string; academicSession?: string; dob?: string; gender?: string }) {
  return makeApiCall<{ admission: ErpAdmissionApplication }>(`/api/erp/leads/${encodeURIComponent(leadId)}/convert-to-admission`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  });
}

export async function confirmErpAdmission(id: string, payload?: ErpConfirmAdmissionPayload) {
  return makeApiCall<{
    message: string;
    student: any;
    parent: any;
    enrollment: any;
    feeDemand: any;
    application: ErpAdmissionApplication;
  }>(`/api/erp/admissions/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

// 8. Communication & Notification Management Suite (Production SaaS Grade)

export async function fetchErpCommunicationOverview() {
  return makeApiCall<{ overview: ErpCommunicationOverview }>('/api/erp/communication/overview');
}

export async function fetchErpNotices(params?: {
  category?: string;
  priority?: string;
  status?: string;
  audienceType?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'all') query.append('category', params.category);
  if (params?.priority && params.priority !== 'all') query.append('priority', params.priority);
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.audienceType && params.audienceType !== 'all') query.append('audienceType', params.audienceType);
  if (params?.search) query.append('search', params.search);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{ total: number; count: number; notices: ErpNotice[] }>(`/api/erp/communication/notices${qStr}`);
}

export async function fetchErpNoticeById(id: string) {
  return makeApiCall<{ notice: ErpNotice }>(`/api/erp/communication/notices/${encodeURIComponent(id)}`);
}

export async function createErpNotice(data: Partial<ErpNotice>) {
  return makeApiCall<{ notice: ErpNotice; message: string }>('/api/erp/communication/notices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateErpNotice(id: string, data: Partial<ErpNotice>) {
  return makeApiCall<{ notice: ErpNotice; message: string }>(`/api/erp/communication/notices/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function publishErpNotice(id: string) {
  return makeApiCall<{ notice: ErpNotice; message: string }>(`/api/erp/communication/notices/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  });
}

export async function archiveErpNotice(id: string) {
  return makeApiCall<{ notice: ErpNotice; message: string }>(`/api/erp/communication/notices/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  });
}

export async function previewErpAudience(data: { audienceType: string; audienceFilter?: any }) {
  return makeApiCall<ErpAudiencePreviewResult>('/api/erp/communication/audience/preview', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchErpMessages(params?: { status?: string; channel?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.channel && params.channel !== 'all') query.append('channel', params.channel);
  if (params?.search) query.append('search', params.search);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{ total: number; count: number; messages: ErpCommunicationMessage[] }>(`/api/erp/communication/messages${qStr}`);
}

export async function sendErpMessage(data: Partial<ErpCommunicationMessage>) {
  return makeApiCall<{ success: boolean; message: string; messageRecord: ErpCommunicationMessage; recipientCount: number }>('/api/erp/communication/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchErpMessageById(id: string) {
  return makeApiCall<{ message: ErpCommunicationMessage; stats: any; deliveries: ErpMessageDelivery[] }>(`/api/erp/communication/messages/${encodeURIComponent(id)}`);
}

export async function sendErpScheduledMessageImmediately(id: string) {
  return makeApiCall<{ success: boolean; message: string; messageRecord: ErpCommunicationMessage }>(`/api/erp/communication/messages/${encodeURIComponent(id)}/send`, {
    method: 'POST',
  });
}

export async function cancelErpScheduledMessage(id: string) {
  return makeApiCall<{ success: boolean; message: string; messageRecord: ErpCommunicationMessage }>(`/api/erp/communication/messages/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
  });
}

export async function fetchErpTemplates(params?: { category?: string; channel?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'all') query.append('category', params.category);
  if (params?.channel && params.channel !== 'all') query.append('channel', params.channel);
  if (params?.search) query.append('search', params.search);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{ total: number; templates: ErpMessageTemplate[] }>(`/api/erp/communication/templates${qStr}`);
}

export async function fetchErpTemplateById(id: string) {
  return makeApiCall<{ template: ErpMessageTemplate }>(`/api/erp/communication/templates/${encodeURIComponent(id)}`);
}

export async function createErpTemplate(data: Partial<ErpMessageTemplate>) {
  return makeApiCall<{ template: ErpMessageTemplate; message: string }>('/api/erp/communication/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateErpTemplate(id: string, data: Partial<ErpMessageTemplate>) {
  return makeApiCall<{ template: ErpMessageTemplate; message: string }>(`/api/erp/communication/templates/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function previewErpTemplate(id: string, variables?: Record<string, string>) {
  return makeApiCall<{
    template: ErpMessageTemplate;
    sampleVariables: any;
    renderedSubject: string;
    renderedBody: string;
  }>(`/api/erp/communication/templates/${encodeURIComponent(id)}/preview`, {
    method: 'POST',
    body: JSON.stringify({ variables: variables || {} }),
  });
}

export async function fetchErpScheduledMessages() {
  return makeApiCall<{ count: number; scheduled: ErpCommunicationMessage[] }>('/api/erp/communication/scheduled');
}

export async function fetchErpDeliveryLogs(params?: { status?: string; channel?: string; messageId?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.channel && params.channel !== 'all') query.append('channel', params.channel);
  if (params?.messageId) query.append('messageId', params.messageId);
  if (params?.search) query.append('search', params.search);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{ total: number; count: number; deliveries: ErpMessageDelivery[] }>(`/api/erp/communication/delivery-logs${qStr}`);
}

export async function fetchErpNotifications(params?: { status?: string; role?: string; type?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.role) query.append('role', params.role);
  if (params?.type && params.type !== 'all') query.append('type', params.type);
  if (params?.limit) query.append('limit', String(params.limit));
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{ total: number; unreadCount: number; count: number; notifications: ErpInAppNotification[] }>(`/api/erp/communication/notifications${qStr}`);
}

export async function markErpNotificationRead(id: string) {
  return makeApiCall<{ success: boolean; notification: ErpInAppNotification; unreadCount: number }>(`/api/erp/communication/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
  });
}

export async function markAllErpNotificationsRead() {
  return makeApiCall<{ success: boolean; markedCount: number; unreadCount: number }>('/api/erp/communication/notifications/read-all', {
    method: 'POST',
  });
}

export async function fetchErpCommunicationSettings() {
  return makeApiCall<{ settings: ErpCommunicationSettings }>('/api/erp/communication/settings');
}

export async function updateErpCommunicationSettings(settings: Partial<ErpCommunicationSettings>) {
  return makeApiCall<{ success: boolean; message: string; settings: ErpCommunicationSettings }>('/api/erp/communication/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function fetchErpCommunicationPreferences() {
  return makeApiCall<{ preferences: ErpCommunicationPreferences }>('/api/erp/communication/preferences');
}

export async function updateErpCommunicationPreferences(preferences: Partial<ErpCommunicationPreferences>) {
  return makeApiCall<{ success: boolean; message: string; preferences: ErpCommunicationPreferences }>('/api/erp/communication/preferences', {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  });
}

export async function triggerErpCommunicationEvent(eventType: string, payload: any) {
  return makeApiCall<{ success: boolean; message: string; result: any }>('/api/erp/communication/events/trigger', {
    method: 'POST',
    body: JSON.stringify({ eventType, payload }),
  });
}

// Legacy compatibility functions
export async function fetchErpCommunication() {
  return makeApiCall<{ notices: any[] }>('/api/erp/communication');
}

export async function broadcastErpNotice(data: any) {
  return makeApiCall<{ notice: any }>('/api/erp/communication', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 9. Transport
export async function fetchErpTransport() {
  return makeApiCall<{ routes: any[] }>('/api/erp/transport');
}

// =========================================================================
// 10. ENTERPRISE LIBRARY MANAGEMENT APIS
// =========================================================================

export async function fetchErpLibraryOverview() {
  return makeApiCall<ErpLibraryOverview>('/api/erp/library/overview');
}

export async function fetchErpLibraryBooks(params: {
  search?: string;
  category?: string;
  status?: string;
  availability?: string;
  page?: number;
  limit?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.status) query.set('status', params.status);
  if (params.availability) query.set('availability', params.availability);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  const qs = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{ books: ErpLibraryBook[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
    `/api/erp/library/books${qs}`
  );
}

export async function fetchErpLibraryBook(id: string) {
  return makeApiCall<{ book: ErpLibraryBook }>(`/api/erp/library/books/${encodeURIComponent(id)}`);
}

export async function createErpLibraryBook(bookData: Partial<ErpLibraryBook> & { copiesCount?: number; acquisitionCost?: number }) {
  return makeApiCall<{ book: ErpLibraryBook; copies: ErpLibraryBookCopy[] }>('/api/erp/library/books', {
    method: 'POST',
    body: JSON.stringify(bookData),
  });
}

export async function updateErpLibraryBook(id: string, updates: Partial<ErpLibraryBook>) {
  return makeApiCall<{ book: ErpLibraryBook }>(`/api/erp/library/books/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function archiveErpLibraryBook(id: string) {
  return makeApiCall<{ book: ErpLibraryBook }>(`/api/erp/library/books/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function fetchErpLibraryBookCopies(bookId: string) {
  return makeApiCall<{ copies: ErpLibraryBookCopy[] }>(`/api/erp/library/books/${encodeURIComponent(bookId)}/copies`);
}

export async function createErpLibraryBookCopy(bookId: string, copyData: Partial<ErpLibraryBookCopy>) {
  return makeApiCall<{ copy: ErpLibraryBookCopy; book: ErpLibraryBook }>(
    `/api/erp/library/books/${encodeURIComponent(bookId)}/copies`,
    {
      method: 'POST',
      body: JSON.stringify(copyData),
    }
  );
}

export async function updateErpLibraryBookCopy(copyId: string, updates: Partial<ErpLibraryBookCopy>) {
  return makeApiCall<{ copy: ErpLibraryBookCopy }>(`/api/erp/library/copies/${encodeURIComponent(copyId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function fetchErpLibraryCategories() {
  return makeApiCall<{ categories: ErpLibraryCategory[] }>('/api/erp/library/categories');
}

export async function createErpLibraryCategory(data: { name: string; code: string; description?: string }) {
  return makeApiCall<{ category: ErpLibraryCategory }>('/api/erp/library/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateErpLibraryCategory(id: string, data: Partial<ErpLibraryCategory>) {
  return makeApiCall<{ category: ErpLibraryCategory }>(`/api/erp/library/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchErpLibraryAuthors() {
  return makeApiCall<{ authors: ErpLibraryAuthor[] }>('/api/erp/library/authors');
}

export async function createErpLibraryAuthor(data: { name: string; biography?: string }) {
  return makeApiCall<{ author: ErpLibraryAuthor }>('/api/erp/library/authors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchErpLibraryPublishers() {
  return makeApiCall<{ publishers: ErpLibraryPublisher[] }>('/api/erp/library/publishers');
}

export async function createErpLibraryPublisher(data: { name: string; contactEmail?: string; website?: string }) {
  return makeApiCall<{ publisher: ErpLibraryPublisher }>('/api/erp/library/publishers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchErpLibraryMembers(params: { search?: string; type?: string } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.type) query.set('type', params.type);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{ members: ErpLibraryMember[]; total: number }>(`/api/erp/library/members${qs}`);
}

export async function fetchErpLibraryMember(id: string, type: 'student' | 'staff' = 'student') {
  return makeApiCall<{ member: ErpLibraryMember }>(`/api/erp/library/members/${encodeURIComponent(id)}?type=${type}`);
}

export async function issueErpLibraryBook(payload: {
  memberType: 'student' | 'staff' | 'teacher';
  memberId: string;
  bookId?: string;
  bookCopyId?: string;
  dueDate?: string;
  remarks?: string;
}) {
  return makeApiCall<{
    transaction: ErpLibraryTransaction;
    copy: ErpLibraryBookCopy;
    book: ErpLibraryBook;
  }>('/api/erp/library/transactions/issue', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function returnErpLibraryBook(
  transactionId: string,
  payload: { condition?: string; remarks?: string; finePaid?: boolean } = {}
) {
  return makeApiCall<{
    transaction: ErpLibraryTransaction;
    copy: ErpLibraryBookCopy;
    fine?: ErpLibraryFine | null;
    reservationFulfilled?: ErpLibraryReservation | null;
  }>(`/api/erp/library/transactions/${encodeURIComponent(transactionId)}/return`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function renewErpLibraryBook(transactionId: string, additionalDays?: number) {
  return makeApiCall<{ transaction: ErpLibraryTransaction }>(
    `/api/erp/library/transactions/${encodeURIComponent(transactionId)}/renew`,
    {
      method: 'POST',
      body: JSON.stringify({ additionalDays }),
    }
  );
}

export async function fetchErpLibraryTransactions(params: {
  status?: string;
  memberId?: string;
  bookId?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.memberId) query.set('memberId', params.memberId);
  if (params.bookId) query.set('bookId', params.bookId);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  const qs = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{
    transactions: ErpLibraryTransaction[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>(`/api/erp/library/transactions${qs}`);
}

export async function fetchErpLibraryReservations(params: { status?: string; bookId?: string; memberId?: string } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.bookId) query.set('bookId', params.bookId);
  if (params.memberId) query.set('memberId', params.memberId);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{ reservations: ErpLibraryReservation[]; total: number }>(`/api/erp/library/reservations${qs}`);
}

export async function createErpLibraryReservation(payload: {
  bookId: string;
  memberType: 'student' | 'staff' | 'teacher';
  memberId: string;
}) {
  return makeApiCall<{ reservation: ErpLibraryReservation }>('/api/erp/library/reservations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelErpLibraryReservation(reservationId: string) {
  return makeApiCall<{ reservation: ErpLibraryReservation }>(
    `/api/erp/library/reservations/${encodeURIComponent(reservationId)}/cancel`,
    {
      method: 'POST',
    }
  );
}

export async function fetchErpLibraryFines(params: { status?: string; memberId?: string } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.memberId) query.set('memberId', params.memberId);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{
    fines: ErpLibraryFine[];
    summary: { totalOutstanding: number; totalCollected: number; totalWaived: number; count: number };
  }>(`/api/erp/library/fines${qs}`);
}

export async function payErpLibraryFine(fineId: string, payload: { paymentMethod?: string; notes?: string } = {}) {
  return makeApiCall<{ fine: ErpLibraryFine }>(`/api/erp/library/fines/${encodeURIComponent(fineId)}/pay`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function waiveErpLibraryFine(fineId: string, payload: { waivedBy?: string; reason?: string } = {}) {
  return makeApiCall<{ fine: ErpLibraryFine }>(`/api/erp/library/fines/${encodeURIComponent(fineId)}/waive`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchErpLibrarySettings() {
  return makeApiCall<{ settings: ErpLibrarySettings }>('/api/erp/library/settings');
}

export async function updateErpLibrarySettings(settings: Partial<ErpLibrarySettings>) {
  return makeApiCall<{ settings: ErpLibrarySettings }>('/api/erp/library/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function triggerErpLibraryDueReminders() {
  return makeApiCall<{ processedCount: number; remindersSent: number }>('/api/erp/library/reminders/due', {
    method: 'POST',
  });
}

export async function fetchErpLibraryReport(type: 'books' | 'issues' | 'overdue' | 'fines' | 'inventory' | 'popular') {
  return makeApiCall<any>(`/api/erp/library/reports/${type}`);
}

// Legacy Library Compatibility
export async function fetchErpLibrary() {
  return makeApiCall<{ books: any[] }>('/api/erp/library');
}

export async function issueLibraryBook(bookId: string, borrowerName: string, borrowerRole: string) {
  return makeApiCall<{ book: any }>('/api/erp/library/issue', {
    method: 'POST',
    body: JSON.stringify({ bookId, borrowerName, borrowerRole }),
  });
}

export async function returnLibraryBook(bookId: string, borrowerName: string) {
  return makeApiCall<{ book: any }>('/api/erp/library/return', {
    method: 'POST',
    body: JSON.stringify({ bookId, borrowerName }),
  });
}


// 11. HR & Payroll
export async function fetchErpPayroll() {
  return makeApiCall<{ payroll: any[]; totalDisbursed: number }>('/api/erp/payroll');
}

export async function processSalaryPayment(payrollId: string) {
  return makeApiCall<{ payroll: any }>('/api/erp/payroll/disburse', {
    method: 'POST',
    body: JSON.stringify({ payrollId }),
  });
}

// 12. Centralized Reports & Analytics API Suite
export async function fetchErpReports() {
  return makeApiCall<{ metrics: any }>('/api/erp/reports');
}

export async function fetchReportsOverview(session?: string, organization_id?: string) {
  const q = new URLSearchParams();
  if (session) q.append('session', session);
  if (organization_id) q.append('organization_id', organization_id);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<ErpReportsOverview>(`/api/erp/reports/overview${qs}`);
}

export async function fetchStudentsReport(params?: { className?: string; section?: string; gender?: string; status?: string; search?: string; session?: string; organization_id?: string }) {
  const q = new URLSearchParams();
  if (params?.className) q.append('className', params.className);
  if (params?.section) q.append('section', params.section);
  if (params?.gender) q.append('gender', params.gender);
  if (params?.status) q.append('status', params.status);
  if (params?.search) q.append('search', params.search);
  if (params?.session) q.append('session', params.session);
  if (params?.organization_id) q.append('organization_id', params.organization_id);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<ErpStudentReportData>(`/api/erp/reports/students${qs}`);
}

export async function fetchAttendanceReport(params?: { date?: string; className?: string; section?: string; threshold?: number; organization_id?: string }) {
  const q = new URLSearchParams();
  if (params?.date) q.append('date', params.date);
  if (params?.className) q.append('className', params.className);
  if (params?.section) q.append('section', params.section);
  if (params?.threshold) q.append('threshold', String(params.threshold));
  if (params?.organization_id) q.append('organization_id', params.organization_id);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<ErpAttendanceReportData>(`/api/erp/reports/attendance${qs}`);
}

export async function fetchAcademicsReport(session?: string, organization_id?: string) {
  const q = new URLSearchParams();
  if (session) q.append('session', session);
  if (organization_id) q.append('organization_id', organization_id);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<ErpAcademicsReportData>(`/api/erp/reports/academics${qs}`);
}

export async function fetchExamsReport(params?: { examId?: string; className?: string; organization_id?: string }) {
  const q = new URLSearchParams();
  if (params?.examId) q.append('examId', params.examId);
  if (params?.className) q.append('className', params.className);
  if (params?.organization_id) q.append('organization_id', params.organization_id);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<ErpExamReportData>(`/api/erp/reports/exams${qs}`);
}

export async function fetchFeesReport(params?: { className?: string; status?: string; startDate?: string; endDate?: string; organization_id?: string }) {
  const q = new URLSearchParams();
  if (params?.className) q.append('className', params.className);
  if (params?.status) q.append('status', params.status);
  if (params?.startDate) q.append('startDate', params.startDate);
  if (params?.endDate) q.append('endDate', params.endDate);
  if (params?.organization_id) q.append('organization_id', params.organization_id);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<ErpFeesReportData>(`/api/erp/reports/fees${qs}`);
}

export async function fetchAdmissionsReport(params?: { session?: string; status?: string; source?: string; organization_id?: string }) {
  const q = new URLSearchParams();
  if (params?.session) q.append('session', params.session);
  if (params?.status) q.append('status', params.status);
  if (params?.source) q.append('source', params.source);
  if (params?.organization_id) q.append('organization_id', params.organization_id);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<ErpAdmissionReportData>(`/api/erp/reports/admissions${qs}`);
}

export async function fetchStaffReport(params?: { department?: string; staffType?: string; status?: string; organization_id?: string }) {
  const q = new URLSearchParams();
  if (params?.department) q.append('department', params.department);
  if (params?.staffType) q.append('staffType', params.staffType);
  if (params?.status) q.append('status', params.status);
  if (params?.organization_id) q.append('organization_id', params.organization_id);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<ErpStaffReportData>(`/api/erp/reports/staff${qs}`);
}

export async function fetchTransportReport(organization_id?: string) {
  const qs = organization_id ? `?organization_id=${encodeURIComponent(organization_id)}` : '';
  return makeApiCall<ErpTransportReportData>(`/api/erp/reports/transport${qs}`);
}

export async function fetchLibraryReport(organization_id?: string) {
  const qs = organization_id ? `?organization_id=${encodeURIComponent(organization_id)}` : '';
  return makeApiCall<ErpLibraryReportData>(`/api/erp/reports/library${qs}`);
}

export async function fetchCommunicationReport(organization_id?: string) {
  const qs = organization_id ? `?organization_id=${encodeURIComponent(organization_id)}` : '';
  return makeApiCall<ErpCommunicationReportData>(`/api/erp/reports/communication${qs}`);
}

export async function fetchAuditReport(params?: { action?: string; limit?: number; organization_id?: string }) {
  const q = new URLSearchParams();
  if (params?.action) q.append('action', params.action);
  if (params?.limit) q.append('limit', String(params.limit));
  if (params?.organization_id) q.append('organization_id', params.organization_id);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<ErpAuditReportData>(`/api/erp/reports/audit${qs}`);
}

export async function fetchReportPresets(reportType?: string, organization_id?: string) {
  const q = new URLSearchParams();
  if (reportType) q.append('reportType', reportType);
  if (organization_id) q.append('organization_id', organization_id);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{ success: boolean; presets: ErpReportPreset[] }>(`/api/erp/reports/presets${qs}`);
}

export async function saveReportPreset(data: { reportType: string; presetName: string; filters: any }, organization_id?: string) {
  const qs = organization_id ? `?organization_id=${encodeURIComponent(organization_id)}` : '';
  return makeApiCall<{ success: boolean; preset: ErpReportPreset }>(`/api/erp/reports/presets${qs}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function deleteReportPreset(id: string, organization_id?: string) {
  const qs = organization_id ? `?organization_id=${encodeURIComponent(organization_id)}` : '';
  return makeApiCall<{ success: boolean; message: string }>(`/api/erp/reports/presets/${id}${qs}`, {
    method: 'DELETE'
  });
}

export function getReportExportUrl(reportType: string, organization_id?: string): string {
  const baseUrl = getBackendBaseUrl();
  const q = new URLSearchParams();
  q.append('reportType', reportType);
  q.append('format', 'csv');
  if (organization_id) q.append('organization_id', organization_id);
  return `${baseUrl}/api/erp/reports/export?${q.toString()}`;
}

// 13. Dakshora AI for ERP (Conversational Assistive Layer)
export async function fetchErpAiStatus(role?: string, organization_id?: string) {
  const headers: Record<string, string> = {};
  if (role) headers['x-role'] = role;
  if (organization_id) headers['x-organization-id'] = organization_id;
  return makeApiCall<ErpAiStatusResponse>('/api/erp/ai/status', { headers });
}

export async function sendErpAiChat(data: {
  message: string;
  conversationId?: string;
  session?: string;
  role?: string;
  organization_id?: string;
}) {
  const headers: Record<string, string> = {};
  if (data.role) headers['x-role'] = data.role;
  if (data.organization_id) headers['x-organization-id'] = data.organization_id;
  return makeApiCall<ErpAiChatResponse>('/api/erp/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
}

export async function fetchErpAiConversations(organization_id?: string) {
  const headers: Record<string, string> = {};
  if (organization_id) headers['x-organization-id'] = organization_id;
  return makeApiCall<{ success: boolean; conversations: ErpAiConversation[] }>('/api/erp/ai/conversations', { headers });
}

export async function fetchErpAiConversationById(id: string, organization_id?: string) {
  const headers: Record<string, string> = {};
  if (organization_id) headers['x-organization-id'] = organization_id;
  return makeApiCall<{ success: boolean; conversation: ErpAiConversation; messages: ErpAiMessage[] }>(
    `/api/erp/ai/conversations/${encodeURIComponent(id)}`,
    { headers }
  );
}

export async function createErpAiConversation(data: { title: string; session?: string; role?: string; organization_id?: string }) {
  const headers: Record<string, string> = {};
  if (data.organization_id) headers['x-organization-id'] = data.organization_id;
  return makeApiCall<{ success: boolean; conversation: ErpAiConversation }>('/api/erp/ai/conversations', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
}

export async function deleteErpAiConversation(id: string, organization_id?: string) {
  const headers: Record<string, string> = {};
  if (organization_id) headers['x-organization-id'] = organization_id;
  return makeApiCall<{ success: boolean; message: string }>(`/api/erp/ai/conversations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
}

export async function fetchErpAiSettings() {
  return makeApiCall<{ success: boolean; settings: ErpAiSettings }>('/api/erp/ai/settings');
}

export async function updateErpAiSettings(settings: Partial<ErpAiSettings>) {
  return makeApiCall<{ success: boolean; message: string; settings: ErpAiSettings }>('/api/erp/ai/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function sendErpAiPrompt(data: { prompt: string; module: string; role?: string }) {
  return makeApiCall<{ reply: string; structuredData?: any }>('/api/erp/ai', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 14. Settings
export async function fetchErpSettings(organization_id?: string) {
  const qs = organization_id ? `?organization_id=${encodeURIComponent(organization_id)}` : '';
  return makeApiCall<{ settings: any }>(`/api/erp/settings${qs}`);
}

export async function updateErpSettings(settings: any) {
  return makeApiCall<{ success: boolean; settings: any }>('/api/erp/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// Enterprise Master Settings & Production Hardening
export async function fetchErpMasterSettings() {
  return makeApiCall<{
    success: boolean;
    settings: ErpMasterSettings;
    campuses: ErpCampus[];
    departments: any[];
    designations: any[];
    permissions: any;
  }>('/api/erp/settings/master');
}

export async function updateErpSettingsSection(section: string, data: any) {
  return makeApiCall<{
    success: boolean;
    message: string;
    section: string;
    data: any;
  }>(`/api/erp/settings/section/${section}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchErpCampuses() {
  return makeApiCall<{ success: boolean; count: number; campuses: ErpCampus[] }>('/api/erp/campuses');
}

export async function createErpCampus(campusData: Partial<ErpCampus>) {
  return makeApiCall<{ success: boolean; message: string; campus: ErpCampus }>('/api/erp/campuses', {
    method: 'POST',
    body: JSON.stringify(campusData),
  });
}

export async function updateErpCampus(id: string, campusData: Partial<ErpCampus>) {
  return makeApiCall<{ success: boolean; message: string; campus: ErpCampus }>(`/api/erp/campuses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(campusData),
  });
}

export async function fetchErpTaxonomies() {
  return makeApiCall<{ success: boolean; departments: any[]; designations: any[] }>('/api/erp/taxonomies');
}

export async function searchErpGlobal(query: string) {
  return makeApiCall<ErpGlobalSearchResponse>(`/api/erp/search?q=${encodeURIComponent(query)}`);
}

export async function fetchErpSystemHealth() {
  return makeApiCall<ErpSystemHealth>('/api/erp/health/status');
}

export async function fetchErpOnboardingChecklist() {
  return makeApiCall<ErpOnboardingChecklist>('/api/erp/onboarding/checklist');
}

export async function fetchErpAuditLogsFiltered(params?: {
  module?: string;
  action?: string;
  user?: string;
  limit?: number;
  offset?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.module) queryParams.append('module', params.module);
  if (params?.action) queryParams.append('action', params.action);
  if (params?.user) queryParams.append('user', params.user);
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return makeApiCall<{ success: boolean; total: number; logs: ErpAuditLogEntry[] }>(`/api/erp/audit-logs${qs}`);
}

// Legacy user helpers
export async function createTestUser(userData: { name: string; email: string }) {
  return makeApiCall<UserRecord[]>('/api/test-user', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function fetchUsers() {
  return makeApiCall<UserRecord[]>('/api/users');
}

// =========================================================================
// ⏰ TIMETABLE & PERIOD SCHEDULING API CLIENT FUNCTIONS
// =========================================================================

export async function fetchErpBellSchedule() {
  return makeApiCall<ErpBellScheduleResponse>('/api/erp/timetable/bell-schedule');
}

export async function fetchErpClassTimetable(params?: {
  grade?: string;
  section?: string;
  day?: string;
  session?: string;
}) {
  const q = new URLSearchParams();
  if (params?.grade) q.append('grade', params.grade);
  if (params?.section) q.append('section', params.section);
  if (params?.day) q.append('day', params.day);
  if (params?.session) q.append('session', params.session);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{
    success: boolean;
    total: number;
    session: string;
    grade: string;
    section: string;
    slots: ErpTimetableSlot[];
  }>(`/api/erp/timetable/classes${qs}`);
}

export async function validateTimetableSlot(slot: Partial<ErpTimetableSlot>, excludeId?: string) {
  return makeApiCall<{
    success: boolean;
    valid: boolean;
    conflicts: Array<{ type: string; message: string; conflictingSlot?: any }>;
    warnings: Array<{ type: string; message: string }>;
  }>('/api/erp/timetable/validate', {
    method: 'POST',
    body: JSON.stringify({ slot, excludeId })
  });
}

export async function createOrUpdateTimetableSlot(slot: Partial<ErpTimetableSlot>) {
  return makeApiCall<{
    success: boolean;
    message: string;
    slot: ErpTimetableSlot;
    warnings?: Array<{ type: string; message: string }>;
  }>('/api/erp/timetable/slots', {
    method: 'POST',
    body: JSON.stringify(slot)
  });
}

export async function deleteTimetableSlot(id: string) {
  return makeApiCall<{ success: boolean; message: string; slot: ErpTimetableSlot }>(`/api/erp/timetable/slots/${id}`, {
    method: 'DELETE'
  });
}

export async function fetchErpTeacherSchedule(teacherId: string, session?: string) {
  const qs = session ? `?session=${encodeURIComponent(session)}` : '';
  return makeApiCall<ErpTeacherSchedule>(`/api/erp/timetable/teachers/${teacherId}${qs}`);
}

export async function fetchErpRoomsCatalogue(type?: string, session?: string) {
  const q = new URLSearchParams();
  if (type) q.append('type', type);
  if (session) q.append('session', session);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{ success: boolean; totalRooms: number; rooms: ErpRoomResource[] }>(`/api/erp/timetable/rooms${qs}`);
}

export async function fetchErpSubstitutions(date?: string, status?: string) {
  const q = new URLSearchParams();
  if (date) q.append('date', date);
  if (status) q.append('status', status);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{ success: boolean; date: string; total: number; substitutions: ErpSubstitutionRecord[] }>(`/api/erp/timetable/substitutions${qs}`);
}

export async function fetchSubstitutionRecommendations(date?: string, teacherId?: string) {
  const q = new URLSearchParams();
  if (date) q.append('date', date);
  if (teacherId) q.append('teacherId', teacherId);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{
    success: boolean;
    date: string;
    dayOfWeek: string;
    absentTeachersCount: number;
    absentTeachers: Array<{ id: string; name: string; designation: string }>;
    totalUncoveredPeriods: number;
    recommendations: ErpSubstitutionRecommendation[];
  }>(`/api/erp/timetable/substitutions/recommendations${qs}`);
}

export async function assignTeacherSubstitution(payload: Partial<ErpSubstitutionRecord>) {
  return makeApiCall<{ success: boolean; message: string; substitution: ErpSubstitutionRecord }>('/api/erp/timetable/substitutions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateSubstitutionStatus(id: string, data: { status: string; notes?: string }) {
  return makeApiCall<{ success: boolean; message: string; substitution: ErpSubstitutionRecord }>(`/api/erp/timetable/substitutions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

// =========================================================================
// 🎓 SECTION 16: PARENT & STUDENT SELF-SERVICE PORTAL API CLIENT
// =========================================================================

export async function loginPortalUser(data: { identifier: string; role?: 'parent' | 'student' }) {
  return makeApiCall<{
    success: boolean;
    message: string;
    token: string;
    guardian: { name: string; phone: string; email: string; relation: string; address: string };
    wardsCount: number;
    activeWardId: string;
    wards: ErpPortalWardStudent[];
  }>('/api/erp/portal/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function fetchPortalWardStudents(params?: { parentPhone?: string; parentEmail?: string; studentId?: string }) {
  const q = new URLSearchParams();
  if (params?.parentPhone) q.append('parentPhone', params.parentPhone);
  if (params?.parentEmail) q.append('parentEmail', params.parentEmail);
  if (params?.studentId) q.append('studentId', params.studentId);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{ success: boolean; count: number; wards: ErpPortalWardStudent[] }>(`/api/erp/portal/ward-students${qs}`);
}

export async function fetchPortalStudentProfile(studentId: string) {
  return makeApiCall<{ success: boolean; student: ErpPortalStudentProfile }>(`/api/erp/portal/profile/${studentId}`);
}

export async function fetchPortalAttendance(studentId: string) {
  return makeApiCall<ErpPortalAttendanceSummary>(`/api/erp/portal/attendance/${studentId}`);
}

export async function submitPortalLeaveApplication(payload: {
  studentId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
}) {
  return makeApiCall<{ success: boolean; message: string; leaveApplication: ErpPortalLeaveApplication }>('/api/erp/portal/leave-applications', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchPortalLeaveApplications(studentId?: string, status?: string) {
  const q = new URLSearchParams();
  if (studentId) q.append('studentId', studentId);
  if (status) q.append('status', status);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{ success: boolean; count: number; applications: ErpPortalLeaveApplication[] }>(`/api/erp/portal/leave-applications${qs}`);
}

export async function updatePortalLeaveStatus(id: string, payload: { status: 'approved' | 'rejected'; reviewNotes?: string }) {
  return makeApiCall<{ success: boolean; message: string; leaveApplication: ErpPortalLeaveApplication }>(`/api/erp/portal/leave-applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function fetchPortalReportCards(studentId: string) {
  return makeApiCall<{
    success: boolean;
    student: { id: string; name: string; rollNo: string; grade: string; section: string; academicSession: string };
    totalReportCards: number;
    reportCards: ErpPortalReportCard[];
  }>(`/api/erp/portal/report-cards/${studentId}`);
}

export async function fetchPortalFees(studentId: string) {
  return makeApiCall<{
    success: boolean;
    studentId: string;
    studentName: string;
    summary: ErpPortalFeeSummary;
    invoices: ErpFeeDemand[];
    receipts: ErpFeePayment[];
  }>(`/api/erp/portal/fees/${studentId}`);
}

export async function payPortalFee(payload: {
  studentId: string;
  demandId?: string;
  amount?: number;
  paymentMode?: string;
  referenceNumber?: string;
}) {
  return makeApiCall<{
    success: boolean;
    message: string;
    receipt: any;
    updatedDuesINR: number;
  }>('/api/erp/portal/pay-fee', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchPortalHomework(params: { studentId?: string; grade?: string; section?: string }) {
  const q = new URLSearchParams();
  if (params.studentId) q.append('studentId', params.studentId);
  if (params.grade) q.append('grade', params.grade);
  if (params.section) q.append('section', params.section);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return makeApiCall<{ success: boolean; grade: string; section: string; totalHomework: number; homework: ErpPortalHomeworkItem[] }>(`/api/erp/portal/homework${qs}`);
}

export async function submitPortalHomework(payload: {
  homeworkId: string;
  studentId: string;
  submissionText: string;
  attachmentUrl?: string;
}) {
  return makeApiCall<{ success: boolean; message: string; submission: any }>('/api/erp/portal/homework/submit', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function acknowledgePortalHomework(payload: {
  homeworkId: string;
  studentId: string;
  parentName?: string;
}) {
  return makeApiCall<{ success: boolean; message: string; submission: any }>('/api/erp/portal/homework/acknowledge', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchPortalTimetable(studentId: string) {
  return makeApiCall<{
    success: boolean;
    grade: string;
    section: string;
    totalSlots: number;
    activePeriod: any;
    nextPeriod: any;
    weeklyRoutine: Record<string, ErpTimetableSlot[]>;
  }>(`/api/erp/portal/timetable/${studentId}`);
}

export async function fetchPortalTransport(studentId: string) {
  return makeApiCall<{
    success: boolean;
    studentId: string;
    studentName: string;
    hasAssignedTransport: boolean;
    transport: ErpPortalTransport;
  }>(`/api/erp/portal/transport/${studentId}`);
}

export async function fetchPortalNotices() {
  return makeApiCall<{
    success: boolean;
    totalNotices: number;
    notices: Array<{
      id: string;
      title: string;
      content: string;
      category: string;
      targetAudience: string;
      isUrgent: boolean;
      postedBy: string;
      postedAt: string;
    }>;
    emergencyHelpline: ErpPortalEmergencyHelpline[];
  }>('/api/erp/portal/notices');
}





// =========================================================================
// 🚀 SCHOOL ERP SAAS ONBOARDING & CONFIGURATION WIZARD APIS (MIGRATION 019)
// =========================================================================

export async function fetchOnboardingStatus(orgId?: string) {
  const query = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : '';
  return makeApiCall<OnboardingStatusResponse>(`/api/erp/onboarding/status${query}`);
}

export async function fetchOnboardingChecklist(orgId?: string) {
  const query = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : '';
  return makeApiCall<{
    success: boolean;
    checklist: OnboardingChecklist;
    readiness: {
      isReady: boolean;
      missingMandatoryItems: string[];
      counts: Record<string, number>;
    };
  }>(`/api/erp/onboarding/checklist${query}`);
}

export async function saveOnboardingStep(step: number, payload: any, orgId?: string) {
  const query = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : '';
  return makeApiCall<{
    success: boolean;
    message: string;
    step: number;
    onboarding: SchoolOnboardingRecord;
    checklist: OnboardingChecklist;
  }>(`/api/erp/onboarding/step/${step}${query}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function saveOnboardingDraft(currentStep: number, draftData: any, orgId?: string) {
  const query = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : '';
  return makeApiCall<{
    success: boolean;
    message: string;
    onboarding: SchoolOnboardingRecord;
  }>(`/api/erp/onboarding/save-draft${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentStep, draftData })
  });
}

export async function validateOnboarding(orgId?: string) {
  const query = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : '';
  return makeApiCall<{
    success: boolean;
    valid: boolean;
    isReadyForActivation: boolean;
    missingMandatoryItems: string[];
    checklist: OnboardingChecklist;
  }>(`/api/erp/onboarding/validate${query}`, {
    method: 'POST'
  });
}

export async function activateSchoolErp(orgId?: string) {
  const query = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : '';
  return makeApiCall<{
    success: boolean;
    message: string;
    onboarding: SchoolOnboardingRecord;
    checklist: OnboardingChecklist;
  }>(`/api/erp/onboarding/activate${query}`, {
    method: 'POST'
  });
}

export async function inviteSchoolAdmin(payload: { email: string; name: string; role: string }, orgId?: string) {
  const query = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : '';
  return makeApiCall<{
    success: boolean;
    message: string;
    invitation: OnboardingInvitationRecord;
  }>(`/api/erp/onboarding/invite-admin${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function importOnboardingStudents(students: any[], dryRun = false, orgId?: string) {
  const query = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : '';
  return makeApiCall<{
    success: boolean;
    message?: string;
    mode?: string;
    importedCount?: number;
    preview: ImportPreviewSummary;
  }>(`/api/erp/onboarding/import/students${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students, dryRun })
  });
}

export async function importOnboardingStaff(staff: any[], dryRun = false, orgId?: string) {
  const query = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : '';
  return makeApiCall<{
    success: boolean;
    message?: string;
    mode?: string;
    importedCount?: number;
    preview: ImportPreviewSummary;
  }>(`/api/erp/onboarding/import/staff${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staff, dryRun })
  });
}

// =========================================================================
// 👑 DAKSHORA PLATFORM CONTROL CENTER (SUPER ADMIN / SAAS OPERATIONS)
// =========================================================================

const superAdminHeaders = {};

export async function fetchPlatformDashboard() {
  return makeApiCall<PlatformDashboardData>('/api/admin/dashboard', {
    headers: superAdminHeaders
  });
}

export async function fetchPlatformOrganizations(params?: { q?: string; status?: string; plan?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.q) query.append('q', params.q);
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.plan && params.plan !== 'all') query.append('plan', params.plan);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{ success: boolean; total: number; page: number; limit: number; organizations: any[] }>(`/api/admin/organizations${qStr}`, {
    headers: superAdminHeaders
  });
}

export async function fetchPlatformOrganizationDetail(id: string) {
  return makeApiCall<{ success: boolean; organization: any }>(`/api/admin/organizations/${encodeURIComponent(id)}`, {
    headers: superAdminHeaders
  });
}

export async function updatePlatformOrganizationStatus(id: string, status: string) {
  return makeApiCall<{ success: boolean; message: string; organization: any }>(`/api/admin/organizations/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}

export async function fetchPlatformSchools(params?: { q?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.q) query.append('q', params.q);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return makeApiCall<{ success: boolean; total: number; schools: PlatformSchool[] }>(`/api/admin/schools${qStr}`, {
    headers: superAdminHeaders
  });
}

export async function fetchPlatformUsers() {
  return makeApiCall<{ success: boolean; total: number; users: PlatformUser[] }>('/api/admin/users', {
    headers: superAdminHeaders
  });
}

export async function updatePlatformUserRole(id: string, role: string) {
  return makeApiCall<{ success: boolean; message: string; userId: string; role: string }>(`/api/admin/users/${encodeURIComponent(id)}/role`, {
    method: 'PATCH',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  });
}

export async function fetchPlatformSubscriptions() {
  return makeApiCall<{ success: boolean; total: number; subscriptions: any[] }>('/api/admin/subscriptions', {
    headers: superAdminHeaders
  });
}

export async function updatePlatformSubscription(id: string, updates: { plan_id?: string; status?: string; billing_interval?: string; amountINR?: number }) {
  return makeApiCall<{ success: boolean; message: string; subscription: any }>(`/api/admin/subscriptions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
}

export async function fetchPlatformPlans() {
  return makeApiCall<{ success: boolean; total: number; plans: any[] }>('/api/admin/plans', {
    headers: superAdminHeaders
  });
}

export async function fetchPlatformUsage() {
  return makeApiCall<{ success: boolean; usage: any }>('/api/admin/usage', {
    headers: superAdminHeaders
  });
}

export async function fetchPlatformOnboarding() {
  return makeApiCall<{ success: boolean; total: number; onboarding: PlatformOnboardingSummary[] }>('/api/admin/onboarding', {
    headers: superAdminHeaders
  });
}

export async function fetchPlatformTickets() {
  return makeApiCall<{ success: boolean; total: number; tickets: PlatformSupportTicket[] }>('/api/admin/support/tickets', {
    headers: superAdminHeaders
  });
}

export async function createPlatformTicket(payload: { organization_id?: string; subject: string; description: string; priority?: string }) {
  return makeApiCall<{ success: boolean; message: string; ticket: PlatformSupportTicket }>('/api/admin/support/tickets', {
    method: 'POST',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function updatePlatformTicket(id: string, updates: { status?: string; assigned_to?: string | null; resolution_notes?: string | null }) {
  return makeApiCall<{ success: boolean; message: string; ticket: PlatformSupportTicket }>(`/api/admin/support/tickets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
}

export async function startSupportSession(payload: { target_organization_id: string; reason: string }) {
  return makeApiCall<{ success: boolean; message: string; session: PlatformSupportSession }>('/api/admin/support/session/start', {
    method: 'POST',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function endSupportSession() {
  return makeApiCall<{ success: boolean; message: string; sessionsEnded: number }>('/api/admin/support/session/end', {
    method: 'POST',
    headers: { ...superAdminHeaders }
  });
}

export async function fetchActiveSupportSession() {
  return makeApiCall<{ success: boolean; hasActiveSession: boolean; activeSession: PlatformSupportSession | null }>('/api/admin/support/session/active', {
    headers: superAdminHeaders
  });
}

export async function fetchPlatformHealth() {
  return makeApiCall<PlatformHealthStatus>('/api/admin/health', {
    headers: superAdminHeaders
  });
}

export async function fetchPlatformSettings() {
  return makeApiCall<{ success: boolean; settings: PlatformSettings }>('/api/admin/settings', {
    headers: superAdminHeaders
  });
}

export async function updatePlatformSettings(payload: { maintenance_mode?: boolean; maintenance_message?: string; feature_flags?: any }) {
  return makeApiCall<{ success: boolean; message: string; settings: PlatformSettings }>('/api/admin/settings', {
    method: 'PATCH',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function broadcastPlatformNotice(payload: { title: string; message: string; audience?: string; priority?: string }) {
  return makeApiCall<{ success: boolean; message: string; broadcast: any }>('/api/admin/communication/broadcast', {
    method: 'POST',
    headers: { ...superAdminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

// =========================================================================
// 🏛️ STAFF RESPONSIBILITIES & SCOPE ENGINE APIS (MIGRATION 021)
// =========================================================================

export async function fetchResponsibilityTypes(params?: { category?: string; active?: string; search?: string }) {
  const q = new URLSearchParams();
  if (params?.category && params.category !== 'all') q.set('category', params.category);
  if (params?.active !== undefined && params.active !== 'all') q.set('active', params.active);
  if (params?.search) q.set('search', params.search);
  const qs = q.toString() ? `?${q.toString()}` : '';

  return makeApiCall<{ success: boolean; total: number; responsibilityTypes: ResponsibilityTypeRecord[] }>(`/api/erp/responsibilities${qs}`);
}

export async function createResponsibilityType(payload: {
  code: string;
  name: string;
  description?: string;
  category?: string;
  default_scope_type?: ResponsibilityScopeType;
  permissions?: string[];
}) {
  return makeApiCall<{ success: boolean; message: string; responsibilityType: ResponsibilityTypeRecord }>('/api/erp/responsibilities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function updateResponsibilityType(id: string, payload: Partial<ResponsibilityTypeRecord>) {
  return makeApiCall<{ success: boolean; message: string; responsibilityType: ResponsibilityTypeRecord }>(`/api/erp/responsibilities/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function fetchResponsibilityPermissions(id: string) {
  return makeApiCall<{ success: boolean; responsibilityType: ResponsibilityTypeRecord; permissions: string[] }>(`/api/erp/responsibilities/${id}/permissions`);
}

export async function updateResponsibilityPermissions(id: string, permissions: string[]) {
  return makeApiCall<{ success: boolean; message: string; permissions: string[] }>(`/api/erp/responsibilities/${id}/permissions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions })
  });
}

export async function fetchStaffResponsibilities(staffId: string) {
  return makeApiCall<{
    success: boolean;
    staff: { id: string; name: string; designation: string; department: string; role: string };
    total: number;
    responsibilities: StaffResponsibilityRecord[];
  }>(`/api/erp/staff/${staffId}/responsibilities`);
}

export async function assignStaffResponsibility(staffId: string, payload: {
  responsibility_type_id: string;
  scope_type?: ResponsibilityScopeType;
  scope_id?: string;
  scope_name?: string;
  academic_session_id?: string;
  is_primary?: boolean;
  start_date?: string;
  end_date?: string | null;
  notes?: string;
}) {
  return makeApiCall<{ success: boolean; message: string; responsibility: StaffResponsibilityRecord }>(`/api/erp/staff/${staffId}/responsibilities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function updateStaffResponsibility(staffId: string, responsibilityId: string, payload: Partial<StaffResponsibilityRecord>) {
  return makeApiCall<{ success: boolean; message: string; responsibility: StaffResponsibilityRecord }>(`/api/erp/staff/${staffId}/responsibilities/${responsibilityId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function removeStaffResponsibility(staffId: string, responsibilityId: string) {
  return makeApiCall<{ success: boolean; message: string }>(`/api/erp/staff/${staffId}/responsibilities/${responsibilityId}`, {
    method: 'DELETE'
  });
}

export async function fetchMyResponsibilities() {
  return makeApiCall<{
    success: boolean;
    staffId: string;
    staffName: string;
    baseRole: string;
    designation: string;
    responsibilities: StaffResponsibilityRecord[];
  }>('/api/erp/me/responsibilities');
}

export async function fetchMyEffectivePermissions() {
  return makeApiCall<EffectivePermissionsResponse>('/api/erp/me/effective-permissions');
}

export async function fetchMyAccessScopes() {
  return makeApiCall<{ success: boolean; scopes: AccessScopesSummary }>('/api/erp/me/access-scopes');
}

export async function fetchTeacherScopedStudents(params?: { grade?: string; section?: string }) {
  const q = new URLSearchParams();
  if (params?.grade && params.grade !== 'all') q.set('grade', params.grade);
  if (params?.section && params.section !== 'all') q.set('section', params.section);
  const qs = q.toString() ? `?${q.toString()}` : '';

  return makeApiCall<{
    success: boolean;
    total: number;
    teacher: { id: string; name: string };
    students: any[];
  }>(`/api/erp/teacher/students${qs}`);
}

export async function fetchTeacherScopedAttendance(params?: { date?: string; grade?: string; section?: string }) {
  const q = new URLSearchParams();
  if (params?.date) q.set('date', params.date);
  if (params?.grade && params.grade !== 'all') q.set('grade', params.grade);
  if (params?.section && params.section !== 'all') q.set('section', params.section);
  const qs = q.toString() ? `?${q.toString()}` : '';

  return makeApiCall<{
    success: boolean;
    date: string;
    total: number;
    attendance: any[];
  }>(`/api/erp/teacher/attendance${qs}`);
}

export async function fetchTeacherScopedExams() {
  return makeApiCall<{
    success: boolean;
    isExamIncharge: boolean;
    total: number;
    exams: any[];
  }>('/api/erp/teacher/exams');
}

export async function fetchTeacherWorkloadSummary() {
  return makeApiCall<{
    success: boolean;
    staff: { id: string; name: string; designation: string; department: string; email: string };
    metrics: TeacherWorkloadSummary;
    workloadSummary: TeacherWorkloadSummary;
    assignments: any[];
    responsibilities: StaffResponsibilityRecord[];
    scopes: AccessScopesSummary;
  }>('/api/erp/teacher/workload-summary');
}

export async function fetchTeachingJournal(params?: {
  staffId?: string;
  grade?: string;
  section?: string;
  date?: string;
  subject?: string;
}) {
  const q = new URLSearchParams();
  if (params?.staffId) q.set('staffId', params.staffId);
  if (params?.grade && params.grade !== 'all') q.set('grade', params.grade);
  if (params?.section && params.section !== 'all') q.set('section', params.section);
  if (params?.date) q.set('date', params.date);
  if (params?.subject && params.subject !== 'all') q.set('subject', params.subject);
  const qs = q.toString() ? `?${q.toString()}` : '';

  return makeApiCall<{
    success: boolean;
    count: number;
    journalEntries: TeachingJournalEntry[];
  }>(`/api/erp/teaching-journal${qs}`);
}

export async function createTeachingJournal(entry: Partial<TeachingJournalEntry>) {
  return makeApiCall<{
    success: boolean;
    message: string;
    journalEntry: TeachingJournalEntry;
  }>('/api/erp/teaching-journal', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function updateTeachingJournal(id: string, entry: Partial<TeachingJournalEntry>) {
  return makeApiCall<{
    success: boolean;
    message: string;
    journalEntry: TeachingJournalEntry;
  }>(`/api/erp/teaching-journal/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });
}

export async function deleteTeachingJournal(id: string) {
  return makeApiCall<{
    success: boolean;
    message: string;
  }>(`/api/erp/teaching-journal/${id}`, {
    method: 'DELETE',
  });
}

export async function generateAiTeacherContent(payload: AiTeacherGenerateRequest) {
  return makeApiCall<AiTeacherGenerateResponse>('/api/erp/ai-teacher/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generateAiQuestionPaper(payload: AiQuestionPaperRequest) {
  return makeApiCall<AiQuestionPaperResponse>('/api/erp/ai/generate-question-paper', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generateAiLessonPlan(payload: AiLessonPlanRequest) {
  return makeApiCall<AiLessonPlanResponse>('/api/erp/ai/generate-lesson-plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generateAiPresentation(payload: AiPresentationRequest) {
  return makeApiCall<AiPresentationResponse>('/api/erp/ai/generate-presentation', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// =========================================================================
// 📚 PHASE 11: SCHOOL RAG & KNOWLEDGE BASE APIS
// =========================================================================

export async function fetchKnowledgeBaseDocs() {
  return makeApiCall<{
    success: boolean;
    total: number;
    vectorIndexStatus: string;
    documents: KnowledgeBaseDocument[];
  }>('/api/erp/ai/knowledge-base');
}

export async function addKnowledgeBaseDoc(data: {
  title: string;
  category: string;
  summary?: string;
  content?: string;
  tags?: string[];
}) {
  return makeApiCall<{
    success: boolean;
    message: string;
    document: KnowledgeBaseDocument;
  }>('/api/erp/ai/knowledge-base', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteKnowledgeBaseDoc(id: string) {
  return makeApiCall<{
    success: boolean;
    message: string;
  }>(`/api/erp/ai/knowledge-base/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function queryKnowledgeBase(question: string) {
  return makeApiCall<KnowledgeBaseQueryResponse>('/api/erp/ai/knowledge-base/query', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

// =========================================================================
// 🤖 PHASE 13: ROBOTICS & STEAM ACADEMY APIS
// =========================================================================

export async function fetchRoboticsCourses() {
  return makeApiCall<{
    success: boolean;
    courses: RoboticsCourse[];
  }>('/api/erp/robotics/courses');
}

export async function fetchRoboticsInventory() {
  return makeApiCall<{
    success: boolean;
    inventory: RoboticsInventoryItem[];
  }>('/api/erp/robotics/inventory');
}

export async function fetchRoboticsProjects() {
  return makeApiCall<{
    success: boolean;
    projects: RoboticsProject[];
  }>('/api/erp/robotics/projects');
}

export async function createRoboticsProject(data: {
  title: string;
  studentName: string;
  grade?: string;
  category?: string;
  summary?: string;
}) {
  return makeApiCall<{
    success: boolean;
    message: string;
    project: RoboticsProject;
  }>('/api/erp/robotics/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchRoboticsCompetitions() {
  return makeApiCall<{
    success: boolean;
    competitions: RoboticsCompetition[];
  }>('/api/erp/robotics/competitions');
}

// =========================================================================
// 🧩 PHASE 14 & 15: SOLUTION BUILDER & COMMERCIAL QUOTATION APIS
// =========================================================================

export async function generateCommercialQuote(payload: {
  schoolName?: string;
  studentCount?: number;
  selectedModules?: string[];
  billingCycle?: 'monthly' | 'annual';
}) {
  return makeApiCall<{
    success: boolean;
    quotation: CommercialQuotation;
  }>('/api/erp/solutions/quote', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}





