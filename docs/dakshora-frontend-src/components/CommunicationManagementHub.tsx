import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  Eye,
  Archive,
  RefreshCw,
  FileText,
  Users,
  CheckCheck,
  Settings,
  Layers,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Smartphone,
  MessageCircle,
  Building2,
  Check,
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import {
  ErpNotice,
  ErpMessageTemplate,
  ErpCommunicationMessage,
  ErpMessageDelivery,
  ErpInAppNotification,
  ErpCommunicationSettings,
  ErpCommunicationPreferences,
  ErpAudiencePreviewResult,
  ErpCommunicationOverview,
  ErpRole
} from '../types';
import {
  fetchErpCommunicationOverview,
  fetchErpNotices,
  createErpNotice,
  publishErpNotice,
  archiveErpNotice,
  previewErpAudience,
  fetchErpMessages,
  sendErpMessage,
  cancelErpScheduledMessage,
  sendErpScheduledMessageImmediately,
  fetchErpTemplates,
  createErpTemplate,
  previewErpTemplate,
  fetchErpDeliveryLogs,
  fetchErpNotifications,
  markErpNotificationRead,
  markAllErpNotificationsRead,
  fetchErpCommunicationSettings,
  updateErpCommunicationSettings,
  fetchErpCommunicationPreferences,
  updateErpCommunicationPreferences
} from '../services/api';

interface CommunicationManagementHubProps {
  activeRole: ErpRole;
  activeSession: string;
  organizationId?: string;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onNavigateToModule?: (module: string) => void;
}

type TabType =
  | 'dashboard'
  | 'notices'
  | 'messages'
  | 'templates'
  | 'scheduled'
  | 'deliveries'
  | 'notifications'
  | 'preferences';

