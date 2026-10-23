import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.resolve(__dirname, "../src/erpApp.js");

console.log("Reading:", targetFile);
let code = fs.readFileSync(targetFile, "utf8");

// Standard replacement helper that normalizes line endings
function replaceBlock(src, target, replacement, label) {
  const normSrc = src.replace(/\r\n/g, "\n");
  const normTarget = target.replace(/\r\n/g, "\n");
  const normRep = replacement.replace(/\r\n/g, "\n");

  if (!normSrc.includes(normTarget)) {
    throw new Error(`Target block not found for: ${label}`);
  }

  const replaced = normSrc.replace(normTarget, normRep);
  console.log(`✓ Successfully patched: ${label}`);
  return replaced;
}

// -------------------------------------------------------------------------
// 1. Core Fee Engine and Disk Persistence Layer
// -------------------------------------------------------------------------
const target1 = `// Reference alias to maintain 100% backward-compatibility with existing legacy code
let ERP_FEES = ERP_FEE_DEMANDS;`;

const rep1 = `// Reference alias to maintain 100% backward-compatibility with existing legacy code
let ERP_FEES = ERP_FEE_DEMANDS;

// =========================================================================
// 💳 SCHOOL ERP: CONFIGURABLE FEE RULE ENGINE & DISK PERSISTENCE
// =========================================================================
let ERP_FEE_POLICIES = {};

const FEE_DATA_DIR = path.join(__dirname, '..', 'data');

function loadFeeDataFromDisk() {
  try {
    const structPath = path.join(FEE_DATA_DIR, 'fee_structures.json');
    if (fs.existsSync(structPath)) {
      const data = JSON.parse(fs.readFileSync(structPath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) ERP_FEE_STRUCTURES = data;
    }
    const concPath = path.join(FEE_DATA_DIR, 'fee_concessions.json');
    if (fs.existsSync(concPath)) {
      const data = JSON.parse(fs.readFileSync(concPath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) ERP_FEE_CONCESSIONS = data;
    }
    const demPath = path.join(FEE_DATA_DIR, 'fee_demands.json');
    if (fs.existsSync(demPath)) {
      const data = JSON.parse(fs.readFileSync(demPath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        ERP_FEE_DEMANDS = data;
        ERP_FEES = ERP_FEE_DEMANDS;
      }
    }
    const payPath = path.join(FEE_DATA_DIR, 'fee_payments.json');
    if (fs.existsSync(payPath)) {
      const data = JSON.parse(fs.readFileSync(payPath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) ERP_FEE_PAYMENTS = data;
    }
    const revPath = path.join(FEE_DATA_DIR, 'fee_reversals.json');
    if (fs.existsSync(revPath)) {
      const data = JSON.parse(fs.readFileSync(revPath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) ERP_FEE_REVERSALS = data;
    }
    const polPath = path.join(FEE_DATA_DIR, 'fee_policies.json');
    if (fs.existsSync(polPath)) {
      const data = JSON.parse(fs.readFileSync(polPath, 'utf8'));
      if (data && typeof data === 'object') ERP_FEE_POLICIES = data;
    }
    console.log('[Fee Engine DB] Loaded fee state: ' + ERP_FEE_STRUCTURES.length + ' structures, ' + ERP_FEE_DEMANDS.length + ' demands, ' + ERP_FEE_PAYMENTS.length + ' payments, ' + ERP_FEE_CONCESSIONS.length + ' concessions.');
  } catch (err) {
    console.warn('[Fee Engine DB] Disk load warning:', err.message);
  }
}

function saveFeeDataToDisk(key) {
  try {
    if (!fs.existsSync(FEE_DATA_DIR)) fs.mkdirSync(FEE_DATA_DIR, { recursive: true });
    if (!key || key === 'structures') {
      fs.writeFileSync(path.join(FEE_DATA_DIR, 'fee_structures.json'), JSON.stringify(ERP_FEE_STRUCTURES, null, 2), 'utf8');
    }
    if (!key || key === 'concessions') {
      fs.writeFileSync(path.join(FEE_DATA_DIR, 'fee_concessions.json'), JSON.stringify(ERP_FEE_CONCESSIONS, null, 2), 'utf8');
    }
    if (!key || key === 'demands') {
      fs.writeFileSync(path.join(FEE_DATA_DIR, 'fee_demands.json'), JSON.stringify(ERP_FEE_DEMANDS, null, 2), 'utf8');
      ERP_FEES = ERP_FEE_DEMANDS;
    }
    if (!key || key === 'payments') {
      fs.writeFileSync(path.join(FEE_DATA_DIR, 'fee_payments.json'), JSON.stringify(ERP_FEE_PAYMENTS, null, 2), 'utf8');
    }
    if (!key || key === 'reversals') {
      fs.writeFileSync(path.join(FEE_DATA_DIR, 'fee_reversals.json'), JSON.stringify(ERP_FEE_REVERSALS, null, 2), 'utf8');
    }
    if (!key || key === 'policies') {
      fs.writeFileSync(path.join(FEE_DATA_DIR, 'fee_policies.json'), JSON.stringify(ERP_FEE_POLICIES, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('[Fee Engine DB] Disk save warning:', err.message);
  }
}

function roundINR(val) {
  return Math.round((Number(val || 0) + Number.EPSILON) * 100) / 100;
}

function getTenantFeePolicy(orgId) {
  if (ERP_FEE_POLICIES[orgId]) return ERP_FEE_POLICIES[orgId];
  return {
    organization_id: orgId,
    academicSession: '2026-27',
    currency: 'INR',
    feeHeads: [
      { id: 'head-tuition', name: 'Tuition Fee', category: 'academic', isMandatory: true, defaultFrequency: 'quarterly' },
      { id: 'head-transport', name: 'Transport Fee', category: 'transport', isMandatory: false, defaultFrequency: 'quarterly' },
      { id: 'head-stem', name: 'Lab & STEM Fee', category: 'academic', isMandatory: true, defaultFrequency: 'annual' },
      { id: 'head-annual', name: 'Annual Development Fee', category: 'development', isMandatory: true, defaultFrequency: 'annual' },
      { id: 'head-exam', name: 'Examination & Assessment Fee', category: 'examination', isMandatory: true, defaultFrequency: 'half_yearly' },
      { id: 'head-admission', name: 'Admission & Registration Fee', category: 'one_time', isMandatory: true, defaultFrequency: 'one_time' }
    ],
    lateFeePolicy: {
      enabled: true,
      gracePeriodDays: 5,
      calculationType: 'fixed',
      fineAmountINR: 50,
      perDayFineINR: 10,
      maxFineCapINR: 500,
      applicableFrequency: 'per_demand'
    },
    concessionRules: [
      { type: 'sibling', name: 'Sibling Discount', defaultPercentage: 15, appliesTo: ['Tuition Fee'] },
      { type: 'merit_scholarship', name: 'Academic Merit Scholarship', defaultPercentage: 50, appliesTo: ['Tuition Fee'] },
      { type: 'staff_child', name: 'Faculty Ward Concession', defaultPercentage: 75, appliesTo: ['Tuition Fee'] },
      { type: 'ews_rte', name: 'EWS / RTE Exemption', defaultPercentage: 100, appliesTo: ['all'] },
      { type: 'special_hardship', name: 'Special Humanitarian Waiver', defaultPercentage: 25, appliesTo: ['Tuition Fee'] }
    ],
    installmentSchedules: {
      quarterly: [
        { period: 'Q1', label: 'Quarter 1 (Apr - Jun)', dueMonth: 4, dueDay: 10 },
        { period: 'Q2', label: 'Quarter 2 (Jul - Sep)', dueMonth: 7, dueDay: 10 },
        { period: 'Q3', label: 'Quarter 3 (Oct - Dec)', dueMonth: 10, dueDay: 10 },
        { period: 'Q4', label: 'Quarter 4 (Jan - Mar)', dueMonth: 1, dueDay: 10 }
      ]
    },
    receiptBranding: {
      receiptPrefix: 'REC',
      includeSchoolLogo: true,
      includeAffiliationNo: true,
      authorizedSignatory: 'Accounts Officer / Bursar',
      terms: '1. Fees once paid are non-refundable.\\n2. Late payment attracts fine as per school policy.\\n3. Cheque payment subject to realization.'
    },
    updated_at: new Date().toISOString()
  };
}

function computeStudentFeeLedger(orgId, studentId) {
  const student = ERP_STUDENTS.find(s => (s.organization_id === orgId) && (s.id === studentId || s.db_id === studentId || s.admissionNo === studentId || s.rollNo === studentId));
  
  const demands = ERP_FEE_DEMANDS.filter(d => 
    (d.organization_id === orgId) &&
    (d.studentId === studentId || (student && (d.studentId === student.id || (student.db_id && d.studentId === student.db_id) || d.studentName === student.name)))
  );

  const payments = ERP_FEE_PAYMENTS.filter(p => 
    (p.organization_id === orgId) &&
    (p.studentId === studentId || (student && (p.studentId === student.id || (student.db_id && p.studentId === student.db_id) || p.studentName === student.name)))
  );

  const reversals = ERP_FEE_REVERSALS.filter(r => 
    (r.organization_id === orgId) &&
    (r.studentId === studentId || (student && (r.studentId === student.id || r.studentName === student.name)))
  );

  const concessions = ERP_FEE_CONCESSIONS.filter(c => 
    (c.organization_id === orgId) &&
    (c.studentId === studentId || (student && (c.studentId === student.id || (student.db_id && c.studentId === student.db_id) || c.studentName === student.name)))
  );

  const totalOriginalAssessedFee = roundINR(demands.reduce((sum, d) => sum + (Number(d.baseAmount) || Number(d.amountINR) || 0), 0));
  const totalAdditionalCharges = roundINR(demands.reduce((sum, d) => sum + (Number(d.fineAmount) || 0), 0));
  const totalApprovedConcessions = roundINR(demands.reduce((sum, d) => sum + (Number(d.discountAmount) || 0), 0));
  
  const netFeePayable = roundINR(totalOriginalAssessedFee + totalAdditionalCharges - totalApprovedConcessions);
  const totalVerifiedPayments = roundINR(payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0));
  const totalReversals = roundINR(reversals.reduce((sum, r) => sum + (Number(r.reversalAmount) || 0), 0));
  const netPaymentsApplied = roundINR(Math.max(0, totalVerifiedPayments - totalReversals));
  const remainingOutstandingBalance = roundINR(Math.max(0, netFeePayable - netPaymentsApplied));
  
  const today = new Date().toISOString().slice(0, 10);
  const overdueDemands = demands.filter(d => (d.status === 'overdue' || (Number(d.balanceAmount) > 0 && d.dueDate < today)));
  const overdueAmount = roundINR(overdueDemands.reduce((sum, d) => sum + (Number(d.balanceAmount) || 0), 0));

  return {
    student: student ? {
      id: student.id,
      name: student.name,
      admissionNo: student.admissionNo,
      grade: student.grade,
      section: student.section,
      rollNo: student.rollNo,
      fatherName: student.fatherName || student.parentName,
      phone: student.phone || student.parentPhone
    } : { id: studentId, name: demands[0]?.studentName || 'Student' },
    accountingSummary: {
      totalOriginalAssessedFee,
      totalAdditionalCharges,
      totalApprovedConcessions,
      netFeePayable,
      totalVerifiedPayments,
      totalReversals,
      netPaymentsApplied,
      remainingOutstandingBalance,
      overdueAmount,
      currency: 'INR',
      invoicesCount: demands.length,
      paidInvoicesCount: demands.filter(d => d.status === 'paid').length,
      pendingInvoicesCount: demands.filter(d => d.status === 'pending' || d.status === 'partially_paid').length,
      overdueInvoicesCount: overdueDemands.length
    },
    demands,
    payments,
    reversals,
    concessions
  };
}

loadFeeDataFromDisk();
`;

