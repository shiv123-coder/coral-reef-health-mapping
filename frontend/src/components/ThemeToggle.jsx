import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Cloud, Star } from 'lucide-react';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div 
      onClick={toggleTheme}
      style={{
        width: 72, 
        height: 36, 
        borderRadius: 40, 
        background: isDarkMode ? 'linear-gradient(135deg, #0f172a, #1e293b)' : 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
        position: 'relative', 
        cursor: 'pointer',
        boxShadow: isDarkMode 
          ? 'inset 0 2px 10px rgba(0,0,0,0.8), 0 0 10px rgba(79, 214, 232, 0.1)' 
          : 'inset 0 2px 8px rgba(0,0,0,0.1), 0 0 12px rgba(56, 189, 248, 0.4)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        flexShrink: 0
      }}
      aria-label="Toggle Theme"
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {/* Night Sky Elements */}
      <div style={{ position: 'absolute', top: 6, left: 10, opacity: isDarkMode ? 1 : 0, transition: 'opacity 0.4s', display: 'flex', gap: 4 }}>
        <Star size={7} color="#fff" fill="#fff" style={{ animation: 'twinkle 2s infinite' }} />
        <Star size={5} color="#fff" fill="#fff" style={{ marginTop: 8, animation: 'twinkle 3s infinite 1s' }} />
      </div>

      {/* Day Sky Elements */}
      <div style={{ position: 'absolute', top: 12, right: 8, opacity: isDarkMode ? 0 : 1, transition: 'opacity 0.4s' }}>
        <Cloud size={14} color="#fff" fill="#fff" opacity={0.8} />
      </div>

      {/* The Toggle Thumb */}
      <div style={{
        position: 'absolute', 
        top: 2, 
        left: isDarkMode ? 3 : 37,
        width: 30, 
        height: 30, 
        borderRadius: '50%',
        background: isDarkMode ? 'linear-gradient(135deg, #e2e8f0, #94a3b8)' : 'linear-gradient(135deg, #fef08a, #f59e0b)',
        boxShadow: isDarkMode 
          ? '-2px 0 8px rgba(255,255,255,0.1), inset 2px -2px 6px rgba(0,0,0,0.2)' 
          : '0 0 10px rgba(245, 158, 11, 0.6), inset -2px -2px 6px rgba(0,0,0,0.1)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isDarkMode ? 'rotate(0deg)' : 'rotate(180deg)'
      }}>
        {isDarkMode ? (
          <Moon size={16} color="#0f172a" fill="#0f172a" strokeWidth={1} style={{ transform: 'rotate(-20deg)', marginLeft: -2 }} />
        ) : (
          <Sun size={18} color="#92400e" fill="#d97706" />
        )}
      </div>
    </div>
  );
};

export default ThemeToggle;
