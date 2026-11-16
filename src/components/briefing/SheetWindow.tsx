'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { playPaperSlide } from '@/engine/soundEngine';
import './briefing.css';

/**
 * A window that rises from the foot of the screen. Shared shell for the
 * company briefing and the board-strength dashboard. Rendered in a portal so
 * it sits above whatever panel or slide-in opened it.
 */
export default function SheetWindow({
  isOpen,
  onClose,
  overline,
  title,
  lead,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  overline: string;
  title: string;
  /** Sits before the title, e.g. a logo */
  lead?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    playPaperSlide();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="bw-root" role="dialog" aria-label={title}>
          <motion.div className="bw-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose} />
          <motion.div
            className="bw-window"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 240, damping: 30 }}
          >
            <div className="bw-grip" />
            <header className="bw-head">
              {lead}
              <div className="min-w-0">
                <p className="bw-over">{overline}</p>
                <h2 className="bw-title truncate">{title}</h2>
              </div>
              <button className="bw-close" onClick={onClose}>Close ✕</button>
            </header>
            <div className="bw-body">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