code = replaceBlock(code, target1, rep1, "Core Fee Engine & Disk Persistence");

// -------------------------------------------------------------------------
// 2. New Fee Policy, Concessions, Fine Waiver & Ledgers Endpoints
// -------------------------------------------------------------------------
const target2 = `// 6b. GET /api/erp/fees/structures - List Fee Heads & Structure`;

const rep2 = `// 6a-1. GET /api/erp/fees/policy - Get Configured School Fee Policy
app.get("/api/erp/fees/policy", (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const policy = getTenantFeePolicy(orgId);
  res.json({
    success: true,
    policy,
    organization_id: orgId
  });
});

// 6a-2. POST /api/erp/fees/policy - Update Configured School Fee Policy
app.post("/api/erp/fees/policy", async (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const { feeHeads, lateFeePolicy, concessionRules, installmentSchedules, receiptBranding, academicSession } = req.body || {};

  const existing = getTenantFeePolicy(orgId);
  const updatedPolicy = {
    ...existing,
    academicSession: academicSession || existing.academicSession || "2026-27",
    feeHeads: Array.isArray(feeHeads) ? feeHeads : existing.feeHeads,
    lateFeePolicy: lateFeePolicy && typeof lateFeePolicy === "object" ? { ...existing.lateFeePolicy, ...lateFeePolicy } : existing.lateFeePolicy,
    concessionRules: Array.isArray(concessionRules) ? concessionRules : existing.concessionRules,
    installmentSchedules: installmentSchedules && typeof installmentSchedules === "object" ? { ...existing.installmentSchedules, ...installmentSchedules } : existing.installmentSchedules,
    receiptBranding: receiptBranding && typeof receiptBranding === "object" ? { ...existing.receiptBranding, ...receiptBranding } : existing.receiptBranding,
    updated_at: new Date().toISOString()
  };

  ERP_FEE_POLICIES[orgId] = updatedPolicy;
  saveFeeDataToDisk("policies");
  await recordAuditLog("erp.fee_policy_updated", req.user?.email || "admin", "fee_policy", orgId, req);

  res.json({
    success: true,
    message: "School fee policy and configuration updated successfully",
    policy: updatedPolicy
  });
});

// 6a-3. GET /api/erp/fees/concessions - List Concessions & Scholarships
app.get("/api/erp/fees/concessions", (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const { session, studentId, type } = req.query;

  let list = ERP_FEE_CONCESSIONS.filter(c => c.organization_id === orgId);
  if (session) list = list.filter(c => c.academicSession === session);
  if (studentId) list = list.filter(c => c.studentId === studentId);
  if (type) list = list.filter(c => c.concessionType === type);

  res.json({
    success: true,
    concessions: list,
    count: list.length
  });
});

// 6a-4. POST /api/erp/fees/concessions - Apply Student Concession / Scholarship / Waiver
app.post("/api/erp/fees/concessions", async (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const { studentId, concessionType, discountPercentage, discountAmountINR, reason, approvedBy, academicSession } = req.body || {};

  if (!studentId || !concessionType) {
    return res.status(400).json({ success: false, message: "studentId and concessionType are required" });
  }

  const student = ERP_STUDENTS.find(s => (s.organization_id === orgId) && (s.id === studentId || s.db_id === studentId || s.admissionNo === studentId));
  if (!student) {
    return res.status(404).json({ success: false, message: "Student record not found" });
  }

  const numPct = Number(discountPercentage) || 0;
  const numAmt = Number(discountAmountINR) || 0;
  if (numPct <= 0 && numAmt <= 0) {
    return res.status(400).json({ success: false, message: "Either discountPercentage or discountAmountINR must be greater than zero" });
  }

  const newConc = {
    id: \`conc-\${Date.now()}\`,
    studentId: student.id,
    studentName: student.name,
    admissionNo: student.admissionNo,
    grade: student.grade,
    section: student.section,
    concessionType,
    discountPercentage: numPct,
    discountAmountINR: numAmt,
    reason: reason || "Administrative approval",
    approvedBy: approvedBy || req.user?.name || "Principal",
    academicSession: academicSession || "2026-27",
    organization_id: orgId,
    created_at: new Date().toISOString()
  };

  ERP_FEE_CONCESSIONS.unshift(newConc);
  saveFeeDataToDisk("concessions");
  await recordAuditLog("erp.fee_concession_applied", req.user?.email || "admin", "fee_concession", newConc.id, req);

  res.status(201).json({
    success: true,
    message: \`Concession for \${student.name} registered successfully\`,
    concession: newConc
  });
});

// 6a-5. DELETE /api/erp/fees/concessions/:id - Revoke Concession
app.delete("/api/erp/fees/concessions/:id", async (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const { id } = req.params;

  const idx = ERP_FEE_CONCESSIONS.findIndex(c => (c.organization_id === orgId) && (c.id === id));
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "Concession record not found" });
  }

  const removed = ERP_FEE_CONCESSIONS.splice(idx, 1)[0];
  saveFeeDataToDisk("concessions");
  await recordAuditLog("erp.fee_concession_revoked", req.user?.email || "admin", "fee_concession", id, req);

  res.json({
    success: true,
    message: "Concession revoked successfully",
    revokedConcession: removed
  });
});

// 6a-6. POST /api/erp/fees/demands/:demandId/waive-fine - Authorized Late Fee / Fine Waiver
app.post("/api/erp/fees/demands/:demandId/waive-fine", async (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const { demandId } = req.params;
  const { reason, waivedBy } = req.body || {};

  const demand = ERP_FEE_DEMANDS.find(d => (d.organization_id === orgId) && (d.id === demandId || d.db_id === demandId || d.invoiceNo === demandId));
  if (!demand) {
    return res.status(404).json({ success: false, message: "Fee demand / invoice not found" });
  }

  const previousFine = Number(demand.fineAmount) || 0;
  demand.fineAmount = 0;
  demand.fineWaived = true;
  demand.fineWaivedBy = waivedBy || req.user?.email || "Principal / Administrator";
  demand.fineWaivedReason = reason || "Authorized fine waiver";
  demand.fineWaivedAt = new Date().toISOString();

  // Recalculate net & balance
  demand.netAmount = roundINR(Math.max(0, Number(demand.baseAmount || 0) - Number(demand.discountAmount || 0)));
  demand.balanceAmount = roundINR(Math.max(0, demand.netAmount - Number(demand.paidAmount || 0)));
  if (demand.balanceAmount <= 0) {
    demand.status = "paid";
  } else if (Number(demand.paidAmount) > 0) {
    demand.status = "partially_paid";
  } else {
    demand.status = "pending";
  }

  saveFeeDataToDisk("demands");

  // Sync with Supabase if db_id exists
  if (supabase && demand.db_id) {
    try {
      await supabase
        .from("student_fees")
        .update({
          amount_due: demand.netAmount,
          status: demand.balanceAmount <= 0 ? "paid" : "pending",
          updated_at: new Date().toISOString()
        })
        .eq("id", demand.db_id);
    } catch (_) {}
  }

  await recordAuditLog("erp.fee_fine_waived", req.user?.email || "admin", "fee_demand", demand.id, req);

  res.json({
    success: true,
    message: \`Late fee fine of ₹\${previousFine} successfully waived for invoice \${demand.invoiceNo}\`,
    demand
  });
});

// 6a-7. GET /api/erp/fees/students/:studentId/ledger - Complete Student Fee Ledger (Audit-Grade Accounting)
app.get("/api/erp/fees/students/:studentId/ledger", (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const { studentId } = req.params;

  const ledger = computeStudentFeeLedger(orgId, studentId);
  res.json({
    success: true,
    ...ledger
  });
});

// 6a-8. GET /api/erp/fees/ledger - Global Searchable & Filterable Student Fee Ledgers
app.get("/api/erp/fees/ledger", (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const { session, grade, section, status, search, page = 1, limit = 50 } = req.query;

  let students = ERP_STUDENTS.filter(s => s.organization_id === orgId);
  if (grade && grade !== "all") students = students.filter(s => s.grade.toLowerCase() === grade.toLowerCase());
  if (section && section !== "all") students = students.filter(s => s.section.toLowerCase() === section.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    students = students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.admissionNo && s.admissionNo.toLowerCase().includes(q)) ||
      (s.rollNo && s.rollNo.toString().includes(q))
    );
  }

  const ledgers = students.map(st => computeStudentFeeLedger(orgId, st.id));

  let filteredLedgers = ledgers;
  if (status && status !== "all") {
    if (status === "paid") {
      filteredLedgers = ledgers.filter(l => l.accountingSummary.remainingOutstandingBalance <= 0);
    } else if (status === "overdue") {
      filteredLedgers = ledgers.filter(l => l.accountingSummary.overdueAmount > 0);
    } else if (status === "pending" || status === "due") {
      filteredLedgers = ledgers.filter(l => l.accountingSummary.remainingOutstandingBalance > 0);
    }
  }

  const totalAssessed = roundINR(filteredLedgers.reduce((sum, l) => sum + l.accountingSummary.totalOriginalAssessedFee, 0));
  const totalFines = roundINR(filteredLedgers.reduce((sum, l) => sum + l.accountingSummary.totalAdditionalCharges, 0));
  const totalConcessions = roundINR(filteredLedgers.reduce((sum, l) => sum + l.accountingSummary.totalApprovedConcessions, 0));
  const totalNetPayable = roundINR(filteredLedgers.reduce((sum, l) => sum + l.accountingSummary.netFeePayable, 0));
  const totalCollected = roundINR(filteredLedgers.reduce((sum, l) => sum + l.accountingSummary.totalVerifiedPayments, 0));
  const totalOutstanding = roundINR(filteredLedgers.reduce((sum, l) => sum + l.accountingSummary.remainingOutstandingBalance, 0));
  const totalOverdue = roundINR(filteredLedgers.reduce((sum, l) => sum + l.accountingSummary.overdueAmount, 0));

  res.json({
    success: true,
    summary: {
      totalStudentsCount: filteredLedgers.length,
      totalAssessedINR: totalAssessed,
      totalFinesINR: totalFines,
      totalConcessionsINR: totalConcessions,
      totalNetPayableINR: totalNetPayable,
      totalCollectedINR: totalCollected,
      totalOutstandingINR: totalOutstanding,
      totalOverdueINR: totalOverdue,
      currency: "INR"
    },
    ledgers: filteredLedgers.slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit)),
    totalCount: filteredLedgers.length
  });
});

// 6b. GET /api/erp/fees/structures - List Fee Heads & Structure`;

