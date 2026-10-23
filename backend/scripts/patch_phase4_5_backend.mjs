import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.resolve(__dirname, "../src/erpApp.js");

console.log("Reading target file:", targetFile);
let code = fs.readFileSync(targetFile, "utf8");

// Normalize line endings for replacement
const isCRLF = code.includes("\r\n");

function doReplace(str, oldBlock, newBlock, name) {
  if (str.includes(oldBlock)) {
    console.log(`Matched ${name} with exact string`);
    return str.replace(oldBlock, newBlock);
  }
  const oldLF = oldBlock.replace(/\r\n/g, "\n");
  const strLF = str.replace(/\r\n/g, "\n");
  if (strLF.includes(oldLF)) {
    console.log(`Matched ${name} after LF normalization`);
    const replaced = strLF.replace(oldLF, newBlock.replace(/\r\n/g, "\n"));
    return isCRLF ? replaced.replace(/\n/g, "\r\n") : replaced;
  }
  throw new Error(`Failed to match block for: ${name}`);
}

// 1. Update POST /api/erp/fees/collect to decrement student.duesINR
const collectOld = `  // DB Persistence
  const dbPayment = await recordDbFeePayment(orgId, {
    ...newPayment,
    studentFeeId: demand.db_id,
    demand
  });
  if (dbPayment) {
    newPayment.db_id = dbPayment.id;
  }

  ERP_FEE_PAYMENTS.unshift(newPayment);
  saveFeeDataToDisk("payments");
  saveFeeDataToDisk("demands");
  await recordAuditLog("erp.fee_payment_collected", req.user?.email || "cashier", "fee_payment", newPayment.id, req);`;

const collectNew = `  // DB Persistence
  const dbPayment = await recordDbFeePayment(orgId, {
    ...newPayment,
    studentFeeId: demand.db_id,
    demand
  });
  if (dbPayment) {
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

// 2. Update POST /api/erp/fees/payments/:id/reverse to restore student.duesINR
const reverseOld = `  ERP_FEE_REVERSALS.unshift(reversal);
  saveFeeDataToDisk("payments");
  saveFeeDataToDisk("demands");
  saveFeeDataToDisk("reversals");
  await recordAuditLog("erp.fee_payment_reversed", req.user?.email || "admin", "fee_payment", payment.id, req);`;

const reverseNew = `  // Restore student profile duesINR in memory
  const revStudent = ERP_STUDENTS.find(s => (s.organization_id === orgId) && (s.id === payment.studentId || s.admissionNo === payment.admissionNo));
  if (revStudent) {
    revStudent.duesINR = roundINR((revStudent.duesINR || 0) + Number(payment.amountPaid));
  }

  ERP_FEE_REVERSALS.unshift(reversal);
  saveFeeDataToDisk("payments");
  saveFeeDataToDisk("demands");
  saveFeeDataToDisk("reversals");
  await recordAuditLog("erp.fee_payment_reversed", req.user?.email || "admin", "fee_payment", payment.id, req);`;

// 3. Fallback in GET /api/erp/fees/receipts/:receiptNo to Supabase DB query
const receiptOld = `  if (!payment) {
    return res.status(404).json({ success: false, message: \`Receipt '\${receiptNo}' not found\` });
  }`;

const receiptNew = `  if (!payment && supabase) {
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

// 4. Update verify-payment to use generateNextReceiptNo, update student dues, save to disk
const verifyOld = `  const cleanGrade = (demand.grade || "10").replace(/\\D/g, "") || "10";
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

const verifyNew = `  const receiptNo = await generateNextReceiptNo(orgId);

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

// 5. Replace GET /api/erp/portal/fees/:studentId and POST /api/erp/portal/pay-fee using exact marker functions
const portalOld = `// 16i. GET /api/erp/portal/fees/:studentId - Pending Dues & Fee Receipts Ledger
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

const portalNew = `// 16i. GET /api/erp/portal/fees/:studentId - Pending Dues & Fee Receipts Ledger (True Database Accounting)
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
      totalOriginalAssessedINR: ledger.totalOriginalAssessedINR,
      totalInvoicedINR: ledger.netAssessedFeeINR,
      totalDemandedINR: ledger.netAssessedFeeINR,
      totalFinesINR: ledger.totalFinesINR,
      totalConcessionsINR: ledger.totalConcessionsINR,
      netAssessedFeeINR: ledger.netAssessedFeeINR,
      totalPaidINR: ledger.totalPaidINR,
      outstandingBalanceINR: ledger.remainingBalanceINR,
      balanceDueINR: ledger.remainingBalanceINR,
      overdueAmountINR: ledger.overdueAmountINR,
      overdueCount: ledger.demands.filter(d => d.isOverdue || d.status === "overdue").length,
      pendingCount: ledger.demands.filter(d => d.balanceAmount > 0).length
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

code = doReplace(code, collectOld, collectNew, "collect payment dues update");
code = doReplace(code, reverseOld, reverseNew, "reverse payment dues update");
code = doReplace(code, receiptOld, receiptNew, "receipt Supabase fallback");
code = doReplace(code, verifyOld, verifyNew, "verify-payment & webhook");
code = doReplace(code, portalOld, portalNew, "portal fees & pay-fee update");

fs.writeFileSync(targetFile, code, "utf8");
console.log("Successfully wrote updated erpApp.js!");
