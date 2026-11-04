/**
 * 圖片網址標準化處理工具
 * 自動將 Google Drive 分享連結或 Dropbox 連結轉換為可以直接在網頁 <img> 標籤中載入的高清直連網址
 */
import { getGoogleDriveFileId, isPdfFlyer } from './boothUtils';

export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // 若為 Base64 Data URL 或一般本地路徑，直接返回
  if (trimmed.startsWith('data:') || trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return trimmed;
  }

  // 若已判定為 PDF 連結，不轉換為 lh3 圖片網址，保留原始或分享網址
  if (isPdfFlyer(trimmed)) {
    return trimmed;
  }

  // 1. Google Drive 分享連結轉換為圖片直連
  const driveId = getGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  // 2. Dropbox 連結轉換 (?dl=0 -> ?raw=1)
  if (trimmed.includes('dropbox.com') && trimmed.includes('dl=0')) {
    return trimmed.replace('dl=0', 'raw=1');
  }

  return trimmed;
}

/**
 * 取得校慶週活動的照片陣列（相容單張與多張照片、字串陣列或物件陣列，保持原有比例）
 */
export function getWeekActivityImages(activity: { imageUrl?: string; images?: any } | undefined | null): string[] {
  if (!activity) return [];
  const result: string[] = [];

  if (Array.isArray(activity.images)) {
    for (const item of activity.images) {
      if (typeof item === 'string' && item.trim()) {
        const val = item.trim();
        if (!result.includes(val)) result.push(val);
      } else if (item && typeof item === 'object') {
        const val = (item as any).image || (item as any).url || (item as any).src;
        if (typeof val === 'string' && val.trim()) {
          const trimmed = val.trim();
          if (!result.includes(trimmed)) result.push(trimmed);
        }
      }
    }
  }

  // 若有單張 imageUrl 且不在列表中，也加入
  if (activity.imageUrl && typeof activity.imageUrl === 'string' && activity.imageUrl.trim()) {
    const trimmed = activity.imageUrl.trim();
    if (!result.includes(trimmed)) {
      result.unshift(trimmed);
    }
  }

  return result;
}

export * from './boothUtils';
