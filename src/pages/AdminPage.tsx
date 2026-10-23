import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ActivityItem, ScheduleItem, CheckinScheduleItem, HonorItem, InterviewItem, BoothItem, BoothCategory, AlbumLink } from '../types';
import { INITIAL_DATA } from '../data/initialData';
import { normalizeImageUrl } from '../utils/imageUtils';
import {
  LogOut,
  Eye,
  RotateCcw,
  Download,
  Upload,
  Volume2,
  Flame,
  CalendarDays,
  Trophy,
  Newspaper,
  Store,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Save,
  Lock,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Clock,
  Camera,
  Link,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  EyeOff,
  ShieldCheck,
  Tag,
  Check,
  X
} from 'lucide-react';
import { PageHero } from '../components/PageHero';

export const AdminPage: React.FC = () => {
  const {
    data,
    isAdminLoggedIn,
    hasCustomPassword,
    defaultAdminPassword,
    changePassword,
    resetPasswordToDefault,
    logout,
    navigateTo,
    heroImage,
    boothMapImage,
    updateHeroImage,
    updateBoothMapImage,
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
    officialAlbums,
    updateAlbumUrl,
    uploadImageFile,
    resetToDefault,
    exportDataJson,
    importDataJson,
    cloudSyncedAt,
    isCloudSyncing,
    refreshFromCloud
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'announcement' | 'activities' | 'schedule' | 'honor' | 'interviews' | 'booths' | 'albums' | 'siteMedia' | 'security' | 'backup'
  >('announcement');

  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 滑鼠拖曳支援 (桌面端拖動滑動)
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // 檢查左右滾動極限
  const checkScrollBoundaries = useCallback(() => {
    const el = tabContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  // 將選取的標籤平滑滾動至那一列的中央
  const centerTab = useCallback((tabKey: string, smooth: boolean = true) => {
    const container = tabContainerRef.current;
    const tabEl = tabRefs.current[tabKey];
    if (!container || !tabEl) return;

    const scrollOffset = (tabEl.offsetLeft + tabEl.offsetWidth / 2) - (container.clientWidth / 2);
    container.scrollTo({
      left: Math.max(0, scrollOffset),
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  // 監聽 activeTab 變更自動居中
  useEffect(() => {
    centerTab(activeTab, true);
    checkScrollBoundaries();
  }, [activeTab, centerTab, checkScrollBoundaries]);

  // 監聽滾動與容器寬度變化
  useEffect(() => {
    const el = tabContainerRef.current;
    if (!el) return;

    checkScrollBoundaries();
    el.addEventListener('scroll', checkScrollBoundaries, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkScrollBoundaries();
      });
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener('scroll', checkScrollBoundaries);
      resizeObserver?.disconnect();
    };
  }, [checkScrollBoundaries]);

  // 左右滑動控制
  const scrollTabs = (direction: 'left' | 'right') => {
    const container = tabContainerRef.current;
    if (!container) return;
    const offset = direction === 'right' ? 240 : -240;
    container.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // 滑鼠拖曳滑動處理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tabContainerRef.current) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - tabContainerRef.current.offsetLeft;
    scrollLeftRef.current = tabContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !tabContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    tabContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleSelectTab = (tabKey: any) => {
    if (hasMovedRef.current) return; // 拖動中不觸發切換
    setActiveTab(tabKey);
    centerTab(tabKey, true);
  };

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="p-8 sm:p-12 text-center max-w-md mx-auto bg-white rounded-3xl border border-[#e5decb] shadow-xs space-y-4 my-8">
        <div className="w-12 h-12 rounded-full bg-[#cff0eb] text-[#09013d] border border-[#e5decb] mx-auto flex items-center justify-center">
          <Lock className="w-5 h-5 text-[#325291]" />
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-[#09013d]">需要管理員權限</h2>
        <p className="text-xs text-[#73685e] leading-relaxed">請先透過登入頁面輸入預設管理員密碼以進入後台。</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigateTo('home')}
            className="px-4 py-2 bg-white border border-[#e5decb] hover:bg-[#fbf9f2] text-[#5e544c] rounded-full text-xs font-medium cursor-pointer"
          >
            返回前台首頁
          </button>
          <button
            onClick={() => navigateTo('admini2t2')}
            className="px-5 py-2 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] font-medium text-xs sm:text-sm rounded-full transition-colors cursor-pointer shadow-2xs"
          >
            前往登入頁面
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'announcement', label: '跑馬燈公告', icon: Volume2 },
    { key: 'activities', label: '賽事活動簡介', icon: Flame },
    { key: 'schedule', label: '運動會時程表', icon: CalendarDays },
    { key: 'honor', label: '榮譽榜', icon: Trophy },
    { key: 'interviews', label: '採訪', icon: Newspaper },
    { key: 'booths', label: '各班攤位一覽', icon: Store },
    { key: 'albums', label: '相簿下載連結', icon: Camera },
    { key: 'siteMedia', label: '全站相片管理', icon: ImageIcon },
    { key: 'security', label: '變更登入密碼', icon: KeyRound },
    { key: 'backup', label: '備份與重設', icon: Download }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 頂部管理控制列 */}
      <PageHero
        title="後台管理系統"
        subtitle="支援跑馬燈、賽事簡介、運動會時程、榮譽榜、採訪與各班攤位即時維護"
        rightAction={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('security')}
              title="變更管理員登入密碼"
              className="px-3.5 py-1.5 bg-[#fbf9f2]/20 hover:bg-[#fbf9f2]/30 text-[#fbf3c9] text-xs font-medium rounded-full backdrop-blur-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#fbf3c9]" />
              <span className="hidden sm:inline">變更密碼</span>
            </button>
            <button
              onClick={async () => {
                await refreshFromCloud();
                showFeedback(cloudSyncedAt ? `已同步至 Cloudflare 最新狀態 (${new Date().toLocaleTimeString()})` : '已檢查雲端同步狀態');
              }}
              title={cloudSyncedAt ? `上次同步：${new Date(cloudSyncedAt).toLocaleTimeString()}` : '與 Cloudflare KV 同步'}
              className="px-3.5 py-1.5 bg-[#fbf9f2]/20 hover:bg-[#fbf9f2]/30 text-[#fbf3c9] text-xs font-medium rounded-full backdrop-blur-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span>{isCloudSyncing ? '同步中...' : '雲端同步'}</span>
            </button>
            <button
              onClick={() => navigateTo('home')}
              className="px-3.5 py-1.5 bg-[#fbf9f2]/20 hover:bg-[#fbf9f2]/30 text-[#fbf3c9] text-xs font-medium rounded-full backdrop-blur-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>前台預覽</span>
            </button>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-[#fbf3c9] text-xs font-medium rounded-full backdrop-blur-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>登出</span>
            </button>
          </div>
        }
      />

      {/* 提示訊息 */}
      {feedbackMsg && (
        <div className="p-4 bg-[#cff0eb]/40 border border-[#bce4de] rounded-2xl text-[#09013d] text-xs font-medium flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#325291] shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* 模組切換標籤 (支援左右滑動、拖曳、點擊自動掉到中央，以及側邊滑動箭頭) */}
      <div className="relative group/tabbar">
        {/* 左側微光漸層與滑動箭頭 */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-3 pl-0.5 bg-gradient-to-r from-[#fbf9f2] via-[#fbf9f2]/90 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              aria-label="向左滑動選項"
              className="pointer-events-auto w-8 h-8 rounded-full bg-white/95 border border-[#e5decb] text-[#5e544c] hover:text-[#09013d] hover:bg-white shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 標籤橫向滑動列 */}
        <div
          ref={tabContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex items-center gap-2 overflow-x-auto scroll-smooth overscroll-x-contain touch-pan-x py-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={el => { tabRefs.current[tab.key] = el; }}
                onClick={() => handleSelectTab(tab.key as any)}
                className={`min-h-[40px] px-4.5 py-2 text-xs font-medium whitespace-nowrap rounded-full transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#09013d] text-[#fbf3c9] shadow-sm scale-102 font-semibold'
                    : 'bg-white border border-[#e5decb] text-[#325291] hover:text-[#09013d] hover:border-[#325291]/40 hover:bg-[#fbf9f2]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#fbf3c9]' : 'text-[#73685e]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 右側微光漸層與滑動箭頭 (提示右側有更多選項，點擊或滑動即可看見) */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-3 pr-0.5 bg-gradient-to-l from-[#fbf9f2] via-[#fbf9f2]/90 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              aria-label="向右滑動選項"
              className="pointer-events-auto w-8 h-8 rounded-full bg-white/95 border border-[#e5decb] text-[#5e544c] hover:text-[#09013d] hover:bg-white shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 animate-pulse hover:animate-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 1. 跑馬燈管理 */}
      {activeTab === 'announcement' && (
        <AnnouncementAdmin
          currentAnnouncement={data.announcement}
          onSave={updateAnnouncement}
          onNotify={showFeedback}
        />
      )}

      {/* 2. a. 賽事活動簡介管理 */}
      {activeTab === 'activities' && (
        <ActivitiesAdmin
          activities={data.activities}
          onAdd={addActivity}
          onUpdate={updateActivity}
          onDelete={deleteActivity}
          onNotify={showFeedback}
        />
      )}

      {/* 3. b. 賽程表管理 */}
      {activeTab === 'schedule' && (
        <ScheduleAdmin
          schedules={data.schedules}
          checkinSchedules={data.checkinSchedules || []}
          onAdd={addSchedule}
          onUpdate={updateSchedule}
          onDelete={deleteSchedule}
          onAddCheckin={addCheckinSchedule}
          onUpdateCheckin={updateCheckinSchedule}
          onDeleteCheckin={deleteCheckinSchedule}
          onNotify={showFeedback}
        />
      )}

      {/* 4. c. 榮譽榜管理 */}
      {activeTab === 'honor' && (
        <HonorAdmin
          honorRoll={data.honorRoll}
          onAdd={addHonorItem}
          onUpdate={updateHonorItem}
          onDelete={deleteHonorItem}
          onNotify={showFeedback}
        />
      )}

      {/* 5. d. 採訪報導管理 */}
      {activeTab === 'interviews' && (
        <InterviewsAdmin
          interviews={data.interviews}
          onAdd={addInterview}
          onUpdate={updateInterview}
          onDelete={deleteInterview}
          uploadImageFile={uploadImageFile}
          onNotify={showFeedback}
        />
      )}

      {/* 6. f. 各班攤位一覽管理 */}
      {activeTab === 'booths' && (
        <BoothsAdmin
          booths={data.booths}
          categories={boothCategories}
          onAdd={addBooth}
          onUpdate={updateBooth}
          onDelete={deleteBooth}
          onAddCategory={addBoothCategory}
          onUpdateCategory={updateBoothCategory}
          onDeleteCategory={deleteBoothCategory}
          onResetCategories={resetBoothCategories}
          uploadImageFile={uploadImageFile}
          onNotify={showFeedback}
        />
      )}

      {/* 7. 相簿「照片下載專區」連結管理 */}
      {activeTab === 'albums' && (
        <AlbumsAdmin
          albums={officialAlbums}
          onUpdateUrl={updateAlbumUrl}
          onNotify={showFeedback}
        />
      )}

      {/* 8. 全站相片管理 (首頁橫幅、地圖、功能卡片) */}
      {activeTab === 'siteMedia' && (
        <SiteMediaAdmin
          heroImage={heroImage}
          boothMapImage={boothMapImage}
          buttonImages={data.buttonImages}
          onUpdateHeroImage={updateHeroImage}
          onUpdateBoothMapImage={updateBoothMapImage}
          onUpdateButtonImage={updateButtonImage}
          uploadImageFile={uploadImageFile}
          onNotify={showFeedback}
        />
      )}

      {/* 8. 變更登入密碼 */}
      {activeTab === 'security' && (
        <SecurityAdmin
          hasCustomPassword={hasCustomPassword}
          defaultAdminPassword={defaultAdminPassword}
          onChangePassword={changePassword}
          onResetPassword={resetPasswordToDefault}
          onNotify={showFeedback}
        />
      )}

      {/* 9. 備份、匯出與重設 */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-3xl border border-[#e5decb] p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-base font-semibold text-[#09013d]">資料備份、匯入與官方重設</h2>
            <p className="text-xs text-[#73685e] mt-1 leading-relaxed">
              全站資料儲存於瀏覽器 LocalStorage。您可隨時下載完整 JSON 備份檔，或將備份檔匯入以進行資料還原。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl border border-[#e5decb] bg-[#fbf9f2] space-y-3">
              <h3 className="text-xs font-semibold text-[#09013d] flex items-center gap-1.5">
                <Download className="w-4 h-4 text-[#325291]" />
                <span>匯出 JSON 資料檔</span>
              </h3>
              <p className="text-[11px] text-[#73685e] leading-relaxed">
                將目前所有賽事、賽程、榮譽榜與各班攤位打包為 JSON 檔儲存至本機。
              </p>
              <button
                onClick={() => {
                  const json = exportDataJson();
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `kghs_102th_celebration_backup_${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showFeedback('已成功匯出 JSON 備份檔！');
                }}
                className="w-full min-h-[38px] py-2 px-4 bg-white border border-[#e5decb] hover:bg-[#fbf9f2] rounded-full text-xs font-medium text-[#09013d] transition-colors cursor-pointer shadow-2xs"
              >
                下載 JSON 備份
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-[#e5decb] bg-[#fbf9f2] space-y-3">
              <h3 className="text-xs font-semibold text-[#09013d] flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-[#325291]" />
                <span>匯入 JSON 還原資料</span>
              </h3>
              <p className="text-[11px] text-[#73685e] leading-relaxed">
                載入先前備份的 JSON 檔案，立即替換並更新全站展示內容。
              </p>
              <label className="w-full min-h-[38px] py-2 px-4 bg-white border border-[#e5decb] hover:bg-[#fbf9f2] rounded-full text-xs font-medium text-[#09013d] transition-colors flex items-center justify-center cursor-pointer shadow-2xs">
                <span>選擇 JSON 檔案匯入</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content && importDataJson(content)) {
                          showFeedback('已成功匯入並更新全站資料！');
                        } else {
                          alert('匯入失敗：檔案格式不符合校慶資料結構。');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>
            </div>

            <div className="p-5 rounded-2xl border border-[#e5decb] bg-[#fbf9f2] space-y-3">
              <h3 className="text-xs font-semibold text-[#09013d] flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-[#325291]" />
                <span>重設回官方初始資料</span>
              </h3>
              <p className="text-[11px] text-[#73685e] leading-relaxed">
                清除本機自訂變更，還原為雄女 102 週年校慶大會預設官方發布資料。
              </p>
              <button
                onClick={() => {
                  if (window.confirm('確定要清除自訂變更，還原為官方初始校慶資料嗎？')) {
                    resetToDefault();
                    showFeedback('已成功還原為官方預設資料！');
                  }
                }}
                className="w-full min-h-[38px] py-2 px-4 bg-[#09013d] hover:bg-[#1a1254] rounded-full text-xs font-medium text-[#fbf3c9] transition-colors cursor-pointer shadow-2xs"
              >
                重設為初始資料
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------
 * 1. 跑馬燈 / 系統公告管理
 * ------------------------------------------------------------- */
const AnnouncementAdmin: React.FC<{
  currentAnnouncement: { enabled: boolean; text: string; type: 'urgent' | 'info' | 'celebrate' };
  onSave: (announcement: { enabled: boolean; text: string; type: 'urgent' | 'info' | 'celebrate' }) => void;
  onNotify: (text: string, type?: 'success' | 'info') => void;
}> = ({ currentAnnouncement, onSave, onNotify }) => {
  const [draftText, setDraftText] = useState(currentAnnouncement.text);
  const [draftEnabled, setDraftEnabled] = useState(currentAnnouncement.enabled);

  const previewGroupRef = React.useRef<HTMLDivElement>(null);
  const [previewDuration, setPreviewDuration] = useState<number>(25);

  React.useEffect(() => {
    setDraftText(currentAnnouncement.text);
    setDraftEnabled(currentAnnouncement.enabled);
  }, [currentAnnouncement]);

  React.useEffect(() => {
    if (!previewGroupRef.current) return;
    const calculateConstantSpeed = () => {
      if (previewGroupRef.current) {
        const width = previewGroupRef.current.scrollWidth;
        const CONSTANT_SPEED_PX_PER_SEC = 35;
        const duration = Math.max(8, width / CONSTANT_SPEED_PX_PER_SEC);
        setPreviewDuration(duration);
      }
    };
    calculateConstantSpeed();
    const ro = new ResizeObserver(calculateConstantSpeed);
    ro.observe(previewGroupRef.current);
    return () => ro.disconnect();
  }, [draftText]);

  const hasUnsavedChanges =
    draftText !== currentAnnouncement.text ||
    draftEnabled !== currentAnnouncement.enabled;

  const handleSave = () => {
    onSave({
      ...currentAnnouncement,
      text: draftText,
      enabled: draftEnabled
    });
    onNotify('跑馬燈公告已確認儲存！前台畫面已即時同步更新。', 'success');
  };

  const handleDiscard = () => {
    setDraftText(currentAnnouncement.text);
    setDraftEnabled(currentAnnouncement.enabled);
    onNotify('已還原為目前前台展示的公告內容', 'info');
  };

  const handleResetToDefault = () => {
    setDraftText(INITIAL_DATA.announcement.text);
    setDraftEnabled(INITIAL_DATA.announcement.enabled);
    onNotify('已將官方預設公告帶入輸入框，請點擊「確定儲存」後生效', 'info');
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e5decb] p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5decb] pb-4">
        <div>
          <h2 className="text-base font-semibold text-[#09013d] flex items-center gap-2">
            <Volume2 className="w-4.5 h-4.5 text-[#325291]" />
            <span>跑馬燈 / 系統公告管理</span>
          </h2>
          <p className="text-xs text-[#73685e] mt-0.5">
            速度恆定閱讀感；修改需點擊「確定儲存」後前台訪客才會看見更新。
          </p>
        </div>

        {hasUnsavedChanges ? (
          <span className="self-start sm:self-auto text-xs bg-[#fbf3c9] text-[#8a5b28] border border-[#e8d5be] px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#c98336] animate-pulse"></span>
            有尚未儲存的修改
          </span>
        ) : (
          <span className="self-start sm:self-auto text-xs bg-[#cff0eb]/40 text-[#325291] border border-[#bce4de] px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#325291]" />
            已與前台同步中
          </span>
        )}
      </div>

      <div className="space-y-5">
        <div className="bg-[#fbf9f2] p-4 rounded-2xl border border-[#e5decb]">
          <label className="flex items-center gap-3 text-xs font-medium text-[#09013d] cursor-pointer">
            <input
              type="checkbox"
              checked={draftEnabled}
              onChange={(e) => setDraftEnabled(e.target.checked)}
              className="w-4 h-4 text-[#09013d] rounded border-[#e5decb] focus:ring-0"
            />
            <span>在前台頂部啟用即時跑馬燈橫幅</span>
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-[#342d27]">
              公告廣播文字內容（字數：{draftText.length} 字）
            </label>
            <span className="text-[11px] text-[#73685e] font-mono">
              恆定均速: 35 px/s (舒適慢速)
            </span>
          </div>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={3}
            className="w-full p-3.5 bg-[#fbf9f2] border border-[#e5decb] rounded-2xl text-xs sm:text-sm text-[#09013d] focus:outline-none focus:border-[#325291] transition-all"
            placeholder="請輸入即時重要公告或祝賀文字..."
          />
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-[#325291]">
            跑馬燈實際滾動效果預覽
          </div>
          <div className="bg-[#09013d] text-[#fbf3c9] text-xs py-2.5 px-4 rounded-2xl flex items-center overflow-hidden border border-[#04001a]">
            <div className="flex items-center gap-1.5 shrink-0 mr-3 text-[#cff0eb] font-medium z-10 bg-[#09013d] pr-2.5">
              <Volume2 className="w-3.5 h-3.5 text-[#cff0eb]" />
              <span className="text-[10px] uppercase tracking-wider text-[#cff0eb]">即時公告</span>
            </div>
            <div className="overflow-hidden relative w-full flex items-center">
              <div
                className="animate-marquee-infinite text-[#fbf9f2] whitespace-nowrap font-normal text-xs flex items-center"
                style={{ animationDuration: `${previewDuration}s` }}
              >
                <div ref={previewGroupRef} className="flex items-center shrink-0 gap-8 pr-8">
                  <span>{draftText || '(目前尚未輸入公告文字)'}</span>
                  <span aria-hidden="true" className="text-[#a39a8e]">·</span>
                  <span>{draftText || '(目前尚未輸入公告文字)'}</span>
                  <span aria-hidden="true" className="text-[#a39a8e]">·</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`min-h-[40px] px-6 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] shadow-sm active:scale-95'
                : 'bg-[#fbf3c9] text-[#a39c93] cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>確定儲存並套用至前台</span>
          </button>

          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleDiscard}
              className="min-h-[40px] px-4 py-2 bg-white border border-[#e5decb] hover:bg-[#fbf9f2] text-[#5e544c] rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#73685e]" />
              <span>捨棄修改</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetToDefault}
            className="min-h-[40px] px-4 py-2 bg-white border border-[#e5decb] hover:bg-[#fbf9f2] text-[#5e544c] rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ml-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#73685e]" />
            <span>帶入官方預設公告</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 2. a. 賽事活動簡介管理
 * ------------------------------------------------------------- */
const ActivitiesAdmin: React.FC<{
  activities: ActivityItem[];
  onAdd: (item: Omit<ActivityItem, 'id'>) => void;
  onUpdate: (item: ActivityItem) => void;
  onDelete: (id: string) => void;
  onNotify: (text: string) => void;
}> = ({ activities, onAdd, onUpdate, onDelete, onNotify }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
  };

  const handleStartEdit = (act: ActivityItem) => {
    setIsAdding(false);
    setEditingId(act.id);
    setFormTitle(act.title);
    setFormDescription(act.description);
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      alert('請輸入項目名稱');
      return;
    }

    if (isAdding) {
      onAdd({
        title: formTitle.trim(),
        description: formDescription.trim()
      });
      setIsAdding(false);
      onNotify('已成功新增賽事活動');
    } else if (editingId) {
      onUpdate({
        id: editingId,
        title: formTitle.trim(),
        description: formDescription.trim()
      });
      setEditingId(null);
      onNotify('已成功更新賽事活動');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e5decb] p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#09013d]">a. 賽事活動簡介管理</h2>
          <p className="text-xs text-[#73685e]">包含「項目名稱」與「詳細內容說明」，可自由新增、修改與刪除</p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={handleStartAdd}
            className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>新增賽事項目</span>
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="p-5 sm:p-6 bg-[#fbf9f2] rounded-2xl border border-[#e5decb] space-y-4">
          <h3 className="text-xs font-semibold text-[#09013d]">
            {isAdding ? '新增賽事活動項目' : '編輯賽事活動項目'}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#342d27] mb-1">
                項目名稱 <span className="text-[#8a4e38]">*</span>
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#e5decb] rounded-xl text-xs sm:text-sm text-[#09013d] focus:outline-none focus:border-[#325291]"
                placeholder="例如：女子 100 公尺短跑計時決賽、大隊接力..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#342d27] mb-1">
                詳細內容說明
              </label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={4}
                className="w-full p-2.5 bg-white border border-[#e5decb] rounded-xl text-xs sm:text-sm text-[#09013d] focus:outline-none focus:border-[#325291] leading-relaxed"
                placeholder="請輸入詳細內容說明..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>儲存項目</span>
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-4 py-2 bg-white border border-[#e5decb] text-[#5e544c] rounded-full text-xs font-medium hover:bg-[#fbf9f2] transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-[#73685e] text-xs">
            目前尚無賽事項目，請點擊上方「新增賽事項目」建立。
          </div>
        ) : (
          activities.map((act, index) => (
            <div
              key={act.id}
              className="p-4 sm:p-5 bg-[#fbf9f2] rounded-2xl border border-[#e5decb] flex items-start justify-between gap-4 text-xs transition-colors hover:border-[#e5decb]"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#73685e] tabular-nums">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <span className="font-semibold text-[#09013d] text-sm truncate">{act.title}</span>
                </div>
                <p className="text-[#325291] line-clamp-2 pl-6 leading-relaxed whitespace-pre-line">
                  {act.description || '(尚無詳細內容說明)'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleStartEdit(act)}
                  className="w-8 h-8 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#5e544c] hover:text-[#09013d] hover:bg-[#fbf9f2] transition-colors cursor-pointer"
                  title="編輯項目"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`確定要刪除「${act.title}」嗎？`)) {
                      onDelete(act.id);
                      onNotify('已刪除該賽事');
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#8a4e38] hover:bg-[#fbeeed] transition-colors cursor-pointer"
                  title="刪除項目"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 3. b. 賽程表管理
 * ------------------------------------------------------------- */
const ScheduleAdmin: React.FC<{
  schedules: ScheduleItem[];
  checkinSchedules: CheckinScheduleItem[];
  onAdd: (item: Omit<ScheduleItem, 'id'>) => void;
  onUpdate: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
  onAddCheckin: (item: Omit<CheckinScheduleItem, 'id'>) => void;
  onUpdateCheckin: (item: CheckinScheduleItem) => void;
  onDeleteCheckin: (id: string) => void;
  onNotify: (text: string) => void;
}> = ({
  schedules,
  checkinSchedules,
  onAdd,
  onUpdate,
  onDelete,
  onAddCheckin,
  onUpdateCheckin,
  onDeleteCheckin,
  onNotify
}) => {
  const [subTab, setSubTab] = useState<'sports' | 'checkin'>('sports');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formTime, setFormTime] = useState('09:00');
  const [formTitle, setFormTitle] = useState('');

  const [checkinEditingId, setCheckinEditingId] = useState<string | null>(null);
  const [isCheckinAdding, setIsCheckinAdding] = useState(false);
  const [checkinTitle, setCheckinTitle] = useState('');
  const [checkinTime, setCheckinTime] = useState('09:00');
  const [checkinLocation, setCheckinLocation] = useState('司令台後方檢錄處');

  const filteredSports = schedules
    .filter(s => s.day !== '11/7')
    .sort((a, b) => a.time.localeCompare(b.time));

  const sortedCheckin = [...checkinSchedules].sort((a, b) => a.time.localeCompare(b.time));

  const handleSaveSports = () => {
    if (!formTime.trim() || !formTitle.trim()) {
      alert('請填寫時間與項目名稱');
      return;
    }
    if (isAdding) {
      onAdd({ day: '11/6', time: formTime.trim(), title: formTitle.trim() });
      setIsAdding(false);
      onNotify('已成功新增運動會時程項目');
    } else if (editingId) {
      onUpdate({ id: editingId, day: '11/6', time: formTime.trim(), title: formTitle.trim() });
      setEditingId(null);
      onNotify('已成功更新運動會時程項目');
    }
  };

  const handleSaveCheckin = () => {
    if (!checkinTitle.trim() || !checkinTime.trim() || !checkinLocation.trim()) {
      alert('請填寫項目、時間與地點');
      return;
    }
    if (isCheckinAdding) {
      onAddCheckin({
        title: checkinTitle.trim(),
        time: checkinTime.trim(),
        location: checkinLocation.trim()
      });
      setIsCheckinAdding(false);
      onNotify('已成功新增檢錄時程項目');
    } else if (checkinEditingId) {
      onUpdateCheckin({
        id: checkinEditingId,
        title: checkinTitle.trim(),
        time: checkinTime.trim(),
        location: checkinLocation.trim()
      });
      setCheckinEditingId(null);
      onNotify('已成功更新檢錄時程項目');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e5decb] p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5decb] pb-4">
        <div>
          <h2 className="text-base font-semibold text-[#09013d]">b. 賽程表管理</h2>
          <p className="text-xs text-[#73685e] mt-0.5">
            維護 11/6 運動會時程（時間、項目）與檢錄時程（項目、時間、地點）
          </p>
        </div>

        <div className="inline-flex p-1 bg-[#fbf3c9] rounded-full self-start sm:self-auto border border-[#e5decb]">
          <button
            onClick={() => { setSubTab('sports'); setIsAdding(false); setEditingId(null); }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
              subTab === 'sports' ? 'bg-[#09013d] text-[#fbf3c9] shadow-xs' : 'text-[#325291] hover:text-[#09013d]'
            }`}
          >
            運動會時程 ({filteredSports.length})
          </button>
          <button
            onClick={() => { setSubTab('checkin'); setIsCheckinAdding(false); setCheckinEditingId(null); }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
              subTab === 'checkin' ? 'bg-[#09013d] text-[#fbf3c9] shadow-xs' : 'text-[#325291] hover:text-[#09013d]'
            }`}
          >
            檢錄時程 ({sortedCheckin.length})
          </button>
        </div>
      </div>

      {/* 運動會時程 */}
      {subTab === 'sports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#325291]">11/6 運動會流程清單</span>
            {!isAdding && !editingId && (
              <button
                onClick={() => { setIsAdding(true); setEditingId(null); setFormTitle(''); setFormTime('09:00'); }}
                className="px-3.5 py-1.5 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增流程項目</span>
              </button>
            )}
          </div>

          {(isAdding || editingId) && (
            <div className="p-5 bg-[#fbf9f2] rounded-2xl border border-[#e5decb] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#342d27] mb-1">時間 (例: 08:30)</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full p-2 bg-white border border-[#e5decb] rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-[#342d27] mb-1">項目名稱</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full p-2 bg-white border border-[#e5decb] rounded-xl text-xs"
                    placeholder="例如：開幕典禮、女子 100m 預賽..."
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveSports}
                  className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-white rounded-full text-xs font-medium cursor-pointer"
                >
                  儲存
                </button>
                <button
                  onClick={() => { setIsAdding(false); setEditingId(null); }}
                  className="px-4 py-2 bg-white border border-[#e5decb] text-[#5e544c] rounded-full text-xs font-medium cursor-pointer"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-[#e5decb] border border-[#e5decb] rounded-2xl overflow-hidden bg-white">
            {filteredSports.map(s => (
              <div key={s.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#fbf9f2]/60">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-medium text-[#09013d] bg-[#fbf3c9] px-2.5 py-1 rounded-md border border-[#e5decb]">
                    {s.time}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-[#09013d]">{s.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setEditingId(s.id); setIsAdding(false); setFormTime(s.time); setFormTitle(s.title); }}
                    className="w-7 h-7 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#5e544c] hover:text-[#09013d]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (window.confirm('確定刪除此流程項目嗎？')) onDelete(s.id); }}
                    className="w-7 h-7 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#8a4e38] hover:bg-[#fbeeed]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 檢錄時程 */}
      {subTab === 'checkin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#325291]">檢錄地點與時程清單</span>
            {!isCheckinAdding && !checkinEditingId && (
              <button
                onClick={() => { setIsCheckinAdding(true); setCheckinEditingId(null); setCheckinTitle(''); setCheckinTime('09:00'); setCheckinLocation('司令台後方檢錄處'); }}
                className="px-3.5 py-1.5 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增檢錄項目</span>
              </button>
            )}
          </div>

          {(isCheckinAdding || checkinEditingId) && (
            <div className="p-5 bg-[#fbf9f2] rounded-2xl border border-[#e5decb] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#342d27] mb-1">檢錄項目</label>
                  <input
                    type="text"
                    value={checkinTitle}
                    onChange={e => setCheckinTitle(e.target.value)}
                    className="w-full p-2 bg-white border border-[#e5decb] rounded-xl text-xs"
                    placeholder="例如：高一 100m 預賽"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#342d27] mb-1">檢錄時間</label>
                  <input
                    type="text"
                    value={checkinTime}
                    onChange={e => setCheckinTime(e.target.value)}
                    className="w-full p-2 bg-white border border-[#e5decb] rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#342d27] mb-1">指定檢錄地點</label>
                  <input
                    type="text"
                    value={checkinLocation}
                    onChange={e => setCheckinLocation(e.target.value)}
                    className="w-full p-2 bg-white border border-[#e5decb] rounded-xl text-xs"
                    placeholder="例如：司令台後方檢錄處"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveCheckin}
                  className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-white rounded-full text-xs font-medium cursor-pointer"
                >
                  儲存
                </button>
                <button
                  onClick={() => { setIsCheckinAdding(false); setCheckinEditingId(null); }}
                  className="px-4 py-2 bg-white border border-[#e5decb] text-[#5e544c] rounded-full text-xs font-medium cursor-pointer"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-[#e5decb] border border-[#e5decb] rounded-2xl overflow-hidden bg-white">
            {sortedCheckin.map(c => (
              <div key={c.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#fbf9f2]/60">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
                  <span className="font-mono text-xs font-medium text-[#09013d] bg-[#fbf3c9] px-2.5 py-1 rounded-md border border-[#e5decb] self-start sm:self-auto">
                    {c.time}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#09013d]">{c.title}</span>
                  <span className="text-xs text-[#73685e]">{c.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setCheckinEditingId(c.id); setIsCheckinAdding(false); setCheckinTitle(c.title); setCheckinTime(c.time); setCheckinLocation(c.location); }}
                    className="w-7 h-7 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#5e544c] hover:text-[#09013d]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (window.confirm('確定刪除此檢錄項目嗎？')) onDeleteCheckin(c.id); }}
                    className="w-7 h-7 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#8a4e38] hover:bg-[#fbeeed]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------
 * 4. c. 榮譽榜管理
 * ------------------------------------------------------------- */
const HonorAdmin: React.FC<{
  honorRoll: HonorItem[];
  onAdd: (item: Omit<HonorItem, 'id'>) => void;
  onUpdate: (item: HonorItem) => void;
  onDelete: (id: string) => void;
  onNotify: (text: string) => void;
}> = ({ honorRoll, onAdd, onUpdate, onDelete, onNotify }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formEventName, setFormEventName] = useState('');
  const [formContent, setFormContent] = useState('');

  const getItemContent = (item: HonorItem): string => {
    if (typeof item.content === 'string') return item.content;
    if (item.awards && Array.isArray(item.awards)) {
      return item.awards.map(a => `${a.rank}：${a.awardee}${a.score ? ` ${a.score}` : ''}`).join('\n');
    }
    return '';
  };

  const handleSave = () => {
    if (!formEventName.trim()) {
      alert('請輸入比賽項目名稱');
      return;
    }
    if (isAdding) {
      onAdd({
        eventName: formEventName.trim(),
        content: formContent.trim()
      });
      setIsAdding(false);
      onNotify('已新增榮譽榜項目');
    } else if (editingId) {
      onUpdate({
        id: editingId,
        eventName: formEventName.trim(),
        content: formContent.trim()
      });
      setEditingId(null);
      onNotify('已更新榮譽榜項目');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e5decb] p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#09013d]">c. 榮譽榜管理</h2>
          <p className="text-xs text-[#73685e]">自由增刪比賽項目；得獎名次與姓名於單一輸入框直接輸入</p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setFormEventName(''); setFormContent(''); }}
            className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>新增比賽項目</span>
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="p-5 sm:p-6 bg-[#fbf9f2] rounded-2xl border border-[#e5decb] space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#342d27] mb-1">
              比賽項目名稱 <span className="text-[#8a4e38]">*</span>
            </label>
            <input
              type="text"
              value={formEventName}
              onChange={e => setFormEventName(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#e5decb] rounded-xl text-xs sm:text-sm text-[#09013d] focus:outline-none focus:border-[#325291]"
              placeholder="例如：100m 個人決賽、全年級大隊接力、拔河錦標賽..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#342d27] mb-1">
              項目底下的得獎內容 (自由換行輸入)
            </label>
            <textarea
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              rows={6}
              className="w-full p-3 bg-white border border-[#e5decb] rounded-xl text-xs sm:text-sm font-sans leading-relaxed text-[#09013d] focus:outline-none focus:border-[#325291]"
              placeholder={`第一名：205班 陳怡安 12.68 秒\n第二名：102班 林佳穎\n第三名：208班 許舒婷`}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-white rounded-full text-xs font-medium cursor-pointer"
            >
              確定儲存
            </button>
            <button
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="px-4 py-2 bg-white border border-[#e5decb] text-[#5e544c] rounded-full text-xs font-medium cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-[#e5decb] border border-[#e5decb] rounded-2xl overflow-hidden bg-white">
        {honorRoll.map(item => {
          const content = getItemContent(item);
          return (
            <div key={item.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-[#fbf9f2]/60">
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-[#09013d]">{item.eventName}</h3>
                <div className="p-3 bg-[#fbf9f2] rounded-xl border border-[#e5decb] text-xs text-[#5e544c] whitespace-pre-wrap leading-relaxed">
                  {content || '尚未輸入得獎內容'}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => { setEditingId(item.id); setIsAdding(false); setFormEventName(item.eventName); setFormContent(content); }}
                  className="w-8 h-8 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#5e544c] hover:text-[#09013d]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (window.confirm(`確定刪除「${item.eventName}」嗎？`)) onDelete(item.id); }}
                  className="w-8 h-8 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#8a4e38] hover:bg-[#fbeeed]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 5. d. 採訪報導管理 (支援相片上傳)
 * ------------------------------------------------------------- */
const InterviewsAdmin: React.FC<{
  interviews: InterviewItem[];
  onAdd: (item: Omit<InterviewItem, 'id'>) => void;
  onUpdate: (item: InterviewItem) => void;
  onDelete: (id: string) => void;
  uploadImageFile: (file: File) => Promise<string>;
  onNotify: (text: string) => void;
}> = ({ interviews, onAdd, onUpdate, onDelete, uploadImageFile, onNotify }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await uploadImageFile(file);
        setFormImageUrl(dataUrl);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formContent.trim()) {
      alert('請填寫標題與內文');
      return;
    }
    if (isAdding) {
      onAdd({
        title: formTitle.trim(),
        content: formContent.trim(),
        imageUrl: formImageUrl.trim() || undefined
      });
      setIsAdding(false);
      onNotify('已新增採訪');
    } else if (editingId) {
      onUpdate({
        id: editingId,
        title: formTitle.trim(),
        content: formContent.trim(),
        imageUrl: formImageUrl.trim() || undefined
      });
      setEditingId(null);
      onNotify('已更新採訪');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e5decb] p-6 sm:p-8 space-y-6 shadow-xs">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#09013d]">d. 採訪管理</h2>
          <p className="text-xs text-[#73685e]">包含標題與內文；照片為選填，可直接從本機選擇上傳相片</p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setFormTitle(''); setFormContent(''); setFormImageUrl(''); }}
            className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>新增採訪</span>
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="p-5 sm:p-6 bg-[#fbf9f2] rounded-2xl border border-[#e5decb] space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#342d27] mb-1">採訪標題 *</label>
            <input
              type="text"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#e5decb] rounded-xl text-xs sm:text-sm text-[#09013d]"
              placeholder="請輸入採訪標題..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#342d27] mb-1">採訪內文 *</label>
            <textarea
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              rows={5}
              className="w-full p-2.5 bg-white border border-[#e5decb] rounded-xl text-xs sm:text-sm font-sans leading-relaxed text-[#09013d]"
              placeholder="請輸入採訪內容..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#342d27]">採訪相片 (選填，可上傳本機檔案或填寫圖片超連結)</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-[#e5decb] hover:bg-[#fbf9f2] text-[#09013d] rounded-full text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-[#325291]" />
                <span>選擇本機相片</span>
              </button>

              <div className="relative flex-1">
                <Link className="w-3.5 h-3.5 text-[#73685e] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={e => setFormImageUrl(normalizeImageUrl(e.target.value))}
                  placeholder="或直接輸入圖片超連結網址 (支援 Google Drive 分享連結)..."
                  className="w-full pl-8 pr-8 py-2 bg-white border border-[#e5decb] rounded-full text-xs font-mono text-[#325291] placeholder-[#9c9387]"
                />
                {formImageUrl && (
                  <button
                    type="button"
                    onClick={() => setFormImageUrl('')}
                    title="清除照片"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8a4e38] hover:text-[#b33a2b]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {formImageUrl && (
              <div className="pt-1">
                <div className="w-full max-w-xs rounded-xl overflow-hidden border border-[#e5decb] bg-white shadow-2xs">
                  <img src={formImageUrl} alt="預覽" className="w-full h-auto object-contain block mx-auto" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-white rounded-full text-xs font-medium cursor-pointer"
            >
              儲存
            </button>
            <button
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="px-4 py-2 bg-white border border-[#e5decb] text-[#5e544c] rounded-full text-xs font-medium cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-[#e5decb] border border-[#e5decb] rounded-2xl overflow-hidden bg-white">
        {interviews.map(iv => (
          <div key={iv.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-[#fbf9f2]/60">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-[#09013d]">{iv.title}</h3>
                {iv.imageUrl && (
                  <span className="text-[10px] text-[#546e50] bg-[#cff0eb]/40 px-2 py-0.5 rounded-full border border-[#bce4de]">
                    附相片
                  </span>
                )}
              </div>
              <p className="text-xs text-[#325291] line-clamp-2 leading-relaxed">{iv.content}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => { setEditingId(iv.id); setIsAdding(false); setFormTitle(iv.title); setFormContent(iv.content); setFormImageUrl(iv.imageUrl || ''); }}
                className="w-8 h-8 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#5e544c] hover:text-[#09013d]"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { if (window.confirm(`確定刪除「${iv.title}」嗎？`)) onDelete(iv.id); }}
                className="w-8 h-8 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#8a4e38] hover:bg-[#fbeeed]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 6. f. 各班攤位一覽管理 (支援品項分類管理與傳單直角顯示)
 * ------------------------------------------------------------- */
const BoothsAdmin: React.FC<{
  booths: BoothItem[];
  categories: string[];
  onAdd: (item: Omit<BoothItem, 'id'>) => void;
  onUpdate: (item: BoothItem) => void;
  onDelete: (id: string) => void;
  onAddCategory: (categoryName: string) => boolean;
  onUpdateCategory: (oldCategory: string, newCategory: string) => boolean;
  onDeleteCategory: (categoryName: string) => boolean;
  onResetCategories: () => void;
  uploadImageFile: (file: File) => Promise<string>;
  onNotify: (text: string, type?: 'success' | 'info') => void;
}> = ({
  booths,
  categories,
  onAdd,
  onUpdate,
  onDelete,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onResetCategories,
  uploadImageFile,
  onNotify
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formGrade, setFormGrade] = useState<'高一' | '高二'>('高一');
  const [formClassName, setFormClassName] = useState('101');
  const [formCategory, setFormCategory] = useState<string>(categories[0] || '冷飲');
  const [formFlyerUrl, setFormFlyerUrl] = useState('/src/assets/images/fair_food_flyer_1792325751416.jpg');
  const flyerInputRef = useRef<HTMLInputElement>(null);

  // 品項分類管理狀態
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState('');

  // 確保 formCategory 在分類清單變更時有合理預設
  useEffect(() => {
    if (!formCategory && categories.length > 0) {
      setFormCategory(categories[0]);
    }
  }, [categories, formCategory]);

  const handleFlyerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await uploadImageFile(file);
        setFormFlyerUrl(dataUrl);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveBooth = () => {
    if (!formClassName.trim() || !formFlyerUrl.trim()) {
      alert('請填寫班級與傳單照片');
      return;
    }
    if (isAdding) {
      onAdd({
        grade: formGrade,
        className: formClassName,
        category: formCategory,
        flyerUrl: formFlyerUrl
      });
      setIsAdding(false);
      onNotify('已新增班級攤位');
    } else if (editingId) {
      onUpdate({
        id: editingId,
        grade: formGrade,
        className: formClassName,
        category: formCategory,
        flyerUrl: formFlyerUrl
      });
      setEditingId(null);
      onNotify('已更新班級攤位');
    }
  };

  // 分類操作函式
  const handleCreateCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      alert('請輸入品項分類名稱');
      return;
    }
    const success = onAddCategory(trimmed);
    if (success) {
      onNotify(`已新增品項分類「${trimmed}」`, 'success');
      setNewCategoryName('');
      setFormCategory(trimmed);
    } else {
      alert(`分類「${trimmed}」已存在，請勿重複新增。`);
    }
  };

  const handleStartEditCategory = (cat: string) => {
    setEditingCategoryOldName(cat);
    setEditingCategoryNewName(cat);
  };

  const handleSaveEditCategory = () => {
    if (!editingCategoryOldName) return;
    const trimmed = editingCategoryNewName.trim();
    if (!trimmed) {
      alert('分類名稱不可為空');
      return;
    }
    if (trimmed === editingCategoryOldName) {
      setEditingCategoryOldName(null);
      return;
    }
    const success = onUpdateCategory(editingCategoryOldName, trimmed);
    if (success) {
      onNotify(`已將分類「${editingCategoryOldName}」更名為「${trimmed}」，並同步更新關聯攤位！`, 'success');
      if (formCategory === editingCategoryOldName) {
        setFormCategory(trimmed);
      }
      setEditingCategoryOldName(null);
    } else {
      alert(`分類名稱「${trimmed}」已存在，請使用其他名稱。`);
    }
  };

  const handleDeleteCategory = (cat: string) => {
    const usingCount = booths.filter(b => b.category === cat).length;
    let message = `確定要刪除品項分類「${cat}」嗎？`;
    if (usingCount > 0) {
      message = `目前共有 ${usingCount} 個攤位使用「${cat}」分類。\n刪除後此標籤將不再出現在篩選列。\n\n確定仍要刪除嗎？`;
    }
    if (window.confirm(message)) {
      onDeleteCategory(cat);
      onNotify(`已刪除品項分類「${cat}」`, 'info');
      if (formCategory === cat) {
        setFormCategory(categories.find(c => c !== cat) || '冷飲');
      }
    }
  };

  const handleResetCategories = () => {
    if (window.confirm('確定要將品項分類還原為官方預設值（冷飲、甜點、鹹食、遊戲/娛樂、文創手作）嗎？')) {
      onResetCategories();
      onNotify('已成功還原為預設品項分類！', 'success');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e5decb] p-6 sm:p-8 space-y-8 shadow-xs">
      <input ref={flyerInputRef} type="file" accept="image/*" className="hidden" onChange={handleFlyerUpload} />

      {/* 標題與新增攤位按鈕 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#09013d]">f. 各班攤位一覽管理</h2>
          <p className="text-xs text-[#73685e]">
            包含班級、品項分類與傳單海報相片（傳單以直角呈現），支援本機相片直傳與分類自由編輯
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setFormClassName('106');
              setFormCategory(categories[0] || '冷飲');
            }}
            className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] text-xs font-medium rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>新增班級攤位</span>
          </button>
        )}
      </div>

      {/* -------------------------------------------------------------
       * 品項分類管理專區 (管理者可自行編輯、新增、刪除、更名)
       * ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 bg-[#fbf9f2] rounded-2xl border border-[#e5decb] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#325291]" />
            <h3 className="text-sm font-semibold text-[#09013d]">園遊會品項分類管理</h3>
            <span className="text-[11px] text-[#73685e]">（共 {categories.length} 項）</span>
          </div>
          <button
            onClick={handleResetCategories}
            className="text-[11px] text-[#325291] hover:text-[#09013d] flex items-center gap-1 self-start sm:self-auto hover:underline cursor-pointer"
            title="還原為官方初始分類清單"
          >
            <RotateCcw className="w-3 h-3" />
            <span>還原預設分類</span>
          </button>
        </div>

        {/* 現有分類標籤清單 (支援單鍵更名與刪除) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categories.map(cat => {
            const isEditing = editingCategoryOldName === cat;
            const boothCount = booths.filter(b => b.category === cat).length;

            if (isEditing) {
              return (
                <div
                  key={cat}
                  className="flex items-center gap-1 bg-white border-2 border-[#325291] rounded-full pl-3 pr-1.5 py-1 shadow-xs"
                >
                  <input
                    type="text"
                    value={editingCategoryNewName}
                    onChange={e => setEditingCategoryNewName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEditCategory();
                      if (e.key === 'Escape') setEditingCategoryOldName(null);
                    }}
                    autoFocus
                    placeholder="輸入新名稱"
                    className="text-xs font-medium text-[#09013d] outline-none w-24 sm:w-28 bg-transparent"
                  />
                  <button
                    onClick={handleSaveEditCategory}
                    title="確認更名"
                    className="w-5 h-5 rounded-full bg-[#09013d] text-[#fbf3c9] hover:bg-[#1a1254] flex items-center justify-center cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setEditingCategoryOldName(null)}
                    title="取消"
                    className="w-5 h-5 rounded-full bg-white text-[#73685e] hover:text-[#09013d] flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={cat}
                className="group flex items-center gap-1.5 bg-white border border-[#e5decb] hover:border-[#325291]/50 rounded-full pl-3.5 pr-2 py-1.5 text-xs text-[#09013d] shadow-2xs transition-all"
              >
                <span className="font-medium">{cat}</span>
                <span className="text-[10px] text-[#73685e] bg-[#fbf9f2] px-1.5 py-0.5 rounded-full">
                  {boothCount} 攤
                </span>
                <div className="flex items-center gap-0.5 ml-0.5">
                  <button
                    onClick={() => handleStartEditCategory(cat)}
                    title={`更名「${cat}」`}
                    className="w-5 h-5 rounded-full hover:bg-[#fbf3c9] text-[#73685e] hover:text-[#09013d] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    title={`刪除「${cat}」`}
                    className="w-5 h-5 rounded-full hover:bg-[#fbeeed] text-[#73685e] hover:text-[#8a4e38] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 新增分類輸入列 */}
        <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-[#e5decb]/70">
          <div className="relative flex-1">
            <Tag className="w-3.5 h-3.5 text-[#73685e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="新增自訂品項分類（例如：特調手搖、炸物烤肉、生活小物、似顏繪）..."
              className="w-full pl-8 pr-4 py-2 bg-white border border-[#e5decb] rounded-full text-xs text-[#09013d] placeholder-[#9c9387] focus:outline-none focus:border-[#325291]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] text-xs font-medium rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增品項分類</span>
          </button>
        </form>
      </div>

      {/* -------------------------------------------------------------
       * 攤位新增 / 編輯表單 (直角傳單預覽)
       * ------------------------------------------------------------- */}
      {(isAdding || editingId) && (
        <div className="p-5 sm:p-6 bg-[#fbf9f2] rounded-2xl border border-[#e5decb] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#09013d]">
              {isAdding ? '新增班級攤位' : `編輯攤位：${formClassName} 班`}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#342d27] mb-1">年級</label>
              <select
                value={formGrade}
                onChange={e => setFormGrade(e.target.value as any)}
                className="w-full p-2 bg-white border border-[#e5decb] rounded-xl text-xs"
              >
                <option value="高一">高一</option>
                <option value="高二">高二</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#342d27] mb-1">班級</label>
              <input
                type="text"
                value={formClassName}
                onChange={e => setFormClassName(e.target.value)}
                className="w-full p-2 bg-white border border-[#e5decb] rounded-xl text-xs font-mono font-semibold"
                placeholder="例如：101、204"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#342d27] mb-1">品項分類</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="w-full p-2 bg-white border border-[#e5decb] rounded-xl text-xs font-medium"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                {!categories.includes(formCategory) && formCategory && (
                  <option value={formCategory}>
                    {formCategory} (自訂)
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* 傳單相片 (直角 rounded-none 預覽) */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#342d27]">
              傳單相片 (直角呈現，可上傳本機檔案或填寫圖片超連結)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => flyerInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-[#e5decb] hover:bg-[#fbf9f2] text-[#09013d] rounded-full text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-[#325291]" />
                <span>選擇本機傳單</span>
              </button>

              <div className="relative flex-1">
                <Link className="w-3.5 h-3.5 text-[#73685e] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={formFlyerUrl}
                  onChange={e => setFormFlyerUrl(normalizeImageUrl(e.target.value))}
                  placeholder="或直接輸入傳單圖片超連結網址 (支援 Google Drive 分享連結)..."
                  className="w-full pl-8 pr-8 py-2 bg-white border border-[#e5decb] rounded-full text-xs font-mono text-[#325291] placeholder-[#9c9387]"
                />
                {formFlyerUrl && (
                  <button
                    type="button"
                    onClick={() => setFormFlyerUrl('')}
                    title="清除傳單"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8a4e38] hover:text-[#b33a2b]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* 傳單直角預覽 (rounded-none) */}
            {formFlyerUrl && (
              <div className="pt-1">
                <div className="text-[11px] text-[#73685e] mb-1">傳單直角預覽：</div>
                <div className="w-full max-w-xs rounded-none overflow-hidden border border-[#e5decb] bg-white shadow-2xs">
                  <img
                    src={formFlyerUrl}
                    alt="傳單預覽"
                    className="w-full h-auto object-contain block mx-auto rounded-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSaveBooth}
              className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-white rounded-full text-xs font-medium cursor-pointer"
            >
              儲存攤位
            </button>
            <button
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="px-4 py-2 bg-white border border-[#e5decb] text-[#5e544c] rounded-full text-xs font-medium cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * 攤位卡片清單 (傳單縮圖直角 rounded-none)
       * ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {booths.map(b => (
          <div key={b.id} className="p-3.5 bg-[#fbf9f2] rounded-2xl border border-[#e5decb] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              {/* 傳單直角縮圖 (rounded-none) */}
              <div className="w-14 h-18 rounded-none border border-[#e5decb] overflow-hidden bg-white shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                <img
                  src={b.flyerUrl}
                  alt={b.className}
                  className="w-full h-full object-contain rounded-none"
                />
              </div>
              <div className="space-y-0.5 truncate">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#09013d]">{b.className} 班</span>
                  <span className="text-[10px] text-[#325291] bg-[#fbf3c9] px-2 py-0.5 rounded-full border border-[#edd995]">
                    {b.category}
                  </span>
                </div>
                <div className="text-[#73685e] text-[11px] truncate">{b.grade} · 班級攤位</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setEditingId(b.id);
                  setIsAdding(false);
                  setFormGrade(b.grade);
                  setFormClassName(b.className);
                  setFormCategory(b.category);
                  setFormFlyerUrl(b.flyerUrl);
                }}
                className="w-7 h-7 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#5e544c] hover:text-[#09013d] cursor-pointer"
                title="編輯此攤位"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { if (window.confirm(`確定刪除「${b.className} 班」攤位嗎？`)) onDelete(b.id); }}
                className="w-7 h-7 rounded-full bg-white border border-[#e5decb] flex items-center justify-center text-[#8a4e38] hover:bg-[#fbeeed] cursor-pointer"
                title="刪除此攤位"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 7. 相簿「照片下載專區」連結管理
 * ------------------------------------------------------------- */
const AlbumsAdmin: React.FC<{
  albums: AlbumLink[];
  onUpdateUrl: (albumId: string, url: string) => void;
  onNotify: (text: string, type?: 'success' | 'info') => void;
}> = ({ albums, onUpdateUrl, onNotify }) => {
  const primaryAlbum = albums[0];
  const albumId = primaryAlbum?.id || 'album-1';
  const [downloadUrl, setDownloadUrl] = useState(primaryAlbum?.externalUrl || 'https://photos.google.com/');

  useEffect(() => {
    if (primaryAlbum?.externalUrl) {
      setDownloadUrl(primaryAlbum.externalUrl);
    }
  }, [primaryAlbum?.externalUrl]);

  const handleSaveUrl = () => {
    const trimmed = downloadUrl.trim();
    if (!trimmed) {
      onNotify('請輸入有效的雲端相簿網址', 'info');
      return;
    }
    onUpdateUrl(albumId, trimmed);
    onNotify('相簿「照片下載專區」連結已成功儲存並同步至前台！', 'success');
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e5decb] p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-[#09013d] flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#325291]" />
          <span>相簿「照片下載專區」連結管理</span>
        </h2>
        <p className="text-xs text-[#73685e] mt-1 leading-relaxed">
          前台「相簿」頁面提供單一「照片下載專區」按鈕，訪客點擊後將直接在新分頁開啟所設定的雲端相簿（例如 Google 相簿、Google 雲端硬碟、OneDrive 或 Flickr）。您可在此隨時更新分享網址。
        </p>
      </div>

      {/* 主要前台下載專區卡片 */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#cff0eb]/30 border border-[#bce4de] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-[#325291] bg-white px-2.5 py-0.5 rounded-full border border-[#bce4de] inline-block mb-1.5">
              前台核心連結（照片下載專區按鈕目標）
            </span>
            <h3 className="text-sm font-bold text-[#09013d]">
              {primaryAlbum?.title || '校慶照片下載專區'}
            </h3>
            <p className="text-xs text-[#73685e]">
              {primaryAlbum?.subtitle || '校慶活動高畫質原始相片雲端相簿'}
            </p>
          </div>
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#bce4de] hover:bg-[#cff0eb]/50 rounded-full text-xs font-semibold text-[#09013d] transition-colors self-start sm:self-auto shadow-2xs"
            >
              <span>開啟測試連結</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#325291]" />
            </a>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#09013d]">
            相簿分享網址 (Google Photos / 雲端硬碟 / OneDrive 連結)
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Link className="w-4 h-4 text-[#73685e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://photos.app.goo.gl/... 或雲端相簿分享網址"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#e5decb] focus:border-[#325291] rounded-xl text-xs sm:text-sm font-mono text-[#09013d] outline-none transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveUrl}
              className="px-5 py-2.5 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>儲存網址</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 8. 全站相片管理 (首頁橫幅、地圖、功能卡片)
 * ------------------------------------------------------------- */
const SiteMediaAdmin: React.FC<{
  heroImage: string;
  boothMapImage: string;
  buttonImages?: Record<string, string>;
  onUpdateHeroImage: (url: string) => void;
  onUpdateBoothMapImage: (url: string) => void;
  onUpdateButtonImage: (key: string, url: string) => void;
  uploadImageFile: (file: File) => Promise<string>;
  onNotify: (text: string) => void;
}> = ({
  heroImage,
  boothMapImage,
  buttonImages,
  onUpdateHeroImage,
  onUpdateBoothMapImage,
  onUpdateButtonImage,
  uploadImageFile,
  onNotify
}) => {
  const heroInputRef = useRef<HTMLInputElement>(null);
  const mapInputRef = useRef<HTMLInputElement>(null);
  const [heroUrlInput, setHeroUrlInput] = useState('');
  const [mapUrlInput, setMapUrlInput] = useState('');

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await uploadImageFile(file);
        onUpdateHeroImage(dataUrl);
        onNotify('已更新首頁英雄橫幅大圖');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await uploadImageFile(file);
        onUpdateBoothMapImage(dataUrl);
        onNotify('已更新園遊會攤位分布地圖');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const buttonItems = [
    { key: 'activities', label: '1. 賽事活動簡介' },
    { key: 'schedule', label: '2. 賽程' },
    { key: 'honor', label: '3. 榮譽榜' },
    { key: 'interviews', label: '4. 採訪' },
    { key: 'albums', label: '5. 相簿' },
    { key: 'booths', label: '6. 各班攤位一覽' },
  ];

  const handleButtonUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await uploadImageFile(file);
        onUpdateButtonImage(key, dataUrl);
        onNotify('已更新按鈕相片');
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e5decb] p-6 sm:p-8 space-y-8 shadow-xs">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-[#09013d]">全站相片管理中心 (管理員專屬)</h2>
        <p className="text-xs text-[#73685e] mt-1 leading-relaxed">
          所有相片上傳功能統一集中於後台管理。您可在此透過本機上傳或直接輸入圖片超連結更換首頁橫幅、園遊會全區地圖及首頁功能卡片相片。
        </p>
      </div>

      {/* 區塊 1: 首頁英雄橫幅大圖 */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#fbf9f2] border border-[#e5decb] space-y-4">
        <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#09013d]">1. 首頁英雄橫幅相片 (Hero Banner)</h3>
            <p className="text-xs text-[#73685e]">全站各頁頂部沉浸式校慶主視覺大圖</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => heroInputRef.current?.click()}
              className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-[#cff0eb]" />
              <span>上傳本機相片</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateHeroImage(INITIAL_DATA.heroImage || '');
                onNotify('已還原為官方預設橫幅大圖');
              }}
              className="px-3.5 py-2 bg-white border border-[#e5decb] hover:bg-[#fbf9f2] text-[#5e544c] rounded-full text-xs font-medium cursor-pointer"
            >
              還原預設
            </button>
          </div>
        </div>

        {/* 圖片超連結輸入 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Link className="w-3.5 h-3.5 text-[#73685e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={heroUrlInput}
              onChange={(e) => setHeroUrlInput(e.target.value)}
              placeholder="貼上橫幅圖片超連結 (支援 Google Drive 分享連結)..."
              className="w-full pl-8 pr-20 py-2 bg-white border border-[#e5decb] rounded-full text-xs font-mono text-[#325291]"
            />
            <button
              type="button"
              onClick={() => {
                if (heroUrlInput.trim()) {
                  onUpdateHeroImage(heroUrlInput.trim());
                  onNotify('已更新橫幅相片超連結');
                  setHeroUrlInput('');
                }
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] text-xs font-medium rounded-full cursor-pointer shadow-2xs"
            >
              套用網址
            </button>
          </div>
        </div>

        <div className="relative w-full rounded-xl bg-[#cff0eb] overflow-hidden border border-[#e5decb]">
          {heroImage ? (
            <img src={heroImage} alt="首頁英雄橫幅預覽" className="w-full h-auto max-h-[300px] object-contain block mx-auto" />
          ) : (
            <div className="w-full h-32 flex items-center justify-center text-xs text-[#73685e]">目前尚未設定相片</div>
          )}
        </div>
      </div>

      {/* 區塊 2: 園遊會攤位全區地圖 */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#fbf9f2] border border-[#e5decb] space-y-4">
        <input ref={mapInputRef} type="file" accept="image/*" className="hidden" onChange={handleMapUpload} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#09013d]">2. 園遊會校園攤位分布地圖 (Fair Map)</h3>
            <p className="text-xs text-[#73685e]">首頁園遊會專區與各班攤位分布展示之全區平面圖</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => mapInputRef.current?.click()}
              className="px-4 py-2 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-[#cff0eb]" />
              <span>上傳本機地圖</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateBoothMapImage(INITIAL_DATA.boothMapImage || '');
                onNotify('已還原為官方預設地圖');
              }}
              className="px-3.5 py-2 bg-white border border-[#e5decb] hover:bg-[#fbf9f2] text-[#5e544c] rounded-full text-xs font-medium cursor-pointer"
            >
              還原預設
            </button>
          </div>
        </div>

        {/* 圖片超連結輸入 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Link className="w-3.5 h-3.5 text-[#73685e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={mapUrlInput}
              onChange={(e) => setMapUrlInput(e.target.value)}
              placeholder="貼上地圖圖片超連結 (支援 Google Drive 分享連結)..."
              className="w-full pl-8 pr-20 py-2 bg-white border border-[#e5decb] rounded-full text-xs font-mono text-[#325291]"
            />
            <button
              type="button"
              onClick={() => {
                if (mapUrlInput.trim()) {
                  onUpdateBoothMapImage(mapUrlInput.trim());
                  onNotify('已更新攤位地圖超連結');
                  setMapUrlInput('');
                }
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] text-xs font-medium rounded-full cursor-pointer shadow-2xs"
            >
              套用網址
            </button>
          </div>
        </div>

        <div className="relative w-full rounded-none bg-[#cff0eb] overflow-hidden border border-[#e5decb]">
          {boothMapImage ? (
            <img src={boothMapImage} alt="攤位地圖預覽" className="w-full h-auto max-h-[400px] object-contain block mx-auto p-1 rounded-none" />
          ) : (
            <div className="w-full h-32 flex items-center justify-center text-xs text-[#73685e]">目前尚未設定地圖相片</div>
          )}
        </div>
      </div>

      {/* 區塊 3: 首頁功能卡片背景相片 */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#fbf9f2] border border-[#e5decb] space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#09013d]">3. 首頁功能卡片背景相片 (Home Feature Cards)</h3>
          <p className="text-xs text-[#73685e]">首頁 11/6 運動會與 11/7 園遊會 6 個快速跳轉卡片之自訂封面相片</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {buttonItems.map(item => {
            const currentImg = buttonImages?.[item.key];
            return (
              <div key={item.key} className="p-3.5 rounded-xl border border-[#e5decb] bg-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#09013d]">{item.label}</span>
                  {currentImg ? (
                    <span className="text-[10px] text-[#325291] bg-[#cff0eb]/40 px-2 py-0.5 rounded-full border border-[#bce4de]">
                      已自訂相片
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#73685e]">預設圖示</span>
                  )}
                </div>

                <div className="relative aspect-video w-full rounded-lg bg-[#cff0eb] overflow-hidden border border-[#e5decb] flex items-center justify-center">
                  {currentImg ? (
                    <img src={currentImg} alt={item.label} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-xs text-[#73685e]">尚未設定相片</span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="relative">
                    <Link className="w-3.5 h-3.5 text-[#73685e] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="圖片超連結 (支援 Google Drive)..."
                      value={currentImg || ''}
                      onChange={(e) => onUpdateButtonImage(item.key, e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 bg-[#fbf9f2] border border-[#e5decb] rounded-lg text-[11px] font-mono text-[#325291] placeholder-[#9c9387]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex-1 py-1.5 px-3 bg-[#fbf9f2] border border-[#e5decb] hover:bg-white rounded-full text-xs font-medium text-[#09013d] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                      <Camera className="w-3.5 h-3.5 text-[#325291]" />
                      <span>上傳本機相片</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleButtonUpload(item.key, e)}
                      />
                    </label>
                    {currentImg && (
                      <button
                        onClick={() => { onUpdateButtonImage(item.key, ''); onNotify(`已清除 ${item.label} 相片`); }}
                        className="text-xs text-[#8a4e38] hover:underline px-1"
                      >
                        清除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 8. 變更登入密碼 / 密碼與帳號安全
 * ------------------------------------------------------------- */
const SecurityAdmin: React.FC<{
  hasCustomPassword: boolean;
  defaultAdminPassword: string;
  onChangePassword: (oldPw: string, newPw: string) => Promise<{ success: boolean; message: string }>;
  onResetPassword: () => Promise<{ success: boolean; message: string }>;
  onNotify: (text: string, type?: 'success' | 'info') => void;
}> = ({
  hasCustomPassword,
  defaultAdminPassword,
  onChangePassword,
  onResetPassword,
  onNotify
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!oldPassword) {
      setErrorMessage('請輸入目前管理員舊密碼。');
      return;
    }
    if (!newPassword || newPassword.trim().length < 1) {
      setErrorMessage('請輸入有效的新密碼。');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage('兩次輸入的新密碼不相符，請再次確認。');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await onChangePassword(oldPassword, newPassword);
      if (result.success) {
        onNotify(result.message, 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMessage('');
      } else {
        setErrorMessage(result.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm(`確定要還原為系統預設管理員密碼 (${defaultAdminPassword}) 嗎？`)) {
      setIsUpdating(true);
      try {
        const res = await onResetPassword();
        if (res.success) {
          onNotify(res.message, 'info');
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setErrorMessage('');
        }
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e5decb] p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5decb] pb-4">
        <div>
          <h2 className="text-base font-semibold text-[#09013d] flex items-center gap-2">
            <KeyRound className="w-4.5 h-4.5 text-[#325291]" />
            <span>管理員登入密碼與 Session Token 權限安全</span>
          </h2>
          <p className="text-xs text-[#73685e] mt-0.5">
            設定後台存取密碼，系統自動簽發加密 Session Token 進行權限管理
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasCustomPassword ? (
            <span className="text-xs bg-[#cff0eb]/60 text-[#1f4b44] border border-[#bce4de] px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#325291]" />
              已啟用自訂密碼
            </span>
          ) : (
            <span className="text-xs bg-[#fbf3c9] text-[#8a5b28] border border-[#edd995] px-3 py-1 rounded-full font-medium flex items-center gap-1.5 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 text-[#c98336]" />
              使用系統預設密碼 ({defaultAdminPassword})
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 表單區塊 */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 目前舊密碼 */}
            <div>
              <label className="block text-xs font-semibold text-[#09013d] mb-1.5">
                目前舊密碼 (Current Password) <span className="text-[#8a4e38]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder={hasCustomPassword ? '請輸入您目前使用的密碼' : `請輸入預設密碼 (${defaultAdminPassword})`}
                  className="w-full pr-10 pl-3.5 py-2.5 bg-[#fbf9f2] border border-[#e5decb] rounded-xl text-xs sm:text-sm text-[#09013d] focus:outline-none focus:border-[#325291] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73685e] hover:text-[#09013d] cursor-pointer"
                  title={showOld ? '隱藏密碼' : '顯示密碼'}
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 新密碼 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#09013d]">
                  設定新密碼 (New Password) <span className="text-[#8a4e38]">*</span>
                </label>
                <span className="text-[11px] text-[#73685e]">請輸入欲設定的新密碼</span>
              </div>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="請輸入欲設定的新密碼"
                  className="w-full pr-10 pl-3.5 py-2.5 bg-[#fbf9f2] border border-[#e5decb] rounded-xl text-xs sm:text-sm text-[#09013d] focus:outline-none focus:border-[#325291] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73685e] hover:text-[#09013d] cursor-pointer"
                  title={showNew ? '隱藏密碼' : '顯示密碼'}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 確認新密碼 */}
            <div>
              <label className="block text-xs font-semibold text-[#09013d] mb-1.5">
                再次確認新密碼 (Confirm New Password) <span className="text-[#8a4e38]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="請再次輸入新密碼以進行確認"
                  className="w-full pr-10 pl-3.5 py-2.5 bg-[#fbf9f2] border border-[#e5decb] rounded-xl text-xs sm:text-sm text-[#09013d] focus:outline-none focus:border-[#325291] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73685e] hover:text-[#09013d] cursor-pointer"
                  title={showConfirm ? '隱藏密碼' : '顯示密碼'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-[#fbeeed] border border-[#ebd0ce] rounded-xl text-[#843229] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#843229] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="min-h-[40px] px-6 py-2 bg-[#09013d] hover:bg-[#1a1254] disabled:opacity-60 text-[#fbf3c9] rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 border border-[#325291]/40"
              >
                <Save className="w-4 h-4" />
                <span>{isUpdating ? '處理中...' : '儲存新密碼並重發 Session Token'}</span>
              </button>

              {hasCustomPassword && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleReset}
                  className="min-h-[40px] px-4 py-2 bg-white border border-[#e5decb] hover:bg-[#fbf9f2] text-[#8a4e38] rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#8a4e38]" />
                  <span>還原為系統預設密碼 ({defaultAdminPassword})</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 說明指導卡片 */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-[#fbf9f2] rounded-2xl border border-[#e5decb] space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold text-[#09013d] flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-[#325291]" />
              <span>Session Token 權限控管與 Cloudflare 免費部署</span>
            </h3>
            <ul className="text-xs text-[#5e544c] space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#09013d] shrink-0">1.</span>
                <span>
                  <strong className="text-[#09013d]">專屬後台入口：</strong>登入驗證頁面為隱藏入口，請直接於首頁網址後方輸入 <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#e5decb]">/admini2t2</code>（或 <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#e5decb]">#/admini2t2</code>）即可進入。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#09013d] shrink-0">2.</span>
                <span>
                  <strong className="text-[#09013d]">Session Token 權限驗證：</strong>輸入密碼驗證後，系統自動簽發 HMAC-SHA256 加密的 Session Token，後續所有操作均透過 Token 鑑權，不需在請求中攜帶明文密碼。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#09013d] shrink-0">3.</span>
                <span>
                  <strong className="text-[#09013d]">Cloudflare Pages 免費部署：</strong>已配置 <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#e5decb]">public/_redirects</code> 支援 SPA 單頁路由。部署命令為 <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#e5decb]">npm run build</code>，輸出目錄為 <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#e5decb]">dist</code>。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#09013d] shrink-0">4.</span>
                <span>
                  <strong className="text-[#09013d]">Cloudflare 環境變數：</strong>在 Cloudflare Pages 專案的 <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#e5decb]">Settings &gt; Environment Variables</code> 可設定 <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#e5decb]">ADMIN_PASSWORD</code> 作為雲端管理者密碼。
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};


