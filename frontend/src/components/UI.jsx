import { motion } from 'framer-motion';

import { useState, useEffect } from 'react';

export default function BackgroundOrbs() {
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    const handleClick = (e) => {
      // Create a unique ripple object
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples((prev) => [...prev, newRipple]);
      
      // Clean it up after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 1000);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="bg-orbs" style={{ pointerEvents: 'none', zIndex: 0 }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      
      {ripples.map((r) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0.5, scale: 0 }}
          animate={{ opacity: 0, scale: 4 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: 'fixed',
            left: r.x - 20, // Center the 40px circle
            top: r.y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'var(--primary-500)',
            pointerEvents: 'none'
          }}
        />
      ))}
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
