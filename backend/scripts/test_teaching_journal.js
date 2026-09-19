import http from 'http';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runJournalTests() {
  console.log('\n=================================================================');
  console.log('📖 DAKSHORA 2.0 — TEACHING JOURNAL & AI TEACHER TESTS');
  console.log('=================================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  try {
    // Test 1: Fetch initial journal entries
    const res1 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/erp/teaching-journal',
      method: 'GET',
    });
    assert(res1.status === 200 && res1.data?.success && res1.data.count >= 2, '1. Fetch Journal Entries (Count >= 2)');

    // Test 2: Filter journal entries by grade
    const res2 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/erp/teaching-journal?grade=Class%2010',
      method: 'GET',
    });
    assert(res2.status === 200 && res2.data?.journalEntries.every(e => e.grade === 'Class 10'), '2. Filter Journal Entries by Grade: Class 10');

    // Test 3: Create a new journal entry
    const newEntryPayload = {
      staff_id: 'stf-02',
      staff_name: 'Rajeev Malhotra',
      date: '2026-09-19',
      grade: 'Class 10',
      section: 'B',
      subject: 'Mathematics',
      period: 4,
      period_time: '11:10 AM - 11:55 AM',
      topic: 'Arithmetic Progressions — nth Term',
      learning_objectives: 'Derive formula an = a + (n-1)d and calculate nth term.',
      what_taught: 'Introduced sequence and AP definition. Derived formula an = a + (n-1)d.',
      student_response: 'Excellent grasp; all students calculated 10th term correctly.',
      homework: 'NCERT Exercise 5.2: Q1 to Q5 in homework notebook.',
      doubts: 'None reported.',
      topics_pending: 'Sum of first n terms of AP.',
      next_lesson: 'Sum of n terms formula Sn = n/2[2a + (n-1)d].'
    };

    const res3 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/erp/teaching-journal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, newEntryPayload);

    assert(res3.status === 200 && res3.data?.success && res3.data.journalEntry?.id, '3. Create Structured Journal Entry');
    const createdId = res3.data.journalEntry.id;

    // Test 4: Update the journal entry
    const res4 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/erp/teaching-journal/${createdId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }, { student_response: 'Updated: 95% proficiency demonstrated.' });

    assert(res4.status === 200 && res4.data?.success && res4.data.journalEntry?.student_response.includes('95%'), '4. Update Journal Entry');

    // Test 5: AI Teacher Generation (Lesson Plan)
    const res5 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/erp/ai-teacher/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      mode: 'lesson_plan',
      grade: 'Class 10',
      subject: 'Mathematics',
      topic: 'Arithmetic Progressions'
    });

    assert(res5.status === 200 && res5.data?.title?.includes('Lesson Plan') && res5.data?.content?.includes("Bloom's Taxonomy"), '5. AI Teacher: 45-Min Lesson Plan Generation');

    // Test 6: AI Teacher Generation (20 MCQs)
    const res6 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/erp/ai-teacher/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      mode: 'mcqs',
      grade: 'Class 10',
      subject: 'Mathematics',
      topic: 'Arithmetic Progressions'
    });

    assert(res6.status === 200 && res6.data?.content?.includes('Multiple Choice Questions'), '6. AI Teacher: 20 CBSE MCQs Generation');

    // Test 7: AI Teacher Generation (Bilingual Hindi)
    const res7 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/erp/ai-teacher/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      mode: 'bilingual_hindi',
      grade: 'Class 10',
      subject: 'Mathematics',
      topic: 'Arithmetic Progressions'
    });

    assert(res7.status === 200 && res7.data?.content?.includes('सरल हिंदी'), '7. AI Teacher: Bilingual Hindi Explanation');

    // Test 8: Delete the created journal entry
    const res8 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/erp/teaching-journal/${createdId}`,
      method: 'DELETE',
    });

    assert(res8.status === 200 && res8.data?.success, '8. Delete Journal Entry');

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log('=================================================================');
  console.log(`TOTAL TESTS: ${total}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${total - passed}`);
  console.log(`SUCCESS RATE: ${Math.round((passed / total) * 100)}%`);
  console.log('=================================================================\n');

  if (passed !== total) process.exit(1);
}

runJournalTests();
