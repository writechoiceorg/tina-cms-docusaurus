
export default function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/admin')) {
      const accept = request.headers.get('accept') || '';
      if (!accept.includes('text/html')) {
        return;
      }
    
    const basicAuth = request.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const decoded = typeof atob === 'function'
        ? atob(authValue)
        : Buffer.from(authValue, 'base64').toString('utf8');
      const [user, pwd] = decoded.split(':');

      if (user === 'admin' && pwd === 'password123') {
        return;
      }
    }

    return new Response('Auth Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};