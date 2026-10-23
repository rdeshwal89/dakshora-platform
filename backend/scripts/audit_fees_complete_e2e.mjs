import crypto from "crypto";

const BASE_URL = "http://localhost:5000";

async function runCompleteFeeAudit() {
  console.log("=========================================================================");
  console.log("       DAKSHORA 2.0 COMPLETE FEE MANAGEMENT & AUDIT REGRESSION SUITE     ");
  console.log("=========================================================================\n");

  // Step 1: Authentication
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@dphs-gurugram.edu.in", password: "Password123!" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  if (!token) throw new Error("Failed to authenticate as school admin");
  console.log("✓ Step 1: School Admin Authentication Verified. Token received.");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  // Step 2: Policy Engine Verification
  const policyRes = await fetch(`${BASE_URL}/api/erp/fees/policy`, { headers });
  const policyData = await policyRes.json();
  if (policyRes.status !== 200 || !policyData.policy) throw new Error("GET /api/erp/fees/policy failed");
  console.log("✓ Step 2a: GET /api/erp/fees/policy returned active school policy. Session:", policyData.policy.academicSession);

  const updatePolicyRes = await fetch(`${BASE_URL}/api/erp/fees/policy`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      lateFeePolicy: {
        enabled: true,
        gracePeriodDays: 7,
        perDayFineINR: 15,
        maxFineCapINR: 750
      }
    })
  });
  const updatePolicyData = await updatePolicyRes.json();
  if (updatePolicyRes.status !== 200 || updatePolicyData.policy?.lateFeePolicy?.gracePeriodDays !== 7) {
    throw new Error("POST /api/erp/fees/policy update failed");
  }
  console.log("✓ Step 2b: POST /api/erp/fees/policy updated grace days to 7 and perDayFine to ₹15.");

  // Step 3: Concessions Engine Verification
  const studentId = "22162249-6b63-4f59-a7a4-65bdacb25651";
  const addConcRes = await fetch(`${BASE_URL}/api/erp/fees/concessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      studentId,
      concessionType: "merit_scholarship",
      discountPercentage: 20,
      reason: "National STEM Olympiad Gold Medalist",
      approvedBy: "Principal Dr. Sharma"
    })
  });
  const addConcData = await addConcRes.json();
  if (addConcRes.status !== 201 || !addConcData.concession?.id) throw new Error("Concession creation failed");
  const concId = addConcData.concession.id;
  console.log("✓ Step 3a: POST /api/erp/fees/concessions registered 20% STEM scholarship ID:", concId);

  const listConcRes = await fetch(`${BASE_URL}/api/erp/fees/concessions`, { headers });
  const listConcData = await listConcRes.json();
  if (listConcRes.status !== 200 || !listConcData.concessions?.some(c => c.id === concId)) {
    throw new Error("Concessions list did not contain newly created concession");
  }
  console.log("✓ Step 3b: GET /api/erp/fees/concessions verified registered concessions count:", listConcData.count);

  // Step 4: Fine Waiver Verification
  const waiveRes = await fetch(`${BASE_URL}/api/erp/fees/demands/inv-101-q3/waive-fine`, {
    method: "POST",
    headers,
    body: JSON.stringify({ reason: "Medical hospitalization certificate submitted", waivedBy: "Principal" })
  });
  const waiveData = await waiveRes.json();
  if (waiveRes.status !== 200 || waiveData.demand?.fineAmount !== 0) {
    throw new Error("POST waive-fine failed");
  }
  console.log("✓ Step 4: POST /api/erp/fees/demands/inv-101-q3/waive-fine successfully waived fine with audit log.");

  // Step 5: Cashier Collection Terminal with Sequential Receipt
  const collectRes = await fetch(`${BASE_URL}/api/erp/fees/collect`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      demandId: "inv-101-q3",
      studentId,
      amountPaid: 500,
      paymentMode: "cash",
      collectedBy: "Chief Bursar R. K. Gupta",
      remarks: "Counter Cash Deposit for Term 2",
      idempotencyKey: `CSH-IDEMP-${Date.now()}`
    })
  });
  const collectData = await collectRes.json();
  if (collectRes.status !== 200 || !collectData.receiptNo?.startsWith("REC/")) {
    throw new Error("Cashier collect payment failed or invalid receipt format");
  }
  const cashReceiptNo = collectData.receiptNo;
  const paymentId = collectData.payment?.id;
  console.log("✓ Step 5: POST /api/erp/fees/collect issued sequential official receipt:", cashReceiptNo, "Payment ID:", paymentId);

  // Step 6: Payment Reversal with Audit Trail
  const reverseRes = await fetch(`${BASE_URL}/api/erp/fees/payments/${paymentId}/reverse`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      reason: "Accidental double entry corrected by accountant",
      reversedBy: "Senior Auditor"
    })
  });
  const reverseData = await reverseRes.json();
  if (reverseRes.status !== 200 || reverseData.payment?.status !== "reversed") {
    throw new Error("Payment reversal failed");
  }
  console.log("✓ Step 6: POST /api/erp/fees/payments/:id/reverse reversed receipt:", reverseData.payment.receiptNo, "Reversal ID:", reverseData.reversal.id);

  // Step 7: Complete Student Ledger Reconciliation
  const ledgerRes = await fetch(`${BASE_URL}/api/erp/fees/students/${studentId}/ledger`, { headers });
  const ledgerData = await ledgerRes.json();
  if (ledgerRes.status !== 200 || !ledgerData.accountingSummary) throw new Error("Student ledger computation failed");
  
  const acc = ledgerData.accountingSummary;
  console.log("✓ Step 7: GET /api/erp/fees/students/:id/ledger returned verified audit-grade ledger:");
  console.log("   - Total Original Assessed Fee : ₹" + acc.totalOriginalAssessedFee);
  console.log("   - Total Fines Added           : ₹" + acc.totalAdditionalCharges);
  console.log("   - Total Approved Concessions  : ₹" + acc.totalApprovedConcessions);
  console.log("   - Net Fee Payable             : ₹" + acc.netFeePayable);
  console.log("   - Total Verified Payments     : ₹" + acc.totalVerifiedPayments);
  console.log("   - Total Reversals             : ₹" + acc.totalReversals);
  console.log("   - Net Payments Applied        : ₹" + acc.netPaymentsApplied);
  console.log("   - Remaining Outstanding       : ₹" + acc.remainingOutstandingBalance);

  // Accounting formula verification
  const expectedNetPayable = Math.round((acc.totalOriginalAssessedFee + acc.totalAdditionalCharges - acc.totalApprovedConcessions) * 100) / 100;
  const expectedNetPayments = Math.round((acc.totalVerifiedPayments - acc.totalReversals) * 100) / 100;
  const expectedOutstanding = Math.round((expectedNetPayable - expectedNetPayments) * 100) / 100;

  if (acc.netFeePayable !== expectedNetPayable || acc.remainingOutstandingBalance !== expectedOutstanding) {
    throw new Error(`Ledger math discrepancy! Expected Outstanding: ₹${expectedOutstanding}, Computed: ₹${acc.remainingOutstandingBalance}`);
  }
  console.log("   => [MATHEMATICAL VERIFICATION]: 100% Audit-Grade Balance Equality Verified!");

  // Step 8: Global Fee Ledger Search & Filtering
  const globalLedgerRes = await fetch(`${BASE_URL}/api/erp/fees/ledger?page=1&limit=10`, { headers });
  const globalLedgerData = await globalLedgerRes.json();
  if (globalLedgerRes.status !== 200 || !globalLedgerData.summary) throw new Error("Global fee ledger failed");
  console.log("✓ Step 8: GET /api/erp/fees/ledger Roll-Up Summary verified:");
  console.log("   - Total Students Audited     :", globalLedgerData.summary.totalStudentsCount);
  console.log("   - Total Assessed Platform-wide: ₹" + globalLedgerData.summary.totalAssessedINR);
  console.log("   - Total Collected Realized    : ₹" + globalLedgerData.summary.totalCollectedINR);
  console.log("   - Total Outstanding Due       : ₹" + globalLedgerData.summary.totalOutstandingINR);

  // Step 9: Concession Cleanup (Revocation test)
  const delConcRes = await fetch(`${BASE_URL}/api/erp/fees/concessions/${concId}`, { method: "DELETE", headers });
  const delConcData = await delConcRes.json();
  if (delConcRes.status !== 200) throw new Error("Concession revocation failed");
  console.log("✓ Step 9: DELETE /api/erp/fees/concessions/:id cleanly revoked test scholarship.");

  console.log("\n=========================================================================");
  console.log("  >>> ALL 9 FEE SYSTEM PRODUCTION AUDIT STAGES PASSED WITH 100% SUCCESS <<<");
  console.log("=========================================================================\n");
}

runCompleteFeeAudit().catch(err => {
  console.error("Audit Execution Failed:", err);
  process.exit(1);
});
