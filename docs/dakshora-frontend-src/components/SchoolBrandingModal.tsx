import React, { useState } from 'react';
import {
  X,
  Building2,
  Palette,
  Check,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Award,
  Layers,
  FileCheck
} from 'lucide-react';

export interface SchoolBrandProfile {
  schoolName: string;
  shortName: string;
  board: string;
  affiliationNo: string;
  schoolCode: string;
  motto: string;
  themeColor: 'indigo' | 'emerald' | 'crimson' | 'amber' | 'cyan';
  logoUrl?: string;
  principalName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

export const PRESET_SCHOOLS: Record<string, SchoolBrandProfile> = {
  dakshora: {
    schoolName: 'Dakshora Academy, New Delhi',
    shortName: 'Dakshora Academy',
    board: 'CBSE (Central Board of Secondary Education)',
    affiliationNo: 'CBSE-AFF-202601',
    schoolCode: 'DKS-DEL-01',
    motto: 'Empowering Minds, Inspiring Futures',
    themeColor: 'indigo',
    logoUrl: '/assets/dakshora-logo.png',
    principalName: 'Dr. Vikramaditya Singh',
    contactEmail: 'principal@dakshoraacademy.edu.in',
    contactPhone: '+91 11 2612 3456',
    address: 'Institutional Area, Vasant Kunj, New Delhi - 110070'
  },
  nirmal: {
    schoolName: 'Nirmal Happy Senior Secondary School',
    shortName: 'Nirmal Happy',
    board: 'RBSE (Rajasthan Board of Secondary Education)',
    affiliationNo: 'RBSE-HND-2026',
    schoolCode: '2026100002',
    motto: 'Knowledge, Character, Excellence',
    themeColor: 'emerald',
    principalName: 'Principal',
    contactEmail: 'principal@nirmalhappyschool.edu.in',
    contactPhone: '+91 94140 00000',
    address: 'Station Road, Hindaun City, Karauli, Rajasthan - 322230'
  },
  newideal: {
    schoolName: 'New Ideal Public School',
    shortName: 'New Ideal',
    board: 'CBSE (Central Board of Secondary Education)',
    affiliationNo: 'CBSE-AFF-2130894',
    schoolCode: '2026100001',
    motto: 'Excellence in Education',
    themeColor: 'indigo',
    logoUrl: '/assets/schools/new-ideal-logo.svg',
    principalName: 'Principal',
    contactEmail: 'admin@newidealpublicschool.com',
    contactPhone: '+91 8529575588',
    address: 'Shankar Gali Dauli Pyau, Mathura, Uttar Pradesh - 281001'
  },
  dps: {
    schoolName: 'Delhi Public Heritage School',
    shortName: 'DPS Heritage',
    board: 'CBSE (Central Board of Secondary Education)',
    affiliationNo: 'CBSE-AFF-2130894',
    schoolCode: 'DPS-VK-894',
    motto: 'Service Before Self',
    themeColor: 'indigo',
    principalName: 'Dr. Meenakshi Sundaram',
    contactEmail: 'principal@dpsheritage.edu.in',
    contactPhone: '+91 98100 00111',
    address: 'Vasant Kunj Institutional Area, New Delhi - 110070'
  },
  tagore: {
    schoolName: 'Tagore Public Senior Secondary Academy',
    shortName: 'Tagore Academy',
    board: 'RBSE (Rajasthan Board of Secondary Education)',
    affiliationNo: 'RBSE-SEC-450912',
    schoolCode: 'TAG-JPR-204',
    motto: 'Knowledge is Supreme Immortality',
    themeColor: 'emerald',
    principalName: 'Pt. Raghuvir Sharma',
    contactEmail: 'info@tagoreacademy.edu.in',
    contactPhone: '+91 94140 12345',
    address: 'Tonk Road, Pratap Nagar, Jaipur, Rajasthan - 302033'
  },
  stmarys: {
    schoolName: "St. Mary's Convent Senior Secondary School",
    shortName: "St. Mary's",
    board: 'CBSE & Cambridge International',
    affiliationNo: 'CBSE-AFF-1730045',
    schoolCode: 'SMC-8812',
    motto: 'Love, Truth and Joy',
    themeColor: 'crimson',
    principalName: 'Sr. Theresa Joseph',
    contactEmail: 'office@stmarysconvent.org',
    contactPhone: '+91 98290 56789',
    address: 'Civil Lines, Ajmer Road, Jaipur - 302006'
  },
  saraswati: {
    schoolName: 'Saraswati Bal Vidya Mandir Inter College',
    shortName: 'Saraswati Mandir',
    board: 'UPMSP (Uttar Pradesh Madhyamik Shiksha Parishad)',
    affiliationNo: 'UPMSP-IC-091448',
    schoolCode: 'SVM-LKO-411',
    motto: 'सा विद्या या विमुक्तये (Knowledge Liberates)',
    themeColor: 'amber',
    principalName: 'Acharya Narendra Dev Shastri',
    contactEmail: 'contact@saraswatibalmandir.org',
    contactPhone: '+91 94500 78901',
    address: 'Aliganj, Sector-C, Lucknow, Uttar Pradesh - 226024'
  }
};

interface SchoolBrandingModalProps {
  currentBrand: SchoolBrandProfile;
  isOpen: boolean;
  onClose: () => void;
  onApplyBrand: (brand: SchoolBrandProfile) => void;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const SchoolBrandingModal: React.FC<SchoolBrandingModalProps> = ({
  currentBrand,
  isOpen,
  onClose,
  onApplyBrand,
  onShowToast
}) => {
  const [form, setForm] = useState<SchoolBrandProfile>(currentBrand);

  if (!isOpen) return null;

  const handlePresetSelect = (presetKey: string) => {
    const preset = PRESET_SCHOOLS[presetKey];
    if (preset) {
      setForm(preset);
      onShowToast('info', `Preset Loaded: ${preset.shortName}`, `Theme and board details adjusted`);
    }
  };

  const handleSave = () => {
    if (!form.schoolName.trim()) {
      onShowToast('warning', 'Missing School Name', 'Please provide a valid school name.');
      return;
    }
    localStorage.setItem('dakshora_school_brand', JSON.stringify(form));
    onApplyBrand(form);
    onShowToast('success', 'School Identity Morphed! 🎨', `The app is now customized for ${form.schoolName}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>School Brand Morphing Engine</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  White-Label
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                Transform app name, logo, board affiliation & brand colors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 text-xs">
          {/* Quick Demo Presets */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick 1-Click School Presets (डेमो के लिए चुनें):
              </label>
              <span className="text-[10px] font-mono text-slate-500">Instant Brand Switch</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'dps', name: 'Delhi Public School', board: 'CBSE', color: 'border-indigo-500 bg-indigo-50/60 text-indigo-900' },
                { key: 'tagore', name: 'Tagore Academy', board: 'RBSE', color: 'border-emerald-500 bg-emerald-50/60 text-emerald-900' },
                { key: 'stmarys', name: "St. Mary's Convent", board: 'ICSE/CBSE', color: 'border-rose-500 bg-rose-50/60 text-rose-900' },
                { key: 'saraswati', name: 'Saraswati Mandir', board: 'UPMSP', color: 'border-amber-500 bg-amber-50/60 text-amber-900' }
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePresetSelect(p.key)}
                  className={`p-2.5 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${p.color}`}
                >
                  <p className="font-bold truncate text-[11px]">{p.name}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">{p.board}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Official School Full Name (स्कूल का पूरा नाम):
              </label>
              <input
                type="text"
                value={form.schoolName}
                onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                placeholder="e.g. St. Mary's Senior Secondary School"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Short Display Name:
                </label>
                <input
                  type="text"
                  value={form.shortName}
                  onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                  placeholder="e.g. St. Mary's"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Affiliation Board:
                </label>
                <select
                  value={form.board}
                  onChange={(e) => setForm({ ...form, board: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="CBSE (Central Board of Secondary Education)">CBSE (Central Board)</option>
                  <option value="RBSE (Rajasthan Board of Secondary Education)">RBSE (Rajasthan Board)</option>
                  <option value="UPMSP (Uttar Pradesh Madhyamik Shiksha Parishad)">UPMSP (UP Board)</option>
                  <option value="BSEH (Haryana Board of School Education)">BSEH (Haryana Board)</option>
                  <option value="ICSE (Indian Certificate of Secondary Education)">ICSE / CISCE</option>
                  <option value="State Board">Other State Board</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Affiliation Number:
                </label>
                <input
                  type="text"
                  value={form.affiliationNo}
                  onChange={(e) => setForm({ ...form, affiliationNo: e.target.value })}
                  placeholder="e.g. CBSE-AFF-2130894"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  School Code:
                </label>
                <input
                  type="text"
                  value={form.schoolCode}
                  onChange={(e) => setForm({ ...form, schoolCode: e.target.value })}
                  placeholder="e.g. SCH-8812"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                School Motto / Tagline:
              </label>
              <input
                type="text"
                value={form.motto}
                onChange={(e) => setForm({ ...form, motto: e.target.value })}
                placeholder="e.g. Knowledge, Integrity and Excellence"
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            {/* Brand Color Theme Palette */}
            <div>
              <label className="font-bold text-slate-700 block mb-2 font-mono text-[11px] uppercase tracking-wider">
                Brand Accent Palette (स्कूल का मुख्य रंग):
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'indigo', name: 'Royal Indigo', bg: 'bg-indigo-600', ring: 'ring-indigo-600' },
                  { id: 'emerald', name: 'Forest Emerald', bg: 'bg-emerald-600', ring: 'ring-emerald-600' },
                  { id: 'crimson', name: 'Convent Crimson', bg: 'bg-rose-700', ring: 'ring-rose-700' },
                  { id: 'amber', name: 'Golden Saffron', bg: 'bg-amber-600', ring: 'ring-amber-600' },
                  { id: 'cyan', name: 'Ocean Cyan', bg: 'bg-cyan-600', ring: 'ring-cyan-600' }
                ].map((color) => {
                  const isSelected = form.themeColor === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setForm({ ...form, themeColor: color.id as any })}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? `border-slate-800 bg-slate-50 ring-2 ${color.ring}`
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${color.bg} shadow-sm flex items-center justify-center text-white`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:brightness-110 text-white font-extrabold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Brand Morphing</span>
          </button>
        </div>
      </div>
    </div>
  );
};