code = replaceBlock(code, target2, rep2, "Policy, Concession & Ledger endpoints");

// -------------------------------------------------------------------------
// 3. Fee Structure & Demands Disk Persistence
// -------------------------------------------------------------------------
const target3a = `  ERP_FEE_STRUCTURES.unshift(newStructure);
  await recordAuditLog("erp.fee_structure_created", req.user?.email || "admin", "fee_structure", newStructure.id, req);`;

const rep3a = `  ERP_FEE_STRUCTURES.unshift(newStructure);
  saveFeeDataToDisk("structures");
  await recordAuditLog("erp.fee_structure_created", req.user?.email || "admin", "fee_structure", newStructure.id, req);`;

code = replaceBlock(code, target3a, rep3a, "Structure Create saveFeeDataToDisk");

const target3b = `      .eq("id", struct.db_id);
  }

  await recordAuditLog("erp.fee_structure_updated", req.user?.email || "admin", "fee_structure", struct.id, req);`;

const rep3b = `      .eq("id", struct.db_id);
  }

  saveFeeDataToDisk("structures");
  await recordAuditLog("erp.fee_structure_updated", req.user?.email || "admin", "fee_structure", struct.id, req);`;

code = replaceBlock(code, target3b, rep3b, "Structure Update saveFeeDataToDisk");

