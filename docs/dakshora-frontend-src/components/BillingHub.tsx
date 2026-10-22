import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Users,
  GraduationCap,
  Building2,
  Bot,
  Calendar,
  Clock,
  Check,
  Download,
  Receipt,
  Sliders,
  PackageCheck,
  Calculator,
  Layers,
  Printer,
  QrCode,
  Cpu,
  UserCheck,
  DollarSign,
  Bell,
  Bus,
  Library,
  ChevronRight,
  X,
  Award,
  BookOpen
} from 'lucide-react';
import {
  BillingPlan,
  InvoiceRecord,
  SaasSubscription,
  SaasUsageMetrics,
  CommercialQuotation
} from '../types';
import {
  fetchBillingPlans,
  fetchBillingInvoices,
  fetchSubscription,
  fetchUsageMetrics,
  changeSubscriptionPlan,
  cancelSubscription,
  renewSubscription,
  generateCommercialQuote,
  fetchPlatformSubscriptions
} from '../services/api';

interface BillingHubProps {
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

const SOLUTION_MODULES = [
  { id: 'core_erp', name: 'Core ERP (Students, Staff, Attendance, Exams, Fees)', desc: 'Roll numbers, digital ID cards, staff roster, fee ledgers & CBSE report cards', category: 'Core ERP', icon: Users, pricePerStudentMonth: 12, required: true },
  { id: 'teacher_ai', name: 'Dakshora AI Teacher Co-Pilot', desc: 'AI lesson plans, Bloom taxonomy MCQs, marking rubric generator & teacher assistance', category: 'Intelligence', icon: Bot, pricePerStudentMonth: 6 },
  { id: 'student_suite', name: 'NEP 2020 HPC & Student Skill Passport', desc: 'Holistic progress cards, 360-degree peer review, extracurricular skill badges', category: 'Academic', icon: Award, pricePerStudentMonth: 5 },
  { id: 'parent_portal', name: 'Parent Mobile Portal & Fee Payments', desc: 'Ward progress tracking, timetable view, circulars & instant UPI fee payments', category: 'Operations', icon: Calendar, pricePerStudentMonth: 3 },
  { id: 'robotics_academy', name: 'Dakshora Robotics & STEAM Lab Curriculum', desc: 'Atal Tinkering Lab kits, micro:bit/Arduino/ROS projects & national hackathons', category: 'Innovation', icon: Cpu, pricePerStudentMonth: 8 },
  { id: 'admissions_crm', name: 'School CRM, Entrance Test & Seat Matrix', desc: 'Inquiry capture, visual Kanban pipeline, entrance exam scoring & WhatsApp notifications', category: 'Growth', icon: GraduationCap, pricePerStudentMonth: 4 },
  { id: 'school_rag', name: 'School Private RAG Knowledge Base', desc: 'Institutional grounded semantic AI search over CBSE norms, almanacs & school policies', category: 'Intelligence', icon: Sparkles, pricePerStudentMonth: 3 },
  { id: 'library_mgmt', name: 'Digital Library & ISBN Barcoding', desc: 'ISBN cataloging, barcode scanner support, issue/return register & fine tracking', category: 'Academic', icon: Library, pricePerStudentMonth: 2 },
  { id: 'transport_gps', name: 'Transport Fleet GPS & Live Bus Tracking', desc: 'Route waypoints, driver roster, live speed monitoring & parent pickup alerts', category: 'Logistics', icon: Bus, pricePerStudentMonth: 4 },
  { id: 'hr_payroll', name: 'HR, Biometrics & Automated Payroll', desc: 'Staff biometric integration, salary structures, HRA/DA, PF/TDS & payslips', category: 'Finance', icon: CreditCard, pricePerStudentMonth: 3 },
  { id: 'digital_exams', name: 'Digital Examinations & Online OMR', desc: 'Question bank builder, online computer-based tests & automatic MCQ grading', category: 'Academic', icon: FileText, pricePerStudentMonth: 3 },
  { id: 'multi_campus', name: 'Trust Multi-Campus Central Cockpit', desc: 'Multi-branch school group reporting, consolidated analytics & resource allocation', category: 'Enterprise', icon: Building2, pricePerStudentMonth: 5 }
];

export const BillingHub: React.FC<BillingHubProps> = ({ onShowToast }) => {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [subscription, setSubscription] = useState<SaasSubscription | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<SaasUsageMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [platformSubscriptions, setPlatformSubscriptions] = useState<any[]>([]);

  // Hub Tab
  const [activeHubTab, setActiveHubTab] = useState<'subscriptions' | 'solution_builder'>('subscriptions');

  // Solution Builder State (Phases 14 & 15)
  const [builderModules, setBuilderModules] = useState<string[]>([
    'core_erp',
    'teacher_ai',
    'student_suite',
    'robotics_academy'
  ]);
  const [studentCount, setStudentCount] = useState<number>(850);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');
  const [quote, setQuote] = useState<CommercialQuotation | null>(null);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState<boolean>(false);
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'netbanking' | 'card'>('upi');
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);

  // Modals
  const [selectedPlanForChange, setSelectedPlanForChange] = useState<BillingPlan | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState<InvoiceRecord | null>(null);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const [plansRes, invRes, subRes, usageRes, platSubsRes] = await Promise.all([
        fetchBillingPlans(),
        fetchBillingInvoices(),
        fetchSubscription(),
        fetchUsageMetrics(),
        fetchPlatformSubscriptions().catch(() => ({ data: { subscriptions: [] } }))
      ]);

