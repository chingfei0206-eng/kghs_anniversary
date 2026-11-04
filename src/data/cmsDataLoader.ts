/**
 * Decap CMS Git-based 資料即時載入模組
 *
 * 透過 Vite 的 import.meta.glob 與靜態 JSON 載入，
 * 當管理者在 Decap CMS (/admin/) 儲存並發布任何內容至 GitHub main 分支後，
 * Cloudflare Pages 重新打包建置時，本模組會直接將 Git 最新資料編譯入前台應用程式中，
 * 確保前台網站內容與 Decap CMS 管理後台 100% 同步！
 */

import { SchoolCelebrationData, ActivityItem, ScheduleItem, CheckinScheduleItem, HonorItem, InterviewItem, LiveNewsItem, WeekActivityItem, BoothItem, AlbumLink } from '../types';
import { INITIAL_DATA, OFFICIAL_ALBUMS, BOOTH_MAP_IMAGE, DEFAULT_BOOTH_CATEGORIES, DEFAULT_HOME_CARDS } from './initialData';

// 1. 靜態單一檔案 JSON 載入
import announcementRaw from '../../data/announcement.json';
import activitiesRaw from '../../data/activities.json';
import schedulesRaw from '../../data/schedules.json';
import checkinSchedulesRaw from '../../data/checkinSchedules.json';
import honorRollRaw from '../../data/honorRoll.json';
import albumsRaw from '../../data/albums.json';
import boothCategoriesRaw from '../../data/boothCategories.json';

// 2. 透過 Vite import.meta.glob 動態彙整 Decap CMS Folder Collections
const interviewModules = import.meta.glob<Record<string, any>>('/data/interviews/*.json', { eager: true });
const liveNewsModules = import.meta.glob<Record<string, any>>('/data/liveNews/*.json', { eager: true });
const weekActivityModules = import.meta.glob<Record<string, any>>('/data/weekActivities/*.json', { eager: true });
const boothModules = import.meta.glob<Record<string, any>>('/data/booths/*.json', { eager: true });

