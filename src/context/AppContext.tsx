import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  SchoolCelebrationData,
  ActivityItem,
  ScheduleItem,
  CheckinScheduleItem,
  HonorItem,
  HonorAward,
  InterviewItem,
  LiveNewsItem,
  WeekActivityItem,
  BoothItem,
  getBoothCategories,
  AnnouncementData,
  AlbumLink,
  HomeCardConfig
} from '../types';
import { INITIAL_DATA, OFFICIAL_ALBUMS, BOOTH_MAP_IMAGE, DEFAULT_BOOTH_CATEGORIES, DEFAULT_HOME_CARDS } from '../data/initialData';
import { loadDecapCMSData } from '../data/cmsDataLoader';
import { normalizeImageUrl, normalizeFlyerUrl, isPdfFlyer, sortBoothsByClass } from '../utils/imageUtils';
import { createClientSessionToken } from '../utils/tokenUtils';

const STORAGE_KEY = 'kghs_102nd_anniversary_data_v1';
const LEGACY_STORAGE_KEY = 'kghs_102th_anniversary_data_v1';
const SESSION_TOKEN_KEY = 'kghs_102nd_session_token_v3';
const LEGACY_SESSION_TOKEN_KEY = 'kghs_102nd_session_token';
const SESSION_EXPIRES_KEY = 'kghs_102nd_session_expires_at_v3';
const LEGACY_SESSION_EXPIRES_KEY = 'kghs_102nd_session_expires_at';

interface ImagePreviewData {
  url: string;
  title: string;
  subtitle?: string;
  isPdf?: boolean;
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
  
  // 圖片與傳單預覽彈窗 (支援圖片與 PDF)
  previewImage: ImagePreviewData | null;
  openImagePreview: (url: string, title: string, subtitle?: string, isPdf?: boolean) => void;
  closeImagePreview: () => void;
  
  // 管理員權限與 Session Token 管理 (僅能透過 Cloudflare Workers KV 設定密碼，停用網頁改密碼與預設123)
  isAdminLoggedIn: boolean;
  sessionToken: string | null;
  sessionExpiresAt: number | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  
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

  // d-2. 現場快報 (可增減標題內容，可選要不要加相片)
  addLiveNews: (item: Omit<LiveNewsItem, 'id'>) => void;
  updateLiveNews: (item: LiveNewsItem) => void;
  deleteLiveNews: (id: string) => void;

  // d-3. 校慶週活動 (可增減標題內容，可選要不要加相片)
  addWeekActivity: (item: Omit<WeekActivityItem, 'id'>) => void;
  updateWeekActivity: (item: WeekActivityItem) => void;
  deleteWeekActivity: (id: string) => void;
  
  // f. 各班攤位一覽 (欄位固定為班級、分類、傳單，支援多選分類)
  addBooth: (item: Omit<BoothItem, 'id'>) => void;
  updateBooth: (item: BoothItem) => void;
  deleteBooth: (id: string) => void;
  batchUpdateBoothCategories: (boothIds: string[], targetCategories: string[], mode?: 'replace' | 'add') => void;

  // f-2. 園遊會品項分類管理 (管理者可自訂、編輯、刪除分類，並同步攤位資料)
  boothCategories: string[];
  addBoothCategory: (categoryName: string) => boolean;
  updateBoothCategory: (oldCategory: string, newCategory: string) => boolean;
  deleteBoothCategory: (categoryName: string) => boolean;
  resetBoothCategories: () => void;
  
  // 首頁方框按鈕與卡片圖文自訂更新 (相片、大標題、說明內文、按鈕文字)
  updateButtonImage: (key: string, url: string) => void;
  updateHomeCard: (key: string, config: Partial<HomeCardConfig>) => void;
  resetHomeCard: (key: string) => void;

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
  restoreDraftBackup: () => boolean;

  // Cloudflare KV 雲端靜默同步
  cloudSyncedAt: number;
  isCloudSyncing: boolean;
  pushToCloud: () => Promise<{ success: boolean; message: string }>;
  refreshFromCloud: (force?: boolean) => Promise<{ updated: boolean; message: string }>;
}



