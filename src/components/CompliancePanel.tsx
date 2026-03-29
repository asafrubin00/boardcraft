'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ComplianceError } from '@/types/game';

interface CompliancePanelProps {
  errors: ComplianceError[];
}

export default function CompliancePanel({ errors }: CompliancePanelProps) {
  const hasErrors = errors.some((e) => e.severity === 'error');
  const hasWarnings = errors.some((e) => e.severity === 'warning');

  return (
    <div className="rounded-lg bg-card-bg border border-card-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        FRC Code Compliance
      </h3>

      <AnimatePresence mode="wait">
        {errors.length === 0 ? (
          <motion.div
            key="compliant"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex items-center gap-2 px-3 py-2 rounded bg-success/15 border border-success/30"
          >
            <svg
              className="w-4 h-4 text-success flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-success font-medium">Board Compliant</span>
          </motion.div>
        ) : (
          <motion.div
            key="errors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {errors.map((err, i) => (
              <motion.div
                key={err.code}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-2 px-3 py-2 rounded text-sm ${
                  err.severity === 'error'
                    ? 'bg-error/10 border border-error/30'
                    : 'bg-warning/10 border border-warning/30'
                }`}
              >
                {err.severity === 'error' ? (
                  <svg
                    className="w-4 h-4 text-error flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-warning flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M10.29 3.86l-8.6 14.86A1 1 0 002.54 20h17.92a1 1 0 00.85-1.28l-8.6-14.86a1 1 0 00-1.7 0z"
                    />
                  </svg>
                )}
                <span
                  className={
                    err.severity === 'error' ? 'text-error' : 'text-warning'
                  }
                >
                  {err.message}
                </span>
              </motion.div>
            ))}

            {hasErrors && (
              <p className="text-xs text-error/70 mt-1 pl-1">
                Errors must be resolved before locking the board.
              </p>
            )}
            {!hasErrors && hasWarnings && (
              <p className="text-xs text-warning/70 mt-1 pl-1">
                Warnings will not prevent board lock.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
