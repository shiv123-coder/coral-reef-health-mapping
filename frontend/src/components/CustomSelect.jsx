import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomSelect({ value, onChange, options, placeholder = "Select an option", style = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="input-field"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          paddingLeft: 14,
          paddingRight: 14,
          userSelect: 'none',
          borderColor: isOpen ? 'var(--cyan)' : 'var(--input-border)',
          boxShadow: isOpen ? '0 0 0 3px rgba(79, 214, 232, 0.12)' : 'none',
        }}
      >
        <span style={{ color: selectedOption ? 'var(--text)' : 'var(--text-faint)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.svg 
          animate={{ rotate: isOpen ? 180 : 0 }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--text-faint)' }}
        >
          <path d="M6 9l6 6 6-6"/>
        </motion.svg>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 8,
              background: 'var(--card)',
              border: '1px solid var(--card-border)',
              borderRadius: 12,
              padding: '6px',
              zIndex: 50,
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
              transformOrigin: 'top'
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: value === opt.value ? 'var(--bg-hover)' : 'transparent',
                  color: value === opt.value ? 'var(--cyan)' : 'var(--text)',
                  fontWeight: value === opt.value ? 600 : 400,
                  transition: 'background 0.2s, color 0.2s'
                }}
                onMouseEnter={e => {
                  if (value !== opt.value) {
                    e.currentTarget.style.background = 'var(--input-bg)';
                  }
                }}
                onMouseLeave={e => {
                  if (value !== opt.value) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {opt.label}
                {value === opt.value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
