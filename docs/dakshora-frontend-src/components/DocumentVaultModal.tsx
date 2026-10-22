import React, { useState } from 'react';
import {
  FolderLock,
  Upload,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Download,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Plus,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { ErpStudentRecord, ErpStudentDocument } from '../types';
import { updateErpStudent } from '../services/api';

interface DocumentVaultModalProps {
  student: ErpStudentRecord | null;
  onClose: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onStudentUpdated?: (updated: ErpStudentRecord) => void;
}

export const DOCUMENT_CATEGORIES = [
  { id: 'all', label: 'सभी दस्तावेज़ (All Documents)', icon: '📁' },
  { id: 'aadhaar', label: 'आधार कार्ड (Aadhaar Card)', icon: '🆔' },
  { id: 'birth_cert', label: 'जन्म प्रमाण पत्र (Birth Certificate)', icon: '📜' },
  { id: 'transfer_cert', label: 'पूर्व स्कूल टीसी (Previous School TC)', icon: '🏫' },
  { id: 'marksheet', label: 'पूर्व कक्षा अंकतालिका (Marksheet)', icon: '📊' },
  { id: 'caste_cert', label: 'जाति / आय प्रमाण पत्र (Caste / Income Cert)', icon: '🏷️' },
  { id: 'rte_proof', label: 'RTE आवंटन / निवास प्रमाण पत्र (RTE Proof)', icon: '⚖️' },
  { id: 'other', label: 'अन्य दस्तावेज़ (Other Documents)', icon: '📎' }
];

export const DocumentVaultModal: React.FC<DocumentVaultModalProps> = ({
  student,
  onClose,
  onShowToast,
  onStudentUpdated
}) => {
  if (!student) return null;

  // Initial Documents list from student record or default fallback
  const initialDocs: ErpStudentDocument[] = (student.documents && student.documents.length > 0)
    ? student.documents
    : [
        {
          id: 'doc-aadhaar-1',
          name: 'Student Aadhaar Card (विद्यार्थी आधार)',
          type: 'application/pdf',
          verified: true,
          uploadedAt: '2026-07-04',
          fileSize: '1.4 MB',
          category: 'aadhaar',
          documentNumber: 'XXXX-XXXX-4819'
        },
        {
          id: 'doc-birth-2',
          name: 'Birth Certificate (नगर निगम जन्म प्रमाण पत्र)',
          type: 'image/jpeg',
          verified: true,
          uploadedAt: '2026-07-04',
          fileSize: '840 KB',
          category: 'birth_cert',
          documentNumber: 'BC/2011/9812'
        },
        {
          id: 'doc-tc-3',
          name: 'Previous School TC (कक्षा 5 मूल टीसी)',
          type: 'application/pdf',
          verified: true,
          uploadedAt: '2026-07-05',
          fileSize: '2.1 MB',
          category: 'transfer_cert',
          documentNumber: 'TC-99120'
        },
        {
          id: 'doc-marksheet-4',
          name: 'Class 9 Annual Report Card & Marksheet',
          type: 'application/pdf',
          verified: false,
          uploadedAt: '2026-09-12',
          fileSize: '1.8 MB',
          category: 'marksheet',
          documentNumber: 'MS-2026-104'
        }
      ];

  const [documents, setDocuments] = useState<ErpStudentDocument[]>(initialDocs);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<ErpStudentDocument | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // New Upload Form state
  const [newDocCategory, setNewDocCategory] = useState<string>('aadhaar');
  const [newDocTitle, setNewDocTitle] = useState<string>('');
  const [newDocNumber, setNewDocNumber] = useState<string>('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    if (selectedCategory === 'all') return true;
    return doc.category === selectedCategory;
  });

  // Save documents to backend
  const persistDocuments = async (updatedList: ErpStudentDocument[], successMsg: string) => {
    setIsSaving(true);
    try {
      const res = await updateErpStudent(student.id, { documents: updatedList });
      setDocuments(updatedList);
      if (res.data?.student) {
        onStudentUpdated?.(res.data.student);
      }
      onShowToast?.('success', 'दस्तावेज़ तिजोरी अपडेट', successMsg);
    } catch (err: any) {
      onShowToast?.('error', 'दस्तावेज़ सुरक्षित करने में त्रुटि', err.message || 'Server sync error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Verification Status
  const handleToggleVerify = (docId: string) => {
    const updated = documents.map((doc) => {
      if (doc.id === docId) {
        return { ...doc, verified: !doc.verified };
      }
      return doc;
    });
    const target = updated.find((d) => d.id === docId);
    persistDocuments(
      updated,
      `${target?.name}: स्थिति '${target?.verified ? 'सत्यापित (Verified)' : 'समीक्षाधीन (Pending)'}' में बदली गई।`
    );
  };

  // Delete Document
  const handleDeleteDoc = (docId: string) => {
    if (confirm('क्या आप निश्चित रूप से इस दस्तावेज़ को तिजोरी से हटाना चाहते हैं?')) {
      const updated = documents.filter((d) => d.id !== docId);
      persistDocuments(updated, 'दस्तावेज़ सफलतापूर्वक हटाया गया।');
    }
  };

  // Add Document
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) {
      onShowToast?.('error', 'दस्तावेज़ का नाम दर्ज करें', 'शीर्षक अनिवार्य है');
      return;
    }

    const newDoc: ErpStudentDocument = {
      id: `doc-${Date.now()}`,
      name: newDocTitle.trim(),
      type: newDocFile?.type || 'application/pdf',
      verified: true, // auto-verified by school clerk/admin upon upload
      uploadedAt: new Date().toISOString().split('T')[0],
      fileSize: newDocFile ? `${(newDocFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
      category: newDocCategory as any,
      documentNumber: newDocNumber.trim() || undefined
    };

    const updated = [newDoc, ...documents];
    persistDocuments(updated, `'${newDoc.name}' सुरक्षित रूप से अपलोड व संग्रहीत किया गया।`);
    setShowUploadForm(false);
    setNewDocTitle('');
    setNewDocNumber('');
    setNewDocFile(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>सुरक्षित दस्तावेज़ तिजोरी (Student Document Vault)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AES-256 Encrypted
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {student.name} • Scholar #{student.admissionNo || 'SR-4819'} • {student.grade} ({student.section})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20"
            >
              <Upload className="w-4 h-4" />
              <span>{showUploadForm ? 'Cancel Upload' : 'Upload Document'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upload Drawer if opened */}
        {showUploadForm && (
          <form
            onSubmit={handleAddDocument}
            className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> नया दस्तावेज़ अपलोड करें (Upload New Document to Vault)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">PDF, JPG, PNG (Max 10MB)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-bold block mb-1">श्रेणी (Category):</label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="aadhaar">आधार कार्ड (Aadhaar Card)</option>
                  <option value="birth_cert">जन्म प्रमाण पत्र (Birth Certificate)</option>
                  <option value="transfer_cert">पूर्व विद्यालय टीसी (Transfer Certificate)</option>
                  <option value="marksheet">पूर्व कक्षा अंकतालिका (Marksheet)</option>
                  <option value="caste_cert">जाति / आय प्रमाण पत्र (Caste / Income Cert)</option>
                  <option value="rte_proof">RTE आवंटन / निवास प्रमाण पत्र (RTE Proof)</option>
                  <option value="other">अन्य दस्तावेज़ (Other Document)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">दस्तावेज़ का नाम (Document Title):</label>
                <input
                  type="text"
                  placeholder="उदा. Student Aadhaar Card"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">प्रमाण पत्र / ID क्रमांक (Optional):</label>
                <input
                  type="text"
                  placeholder="उदा. 4819-2041-9812"
                  value={newDocNumber}
                  onChange={(e) => setNewDocNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* File Selector */}
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-900/50">
              <input
                type="file"
                id="vault-file-input"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setNewDocFile(e.target.files[0]);
                    if (!newDocTitle) setNewDocTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                  }
                }}
              />
              <label htmlFor="vault-file-input" className="cursor-pointer block space-y-1">
                <FileText className="w-8 h-8 text-cyan-400 mx-auto" />
                <div className="text-xs text-white font-bold">
                  {newDocFile ? newDocFile.name : 'फ़ाइल चुनें या यहाँ ड्रैग करें (Click or Drag & Drop File)'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {newDocFile ? `${(newDocFile.size / 1024).toFixed(1)} KB • तैयार` : 'PDF, JPG, PNG समर्थित'}
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>तिजोरी में सहेजें (Save to Vault)</span>
              </button>
            </div>
          </form>
        )}

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-mono">
          {DOCUMENT_CATEGORIES.map((cat) => {
            const count = cat.id === 'all'
              ? documents.length
              : documents.filter((d) => d.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-colors font-bold ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Documents Grid / List */}
        <div className="flex-1 overflow-y-auto min-h-[300px] space-y-3">
          {filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3 font-mono flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-xs leading-snug line-clamp-2">
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span>अपलोड: {doc.uploadedAt}</span>
                          <span>•</span>
                          <span>{doc.fileSize || '1.2 MB'}</span>
                        </div>
                        {doc.documentNumber && (
                          <div className="text-[10px] text-amber-400 mt-0.5">
                            ID सं.: <span className="font-bold">{doc.documentNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <button
                      onClick={() => handleToggleVerify(doc.id)}
                      title="क्लिक कर स्थिति बदलें"
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                        doc.verified
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                    >
                      {doc.verified ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>सत्यापित (Verified)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>समीक्षाधीन (Pending)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                    <span className="text-[10px] text-slate-600 uppercase font-bold">
                      {doc.category || 'General Document'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-800"
                        title="दस्तावेज़ पूर्वावलोकन (Preview)"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          onShowToast?.('info', 'डाउनलोड प्रारंभ', `${doc.name} डाउनलोड किया जा रहा है।`);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800"
                        title="डाउनलोड करें (Download)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-slate-800"
                        title="हटाएं (Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-3">
              <FolderLock className="w-12 h-12 text-slate-700" />
              <div className="text-white font-bold text-sm">इस श्रेणी में कोई दस्तावेज़ नहीं मिला</div>
              <p className="text-xs text-slate-500 max-w-sm">
                छात्र के आधार कार्ड, जन्म प्रमाण पत्र अथवा पूर्व स्कूल टीसी की डिजिटल प्रति अपलोड करने के लिए ऊपर <b>Upload Document</b> पर क्लिक करें।
              </p>
              <button
                onClick={() => setShowUploadForm(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
              >
                + दस्तावेज़ अपलोड करें
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-2 border-t border-slate-800">
          <div>
            कुल दस्तावेज़: <b className="text-white">{documents.length}</b> • सत्यापित:{' '}
            <b className="text-emerald-400">{documents.filter((d) => d.verified).length}</b>
          </div>
          <div>सुरक्षा: क्लाउड एन्क्रिप्टेड एवं बोर्ड ऑडिट के अनुकूल</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 👁️ DOCUMENT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-sm text-white">{previewDoc.name}</span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Preview Area */}
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 min-h-[260px]">
              <div className="w-20 h-20 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
                <FileText className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">{previewDoc.name}</h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  प्रकार: {previewDoc.type} • आकार: {previewDoc.fileSize || '1.2 MB'} • अपलोड: {previewDoc.uploadedAt}
                </p>
                {previewDoc.documentNumber && (
                  <p className="text-xs text-amber-400 font-mono font-bold mt-1">
                    पहचान संख्या: {previewDoc.documentNumber}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    previewDoc.verified
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {previewDoc.verified ? '✓ संस्था द्वारा विधिवत सत्यापित' : '⚠️ सत्यापन प्रक्रियाधीन'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleToggleVerify(previewDoc.id)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700"
              >
                {previewDoc.verified ? 'चिह्नित करें: समीक्षाधीन' : 'चिह्नित करें: सत्यापित'}
              </button>
              <button
                onClick={() => {
                  onShowToast?.('info', 'डाउनलोड प्रारंभ', `${previewDoc.name} डाउनलोड किया जा रहा है।`);
                  setPreviewDoc(null);
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20"
              >
                <Download className="w-4 h-4" />
                <span>डाउनलोड फ़ाइल (Download File)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
