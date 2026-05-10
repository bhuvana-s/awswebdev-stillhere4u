const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function url(path) {
  if (!BASE) throw new Error('VITE_API_URL is not configured');
  return `${BASE}${path}`;
}

export async function getWaitlistCount() {
  const r = await fetch(url('/api/waitlist/count'), {
    headers: { Accept: 'application/json' },
  });
  if (!r.ok) throw new Error(`count request failed: ${r.status}`);
  return r.json();
}

export async function joinWaitlist({ email, role, source = 'landing-page' }) {
  const r = await fetch(url('/api/waitlist'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role, source }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `submit failed: ${r.status}`);
  return data;
}

export async function getWaitlistStats(token) {
  const r = await fetch(url('/api/waitlist/stats'), {
    headers: { Accept: 'application/json', 'x-admin-token': token },
  });
  if (r.status === 401) {
    const err = new Error('unauthorized');
    err.status = 401;
    throw err;
  }
  if (!r.ok) throw new Error(`stats request failed: ${r.status}`);
  return r.json();
}