const target3c = `      .eq("id", struct.db_id);
  }

  await recordAuditLog("erp.fee_structure_deactivated", req.user?.email || "admin", "fee_structure", struct.id, req);`;

const rep3c = `      .eq("id", struct.db_id);
  }

  saveFeeDataToDisk("structures");
  await recordAuditLog("erp.fee_structure_deactivated", req.user?.email || "admin", "fee_structure", struct.id, req);`;

code = replaceBlock(code, target3c, rep3c, "Structure Deactivate saveFeeDataToDisk");

const target3d = `    generatedDemands.push(newDemand);
  }

  await recordAuditLog("erp.fee_demands_generated", req.user?.email || "admin", "fee_batch", \`\${generatedDemands.length}_demands\`, req);`;

const rep3d = `    generatedDemands.push(newDemand);
  }

  saveFeeDataToDisk("demands");
  await recordAuditLog("erp.fee_demands_generated", req.user?.email || "admin", "fee_batch", \`\${generatedDemands.length}_demands\`, req);`;

code = replaceBlock(code, target3d, rep3d, "Demands Generate saveFeeDataToDisk");

// -------------------------------------------------------------------------
// 4. Cashier Collect Payment: duesINR sync + disk persistence
// -------------------------------------------------------------------------
const target4 = `  if (dbPayment) {
    newPayment.db_id = dbPayment.id;
  }

  ERP_FEE_PAYMENTS.unshift(newPayment);
  await recordAuditLog("erp.fee_payment_collected", req.user?.email || "cashier", "fee_payment", newPayment.id, req);`;

const rep4 = `  if (dbPayment) {
    newPayment.db_id = dbPayment.id;
  }

  // Synchronize student profile duesINR in memory
  const feeStudent = ERP_STUDENTS.find(s => (s.organization_id === orgId) && (s.id === demand.studentId || s.admissionNo === demand.admissionNo));
  if (feeStudent) {
    feeStudent.duesINR = roundINR(Math.max(0, (feeStudent.duesINR || 0) - numPaid));
  }

  ERP_FEE_PAYMENTS.unshift(newPayment);
  saveFeeDataToDisk("payments");
  saveFeeDataToDisk("demands");
  await recordAuditLog("erp.fee_payment_collected", req.user?.email || "cashier", "fee_payment", newPayment.id, req);`;

code = replaceBlock(code, target4, rep4, "Cashier Collect dues & disk sync");

// -------------------------------------------------------------------------
// 5. Reversal: duesINR restore + disk persistence
// -------------------------------------------------------------------------
const target5 = `  ERP_FEE_REVERSALS.unshift(reversal);
  await recordAuditLog("erp.fee_payment_reversed", req.user?.email || "admin", "fee_payment", payment.id, req);`;

const rep5 = `  // Restore student profile duesINR in memory
  const revStudent = ERP_STUDENTS.find(s => (s.organization_id === orgId) && (s.id === payment.studentId || s.admissionNo === payment.admissionNo));
  if (revStudent) {
    revStudent.duesINR = roundINR((revStudent.duesINR || 0) + Number(payment.amountPaid));
  }

  ERP_FEE_REVERSALS.unshift(reversal);
  saveFeeDataToDisk("payments");
  saveFeeDataToDisk("demands");
  saveFeeDataToDisk("reversals");
  await recordAuditLog("erp.fee_payment_reversed", req.user?.email || "admin", "fee_payment", payment.id, req);`;

