import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  SchoolCelebrationData,
  ActivityItem,
  ScheduleItem,
  CheckinScheduleItem,
  HonorItem,
  HonorAward,
  InterviewItem,
  BoothItem,
  AnnouncementData,
  AlbumLink
} from '../types';
import { INITIAL_DATA, OFFICIAL_ALBUMS, BOOTH_MAP_IMAGE, DEFAULT_BOOTH_CATEGORIES } from '../data/initialData';
import { normalizeImageUrl } from '../utils/imageUtils';
import { createClientSessionToken } from '../utils/tokenUtils';

const STORAGE_KEY = 'kghs_102th_anniversary_data_v1';
const SESSION_TOKEN_KEY = 'kghs_102th_session_token';
const SESSION_EXPIRES_KEY = 'kghs_102th_session_expires_at';
export const DEFAULT_ADMIN_PASSWORD = '123';
export const CUSTOM_PASSWORD_KEY = 'kghs_102th_custom_admin_password';

interface ImagePreviewData {
  url: string;
  title: string;
  subtitle?: string;
}

interface AppContextType {
  data: SchoolCelebrationData;
  officialAlbums: AlbumLink[];
  boothMapImage: string;
  
  // 導航與側欄
  currentRoute: string;
  navigateTo: (route: string) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  
  // 圖片預覽彈窗
  previewImage: ImagePreviewData | null;
  openImagePreview: (url: string, title: string, subtitle?: string) => void;
  closeImagePreview: () => void;
  
  // 管理員權限與 Session Token 管理
  isAdminLoggedIn: boolean;
  sessionToken: string | null;
  sessionExpiresAt: number | null;
  hasCustomPassword: boolean;
  defaultAdminPassword: string;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  resetPasswordToDefault: () => Promise<{ success: boolean; message: string }>;
  
  // 跑馬燈
  updateAnnouncement: (announcement: AnnouncementData) => void;
  
  // a. 賽事活動簡介 (可增刪修)
  addActivity: (item: Omit<ActivityItem, 'id'>) => void;
  updateActivity: (item: ActivityItem) => void;
  deleteActivity: (id: string) => void;
  
  // b. 賽程表 (可增刪修)
  addSchedule: (item: Omit<ScheduleItem, 'id'>) => void;
  updateSchedule: (item: ScheduleItem) => void;
  deleteSchedule: (id: string) => void;

  // b-2. 檢錄時程表 (項目，時間，地點)
  addCheckinSchedule: (item: Omit<CheckinScheduleItem, 'id'>) => void;
  updateCheckinSchedule: (item: CheckinScheduleItem) => void;
  deleteCheckinSchedule: (id: string) => void;
  
  // c. 榮譽榜 (比賽項目可變動、增刪，內容為單一文字輸入框)
  addHonorItem: (item: Omit<HonorItem, 'id'>) => void;
  updateHonorItem: (item: HonorItem) => void;
  deleteHonorItem: (id: string) => void;
  addAwardToEvent: (eventId: string, award: Omit<HonorAward, 'id'>) => void;
  updateAwardInEvent: (eventId: string, award: HonorAward) => void;
  deleteAwardFromEvent: (eventId: string, awardId: string) => void;
  
  // d. 採訪報導 (年級分類固定為高一、高二，內文可增刪改)
  addInterview: (item: Omit<InterviewItem, 'id'>) => void;
  updateInterview: (item: InterviewItem) => void;
  deleteInterview: (id: string) => void;
  
  // f. 各班攤位一覽 (欄位固定為班級、分類、傳單)
  addBooth: (item: Omit<BoothItem, 'id'>) => void;
  updateBooth: (item: BoothItem) => void;
  deleteBooth: (id: string) => void;

  // f-2. 園遊會品項分類管理 (管理者可自訂、編輯、刪除分類，並同步攤位資料)
  boothCategories: string[];
  addBoothCategory: (categoryName: string) => boolean;
  updateBoothCategory: (oldCategory: string, newCategory: string) => boolean;
  deleteBoothCategory: (categoryName: string) => boolean;
  resetBoothCategories: () => void;
  
