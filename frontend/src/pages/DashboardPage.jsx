import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationDropdown from '../components/NotificationDropdown';
import { getDashboardStats } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const healthyPct = stats?.healthyCoralPct ?? 0;
  const bleachedPct = stats?.bleachedCoralPct ?? 0;
  const deadPct = stats?.deadCoralPct ?? 0;
  const algaePct = stats?.algaePct ?? 0;
  const sandPct = Math.max(0, 100 - (healthyPct + bleachedPct + deadPct + algaePct));

  // Calculate SVG stroke dash offsets for the donut chart
  const circ = 439.8;
  const healthyDash = (healthyPct / 100) * circ;
  const bleachedDash = (bleachedPct / 100) * circ;
  const deadDash = (deadPct / 100) * circ;
  const algaeDash = (algaePct / 100) * circ;
  const sandDash = (sandPct / 100) * circ;

  let offset = 0;
  const healthyOffset = offset;
  offset -= healthyDash;
  const bleachedOffset = offset;
  offset -= bleachedDash;
  const deadOffset = offset;
  offset -= deadDash;
  const algaeOffset = offset;
  offset -= algaeDash;
  const sandOffset = offset;

  // Most recent history item
  const recent = stats?.history?.[0];
  const riskLevel = stats?.riskLevel ?? 'N/A';
  const healthScore = Math.round(healthyPct + (sandPct * 0.5)); // Simple heuristic

  return (
    <div className="layout" style={{ display: 'grid', gridTemplateColumns: '232px 1fr', minHeight: '100vh' }}>
      <Sidebar />
      
      <main className="main" style={{ padding: '26px 30px 40px', overflowX: 'hidden', background: 'var(--bg-deep)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginBottom: 26, paddingRight: 90 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 11, padding: '10px 16px', width: 260, color: 'var(--text-faint)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <input type="text" placeholder="Search anything..." style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13.5, width: '100%' }} />
          </div>
          <NotificationDropdown />
        </div>

        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {user?.email === 'shivashankrmali7@gmail.com' || user?.email?.includes('admin') ? 'Admin' : 'User'}! 👋
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Here&apos;s your coral reef health overview</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 22, position: 'relative' }}>
          <div 
            onClick={() => {
              const el = document.getElementById('time-filter-dropdown-dash');
              el.style.display = el.style.display === 'none' ? 'block' : 'none';
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 11, padding: '10px 16px', fontSize: 13, color: 'var(--text-dim)', cursor: 'pointer', userSelect: 'none' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span id="time-filter-label-dash">This Week</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          
          <div id="time-filter-dropdown-dash" style={{ display: 'none', position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 6, zIndex: 100, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            {['Today', 'This Week', 'This Month', 'This Year', 'All Time'].map((range) => (
              <div 
                key={range}
                onClick={(e) => {
                  document.getElementById('time-filter-label-dash').innerText = range;
                  document.getElementById('time-filter-dropdown-dash').style.display = 'none';
                }}
                style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-dim)', cursor: 'pointer', borderRadius: 8 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)'; }}
              >
                {range}
              </div>
            ))}
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 22 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,158,255,0.14)', color: '#5db8ff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z"/></svg>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Healthy Coral</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{loading ? '--' : healthyPct}%</div>
            <div style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 15l6-6 6 6"/></svg>8.4%
              <span style={{ color: 'var(--text-faint)', marginLeft: 2 }}>vs last week</span>
            </div>
          </div>
          
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(155,140,255,0.14)', color: 'var(--purple)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z"/></svg>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Bleached Coral</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{loading ? '--' : bleachedPct}%</div>
            <div style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>3.6%
              <span style={{ color: 'var(--text-faint)', marginLeft: 2 }}>vs last week</span>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,107,107,0.14)', color: 'var(--red)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z"/></svg>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Dead Coral</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{loading ? '--' : deadPct}%</div>
            <div style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 15l6-6 6 6"/></svg>2.1%
              <span style={{ color: 'var(--text-faint)', marginLeft: 2 }}>vs last week</span>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(94,224,145,0.14)', color: 'var(--green)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z"/></svg>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Algae</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{loading ? '--' : algaePct}%</div>
            <div style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>1.4%
              <span style={{ color: 'var(--text-faint)', marginLeft: 2 }}>vs last week</span>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,183,77,0.14)', color: 'var(--amber)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/></svg>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Risk Level</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--amber)', marginBottom: 10 }}>{riskLevel}</div>
            <div style={{ display: 'flex', gap: 3 }}>
              <span style={{ height: 5, flex: 1, borderRadius: 3, background: 'var(--amber)' }}></span>
              <span style={{ height: 5, flex: 1, borderRadius: 3, background: 'var(--amber)' }}></span>
              <span style={{ height: 5, flex: 1, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}></span>
              <span style={{ height: 5, flex: 1, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}></span>
            </div>
          </div>
        </div>

        {/* TWO COL: Recent Analysis + Donut */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>Recent Analysis</h3>
              <Link to="/history" style={{ fontSize: 12.5, color: 'var(--cyan)' }}>View All</Link>
            </div>
            
            <div style={{
              position: 'relative', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 14,
              background: 'radial-gradient(ellipse at 30% 30%, rgba(255,180,120,0.25), transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(90,170,255,0.2), transparent 55%), linear-gradient(160deg,#0d3050,#0a2038)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {recent?.originalUrl ? (
                <img src={recent.originalUrl} alt="Recent" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : null}
              <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(94,224,145,0.16)', border: '1px solid rgba(94,224,145,0.4)', color: 'var(--green)', fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 99 }}>
                {recent ? recent.riskLevel : 'Healthy'}
              </span>
            </div>
            
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{recent?.fileName || 'GOPR1234_20250524_104512.jpg'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {recent ? new Date(recent.createdAt).toLocaleString() : '24 May 2025 • 10:45 AM'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Great Barrier Reef, Australia
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 11, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/></svg>Coverage</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>2.43 m²</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 11, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z"/></svg>Bleaching %</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{recent ? recent.bleachedCoralPct : '22.3'}%</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 11, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>Confidence</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>97.6%</div>
              </div>
            </div>
            <button onClick={() => navigate('/history')} className="btn btn-outline" style={{ width: '100%', padding: 11 }}>View Full Result <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Coral Health Distribution</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <svg width="180" height="180" viewBox="0 0 180 180">
                <g transform="translate(90,90) rotate(-90)">
                  <circle r="70" fill="none" stroke="#123" strokeWidth="22"/>
                  <circle r="70" fill="none" stroke="var(--blue)" strokeWidth="22" strokeDasharray={`${healthyDash} ${circ}`} strokeDashoffset={healthyOffset}/>
                  <circle r="70" fill="none" stroke="var(--purple)" strokeWidth="22" strokeDasharray={`${bleachedDash} ${circ}`} strokeDashoffset={bleachedOffset}/>
                  <circle r="70" fill="none" stroke="var(--red)" strokeWidth="22" strokeDasharray={`${deadDash} ${circ}`} strokeDashoffset={deadOffset}/>
                  <circle r="70" fill="none" stroke="var(--green)" strokeWidth="22" strokeDasharray={`${algaeDash} ${circ}`} strokeDashoffset={algaeOffset}/>
                  <circle r="70" fill="none" stroke="var(--amber)" strokeWidth="22" strokeDasharray={`${sandDash} ${circ}`} strokeDashoffset={sandOffset}/>
                </g>
                <text x="90" y="82" textAnchor="middle" fill="#93a8c9" fontSize="11" fontFamily="Inter">Total</text>
                <text x="90" y="104" textAnchor="middle" fill="#eaf2ff" fontSize="22" fontWeight="800" fontFamily="Inter">{(healthyPct + bleachedPct).toFixed(1)}%</text>
                <text x="90" y="122" textAnchor="middle" fill="#5f7695" fontSize="10" fontFamily="Inter">Coral Coverage</text>
              </svg>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--blue)' }}></span>Healthy Coral</span><span style={{ fontWeight: 700, color: 'var(--text)' }}>{healthyPct}%</span></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--purple)' }}></span>Bleached Coral</span><span style={{ fontWeight: 700, color: 'var(--text)' }}>{bleachedPct}%</span></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--red)' }}></span>Dead Coral</span><span style={{ fontWeight: 700, color: 'var(--text)' }}>{deadPct}%</span></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green)' }}></span>Algae</span><span style={{ fontWeight: 700, color: 'var(--text)' }}>{algaePct}%</span></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--amber)' }}></span>Sand / Rock</span><span style={{ fontWeight: 700, color: 'var(--text)' }}>{sandPct.toFixed(1)}%</span></div>
              </div>
            </div>
            <div onClick={() => navigate('/history')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, padding: 11, border: '1px solid var(--card-border)', borderRadius: 10, color: 'var(--cyan)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 20V10M10 20V4M17 20v-7"/></svg>Detailed Analytics <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>
          </div>
        </div>

        {/* MAP + ACTIVITY */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>Reef Monitoring Map <svg style={{ color: 'var(--text-faint)', cursor: 'help' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></h3>
              <Link to="/map" style={{ fontSize: 12.5, color: 'var(--cyan)' }}>View Full Map <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ verticalAlign: '-1px' }}><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link>
            </div>
            <div style={{ position: 'relative', height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--card-border)', background: 'radial-gradient(circle at 30% 40%, rgba(20,90,60,0.5), transparent 45%), radial-gradient(circle at 65% 30%, rgba(20,90,60,0.4), transparent 40%), linear-gradient(160deg,#0a3450 0%, #0a4560 45%, #073048 100%)' }}>
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(6,18,34,0.85)', border: '1px solid var(--card-border)', color: 'var(--text-dim)', fontSize: 15 }}>+</button>
                <button style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(6,18,34,0.85)', border: '1px solid var(--card-border)', color: 'var(--text-dim)', fontSize: 15 }}>–</button>
              </div>
              <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid rgba(0,0,0,0.3)', background: 'var(--green)', top: '22%', left: '45%' }}></div>
              <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid rgba(0,0,0,0.3)', background: 'var(--amber)', top: '33%', left: '36%' }}></div>
              <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid rgba(0,0,0,0.3)', background: 'var(--amber)', top: '47%', left: '58%' }}></div>
              <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid rgba(0,0,0,0.3)', background: 'var(--red)', top: '55%', left: '33%' }}></div>
              
              <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 16, background: 'rgba(6,18,34,0.75)', padding: '7px 14px', borderRadius: 9, fontSize: 11, color: 'var(--text-dim)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }}></span>Healthy</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: 'var(--amber)', borderRadius: '50%' }}></span>Moderate</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: 'var(--red)', borderRadius: '50%' }}></span>Poor</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Activity</h3>
              <Link to="/history" style={{ fontSize: 12.5, color: 'var(--cyan)' }}>View All</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {stats?.history && stats.history.length > 0 ? stats.history.slice(0, 4).map((item, idx) => (
                <div key={item.analysisId || idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', background: item.riskLevel === 'Low' || item.riskLevel === 'Minimal' ? 'rgba(94,224,145,0.14)' : item.riskLevel === 'Moderate' ? 'rgba(255,183,77,0.14)' : 'rgba(255,107,107,0.14)', color: item.riskLevel === 'Low' || item.riskLevel === 'Minimal' ? 'var(--green)' : item.riskLevel === 'Moderate' ? 'var(--amber)' : 'var(--red)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M20 6L9 17l-5-5"/></svg>
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Analysis completed</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{item.fileName}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
              )) : (
                <div style={{ color: 'var(--text-muted)' }}>No recent activity.</div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Coral Health Trend</h3>
            <svg width="100%" height="190" viewBox="0 0 420 190" preserveAspectRatio="none">
              <line x1="0" y1="10" x2="420" y2="10" stroke="rgba(255,255,255,0.05)"/>
              <line x1="0" y1="52" x2="420" y2="52" stroke="rgba(255,255,255,0.05)"/>
              <line x1="0" y1="94" x2="420" y2="94" stroke="rgba(255,255,255,0.05)"/>
              <line x1="0" y1="136" x2="420" y2="136" stroke="rgba(255,255,255,0.05)"/>
              <line x1="0" y1="178" x2="420" y2="178" stroke="rgba(255,255,255,0.05)"/>
              <polyline fill="none" stroke="#3b9eff" strokeWidth="2.5" points="10,55 60,50 110,58 160,48 210,60 260,52 310,44 360,50 410,46"/>
              <polyline fill="none" stroke="#9b8cff" strokeWidth="2.5" points="10,110 60,100 110,120 160,105 210,118 260,100 310,112 360,98 410,108"/>
              <polyline fill="none" stroke="#ff6b6b" strokeWidth="2.5" points="10,150 60,158 110,146 160,155 210,148 260,160 310,150 360,152 410,148"/>
              <polyline fill="none" stroke="#5ee091" strokeWidth="2.5" points="10,165 60,160 110,168 160,158 210,166 260,155 310,163 360,157 410,160"/>
              <g fill="#3b9eff"><circle cx="10" cy="55" r="3"/><circle cx="60" cy="50" r="3"/><circle cx="110" cy="58" r="3"/><circle cx="160" cy="48" r="3"/><circle cx="210" cy="60" r="3"/><circle cx="260" cy="52" r="3"/><circle cx="310" cy="44" r="3"/><circle cx="360" cy="50" r="3"/><circle cx="410" cy="46" r="3"/></g>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-faint)', padding: '0 4px', marginTop: 8 }}>
              <span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span>
            </div>
          </div>
          
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, width: '100%', textAlign: 'left' }}>Health Index Score</h3>
            <svg width="200" height="120" viewBox="0 0 200 120">
              <path d="M15 105 A85 85 0 0 1 185 105" fill="none" stroke="#123" strokeWidth="16" strokeLinecap="round"/>
              <path d="M15 105 A85 85 0 0 1 185 105" fill="none" stroke="url(#gaugeGrad)" strokeWidth="16" strokeLinecap="round" strokeDasharray="267" strokeDashoffset="75"/>
              <defs>
                <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff6b6b"/><stop offset="55%" stopColor="#ffcb66"/><stop offset="100%" stopColor="#ffb74d"/>
                </linearGradient>
              </defs>
            </svg>
            <div style={{ fontSize: 34, fontWeight: 800, marginTop: -58 }}>{healthScore}<span style={{ fontSize: 14, color: 'var(--text-faint)', fontWeight: 600 }}>/100</span></div>
            <div style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 14, margin: '6px 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>{riskLevel} Risk
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', maxWidth: 230 }}>{healthScore > 80 ? 'The reef is in good condition.' : 'The reef is in moderate/poor condition. Regular monitoring is recommended.'}</div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => navigate('/upload')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', color: 'var(--text)' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,158,255,0.14)', color: '#5db8ff' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V7M12 7l-3.5 3.5M12 7l3.5 3.5"/><path d="M6.5 17.5A4.5 4.5 0 017 8.6 5.5 5.5 0 0117.9 8 4 4 0 0117.5 17.5H6.5z"/></svg></span>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>New Analysis</div><div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Upload image</div></div>
              </button>
              <button onClick={() => navigate('/history')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', color: 'var(--text)' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,107,107,0.14)', color: 'var(--red)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3v4a1 1 0 001 1h4"/><path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/></svg></span>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>Generate Report</div><div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Download PDF</div></div>
              </button>
              <button onClick={() => navigate('/map')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', color: 'var(--text)', gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(155,140,255,0.14)', color: 'var(--purple)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>Reef Map</div><div style={{ fontSize: 11, color: 'var(--text-faint)' }}>View monitored locations</div></div>
              </button>
            </div>
          </div>
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 4px 0', fontSize: 12.5, color: 'var(--text-faint)', borderTop: '1px solid var(--card-border)' }}>
          <span>© 2025 CoralAI. All rights reserved.</span>
          <span>Together, let&apos;s protect <Link to="#" style={{ color: 'var(--cyan)' }}>our oceans</Link> 🌊</span>
        </footer>
      </main>
    </div>
  );
}