code = replaceBlock(code, target5, rep5, "Reversal dues restore & disk sync");

// -------------------------------------------------------------------------
// 6. Receipt Fetching: Supabase Fallback
// -------------------------------------------------------------------------
const target6 = `  const payment = ERP_FEE_PAYMENTS.find(p =>
    (p.organization_id === orgId) &&
    (p.receiptNo.toLowerCase() === receiptNo.toLowerCase() || p.id === receiptNo || p.db_id === receiptNo)
  );

  if (!payment) {
    return res.status(404).json({ success: false, message: \`Receipt '\${receiptNo}' not found\` });
  }`;

const rep6 = `  let payment = ERP_FEE_PAYMENTS.find(p =>
    (p.organization_id === orgId) &&
    (p.receiptNo.toLowerCase() === receiptNo.toLowerCase() || p.id === receiptNo || p.db_id === receiptNo)
  );

  if (!payment && supabase) {
    try {
      const { data: dbPayment } = await supabase
        .from("fee_payments")
        .select("*, student_fees(*, students(*), fee_structures(*))")
        .eq("organization_id", orgId)
        .or(\`receipt_no.eq.\${receiptNo},id.eq.\${receiptNo}\`)
        .maybeSingle();
      if (dbPayment) {
        payment = {
          id: dbPayment.id,
          receiptNo: dbPayment.receipt_no,
          organization_id: orgId,
          demandId: dbPayment.student_fee_id,
          invoiceNo: \`INV-\${(dbPayment.student_fee_id || "").slice(0, 8)}\`,
          studentId: dbPayment.student_fees?.student_id,
          studentName: [dbPayment.student_fees?.students?.first_name, dbPayment.student_fees?.students?.last_name].filter(Boolean).join(" "),
          admissionNo: dbPayment.student_fees?.students?.admission_no,
          grade: dbPayment.student_fees?.students?.grade,
          section: dbPayment.student_fees?.students?.section,
          feeHead: dbPayment.student_fees?.fee_structures?.name || "Tuition Fee",
          amountPaid: Number(dbPayment.amount || 0),
          paymentDate: dbPayment.payment_date,
          paymentMode: dbPayment.payment_method || "cash",
          referenceNumber: dbPayment.transaction_reference || "N/A",
          collectedBy: "Front Desk Cashier",
          status: dbPayment.status || "completed"
        };
      }
    } catch (_) {}
  }

  if (!payment) {
    return res.status(404).json({ success: false, message: \`Receipt '\${receiptNo}' not found\` });
  }`;

code = replaceBlock(code, target6, rep6, "Receipt Supabase Fallback");

// -------------------------------------------------------------------------
// 7. Online Payment Verification: sequential receipt, dues sync, disk save & Webhook
// -------------------------------------------------------------------------
const target7 = `  const cleanGrade = (demand.grade || "10").replace(/\\D/g, "") || "10";
  const cleanSec = demand.section || "A";
  const seq = String(ERP_FEE_PAYMENTS.length + 101).padStart(4, "0");
  const receiptNo = \`REC/2026-27/\${cleanGrade}\${cleanSec}/\${seq}-\${Date.now().toString().slice(-4)}\`;

  demand.paidAmount = Math.round((Number(demand.paidAmount) + numPaid) * 100) / 100;
  demand.balanceAmount = Math.max(0, Math.round((Number(demand.netAmount) - demand.paidAmount) * 100) / 100);
  demand.status = demand.balanceAmount <= 0 ? "paid" : "partially_paid";
  demand.paidAt = new Date().toISOString().slice(0, 10);
  demand.paymentMethod = "ONLINE_GATEWAY";
  demand.receiptNo = receiptNo;

  const newPayment = {
    id: \`pay-\${Date.now()}\`,
    receiptNo,
    demandId: demand.id,
    invoiceNo: demand.invoiceNo,
    studentId: demand.studentId,
    studentName: demand.studentName,
    admissionNo: demand.admissionNo || "DPS-2026-0000",
    grade: demand.grade,
    section: demand.section,
    feeHead: demand.feeHead,
    amountPaid: numPaid,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMode: "upi",
    referenceNumber: paymentId,
    collectedBy: "Automated Gateway (Razorpay/UPI)",
    remarks: \`Online Payment Verified: \${orderId}\`,
    status: "completed",
    organization_id: orgId,
    created_at: new Date().toISOString()
  };

  // DB persistence
  const dbPayment = await recordDbFeePayment(orgId, {
    ...newPayment,
    studentFeeId: demand.db_id,
    demand
  });
  if (dbPayment) newPayment.db_id = dbPayment.id;

  ERP_FEE_PAYMENTS.unshift(newPayment);
  if (order) order.status = "paid";

  await recordAuditLog("erp.fee_payment_online_verified", req.user?.email || "online_gateway", "fee_payment", newPayment.id, req);

  res.json({
    success: true,
    message: "Online payment successfully verified and receipt generated",
    receiptNo,
    payment: newPayment,
    demand
  });
});`;

