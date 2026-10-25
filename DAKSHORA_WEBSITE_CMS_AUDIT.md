# DAKSHORA 2.0 — SCHOOL WEBSITE BUILDER & CONTENT MANAGEMENT SYSTEM (CMS) AUDIT

**Document Version**: 2.0.0-ENTERPRISE  
**Audit Scope**: 16-Step Organization Setup Wizard, Database Draft Persistence, 11-Step CMS Tree, Dynamic School Websites (`/school/[slug]`), and Lead CRM Pipeline  
**Execution Environment**: Dakshora Production Antigravity Workspace  
**Status**: **WEBSITE BUILDER & CMS PIPELINE VERIFIED (PASS)**  

---

## 1. Executive Summary

Educational institutions requiring a modern digital presence can build, manage, and publish institutional websites through Dakshora 2.0 without writing code. This audit evaluated the end-to-end publishing lifecycle: from initial school onboarding and 16-step setup wizard draft persistence through the 11-step CMS navigation tree, draft vs published privacy controls, public admissions lead capture, and dynamic Next.js App Router rendering.

### Key Audit Findings
1. **Database Draft Persistence**: The 16-step setup wizard saves drafts directly to PostgreSQL table `school_onboarding_progress`. Reloading or resuming the wizard seamlessly pre-populates all saved step data.
2. **Auto-Prefill Integration**: Basic organization details (name, slug, board affiliation, contact email, phone) provided during SuperAdmin onboarding automatically populate into the setup wizard.
3. **11-Step CMS Navigation Tree**: Reconstructed CMS tree correctly houses **Step 10 (School Website Builder)** and **Step 11 (White-Label Mobile App Configuration)**.
4. **Draft vs Published Privacy**: Unpublished notices and draft page sections remain strictly invisible to public visitors until an authorized administrator clicks "Publish Website".
5. **Dynamic Server-Rendered Public Web**: Next.js 16 dynamic route `frontend/app/school/[slug]/page.tsx` renders school websites on demand with verified SEO tags, school branding, and interactive inquiry modals.

---

## 2. 16-Step Setup Wizard & Draft Persistence

```
+----------------------------------------------------------------------------------------------------+
|                                    16-STEP SETUP WIZARD PIPELINE                                   |
|                                                                                                    |
|    Step 1: School Identity & Logo          Step 9: Class & Section Hierarchy                       |
|    Step 2: Trust / Society Details         Step 10: Subject Mapping                                |
|    Step 3: Board Affiliation (CBSE/ICSE)   Step 11: Fee Structure Configuration                    |
|    Step 4: Contact & Campus Address        Step 12: Transport Routes & Fleet                       |
|    Step 5: Principal & Admin Contacts      Step 13: Staff & Faculty Directory                      |
|    Step 6: Academic Calendar & Sessions    Step 14: SMS & WhatsApp Gateway Config                 |
|    Step 7: School Motto & Vision           Step 15: Website & Theme Customizer                     |
|    Step 8: Document Vault & Affiliations   Step 16: Review & Final Publication                     |
|                                                                                                    |
|                                         |                                                          |
|                                         v                                                          |
|                    POST /api/erp/onboarding/save-draft                                             |
|                    GET  /api/erp/onboarding/status                                                 |
|                                         |                                                          |
|                                         v                                                          |
|                    PostgreSQL: `school_onboarding_progress`                                        |
+----------------------------------------------------------------------------------------------------+
```

### 2.1 Database Draft Saving
- **Endpoint**: `POST /api/erp/onboarding/save-draft`
- **Payload**:
  ```json
  {
    "organizationId": "6917d399-a6d6-492e-b8aa-ea48b6253243",
    "currentStep": 4,
    "completedSteps": [1, 2, 3],
    "formData": {
      "schoolName": "Greenwood International School",
      "board": "CBSE",
      "affiliationNo": "CBSE-AFF-99182",
      "phone": "+91 98765 43210",
      "email": "info@greenwood.edu.in"
    }
  }
  ```
- **Database Action**: Upserts the `wizard_state` JSONB blob into PostgreSQL `school_onboarding_progress`.
- **Resume Verification**: `GET /api/erp/onboarding/status` retrieves the saved state, restoring form fields and the active step index upon application restart.
- **Test Evidence**: Verified by `test/master-onboarding-cms-suite.test.ts` (Test 10).

---

## 3. Reconstructed 11-Step CMS Navigation Tree

The school website management console (`CmsWebsitesHub.tsx`) organizes digital content into an 11-step structural hierarchy:

