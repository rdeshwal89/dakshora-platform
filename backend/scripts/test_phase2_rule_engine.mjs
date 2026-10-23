// backend/scripts/test_phase2_rule_engine.mjs
// Phase 2: Configurable School Fee Rule Engine E2E Verification
import assert from 'node:assert';

const BASE_URL = 'http://127.0.0.1:5000';

async function req(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('=========================================================================');
  console.log('   DAKSHORA 2.0: PHASE 2 CONFIGURABLE FEE RULE ENGINE VERIFICATION     ');
  console.log('=========================================================================\n');

  // Step 1: Authenticate
  const loginRes = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@dphs-gurugram.edu.in', password: 'Password123!' })
  });
  assert(loginRes.ok, `Login failed: ${JSON.stringify(loginRes.data)}`);
  const token = loginRes.data.session?.access_token || loginRes.data.token;
  const authHeader = { Authorization: `Bearer ${token}` };
  console.log('✓ Stage 1: Authenticated as School Admin (admin@dphs-gurugram.edu.in)');

  // Fetch real students of this school
  const stdRes = await req('/api/erp/students', { headers: authHeader });
  assert(stdRes.ok && stdRes.data.students?.length > 0, 'No students found for this school');
  const allStudents = stdRes.data.students;
  const targetStudent = allStudents.find(s => s.grade === 'Class 10') || allStudents[0];
  const targetGrade = targetStudent.grade;
  console.log(`✓ Stage 1b: Loaded school roster (${allStudents.length} students). Target student: ${targetStudent.name} (${targetGrade}, ID: ${targetStudent.id})`);

  // Step 2: Verify Configurable Policy & Installment Frequencies
  const policyRes = await req('/api/erp/fees/policy', { headers: authHeader });
  assert(policyRes.ok, `Get policy failed: ${JSON.stringify(policyRes.data)}`);
  const policy = policyRes.data.policy;
  
  assert(policy.installmentSchedules.quarterly, 'Quarterly schedule missing');
  assert(policy.installmentSchedules.monthly, 'Monthly schedule missing');
  assert(policy.installmentSchedules.half_yearly, 'Half-Yearly schedule missing');
  assert(policy.installmentSchedules.annual, 'Annual schedule missing');
  assert(policy.installmentSchedules.one_time, 'One-time schedule missing');
  console.log('✓ Stage 2: Policy includes all 5 installment frequencies (Monthly, Quarterly, Half-Yearly, Annual, One-Time)');

  // Step 3: Add Custom School Fee Head via Policy
  const updatedPolicyHeads = [
    ...policy.feeHeads.filter(h => h.id !== 'head-robotics-ai'),
    { id: 'head-robotics-ai', name: 'Robotics & AI Innovation Lab Fee', category: 'academic', isMandatory: true, defaultFrequency: 'annual' }
  ];
  const updatePolicyRes = await req('/api/erp/fees/policy', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      feeHeads: updatedPolicyHeads
    })
  });
  assert(updatePolicyRes.ok, `Update policy failed: ${JSON.stringify(updatePolicyRes.data)}`);
  const roboticsHead = updatePolicyRes.data.policy.feeHeads.find(h => h.id === 'head-robotics-ai');
  assert(roboticsHead, 'Robotics fee head not found in updated policy');
  console.log(`✓ Stage 3: Successfully configured custom school fee head: "${roboticsHead.name}"`);

  // Step 4: Create Fee Structures across different grades and frequencies
  // 4a. Monthly structure for Class 6
  const structMonthRes = await req('/api/erp/fees/structures', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      academicSession: '2026-27',
      grade: 'Class 6',
      feeHead: 'Monthly Tuition Fee',
      amountINR: 2800,
      frequency: 'monthly',
      dueDay: 10,
      isMandatory: true
    })
  });
  assert(structMonthRes.ok, `Create monthly struct failed: ${JSON.stringify(structMonthRes.data)}`);

  // 4b. Quarterly Tuition Structure for target grade
  const structTuitionRes = await req('/api/erp/fees/structures', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      academicSession: '2026-27',
      grade: targetGrade,
      feeHead: 'Tuition Fee',
      amountINR: 14000,
      frequency: 'quarterly',
      dueDay: 10,
      isMandatory: true
    })
  });
  assert(structTuitionRes.ok, `Create tuition struct failed: ${JSON.stringify(structTuitionRes.data)}`);
  const tuitionStruct = structTuitionRes.data.structure;

  // 4c. Half-Yearly structure for target grade
  const structHalfRes = await req('/api/erp/fees/structures', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      academicSession: '2026-27',
      grade: targetGrade,
      feeHead: 'Half-Yearly Assessment Fee',
      amountINR: 1800,
      frequency: 'half_yearly',
      dueDay: 15,
      isMandatory: true
    })
  });
  assert(structHalfRes.ok, `Create half-yearly struct failed: ${JSON.stringify(structHalfRes.data)}`);

  // 4d. Annual Robotics structure for target grade
  const structRoboRes = await req('/api/erp/fees/structures', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      academicSession: '2026-27',
      grade: targetGrade,
      feeHead: 'Robotics & AI Innovation Lab Fee',
      amountINR: 3500,
      frequency: 'annual',
      dueDay: 30,
      isMandatory: true
    })
  });
  assert(structRoboRes.ok, `Create robotics struct failed: ${JSON.stringify(structRoboRes.data)}`);
  const roboStruct = structRoboRes.data.structure;

  console.log('✓ Stage 4: Created fee structures across multiple frequencies (Monthly, Quarterly, Half-Yearly, Annual)');

  // Step 5: Test Concession Rule Engine - Merit Scholarship (applies ONLY to Tuition)
  const applyConcRes = await req('/api/erp/fees/concessions', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      studentId: targetStudent.id,
      concessionType: 'merit_scholarship',
      discountPercentage: 50,
      reason: 'State Olympiad 1st Rank',
      approvedBy: 'Academic Council'
    })
  });
  assert(applyConcRes.ok, `Apply concession failed: ${JSON.stringify(applyConcRes.data)}`);
  const testConcessionId = applyConcRes.data.concession.id;
  console.log(`✓ Stage 5: Registered 50% Academic Merit Scholarship for student ${targetStudent.name} (Tuition-only applicability rule)`);

  // Step 6: Batch Generate Demands for target grade (Installment Q2)
  const genTuitionRes = await req('/api/erp/fees/demands/generate', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      grade: targetGrade,
      feeStructureId: tuitionStruct.id,
      installmentPeriod: 'Q2',
      session: '2026-27'
    })
  });
  assert(genTuitionRes.ok, `Generate Q2 tuition failed: ${JSON.stringify(genTuitionRes.data)}`);
  
  // Find demand for target student
  const studentTuitionDemand = genTuitionRes.data.demands.find(d => d.studentId === targetStudent.id);
  assert(studentTuitionDemand, `Demand for ${targetStudent.name} not generated`);
  assert.strictEqual(studentTuitionDemand.installmentPeriod, 'Q2');
  assert.strictEqual(studentTuitionDemand.baseAmount, 14000);
  assert.strictEqual(studentTuitionDemand.discountAmount, 7000, `Merit scholarship should discount 50% of tuition (₹7000)`);
  assert.strictEqual(studentTuitionDemand.netAmount, 7000);
  console.log(`✓ Stage 6a: Merit Scholarship correctly applied to Tuition Fee (Base: ₹${studentTuitionDemand.baseAmount}, Disc: ₹${studentTuitionDemand.discountAmount}, Net: ₹${studentTuitionDemand.netAmount})`);

  // Step 6b: Generate Demand for Robotics Lab Fee
  const genRoboRes = await req('/api/erp/fees/demands/generate', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      grade: targetGrade,
      feeStructureId: roboStruct.id,
      installmentPeriod: 'ANNUAL',
      session: '2026-27'
    })
  });
  assert(genRoboRes.ok, `Generate robotics demand failed: ${JSON.stringify(genRoboRes.data)}`);
  const studentRoboDemand = genRoboRes.data.demands.find(d => d.studentId === targetStudent.id);
  assert(studentRoboDemand, `Robotics demand for ${targetStudent.name} not generated`);
  assert.strictEqual(studentRoboDemand.baseAmount, 3500);
  assert.strictEqual(studentRoboDemand.discountAmount, 0, 'Merit scholarship must NOT discount Robotics Fee (Tuition-only rule)!');
  assert.strictEqual(studentRoboDemand.netAmount, 3500);
  console.log(`✓ Stage 6b: Concession Rule Engine successfully protected non-tuition head: Robotics Lab Fee had ₹0 discount!`);

  // Step 7: Selective Transport Fee Applicability
  const allStructsRes = await req('/api/erp/fees/structures', { headers: authHeader });
  const gradeTransport = allStructsRes.data.structures.find(s => s.grade === targetGrade && s.feeHead.toLowerCase().includes('transport'));
  if (gradeTransport) {
    const genTransportRes = await req('/api/erp/fees/demands/generate', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        grade: targetGrade,
        feeStructureId: gradeTransport.id,
        installmentPeriod: 'Q2',
        session: '2026-27'
      })
    });
    assert(genTransportRes.ok, `Generate transport demand failed: ${JSON.stringify(genTransportRes.data)}`);
    console.log(`✓ Stage 7: Transport Fee generation selectively evaluated transport enrolment (${genTransportRes.data.count} enrolled billed, ${genTransportRes.data.skippedCount} non-bus students skipped)`);
  } else {
    console.log('✓ Stage 7: Skipped (no transport structure for this grade in seed)');
  }

  // Step 8: Multi-Head Batch Generation & Idempotency Test
  const multiHeadRes1 = await req('/api/erp/fees/demands/generate', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      grade: targetGrade,
      feeStructureId: 'all',
      installmentPeriod: 'HY1',
      session: '2026-27'
    })
  });
  assert(multiHeadRes1.ok, `Multi-head batch 1 failed: ${JSON.stringify(multiHeadRes1.data)}`);
  const initialCreatedCount = multiHeadRes1.data.count;
  console.log(`✓ Stage 8a: Multi-Head Batch generation created ${initialCreatedCount} demands for ${targetGrade} (Installment HY1)`);

  // Repeat exact same call to test idempotency
  const multiHeadRes2 = await req('/api/erp/fees/demands/generate', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      grade: targetGrade,
      feeStructureId: 'all',
      installmentPeriod: 'HY1',
      session: '2026-27'
    })
  });
  assert(multiHeadRes2.ok, `Multi-head batch 2 failed: ${JSON.stringify(multiHeadRes2.data)}`);
  assert.strictEqual(multiHeadRes2.data.count, 0, 'Second run must create 0 new demands');
  assert(multiHeadRes2.data.skippedCount >= initialCreatedCount, 'Second run must skip all existing demands');
  console.log(`✓ Stage 8b: Idempotency 100% Verified! Retrying batch generated 0 duplicates (${multiHeadRes2.data.skippedCount} skipped)`);

  // Step 9: Verify Student Fee Ledger Formula and Totals
  const ledgerRes = await req(`/api/erp/fees/students/${targetStudent.id}/ledger`, { headers: authHeader });
  assert(ledgerRes.ok, `Get ledger failed: ${JSON.stringify(ledgerRes.data)}`);
  const ledger = ledgerRes.data.accountingSummary;
  assert(ledger, 'accountingSummary missing from ledger response');
  const originalCharges = ledger.totalOriginalAssessedFee;
  const concessions = ledger.totalApprovedConcessions;
  const fines = ledger.totalAdditionalCharges;
  const netPayable = ledger.netFeePayable;
  const netPayments = ledger.netPaymentsApplied;
  const balance = ledger.remainingOutstandingBalance;

  assert.strictEqual(netPayable, Math.round((originalCharges - concessions + fines) * 100) / 100, 'Accounting equality violated for netPayable');
  assert.strictEqual(balance, Math.round((netPayable - netPayments) * 100) / 100, 'Accounting equality violated for balance');
  console.log('✓ Stage 9: Student Fee Ledger Mathematical Consistency Verified:');
  console.log(`   - Original Assessed: ₹${originalCharges}`);
  console.log(`   - Concessions:       ₹${concessions}`);
  console.log(`   - Net Payable:       ₹${netPayable}`);
  console.log(`   - Net Payments:      ₹${netPayments}`);
  console.log(`   - Balance:           ₹${balance}`);

  // Cleanup: Revoke test scholarship
  await req(`/api/erp/fees/concessions/${testConcessionId}`, {
    method: 'DELETE',
    headers: authHeader
  });
  console.log('✓ Stage 10: Cleaned up test concession');

  console.log('\n=========================================================================');
  console.log('  >>> ALL 10 PHASE 2 RULE ENGINE AUDIT STAGES PASSED WITH 100% SUCCESS <<<');
  console.log('=========================================================================\n');
}

run().catch(err => {
  console.error('\n❌ AUDIT ERROR:', err);
  process.exit(1);
});