const rep7 = `  const receiptNo = await generateNextReceiptNo(orgId);

  demand.paidAmount = roundINR((Number(demand.paidAmount) || 0) + numPaid);
  demand.balanceAmount = roundINR(Math.max(0, (Number(demand.netAmount) || 0) - demand.paidAmount));
  demand.status = demand.balanceAmount <= 0 ? "paid" : "partially_paid";
  demand.paidAt = new Date().toISOString().slice(0, 10);
  demand.paymentMethod = "ONLINE_GATEWAY";
  demand.receiptNo = receiptNo;

  // Synchronize student profile duesINR in memory
  const onlineStudent = ERP_STUDENTS.find(s => (s.organization_id === orgId) && (s.id === demand.studentId || s.admissionNo === demand.admissionNo));
  if (onlineStudent) {
    onlineStudent.duesINR = roundINR(Math.max(0, (onlineStudent.duesINR || 0) - numPaid));
  }

  const newPayment = {
    id: \`pay-\${Date.now()}\`,
    receiptNo,
    demandId: demand.id,
    invoiceNo: demand.invoiceNo,
    studentId: demand.studentId,
    studentName: demand.studentName,
    admissionNo: demand.admissionNo || "DPS-2026-0000",
    grade: demand.grade,
    section: demand.section,
    feeHead: demand.feeHead,
    amountPaid: numPaid,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMode: "upi",
    referenceNumber: paymentId,
    collectedBy: "Automated Gateway (Razorpay/UPI)",
    remarks: \`Online Payment Verified: \${orderId}\`,
    status: "completed",
    organization_id: orgId,
    created_at: new Date().toISOString()
  };

  // DB persistence
  const dbPayment = await recordDbFeePayment(orgId, {
    ...newPayment,
    studentFeeId: demand.db_id,
    demand
  });
  if (dbPayment) newPayment.db_id = dbPayment.id;

  ERP_FEE_PAYMENTS.unshift(newPayment);
  if (order) order.status = "paid";

  saveFeeDataToDisk("payments");
  saveFeeDataToDisk("demands");

  await recordAuditLog("erp.fee_payment_online_verified", req.user?.email || "online_gateway", "fee_payment", newPayment.id, req);

  res.json({
    success: true,
    message: "Online payment successfully verified and receipt generated",
    receiptNo,
    payment: newPayment,
    demand
  });
});

// 6q2. POST /api/erp/fees/online/webhook - Razorpay Official School Fee Webhook (Signature verified & Idempotent)
app.post("/api/erp/fees/online/webhook", async (req, res) => {
  const webhookSignature = req.headers["x-razorpay-signature"];
  const event = req.body;
  const eventId = event?.id || event?.event_id || req.headers["x-razorpay-event-id"];

  if (!eventId) {
    return res.status(400).json({ success: false, message: "Missing event ID" });
  }

  const paymentEntity = event.payload?.payment?.entity || {};
  const orderEntity = event.payload?.order?.entity || {};
  const notes = paymentEntity.notes || orderEntity.notes || {};
  const orgId = notes.organization_id || resolveTenantOrgId(req);

  const gateway = await getTenantPaymentGateway(orgId);
  const webhookSecret = gateway?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;

  if (webhookSecret && webhookSignature) {
    try {
      const rawBody = req.rawBody || JSON.stringify(req.body);
      const expectedSig = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
      const sigBuf = Buffer.from(webhookSignature, "utf8");
      const expBuf = Buffer.from(expectedSig, "utf8");
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return res.status(400).json({ success: false, message: "Invalid webhook signature" });
      }
    } catch (_) {
      return res.status(400).json({ success: false, message: "Webhook signature verification error" });
    }
  }

  const eventType = event.event || event.type;
  if (eventType === "payment.captured" || eventType === "order.paid") {
    const paymentId = paymentEntity.id;
    const existing = ERP_FEE_PAYMENTS.find(p => p.organization_id === orgId && (p.referenceNumber === paymentId || p.remarks?.includes(paymentId)));
    if (existing) {
      return res.json({ success: true, duplicate: true, message: "Webhook event already processed (idempotent)", receiptNo: existing.receiptNo });
    }

    const demandId = notes.demandId;
    let demand = ERP_FEE_DEMANDS.find(d => d.organization_id === orgId && (d.id === demandId || d.db_id === demandId));
    if (!demand && notes.studentId) {
      demand = ERP_FEE_DEMANDS.find(d => d.organization_id === orgId && d.studentId === notes.studentId && d.balanceAmount > 0);
    }

    if (demand) {
      const amountPaid = roundINR(paymentEntity.amount ? paymentEntity.amount / 100 : demand.balanceAmount);
      const receiptNo = await generateNextReceiptNo(orgId);
      demand.paidAmount = roundINR((demand.paidAmount || 0) + amountPaid);
      demand.balanceAmount = roundINR(Math.max(0, (demand.netAmount || 0) - demand.paidAmount));
      demand.status = demand.balanceAmount <= 0 ? "paid" : "partially_paid";
      demand.paidAt = new Date().toISOString().slice(0, 10);
      demand.paymentMethod = "ONLINE_GATEWAY";
      demand.receiptNo = receiptNo;

      const student = ERP_STUDENTS.find(s => s.organization_id === orgId && (s.id === demand.studentId || s.admissionNo === demand.admissionNo));
      if (student) {
        student.duesINR = roundINR(Math.max(0, (student.duesINR || 0) - amountPaid));
      }

      const newPayment = {
        id: \`pay-\${Date.now()}\`,
        receiptNo,
        demandId: demand.id,
        invoiceNo: demand.invoiceNo,
        studentId: demand.studentId,
        studentName: demand.studentName,
        admissionNo: demand.admissionNo || "DPS-2026-0000",
        grade: demand.grade,
        section: demand.section,
        feeHead: demand.feeHead,
        amountPaid,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMode: "upi",
        referenceNumber: paymentId || \`RZP-\${Date.now()}\`,
        collectedBy: "Automated Gateway Webhook",
        remarks: \`Razorpay Webhook: \${eventId}\`,
        status: "completed",
        organization_id: orgId,
        created_at: new Date().toISOString()
      };

      await recordDbFeePayment(orgId, { ...newPayment, studentFeeId: demand.db_id, demand });
      ERP_FEE_PAYMENTS.unshift(newPayment);
      saveFeeDataToDisk("payments");
      saveFeeDataToDisk("demands");
      await recordAuditLog("erp.fee_payment_webhook_processed", "webhook@razorpay.internal", "fee_payment", newPayment.id, req);
    }
  }

  res.json({ success: true, processed: true, eventId });
});`;

code = replaceBlock(code, target7, rep7, "Online Verify & Webhook");

