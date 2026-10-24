import React, { useState } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  Award,
  Hash,
  Users,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Globe,
  Copy,
  Check,
  Printer,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { SchoolBrandProfile } from './SchoolBrandingModal';

interface SchoolInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolBrand: SchoolBrandProfile;
  totalStudents?: number;
  totalStaff?: number;
  onShowToast?: (type: 'success' | 'info', title: string, msg?: string) => void;
}

export const SchoolInfoModal: React.FC<SchoolInfoModalProps> = ({
  isOpen,
  onClose,
  schoolBrand,
  totalStudents = 1248,
  totalStaff = 64,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Enriched institutional data
  const schoolDetails = {
    fullName: schoolBrand.schoolName || 'New Ideal Public Senior Secondary School',
    shortName: schoolBrand.shortName || 'New Ideal School',
    board: schoolBrand.board || 'CBSE (Central Board of Secondary Education)',
    affiliationNo: schoolBrand.affiliationNo || 'CBSE-AFF-202611',
    schoolId: schoolBrand.schoolCode || 'SCH-DEL-2026',
    udiseCode: (schoolBrand as any).udiseCode || '09101204856',
    boardCode: (schoolBrand as any).boardCode || '20261001',
    directorName: (schoolBrand as any).directorName || 'Shri Rajeshwar Sharma',
    principalName: schoolBrand.principalName || 'Dr. Vikramaditya Singh',
    phone: schoolBrand.contactPhone || '+91 11 2612 3456',
    email: schoolBrand.contactEmail || 'office@school.edu.in',
    website: 'https://dakshora.in/school/new-ideal',
    address: schoolBrand.address || 'Institutional Area, Vasant Kunj, New Delhi - 110070',
    city: (schoolBrand as any).city || 'New Delhi',
    state: (schoolBrand as any).state || 'Delhi NCR',
    pincode: (schoolBrand as any).pincode || '110070',
    session: '2026–27 (Current Active)',
    category: 'Co-Educational Senior Secondary (K–12)',
    medium: 'English & Hindi Medium (CBSE Recognized)',
    motto: schoolBrand.motto || 'Empowering Minds, Inspiring Futures'
  };

  const handleCopyDetails = () => {
    const text = `
INSTITUTIONAL PROFILE: ${schoolDetails.fullName}
--------------------------------------------------
• Board: ${schoolDetails.board}
• CBSE / Board Affiliation No: ${schoolDetails.affiliationNo}
• School Code / ID: ${schoolDetails.schoolId}
• UDISE+ Code: ${schoolDetails.udiseCode}
• Board Center Code: ${schoolDetails.boardCode}
• Director: ${schoolDetails.directorName}
• Principal: ${schoolDetails.principalName}
• Total Enrolled Students: ${totalStudents}
• Total Faculty & Staff: ${totalStaff}
• Academic Session: ${schoolDetails.session}
• Campus Address: ${schoolDetails.address}
• Contact: ${schoolDetails.phone} | ${schoolDetails.email}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast?.('success', 'Details Copied! 📋', 'Full School Profile copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-lg border border-slate-700 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={schoolBrand.logoUrl || '/assets/schools/new-ideal-logo.svg'}
                  alt={schoolDetails.fullName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (!img.src.includes('new-ideal-logo.svg')) {
                      img.src = '/assets/schools/new-ideal-logo.svg';
                    }
                  }}
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                    {schoolDetails.board.split(' ')[0]} Recognized
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Institution
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
                  {schoolDetails.fullName}
                </h2>
                <p className="text-xs text-slate-300 font-sans italic mt-0.5">
                  "{schoolDetails.motto}"
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

        {/* Scrollable Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 4 Primary Identification Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                Affiliation No
              </span>
              <span className="text-sm font-black text-indigo-600 mt-0.5 block truncate">
                #{schoolDetails.affiliationNo}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">CBSE Registered</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                UDISE+ Code
              </span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block truncate">
                {schoolDetails.udiseCode}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Govt of India</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                School ID / Code
              </span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block truncate">
                {schoolDetails.schoolId}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Portal Master ID</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                Board Center Code
              </span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block truncate">
                {schoolDetails.boardCode}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Examination Wing</span>
            </div>
          </div>

          {/* Institutional Leadership & Roster Counts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider font-mono">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Executive Institutional Leadership</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100">
                  <span className="text-slate-500">School Director:</span>
                  <span className="font-bold text-slate-900">{schoolDetails.directorName}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100">
                  <span className="text-slate-500">Principal & Head:</span>
                  <span className="font-bold text-indigo-700">{schoolDetails.principalName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">School Trust:</span>
                  <span className="font-bold text-slate-800">{schoolDetails.shortName} Educational Trust</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider font-mono">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Enrolled Community & Staff</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 shadow-xs">
                  <span className="text-2xl font-black text-emerald-700 font-mono block">
                    {totalStudents}
                  </span>
                  <span className="text-[11px] font-mono text-slate-600 font-bold">
                    Total Students
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 shadow-xs">
                  <span className="text-2xl font-black text-slate-900 font-mono block">
                    {totalStaff}
                  </span>
                  <span className="text-[11px] font-mono text-slate-600 font-bold">
                    Faculty & Staff
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Campus Location & Contact Specifications */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold font-mono uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-slate-700" />
              <span>Campus Contact & Location Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Campus Address:</span>
                  <span className="text-slate-800 font-medium">{schoolDetails.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Academic Year:</span>
                  <span className="text-emerald-700 font-bold">{schoolDetails.session}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Official Telephone:</span>
                  <span className="text-slate-800 font-bold">{schoolDetails.phone}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Official Email:</span>
                  <span className="text-slate-800 font-bold">{schoolDetails.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDetails}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy All Details'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Profile</span>
            </button>
          </div>

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