export function loadDecapCMSData(): SchoolCelebrationData {
  // A. 跑馬燈公告
  const announcement = {
    enabled: typeof announcementRaw?.enabled === 'boolean' ? announcementRaw.enabled : true,
    text: announcementRaw?.text || INITIAL_DATA.announcement.text,
    type: 'celebrate' as const,
  };

  // B. 賽事活動簡介 (完全尊重後台增刪結果，若刪除至空清單亦如實反映)
  const activities: ActivityItem[] = Array.isArray(activitiesRaw?.items)
    ? activitiesRaw.items.map((act: any, idx: number) => ({
        id: `act-${idx + 1}`,
        title: act.title || '',
        description: act.description || '',
      }))
    : INITIAL_DATA.activities;

  // C. 運動會時程表 (完全尊重後台增刪結果)
  const schedules: ScheduleItem[] = Array.isArray(schedulesRaw?.items)
    ? schedulesRaw.items.map((sch: any, idx: number) => ({
        id: `sch-${idx + 1}`,
        day: '11/6' as const,
        time: sch.time || '08:00',
        title: sch.title || '',
      }))
    : INITIAL_DATA.schedules;

  // D. 檢錄時程表
  const checkinSchedules: CheckinScheduleItem[] = Array.isArray(checkinSchedulesRaw?.items)
    ? checkinSchedulesRaw.items.map((chk: any, idx: number) => ({
        id: `chk-${idx + 1}`,
        title: chk.title || '',
        time: chk.time || '09:00',
        location: chk.location || '司令台後方檢錄處',
      }))
    : (INITIAL_DATA.checkinSchedules || []);

  // E. 榮譽榜 (完全尊重後台增刪結果)
  const honorRoll: HonorItem[] = Array.isArray(honorRollRaw?.items)
    ? honorRollRaw.items.map((h: any, idx: number) => ({
        id: `honor-${idx + 1}`,
        eventName: h.eventName || '',
        content: h.content || '',
      }))
    : INITIAL_DATA.honorRoll;

  // F. 採訪文章 (Folder Collection：以現有檔案為準，刪除檔案即同步消失)
  const interviewList: InterviewItem[] = Object.entries(interviewModules).map(([filePath, mod], idx) => {
    const item = (mod as any).default || mod;
    const fileId = filePath.split('/').pop()?.replace('.json', '') || `iv-${idx + 1}`;
    return {
      id: fileId,
      title: item.title || '',
      content: item.content || '',
      imageUrl: item.imageUrl || undefined,
    };
  });
  const interviews = interviewList;

  // G. 現場快報 (Folder Collection：以現有檔案為準，刪除檔案即同步消失)
  const liveNewsList: LiveNewsItem[] = Object.entries(liveNewsModules).map(([filePath, mod], idx) => {
    const item = (mod as any).default || mod;
    const fileId = filePath.split('/').pop()?.replace('.json', '') || `news-${idx + 1}`;
    return {
      id: fileId,
      title: item.title || '',
      content: item.content || '',
      imageUrl: item.imageUrl || undefined,
    };
  });
  const liveNews = liveNewsList;

  // H. 校慶週活動 (Folder Collection：以現有檔案為準，刪除檔案即同步消失)
  const weekActivityList: WeekActivityItem[] = Object.entries(weekActivityModules).map(([filePath, mod], idx) => {
    const item = (mod as any).default || mod;
    const fileId = filePath.split('/').pop()?.replace('.json', '') || `week-${idx + 1}`;
    return {
      id: fileId,
      title: item.title || '',
      content: item.content || '',
      imageUrl: item.imageUrl || undefined,
      images: Array.isArray(item.images) ? item.images : undefined,
    };
  });
  const weekActivities = weekActivityList;

  // I. 各班攤位一覽 (Folder Collection：以現有檔案為準，刪除檔案即同步消失)
  const boothList: BoothItem[] = Object.entries(boothModules).map(([filePath, mod], idx) => {
    const item = (mod as any).default || mod;
    const fileId = filePath.split('/').pop()?.replace('.json', '') || `booth-${idx + 1}`;
    
    // 支援陣列字串、逗號/頓號分隔字串或舊欄位等多種分類輸入格式
    let rawCats: string[] = [];
    if (Array.isArray(item.categories)) {
      rawCats = item.categories
        .flatMap((c: any) => (typeof c === 'string' ? c.split(/[,、/]/).map((s: string) => s.trim()) : []))
        .filter(Boolean);
    } else if (typeof item.categories === 'string') {
      rawCats = item.categories.split(/[,、/]/).map((s: string) => s.trim()).filter(Boolean);
    } else if (item.category) {
      rawCats = String(item.category).split(/[,、/]/).map((s: string) => s.trim()).filter(Boolean);
    }
    if (rawCats.length === 0) rawCats = ['冷飲'];

    // 排除重複項
    rawCats = Array.from(new Set(rawCats));

    return {
      id: fileId,
      grade: (item.grade === '高二' ? '高二' : '高一') as '高一' | '高二',
      className: String(item.className || '101'),
      categories: rawCats,
      category: rawCats.join('、'),
      flyerUrl: item.flyerUrl || '/src/assets/images/fair_food_flyer_1792325751416.jpg',
    };
  });
  // 按照年級班級排序
  boothList.sort((a, b) => {
    const gradeA = a.grade === '高一' ? 1 : 2;
    const gradeB = b.grade === '高一' ? 1 : 2;
    if (gradeA !== gradeB) return gradeA - gradeB;
    return a.className.localeCompare(b.className, undefined, { numeric: true });
  });
  const booths = boothList;

  // J. 攤位分類清單：嚴格按照 Decap CMS 上所寫（data/boothCategories.json）顯示，不自行增減分類
  const boothCategories: string[] = Array.isArray(boothCategoriesRaw?.items) && boothCategoriesRaw.items.length > 0
    ? boothCategoriesRaw.items.map(String).map(s => s.trim()).filter(Boolean)
    : DEFAULT_BOOTH_CATEGORIES;

  // K. 相簿外部連結
  const officialUrl = albumsRaw?.externalUrl || 'https://photos.app.goo.gl/355qU8yvU33r2n3s8';
  const albums: AlbumLink[] = (INITIAL_DATA.albums || OFFICIAL_ALBUMS).map(album => ({
    ...album,
    externalUrl: officialUrl,
  }));

  return {
    announcement,
    activities,
    schedules,
    checkinSchedules,
    honorRoll,
    interviews,
    liveNews,
    weekActivities,
    booths,
    boothCategories,
    homeCards: DEFAULT_HOME_CARDS,
    heroImage: INITIAL_DATA.heroImage,
    boothMapImage: BOOTH_MAP_IMAGE,
    albums,
  };
}