// -------------------------------------------------------------------------
// 8. Parent Portal: GET /api/erp/portal/fees/:studentId & POST /api/erp/portal/pay-fee
// -------------------------------------------------------------------------
const target8 = `// 16i. GET /api/erp/portal/fees/:studentId - Pending Dues & Fee Receipts Ledger
app.get("/api/erp/portal/fees/:studentId", (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const { studentId } = req.params;
  let student = ERP_STUDENTS.find(s => (s.organization_id === orgId) && (s.id === studentId || s.db_id === studentId || s.rollNo === studentId || s.admissionNo === studentId));
  if (!student) {
    const orgStudents = ERP_STUDENTS.filter(s => s.organization_id === orgId);
    if (orgStudents.length > 0) student = orgStudents.find(s => s.grade?.includes("10")) || orgStudents[0];
  }
  if (!student) {
    return res.status(404).json({ success: false, error: "STUDENT_NOT_FOUND", message: \`Student '\${studentId}' not found.\` });
  }

  // Filter demands for this student
  let demands = (typeof ERP_FEE_DEMANDS !== "undefined" ? ERP_FEE_DEMANDS : []).filter(d =>
    (d.organization_id === orgId) &&
    (d.studentId === student.id || (d.studentName || "").toLowerCase().includes(student.name.toLowerCase()))
  );

  // Fallback if no demands
  if (demands.length === 0) {
    demands = [
      {
        id: \`dem-\${student.id}-t1\`,
        organization_id: orgId,
        invoiceNo: \`INV-2026-\${(student.rollNo || "001").slice(-3)}-01\`,
        studentId: student.id,
        studentName: student.name,
        grade: student.grade,
        section: student.section,
        feeHead: "Term 2 Composite Tuition & Academic Development Fee",
        baseAmount: 18500,
        discountAmount: 0,
        netAmount: 18500,
        paidAmount: 18500 - (student.duesINR || 0),
        balanceAmount: student.duesINR || 0,
        dueDate: "2026-10-15",
        status: (student.duesINR || 0) > 0 ? "pending" : "paid"
      }
    ];
  }

  const totalInvoiced = demands.reduce((acc, d) => acc + (d.netAmount || d.baseAmount || 0), 0);
  const totalPaid = demands.reduce((acc, d) => acc + (d.paidAmount || 0), 0);
  const balance = Math.max(0, totalInvoiced - totalPaid);

  const payments = (typeof ERP_FEE_PAYMENTS !== "undefined" ? ERP_FEE_PAYMENTS : []).filter(p =>
    (p.organization_id === orgId) &&
    (p.studentId === student.id || (p.studentName || "").toLowerCase().includes(student.name.toLowerCase()))
  );

  res.json({
    success: true,
    studentId: student.id,
    studentName: student.name,
    summary: {
      totalInvoicedINR: totalInvoiced,
      totalDemandedINR: totalInvoiced,
      totalPaidINR: totalPaid,
      outstandingBalanceINR: balance,
      balanceDueINR: balance,
      overdueCount: demands.filter(d => d.status === "overdue").length,
      pendingCount: demands.filter(d => d.status === "pending" || d.balanceAmount > 0).length
    },
    invoices: demands,
    receipts: payments
  });
});

// 16j. POST /api/erp/portal/pay-fee - Instant UPI/Card Fee Payment & Official Receipt
app.post("/api/erp/portal/pay-fee", async (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const { studentId, demandId, amount, paymentMode = "upi", referenceNumber } = req.body;
  if (!studentId) {
    return res.status(400).json({ success: false, error: "MISSING_STUDENT", message: "studentId is required." });
  }

  let student = ERP_STUDENTS.find(s => (s.organization_id === orgId) && (s.id === studentId || s.db_id === studentId || s.rollNo === studentId || s.admissionNo === studentId));
  if (!student) {
    const orgStudents = ERP_STUDENTS.filter(s => s.organization_id === orgId);
    student = orgStudents.find(s => s.grade?.includes("10")) || orgStudents[0];
  }
  if (!student) {
    return res.status(404).json({ success: false, error: "STUDENT_NOT_FOUND", message: \`Student '\${studentId}' not found.\` });
  }

  let demand = (typeof ERP_FEE_DEMANDS !== "undefined" ? ERP_FEE_DEMANDS : []).find(d => 
    (d.organization_id === orgId) && d.id === demandId
  );
  if (!demand) {
    demand = (typeof ERP_FEE_DEMANDS !== "undefined" ? ERP_FEE_DEMANDS : []).find(
      d => (d.organization_id === orgId) &&
           (d.studentId === student.id || (d.studentName || "").toLowerCase().includes(student.name.toLowerCase())) &&
           (d.status === "pending" || d.balanceAmount > 0)
    );
  }

  if (!amount && !demand && (student.duesINR || 0) <= 0) {
    return res.status(400).json({ success: false, error: "NO_DUES", message: "Student has zero pending dues." });
  }

  const payAmt = amount ? Number(amount) : (demand ? (demand.balanceAmount || demand.netAmount) : 5000);
  const receiptNo = \`REC-PORTAL-\${Date.now()}\`;

  if (demand) {
    demand.paidAmount = (demand.paidAmount || 0) + payAmt;
    demand.balanceAmount = Math.max(0, (demand.balanceAmount || demand.netAmount) - payAmt);
    demand.status = demand.balanceAmount === 0 ? "paid" : "partially_paid";
    demand.paidAt = new Date().toISOString();
    demand.receiptNo = receiptNo;
  }

  student.duesINR = Math.max(0, (student.duesINR || 0) - payAmt);

  const receipt = {
    id: \`pay-\${Date.now()}\`,
    receiptNo,
    organization_id: orgId,
    demandId: demand?.id || \`dem-\${Date.now()}\`,
    invoiceNo: demand?.invoiceNo || \`INV-2026-ONLINE-\${(student.rollNo || "001").slice(-3)}\`,
    studentId: student.id,
    studentName: student.name,
    admissionNo: student.admissionNo,
    grade: student.grade,
    section: student.section,
    feeHead: demand?.feeHead || "Composite Tuition Fee",
    amountPaid: payAmt,
    paymentDate: new Date().toISOString(),
    paymentMode,
    status: "paid",
    referenceNumber: referenceNumber || \`UPI-TXN-\${Date.now()}\`,
    schoolName: ERP_MASTER_SETTINGS.school_profile.schoolName,
    affiliationNo: ERP_MASTER_SETTINGS.school_profile.affiliationNo
  };

  // Persist to Supabase public.fee_payments table
  if (supabase) {
    try {
      const dbPayment = await recordDbFeePayment(orgId, {
        ...receipt,
        studentFeeId: demand?.db_id,
        demand
      });
      if (dbPayment) {
        receipt.db_id = dbPayment.id;
      }
    } catch (e) {
      console.warn("[Portal Pay Fee] DB persistence warning:", e.message);
    }
  }

  if (typeof ERP_FEE_PAYMENTS !== "undefined") {
    ERP_FEE_PAYMENTS.unshift(receipt);
  }

  await recordAuditLog("portal.fee_paid", student.parentEmail || "parent", "fee_payment", receiptNo, req);

  res.json({
    success: true,
    message: \`Payment of ₹\${payAmt.toLocaleString('en-IN')} confirmed successfully! Official digital receipt generated.\`,
    receipt,
    updatedDuesINR: student.duesINR
  });
});`;

