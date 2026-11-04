/**
 * Cloudflare Pages Function: /api/auth
 * 管理員驗證與 Session Token 簽發／驗證服務 (100% 免費邊緣運算，無外部依賴)
 */
import { createSessionToken, verifySessionToken } from './_token';

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

export const isPasswordAuthorized = async (input: string, env: Env): Promise<boolean> => {
  const trimmed = (input || '').trim();
  if (!trimmed) return false;

  // 1. 優先從 Workers KV 讀取設定的密碼
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
    } catch (e) {
      console.warn('Failed to read password from Workers KV:', e);
    }
  }

  // 2. 支援環境變數 ADMIN_PASSWORD (若在 Workers 設定中配置)
  const envPassword = (env.ADMIN_PASSWORD || '').trim();
  if (envPassword && (trimmed === envPassword || trimmed === envPassword.replace(/^["']|["']$/g, ''))) {
    return true;
  }

  // 預設 123 嚴格禁止，未設定 KV 密碼或密碼不符一律拒絕登入
  return false;
};

// POST /api/auth - 驗證密碼並換取 Session Token
export const onRequestPost = async (context: EventContext): Promise<Response> => {
  try {
    const body = await context.request.json() as { password?: string };
    const inputPassword = body?.password?.trim() || '';

    const authorized = await isPasswordAuthorized(inputPassword, context.env);
    if (!authorized) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_PASSWORD',
          message: '管理員驗證密碼不正確 (密碼需與 Workers KV 設定完全相符，預設 123 已無效)'
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

    // 密碼驗證成功，簽發 24 小時有效 Session Token
    const secret = await getSecret(context.env);
    const { token, expiresAt } = await createSessionToken(secret, 24);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        expiresAt,
        message: '驗證成功，已簽發 Session Token'
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
      JSON.stringify({ success: false, error: err?.message || 'Auth Request Error' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
};

// GET /api/auth - 驗證目前的 Session Token 是否有效
export const onRequestGet = async (context: EventContext): Promise<Response> => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    const tokenHeader = context.request.headers.get('X-Session-Token');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim() || tokenHeader?.trim() || '';

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, valid: false, error: 'NO_TOKEN' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const secret = await getSecret(context.env);
    const result = await verifySessionToken(token, secret);

    if (!result.valid) {
      return new Response(
        JSON.stringify({ success: false, valid: false, error: result.error }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        role: result.payload?.role,
        expiresAt: result.payload?.exp
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
      JSON.stringify({ success: false, valid: false, error: err?.message }),
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

// OPTIONS /api/auth - CORS 預檢
export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token'
    }
  });
};
