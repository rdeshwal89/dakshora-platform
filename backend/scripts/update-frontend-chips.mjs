import fs from 'fs';

const targetString = 'ne.status==="pending_verification"&&e.jsx("span",{className:"px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30",children:"⏳ Verification Pending"}),ne.status==="contacted_interested"&&e.jsx("span",{className:"px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",children:"📞 Contacted & Interested"}),ne.status==="onboarded"&&e.jsx("span",{className:"px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",children:"✅ Onboarded & Active"}),ne.status==="rejected"&&e.jsx("span",{className:"px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30",children:"❌ Declined"})';

const replacementString = 'ne.status==="pending_verification"&&e.jsx("span",{className:"px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 border border-amber-500/40 shadow-sm shadow-amber-500/10",children:"⏳ Verification Pending"}),ne.status==="contacted_interested"&&e.jsx("span",{className:"px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10",children:"📞 Contacted & Interested"}),ne.status==="onboarded"&&e.jsx("span",{className:"px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-200 border border-emerald-500/50 shadow-sm shadow-emerald-500/10",children:"✅ Onboarded & Active"}),ne.status==="rejected"&&e.jsx("span",{className:"px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-200 border border-rose-500/40 shadow-sm shadow-rose-500/10",children:"❌ Declined"})';

for (const file of ['frontend/public/assets/index-rcKcyyN7.js', 'frontend/public/portal/assets/index-rcKcyyN7.js']) {
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf8');
    if (raw.includes(targetString)) {
      const updated = raw.replace(targetString, replacementString);
      fs.writeFileSync(file, updated, 'utf8');
      console.log('Successfully updated status chips in:', file);
    } else {
      console.log('Target string not found or already updated in:', file);
    }
  }
}