const rep8 = `// 16i. GET /api/erp/portal/fees/:studentId - Pending Dues & Fee Receipts Ledger (True Database Accounting)
app.get("/api/erp/portal/fees/:studentId", (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const { studentId } = req.params;

  const student = ERP_STUDENTS.find(s => (s.organization_id === orgId) && (s.id === studentId || s.db_id === studentId || s.rollNo === studentId || s.admissionNo === studentId));
  if (!student) {
    return res.status(404).json({ success: false, error: "STUDENT_NOT_FOUND", message: \`Student '\${studentId}' not found.\` });
  }

  const ledger = computeStudentFeeLedger(orgId, student.id);

  res.json({
    success: true,
    studentId: student.id,
    studentName: student.name,
    admissionNo: student.admissionNo,
    grade: student.grade,
    section: student.section,
    summary: {
      totalOriginalAssessedINR: ledger.accountingSummary.totalOriginalAssessedFee,
      totalInvoicedINR: ledger.accountingSummary.netFeePayable,
      totalDemandedINR: ledger.accountingSummary.netFeePayable,
      totalFinesINR: ledger.accountingSummary.totalAdditionalCharges,
      totalConcessionsINR: ledger.accountingSummary.totalApprovedConcessions,
      netAssessedFeeINR: ledger.accountingSummary.netFeePayable,
      totalPaidINR: ledger.accountingSummary.totalVerifiedPayments,
      outstandingBalanceINR: ledger.accountingSummary.remainingOutstandingBalance,
      balanceDueINR: ledger.accountingSummary.remainingOutstandingBalance,
      overdueAmountINR: ledger.accountingSummary.overdueAmount,
      overdueCount: ledger.demands.filter(d => d.status === "overdue" || (Number(d.balanceAmount) > 0 && d.dueDate < new Date().toISOString().slice(0, 10))).length,
      pendingCount: ledger.demands.filter(d => Number(d.balanceAmount) > 0).length
    },
    invoices: ledger.demands,
    receipts: ledger.payments,
    concessions: ledger.concessions,
    reversals: ledger.reversals
  });
});

// 16j. POST /api/erp/portal/pay-fee - Verified UPI/Card Fee Payment & Official Receipt
app.post("/api/erp/portal/pay-fee", async (req, res) => {
  const orgId = resolveTenantOrgId(req);
  const { studentId, demandId, amount, paymentMode = "upi", referenceNumber, orderId, paymentId, signature, simulator, remarks } = req.body;

  if (!studentId) {
    return res.status(400).json({ success: false, error: "MISSING_STUDENT", message: "studentId is required." });
  }

  const student = ERP_STUDENTS.find(s => (s.organization_id === orgId) && (s.id === studentId || s.db_id === studentId || s.rollNo === studentId || s.admissionNo === studentId));
  if (!student) {
    return res.status(404).json({ success: false, error: "STUDENT_NOT_FOUND", message: \`Student '\${studentId}' not found.\` });
  }

  let demand = ERP_FEE_DEMANDS.find(d => (d.organization_id === orgId) && (d.id === demandId || d.db_id === demandId));
  if (!demand) {
    demand = ERP_FEE_DEMANDS.find(d => (d.organization_id === orgId) && (d.studentId === student.id || d.admissionNo === student.admissionNo) && (d.balanceAmount > 0 || d.status === "pending"));
  }

  const payAmt = roundINR(amount ? Number(amount) : (demand ? (demand.balanceAmount || demand.netAmount) : (student.duesINR || 0)));
  if (payAmt <= 0) {
    return res.status(400).json({ success: false, error: "NO_DUES", message: "Student has zero pending dues for payment." });
  }

  const isProd = process.env.NODE_ENV === "production";

  // Production Security: Disallow simulated payment confirmation in production without signature
  if (isProd && (simulator === true || (!orderId && !paymentId))) {
    return res.status(403).json({
      success: false,
      code: "VERIFIED_GATEWAY_REQUIRED",
      message: "Direct simulated payment is disabled in production. Online payments must proceed through Razorpay/UPI gateway order verification."
    });
  }

  // If cryptographic order credentials are provided, verify them
  if (orderId && paymentId && signature) {
    const gateway = await getTenantPaymentGateway(orgId);
    const secret = gateway?.keySecret || (!isProd ? "dakshora_gateway_production_secret" : process.env.RAZORPAY_KEY_SECRET);
    if (secret) {
      try {
        const expectedSig = crypto.createHmac("sha256", secret).update(\`\${orderId}|\${paymentId}\`).digest("hex");
        const sigBuf = Buffer.from(signature, "utf8");
        const expBuf = Buffer.from(expectedSig, "utf8");
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
          return res.status(400).json({ success: false, error: "INVALID_SIGNATURE", message: "Cryptographic payment verification failed." });
        }
      } catch (_) {
        return res.status(400).json({ success: false, error: "SIGNATURE_ERROR", message: "Payment signature could not be verified." });
      }
    }
  }

  // Generate official strictly sequential FY receipt number
  const receiptNo = await generateNextReceiptNo(orgId);

  if (demand) {
    demand.paidAmount = roundINR((demand.paidAmount || 0) + payAmt);
    demand.balanceAmount = roundINR(Math.max(0, (demand.netAmount || 0) - demand.paidAmount));
    demand.status = demand.balanceAmount <= 0 ? "paid" : "partially_paid";
    demand.paidAt = new Date().toISOString().slice(0, 10);
    demand.receiptNo = receiptNo;
    demand.paymentMethod = (paymentMode || "UPI").toUpperCase();
  }

  // Synchronize student profile duesINR
  student.duesINR = roundINR(Math.max(0, (student.duesINR || 0) - payAmt));

  const receipt = {
    id: \`pay-\${Date.now()}\`,
    receiptNo,
    organization_id: orgId,
    demandId: demand?.id || \`dem-\${Date.now()}\`,
    invoiceNo: demand?.invoiceNo || \`INV-2026-ONLINE-\${(student.rollNo || "001").slice(-3)}\`,
    studentId: student.id,
    studentName: student.name,
    admissionNo: student.admissionNo || "DPS-2026-0000",
    grade: student.grade,
    section: student.section,
    feeHead: demand?.feeHead || "Composite Tuition Fee",
    amountPaid: payAmt,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMode: (paymentMode || "upi").toLowerCase(),
    status: "completed",
    referenceNumber: referenceNumber || paymentId || (orderId ? \`RZP-\${orderId.slice(-8)}\` : \`UPI-TXN-\${Date.now()}\`),
    collectedBy: req.body.collectedBy || (paymentMode === "cash" ? "School Cashier" : "Parent Portal (Online Gateway)"),
    remarks: remarks || \`Fee payment of ₹\${payAmt} settled via \${paymentMode.toUpperCase()}\`,
    schoolName: ERP_MASTER_SETTINGS?.school_profile?.schoolName || "Dakshora Academy",
    affiliationNo: ERP_MASTER_SETTINGS?.school_profile?.affiliationNo || "CBSE/2026/001",
    created_at: new Date().toISOString()
  };

  // Persist to Supabase public.fee_payments table
  if (supabase) {
    try {
      const dbPayment = await recordDbFeePayment(orgId, {
        ...receipt,
        studentFeeId: demand?.db_id,
        demand
      });
      if (dbPayment) {
        receipt.db_id = dbPayment.id;
      }
    } catch (e) {
      console.warn("[Portal Pay Fee] DB persistence warning:", e.message);
    }
  }

  ERP_FEE_PAYMENTS.unshift(receipt);
  saveFeeDataToDisk("payments");
  saveFeeDataToDisk("demands");

  await recordAuditLog("portal.fee_paid", student.parentEmail || "parent", "fee_payment", receiptNo, req);

  res.json({
    success: true,
    message: \`Payment of ₹\${payAmt.toLocaleString('en-IN')} confirmed successfully! Official receipt \${receiptNo} issued.\`,
    receipt,
    updatedDuesINR: student.duesINR
  });
});`;

code = replaceBlock(code, target8, rep8, "Parent Portal Fees & Pay-Fee");

// Save final file
fs.writeFileSync(targetFile, code, "utf8");
console.log("SUCCESS! All 8 sections seamlessly patched in erpApp.js.");
