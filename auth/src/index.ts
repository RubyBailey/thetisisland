/**
 * GitHub OAuth proxy for Decap CMS, hosted on Cloudflare Workers.
 *
 * Secrets: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (wrangler secret put).
 * The ALLOWED_DOMAINS variable is a comma-separated list of exact CMS hostnames.
 * Keep GitHub OAuth App callback URL set to https://<worker-host>/callback.
 */
interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  ALLOWED_DOMAINS: string;
}

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const STATE_COOKIE = 'thetisisland_oauth_state';
const COOKIE_AGE = 300; // five minutes

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'GET') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET', 'Cache-Control': 'no-store' },
      });
    }

    if (url.pathname === '/auth') return beginAuth(url, env);
    if (url.pathname === '/callback') return finishAuth(request, url, env);
    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

function permittedOrigins(env: Env): Set<string> {
  const result = new Set<string>();
  for (const raw of (env.ALLOWED_DOMAINS || '').split(',')) {
    const value = raw.trim().toLowerCase();
    if (!value) continue;
    // Hostnames only, not full URLs. Wildcards are deliberately unsupported.
    if (!/^[a-z0-9.-]+$/.test(value) || value.includes('..')) continue;
    result.add(`https://${value}`);
  }
  return result;
}

function cmsOrigin(siteId: string | null, env: Env): string | null {
  if (!siteId) return null;
  const hostname = siteId.toLowerCase().trim();
  if (!/^[a-z0-9.-]+$/.test(hostname) || hostname.includes('..')) return null;
  const origin = `https://${hostname}`;
  return permittedOrigins(env).has(origin) ? origin : null;
}

function cookieHeader(value: string, maxAge: number): string {
  return `${STATE_COOKIE}=${value}; Path=/callback; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;
}

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie') || '';
  for (const item of header.split(';')) {
    const [key, ...value] = item.trim().split('=');
    if (key === name) return value.join('=');
  }
  return null;
}

function beginAuth(url: URL, env: Env): Response {
  const origin = cmsOrigin(url.searchParams.get('site_id'), env);
  if (!origin) return new Response('CMS hostname not permitted', { status: 403 });
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response('OAuth not configured', { status: 503 });
  }

  const nonce = crypto.randomUUID() + '-' + crypto.randomUUID();
  // Cookie is HttpOnly, Secure, and host-only. The nonce is also passed as OAuth state.
  const value = `${nonce}.${encodeURIComponent(origin)}`;
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    // Fixed by the server. Do not accept caller-provided scope.
    scope: 'repo,user',
    redirect_uri: `${url.origin}/callback`,
    state: nonce,
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${GITHUB_AUTH_URL}?${params.toString()}`,
      'Set-Cookie': cookieHeader(value, COOKIE_AGE),
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

async function finishAuth(request: Request, url: URL, env: Env): Promise<Response> {
  const cookie = getCookie(request, STATE_COOKIE);
  const separator = cookie?.indexOf('.') ?? -1;
  const nonce = separator > 0 ? cookie!.slice(0, separator) : '';
  let origin = '';
  try {
    origin = separator > 0 ? decodeURIComponent(cookie!.slice(separator + 1)) : '';
  } catch {
    // Invalid stored cookie.
  }
  const suppliedState = url.searchParams.get('state');
  if (!nonce || !suppliedState || nonce !== suppliedState || !permittedOrigins(env).has(origin)) {
    return new Response('Invalid or expired OAuth state. Close this window and retry login.', {
      status: 403,
      headers: { 'Set-Cookie': cookieHeader('', 0), 'Cache-Control': 'no-store' },
    });
  }

  const githubError = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  let authContent: string;
  if (githubError) {
    authContent = `authorization:github:error:${JSON.stringify({ error: githubError })}`;
  } else if (!code) {
    authContent = 'authorization:github:error:{"error":"missing_code"}';
  } else {
    try {
      const response = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${url.origin}/callback`,
        }),
      });
      const data = (await response.json()) as {
        access_token?: string;
        error?: string;
      };
      if (!response.ok || !data.access_token || data.error) {
        authContent = `authorization:github:error:${JSON.stringify({ error: data.error || 'token_exchange_failed' })}`;
      } else {
        authContent = `authorization:github:success:${JSON.stringify({ token: data.access_token, provider: 'github' })}`;
      }
    } catch {
      authContent = 'authorization:github:error:{"error":"token_exchange_failed"}';
    }
  }

  // JSON embedded in a script must not be allowed to terminate the script tag.
  const safeContent = JSON.stringify(authContent).replace(/</g, '\\u003c');
  const safeOrigin = JSON.stringify(origin).replace(/</g, '\\u003c');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>GitHub authorization</title></head>
<body><p id="status">Completing GitHub authorization...</p>
<script>
(function () {
  var targetOrigin = ${safeOrigin};
  var authContent = ${safeContent};
  var status = document.getElementById('status');
  if (!window.opener) {
    status.textContent = 'The CMS login window is unavailable. Close this tab and retry.';
    return;
  }
  function handleMessage(event) {
    if (event.source !== window.opener || event.origin !== targetOrigin) return;
    if (event.data !== 'authorizing:github') return;
    window.removeEventListener('message', handleMessage);
    window.opener.postMessage(authContent, targetOrigin);
    status.textContent = 'Authentication complete. You may close this window.';
    setTimeout(function () { window.close(); }, 250);
  }
  window.addEventListener('message', handleMessage);
  window.opener.postMessage('authorizing:github', targetOrigin);
})();
</script></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': cookieHeader('', 0),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
    },
  });
}
