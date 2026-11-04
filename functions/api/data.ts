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

const getSecret = async (env: Env): Promise<string> => {
  let kvSecret = '';
  if (env.CELEBRATION_KV) {
    try {
      kvSecret = (await env.CELEBRATION_KV.get('JWT_SECRET')) || (await env.CELEBRATION_KV.get('ADMIN_PASSWORD')) || (await env.CELEBRATION_KV.get('admin_password')) || '';
    } catch {}
  }
  return env.JWT_SECRET || kvSecret || env.ADMIN_PASSWORD || 'kghs_102nd_celebration_secure_secret_key';
};

const isPasswordAuthorized = async (input: string, env: Env): Promise<boolean> => {
  const trimmed = (input || '').trim();
  if (!trimmed) return false;

  // 1. 優先從 Workers KV (CELEBRATION_KV) 讀取
  if (env.CELEBRATION_KV) {
    try {
      const [kvPass1, kvPass2] = await Promise.all([
        env.CELEBRATION_KV.get('ADMIN_PASSWORD'),
        env.CELEBRATION_KV.get('admin_password')
      ]);
      const kvPassword = (kvPass1 || kvPass2 || '').trim();
      if (kvPassword && (trimmed === kvPassword || trimmed === kvPassword.replace(/^["']|["']$/g, ''))) {
        return true;
      }
    } catch {}
  }

  // 2. 支援環境變數 ADMIN_PASSWORD
  const envPassword = (env.ADMIN_PASSWORD || '').trim();
  if (envPassword && (trimmed === envPassword || trimmed === envPassword.replace(/^["']|["']$/g, ''))) {
    return true;
  }

  // 預設 123 嚴格禁止
  return false;
};

// 當未綁定 Cloudflare KV 時的邊緣記憶體快取備援，保證多裝置在未設定 KV 時仍能正常同步
let inMemoryData: any = null;
let inMemoryUpdatedAt: number = 0;

// GET /api/data - 網站已遷移至 Decap CMS (Git-based CMS)，不再從舊版 KV 讀取過期快照
export const onRequestGet = async (_context: EventContext): Promise<Response> => {
  return new Response(
    JSON.stringify({
      success: true,
      data: null,
      updatedAt: 0,
      message: '校慶官方網站已全面升級為 Decap CMS (Git-based CMS)，資料來源為 GitHub 儲存庫。'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    }
  );
};

// POST /api/data - 管理員更新校慶資料 (需權限驗證)
export const onRequestPost = async (context: EventContext): Promise<Response> => {
  try {
    const kv = context.env.CELEBRATION_KV;

    // 1. 優先使用 Session Token 進行權限驗證
    const authHeader = context.request.headers.get('Authorization');
    const sessionTokenHeader = context.request.headers.get('X-Session-Token');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim() || sessionTokenHeader?.trim();

    const secretsToTry = [
      context.env.JWT_SECRET,
      context.env.ADMIN_PASSWORD
    ].filter(Boolean) as string[];

    if (context.env.CELEBRATION_KV) {
      try {
        const [kvPw1, kvPw2] = await Promise.all([
          context.env.CELEBRATION_KV.get('JWT_SECRET'),
          context.env.CELEBRATION_KV.get('ADMIN_PASSWORD'),
          context.env.CELEBRATION_KV.get('admin_password')
        ]);
        if (kvPw1) secretsToTry.push(kvPw1);
        if (kvPw2) secretsToTry.push(kvPw2);
      } catch {}
    }

    let isAuthorized = false;

    if (token) {
      for (const s of Array.from(new Set(secretsToTry))) {
        const verifyRes = await verifySessionToken(token, s);
        if (verifyRes.valid) {
          isAuthorized = true;
          break;
        }
      }
    }

    // 2. 向後相容直接密碼標頭 (若使用者未換取 Session Token 舊版呼叫，或密碼直接授權)
    if (!isAuthorized) {
      const rawPasswordHeader = context.request.headers.get('X-Admin-Password');
      if (rawPasswordHeader && (await isPasswordAuthorized(rawPasswordHeader, context.env))) {
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
    if (kv) {
      // 寫入 Cloudflare KV
      await Promise.all([
        kv.put('celebration_data', JSON.stringify(body)),
        kv.put('celebration_updated_at', now)
      ]);
    } else {
      // 寫入邊緣記憶體備援
      inMemoryData = body;
      inMemoryUpdatedAt = Number(now);
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatedAt: Number(now),
        storage: kv ? 'kv' : 'memory-fallback',
        message: kv
          ? '資料已成功寫入 Cloudflare KV，所有使用者將自動靜默同步！'
          : '資料已成功同步更新！(提示：於 Cloudflare 綁定 CELEBRATION_KV 可提供永久持久化儲存)'
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
