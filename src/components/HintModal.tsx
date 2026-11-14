'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './boardbuild/boardbuild.css';
import { playPaperSlide } from '@/engine/soundEngine';

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
  // A note arriving on the desk
  useEffect(() => { playPaperSlide(); }, [body]);
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
          background: 'rgba(0,0,0,0.55)',
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
          className="bc-paper"
          style={{
            borderRadius: '3px',
            padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 40px) clamp(20px, 4vw, 32px)',
            minWidth: 'min(480px, calc(100vw - 32px))',
            maxWidth: '600px',
            width: '90vw',
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4a5565', paddingBottom: 10, marginBottom: 16, borderBottom: '2px solid #1b2430' }}>
            Note from the company secretary
          </p>
          {title && (
            <h3
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#1b2430',
                fontSize: '22px',
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
              fontFamily: 'Georgia, "Times New Roman", serif',
              color: '#1b2430',
              fontSize: '16px',
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
                background: '#1a3a5c',
                color: '#f3ecdc',
                boxShadow: '0 6px 14px -6px rgba(26,58,92,0.8)',
                fontWeight: 700,
                fontSize: '14px',
                padding: '10px 28px',
                borderRadius: '3px',
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
