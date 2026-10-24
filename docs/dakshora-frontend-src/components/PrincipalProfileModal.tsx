import React, { useState } from 'react';
import {
  X,
  Award,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  Clock,
  MapPin,
  Calendar,
  Check,
  Copy,
  Printer,
  ShieldCheck,
  Sparkles,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { SchoolBrandProfile } from './SchoolBrandingModal';

interface PrincipalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolBrand: SchoolBrandProfile;
  currentUser?: any;
  onShowToast?: (type: 'success' | 'info', title: string, msg?: string) => void;
}

export const PrincipalProfileModal: React.FC<PrincipalProfileModalProps> = ({
  isOpen,
  onClose,
  schoolBrand,
  currentUser,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const principal = {
    name: schoolBrand.principalName || currentUser?.name || 'Dr. Vikramaditya Singh',
    designation: 'Principal & Head of Institution',
    academicCadre: 'Senior Educational Leader & Academic Director',
    qualifications: 'Ph.D. in Educational Leadership, M.Sc. (Physics), B.Ed. (Gold Medalist)',
    empId: 'EMP-PRIN-001',
    experience: '22+ Years in Senior Secondary & CBSE Administrative Leadership',
    email: schoolBrand.contactEmail ? `principal@${schoolBrand.contactEmail.split('@')[1] || 'dakshora.edu.in'}` : 'principal@dakshoraacademy.edu.in',
    phone: schoolBrand.contactPhone || '+91 98765 11001',
    officeLocation: "Executive Principal's Chamber, Ground Floor, Administrative Block-A",
    visitingHours: 'Monday to Saturday: 10:00 AM – 01:30 PM (Parent Interactions & Appointments)',
    session: '2026–27',
    schoolName: schoolBrand.schoolName || 'New Ideal Public Senior Secondary School',
    board: schoolBrand.board || 'CBSE (Central Board of Secondary Education)',
    affiliationNo: schoolBrand.affiliationNo || 'CBSE-AFF-202611',
    vision: `Our pedagogical goal is to instill intellectual inquiry, scientific rigor, and deep ethical values in every student in alignment with the NEP 2020 5+3+3+4 framework. We invite parents and faculty to collaborate openly towards holistic institutional excellence.`
  };

  const handleCopyBio = () => {
    const text = `
PRINCIPAL & EXECUTIVE HEAD OF INSTITUTION
-----------------------------------------
• Name: ${principal.name}
• Designation: ${principal.designation}
• Qualifications: ${principal.qualifications}
• Employee Code: ${principal.empId}
• Institution: ${principal.schoolName} (${principal.board})
• Affiliation No: #${principal.affiliationNo}
• Total Experience: ${principal.experience}
• Visiting Hours: ${principal.visitingHours}
• Contact: ${principal.phone} | ${principal.email}
• Office: ${principal.officeLocation}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast?.('success', 'Profile Copied! 📋', 'Principal Executive Details copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-1 shadow-xl shrink-0 flex items-center justify-center text-white font-extrabold text-2xl border-2 border-white/20">
                {principal.name.replace('Dr. ', '').replace('Prof. ', '').charAt(0)}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                    {principal.empId}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Authorized Institutional Head
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
                  {principal.name}
                </h2>
                <p className="text-xs text-indigo-200 font-mono mt-0.5">
                  {principal.designation} • {principal.academicCadre}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Key Credentials Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold uppercase text-[10px]">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Qualifications</span>
              </div>
              <p className="text-slate-900 font-bold mt-1 text-xs leading-snug">
                Ph.D. Education, M.Sc., B.Ed.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-purple-700 font-bold uppercase text-[10px]">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Leadership Tenure</span>
              </div>
              <p className="text-slate-900 font-bold mt-1 text-xs">
                {principal.experience.split('in')[0]}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold uppercase text-[10px]">
                <Award className="w-3.5 h-3.5" />
                <span>CBSE Recognition</span>
              </div>
              <p className="text-slate-900 font-bold mt-1 text-xs">
                Affiliation #{principal.affiliationNo}
              </p>
            </div>
          </div>

          {/* Academic Message / Vision */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase font-mono tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Message from the Principal's Desk</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "{principal.vision}"
            </p>
          </div>

          {/* Office Hours & Contact Matrix */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs font-mono">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
              Office Hours & Direct Communication
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Parent Visiting Hours:</span>
                  <span className="text-slate-800 font-bold">{principal.visitingHours}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Office Chamber:</span>
                  <span className="text-slate-800 font-medium">{principal.officeLocation}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Direct Phone:</span>
                  <span className="text-slate-800 font-bold">{principal.phone}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Direct Email:</span>
                  <span className="text-slate-800 font-bold">{principal.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleCopyBio}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Executive Profile'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
