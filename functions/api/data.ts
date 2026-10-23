/**
 * Cloudflare Pages Function: /api/data
 * 負責全站校慶資料在 Cloudflare KV 中的存取與即時更新
 * 支援 Session Token 權限控管 (基於標準 Web Crypto HMAC-SHA256)
 */
import { verifySessionToken } from './_token';

interface Env {
  CELEBRATION_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string) => Promise<void>;
  };
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
}

interface EventContext {
  request: Request;
  env: Env;
}

const getSecret = (env: Env): string => {
  return env.JWT_SECRET || env.ADMIN_PASSWORD || '123';
};

const getExpectedPassword = (env: Env): string => {
  return env.ADMIN_PASSWORD || '123';
};

// GET /api/data - 取得最新校慶資料 (公開讀取，搭配邊緣快取，100% 免費不耗額度)
export const onRequestGet = async (context: EventContext): Promise<Response> => {
  try {
    const kv = context.env.CELEBRATION_KV;
    if (!kv) {
      // 若尚未綁定 KV，回傳空資料讓前端使用內建預設值
      return new Response(
        JSON.stringify({
          success: false,
          error: 'KV_NOT_BOUND',
          message: 'Cloudflare KV 尚未綁定至 CELEBRATION_KV，目前使用本機快取與預設資料'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const [dataJson, updatedAt] = await Promise.all([
      kv.get('celebration_data'),
      kv.get('celebration_updated_at')
    ]);

    if (!dataJson) {
      return new Response(
        JSON.stringify({ success: true, data: null, updatedAt: 0 }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const parsed = JSON.parse(dataJson);
    return new Response(
      JSON.stringify({
        success: true,
        data: parsed,
        updatedAt: Number(updatedAt) || Date.now()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          // 邊緣短暫快取 10 秒，容許背景更新 30 秒，極速且省 quota
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=30'
        }
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
};

// POST /api/data - 管理員更新校慶資料 (需 Session Token 權限驗證)
export const onRequestPost = async (context: EventContext): Promise<Response> => {
  try {
    const kv = context.env.CELEBRATION_KV;
    if (!kv) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'KV_NOT_BOUND',
          message: '尚未在 Cloudflare Pages 後台綁定 CELEBRATION_KV (若未綁定，資料仍保存在本機快取中)'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // 1. 優先使用 Session Token 進行權限驗證
    const authHeader = context.request.headers.get('Authorization');
    const sessionTokenHeader = context.request.headers.get('X-Session-Token');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim() || sessionTokenHeader?.trim();

    let isAuthorized = false;
    const secret = getSecret(context.env);

    if (token) {
      const verifyRes = await verifySessionToken(token, secret);
      if (verifyRes.valid) {
        isAuthorized = true;
      }
    }

    // 2. 向後相容直接密碼標頭 (若使用者未換取 Session Token 舊版呼叫)
    if (!isAuthorized) {
      const rawPasswordHeader = context.request.headers.get('X-Admin-Password');
      const expectedPassword = getExpectedPassword(context.env);
      if (rawPasswordHeader && rawPasswordHeader === expectedPassword) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Session Token 驗證失敗或已過期，請重新登入管理員帳號。'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const body = await context.request.json();
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_DATA', message: '資料格式無效' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    const now = Date.now().toString();
    // 寫入完整資料與更新時間戳記
    await Promise.all([
      kv.put('celebration_data', JSON.stringify(body)),
      kv.put('celebration_updated_at', now)
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        updatedAt: Number(now),
        message: '資料已成功寫入 Cloudflare KV，所有使用者將自動靜默同步！'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Write Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
};

// OPTIONS /api/data - CORS 預檢
export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token, X-Admin-Password'
    }
  });
};
