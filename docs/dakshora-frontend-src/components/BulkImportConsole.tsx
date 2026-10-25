import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Download,
  FileText,
  ArrowRight,
  Filter,
  Check,
  Eye,
  Trash2,
  AlertCircle
} from 'lucide-react';

export interface BulkImportFieldConfig {
  key: string;
  label: string;
  aliases: string[];
  required?: boolean;
  example: string;
}

interface BulkImportConsoleProps {
  entityType: 'student' | 'staff';
  title: string;
  subtitle: string;
  fields: BulkImportFieldConfig[];
  sampleFileName: string;
  existingUniqueKeys?: {
    admissionNos?: Set<string>;
    penNos?: Set<string>;
    employeeIds?: Set<string>;
    emails?: Set<string>;
  };
  onCommitImport: (validRecords: any[]) => Promise<{ success: boolean; importedCount: number; message?: string }>;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onClose: () => void;
}

export const BulkImportConsole: React.FC<BulkImportConsoleProps> = ({
  entityType,
  title,
  subtitle,
  fields,
  sampleFileName,
  existingUniqueKeys = {},
  onCommitImport,
  onShowToast,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Parsed records state
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Array<{ row: number; field: string; error: string; data: any }>>([]);
  const [validRecords, setValidRecords] = useState<any[]>([]);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'errors'>('all');

  // Import completion summary
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    failed: number;
    duplicates: number;
  } | null>(null);

  // Normalize field names across various spreadsheet headers
  const matchFieldKey = (rawHeader: string): string | null => {
    const cleanHeader = rawHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const f of fields) {
      if (f.key.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanHeader) return f.key;
      for (const alias of f.aliases) {
        if (alias.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanHeader) return f.key;
      }
    }
    return null;
  };

  // Parse file buffer (Excel .xlsx, .xls or CSV)
  const processFileData = (buffer: ArrayBuffer, name: string) => {
    setIsParsing(true);
    setFileName(name);
    setImportSummary(null);

    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        onShowToast('error', 'Empty File', 'The uploaded spreadsheet contains no sheets.');
        setIsParsing(false);
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (!rawJson || rawJson.length < 2) {
        onShowToast('error', 'Insufficient Data', 'The file must contain a header row and at least one data row.');
        setIsParsing(false);
        return;
      }

      const headerRow = rawJson[0] as string[];
      const dataRows = rawJson.slice(1);

      // Build header column index mapping
      const columnMapping: { [colIndex: number]: string } = {};
      headerRow.forEach((h, idx) => {
        if (h && typeof h === 'string') {
          const matched = matchFieldKey(h);
          if (matched) columnMapping[idx] = matched;
        }
      });

      // Check required fields presence in headers
      const missingRequired = fields
        .filter(f => f.required)
        .filter(f => !Object.values(columnMapping).includes(f.key));

      if (missingRequired.length > 0) {
        onShowToast(
          'error',
          'Missing Required Columns',
          `Headers must include: ${missingRequired.map(f => f.label).join(', ')}`
        );
      }

      // Process and validate rows
      const seenBatchKeys = new Set<string>();
      const errorsList: Array<{ row: number; field: string; error: string; data: any }> = [];
      const validList: any[] = [];
      const rowsFormatted: any[] = [];
      let duplicatesFound = 0;

      dataRows.forEach((row, rIdx) => {
        // Skip empty rows
        if (!row || row.length === 0 || row.every(val => val === null || val === undefined || String(val).trim() === '')) {
          return;
        }

        const rowNum = rIdx + 2; // 1-indexed, skipping header
        const rowObj: any = { _rowNum: rowNum, _hasError: false, _errors: [] };

        Object.keys(columnMapping).forEach((colIdxStr) => {
          const colIdx = Number(colIdxStr);
          const key = columnMapping[colIdx];
          const rawVal = row[colIdx];
          rowObj[key] = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
        });

        // Entity-specific validations
        if (entityType === 'student') {
          // Name validation
          if (!rowObj.name) {
            rowObj._hasError = true;
            rowObj._errors.push('Student Name is required');
            errorsList.push({ row: rowNum, field: 'name', error: 'Student Name is required', data: rowObj });
          }

          // Class/Grade validation
          if (!rowObj.grade) {
            rowObj._hasError = true;
            rowObj._errors.push('Class / Grade is required');
            errorsList.push({ row: rowNum, field: 'grade', error: 'Class / Grade is required', data: rowObj });
          }

          // Section validation
          if (!rowObj.section) {
            rowObj.section = 'A';
          }

          // Admission Number
          const admNo = rowObj.admissionNo || `ADM-2026-${1000 + rIdx}`;
          rowObj.admissionNo = admNo;
          const admLower = admNo.toLowerCase();

          if (seenBatchKeys.has(`adm:${admLower}`)) {
            rowObj._hasError = true;
            rowObj._errors.push(`Duplicate Admission No in sheet: ${admNo}`);
            errorsList.push({ row: rowNum, field: 'admissionNo', error: `Duplicate Admission No '${admNo}' in uploaded sheet`, data: rowObj });
            duplicatesFound++;
          } else {
            seenBatchKeys.add(`adm:${admLower}`);
          }

          // Phone validation
          if (rowObj.parentPhone) {
            const digits = rowObj.parentPhone.replace(/\D/g, '');
            if (digits.length < 10) {
              rowObj._hasError = true;
              rowObj._errors.push('Parent Mobile must be at least 10 digits');
              errorsList.push({ row: rowNum, field: 'parentPhone', error: 'Mobile must be at least 10 digits', data: rowObj });
            }
          } else {
            rowObj.parentPhone = '+91 98000 00000';
          }

          // Parent Email validation
          if (rowObj.parentEmail && !rowObj.parentEmail.includes('@')) {
            rowObj.parentEmail = '';
          }
        } else {
          // Staff validation
          if (!rowObj.name) {
            rowObj._hasError = true;
            rowObj._errors.push('Faculty Name is required');
            errorsList.push({ row: rowNum, field: 'name', error: 'Faculty Name is required', data: rowObj });
          }

          const empId = rowObj.employeeId || rowObj.empId || `FAC-2026-${1000 + rIdx}`;
          rowObj.employeeId = empId;
          const empLower = empId.toLowerCase();

          if (!rowObj.email || !rowObj.email.includes('@')) {
            const cleanStaffName = (rowObj.name || 'faculty').toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanEmp = empId.toLowerCase().replace(/[^a-z0-9]/g, '');
            rowObj.email = `${cleanStaffName}.${cleanEmp}@school.edu.in`;
          }

          if (seenBatchKeys.has(`emp:${empLower}`)) {
            rowObj._hasError = true;
            rowObj._errors.push(`Duplicate Employee Code in sheet: ${empId}`);
            errorsList.push({ row: rowNum, field: 'employeeId', error: `Duplicate Employee Code '${empId}' in uploaded sheet`, data: rowObj });
            duplicatesFound++;
          } else {
            seenBatchKeys.add(`emp:${empLower}`);
          }
        }

        rowsFormatted.push(rowObj);
        if (!rowObj._hasError) {
          validList.push(rowObj);
        }
      });

      setParsedRows(rowsFormatted);
      setValidationErrors(errorsList);
      setValidRecords(validList);
      setDuplicateCount(duplicatesFound);

      onShowToast(
        'info',
        'File Analysis Complete 📊',
        `Read ${rowsFormatted.length} rows: ${validList.length} valid, ${errorsList.length} errors found.`
      );
    } catch (err: any) {
      onShowToast('error', 'Parse Failure', err.message || 'Unable to parse spreadsheet file.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      onShowToast('error', 'Unsupported File Type', 'Please upload an Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onShowToast('error', 'File Too Large', 'File exceeds the 10 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (buffer) processFileData(buffer, file.name);
    };
    reader.onerror = () => {
      onShowToast('error', 'Read Error', 'Failed to read the local file.');
    };
    reader.readAsArrayBuffer(file);
  };

  // Download Sample Template (Excel .xlsx)
  const handleDownloadSampleExcel = () => {
    const sampleRows: any[] = [];
    // Provide 2 realistic Indian educational standard sample records
    if (entityType === 'student') {
      sampleRows.push({
        'Admission Number': 'DPS-2026-301',
        'PEN Number': '202606180101',
        'Roll Number': 'DPS-2026-301',
        'Full Name': 'Aarav Patel',
        'Gender': 'Male',
        'Date of Birth': '2011-04-12',
        'Class': 'Class 10',
        'Section': 'A',
        'Father Name': 'Manoj Patel',
        'Mother Name': 'Sunita Patel',
        'Parent Mobile': '+91 98765 43210',
        'Parent Email': 'manoj.patel@gmail.com',
        'Address': 'Sector 45, Gurugram, Haryana',
        'Blood Group': 'B+',
        'Category': 'General',
        'Status': 'active'
      });
      sampleRows.push({
        'Admission Number': 'DPS-2026-302',
        'PEN Number': '202606180102',
        'Roll Number': 'DPS-2026-302',
        'Full Name': 'Ananya Sharma',
        'Gender': 'Female',
        'Date of Birth': '2011-08-22',
        'Class': 'Class 10',
        'Section': 'A',
        'Father Name': 'Rakesh Sharma',
        'Mother Name': 'Pooja Sharma',
        'Parent Mobile': '+91 98111 22334',
        'Parent Email': 'rakesh.sharma@yahoo.com',
        'Address': 'DLF Phase 2, Gurugram',
        'Blood Group': 'O+',
        'Category': 'OBC',
        'Status': 'active'
      });
    } else {
      sampleRows.push({
        'Employee ID': 'DPS-FAC-201',
        'Full Name': 'Dr. Rajiv Malhotra',
        'Email': 'rajiv.malhotra@dpsheritage.edu.in',
        'Mobile': '+91 98765 00111',
        'Role': 'teacher',
        'Department': 'Mathematics',
        'Designation': 'Senior PGT Faculty',
        'Subject Specialization': 'Advanced Mathematics, Calculus',
        'Gender': 'Male',
        'Status': 'active'
      });
      sampleRows.push({
        'Employee ID': 'DPS-FAC-202',
        'Full Name': 'Sunita Chawla',
        'Email': 'sunita.chawla@dpsheritage.edu.in',
        'Mobile': '+91 98765 00222',
        'Role': 'teacher',
        'Department': 'Computer Science',
        'Designation': 'TGT Faculty & ATL Mentor',
        'Subject Specialization': 'Artificial Intelligence, Python',
        'Gender': 'Female',
        'Status': 'active'
      });
    }

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${sampleFileName}.xlsx`);
    onShowToast('success', 'Template Downloaded 📥', `Saved ${sampleFileName}.xlsx to your device.`);
  };

  // Download Error Report (Excel .xlsx)
  const handleDownloadErrorReport = () => {
    if (validationErrors.length === 0) return;

    const errorExportData = validationErrors.map(err => ({
      'Row Number': err.row,
      'Field In Error': err.field,
      'Error Reason': err.error,
      'Provided Value': err.data[err.field] || '(Empty)'
    }));

    const ws = XLSX.utils.json_to_sheet(errorExportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, `${sampleFileName}_Validation_Errors.xlsx`);
    onShowToast('info', 'Error Report Downloaded 📄', 'Review error details in the downloaded Excel sheet.');
  };

  // Commit valid records to backend
  const handleExecuteCommit = async () => {
    if (validRecords.length === 0) {
      onShowToast('error', 'No Valid Records', 'There are no error-free rows available to import.');
      return;
    }

    setIsImporting(true);
    try {
      const res = await onCommitImport(validRecords);
      if (res.success) {
        setImportSummary({
          total: parsedRows.length,
          imported: res.importedCount || validRecords.length,
          failed: validationErrors.length,
          duplicates: duplicateCount
        });
        onShowToast('success', 'Import Completed 🎉', `Successfully enrolled ${res.importedCount || validRecords.length} records!`);
      } else {
        onShowToast('error', 'Import Incomplete', res.message || 'Server encountered an issue.');
      }
    } catch (err: any) {
      onShowToast('error', 'Commit Failed', err.message || 'Could not complete bulk import.');
    } finally {
      setIsImporting(false);
    }
  };

  const filteredDisplayRows = parsedRows.filter(r => {
    if (filterMode === 'valid') return !r._hasError;
    if (filterMode === 'errors') return r._hasError;
    return true;
  });

  return (
    <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-wide">{title}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadSampleExcel}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Sample Excel</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close import"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      {!parsedRows.length && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-cyan-300 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            Drag & drop your Excel (.xlsx, .xls) or CSV file here
          </h3>
          <p className="text-xs text-slate-400 font-mono mb-4">
            Supports up to 10 MB and 5,000 rows per batch with real-time duplicate detection
          </p>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs font-mono shadow-md shadow-cyan-500/20"
          >
            Browse Files from Device
          </button>
        </div>
      )}

      {/* Parsing Spinner */}
      {isParsing && (
        <div className="py-12 text-center text-slate-300 font-mono space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
          <p className="text-xs">Analyzing spreadsheet headers and validating records...</p>
        </div>
      )}

      {/* Preview, Validation Matrix & Summary */}
      {parsedRows.length > 0 && (
        <div className="space-y-5">
          {/* File Meta & KPI Tiles */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs font-bold text-white">{fileName}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Loaded {parsedRows.length} rows across standard institutional schema
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setValidationErrors([]);
                  setValidRecords([]);
                  setFileName('');
                  setImportSummary(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear / Upload Another</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Rows</span>
              <strong className="text-white text-lg mt-0.5 block">{parsedRows.length}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Ready for Import</span>
              <strong className="text-emerald-400 text-lg mt-0.5 block flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{validRecords.length}</span>
              </strong>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30">
              <span className="text-[10px] text-rose-400 uppercase font-bold block">Validation Errors</span>
              <strong className="text-rose-400 text-lg mt-0.5 block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{validationErrors.length}</span>
              </strong>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30">
              <span className="text-[10px] text-amber-400 uppercase font-bold block">Duplicates Flagged</span>
              <strong className="text-amber-400 text-lg mt-0.5 block flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{duplicateCount}</span>
              </strong>
            </div>
          </div>

          {/* Error Banner & Download Error Report Trigger */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{validationErrors.length} row-level issues detected in file</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadErrorReport}
                  className="px-3 py-1 rounded-xl bg-rose-900/60 hover:bg-rose-900 border border-rose-500/50 text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Error Report (.xlsx)</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                You can still proceed with importing the <strong>{validRecords.length} valid records</strong>. Failed rows will be cleanly skipped without interrupting the transaction.
              </p>
            </div>
          )}

          {/* Action Row & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Filter Preview:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterMode === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({parsedRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('valid')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterMode === 'valid' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Valid ({validRecords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('errors')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterMode === 'errors' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Errors ({validationErrors.length})
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExecuteCommit}
              disabled={isImporting || validRecords.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enrolling Records in DB...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit Import ({validRecords.length} Valid Records)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Interactive Preview Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl">
            <div className="max-h-80 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="sticky top-0 bg-slate-900 text-slate-300 border-b border-slate-800 z-10">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-800">Status</th>
                    <th className="py-2.5 px-3 border-r border-slate-800">Row</th>
                    {fields.map(f => (
                      <th key={f.key} className="py-2.5 px-3 border-r border-slate-800 whitespace-nowrap">
                        {f.label} {f.required && <span className="text-rose-400">*</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDisplayRows.slice(0, 100).map((r, i) => (
                    <tr
                      key={i}
                      className={r._hasError ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-slate-900/40'}
                    >
                      <td className="py-2 px-3 border-r border-slate-800 whitespace-nowrap">
                        {r._hasError ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1"
                            title={r._errors.join(', ')}
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Error</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Ready</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-800 text-slate-500">{r._rowNum}</td>
                      {fields.map(f => (
                        <td key={f.key} className="py-2 px-3 border-r border-slate-800 whitespace-nowrap text-slate-300">
                          {r[f.key] || <span className="text-slate-600 italic">None</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredDisplayRows.length > 100 && (
              <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-center text-[11px] font-mono text-slate-400">
                Displaying first 100 rows of {filteredDisplayRows.length} total rows.
              </div>
            )}
          </div>

          {/* Final Import Summary Modal */}
          {importSummary && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/40 space-y-3 font-mono text-xs animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Batch Enrollment Successfully Completed!</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total Ingested</span>
                  <strong className="text-white text-base">{importSummary.total}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block">Enrolled in DB</span>
                  <strong className="text-emerald-400 text-base">{importSummary.imported}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-rose-400 block">Skipped / Errors</span>
                  <strong className="text-rose-400 text-base">{importSummary.failed}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-amber-400 block">Duplicates</span>
                  <strong className="text-amber-400 text-base">{importSummary.duplicates}</strong>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                >
                  Return to Directory
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