export const CommunicationManagementHub: React.FC<CommunicationManagementHubProps> = ({
  activeRole,
  activeSession,
  organizationId = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e',
  onShowToast,
  onNavigateToModule
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(false);

  // Overview State
  const [overview, setOverview] = useState<ErpCommunicationOverview | null>(null);

  // Notices State
  const [notices, setNotices] = useState<ErpNotice[]>([]);
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('all');
  const [noticePriority, setNoticePriority] = useState('all');
  const [noticeStatus, setNoticeStatus] = useState('all');
  const [selectedNoticeForView, setSelectedNoticeForView] = useState<ErpNotice | null>(null);
  const [showCreateNoticeModal, setShowCreateNoticeModal] = useState(false);
  const [newNoticeForm, setNewNoticeForm] = useState({
    title: '',
    content: '',
    body: '',
    category: 'announcement',
    priority: 'normal',
    targetAudience: 'all',
    audienceType: 'entire_school',
    gradeFilter: 'Class 10',
    sectionFilter: 'A',
    isUrgent: false,
    publishAt: '',
    smsBroadcast: true
  });

  // Messages State
  const [messages, setMessages] = useState<ErpCommunicationMessage[]>([]);
  const [messageSearch, setMessageSearch] = useState('');
  const [messageChannelFilter, setMessageChannelFilter] = useState('all');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeForm, setComposeForm] = useState({
    title: '',
    channel: 'in_app',
    audienceType: 'entire_school',
    gradeFilter: 'Class 10',
    sectionFilter: 'A',
    templateCode: '',
    subject: '',
    body: '',
    priority: 'normal',
    scheduledAt: ''
  });
  const [audiencePreview, setAudiencePreview] = useState<ErpAudiencePreviewResult | null>(null);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);

  // Templates State
  const [templates, setTemplates] = useState<ErpMessageTemplate[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<{
    template: ErpMessageTemplate;
    renderedSubject: string;
    renderedBody: string;
    sampleVariables: any;
  } | null>(null);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    code: '',
    name: '',
    category: 'general',
    channel: 'all',
    subject: '',
    body: '',
    variablesString: 'student_name, parent_name, school_name'
  });

  // Delivery Logs State
  const [deliveries, setDeliveries] = useState<ErpMessageDelivery[]>([]);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all');
  const [deliveryChannelFilter, setDeliveryChannelFilter] = useState('all');
  const [deliverySearch, setDeliverySearch] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState<ErpInAppNotification[]>([]);
  const [notifStatusFilter, setNotifStatusFilter] = useState('all');
  const [notifTypeFilter, setNotifTypeFilter] = useState('all');

  // Settings & Preferences State
  const [commSettings, setCommSettings] = useState<ErpCommunicationSettings | null>(null);
  const [userPreferences, setUserPreferences] = useState<ErpCommunicationPreferences | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load Overview Data
  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await fetchErpCommunicationOverview();
      if (res.data?.overview) {
        setOverview(res.data.overview);
      }
    } catch {
      onShowToast('error', 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  // Load Notices
  const loadNotices = async () => {
    try {
      const res = await fetchErpNotices({
        category: noticeCategory !== 'all' ? noticeCategory : undefined,
        priority: noticePriority !== 'all' ? noticePriority : undefined,
        status: noticeStatus !== 'all' ? noticeStatus : undefined,
        search: noticeSearch || undefined
      });
      if (res.data?.notices) {
        setNotices(res.data.notices);
      }
    } catch {
      // silent
    }
  };

  // Load Messages
  const loadMessages = async () => {
    try {
      const res = await fetchErpMessages({
        channel: messageChannelFilter !== 'all' ? messageChannelFilter : undefined,
        search: messageSearch || undefined
      });
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch {}
  };

  // Load Templates
  const loadTemplates = async () => {
    try {
      const res = await fetchErpTemplates({
        category: templateCategory !== 'all' ? templateCategory : undefined,
        search: templateSearch || undefined
      });
      if (res.data?.templates) {
        setTemplates(res.data.templates as any);
      }
    } catch {}
  };

  // Load Delivery Logs
  const loadDeliveries = async () => {
    try {
      const res = await fetchErpDeliveryLogs({
        status: deliveryStatusFilter !== 'all' ? deliveryStatusFilter : undefined,
        channel: deliveryChannelFilter !== 'all' ? deliveryChannelFilter : undefined,
        search: deliverySearch || undefined
      });
      if (res.data?.deliveries) {
        setDeliveries(res.data.deliveries);
      }
    } catch {}
  };

  // Load Notifications
  const loadNotifications = async () => {
    try {
      const res = await fetchErpNotifications({
        status: notifStatusFilter !== 'all' ? notifStatusFilter : undefined,
        type: notifTypeFilter !== 'all' ? notifTypeFilter : undefined,
        role: activeRole === 'admin' ? undefined : activeRole
      });
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch {}
  };

  // Load Settings & Preferences
  const loadSettingsAndPreferences = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        fetchErpCommunicationSettings(),
        fetchErpCommunicationPreferences()
      ]);
      if (sRes.data?.settings) setCommSettings(sRes.data.settings);
      if (pRes.data?.preferences) setUserPreferences(pRes.data.preferences);
    } catch {}
  };

  // Initial load
  useEffect(() => {
    loadOverview();
    loadNotices();
    loadMessages();
    loadTemplates();
    loadDeliveries();
    loadNotifications();
    loadSettingsAndPreferences();
  }, [activeSession, activeRole]);

  // Tab switch refresher
  useEffect(() => {
    if (activeTab === 'dashboard') loadOverview();
    if (activeTab === 'notices') loadNotices();
    if (activeTab === 'messages' || activeTab === 'scheduled') loadMessages();
    if (activeTab === 'templates') loadTemplates();
    if (activeTab === 'deliveries') loadDeliveries();
    if (activeTab === 'notifications') loadNotifications();
    if (activeTab === 'preferences') loadSettingsAndPreferences();
  }, [activeTab]);

  // Refresh audience preview when composer form audience changes
  useEffect(() => {
    if (showComposeModal) {
      handleCalculateAudiencePreview();
    }
  }, [composeForm.audienceType, composeForm.gradeFilter, composeForm.sectionFilter, showComposeModal]);

  const handleCalculateAudiencePreview = async () => {
    try {
      setLoadingAudience(true);
      const filter: any = {};
      if (['class', 'section', 'class_parents'].includes(composeForm.audienceType)) {
        filter.grade = composeForm.gradeFilter;
        filter.section = composeForm.sectionFilter;
      }
      const res = await previewErpAudience({
        audienceType: composeForm.audienceType,
        audienceFilter: filter
      });
      if (res.data) {
        setAudiencePreview((res.data as any).data || (res.data as any));
      }
    } catch {}
    finally {
      setLoadingAudience(false);
    }
  };

  // Notice Actions
  const handleCreateNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeForm.title.trim()) {
      onShowToast('warning', 'Notice title required');
      return;
    }

    try {
      const filter: any = {};
      if (newNoticeForm.audienceType === 'class' || newNoticeForm.audienceType === 'section') {
        filter.grade = newNoticeForm.gradeFilter;
        filter.section = newNoticeForm.sectionFilter;
      }

      const res = await createErpNotice({
        title: newNoticeForm.title,
        content: newNoticeForm.content || newNoticeForm.title,
        body: newNoticeForm.body || newNoticeForm.content || newNoticeForm.title,
        category: newNoticeForm.category,
        priority: newNoticeForm.priority,
        targetAudience: newNoticeForm.targetAudience,
        audienceType: newNoticeForm.audienceType,
        audienceFilter: filter,
        publishAt: newNoticeForm.publishAt || undefined,
        isUrgent: newNoticeForm.isUrgent
      });

      if (res.data?.notice) {
        onShowToast('success', 'Circular Broadcasted! 📢', res.data.message);
        setShowCreateNoticeModal(false);
        setNewNoticeForm({
          title: '',
          content: '',
          body: '',
          category: 'announcement',
          priority: 'normal',
          targetAudience: 'all',
          audienceType: 'entire_school',
          gradeFilter: 'Class 10',
          sectionFilter: 'A',
          isUrgent: false,
          publishAt: '',
          smsBroadcast: true
        });
        loadNotices();
        loadOverview();
      }
    } catch {
      onShowToast('error', 'Failed to create notice');
    }
  };

  const handlePublishNotice = async (noticeId: string) => {
    try {
      const res = await publishErpNotice(noticeId);
      if (res.data?.notice) {
        onShowToast('success', 'Circular Published! 🔔', 'In-App notification pushed to campus');
        loadNotices();
        loadOverview();
      }
    } catch {
      onShowToast('error', 'Failed to publish notice');
    }
  };

  const handleArchiveNotice = async (noticeId: string) => {
    try {
      const res = await archiveErpNotice(noticeId);
      if (res.data?.notice) {
        onShowToast('info', 'Circular Archived', 'Notice moved to archive status');
        loadNotices();
        loadOverview();
      }
    } catch {
      onShowToast('error', 'Failed to archive notice');
    }
  };

  // Message Actions
  const handleSelectTemplateInComposer = (tplCode: string) => {
    const tpl = templates.find((t) => t.code === tplCode);
    if (tpl) {
      setComposeForm((prev) => ({
        ...prev,
        templateCode: tpl.code,
        subject: tpl.subject,
        body: tpl.body,
        channel: tpl.channel === 'all' ? prev.channel : (tpl.channel as any)
      }));
      onShowToast('info', `Template Loaded: ${tpl.name}`, 'Variables ready for auto-resolution');
    }
  };

  const handleSendMessageSubmit = async () => {
    if (!composeForm.body.trim()) {
      onShowToast('warning', 'Message body is required');
      return;
    }

    try {
      const filter: any = {};
      if (['class', 'section', 'class_parents'].includes(composeForm.audienceType)) {
        filter.grade = composeForm.gradeFilter;
        filter.section = composeForm.sectionFilter;
      }

      const res = await sendErpMessage({
        title: composeForm.title || composeForm.subject || 'School Broadcast',
        channel: composeForm.channel as any,
        audienceType: composeForm.audienceType as any,
        audienceFilter: filter,
        templateCode: composeForm.templateCode || undefined,
        subject: composeForm.subject || composeForm.title,
        body: composeForm.body,
        priority: composeForm.priority as any,
        scheduledAt: composeForm.scheduledAt || undefined
      });

      if (res.data?.success) {
        onShowToast(
          'success',
          composeForm.scheduledAt ? 'Message Scheduled! ⏱️' : 'Dispatched Successfully! 🚀',
          res.data.message
        );
        setShowSendConfirmation(false);
        setShowComposeModal(false);
        setComposeForm({
          title: '',
          channel: 'in_app',
          audienceType: 'entire_school',
          gradeFilter: 'Class 10',
          sectionFilter: 'A',
          templateCode: '',
          subject: '',
          body: '',
          priority: 'normal',
          scheduledAt: ''
        });
        loadMessages();
        loadOverview();
        loadDeliveries();
      }
    } catch {
      onShowToast('error', 'Failed to send message');
    }
  };

  const handleCancelScheduled = async (msgId: string) => {
    try {
      const res = await cancelErpScheduledMessage(msgId);
      if (res.data?.success) {
        onShowToast('info', 'Scheduled Message Cancelled');
        loadMessages();
        loadOverview();
      }
    } catch {
      onShowToast('error', 'Failed to cancel scheduled message');
    }
  };

  const handleSendNow = async (msgId: string) => {
    try {
      const res = await sendErpScheduledMessageImmediately(msgId);
      if (res.data?.success) {
        onShowToast('success', 'Message Dispatched Immediately! 🚀');
        loadMessages();
        loadOverview();
        loadDeliveries();
      }
    } catch {
      onShowToast('error', 'Failed to send message');
    }
  };

  // Template Actions
  const handlePreviewTemplate = async (templateId: string) => {
    try {
      const res = await previewErpTemplate(templateId);
      if (res.data) {
        setSelectedTemplateForPreview((res.data as any).data || (res.data as any));
      }
    } catch {
      onShowToast('error', 'Failed to preview template');
    }
  };

  const handleCreateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateForm.code.trim() || !newTemplateForm.name.trim() || !newTemplateForm.body.trim()) {
      onShowToast('warning', 'Please fill required fields (Code, Name, Body)');
      return;
    }

    try {
      const vars = newTemplateForm.variablesString.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await createErpTemplate({
        code: newTemplateForm.code.toUpperCase().trim(),
        name: newTemplateForm.name.trim(),
        category: newTemplateForm.category,
        channel: newTemplateForm.channel as any,
        subject: newTemplateForm.subject || newTemplateForm.name,
        body: newTemplateForm.body.trim(),
        variables: vars
      });

      if (res.data?.template) {
        onShowToast('success', 'Template Created! ✨', `Template ${res.data.template.code} added`);
        setShowCreateTemplateModal(false);
        setNewTemplateForm({
          code: '',
          name: '',
          category: 'general',
          channel: 'all',
          subject: '',
          body: '',
          variablesString: 'student_name, parent_name, school_name'
        });
        loadTemplates();
      }
    } catch (err: any) {
      onShowToast('error', err?.message || 'Failed to create template');
    }
  };

  // Notification Actions
  const handleMarkRead = async (notifId: string) => {
    try {
      const res = await markErpNotificationRead(notifId);
      if (res.data?.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, readAt: new Date().toISOString() } : n))
        );
        if (overview) {
          setOverview({
            ...overview,
            unreadNotifications: Math.max(0, overview.unreadNotifications - 1)
          });
        }
      }
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllErpNotificationsRead();
      if (res.data?.success) {
        onShowToast('success', 'All Notifications Marked as Read');
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
        );
        if (overview) {
          setOverview({ ...overview, unreadNotifications: 0 });
        }
      }
    } catch {}
  };

  // Settings Actions
  const handleSaveSettings = async () => {
    if (!commSettings) return;
    try {
      setSavingSettings(true);
      const res = await updateErpCommunicationSettings(commSettings);
      if (res.data?.settings) {
        onShowToast('success', 'Automation Rules Saved! ⚙️', 'School communication policies updated');
      }
    } catch {
      onShowToast('error', 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 👑 HEADER / COMMAND BAR */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-500 to-cyan-500 p-[1px] shadow-lg shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-[#0B0F19] rounded-[15px] flex items-center justify-center">
              <Bell className="w-7 h-7 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-white tracking-wide">
                Communication & Notification Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono uppercase tracking-wider">
                Central Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Multi-channel circulars, real delivery tracking, automated ERP alerts, and in-app notifications
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {['admin', 'teacher'].includes(activeRole) && (
            <>
              <button
                onClick={() => setShowCreateNoticeModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Circular</span>
              </button>
              <button
                onClick={() => setShowComposeModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compose Message</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              loadOverview();
              onShowToast('info', 'Refreshing Communication Feeds', 'Latest delivery ledger synced');
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
            title="Refresh Feeds"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📑 SUB-NAVIGATION (8 SECTIONS) */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800/80 overflow-x-auto scrollbar-thin flex items-center gap-1.5">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Layers },
          { id: 'notices', label: 'Notices & Circulars', icon: Bell, count: notices.length },
          { id: 'messages', label: 'Messages & Broadcast', icon: Send, count: messages.length },
          { id: 'templates', label: 'Templates', icon: FileText, count: templates.length },
          { id: 'scheduled', label: 'Scheduled', icon: Clock, count: messages.filter((m) => m.status === 'scheduled').length },
          { id: 'deliveries', label: 'Delivery Logs', icon: CheckCircle2, count: deliveries.length },
          { id: 'notifications', label: 'Notifications', icon: Sparkles, count: overview?.unreadNotifications },
          { id: 'preferences', label: 'Automation & Preferences', icon: Settings }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-indigo-600/30 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-amber-400/30 text-amber-200' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 📊 TAB 1: DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && overview && (
        <div className="space-y-6">
          {/* 7 Primary Real KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              {
                label: 'Total Messages',
                value: overview.totalMessages,
                icon: MessageSquare,
                color: 'from-blue-500/20 to-indigo-500/10',
                text: 'text-blue-400',
                border: 'border-blue-500/30'
              },
              {
                label: 'Dispatched (Sent)',
                value: overview.sent,
                icon: Send,
                color: 'from-cyan-500/20 to-teal-500/10',
                text: 'text-cyan-400',
                border: 'border-cyan-500/30'
              },
              {
                label: 'Delivered',
                value: overview.delivered,
                icon: CheckCheck,
                color: 'from-emerald-500/20 to-green-500/10',
                text: 'text-emerald-400',
                border: 'border-emerald-500/30'
              },
              {
                label: 'Delivery Failures',
                value: overview.failed,
                icon: AlertCircle,
                color: 'from-rose-500/20 to-red-500/10',
                text: 'text-rose-400',
                border: 'border-rose-500/30'
              },
              {
                label: 'Scheduled Queue',
                value: overview.scheduled,
                icon: Clock,
                color: 'from-amber-500/20 to-orange-500/10',
                text: 'text-amber-400',
                border: 'border-amber-500/30'
              },
              {
                label: 'Unread Alerts',
                value: overview.unreadNotifications,
                icon: Bell,
                color: 'from-purple-500/20 to-pink-500/10',
                text: 'text-purple-400',
                border: 'border-purple-500/30'
              },
              {
                label: 'Active Notices',
                value: overview.activeNotices,
                icon: FileText,
                color: 'from-indigo-500/20 to-violet-500/10',
                text: 'text-indigo-400',
                border: 'border-indigo-500/30'
              }
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${kpi.color} border ${kpi.border} space-y-2 backdrop-blur-md`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      {kpi.label}
                    </span>
                    <Icon className={`w-4 h-4 ${kpi.text}`} />
                  </div>
                  <div className={`text-2xl font-black ${kpi.text} font-mono`}>{kpi.value}</div>
                </div>
              );
            })}
          </div>

          {/* Delivery Efficiency & Channel Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Delivery Success Rate */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Delivery Success Rate</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {overview.deliveryRatePercent}% Success
                </span>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, overview.deliveryRatePercent))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Delivered: {overview.delivered}</span>
                  <span>Failed: {overview.failed}</span>
                  <span>Total Dispatches: {overview.totalDeliveries}</span>
                </div>
              </div>
            </div>

            {/* Channel Distribution */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3 lg:col-span-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Multi-Channel Dispatch Volumes</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'In-App Notifications', count: overview.channelBreakdown.in_app, icon: Bell, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
                  { name: 'SMS Broadcasts', count: overview.channelBreakdown.sms, icon: Smartphone, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
                  { name: 'Official Emails', count: overview.channelBreakdown.email, icon: Mail, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
                  { name: 'WhatsApp Cloud', count: overview.channelBreakdown.whatsapp, icon: MessageCircle, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
                ].map((ch, idx) => {
                  const Icon = ch.icon;
                  return (
                    <div key={idx} className={`p-3 rounded-xl border ${ch.color} space-y-1`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-bold">{ch.name}</span>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-mono font-black text-white">{ch.count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Notices & Live Notifications Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Notices */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Recent School Notices</span>
                </h3>
                <button
                  onClick={() => setActiveTab('notices')}
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>View All ({notices.length})</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {overview.recentNotices.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono py-6 text-center">No notices published yet</div>
                ) : (
                  overview.recentNotices.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNoticeForView(n)}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-bold text-white truncate">{n.title}</div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            n.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {n.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{n.content}</p>
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-3 pt-0.5">
                        <span>{n.postedBy}</span>
                        <span>•</span>
                        <span>{new Date(n.publishAt || n.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live In-App Notifications Feed */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Real In-App Notifications Feed</span>
                </h3>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="text-xs font-mono text-purple-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Center</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {overview.recentNotifications.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono py-6 text-center">No notifications</div>
                ) : (
                  overview.recentNotifications.map((nt) => (
                    <div
                      key={nt.id}
                      className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        !nt.readAt
                          ? 'bg-purple-950/20 border-purple-500/30'
                          : 'bg-slate-900/40 border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{nt.title}</span>
                          {!nt.readAt && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{nt.message}</p>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(nt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {!nt.readAt && (
                        <button
                          onClick={() => handleMarkRead(nt.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[10px] font-mono shrink-0"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📢 TAB 2: NOTICES & CIRCULARS */}
      {/* ========================================================================= */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search notices by keyword..."
                  value={noticeSearch}
                  onChange={(e) => setNoticeSearch(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && loadNotices()}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <select
                value={noticeCategory}
                onChange={(e) => {
                  setNoticeCategory(e.target.value);
                  setTimeout(loadNotices, 50);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="exam">Exams & Datesheets</option>
                <option value="academic">Academic Circulars</option>
                <option value="fee">Fee Notices</option>
                <option value="transport">Transport Updates</option>
                <option value="circular">Circulars</option>
                <option value="announcement">Announcements</option>
                <option value="holiday">Holiday Notices</option>
              </select>

              <select
                value={noticePriority}
                onChange={(e) => {
                  setNoticePriority(e.target.value);
                  setTimeout(loadNotices, 50);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
              </select>

              <select
                value={noticeStatus}
                onChange={(e) => {
                  setNoticeStatus(e.target.value);
                  setTimeout(loadNotices, 50);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {['admin', 'teacher'].includes(activeRole) && (
              <button
                onClick={() => setShowCreateNoticeModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish Circular</span>
              </button>
            )}
          </div>

          {/* Notices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notices.map((n) => (
              <div
                key={n.id}
                className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                        n.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : n.status === 'scheduled'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : n.status === 'archived'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      {n.status}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        n.priority === 'urgent'
                          ? 'text-rose-400 bg-rose-500/10'
                          : n.priority === 'high'
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-slate-400 bg-slate-900'
                      }`}
                    >
                      {n.priority}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-2">{n.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{n.content}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <div className="truncate max-w-[150px]">{n.postedBy}</div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedNoticeForView(n)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 transition-all"
                      title="Preview Notice"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {['admin', 'teacher'].includes(activeRole) && n.status === 'draft' && (
                      <button
                        onClick={() => handlePublishNotice(n.id)}
                        className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/30"
                      >
                        Publish
                      </button>
                    )}
                    {['admin'].includes(activeRole) && n.status === 'published' && (
                      <button
                        onClick={() => handleArchiveNotice(n.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Archive Notice"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 TAB 3: MESSAGES & BROADCAST (COMPOSER & SENT) */}
      {/* ========================================================================= */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search dispatched campaigns..."
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && loadMessages()}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <select
                value={messageChannelFilter}
                onChange={(e) => {
                  setMessageChannelFilter(e.target.value);
                  setTimeout(loadMessages, 50);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none"
              >
                <option value="all">All Channels</option>
                <option value="in_app">In-App</option>
                <option value="sms">SMS Gateway</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            {['admin', 'teacher'].includes(activeRole) && (
              <button
                onClick={() => setShowComposeModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compose Campaign</span>
              </button>
            )}
          </div>

          {/* Messages Table */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
                    <th className="p-3.5">Campaign & Subject</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Audience Target</th>
                    <th className="p-3.5">Recipients</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Sender</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {messages.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 font-bold text-white max-w-[220px] truncate">
                        <div>{m.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">{m.subject}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase">
                          {m.channel}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{m.audienceType.replace('_', ' ')}</td>
                      <td className="p-3.5 font-bold text-indigo-300">{m.recipientCount} Recipients</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            m.status === 'sent'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : m.status === 'scheduled'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : m.status === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{m.createdBy}</td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(m.scheduledAt || m.sentAt || m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {m.status === 'scheduled' && ['admin', 'teacher'].includes(activeRole) && (
                          <>
                            <button
                              onClick={() => handleSendNow(m.id)}
                              className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/30"
                            >
                              Send Now
                            </button>
                            <button
                              onClick={() => handleCancelScheduled(m.id)}
                              className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold hover:bg-rose-500/30"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📚 TAB 4: TEMPLATES LIBRARY */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search templates by code or title..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && loadTemplates()}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <select
                value={templateCategory}
                onChange={(e) => {
                  setTemplateCategory(e.target.value);
                  setTimeout(loadTemplates, 50);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="admission">Admissions</option>
                <option value="fees">Fees & Billing</option>
                <option value="attendance">Attendance</option>
                <option value="exam">Examinations</option>
                <option value="academic">Academic & Homework</option>
                <option value="transport">Transport</option>
                <option value="library">Library</option>
                <option value="hr">HR & Payroll</option>
                <option value="general">General</option>
              </select>
            </div>

            {['admin'].includes(activeRole) && (
              <button
                onClick={() => setShowCreateTemplateModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Template</span>
              </button>
            )}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                      {tpl.code}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{tpl.category}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{tpl.name}</h3>
                  <p className="text-xs text-slate-400 font-mono line-clamp-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    {tpl.body}
                  </p>

                  {/* Variables Badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tpl.variables.map((v, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-cyan-300 border border-slate-800">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">{tpl.channel.toUpperCase()} Channel</span>
                  <button
                    onClick={() => handlePreviewTemplate(tpl.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-mono flex items-center gap-1 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⏱️ TAB 5: SCHEDULED QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white font-mono">Automated Scheduled Dispatches</div>
                <div className="text-[11px] text-slate-400">Messages will be triggered automatically at their designated timestamp.</div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300">
              {messages.filter((m) => m.status === 'scheduled').length} Pending in Queue
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {messages
              .filter((m) => m.status === 'scheduled')
              .map((m) => (
                <div key={m.id} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      SCHEDULED
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Target: {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{m.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{m.body}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-indigo-300">{m.recipientCount} Recipients</span>
                    <div className="flex items-center gap-2">
                      {['admin', 'teacher'].includes(activeRole) && (
                        <>
                          <button
                            onClick={() => handleSendNow(m.id)}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold"
                          >
                            Send Now
                          </button>
                          <button
                            onClick={() => handleCancelScheduled(m.id)}
                            className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-bold"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📜 TAB 6: DELIVERY LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'deliveries' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search deliveries by recipient or contact..."
                  value={deliverySearch}
                  onChange={(e) => setDeliverySearch(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && loadDeliveries()}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <select
                value={deliveryStatusFilter}
                onChange={(e) => {
                  setDeliveryStatusFilter(e.target.value);
                  setTimeout(loadDeliveries, 50);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none"
              >
                <option value="all">All Delivery States</option>
                <option value="delivered">Delivered</option>
                <option value="read">Read</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={deliveryChannelFilter}
                onChange={(e) => {
                  setDeliveryChannelFilter(e.target.value);
                  setTimeout(loadDeliveries, 50);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none"
              >
                <option value="all">All Channels</option>
                <option value="in_app">In-App</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <span className="text-xs font-mono text-slate-400">{deliveries.length} Records Logged</span>
          </div>

          {/* Delivery Logs Table */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
                    <th className="p-3.5">Recipient</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Contact (Masked)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Provider Ref</th>
                    <th className="p-3.5">Timestamps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">{d.recipientName}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                          {d.recipientType}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-500/10 text-cyan-300">
                          {d.channel}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{d.recipientContact || 'N/A'}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            d.status === 'delivered' || d.status === 'read'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : d.status === 'failed'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {d.status}
                        </span>
                        {d.failureReason && (
                          <div className="text-[10px] text-rose-400 mt-0.5 line-clamp-1">{d.failureReason}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-[10px] text-slate-500">{d.providerMessageId || 'local_sys'}</td>
                      <td className="p-3.5 text-[10px] text-slate-500">
                        <div>Sent: {new Date(d.sentAt || d.createdAt).toLocaleTimeString()}</div>
                        {d.readAt && <div className="text-emerald-400">Read: {new Date(d.readAt).toLocaleTimeString()}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔔 TAB 7: IN-APP NOTIFICATION CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white font-mono uppercase">In-App Notification Ledger</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-mono font-bold">
                {notifications.filter((n) => !n.readAt).length} Unread
              </span>
            </div>

            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-mono font-bold text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          </div>

          {/* Notifications List Grouped */}
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`glass-panel p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  !n.readAt
                    ? 'bg-slate-900/90 border-purple-500/40 shadow-lg shadow-purple-500/5'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      n.notificationType === 'fee'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : n.notificationType === 'exam'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : n.notificationType === 'admission'
                        ? 'bg-amber-500/20 text-amber-400'
                        : n.notificationType === 'attendance'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{n.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-400">
                        {n.notificationType}
                      </span>
                      {!n.readAt && (
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(n.createdAt).toLocaleDateString()} at{' '}
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.relatedEntityType && onNavigateToModule && (
                    <button
                      onClick={() => {
                        const targetMod =
                          n.relatedEntityType === 'admission'
                            ? 'admissions'
                            : n.relatedEntityType === 'fee_invoice'
                            ? 'fees'
                            : n.relatedEntityType === 'exam'
                            ? 'exams'
                            : 'dashboard';
                        onNavigateToModule(targetMod);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-mono flex items-center gap-1"
                      title="Open ERP Record"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!n.readAt && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 text-xs font-mono font-bold"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚙️ TAB 8: PREFERENCES & AUTOMATED ERP TRIGGERS */}
      {/* ========================================================================= */}
      {activeTab === 'preferences' && commSettings && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>School-Wide Automated Communication Triggers</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Enable or disable automated student and parent notifications when key ERP events occur.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  key: 'autoAdmissionNotifications',
                  label: 'Admissions: Application Received & Status Updates',
                  desc: 'Sends parent notification upon inquiry capture and principal approval'
                },
                {
                  key: 'autoFeePaymentReceipts',
                  label: 'Fees: Instant Digital Payment Receipt',
                  desc: 'Acknowledges fee settlements via UPI/NetBanking with receipt number'
                },
                {
                  key: 'autoFeeDueReminders',
                  label: 'Fees: Installment Due Date Reminders',
                  desc: 'Dispatches automated reminders 3 days prior to due date'
                },
                {
                  key: 'autoLowAttendanceAlerts',
                  label: 'Attendance: Low Attendance Warning (<75%)',
                  desc: 'Alerts parents when cumulative attendance drops below threshold'
                },
                {
                  key: 'autoExamResultAlerts',
                  label: 'Exams: Report Card Publication Announcement',
                  desc: 'Notifies students and parents when assessment scores are published'
                },
                {
                  key: 'autoTransportUpdates',
                  label: 'Transport: Route Delays & Stop Time Changes',
                  desc: 'Broadcasts urgent alerts for bus route changes'
                },
                {
                  key: 'autoLibraryDueAlerts',
                  label: 'Library: Book Due & Overdue Fine Reminders',
                  desc: 'Sends circulation alerts 1 day before due date'
                },
                {
                  key: 'autoHrPayrollAlerts',
                  label: 'HR: Staff Leave Approvals & Salary Credits',
                  desc: 'Alerts faculty on monthly payslip disbursement'
                }
              ].map((item, idx) => {
                const isChecked = (commSettings as any)[item.key];
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCommSettings({
                          ...commSettings,
                          [item.key]: !isChecked
                        })
                      }
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                        isChecked ? 'bg-gradient-to-r from-cyan-500 to-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          isChecked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-mono shadow-lg shadow-cyan-500/20"
              >
                {savingSettings ? 'Saving...' : 'Save Communication Rules'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📝 MODAL 1: CREATE NOTICE MODAL */}
      {/* ========================================================================= */}
      {showCreateNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-3xl border border-slate-700 bg-slate-950 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-mono">Publish Official Circular / Notice</h3>
              </div>
              <button
                onClick={() => setShowCreateNoticeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNoticeSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400">Notice Title *</label>
                <input
                  type="text"
                  placeholder="e.g. CBSE Pre-Board Practical Exams Schedule..."
                  value={newNoticeForm.title}
                  onChange={(e) => setNewNoticeForm({ ...newNoticeForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400">Category</label>
                  <select
                    value={newNoticeForm.category}
                    onChange={(e) => setNewNoticeForm({ ...newNoticeForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="circular">Official Circular</option>
                    <option value="exam">Examination & Assessment</option>
                    <option value="academic">Academic & Curriculum</option>
                    <option value="fee">Fees & Finance</option>
                    <option value="transport">Transport</option>
                    <option value="holiday">Holiday Notice</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Priority Level</label>
                  <select
                    value={newNoticeForm.priority}
                    onChange={(e) => setNewNoticeForm({ ...newNoticeForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">🚨 Urgent (Push SMS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400">Target Audience Scope</label>
                  <select
                    value={newNoticeForm.audienceType}
                    onChange={(e) => setNewNoticeForm({ ...newNoticeForm, audienceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="entire_school">Entire School (Campus Wide)</option>
                    <option value="all_parents">All Parents</option>
                    <option value="all_students">All Students</option>
                    <option value="all_teachers">Teaching Faculty Only</option>
                    <option value="all_staff">All Staff Members</option>
                    <option value="class">Specific Grade</option>
                    <option value="section">Specific Section</option>
                  </select>
                </div>

                {['class', 'section'].includes(newNoticeForm.audienceType) && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-slate-400">Class</label>
                      <select
                        value={newNoticeForm.gradeFilter}
                        onChange={(e) => setNewNoticeForm({ ...newNoticeForm, gradeFilter: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                      >
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10</option>
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12</option>
                      </select>
                    </div>
                    {newNoticeForm.audienceType === 'section' && (
                      <div className="space-y-1">
                        <label className="text-slate-400">Section</label>
                        <select
                          value={newNoticeForm.sectionFilter}
                          onChange={(e) => setNewNoticeForm({ ...newNoticeForm, sectionFilter: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                        >
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Notice Body (Markdown Supported)</label>
                <textarea
                  rows={4}
                  placeholder="Detailed instructions or notice text..."
                  value={newNoticeForm.body}
                  onChange={(e) => setNewNoticeForm({ ...newNoticeForm, body: e.target.value, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={newNoticeForm.smsBroadcast}
                    onChange={(e) => setNewNoticeForm({ ...newNoticeForm, smsBroadcast: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700"
                  />
                  <span>Push SMS Gateway Broadcast</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateNoticeModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-slate-950 font-bold hover:brightness-110"
                  >
                    Publish Now
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODAL 2: MESSAGE COMPOSER WIZARD */}
      {/* ========================================================================= */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl p-6 rounded-3xl border border-slate-700 bg-slate-950 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono">Compose Multi-Channel Campaign</h3>
              </div>
              <button onClick={() => setShowComposeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Template Selector Quick Action */}
              <div className="space-y-1">
                <label className="text-slate-400">Load from Reusable Template (Optional)</label>
                <select
                  value={composeForm.templateCode}
                  onChange={(e) => handleSelectTemplateInComposer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 focus:outline-none"
                >
                  <option value="">-- Select a Standard Template --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.code}>
                      [{t.code}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400">Delivery Channel</label>
                  <select
                    value={composeForm.channel}
                    onChange={(e) => setComposeForm({ ...composeForm, channel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="in_app">In-App Notification</option>
                    <option value="sms">SMS Gateway</option>
                    <option value="email">Email Service</option>
                    <option value="whatsapp">WhatsApp Cloud</option>
                    <option value="all">Omni-Channel (All 4)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Audience Scope</label>
                  <select
                    value={composeForm.audienceType}
                    onChange={(e) => setComposeForm({ ...composeForm, audienceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="entire_school">Entire School</option>
                    <option value="all_parents">All Parents</option>
                    <option value="all_students">All Students</option>
                    <option value="all_teachers">Teaching Faculty</option>
                    <option value="class_parents">Parents of Specific Grade</option>
                    <option value="class">Specific Grade</option>
                    <option value="section">Specific Section</option>
                  </select>
                </div>
              </div>

              {['class', 'section', 'class_parents'].includes(composeForm.audienceType) && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-400">Grade</label>
                    <select
                      value={composeForm.gradeFilter}
                      onChange={(e) => setComposeForm({ ...composeForm, gradeFilter: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                    >
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                    </select>
                  </div>
                  {composeForm.audienceType === 'section' && (
                    <div className="space-y-1">
                      <label className="text-slate-400">Section</label>
                      <select
                        value={composeForm.sectionFilter}
                        onChange={(e) => setComposeForm({ ...composeForm, sectionFilter: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Real Audience Preview Banner */}
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Users className="w-4 h-4" />
                  <span>Audience Resolution:</span>
                  <span className="font-bold text-white">
                    {loadingAudience ? 'Calculating...' : `${audiencePreview?.total || 0} Estimated Recipients`}
                  </span>
                </div>
                {audiencePreview && audiencePreview.sampleRecipients.length > 0 && (
                  <span className="text-[10px] text-slate-400">
                    Sample: {audiencePreview.sampleRecipients[0].name} ({audiencePreview.sampleRecipients[0].contact})
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Subject / Title *</label>
                <input
                  type="text"
                  placeholder="Subject of notification..."
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Message Body *</label>
                <textarea
                  rows={4}
                  placeholder="Type message or load from template..."
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={composeForm.scheduledAt}
                    onChange={(e) => setComposeForm({ ...composeForm, scheduledAt: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                  <span className="text-[10px] text-slate-500">(Leave empty to send now)</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowComposeModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSendConfirmation(true)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold hover:brightness-110 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{composeForm.scheduledAt ? 'Review & Schedule' : 'Review & Send'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚠️ MODAL 3: BULK SEND CONFIRMATION STEP */}
      {/* ========================================================================= */}
      {showSendConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-indigo-500/40 bg-slate-950 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white font-mono">Confirm Message Dispatch</h3>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs font-mono space-y-2">
              <div className="text-slate-300">
                <span className="text-cyan-400 font-bold">{audiencePreview?.total || 0} recipients</span> will receive
                this message via <span className="text-amber-300 font-bold uppercase">{composeForm.channel}</span> channel.
              </div>
              <div className="text-slate-400 text-[11px] pt-2 border-t border-indigo-500/20">
                Subject: {composeForm.subject || composeForm.title}
              </div>
              {composeForm.scheduledAt && (
                <div className="text-amber-300 text-[11px]">
                  Scheduled for: {new Date(composeForm.scheduledAt).toLocaleString()}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSendConfirmation(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono"
              >
                Go Back
              </button>
              <button
                onClick={handleSendMessageSubmit}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-xs font-bold font-mono hover:brightness-110"
              >
                Confirm & Dispatch 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📄 MODAL 4: NOTICE PREVIEW DRAWER */}
      {/* ========================================================================= */}
      {selectedNoticeForView && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-3xl border border-slate-700 bg-slate-950 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-mono">Official Campus Circular Letterhead</h3>
              </div>
              <button onClick={() => setSelectedNoticeForView(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Ref: {selectedNoticeForView.id.toUpperCase()}</span>
                  <span>Date: {new Date(selectedNoticeForView.publishAt || selectedNoticeForView.createdAt).toLocaleDateString()}</span>
                </div>
                <h2 className="text-base font-extrabold text-white">{selectedNoticeForView.title}</h2>
                <div className="text-[11px] text-cyan-300">
                  Target Audience: {selectedNoticeForView.audienceType?.replace('_', ' ').toUpperCase() || 'ALL'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedNoticeForView.body || selectedNoticeForView.content}
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px] text-slate-500">
                <span>Issued by: {selectedNoticeForView.postedBy}</span>
                <span>Delhi Public Heritage Trust</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 MODAL 5: TEMPLATE LIVE PREVIEW */}
      {/* ========================================================================= */}
      {selectedTemplateForPreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl p-6 rounded-3xl border border-indigo-500/40 bg-slate-950 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Live Template Preview: [{selectedTemplateForPreview.template.code}]
                </h3>
              </div>
              <button onClick={() => setSelectedTemplateForPreview(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Rendered Subject:</span>
                <div className="font-bold text-white mt-0.5">{selectedTemplateForPreview.renderedSubject}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px]">Rendered Body with Student Data:</span>
                <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedTemplateForPreview.renderedBody}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[10px] text-indigo-300">
                Variables resolved server-side: {selectedTemplateForPreview.template.variables.join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
