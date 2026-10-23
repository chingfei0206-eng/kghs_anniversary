/**
 * Cloudflare Pages Function: /api/auth
 * 管理員驗證與 Session Token 簽發／驗證服務 (100% 免費邊緣運算，無外部依賴)
 */
import { createSessionToken, verifySessionToken } from './_token';

interface Env {
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

// POST /api/auth - 驗證密碼並換取 Session Token
export const onRequestPost = async (context: EventContext): Promise<Response> => {
  try {
    const body = await context.request.json() as { password?: string };
    const inputPassword = body?.password?.trim() || '';

    const expectedPassword = getExpectedPassword(context.env);

    if (!inputPassword || inputPassword !== expectedPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_PASSWORD',
          message: '管理員驗證密碼不正確'
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
    const secret = getSecret(context.env);
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

    const secret = getSecret(context.env);
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
