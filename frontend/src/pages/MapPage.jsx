import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, LayersControl, Circle, Rectangle } from 'react-leaflet';
import { Layers, Map as MapIcon, Filter, AlertTriangle, Droplet } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackgroundOrbs, { GlassCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { getAnalysisHistory } from '../services/api';

const DEFAULT_CENTER = [18.5204, 73.8567];

// Hardcoded marine protected areas for demonstration
const PROTECTED_AREAS = [
  { name: 'Great Barrier Reef Marine Park', bounds: [[-22.5, 149.5], [-16.5, 145.5]], color: '#22c55e' },
  { name: 'Andaman Marine Sanctuary', bounds: [[12.5, 92.5], [11.5, 93.5]], color: '#14b8a6' },
  { name: 'Lakshadweep Coral Reserve', bounds: [[10.5, 72.0], [9.5, 73.5]], color: '#22c55e' }
];

function riskColor(level) {
  const map = { Critical: '#ef4444', High: '#f97316', Moderate: '#f59e0b', Low: '#14b8a6', Minimal: '#22c55e' };
  return map[level] || '#64748b';
}

export default function MapPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Layer Intelligence States
  const [showHotspots, setShowHotspots] = useState(false);
  const [showProtectedAreas, setShowProtectedAreas] = useState(false);

  useEffect(() => {
    getAnalysisHistory()
      .then(setAnalyses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const mapped = useMemo(() => {
    let base = analyses.filter((a) => a.latitude && a.longitude);
    if (activeFilter !== 'All') {
      base = base.filter(a => a.riskLevel === activeFilter);
    }
    return base;
  }, [analyses, activeFilter]);

  // Derive bleaching hotspots (where bleached coral > 30%)
  const hotspots = useMemo(() => {
    return analyses.filter((a) => a.latitude && a.longitude && a.bleachedCoralPct > 30);
  }, [analyses]);

  const riskLevels = ['All', 'Critical', 'High', 'Moderate', 'Low', 'Minimal'];

  return (
    <div className="layout" style={{ display: 'grid', gridTemplateColumns: '232px 1fr', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div className="main" style={{ padding: '24px 32px', flex: 1, maxWidth: '100%', margin: '0', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 16, flexShrink: 0, paddingRight: 90 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '1.5rem' }}>
              <MapIcon size={24} color="var(--primary-500)" />
              Geographic Information System (GIS)
            </h1>
            <p className="page-subtitle" style={{ margin: 0, fontSize: '0.85rem' }}>Advanced spatial analysis and geospatial telemetry mapping</p>
          </div>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingSpinner text="Loading spatial data..." />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, flex: 1, minHeight: 0 }}>
            {/* GIS Control Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 8 }}>
              
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#f8fafc' }}>
                  <Filter size={16} color="#94a3b8" /> Spatial Filters
                </h3>
                
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Risk Severity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {riskLevels.map(level => (
                    <button
                      key={level}
                      onClick={() => setActiveFilter(level)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px',
                        background: activeFilter === level ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        border: `1px solid ${activeFilter === level ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
                        color: activeFilter === level ? '#3b82f6' : '#cbd5e1',
                        borderRadius: 8,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => { if (activeFilter !== level) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseOut={e => { if (activeFilter !== level) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: level === 'All' ? '#3b82f6' : riskColor(level), boxShadow: activeFilter === level ? `0 0 8px ${level === 'All' ? '#3b82f6' : riskColor(level)}` : 'none' }}></div>
                      {level === 'All' ? 'View All Zones' : `${level} Risk`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, flex: 1 }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#f8fafc' }}>
                  <Layers size={16} color="#94a3b8" /> Layer Intelligence
                </h3>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                  <p style={{ marginBottom: 16 }}>Displaying <strong style={{ color: '#f8fafc' }}>{mapped.length}</strong> active telemetry points matching current spatial filters.</p>
                  
                  <div 
                    onClick={() => setShowHotspots(!showHotspots)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: showHotspots ? 'rgba(245, 158, 11, 0.1)' : 'rgba(30, 41, 59, 0.4)', border: `1px solid ${showHotspots ? 'rgba(245, 158, 11, 0.3)' : '#1e293b'}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s', marginBottom: 10 }}
                  >
                    <AlertTriangle size={20} color={showHotspots ? '#f59e0b' : '#64748b'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: showHotspots ? '#f59e0b' : '#cbd5e1', fontSize: '13px' }}>Bleaching Hotspots</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>Auto-detected via AI consensus</div>
                    </div>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${showHotspots ? '#f59e0b' : '#475569'}`, background: showHotspots ? '#f59e0b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showHotspots && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => setShowProtectedAreas(!showProtectedAreas)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: showProtectedAreas ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.4)', border: `1px solid ${showProtectedAreas ? 'rgba(16, 185, 129, 0.3)' : '#1e293b'}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <Droplet size={20} color={showProtectedAreas ? '#10b981' : '#64748b'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: showProtectedAreas ? '#10b981' : '#cbd5e1', fontSize: '13px' }}>Marine Protected Areas</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>Sanctuary zones mapped</div>
                    </div>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${showProtectedAreas ? '#10b981' : '#475569'}`, background: showProtectedAreas ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showProtectedAreas && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Map Area */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                <MapContainer 
                  center={mapped[0] ? [mapped[0].latitude, mapped[0].longitude] : DEFAULT_CENTER} 
                  zoom={mapped.length ? 8 : 5} 
                  style={{ position: 'absolute', inset: 0, background: '#0f172a', zIndex: 1 }}
                >
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="Satellite Imagery (Esri)">
                    <TileLayer
                      attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Topological (OpenStreetMap)">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>

                {/* Hotspots Layer */}
                {showHotspots && hotspots.map((h, idx) => (
                  <Circle 
                    key={`hotspot-${idx}`}
                    center={[h.latitude, h.longitude]} 
                    radius={15000} // 15km radius
                    pathOptions={{ color: 'var(--warning)', fillColor: 'var(--warning)', fillOpacity: 0.2, weight: 1 }}
                  />
                ))}

                {/* Protected Areas Layer */}
                {showProtectedAreas && PROTECTED_AREAS.map((pa, idx) => (
                  <Rectangle 
                    key={`pa-${idx}`}
                    bounds={pa.bounds} 
                    pathOptions={{ color: pa.color, fillColor: pa.color, fillOpacity: 0.15, weight: 2, dashArray: '5, 5' }}
                  >
                    <Popup>
                      <strong style={{ color: 'var(--success)' }}>{pa.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Restricted human activity zone.</div>
                    </Popup>
                  </Rectangle>
                ))}

                {/* Data Points Layer */}
                {mapped.map((a) => (
                  <CircleMarker
                    key={a.analysisId}
                    center={[a.latitude, a.longitude]}
                    radius={activeFilter === a.riskLevel ? 16 : 10}
                    pathOptions={{ 
                      color: riskColor(a.riskLevel), 
                      fillColor: riskColor(a.riskLevel), 
                      fillOpacity: activeFilter === a.riskLevel ? 0.8 : 0.6,
                      weight: 2
                    }}
                  >
                    <Popup className="gis-popup">
                      <div style={{ padding: 4 }}>
                        <strong style={{ fontSize: '1rem', display: 'block', marginBottom: 8 }}>{a.fileName}</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Healthy</div>
                            <div style={{ color: '#22c55e', fontWeight: 700 }}>{a.healthyCoralPct}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Bleached</div>
                            <div style={{ color: '#f97316', fontWeight: 700 }}>{a.bleachedCoralPct}%</div>
                          </div>
                        </div>
                        <RiskBadge level={a.riskLevel} />
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 12, fontFamily: 'monospace' }}>
                          COORD: {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
