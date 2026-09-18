import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

export interface ResponsibilityType {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string;
  category: "academics" | "examinations" | "student_welfare" | "co_curricular" | "operations" | "administration" | "special_programs";
  default_scope_type: "SCHOOL" | "CAMPUS" | "ACADEMIC_SESSION" | "CLASS" | "SECTION" | "SUBJECT" | "DEPARTMENT" | "PROGRAM" | "HOUSE" | "EXAM" | "ROUTE" | "LIBRARY" | "CUSTOM";
  is_system: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface StaffResponsibility {
  id: string;
  organization_id: string;
  school_id: string;
  campus_id?: string | null;
  staff_id: string;
  responsibility_type_id: string;
  responsibility_code: string;
  responsibility_name?: string;
  scope_type: string;
  scope_id: string;
  scope_name?: string | null;
  academic_session_id: string;
  is_primary: boolean;
  start_date: string;
  end_date?: string | null;
  status: "active" | "inactive" | "expired" | "historical";
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// 18 Initial Standard Indian School Templates (CBSE, Delhi Govt, State Boards, Private)
export const SYSTEM_RESPONSIBILITY_TYPES: ResponsibilityType[] = [
  {
    id: "a0000001-0000-0000-0000-000000000001",
    organization_id: null,
    code: "CLASS_TEACHER",
    name: "Class Teacher",
    description: "Primary incharge for class attendance, student welfare, parent communication, and gradebook oversight.",
    category: "academics",
    default_scope_type: "SECTION",
    is_system: true,
    is_active: true,
    display_order: 1,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000002",
    organization_id: null,
    code: "EXAM_INCHARGE",
    name: "Examination Incharge",
    description: "Coordinates term examinations, schedules, marks tabulation, and report card generation.",
    category: "examinations",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 2,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000003",
    organization_id: null,
    code: "HOD",
    name: "Head of Department (HOD)",
    description: "Supervises academic curriculum delivery, teacher lesson plans, and subject department performance.",
    category: "academics",
    default_scope_type: "DEPARTMENT",
    is_system: true,
    is_active: true,
    display_order: 3,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000004",
    organization_id: null,
    code: "CBSE_INCHARGE",
    name: "CBSE Coordinator / Incharge",
    description: "Manages CBSE affiliation compliance, LOC registration, and board examination coordination.",
    category: "academics",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 4,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000005",
    organization_id: null,
    code: "NEEV_INCHARGE",
    name: "NEEV Foundational Program Incharge",
    description: "Coordinates foundational literacy and numeracy activities, remedial tracking, and student growth.",
    category: "special_programs",
    default_scope_type: "PROGRAM",
    is_system: true,
    is_active: true,
    display_order: 5,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000006",
    organization_id: null,
    code: "DISCIPLINE_INCHARGE",
    name: "Discipline Incharge",
    description: "Monitors student conduct, incident tracking, campus guidelines, and behavioral interventions.",
    category: "student_welfare",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 6,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000007",
    organization_id: null,
    code: "SPORTS_INCHARGE",
    name: "Sports & Physical Education Incharge",
    description: "Manages athletic programs, inter-school tournaments, team selections, and equipment inventory.",
    category: "co_curricular",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 7,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000008",
    organization_id: null,
    code: "HOUSE_INCHARGE",
    name: "House Master / Incharge",
    description: "Leads inter-house competitions, house meetings, student pastoral care, and spirit events.",
    category: "student_welfare",
    default_scope_type: "HOUSE",
    is_system: true,
    is_active: true,
    display_order: 8,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000009",
    organization_id: null,
    code: "ICT_INCHARGE",
    name: "ICT & Computer Lab Incharge",
    description: "Oversees school technology infrastructure, computer labs, smart class hardware, and student logins.",
    category: "operations",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 9,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000010",
    organization_id: null,
    code: "LIBRARY_INCHARGE",
    name: "Library Incharge",
    description: "Supervises library book circulation, member cataloging, and reading circle programs.",
    category: "operations",
    default_scope_type: "LIBRARY",
    is_system: true,
    is_active: true,
    display_order: 10,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000011",
    organization_id: null,
    code: "ADMISSION_INCHARGE",
    name: "Admission Incharge",
    description: "Manages student enrollment pipelines, entrance assessments, and verification interviews.",
    category: "administration",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 11,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000012",
    organization_id: null,
    code: "TIMETABLE_INCHARGE",
    name: "Timetable & Scheduling Incharge",
    description: "Constructs bell schedules, room allocations, master timetables, and teacher substitutions.",
    category: "academics",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 12,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000013",
    organization_id: null,
    code: "ATTENDANCE_INCHARGE",
    name: "Attendance Incharge",
    description: "Audits daily school-wide attendance, investigates chronic absenteeism, and validates staff logs.",
    category: "academics",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 13,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000014",
    organization_id: null,
    code: "ACTIVITY_INCHARGE",
    name: "Co-Curricular Activity Incharge",
    description: "Coordinates clubs, cultural assemblies, exhibitions, and extracurricular celebrations.",
    category: "co_curricular",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 14,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000015",
    organization_id: null,
    code: "EVENT_INCHARGE",
    name: "School Events Coordinator",
    description: "Directs annual day celebrations, sports days, science fairs, and community functions.",
    category: "co_curricular",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 15,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000016",
    organization_id: null,
    code: "TRAINING_INCHARGE",
    name: "Faculty Training & CPD Incharge",
    description: "Coordinates Continuing Professional Development, NEP 2020 workshops, and teacher skill modules.",
    category: "administration",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 16,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000017",
    organization_id: null,
    code: "REMEDIAL_INCHARGE",
    name: "Remedial Education Coordinator",
    description: "Coordinates remedial batches, individualized support plans, and academic improvement tracking.",
    category: "academics",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 17,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "a0000001-0000-0000-0000-000000000018",
    organization_id: null,
    code: "INCLUSIVE_EDUCATION_INCHARGE",
    name: "Inclusive Education & CWSN Incharge",
    description: "Ensures accommodations for Children With Special Needs (CWSN), IEP plans, and counselor coordination.",
    category: "special_programs",
    default_scope_type: "SCHOOL",
    is_system: true,
    is_active: true,
    display_order: 18,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  }
];

// In-Memory store initialized with system templates and seed staff assignments
let IN_MEMORY_RESPONSIBILITY_TYPES: ResponsibilityType[] = [...SYSTEM_RESPONSIBILITY_TYPES];

let IN_MEMORY_STAFF_RESPONSIBILITIES: StaffResponsibility[] = [
  // Ajay Kumar (stf-02 / FAC-02): Class Teacher 9-A, Exam I/C, NEEV I/C
  {
    id: "sr-001",
    organization_id: "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e",
    school_id: "sch-main",
    staff_id: "stf-02",
    responsibility_type_id: "a0000001-0000-0000-0000-000000000001",
    responsibility_code: "CLASS_TEACHER",
    responsibility_name: "Class Teacher",
    scope_type: "SECTION",
    scope_id: "9-A",
    scope_name: "Class 9-A",
    academic_session_id: "2026-27",
    is_primary: true,
    start_date: "2026-04-01",
    status: "active",
    created_by: "admin",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "sr-002",
    organization_id: "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e",
    school_id: "sch-main",
    staff_id: "stf-02",
    responsibility_type_id: "a0000001-0000-0000-0000-000000000002",
    responsibility_code: "EXAM_INCHARGE",
    responsibility_name: "Examination Incharge",
    scope_type: "SCHOOL",
    scope_id: "sch-main",
    scope_name: "All Examinations",
    academic_session_id: "2026-27",
    is_primary: false,
    start_date: "2026-04-01",
    status: "active",
    created_by: "admin",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  },
  {
    id: "sr-003",
    organization_id: "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e",
    school_id: "sch-main",
    staff_id: "stf-02",
    responsibility_type_id: "a0000001-0000-0000-0000-000000000005",
    responsibility_code: "NEEV_INCHARGE",
    responsibility_name: "NEEV Foundational Program Incharge",
    scope_type: "PROGRAM",
    scope_id: "prog-neev",
    scope_name: "NEEV Foundational Literacy & Numeracy",
    academic_session_id: "2026-27",
    is_primary: false,
    start_date: "2026-04-01",
    status: "active",
    created_by: "admin",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z"
  }
];

export class ResponsibilityService {
  static getResponsibilityTypes(organizationId?: string, filters?: { category?: string; active?: boolean | string; search?: string }): ResponsibilityType[] {
    let list = IN_MEMORY_RESPONSIBILITY_TYPES.filter(t => !t.organization_id || t.organization_id === organizationId);
    if (filters?.category && filters.category !== "all") {
      list = list.filter(t => t.category === filters.category);
    }
    if (filters?.active !== undefined && filters.active !== "all") {
      const b = filters.active === true || filters.active === "true";
      list = list.filter(t => t.is_active === b);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }
    return list.sort((a, b) => a.display_order - b.display_order);
  }

  static createResponsibilityType(organizationId: string, data: Partial<ResponsibilityType>): ResponsibilityType {
    const code = (data.code || "").toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    const item: ResponsibilityType = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      code,
      name: data.name || code,
      description: data.description || "",
      category: data.category || "academics",
      default_scope_type: data.default_scope_type || "SCHOOL",
      is_system: false,
      is_active: data.is_active !== false,
      display_order: data.display_order || (IN_MEMORY_RESPONSIBILITY_TYPES.length + 1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    IN_MEMORY_RESPONSIBILITY_TYPES.push(item);
    return item;
  }

  static getStaffResponsibilities(organizationId: string, staffId: string, sessionId?: string): StaffResponsibility[] {
    return IN_MEMORY_STAFF_RESPONSIBILITIES.filter(r => 
      (!r.organization_id || r.organization_id === organizationId) &&
      r.staff_id === staffId &&
      (!sessionId || !r.academic_session_id || r.academic_session_id === sessionId)
    );
  }

  static assignStaffResponsibility(organizationId: string, staffId: string, data: Partial<StaffResponsibility>): StaffResponsibility {
    const type = IN_MEMORY_RESPONSIBILITY_TYPES.find(t => t.id === data.responsibility_type_id || t.code === data.responsibility_code);
    const item: StaffResponsibility = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      school_id: data.school_id || "sch-main",
      campus_id: data.campus_id || null,
      staff_id: staffId,
      responsibility_type_id: type?.id || data.responsibility_type_id || crypto.randomUUID(),
      responsibility_code: type?.code || data.responsibility_code || "CUSTOM",
      responsibility_name: type?.name || data.responsibility_name || type?.code || "Custom Incharge",
      scope_type: data.scope_type || type?.default_scope_type || "SCHOOL",
      scope_id: data.scope_id || "sch-main",
      scope_name: data.scope_name || data.scope_id,
      academic_session_id: data.academic_session_id || "2026-27",
      is_primary: data.is_primary === true,
      start_date: data.start_date || new Date().toISOString().split("T")[0],
      end_date: data.end_date || null,
      status: "active",
      notes: data.notes || null,
      created_by: data.created_by || "admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (item.is_primary) {
      IN_MEMORY_STAFF_RESPONSIBILITIES.forEach(r => {
        if (r.staff_id === staffId && r.organization_id === organizationId) r.is_primary = false;
      });
    }
    IN_MEMORY_STAFF_RESPONSIBILITIES.push(item);
    return item;
  }

  static updateStaffResponsibility(organizationId: string, staffId: string, respId: string, updates: Partial<StaffResponsibility>): StaffResponsibility | null {
    const item = IN_MEMORY_STAFF_RESPONSIBILITIES.find(r => r.id === respId && r.staff_id === staffId && r.organization_id === organizationId);
    if (!item) return null;
    if (updates.status !== undefined) item.status = updates.status;
    if (updates.scope_type !== undefined) item.scope_type = updates.scope_type;
    if (updates.scope_id !== undefined) item.scope_id = updates.scope_id;
    if (updates.scope_name !== undefined) item.scope_name = updates.scope_name;
    if (updates.is_primary !== undefined) item.is_primary = updates.is_primary;
    if (updates.notes !== undefined) item.notes = updates.notes;
    item.updated_at = new Date().toISOString();
    return item;
  }

  static deleteStaffResponsibility(organizationId: string, staffId: string, respId: string): boolean {
    const idx = IN_MEMORY_STAFF_RESPONSIBILITIES.findIndex(r => r.id === respId && r.staff_id === staffId && r.organization_id === organizationId);
    if (idx < 0) return false;
    IN_MEMORY_STAFF_RESPONSIBILITIES.splice(idx, 1);
    return true;
  }

  static getEffectiveAccess(organizationId: string, user: any, staffId?: string, sessionId: string = "2026-27") {
    const baseRole = user?.role || "teacher";
    const resps = staffId ? this.getStaffResponsibilities(organizationId, staffId, sessionId).filter(r => r.status === "active") : [];

    // All available modules
    const allModules = ["dashboard", "portal", "students", "staff", "attendance", "academics", "timetable", "exams", "fees", "admissions", "communication", "transport", "library", "payroll", "reports", "ai", "settings"];

    let moduleAccess: string[] = [];
    let scopes: Record<string, string[]> = {
      sections: [],
      classes: [],
      departments: [],
      programs: [],
      domains: []
    };

    if (baseRole === "admin" || baseRole === "superadmin" || baseRole === "principal") {
      moduleAccess = [...allModules];
      scopes.domains = ["*"];
    } else if (baseRole === "teacher") {
      // Base teacher modules
      moduleAccess = ["dashboard", "portal", "students", "attendance", "academics", "timetable", "homework", "communication", "ai"];
      
      // Dynamic incharge module extensions
      resps.forEach(r => {
        if (r.responsibility_code === "CLASS_TEACHER") {
          scopes.sections.push(r.scope_id);
          if (!moduleAccess.includes("attendance")) moduleAccess.push("attendance");
          if (!moduleAccess.includes("reports")) moduleAccess.push("reports");
        } else if (r.responsibility_code === "EXAM_INCHARGE") {
          if (!moduleAccess.includes("exams")) moduleAccess.push("exams");
          scopes.domains.push("exams");
        } else if (r.responsibility_code === "NEEV_INCHARGE") {
          scopes.programs.push("NEEV");
          if (!moduleAccess.includes("academics")) moduleAccess.push("academics");
        } else if (r.responsibility_code === "HOD") {
          scopes.departments.push(r.scope_id);
          if (!moduleAccess.includes("staff")) moduleAccess.push("staff");
        } else if (r.responsibility_code === "LIBRARY_INCHARGE") {
          if (!moduleAccess.includes("library")) moduleAccess.push("library");
        }
      });
    } else if (baseRole === "account" || baseRole === "accountant") {
      moduleAccess = ["dashboard", "fees", "payroll", "reports", "students", "communication", "ai"];
    } else if (baseRole === "reception") {
      moduleAccess = ["dashboard", "admissions", "students", "staff", "communication", "attendance", "ai"];
    } else if (baseRole === "parent") {
      moduleAccess = ["portal", "dashboard", "attendance", "fees", "timetable", "exams", "transport", "communication", "ai"];
    } else if (baseRole === "student") {
      moduleAccess = ["portal", "dashboard", "academics", "timetable", "exams", "library", "transport", "communication", "ai"];
    } else {
      moduleAccess = ["dashboard", "portal"];
    }

    const restrictedModules = allModules.filter(m => !moduleAccess.includes(m));

    return {
      organizationId,
      schoolName: "Delhi Public Heritage School",
      campus: "Main Campus",
      academicSession: sessionId,
      user: {
        id: user?.id,
        email: user?.email,
        role: baseRole
      },
      staffId: staffId || null,
      baseRole,
      responsibilities: resps.map(r => ({
        id: r.id,
        code: r.responsibility_code,
        name: r.responsibility_name || r.responsibility_code,
        scopeType: r.scope_type,
        scopeId: r.scope_id,
        scopeName: r.scope_name,
        isPrimary: r.is_primary
      })),
      scopes,
      moduleAccess,
      restrictedModules
    };
  }
}
