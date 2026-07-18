import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState({ isOffline: false, criticalThreshold: 80 });
  const [updatingSystem, setUpdatingSystem] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    
    const unsubAnalyses = onSnapshot(query(collection(db, 'analyses'), orderBy('createdAt', 'desc')), (snapshot) => {
      const analysesData = snapshot.docs.map(doc => doc.data());
      setAnalyses(analysesData);
      setLoading(false);
    }, console.error);

    const unsubConfig = onSnapshot(doc(db, 'global_config', 'system'), (docSnap) => {
      if (docSnap.exists()) {
        setSystemConfig(docSnap.data());
      }
    });

    return () => {
      unsubAnalyses();
      unsubConfig();
    };
  }, []);

  const toggleOfflineMode = async () => {
    if (!window.confirm(`Are you sure you want to turn the system ${systemConfig.isOffline ? 'ONLINE' : 'OFFLINE'}?`)) return;
    setUpdatingSystem(true);
    try {
      await setDoc(doc(db, 'global_config', 'system'), {
        ...systemConfig,
        isOffline: !systemConfig.isOffline
      }, { merge: true });
    } catch (e) {
      console.error(e);
      alert("Failed to update system mode");
    }
    setUpdatingSystem(false);
  };

  // Stats calculation
  const n = analyses.length || 1;
  const healthyPct = analyses.length ? Number((analyses.reduce((sum, a) => sum + (a.healthyCoralPct || 0), 0) / n).toFixed(1)) : 0;
  const bleachedPct = analyses.length ? Number((analyses.reduce((sum, a) => sum + (a.bleachedCoralPct || 0), 0) / n).toFixed(1)) : 0;
  const deadPct = analyses.length ? Number((analyses.reduce((sum, a) => sum + (a.deadCoralPct || 0), 0) / n).toFixed(1)) : 0;
  
  const riskPriority = { Critical: 4, High: 3, Moderate: 2, Low: 1, Minimal: 0 };
  const worstRisk = analyses.length ? analyses.reduce((worst, a) => (riskPriority[a.riskLevel] || 0) > (riskPriority[worst] || 0) ? (a.riskLevel || 'Minimal') : worst, 'Minimal') : 'N/A';

  // Group analyses by date for time series chart
  const timeSeriesData = useMemo(() => {
    if (!analyses || analyses.length === 0) return [];
    const dateMap = {};
    const sorted = [...analyses].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    let cumulativeAnalyses = 0;
    sorted.forEach(a => {
      const d = new Date(a.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { name: dateStr, count: 0, healthSum: 0, cumulative: cumulativeAnalyses };
      }
      
      dateMap[dateStr].count += 1;
      dateMap[dateStr].healthSum += (a.healthyCoralPct || 0);
      cumulativeAnalyses += 1;
      dateMap[dateStr].cumulative = cumulativeAnalyses;
    });
    
    return Object.values(dateMap).map(day => ({
      name: day.name,
      dailyScans: day.count,
      totalScans: day.cumulative,
      avgHealth: Number((day.healthSum / day.count).toFixed(1))
    }));
  }, [analyses]);

      {/* Key Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Status</div>
          <div style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: systemConfig.isOffline ? '#ef4444' : '#10b981' }}>{systemConfig.isOffline ? 'OFFLINE' : 'ONLINE'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>Global availability status</div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total ML Analyses</div>
          <div style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: 'var(--text)' }}>{loading ? '--' : analyses.length}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>Volume of processed telemetry</div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Coral Health</div>
          <div style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: '#3b82f6' }}>{healthyPct}%</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>Global ecosystem vitality index</div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Highest Risk Detected</div>
          <div style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: worstRisk === 'Minimal' || worstRisk === 'Low' ? '#10b981' : worstRisk === 'Moderate' ? '#f59e0b' : '#ef4444' }}>{worstRisk}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>Peak ecological threat level</div>
        </div>
      </div>

      {/* Time Series Analytics Chart */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px 0' }}>System Telemetry & Progress</h2>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Real-time temporal analysis of system throughput and ecological health</div>
          </div>
        </div>
        
        {timeSeriesData.length > 0 ? (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-faint)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis yAxisId="left" stroke="var(--text-faint)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-faint)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)', borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }} 
                  itemStyle={{ fontSize: 13, fontWeight: 500 }}
                  labelStyle={{ color: 'var(--text-dim)', marginBottom: 4 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                <Area yAxisId="left" type="monotone" dataKey="totalScans" name="Cumulative ML Scans" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                <Area yAxisId="right" type="monotone" dataKey="avgHealth" name="Avg Coral Health (%)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHealth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', background: 'var(--input-bg)', borderRadius: 8, border: '1px solid var(--input-border)' }}>
            Awaiting telemetry data to generate temporal graphs...
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Main Controls Area */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px 0' }}>Global System Controls</h2>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Manage core operational parameters and system availability</div>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Kill Switch */}
            <div style={{ padding: 24, background: systemConfig.isOffline ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-hover)', border: `1px solid ${systemConfig.isOffline ? 'rgba(239, 68, 68, 0.2)' : 'var(--card-border)'}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: systemConfig.isOffline ? '#ef4444' : 'var(--text)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                  Emergency Kill Switch (Offline Mode)
                </h3>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', maxWidth: 400, lineHeight: 1.5 }}>
                  Enabling this will instantly block all non-admins from logging in, redirect active sessions to a maintenance page, and reject incoming ML processing requests.
                </div>
              </div>
              <button 
                onClick={toggleOfflineMode}
                disabled={updatingSystem}
                style={{ 
                  padding: '12px 24px', 
                  background: systemConfig.isOffline ? 'transparent' : '#ef4444', 
                  color: systemConfig.isOffline ? '#ef4444' : '#fff',
                  border: `2px solid ${systemConfig.isOffline ? '#ef4444' : 'transparent'}`,
                  borderRadius: 8, 
                  fontSize: 14, 
                  fontWeight: 700, 
                  cursor: updatingSystem ? 'wait' : 'pointer',
                  opacity: updatingSystem ? 0.7 : 1,
                  transition: 'all 0.2s',
                  boxShadow: systemConfig.isOffline ? 'none' : '0 4px 14px 0 rgba(239, 68, 68, 0.39)'
                }}
              >
                {updatingSystem ? 'UPDATING...' : (systemConfig.isOffline ? 'BRING SYSTEM ONLINE' : 'TAKE SYSTEM OFFLINE')}
              </button>
            </div>

            {/* Health Config */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px 0' }}>Health Score Management</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Critical Risk Threshold (%)</label>
                  <input 
                    type="number" 
                    value={systemConfig.criticalThreshold || 80} 
                    onChange={e => setDoc(doc(db, 'global_config', 'system'), { ...systemConfig, criticalThreshold: Number(e.target.value) }, { merge: true })}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 6, color: 'var(--text)', fontSize: 14, outline: 'none' }} 
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>Bleaching % above this triggers Critical status.</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Side Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* System Logs / Server Info */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0' }}>Server Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-dim)' }}>API Endpoint</span>
                <span style={{ color: systemConfig.isOffline ? '#ef4444' : '#10b981', fontWeight: 500 }}>{systemConfig.isOffline ? 'Offline' : 'Online'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-dim)' }}>ML Inference Engine</span>
                <span style={{ color: systemConfig.isOffline ? '#ef4444' : '#10b981', fontWeight: 500 }}>{systemConfig.isOffline ? 'Halted' : 'Ready'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-dim)' }}>Firebase Storage</span>
                <span style={{ color: '#eab308', fontWeight: 500 }}>64% Capacity</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
