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

const teal = '#4ECDC4';
const amber = '#E8A849';
const navy = '#1B2838';
const gray = '#8A9BB0';

const ROLES = ['Parent', 'Child abroad', 'Caregiver', 'Insurance', 'Employer', 'Just curious'];
const ROLE_COLORS = {
  Parent: '#4ECDC4',
  'Child abroad': '#E8A849',
  Caregiver: '#A78BFA',
  Insurance: '#F87171',
  Employer: '#60A5FA',
  'Just curious': '#34D399',
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
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '18px 20px',
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
    background: `linear-gradient(170deg, #141E2B 0%, ${navy} 40%, #1F3044 100%)`,
    minHeight: '100vh',
    color: '#fff',
    padding: '2rem 1.5rem',
  };

  if (!token) {
    return (
      <div style={{ ...wrapStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 360, ...card }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', color: teal, marginBottom: 6 }}>
            StillHere · Admin
          </div>
          <p style={{ color: gray, fontSize: 13, marginTop: 0, marginBottom: 18 }}>
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
              border: '1.5px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
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
              background: pending ? teal : 'rgba(255,255,255,0.08)',
              color: pending ? navy : gray,
              fontWeight: 700,
              fontSize: 14,
              cursor: pending ? 'pointer' : 'default',
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
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', color: teal }}>
              StillHere · Admin
            </div>
            <div style={{ color: gray, fontSize: 13 }}>Waitlist stats</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => stats && downloadCsv(stats.signups)}
              disabled={!stats || stats.signups.length === 0}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid rgba(78,205,196,0.4)',
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
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: gray,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        {loading && <p style={{ color: gray }}>Loading…</p>}
        {error && <p style={{ color: amber }}>{error}</p>}

        {stats && (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
              <div style={{ ...card, gridColumn: 'span 2', minHeight: 110 }}>
                <div style={{ color: gray, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Total signups
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.6rem', color: teal, lineHeight: 1.1, marginTop: 6 }}>
                  {stats.total}
                </div>
              </div>
              {ROLES.map((r) => (
                <div key={r} style={card}>
                  <div style={{ color: gray, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', color: ROLE_COLORS[r], lineHeight: 1.1, marginTop: 4 }}>
                    {stats.totals[r] || 0}
                  </div>
                </div>
              ))}
            </section>

            <section style={{ ...card, marginBottom: 24 }}>
              <div style={{ color: gray, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                Last 7 days · stacked by category
              </div>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="label" stroke={gray} fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <YAxis stroke={gray} fontSize={11} allowDecimals={false} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{ background: '#1F3044', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {ROLES.map((r) => (
                      <Bar key={r} dataKey={r} stackId="a" fill={ROLE_COLORS[r]} radius={[0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ color: gray, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  All signups ({stats.signups.length})
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: gray, textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>Email</th>
                      <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>Role</th>
                      <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>When</th>
                      <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.signups.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '18px 10px', color: gray, textAlign: 'center' }}>
                          No signups yet.
                        </td>
                      </tr>
                    )}
                    {stats.signups.map((s) => (
                      <tr key={s.email}>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{s.email}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: ROLE_COLORS[s.role] || gray }}>{s.role}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: gray }}>
                          {s.timestamp ? new Date(s.timestamp).toLocaleString() : ''}
                        </td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: gray }}>{s.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
