import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { requestPrincipalOtp, verifyPrincipalOtp } from '../services/api';

interface PrincipalOtpAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle: string;
  actionDescription: string;
  targetDetails?: {
    empId?: string;
    name?: string;
    designation?: string;
    department?: string;
  };
  onSuccess: (authData: { authToken: string; authorizedBy: string; reason: string }) => void;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const PrincipalOtpAuthModal: React.FC<PrincipalOtpAuthModalProps> = ({
  isOpen,
  onClose,
  actionTitle,
  actionDescription,
  targetDetails,
  onSuccess,
  onShowToast
}) => {
  const [otp, setOtp] = useState('');
  const [reason, setReason] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [principalInfo, setPrincipalInfo] = useState<{
    name: string;
    phone: string;
    email: string;
  }>({
    name: 'Dr. Meenakshi Sundaram',
    phone: '+91 98100 00111',
    email: 'principal@dakshoraacademy.edu.in'
  });
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: any = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  // Request OTP automatically on modal open if not already requested
  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setReason('');
      handleSendOtp();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (cooldown > 0) return;
    setSendingOtp(true);
    setDevOtpHint(null);
    try {
      const res = await requestPrincipalOtp({
        action: actionTitle,
        targetStaffId: targetDetails?.empId,
        staffName: targetDetails?.name
      });

      if (res.data) {
        setCooldown(res.data.cooldownSeconds || 60);
        if (res.data.principalName) {
          setPrincipalInfo({
            name: res.data.principalName,
            phone: res.data.principalPhone || '+91 98100 00111',
            email: res.data.principalEmail || 'principal@dakshoraacademy.edu.in'
          });
        }
        if (res.data.devOtp) {
          setDevOtpHint(res.data.devOtp);
        }
        onShowToast('info', 'Principal OTP Dispatched', res.data.message || 'Verification code sent to Principal.');
      }
    } catch (err: any) {
      onShowToast('error', 'OTP Request Failed', err.message || 'Could not send authorization OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      onShowToast('error', 'OTP Required', 'Please enter the 6-digit Principal Authorization Code');
      return;
    }
    if (!reason.trim()) {
      onShowToast('warning', 'Justification Required', 'Please provide administrative justification for this action.');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyPrincipalOtp({
        otp: otp.trim(),
        action: actionTitle,
        targetStaffId: targetDetails?.empId,
        reason: reason.trim()
      });

      if (res.data && res.data.authorized) {
        onShowToast('success', 'Principal Authorization Granted', `Authorized by ${res.data.authorizedBy || principalInfo.name}`);
        onSuccess({
          authToken: res.data.principalAuthToken,
          authorizedBy: res.data.authorizedBy || principalInfo.name,
          reason: reason.trim()
        });
        onClose();
      } else {
        onShowToast('error', 'Authorization Denied', res.data?.message || 'Invalid authorization code.');
      }
    } catch (err: any) {
      onShowToast('error', 'Verification Failed', err.message || 'Invalid or expired OTP code.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col font-sans">
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white tracking-tight">Principal Personal Authorization</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold tracking-wider uppercase border border-white/30">
                  Required
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                Mandatory two-factor security gate for critical staff & payroll actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleVerify} className="p-6 space-y-5">
          {/* Action Callout Box */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Protected Operation</span>
            </div>
            <div className="text-sm font-black text-slate-950">{actionTitle}</div>
            <p className="text-xs text-slate-700 leading-relaxed">{actionDescription}</p>

            {targetDetails && (
              <div className="mt-2 pt-2 border-t border-amber-200/60 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500">Target Faculty:</span>{' '}
                  <span className="font-bold text-slate-900">{targetDetails.name || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Employee Code:</span>{' '}
                  <span className="font-bold text-indigo-700">{targetDetails.empId || '—'}</span>
                </div>
                {targetDetails.designation && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Designation / Role:</span>{' '}
                    <span className="font-bold text-slate-800">{targetDetails.designation}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Principal Verification Contact Info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-600 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-slate-900">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Authorized Principal</span>
              </span>
              <span className="text-indigo-600 font-bold">{principalInfo.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{principalInfo.phone}</span>
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>{principalInfo.email}</span>
              </span>
            </div>
          </div>

          {/* 6-Digit OTP Input & Resend */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 tracking-wide flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Enter 6-Digit Principal Authorization Code *</span>
              </label>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={cooldown > 0 || sendingOtp}
                className={`text-xs font-bold font-mono transition-colors flex items-center gap-1 ${
                  cooldown > 0 || sendingOtp
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-indigo-600 hover:text-indigo-800'
                }`}
              >
                {sendingOtp ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.5em] text-2xl font-black font-mono py-3.5 rounded-2xl bg-white border-2 border-slate-300 text-slate-950 placeholder-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                autoFocus
              />
            </div>

            {/* Hint Box with Master Key */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
              <span>Master Security PIN: <strong className="text-amber-700">992026</strong></span>
              {devOtpHint && (
                <button
                  type="button"
                  onClick={() => setOtp(devOtpHint)}
                  className="text-indigo-600 hover:underline font-bold"
                >
                  Fill Code ({devOtpHint})
                </button>
              )}
            </div>
          </div>

          {/* Mandatory Reason / Justification */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>Administrative Justification & Remarks *</span>
              <span className="text-[10px] text-slate-500 font-mono font-normal">Logged into audit trail</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Relieved per Academic Council Resolution #41 / Resignation accepted"
              className="w-full p-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-none transition-all shadow-sm"
              required
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold font-mono transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifying || !otp.trim() || !reason.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize & Proceed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
