import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', level: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak — add uppercase, numbers & symbols', level: 'weak' };
  if (score <= 2) return { score: 2, label: 'Fair — getting better', level: 'fair' };
  if (score <= 3) return { score: 3, label: 'Good — strong password', level: 'good' };
  return { score: 4, label: 'Strong — excellent security', level: 'strong' };
}

export default function PasswordField({ value, onChange, label = 'Password', placeholder = 'Enter password' }) {
  const [focused, setFocused] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const strength = getPasswordStrength(value);

  useEffect(() => {
    if (value) {
      setTyping(true);
      const t = setTimeout(() => setTyping(false), 300);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className={`input-group password-wrapper password-typing ${typing ? 'active' : ''}`}>
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <motion.input
          type={showPassword ? "text" : "password"}
          className="input-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          animate={typing ? { scale: [1, 1.01, 1] } : {}}
          transition={{ duration: 0.2 }}
          style={{ paddingRight: 40 }}
        />
        <button 
          type="button" 
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {(focused || value) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0 }}
        >
          <div className="password-strength">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`strength-bar ${i <= strength.score ? `active ${strength.level}` : ''}`}
              />
            ))}
          </div>
          <motion.p
            className="strength-label"
            style={{
              color: strength.level === 'weak' ? '#ef4444'
                : strength.level === 'fair' ? '#f59e0b'
                : strength.level === 'good' ? '#14b8a6' : '#22c55e',
            }}
            key={strength.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {strength.label}
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
