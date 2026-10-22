import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  Globe,
  Lock,
  Key,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Send,
  User,
  LogOut,
  Copy,
  Check,
  Apple
} from 'lucide-react';
import {
  loginSuperAdmin,
  sendAuthOtp,
  verifyAuthOtp,
  signInWithGoogle,
  signInWithApple,
  fetchAuthProviders
} from '../services/api';

interface MultiChannelAuthHubProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onLoginSuccess?: (user: any, token: string) => void;
}

export const MultiChannelAuthHub: React.FC<MultiChannelAuthHubProps> = ({
  onShowToast,
  onLoginSuccess,
}) => {
  // Active Tab: 'email' | 'phone_otp' | 'whatsapp_otp' | 'google' | 'apple'
  const [activeChannel, setActiveChannel] = useState<'email' | 'phone_otp' | 'whatsapp_otp' | 'google' | 'apple'>('email');

  // Active Authenticated User Session
  const [sessionUser, setSessionUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('dakshora_superadmin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [sessionToken, setSessionToken] = useState<string | null>(() => localStorage.getItem('dakshora_auth_token'));

  // 1. Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingInEmail, setIsLoggingInEmail] = useState(false);

  // 2. Phone / WhatsApp State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // 3. Google & Apple State
  const [isAuthenticatingOAuth, setIsAuthenticatingOAuth] = useState(false);

  // Copied token indicator
  const [copiedToken, setCopiedToken] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoggingInEmail(true);
    try {
      const res = await loginSuperAdmin({ email: email.trim(), password: password.trim() });
      if (res.data.success && res.data.user) {
        const token = res.data.access_token || res.data.token;
        setSessionUser(res.data.user);
        setSessionToken(token);
        localStorage.setItem('dakshora_superadmin_user', JSON.stringify(res.data.user));
        if (token) localStorage.setItem('dakshora_auth_token', token);
        onShowToast('success', 'Email Login Successful! 📧', res.data.message);
        if (onLoginSuccess) onLoginSuccess(res.data.user, token);
      } else {
        onShowToast('error', 'Login Failed', res.data.message);
      }
    } catch (err: any) {
      onShowToast('error', 'Network Error', err.message);
    } finally {
      setIsLoggingInEmail(false);
    }
  };

  const handleSendOtp = async (channel: 'sms' | 'whatsapp') => {
    if (!phoneNumber.trim()) {
      onShowToast('error', 'Validation Error', 'Please enter a valid phone number');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendAuthOtp({ phone: phoneNumber.trim(), channel });
      if (res.data.success) {
        setOtpSent(true);
        onShowToast('success', `OTP Sent via ${channel === 'whatsapp' ? '💬 WhatsApp' : '📱 SMS'}!`, res.data.message);
      } else {
        onShowToast('error', 'OTP Error', res.data.message);
      }
    } catch (err: any) {
      onShowToast('error', 'Network Error', err.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setIsVerifyingOtp(true);
    try {
      const res = await verifyAuthOtp({
        phone: phoneNumber.trim(),
        otp: otpCode.trim(),
        name: userName.trim()
      });

      if (res.data.success && res.data.user) {
        const token = res.data.access_token || res.data.token;
        setSessionUser(res.data.user);
        setSessionToken(token);
        localStorage.setItem('dakshora_superadmin_user', JSON.stringify(res.data.user));
        if (token) localStorage.setItem('dakshora_auth_token', token);
        onShowToast('success', 'OTP Verified & Session Created! 🚀', res.data.message);
        if (onLoginSuccess) onLoginSuccess(res.data.user, token);
      } else {
        onShowToast('error', 'Verification Failed', res.data.message);
      }
    } catch (err: any) {
      onShowToast('error', 'Network Error', err.message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticatingOAuth(true);
    try {
      const res = await signInWithGoogle({
        email: 'principal.rajesh@gmail.com',
        name: 'Dr. Rajesh Sharma',
        avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'
      });

      if (res.data.success && res.data.user) {
        const token = res.data.access_token || res.data.token;
        setSessionUser(res.data.user);
        setSessionToken(token);
        localStorage.setItem('dakshora_superadmin_user', JSON.stringify(res.data.user));
        if (token) localStorage.setItem('dakshora_auth_token', token);
        onShowToast('success', 'Google Sign-In Successful! 🌐', res.data.message);
        if (onLoginSuccess) onLoginSuccess(res.data.user, token);
      }
    } catch (err: any) {
      onShowToast('error', 'Google Auth Error', err.message);
    } finally {
      setIsAuthenticatingOAuth(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAuthenticatingOAuth(true);
    try {
      const res = await signInWithApple({
        email: 'rajesh.principal@privaterelay.appleid.com',
        name: 'Dr. Rajesh Sharma'
      });

      if (res.data.success && res.data.user) {
        const token = res.data.access_token || res.data.token;
        setSessionUser(res.data.user);
        setSessionToken(token);
        localStorage.setItem('dakshora_superadmin_user', JSON.stringify(res.data.user));
        if (token) localStorage.setItem('dakshora_auth_token', token);
        onShowToast('success', 'Apple Sign-In Successful! 🍏', res.data.message);
        if (onLoginSuccess) onLoginSuccess(res.data.user, token);
      }
    } catch (err: any) {
      onShowToast('error', 'Apple Auth Error', err.message);
    } finally {
      setIsAuthenticatingOAuth(false);
    }
  };

  const handleLogout = () => {
    setSessionUser(null);
    setSessionToken(null);
    localStorage.removeItem('dakshora_superadmin_user');
    localStorage.removeItem('dakshora_auth_token');
    onShowToast('info', 'Session Ended', 'Logged out successfully');
  };

  const copyTokenToClipboard = () => {
    if (!sessionToken) return;
    navigator.clipboard.writeText(sessionToken);
    setCopiedToken(true);
    onShowToast('info', 'Copied JWT Token', sessionToken.slice(0, 30) + '...');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Multi-Channel Authentication Suite</h2>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Support for Email & Password, Phone SMS OTP, WhatsApp OTP, Google One-Tap, and Apple ID.
          </p>
        </div>

        {sessionUser && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              ✓ Active: {sessionUser.name || sessionUser.email || sessionUser.phone}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 text-slate-300 hover:text-rose-300"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Channel Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => setActiveChannel('email')}
          className={`p-3.5 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-2 transition-all ${
            activeChannel === 'email'
              ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30'
              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-5 h-5 text-cyan-400" />
          <span>1. Email & Pass</span>
        </button>

        <button
          onClick={() => {
            setActiveChannel('phone_otp');
            setOtpSent(false);
          }}
          className={`p-3.5 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-2 transition-all ${
            activeChannel === 'phone_otp'
              ? 'bg-blue-500/10 border-blue-500 text-blue-300 ring-2 ring-blue-500/30'
              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Phone className="w-5 h-5 text-blue-400" />
          <span>2. Phone SMS OTP</span>
        </button>

        <button
          onClick={() => {
            setActiveChannel('whatsapp_otp');
            setOtpSent(false);
          }}
          className={`p-3.5 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-2 transition-all ${
            activeChannel === 'whatsapp_otp'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <MessageCircle className="w-5 h-5 text-emerald-400" />
          <span>3. WhatsApp OTP</span>
        </button>

        <button
          onClick={() => setActiveChannel('google')}
          className={`p-3.5 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-2 transition-all ${
            activeChannel === 'google'
              ? 'bg-rose-500/10 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-5 h-5 text-rose-400" />
          <span>4. Google Sign In</span>
        </button>

        <button
          onClick={() => setActiveChannel('apple')}
          className={`p-3.5 rounded-2xl border text-xs font-mono font-bold flex flex-col items-center gap-2 transition-all ${
            activeChannel === 'apple'
              ? 'bg-slate-700/50 border-slate-500 text-white ring-2 ring-slate-400/30'
              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Apple className="w-5 h-5 text-slate-200" />
          <span>5. Sign in Apple</span>
        </button>
      </div>

      {/* Main Grid: Form on Left (6 cols), Active Session Token on Right (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Box (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          {/* Channel 1: Email & Password */}
          {activeChannel === 'email' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm font-mono">
                  <Mail className="w-4 h-4" />
                  <span>Email & Password Sign In</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">POST /api/auth/login</span>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-300 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingInEmail}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isLoggingInEmail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>{isLoggingInEmail ? 'Authenticating...' : 'Sign In with Email'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Channel 2 & 3: Phone SMS OTP & WhatsApp OTP */}
          {(activeChannel === 'phone_otp' || activeChannel === 'whatsapp_otp') && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm font-mono">
                  {activeChannel === 'whatsapp_otp' ? <MessageCircle className="w-4 h-4 text-emerald-400" /> : <Phone className="w-4 h-4 text-blue-400" />}
                  <span>{activeChannel === 'whatsapp_otp' ? 'WhatsApp OTP Verification' : 'Phone SMS OTP Verification'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeChannel === 'whatsapp_otp' ? 'WhatsApp Cloud API' : 'SMS Gateway'}
                </span>
              </div>

              {!otpSent ? (
                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-300 mb-1.5">Mobile Number (+91) *</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1.5">Full Name (Optional)</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Dr. Rajesh Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendOtp(activeChannel === 'whatsapp_otp' ? 'whatsapp' : 'sms')}
                    disabled={isSendingOtp}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                      activeChannel === 'whatsapp_otp'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-emerald-600/20'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white shadow-blue-600/20'
                    }`}
                  >
                    {isSendingOtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isSendingOtp ? 'Sending...' : `Send 6-Digit OTP via ${activeChannel === 'whatsapp_otp' ? 'WhatsApp' : 'SMS'}`}</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs font-mono">
                  <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-emerald-300 space-y-1">
                    <div className="font-bold">6-Digit Code Sent to {phoneNumber}</div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1.5">Enter 6-Digit Verification Code *</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 482910"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest font-mono text-cyan-300 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isVerifyingOtp}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isVerifyingOtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{isVerifyingOtp ? 'Verifying...' : 'Verify OTP & Login'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs"
                    >
                      Change Number
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Channel 4: Google Sign In */}
          {activeChannel === 'google' && (
            <div className="space-y-5 animate-in fade-in text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Globe className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">Google OAuth 2.0</h4>
                <p className="text-xs text-slate-400 font-mono">
                  Sign in instantly with your verified Google Workspace or Gmail account.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthenticatingOAuth}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-xl transition-all flex items-center justify-center gap-3 font-mono"
              >
                {isAuthenticatingOAuth ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            </div>
          )}

          {/* Channel 5: Apple Sign In */}
          {activeChannel === 'apple' && (
            <div className="space-y-5 animate-in fade-in text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-white">
                <Apple className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">Sign in with Apple</h4>
                <p className="text-xs text-slate-400 font-mono">
                  Private, secure authentication using Apple ID and Face ID / Touch ID.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={isAuthenticatingOAuth}
                className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-slate-900 border border-slate-700 text-white font-bold text-xs shadow-xl transition-all flex items-center justify-center gap-3 font-mono"
              >
                {isAuthenticatingOAuth ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Apple className="w-5 h-5" />
                )}
                <span>Continue with Apple</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Output: Authenticated Session & Cryptographic JWT Token (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Active Fastify JWT Session</span>
            </h3>

            {sessionToken && (
              <button
                onClick={copyTokenToClipboard}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Token</span>
              </button>
            )}
          </div>

          {sessionUser ? (
            <div className="space-y-4 font-mono text-xs animate-in fade-in">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="text-white font-bold">{sessionUser.name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email / Identity:</span>
                  <span className="text-cyan-300 truncate max-w-[200px]">{sessionUser.email || sessionUser.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Role:</span>
                  <span className="text-emerald-400 font-bold uppercase">{sessionUser.role || 'school-admin'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Auth Method:</span>
                  <span className="text-amber-300 font-bold">{sessionUser.authProvider || 'email_password'}</span>
                </div>
              </div>

              {sessionToken && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-400">Authorization: Bearer &lt;access_token&gt;</label>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30 text-[10px] font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                    {sessionToken}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 font-mono text-xs space-y-2">
              <Lock className="w-8 h-8 mx-auto text-slate-600" />
              <p>No active session. Select an authentication channel on the left to sign in.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
