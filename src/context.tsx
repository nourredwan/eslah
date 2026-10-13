import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Report, ReportCategory, ReportPriority, User, NotificationType } from './types';
import { api } from './services/api';

export type ServerStatus = 'checking' | 'connected' | 'offline';

interface AppState {
  currentUser: User;
  reports: Report[];
  notifications: NotificationType[];
  sidebarOpen: boolean;
  language: 'ar' | 'en';
  serverStatus: ServerStatus;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; email: string; password: string; role?: string; phone?: string; bio?: string }) => Promise<void>;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  addReport: (
    report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'upvotes' | 'upvotedBy'>,
    imageFiles?: File[]
  ) => Promise<void>;
  updateReport: (id: string, updates: Partial<Report>) => Promise<void>;
  adoptReport: (reportId: string) => Promise<void>;
  addComment: (reportId: string, text: string) => Promise<void>;
  toggleUpvote: (reportId: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  detectCategory: (text: string) => ReportCategory;
  detectPriority: (text: string) => ReportPriority;
  getUserById: (id: string) => User | undefined;
  refreshReports: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: { id: '', name: 'زائر', email: '', role: 'user', avatar: '👤', points: 0, badges: [], joinedAt: '', reportsCount: 0, resolvedCount: 0, rating: 0, bio: '', phone: '' },
    reports: [],
    notifications: [],
    sidebarOpen: false,
    language: 'ar',
    serverStatus: 'checking',
    isLoading: true,
  });

  // Check backend server connection and fetch real data
  const initApp = useCallback(async () => {
    try {
      const health = await api.checkHealth();
      if (health && health.status === 'ok' && health.database === 'connected') {
        // Backend is up!
        setState(prev => ({ ...prev, serverStatus: 'connected' }));

        // Try getting logged in user
        if (api.getToken()) {
          try {
            const me = await api.auth.getMe();
            if (me) {
              setState(prev => ({ ...prev, currentUser: me }));
            }
          } catch {
            api.setToken(null);
          }
        }

        // Fetch reports from backend
        try {
          const remoteReports = await api.reports.getAll();
          if (remoteReports) {
            setState(prev => ({ ...prev, reports: remoteReports, isLoading: false }));
            return;
          }
        } catch (err) {
          console.warn('Could not fetch remote reports:', err);
        }
      } else {
        setState(prev => ({ ...prev, serverStatus: 'offline' }));
      }
    } catch {
      setState(prev => ({ ...prev, serverStatus: 'offline' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

  const refreshReports = useCallback(async () => {
    if (state.serverStatus === 'connected') {
      try {
        const remoteReports = await api.reports.getAll();
        if (remoteReports) {
          setState(prev => ({ ...prev, reports: remoteReports }));
        }
      } catch (err) {
        console.error('Failed to refresh reports:', err);
      }
    }
  }, [state.serverStatus]);

  const login = useCallback(async (email: string, password: string) => {
    if (state.serverStatus !== 'connected') throw new Error('الخادم غير متصل. تعذر تسجيل الدخول.');
    const res = await api.auth.login(email, password);
    setState(prev => ({ ...prev, currentUser: res.user }));
  }, [state.serverStatus]);

  const register = useCallback(async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    bio?: string;
  }) => {
    if (state.serverStatus !== 'connected') throw new Error('الخادم غير متصل. تعذر إنشاء الحساب.');
    const res = await api.auth.register(userData);
    setState(prev => ({ ...prev, currentUser: res.user }));
  }, [state.serverStatus]);

  const logout = useCallback(() => {
    api.auth.logout();
    setState(prev => ({ ...prev, currentUser: { id: '', name: 'زائر', email: '', role: 'user', avatar: '👤', points: 0, badges: [], joinedAt: '', reportsCount: 0, resolvedCount: 0, rating: 0, bio: '', phone: '' } }));
  }, []);

  const setCurrentUser = useCallback((user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
  }, []);

  const addReport = useCallback(async (
    report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'upvotes' | 'upvotedBy'>,
    imageFiles?: File[]
  ) => {
    if (state.serverStatus === 'connected') {
        const formData = new FormData();
        formData.append('title', report.title);
        formData.append('description', report.description);
        formData.append('category', report.category);
        formData.append('priority', report.priority);
        formData.append('address', report.location.address);
        formData.append('lat', String(report.location.lat));
        formData.append('lng', String(report.location.lng));

        if (imageFiles && imageFiles.length > 0) {
          for (const file of imageFiles) {
            formData.append('images', file);
          }
        } else if (report.images && report.images.length > 0) {
          for (const img of report.images) {
            formData.append('images', img);
          }
        }

        const created = await api.reports.create(formData);
        setState(prev => ({ ...prev, reports: [created, ...prev.reports] }));
        return;
    }
    throw new Error('الخادم غير متصل. تعذر حفظ البلاغ.');
  }, [state.serverStatus]);

  const updateReport = useCallback(async (id: string, updates: Partial<Report>) => {
    if (state.serverStatus !== 'connected') throw new Error('الخادم غير متصل.');
    await api.reports.update(id, updates);
    await refreshReports();
  }, [state.serverStatus]);

  const adoptReport = useCallback(async (reportId: string) => {
    if (state.serverStatus !== 'connected') throw new Error('الخادم غير متصل.');
    await api.reports.adopt(reportId);
    await refreshReports();
  }, [state.serverStatus]);

  const addComment = useCallback(async (reportId: string, text: string) => {
    if (state.serverStatus !== 'connected') throw new Error('الخادم غير متصل.');
    await api.reports.addComment(reportId, text);
    await refreshReports();
  }, [state.serverStatus]);

  const toggleUpvote = useCallback(async (reportId: string) => {
    if (state.serverStatus !== 'connected') throw new Error('الخادم غير متصل.');
    await api.reports.toggleUpvote(reportId);
    await refreshReports();
  }, [state.serverStatus]);

  const markNotificationRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, sidebarOpen: open }));
  }, []);

  const detectCategory = useCallback((text: string): ReportCategory => {
    const lower = text.toLowerCase();
    const arabic = text;
    if (/طرق|شارع|حفرة|إشارة|زحام|سير|سيارة|حادث|جسر|نفق/.test(arabic) || /road|street|pothole|traffic/.test(lower)) return 'roads';
    if (/كهرباء|تيار|إنارة|كهربائي|مصباح|أسلاك|تمديد/.test(arabic) || /electric|power|light/.test(lower)) return 'electricity';
    if (/مياه|ماء|تسريب|أنابيب|صرف|سباكة|خزان/.test(arabic) || /water|leak|pipe|plumb/.test(lower)) return 'water';
    if (/صحة|مستشفى|دواء|مرض|طبي|صيدلية|علاج|طوارئ طبية/.test(arabic) || /health|hospital|medical/.test(lower)) return 'health';
    if (/إنساني|مساعدة|محتاج|فقر|يتيم|أرمل|لاجئ|إغاثة/.test(arabic) || /humanitarian|help|poverty/.test(lower)) return 'humanitarian';
    if (/بيئة|نظافة|نفايات|تلوث|أشجار|زراعة|حديقة|تشجير/.test(arabic) || /environment|waste|pollution/.test(lower)) return 'environment';
    if (/تعليم|مدرسة|جامعة|كتاب|معلم|طالب|منهج|فصل/.test(arabic) || /education|school|university/.test(lower)) return 'education';
    return 'other';
  }, []);

  const detectPriority = useCallback((text: string): ReportPriority => {
    const arabic = text;
    if (/عاجل|طارئ|خطر|حرج|فوري|حريق|غرق|انهيار|تسمم|نزيف/.test(arabic)) return 'urgent';
    if (/متوسط|قريب|عن قريب|هام/.test(arabic)) return 'medium';
    if (/بسيط|عادي|منخفض|اقتراح/.test(arabic)) return 'low';
    return 'medium';
  }, []);

  const getUserById = useCallback((_id: string) => {
    return undefined;
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      setCurrentUser,
      addReport,
      updateReport,
      adoptReport,
      addComment,
      toggleUpvote,
      markNotificationRead,
      setSidebarOpen,
      detectCategory,
      detectPriority,
      getUserById,
      refreshReports,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
