import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, LayersControl } from 'react-leaflet';
import { Layers, Map as MapIcon, Filter, AlertTriangle, Droplet } from 'lucide-react';
import Navbar from '../components/Navbar';
import BackgroundOrbs, { GlassCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { getAnalysisHistory } from '../services/api';

const DEFAULT_CENTER = [18.5204, 73.8567];

function riskColor(level) {
  const map = { Critical: '#ef4444', High: '#f97316', Moderate: '#f59e0b', Low: '#14b8a6', Minimal: '#22c55e' };
  return map[level] || '#64748b';
}

export default function MapPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

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

  const riskLevels = ['All', 'Critical', 'High', 'Moderate', 'Low', 'Minimal'];

  return (
    <>
      <BackgroundOrbs />
      <Navbar />
      <div className="page-container" style={{ maxWidth: 1600, padding: '24px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, height: '70vh', minHeight: 600 }}>
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
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                    <AlertTriangle size={24} color="var(--warning)" />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Bleaching Hotspots</div>
                      <div style={{ fontSize: '0.75rem' }}>Auto-detected via AI consensus</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, padding: '12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                    <Droplet size={24} color="var(--success)" />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Marine Protected Areas</div>
                      <div style={{ fontSize: '0.75rem' }}>Sanctuary zones mapped</div>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
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
    </>
  );
}
