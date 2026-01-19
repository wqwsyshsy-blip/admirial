
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Search, History, Shield, Trash2, Camera, User, Clipboard, Check, 
  ImageIcon, AlertTriangle, FileWarning, Star, Ban, Clock, 
  Loader2, Info, ExternalLink, Download, Fingerprint, Activity, 
  FileText, Pin, PinOff, ListFilter, Upload, Tag, Save, X, Eye, ArrowRight,
  AlertCircle, ShieldAlert, Send, Gavel, Users, Volume2, VolumeX,
  FileArchive, Box, Database, Monitor, MessageSquare, Sparkles,
  UserCheck, ShieldCheck, Bug, Flag, Share2, Calendar, HardDrive,
  LogOut, ShieldQuestion, Zap, Terminal, Globe, Lock, Cpu, Radar, SearchCode,
  FileSignature, UserPlus, UserMinus, Copy, CheckCircle, FileBox, Briefcase, UserCog,
  Gamepad2, ThumbsUp, ThumbsDown, UserCircle, Play, Server, Radio, ChevronDown, ChevronUp, MoreHorizontal,
  RefreshCw, Link, BookOpen, UserX, Coins, TrendingUp, CreditCard, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import html2pdf from 'html2pdf.js'; // Removed module import to use global script
import { 
  InputType, ApiResponse, SearchHistoryItem, RobloxPlayerData, RobloxGroupFullData, RobloxGameData, RobloxLivePlayerData,
  AuditLogEntry, CyberReport, ReportType, SeverityLevel, ReportStatus, ReconToolId, ManagedAccount, ManagedAccountStatus
} from './types';
import { getRobloxPlayerData, getRobloxGroupData, getRobloxGameData, getRobloxLivePlayer, fetchReconData, createRobloxAccount } from './services/robloxService';
import { analyzeRobloxImage, askAiAssistant, generateSimplifiedReport } from './services/geminiService';
import { dbService } from './services/dbService';

const SFX = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  scan: 'https://assets.mixkit.co/active_storage/sfx/2544/2544-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2541/2541-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/2542/2542-preview.mp3',
  login: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
  export: 'https://assets.mixkit.co/active_storage/sfx/2550/2550-preview.mp3',
};

const LOADING_STEPS = [
  "جارٍ تأسيس اتصال آمن...",
  "تجاوز جدران الحماية الرقمية...",
  "استخراج البصمة البيومترية للحساب...",
  "تحليل الشبكات الاجتماعية والقروبات...",
  "فحص السجلات الجنائية والسيبرانية...",
  "إعداد التقرير الاستخباراتي النهائي..."
];

