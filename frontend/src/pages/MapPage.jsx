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
    <div className="layout" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div className="main" style={{ padding: '30px 40px', flex: 1, maxWidth: 1600, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <MapIcon size={28} color="var(--primary-500)" />
              Geographic Information System (GIS)
            </h1>
            <p className="page-subtitle" style={{ margin: 0 }}>Advanced spatial analysis and geospatial telemetry mapping</p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading spatial data..." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, height: '70vh', minHeight: 600 }}>
            {/* GIS Control Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <GlassCard style={{ padding: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Filter size={18} /> Spatial Filters
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Risk Severity</label>
                  {riskLevels.map(level => (
                    <button
                      key={level}
                      onClick={() => setActiveFilter(level)}
                      style={{
                        padding: '8px 12px',
                        background: activeFilter === level ? (level === 'All' ? 'var(--primary-500)' : riskColor(level)) : 'transparent',
                        border: `1px solid ${level === 'All' ? 'var(--primary-500)' : riskColor(level)}`,
                        color: activeFilter === level ? '#fff' : 'var(--text-primary)',
                        borderRadius: 6,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      {level === 'All' ? 'View All Zones' : `${level} Risk`}
                    </button>
                  ))}
                </div>
              </GlassCard>

              <GlassCard style={{ padding: '20px', flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} /> Layer Intelligence
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <p style={{ marginBottom: 12 }}>Displaying <strong>{mapped.length}</strong> active telemetry points matching current spatial filters.</p>
                  
                  <div 
                    onClick={() => setShowHotspots(!showHotspots)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '12px', background: showHotspots ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-hover)', border: `1px solid ${showHotspots ? 'var(--warning)' : 'transparent'}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <AlertTriangle size={24} color="var(--warning)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Bleaching Hotspots</div>
                      <div style={{ fontSize: '0.75rem' }}>Auto-detected via AI consensus</div>
                    </div>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${showHotspots ? 'var(--warning)' : 'var(--text-muted)'}`, background: showHotspots ? 'var(--warning)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showHotspots && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => setShowProtectedAreas(!showProtectedAreas)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, padding: '12px', background: showProtectedAreas ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-hover)', border: `1px solid ${showProtectedAreas ? 'var(--success)' : 'transparent'}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <Droplet size={24} color="var(--success)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Marine Protected Areas</div>
                      <div style={{ fontSize: '0.75rem' }}>Sanctuary zones mapped</div>
                    </div>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${showProtectedAreas ? 'var(--success)' : 'var(--text-muted)'}`, background: showProtectedAreas ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showProtectedAreas && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Main Map Area */}
            <GlassCard style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
              <MapContainer 
                center={mapped[0] ? [mapped[0].latitude, mapped[0].longitude] : DEFAULT_CENTER} 
                zoom={mapped.length ? 8 : 5} 
                style={{ height: '100%', width: '100%', background: '#0f172a' }}
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
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
