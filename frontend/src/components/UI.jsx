import { motion } from 'framer-motion';

export default function BackgroundOrbs() {
  return (
    <div className="bg-orbs">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

export function LoadingSpinner({ text = 'Analyzing reef health...' }) {
  return (
    <div className="loading-overlay">
      <div className="loader" />
      <motion.p
        className="loading-text"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
      </motion.p>
    </div>
  );
}

export function RiskBadge({ level }) {
  const cls = `badge badge-${(level || 'minimal').toLowerCase()}`;
  return <span className={cls}>{level || 'N/A'}</span>;
}

export function StatCard({ label, value, suffix = '%', variant = '' }) {
  return (
    <motion.div
      className={`glass stat-card stat-${variant}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="stat-value">{value}{suffix !== '' ? suffix : ''}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
}

export function GlassCard({ children, className = '', style = {} }) {
  return (
    <motion.div
      className={`glass ${className}`}
      style={{ padding: 24, ...style }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