const RECON_TOOLS: { id: ReconToolId; title: string; placeholder: string }[] = [
  { id: 'old_usernames', title: '① Old Usernames', placeholder: 'User ID' },
  { id: 'deleted_assets', title: '② Deleted Assets', placeholder: 'Asset ID' },
  { id: 'favorites_count', title: '③ Private Favorites Count', placeholder: 'Universe ID' },
  { id: 'private_places', title: '④ Private Places', placeholder: 'Universe ID' },
  { id: 'hidden_roles', title: '⑤ Hidden Group Roles', placeholder: 'Group ID' },
  { id: 'delisted_games', title: '⑥ Delisted Games', placeholder: 'Keyword/Name' },
  { id: 'unlisted_versions', title: '⑦ Unlisted Versions', placeholder: 'Universe ID' },
  { id: 'product_revenue', title: '⑧ DevProduct Revenue', placeholder: 'Product ID' },
  { id: 'ghost_players', title: '⑨ Ghost Players (Last Online)', placeholder: 'User ID' },
  { id: 'hidden_languages', title: '⑩ Hidden Supported Languages', placeholder: 'Universe ID' },
  { id: 'account_forge', title: '⑪ Account Forge – إنشاء حساب Roblox', placeholder: 'N/A' },
  { id: 'group_treasury', title: '⑫ Robux Treasury – خزينة المجموعة', placeholder: 'Group ID' },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState(false);

  const [inputType, setInputType] = useState<InputType>('username');
  const [inputValue, setInputValue] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [groupResult, setGroupResult] = useState<RobloxGroupFullData | null>(null);
  const [gameResult, setGameResult] = useState<RobloxGameData | null>(null);
  const [livePlayerResult, setLivePlayerResult] = useState<RobloxLivePlayerData | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  
  // Friends Modal States
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  
  // Info Dossier Modal States
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoTab, setInfoTab] = useState<'details' | 'groups'>('details');

  // Groups Modal State (User List Feature)
  const [showGroupsModal, setShowGroupsModal] = useState(false);

  // Group Detail Modal (New Feature for Specific Group Search)
  const [showGroupDetailModal, setShowGroupDetailModal] = useState(false);

  // Reports
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ 
    type: 'Suspicious Activity' as ReportType, 
    severity: 'Medium' as SeverityLevel, 
    summary: '',
    reporterAlias: 'Anonymous'
  });
  const [targetReports, setTargetReports] = useState<CyberReport[]>([]);

  // Analyst Dashboard
  const [showAnalystDashboard, setShowAnalystDashboard] = useState(false);
  const [allReports, setAllReports] = useState<CyberReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Account Manager System (New Feature)
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [managedAccounts, setManagedAccounts] = useState<ManagedAccount[]>([]);
  const [accountManagerView, setAccountManagerView] = useState<'list' | 'form'>('list');
  const [accountForm, setAccountForm] = useState<Partial<ManagedAccount>>({
    status: 'Active',
    tags: [],
    linkedReportIds: [],
    notes: ''
  });
  const [tagInput, setTagInput] = useState('');

  // AI & Extras
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [simpleReport, setSimpleReport] = useState<string | null>(null);
  const [isGeneratingSimple, setIsGeneratingSimple] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recon Vault (Sidebar)
  const [showReconSidebar, setShowReconSidebar] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<ReconToolId | null>(null);
  const [reconInputs, setReconInputs] = useState<Record<ReconToolId, string>>({
    old_usernames: '', deleted_assets: '', favorites_count: '', private_places: '',
    hidden_roles: '', delisted_games: '', unlisted_versions: '', product_revenue: '',
    ghost_players: '', hidden_languages: '', account_forge: '', group_treasury: ''
  });
  const [reconResults, setReconResults] = useState<Record<ReconToolId, { loading: boolean; data: any; error: string | null }>>({
    old_usernames: { loading: false, data: null, error: null },
    deleted_assets: { loading: false, data: null, error: null },
    favorites_count: { loading: false, data: null, error: null },
    private_places: { loading: false, data: null, error: null },
    hidden_roles: { loading: false, data: null, error: null },
    delisted_games: { loading: false, data: null, error: null },
    unlisted_versions: { loading: false, data: null, error: null },
    product_revenue: { loading: false, data: null, error: null },
    ghost_players: { loading: false, data: null, error: null },
    hidden_languages: { loading: false, data: null, error: null },
    account_forge: { loading: false, data: null, error: null },
    group_treasury: { loading: false, data: null, error: null }
  });

  // Account Forge State
  const [forgeForm, setForgeForm] = useState({
    username: '',
    password: '',
    birthday: '',
    gender: '2' // 2 Male, 3 Female
  });
  const [createdAccount, setCreatedAccount] = useState<{userId: number, username: string} | null>(null);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const playSfx = useCallback((type: keyof typeof SFX) => {
    if (!soundEnabled) return;
    const audio = new Audio(SFX[type]);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }, [soundEnabled]);

  useEffect(() => {
    const init = async () => {
      const session = localStorage.getItem('intel_session_active');
      if (session === 'true') setIsAuthenticated(true);
      const hist = await dbService.getHistory();
      setHistory(sortHistory(hist));
      setAuthLoading(false);
    };
    init();
  }, []);

  const sortHistory = (list: SearchHistoryItem[]) => {
    return [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === 'admin' && loginForm.pass === 'admin') {
      setIsAuthenticated(true);
      localStorage.setItem('intel_session_active', 'true');
      playSfx('login');
    } else {
      setLoginError(true);
      playSfx('error');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('intel_session_active');
    playSfx('click');
  };

  const openLink = (url: string) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    playSfx('click');
  };

  // --- Search Logic ---
  const handleSearch = async (typeOverride?: InputType, valueOverride?: string) => {
    const type = typeOverride || inputType;
    const value = valueOverride || inputValue;
    if (!value) return;

    playSfx('click');
    setLoading(true);
    setLoadingStep(0);
    setSimpleReport(null);
    setCopied(false);
    // Do NOT clear Group Result if we want to keep it in background, but here we are context switching.
    // Ideally, we focus on the new search.
    setGroupResult(null); 
    setGameResult(null);
    setLivePlayerResult(null);
    setErrorMessage(null);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1000);

    try {
      const response = await getRobloxPlayerData(type, value);
      if (response.status === 'success' && response.data && response.type === 'user') {
        setResult(response);
        await dbService.saveDossier(response.data as RobloxPlayerData);
        
        // Load reports for this user
        const reports = await dbService.getAllReports();
        setTargetReports(reports.filter(r => r.targetData.userId === (response.data as RobloxPlayerData).userId));
        
        // Update History
        const newItem: SearchHistoryItem = {
          timestamp: new Date().toISOString(),
          userId: (response.data as RobloxPlayerData).userId,
          username: (response.data as RobloxPlayerData).username,
          avatarUrl: (response.data as RobloxPlayerData).avatarUrl,
          inputMethod: (type === 'image' ? 'image' : 'text') as 'image' | 'text',
          isPinned: false
        };
        
        // Merge with existing history, keeping pins
        const existingItem = history.find(h => h.userId === newItem.userId);
        if (existingItem?.isPinned) newItem.isPinned = true;
        
        const filteredHist = history.filter(h => h.userId !== newItem.userId);
        const newHist = sortHistory([newItem, ...filteredHist].slice(0, 50));
        
        setHistory(newHist);
        await dbService.saveHistory(newHist);
        playSfx('success');
      } else {
        setResult(response);
        setErrorMessage(response.message);
        playSfx('error');
      }
    } catch {
      playSfx('error');
      setErrorMessage("حدث خطأ غير متوقع أثناء المعالجة");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  // ... (Other search functions remain the same) ...
  const handleGroupSearch = async (overrideValue?: string) => {
    const searchValue = overrideValue || inputValue;
    if (!searchValue) return;
    if (!/^\d+$/.test(searchValue)) {
      setErrorMessage("خطأ: معرف المجموعة يجب أن يحتوي على أرقام فقط.");
      playSfx('error');
      return;
    }
    playSfx('click');
    setLoading(true);
    setLoadingStep(0);
    setErrorMessage(null);
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 800);
    try {
      const response = await getRobloxGroupData(searchValue);
      if (response.status === 'success' && response.data && response.type === 'group') {
        setGroupResult(response.data as RobloxGroupFullData);
        setShowGroupDetailModal(true);
        playSfx('success');
      } else {
        setErrorMessage(response.message);
        playSfx('error');
      }
    } catch {
      setErrorMessage("فشل الاتصال بخوادم المجموعات");
      playSfx('error');
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const handleGameSearch = async () => {
    if (!inputValue) return;
    playSfx('click');
    setLoading(true);
    setLoadingStep(0);
    setErrorMessage(null);
    setGameResult(null); 
    setGroupResult(null);
    setLivePlayerResult(null);
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 800);
    try {
      const playerRes = await getRobloxLivePlayer(inputValue);
      if (playerRes.status === 'success' && playerRes.type === 'live_user' && playerRes.data) {
         const playerData = playerRes.data as RobloxLivePlayerData;
         setLivePlayerResult(playerData);
         if (playerData.placeId) {
            const gameRes = await getRobloxGameData(playerData.placeId);
            if (gameRes.status === 'success' && gameRes.data && gameRes.type === 'game') {
               setGameResult(gameRes.data as RobloxGameData);
            }
         }
         playSfx('success');
      } else {
         const response = await getRobloxGameData(inputValue);
         if (response.status === 'success' && response.data && response.type === 'game') {
           setGameResult(response.data as RobloxGameData);
           playSfx('success');
         } else {
           setErrorMessage(response.message);
           playSfx('error');
         }
      }
    } catch {
      setErrorMessage("فشل الاتصال بخدمة الألعاب");
      playSfx('error');
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const togglePinHistory = async (e: React.MouseEvent, userId: number) => {
    e.stopPropagation();
    const updatedHistory = history.map(item => 
      item.userId === userId ? { ...item, isPinned: !item.isPinned } : item
    );
    const sorted = sortHistory(updatedHistory);
    setHistory(sorted);
    await dbService.saveHistory(sorted);
    playSfx('click');
  };

  const deleteHistoryItem = async (e: React.MouseEvent, userId: number) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.userId !== userId);
    setHistory(updatedHistory);
    await dbService.saveHistory(updatedHistory);
    playSfx('click');
  };

  // --- Account Forge Logic ---
  const generateRandomForgeData = () => {
    const adjectives = ['Neon', 'Dark', 'Cyber', 'Ghost', 'Shadow', 'Azure', 'Crimson', 'Silent', 'Rapid', 'Swift'];
    const nouns = ['Drifter', 'Nomad', 'Ninja', 'Reaper', 'Viper', 'Hawk', 'Wolf', 'Echo', 'Pulse', 'Blade'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 9999);
    
    const username = `${randomAdj}${randomNoun}${randomNum}`;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const start = new Date(1995, 0, 1);
    const end = new Date(2010, 0, 1);
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    const birthday = randomDate.toISOString().split('T')[0];
    const gender = Math.random() > 0.5 ? '2' : '3';
    setForgeForm({ username, password, birthday, gender });
    playSfx('scan');
  };

  const handleAccountCreation = async () => {
    if (!forgeForm.username || !forgeForm.password || !forgeForm.birthday) {
        setReconResults(prev => ({ ...prev, account_forge: { loading: false, data: null, error: "يرجى ملء جميع الحقول" } }));
        playSfx('error');
        return;
    }
    setReconResults(prev => ({ ...prev, account_forge: { loading: true, data: null, error: null } }));
    setCreatedAccount(null);
    playSfx('click');
    const result = await createRobloxAccount({
        username: forgeForm.username,
        password: forgeForm.password,
        birthday: forgeForm.birthday,
        gender: parseInt(forgeForm.gender)
    });
    if (result.status === 'success') {
        setCreatedAccount({ userId: result.data.userId, username: forgeForm.username });
        setReconResults(prev => ({ ...prev, account_forge: { loading: false, data: result.data, error: null } }));
        playSfx('success');
    } else {
        setReconResults(prev => ({ ...prev, account_forge: { loading: false, data: null, error: result.message } }));
        playSfx('error');
    }
  };

  // ... (Account Manager functions remain the same) ...
  const openAccountManager = async () => {
    const accounts = await dbService.getAllManagedAccounts();
    const reports = await dbService.getAllReports();
    setManagedAccounts(accounts.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()));
    setAllReports(reports);
    setShowAccountManager(true);
    setAccountManagerView('list');
    playSfx('click');
  };

  const handleSaveAccount = async () => {
    if (!accountForm.username || !accountForm.userId) {
       alert("Username and UserID are required");
       return;
    }
    const newAccount: ManagedAccount = {
       userId: Number(accountForm.userId),
       username: accountForm.username,
       displayName: accountForm.displayName || accountForm.username,
       creationDate: accountForm.creationDate || new Date().toISOString(),
       status: (accountForm.status as ManagedAccountStatus) || 'Active',
       tags: accountForm.tags || [],
       notes: accountForm.notes || '',
       addedAt: accountForm.addedAt || new Date().toISOString(),
       linkedReportIds: accountForm.linkedReportIds || []
    };
    await dbService.saveManagedAccount(newAccount);
    await dbService.addAudit({
       action: accountForm.addedAt ? 'Account Updated' : 'Account Added',
       admin: 'Admin',
       timestamp: new Date().toISOString(),
       targetId: newAccount.userId,
       details: `Managed Account ${newAccount.username} was ${accountForm.addedAt ? 'updated' : 'added'}.`
    });
    setManagedAccounts(prev => {
        const filtered = prev.filter(a => a.userId !== newAccount.userId);
        return [newAccount, ...filtered].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    });
    setAccountManagerView('list');
    setAccountForm({ status: 'Active', tags: [], linkedReportIds: [], notes: '' });
    playSfx('success');
  };

  const handleDeleteAccount = async (userId: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الحساب من النظام؟")) return;
    await dbService.deleteManagedAccount(userId);
    await dbService.addAudit({
        action: 'Account Deleted',
        admin: 'Admin',
        timestamp: new Date().toISOString(),
        targetId: userId,
        details: `Managed Account ID ${userId} was removed.`
    });
    setManagedAccounts(prev => prev.filter(a => a.userId !== userId));
    playSfx('click');
  };

  const handleExportAccounts = async (format: 'json' | 'txt') => {
    const data = await dbService.getAllManagedAccounts();
    let content = '';
    let mimeType = '';
    let filename = `accounts_export_${Date.now()}`;
    if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        filename += '.json';
    } else {
        content = `[Roblox Managed Accounts Report]\nExport Date: ${new Date().toLocaleString()}\nTotal Accounts: ${data.length}\n\n`;
        data.forEach(acc => {
            content += `----------------------------------------\n`;
            content += `User: ${acc.displayName} (@${acc.username})\n`;
            content += `ID: ${acc.userId}\n`;
            content += `Status: ${acc.status}\n`;
            content += `Created: ${new Date(acc.creationDate).toLocaleDateString()}\n`;
            content += `Added To System: ${new Date(acc.addedAt).toLocaleString()}\n`;
            content += `Tags: ${acc.tags.join(', ') || 'None'}\n`;
            content += `Linked Reports: ${acc.linkedReportIds.length}\n`;
            content += `Notes: ${acc.notes}\n`;
        });
        mimeType = 'text/plain';
        filename += '.txt';
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    await dbService.addAudit({
        action: 'Accounts Exported',
        admin: 'Admin',
        timestamp: new Date().toISOString(),
        details: `Exported ${data.length} accounts in ${format.toUpperCase()} format.`
    });
    playSfx('export');
  };

  // --- Recon Vault Logic ---
  const handleReconFetch = async (toolId: ReconToolId) => {
    const id = reconInputs[toolId];
    if (!id) return;
    setReconResults(prev => ({ ...prev, [toolId]: { ...prev[toolId], loading: true, error: null, data: null } }));
    playSfx('click');
    const result = await fetchReconData(toolId, id);
    setReconResults(prev => ({ 
      ...prev, 
      [toolId]: { 
        loading: false, 
        data: result.status === 'success' ? result.data : null, 
        error: result.status === 'error' ? result.message || 'Unknown error' : null 
      } 
    }));
    if(result.status === 'success') playSfx('success');
    else playSfx('error');
  };

  // --- Analyst Dashboard Logic ---
  const openAnalystDashboard = async () => {
    const reports = await dbService.getAllReports();
    reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setAllReports(reports);
    setShowAnalystDashboard(true);
    playSfx('click');
  };

  const updateReportStatus = async (reportId: string, newStatus: ReportStatus) => {
    const reportIndex = allReports.findIndex(r => r.reportId === reportId);
    if (reportIndex === -1) return;
    const updatedReport = { ...allReports[reportIndex], status: newStatus };
    if (adminNote) {
       updatedReport.adminNotes = (updatedReport.adminNotes || '') + `\n[${new Date().toLocaleDateString()}] ${adminNote}`;
       setAdminNote('');
    }
    await dbService.saveReport(updatedReport);
    const newReports = [...allReports];
    newReports[reportIndex] = updatedReport;
    setAllReports(newReports);
    if ((result?.data as RobloxPlayerData)?.userId === updatedReport.targetData.userId) {
       setTargetReports(prev => prev.map(r => r.reportId === reportId ? updatedReport : r));
    }
    playSfx('success');
  };

  // --- Reports Logic ---
  const submitCyberReport = async () => {
    const userData = result?.data as RobloxPlayerData;
    if (!userData || !reportForm.summary) return;
    const newReport: CyberReport = {
      reportId: `REP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reportType: reportForm.type,
      severity: reportForm.severity,
      status: 'Open',
      targetData: userData,
      incidentSummary: reportForm.summary,
      ageRange: 'Unknown',
      platformContext: 'Roblox Intelligence Search',
      reporterAlias: reportForm.reporterAlias || 'Anonymous Agent'
    };
    try {
      await dbService.saveReport(newReport);
      setTargetReports(prev => [newReport, ...prev]);
      setShowReportModal(false);
      setReportForm({ type: 'Suspicious Activity', severity: 'Medium', summary: '', reporterAlias: 'Anonymous' });
      playSfx('success');
    } catch (error) {
      console.error("Failed to save report:", error);
      playSfx('error');
    }
  };

  // --- Friends Logic ---
  const filteredFriends = useMemo(() => {
    const userData = result?.data as RobloxPlayerData;
    if (!userData) return [];
    return userData.friendsList.filter(f => 
      f.name.toLowerCase().includes(friendSearchQuery.toLowerCase()) || 
      f.displayName.toLowerCase().includes(friendSearchQuery.toLowerCase())
    );
  }, [result?.data, friendSearchQuery]);

  const openFriendsWithRadar = async () => {
    playSfx('scan');
    setLoading(true); 
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setShowFriendsModal(true);
    setFriendsLoading(false);
  };

  const openInfoDossier = () => {
    setInfoTab('details');
    setShowInfoModal(true);
    playSfx('click');
  };

  // --- AI & Tools ---
  const handleAiAsk = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    playSfx('click');
    try {
      const response = await askAiAssistant(aiInput, { 
        target: result?.data, 
        reports: targetReports 
      });
      setAiResponse(response);
      setAiInput('');
      playSfx('success');
    } catch (error) {
      setAiResponse("خطأ: تعذر الوصول لخوادم الذكاء الاصطناعي.");
      playSfx('error');
    } finally {
      setAiLoading(false);
    }
  };

  const generateSimpleAiReport = async () => {
    if (!result?.data) return;
    setIsGeneratingSimple(true);
    playSfx('click');
    const report = await generateSimplifiedReport(result.data, targetReports);
    setSimpleReport(report);
    setIsGeneratingSimple(false);
    playSfx('success');
  };

  const copyToClipboard = () => {
    const userData = result?.data as RobloxPlayerData;
    if (!userData) return;
    const text = `
[تقرير استخباراتي - وحدة الرصد]
--------------------------------
الاسم: ${userData.displayName}
المستخدم: @${userData.username}
المعرف: ${userData.userId}
الوصف: ${userData.description || 'لا يوجد'}
تاريخ الإنشاء: ${userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('ar-EG') : 'غير معروف'}
الحالة: ${userData.isBanned ? 'محظور' : 'نشط'}
رابط الملف: https://www.roblox.com/users/${userData.userId}/profile
--------------------------------
تم النسخ بواسطة نظام مباحث 3.0
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    playSfx('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const exportOfficialPdf = () => {
    const userData = result?.data as RobloxPlayerData;
    if (!userData) return;
    playSfx('export');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const reportHtml = `
      <html lang="ar" dir="rtl">
      <head>
        <title>تقرير استخباراتي رسمي - ${userData.username}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
          .header { text-align: center; border-bottom: 4px solid #c5a059; padding-bottom: 20px; margin-bottom: 40px; position: relative; }
          .logo { width: 100px; margin-bottom: 10px; }
          .title { font-size: 28px; font-weight: 900; color: #001a35; margin: 0; }
          .sub-title { font-size: 14px; color: #666; text-transform: uppercase; margin-top: 5px; }
          .case-number { position: absolute; top: 0; right: 0; font-family: monospace; font-size: 12px; }
          .section { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
          .section-header { background: #f4f4f4; padding: 10px 20px; font-weight: 900; border-bottom: 1px solid #ddd; color: #001a35; }
          .section-content { padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .data-item { margin-bottom: 10px; }
          .data-label { font-size: 12px; color: #888; font-weight: bold; }
          .data-value { font-size: 16px; font-weight: bold; color: #333; }
          .avatar { width: 120px; height: 120px; border-radius: 10px; border: 2px solid #c5a059; margin-bottom: 20px; }
          .footer { margin-top: 60px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; font-size: 10px; color: #999; }
          .stamp { position: absolute; bottom: 80px; left: 80px; width: 150px; opacity: 0.3; transform: rotate(-15deg); }
          .report-list { list-style: none; padding: 0; }
          .report-item { background: #fff5f5; border: 1px solid #feb2b2; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="case-number">CASE NO: RD-${userData.userId}-${Date.now()}</div>
          <img src="https://upload.wikimedia.org/wikipedia/ar/0/0a/Dakhelia.png" class="logo">
          <h1 class="title">وزارة الداخلية - وحدة الرصد السيبراني</h1>
          <p class="sub-title">تقرير استخباراتي سري للغاية / TOP SECRET INTEL REPORT</p>
        </div>
        <div style="display: flex; gap: 40px; align-items: flex-start;">
          <img src="${userData.avatarUrl}" class="avatar">
          <div style="flex: 1;">
            <div class="section">
              <div class="section-header">البيانات الأساسية للهدف</div>
              <div class="section-content">
                <div class="data-item"><div class="data-label">الاسم المعروض</div><div class="data-value">${userData.displayName}</div></div>
                <div class="data-item"><div class="data-label">اسم المستخدم</div><div class="data-value">@${userData.username}</div></div>
                <div class="data-item"><div class="data-label">المعرف الرقمي</div><div class="data-value">${userData.userId}</div></div>
                <div class="data-item"><div class="data-label">تاريخ الإنشاء</div><div class="data-value">${userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('ar-EG') : 'N/A'}</div></div>
                <div class="data-item"><div class="data-label">الوصف (Bio)</div><div class="data-value">${userData.description ? userData.description.substring(0, 100) + '...' : 'لا يوجد'}</div></div>
              </div>
            </div>
          </div>
        </div>
        <div class="section">
          <div class="section-header">سجل البلاغات المسجلة (${targetReports.length})</div>
          <div class="section-content" style="display: block;">
            ${targetReports.length === 0 ? 'لا توجد بلاغات مسجلة.' : `
              <ul class="report-list">
                ${targetReports.map(r => `
                  <li class="report-item">
                    <strong>[${r.status}] ${r.reportType}</strong><br>
                    <small>${new Date(r.timestamp).toLocaleString('ar-EG')}</small><br>
                    ${r.incidentSummary}
                  </li>
                `).join('')}
              </ul>
            `}
          </div>
        </div>
        <img src="https://upload.wikimedia.org/wikipedia/ar/0/0a/Dakhelia.png" class="stamp">
        <div class="footer">صدر هذا التقرير آلياً من نظام مباحث 3.0.</div>
        <script>window.onload = () => { window.print(); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const handleExportPdfReport = () => {
    const userData = result?.data as RobloxPlayerData;
    if (!userData) return;
    
    // Safety check for library availability
    if (typeof window.html2pdf === 'undefined') {
        alert("لم يتم تحميل مكتبة التصدير بشكل صحيح. يرجى تحديث الصفحة.");
        return;
    }
    
    playSfx('export');

    const reportsText = targetReports.length > 0 
        ? targetReports.map((r, i) => `
بلاغ #${i + 1}:
- المعرف: ${r.reportId}
- النوع: ${r.reportType}
- الخطورة: ${r.severity}
- الملخص: ${r.incidentSummary}
- التاريخ: ${r.timestamp}
`).join('') 
        : 'لا توجد بلاغات مسجلة.';

    const groupsText = userData.groups.length > 0
        ? userData.groups.map(g => `- ${g.groupName} [الرتبة: ${g.role}]`).join('\n')
        : '- لا توجد مجموعات.';

    const content = `
==================================================
        وزارة الداخلية - وحدة الرصد والتحري
        ملف استخباراتي رقم: CASE-${userData.userId}
        الحالة: سري للغاية / TOP SECRET
==================================================

[بيانات الهدف المركزية]
الاسم المعروض: ${userData.displayName}
اسم المستخدم: @${userData.username}
المعرف الرقمي (UUID): ${userData.userId}
الحالة الجنائية: ${userData.isBanned ? 'محظور / BANNED' : 'نشط / سليم'}

[سجل الرصد السيبراني]
تاريخ الانضمام: ${userData.createdAt || 'غير متاح'}
العمر الرقمي: ${userData.accountAge || 'غير معروف'}
المرتبة: ${userData.isPremium ? 'عضوية مميزة' : 'عضوية عادية'}
النشاط الحالي: ${userData.presence || 'offline'}

[البلاغات المسجلة في النظام]
إجمالي البلاغات: ${targetReports.length}
${reportsText}

[الارتباطات والمنظمات]
إجمالي المجموعات: ${userData.groups.length}
${groupsText}

==================================================
تم استخراج هذا الملف بواسطة نظام مباحث 3.0 الذكي
توقيت الاستخراج: ${new Date().toLocaleString('ar-EG')}
==================================================
`;

    // Create a temporary hidden div attached to the body
    const element = document.createElement('div');
    element.innerHTML = `<div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; color: #000; background: #fff; padding: 20px;">
        <pre style="font-family: 'Cairo', monospace; white-space: pre-wrap; font-size: 12px; line-height: 1.5;">${content}</pre>
    </div>`;
    
    // Position it off-screen but part of the DOM
    element.style.position = 'fixed';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.width = '210mm'; // Standard A4 width
    element.style.zIndex = '-1';
    document.body.appendChild(element);

    const opt = {
      margin:       10,
      filename:     'Dossier_Report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate PDF using the global library
    window.html2pdf().set(opt).from(element).save()
      .then(() => {
        // Cleanup after success
        document.body.removeChild(element);
        playSfx('success');
      })
      .catch((err: any) => {
        console.error("PDF Export Error:", err);
        // Cleanup on error
        if (document.body.contains(element)) {
            document.body.removeChild(element);
        }
        playSfx('error');
      });
  };


  if (authLoading) return (
    <div className="min-h-screen bg-[#000c1a] flex flex-col items-center justify-center gap-6">
      <Cpu className="animate-pulse gold-text" size={80} />
      <div className="text-center">
        <p className="text-[#c5a059] font-black text-xl uppercase tracking-[0.3em]">Mabahith OS 3.0</p>
        <p className="text-gray-600 text-[10px] font-mono mt-2">INITIALIZING ENCRYPTED KERNEL...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://upload.wikimedia.org/wikipedia/ar/0/0a/Dakhelia.png')] bg-center bg-no-repeat bg-[length:30%] bg-blend-soft-light bg-[#000c1a]">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="intel-card w-full max-w-md p-10 rounded-[40px] border-4 border-[#c5a059] relative shadow-[0_0_80px_rgba(197,160,89,0.1)] overflow-hidden">
          <div className="scanner-line"></div>
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#c5a059]/30">
              <Lock size={40} className="gold-text" />
            </div>
            <h1 className="text-3xl font-black gold-text">تسجيل الدخول الأمني</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">منظومة الرصد والتحري - الوصول المصرح به فقط</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] text-[#c5a059] font-black uppercase mr-2">رمز المحقق (Agent ID)</label>
              <input 
                type="text" placeholder="ادخل المعرف..." 
                className="w-full p-4 bg-white text-black font-bold rounded-2xl outline-none focus:ring-4 ring-[#c5a059]/20 transition-all"
                value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#c5a059] font-black uppercase mr-2">مفتاح التشفير (Secure Key)</label>
              <input 
                type="password" placeholder="••••••••" 
                className="w-full p-4 bg-white text-black font-bold rounded-2xl outline-none focus:ring-4 ring-[#c5a059]/20 transition-all"
                value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
              />
            </div>
            {loginError && <p className="text-red-500 text-xs font-black text-center animate-bounce">خطأ: بيانات الدخول غير صالحة!</p>}
            <button type="submit" className="w-full py-4 gold-bg text-[#001a35] font-black rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all text-xl uppercase">
              تأكيد الهوية
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const userData = result?.data && 'username' in result.data ? (result.data as RobloxPlayerData) : null;

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-10 text-center"
          >
            <div className="relative mb-12">
               <Radar size={140} className="gold-text animate-pulse" />
               <motion.div 
                 animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 className="absolute -inset-6 border-2 border-dashed border-[#c5a059]/20 rounded-full"
               />
            </div>
            <h2 className="text-4xl font-black gold-text mb-6 uppercase tracking-tighter">جارٍ رصد الهدف...</h2>
            <div className="w-full max-w-lg bg-white/5 h-1.5 rounded-full overflow-hidden mb-6">
               <motion.div 
                 initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 6 }}
                 className="h-full gold-bg shadow-[0_0_15px_#c5a059]"
               />
            </div>
            <AnimatePresence mode="wait">
              <motion.p 
                key={loadingStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="text-gray-400 font-mono text-sm uppercase"
              >
                {LOADING_STEPS[loadingStep]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header initial={{ y: -50 }} animate={{ y: 0 }} className="max-w-7xl mx-auto mb-10 intel-card p-6 rounded-[30px] border-b-4 border-[#c5a059] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <img src="https://upload.wikimedia.org/wikipedia/ar/0/0a/Dakhelia.png" className="w-20 h-20 drop-shadow-[0_0_10px_rgba(197,160,89,0.5)]" alt="Logo" />
          <div className="text-right">
            <h1 className="text-5xl font-black gold-text leading-tight tracking-tighter">منظومة الرصد والتحري</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase">نظام التحقيق الرقمي الموحد - إصدار 3.0</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
           {isAdmin && (
             <>
               <button onClick={openAnalystDashboard} className="px-6 py-4 rounded-2xl font-black bg-white/5 border border-white/10 hover:border-[#c5a059] text-white transition-all flex items-center gap-2">
                 <Database size={20} className="gold-text" />
                 <span>لوحة البلاغات</span>
               </button>
               <button onClick={openAccountManager} className="px-6 py-4 rounded-2xl font-black bg-white/5 border border-white/10 hover:border-[#c5a059] text-white transition-all flex items-center gap-2">
                 <UserCog size={20} className="gold-text" />
                 <span>إدارة الحسابات</span>
               </button>
             </>
           )}
           <button onClick={() => setIsAdmin(!isAdmin)} className={`px-8 py-4 rounded-2xl font-black border transition-all flex items-center gap-3 ${isAdmin ? 'gold-bg text-[#001a35]' : 'border-[#c5a059] text-[#c5a059]'}`}>
             {isAdmin ? <ShieldCheck size={20} /> : <Shield size={20} />}
             <span>{isAdmin ? 'وضع المحلل نشط' : 'تفعيل الصلاحيات'}</span>
           </button>
           
           <button onClick={() => setShowReconSidebar(true)} className="px-8 py-4 rounded-2xl font-black border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059] hover:text-[#001a35] transition-all flex items-center gap-3">
             <MoreHorizontal size={20} />
             <span>مزيد</span>
           </button>

           <button onClick={handleLogout} className="p-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
             <LogOut size={24} />
           </button>
        </div>
      </motion.header>

      {/* Recon Vault Sidebar */}
      <AnimatePresence>
        {showReconSidebar && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" 
              onClick={() => setShowReconSidebar(false)}
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-[400px] z-[60] bg-[#001020] border-l-4 border-[#c5a059] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-[#c5a059]/30 flex justify-between items-center bg-[#000810]">
                <button onClick={() => setShowReconSidebar(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"><X size={24} /></button>
                <div className="text-right">
                  <h3 className="text-xl font-black gold-text flex items-center gap-2 justify-end">Recon Vault <Lock size={18} /></h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">CLOAKED API ACCESS</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scroll space-y-2">
                 <div className="mb-4 text-center p-3 bg-red-900/10 border border-red-500/20 rounded-xl">
                   <p className="text-[10px] text-red-400 font-bold">WARNING: ACCESSING RESTRICTED ENDPOINTS</p>
                 </div>

                 {RECON_TOOLS.map((tool) => (
                   <div key={tool.id} className="border border-white/10 rounded-xl bg-[#000c1a] overflow-hidden">
                     <button 
                       onClick={() => setOpenAccordion(openAccordion === tool.id ? null : tool.id)}
                       className={`w-full p-4 flex justify-between items-center transition-colors hover:bg-white/5 ${openAccordion === tool.id ? 'bg-white/5 text-[#c5a059]' : 'text-gray-300'}`}
                     >
                       {openAccordion === tool.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                       <span className="font-bold text-sm text-right flex-1 mr-3">{tool.title}</span>
                     </button>
                     
                     <AnimatePresence>
                       {openAccordion === tool.id && (
                         <motion.div 
                           initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                           className="border-t border-white/10"
                         >
                           <div className="p-4 space-y-3">
                             {tool.id === 'account_forge' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 font-black uppercase text-right block">كلمة المرور</label>
                                            <input 
                                                type="text" 
                                                placeholder="Password" 
                                                className="w-full p-2 bg-white/5 text-white text-right rounded-lg text-xs outline-none border border-white/10 focus:border-[#c5a059]"
                                                value={forgeForm.password}
                                                onChange={(e) => setForgeForm({...forgeForm, password: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 font-black uppercase text-right block">الاسم المُراد</label>
                                            <input 
                                                type="text" 
                                                placeholder="Username" 
                                                className="w-full p-2 bg-white/5 text-white text-right rounded-lg text-xs outline-none border border-white/10 focus:border-[#c5a059]"
                                                value={forgeForm.username}
                                                onChange={(e) => setForgeForm({...forgeForm, username: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 font-black uppercase text-right block">الجنس</label>
                                            <select 
                                                className="w-full p-2 bg-white/5 text-white text-right rounded-lg text-xs outline-none border border-white/10 focus:border-[#c5a059]"
                                                value={forgeForm.gender}
                                                onChange={(e) => setForgeForm({...forgeForm, gender: e.target.value})}
                                            >
                                                <option value="2">Male (ذكر)</option>
                                                <option value="3">Female (أنثى)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-gray-500 font-black uppercase text-right block">تاريخ الميلاد</label>
                                            <input 
                                                type="date" 
                                                className="w-full p-2 bg-white/5 text-white text-right rounded-lg text-xs outline-none border border-white/10 focus:border-[#c5a059]"
                                                value={forgeForm.birthday}
                                                onChange={(e) => setForgeForm({...forgeForm, birthday: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button onClick={handleAccountCreation} disabled={reconResults.account_forge.loading} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2">
                                            {reconResults.account_forge.loading ? <Loader2 className="animate-spin" size={14}/> : <UserPlus size={14}/>} إنشاء الحساب
                                        </button>
                                        <button onClick={generateRandomForgeData} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all" title="توليد عشوائي">
                                            <RefreshCw size={14} />
                                        </button>
                                    </div>

                                    {reconResults.account_forge.error && (
                                        <div className="p-2 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-xs text-right font-bold">
                                            {reconResults.account_forge.error}
                                        </div>
                                    )}

                                    {createdAccount && (
                                        <div className="bg-[#c5a059]/10 border border-[#c5a059] rounded-xl p-3 mt-4 text-center">
                                            <img src="https://tr.rbxcdn.com/53eb9b17fe1432a809c73a13889b5006/150/150/AvatarHeadshot/Png" className="w-16 h-16 rounded-full mx-auto border-2 border-[#c5a059] mb-2" />
                                            <h4 className="text-white font-black text-sm">{createdAccount.username}</h4>
                                            <p className="text-[#c5a059] font-mono text-xs mb-2">ID: {createdAccount.userId}</p>
                                            <div className="flex gap-2 justify-center">
                                                <button 
                                                    onClick={() => {
                                                        const data = `Username: ${forgeForm.username}\nPassword: ${forgeForm.password}\nBirthday: ${forgeForm.birthday}`;
                                                        navigator.clipboard.writeText(data);
                                                        playSfx('success');
                                                    }}
                                                    className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white" 
                                                    title="نسخ البيانات"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                                <button 
                                                    onClick={() => openLink(`https://www.roblox.com/users/${createdAccount.userId}/profile`)}
                                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white" 
                                                    title="فتح الملف"
                                                >
                                                    <ExternalLink size={12} />
                                                </button>
                                                <button 
                                                    onClick={() => playSfx('export')}
                                                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-white" 
                                                    title="تصدير صورة"
                                                >
                                                    <ImageIcon size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             ) : tool.id === 'group_treasury' ? (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleReconFetch(tool.id)} 
                                            className="px-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-lg text-xs transition-all"
                                        >
                                            إحضار الخزينة
                                        </button>
                                        <input 
                                            type="text" 
                                            placeholder="Group ID" 
                                            className="flex-1 p-2 bg-white/5 text-white text-right rounded-lg text-sm outline-none border border-white/10 focus:border-[#c5a059]"
                                            value={reconInputs[tool.id]}
                                            onChange={(e) => setReconInputs(prev => ({ ...prev, [tool.id]: e.target.value }))}
                                        />
                                    </div>

                                    {reconResults[tool.id].loading && (
                                        <div className="flex justify-center py-2">
                                            <Loader2 className="animate-spin text-[#c5a059]" size={20} />
                                        </div>
                                    )}

                                    {reconResults[tool.id].error && (
                                        <div className="p-2 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-xs text-right font-bold">
                                            {reconResults[tool.id].error}
                                        </div>
                                    )}

                                    {reconResults[tool.id].data && (
                                        <div className="bg-[#001020] rounded-xl border border-[#c5a059] p-4 text-right">
                                            <h4 className="text-[#c5a059] font-black text-sm uppercase mb-3 flex items-center justify-end gap-2">
                                                Treasury Status <Coins size={16} />
                                            </h4>
                                            
                                            <div className="bg-black/30 p-3 rounded-lg border border-white/5 mb-3 text-center">
                                                <p className="text-gray-500 text-[10px] font-bold uppercase">R$ FUNDS / الرصيد الفعلي</p>
                                                <p className="text-3xl font-black text-green-400 mt-1 flex items-center justify-center gap-1">
                                                    {reconResults[tool.id].data.currency.toLocaleString()} R$
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <div className="bg-white/5 p-2 rounded-lg text-center">
                                                    <p className="text-gray-500 text-[9px] font-bold uppercase">Daily Revenue</p>
                                                    <div className="text-white font-bold text-sm flex items-center justify-center gap-1">
                                                        <TrendingUp size={12} className="text-green-500" />
                                                        {reconResults[tool.id].data.revenue.day.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 p-2 rounded-lg text-center">
                                                    <p className="text-gray-500 text-[9px] font-bold uppercase">Weekly Revenue</p>
                                                    <div className="text-white font-bold text-sm">
                                                        {reconResults[tool.id].data.revenue.week.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 p-2 rounded-lg text-center">
                                                    <p className="text-gray-500 text-[9px] font-bold uppercase">Daily Payouts</p>
                                                    <div className="text-red-400 font-bold text-sm flex items-center justify-center gap-1">
                                                        <CreditCard size={12} />
                                                        {reconResults[tool.id].data.payouts.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 p-2 rounded-lg text-center">
                                                    <p className="text-gray-500 text-[9px] font-bold uppercase">Dev Products</p>
                                                    <div className="text-indigo-400 font-bold text-sm flex items-center justify-center gap-1">
                                                        <ShoppingBag size={12} />
                                                        {reconResults[tool.id].data.devProductsCount.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 justify-center mt-3">
                                                <button onClick={() => handleReconFetch(tool.id)} className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white" title="تحديث">
                                                    <RefreshCw size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(JSON.stringify(reconResults[tool.id].data, null, 2));
                                                        playSfx('success');
                                                    }}
                                                    className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white" 
                                                    title="نسخ JSON"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => playSfx('export')}
                                                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-white" 
                                                    title="تصدير صورة"
                                                >
                                                    <ImageIcon size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             ) : (
                                <>
                                 <div className="flex gap-2">
                                   <button 
                                     onClick={() => handleReconFetch(tool.id)} 
                                     className="px-4 bg-[#c5a059] text-[#001a35] font-black rounded-lg text-xs hover:brightness-110 transition-all"
                                   >
                                     إحضار
                                   </button>
                                   <input 
                                     type="text" 
                                     placeholder={tool.placeholder}
                                     className="flex-1 p-2 bg-white/5 text-white text-right rounded-lg text-sm outline-none border border-white/10 focus:border-[#c5a059]"
                                     value={reconInputs[tool.id]}
                                     onChange={(e) => setReconInputs(prev => ({ ...prev, [tool.id]: e.target.value }))}
                                   />
                                 </div>

                                 {reconResults[tool.id].loading && (
                                   <div className="flex justify-center py-2">
                                     <Loader2 className="animate-spin" size={20} />
                                   </div>
                                 )}

                                 {reconResults[tool.id].error && (
                                   <div className="p-2 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-xs text-right font-bold">
                                     {reconResults[tool.id].error}
                                   </div>
                                 )}

                                 {reconResults[tool.id].data && (
                                   <div className="bg-black/40 rounded-lg border border-white/5 p-3 relative group">
                                      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button 
                                            onClick={() => {
                                              navigator.clipboard.writeText(JSON.stringify(reconResults[tool.id].data, null, 2));
                                              playSfx('success');
                                            }}
                                            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-white" 
                                            title="Copy JSON"
                                         >
                                           <Copy size={12} />
                                         </button>
                                         <button 
                                            onClick={() => playSfx('export')}
                                            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-md text-white" 
                                            title="Export Image"
                                         >
                                           <ImageIcon size={12} />
                                         </button>
                                      </div>
                                      <div className="max-h-40 overflow-y-auto custom-scroll text-xs font-mono text-gray-300 whitespace-pre-wrap text-left" dir="ltr">
                                        {typeof reconResults[tool.id].data === 'string' 
                                          ? reconResults[tool.id].data 
                                          : JSON.stringify(reconResults[tool.id].data, null, 2)}
                                      </div>
                                   </div>
                                 )}
                                </>
                             )}
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Account Manager Modal (New Feature) */}
      <AnimatePresence>
         {showAccountManager && (
             <div className="fixed inset-0 z-[70] bg-[#000c1a] flex flex-col">
                 <div className="p-6 border-b border-[#c5a059]/30 bg-[#001424] flex justify-between items-center shadow-2xl">
                     <div className="flex items-center gap-4">
                         <button onClick={() => setShowAccountManager(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white"><ArrowRight /></button>
                         <div className="text-right">
                             <h2 className="text-2xl font-black gold-text">نظام إدارة الحسابات</h2>
                             <p className="text-xs text-gray-500 font-bold uppercase">SECURE ACCOUNT REGISTRY & MANAGEMENT</p>
                         </div>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => { setAccountManagerView(accountManagerView === 'list' ? 'form' : 'list'); setAccountForm({ status: 'Active', tags: [], linkedReportIds: [], notes: '' }); }} className="px-6 py-2 bg-[#c5a059] text-[#001a35] rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:brightness-110 transition-all">
                            {accountManagerView === 'list' ? <UserPlus size={16} /> : <ListFilter size={16} />}
                            {accountManagerView === 'list' ? 'إضافة حساب جديد' : 'عرض القائمة'}
                        </button>
                        <button onClick={() => handleExportAccounts('txt')} className="px-6 py-2 bg-white/5 text-white rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10">
                            <Download size={16} /> تصدير TXT
                        </button>
                        <button onClick={() => handleExportAccounts('json')} className="px-6 py-2 bg-white/5 text-white rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10">
                            <FileText size={16} /> تصدير JSON
                        </button>
                     </div>
                 </div>

                 <div className="flex-1 overflow-hidden bg-[#001020] p-8">
                     {accountManagerView === 'list' ? (
                         <div className="h-full overflow-y-auto custom-scroll">
                             {managedAccounts.length === 0 ? (
                                 <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                                     <UserCog size={100} className="mb-4" />
                                     <p className="font-black text-xl">لا توجد حسابات مسجلة في النظام</p>
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                     {managedAccounts.map(account => (
                                         <div key={account.userId} className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-[#c5a059] transition-all group relative">
                                             <div className="flex justify-between items-start mb-4">
                                                 <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${account.status === 'Active' ? 'bg-green-600/20 text-green-400' : account.status === 'Banned' ? 'bg-red-600/20 text-red-400' : 'bg-orange-600/20 text-orange-400'}`}>
                                                     {account.status}
                                                 </span>
                                                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                     <button onClick={() => { setAccountForm(account); setAccountManagerView('form'); }} className="p-1.5 hover:bg-white/10 rounded text-blue-400"><FileText size={14} /></button>
                                                     <button onClick={() => handleDeleteAccount(account.userId)} className="p-1.5 hover:bg-red-900/30 rounded text-red-400"><Trash2 size={14} /></button>
                                                 </div>
                                             </div>
                                             <div className="text-right space-y-2">
                                                 <h4 className="text-xl font-black text-white">{account.displayName}</h4>
                                                 <p className="text-sm text-gray-400 font-mono">@{account.username}</p>
                                                 <p className="text-xs text-[#c5a059] font-mono">ID: {account.userId}</p>
                                             </div>
                                             <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 justify-end">
                                                 {account.tags.map(tag => (
                                                     <span key={tag} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-400">#{tag}</span>
                                                 ))}
                                             </div>
                                             {account.linkedReportIds.length > 0 && (
                                                <div className="mt-2 text-right">
                                                    <p className="text-[10px] text-red-400 font-bold flex items-center justify-end gap-1">
                                                        <Link size={10} /> مرتبط بـ {account.linkedReportIds.length} بلاغات
                                                    </p>
                                                </div>
                                             )}
                                             <div className="mt-4 text-[10px] text-gray-600 text-right font-mono">
                                                 Added: {new Date(account.addedAt).toLocaleDateString()}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     ) : (
                         <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 overflow-y-auto custom-scroll max-h-full">
                             <div className="space-y-6 text-right">
                                 <h3 className="text-xl font-black gold-text mb-6 pb-4 border-b border-white/10">
                                     {accountForm.addedAt ? 'تعديل بيانات الحساب' : 'تسجيل حساب جديد'}
                                 </h3>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="space-y-2">
                                         <label className="text-xs font-bold text-gray-400">اسم المستخدم</label>
                                         <input type="text" className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059] text-right" 
                                             value={accountForm.username || ''} 
                                             onChange={e => setAccountForm({...accountForm, username: e.target.value})}
                                             onBlur={async () => {
                                                 if (accountForm.username && !accountForm.userId) {
                                                     // Smart Auto-fill logic
                                                     const res = await getRobloxPlayerData('username', accountForm.username);
                                                     if (res.status === 'success' && res.data && 'userId' in res.data) {
                                                         setAccountForm(prev => ({
                                                             ...prev,
                                                             userId: (res.data as RobloxPlayerData).userId,
                                                             displayName: (res.data as RobloxPlayerData).displayName,
                                                             creationDate: (res.data as RobloxPlayerData).createdAt || new Date().toISOString()
                                                         }));
                                                         playSfx('scan');
                                                     }
                                                 }
                                             }}
                                         />
                                     </div>
                                     <div className="space-y-2">
                                         <label className="text-xs font-bold text-gray-400">المعرف الرقمي (User ID)</label>
                                         <input type="number" className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059] text-right" 
                                             value={accountForm.userId || ''} 
                                             onChange={e => setAccountForm({...accountForm, userId: Number(e.target.value)})}
                                         />
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                         <label className="text-xs font-bold text-gray-400">الاسم المعروض</label>
                                         <input type="text" className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059] text-right" 
                                             value={accountForm.displayName || ''} 
                                             onChange={e => setAccountForm({...accountForm, displayName: e.target.value})}
                                         />
                                     </div>
                                     <div className="space-y-2">
                                         <label className="text-xs font-bold text-gray-400">الحالة الأمنية</label>
                                         <select className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059] text-right"
                                             value={accountForm.status}
                                             onChange={e => setAccountForm({...accountForm, status: e.target.value as ManagedAccountStatus})}
                                         >
                                             <option value="Active">Active (نشط)</option>
                                             <option value="Under Review">Under Review (تحت المراجعة)</option>
                                             <option value="Banned">Banned (محظور)</option>
                                         </select>
                                     </div>
                                 </div>
                                 
                                 <div className="space-y-2">
                                     <label className="text-xs font-bold text-gray-400">تاريخ إنشاء الحساب (Roblox)</label>
                                     <input type="date" className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059] text-right" 
                                         value={accountForm.creationDate ? new Date(accountForm.creationDate).toISOString().split('T')[0] : ''}
                                         onChange={e => setAccountForm({...accountForm, creationDate: e.target.value})}
                                     />
                                 </div>

                                 <div className="space-y-2">
                                     <label className="text-xs font-bold text-gray-400">الوسوم (Tags)</label>
                                     <div className="flex gap-2">
                                         <button onClick={() => { if(tagInput) { setAccountForm({...accountForm, tags: [...(accountForm.tags || []), tagInput]}); setTagInput(''); } }} className="px-4 bg-[#c5a059] text-[#001a35] font-black rounded-xl text-xs">+</button>
                                         <input type="text" className="flex-1 p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059] text-right" 
                                             placeholder="أضف وسم..."
                                             value={tagInput}
                                             onChange={e => setTagInput(e.target.value)}
                                             onKeyDown={e => { if(e.key === 'Enter' && tagInput) { setAccountForm({...accountForm, tags: [...(accountForm.tags || []), tagInput]}); setTagInput(''); } }}
                                         />
                                     </div>
                                     <div className="flex flex-wrap gap-2 mt-2 justify-end">
                                         {accountForm.tags?.map((tag, i) => (
                                             <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300 flex items-center gap-1">
                                                 {tag} <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setAccountForm({...accountForm, tags: accountForm.tags?.filter((_, idx) => idx !== i)})} />
                                             </span>
                                         ))}
                                     </div>
                                 </div>

                                 <div className="space-y-2">
                                     <label className="text-xs font-bold text-gray-400">ربط ببلاغات أو قضايا (Link Reports)</label>
                                     <div className="bg-black/20 border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto custom-scroll">
                                         {allReports.map(report => (
                                             <div key={report.reportId} className="flex items-center justify-end gap-2 p-2 hover:bg-white/5 rounded cursor-pointer" onClick={() => {
                                                 const currentLinks = accountForm.linkedReportIds || [];
                                                 if (currentLinks.includes(report.reportId)) {
                                                     setAccountForm({...accountForm, linkedReportIds: currentLinks.filter(id => id !== report.reportId)});
                                                 } else {
                                                     setAccountForm({...accountForm, linkedReportIds: [...currentLinks, report.reportId]});
                                                 }
                                             }}>
                                                 <span className="text-xs text-gray-400 mr-auto">{new Date(report.timestamp).toLocaleDateString()}</span>
                                                 <span className="text-xs text-white font-bold">{report.targetData.displayName} - {report.reportType}</span>
                                                 <div className={`w-4 h-4 border rounded flex items-center justify-center ${accountForm.linkedReportIds?.includes(report.reportId) ? 'bg-[#c5a059] border-[#c5a059]' : 'border-gray-500'}`}>
                                                     {accountForm.linkedReportIds?.includes(report.reportId) && <Check size={12} className="text-[#001a35]" />}
                                                 </div>
                                             </div>
                                         ))}
                                         {allReports.length === 0 && <p className="text-center text-gray-500 text-xs py-2">لا توجد بلاغات متاحة للربط</p>}
                                     </div>
                                 </div>

                                 <div className="space-y-2">
                                     <label className="text-xs font-bold text-gray-400">ملاحظات إدارية</label>
                                     <textarea className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-[#c5a059] text-right min-h-[100px]" 
                                         value={accountForm.notes || ''} 
                                         onChange={e => setAccountForm({...accountForm, notes: e.target.value})}
                                     ></textarea>
                                 </div>

                                 <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
                                     <button onClick={() => setAccountManagerView('list')} className="px-6 py-3 rounded-xl font-black text-gray-400 hover:text-white transition-all">إلغاء</button>
                                     <button onClick={handleSaveAccount} className="px-8 py-3 gold-bg text-[#001a35] rounded-xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                                         <Save size={18} /> حفظ البيانات
                                     </button>
                                 </div>
                             </div>
                         </div>
                     )}
                 </div>
             </div>
         )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <section className="intel-card p-6 rounded-[30px] border-r-4 border-[#c5a059]">
            <h2 className="text-xl font-black gold-text mb-6 flex items-center gap-3"><Activity size={20} /> بوابة الرصد</h2>
            <div className="space-y-4">
              <div className="space-y-1 text-right">
                <label className="text-[10px] font-black text-gray-500 mr-2 uppercase">نوع المعرف</label>
                <select value={inputType} onChange={e => setInputType(e.target.value as any)} className="w-full p-4 bg-white text-black font-bold rounded-2xl text-sm outline-none">
                  <option value="username">اسم المستخدم</option>
                  <option value="userId">المعرف الرقمي (ID)</option>
                  <option value="profileUrl">رابط الملف</option>
                </select>
              </div>
              <div className="space-y-1 text-right">
                <label className="text-[10px] font-black text-gray-500 mr-2 uppercase">بيانات الهدف</label>
                <div className="relative">
                  <input type="text" placeholder="ادخل البيانات هنا..." className="w-full p-4 bg-white text-black font-bold rounded-2xl text-sm outline-none" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => handleSearch()} disabled={loading} className="flex-1 gold-bg text-[#001a35] font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase">
                   {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={18} />} 
                   تنفيذ الرصد
                </button>
                <button onClick={() => handleGroupSearch()} disabled={loading} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase">
                   {loading ? <Loader2 className="animate-spin" size={16} /> : <Users size={18} />} 
                   بيانات مجموعة
                </button>
              </div>

              {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
                      <p className="text-red-400 text-xs font-bold text-center">{errorMessage}</p>
                  </div>
              )}

              <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-[#c5a059]/50 rounded-2xl text-[#c5a059] font-black text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                <Camera size={18} /> تحليل صورة (AI)
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = async (ev) => {
                    const res = await analyzeRobloxImage(ev.target?.result as string);
                    if (res.type && res.value) handleSearch(res.type, res.value);
                  };
                  reader.readAsDataURL(file);
                }
              }} />
            </div>
          </section>

          <section className="intel-card p-6 rounded-[30px] max-h-[500px] overflow-hidden flex flex-col">
             <h2 className="text-sm font-black gold-text mb-4 uppercase flex items-center gap-2"><History size={16} /> الأرشيف الرقمي</h2>
             <div className="space-y-3 overflow-y-auto pr-2 custom-scroll flex-1 text-right">
               {history.length === 0 ? (
                 <p className="text-center text-gray-600 text-xs py-10 font-bold">الأرشيف فارغ</p>
               ) : history.map(item => (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={item.userId} onClick={() => handleSearch('userId', item.userId.toString())} className={`relative flex items-center gap-4 p-3 rounded-2xl cursor-pointer border transition-all group ${item.isPinned ? 'bg-[#c5a059]/10 border-[#c5a059]' : 'bg-white/5 border-white/5 hover:bg-[#c5a059]/15'}`}>
                    {item.isPinned && <Pin size={12} className="absolute top-2 left-2 text-[#c5a059] fill-[#c5a059]" />}
                    <img src={item.avatarUrl} className="w-10 h-10 rounded-xl border border-[#c5a059]/30" />
                    <div className="text-right flex-1 overflow-hidden">
                      <p className="text-xs font-black text-white truncate">@{item.username}</p>
                      <p className="text-[8px] text-gray-500 font-bold uppercase">{new Date(item.timestamp).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <button onClick={(e) => togglePinHistory(e, item.userId)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#c5a059] transition-opacity">
                      {item.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <button onClick={(e) => deleteHistoryItem(e, item.userId)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                 </motion.div>
               ))}
             </div>
          </section>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <AnimatePresence mode="wait">
            {userData ? (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} key={userData.userId} className="space-y-6">
                <section className="intel-card p-10 rounded-[40px] border-t-8 border-[#c5a059] relative overflow-hidden">
                  <div className="scanner-line"></div>
                  <div className="flex flex-col md:flex-row gap-10 items-start text-right relative z-10">
                    <div className="relative group">
                      <div className="absolute -inset-2 bg-gradient-to-tr from-[#c5a059] to-transparent rounded-[40px] blur opacity-30"></div>
                      <img src={userData.avatarUrl} className="w-56 h-56 rounded-[35px] border-4 border-[#c5a059] bg-[#001a35] shadow-2xl relative" />
                      <div className={`absolute -bottom-4 -right-4 w-12 h-12 rounded-full border-8 border-[#001a35] shadow-xl ${userData.presence === 'online' || userData.presence === 'playing' ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                      <div className="flex flex-col md:flex-row md:items-end gap-3 justify-end">
                        <span className="text-gray-500 font-mono text-sm uppercase tracking-widest">UUID: {userData.userId}</span>
                        <h2 className="text-6xl font-black gold-text leading-none">{userData.displayName}</h2>
                      </div>
                      <p className="text-2xl font-bold text-gray-400">@{userData.username}</p>
                      
                      {userData.description && (
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl relative mt-2">
                           <p className="text-[10px] text-[#c5a059] font-black absolute -top-3 right-4 bg-[#001424] px-2">BIO / الوصف</p>
                           <p className="text-sm text-gray-300 leading-relaxed max-h-24 overflow-y-auto custom-scroll">{userData.description}</p>
                        </div>
                      )}
                      
                      <div className={`p-4 rounded-2xl flex items-center justify-end gap-3 mt-4 border transition-all ${userData.presence === 'playing' ? 'bg-green-600/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                         <p className={`font-black text-sm uppercase font-mono ${userData.presence === 'playing' ? 'text-green-400' : 'text-gray-500'}`}>
                           {userData.presence === 'playing' ? `ACTIVITY_DETECTED: ${userData.currentGame || 'اسم اللعبة غير متاح'}` : 'STATUS: غير متصل بلعبة'}
                         </p>
                         <Monitor size={20} className={userData.presence === 'playing' ? "text-green-500 animate-pulse" : "text-gray-600"} />
                      </div>

                      <div className="flex gap-4 justify-end flex-wrap mt-6">
                        <button onClick={() => openLink(`https://www.roblox.com/users/${userData.userId}/profile`)} className="px-6 py-3 bg-[#c5a059] text-[#001a35] rounded-2xl font-black text-sm uppercase flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-[#c5a059]/40">
                          <ExternalLink size={20} />
                          فتح الملف
                        </button>
                        <button onClick={openInfoDossier} className="px-6 py-3 bg-[#001a35] text-[#c5a059] border-2 border-[#c5a059] rounded-2xl font-black text-sm uppercase flex items-center gap-2 hover:bg-[#c5a059] hover:text-[#001a35] transition-all">
                          <FileBox size={20} />
                           ملف الهدف الشامل
                        </button>
                        <button onClick={copyToClipboard} className="px-6 py-3 bg-gray-700 text-white rounded-2xl font-black text-sm uppercase flex items-center gap-2 hover:bg-gray-600 transition-all">
                          {copied ? <CheckCircle size={20} className="text-green-400" /> : <Copy size={20} />}
                          {copied ? 'تم النسخ' : 'نسخ شامل'}
                        </button>
                        <button onClick={generateSimpleAiReport} disabled={isGeneratingSimple} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/40">
                          {isGeneratingSimple ? <Loader2 className="animate-spin" size={20} /> : <FileSignature size={20} />} 
                          تقرير ذكي
                        </button>
                        <button onClick={openFriendsWithRadar} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/40"><Radar size={20} /> خريطة الأصدقاء</button>
                        <button onClick={() => setShowGroupsModal(true)} className="px-6 py-3 bg-violet-600 text-white rounded-2xl font-black text-sm uppercase flex items-center gap-2 hover:bg-violet-700 transition-all shadow-lg shadow-violet-900/40"><Users size={20} /> قروبات اللاعب</button>
                        <button onClick={exportOfficialPdf} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/40"><Download size={20} /> تصدير PDF</button>
                        <button onClick={handleExportPdfReport} className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-black text-sm uppercase flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/40"><FileText size={20} /> تصدير التقرير PDF</button>
                        <button onClick={() => setShowReportModal(true)} className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-sm uppercase flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-900/40"><ShieldAlert size={20} /> بلاغ سيبراني</button>
                      </div>
                    </div>
                  </div>

                  {simpleReport && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-indigo-900/20 border border-indigo-500/30 rounded-3xl text-right">
                       <h3 className="text-indigo-400 font-black flex items-center justify-end gap-2 mb-3">
                         <Sparkles size={18} /> ملخص التحليل السريع
                       </h3>
                       <div className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">
                         {simpleReport}
                       </div>
                    </motion.div>
                  )}

                  <div className="mt-10 border-t border-red-500/20 pt-8">
                     <h3 className="text-xl font-black text-red-500 flex items-center justify-end gap-3 mb-6 uppercase"><AlertTriangle size={24}/> سجل البلاغات المرصودة ({targetReports.length})</h3>
                     <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scroll">
                       {targetReports.length === 0 ? (
                         <p className="text-center text-gray-600 text-xs font-bold py-4">لا توجد بلاغات مسجلة ضد الهدف حالياً.</p>
                       ) : (
                         targetReports.map(report => (
                           <div key={report.reportId} className={`p-6 border rounded-[25px] text-right ${report.status === 'Closed' ? 'bg-gray-800/20 border-gray-600/20 opacity-70' : 'bg-red-900/10 border-red-500/20'}`}>
                              <div className="flex justify-between items-start mb-2">
                                 <div className="flex flex-col items-start">
                                    <span className="text-[10px] text-gray-500 font-mono">REF: {report.reportId}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${report.status === 'Open' ? 'bg-red-500 text-white' : report.status === 'Resolved' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>{report.status}</span>
                                 </div>
                                 <div className="text-right">
                                   <p className="text-red-400 font-black">{report.reportType}</p>
                                   <p className="text-[10px] text-gray-500">{new Date(report.timestamp).toLocaleString('ar-EG')}</p>
                                 </div>
                              </div>
                              <p className="text-sm text-gray-300 italic">"{report.incidentSummary}"</p>
                              <div className="mt-3 flex gap-2 justify-end">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${report.severity === 'High' ? 'bg-red-600' : report.severity === 'Medium' ? 'bg-orange-600' : 'bg-blue-600'}`}>
                                  خطورة: {report.severity}
                                </span>
                              </div>
                           </div>
                         ))
                       )}
                     </div>
                  </div>
                </section>
              </motion.div>
            ) : (gameResult || livePlayerResult) ? (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
                
                {gameResult && (
                  <div className="intel-card p-10 rounded-[40px] border-l-8 border-[#c5a059] relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-8 items-start text-right">
                      <img src={gameResult.iconUrl} className="w-56 h-56 rounded-[25px] border-4 border-[#c5a059] bg-[#001a35] shadow-xl" />
                      <div className="flex-1 space-y-3 w-full">
                        <div className="flex flex-col items-end">
                          <div className="flex gap-2">
                            <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">UNIVERSE ID: {gameResult.universeId}</span>
                            <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">|</span>
                            <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">PLACE ID: {gameResult.placeId}</span>
                          </div>
                          <h2 className="text-4xl font-black gold-text leading-tight">{gameResult.name}</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-right">
                            <p className="text-[9px] text-gray-500 font-black uppercase">اللاعبين حالياً</p>
                            <div className="flex items-center justify-end gap-1 text-green-400 font-bold">
                              <span>{gameResult.playing.toLocaleString()}</span>
                              <Users size={14} />
                            </div>
                          </div>
                          <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-right">
                            <p className="text-[9px] text-gray-500 font-black uppercase">عدد الزيارات</p>
                            <div className="flex items-center justify-end gap-1 text-white font-bold">
                              <span>{gameResult.visits.toLocaleString()}</span>
                              <Eye size={14} />
                            </div>
                          </div>
                          <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-right">
                            <p className="text-[9px] text-gray-500 font-black uppercase">الإعجابات</p>
                            <div className="flex items-center justify-end gap-1 text-white font-bold">
                              <span>{((gameResult.likes / (gameResult.likes + gameResult.dislikes)) * 100).toFixed(1)}%</span>
                              <ThumbsUp size={14} />
                            </div>
                          </div>
                          <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-right">
                            <p className="text-[9px] text-gray-500 font-black uppercase">الحد الأقصى</p>
                            <div className="flex items-center justify-end gap-1 text-white font-bold">
                              <span>{gameResult.maxPlayers}</span>
                              <Server size={14} />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-2 justify-end">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${gameResult.price === null || gameResult.price === 0 ? "bg-green-600/20 text-green-400" : "bg-yellow-600/20 text-yellow-400"}`}>
                            {gameResult.price === null || gameResult.price === 0 ? "مجانية (Free)" : `مدفوعة (${gameResult.price} R$)`}
                          </span>
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-600/20 text-blue-400">{gameResult.genre}</span>
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-purple-600/20 text-purple-400">{gameResult.universeAvatarType}</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl relative mt-4">
                          <p className="text-[10px] text-[#c5a059] font-black absolute -top-3 right-4 bg-[#001424] px-2">الوصف / Description</p>
                          <p className="text-sm text-gray-300 leading-relaxed max-h-32 overflow-y-auto custom-scroll whitespace-pre-line">{gameResult.description || "لا يوجد وصف."}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 p-4 bg-black/20 rounded-xl border border-white/5">
                            <div className="flex gap-2">
                              <button onClick={() => {
                                const jsonString = JSON.stringify(gameResult, null, 2);
                                navigator.clipboard.writeText(jsonString);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }} className="px-4 py-2 bg-gray-700 text-white rounded-xl text-xs font-bold hover:bg-gray-600 transition-colors flex items-center gap-2">
                                {copied ? <CheckCircle size={14}/> : <Copy size={14}/>} نسخ JSON
                              </button>
                              <button onClick={() => playSfx('export')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors flex items-center gap-2">
                                  <ImageIcon size={14}/> تصدير صورة
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 font-black uppercase">المطور / المالك</p>
                              <div className="flex items-center gap-2 justify-end cursor-pointer hover:text-[#c5a059]" onClick={() => handleSearch(gameResult.creator.type === 'Group' ? 'username' : 'userId', gameResult.creator.id.toString())}>
                                  <span className="font-bold text-white text-sm">{gameResult.creator.name}</span>
                                  {gameResult.creator.type === 'Group' ? <Users size={16}/> : <UserCircle size={16}/>}
                              </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2 px-2">
                          <span>Updated: {new Date(gameResult.updated).toLocaleDateString('ar-EG')}</span>
                          <span>Created: {new Date(gameResult.created).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Player Live-Data injected by WORM-AI💀🔥 */}
                {livePlayerResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="intel-card p-6 rounded-[30px] border border-[#c5a059]/30 bg-[#001020] relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-6 items-center text-right">
                       <img src={livePlayerResult.avatarUrl} className="w-32 h-32 rounded-full border-4 border-[#c5a059] bg-[#001a35] shadow-lg" />
                       <div className="flex-1 w-full space-y-2">
                          <div className="flex items-center justify-end gap-3">
                             {livePlayerResult.isOnline ? (
                                <span className="bg-green-600/20 text-green-500 px-3 py-1 rounded-full text-xs font-black flex items-center gap-2 border border-green-500/30">
                                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> متصل الآن
                                </span>
                             ) : (
                                <span className="bg-gray-600/20 text-gray-500 px-3 py-1 rounded-full text-xs font-black flex items-center gap-2 border border-gray-500/30">
                                   <Radio size={12} /> غير متصل
                                </span>
                             )}
                             <h3 className="text-2xl font-black text-white">{livePlayerResult.displayName}</h3>
                          </div>
                          <p className="text-sm text-gray-400 font-bold">@{livePlayerResult.username}</p>
                          
                          <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col items-end gap-1">
                             <p className="text-[10px] text-[#c5a059] font-black uppercase">الحالة الحالية</p>
                             {livePlayerResult.placeId ? (
                                <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                                   <Gamepad2 size={16} />
                                   <span>يلعب الآن: {livePlayerResult.gameName || 'لعبة غير معروفة'}</span>
                                </div>
                             ) : (
                                <p className="text-gray-500 text-xs">آخر تواجد: {new Date(livePlayerResult.lastOnline).toLocaleString('ar-EG')}</p>
                             )}
                          </div>

                          {livePlayerResult.primaryGroup && (
                             <div className="flex items-center justify-end gap-2 text-xs text-gray-300">
                                <span className="text-[#c5a059]">{livePlayerResult.primaryGroup.role}</span>
                                <span>في</span>
                                <span className="font-bold">{livePlayerResult.primaryGroup.name}</span>
                                <Briefcase size={12} />
                             </div>
                          )}

                          <div className="flex gap-2 justify-end mt-2">
                             {livePlayerResult.placeId && (
                                <button onClick={() => openLink(`roblox://placeId=${livePlayerResult.placeId}`)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-green-900/40 transition-all">
                                   <Play size={14} fill="white" /> انضم للعبة
                                </button>
                             )}
                             <button onClick={() => {
                                const jsonString = JSON.stringify(livePlayerResult, null, 2);
                                navigator.clipboard.writeText(jsonString);
                             }} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all">
                                JSON
                             </button>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}

              </motion.div>
            ) : (
              <div className="intel-card p-40 rounded-[50px] text-center border-dashed border-4 border-[#c5a059]/10 opacity-30 flex flex-col items-center justify-center grayscale">
                <Globe size={160} className="gold-text mb-8 animate-pulse" />
                <h3 className="text-4xl font-black gold-text tracking-widest uppercase">نظام الرصد العالمي جاهز</h3>
                <p className="text-gray-600 mt-4 font-bold text-lg">بانتظار تحديد إحداثيات الهدف لبدء العملية</p>
              </div>
            )}
          </AnimatePresence>
          
          {/* Note: The old inline group result display has been removed from here */}
          {/* It is now a modal below */}
        </div>
      </main>

      {/* Friends Modal - Re-implemented */}
      <AnimatePresence>
        {showFriendsModal && userData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="intel-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[40px] border-4 border-[#c5a059] shadow-2xl overflow-hidden relative">
              <div className="p-6 border-b border-[#c5a059]/30 flex justify-between items-center bg-[#001a35]">
                 <button onClick={() => setShowFriendsModal(false)} className="p-2 hover:bg-red-500/20 rounded-full text-red-500 transition-colors"><X size={24} /></button>
                 <div className="text-right">
                   <h3 className="text-2xl font-black gold-text">شبكة العلاقات والأصدقاء</h3>
                   <p className="text-xs text-gray-400 font-bold">TOTAL FRIENDS: {userData.friendsCount}</p>
                 </div>
              </div>
              <div className="p-4 bg-[#000c1a] border-b border-white/10">
                <div className="relative">
                  <input 
                    type="text" placeholder="بحث في قائمة الأصدقاء..." 
                    className="w-full p-4 pl-12 bg-white/5 text-white font-bold rounded-2xl outline-none focus:ring-2 ring-[#c5a059]/50 transition-all text-right"
                    value={friendSearchQuery} onChange={e => setFriendSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scroll bg-[#001424]">
                {friendsLoading ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-4">
                    <Loader2 className="animate-spin gold-text" size={40} />
                    <p className="text-[#c5a059] font-black">جاري تحليل العلاقات...</p>
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 font-bold">لا توجد نتائج مطابقة</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredFriends.map(friend => (
                      <div key={friend.id} onClick={() => { setShowFriendsModal(false); handleSearch('userId', friend.id.toString()); }} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-[#c5a059] hover:bg-[#c5a059]/10 cursor-pointer transition-all group text-center relative overflow-hidden">
                        <img src={friend.avatarUrl} className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-[#c5a059]/30 group-hover:border-[#c5a059] transition-all" loading="lazy" />
                        <h4 className="font-bold text-white truncate text-sm">{friend.displayName}</h4>
                        <p className="text-xs text-gray-400 truncate">@{friend.name}</p>
                        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${friend.presence === 'online' ? 'bg-green-500 shadow-[0_0_10px_lime]' : friend.presence === 'playing' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
                        {friend.presence === 'playing' && <p className="text-[9px] text-green-400 mt-1 font-black uppercase">In Game</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Info Dossier Modal - Re-implemented */}
      <AnimatePresence>
        {showInfoModal && userData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="intel-card w-full max-w-5xl h-[85vh] flex flex-col rounded-[30px] border border-[#c5a059]/50 shadow-2xl relative overflow-hidden bg-[#001a35]">
                <div className="p-6 border-b border-[#c5a059]/20 flex justify-between items-center bg-black/20">
                   <button onClick={() => setShowInfoModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} className="text-gray-400" /></button>
                   <div className="flex gap-4">
                      <button onClick={() => setInfoTab('groups')} className={`px-6 py-2 rounded-xl font-black text-sm transition-all ${infoTab === 'groups' ? 'gold-bg text-[#001a35]' : 'bg-white/5 text-gray-400 hover:text-white'}`}>المجموعات ({userData.groups.length})</button>
                      <button onClick={() => setInfoTab('details')} className={`px-6 py-2 rounded-xl font-black text-sm transition-all ${infoTab === 'details' ? 'gold-bg text-[#001a35]' : 'bg-white/5 text-gray-400 hover:text-white'}`}>البيانات الأساسية</button>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scroll bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                   {infoTab === 'details' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <StatItem label="User ID" value={userData.userId} icon={<Fingerprint size={16} className="text-[#c5a059]"/>} />
                         <StatItem label="Account Age" value={userData.accountAge || 'N/A'} icon={<Clock size={16} className="text-blue-400"/>} />
                         <StatItem label="Join Date" value={userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('ar-EG') : 'N/A'} icon={<Calendar size={16} className="text-green-400"/>} />
                         <StatItem label="Premium" value={userData.isPremium ? 'Active' : 'None'} color={userData.isPremium ? 'text-yellow-400' : 'text-gray-500'} icon={<Star size={16}/>} />
                         <StatItem label="Ban Status" value={userData.isBanned ? 'BANNED' : 'Clean'} color={userData.isBanned ? 'text-red-500' : 'text-green-500'} icon={<Ban size={16}/>} />
                         <StatItem label="Friends" value={userData.friendsCount || 0} icon={<Users size={16} className="text-indigo-400"/>} />
                         <StatItem label="Followers" value={userData.followersCount || 0} icon={<Share2 size={16} className="text-pink-400"/>} />
                         <StatItem label="Following" value={userData.followingCount || 0} icon={<UserCheck size={16} className="text-cyan-400"/>} />
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {userData.groups.map(group => (
                           <div key={group.groupId} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:border-[#c5a059] transition-all group hover:bg-[#c5a059]/5 cursor-pointer" onClick={() => { setShowInfoModal(false); handleGroupSearch(group.groupId.toString()); }}>
                              <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-500 font-mono">RANK: {group.rank}</span>
                                <ExternalLink size={16} className="text-gray-600 group-hover:text-[#c5a059]" />
                              </div>
                              <div className="text-right">
                                 <h4 className="font-bold text-white group-hover:text-[#c5a059] transition-colors">{group.groupName}</h4>
                                 <p className="text-xs text-gray-400">{group.role}</p>
                              </div>
                           </div>
                         ))}
                         {userData.groups.length === 0 && <p className="col-span-full text-center py-20 text-gray-500 font-bold">لا ينتمي لأي مجموعات</p>}
                      </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Groups List Modal (User's Groups) */}
      <AnimatePresence>
        {showGroupsModal && userData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="intel-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[40px] border-4 border-[#c5a059] shadow-2xl overflow-hidden relative">
              <div className="p-6 border-b border-[#c5a059]/30 flex justify-between items-center bg-[#001a35]">
                 <button onClick={() => setShowGroupsModal(false)} className="p-2 hover:bg-red-500/20 rounded-full text-red-500 transition-colors"><X size={24} /></button>
                 <div className="text-right">
                   <h3 className="text-2xl font-black gold-text">قروبات اللاعب</h3>
                   <p className="text-xs text-gray-400 font-bold">TOTAL GROUPS: {userData.groups.length}</p>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scroll bg-[#001424]">
                {userData.groups.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 font-bold">لا ينتمي لأي مجموعات</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userData.groups.map(group => (
                      <div key={group.groupId} onClick={() => { setShowGroupsModal(false); handleGroupSearch(group.groupId.toString()); }} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-[#c5a059] hover:bg-[#c5a059]/10 cursor-pointer transition-all group flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-2">
                           <ExternalLink size={16} className="text-gray-600 group-hover:text-[#c5a059]" />
                           <h4 className="font-bold text-white text-right group-hover:text-[#c5a059] transition-colors line-clamp-2">{group.groupName}</h4>
                        </div>
                        <div className="text-right border-t border-white/10 pt-3 mt-2">
                           <div className="flex justify-between items-center">
                              <span className={`text-xs font-black px-2 py-1 rounded ${group.rank === 255 ? 'bg-red-900 text-red-200' : group.rank >= 200 ? 'bg-orange-900 text-orange-200' : group.rank >= 100 ? 'bg-indigo-900 text-indigo-200' : 'bg-gray-800 text-gray-400'}`}>
                                 {group.rank === 255 ? 'OWNER' : group.rank >= 200 ? 'ADMIN' : group.rank >= 100 ? 'DEV/HIGH' : 'MEMBER'}
                              </span>
                              <span className="text-[10px] font-mono text-gray-500">RANK: {group.rank}</span>
                           </div>
                           <p className="text-xs text-gray-300 mt-2 font-bold">{group.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW: Group Detail Modal (The fix you requested) */}
      <AnimatePresence>
         {showGroupDetailModal && groupResult && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="intel-card w-full max-w-5xl max-h-[90vh] flex flex-col rounded-[40px] border-4 border-[#c5a059] relative overflow-hidden bg-[#001020]">
                    <div className="p-6 border-b border-[#c5a059]/30 flex justify-between items-center bg-[#001a35]">
                       <button onClick={() => setShowGroupDetailModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><X size={24} /></button>
                       <div className="text-right">
                         <h3 className="text-2xl font-black gold-text">بيانات المجموعة السرية</h3>
                         <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">SECURE GROUP ANALYSIS</p>
                       </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 custom-scroll">
                        <div className="flex flex-col md:flex-row gap-8 items-start text-right">
                             <img src={groupResult.iconUrl} className="w-40 h-40 rounded-[25px] border-4 border-[#c5a059] bg-[#001a35] shadow-xl" />
                             <div className="flex-1 space-y-3 w-full">
                                 <div className="flex flex-col items-end">
                                     <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">GROUP ID: {groupResult.id}</span>
                                     <h2 className="text-4xl font-black gold-text leading-tight">{groupResult.name}</h2>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                     <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-right">
                                         <p className="text-[9px] text-gray-500 font-black uppercase">المالك</p>
                                         <div className="flex items-center justify-end gap-1 text-white font-bold cursor-pointer hover:text-[#c5a059]" onClick={() => {
                                            if(groupResult.owner) {
                                                setShowGroupDetailModal(false);
                                                handleSearch('userId', groupResult.owner.id.toString());
                                            }
                                         }}>
                                             {groupResult.owner ? (
                                                 <>
                                                     <span>{groupResult.owner.displayName}</span>
                                                     <UserCog size={14} />
                                                 </>
                                             ) : 'لا يوجد'}
                                         </div>
                                     </div>
                                     <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-right">
                                         <p className="text-[9px] text-gray-500 font-black uppercase">الأعضاء</p>
                                         <div className="flex items-center justify-end gap-1 text-white font-bold">
                                             <span>{groupResult.memberCount.toLocaleString()}</span>
                                             <Users size={14} />
                                         </div>
                                     </div>
                                     <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-right">
                                         <p className="text-[9px] text-gray-500 font-black uppercase">التأسيس</p>
                                         <div className="flex items-center justify-end gap-1 text-white font-bold">
                                             <span>{new Date(groupResult.created).toLocaleDateString('ar-EG')}</span>
                                             <Calendar size={14} />
                                         </div>
                                     </div>
                                     <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-right">
                                         <p className="text-[9px] text-gray-500 font-black uppercase">الحالة</p>
                                         <div className="flex items-center justify-end gap-1 font-bold">
                                             <span className={groupResult.isLocked ? "text-red-500" : "text-green-500"}>{groupResult.isLocked ? "مغلقة" : "مفتوحة"}</span>
                                             {groupResult.isLocked ? <Lock size={14}/> : <Globe size={14} />}
                                         </div>
                                     </div>
                                 </div>

                                 <div className="bg-white/5 border border-white/10 p-4 rounded-2xl relative mt-4">
                                     <p className="text-[10px] text-[#c5a059] font-black absolute -top-3 right-4 bg-[#001424] px-2">الوصف / Description</p>
                                     <p className="text-sm text-gray-300 leading-relaxed max-h-32 overflow-y-auto custom-scroll whitespace-pre-line">{groupResult.description || "لا يوجد وصف."}</p>
                                 </div>
                             </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <h3 className="text-lg font-black gold-text mb-4 flex items-center justify-end gap-2"><Briefcase size={20}/> هيكل الرتب ({groupResult.roles.length})</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 text-gray-400 text-xs uppercase">
                                            <th className="p-3 rounded-r-xl">Role Name</th>
                                            <th className="p-3">Rank ID</th>
                                            <th className="p-3 rounded-l-xl">Members</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-gray-200">
                                        {groupResult.roles.map((role) => (
                                            <tr key={role.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-3 font-bold">{role.name}</td>
                                                <td className="p-3 font-mono text-[#c5a059]">{role.rank}</td>
                                                <td className="p-3">{role.memberCount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                 </motion.div>
             </div>
         )}
      </AnimatePresence>
      
      {/* Report Modal - Re-implemented */}
      <AnimatePresence>
        {showReportModal && userData && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0f0505] w-full max-w-lg rounded-[30px] border-2 border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden">
                 <div className="p-6 bg-red-600/10 border-b border-red-500/20 flex items-center justify-between">
                    <button onClick={() => setShowReportModal(false)}><X className="text-red-400 hover:text-white" /></button>
                    <h3 className="text-xl font-black text-red-500 flex items-center gap-2">إنشاء بلاغ سيبراني <ShieldAlert /></h3>
                 </div>
                 <div className="p-6 space-y-4">
                    <div className="space-y-2 text-right">
                       <label className="text-xs font-bold text-gray-400">نوع الانتهاك</label>
                       <select className="w-full p-3 bg-white/5 border border-red-500/30 rounded-xl text-white outline-none" value={reportForm.type} onChange={e => setReportForm({...reportForm, type: e.target.value as ReportType})}>
                          <option value="Suspicious Activity">نشاط مشبوه (Suspicious Activity)</option>
                          <option value="Harassment">تحرش / تنمر (Harassment)</option>
                          <option value="Scam / Fraud">احتيال (Scam)</option>
                          <option value="Impersonation">انتحال شخصية (Impersonation)</option>
                          <option value="Other">أخرى</option>
                       </select>
                    </div>
                    <div className="space-y-2 text-right">
                       <label className="text-xs font-bold text-gray-400">مستوى الخطورة</label>
                       <div className="flex gap-2">
                          {['Low', 'Medium', 'High'].map((lvl) => (
                             <button key={lvl} onClick={() => setReportForm({...reportForm, severity: lvl as SeverityLevel})} className={`flex-1 py-2 rounded-xl font-black text-xs uppercase border ${reportForm.severity === lvl ? (lvl === 'High' ? 'bg-red-600 border-red-600 text-white' : lvl === 'Medium' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-blue-500 border-blue-500 text-white') : 'border-white/10 text-gray-500 hover:bg-white/5'}`}>
                                {lvl}
                             </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2 text-right">
                       <label className="text-xs font-bold text-gray-400">تفاصيل الواقعة</label>
                       <textarea className="w-full p-4 bg-white/5 border border-red-500/30 rounded-xl text-white min-h-[120px] outline-none text-right" placeholder="اشرح المشكلة بالتفصيل..." value={reportForm.summary} onChange={e => setReportForm({...reportForm, summary: e.target.value})}></textarea>
                    </div>
                    <button onClick={submitCyberReport} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-lg shadow-red-900/50 transition-all uppercase flex items-center justify-center gap-2">
                       <FileWarning size={20} /> تسجيل البلاغ في النظام
                    </button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
      
      {/* Analyst Dashboard - Re-implemented */}
      <AnimatePresence>
         {showAnalystDashboard && (
            <div className="fixed inset-0 z-[70] bg-[#000c1a] flex flex-col">
               <div className="p-6 border-b border-[#c5a059]/30 bg-[#001424] flex justify-between items-center shadow-2xl">
                  <div className="flex items-center gap-4">
                     <button onClick={() => setShowAnalystDashboard(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white"><ArrowRight /></button>
                     <div className="text-right">
                       <h2 className="text-2xl font-black gold-text">غرفة العمليات المركزية</h2>
                       <p className="text-xs text-gray-500 font-bold uppercase">LIVE INTEL FEED - AUTHORIZED PERSONNEL ONLY</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="bg-red-900/20 px-4 py-2 rounded-xl border border-red-500/30">
                        <p className="text-[10px] text-red-400 font-black">HIGH PRIORITY</p>
                        <p className="text-xl font-mono font-bold text-white text-center">{allReports.filter(r => r.severity === 'High').length}</p>
                     </div>
                     <div className="bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-500/30">
                        <p className="text-[10px] text-blue-400 font-black">TOTAL CASES</p>
                        <p className="text-xl font-mono font-bold text-white text-center">{allReports.length}</p>
                     </div>
                  </div>
               </div>
               <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 border-r border-white/10 overflow-y-auto custom-scroll bg-[#000810]">
                     {allReports.map(report => (
                        <div key={report.reportId} onClick={() => setSelectedReportId(report.reportId)} className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all text-right ${selectedReportId === report.reportId ? 'bg-[#c5a059]/10 border-r-4 border-r-[#c5a059]' : ''}`}>
                           <div className="flex justify-between items-center mb-1">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded ${report.severity === 'High' ? 'bg-red-600' : 'bg-gray-700'}`}>{report.severity}</span>
                              <span className="text-xs font-mono text-gray-500">{report.reportId}</span>
                           </div>
                           <h4 className="font-bold text-white truncate">{report.targetData.displayName}</h4>
                           <p className="text-xs text-gray-400 truncate">@{report.targetData.username}</p>
                           <p className="text-[10px] text-gray-500 mt-2">{new Date(report.timestamp).toLocaleString('ar-EG')}</p>
                        </div>
                     ))}
                  </div>
                  <div className="flex-1 bg-[#001020] p-8 overflow-y-auto custom-scroll relative">
                     {selectedReportId ? (
                        (() => {
                           const report = allReports.find(r => r.reportId === selectedReportId);
                           if (!report) return null;
                           return (
                              <div className="max-w-3xl mx-auto space-y-8 text-right">
                                 <div className="flex justify-between items-start">
                                    <div className="flex gap-2">
                                       {['Open', 'In Progress', 'Resolved', 'Closed'].map(status => (
                                          <button key={status} onClick={() => updateReportStatus(report.reportId, status as ReportStatus)} className={`px-4 py-2 rounded-lg text-xs font-bold border ${report.status === status ? 'bg-white text-black border-white' : 'border-white/20 text-gray-500 hover:border-white'}`}>
                                             {status}
                                          </button>
                                       ))}
                                    </div>
                                    <h2 className="text-3xl font-black text-white">تفاصيل ملف القضية</h2>
                                 </div>
                                 
                                 <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                    <h3 className="text-[#c5a059] font-black mb-4 flex items-center justify-end gap-2">بيانات الهدف <User /></h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                       <div className="p-3 bg-black/20 rounded-xl"><p className="text-gray-500 text-xs">User ID</p><p className="font-mono text-white">{report.targetData.userId}</p></div>
                                       <div className="p-3 bg-black/20 rounded-xl"><p className="text-gray-500 text-xs">Username</p><p className="font-mono text-white">@{report.targetData.username}</p></div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                      <button onClick={() => { setShowAnalystDashboard(false); handleSearch('userId', report.targetData.userId.toString()); }} className="text-xs text-blue-400 hover:underline">عرض الملف الكامل في النظام</button>
                                    </div>
                                 </div>

                                 <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-2xl">
                                    <h3 className="text-red-500 font-black mb-4 flex items-center justify-end gap-2">تفاصيل البلاغ <FileWarning /></h3>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg bg-black/20 p-4 rounded-xl">{report.incidentSummary}</p>
                                    <div className="mt-4 flex gap-4 text-xs text-gray-500 font-mono justify-end">
                                       <span>Reporter: {report.reporterAlias}</span>
                                       <span>|</span>
                                       <span>Context: {report.platformContext}</span>
                                    </div>
                                 </div>

                                 <div className="bg-green-900/10 border border-green-500/20 p-6 rounded-2xl">
                                    <h3 className="text-green-500 font-black mb-4 flex items-center justify-end gap-2">ملاحظات المحقق <Gavel /></h3>
                                    <textarea className="w-full bg-black/20 border border-green-500/10 p-4 rounded-xl text-white outline-none min-h-[100px] text-right" placeholder="أضف ملاحظات التحقيق هنا..." value={adminNote} onChange={e => setAdminNote(e.target.value)}></textarea>
                                    <div className="flex justify-end mt-2">
                                       <button onClick={() => updateReportStatus(report.reportId, report.status)} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm">حفظ الملاحظة</button>
                                    </div>
                                    {report.adminNotes && (
                                       <div className="mt-4 p-4 bg-black/40 rounded-xl text-gray-400 text-xs whitespace-pre-line font-mono border-r-2 border-green-500">
                                          {report.adminNotes}
                                       </div>
                                    )}
                                 </div>
                              </div>
                           );
                        })()
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                           <Shield size={100} className="mb-4" />
                           <p className="font-black text-xl">اختر بلاغاً للبدء في التحليل</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}
      </AnimatePresence>

      {/* AI Chat Interface - Re-implemented */}
      <AnimatePresence>
        {showAiChat && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="fixed bottom-24 left-8 z-40 w-96 h-[500px] intel-card rounded-[30px] border-2 border-[#c5a059] flex flex-col shadow-2xl overflow-hidden bg-[#001020]">
             <div className="p-4 bg-gradient-to-r from-[#c5a059] to-[#a68545] text-[#001a35] font-black flex justify-between items-center">
               <button onClick={() => setShowAiChat(false)}><X size={18} /></button>
               <span className="flex items-center gap-2">مساعد الاستخبارات <Sparkles size={16} /></span>
             </div>
             <div className="flex-1 p-4 overflow-y-auto custom-scroll space-y-4">
                {result ? (
                   <>
                     <div className="bg-white/10 p-3 rounded-2xl rounded-tr-none text-white text-sm text-right self-end ml-auto max-w-[90%]">
                       مرحباً أيها المحقق. أنا جاهز لتحليل بيانات الهدف <b>{result.data && 'displayName' in result.data ? result.data.displayName : 'المحدد'}</b>. ماذا تريد أن تعرف؟
                     </div>
                     {aiResponse && (
                       <div className="bg-[#c5a059]/20 border border-[#c5a059]/30 p-3 rounded-2xl rounded-tl-none text-gray-200 text-sm text-right mr-auto max-w-[90%] leading-relaxed whitespace-pre-wrap">
                         {aiResponse}
                       </div>
                     )}
                   </>
                ) : (
                   <div className="text-center text-gray-500 py-10 px-4">
                     <p>يجب تحديد هدف ورصد بياناته أولاً لتفعيل وحدة الذكاء الاصطناعي.</p>
                   </div>
                )}
                {aiLoading && <div className="flex justify-start"><Loader2 className="animate-spin text-[#c5a059]" /></div>}
             </div>
             <div className="p-3 bg-black/20 border-t border-white/10">
               <div className="relative">
                 <input 
                   disabled={!result || aiLoading}
                   type="text" placeholder="اكتب استفسارك هنا..." 
                   className="w-full p-3 pr-10 bg-white/5 rounded-xl text-white text-xs outline-none focus:ring-1 ring-[#c5a059] text-right"
                   value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiAsk()}
                 />
                 <button onClick={handleAiAsk} disabled={!result || aiLoading} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#c5a059] hover:scale-110 transition-transform">
                   <Send size={16} />
                 </button>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 left-8 z-50 flex flex-col gap-4">
        <button onClick={() => setShowAiChat(!showAiChat)} className="p-4 gold-bg text-[#001a35] rounded-full shadow-[0_0_25px_rgba(197,160,89,0.5)] hover:scale-110 transition-all border-4 border-[#001a35]"><Sparkles size={24} /></button>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-4 bg-black/60 border-2 border-[#c5a059]/30 rounded-full gold-text hover:bg-black transition-all">
          {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string | number; icon?: React.ReactNode; color?: string }> = ({ label, value, icon, color }) => (
  <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-right flex flex-col justify-center hover:bg-white/5 transition-all">
    <div className="flex items-center justify-end gap-2 mb-1">
      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{label}</p>
      {icon}
    </div>
    <p className={`text-xl font-mono font-black truncate ${color || 'text-white'}`}>{value}</p>
  </div>
);

export default App;