      if (plansRes.data?.plans) setPlans(plansRes.data.plans);
      if (invRes.data?.invoices) setInvoices(invRes.data.invoices);
      if (subRes.data?.subscription) setSubscription(subRes.data.subscription);
      if (usageRes.data?.usage) setUsageMetrics(usageRes.data as unknown as SaasUsageMetrics);
      if (platSubsRes?.data?.subscriptions && Array.isArray(platSubsRes.data.subscriptions)) {
        setPlatformSubscriptions(platSubsRes.data.subscriptions);
      }
    } catch {
      onShowToast('error', 'Sync Failed', 'Could not retrieve latest subscription data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const handleOpenPlanChange = (plan: BillingPlan) => {
    if (subscription?.plan_id === plan.id) return;
    setSelectedPlanForChange(plan);
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlanForChange) return;

    // Pre-flight downgrade protection check in frontend
    if (selectedPlanForChange.limits?.max_students !== null && usageMetrics) {
      const activeStudents = usageMetrics.usage.students.current;
      const targetLimit = selectedPlanForChange.limits?.max_students || 0;
      if (activeStudents > targetLimit) {
        onShowToast(
          'error',
          'Downgrade Blocked ⚠️',
          `Your campus currently has ${activeStudents} active students. ${selectedPlanForChange.name} only allows up to ${targetLimit}.`
        );
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await changeSubscriptionPlan({ planId: selectedPlanForChange.id });
      if (res.data?.success) {
        onShowToast('success', 'Plan Activated! 🚀', `Successfully transitioned to ${selectedPlanForChange.name}.`);
        setSelectedPlanForChange(null);
        loadBillingData();
      } else {
        onShowToast('error', 'Plan Change Failed', res.data?.message || 'Server rejected plan update.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unable to update subscription.';
      onShowToast('error', 'Downgrade Guard Alert', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewSubscription = async () => {
    setActionLoading(true);
    try {
      const res = await renewSubscription();
      if (res.data?.success) {
        onShowToast('success', 'Subscription Renewed! 💳', res.data.message);
        loadBillingData();
      }
    } catch {
      onShowToast('error', 'Renewal Failed', 'Please try again or contact support.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setActionLoading(true);
    try {
      const res = await cancelSubscription({ reason: 'Admin scheduled cancellation' });
      if (res.data?.success) {
        onShowToast('info', 'Subscription Update', 'Scheduled cancellation at period end. All institutional records are safe.');
        setShowCancelModal(false);
        loadBillingData();
      }
    } catch {
      onShowToast('error', 'Cancellation Failed', 'Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Re-calculate quotation on any configuration change
  useEffect(() => {
    let isMounted = true;
    async function computeQuote() {
      setIsCalculatingQuote(true);
      try {
        const res = await generateCommercialQuote({
          schoolName: 'Delhi Public Heritage School',
          studentCount,
          selectedModules: builderModules,
          billingCycle: billingInterval
        });
        if (isMounted && res.data?.quotation) {
          setQuote(res.data.quotation);
        }
      } catch {
        // Instant local fallback
        if (isMounted) {
          const baseMonthly = 2500;
          const selectedObjs = SOLUTION_MODULES.filter(m => builderModules.includes(m.id));
          const ratePerStudent = selectedObjs.reduce((sum, m) => sum + m.pricePerStudentMonth, 0);
          const rawMonthly = baseMonthly + (ratePerStudent * studentCount);
          const discountMult = billingInterval === 'annual' ? 0.8 : 1.0;
          const discountedMonthly = Math.round(rawMonthly * discountMult);
          const annualSubtotal = discountedMonthly * 12;
          const gst = Math.round(annualSubtotal * 0.18);
          const grandTotal = annualSubtotal + gst;

          setQuote({
            quoteId: `QUO-DAK-${Math.floor(100000 + Math.random() * 900000)}`,
            date: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            schoolName: 'Delhi Public Heritage School',
            studentCount,
            billingCycle: billingInterval,
            itemizedModules: selectedObjs.map(m => ({
              key: m.id,
              name: m.name,
              ratePerStudentMonthly: m.pricePerStudentMonth,
              monthlyTotalINR: m.pricePerStudentMonth * studentCount
            })),
            pricing: {
              basePlatformFeeMonthly: baseMonthly,
              effectivePerStudentMonthly: ratePerStudent,
              discountPercent: billingInterval === 'annual' ? 20 : 0,
              monthlyChargeableINR: discountedMonthly,
              annualSubtotalINR: annualSubtotal,
              gstRatePercent: 18,
              hsnCode: '998314',
              gstAmountINR: gst,
              grandTotalINR: grandTotal
            },
            paymentTerms: '100% advance on annual renewal. Net 15 days from invoice issuance.',
            includedServices: [
              'Dedicated Implementation Engineer (On-site / Virtual)',
              'Zero-Cost Data Migration from Legacy School Software / Excel',
              'Staff & Teacher Training Certifications',
              '24x7 Priority WhatsApp & Phone Helpline'
            ]
          });
        }
      } finally {
        if (isMounted) setIsCalculatingQuote(false);
      }
    }
    computeQuote();
    return () => { isMounted = false; };
  }, [builderModules, studentCount, billingInterval]);

  const toggleModule = (id: string) => {
    const mod = SOLUTION_MODULES.find(m => m.id === id);
    if (mod?.required) {
      onShowToast('info', 'Core Module Required', `${mod.name} is a required foundation module.`);
      return;
    }
    setBuilderModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const applyPreset = (preset: 'essentials' | 'cbse' | 'full') => {
    if (preset === 'essentials') {
      setBuilderModules(['core_erp', 'parent_portal']);
      onShowToast('info', 'Preset Applied: Core Essentials', '2 critical modules loaded');
    } else if (preset === 'cbse') {
      setBuilderModules(['core_erp', 'teacher_ai', 'student_suite', 'parent_portal', 'admissions_crm', 'library_mgmt', 'transport_gps', 'school_rag']);
      onShowToast('info', 'Preset Applied: CBSE Standard Roster', '8 compliant modules loaded');
    } else {
      setBuilderModules(SOLUTION_MODULES.map(m => m.id));
      onShowToast('info', 'Preset Applied: Full STEAM & AI Campus', 'All 12 modular suites activated');
    }
  };

  const handleExecutePaymentSimulation = () => {
    if (!quote) return;
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setShowPaymentModal(false);

      const newInv: InvoiceRecord = {
        id: `inv-${Date.now().toString().slice(-4)}`,
        invoiceNumber: `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        orgName: quote.schoolName,
        plan: `Custom Modular (${quote.itemizedModules.length} Modules)`,
        amountINR: quote.pricing.grandTotalINR,
        subtotalINR: quote.pricing.annualSubtotalINR,
        taxGstINR: quote.pricing.gstAmountINR,
        status: 'paid',
        issueDate: new Date().toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0],
        organization_id: 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e'
      };

      setInvoices(prev => [newInv, ...prev]);
      onShowToast(
        'success',
        'Solution Activated & Paid! 🎉',
        `Payment of ₹${quote.pricing.grandTotalINR.toLocaleString()} verified via ${selectedPaymentMethod.toUpperCase()}. All ${quote.itemizedModules.length} modules provisioned.`
      );
      setActiveHubTab('subscriptions');
    }, 1200);
  };

  const currentPlan = plans.find(p => p.id === subscription?.plan_id) || plans[2] || null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">SaaS Plans, Subscriptions & Entitlements</h2>
          </div>
          <p className="text-xs text-slate-400">
            Multi-tenant organization subscription tier, live ERP quota consumption, and tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBillingData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Sync Status</span>
          </button>
        </div>
      </div>

      {/* Hub Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-mono text-xs overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveHubTab('subscriptions')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeHubTab === 'subscriptions'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>SaaS Subscriptions & Quotas</span>
        </button>
        <button
          onClick={() => setActiveHubTab('solution_builder')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeHubTab === 'solution_builder'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Solution Builder & Quotation Generator</span>
          <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[9px] font-bold text-cyan-300 border border-cyan-500/30">
            LIVE ENGINE
          </span>
        </button>
      </div>

      {/* Mode 1: Subscriptions View */}
      {activeHubTab === 'subscriptions' && (
        <div className="space-y-8">
          {/* Multi-Tenant School Subscriptions & MRR Cockpit */}
          {platformSubscriptions.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-950/70 space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CreditCard className="w-5 h-5" />
                    </span>
                    <h3 className="font-bold text-lg text-white font-mono">
                      Platform Customer Subscriptions & MRR
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Live multi-tenant institutional subscriptions, recurring MRR telemetry, and renewal ledger.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
                    platformSubscriptions.filter((s) => s.status === 'active' && s.organizationStatus !== 'suspended' && s.organizationStatus !== 'deactivated').length > 0
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900/80 text-slate-400 border-slate-700/60'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      platformSubscriptions.filter((s) => s.status === 'active' && s.organizationStatus !== 'suspended' && s.organizationStatus !== 'deactivated').length > 0
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-slate-500'
                    }`}></span>
                    <span>Active MRR: <strong>₹{platformSubscriptions
                      .filter((s) => s.status === 'active' && s.organizationStatus !== 'suspended' && s.organizationStatus !== 'deactivated')
                      .reduce((acc, curr) => acc + (Number(curr.amountINR) || 0), 0)
                      .toLocaleString('en-IN')}/mo</strong></span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-500/40">
                    Active Tenancies: <strong>{platformSubscriptions.filter((s) => s.status === 'active' && s.organizationStatus !== 'suspended' && s.organizationStatus !== 'deactivated').length} / {platformSubscriptions.length} Schools</strong>
                  </div>
                  {platformSubscriptions.filter((s) => s.status === 'suspended' || s.organizationStatus === 'suspended' || s.organizationStatus === 'deactivated').length > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      <span>Suspended: <strong>{platformSubscriptions.filter((s) => s.status === 'suspended' || s.organizationStatus === 'suspended' || s.organizationStatus === 'deactivated').length} (₹0 Billed)</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscriptions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-3">School Organization</th>
                      <th className="py-3 px-3">Subscribed Plan Tier</th>
                      <th className="py-3 px-3">Billing Cycle</th>
                      <th className="py-3 px-3">Monthly Charge</th>
                      <th className="py-3 px-3">Renewal Period</th>
                      <th className="py-3 px-3 text-right">Tenancy Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {platformSubscriptions.map((sub) => {
                      const isSuspended = sub.status === 'suspended' || sub.organizationStatus === 'suspended' || sub.organizationStatus === 'deactivated';
                      return (
                        <tr key={sub.id} className={`transition-colors ${isSuspended ? 'bg-rose-950/10 hover:bg-rose-950/20' : 'hover:bg-slate-900/50'}`}>
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-white text-sm">{sub.organizationName}</div>
                            <div className="text-[11px] text-slate-500">Slug: /{sub.organizationSlug}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2.5 py-1 rounded-lg bg-teal-950/70 text-teal-300 border border-teal-500/30 font-bold uppercase text-[10px]">
                              {sub.planName || sub.plan_id}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-300 capitalize">
                            {sub.billing_interval || 'Monthly'}
                          </td>
                          <td className="py-3.5 px-3 text-sm">
                            {isSuspended ? (
                              <div className="flex flex-col">
                                <span className="line-through text-slate-500 text-xs">₹{(Number(sub.amountINR) || 0).toLocaleString('en-IN')}/mo</span>
                                <span className="text-rose-400 font-bold text-xs">₹0/mo (Suspended)</span>
                              </div>
                            ) : (
                              <span className="font-bold text-emerald-400">
                                ₹{(Number(sub.amountINR) || 0).toLocaleString('en-IN')}/mo
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-slate-400">
                            {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Continuous'}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/40 font-bold text-[10px] uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                                SUSPENDED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-bold text-[10px] uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                ACTIVE
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

      {/* Active Subscription Overview Card */}
      {subscription && (
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 space-y-6 shadow-xl shadow-amber-950/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  CURRENT ACTIVE TIER
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono uppercase ${
                  subscription.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {subscription.status.toUpperCase()}
                </span>
                {subscription.cancel_at_period_end && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold font-mono">
                    CANCEL AT PERIOD END
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black text-white font-mono flex items-center gap-3">
                <span>{currentPlan?.name || subscription.plan}</span>
                <span className="text-lg font-normal text-amber-400">
                  ₹{subscription.amountINR?.toLocaleString()} <span className="text-xs text-slate-400">/ {subscription.billing_interval}</span>
                </span>
              </h3>

              <p className="text-xs text-slate-300 max-w-2xl">
                {currentPlan?.description || 'Full institutional access with AI copilot and unlimited scale.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRenewSubscription}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Renew Subscription</span>
              </button>

              {!subscription.cancel_at_period_end ? (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs font-mono transition-all"
                >
                  Cancel Plan
                </button>
              ) : (
                <button
                  onClick={handleRenewSubscription}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-xs font-mono"
                >
                  Resume Auto-Renew
                </button>
              )}
            </div>
          </div>

          {/* Timeline & Metadata Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Period Ends: <strong className="text-white">{subscription.current_period_end?.slice(0, 10)}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Interval: <strong className="text-white capitalize">{subscription.billing_interval}ly Billing</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Tenant Boundary: <strong className="text-white">Organization Scoped</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Live Resource Usage Gauges */}
      {usageMetrics && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Live Resource Utilization vs. Plan Quotas</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Computed from live ERP records</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Students Gauge */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  Active Students
                </span>
                <span className="font-bold text-white">
                  {usageMetrics.usage.students.current.toLocaleString()} / {usageMetrics.usage.students.unlimited ? '∞ Unlimited' : usageMetrics.usage.students.limit?.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, usageMetrics.usage.students.percentage))}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>Utilization</span>
                <span className="text-cyan-400 font-bold">{usageMetrics.usage.students.unlimited ? '0% (Unlimited)' : `${usageMetrics.usage.students.percentage}%`}</span>
              </p>
            </div>

            {/* Staff Gauge */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Faculty & Staff
                </span>
                <span className="font-bold text-white">
                  {usageMetrics.usage.staff.current.toLocaleString()} / {usageMetrics.usage.staff.unlimited ? '∞ Unlimited' : usageMetrics.usage.staff.limit?.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, usageMetrics.usage.staff.percentage))}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>Utilization</span>
                <span className="text-emerald-400 font-bold">{usageMetrics.usage.staff.unlimited ? '0% (Unlimited)' : `${usageMetrics.usage.staff.percentage}%`}</span>
              </p>
            </div>

            {/* AI Requests Gauge */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-400" />
                  DAKSHORA AI Requests
                </span>
                <span className="font-bold text-white">
                  {usageMetrics.usage.aiRequests.current.toLocaleString()} / {usageMetrics.usage.aiRequests.unlimited ? '∞ Unlimited' : (usageMetrics.usage.aiRequests.limit || 0).toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, usageMetrics.usage.aiRequests.percentage))}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>Monthly Cycle</span>
                <span className="text-purple-400 font-bold">{usageMetrics.usage.aiRequests.percentage}% used</span>
              </p>
            </div>

            {/* Campuses & Cloud Storage */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  Campuses / Branches
                </span>
                <span className="font-bold text-white">
                  {usageMetrics.usage.campuses.current} / {usageMetrics.usage.campuses.unlimited ? '∞ Unlimited' : usageMetrics.usage.campuses.limit}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, usageMetrics.usage.campuses.percentage))}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>Storage: {usageMetrics.usage.storageGb.current} GB</span>
                <span className="text-amber-400 font-bold">{usageMetrics.usage.storageGb.limit} GB Limit</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans Pricing & Feature Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Commercial SaaS Subscription Tiers</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">B2B Institutional Plans</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isSelected = subscription?.plan_id === p.id;
            return (
              <div
                key={p.id}
                className={`glass-panel p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-6 ${
                  isSelected
                    ? 'bg-amber-950/25 border-amber-500/60 ring-2 ring-amber-500/30 shadow-2xl shadow-amber-500/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-white font-mono">{p.name}</span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] font-mono border border-amber-500/40 flex items-center gap-1">
                        <Check className="w-3 h-3 text-amber-400" />
                        ACTIVE TIER
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white font-mono">
                      ₹{p.priceINR.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ {p.interval}</span>
                  </div>

                  <p className="text-xs text-slate-400 font-mono min-h-[32px]">
                    {p.description || 'Configurable SaaS tier with comprehensive modular entitlements.'}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Student Limit:</span>
                      <span className="font-bold text-white">{p.limits?.max_students ? p.limits.max_students.toLocaleString() : 'Unlimited'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Staff Limit:</span>
                      <span className="font-bold text-white">{p.limits?.max_staff ? p.limits.max_staff.toLocaleString() : 'Unlimited'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">AI Copilot:</span>
                      <span className="font-bold text-purple-300">{p.limits?.max_ai_requests ? `${p.limits.max_ai_requests.toLocaleString()} req/mo` : 'Disabled'}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-slate-800/80">
                    {(Array.isArray(p.features) ? p.features : [p.features]).map((feat: any, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleOpenPlanChange(p)}
                  disabled={isSelected || actionLoading}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                      : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-amber-400 shadow-md'
                  }`}
                >
                  <span>{isSelected ? 'Current Active Tier' : `Switch to ${p.name}`}</span>
                  {!isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Factual Plan Comparison Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Factual Entitlement & Module Comparison Matrix</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Generated dynamically from Plan Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 text-slate-300">Module / Feature Capability</th>
                {plans.map(p => (
                  <th key={p.id} className={`pb-3 text-center ${subscription?.plan_id === p.id ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {[
                { name: 'Core Student & Staff Management', key: 'students' },
                { name: 'Daily Attendance & Biometric Registers', key: 'attendance' },
                { name: 'Academics & Timetable Scheduling', key: 'academics' },
                { name: 'Parent & Student Self-Service Portal', key: 'portal' },
                { name: 'School Noticeboard & Broadcasts', key: 'communication' },
                { name: 'Examinations, Marks & CBSE Report Cards', key: 'exams' },
                { name: 'Fee Collections & Dues Management', key: 'fees' },
                { name: 'Admissions Funnel & Lead CRM', key: 'admissions' },
                { name: 'Library Book & Inventory Management', key: 'library' },
                { name: 'Transport Fleet & Route Rostering', key: 'transport' },
                { name: 'DAKSHORA AI Teacher & Admin Copilot', key: 'ai' },
                { name: 'Executive Reports & Analytics CSV', key: 'reports' },
                { name: 'Staff HR & Payroll Statutory Compliance', key: 'payroll' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50">
                  <td className="py-2.5 text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>{row.name}</span>
                  </td>
                  {plans.map(p => {
                    const hasModule = (p.modules || []).includes(row.key);
                    return (
                      <td key={p.id} className="py-2.5 text-center">
                        {hasModule ? (
                          <span className="inline-flex p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-600 font-bold">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>SaaS Platform Invoices & Tax Receipts</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">{invoices.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2.5">Invoice #</th>
                <th className="pb-2.5">Organization / School</th>
                <th className="pb-2.5">Plan Tier</th>
                <th className="pb-2.5">Subtotal</th>
                <th className="pb-2.5">GST (18%)</th>
                <th className="pb-2.5">Total INR</th>
                <th className="pb-2.5">Date</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-900/50">
                  <td className="py-3 text-amber-300 font-bold">{inv.invoiceNumber || inv.id}</td>
                  <td className="py-3 text-white">{inv.orgName}</td>
                  <td className="py-3 text-slate-300">{inv.plan}</td>
                  <td className="py-3 text-slate-400">₹{inv.subtotalINR ? inv.subtotalINR.toLocaleString() : Math.round(inv.amountINR / 1.18).toLocaleString()}</td>
                  <td className="py-3 text-slate-400">₹{inv.taxGstINR ? inv.taxGstINR.toLocaleString() : Math.round(inv.amountINR - (inv.amountINR / 1.18)).toLocaleString()}</td>
                  <td className="py-3 font-bold text-slate-200">₹{inv.amountINR.toLocaleString()}</td>
                  <td className="py-3 text-slate-400">{inv.date || inv.issueDate}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setShowReceiptModal(inv)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-mono flex items-center gap-1 ml-auto"
                    >
                      <Receipt className="w-3 h-3 text-amber-400" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🧩 MODE 2: SOLUTION BUILDER & COMMERCIAL QUOTATION GENERATOR (PHASE 14 & 15) */}
      {/* ========================================================================= */}
      {activeHubTab === 'solution_builder' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Solution Builder Header & Presets */}
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-slate-900 to-indigo-950/20 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-cyan-400" />
                    MODULAR SOLUTION BUILDER
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                    HSN / SAC 998314
                  </span>
                </div>
                <h2 className="text-xl font-black text-white font-mono">
                  Custom School ERP & STEAM Solution Architecture
                </h2>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Select exact modules your campus requires. Adjust student volume and billing cycle for instant B2B quotations.
                </p>
              </div>

              {/* Quick Configuration Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-slate-400 mr-1">Quick Presets:</span>
                <button
                  onClick={() => applyPreset('essentials')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-all"
                >
                  Core (4)
                </button>
                <button
                  onClick={() => applyPreset('cbse')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold transition-all"
                >
                  CBSE Standard (8)
                </button>
                <button
                  onClick={() => applyPreset('full')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-mono font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
                >
                  Full STEAM & AI (All 13)
                </button>
              </div>
            </div>

            {/* Controls Bar: Student Slider & Billing Interval Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
              {/* Student Scale Slider */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-cyan-400" />
                    <span>Campus Student Enrollment:</span>
                  </span>
                  <span className="text-lg font-black text-cyan-300">
                    {studentCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">Students</span>
                  </span>
                </div>

                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={25}
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                <div className="flex items-center justify-between gap-1 pt-1">
                  {[250, 500, 850, 1200, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setStudentCount(val)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                        studentCount === val
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {val >= 1000 ? `${(val / 1000).toFixed(val % 1000 !== 0 ? 1 : 0)}k` : val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Billing Cycle Selector with Prepay Discount */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Contract Billing Frequency:</span>
                  </span>
                  {billingInterval === 'annual' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                      20% PREPAY DISCOUNT APPLIED
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setBillingInterval('monthly')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                      billingInterval === 'monthly'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monthly Invoicing
                  </button>
                  <button
                    onClick={() => setBillingInterval('annual')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                      billingInterval === 'annual'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Annual (Save 20%)</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>GST Rate: 18.0% (SAC 998314)</span>
                  <span>Base Platform Setup: ₹4,999/mo Included</span>
                </div>
              </div>
            </div>
          </div>

          {/* Module Catalog & Sticky Quotation Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: 13 Modular Choices (8 Cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-cyan-400" />
                  <span>Available Institutional Modules ({builderModules.length} / {SOLUTION_MODULES.length} Selected)</span>
                </span>
                <span className="text-slate-500 text-[11px]">Click to toggle modules</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOLUTION_MODULES.map((m) => {
                  const isSelected = builderModules.includes(m.id);
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleModule(m.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none space-y-2.5 ${
                        isSelected
                          ? 'bg-slate-900/90 border-cyan-500/60 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-950/30'
                          : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border ${
                            isSelected
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white font-mono leading-tight">{m.name}</h4>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">{m.category}</span>
                          </div>
                        </div>

                        {/* Switch Indicator */}
                        <div className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                          isSelected ? 'bg-cyan-500' : 'bg-slate-800'
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                            isSelected ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-mono">
                        {m.desc}
                      </p>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-500">Per Student:</span>
                        <span className="font-bold text-white">₹{m.pricePerStudentMonth} / mo</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Real-Time Commercial Quotation (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="glass-panel p-6 rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-black space-y-6 shadow-2xl sticky top-6 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-white text-sm">Commercial Investment Summary</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Ref: {quote?.quoteId || 'CALCULATING...'}
                    </p>
                  </div>
                  {isCalculatingQuote ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      VERIFIED
                    </span>
                  )}
                </div>

                {/* Breakdown Ledger */}
                <div className="space-y-3">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Base Platform ERP Cloud Setup:</span>
                    <span className="text-white">
                      ₹{(quote?.pricing?.basePlatformFeeMonthly || 2500).toLocaleString()} / mo
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <div>
                      <span className="text-slate-400">Modular Software Fees:</span>
                      <p className="text-[10px] text-slate-500">
                        {builderModules.length} Modules × {studentCount} Students
                      </p>
                    </div>
                    <span className="text-white font-bold">
                      ₹{((quote?.pricing?.effectivePerStudentMonthly || 0) * studentCount).toLocaleString()} / mo
                    </span>
                  </div>

                  {billingInterval === 'annual' && (quote?.pricing?.discountPercent || 0) > 0 && (
                    <div className="flex justify-between text-emerald-400 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30">
                      <div>
                        <span className="font-bold">Annual Prepay Discount ({quote?.pricing?.discountPercent}% OFF):</span>
                        <p className="text-[10px] text-emerald-300/80">Includes free onboarding & staff training</p>
                      </div>
                      <span className="font-bold">
                        -20% Applied
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Taxable Net Subtotal:</span>
                    <span className="text-white font-bold">
                      ₹{(quote?.pricing?.annualSubtotalINR || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <div>
                      <span>Integrated GST ({quote?.pricing?.gstRatePercent || 18}.0%):</span>
                      <p className="text-[10px] text-slate-500">SAC / HSN Code: {quote?.pricing?.hsnCode || '998314'}</p>
                    </div>
                    <span>
                      ₹{(quote?.pricing?.gstAmountINR || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Grand Total */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50 border border-cyan-500/40 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-300 uppercase tracking-wider font-bold">
                        Grand Total Investment:
                      </span>
                      <span className="text-2xl font-black text-cyan-300">
                        ₹{(quote?.pricing?.grandTotalINR || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Effective Cost per Month:</span>
                      <span className="text-white font-bold">
                        ₹{(quote?.pricing?.monthlyChargeableINR || 0).toLocaleString()} / mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setShowQuoteModal(true)}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 border border-slate-700 shadow-md transition-all"
                  >
                    <Printer className="w-4 h-4 text-cyan-400" />
                    <span>Download / Print Commercial Quotation</span>
                  </button>

                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01]"
                  >
                    <Zap className="w-4 h-4 text-slate-950" />
                    <span>Accept & Simulate UPI / NetBanking Activation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Change Modal with Downgrade Protection */}
      {selectedPlanForChange && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 bg-slate-900 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold font-mono">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Confirm Subscription Plan Change</span>
              </div>
              <button
                onClick={() => setSelectedPlanForChange(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Plan:</span>
                  <span className="text-slate-200 font-bold">{subscription?.plan || 'Enterprise'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Plan:</span>
                  <span className="text-amber-400 font-bold">{selectedPlanForChange.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">New Price:</span>
                  <span className="text-white font-bold">₹{selectedPlanForChange.priceINR.toLocaleString()} / {selectedPlanForChange.interval}</span>
                </div>
              </div>

              {/* Downgrade Protection Pre-flight Check Display */}
              {selectedPlanForChange.limits?.max_students !== null && usageMetrics && (
                usageMetrics.usage.students.current > (selectedPlanForChange.limits?.max_students || 0) ? (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Downgrade Blocked by Data Protection Guard</span>
                    </div>
                    <p className="text-[11px] text-rose-200">
                      Active students ({usageMetrics.usage.students.current}) exceeds target limit ({selectedPlanForChange.limits?.max_students}). 
                      DAKSHORA never deletes student records on downgrade. Please choose a higher tier.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Usage check passed. Active students are safely within the target plan limits.</span>
                  </div>
                )
              )}

              <p className="text-slate-400">
                Your card/account will be charged ₹{selectedPlanForChange.priceINR.toLocaleString()} + applicable 18% GST.
                All student enrollments, exam records, and fee ledgers remain completely safe.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedPlanForChange(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPlanChange}
                disabled={actionLoading || Boolean(selectedPlanForChange.limits?.max_students !== null && usageMetrics && usageMetrics.usage.students.current > (selectedPlanForChange.limits?.max_students || 0))}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>Confirm & Activate Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-rose-500/40 bg-slate-900 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 font-bold font-mono text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancel SaaS Subscription?</span>
            </div>

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <p>
                Are you sure you want to cancel the subscription for <strong>Delhi Public Heritage Trust</strong>?
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-white font-bold">🔒 Zero Data Loss Guarantee:</p>
                <p className="text-slate-400 text-[11px]">
                  Cancellation takes effect at period end ({subscription?.current_period_end?.slice(0, 10)}). 
                  No student, faculty, examination, or school fee records are ever deleted.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Keep Active
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Tax Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 bg-slate-900 max-w-lg w-full space-y-6 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span>DAKSHORA 2.0 B2B TAX INVOICE</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start text-[11px]">
                <div>
                  <p className="font-bold text-white">DAKSHORA Cloud Systems India Ltd.</p>
                  <p className="text-slate-400">Cyber City, DLF Phase 2, Gurugram - 122002</p>
                  <p className="text-slate-400">GSTIN: 06AAECD1234F1Z8</p>
                  <p className="text-slate-400">SAC Code: 998313 (Software as a Service)</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-bold">{showReceiptModal.invoiceNumber || showReceiptModal.id}</p>
                  <p className="text-slate-400">Date: {showReceiptModal.date || showReceiptModal.issueDate}</p>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                    {showReceiptModal.status}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                <p className="text-slate-400">Billed To:</p>
                <p className="font-bold text-white">{showReceiptModal.orgName}</p>
                <p className="text-slate-400">Organization ID: b17780e5-3832-4ac6-9aeb-33fd80c5cb0e</p>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex justify-between text-slate-300">
                  <span>{showReceiptModal.plan} (Subscription Fee)</span>
                  <span>₹{(showReceiptModal.subtotalINR || Math.round(showReceiptModal.amountINR / 1.18)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Integrated GST (IGST @ 18.0%)</span>
                  <span>₹{(showReceiptModal.taxGstINR || Math.round(showReceiptModal.amountINR - (showReceiptModal.amountINR / 1.18))).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm border-t border-slate-800 pt-2">
                  <span>Total Amount Paid</span>
                  <span className="text-amber-400">₹{showReceiptModal.amountINR.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  onShowToast('success', 'Receipt Downloaded', 'Tax invoice PDF saved to your downloads.');
                  setShowReceiptModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📄 FORMAL COMMERCIAL QUOTATION PRINT MODAL (PHASE 14 & 15) */}
      {/* ========================================================================= */}
      {showQuoteModal && quote && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border-2 border-cyan-500/40 rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 font-mono text-xs my-8 text-slate-200">
            {/* Header / Vendor & Client */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                    D
                  </div>
                  <h2 className="text-base font-black text-white">DAKSHORA Cloud Systems India Ltd.</h2>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cyber City, DLF Phase 2, Gurugram, Haryana - 122002 • GSTIN: 06AAECD1234F1Z8
                </p>
                <p className="text-[11px] text-cyan-400">
                  SAC/HSN Code: 998314 (Information Technology Software Services)
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
                <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                  COMMERCIAL PROPOSAL
                </span>
                <p className="text-white font-bold mt-2 text-sm">{quote.quoteId}</p>
                <p className="text-slate-400 text-[11px]">Date: {quote.date}</p>
                <p className="text-amber-400 text-[11px]">Valid Until: {quote.validUntil} (30 Days)</p>
              </div>
            </div>

            {/* Client Institutional Details */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block">Proposed Client / Trust:</span>
                <strong className="text-white text-xs">{quote.schoolName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Licensed Student Capacity:</span>
                <strong className="text-cyan-300 text-xs">{quote.studentCount.toLocaleString()} Enrolled Learners</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Billing Terms:</span>
                <strong className="text-white text-xs capitalize">{quote.billingCycle}ly Contract</strong>
              </div>
            </div>

            {/* Itemized Modules Schedule */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Selected Functional Modules ({quote.itemizedModules.length} Modules Active):</span>
                <span className="text-[11px] text-slate-500">Per Student / Month Rate</span>
              </div>
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Module Name</th>
                      <th className="py-2 px-3">Module Code</th>
                      <th className="py-2 px-3 text-right">Student Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {quote.itemizedModules.map((m: any, idx: number) => (
                      <tr key={m.key} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 text-white font-bold">{m.name}</td>
                        <td className="py-2 px-3 text-slate-400 uppercase text-[10px] font-mono">{m.key}</td>
                        <td className="py-2 px-3 text-right text-cyan-300 font-mono">₹{m.ratePerStudentMonthly} / mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commercial Pricing Table */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Base Platform Cloud ERP Setup Fee:</span>
                <span className="text-white">₹{quote.pricing.basePlatformFeeMonthly.toLocaleString()} / mo</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Effective Per Student Monthly:</span>
                <span className="text-white">₹{quote.pricing.effectivePerStudentMonthly.toLocaleString()} / student / mo</span>
              </div>
              {quote.pricing.discountPercent > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Annual Prepayment Discount ({quote.pricing.discountPercent}% OFF):</span>
                  <span>Applied</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                <span>Net Taxable Subtotal ({quote.billingCycle === 'annual' ? '12 Months' : '1 Month'}):</span>
                <span className="text-white font-bold">₹{quote.pricing.annualSubtotalINR.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Integrated GST (IGST @ {quote.pricing.gstRatePercent}% - HSN {quote.pricing.hsnCode}):</span>
                <span>₹{quote.pricing.gstAmountINR.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-800">
                <span>Total Commercial Investment:</span>
                <span className="text-cyan-300 text-base">₹{quote.pricing.grandTotalINR.toLocaleString()}</span>
              </div>
            </div>

            {/* Terms & Official Seal */}
            <div className="pt-2 text-[10px] text-slate-400 leading-relaxed space-y-1">
              <p>• Quotation includes 99.9% uptime SLA, nightly encrypted multi-tenant backups, and CBSE/NEP statutory compliance upgrades.</p>
              <p>• Payment terms: 100% advance against GST invoice. Bank transfer via NEFT/RTGS/UPI to DAKSHORA Cloud Systems India Ltd.</p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowQuoteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  onShowToast('success', 'Quotation Dispatched 🖨️', 'Document sent to system print queue');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official PDF Quotation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💳 INSTANT ACTIVATION & PAYMENT SIMULATION MODAL (PHASE 15) */}
      {/* ========================================================================= */}
      {showPaymentModal && quote && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 font-mono text-xs text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>Activate Solution via Simulated Gateway</span>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Order Value Overview */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Solution Config:</span>
                <span className="text-white font-bold">{quote.itemizedModules.length} Modules ({quote.studentCount} Students)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Billing Interval:</span>
                <span className="text-emerald-400 font-bold capitalize">{quote.billingCycle}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                <span>Payable Amount (incl. 18% GST):</span>
                <span className="text-emerald-400 text-base">₹{quote.pricing.grandTotalINR.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Switcher */}
            <div className="space-y-3">
              <div className="text-slate-300 font-bold">Select Simulated Payment Channel:</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: QrCode },
                  { id: 'netbanking', label: 'NetBanking', icon: Building2 },
                  { id: 'card', label: 'Corp Card', icon: CreditCard }
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setSelectedPaymentMethod(pm.id as any)}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                      selectedPaymentMethod === pm.id
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/60 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <pm.icon className="w-4 h-4" />
                    <span className="text-[11px] font-bold">{pm.label}</span>
                  </button>
                ))}
              </div>

              {/* UPI Simulator */}
              {selectedPaymentMethod === 'upi' && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                  <div className="w-32 h-32 mx-auto rounded-xl bg-white p-2 flex items-center justify-center shadow-md">
                    <QrCode className="w-28 h-28 text-slate-950" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white">VPA: dakshora.enterprise@icici</p>
                    <p className="text-[10px] text-slate-400">Scan via GPay, PhonePe, Paytm, or BHIM</p>
                  </div>
                </div>
              )}

              {/* NetBanking Simulator */}
              {selectedPaymentMethod === 'netbanking' && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="text-[11px] text-slate-400 block">Select Corporate Institutional Bank:</label>
                  <select className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono">
                    <option>HDFC Bank Corporate NetBanking</option>
                    <option>ICICI Bank Corporate Banking</option>
                    <option>State Bank of India (SBI)</option>
                    <option>Axis Bank Commercial Gateway</option>
                  </select>
                </div>
              )}

              {/* Card Simulator */}
              {selectedPaymentMethod === 'card' && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Card Number:</span>
                    <p className="font-bold text-white">4532 •••• •••• 8894 (RuPay Corporate)</p>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Expiry: 08/29</span>
                    <span>CVV: •••</span>
                  </div>
                </div>
              )}
            </div>

            {/* Execution Button */}
            <div className="pt-2">
              <button
                onClick={handleExecutePaymentSimulation}
                disabled={paymentProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
              >
                {paymentProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Verifying Gateway Response...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Simulate Successful ₹{quote.pricing.grandTotalINR.toLocaleString()} Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
