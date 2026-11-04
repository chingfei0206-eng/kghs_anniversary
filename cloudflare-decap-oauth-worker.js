/**
 * Cloudflare Worker: Decap CMS GitHub OAuth 驗證代理服務
 * (相容 decap-cms-backend-cloudflare 協議規範)
 *
 * 【部署環境與變數說明】
 * 請在 Cloudflare Workers 後台的 Settings -> Variables 中新增以下兩組安全變數 (Secrets)：
 * 1. GITHUB_CLIENT_ID: 於 GitHub 建立的 OAuth App Client ID
 * 2. GITHUB_CLIENT_SECRET: 於 GitHub 產生的 OAuth App Client Secret
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 處理 CORS 預檢請求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 1. 授權請求入口 (GET /auth 或 GET /)
    // 當使用者在 /admin/ 點選 "Login with GitHub" 時，Decap CMS 會彈窗訪問此端點
    if (url.pathname === '/auth' || url.pathname === '/') {
      const scope = url.searchParams.get('scope') || 'repo';
      const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
      githubAuthUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      githubAuthUrl.searchParams.set('scope', scope);
      // 自動將回調網址導向當前 Worker 的 /callback 端點
      githubAuthUrl.searchParams.set('redirect_uri', `${url.origin}/callback`);

      return Response.redirect(githubAuthUrl.toString(), 302);
    }

    // 2. GitHub 授權回調端點 (GET /callback?code=...)
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('錯誤：GitHub 未回傳授權 code 參數。', { status: 400 });
      }

      // 向 GitHub API 交換 access_token (以伺服器端環境變數帶入 client_secret，確保密鑰不外洩)
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Decap-CMS-Cloudflare-OAuth-Worker',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return new Response(
          `GitHub OAuth 交換失敗: ${tokenData.error_description || tokenData.error}`,
          { status: 400 }
        );
      }

      const token = tokenData.access_token;
      const provider = 'github';

      // 3. 回傳包含 postMessage 的通訊 HTML
      // 透過 window.opener.postMessage 將 GitHub Token 安全注入給 Decap CMS 管理視窗
      const htmlContent = `
        <!doctype html>
        <html lang="zh-TW">
          <head>
            <meta charset="utf-8" />
            <title>授權成功 | Decap CMS</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background-color: #fbf9f2;
                color: #342d27;
              }
              .box {
                text-align: center;
                padding: 30px;
                border-radius: 12px;
                background: white;
                box-shadow: 0 4px 15px rgba(0,0,0,0.08);
              }
            </style>
          </head>
          <body>
            <div class="box">
              <h3 style="color: #127c71;">🎉 GitHub 授權驗證成功！</h3>
              <p>正在自動連結雄女校慶管理後台，本視窗將自動關閉...</p>
            </div>
            <script>
              (function() {
                function receiveMessage(e) {
                  window.opener.postMessage(
                    'authorization:${provider}:success:{"token":"${token}","provider":"${provider}"}',
                    e.origin
                  );
                }
                window.addEventListener("message", receiveMessage, false);
                // 提示母視窗已進入授權流程
                window.opener.postMessage("authorizing:${provider}", "*");
              })();
            </script>
          </body>
        </html>
      `;

      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
