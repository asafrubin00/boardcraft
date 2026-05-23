'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface HintModalProps {
  /** Optional title shown in gold serif above the body text */
  title?: string;
  /** Main hint content */
  body: string;
  /** Called when the user clicks "Got it" */
  onDismiss: () => void;
}

/**
 * Large centred hint overlay — replaces the previous small bottom-anchored
 * tooltip bubbles. Animates in with a scale + fade (0.9 → 1.0).
 */
export default function HintModal({ title, body, onDismiss }: HintModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        key="hint-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
        }}
        // clicking the backdrop also dismisses
        onClick={onDismiss}
      >
        <motion.div
          key="hint-card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1.0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#0D1B2A',
            border: '2px solid #C8960C',
            borderRadius: '12px',
            padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 40px) clamp(20px, 4vw, 32px)',
            minWidth: 'min(480px, calc(100vw - 32px))',
            maxWidth: '600px',
            width: '90vw',
            boxShadow: '0 24px 64px rgba(0,0,0,0.60)',
          }}
        >
          {title && (
            <h3
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#C8960C',
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '16px',
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>
          )}
          <p
            style={{
              fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
              color: '#E8E0D0',
              fontSize: '15px',
              lineHeight: 1.65,
              marginBottom: '28px',
            }}
          >
            {body}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onDismiss}
              style={{
                background: '#C8960C',
                color: '#0D1B2A',
                fontWeight: 700,
                fontSize: '14px',
                padding: '10px 28px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif",
                letterSpacing: '0.02em',
              }}
            >
              Got it
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
