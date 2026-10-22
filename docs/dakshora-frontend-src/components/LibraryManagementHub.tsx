import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Library,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Coins,
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Calendar,
  Layers,
  Settings,
  Bookmark,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Check,
  X,
  User,
  GraduationCap,
  Briefcase,
  Sliders,
  DollarSign,
  TrendingUp,
  Download,
  AlertCircle,
  FileText,
  RotateCcw
} from 'lucide-react';
import {
  ErpLibraryBook,
  ErpLibraryBookCopy,
  ErpLibraryCategory,
  ErpLibraryAuthor,
  ErpLibraryPublisher,
  ErpLibraryMember,
  ErpLibraryTransaction,
  ErpLibraryReservation,
  ErpLibraryFine,
  ErpLibrarySettings,
  ErpLibraryOverview,
  ErpRole
} from '../types';
import {
  fetchErpLibraryOverview,
  fetchErpLibraryBooks,
  createErpLibraryBook,
  updateErpLibraryBook,
  archiveErpLibraryBook,
  fetchErpLibraryBookCopies,
  createErpLibraryBookCopy,
  updateErpLibraryBookCopy,
  fetchErpLibraryCategories,
  createErpLibraryCategory,
  updateErpLibraryCategory,
  fetchErpLibraryAuthors,
  createErpLibraryAuthor,
  fetchErpLibraryPublishers,
  createErpLibraryPublisher,
  fetchErpLibraryMembers,
  fetchErpLibraryMember,
  issueErpLibraryBook,
  returnErpLibraryBook,
  renewErpLibraryBook,
  fetchErpLibraryTransactions,
  fetchErpLibraryReservations,
  createErpLibraryReservation,
  cancelErpLibraryReservation,
  fetchErpLibraryFines,
  payErpLibraryFine,
  waiveErpLibraryFine,
  fetchErpLibrarySettings,
  updateErpLibrarySettings,
  triggerErpLibraryDueReminders,
  fetchErpLibraryReport
} from '../services/api';

interface LibraryManagementHubProps {
  activeOrg?: any;
  activeSession?: string;
  activeRole?: ErpRole;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

type LibraryTab =
  | 'dashboard'
  | 'books'
  | 'copies'
  | 'categories'
  | 'authors_publishers'
  | 'members'
  | 'issue_return'
  | 'reservations'
  | 'fines'
  | 'reports_settings';

export const LibraryManagementHub: React.FC<LibraryManagementHubProps> = ({
  activeOrg,
  activeSession = '2026-27',
  activeRole = 'admin',
  onShowToast: propShowToast
}) => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Core data states
  const [overview, setOverview] = useState<ErpLibraryOverview | null>(null);
  const [books, setBooks] = useState<ErpLibraryBook[]>([]);
  const [bookPagination, setBookPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [categories, setCategories] = useState<ErpLibraryCategory[]>([]);
  const [authors, setAuthors] = useState<ErpLibraryAuthor[]>([]);
  const [publishers, setPublishers] = useState<ErpLibraryPublisher[]>([]);
  const [members, setMembers] = useState<ErpLibraryMember[]>([]);
  const [transactions, setTransactions] = useState<ErpLibraryTransaction[]>([]);
  const [reservations, setReservations] = useState<ErpLibraryReservation[]>([]);
  const [fines, setFines] = useState<ErpLibraryFine[]>([]);
  const [settings, setSettings] = useState<ErpLibrarySettings | null>(null);

  // Filters & Search
  const [bookSearch, setBookSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState('all');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');
  const [fineStatusFilter, setFineStatusFilter] = useState('all');

  // Modals & Drawers
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showEditBookModal, setShowEditBookModal] = useState(false);
  const [selectedBookForEdit, setSelectedBookForEdit] = useState<ErpLibraryBook | null>(null);
  const [showBookDetailsDrawer, setShowBookDetailsDrawer] = useState(false);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<ErpLibraryBook | null>(null);
  const [bookCopies, setBookCopies] = useState<ErpLibraryBookCopy[]>([]);

  const [showAddCopyModal, setShowAddCopyModal] = useState(false);
  const [selectedBookForAddCopy, setSelectedBookForAddCopy] = useState<ErpLibraryBook | null>(null);

  const [showMemberDrawer, setShowMemberDrawer] = useState(false);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<ErpLibraryMember | null>(null);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddAuthorModal, setShowAddAuthorModal] = useState(false);
  const [showAddPublisherModal, setShowAddPublisherModal] = useState(false);
  const [showPayFineModal, setShowPayFineModal] = useState(false);
  const [selectedFineForAction, setSelectedFineForAction] = useState<ErpLibraryFine | null>(null);
  const [showWaiveFineModal, setShowWaiveFineModal] = useState(false);

  // Issue / Return Desk States
  const [deskSubTab, setDeskSubTab] = useState<'issue' | 'return' | 'renew'>('issue');
  const [selectedIssueMember, setSelectedIssueMember] = useState<string>('');
  const [selectedIssueBook, setSelectedIssueBook] = useState<string>('');
  const [selectedIssueCopy, setSelectedIssueCopy] = useState<string>('');
  const [issueDueDate, setIssueDueDate] = useState<string>('');
  const [issueRemarks, setIssueRemarks] = useState<string>('');
  const [quickAccessionReturn, setQuickAccessionReturn] = useState<string>('');
  const [returnCondition, setReturnCondition] = useState<string>('good');
  const [returnRemarks, setReturnRemarks] = useState<string>('');
  const [returnCollectFine, setReturnCollectFine] = useState<boolean>(true);