| Step # | Tree Section | Managed Content & Entities | Target DB Table |
| :-: | :--- | :--- | :--- |
| **Step 1** | Hero & Header | Main banner tagline, school emblem, quick contact bar | `school_cms` |
| **Step 2** | About Institution | School history, vision, mission, chairman's desk | `school_cms` |
| **Step 3** | Academic Offerings | Pre-primary, primary, secondary, STEM curriculum | `school_cms` |
| **Step 4** | Infrastructure | Labs, library, sports complex, smart classrooms | `school_cms` |
| **Step 5** | Faculty & Leadership | Principal profile, head of departments, mentors | `staff`, `school_cms` |
| **Step 6** | Admissions & Criteria | Age criteria, fee structure link, prospectus PDF | `admissions`, `school_cms`|
| **Step 7** | News & Announcements | Circulars, event notices, holiday calendar | `school_cms` (Notices) |
| **Step 8** | Photo & Video Gallery | Annual day, science exhibition, sports meet | `media_assets` |
| **Step 9** | Contact & Location | Interactive Google map, inquiry form, campus address | `schools`, `school_cms` |
| **Step 10**| **Website Customizer** | Custom domain, color palette, navigation menu | `websites` |
| **Step 11**| **Mobile App Branding**| Launcher icon, splash screen, package identifier | `school_configurations` |

### 3.1 Verification of Step 10 & Step 11
- In `test/tenant-isolation-zero-state.test.ts` (Test 9) and `test/master-onboarding-cms-suite.test.ts` (Test 6):
  - Queried `GET /api/websites/:id/cms`.
  - Confirmed tree includes `step10_website` with custom domain bindings.
  - Confirmed tree includes `step11_mobile_app` with launcher icon and branding parameters.

---

## 4. Public School Website Rendering (`/school/[slug]`)

### 4.1 Server-Side Dynamic Rendering (Next.js 16)
- The dynamic App Router route `frontend/app/school/[slug]/page.tsx` fetches the school profile and published CMS from the backend API:
  - API Call: `GET /api/public/schools/:slug/cms`
- If the school slug exists and is active, Next.js server-renders:
  - Custom brand colors, fonts, and school emblem.
  - Principal's welcome note.
  - Published announcements and circulars.
  - Interactive "Apply for Admission" modal.
- If the slug is invalid, it renders a standard institutional 404 page.

### 4.2 Admissions Lead Capture & CRM Integration
- When a parent fills out the public inquiry form on a school website:
  - Trigger: `POST /api/public/schools/:slug/inquiry`
  - Validates parent phone number, email, student name, and grade applying for.
  - Inserts directly into PostgreSQL table `leads` scoped to that school's `organization_id`.
  - Immediately visible in the school receptionist's **Leads CRM Hub** (`LeadsCrmHub.tsx`).
- Tested and verified in `test/master-onboarding-cms-suite.test.ts` (Test 9).

---

## 5. Draft vs Published Privacy Safeguard

Institutions frequently draft announcements, exam timetables, or fee updates before they are officially approved:

1. **Draft State**: Mutations performed in `CmsWebsitesHub.tsx` save to `school_cms.draft_tree`.
2. **Access Control**:
   - `GET /api/websites/:id/cms` (requires admin auth) returns both `draft_tree` and `published_tree`.
   - `GET /api/public/schools/:slug/cms` (public unauthenticated) strictly returns `published_tree`.
3. **Publication Event**: Clicking "Publish Website" calls `POST /api/websites/:id/publish`, which copies `draft_tree` to `published_tree` atomically.
4. **Test Proof**: In `test/tenant-isolation-zero-state.test.ts` (Test 10), draft circulars were confirmed absent from public queries until published.

---

## 6. Summary of Website & CMS Audit

| Workflow Step | Endpoint / Component | Database Target | Test Proof | Status |
| :--- | :--- | :--- | :--- | :-: |
| **Onboarding Wizard Draft** | `POST /api/erp/onboarding/save-draft` | `school_onboarding_progress` | Suite 4 Test 10 | **PASS** |
| **Resume Wizard State** | `GET /api/erp/onboarding/status` | `school_onboarding_progress` | Suite 4 Test 10 | **PASS** |
| **11-Step CMS Tree** | `GET /api/websites/:id/cms` | `school_cms` | Suite 6 Test 9 | **PASS** |
| **Draft Notice Privacy** | `POST /api/cms/notices` | `school_cms.draft_tree` | Suite 6 Test 10 | **PASS** |
| **Public Website Render** | `GET /api/public/schools/:slug/cms` | `school_cms.published_tree`| Suite 4 Test 8 | **PASS** |
| **Admissions Lead Capture** | `POST /api/public/schools/:slug/inquiry` | `leads` | Suite 4 Test 9 | **PASS** |
| **Digital Asset Links** | `GET /api/public/.../assetlinks.json` | `school_configurations` | Suite 4 Test 7 | **PASS** |

**Conclusion**: The School Website Builder and CMS pipeline is fully operational, enforces strict draft privacy, and safely bridges public inquiries to the internal CRM.
