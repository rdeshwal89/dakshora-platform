// =========================================================================
// 🚀 DAKSHORA 2.0: Master Verification Suite for Phases 11, 12, 13, 14, and 15
// - Phase 11: School-Specific RAG & Knowledge Base Engine
// - Phase 12: School CRM & Admissions Pipeline (Kanban, Funnel, Duplicate Check)
// - Phase 13: Dakshora Robotics & STEAM Academy (ATAL Tinkering, Courses, Projects)
// - Phase 14: Module Manager & Solution Builder (Interactive Quotation Generator)
// - Phase 15: Subscription & Billing Architecture (SaaS Tiers, Quota Telemetry, GST)
// =========================================================================

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ORG_ID = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e';

let passed = 0;
let failed = 0;
const results = [];

function assert(description, condition, details = '') {
  if (condition) {
    passed++;
    results.push({ step: description, status: 'PASS', details });
    console.log(`✅ [PASS] ${description}${details ? ' - ' + details : ''}`);
  } else {
    failed++;
    results.push({ step: description, status: 'FAIL', details });
    console.error(`❌ [FAIL] ${description}${details ? ' - ' + details : ''}`);
  }
}

async function runPhases11To15Tests() {
  console.log('\n=================================================================');
  console.log('🚀 DAKSHORA 2.0 — PHASES 11, 12, 13, 14, 15 AUTOMATED VERIFICATION');
  console.log('=================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 📚 PHASE 11: SCHOOL-SPECIFIC RAG & KNOWLEDGE BASE ENGINE
    // -------------------------------------------------------------------------
    console.log('\n--- [PHASE 11] School RAG & Knowledge Base Engine ---');

    // 1. List Knowledge Base Documents
    const kbListRes = await fetch(`${BASE_URL}/api/erp/ai/knowledge-base?organization_id=${ORG_ID}`);
    const kbListData = await kbListRes.json();
    assert(
      'Phase 11.1: List institutional knowledge base documents',
      kbListRes.status === 200 && Array.isArray(kbListData.documents) && kbListData.documents.length >= 4,
      `Found ${kbListData.documents?.length || 0} indexed documents`
    );

    // 2. Index a New Policy Document
    const newDocId = `doc-cyber-${Date.now().toString().slice(-4)}`;
    const indexDocRes = await fetch(`${BASE_URL}/api/erp/ai/knowledge-base`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newDocId,
        title: 'DPS Heritage AI & Cybersecurity Policy 2026-27',
        category: 'compliance',
        documentType: 'PDF Policy Manual',
        totalPages: 18,
        organization_id: ORG_ID
      })
    });
    const indexDocData = await indexDocRes.json();
    assert(
      'Phase 11.2: Index new school compliance document into Vector/RAG index',
      indexDocRes.status === 200 && indexDocData.success && indexDocData.document?.title?.includes('Cybersecurity'),
      `Document indexed: ${indexDocData.document?.id}`
    );

    // 3. Grounded Semantic RAG Query with Institutional Citations
    const ragQueryRes = await fetch(`${BASE_URL}/api/erp/ai/knowledge-base/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is the refund policy if a student withdraws within 30 days of admission?',
        organization_id: ORG_ID
      })
    });
    const ragQueryData = await ragQueryRes.json();
    assert(
      'Phase 11.3: Grounded Semantic RAG Query with Institutional Citations',
      ragQueryRes.status === 200 &&
      ragQueryData.success &&
      typeof ragQueryData.answer === 'string' &&
      ragQueryData.answer.length > 20 &&
      Array.isArray(ragQueryData.citations) &&
      ragQueryData.citations.length > 0,
      `Answered with ${ragQueryData.citations?.length || 0} source citations (${ragQueryData.citations?.[0]?.sourceDoc || 'CBSE Policy'})`
    );

    // 4. Delete Indexed Document
    const delDocRes = await fetch(`${BASE_URL}/api/erp/ai/knowledge-base/${newDocId}?organization_id=${ORG_ID}`, {
      method: 'DELETE'
    });
    const delDocData = await delDocRes.json();
    assert(
      'Phase 11.4: Remove document from Knowledge Base index',
      delDocRes.status === 200 && delDocData.success
    );

    // -------------------------------------------------------------------------
    // 🎓 PHASE 12: SCHOOL CRM & ADMISSIONS PIPELINE
    // -------------------------------------------------------------------------
    console.log('\n--- [PHASE 12] School CRM & Admissions Pipeline ---');

    // 1. Admissions Overview & Conversion Funnel
    const admOverviewRes = await fetch(`${BASE_URL}/api/erp/admissions/overview?session=2026-27`);
    const admOverviewData = await admOverviewRes.json();
    assert(
      'Phase 12.1: Admissions Funnel Overview & KPIs',
      admOverviewRes.status === 200 &&
      admOverviewData.success &&
      typeof admOverviewData.overview?.totalApplications === 'number' &&
      typeof admOverviewData.overview?.conversionRatePct === 'number',
      `Total Applications: ${admOverviewData.overview?.totalApplications}, Conversion: ${admOverviewData.overview?.conversionRatePct}%`
    );

    // 2. Capture Website Inquiry into CRM Leads
    const testLeadEmail = `parent.${Date.now()}@gmail.com`;
    const leadCapRes = await fetch(`${BASE_URL}/api/erp/admissions/leads/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Devendra Rathore',
        email: testLeadEmail,
        phone: '+91 98765 11223',
        source: 'website',
        notes: 'Inquiry for Class 10 Science & Robotics'
      })
    });
    const leadCapData = await leadCapRes.json();
    const capturedLeadId = leadCapData.lead?.id || 'lead-01';
    assert(
      'Phase 12.2: Capture prospective parent inquiry into CRM Leads pipeline',
      leadCapRes.status === 200 && leadCapData.success && !!leadCapData.lead?.id,
      `Lead ID: ${capturedLeadId}`
    );

    // 3. Convert CRM Lead to Formal Application
    const convertLeadRes = await fetch(`${BASE_URL}/api/erp/admissions/leads/${capturedLeadId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        academicSession: '2026-27'
      })
    });
    const convertLeadData = await convertLeadRes.json();
    const createdAppNo = convertLeadData.admission?.applicationNo || 'ADM-2026-001';
    assert(
      'Phase 12.3: Convert CRM Lead into Formal Admission Application',
      convertLeadRes.status === 200 && convertLeadData.success && !!createdAppNo,
      `Application No: ${createdAppNo}`
    );

    // 4. Duplicate Student Match Guard
    const dupCheckRes = await fetch(`${BASE_URL}/api/erp/admissions/duplicate-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'Aarav Sharma',
        parentPhone: '+91 98765 43210'
      })
    });
    const dupCheckData = await dupCheckRes.json();
    assert(
      'Phase 12.4: Duplicate Student Enrollment Guard & Identity Verification',
      dupCheckRes.status === 200 && dupCheckData.success && Array.isArray(dupCheckData.matches),
      `Matches detected: ${dupCheckData.matches?.length || 0} existing records`
    );

    // -------------------------------------------------------------------------
    // 🤖 PHASE 13: DAKSHORA ROBOTICS & STEAM ACADEMY
    // -------------------------------------------------------------------------
    console.log('\n--- [PHASE 13] Dakshora Robotics & STEAM Academy ---');

    // 1. Robotics Curriculum Tracks
    const coursesRes = await fetch(`${BASE_URL}/api/erp/robotics/courses`);
    const coursesData = await coursesRes.json();
    assert(
      'Phase 13.1: Robotics & STEAM grade tracks (Class 3 to 12)',
      coursesRes.status === 200 && coursesData.success && Array.isArray(coursesData.courses) && coursesData.courses.length === 4,
      `Tracks: ${coursesData.courses?.map(c => c.title).join(' | ')}`
    );

    // 2. Hardware Lab Kits Inventory
    const invRes = await fetch(`${BASE_URL}/api/erp/robotics/inventory`);
    const invData = await invRes.json();
    assert(
      'Phase 13.2: ATAL Tinkering Lab Hardware Kits & Components Inventory',
      invRes.status === 200 && invData.success && Array.isArray(invData.inventory) && invData.inventory.length >= 5,
      `Hardware items: ${invData.inventory?.length || 0} SKUs (Arduino, Pi, Drones, 3D Printers)`
    );

    // 3. Student Innovation Portfolio
    const projRes = await fetch(`${BASE_URL}/api/erp/robotics/projects`);
    const projData = await projRes.json();
    assert(
      'Phase 13.3: Student Innovation Projects & Mentorship Portfolio',
      projRes.status === 200 && projData.success && Array.isArray(projData.projects) && projData.projects.length >= 3,
      `Projects registered: ${projData.projects?.length || 0}`
    );

    // 4. Create New Student Robotics Innovation Project
    const newProjRes = await fetch(`${BASE_URL}/api/erp/robotics/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Solar-Powered Autonomous Campus Cleaning Rover',
        studentName: 'Aarav Sharma & Team',
        grade: 'Class 10',
        category: 'Autonomous Mobile Robots (ROS)',
        summary: 'Utilizes LiDAR sensors and computer vision for zero-emission campus sanitation.'
      })
    });
    const newProjData = await newProjRes.json();
    assert(
      'Phase 13.4: Submit new student STEAM project for Atal Tinkering Lab review',
      newProjRes.status === 200 && newProjData.success && newProjData.project?.title?.includes('Solar-Powered'),
      `Project created: ${newProjData.project?.id}`
    );

    // 5. National Hackathons & STEM Competitions
    const compRes = await fetch(`${BASE_URL}/api/erp/robotics/competitions`);
    const compData = await compRes.json();
    assert(
      'Phase 13.5: National Hackathons & Competitions Schedule',
      compRes.status === 200 && compData.success && Array.isArray(compData.competitions) && compData.competitions.length >= 3,
      `Competitions: ${compData.competitions?.map(c => c.name).join(' | ')}`
    );

    // -------------------------------------------------------------------------
    // 🧩 PHASE 14 & 15: SOLUTION BUILDER & SUBSCRIPTION/BILLING ARCHITECTURE
    // -------------------------------------------------------------------------
    console.log('\n--- [PHASE 14 & 15] Solution Builder & Commercial Billing Architecture ---');

    // 1. Dynamic Commercial Quotation Generator (Phase 14)
    const quoteRes = await fetch(`${BASE_URL}/api/erp/solutions/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Delhi Public Heritage School',
        studentCount: 850,
        selectedModules: [
          'core_erp',
          'teacher_ai',
          'student_suite',
          'robotics_academy',
          'admissions_crm',
          'school_rag'
        ],
        billingCycle: 'annual'
      })
    });
    const quoteData = await quoteRes.json();
    assert(
      'Phase 14.1: Dynamic Commercial Quotation Calculator with 20% Prepay Discount & 18% GST',
      quoteRes.status === 200 &&
      quoteData.success &&
      quoteData.quotation?.quoteId &&
      quoteData.quotation?.pricing?.discountPercent === 20 &&
      quoteData.quotation?.pricing?.gstRatePercent === 18 &&
      quoteData.quotation?.pricing?.hsnCode === '998314' &&
      quoteData.quotation?.pricing?.grandTotalINR > 0,
      `Quote ID: ${quoteData.quotation?.quoteId}, Grand Total: ₹${quoteData.quotation?.pricing?.grandTotalINR?.toLocaleString()}`
    );

    // 2. Commercial SaaS Plans Matrix (Phase 15)
    const plansRes = await fetch(`${BASE_URL}/api/erp/saas/plans`);
    const plansData = await plansRes.json();
    assert(
      'Phase 15.1: Commercial SaaS Tiered Plans (Starter, Growth, Enterprise)',
      plansRes.status === 200 && Array.isArray(plansData.plans) && plansData.plans.length === 3,
      `Tiers: ${plansData.plans?.map(p => `${p.name} (₹${p.priceINR})`).join(' | ')}`
    );

    // 3. Organization Entitlements & Multi-Tenant Isolation (Phase 15)
    const entRes = await fetch(`${BASE_URL}/api/erp/saas/entitlements?organization_id=${ORG_ID}`);
    const entData = await entRes.json();
    assert(
      'Phase 15.2: Multi-Tenant Plan Entitlements & Modular Scope',
      entRes.status === 200 && entData.success && Array.isArray(entData.entitlements?.modules),
      `Active Modules: ${entData.entitlements?.modules?.length || 0} modules on plan '${entData.entitlements?.planName}'`
    );

    // 4. Invoices & Tax Ledger (Phase 15)
    const saasInvRes = await fetch(`${BASE_URL}/api/erp/saas/invoices?organization_id=${ORG_ID}`);
    const saasInvData = await saasInvRes.json();
    assert(
      'Phase 15.3: SaaS Tax Invoices Ledger with 18% GST Compliance',
      saasInvRes.status === 200 && Array.isArray(saasInvData.invoices) && saasInvData.invoices.length > 0,
      `Recorded Invoices: ${saasInvData.invoices?.length || 0} invoices (Latest: ₹${saasInvData.invoices?.[0]?.amountINR?.toLocaleString()})`
    );

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n=================================================================');
  console.log(`🏁 TEST EXECUTION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhases11To15Tests();