  // 首頁方框按鈕圖片更新
  updateButtonImage: (key: string, url: string) => void;

  // 自訂校慶相片、地圖與相簿封面及超連結
  heroImage: string;
  updateHeroImage: (url: string) => void;
  updateBoothMapImage: (url: string) => void;
  updateAlbumCover: (albumId: string, url: string) => void;
  updateAlbumUrl: (albumId: string, url: string) => void;
  updateAlbumTitle: (albumId: string, title: string) => void;
  uploadImageFile: (file: File) => Promise<string>;

  // 資料同步與重設
  resetToDefault: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonString: string) => boolean;

  // Cloudflare KV 雲端靜默同步
  cloudSyncedAt: number;
  isCloudSyncing: boolean;
  refreshFromCloud: () => Promise<void>;
}



const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. 初始化資料 (由 LocalStorage 讀取，若無則使用 INITIAL_DATA)
  const [data, setData] = useState<SchoolCelebrationData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedInitialAnnouncement = localStorage.getItem(STORAGE_KEY + '_initial_announcement_signature');

      if (saved) {
        const parsed = JSON.parse(saved);
        // 若使用者在 initialData.ts 原始碼中修改了跑馬燈文字，自動更新為最新的原始碼設定
        if (savedInitialAnnouncement !== INITIAL_DATA.announcement.text) {
          parsed.announcement = {
            ...(parsed.announcement || {}),
            text: INITIAL_DATA.announcement.text,
            enabled: parsed.announcement?.enabled ?? INITIAL_DATA.announcement.enabled
          };
          localStorage.setItem(STORAGE_KEY + '_initial_announcement_signature', INITIAL_DATA.announcement.text);
        }

        // 去除 11/7 園遊會時程，並去除運動會時程的地點欄位
        if (parsed.schedules && Array.isArray(parsed.schedules)) {
          parsed.schedules = parsed.schedules
            .filter((s: any) => s.day !== '11/7')
            .map((s: any) => ({
              id: s.id,
              day: '11/6',
              time: s.time,
              title: s.title
            }));
        }
        if (parsed.honorRoll && Array.isArray(parsed.honorRoll)) {
          parsed.honorRoll = parsed.honorRoll.map((item: any) => {
            if (typeof item.content !== 'string') {
              const convertedContent = (item.awards || [])
                .map((a: any) => `${a.rank}：${a.awardee}${a.score ? ` ${a.score}` : ''}`)
                .join('\n');
              return {
                ...item,
                content: convertedContent
              };
            }
            return item;
          });
        }
        if (!parsed.checkinSchedules || !Array.isArray(parsed.checkinSchedules) || parsed.checkinSchedules.length === 0) {
          parsed.checkinSchedules = INITIAL_DATA.checkinSchedules;
        }
        if (!parsed.boothCategories || !Array.isArray(parsed.boothCategories) || parsed.boothCategories.length === 0) {
          parsed.boothCategories = DEFAULT_BOOTH_CATEGORIES;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved school celebration data', e);
    }
    try {
      localStorage.setItem(STORAGE_KEY + '_initial_announcement_signature', INITIAL_DATA.announcement.text);
    } catch {
      // ignore
    }
    return INITIAL_DATA;
  });

  // 2. 路由狀態解析 (支援在網址後輸入 /admini2t2 或 #/admini2t2，無效或根路徑一律顯示首頁)
  const KNOWN_ROUTES = ['home', 'activities', 'schedule', 'honor', 'interviews', 'albums', 'booths', 'admin', 'admini2t2'] as const;

  const resolveRouteFromLocation = (): string => {
    const hashRaw = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    const pathRaw = window.location.pathname.replace(/^\/|\/$/g, '').trim().toLowerCase();

    // 1. 若 hash 明確指定為 admini2t2 或 login
    if (hashRaw === 'admini2t2' || hashRaw === 'login') {
      return 'admini2t2';
    }

    // 2. 若 pathname 明確為 admini2t2 或 login (且 hash 為空或非已知分頁)
    if (pathRaw === 'admini2t2' || pathRaw === 'login') {
      // 若 hash 有指定其他分頁，以 hash 優先
      if (hashRaw && hashRaw !== 'admini2t2' && hashRaw !== 'login' && KNOWN_ROUTES.includes(hashRaw as any)) {
        return hashRaw === 'home' ? 'home' : hashRaw;
      }
      return 'admini2t2';
    }

    // 3. 檢查 hash 是否指定了其他已知分頁 (如 activities, schedule, honor 等)
    if (hashRaw && hashRaw !== 'index.html' && hashRaw !== 'home') {
      if (KNOWN_ROUTES.includes(hashRaw as any)) {
        return hashRaw;
      }
    }

    // 4. 檢查 pathname 是否指定了其他已知分頁
    if (pathRaw && pathRaw !== 'index.html' && pathRaw !== 'home') {
      if (KNOWN_ROUTES.includes(pathRaw as any)) {
        return pathRaw;
      }
    }

    // 5. 其餘任何狀況（包括根目錄 /、隨便輸入的字串）皆一律顯示前台首頁 home
    return 'home';
  };

  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return resolveRouteFromLocation();
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImagePreviewData | null>(null);

  // 3. 管理員 Session Token 權限管理
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try {
      const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
      const exp = Number(sessionStorage.getItem(SESSION_EXPIRES_KEY)) || 0;
      if (token && exp > Date.now()) {
        return token;
      }
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_EXPIRES_KEY);
      return null;
    } catch {
      return null;
    }
  });

  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() => {
    try {
      const exp = Number(sessionStorage.getItem(SESSION_EXPIRES_KEY)) || 0;
      return exp > Date.now() ? exp : null;
    } catch {
      return null;
    }
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return Boolean(sessionToken);
  });

  const [customPassword, setCustomPassword] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CUSTOM_PASSWORD_KEY);
    } catch {
      return null;
    }
  });

  const currentAdminPassword = customPassword || DEFAULT_ADMIN_PASSWORD;

  // 當 sessionToken 改變時同步更新登入狀態
  useEffect(() => {
    setIsAdminLoggedIn(Boolean(sessionToken));
  }, [sessionToken]);

  // 監聽網址 hash 與 popstate 變化以支援直接輸入 /admini2t2
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentRoute(resolveRouteFromLocation());
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // 4. Cloudflare KV 雲端靜默同步引擎
  const [cloudSyncedAt, setCloudSyncedAt] = useState<number>(() => {
    return Number(localStorage.getItem(STORAGE_KEY + '_cloud_synced_at')) || 0;
  });
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const isFirstRender = useRef(true);

  // 靜默拉取 Cloudflare 最新資料
  const fetchCloudflareData = useCallback(async (isSilent = true) => {
    try {
      if (!isSilent) setIsCloudSyncing(true);
      const res = await fetch('/api/data', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && json.data) {
        const remoteUpdatedAt = json.updatedAt || 0;
        const currentSavedTimestamp = Number(localStorage.getItem(STORAGE_KEY + '_cloud_synced_at')) || 0;

        // 若雲端時間戳記較新，或本機尚未有時間戳記記錄
        if (remoteUpdatedAt > currentSavedTimestamp || !currentSavedTimestamp) {
          setData(json.data);
          setCloudSyncedAt(remoteUpdatedAt);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
          localStorage.setItem(STORAGE_KEY + '_cloud_synced_at', remoteUpdatedAt.toString());
        }
      }
    } catch {
      // 網路離線或開發環境無 /api/data 時靜默忽略，繼續使用本機快取
    } finally {
      if (!isSilent) setIsCloudSyncing(false);
    }
  }, []);

  // 當管理員在後台更新資料時，非同步自動使用 Session Token 寫入 Cloudflare KV
  const pushToCloudflare = useCallback(async (newData: SchoolCelebrationData) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        headers['X-Session-Token'] = sessionToken;
      }

      const res = await fetch('/api/data', {
        method: 'POST',
        headers,
        body: JSON.stringify(newData)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.updatedAt) {
          setCloudSyncedAt(json.updatedAt);
          localStorage.setItem(STORAGE_KEY + '_cloud_synced_at', json.updatedAt.toString());
        }
      }
    } catch (e) {
      console.warn('Cloudflare KV sync offline fallback', e);
    }
  }, [sessionToken]);

  // 啟動與定時靜默更新監聽器
  useEffect(() => {
    // 首次開啟時靜默拉取一次
    fetchCloudflareData(true);

    // 每 30 秒背景靜默檢查一次 Cloudflare KV 是否有新發布資料
    const interval = setInterval(() => {
      fetchCloudflareData(true);
    }, 30000);

    // 當使用者切回分頁或重新喚醒手機螢幕時，立即靜默檢查
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCloudflareData(true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [fetchCloudflareData]);

  // 儲存至 LocalStorage (並在管理員登入操作時自動同步至 Cloudflare KV)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('LocalStorage save error', e);
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 若為管理員登入狀態下的更動，自動發送至 Cloudflare KV
    if (sessionToken || sessionStorage.getItem(SESSION_TOKEN_KEY)) {
      pushToCloudflare(data);
    }
  }, [data, pushToCloudflare, sessionToken]);

  const navigateTo = (route: string) => {
    const target = route === 'login' ? 'admini2t2' : route;
    setCurrentRoute(target);
    if (target === 'home') {
      try {
        if (window.location.pathname !== '/' && window.location.pathname !== '') {
          window.history.replaceState(null, '', '/');
        }
      } catch {
        // ignore
      }
      window.location.hash = '';
    } else {
      window.location.hash = `#/${target}`;
    }
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const openImagePreview = (url: string, title: string, subtitle?: string) => {
    setPreviewImage({ url, title, subtitle });
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  // 管理員登入驗證 (優先向 Cloudflare /api/auth 驗證換取 Session Token，離線具備安全退避)
  const login = async (password: string): Promise<boolean> => {
    const trimmed = password.trim();
    if (!trimmed) return false;

    // 1. 優先向 Cloudflare Pages Functions /api/auth 驗證並索取 Session Token
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed })
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.token) {
          const token = json.token;
          const expiresAt = json.expiresAt || (Date.now() + 24 * 60 * 60 * 1000);
          sessionStorage.setItem(SESSION_TOKEN_KEY, token);
          sessionStorage.setItem(SESSION_EXPIRES_KEY, expiresAt.toString());
          setSessionToken(token);
          setSessionExpiresAt(expiresAt);
          setIsAdminLoggedIn(true);
          navigateTo('admin');
          return true;
        }
      } else if (res.status === 401) {
        // 若伺服器明確拒絕且非本機自訂密碼，則驗證失敗
        if (trimmed !== currentAdminPassword) {
          return false;
        }
      }
    } catch {
      // 網路斷線或離線環境（無 /api/auth 後端回應時安全退避）
    }

    // 2. 本機相容模式：比對密碼並簽發標準格式之客戶端 Session Token
    if (trimmed === currentAdminPassword) {
      try {
        const { token, expiresAt } = await createClientSessionToken(currentAdminPassword, 24);
        sessionStorage.setItem(SESSION_TOKEN_KEY, token);
        sessionStorage.setItem(SESSION_EXPIRES_KEY, expiresAt.toString());
        setSessionToken(token);
        setSessionExpiresAt(expiresAt);
        setIsAdminLoggedIn(true);
        navigateTo('admin');
        return true;
      } catch (err) {
        console.error('Failed to create session token', err);
        return false;
      }
    }

    return false;
  };

  const logout = () => {
    setSessionToken(null);
    setSessionExpiresAt(null);
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_EXPIRES_KEY);
    sessionStorage.removeItem('kghs_admin_password');
    sessionStorage.removeItem('kghs_102th_admin_session');
    navigateTo('home');
  };

  // 修改管理員登入密碼 (並重新簽發新的 Session Token)
  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (oldPassword !== currentAdminPassword) {
      return { success: false, message: '目前舊密碼輸入不正確，請重新確認。' };
    }
    const trimmed = newPassword.trim();
    if (!trimmed || trimmed.length < 1) {
      return { success: false, message: '請輸入有效的新密碼。' };
    }
    if (trimmed === oldPassword) {
      return { success: false, message: '新密碼不可與目前密碼相同。' };
    }
    try {
      localStorage.setItem(CUSTOM_PASSWORD_KEY, trimmed);
      setCustomPassword(trimmed);

      // 重新簽發與新密碼綁定之 Session Token
      const { token, expiresAt } = await createClientSessionToken(trimmed, 24);
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      sessionStorage.setItem(SESSION_EXPIRES_KEY, expiresAt.toString());
      setSessionToken(token);
      setSessionExpiresAt(expiresAt);

      return { success: true, message: '管理員登入密碼已成功更新！系統已為您重新簽發安全 Session Token。' };
    } catch (e) {
      return { success: false, message: '儲存新密碼失敗，請檢查瀏覽器儲存權限。' };
    }
  };

  // 還原為預設密碼 (並重新簽發 Session Token)
  const resetPasswordToDefault = async (): Promise<{ success: boolean; message: string }> => {
    try {
      localStorage.removeItem(CUSTOM_PASSWORD_KEY);
      setCustomPassword(null);

      const { token, expiresAt } = await createClientSessionToken(DEFAULT_ADMIN_PASSWORD, 24);
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      sessionStorage.setItem(SESSION_EXPIRES_KEY, expiresAt.toString());
      setSessionToken(token);
      setSessionExpiresAt(expiresAt);

      return { success: true, message: `已成功還原為系統預設密碼 (${DEFAULT_ADMIN_PASSWORD}) 並更新 Session Token` };
    } catch (e) {
      return { success: false, message: '還原密碼失敗' };
    }
  };

  // 跑馬燈更新
  const updateAnnouncement = (announcement: AnnouncementData) => {
    setData(prev => {
      const next = { ...prev, announcement };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        localStorage.setItem(STORAGE_KEY + '_initial_announcement_signature', announcement.text);
      } catch (e) {
        console.error('Failed to sync announcement update to localStorage', e);
      }
      return next;
    });
  };

  // a. 賽事活動簡介
  const addActivity = (item: Omit<ActivityItem, 'id'>) => {
    const newAct: ActivityItem = {
      ...item,
      id: `act-${Date.now()}`
    };
    setData(prev => ({ ...prev, activities: [...prev.activities, newAct] }));
  };

  const updateActivity = (item: ActivityItem) => {
    setData(prev => ({
      ...prev,
      activities: prev.activities.map(act => act.id === item.id ? item : act)
    }));
  };

  const deleteActivity = (id: string) => {
    setData(prev => ({
      ...prev,
      activities: prev.activities.filter(act => act.id !== id)
    }));
  };

  // b. 賽程表
  const addSchedule = (item: Omit<ScheduleItem, 'id'>) => {
    const newSch: ScheduleItem = {
      ...item,
      id: `sch-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      schedules: [...prev.schedules, newSch].sort((a, b) => a.time.localeCompare(b.time))
    }));
  };

  const updateSchedule = (item: ScheduleItem) => {
    setData(prev => ({
      ...prev,
      schedules: prev.schedules.map(sch => sch.id === item.id ? item : sch).sort((a, b) => a.time.localeCompare(b.time))
    }));
  };

  const deleteSchedule = (id: string) => {
    setData(prev => ({
      ...prev,
      schedules: prev.schedules.filter(sch => sch.id !== id)
    }));
  };

  // b-2. 檢錄時程表 (項目，時間，地點)
  const addCheckinSchedule = (item: Omit<CheckinScheduleItem, 'id'>) => {
    const newChk: CheckinScheduleItem = {
      ...item,
      id: `chk-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      checkinSchedules: [...(prev.checkinSchedules || []), newChk].sort((a, b) => a.time.localeCompare(b.time))
    }));
  };

  const updateCheckinSchedule = (item: CheckinScheduleItem) => {
    setData(prev => ({
      ...prev,
      checkinSchedules: (prev.checkinSchedules || [])
        .map(chk => (chk.id === item.id ? item : chk))
        .sort((a, b) => a.time.localeCompare(b.time))
    }));
  };

  const deleteCheckinSchedule = (id: string) => {
    setData(prev => ({
      ...prev,
      checkinSchedules: (prev.checkinSchedules || []).filter(chk => chk.id !== id)
    }));
  };

  // c. 榮譽榜 (比賽項目可變動、增刪，內容為單一文字輸入框)
  const addHonorItem = (item: Omit<HonorItem, 'id'>) => {
    const newItem: HonorItem = {
      ...item,
      id: `honor-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      honorRoll: [...prev.honorRoll, newItem]
    }));
  };

  const updateHonorItem = (item: HonorItem) => {
    setData(prev => ({
      ...prev,
      honorRoll: prev.honorRoll.map(h => (h.id === item.id ? item : h))
    }));
  };

  const deleteHonorItem = (id: string) => {
    setData(prev => ({
      ...prev,
      honorRoll: prev.honorRoll.filter(h => h.id !== id)
    }));
  };

  // 舊版名次相容函式
  const addAwardToEvent = (eventId: string, award: Omit<HonorAward, 'id'>) => {
    const newAward: HonorAward = {
      ...award,
      id: `aw-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      honorRoll: prev.honorRoll.map(item => {
        if (item.id === eventId) {
          const nextAwards = [...(item.awards || []), newAward];
          return {
            ...item,
            awards: nextAwards,
            content: nextAwards.map(a => `${a.rank}：${a.awardee}${a.score ? ` ${a.score}` : ''}`).join('\n')
          };
        }
        return item;
      })
    }));
  };

  const updateAwardInEvent = (eventId: string, award: HonorAward) => {
    setData(prev => ({
      ...prev,
      honorRoll: prev.honorRoll.map(item => {
        if (item.id === eventId) {
          const nextAwards = (item.awards || []).map(a => a.id === award.id ? award : a);
          return {
            ...item,
            awards: nextAwards,
            content: nextAwards.map(a => `${a.rank}：${a.awardee}${a.score ? ` ${a.score}` : ''}`).join('\n')
          };
        }
        return item;
      })
    }));
  };

  const deleteAwardFromEvent = (eventId: string, awardId: string) => {
    setData(prev => ({
      ...prev,
      honorRoll: prev.honorRoll.map(item => {
        if (item.id === eventId) {
          const nextAwards = (item.awards || []).filter(a => a.id !== awardId);
          return {
            ...item,
            awards: nextAwards,
            content: nextAwards.map(a => `${a.rank}：${a.awardee}${a.score ? ` ${a.score}` : ''}`).join('\n')
          };
        }
        return item;
      })
    }));
  };

  // d. 採訪報導 (年級分類固定為高一、高二)
  const addInterview = (item: Omit<InterviewItem, 'id'>) => {
    const newIv: InterviewItem = {
      ...item,
      id: `iv-${Date.now()}`,
      imageUrl: item.imageUrl ? normalizeImageUrl(item.imageUrl) : undefined,
      publishTime: item.publishTime || new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setData(prev => ({ ...prev, interviews: [newIv, ...prev.interviews] }));
  };

  const updateInterview = (item: InterviewItem) => {
    const normalizedItem: InterviewItem = {
      ...item,
      imageUrl: item.imageUrl ? normalizeImageUrl(item.imageUrl) : undefined
    };
    setData(prev => ({
      ...prev,
      interviews: prev.interviews.map(iv => iv.id === item.id ? normalizedItem : iv)
    }));
  };

  const deleteInterview = (id: string) => {
    setData(prev => ({
      ...prev,
      interviews: prev.interviews.filter(iv => iv.id !== id)
    }));
  };

  // f. 各班攤位一覽 (欄位固定: 班級、分類、傳單)
  const addBooth = (item: Omit<BoothItem, 'id'>) => {
    const newBooth: BoothItem = {
      ...item,
      flyerUrl: normalizeImageUrl(item.flyerUrl),
      id: `b-${Date.now()}`
    };
    setData(prev => ({ ...prev, booths: [...prev.booths, newBooth] }));
  };

  const updateBooth = (item: BoothItem) => {
    const normalizedBooth: BoothItem = {
      ...item,
      flyerUrl: normalizeImageUrl(item.flyerUrl)
    };
    setData(prev => ({
      ...prev,
      booths: prev.booths.map(b => b.id === item.id ? normalizedBooth : b)
    }));
  };

  const deleteBooth = (id: string) => {
    setData(prev => ({
      ...prev,
      booths: prev.booths.filter(b => b.id !== id)
    }));
  };

  // f-2. 園遊會品項分類 (支援管理者動態編輯、新增、刪除)
  const boothCategories = (data.boothCategories && Array.isArray(data.boothCategories) && data.boothCategories.length > 0)
    ? data.boothCategories
    : DEFAULT_BOOTH_CATEGORIES;

  const addBoothCategory = (categoryName: string): boolean => {
    const trimmed = categoryName.trim();
    if (!trimmed) return false;
    if (boothCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    setData(prev => {
      const currentList = (prev.boothCategories && prev.boothCategories.length > 0)
        ? prev.boothCategories
        : DEFAULT_BOOTH_CATEGORIES;
      return {
        ...prev,
        boothCategories: [...currentList, trimmed]
      };
    });
    return true;
  };

  const updateBoothCategory = (oldCategory: string, newCategory: string): boolean => {
    const trimmed = newCategory.trim();
    if (!trimmed || trimmed === oldCategory) return false;
    if (boothCategories.some(c => c !== oldCategory && c.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    setData(prev => {
      const currentList = (prev.boothCategories && prev.boothCategories.length > 0)
        ? prev.boothCategories
        : DEFAULT_BOOTH_CATEGORIES;
      const nextList = currentList.map(c => c === oldCategory ? trimmed : c);
      const nextBooths = prev.booths.map(b => b.category === oldCategory ? { ...b, category: trimmed } : b);
      return {
        ...prev,
        boothCategories: nextList,
        booths: nextBooths
      };
    });
    return true;
  };

  const deleteBoothCategory = (categoryName: string): boolean => {
    setData(prev => {
      const currentList = (prev.boothCategories && prev.boothCategories.length > 0)
        ? prev.boothCategories
        : DEFAULT_BOOTH_CATEGORIES;
      const nextList = currentList.filter(c => c !== categoryName);
      return {
        ...prev,
        boothCategories: nextList
      };
    });
    return true;
  };

  const resetBoothCategories = () => {
    setData(prev => ({
      ...prev,
      boothCategories: DEFAULT_BOOTH_CATEGORIES
    }));
  };

  // 相簿清單 (支援更換封面)
  const ALBUMS_STORAGE_KEY = 'kghs_102th_albums_cache';
  const [albums, setAlbums] = useState<AlbumLink[]>(() => {
    try {
      const cached = localStorage.getItem(ALBUMS_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn(e);
    }
    return OFFICIAL_ALBUMS;
  });

  const updateAlbumCover = (albumId: string, url: string) => {
    const normalizedUrl = normalizeImageUrl(url);
    setAlbums(prev => {
      const next = prev.map(a => a.id === albumId ? { ...a, coverImage: normalizedUrl } : a);
      try {
        localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const updateAlbumUrl = (albumId: string, url: string) => {
    setAlbums(prev => {
      const next = prev.map(a => a.id === albumId ? { ...a, externalUrl: url } : a);
      try {
        localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const updateAlbumTitle = (albumId: string, title: string) => {
    setAlbums(prev => {
      const next = prev.map(a => a.id === albumId ? { ...a, title } : a);
      try {
        localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // 更新首頁英雄橫幅相片
  const updateHeroImage = (url: string) => {
    setData(prev => ({ ...prev, heroImage: normalizeImageUrl(url) }));
  };

  // 更新攤位地圖相片
  const updateBoothMapImage = (url: string) => {
    setData(prev => ({ ...prev, boothMapImage: normalizeImageUrl(url) }));
  };

  // 通用相片檔案上傳轉換為 Base64 DataURL (可直接在本機瀏覽器離線預覽與持久化儲存)
  const uploadImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('讀取檔案失敗'));
        }
      };
      reader.onerror = () => reject(new Error('讀取檔案出錯'));
      reader.readAsDataURL(file);
    });
  };

  // 更新首頁方框按鈕圖片檔
  const updateButtonImage = (key: string, url: string) => {
    const normalizedUrl = normalizeImageUrl(url);
    setData(prev => ({
      ...prev,
      buttonImages: {
        ...(prev.buttonImages || {}),
        [key]: normalizedUrl
      }
    }));
  };

  // 重設為預設官方資料
  const resetToDefault = () => {
    setData(INITIAL_DATA);
    setAlbums(OFFICIAL_ALBUMS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      localStorage.removeItem(ALBUMS_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // 匯出 JSON
  const exportDataJson = () => {
    return JSON.stringify(data, null, 2);
  };

  // 匯入 JSON
  const importDataJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.activities && parsed.schedules && parsed.honorRoll) {
        setData(parsed);
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON', e);
    }
    return false;
  };

  const heroImage = data.heroImage || INITIAL_DATA.heroImage || '/src/assets/images/hero_kghs_celebration_1792325750838.jpg';
  const boothMapImage = data.boothMapImage || BOOTH_MAP_IMAGE;

  return (
    <AppContext.Provider
      value={{
        data,
        officialAlbums: albums,
        boothMapImage,
        heroImage,
        currentRoute,
        navigateTo,
        isSidebarOpen,
        toggleSidebar,
        closeSidebar,
        previewImage,
        openImagePreview,
        closeImagePreview,
        isAdminLoggedIn,
        sessionToken,
        sessionExpiresAt,
        hasCustomPassword: Boolean(customPassword),
        defaultAdminPassword: DEFAULT_ADMIN_PASSWORD,
        login,
        logout,
        changePassword,
        resetPasswordToDefault,
        updateAnnouncement,
        addActivity,
        updateActivity,
        deleteActivity,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        addCheckinSchedule,
        updateCheckinSchedule,
        deleteCheckinSchedule,
        addHonorItem,
        updateHonorItem,
        deleteHonorItem,
        addAwardToEvent,
        updateAwardInEvent,
        deleteAwardFromEvent,
        addInterview,
        updateInterview,
        deleteInterview,
        addBooth,
        updateBooth,
        deleteBooth,
        boothCategories,
        addBoothCategory,
        updateBoothCategory,
        deleteBoothCategory,
        resetBoothCategories,
        updateButtonImage,
        updateHeroImage,
        updateBoothMapImage,
        updateAlbumCover,
        updateAlbumUrl,
        updateAlbumTitle,
        uploadImageFile,
        resetToDefault,
        exportDataJson,
        importDataJson,
        cloudSyncedAt,
        isCloudSyncing,
        refreshFromCloud: () => fetchCloudflareData(false)
      }}
    >
      {children}
    </AppContext.Provider>
  );
};


export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
