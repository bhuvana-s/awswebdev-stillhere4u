import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getWaitlistStats } from './api.js';

// Light palette — matches the waitlist landing page
const ink = '#0F172A';
const muted = '#64748B';
const teal = '#0F766E';
const amber = '#B45309';
const surface = '#FFFFFF';
const border = 'rgba(15,23,42,0.10)';
const subtle = 'rgba(15,23,42,0.04)';

const ROLES = ['Parent', 'Child abroad', 'Caregiver', 'Insurance', 'Employer', 'Just curious'];
const ROLE_COLORS = {
  Parent: '#0F766E',         // teal-700
  'Child abroad': '#B45309', // amber-700
  Caregiver: '#7C3AED',      // violet-600
  Insurance: '#DC2626',      // red-600
  Employer: '#2563EB',       // blue-600
  'Just curious': '#059669', // emerald-600
};

const TOKEN_KEY = 'stillhere.adminToken';

function buildSevenDayBuckets(signups) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = { date: key, label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) };
    for (const r of ROLES) row[r] = 0;
    days.push(row);
  }
  const byKey = Object.fromEntries(days.map((d) => [d.date, d]));
  for (const s of signups) {
    const k = (s.timestamp || '').slice(0, 10);
    if (byKey[k] && ROLES.includes(s.role)) byKey[k][s.role] += 1;
  }
  return days;
}

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(signups) {
  const header = ['email', 'role', 'timestamp', 'source'];
  const rows = signups.map((s) => header.map((h) => csvEscape(s[h])).join(','));
  const body = [header.join(','), ...rows].join('\n');
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stillhere-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const card = {
  background: surface,
  border: `1px solid ${border}`,
  borderRadius: 12,
  padding: '18px 20px',
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
};

export default function StatsPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [pending, setPending] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    getWaitlistStats(token)
      .then((data) => setStats(data))
      .catch((err) => {
        if (err.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken('');
          setError('That token was rejected.');
        } else {
          setError(err.message || 'Failed to load stats.');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const chartData = useMemo(() => buildSevenDayBuckets(stats?.signups || []), [stats]);

  function handleLogin(e) {
    e.preventDefault();
    if (!pending) return;
    sessionStorage.setItem(TOKEN_KEY, pending);
    setToken(pending);
    setPending('');
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setStats(null);
  }

  const wrapStyle = {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: `radial-gradient(1200px 600px at 50% -10%, #ECFDF5 0%, #FAFAFA 55%, #FFFFFF 100%)`,
    minHeight: '100vh',
    color: ink,
    padding: '2rem 1.5rem',
  };

  if (!token) {
    return (
      <div style={{ ...wrapStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 360, ...card }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', color: ink, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            StillHere <span style={{ fontSize: '1.1rem' }}>💌</span> · Admin
          </div>
          <p style={{ color: muted, fontSize: 13, marginTop: 0, marginBottom: 18 }}>
            Enter the admin token to view waitlist stats.
          </p>
          <input
            type="password"
            value={pending}
            onChange={(e) => setPending(e.target.value)}
            placeholder="admin token"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: `1.5px solid ${border}`,
              background: surface,
              color: ink,
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
              marginBottom: 12,
            }}
          />
          <button
            type="submit"
            disabled={!pending}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              border: 'none',
              background: pending ? teal : subtle,
              color: pending ? '#fff' : muted,
              fontWeight: 700,
              fontSize: 14,
              cursor: pending ? 'pointer' : 'default',
              boxShadow: pending ? '0 4px 14px rgba(15,118,110,0.22)' : 'none',
            }}
          >
            Sign in
          </button>
          {error && (
            <p style={{ color: amber, fontSize: 12, marginTop: 12, marginBottom: 0 }}>{error}</p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', color: ink, display: 'flex', alignItems: 'center', gap: 8 }}>
              StillHere <span style={{ fontSize: '1.1rem' }}>💌</span> · Admin
            </div>
            <div style={{ color: muted, fontSize: 13 }}>Waitlist stats</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => stats && downloadCsv(stats.signups)}
              disabled={!stats || stats.signups.length === 0}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: `1px solid ${teal}`,
                background: 'transparent',
                color: teal,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                cursor: stats && stats.signups.length ? 'pointer' : 'default',
                opacity: stats && stats.signups.length ? 1 : 0.4,
              }}
            >
              Export CSV
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: 'transparent',
                color: muted,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        {loading && <p style={{ color: muted }}>Loading…</p>}
        {error && <p style={{ color: amber }}>{error}</p>}

        {stats && (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
              <div style={{ ...card, textAlign: 'center' }}>
                <div style={{ color: muted, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Total
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: teal, lineHeight: 1.1, marginTop: 6 }}>
                  {stats.total}
                </div>
              </div>
              {ROLES.map((r) => (
                <div key={r} style={{ ...card, textAlign: 'center' }}>
                  <div style={{ color: muted, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', color: ROLE_COLORS[r], lineHeight: 1.1, marginTop: 4 }}>
                    {stats.totals[r] || 0}
                  </div>
                </div>
              ))}
            </section>

            <section style={{ ...card, marginBottom: 24 }}>
              <div style={{ color: muted, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                Last 7 days · stacked by category
              </div>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
                    <XAxis dataKey="label" stroke={muted} fontSize={11} tickLine={false} axisLine={{ stroke: border }} />
                    <YAxis stroke={muted} fontSize={11} allowDecimals={false} tickLine={false} axisLine={{ stroke: border }} />
                    <Tooltip
                      cursor={{ fill: subtle }}
                      contentStyle={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
                      labelStyle={{ color: ink }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: muted }} />
                    {ROLES.map((r) => (
                      <Bar key={r} dataKey={r} stackId="a" fill={ROLE_COLORS[r]} radius={[0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