const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. 初始化資料 (直接以 Decap CMS 於 Git 儲存庫的最新編譯資料為唯一來源，確保刪除內容立即在網站同步生效，避免被舊快取復原)
  const [data, setData] = useState<SchoolCelebrationData>(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY + '_cloud_synced_at');
    } catch {}
    return loadDecapCMSData();
  });

  // 2. 路由狀態解析 (移除舊版 admini2t2，/admin 直接引導至 Decap CMS 後台頁面)
  const KNOWN_ROUTES = ['home', 'activities', 'schedule', 'honor', 'interviews', 'livenews', 'weekactivities', 'albums', 'booths'] as const;

  const resolveRouteFromLocation = (): string => {
    const hashRaw = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    const pathRaw = window.location.pathname.replace(/^\/|\/$/g, '').trim().toLowerCase();

    // 0. 若訪問 /admin 或 #/admin，但載入了 React SPA，立即強制跳轉至 Decap CMS /admin/index.html
    if (pathRaw.startsWith('admin') || hashRaw.startsWith('admin')) {
      try {
        if (!window.location.pathname.endsWith('/admin/index.html')) {
          window.location.replace('/admin/index.html' + (window.location.hash || ''));
          return 'home';
        }
      } catch {}
    }

    if (
      hashRaw === 'login' ||
      pathRaw === 'login' ||
      hashRaw === 'admini2t2' ||
      pathRaw === 'admini2t2'
    ) {
      try {
        if (window.location.pathname !== '/' && window.location.pathname !== '') {
          window.history.replaceState(null, '', '/');
        }
      } catch {}
      try {
        window.location.hash = '';
      } catch {}
      return 'home';
    }

    // 檢查 hash 是否指定了已知前台分頁
    if (hashRaw && hashRaw !== 'index.html' && hashRaw !== 'home') {
      if (KNOWN_ROUTES.includes(hashRaw as any)) {
        return hashRaw;
      }
    }

    // 檢查 pathname 是否指定了已知前台分頁
    if (pathRaw && pathRaw !== 'index.html' && pathRaw !== 'home') {
      if (KNOWN_ROUTES.includes(pathRaw as any)) {
        return pathRaw;
      }
    }

    return 'home';
  };

  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return resolveRouteFromLocation();
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImagePreviewData | null>(null);

  // 3. 管理員 Session Token 權限管理 (升級至 v3，開機時主動清除舊版測試殘留 Token，確保打 /admini2t2 必定要求密碼)
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try {
      // 主動清除舊版本遺留的未驗證 token，避免先前瀏覽器工作階段殘留
      sessionStorage.removeItem('kghs_102nd_session_token');
      sessionStorage.removeItem('kghs_102th_session_token');
      sessionStorage.removeItem('kghs_102nd_session_expires_at');
      sessionStorage.removeItem('kghs_102th_session_expires_at');
      sessionStorage.removeItem('kghs_102nd_admin_session');
      sessionStorage.removeItem('kghs_102th_admin_session');

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

  const [enteredPassword, setEnteredPassword] = useState<string>(() => {
    try {
      return sessionStorage.getItem('kghs_admin_password') || '';
    } catch {
      return '';
    }
  });

  const currentAdminPassword = enteredPassword;

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

  // 4. Cloudflare KV / 本地伺服器雲端靜默同步引擎
  const [cloudSyncedAt, setCloudSyncedAt] = useState<number>(() => {
    return Number(localStorage.getItem(STORAGE_KEY + '_cloud_synced_at')) || 0;
  });
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const isFirstRender = useRef(true);
  const isIncomingRemoteUpdateRef = useRef(false);

  // 專案已全面升級為 Decap CMS (Git-based CMS)，所有資料以 Git 儲存庫為唯一來源
  // 停用舊版 Cloudflare KV 輪詢，徹底根除畫面跳動與資料倒退問題
  const fetchCloudflareData = useCallback(async (_isSilent = true) => {
    // No-op: Decap CMS (Git-based) is the single authoritative source of truth.
  }, []);

  // 手動主動儲存並發布至雲端 (將當前畫面所有的改動立即推送到後端伺服器與 Cloudflare KV)
  const pushToCloud = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      setIsCloudSyncing(true);
      const token = sessionToken || sessionStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(LEGACY_SESSION_TOKEN_KEY) || 'admin_session_token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Session-Token': token,
        'X-Admin-Password': currentAdminPassword
      };

      // 儲存前自動建立本機緊急草稿備份
      try {
        localStorage.setItem('kghs_auto_draft_backup', JSON.stringify({
          timestamp: Date.now(),
          data
        }));
      } catch {}

      const res = await fetch('/api/data', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success) {
            const nowTimestamp = Number(json.updatedAt) || Date.now();
            setCloudSyncedAt(nowTimestamp);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            localStorage.setItem(STORAGE_KEY + '_cloud_synced_at', nowTimestamp.toString());
            return {
              success: true,
              message: `已成功儲存並同步至伺服器！所有裝置均已同步最新內容 (${new Date(nowTimestamp).toLocaleTimeString()})`
            };
          }
        }
      } else if (res.status === 401) {
        try {
          const errJson = await res.json();
          return { success: false, message: `驗證失敗 (401)：${errJson.message || '請重新登入管理員帳號'}` };
        } catch {
          return { success: false, message: '登入權限已失效 (401)，請重新登入管理員後再儲存。' };
        }
      }
      return { success: false, message: `雲端伺服器回應異常 (狀態碼: ${res.status})，已為您保留本機編輯內容。` };
    } catch (e: any) {
      return { success: false, message: `發布失敗：${e?.message || '網路離線，已保存在本機'}` };
    } finally {
      setIsCloudSyncing(false);
    }
  }, [data, sessionToken, currentAdminPassword]);

  // 手動拉取雲端資料 (附帶防誤觸機制與備份草稿)
  const refreshFromCloud = useCallback(async (force = false): Promise<{ updated: boolean; message: string }> => {
    try {
      setIsCloudSyncing(true);
      const res = await fetch('/api/data', {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (!res.ok) return { updated: false, message: '無法連接雲端伺服器，請檢查網路連線。' };
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return { updated: false, message: '伺服器目前未回傳有效 JSON 資料。' };
      }
      const json = await res.json();
      if (json && json.success && json.data) {
        const remoteUpdatedAt = Number(json.updatedAt) || 0;
        const currentSavedTimestamp = Number(localStorage.getItem(STORAGE_KEY + '_cloud_synced_at')) || 0;
        const remoteStr = JSON.stringify(json.data);
        const localSavedStr = localStorage.getItem(STORAGE_KEY);
        const isDataDifferent = !localSavedStr || remoteStr !== localSavedStr;

        // 僅當雲端時間戳記確實較新，或指定強制更新，或資料有實質差異時才執行覆蓋
        if (force || remoteUpdatedAt > currentSavedTimestamp || !currentSavedTimestamp || isDataDifferent) {
          // 覆蓋前自動為使用者備份目前本機內容，防止任何資料損失
          try {
            localStorage.setItem('kghs_auto_backup_before_pull', JSON.stringify({
              timestamp: Date.now(),
              data
            }));
          } catch {}

          isIncomingRemoteUpdateRef.current = true;
          const normalizedRemote: SchoolCelebrationData = {
            ...INITIAL_DATA,
            ...json.data,
            liveNews: Array.isArray(json.data.liveNews) ? json.data.liveNews : (INITIAL_DATA.liveNews || []),
            weekActivities: Array.isArray(json.data.weekActivities) ? json.data.weekActivities : (INITIAL_DATA.weekActivities || []),
            homeCards: {
              ...DEFAULT_HOME_CARDS,
              ...(json.data.homeCards || {})
            },
            buttonImages: {
              ...(INITIAL_DATA.buttonImages || {}),
              ...(json.data.buttonImages || {})
            }
          };
          setData(normalizedRemote);
          setCloudSyncedAt(remoteUpdatedAt || Date.now());
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedRemote));
          localStorage.setItem(STORAGE_KEY + '_cloud_synced_at', (remoteUpdatedAt || Date.now()).toString());
          return {
            updated: true,
            message: `已由雲端同步至最新發布版本 (${new Date(remoteUpdatedAt || Date.now()).toLocaleTimeString()})`
          };
        } else {
          return {
            updated: false,
            message: '目前本機內容已是最新版本，雲端無更新內容。'
          };
        }
      }
      return { updated: false, message: '雲端目前無新資料' };
    } catch {
      return { updated: false, message: '雲端同步離線' };
    } finally {
      setIsCloudSyncing(false);
    }
  }, [data]);

  // 一鍵從暫存草稿還原
  const restoreDraftBackup = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem('kghs_auto_backup_before_pull') || localStorage.getItem('kghs_auto_draft_backup');
      if (raw) {
        const parsed = JSON.parse(raw);
        const draftData = parsed.data || parsed;
        if (draftData && typeof draftData === 'object' && draftData.announcement) {
          setData(draftData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
          return true;
        }
      }
    } catch (e) {
      console.warn('Restore draft backup failed', e);
    }
    return false;
  }, []);

  // 當管理員在後台更新資料時，非同步自動發送至伺服器與 Cloudflare KV
  const pushToCloudflare = useCallback(async (newData: SchoolCelebrationData) => {
    try {
      const token = sessionToken || sessionStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(LEGACY_SESSION_TOKEN_KEY) || 'admin_session_token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Session-Token': token,
        'X-Admin-Password': currentAdminPassword
      };

      const res = await fetch('/api/data', {
        method: 'POST',
        headers,
        body: JSON.stringify(newData)
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && json.updatedAt) {
            const nowTimestamp = Number(json.updatedAt) || Date.now();
            setCloudSyncedAt(nowTimestamp);
            localStorage.setItem(STORAGE_KEY + '_cloud_synced_at', nowTimestamp.toString());
          }
        }
      }
    } catch (e) {
      console.warn('Data sync offline fallback', e);
    }
  }, [sessionToken, currentAdminPassword]);

  // Decap CMS (Git-based CMS) 資料模式：清除舊版殘留金鑰
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {}
  }, []);

  const navigateTo = (route: string) => {
    // 若要求導向 admin 或包含 admin 的非 admini2t2 路徑，一律判定無效並轉回首頁
    if (route === 'admin' || route.startsWith('admin/')) {
      setCurrentRoute('home');
      try {
        if (window.location.pathname !== '/' && window.location.pathname !== '') {
          window.history.replaceState(null, '', '/');
        }
      } catch {}
      try {
        window.location.hash = '';
      } catch {}
      setIsSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = (route === 'login' || route === 'admini2t2') ? 'admini2t2' : route;
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

  const openImagePreview = (url: string, title: string, subtitle?: string, isPdf?: boolean) => {
    const determinedIsPdf = typeof isPdf === 'boolean' ? isPdf : isPdfFlyer(url);
    setPreviewImage({ url, title, subtitle, isPdf: determinedIsPdf });
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  // 管理員登入驗證 (需與 Workers KV 中設定完全相符，停用預設 123)
  const login = async (password: string): Promise<boolean> => {
    const trimmed = password.trim();
    if (!trimmed) return false;

    // 向伺服器與 Cloudflare Workers KV API (/api/auth) 驗證
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
          sessionStorage.setItem('kghs_admin_password', trimmed);
          setEnteredPassword(trimmed);
          setSessionToken(token);
          setSessionExpiresAt(expiresAt);
          setIsAdminLoggedIn(true);
          navigateTo('admini2t2');
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('[Auth] Verification request failed:', err);
      return false;
    }
  };

  const logout = () => {
    setSessionToken(null);
    setSessionExpiresAt(null);
    setIsAdminLoggedIn(false);
    setEnteredPassword('');
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_EXPIRES_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_EXPIRES_KEY);
    sessionStorage.removeItem('kghs_admin_password');
    sessionStorage.removeItem('kghs_102nd_admin_session');
    sessionStorage.removeItem('kghs_102th_admin_session');
    navigateTo('home');
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

  // d-2. 現場快報 (可增減標題內容，可選要不要加圖片)
  const addLiveNews = (item: Omit<LiveNewsItem, 'id'>) => {
    const newItem: LiveNewsItem = {
      ...item,
      id: `news-${Date.now()}`,
      imageUrl: item.imageUrl ? normalizeImageUrl(item.imageUrl) : undefined,
      publishTime: item.publishTime || new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setData(prev => {
      const nextData = {
        ...prev,
        liveNews: [newItem, ...(prev.liveNews || [])]
      };
      pushToCloudflare(nextData);
      return nextData;
    });
  };

  const updateLiveNews = (item: LiveNewsItem) => {
    const normalizedItem: LiveNewsItem = {
      ...item,
      imageUrl: item.imageUrl ? normalizeImageUrl(item.imageUrl) : undefined
    };
    setData(prev => {
      const nextData = {
        ...prev,
        liveNews: (prev.liveNews || []).map(n => n.id === item.id ? normalizedItem : n)
      };
      pushToCloudflare(nextData);
      return nextData;
    });
  };

  const deleteLiveNews = (id: string) => {
    setData(prev => {
      const nextData = {
        ...prev,
        liveNews: (prev.liveNews || []).filter(n => n.id !== id)
      };
      pushToCloudflare(nextData);
      return nextData;
    });
  };

  // d-3. 校慶週活動 (可增減標題內容，可選要不要加圖片)
  const addWeekActivity = (item: Omit<WeekActivityItem, 'id'>) => {
    const newItem: WeekActivityItem = {
      ...item,
      id: `week-${Date.now()}`,
      imageUrl: item.imageUrl ? normalizeImageUrl(item.imageUrl) : undefined,
      publishTime: item.publishTime || new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setData(prev => {
      const nextData = {
        ...prev,
        weekActivities: [newItem, ...(prev.weekActivities || [])]
      };
      pushToCloudflare(nextData);
      return nextData;
    });
  };

  const updateWeekActivity = (item: WeekActivityItem) => {
    const normalizedItem: WeekActivityItem = {
      ...item,
      imageUrl: item.imageUrl ? normalizeImageUrl(item.imageUrl) : undefined
    };
    setData(prev => {
      const nextData = {
        ...prev,
        weekActivities: (prev.weekActivities || []).map(w => w.id === item.id ? normalizedItem : w)
      };
      pushToCloudflare(nextData);
      return nextData;
    });
  };

  const deleteWeekActivity = (id: string) => {
    setData(prev => {
      const nextData = {
        ...prev,
        weekActivities: (prev.weekActivities || []).filter(w => w.id !== id)
      };
      pushToCloudflare(nextData);
      return nextData;
    });
  };

  // f. 各班攤位一覽 (欄位固定: 班級、分類、傳單，支援多選分類與 PDF 傳單)
  const addBooth = (item: Omit<BoothItem, 'id'>) => {
    const cats = item.categories && item.categories.length > 0
      ? item.categories
      : (item.category ? item.category.split(/[,、]/).map(s => s.trim()).filter(Boolean) : ['未分類']);
    const isPdf = isPdfFlyer(item.flyerUrl, item.flyerType);
    const newBooth: BoothItem = {
      ...item,
      categories: cats,
      category: cats.join('、'),
      flyerUrl: normalizeFlyerUrl(item.flyerUrl, item.flyerType),
      flyerType: item.flyerType || (isPdf ? 'pdf' : 'image'),
      id: `b-${Date.now()}`
    };
    setData(prev => {
      const existingCats = prev.boothCategories || DEFAULT_BOOTH_CATEGORIES;
      const combinedCats = Array.from(new Set([...existingCats, ...cats]));
      const nextData = {
        ...prev,
        booths: sortBoothsByClass([...prev.booths, newBooth]),
        boothCategories: combinedCats
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      } catch {}
      pushToCloudflare(nextData);
      return nextData;
    });
  };

  const updateBooth = (item: BoothItem) => {
    const cats = item.categories && item.categories.length > 0
      ? item.categories
      : (item.category ? item.category.split(/[,、]/).map(s => s.trim()).filter(Boolean) : ['未分類']);
    const isPdf = isPdfFlyer(item.flyerUrl, item.flyerType);
    const normalizedBooth: BoothItem = {
      ...item,
      categories: cats,
      category: cats.join('、'),
      flyerUrl: normalizeFlyerUrl(item.flyerUrl, item.flyerType),
      flyerType: item.flyerType || (isPdf ? 'pdf' : 'image')
    };
    setData(prev => {
      const existingCats = prev.boothCategories || DEFAULT_BOOTH_CATEGORIES;
      const combinedCats = Array.from(new Set([...existingCats, ...cats]));
      const nextData = {
        ...prev,
        booths: sortBoothsByClass(prev.booths.map(b => b.id === item.id ? normalizedBooth : b)),
        boothCategories: combinedCats
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      } catch {}
      pushToCloudflare(nextData);
      return nextData;
    });
  };

  const deleteBooth = (id: string) => {
    setData(prev => {
      const nextData = {
        ...prev,
        booths: sortBoothsByClass(prev.booths.filter(b => b.id !== id))
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      } catch {}
      pushToCloudflare(nextData);
      return nextData;
    });
  };

  // 批次更新多個班級攤位的品項分類 (支援多選替換或追加)
  const batchUpdateBoothCategories = (
    boothIds: string[],
    targetCategories: string[],
    mode: 'replace' | 'add' = 'replace'
  ) => {
    if (!boothIds || boothIds.length === 0 || !targetCategories || targetCategories.length === 0) return;
    setData(prev => {
      const nextBooths = prev.booths.map(b => {
        if (!boothIds.includes(b.id)) return b;
        const currentCats = getBoothCategories(b);
        let nextCats: string[];
        if (mode === 'add') {
          nextCats = Array.from(new Set([...currentCats, ...targetCategories]));
        } else {
          nextCats = [...targetCategories];
        }
        if (nextCats.length === 0) {
          nextCats = ['未分類'];
        }
        return {
          ...b,
          categories: nextCats,
          category: nextCats.join('、')
        };
      });
      const existingCats = prev.boothCategories || DEFAULT_BOOTH_CATEGORIES;
      const combinedCats = Array.from(new Set([...existingCats, ...targetCategories]));
      const nextData = {
        ...prev,
        booths: sortBoothsByClass(nextBooths),
        boothCategories: combinedCats
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      } catch {}
      pushToCloudflare(nextData);
      return nextData;
    });
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
      const nextData = {
        ...prev,
        boothCategories: [...currentList, trimmed]
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      } catch {}
      pushToCloudflare(nextData);
      return nextData;
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
      const nextBooths = prev.booths.map(b => {
        const currentCats = getBoothCategories(b);
        if (!currentCats.includes(oldCategory)) return b;
        const nextCats = currentCats.map(c => c === oldCategory ? trimmed : c);
        return {
          ...b,
          categories: nextCats,
          category: nextCats.join('、')
        };
      });
      const nextData = {
        ...prev,
        boothCategories: nextList,
        booths: nextBooths
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      } catch {}
      pushToCloudflare(nextData);
      return nextData;
    });
    return true;
  };

  const deleteBoothCategory = (categoryName: string): boolean => {
    setData(prev => {
      const currentList = (prev.boothCategories && prev.boothCategories.length > 0)
        ? prev.boothCategories
        : DEFAULT_BOOTH_CATEGORIES;
      const nextList = currentList.filter(c => c !== categoryName);
      const nextBooths = prev.booths.map(b => {
        const currentCats = getBoothCategories(b);
        if (!currentCats.includes(categoryName)) return b;
        const nextCats = currentCats.filter(c => c !== categoryName);
        return {
          ...b,
          categories: nextCats.length > 0 ? nextCats : ['未分類'],
          category: nextCats.length > 0 ? nextCats.join('、') : '未分類'
        };
      });
      const nextData = {
        ...prev,
        boothCategories: nextList,
        booths: nextBooths
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      } catch {}
      pushToCloudflare(nextData);
      return nextData;
    });
    return true;
  };

  const resetBoothCategories = () => {
    setData(prev => {
      const nextData = {
        ...prev,
        boothCategories: DEFAULT_BOOTH_CATEGORIES
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      } catch {}
      pushToCloudflare(nextData);
      return nextData;
    });
  };

  // 相簿清單 (直接納入全域 data.albums，確保與伺服器及所有跨裝置完全同步)
  const ALBUMS_STORAGE_KEY = 'kghs_102nd_albums_cache';
  const LEGACY_ALBUMS_STORAGE_KEY = 'kghs_102th_albums_cache';
  const albums: AlbumLink[] = (data.albums && Array.isArray(data.albums) && data.albums.length > 0)
    ? data.albums
    : OFFICIAL_ALBUMS;

  const updateAlbumCover = (albumId: string, url: string) => {
    const normalizedUrl = normalizeImageUrl(url);
    const nextAlbums = albums.map(a => a.id === albumId ? { ...a, coverImage: normalizedUrl } : a);
    setData(prev => ({
      ...prev,
      albums: nextAlbums
    }));
  };

  const updateAlbumUrl = (albumId: string, url: string) => {
    const nextAlbums = albums.map(a => a.id === albumId ? { ...a, externalUrl: url } : a);
    setData(prev => ({
      ...prev,
      albums: nextAlbums
    }));
  };

  const updateAlbumTitle = (albumId: string, title: string) => {
    const nextAlbums = albums.map(a => a.id === albumId ? { ...a, title } : a);
    setData(prev => ({
      ...prev,
      albums: nextAlbums
    }));
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
    setData(prev => {
      const existingCard = prev.homeCards?.[key] || DEFAULT_HOME_CARDS[key] || {};
      return {
        ...prev,
        buttonImages: {
          ...(prev.buttonImages || {}),
          [key]: normalizedUrl
        },
        homeCards: {
          ...(prev.homeCards || {}),
          [key]: {
            ...existingCard,
            imageUrl: normalizedUrl
          }
        }
      };
    });
  };

  // 更新首頁卡片自訂設定 (相片、大標題、內文、按鈕文字)
  const updateHomeCard = (key: string, config: Partial<HomeCardConfig>) => {
    setData(prev => {
      const existingCard = prev.homeCards?.[key] || DEFAULT_HOME_CARDS[key] || {};
      const normalizedImageUrl = config.imageUrl !== undefined ? normalizeImageUrl(config.imageUrl) : existingCard.imageUrl;
      const updatedCard: HomeCardConfig = {
        ...existingCard,
        ...config,
        ...(config.imageUrl !== undefined ? { imageUrl: normalizedImageUrl } : {})
      };
      return {
        ...prev,
        homeCards: {
          ...(prev.homeCards || {}),
          [key]: updatedCard
        },
        buttonImages: {
          ...(prev.buttonImages || {}),
          ...(config.imageUrl !== undefined ? { [key]: normalizedImageUrl || '' } : {})
        }
      };
    });
  };

  // 還原個別卡片為預設圖文設定
  const resetHomeCard = (key: string) => {
    const defaultConf = DEFAULT_HOME_CARDS[key];
    if (defaultConf) {
      updateHomeCard(key, defaultConf);
    }
  };

  // 重設為預設官方資料
  const resetToDefault = () => {
    setData(INITIAL_DATA);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      localStorage.removeItem(ALBUMS_STORAGE_KEY);
      localStorage.removeItem(LEGACY_ALBUMS_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
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
      const sanitized = jsonString.replace(/102th/g, '102nd');
      const parsed = JSON.parse(sanitized);
      if (parsed && parsed.activities && parsed.schedules && parsed.honorRoll) {
        if (!parsed.liveNews) parsed.liveNews = INITIAL_DATA.liveNews || [];
        if (!parsed.weekActivities) parsed.weekActivities = INITIAL_DATA.weekActivities || [];
        if (!parsed.boothCategories) parsed.boothCategories = DEFAULT_BOOTH_CATEGORIES;
        setData(parsed);
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON', e);
    }
    return false;
  };

  const heroImage = (data.heroImage && data.heroImage !== '/src/assets/images/hero_kghs_celebration_1792325750838.jpg')
    ? data.heroImage
    : (INITIAL_DATA.heroImage || '/assets/aistudio/image_a4c5d4ff.png');
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
        login,
        logout,
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
        addLiveNews,
        updateLiveNews,
        deleteLiveNews,
        addWeekActivity,
        updateWeekActivity,
        deleteWeekActivity,
        addBooth,
        updateBooth,
        deleteBooth,
        batchUpdateBoothCategories,
        boothCategories,
        addBoothCategory,
        updateBoothCategory,
        deleteBoothCategory,
        resetBoothCategories,
        updateButtonImage,
        updateHomeCard,
        resetHomeCard,
        updateHeroImage,
        updateBoothMapImage,
        updateAlbumCover,
        updateAlbumUrl,
        updateAlbumTitle,
        uploadImageFile,
        resetToDefault,
        exportDataJson,
        importDataJson,
        restoreDraftBackup,
        cloudSyncedAt,
        isCloudSyncing,
        pushToCloud,
        refreshFromCloud
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
