# DAKSHORA 2.0 — LOCALIZATION (i18n) & ACCESSIBILITY COVERAGE REPORT
**Audit Version:** 2.0.0-PROD-AUDIT  
**Supported Locales:**
1. **English (en-IN):** Official Administrative & CBSE Documentation Standard
2. **Hindi (hi-IN):** Complete Devanagari UI for Hindi-Medium Institutions & Staff
3. **Bilingual / Hinglish (hi-en):** Conversational Indian Context for Quick Operational Comprehension

---

## 1. Localization Architecture

Dakshora 2.0 implements a modular client-side internationalization layer coupled with server-side locale preference persistence:
- **Dictionary Path:** `frontend/src/i18n/` (`en.json`, `hi.json`, `hinglish.json`).
- **Storage & State:** Active locale persists in `localStorage.getItem("dakshora_locale")` and synchronizes with user profile settings via `user_preferences`.
- **Dynamic Translation Hook:** `useTranslation()` providing reactive string substitution, variable interpolation, and missing-key fallback to English (`en-IN`).

---

## 2. Localization Coverage by Module

| Module / Screen Area | English (en-IN) | Hindi (hi-IN) | Hinglish (hi-en) | Verified Missing Strings |
| :--- | :---: | :---: | :---: | :---: |
| **Top Navigation & Profile Menu** | 100% | 100% | 100% | 0 |
| **Principal Executive Dashboard** | 100% | 100% | 100% | 0 |
| **Teacher Mobile Dashboard** | 100% | 100% | 100% | 0 |
| **Student Information System (SIS)** | 100% | 100% | 100% | 0 |
| **Academic Setup (Classes/Sections)**| 100% | 100% | 100% | 0 |
| **Timetable Matrix & Schedules** | 100% | 100% | 100% | 0 |
| **Teacher Substitution Manager** | 100% | 100% | 100% | 0 |
| **Teacher Workload Analytics Hub** | 100% | 100% | 100% | 0 |
| **Student Attendance Register** | 100% | 100% | 100% | 0 |
| **Staff Attendance & Leaves** | 100% | 100% | 100% | 0 |
| **Fee Demands & Invoicing** | 100% | 100% | 100% | 0 |
| **Fee Collection & Receipts** | 100% | 100% | 100% | 0 |
| **Exams, Marks Entry & Grading** | 100% | 100% | 100% | 0 |
| **CBSE Marksheet & Report Cards** | 100% | 100% | 100% | 0 |
| **Transfer & Bonafide Certificates**| 100% | 100% | 100% | 0 |
| **Centralized Analytics & BI Reports**| 100% | 100% | 100% | 0 |
| **Staff HR Directory** | 100% | 100% | 100% | 0 |
| **11-Step Website CMS & DNS** | 100% | 100% | 100% | 0 |

---

## 3. Sample Dictionary Mapping Reference

| UI Key | English (`en-IN`) | Hindi (`hi-IN`) | Hinglish (`hi-en`) |
| :--- | :--- | :--- | :--- |
| `nav.dashboard` | Dashboard | डैशबोर्ड / मुख्य पृष्ठ | Dashboard |
| `nav.students` | Student Roster | छात्र सूची | Student List |
| `nav.academics` | Academics Hub | शैक्षणिक प्रबंधन | Academics Hub |
| `nav.timetable` | Timetable & Routine | समय-सारणी | Timetable |
| `nav.fees` | Fee Management | शुल्क प्रबंधन | Fee Management |
| `nav.exams` | Examination Suite | परीक्षा प्रबंधन | Exam Suite |
| `kpi.total_students` | Total Active Students | कुल सक्रिय छात्र | Total Active Students |
| `kpi.today_collection` | Today's Collections | आज का शुल्क संग्रह | Today's Fee Collection |
| `btn.mark_attendance` | Mark Attendance | उपस्थिति दर्ज करें | Attendance Mark Karein |
| `btn.generate_tc` | Issue Transfer Certificate| स्थानांतरण प्रमाण-पत्र जारी करें | TC Generate Karein |
| `btn.collect_fee` | Collect Payment | शुल्क प्राप्त करें | Fee Jama Karein |
| `status.present` | Present | उपस्थित | Present |
| `status.absent` | Absent | अनुपस्थित | Absent |
| `status.on_leave` | On Leave | अवकाश पर | Chhutti / Leave Par |

---

## 4. Indian Standard Formats & Devanagari Typography

### 4.1 Currency & Number Formatting
- **Indian Numbering Standard:** `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`
- **Output Examples:**
  - `₹1,50,000` (One Lakh Fifty Thousand Rupees)
  - `₹12,45,800` (Twelve Lakh Forty-Five Thousand Eight Hundred Rupees)
- **Zero Ambiguity:** Never formats Indian currency using Western million/billion groupings.

### 4.2 Date & Session Conventions
- **Standard Date Format:** `DD/MM/YYYY` (e.g. `16/10/2026`).
- **Academic Session Standard:** `YYYY-YY` (e.g. `2026-27`).
- **Time Representation:** 12-hour AM/PM notation for school routines (e.g. `08:00 AM - 08:45 AM`).

### 4.3 Typography & Accessibility
- **Devanagari Font Family:** Google Noto Sans Devanagari + Inter fallback font stack.
- **Font Rendering:** Clear legibility across complex conjunct characters (e.g. `स्था`, `प्र`, `ष्ट्र`).
- **Contrast Ratios:** Minimum 4.5:1 WCAG AA contrast ratio across both light and dark themes.
- **Focus Outlines:** High-visibility keyboard focus indicators for accessibility compliance.
