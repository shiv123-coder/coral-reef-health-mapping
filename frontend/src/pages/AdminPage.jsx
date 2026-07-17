import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { adminGetUsers, adminGetAnalyses, adminGetAnalytics, adminOverrideReport } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([adminGetUsers(), adminGetAnalyses(), adminGetAnalytics()])
      .then(([u, a, an]) => { 
        setUsers(u.users || []); 
        setAnalyses(a.analyses || []); 
        setAnalytics(an); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // For the charts and stats we can use dummy values similar to HTML or actual data if available
  const healthyPct = 48.6;
  const bleachedPct = 22.3;
  const deadPct = 12.7;
  const algaePct = 10.1;
  const sandPct = Math.max(0, 100 - (healthyPct + bleachedPct + deadPct + algaePct));

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

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.body.style.filter = !isDark ? 'none' : 'invert(1) hue-rotate(180deg)';
  };

  // Recent users
  const recentUsers = users.slice(0, 5);
  // Recent analyses
  const recentAnalyses = analyses.slice(0, 3);

  return (
    <div className="layout" style={{ display: 'grid', gridTemplateColumns: '230px 1fr', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      
      <main className="main" style={{ padding: '26px 30px 40px', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Welcome back, Admin! 👋</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 13.5 }}>Here&apos;s what&apos;s happening with your coral reef monitoring system.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 11, padding: '10px 16px', width: 230, color: 'var(--text-faint)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
              <input type="text" placeholder="Search anything..." style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13.5, width: '100%' }} />
            </div>
            <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 11, background: 'var(--card)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
              <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, width: 17, height: 17, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)' }}>5</span>
            </div>
            <div onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--card-border)', padding: '10px 16px', borderRadius: 11, fontSize: 13, color: 'var(--text-dim)', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 11, padding: '10px 16px', fontSize: 13, color: 'var(--text-dim)', cursor: 'pointer', marginBottom: 20, marginLeft: 'auto', width: 'fit-content' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          May 18 – May 24, 2025
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,158,255,0.14)', color: '#5db8ff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z"/></svg>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Total Analyses</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{loading ? '--' : (analytics?.totalAnalyses || '1,248')}</div>
            <div style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 15l6-6 6 6"/></svg>18.6%<span style={{ color: 'var(--text-faint)', marginLeft: 2 }}>vs last week</span>
            </div>
          </div>
          
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(94,224,145,0.14)', color: 'var(--green)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5"/></svg>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Healthy Coral</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{healthyPct}%</div>
            <div style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 15l6-6 6 6"/></svg>8.4%<span style={{ color: 'var(--text-faint)', marginLeft: 2 }}>vs last week</span>
            </div>
          </div>
          
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(155,140,255,0.14)', color: 'var(--purple)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z"/></svg>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Bleached Coral</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{bleachedPct}%</div>
            <div style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>3.6%<span style={{ color: 'var(--text-faint)', marginLeft: 2 }}>vs last week</span>
            </div>
          </div>
          
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,107,107,0.14)', color: 'var(--red)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z"/></svg>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Dead Coral</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{deadPct}%</div>
            <div style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 15l6-6 6 6"/></svg>2.1%<span style={{ color: 'var(--text-faint)', marginLeft: 2 }}>vs last week</span>
            </div>
          </div>
          
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,183,77,0.14)', color: 'var(--amber)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/></svg>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Risk Level</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--amber)', marginBottom: 10 }}>Moderate</div>
            <div style={{ display: 'flex', gap: 3 }}>
              <span style={{ height: 5, flex: 1, borderRadius: 3, background: 'var(--amber)' }}></span>
              <span style={{ height: 5, flex: 1, borderRadius: 3, background: 'var(--amber)' }}></span>
              <span style={{ height: 5, flex: 1, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}></span>
              <span style={{ height: 5, flex: 1, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}></span>
            </div>
          </div>
        </div>

        {/* TREND + DONUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>Coral Health Trend <svg style={{ color: 'var(--text-faint)', cursor: 'help' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', padding: '6px 12px', borderRadius: 9, cursor: 'pointer' }}>Last 6 Months <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
            </div>
            <svg width="100%" height="220" viewBox="0 0 460 220" preserveAspectRatio="none">
              <text x="0" y="14" fill="#5f7695" fontSize="10" fontFamily="Inter">100</text>
              <text x="0" y="60" fill="#5f7695" fontSize="10" fontFamily="Inter">75</text>
              <text x="0" y="106" fill="#5f7695" fontSize="10" fontFamily="Inter">50</text>
              <text x="0" y="152" fill="#5f7695" fontSize="10" fontFamily="Inter">25</text>
              <text x="0" y="198" fill="#5f7695" fontSize="10" fontFamily="Inter">0</text>
              <line x1="26" y1="10" x2="460" y2="10" stroke="rgba(255,255,255,0.05)"/>
              <line x1="26" y1="56" x2="460" y2="56" stroke="rgba(255,255,255,0.05)"/>
              <line x1="26" y1="102" x2="460" y2="102" stroke="rgba(255,255,255,0.05)"/>
              <line x1="26" y1="148" x2="460" y2="148" stroke="rgba(255,255,255,0.05)"/>
              <line x1="26" y1="194" x2="460" y2="194" stroke="rgba(255,255,255,0.05)"/>
              <polyline fill="none" stroke="#3b9eff" strokeWidth="2.5" points="40,60 90,55 140,63 190,52 240,66 290,57 340,49 390,55 440,50"/>
              <polyline fill="none" stroke="#9b8cff" strokeWidth="2.5" points="40,120 90,110 140,132 190,115 240,130 290,110 340,124 390,108 440,118"/>
              <polyline fill="none" stroke="#ff6b6b" strokeWidth="2.5" points="40,165 90,174 140,160 190,170 240,162 290,176 340,164 390,167 440,162"/>
              <polyline fill="none" stroke="#5ee091" strokeWidth="2.5" points="40,182 90,176 140,186 190,174 240,184 290,171 340,180 390,173 440,177"/>
              <g fill="#3b9eff"><circle cx="40" cy="60" r="3"/><circle cx="90" cy="55" r="3"/><circle cx="140" cy="63" r="3"/><circle cx="190" cy="52" r="3"/><circle cx="240" cy="66" r="3"/><circle cx="290" cy="57" r="3"/><circle cx="340" cy="49" r="3"/><circle cx="390" cy="55" r="3"/><circle cx="440" cy="50" r="3"/></g>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-faint)', padding: '0 20px 0 26px', marginTop: 8 }}>
              <span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span>
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 12, color: 'var(--text-dim)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b9eff' }}></span>Healthy</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9b8cff' }}></span>Bleached</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b6b' }}></span>Dead</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5ee091' }}></span>Algae</span>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Coral Health Distribution</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <svg width="170" height="170" viewBox="0 0 180 180">
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, padding: 11, border: '1px solid var(--card-border)', borderRadius: 10, color: 'var(--cyan)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              View Detailed Analytics <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS + RECENT ANALYSES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,158,255,0.14)', color: '#5db8ff' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V7M12 7l-3.5 3.5M12 7l3.5 3.5"/><path d="M6.5 17.5A4.5 4.5 0 017 8.6 5.5 5.5 0 0117.9 8 4 4 0 0117.5 17.5H6.5z"/></svg></span>
                <div><div style={{ fontSize: 12, fontWeight: 600 }}>New Analysis</div><div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>Upload Image</div></div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,107,107,0.14)', color: 'var(--red)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3v4a1 1 0 001 1h4"/><path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/></svg></span>
                <div><div style={{ fontSize: 12, fontWeight: 600 }}>Gen Report</div><div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>Download PDF</div></div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(94,224,145,0.14)', color: 'var(--green)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg></span>
                <div><div style={{ fontSize: 12, fontWeight: 600 }}>Export Data</div><div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>CSV / Excel</div></div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,158,255,0.14)', color: '#5db8ff' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="M16 4.5c1.7.4 3 2 3 3.9 0 1.9-1.3 3.5-3 3.9"/></svg></span>
                <div><div style={{ fontSize: 12, fontWeight: 600 }}>Manage Users</div><div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>View All Users</div></div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(155,140,255,0.14)', color: 'var(--purple)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
                <div><div style={{ fontSize: 12, fontWeight: 600 }}>View Map</div><div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>Reef Locations</div></div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Analyses</h3>
              <Link to="/history" style={{ fontSize: 12.5, color: 'var(--cyan)' }}>View All</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentAnalyses.length > 0 ? recentAnalyses.map(a => (
                <div key={a.analysisId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, flex: 'none', background: 'linear-gradient(160deg,#0d3050,#0a2038)', overflow: 'hidden' }}>
                    {a.originalUrl && <img src={a.originalUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: a.riskLevel === 'Low' ? 'rgba(94,224,145,0.15)' : a.riskLevel === 'Moderate' ? 'rgba(255,183,77,0.15)' : 'rgba(255,107,107,0.15)', color: a.riskLevel === 'Low' ? 'var(--green)' : a.riskLevel === 'Moderate' ? 'var(--amber)' : 'var(--red)' }}>{a.riskLevel}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.fileName}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right', flex: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Coverage<b style={{ color: 'var(--text)', fontSize: 13, display: 'block' }}>{a.healthyCoralPct}%</b></div>
                    <svg style={{ color: 'var(--text-faint)', marginLeft: 8 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              )) : <div style={{ color: 'var(--text-muted)' }}>No recent analyses found.</div>}
            </div>
          </div>
        </div>

        {/* MAP + SYSTEM OVERVIEW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>Reef Monitoring Map <svg style={{ color: 'var(--text-faint)', cursor: 'help' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></h3>
              <Link to="/map" style={{ fontSize: 12.5, color: 'var(--cyan)' }}>View Full Map <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ verticalAlign: '-1px' }}><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link>
            </div>
            <div style={{ position: 'relative', height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'radial-gradient(circle at 30% 40%, rgba(20,90,60,0.5), transparent 45%),radial-gradient(circle at 65% 30%, rgba(20,90,60,0.4), transparent 40%),linear-gradient(160deg,#0a3450 0%, #0a4560 45%, #073048 100%)' }}>
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(6,18,34,0.85)', border: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: 15 }}>+</button>
                <button style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(6,18,34,0.85)', border: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: 15 }}>–</button>
              </div>
              <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid rgba(0,0,0,0.3)', background: 'var(--green)', top: '22%', left: '45%' }}></div>
              <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid rgba(0,0,0,0.3)', background: 'var(--amber)', top: '33%', left: '36%' }}></div>
              <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid rgba(0,0,0,0.3)', background: 'var(--amber)', top: '47%', left: '58%' }}></div>
              <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid rgba(0,0,0,0.3)', background: 'var(--red)', top: '55%', left: '33%' }}></div>
              <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid rgba(0,0,0,0.3)', background: 'var(--green)', top: '38%', left: '16%' }}></div>
              <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid rgba(0,0,0,0.3)', background: 'var(--green)', top: '70%', left: '44%' }}></div>
              <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 16, background: 'rgba(6,18,34,0.75)', padding: '7px 14px', borderRadius: 9, fontSize: 11, color: 'var(--text-dim)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }}></span>Healthy</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }}></span>Moderate</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }}></span>Poor</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>System Overview</h3>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 150, height: 150, flex: 'none' }}>
                <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="75" cy="75" r="62" fill="none" stroke="#123" strokeWidth="14"/>
                  <circle cx="75" cy="75" r="62" fill="none" stroke="url(#sysGrad)" strokeWidth="14" strokeLinecap="round" strokeDasharray="389.6" strokeDashoffset="31.2"/>
                  <defs><linearGradient id="sysGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4fd6e8"/><stop offset="1" stopColor="#3b7dff"/></linearGradient></defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <b style={{ fontSize: 26, fontWeight: 800 }}>92%</b>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>System Health</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}><svg style={{ color: 'var(--green)', flex: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg><span style={{ flex: 1, color: 'var(--text-dim)' }}>AI Models</span><span style={{ fontWeight: 600, fontSize: 12, color: 'var(--green)' }}>Operational</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}><svg style={{ color: 'var(--green)', flex: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg><span style={{ flex: 1, color: 'var(--text-dim)' }}>Database</span><span style={{ fontWeight: 600, fontSize: 12, color: 'var(--green)' }}>Connected</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}><svg style={{ color: 'var(--green)', flex: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg><span style={{ flex: 1, color: 'var(--text-dim)' }}>Storage</span><span style={{ fontWeight: 600, fontSize: 12, color: 'var(--amber)' }}>72% Used</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}><svg style={{ color: 'var(--green)', flex: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg><span style={{ flex: 1, color: 'var(--text-dim)' }}>API Services</span><span style={{ fontWeight: 600, fontSize: 12, color: 'var(--green)' }}>Running</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}><svg style={{ color: 'var(--green)', flex: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg><span style={{ flex: 1, color: 'var(--text-dim)' }}>Backup</span><span style={{ fontWeight: 600, fontSize: 12, color: 'var(--green)' }}>Up to date</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT USERS + ALERTS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 26 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22, overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Users</h3>
              <a href="#" style={{ fontSize: 12.5, color: 'var(--cyan)' }}>View All</a>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 600, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>User</th>
                  <th style={{ textAlign: 'left', fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 600, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>Email</th>
                  <th style={{ textAlign: 'left', fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 600, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>Role</th>
                  <th style={{ textAlign: 'left', fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 600, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>Joined On</th>
                  <th style={{ textAlign: 'left', fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 600, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length > 0 ? recentUsers.map(u => (
                  <tr key={u.uid}>
                    <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', flex: 'none', background: 'linear-gradient(135deg,#3b7dff,#4fd6e8)' }}></div>
                        {u.firstName || 'User'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, verticalAlign: 'middle', color: 'var(--text-dim)' }}>{u.email}</td>
                    <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, verticalAlign: 'middle', color: 'var(--text-dim)' }}>{u.role?.toUpperCase() || 'USER'}</td>
                    <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, verticalAlign: 'middle', color: 'var(--text-dim)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(94,224,145,0.15)', color: 'var(--green)' }}>Active</span>
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} style={{ padding: '12px 0', color: 'var(--text-muted)' }}>No users found.</td></tr>}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Alerts &amp; Notifications</h3>
              <a href="#" style={{ fontSize: 12.5, color: 'var(--cyan)' }}>View All</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', background: 'rgba(255,183,77,0.15)', color: 'var(--amber)' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg></span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>High bleaching detected</div><div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Immediate attention required</div></div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap', textAlign: 'right' }}>Today<br/>06:30 AM</div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', background: 'rgba(255,107,107,0.15)', color: 'var(--red)' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Low coral coverage in Andaman</div><div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Coverage dropped below 30%</div></div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap', textAlign: 'right' }}>Yesterday<br/>04:15 PM</div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', background: 'rgba(59,158,255,0.15)', color: '#5db8ff' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>New analysis completed</div><div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>GOPR1234_20250524.jpg</div></div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap', textAlign: 'right' }}>Yesterday<br/>10:45 AM</div>
              </div>
            </div>
          </div>
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 4px 0', fontSize: 12.5, color: 'var(--text-faint)', borderTop: '1px solid var(--border)' }}>
          <span>© 2025 CoralAI. All rights reserved.</span>
          <span>Together, let&apos;s protect <a href="#" style={{ color: 'var(--cyan)' }}>our oceans</a> 🌊</span>
        </footer>
      </main>
    </div>
  );
}