  // Forms
  const [newBookForm, setNewBookForm] = useState({
    title: '',
    subtitle: '',
    isbn: '',
    author: '',
    publisher: '',
    category: 'Sciences',
    edition: '1st Edition',
    publicationYear: 2026,
    language: 'English',
    subject: '',
    description: '',
    pages: 350,
    shelfLocation: 'Rack A-1',
    copiesCount: 2,
    acquisitionCost: 500
  });

  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', code: '', description: '' });
  const [newAuthorForm, setNewAuthorForm] = useState({ name: '', biography: '' });
  const [newPublisherForm, setNewPublisherForm] = useState({ name: '', contactEmail: '', website: '' });
  const [newCopyForm, setNewCopyForm] = useState({ accessionNumber: '', barcode: '', condition: 'good', acquisitionCost: 500, shelfLocation: '', notes: '' });
  const [finePaymentForm, setFinePaymentForm] = useState({ paymentMethod: 'cash', notes: '' });
  const [fineWaiveForm, setFineWaiveForm] = useState({ waivedBy: 'Chief Librarian', reason: 'Administrative waiver / Medical leave' });

  // Reports sub-tab
  const [reportSubTab, setReportSubTab] = useState<'books' | 'issues' | 'overdue' | 'fines' | 'inventory' | 'settings'>('books');
  const [reportData, setReportData] = useState<any>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    if (propShowToast) {
      propShowToast(type, message);
    } else {
      setToast({ type, message });
      setTimeout(() => setToast(null), 3500);
    }
  };

  // Load Overview Data
  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await fetchErpLibraryOverview();
      if (res.data?.success) {
        setOverview(res.data as any);
      }
    } catch {
      showToast('error', 'Failed to load library overview metrics');
    } finally {
      setLoading(false);
    }
  };

  // Load Books
  const loadBooks = async (page = 1) => {
    try {
      const res = await fetchErpLibraryBooks({
        search: bookSearch || undefined,
        category: selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined,
        availability: selectedAvailabilityFilter !== 'all' ? selectedAvailabilityFilter : undefined,
        page,
        limit: 15
      });
      if (res.data?.books) {
        setBooks(res.data.books);
        if (res.data.pagination) {
          setBookPagination(res.data.pagination);
        }
      }
    } catch {}
  };

  // Load Categories & Masters
  const loadMasters = async () => {
    try {
      const [catsRes, authsRes, pubsRes, setsRes] = await Promise.all([
        fetchErpLibraryCategories(),
        fetchErpLibraryAuthors(),
        fetchErpLibraryPublishers(),
        fetchErpLibrarySettings()
      ]);
      if (catsRes.data?.categories) setCategories(catsRes.data.categories);
      if (authsRes.data?.authors) setAuthors(authsRes.data.authors);
      if (pubsRes.data?.publishers) setPublishers(pubsRes.data.publishers);
      if (setsRes.data?.settings) setSettings(setsRes.data.settings);
    } catch {}
  };

  // Load Members
  const loadMembers = async () => {
    try {
      const res = await fetchErpLibraryMembers({
        search: memberSearch || undefined,
        type: memberTypeFilter !== 'all' ? memberTypeFilter : undefined
      });
      if (res.data?.members) {
        setMembers(res.data.members);
      }
    } catch {}
  };

  // Load Transactions
  const loadTransactions = async () => {
    try {
      const res = await fetchErpLibraryTransactions({
        search: transactionSearch || undefined,
        status: transactionStatusFilter !== 'all' ? transactionStatusFilter : undefined,
        limit: 50
      });
      if (res.data?.transactions) {
        setTransactions(res.data.transactions);
      }
    } catch {}
  };

  // Load Reservations & Fines
  const loadReservationsAndFines = async () => {
    try {
      const [resRes, fineRes] = await Promise.all([
        fetchErpLibraryReservations(),
        fetchErpLibraryFines({ status: fineStatusFilter !== 'all' ? fineStatusFilter : undefined })
      ]);
      if (resRes.data?.reservations) setReservations(resRes.data.reservations);
      if (fineRes.data?.fines) setFines(fineRes.data.fines);
    } catch {}
  };

  useEffect(() => {
    loadOverview();
    loadBooks(1);
    loadMasters();
    loadMembers();
    loadTransactions();
    loadReservationsAndFines();
  }, [activeOrg]);

  useEffect(() => {
    if (activeTab === 'books') loadBooks(1);
    if (activeTab === 'members') loadMembers();
    if (activeTab === 'issue_return' || activeTab === 'copies') {
      loadBooks(1);
      loadMembers();
      loadTransactions();
    }
    if (activeTab === 'reservations' || activeTab === 'fines') loadReservationsAndFines();
    if (activeTab === 'dashboard') loadOverview();
  }, [activeTab]);

  // Handle Add Book Submit
  const handleAddBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookForm.title.trim()) {
      showToast('error', 'Book Title is required');
      return;
    }
    try {
      const res = await createErpLibraryBook(newBookForm);
      if (res.data?.success) {
        showToast('success', res.data.message || 'Book added to catalog');
        setShowAddBookModal(false);
        loadBooks(1);
        loadOverview();
        setNewBookForm({
          title: '',
          subtitle: '',
          isbn: '',
          author: '',
          publisher: '',
          category: 'Sciences',
          edition: '1st Edition',
          publicationYear: 2026,
          language: 'English',
          subject: '',
          description: '',
          pages: 350,
          shelfLocation: 'Rack A-1',
          copiesCount: 2,
          acquisitionCost: 500
        });
      } else {
        showToast('error', res.data?.message || 'Failed to add book');
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Error creating book');
    }
  };

  // Handle View Book Details & Copies
  const handleViewBookDetails = async (book: ErpLibraryBook) => {
    setSelectedBookForDetails(book);
    setShowBookDetailsDrawer(true);
    try {
      const res = await fetchErpLibraryBookCopies(book.id);
      if (res.data?.copies) {
        setBookCopies(res.data.copies);
      }
    } catch {}
  };

  // Handle Add Physical Copy
  const handleAddCopySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForAddCopy || !newCopyForm.accessionNumber.trim()) {
      showToast('error', 'Accession Number is required');
      return;
    }
    try {
      const res = await createErpLibraryBookCopy(selectedBookForAddCopy.id, { ...newCopyForm, condition: newCopyForm.condition as any });
      if (res.data?.success) {
        showToast('success', 'Physical copy registered successfully');
        setShowAddCopyModal(false);
        setNewCopyForm({ accessionNumber: '', barcode: '', condition: 'good', acquisitionCost: 500, shelfLocation: '', notes: '' });
        loadBooks(bookPagination.page);
        if (selectedBookForDetails && selectedBookForDetails.id === selectedBookForAddCopy.id) {
          handleViewBookDetails(selectedBookForDetails);
        }
      } else {
        showToast('error', res.data?.message || 'Failed to add copy');
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Error registering copy');
    }
  };

  // Handle Fast Issue Book
  const handleIssueBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueMember) {
      showToast('error', 'Please select a borrower member');
      return;
    }
    if (!selectedIssueBook && !selectedIssueCopy) {
      showToast('error', 'Please select a book or available copy');
      return;
    }

    const member = members.find(m => m.id === selectedIssueMember);
    try {
      const res = await issueErpLibraryBook({
        memberType: member?.memberType || 'student',
        memberId: selectedIssueMember,
        bookId: selectedIssueBook || undefined,
        bookCopyId: selectedIssueCopy || undefined,
        dueDate: issueDueDate || undefined,
        remarks: issueRemarks || undefined
      });
      if (res.data?.success) {
        showToast('success', res.data.message || 'Book issued successfully');
        setSelectedIssueBook('');
        setSelectedIssueCopy('');
        setIssueRemarks('');
        loadTransactions();
        loadBooks(1);
        loadMembers();
        loadOverview();
      } else {
        showToast('error', res.data?.message || 'Failed to issue book');
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Error issuing book');
    }
  };

  // Handle Fast Return Book
  const handleReturnBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAccessionReturn.trim()) {
      showToast('error', 'Please enter accession number or barcode');
      return;
    }

    // Find active transaction matching accession number
    const activeTx = transactions.find(
      t => (t.status === 'issued' || t.status === 'overdue') &&
      t.accessionNumber.toLowerCase() === quickAccessionReturn.trim().toLowerCase()
    );

    if (!activeTx) {
      showToast('error', `No active loan found for Accession Number: ${quickAccessionReturn}`);
      return;
    }

    try {
      const res = await returnErpLibraryBook(activeTx.id, {
        condition: returnCondition,
        remarks: returnRemarks,
        finePaid: returnCollectFine
      });
      if (res.data?.success) {
        showToast('success', res.data.message || 'Book returned successfully');
        setQuickAccessionReturn('');
        setReturnRemarks('');
        loadTransactions();
        loadBooks(1);
        loadReservationsAndFines();
        loadOverview();
      } else {
        showToast('error', res.data?.message || 'Failed to return book');
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Error returning book');
    }
  };

  // Handle Renew Book
  const handleRenewBook = async (transactionId: string) => {
    try {
      const res = await renewErpLibraryBook(transactionId);
      if (res.data?.success) {
        showToast('success', res.data.message || 'Book renewed');
        loadTransactions();
        loadOverview();
      } else {
        showToast('error', res.data?.message || 'Failed to renew');
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Error renewing book');
    }
  };

  // Handle Pay Fine
  const handlePayFineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFineForAction) return;
    try {
      const res = await payErpLibraryFine(selectedFineForAction.id, finePaymentForm);
      if (res.data?.success) {
        showToast('success', res.data.message || 'Fine payment recorded');
        setShowPayFineModal(false);
        loadReservationsAndFines();
        loadOverview();
      } else {
        showToast('error', res.data?.message || 'Failed to record fine payment');
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Error processing fine payment');
    }
  };

  // Handle Waive Fine
  const handleWaiveFineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFineForAction) return;
    try {
      const res = await waiveErpLibraryFine(selectedFineForAction.id, fineWaiveForm);
      if (res.data?.success) {
        showToast('success', res.data.message || 'Fine waived successfully');
        setShowWaiveFineModal(false);
        loadReservationsAndFines();
        loadOverview();
      } else {
        showToast('error', res.data?.message || 'Failed to waive fine');
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Error waiving fine');
    }
  };

  // Handle Trigger Due Reminders
  const handleTriggerDueReminders = async () => {
    try {
      const res = await triggerErpLibraryDueReminders();
      if (res.data?.success) {
        showToast('success', res.data.message || 'Due reminders dispatched to members');
      }
    } catch {
      showToast('error', 'Failed to dispatch due reminders');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-xs font-mono border shadow-2xl flex items-center gap-3 animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-rose-500/20'
              : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                CBSE Central Library Suite
              </span>
              <span className="text-slate-500 text-xs font-mono">• Academic Session {activeSession}</span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Library className="w-7 h-7 text-indigo-400" />
              <span>Library Management & Circulation</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Automated accessioning, physical copy lifecycle, fast issue/return desk, fine ledger, and borrower portals.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                loadOverview();
                loadBooks(1);
                showToast('info', 'Refreshing live library state...');
              }}
              className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Sync Live</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('issue_return');
                setDeskSubTab('issue');
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Issue Desk</span>
            </button>
            {['admin', 'teacher'].includes(activeRole) && (
              <button
                onClick={() => setShowAddBookModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Book</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none font-mono text-xs">
        {[
          { id: 'dashboard', label: 'Overview & KPIs', icon: TrendingUp },
          { id: 'books', label: 'Book Catalogue', icon: BookOpen },
          { id: 'copies', label: 'Book Copies', icon: Copy },
          { id: 'categories', label: 'Categories', icon: Layers },
          { id: 'authors_publishers', label: 'Authors & Pubs', icon: Users },
          { id: 'members', label: 'Borrower Members', icon: GraduationCap },
          { id: 'issue_return', label: 'Issue / Return Desk', icon: Bookmark },
          { id: 'reservations', label: 'Reservations', icon: Clock },
          { id: 'fines', label: 'Fines Ledger', icon: Coins },
          { id: 'reports_settings', label: 'Reports & Settings', icon: Sliders }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as LibraryTab)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && overview && (
        <div className="space-y-6">
          {/* 8 Real KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Total Titles</span>
              </div>
              <div className="text-2xl font-bold text-white">{overview.metrics.totalBooks}</div>
              <div className="text-[10px] text-cyan-400">In Catalogue</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Total Copies</span>
              </div>
              <div className="text-2xl font-bold text-white">{overview.metrics.totalCopies}</div>
              <div className="text-[10px] text-indigo-400">Accessioned</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Available</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">{overview.metrics.availableCopies}</div>
              <div className="text-[10px] text-slate-400">On Shelves</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>Issued</span>
              </div>
              <div className="text-2xl font-bold text-amber-400">{overview.metrics.issuedBooks}</div>
              <div className="text-[10px] text-slate-400">Circulating</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Overdue</span>
              </div>
              <div className="text-2xl font-bold text-rose-400">{overview.metrics.overdueBooks}</div>
              <div className="text-[10px] text-rose-400/80">Action Req.</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Reserved</span>
              </div>
              <div className="text-2xl font-bold text-purple-300">{overview.metrics.reservedBooks}</div>
              <div className="text-[10px] text-slate-400">In Queue</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-orange-400" />
                <span>Fine Due</span>
              </div>
              <div className="text-2xl font-bold text-orange-400">₹{overview.metrics.outstandingFines}</div>
              <div className="text-[10px] text-slate-400">Outstanding</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Borrowers</span>
              </div>
              <div className="text-2xl font-bold text-white">{overview.metrics.activeMembers}</div>
              <div className="text-[10px] text-sky-400">Active Readers</div>
            </div>
          </div>

          {/* Circulation Progress & Quick Due Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Fleet Circulation Rate
                </span>
                <span className="text-cyan-400 font-bold">{overview.metrics.circulationRatePercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, overview.metrics.circulationRatePercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Issued: {overview.metrics.issuedBooks} copies</span>
                <span>Available: {overview.metrics.availableCopies} copies</span>
              </div>
            </div>

            {/* Overdue Alert Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-950/40 to-slate-950 border border-rose-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{overview.metrics.overdueBooks} Books Overdue</span>
                </div>
                <button
                  onClick={handleTriggerDueReminders}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                >
                  Send Reminders
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Overdue items generate automated fines of ₹5/day beyond the 1-day grace period. Dispatches in-app notifications to parents & students.
              </p>
              <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                <span>Outstanding library fines pending: ₹{overview.metrics.outstandingFines}</span>
              </div>
            </div>

            {/* Fine Summary Ledger */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Circulation Fine Ledger
                </span>
                <span className="text-[10px] text-slate-500">{overview.fineSummary.totalRecords} records</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Collected</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">₹{overview.fineSummary.totalFinesCollected}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Due</div>
                  <div className="text-sm font-bold text-orange-400 mt-0.5">₹{overview.fineSummary.totalOutstanding}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Waived</div>
                  <div className="text-sm font-bold text-purple-300 mt-0.5">₹{overview.fineSummary.totalWaived}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Books & Recent Issues */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
            {/* Popular Books */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Most Borrowed Titles (CBSE Reading Leaderboard)
                </span>
                <span className="text-[10px] text-slate-500">Calculated from Real Loans</span>
              </div>

              <div className="space-y-3">
                {overview.popularBooks.map((b, idx) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-white">{b.title}</div>
                        <div className="text-[10px] text-slate-400">{b.author} • {b.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {b.circulationCount || 0} issues
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">{b.availableCopies} available</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Issues Feed */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  Recent Issues & Returns Stream
                </span>
                <button
                  onClick={() => setActiveTab('issue_return')}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  View All Desk
                </button>
              </div>

              <div className="space-y-3">
                {overview.recentIssues.slice(0, 4).map(tx => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{tx.bookTitle}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300">
                          {tx.accessionNumber}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Issued to: <span className="text-cyan-300">{tx.memberName}</span> ({tx.memberIdentifier})
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'issued'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                            : tx.status === 'overdue'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {tx.status.toUpperCase()}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Due: {new Date(tx.dueAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BOOK CATALOGUE */}
      {/* ========================================================================= */}
      {activeTab === 'books' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search titles, ISBN, authors, shelves..."
                  value={bookSearch}
                  onChange={e => {
                    setBookSearch(e.target.value);
                  }}
                  onKeyDown={e => e.key === 'Enter' && loadBooks(1)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={e => {
                  setSelectedCategoryFilter(e.target.value);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedAvailabilityFilter}
                onChange={e => setSelectedAvailabilityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
              >
                <option value="all">All Availability</option>
                <option value="available">Available on Shelf</option>
                <option value="unavailable">All Copies Issued</option>
              </select>

              <button
                onClick={() => loadBooks(1)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddBookModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Book Title</span>
              </button>
            </div>
          </div>

          {/* Books Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] text-slate-400 font-bold">
                    <th className="p-3.5">Title & Edition</th>
                    <th className="p-3.5">Author</th>
                    <th className="p-3.5">Category & Subject</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Stock (Available / Total)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {books.map(b => (
                    <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={b.coverImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                            alt={b.title}
                            className="w-10 h-14 object-cover rounded-lg border border-slate-800 shadow-sm shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white text-xs">{b.title}</div>
                            {b.subtitle && <div className="text-[10px] text-slate-500 line-clamp-1">{b.subtitle}</div>}
                            <div className="text-[10px] text-slate-500 mt-0.5">ISBN: {b.isbn} • {b.edition}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300 font-medium">{b.author}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                          {b.category}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">{b.subject || 'Core Subject'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-cyan-400 font-bold">{b.shelfLocation}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              b.availableCopies > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {b.availableCopies}
                          </span>
                          <span className="text-slate-500">/ {b.totalCopies}</span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                b.availableCopies > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${(b.availableCopies / Math.max(1, b.totalCopies)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === 'active'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          {b.status ? b.status.toUpperCase() : 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewBookDetails(b)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                            title="View Copies & Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBookForAddCopy(b);
                              setShowAddCopyModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30"
                            title="Add Physical Copy"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIssueBook(b.id);
                              setActiveTab('issue_return');
                              setDeskSubTab('issue');
                            }}
                            disabled={b.availableCopies === 0}
                            className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 disabled:opacity-30 text-cyan-300 border border-cyan-500/30"
                            title="Issue this book"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {books.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No books matching current search and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-3.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Showing {books.length} of {bookPagination.total} titles</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => loadBooks(Math.max(1, bookPagination.page - 1))}
                  disabled={bookPagination.page <= 1}
                  className="px-2.5 py-1 rounded bg-slate-900 disabled:opacity-40 border border-slate-800"
                >
                  Prev
                </button>
                <span className="px-2 font-bold text-white">Page {bookPagination.page} of {bookPagination.totalPages || 1}</span>
                <button
                  onClick={() => loadBooks(Math.min(bookPagination.totalPages, bookPagination.page + 1))}
                  disabled={bookPagination.page >= bookPagination.totalPages}
                  className="px-2.5 py-1 rounded bg-slate-900 disabled:opacity-40 border border-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BOOK COPIES */}
      {/* ========================================================================= */}
      {activeTab === 'copies' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Physical Accession Ledger</h3>
              <p className="text-slate-400 text-[11px]">Individual copies with barcode tracking, condition, and status.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] text-slate-400 font-bold">
                    <th className="p-3.5">Accession Number</th>
                    <th className="p-3.5">Barcode</th>
                    <th className="p-3.5">Book Title</th>
                    <th className="p-3.5">Copy #</th>
                    <th className="p-3.5">Condition</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {books.flatMap(b => (b.copies || []).map(c => ({ ...c, bookTitle: b.title }))).map(copy => (
                    <tr key={copy.id} className="hover:bg-slate-900/40">
                      <td className="p-3.5 font-bold text-cyan-300">{copy.accessionNumber}</td>
                      <td className="p-3.5 text-slate-400">{copy.barcode || '-'}</td>
                      <td className="p-3.5 font-bold text-white">{copy.bookTitle}</td>
                      <td className="p-3.5">Copy #{copy.copyNumber}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-800">
                          {copy.condition.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{copy.shelfLocation || '-'}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            copy.status === 'available'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : copy.status === 'issued'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {copy.status.toUpperCase()}
                        </span>
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
      {/* TAB 4: CATEGORIES */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Library Classification Categories</h3>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                    {cat.code}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">ACTIVE</span>
                </div>
                <h4 className="font-bold text-white text-sm mt-1">{cat.name}</h4>
                <p className="text-slate-400 text-[11px] line-clamp-2">{cat.description || 'General study category'}</p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Titles in Category:</span>
                  <span className="text-white font-bold">{cat.bookCount || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUTHORS & PUBLISHERS */}
      {/* ========================================================================= */}
      {activeTab === 'authors_publishers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
          {/* Authors List */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Registered Authors
              </span>
              <button
                onClick={() => setShowAddAuthorModal(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Author</span>
              </button>
            </div>
            <div className="space-y-3">
              {authors.map(a => (
                <div key={a.id} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-white">{a.name}</div>
                  <div className="text-slate-400 text-[11px]">{a.biography || 'Literary Author'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Publishers List */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Registered Publishers
              </span>
              <button
                onClick={() => setShowAddPublisherModal(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Publisher</span>
              </button>
            </div>
            <div className="space-y-3">
              {publishers.map(p => (
                <div key={p.id} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-slate-400 text-[11px]">
                    {p.contactEmail && <span>Email: {p.contactEmail}</span>}
                    {p.website && <span className="ml-2">• {p.website}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: MEMBERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Search & Filter */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member by name, admission no, employee id..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadMembers()}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={memberTypeFilter}
                onChange={e => setMemberTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              >
                <option value="all">All Member Types</option>
                <option value="student">Students Only</option>
                <option value="teacher">Faculty Only</option>
                <option value="staff">Staff Only</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] text-slate-400 font-bold">
                    <th className="p-3.5">Borrower Member</th>
                    <th className="p-3.5">Identifier</th>
                    <th className="p-3.5">Type & Grade</th>
                    <th className="p-3.5">Active Loans / Limit</th>
                    <th className="p-3.5">Overdue Loans</th>
                    <th className="p-3.5">Outstanding Fine</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-slate-900/40">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{m.name}</div>
                        <div className="text-[10px] text-slate-500">{m.email || m.phone || 'DPS Heritage School'}</div>
                      </td>
                      <td className="p-3.5 font-bold text-cyan-300">{m.identifier}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.memberType === 'student'
                              ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {m.memberType.toUpperCase()}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {m.classGrade ? `${m.classGrade} - ${m.section}` : m.designation || 'Staff'}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-white">{m.currentIssuedCount}</span> of {m.maxAllowedBooks} Books
                      </td>
                      <td className="p-3.5">
                        {m.overdueCount > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                            {m.overdueCount} OVERDUE
                          </span>
                        ) : (
                          <span className="text-emerald-400">0 Overdue</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {m.outstandingFine > 0 ? (
                          <span className="font-bold text-orange-400">₹{m.outstandingFine}</span>
                        ) : (
                          <span className="text-slate-500">Nil</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedIssueMember(m.id);
                              setActiveTab('issue_return');
                              setDeskSubTab('issue');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 text-[11px]"
                          >
                            Issue Book
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetchErpLibraryMember(m.id, m.memberType === 'student' ? 'student' : 'staff');
                                if (res.data?.member) {
                                  setSelectedMemberDetails(res.data.member);
                                  setShowMemberDrawer(true);
                                }
                              } catch {}
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="View Reader Ledger"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
      {/* TAB 7: ISSUE / RETURN WORKFLOW DESK */}
      {/* ========================================================================= */}
      {activeTab === 'issue_return' && (
        <div className="space-y-6 font-mono text-xs">
          {/* Sub Tab Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 w-fit">
            <button
              onClick={() => setDeskSubTab('issue')}
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                deskSubTab === 'issue' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Issue Book (New Loan)
            </button>
            <button
              onClick={() => setDeskSubTab('return')}
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                deskSubTab === 'return' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Return Book (Quick Scan)
            </button>
            <button
              onClick={() => setDeskSubTab('renew')}
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                deskSubTab === 'renew' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Renew Loans
            </button>
          </div>

          {/* Issue Tab Form */}
          {deskSubTab === 'issue' && (
            <form onSubmit={handleIssueBookSubmit} className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-cyan-400" />
                Issue Book to Student or Faculty Member
              </h3>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400">Select Borrower Member *</label>
                <select
                  value={selectedIssueMember}
                  onChange={e => setSelectedIssueMember(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
                >
                  <option value="">-- Choose Student or Staff Member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.identifier}) • {m.memberType.toUpperCase()} • {m.currentIssuedCount}/{m.maxAllowedBooks} Books
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400">Select Book Title *</label>
                <select
                  value={selectedIssueBook}
                  onChange={e => {
                    setSelectedIssueBook(e.target.value);
                    setSelectedIssueCopy('');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
                >
                  <option value="">-- Choose Book from Catalogue --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id} disabled={b.availableCopies === 0}>
                      {b.title} by {b.author} ({b.availableCopies} available of {b.totalCopies})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400">Due Date (Defaults to standard loan period)</label>
                  <input
                    type="date"
                    value={issueDueDate}
                    onChange={e => setIssueDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400">Circulation Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. CBSE Project reference loan"
                    value={issueRemarks}
                    onChange={e => setIssueRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 mt-2"
              >
                <Check className="w-4 h-4" />
                <span>Complete Issue Transaction</span>
              </button>
            </form>
          )}

          {/* Return Tab Form */}
          {deskSubTab === 'return' && (
            <form onSubmit={handleReturnBookSubmit} className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                Fast Accession / Barcode Return Desk
              </h3>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400">Accession Number or Barcode *</label>
                <input
                  type="text"
                  placeholder="e.g. ACC-1001, ACC-1007..."
                  value={quickAccessionReturn}
                  onChange={e => setQuickAccessionReturn(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400">Physical Return Condition</label>
                  <select
                    value={returnCondition}
                    onChange={e => setReturnCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  >
                    <option value="good">Good (Ready for shelf)</option>
                    <option value="new">New (Pristine)</option>
                    <option value="fair">Fair (Minor wear)</option>
                    <option value="damaged">Damaged (Requires binding)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400">Remarks / Condition Notes</label>
                  <input
                    type="text"
                    placeholder="Optional return notes"
                    value={returnRemarks}
                    onChange={e => setReturnRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <input
                  type="checkbox"
                  id="collectFine"
                  checked={returnCollectFine}
                  onChange={e => setReturnCollectFine(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                />
                <label htmlFor="collectFine" className="text-slate-300 text-[11px] cursor-pointer">
                  Mark overdue fine as collected in cash immediately at desk (if applicable)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Return & Restore Shelf Availability</span>
              </button>
            </form>
          )}

          {/* Renew Tab */}
          {deskSubTab === 'renew' && (
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Active Loans Renewal Station
              </h3>

              <div className="divide-y divide-slate-800">
                {transactions
                  .filter(t => t.status === 'issued' || t.status === 'overdue')
                  .map(tx => (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-white">{tx.bookTitle}</div>
                        <div className="text-[11px] text-slate-400">
                          Borrower: <span className="text-cyan-300">{tx.memberName}</span> ({tx.memberIdentifier}) • Accession: {tx.accessionNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Current Due: {new Date(tx.dueAt).toLocaleDateString('en-IN')} • Renewals used: {tx.renewalCount} of 2
                        </div>
                      </div>

                      <button
                        onClick={() => handleRenewBook(tx.id)}
                        disabled={tx.renewalCount >= 2}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Renew (+14 Days)</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: RESERVATIONS QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'reservations' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Title Reservation Queue</h3>
              <p className="text-slate-400 text-[11px]">When a returned copy arrives, the next eligible reservation is automatically placed on 48h hold.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] text-slate-400 font-bold">
                    <th className="p-3.5">Queue Priority</th>
                    <th className="p-3.5">Book Title</th>
                    <th className="p-3.5">Reserving Member</th>
                    <th className="p-3.5">Requested At</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {reservations.map(res => (
                    <tr key={res.id} className="hover:bg-slate-900/40">
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                          #{res.priorityOrder}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-white">{res.bookTitle}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-cyan-300">{res.memberName}</div>
                        <div className="text-[10px] text-slate-500">{res.memberIdentifier}</div>
                      </td>
                      <td className="p-3.5 text-slate-400">{new Date(res.requestedAt).toLocaleDateString('en-IN')}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            res.status === 'ready'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          {res.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {res.status === 'pending' && (
                          <button
                            onClick={async () => {
                              try {
                                const cRes = await cancelErpLibraryReservation(res.id);
                                if (cRes.data?.success) {
                                  showToast('success', 'Reservation cancelled');
                                  loadReservationsAndFines();
                                }
                              } catch {}
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px]"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No active book reservations in the queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: FINES LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'fines' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Circulation Fines & Penalties</h3>
              <p className="text-slate-400 text-[11px]">Independent overdue and book replacement fees ledger.</p>
            </div>

            <select
              value={fineStatusFilter}
              onChange={e => {
                setFineStatusFilter(e.target.value);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
            >
              <option value="all">All Fines</option>
              <option value="outstanding">Outstanding Due</option>
              <option value="paid">Paid Fines</option>
              <option value="waived">Waived Fines</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] text-slate-400 font-bold">
                    <th className="p-3.5">Member</th>
                    <th className="p-3.5">Book Title</th>
                    <th className="p-3.5">Reason & Overdue</th>
                    <th className="p-3.5">Fine Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {fines.map(f => (
                    <tr key={f.id} className="hover:bg-slate-900/40">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{f.memberName}</div>
                        <div className="text-[10px] text-slate-500">{f.memberIdentifier}</div>
                      </td>
                      <td className="p-3.5 font-bold text-white">{f.bookTitle}</td>
                      <td className="p-3.5 text-slate-400">
                        <span>{f.reason.toUpperCase()}</span>
                        {f.overdueDays ? <span className="ml-1">({f.overdueDays} days overdue)</span> : null}
                      </td>
                      <td className="p-3.5 font-bold text-orange-400 text-sm">₹{f.amount}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.status === 'paid'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : f.status === 'outstanding'
                              ? 'bg-orange-950 text-orange-300 border border-orange-500/30'
                              : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {f.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {f.status === 'outstanding' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedFineForAction(f);
                                setShowPayFineModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 font-bold"
                            >
                              Collect Cash
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFineForAction(f);
                                setShowWaiveFineModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold"
                            >
                              Waive
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {fines.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No fines matching filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: REPORTS & SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'reports_settings' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'books', label: 'Books Catalogue Audit' },
              { id: 'issues', label: 'Circulation Audit' },
              { id: 'overdue', label: 'Overdue Audit' },
              { id: 'fines', label: 'Fines Report' },
              { id: 'inventory', label: 'Copy Conditions' },
              { id: 'settings', label: 'Circulation Rules & Policies' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setReportSubTab(sub.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-colors ${
                  reportSubTab === sub.id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Settings Sub-Tab */}
          {reportSubTab === 'settings' && settings && (
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                Library Circulation Rules & Policies Configuration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400">Max Books per Student</label>
                  <input
                    type="number"
                    value={settings.maxBooksStudent}
                    onChange={e => setSettings({ ...settings, maxBooksStudent: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400">Max Books per Faculty / Staff</label>
                  <input
                    type="number"
                    value={settings.maxBooksStaff}
                    onChange={e => setSettings({ ...settings, maxBooksStaff: parseInt(e.target.value, 10) || 10 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400">Student Loan Period (Days)</label>
                  <input
                    type="number"
                    value={settings.loanPeriodStudentDays}
                    onChange={e => setSettings({ ...settings, loanPeriodStudentDays: parseInt(e.target.value, 10) || 14 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400">Faculty Loan Period (Days)</label>
                  <input
                    type="number"
                    value={settings.loanPeriodStaffDays}
                    onChange={e => setSettings({ ...settings, loanPeriodStaffDays: parseInt(e.target.value, 10) || 30 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400">Fine per Day (₹)</label>
                  <input
                    type="number"
                    value={settings.finePerDay}
                    onChange={e => setSettings({ ...settings, finePerDay: parseFloat(e.target.value) || 5 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400">Grace Period (Days before fine)</label>
                  <input
                    type="number"
                    value={settings.gracePeriodDays}
                    onChange={e => setSettings({ ...settings, gracePeriodDays: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await updateErpLibrarySettings(settings);
                      if (res.data?.success) {
                        showToast('success', 'Library circulation rules saved successfully');
                      }
                    } catch {
                      showToast('error', 'Failed to save rules');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Save Circulation Policies
                </button>
              </div>
            </div>
          )}

          {/* Report Sub-tabs Display */}
          {reportSubTab !== 'settings' && (
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">
                  {reportSubTab === 'books' && 'CBSE Book Catalogue Circulation Audit'}
                  {reportSubTab === 'issues' && 'Chronological Issue & Return Audit Trail'}
                  {reportSubTab === 'overdue' && 'Overdue Recovery Action List'}
                  {reportSubTab === 'fines' && 'Fine Collection Ledger'}
                  {reportSubTab === 'inventory' && 'Copy Conditions & Stock Audit'}
                </h4>
                <button
                  onClick={() => {
                    showToast('info', 'Exporting CSV file...');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
              <p className="text-slate-400 text-[11px]">Audit reports derive from immutable system logs and real circulation state.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD BOOK */}
      {/* ========================================================================= */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 font-mono text-xs my-8 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Register New Book Title in Catalogue</span>
              </h3>
              <button onClick={() => setShowAddBookModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBookSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-400">Book Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Higher Engineering Mathematics"
                    value={newBookForm.title}
                    onChange={e => setNewBookForm({ ...newBookForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Author Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. B.S. Grewal"
                    value={newBookForm.author}
                    onChange={e => setNewBookForm({ ...newBookForm, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">ISBN Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 978-8174091955"
                    value={newBookForm.isbn}
                    onChange={e => setNewBookForm({ ...newBookForm, isbn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Category</label>
                  <select
                    value={newBookForm.category}
                    onChange={e => setNewBookForm({ ...newBookForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Shelf Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Rack M-3 (Math)"
                    value={newBookForm.shelfLocation}
                    onChange={e => setNewBookForm({ ...newBookForm, shelfLocation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Initial Copies to Accession</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newBookForm.copiesCount}
                    onChange={e => setNewBookForm({ ...newBookForm, copiesCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Cost per Copy (₹)</label>
                  <input
                    type="number"
                    value={newBookForm.acquisitionCost}
                    onChange={e => setNewBookForm({ ...newBookForm, acquisitionCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Add Title & Generate Copies
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PHYSICAL COPY */}
      {/* ========================================================================= */}
      {showAddCopyModal && selectedBookForAddCopy && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 font-mono text-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Add Physical Copy</h3>
              <button onClick={() => setShowAddCopyModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              Registering new accession copy for: <span className="text-white font-bold">{selectedBookForAddCopy.title}</span>
            </div>

            <form onSubmit={handleAddCopySubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400">Accession Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ACC-2045"
                  value={newCopyForm.accessionNumber}
                  onChange={e => setNewCopyForm({ ...newCopyForm, accessionNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Barcode</label>
                <input
                  type="text"
                  placeholder="Optional barcode number"
                  value={newCopyForm.barcode}
                  onChange={e => setNewCopyForm({ ...newCopyForm, barcode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Condition</label>
                <select
                  value={newCopyForm.condition}
                  onChange={e => setNewCopyForm({ ...newCopyForm, condition: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCopyModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Register Copy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: BOOK DETAILS & COPIES */}
      {/* ========================================================================= */}
      {showBookDetailsDrawer && selectedBookForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">{selectedBookForDetails.title}</h3>
                <p className="text-slate-500 text-[10px]">ISBN: {selectedBookForDetails.isbn}</p>
              </div>
              <button onClick={() => setShowBookDetailsDrawer(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div>Author: <span className="text-white font-bold">{selectedBookForDetails.author}</span></div>
              <div>Category: <span className="text-indigo-300 font-bold">{selectedBookForDetails.category}</span></div>
              <div>Shelf: <span className="text-cyan-300 font-bold">{selectedBookForDetails.shelfLocation}</span></div>
              <div>Total Copies: <span className="text-white font-bold">{selectedBookForDetails.totalCopies}</span></div>
              <div>Available: <span className="text-emerald-400 font-bold">{selectedBookForDetails.availableCopies}</span></div>
              <div>Status: <span className="text-white font-bold">{selectedBookForDetails.status}</span></div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs">Physical Copies ({bookCopies.length})</h4>
                <button
                  onClick={() => {
                    setSelectedBookForAddCopy(selectedBookForDetails);
                    setShowAddCopyModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Copy</span>
                </button>
              </div>

              <div className="space-y-2">
                {bookCopies.map(c => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-cyan-300">{c.accessionNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        Copy #{c.copyNumber} • Condition: {c.condition}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'available'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAY FINE */}
      {/* ========================================================================= */}
      {showPayFineModal && selectedFineForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 font-mono text-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Collect Library Fine</h3>
              <button onClick={() => setShowPayFineModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400">Borrower: <span className="text-white font-bold">{selectedFineForAction.memberName}</span></div>
              <div className="text-slate-400">Amount Due: <span className="text-orange-400 font-bold text-base">₹{selectedFineForAction.amount}</span></div>
              <div className="text-slate-400">Reason: <span className="text-white">{selectedFineForAction.reason}</span></div>
            </div>

            <form onSubmit={handlePayFineSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400">Payment Method</label>
                <select
                  value={finePaymentForm.paymentMethod}
                  onChange={e => setFinePaymentForm({ ...finePaymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                >
                  <option value="cash">Cash at Library Counter</option>
                  <option value="online">Online Payment</option>
                  <option value="fee_adjustment">Student Fee Adjustment</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Notes / Receipt Remarks</label>
                <input
                  type="text"
                  placeholder="Optional receipt notes"
                  value={finePaymentForm.notes}
                  onChange={e => setFinePaymentForm({ ...finePaymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayFineModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Record Payment (₹{selectedFineForAction.amount})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: WAIVE FINE */}
      {/* ========================================================================= */}
      {showWaiveFineModal && selectedFineForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 font-mono text-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Waive Circulation Fine</h3>
              <button onClick={() => setShowWaiveFineModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-slate-400">
              Waiving fine of <span className="text-orange-400 font-bold">₹{selectedFineForAction.amount}</span> for{' '}
              <span className="text-white font-bold">{selectedFineForAction.memberName}</span>
            </div>

            <form onSubmit={handleWaiveFineSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400">Authorized By Officer</label>
                <input
                  type="text"
                  required
                  value={fineWaiveForm.waivedBy}
                  onChange={e => setFineWaiveForm({ ...fineWaiveForm, waivedBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Justification / Reason</label>
                <input
                  type="text"
                  required
                  value={fineWaiveForm.reason}
                  onChange={e => setFineWaiveForm({ ...fineWaiveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWaiveFineModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Confirm Waiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
