/**
 * 高雄女中 102 週年校慶 - 各專區官方手繪吉祥物封面照對照表
 * 
 * 路徑寫死至靜態資產目錄，確保於 Cloudflare Pages 與本機預覽環境均能穩定即時呈現
 */

export const SECTION_COVERS = {
  // 1. 賽事活動簡介 (黑板 EVENT INTRO 與蝴蝶結斑馬)
  activities: '/assets/covers/cover_activities.jpg',

  // 2. 運動會賽程表 / 檢錄 (頭戴藍色運動頭巾、手持接力棒奔馳的斑馬)
  schedule: '/assets/covers/cover_schedule.jpg',

  // 3. 校慶榮譽榜 (胸前懸掛金牌第一名與榮譽之星的斑馬)
  honor: '/assets/covers/cover_honor.png',

  // 4. 現場快報 (手持大聲公擴音器、閃電即時速報的斑馬)
  liveNews: '/assets/covers/cover_livenews.png',

  // 5. 校慶週活動 (高雄女中第 41 屆學生會 41 KGSU 原創視覺徽章)
  weekActivities: '/assets/covers/cover_weekactivities.jpg',

  // 6. 校慶專題採訪 (手持麥克風報導專訪 INTERVIEW 的斑馬)
  interviews: '/assets/covers/cover_interviews.jpg',

  // 7. 校慶相簿專區 (手持相機與底片珍藏青春回憶的斑馬)
  albums: '/assets/covers/cover_albums.jpg',

  // 8. 各班攤位一覽 / 園遊會 (園遊會遮陽帳棚、冰涼特調與 HAVE FUN! 的斑馬)
  booths: '/assets/covers/cover_booths.jpg'
} as const;

export type SectionCoverKey = keyof typeof SECTION_COVERS;
