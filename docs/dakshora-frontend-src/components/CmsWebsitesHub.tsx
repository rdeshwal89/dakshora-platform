import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Plus,
  RefreshCw,
  Eye,
  Settings,
  Layers,
  FileText,
  Layout,
  Component,
  Search,
  Image as ImageIcon,
  Share2,
  Send,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Edit3,
  Trash2,
  Copy,
  Check,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  UploadCloud,
  Monitor,
  Tablet,
  Smartphone,
  Palette,
  CheckSquare,
  Square,
  ArrowUp,
  ArrowDown,
  Info,
  Sliders,
  Code,
  Tag,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Award,
  Download,
  X
} from 'lucide-react';
import { WebsiteRecord, TemplateRecord } from '../types';
import {
  fetchWebsites,
  createWebsite,
  fetchTemplates,
  fetchWebsiteCms,
  updateWebsiteCms,
  publishWebsite,
  autoSynthesizeWebsiteCms
} from '../services/api';
import { SchoolPublicWebsiteView } from './SchoolPublicWebsiteView';

interface CmsWebsitesHubProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

type LayerType =
  | 'domain'
  | 'template'
  | 'pages'
  | 'sections'
  | 'components'
  | 'content'
  | 'seo'
  | 'media'
  | 'publishing'
  | 'website_integration'
  | 'mobile_app';

interface LayerMeta {
  id: LayerType;
  step: number;
  label: string;
  hindiLabel: string;
  desc: string;
  icon: any;
  gradient: string;
  badgeBg: string;
}

const ELEVEN_LAYERS: LayerMeta[] = [
  {
    id: 'domain',
    step: 1,
    label: 'Domain & SSL',
    hindiLabel: 'डोमेन व SSL',
    desc: 'Custom Domain, Subdomain & DNS routing',
    icon: Globe,
    gradient: 'from-sky-500 to-blue-600',
    badgeBg: 'bg-sky-100 text-sky-950 border-sky-300'
  },
  {
    id: 'template',
    step: 2,
    label: 'Theme & Styling',
    hindiLabel: 'थीम व स्टाइल',
    desc: 'Template layout, colors & typography',
    icon: Layout,
    gradient: 'from-purple-600 to-indigo-600',
    badgeBg: 'bg-purple-100 text-purple-950 border-purple-300'
  },
  {
    id: 'pages',
    step: 3,
    label: 'Pages Hierarchy',
    hindiLabel: 'पेज संरचना',
    desc: 'Site pages, navigation & routing',
    icon: FileText,
    gradient: 'from-pink-600 to-rose-600',
    badgeBg: 'bg-pink-100 text-pink-950 border-pink-300'
  },
  {
    id: 'sections',
    step: 4,
    label: 'Modular Sections',
    hindiLabel: 'पेज सेक्शन्स',
    desc: 'Reorderable page content blocks',
    icon: Layers,
    gradient: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-100 text-amber-950 border-amber-300'
  },
  {
    id: 'components',
    step: 5,
    label: 'Atomic Widgets',
    hindiLabel: 'विजेट्स व टूल',
    desc: 'Admission forms, AI bots & widgets',
    icon: Component,
    gradient: 'from-cyan-500 to-teal-600',
    badgeBg: 'bg-cyan-100 text-cyan-950 border-cyan-300'
  },
  {
    id: 'content',
    step: 6,
    label: 'Dynamic Content',
    hindiLabel: 'कंटेंट व कॉपी',
    desc: 'Headlines, Principal vision & copy',
    icon: Edit3,
    gradient: 'from-emerald-500 to-green-600',
    badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300'
  },
  {
    id: 'seo',
    step: 7,
    label: 'SEO & Sharing',
    hindiLabel: 'सर्च इंजन (SEO)',
    desc: 'Google snippet, OpenGraph & meta',
    icon: Search,
    gradient: 'from-yellow-500 to-amber-600',
    badgeBg: 'bg-yellow-100 text-yellow-950 border-yellow-300'
  },
  {
    id: 'media',
    step: 8,
    label: 'Media Assets',
    hindiLabel: 'फोटो व CDN',
    desc: 'Campus gallery, logos & CDN storage',
    icon: ImageIcon,
    gradient: 'from-violet-600 to-fuchsia-600',
    badgeBg: 'bg-violet-100 text-violet-950 border-violet-300'
  },
  {
    id: 'publishing',
    step: 9,
    label: 'Publishing Engine',
    hindiLabel: 'लाइव रिलीज',
    desc: '1-Click Edge CDN & version release',
    icon: UploadCloud,
    gradient: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300'
  },
  {
    id: 'website_integration',
    step: 10,
    label: 'Website & ERP Portal',
    hindiLabel: 'वेबसाइट व ERP पोर्टल',
    desc: 'Live school website, DNS & ERP login integration',
    icon: ExternalLink,
    gradient: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-100 text-blue-950 border-blue-300'
  },
  {
    id: 'mobile_app',
    step: 11,
    label: 'Branded Mobile App',
    hindiLabel: 'व्हाइट-लेबल मोबाइल ऐप',
    desc: 'White-label School App APK, Universal Links & PWA',
    icon: Smartphone,
    gradient: 'from-teal-500 to-cyan-600',
    badgeBg: 'bg-teal-100 text-teal-950 border-teal-300'
  }
];

const NINE_LAYERS = ELEVEN_LAYERS;

const PRESET_COLORS = [
  { name: 'Royal Indigo', hex: '#4F46E5', bg: 'bg-indigo-600' },
  { name: 'Emerald Academic', hex: '#059669', bg: 'bg-emerald-600' },
  { name: 'Crimson Heritage', hex: '#DC2626', bg: 'bg-rose-600' },
  { name: 'Cyan High-Tech', hex: '#06B6D4', bg: 'bg-cyan-600' },
  { name: 'Deep Violet', hex: '#7C3AED', bg: 'bg-violet-600' },
  { name: 'Warm Amber', hex: '#D97706', bg: 'bg-amber-600' },
];

export const DEFAULT_CAMPUS_SLIDES = [
  {
    id: 'slide-1',
    title: 'Architectural Smart Campus & Academic Enclave',
    subtitle: 'Sprawling 15-acre green eco-campus with climate-controlled digital classrooms and collaborative learning zones.',
    badge: 'CBSE Smart Campus',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'slide-2',
    title: 'Atal Tinkering Robotics & STEM Innovation Center',
    subtitle: 'Empowering future innovators with AI workstations, 3D printing labs, drone simulation, and hands-on experiments.',
    badge: 'ATL Robotics Lab',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'slide-3',
    title: 'Olympic-Standard Sports Arena & Athletic Complex',
    subtitle: 'FIFA-standard football turf, Olympic-dimension swimming pool, indoor badminton courts, and certified coaching.',
    badge: 'Sports & Athletics',
    url: 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'slide-4',
    title: 'Heritage Digital Library & Knowledge Sanctuary',
    subtitle: 'Over 40,000 physical volumes, EBSCO digital research databases, dedicated quiet study pods, and audio-visual stations.',
    badge: 'Digital Library',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80'
  }
];

