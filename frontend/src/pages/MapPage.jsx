import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import Navbar from '../components/Navbar';
import BackgroundOrbs, { GlassCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { getAnalysisHistory } from '../services/api';

const DEFAULT_CENTER = [18.5204, 73.8567]; // Pune, India

function riskColor(level) {
  const map = { Critical: '#ef4444', High: '#f97316', Moderate: '#f59e0b', Low: '#14b8a6', Minimal: '#22c55e' };
  return map[level] || '#64748b';
}

export default function MapPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalysisHistory()
      .then(setAnalyses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const mapped = analyses.filter((a) => a.latitude && a.longitude);

  return (
    <>
      <BackgroundOrbs />
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">Interactive Reef Map</h1>
        <p className="page-subtitle">GIS visualization of analyzed reef health locations</p>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
            <MapContainer center={mapped[0] ? [mapped[0].latitude, mapped[0].longitude] : DEFAULT_CENTER} zoom={mapped.length ? 8 : 5} style={{ height: 500, width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapped.map((a) => (
                <CircleMarker
                  key={a.analysisId}
                  center={[a.latitude, a.longitude]}
                  radius={12}
                  pathOptions={{ color: riskColor(a.riskLevel), fillColor: riskColor(a.riskLevel), fillOpacity: 0.6 }}
                >
                  <Popup>
                    <strong>{a.fileName}</strong><br />
                    Healthy: {a.healthyCoralPct}%<br />
                    Bleached: {a.bleachedCoralPct}%<br />
                    <RiskBadge level={a.riskLevel} />
                  </Popup>
                </CircleMarker>
              ))}
              {mapped.length === 0 && (
                <Marker position={DEFAULT_CENTER}>
                  <Popup>No geo-tagged analyses yet. Upload with latitude/longitude to see markers.</Popup>
                </Marker>
              )}
            </MapContainer>
          </GlassCard>
        )}

        <GlassCard style={{ marginTop: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>Legend</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['Minimal', 'Low', 'Moderate', 'High', 'Critical'].map((l) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: riskColor(l) }} />
                {l}
              </span>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  );
}
