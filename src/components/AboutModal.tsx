'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When true, shows "Start Playing" + "Dismiss" buttons. When false, shows only "Close". */
  showNavButtons?: boolean;
  onStartPlaying?: () => void;
}

export default function AboutModal({ isOpen, onClose, showNavButtons = false, onStartPlaying }: AboutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-navy border border-gold/30 rounded-xl p-8 w-full max-w-[560px] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-2xl font-bold text-gold mb-6"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Welcome to BoardCraft
            </h2>

            <div className="space-y-4 mb-8" style={{ fontFamily: 'Georgia, serif' }}>
              <p className="text-sm text-foreground/80 leading-relaxed">
                BoardCraft is a corporate governance strategy game. You build and manage the non-executive board of a fictional listed company, navigate real-world crises, and compete to maximise shareholder value. Every decision &mdash; which directors to appoint, which strategies to deploy, how to handle activists and proxy advisers &mdash; reflects how governance actually works in practice.
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                The mechanics are grounded in real governance codes: the UK FRC Corporate Governance Code, US NYSE/SEC listing standards, and German co-determination rules. Whether you&rsquo;re a governance professional, a finance student, or just curious about how boards actually work &mdash; this is the game for you.
              </p>
            </div>

            {showNavButtons ? (
              <div className="flex gap-3">
                <button
                  onClick={() => { onClose(); onStartPlaying?.(); }}
                  className="flex-1 py-2.5 rounded-lg bg-gold text-navy-dark font-semibold hover:bg-gold-light transition-colors"
                >
                  Start Playing
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg border border-card-border text-foreground/70 hover:border-gold/50 hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-lg border border-card-border text-foreground/70 hover:border-gold/50 hover:text-foreground transition-colors"
              >
                Close
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