export const CmsWebsitesHub: React.FC<CmsWebsitesHubProps> = ({ onShowToast }) => {
  const [websites, setWebsites] = useState<WebsiteRecord[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('site-1');
  const [cmsTree, setCmsTree] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAutoSynthesizing, setIsAutoSynthesizing] = useState(false);
  const [mobilePreviewRole, setMobilePreviewRole] = useState<'parent' | 'teacher' | 'principal'>('parent');
  const [leadershipTab, setLeadershipTab] = useState<'principal' | 'director'>('principal');
  const [activeLayer, setActiveLayer] = useState<LayerType>('domain');

  // Preview viewport device mode: desktop, tablet, mobile
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Full-Screen Live School Portal & DNS Guide Modals
  const [showFullScreenLivePortal, setShowFullScreenLivePortal] = useState(false);
  const [showDnsHelpModal, setShowDnsHelpModal] = useState(false);

  // Quick Upload Modal State (Logo & 2-4 Campus Pics)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalTab, setUploadModalTab] = useState<'logo' | 'carousel'>('logo');

  // Preview Animated Carousel State in Studio
  const [previewCarouselIdx, setPreviewCarouselIdx] = useState(0);

  // File to Base64 reader helper (allows direct file uploads from user's PC)
  const handleFileToBase64 = (file: File, onSuccess: (base64Url: string) => void) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onShowToast('error', 'File Too Large', 'Please upload an image smaller than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onSuccess(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // New site modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteDomain, setNewSiteDomain] = useState('');
  const [newSiteTemplate, setNewSiteTemplate] = useState('tpl-cbse-secondary');
  const [isCreating, setIsCreating] = useState(false);

  // New Page creation state in Layer 3
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  // New Section creation state in Layer 4
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionType, setNewSectionType] = useState('HeroBanner');

  // New Media state in Layer 8
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [newMediaName, setNewMediaName] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState('Campus');

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast('info', 'Copied to Clipboard 📋', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Active Campus Slides (Dynamic from cmsTree.content.heroSlides or DEFAULT_CAMPUS_SLIDES)
  const activeCampusSlides = useMemo(() => {
    const custom = cmsTree?.content?.heroSlides || cmsTree?.content?.schoolPics;
    if (Array.isArray(custom) && custom.length >= 2) return custom;
    return DEFAULT_CAMPUS_SLIDES;
  }, [cmsTree]);

  // Studio simulated preview auto-rotation timer
  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewCarouselIdx((prev) => (prev + 1) % activeCampusSlides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [activeCampusSlides.length]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sitesRes, tplRes] = await Promise.all([fetchWebsites(), fetchTemplates()]);
      if (sitesRes.data.websites) {
        setWebsites(sitesRes.data.websites);
        if (sitesRes.data.websites.length > 0 && !selectedSiteId) {
          setSelectedSiteId(sitesRes.data.websites[0].id);
        }
      }
      if (tplRes.data.templates) setTemplates(tplRes.data.templates);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch 9-layer CMS tree when selectedSiteId changes
  useEffect(() => {
    if (!selectedSiteId) return;
    async function loadCms() {
      try {
        const res = await fetchWebsiteCms(selectedSiteId);
        if (res.data.success && res.data.tree) {
          setCmsTree(res.data.tree);
        }
      } catch {
        // silent
      }
    }
    loadCms();
  }, [selectedSiteId]);

  const handleSaveCmsTree = async () => {
    if (!selectedSiteId || !cmsTree) return;
    setIsSaving(true);
    try {
      const res = await updateWebsiteCms(selectedSiteId, cmsTree);
      if (res.data.success) {
        onShowToast('success', 'CMS Layers Saved Successfully! 💾', 'All changes synchronized across the 9 layers');
        if (res.data.tree) setCmsTree(res.data.tree);
      }
    } catch {
      onShowToast('error', 'Save Error', 'Could not save CMS configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedSiteId) return;
    setIsPublishing(true);
    try {
      const res = await publishWebsite(selectedSiteId);
      if (res.data.success) {
        onShowToast('success', 'Website Deployed Live to Edge CDN! 🚀', res.data.message);
        if (res.data.publishing && cmsTree) {
          setCmsTree({ ...cmsTree, publishing: res.data.publishing });
        }
      }
    } catch {
      onShowToast('error', 'Publish Error', 'Could not deploy build to Edge CDN');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAutoSynthesizeWebsiteAndApp = async () => {
    setIsAutoSynthesizing(true);
    try {
      const activeSchool = currentSite || websites[0] || { name: 'Dakshora Academy New Delhi', id: selectedSiteId };
      const res = await autoSynthesizeWebsiteCms({
        websiteId: selectedSiteId,
        schoolName: activeSchool.name,
        domain: activeSchool.domain,
        themeColor: cmsTree?.template?.themeColor || '#06B6D4',
        logoUrl: cmsTree?.content?.schoolLogoUrl || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200',
        city: 'New Delhi',
        principal: {
          name: cmsTree?.content?.principalName || 'Dr. Ananya Sharma',
          title: cmsTree?.content?.principalTitle || 'Principal & Head of Academics',
          qualifications: cmsTree?.content?.principalQualifications || 'Ph.D. Education, M.Sc., B.Ed. (22+ Years in CBSE Leadership)',
          photoUrl: cmsTree?.content?.principalPhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
          message: cmsTree?.content?.principalMessage || 'Our vision is to empower young minds with scientific innovation, ethical leadership, and individual curiosity in a rapidly evolving world.',
          signatureUrl: cmsTree?.content?.principalSignatureUrl || ''
        },
        director: {
          name: cmsTree?.content?.directorName || 'Er. Rajesh Dakshora',
          title: cmsTree?.content?.directorTitle || 'Managing Director & Founder',
          qualifications: cmsTree?.content?.directorQualifications || 'B.Tech (IIT Delhi), M.S. (Stanford), Education Futurist',
          photoUrl: cmsTree?.content?.directorPhotoUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80',
          message: cmsTree?.content?.directorMessage || 'Dakshora 2.0 brings together world-class digital infrastructure, transparent governance, and holistic student-centric learning on a single unified cloud database.',
          signatureUrl: cmsTree?.content?.directorSignatureUrl || ''
        }
      });

      if (res.data?.success && res.data?.tree) {
        setCmsTree(res.data.tree);
        onShowToast('success', '11-Step Architecture Auto-Synthesized! 🚀', 'School Website, Principal & Director Leadership, ERP SSO & Mobile APK Generated!');
      } else {
        onShowToast('info', 'Synthesis Completed', res.data?.message || 'Tree synthesized');
      }
    } catch {
      onShowToast('error', 'Auto-Synthesis Failed', 'Could not synthesize full 11-step stack');
    } finally {
      setIsAutoSynthesizing(false);
    }
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim()) return;

    setIsCreating(true);
    try {
      const res = await createWebsite({
        name: newSiteName.trim(),
        domain: newSiteDomain.trim() || `${newSiteName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.dakshora.app`,
        template: newSiteTemplate,
      });

      if (res.data.success && res.data.website) {
        onShowToast('success', 'School Web Portal Provisioned! 🌐', res.data.website.name);
        setShowNewModal(false);
        setNewSiteName('');
        setNewSiteDomain('');
        loadData();
        setSelectedSiteId(res.data.website.id);
      }
    } catch {
      onShowToast('error', 'Creation Failed', 'Please verify backend availability');
    } finally {
      setIsCreating(false);
    }
  };

  // -------------------------------------------------------------
  // Layer 3 Pages CRUD
  // -------------------------------------------------------------
  const handleAddPage = () => {
    if (!newPageTitle.trim()) return;
    const slug = newPageSlug.trim() || `/${newPageTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newPage = {
      id: `pg-${Date.now()}`,
      title: newPageTitle.trim(),
      slug: slug.startsWith('/') ? slug : `/${slug}`,
      isHome: false,
      order: (cmsTree.pages?.length || 0) + 1,
      visible: true
    };
    setCmsTree({
      ...cmsTree,
      pages: [...(cmsTree.pages || []), newPage]
    });
    setNewPageTitle('');
    setNewPageSlug('');
    setShowAddPageModal(false);
    onShowToast('success', 'Page Added', `Added ${newPage.title} (${newPage.slug})`);
  };

  const handleDeletePage = (pageId: string) => {
    const updated = (cmsTree.pages || []).filter((p: any) => p.id !== pageId);
    setCmsTree({ ...cmsTree, pages: updated });
    onShowToast('info', 'Page Removed');
  };

  const handleTogglePageVisibility = (pageId: string) => {
    const updated = (cmsTree.pages || []).map((p: any) =>
      p.id === pageId ? { ...p, visible: !p.visible } : p
    );
    setCmsTree({ ...cmsTree, pages: updated });
  };

  // -------------------------------------------------------------
  // Layer 4 Sections CRUD & Reorder
  // -------------------------------------------------------------
  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSec = {
      id: `sec-${Date.now()}`,
      pageId: 'pg-home',
      type: newSectionType,
      title: newSectionTitle.trim(),
      order: (cmsTree.sections?.length || 0) + 1,
      isEnabled: true
    };
    setCmsTree({
      ...cmsTree,
      sections: [...(cmsTree.sections || []), newSec]
    });
    setNewSectionTitle('');
    setShowAddSectionModal(false);
    onShowToast('success', 'Section Added', `Attached ${newSec.title} block`);
  };

  const handleToggleSection = (secId: string) => {
    const updated = (cmsTree.sections || []).map((s: any) =>
      s.id === secId ? { ...s, isEnabled: !s.isEnabled } : s
    );
    setCmsTree({ ...cmsTree, sections: updated });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const secs = [...(cmsTree.sections || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= secs.length) return;
    const temp = secs[index];
    secs[index] = secs[targetIdx];
    secs[targetIdx] = temp;
    setCmsTree({ ...cmsTree, sections: secs });
  };

  // -------------------------------------------------------------
  // Layer 5 Components Toggle
  // -------------------------------------------------------------
  const handleToggleComponent = (cmpId: string) => {
    const updated = (cmsTree.components || []).map((c: any) =>
      c.id === cmpId ? { ...c, enabled: c.enabled === false ? true : false } : c
    );
    setCmsTree({ ...cmsTree, components: updated });
  };

  // -------------------------------------------------------------
  // Layer 6 AI Copywriter helper
  // -------------------------------------------------------------
  const handleAiGenerateCopy = () => {
    const schoolName = cmsTree?.name || 'Heritage Public Academy';
    setCmsTree({
      ...cmsTree,
      content: {
        ...cmsTree.content,
        heroHeadline: `Empowering Future Leaders & Scholars at ${schoolName}`,
        heroSubheadline: `Premier CBSE & Atal Innovation Hub. 100% distinction track record, AI-augmented digital classrooms, Olympic sports complex, and personalized holistic care.`,
        principalMessage: `At ${schoolName}, we believe education is not the filling of a pail, but the lighting of a fire. Every student is mentored to discover their unique genius in STEM, arts, and leadership.`,
        schoolMotto: 'विद्या ददाति विनयं • Knowledge Bestows Humility & Excellence',
        ctaText: 'Apply for Admission (Session 2026-27)'
      }
    });
    onShowToast('success', 'AI Copy Generated! ✨', 'Injected CBSE-standard inspiring school copy across all sections.');
  };

  // -------------------------------------------------------------
  // Layer 8 Media Add & Remove
  // -------------------------------------------------------------
  const handleAddMedia = () => {
    if (!newMediaName.trim() || !newMediaUrl.trim()) return;
    const newMed = {
      id: `med-${Date.now()}`,
      name: newMediaName.trim(),
      url: newMediaUrl.trim(),
      type: newMediaType
    };
    setCmsTree({
      ...cmsTree,
      media: [...(cmsTree.media || []), newMed]
    });
    setNewMediaName('');
    setNewMediaUrl('');
    setShowAddMediaModal(false);
    onShowToast('success', 'Media Uploaded', `Added ${newMed.name}`);
  };

  const handleDeleteMedia = (medId: string) => {
    const updated = (cmsTree.media || []).filter((m: any) => m.id !== medId);
    setCmsTree({ ...cmsTree, media: updated });
    onShowToast('info', 'Media Removed');
  };

  const currentSite = websites.find((s) => s.id === selectedSiteId) || websites[0];
  const activeLayerMeta = NINE_LAYERS.find(l => l.id === activeLayer) || NINE_LAYERS[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND HEADER & SITE SELECTOR */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-xl shadow-slate-200/50 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-50 shrink-0">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  11-Step Full Website & CMS Engine
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  Live Edge CDN Ready
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300">
                  v{cmsTree?.publishing?.version || 1} Production
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-700 font-mono mt-1">
                Architectural Hierarchy: Domain → Theme → Pages → Sections → Widgets → Content → SEO → Media → Publishing → Website Integration → Mobile App
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* Site Switcher Dropdown */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-300">
              <span className="text-[11px] font-mono font-black text-slate-700 pl-2">Active School:</span>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="bg-white border-2 border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-black text-slate-950 focus:outline-none focus:border-indigo-600 cursor-pointer shadow-xs"
              >
                {websites.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.domain})
                  </option>
                ))}
              </select>
            </div>

            {/* 1-Click Auto-Synthesize School Website & App Button */}
            <button
              type="button"
              disabled={isAutoSynthesizing}
              onClick={handleAutoSynthesizeWebsiteAndApp}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:brightness-110 text-white font-black text-xs font-mono flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer ring-2 ring-amber-300 animate-pulse"
              title="Auto-Synthesize 11 Layers with Modern Glassmorphism, Leadership, ERP SSO & Mobile APK"
            >
              {isAutoSynthesizing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-200" />
              )}
              <span>⚡ Auto-Synthesize Website & App (ऑटो डिज़ाइन)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-black text-xs font-mono flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New School Site</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFullScreenLivePortal(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs font-mono flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-emerald-200" />
              <span>Launch Live Web Portal (लाइव देखें)</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-black text-xs font-mono flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-purple-200" />
              <span>Upload Logo & Pics (लोगो व फ़ोटो)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDnsHelpModal(true)}
              className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-bold text-xs font-mono flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="DNS & Domain Setup Guide"
            >
              <Info className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">DNS Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 11 INTERACTIVE LAYER CARDS (BADA TACTILE DECK) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2.5">
        {ELEVEN_LAYERS.map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id)}
              className={`p-3.5 rounded-3xl border-2 transition-all duration-200 text-left flex flex-col justify-between min-h-[110px] relative overflow-hidden group cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-br from-slate-950 to-indigo-950 border-indigo-600 text-white shadow-xl ring-4 ring-indigo-300/50 -translate-y-1'
                  : 'bg-white hover:bg-slate-50 border-slate-300 hover:border-indigo-400 text-slate-950 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Top Accent Strip */}
              <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${layer.gradient}`} />

              <div className="flex items-center justify-between w-full pt-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                  isActive ? 'bg-white/20 text-white' : `bg-gradient-to-tr ${layer.gradient}`
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-900 border border-slate-300'
                }`}>
                  L{layer.step}
                </span>
              </div>

              <div>
                <h4 className={`text-xs font-black truncate w-full ${isActive ? 'text-white' : 'text-slate-950'}`}>
                  {layer.label}
                </h4>
                <p className={`text-[10px] font-mono font-extrabold truncate ${isActive ? 'text-indigo-300' : 'text-purple-700'}`}>
                  {layer.hindiLabel}
                </p>
              </div>

              <div className={`text-[9px] font-mono font-bold pt-1 border-t flex items-center justify-between ${
                isActive ? 'border-white/20 text-emerald-300' : 'border-slate-200 text-slate-600'
              }`}>
                <span>{isActive ? '● Active Layer' : 'Edit Layer'}</span>
                <span>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. DUAL-PANE WORKSPACE: LAYER STUDIO (LEFT) & LIVE CMS PREVIEW (RIGHT) */}
      {/* ========================================================================= */}
      {cmsTree && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ------------------------------------------------------------- */}
          {/* LEFT: LAYER CONFIGURATION STUDIO (7 cols) */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border-2 border-slate-300 shadow-xl space-y-6">
            {/* Header of Active Layer */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${activeLayerMeta.gradient} text-white flex items-center justify-center shadow-md`}>
                  <activeLayerMeta.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950">
                    Layer {activeLayerMeta.step}: {activeLayerMeta.label}
                  </h3>
                  <p className="text-xs font-mono font-bold text-slate-600">
                    {activeLayerMeta.desc}
                  </p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-mono font-black border ${activeLayerMeta.badgeBg}`}>
                Layer {activeLayerMeta.step} / 9
              </span>
            </div>

            {/* ========================================================= */}
            {/* LAYER 1: DOMAIN & SSL ROUTING */}
            {/* ========================================================= */}
            {activeLayer === 'domain' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-black text-slate-950 mb-1.5">
                      DAKSHORA Subdomain (Fast Edge Hosting) *
                    </label>
                    <div className="flex rounded-xl overflow-hidden border-2 border-slate-300 focus-within:border-indigo-600 shadow-xs">
                      <input
                        type="text"
                        value={cmsTree.domain?.subdomain?.replace('.dakshora.app', '') || ''}
                        onChange={(e) =>
                          setCmsTree({
                            ...cmsTree,
                            domain: { ...cmsTree.domain, subdomain: `${e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')}.dakshora.app` }
                          })
                        }
                        className="flex-1 bg-white px-3.5 py-2.5 text-xs font-mono font-black text-slate-950 focus:outline-none"
                      />
                      <span className="bg-slate-100 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-700 border-l border-slate-300 flex items-center">
                        .dakshora.app
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-black text-slate-950 mb-1.5">
                      Custom School Domain (e.g. www.tagoreacademy.edu.in)
                    </label>
                    <input
                      type="text"
                      value={cmsTree.domain?.customDomain || ''}
                      onChange={(e) =>
                        setCmsTree({
                          ...cmsTree,
                          domain: { ...cmsTree.domain, customDomain: e.target.value }
                        })
                      }
                      placeholder="www.yourschool.com"
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono font-black text-slate-950 focus:outline-none focus:border-indigo-600 shadow-xs"
                    />
                  </div>

                  {/* DNS Record Configuration Table */}
                  <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-slate-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Automated DNS CNAME Target</span>
                      </span>
                      <span className="text-[10px] font-mono font-black bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-full">
                        Let's Encrypt TLS 1.3 Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-300">
                        <span className="text-slate-500 block text-[10px]">RECORD TYPE</span>
                        <span className="font-black text-slate-950">CNAME</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-300">
                        <span className="text-slate-500 block text-[10px]">HOST / NAME</span>
                        <span className="font-black text-slate-950">www</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-300 flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 block text-[10px]">TARGET VALUE</span>
                          <span className="font-black text-indigo-700">cname.dakshora.app</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('cname.dakshora.app', 'cname')}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
                        >
                          {copiedKey === 'cname' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* LAYER 2: TEMPLATE & THEME STYLING */}
            {/* ========================================================= */}
            {activeLayer === 'template' && (
              <div className="space-y-5 animate-in fade-in">
                {/* 1. School Logo & Official Emblem Card */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                        🎨
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-black text-slate-950">School Logo & Official Emblem (स्कूल लोगो)</h4>
                        <p className="text-[11px] font-mono text-slate-600">यह लोगो नेवबार, हेडर, एडमिशन फॉर्म और फुटर में दिखेगा</p>
                      </div>
                    </div>
                    {cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Logo Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Default Emblem
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 pt-1">
                    {/* Logo Preview */}
                    <div className="w-20 h-20 rounded-2xl bg-white border-2 border-slate-300 shadow-md flex items-center justify-center overflow-hidden shrink-0 p-1">
                      {cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl ? (
                        <img
                          src={cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl}
                          alt="School Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-3xl text-slate-400">🏛️</div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* File Upload Button */}
                        <label className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-black shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload School Logo (कंप्यूटर से चुनें)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileToBase64(file, (base64) => {
                                  setCmsTree({
                                    ...cmsTree,
                                    branding: { ...(cmsTree.branding || {}), logoUrl: base64 },
                                    content: { ...(cmsTree.content || {}), schoolLogoUrl: base64 }
                                  });
                                  onShowToast('success', 'Logo Uploaded! 🎨', 'School logo successfully updated across portal.');
                                });
                              }
                            }}
                          />
                        </label>

                        {/* Reset / Remove Logo */}
                        {(cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl) && (
                          <button
                            type="button"
                            onClick={() => {
                              setCmsTree({
                                ...cmsTree,
                                branding: { ...(cmsTree.branding || {}), logoUrl: '' },
                                content: { ...(cmsTree.content || {}), schoolLogoUrl: '' }
                              });
                              onShowToast('info', 'Logo Reset', 'Reverted to standard school emblem.');
                            }}
                            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-rose-600 border border-slate-300 font-mono text-xs font-bold transition-all cursor-pointer"
                          >
                            Reset Logo
                          </button>
                        )}
                      </div>

                      {/* Or Enter Logo URL */}
                      <div>
                        <input
                          type="text"
                          value={cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCmsTree({
                              ...cmsTree,
                              branding: { ...(cmsTree.branding || {}), logoUrl: val },
                              content: { ...(cmsTree.content || {}), schoolLogoUrl: val }
                            });
                          }}
                          placeholder="या इमेज URL पेस्ट करें (e.g. https://.../logo.png)"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-950 focus:outline-none focus:border-purple-600 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Template Cards */}
                <div>
                  <label className="block text-xs font-mono font-black text-slate-950 mb-2">
                    Select School Blueprint Template
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'tpl-cbse-secondary', name: 'CBSE Heritage & Excellence', badge: 'CBSE Official', desc: 'Pre-board notices, academic calendar, toppers board' },
                      { id: 'tpl-stem-innovation', name: 'Smart STEM & ATL Robotics', badge: 'Atal Lab Hub', desc: 'Robotics gallery, IoT curriculum, coding club' },
                      { id: 'tpl-kindergarten-play', name: 'Montessori & Early Primary', badge: 'Play School', desc: 'Vibrant visuals, day care alerts, activity schedule' },
                      { id: 'tpl-cambridge-global', name: 'International IB & Cambridge', badge: 'IB World', desc: 'Global curriculum, bilingual syllabus, varsity prep' },
                    ].map((tpl) => {
                      const isSelected = cmsTree.template?.id === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => setCmsTree({ ...cmsTree, template: { ...cmsTree.template, id: tpl.id } })}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-200'
                              : 'border-slate-300 hover:border-slate-400 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-slate-950">{tpl.name}</span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                              {tpl.badge}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-600">{tpl.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Accent Color & Quick Presets */}
                <div>
                  <label className="block text-xs font-mono font-black text-slate-950 mb-1.5">
                    Primary Brand Color Palette
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {PRESET_COLORS.map((clr) => (
                      <button
                        key={clr.hex}
                        type="button"
                        onClick={() => setCmsTree({ ...cmsTree, template: { ...cmsTree.template, themeColor: clr.hex } })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 border-2 transition-all cursor-pointer ${
                          cmsTree.template?.themeColor === clr.hex
                            ? 'border-slate-950 shadow-md scale-105 bg-slate-950 text-white'
                            : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${clr.bg} ring-2 ring-white`}></span>
                        <span>{clr.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={cmsTree.template?.themeColor || '#4F46E5'}
                      onChange={(e) => setCmsTree({ ...cmsTree, template: { ...cmsTree.template, themeColor: e.target.value } })}
                      className="w-12 h-10 bg-white border-2 border-slate-300 rounded-xl p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={cmsTree.template?.themeColor || '#4F46E5'}
                      onChange={(e) => setCmsTree({ ...cmsTree, template: { ...cmsTree.template, themeColor: e.target.value } })}
                      className="w-32 bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-black text-slate-950"
                    />
                    <span className="text-xs font-bold text-slate-600 font-mono">Custom Hex Color</span>
                  </div>
                </div>

                {/* Typography Engine */}
                <div>
                  <label className="block text-xs font-mono font-black text-slate-950 mb-1.5">
                    Typography Font Family
                  </label>
                  <select
                    value={cmsTree.template?.fontFamily || 'Plus Jakarta Sans, sans-serif'}
                    onChange={(e) => setCmsTree({ ...cmsTree, template: { ...cmsTree.template, fontFamily: e.target.value } })}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono font-black text-slate-950 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (Default Premium)</option>
                    <option value="'Noto Sans Devanagari', sans-serif">Noto Sans Devanagari (हिंदी व सीबीएसई अनुकूल)</option>
                    <option value="'Inter', sans-serif">Inter (Modern Clean)</option>
                    <option value="'Poppins', sans-serif">Poppins (Vibrant Indian)</option>
                    <option value="'Roboto', sans-serif">Roboto (Structured Academic)</option>
                  </select>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* LAYER 3: PAGES HIERARCHY */}
            {/* ========================================================= */}
            {activeLayer === 'pages' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-slate-950">
                    Active Pages ({cmsTree.pages?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddPageModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Page</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {cmsTree.pages?.map((page: any, idx: number) => (
                    <div
                      key={page.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-300 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-xs font-mono font-black text-slate-700">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-950">{page.title}</span>
                            {page.isHome && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-950 border border-indigo-300 text-[10px] font-mono font-black">
                                HOMEPAGE
                              </span>
                            )}
                          </div>
                          <code className="text-xs font-bold text-indigo-700 font-mono">{page.slug}</code>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePageVisibility(page.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border cursor-pointer ${
                            page.visible !== false
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                        >
                          {page.visible !== false ? 'Visible' : 'Hidden'}
                        </button>
                        {!page.isHome && (
                          <button
                            type="button"
                            onClick={() => handleDeletePage(page.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer"
                            title="Delete Page"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Page Modal */}
                {showAddPageModal && (
                  <div className="p-4 bg-indigo-50/70 rounded-2xl border-2 border-indigo-200 space-y-3">
                    <h4 className="text-xs font-mono font-black text-indigo-950">Add Page to Website</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Page Title *</label>
                        <input
                          type="text"
                          value={newPageTitle}
                          onChange={(e) => {
                            setNewPageTitle(e.target.value);
                            setNewPageSlug(`/${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
                          }}
                          placeholder="e.g. Sports Academy"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-950"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">URL Slug</label>
                        <input
                          type="text"
                          value={newPageSlug}
                          onChange={(e) => setNewPageSlug(e.target.value)}
                          placeholder="/sports-academy"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-950 font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddPageModal(false)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPage}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold font-mono"
                      >
                        Create Page
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* LAYER 4: MODULAR PAGE SECTIONS */}
            {/* ========================================================= */}
            {activeLayer === 'sections' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-slate-950">
                    Modular Sections ({cmsTree.sections?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSectionModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Section</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {cmsTree.sections?.map((sec: any, idx: number) => (
                    <div
                      key={sec.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-300 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveSection(idx, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 rounded text-slate-500 hover:text-slate-950 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSection(idx, 'down')}
                            disabled={idx === (cmsTree.sections?.length || 0) - 1}
                            className="p-0.5 rounded text-slate-500 hover:text-slate-950 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <div className="font-black text-sm text-slate-950">{sec.title}</div>
                          <span className="text-[11px] font-mono font-bold text-slate-600">
                            Type: <strong className="text-indigo-700">{sec.type}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSection(sec.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer ${
                            sec.isEnabled !== false
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                        >
                          {sec.isEnabled !== false ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Section Modal */}
                {showAddSectionModal && (
                  <div className="p-4 bg-amber-50/70 rounded-2xl border-2 border-amber-200 space-y-3">
                    <h4 className="text-xs font-mono font-black text-amber-950">Add Section to Homepage</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Section Title *</label>
                        <input
                          type="text"
                          value={newSectionTitle}
                          onChange={(e) => setNewSectionTitle(e.target.value)}
                          placeholder="e.g. CBSE Toppers 2026"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-950"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Section Type</label>
                        <select
                          value={newSectionType}
                          onChange={(e) => setNewSectionType(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-950"
                        >
                          <option value="HeroBanner">Hero Banner</option>
                          <option value="StatsCounters">Key Statistics</option>
                          <option value="PrincipalVision">Principal Desk</option>
                          <option value="LabsGallery">Smart Labs Showcase</option>
                          <option value="DailyThoughtTicker">Thought of Day</option>
                          <option value="AdmissionLeadForm">Admission Lead Form</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddSectionModal(false)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddSection}
                        className="px-4 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold font-mono"
                      >
                        Add Block
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* LAYER 5: ATOMIC COMPONENTS & WIDGETS */}
            {/* ========================================================= */}
            {activeLayer === 'components' && (
              <div className="space-y-4 animate-in fade-in">
                <span className="text-xs font-mono font-black text-slate-950">
                  Interactive Widgets & Engines ({cmsTree.components?.length || 0})
                </span>

                <div className="space-y-3">
                  {cmsTree.components?.map((cmp: any) => (
                    <div
                      key={cmp.id}
                      className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-300 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Component className="w-4 h-4 text-indigo-600" />
                          <span className="font-black text-sm text-slate-950">{cmp.type}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-600 mt-0.5">
                          Bound Section: <code className="text-indigo-700 font-mono">{cmp.sectionId}</code>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleComponent(cmp.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer ${
                          cmp.enabled !== false
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-xs'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        {cmp.enabled !== false ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* LAYER 6: DYNAMIC CONTENT & LEADERSHIP DESK */}
            {/* ========================================================= */}
            {activeLayer === 'content' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-mono font-black text-slate-950 block">School Content, Leadership & Branding</span>
                    <span className="text-[11px] font-mono text-slate-600">Principal, Director Vision, Logo and Institutional Messages</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiGenerateCopy}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-mono font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Polish Copy with AI</span>
                  </button>
                </div>

                {/* Section A: Hero & Branding */}
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-indigo-950 flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span>CAMPUS HERO & BRAND IDENTITY</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">Channel: Public Website</span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                      Hero Main Headline *
                    </label>
                    <input
                      type="text"
                      value={cmsTree.content?.heroHeadline || ''}
                      onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, heroHeadline: e.target.value } })}
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                      Hero Subheadline / Mission Statement
                    </label>
                    <textarea
                      rows={2}
                      value={cmsTree.content?.heroSubheadline || ''}
                      onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, heroSubheadline: e.target.value } })}
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600 shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                        Call-to-Action (CTA) Text
                      </label>
                      <input
                        type="text"
                        value={cmsTree.content?.ctaText || 'Apply for Admission (2026-27)'}
                        onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, ctaText: e.target.value } })}
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                        School Motto (Devanagari / English)
                      </label>
                      <input
                        type="text"
                        value={cmsTree.content?.schoolMotto || 'विद्या ददाति विनयं • Excellence in Education'}
                        onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, schoolMotto: e.target.value } })}
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950"
                      />
                    </div>
                  </div>

                  {/* School Logo with preview & upload */}
                  <div>
                    <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                      School Official Logo URL
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl border-2 border-slate-300 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl ? (
                          <img
                            src={cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-xl">🏛️</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={cmsTree.content?.schoolLogoUrl || ''}
                        onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, schoolLogoUrl: e.target.value } })}
                        placeholder="https://.../logo.png"
                        className="flex-1 bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950"
                      />
                      <label className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black font-mono flex items-center gap-1.5 cursor-pointer shrink-0">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileToBase64(file, (base64) => {
                                setCmsTree({ ...cmsTree, content: { ...cmsTree.content, schoolLogoUrl: base64 } });
                                onShowToast('success', 'Logo Uploaded', file.name);
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section B: Dual Leadership Desk (Principal & Director) */}
                <div className="p-5 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-white rounded-3xl border-2 border-indigo-200 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-200">
                    <div>
                      <span className="text-xs font-mono font-black text-indigo-950 flex items-center gap-2">
                        <span>🎓</span>
                        <span>INSTITUTIONAL LEADERSHIP VISION DESK</span>
                      </span>
                      <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                        Both Principal and Director profiles, photos & inspiring messages rendered on website & app
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-indigo-300 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setLeadershipTab('principal')}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-black transition-all ${
                          leadershipTab === 'principal'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-indigo-900'
                        }`}
                      >
                        👩‍🏫 Principal Desk
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeadershipTab('director')}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-black transition-all ${
                          leadershipTab === 'director'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-purple-900'
                        }`}
                      >
                        👨‍💼 Director / Chairman Desk
                      </button>
                    </div>
                  </div>

                  {/* Principal Tab */}
                  {leadershipTab === 'principal' && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="flex items-start gap-4">
                        <div className="space-y-1.5 shrink-0 text-center">
                          <div className="w-20 h-20 rounded-2xl border-2 border-indigo-300 bg-slate-100 overflow-hidden shadow-md mx-auto">
                            {cmsTree.content?.principalPhotoUrl ? (
                              <img
                                src={cmsTree.content.principalPhotoUrl}
                                alt="Principal"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">👩‍🏫</div>
                            )}
                          </div>
                          <label className="text-[10px] font-mono font-black text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-300 px-2 py-0.5 rounded-lg cursor-pointer inline-block shadow-xs">
                            Upload Photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileToBase64(file, (base64) => {
                                    setCmsTree({ ...cmsTree, content: { ...cmsTree.content, principalPhotoUrl: base64 } });
                                    onShowToast('success', 'Principal Photo Updated', file.name);
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                              Principal Full Name *
                            </label>
                            <input
                              type="text"
                              value={cmsTree.content?.principalName || 'Dr. Ananya Sharma'}
                              onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, principalName: e.target.value } })}
                              placeholder="e.g. Dr. Ananya Sharma"
                              className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-black text-slate-950"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                              Official Designation *
                            </label>
                            <input
                              type="text"
                              value={cmsTree.content?.principalTitle || 'Principal & Head of Academics'}
                              onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, principalTitle: e.target.value } })}
                              placeholder="e.g. Principal & Head of Academics"
                              className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                              Academic Qualifications & Experience
                            </label>
                            <input
                              type="text"
                              value={cmsTree.content?.principalQualifications || 'Ph.D. Education, M.Sc., B.Ed. (22+ Years in CBSE Leadership)'}
                              onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, principalQualifications: e.target.value } })}
                              placeholder="e.g. Ph.D. Education, M.Sc., B.Ed."
                              className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                          Principal's Inspiring Message / Address to Parents & Students *
                        </label>
                        <textarea
                          rows={3}
                          value={cmsTree.content?.principalMessage || ''}
                          onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, principalMessage: e.target.value } })}
                          placeholder="Write inspiring address from Principal's desk..."
                          className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600 shadow-xs leading-relaxed"
                        />
                      </div>

                      {/* Photo Presets for Principal */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-mono font-bold text-slate-600">Sample High-Res Portraits:</span>
                        {[
                          { label: 'Educator 1 (Female)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80' },
                          { label: 'Educator 2 (Female)', url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800&auto=format&fit=crop&q=80' },
                          { label: 'Educator 3 (Male)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80' }
                        ].map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCmsTree({ ...cmsTree, content: { ...cmsTree.content, principalPhotoUrl: p.url } });
                              onShowToast('info', 'Photo Applied', p.label);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-300 text-[10px] font-mono font-bold text-slate-700 shadow-xs cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Director Tab */}
                  {leadershipTab === 'director' && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="flex items-start gap-4">
                        <div className="space-y-1.5 shrink-0 text-center">
                          <div className="w-20 h-20 rounded-2xl border-2 border-purple-300 bg-slate-100 overflow-hidden shadow-md mx-auto">
                            {cmsTree.content?.directorPhotoUrl ? (
                              <img
                                src={cmsTree.content.directorPhotoUrl}
                                alt="Director"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">👨‍💼</div>
                            )}
                          </div>
                          <label className="text-[10px] font-mono font-black text-purple-700 bg-white hover:bg-purple-50 border border-purple-300 px-2 py-0.5 rounded-lg cursor-pointer inline-block shadow-xs">
                            Upload Photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileToBase64(file, (base64) => {
                                    setCmsTree({ ...cmsTree, content: { ...cmsTree.content, directorPhotoUrl: base64 } });
                                    onShowToast('success', 'Director Photo Updated', file.name);
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                              Managing Director / Chairman Full Name *
                            </label>
                            <input
                              type="text"
                              value={cmsTree.content?.directorName || 'Er. Rajesh Dakshora'}
                              onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, directorName: e.target.value } })}
                              placeholder="e.g. Er. Rajesh Dakshora"
                              className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-black text-slate-950"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                              Official Designation *
                            </label>
                            <input
                              type="text"
                              value={cmsTree.content?.directorTitle || 'Managing Director & Founder'}
                              onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, directorTitle: e.target.value } })}
                              placeholder="e.g. Managing Director & Founder"
                              className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                              Professional Background & Qualifications
                            </label>
                            <input
                              type="text"
                              value={cmsTree.content?.directorQualifications || 'B.Tech (IIT Delhi), M.S. (Stanford), Education Futurist'}
                              onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, directorQualifications: e.target.value } })}
                              placeholder="e.g. B.Tech (IIT Delhi), M.S. (Stanford)"
                              className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-950"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                          Director's Strategic Vision & Institutional Commitment *
                        </label>
                        <textarea
                          rows={3}
                          value={cmsTree.content?.directorMessage || ''}
                          onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, directorMessage: e.target.value } })}
                          placeholder="Write visionary message from Director/Chairman..."
                          className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:border-purple-600 shadow-xs leading-relaxed"
                        />
                      </div>

                      {/* Photo Presets for Director */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-mono font-bold text-slate-600">Sample High-Res Portraits:</span>
                        {[
                          { label: 'Director 1 (Male)', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80' },
                          { label: 'Director 2 (Male)', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80' },
                          { label: 'Director 3 (Female)', url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=80' }
                        ].map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCmsTree({ ...cmsTree, content: { ...cmsTree.content, directorPhotoUrl: p.url } });
                              onShowToast('info', 'Photo Applied', p.label);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-white hover:bg-purple-50 border border-slate-300 text-[10px] font-mono font-bold text-slate-700 shadow-xs cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section C: Unified ERP & App Channels */}
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
                  <span className="text-xs font-mono font-black text-slate-950 block">
                    🔗 UNIFIED ERP SSO LOGIN & MOBILE APP DOWNLOAD CTA
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <label className="block font-black text-slate-800 mb-1">
                        ERP Portal Login URL (Website CTA)
                      </label>
                      <input
                        type="text"
                        value={cmsTree.content?.erpLoginUrl || 'https://www.dakshora.co.in/portal'}
                        onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, erpLoginUrl: e.target.value } })}
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 font-bold text-indigo-700"
                      />
                    </div>
                    <div>
                      <label className="block font-black text-slate-800 mb-1">
                        Mobile App APK Download Link (.apk)
                      </label>
                      <input
                        type="text"
                        value={cmsTree.content?.appDownloadUrl || `/api/public/mobile-app/${selectedSiteId}/download`}
                        onChange={(e) => setCmsTree({ ...cmsTree, content: { ...cmsTree.content, appDownloadUrl: e.target.value } })}
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 font-bold text-teal-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* LAYER 7: SEO, OPENGRAPH & SOCIAL SHARING */}
            {/* ========================================================= */}
            {activeLayer === 'seo' && (
              <div className="space-y-5 animate-in fade-in">
                {/* Google Search Live Snippet Preview */}
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-300 space-y-1.5">
                  <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                    Google Search Snippet Preview
                  </span>
                  <div className="text-xs font-mono text-emerald-800">
                    https://{cmsTree.domain?.subdomain || 'school.dakshora.app'}
                  </div>
                  <h4 className="text-base font-bold text-blue-700 hover:underline cursor-pointer">
                    {cmsTree.seo?.metaTitle || 'School Name — Top Ranked CBSE Smart Campus'}
                  </h4>
                  <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                    {cmsTree.seo?.metaDescription || 'Admissions open for Session 2026-27. Explore robotics labs, digital smart classrooms, sports arena & board results.'}
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                      Meta Title (Recommended &lt; 60 chars)
                    </label>
                    <input
                      type="text"
                      value={cmsTree.seo?.metaTitle || ''}
                      onChange={(e) => setCmsTree({ ...cmsTree, seo: { ...cmsTree.seo, metaTitle: e.target.value } })}
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs font-black text-slate-950 focus:outline-none focus:border-indigo-600 shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-mono font-black text-slate-950">
                        Meta Description (Recommended 150-160 chars)
                      </label>
                      <span className={`text-[11px] font-mono font-bold ${
                        (cmsTree.seo?.metaDescription?.length || 0) > 160 ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        {cmsTree.seo?.metaDescription?.length || 0} / 160 chars
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={cmsTree.seo?.metaDescription || ''}
                      onChange={(e) => setCmsTree({ ...cmsTree, seo: { ...cmsTree.seo, metaDescription: e.target.value } })}
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-black text-slate-950 mb-1">
                      OG Social Image URL (WhatsApp/Facebook Preview)
                    </label>
                    <input
                      type="text"
                      value={cmsTree.seo?.ogImage || ''}
                      onChange={(e) => setCmsTree({ ...cmsTree, seo: { ...cmsTree.seo, ogImage: e.target.value } })}
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-950 focus:outline-none focus:border-indigo-600 shadow-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* LAYER 8: MEDIA ASSETS & CDN GALLERY */}
            {/* ========================================================= */}
            {activeLayer === 'media' && (
              <div className="space-y-5 animate-in fade-in">
                {/* 1. Dedicated Home Page 2-4 Animated Slideshow Manager */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                        📸
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-black text-slate-950">
                          Home Page Animated Campus Carousel (होम पेज एनिमेटेड फ़ोटोज़)
                        </h4>
                        <p className="text-[11px] font-mono text-slate-600">
                          होम पेज पर स्वचालित चलने वाली 2-4 स्कूल फ़ोटोज़ (3.5s ऑटो-एनिमेशन)
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-indigo-100 text-indigo-900 border border-indigo-300">
                      {activeCampusSlides.length} Photos Active
                    </span>
                  </div>

                  {/* 2-4 Slides Grid with Direct File Upload & Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {activeCampusSlides.map((slide: any, sIdx: number) => (
                      <div
                        key={slide.id || sIdx}
                        className="p-3 bg-white rounded-2xl border-2 border-slate-300 shadow-sm space-y-2.5"
                      >
                        <div className="relative h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                          <img
                            src={slide.url}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-slate-950/80 text-white backdrop-blur-sm">
                            Slide {sIdx + 1}: {slide.badge || 'Campus'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => {
                              const updated = [...activeCampusSlides];
                              updated[sIdx] = { ...updated[sIdx], title: e.target.value };
                              setCmsTree({
                                ...cmsTree,
                                content: { ...(cmsTree.content || {}), heroSlides: updated }
                              });
                            }}
                            placeholder="फ़ोटो शीर्षक (e.g. Science Lab)"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-black text-slate-950"
                          />

                          <div className="flex items-center gap-2">
                            {/* Upload Local File Button */}
                            <label className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs">
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>फ़ोटो अपलोड करें (PC)</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileToBase64(file, (base64) => {
                                      const updated = [...activeCampusSlides];
                                      updated[sIdx] = { ...updated[sIdx], url: base64 };
                                      setCmsTree({
                                        ...cmsTree,
                                        content: { ...(cmsTree.content || {}), heroSlides: updated }
                                      });
                                      onShowToast('success', `Slide ${sIdx + 1} Photo Updated! 📸`, 'Local photo embedded into home page slideshow.');
                                    });
                                  }
                                }}
                              />
                            </label>

                            {/* Reset / Preset */}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...activeCampusSlides];
                                updated[sIdx] = { ...updated[sIdx], url: DEFAULT_CAMPUS_SLIDES[sIdx % DEFAULT_CAMPUS_SLIDES.length].url };
                                setCmsTree({
                                  ...cmsTree,
                                  content: { ...(cmsTree.content || {}), heroSlides: updated }
                                });
                                onShowToast('info', 'Slide Reset', 'Reverted to default campus photo.');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-bold cursor-pointer"
                              title="Reset to default photo"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-mono font-black text-slate-950">
                    All Media Assets & CDN Storage ({cmsTree.media?.length || 0} Assets)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddMediaModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Media Asset</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {cmsTree.media?.map((med: any) => (
                    <div
                      key={med.id}
                      className="rounded-2xl overflow-hidden bg-white border-2 border-slate-300 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="relative overflow-hidden h-32 bg-slate-100">
                        <img
                          src={med.url}
                          alt={med.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-slate-950/80 text-white backdrop-blur-sm">
                          {med.type}
                        </span>
                      </div>
                      <div className="p-3 bg-white flex items-center justify-between">
                        <div className="truncate pr-2">
                          <span className="text-xs font-black text-slate-950 truncate block">{med.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 truncate block">CDN Cloudflare Active</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(med.url, med.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                            title="Copy URL"
                          >
                            {copiedKey === med.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(med.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Media Modal */}
                {showAddMediaModal && (
                  <div className="p-4 bg-purple-50/70 rounded-2xl border-2 border-purple-200 space-y-3">
                    <h4 className="text-xs font-mono font-black text-purple-950">Add Media File to Gallery</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Asset Name *</label>
                        <input
                          type="text"
                          value={newMediaName}
                          onChange={(e) => setNewMediaName(e.target.value)}
                          placeholder="e.g. Olympic Sports Arena"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-950"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Tag / Category</label>
                        <select
                          value={newMediaType}
                          onChange={(e) => setNewMediaType(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-950"
                        >
                          <option value="Campus">Campus Infrastructure</option>
                          <option value="Labs">Robotics & Labs</option>
                          <option value="Sports">Sports Complex</option>
                          <option value="Academic">Classrooms & Library</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Image URL *</label>
                      <input
                        type="text"
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-950 font-mono"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddMediaModal(false)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddMedia}
                        className="px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold font-mono"
                      >
                        Add to CDN
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* LAYER 9: PUBLISHING ENGINE */}
            {/* ========================================================= */}
            {activeLayer === 'publishing' && (
              <div className="space-y-5 animate-in fade-in">
                {/* Production Edge CDN Status Card */}
                <div className="p-5 bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-2xl border-2 border-emerald-300 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-emerald-950 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                      <span>PRODUCTION RELEASE STATUS</span>
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-emerald-600 text-white shadow-xs">
                      v{cmsTree.publishing?.version || 1} LIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                      <span className="text-slate-500 text-[10px] block">LIVE STATUS</span>
                      <span className="font-black text-emerald-700 uppercase">{cmsTree.publishing?.status || 'live'}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                      <span className="text-slate-500 text-[10px] block">BUILD VERSION</span>
                      <span className="font-black text-slate-950">v{cmsTree.publishing?.version || 1}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                      <span className="text-slate-500 text-[10px] block">EDGE CDN</span>
                      <span className="font-black text-indigo-700">{cmsTree.publishing?.cdnDeployment || 'Edge CDN Active'}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                      <span className="text-slate-500 text-[10px] block">SSL CERTIFICATE</span>
                      <span className="font-black text-emerald-700">TLS 1.3 Active</span>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-slate-600 pt-1">
                    Last deployed: <strong>{new Date(cmsTree.publishing?.lastPublishedAt || Date.now()).toLocaleString()}</strong>
                  </div>
                </div>

                {/* 1-Click Publish Action */}
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:brightness-110 text-white font-black text-sm font-mono shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {isPublishing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                  <span>{isPublishing ? 'Deploying to Edge Cloud CDN...' : 'Publish Latest Build (1-Click)'}</span>
                </button>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* LAYER 10: WEBSITE INTEGRATION & ERP UNIFIED PORTAL */}
            {/* ------------------------------------------------------------- */}
            {activeLayer === 'website_integration' && (
              <div className="space-y-5 animate-in fade-in">
                {/* School Website Live Endpoint & SSO Card */}
                <div className="p-5 bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl border-2 border-blue-300 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-blue-950 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>LIVE SCHOOL WEBSITE & ERP SSO LOGIN</span>
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-blue-600 text-white shadow-xs">
                      PORTAL CONNECTED
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-600">
                    Your institutional public website automatically routes to the unified Dakshora ERP login portal with multi-role access (Admin, Teachers, Parents, Students, Accountant).
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-1">
                      <span className="text-slate-500 text-[10px] block font-bold">PUBLIC SCHOOL WEBSITE</span>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-blue-700 truncate">
                          https://{cmsTree?.website_integration?.subdomain || currentSite?.domain || 'school.dakshora.app'}
                        </span>
                        <a
                          href={`https://${cmsTree?.website_integration?.subdomain || currentSite?.domain || 'school.dakshora.app'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-1">
                      <span className="text-slate-500 text-[10px] block font-bold">ERP MULTI-ROLE LOGIN PORTAL</span>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-indigo-700 truncate">
                          https://{cmsTree?.website_integration?.subdomain || currentSite?.domain || 'school.dakshora.app'}/login
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowFullScreenLivePortal(true)}
                          className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]"
                        >
                          Open Portal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DNS Records & SSL Status */}
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>DNS RECORDS & AUTOMATIC SSL STATUS</span>
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Auto-TLS 1.3 Active
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-2">Type</th>
                          <th className="p-2">Host</th>
                          <th className="p-2">Target Value</th>
                          <th className="p-2">TTL</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        <tr>
                          <td className="p-2 font-bold text-indigo-600">CNAME</td>
                          <td className="p-2 font-mono">@</td>
                          <td className="p-2 font-mono text-slate-700">cname.school.dakshora.app</td>
                          <td className="p-2 text-slate-500">3600</td>
                          <td className="p-2"><span className="text-emerald-600 font-bold">Active ✓</span></td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-purple-600">TXT</td>
                          <td className="p-2 font-mono">_dakshora-verify</td>
                          <td className="p-2 font-mono text-slate-700">dakshora-domain-verification={currentSite?.id?.slice(0, 8)}</td>
                          <td className="p-2 text-slate-500">3600</td>
                          <td className="p-2"><span className="text-emerald-600 font-bold">Verified ✓</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Custom Domain Input */}
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
                  <label className="text-xs font-mono font-black text-slate-900 block">
                    CUSTOM DOMAIN BINDING (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. www.idealpublicschool.com"
                      value={cmsTree?.domain?.customDomain || ''}
                      onChange={(e) => {
                        setCmsTree({
                          ...cmsTree,
                          domain: { ...(cmsTree?.domain || {}), customDomain: e.target.value }
                        });
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCmsTree}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-mono font-bold"
                    >
                      Verify & Bind
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Point your domain CNAME record to <code>cname.school.dakshora.app</code>. SSL certificate is auto-provisioned via Let's Encrypt.
                  </p>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* LAYER 11: WHITE-LABEL BRANDED MOBILE APP */}
            {/* ------------------------------------------------------------- */}
            {activeLayer === 'mobile_app' && (
              <div className="space-y-6 animate-in fade-in">
                {/* 3-in-1 Architecture Showcase */}
                <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border-2 border-indigo-500/40 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-500 text-slate-950 flex items-center justify-center font-black">
                        ⚡
                      </div>
                      <div>
                        <h4 className="text-sm font-black font-mono tracking-tight text-white">
                          UNIFIED 3-IN-1 MULTI-CHANNEL ARCHITECTURE
                        </h4>
                        <p className="text-[11px] font-mono text-cyan-300">
                          Single Unified Database • Zero Data Redundancy • Instant Cross-Channel Sync
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Live Cloud Sync Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                      <div className="flex items-center gap-2 text-cyan-400 font-black">
                        <Globe className="w-4 h-4" />
                        <span>CHANNEL 1: PUBLIC CMS</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Ultra-modern school website, Principal & Director vision, admissions CRM lead engine & edge CDN caching.
                      </p>
                    </div>

                    <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-400 font-black">
                        <ShieldCheck className="w-4 h-4" />
                        <span>CHANNEL 2: SCHOOL ERP</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        17 Core institutional modules: biometric attendance, fees, CBSE marksheets, timetable & teacher workload.
                      </p>
                    </div>

                    <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-black">
                        <Smartphone className="w-4 h-4" />
                        <span>CHANNEL 3: BRANDED APP</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Role-based Android APK & PWA for Parents, Teachers & Principal with real-time push notices & bus GPS.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Phone Simulator with Role Switcher */}
                <div className="p-5 bg-white rounded-3xl border-2 border-slate-300 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-mono font-black text-slate-950 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-teal-600" />
                        <span>INTERACTIVE ROLE-BASED MOBILE APP SIMULATOR</span>
                      </h4>
                      <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                        Test how the school's mobile app adapts dynamically to each institutional role
                      </p>
                    </div>

                    {/* Role Switcher Pills */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-300">
                      <button
                        type="button"
                        onClick={() => setMobilePreviewRole('parent')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-all ${
                          mobilePreviewRole === 'parent'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-700 hover:text-emerald-800'
                        }`}
                      >
                        👨‍👩‍👧 Parent Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobilePreviewRole('teacher')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-all ${
                          mobilePreviewRole === 'teacher'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-700 hover:text-indigo-800'
                        }`}
                      >
                        👨‍🏫 Teacher Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobilePreviewRole('principal')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-all ${
                          mobilePreviewRole === 'principal'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-700 hover:text-purple-800'
                        }`}
                      >
                        🏫 Principal Mode
                      </button>
                    </div>
                  </div>

                  {/* Simulated Mobile Phone Screen */}
                  <div className="max-w-sm mx-auto bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800">
                    {/* Speaker notch */}
                    <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
                      <div className="w-8 h-1.5 bg-slate-700 rounded-full" />
                    </div>

                    <div className="bg-slate-50 rounded-[28px] overflow-hidden p-4 space-y-3.5 min-h-[380px] text-slate-900 font-sans">
                      {/* App Bar */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                            🏛️
                          </div>
                          <div>
                            <div className="font-black text-xs text-slate-900 truncate max-w-[150px]">
                              {cmsTree?.mobile_app?.appName || currentSite?.name || 'School App'}
                            </div>
                            <div className="text-[9px] font-mono text-teal-700 font-bold uppercase">
                              {mobilePreviewRole === 'parent' ? '👨‍👩‍👧 Ward Pulse' : mobilePreviewRole === 'teacher' ? '👨‍🏫 Teacher Desk' : '🏫 Principal Cockpit'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-black">
                          ● Online
                        </span>
                      </div>

                      {/* Parent Role Screen */}
                      {mobilePreviewRole === 'parent' && (
                        <div className="space-y-2.5 text-xs animate-in fade-in">
                          <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-sm space-y-1">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider opacity-90">Ward: Aarav Sharma (Class 10-A)</span>
                            <div className="flex items-center justify-between">
                              <span className="font-black text-lg">96.4% Attendance</span>
                              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">Present Today</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                              <span className="text-slate-500 block text-[9px]">FEE STATUS</span>
                              <span className="font-black text-emerald-700">₹0 Due (Paid)</span>
                            </div>
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                              <span className="text-slate-500 block text-[9px]">DIARY HOMEWORK</span>
                              <span className="font-black text-slate-800">2 Pending</span>
                            </div>
                          </div>

                          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                            <span className="text-[10px] font-mono font-bold text-amber-900 flex items-center gap-1">
                              <span>🚌</span>
                              <span>Live School Bus GPS Tracking</span>
                            </span>
                            <div className="text-[11px] font-bold text-slate-800">
                              Bus #04 • Near Knowledge Park Ring Road
                            </div>
                            <span className="text-[9px] font-mono text-emerald-700 font-bold block">
                              ETA at Drop Stop: 8 mins
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Teacher Role Screen */}
                      {mobilePreviewRole === 'teacher' && (
                        <div className="space-y-2.5 text-xs animate-in fade-in">
                          <div className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl shadow-sm space-y-1">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider opacity-90">Faculty: Vikramaditya Singh</span>
                            <div className="flex items-center justify-between">
                              <span className="font-black text-base">Class 10-A (Science)</span>
                              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">Period 3</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                              <span className="text-slate-500 block text-[9px]">ATTENDANCE TODAY</span>
                              <span className="font-black text-indigo-700">42 / 45 Marked</span>
                            </div>
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                              <span className="text-slate-500 block text-[9px]">MARKS ENTRY</span>
                              <span className="font-black text-emerald-700">CBSE Term-1 Ready</span>
                            </div>
                          </div>

                          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-[11px] font-mono space-y-1">
                            <span className="font-bold text-indigo-950 block">⚡ Quick Actions</span>
                            <div className="flex gap-2">
                              <span className="px-2 py-1 bg-white rounded-lg border border-indigo-200 font-bold text-indigo-800 text-[10px]">
                                + Assign Homework
                              </span>
                              <span className="px-2 py-1 bg-white rounded-lg border border-indigo-200 font-bold text-indigo-800 text-[10px]">
                                📢 Push Notice
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Principal Role Screen */}
                      {mobilePreviewRole === 'principal' && (
                        <div className="space-y-2.5 text-xs animate-in fade-in">
                          <div className="p-3 bg-gradient-to-r from-purple-700 to-indigo-800 text-white rounded-2xl shadow-sm space-y-1">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider opacity-90">Leadership: Dr. Ananya Sharma</span>
                            <div className="flex items-center justify-between">
                              <span className="font-black text-base">Daily Campus Pulse</span>
                              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">100% Operational</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                              <span className="text-slate-500 block text-[9px]">ENROLLED STUDENTS</span>
                              <span className="font-black text-purple-800">120 Scholars</span>
                            </div>
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                              <span className="text-slate-500 block text-[9px]">TEACHING STAFF</span>
                              <span className="font-black text-purple-800">19 / 20 Present</span>
                            </div>
                          </div>

                          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 space-y-1 text-[11px] font-mono">
                            <span className="text-[10px] font-bold text-purple-900 block">TODAY'S FEE COLLECTION</span>
                            <div className="font-black text-slate-900 text-sm">₹4,85,000 (UPI & NetBanking)</div>
                            <span className="text-[9px] text-emerald-700 font-bold">14 Online Admission Leads Received</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* APK Download & Direct Distribution */}
                <div className="p-5 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 rounded-3xl text-white space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-black">
                          AUTOMATIC APK BUILD GENERATOR
                        </span>
                        <span className="text-xs text-teal-200 font-mono font-bold">v2.1.0 Ready</span>
                      </div>
                      <h4 className="text-base font-black font-mono mt-1">Download Branded Android APK (.apk)</h4>
                      <p className="text-xs text-teal-100 font-medium mt-0.5">
                        Build artifacts ready for parent/student sideloading, QR scan distribution, or Google Play Console release.
                      </p>
                    </div>

                    <a
                      href={`/api/public/mobile-app/${currentSite?.id || 'demo'}/download`}
                      download={`${currentSite?.name || 'School'}_v2.1.0.apk`}
                      onClick={() => onShowToast('success', 'Mobile App Download Started!', 'Generating signed white-label APK bundle.')}
                      className="px-6 py-3.5 bg-white hover:bg-slate-100 text-teal-950 font-black font-mono text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-all hover:scale-105"
                    >
                      <Download className="w-4 h-4 text-teal-700" />
                      <span>Download APK (Release v2.1.0)</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Global Save Layer Changes Button */}
            <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-mono font-bold text-slate-600">
                Changes synchronize across all 11 CMS architectural layers
              </span>
              <button
                type="button"
                onClick={handleSaveCmsTree}
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black font-mono shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Layer Changes</span>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* RIGHT: LIVE REAL-TIME CMS PREVIEW (5 cols) */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border-2 border-slate-300 shadow-xl space-y-4 sticky top-24">
            {/* Browser Window Chrome */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-xs font-mono font-black text-slate-900 ml-1">Live CMS Preview</span>
              </div>

              {/* Viewport switchers */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg ${previewDevice === 'desktop' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                  title="Desktop"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-lg ${previewDevice === 'tablet' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                  title="Tablet"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg ${previewDevice === 'mobile' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}
                  title="Mobile"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* URL bar */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-mono font-bold text-slate-700">
              <span className="truncate">https://{cmsTree.domain?.subdomain || 'school.dakshora.app'}</span>
              <button
                type="button"
                onClick={() => setShowFullScreenLivePortal(true)}
                className="text-indigo-600 hover:text-indigo-800 ml-2 shrink-0 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                title="Launch Full Live Portal"
              >
                <span>Launch Live</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Realistic School Website Preview Container */}
            <div
              className={`rounded-2xl border-2 border-slate-200 overflow-hidden shadow-inner bg-slate-50 transition-all mx-auto ${
                previewDevice === 'mobile'
                  ? 'max-w-[320px]'
                  : previewDevice === 'tablet'
                  ? 'max-w-[440px]'
                  : 'w-full'
              }`}
              style={{ fontFamily: cmsTree.template?.fontFamily || 'inherit' }}
            >
              {/* Simulated School Header */}
              <div
                className="px-4 py-2.5 text-white flex items-center justify-between"
                style={{ backgroundColor: cmsTree.template?.themeColor || '#4F46E5' }}
              >
                <div className="flex items-center gap-2">
                  {cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl ? (
                    <img
                      src={cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl}
                      alt="Logo"
                      className="w-6 h-6 rounded-lg object-contain bg-white p-0.5 border border-white/40 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">
                      🏛️
                    </div>
                  )}
                  <span className="font-black text-xs truncate max-w-[160px]">{cmsTree.name}</span>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono">
                  {cmsTree.pages?.slice(0, 3).map((p: any) => (
                    <span key={p.id} className="opacity-90 hover:opacity-100">{p.title}</span>
                  ))}
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-950 shrink-0">
                  Apply 2026
                </span>
              </div>

              {/* Simulated Hero Section */}
              <div
                className="p-5 text-white space-y-2 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${cmsTree.template?.themeColor || '#4F46E5'} 0%, #1E1B4B 100%)`
                }}
              >
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black bg-white/20 text-white backdrop-blur-sm">
                  {cmsTree.template?.id || 'CBSE Heritage'}
                </span>
                <h4 className="text-base sm:text-lg font-black leading-tight text-white">
                  {cmsTree.content?.heroHeadline || `Welcome to ${cmsTree.name}`}
                </h4>
                <p className="text-xs text-white/90 leading-relaxed line-clamp-2">
                  {cmsTree.content?.heroSubheadline}
                </p>
                <div className="pt-1">
                  <span
                    className="inline-block px-3 py-1 rounded-lg text-xs font-black shadow-md cursor-pointer"
                    style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
                  >
                    {cmsTree.content?.ctaText || 'Apply for Admission'} →
                  </span>
                </div>
              </div>

              {/* Simulated 2-4 Animated Photos Slideshow */}
              <div className="relative h-28 bg-slate-900 overflow-hidden border-y border-slate-800">
                <img
                  src={activeCampusSlides[previewCarouselIdx % activeCampusSlides.length]?.url}
                  alt="Campus Slide"
                  className="w-full h-full object-cover transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white font-mono">
                  <span className="bg-slate-950/85 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Animated {((previewCarouselIdx % activeCampusSlides.length) + 1)}/{activeCampusSlides.length}: {activeCampusSlides[previewCarouselIdx % activeCampusSlides.length]?.badge || 'Campus'}
                  </span>
                  <span className="text-[9px] text-indigo-300 font-bold">Auto 3.5s</span>
                </div>
              </div>

              {/* Simulated Dual Leadership Desk (Principal & Director) */}
              <div className="p-4 bg-white border-y border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-indigo-900 uppercase tracking-wider">
                    Institutional Leadership Vision Desk
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-500">CBSE Affiliated</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {/* Principal Card */}
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg border border-indigo-300 bg-white overflow-hidden shrink-0">
                        {cmsTree.content?.principalPhotoUrl ? (
                          <img
                            src={cmsTree.content.principalPhotoUrl}
                            alt="Principal"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">👩‍🏫</div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-black text-[11px] text-slate-900 truncate">
                          {cmsTree.content?.principalName || 'Dr. Ananya Sharma'}
                        </div>
                        <div className="text-[9px] font-mono text-indigo-700 font-bold truncate">
                          {cmsTree.content?.principalTitle || 'Principal & Academics'}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-700 italic leading-snug line-clamp-2">
                      "{cmsTree.content?.principalMessage || 'Our vision is to empower young minds with scientific innovation and timeless ethical character.'}"
                    </p>
                  </div>

                  {/* Director Card */}
                  <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg border border-purple-300 bg-white overflow-hidden shrink-0">
                        {cmsTree.content?.directorPhotoUrl ? (
                          <img
                            src={cmsTree.content.directorPhotoUrl}
                            alt="Director"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">👨‍💼</div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-black text-[11px] text-slate-900 truncate">
                          {cmsTree.content?.directorName || 'Er. Rajesh Dakshora'}
                        </div>
                        <div className="text-[9px] font-mono text-purple-700 font-bold truncate">
                          {cmsTree.content?.directorTitle || 'Managing Director'}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-700 italic leading-snug line-clamp-2">
                      "{cmsTree.content?.directorMessage || 'Dakshora 2.0 unifies digital governance, transparent learning, and holistic excellence.'}"
                    </p>
                  </div>
                </div>

                {/* Simulated Channels CTA (ERP Login & App Download) */}
                <div className="pt-1 flex items-center gap-2">
                  <span className="flex-1 text-center py-1.5 px-2 rounded-lg bg-indigo-600 text-white font-mono text-[10px] font-black cursor-pointer shadow-xs">
                    🔐 ERP Login
                  </span>
                  <span className="flex-1 text-center py-1.5 px-2 rounded-lg bg-teal-600 text-white font-mono text-[10px] font-black cursor-pointer shadow-xs">
                    📥 Parent App (.apk)
                  </span>
                </div>
              </div>

              {/* Simulated Sections Indicator */}
              <div className="p-3 bg-slate-100 flex flex-wrap gap-1.5 text-[9px] font-mono font-bold text-slate-700">
                <span className="text-slate-500">Active Sections:</span>
                {cmsTree.sections?.filter((s: any) => s.isEnabled !== false).map((s: any) => (
                  <span key={s.id} className="bg-white px-1.5 py-0.5 rounded border border-slate-300">
                    {s.title}
                  </span>
                ))}
              </div>

              {/* Simulated Footer */}
              <div className="p-3 bg-slate-900 text-white text-[10px] font-mono flex items-center justify-between">
                <span>SEO: {cmsTree.seo?.metaTitle?.slice(0, 20)}...</span>
                <span className="text-emerald-400 font-bold">v{cmsTree.publishing?.version || 1} Live Edge</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: PROVISION NEW WEBSITE PORTAL */}
      {/* ========================================================================= */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  🌐
                </div>
                <h3 className="text-base font-black text-slate-950 font-mono">Provision New School Web Portal</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-500 hover:text-slate-950 font-mono text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-950 font-black mb-1">School Website Name *</label>
                <input
                  type="text"
                  value={newSiteName}
                  onChange={(e) => {
                    setNewSiteName(e.target.value);
                    setNewSiteDomain(`${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}.dakshora.app`);
                  }}
                  placeholder="e.g. Tagore Public Senior Secondary Academy"
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-950 font-black mb-1">Primary Subdomain *</label>
                <input
                  type="text"
                  value={newSiteDomain}
                  onChange={(e) => setNewSiteDomain(e.target.value)}
                  placeholder="e.g. tagore-academy.dakshora.app"
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-indigo-700 font-black focus:outline-none focus:border-indigo-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-950 font-black mb-1">Assigned Template</label>
                <select
                  value={newSiteTemplate}
                  onChange={(e) => setNewSiteTemplate(e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 shadow-xs"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-black shadow-md shadow-indigo-600/30"
                >
                  {isCreating ? 'Provisioning...' : 'Provision Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: FULL-SCREEN LIVE SCHOOL WEB PORTAL */}
      {/* ========================================================================= */}
      {showFullScreenLivePortal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col p-2 sm:p-4 overflow-hidden animate-in fade-in">
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-2xl flex-1 flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <div className="px-5 py-3 border-b-2 border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE SCHOOL PORTAL ACTIVE
                </span>
                <span className="text-xs font-mono font-bold text-slate-300 hidden md:inline">
                  https://{cmsTree?.domain?.subdomain || 'heritage-vidyapeeth.dakshora.app'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDnsHelpModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Custom Domain / DNS Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullScreenLivePortal(false)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Close Portal</span>
                </button>
              </div>
            </div>

            {/* Scrollable Live Portal */}
            <div className="flex-1 overflow-y-auto">
              <SchoolPublicWebsiteView
                cmsTree={cmsTree}
                onClose={() => setShowFullScreenLivePortal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: DNS & CUSTOM DOMAIN SETUP GUIDE */}
      {/* ========================================================================= */}
      {showDnsHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  🌐
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950 font-mono">Live Domain & DNS Configuration</h3>
                  <p className="text-[11px] font-mono text-slate-600">"This site can't be reached" समाधान और रियल डोमेन सेटअप</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDnsHelpModal(false)}
                className="text-slate-500 hover:text-slate-950 font-mono text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono text-slate-800 leading-relaxed">
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-1.5">
                <span className="font-black text-amber-950 flex items-center gap-1.5 text-xs">
                  ⚠️ Chrome "This site can't be reached" (ERR_NAME_NOT_RESOLVED) क्यों आता है?
                </span>
                <p className="text-amber-900 text-[11px]">
                  जब आप सीधे ब्राउज़र में <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">{cmsTree?.domain?.subdomain || 'heritage-vidyapeeth.dakshora.app'}</code> खोलते हैं, तो इंटरनेट के सार्वजनिक DNS सर्वर (ISP / Telecom) को यह डोमेन तब तक नहीं मिलता जब तक कि लाइव पब्लिक DNS (GoDaddy/Cloudflare) पर CNAME रिकॉर्ड न जुड़ा हो।
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-black text-slate-950 block">✅ 2 तरीके से लाइव वेबसाइट का तुरंत उपयोग करें:</span>
                
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                  <div className="font-bold text-indigo-950 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-center text-xs flex items-center justify-center">1</span>
                    <span>In-App Live Web Portal (तुरंत लाइव देखें व चलाएं)</span>
                  </div>
                  <p className="text-[11px] text-indigo-900 pl-7">
                    ऊपर <strong>"Launch Live Web Portal (लाइव देखें)"</strong> बटन दबाएं। यह पूरा पब्लिक स्कूल पोर्टल, लाइव एडमिशन फॉर्म (Lead CRM) और AI स्कूल काउंसलर को बिना किसी DNS सेटअप के तुरंत 100% लाइव चलाता है।
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-950 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-center text-xs flex items-center justify-center">2</span>
                    <span>Real School Custom Domain (स्कूल का अपना डोमेन)</span>
                  </div>
                  <p className="text-[11px] text-emerald-900 pl-7">
                    स्कूल के अपने डोमेन (उदा. <code className="bg-emerald-100 px-1 py-0.5 rounded font-bold">www.yourschool.com</code>) के DNS में यह CNAME जोड़ें:
                  </p>
                  <div className="pl-7 pt-1 font-mono text-[10px] bg-slate-900 text-emerald-300 p-2 rounded-lg">
                    Type: CNAME &nbsp;|&nbsp; Host: www &nbsp;|&nbsp; Value: cname.dakshora.app
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowDnsHelpModal(false);
                    setShowFullScreenLivePortal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs font-mono shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  🚀 Launch Live Portal Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: QUICK UPLOAD SCHOOL LOGO & HOME CAMPUS PICS */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  🚀
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950 font-mono">
                    Upload School Logo & Campus Photos (लोगो व फ़ोटो अपलोड)
                  </h3>
                  <p className="text-[11px] font-mono text-slate-600">
                    कंप्यूटर से सीधे फ़ाइल चुनें — तुरंत पोर्टल व होम पेज पर लाइव दिखेगा
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tab switchers: Logo vs Carousel Pics */}
            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-300 shrink-0 font-mono text-xs font-black">
              <button
                type="button"
                onClick={() => setUploadModalTab('logo')}
                className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  uploadModalTab === 'logo'
                    ? 'bg-white text-purple-950 shadow-md border border-purple-200'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <span>🎨 1. School Logo (स्कूल लोगो)</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadModalTab('carousel')}
                className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  uploadModalTab === 'carousel'
                    ? 'bg-white text-indigo-950 shadow-md border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <span>📸 2. Home Page 2-4 Pics (एनिमेटेड फ़ोटोज़)</span>
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {uploadModalTab === 'logo' ? (
                /* TAB 1: SCHOOL LOGO UPLOADER */
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-white border-2 border-purple-300 shadow-md flex items-center justify-center overflow-hidden shrink-0 p-1.5">
                      {cmsTree?.content?.schoolLogoUrl || cmsTree?.branding?.logoUrl ? (
                        <img
                          src={cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl}
                          alt="School Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-4xl text-slate-400">🏛️</div>
                      )}
                    </div>

                    <div className="space-y-2 text-center sm:text-left flex-1">
                      <div className="font-black text-slate-950 text-sm">
                        {cmsTree?.name || 'School Name'} Official Logo
                      </div>
                      <p className="text-[11px] text-slate-600">
                        PNG, JPG, SVG, WEBP फॉर्मेट समर्थित (Max 5MB). यह लोगो वेबसाइट के ऊपरी नेवबार, हेडर, एडमिशन फॉर्म और फुटर में दिखेगा।
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                        <label className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-2">
                          <UploadCloud className="w-4 h-4" />
                          <span>कंप्यूटर से लोगो चुनें (Upload Logo)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileToBase64(file, (base64) => {
                                  setCmsTree({
                                    ...cmsTree,
                                    branding: { ...(cmsTree.branding || {}), logoUrl: base64 },
                                    content: { ...(cmsTree.content || {}), schoolLogoUrl: base64 }
                                  });
                                  onShowToast('success', 'Logo Uploaded! 🎨', 'School logo saved.');
                                });
                              }
                            }}
                          />
                        </label>

                        {(cmsTree?.content?.schoolLogoUrl || cmsTree?.branding?.logoUrl) && (
                          <button
                            type="button"
                            onClick={() => {
                              setCmsTree({
                                ...cmsTree,
                                branding: { ...(cmsTree.branding || {}), logoUrl: '' },
                                content: { ...(cmsTree.content || {}), schoolLogoUrl: '' }
                              });
                              onShowToast('info', 'Logo Reset', 'Reverted to default emblem.');
                            }}
                            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-rose-600 border border-slate-300 font-bold text-xs cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-950 font-black mb-1">
                      या ऑनलाइन लोगो इमेज URL पेस्ट करें:
                    </label>
                    <input
                      type="text"
                      value={cmsTree?.content?.schoolLogoUrl || cmsTree?.branding?.logoUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCmsTree({
                          ...cmsTree,
                          branding: { ...(cmsTree.branding || {}), logoUrl: val },
                          content: { ...(cmsTree.content || {}), schoolLogoUrl: val }
                        });
                      }}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs font-black text-slate-950 focus:outline-none focus:border-purple-600 shadow-xs"
                    />
                  </div>
                </div>
              ) : (
                /* TAB 2: HOME PAGE 2-4 ANIMATED CAROUSEL PICS */
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-black text-indigo-950 block">
                        होम पेज पर 2 से 4 फ़ोटोज़ का स्वचालित स्लाइडर (Auto 3.5s)
                      </span>
                      <span className="text-[11px] text-indigo-800">
                        प्रत्येक कार्ड पर "फ़ोटो बदलें" दबाकर अपने स्कूल के फ़ोटोज़ अपलोड करें
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-black text-[11px]">
                      {activeCampusSlides.length} Photos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {activeCampusSlides.map((slide: any, sIdx: number) => (
                      <div
                        key={slide.id || sIdx}
                        className="p-3 bg-slate-50 rounded-2xl border-2 border-slate-300 shadow-sm space-y-2.5"
                      >
                        <div className="relative h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-300">
                          <img
                            src={slide.url}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-slate-950/80 text-white backdrop-blur-sm">
                            Photo {sIdx + 1}: {slide.badge || 'Campus'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => {
                              const updated = [...activeCampusSlides];
                              updated[sIdx] = { ...updated[sIdx], title: e.target.value };
                              setCmsTree({
                                ...cmsTree,
                                content: { ...(cmsTree.content || {}), heroSlides: updated }
                              });
                            }}
                            placeholder="फ़ोटो शीर्षक (e.g. Science Lab)"
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-black text-slate-950"
                          />

                          <div className="flex items-center gap-2">
                            <label className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs">
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>फ़ोटो बदलें (Upload)</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileToBase64(file, (base64) => {
                                      const updated = [...activeCampusSlides];
                                      updated[sIdx] = { ...updated[sIdx], url: base64 };
                                      setCmsTree({
                                        ...cmsTree,
                                        content: { ...(cmsTree.content || {}), heroSlides: updated }
                                      });
                                      onShowToast('success', `Photo ${sIdx + 1} Updated! 📸`, 'Saved to home page slideshow.');
                                    });
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...activeCampusSlides];
                                updated[sIdx] = { ...updated[sIdx], url: DEFAULT_CAMPUS_SLIDES[sIdx % DEFAULT_CAMPUS_SLIDES.length].url };
                                setCmsTree({
                                  ...cmsTree,
                                  content: { ...(cmsTree.content || {}), heroSlides: updated }
                                });
                                onShowToast('info', 'Slide Reset', 'Reverted to default photo.');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-mono text-[11px] font-bold cursor-pointer"
                              title="Reset to default photo"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setShowFullScreenLivePortal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-200" />
                <span>Test in Live Portal (लाइव देखें)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs font-black cursor-pointer"
              >
                Done (पूर्ण)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
