
export default async function middleware(request) {
  const url = new URL(request.url);
  // normalize pathname: remove trailing slashes (keep root as '/')
  let pathname = url.pathname.replace(/\/+$/g, '');
  if (pathname === '') pathname = '/';

  // allow static asset requests to pass (images, js, css, vite client, etc.)
  // Rely on pathname patterns rather than Accept header (some requests omit it)
  const assetExtRe = /\.(?:js|css|png|jpg|jpeg|svg|json|ico|map|woff2?|txt|xml)$/i;
  const isAsset = assetExtRe.test(pathname) || pathname.startsWith('/_next/') || pathname.startsWith('/static/') || pathname.startsWith('/assets/');
  if (isAsset) return;

  // RBAC rules: map path prefixes to required role
  const ROLE_MAP = [
    { prefix: '/docs/beta', role: 'beta' },
    { prefix: '/docs/enterprise', role: 'enterprise' },
    { prefix: '/admin', role: 'admin' },
  ];

  function requiredRoleFor(path) {
    for (const r of ROLE_MAP) {
      // match exact prefix or any subpath under it
      if (path === r.prefix || path.startsWith(r.prefix)) return r.role;
    }
    return null; // public
  }

  const requiredRole = requiredRoleFor(pathname);
  if (!requiredRole) {
    // public route
    return;
  }

  // simple in-memory users (example). Replace with your auth backend.
  const USERS = {
    admin: { password: 'password123', roles: ['admin', 'beta', 'enterprise'] },
    betatester: { password: 'bt123', roles: ['beta'] },
    enterpriseuser: { password: 'ent123', roles: ['enterprise'] },
  };

  // Accept Bearer JWT. Validate token via local auth server for demo.
  // Accept token from Authorization header or cookie `demo_jwt`
  const authHeader = request.headers.get('authorization') || '';
  let token = null;
  if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
  // parse cookies
  if (!token) {
    const cookie = request.headers.get('cookie') || '';
    const m = cookie.match(/(?:^|;)\s*demo_jwt=([^;]+)/);
    if (m) token = decodeURIComponent(m[1]);
  }

  if (!token) {
    // redirect to demo login page
    const loginUrl = `http://localhost:4002/login?next=${encodeURIComponent(request.url)}`;
    return Response.redirect(loginUrl, 302);
  }
  try {
    const verifyRes = await fetch('http://127.0.0.1:4002/api/verify', { headers: { authorization: 'Bearer ' + token } });
    if (!verifyRes.ok) return Response.redirect(`http://localhost:4002/login?next=${encodeURIComponent(request.url)}`, 302);
    const payload = await verifyRes.json();
    const roles = payload.user.roles || [];
    // if (!roles.includes(requiredRole)) {
    //   return new Response('Forbidden', { status: 403 });
    // }
    // New Forbidden Page
    if (!roles.includes(requiredRole)) {
      // Redirect to the branded "Forbidden" page
      // instead of showing raw text.
      const url = new URL(request.url);
      url.pathname = "/forbidden";
      return Response.redirect(url, 302);
    }
    return; // allow
  } catch (e) {
    return new Response('Auth verification failed', { status: 500 });
  }
}

export const config = {
  // run middleware for all routes (assets are skipped above)
  matcher: ['/:path*'],
};