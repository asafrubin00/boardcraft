'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCareerStats, getCareerTitle, getLeaderboard, clearLeaderboard, type LeaderboardEntry } from '@/engine/governanceCapital';
import ErrorBoundary from '@/components/ErrorBoundary';

function LeaderboardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) setEntries(getLeaderboard());
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-navy border border-card-border rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-narrative font-bold text-gold">Leaderboard</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground text-xl">&times;</button>
        </div>

        {entries.length === 0 ? (
          <p className="text-foreground/50 text-center py-8 italic">No completed games yet. Play your first game to see results here.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left text-foreground/50 font-medium py-2 pr-2">#</th>
                <th className="text-left text-foreground/50 font-medium py-2 pr-3">Company</th>
                <th className="text-right text-foreground/50 font-medium py-2 pr-3">SV</th>
                <th className="text-right text-foreground/50 font-medium py-2 pr-3">GH</th>
                <th className="text-left text-foreground/50 font-medium py-2 pr-3">Title</th>
                <th className="text-right text-foreground/50 font-medium py-2 pr-3">Events</th>
                <th className="text-right text-foreground/50 font-medium py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.id} className="border-b border-card-border/30">
                  <td className="py-2 pr-2 font-bold text-foreground/60">{i + 1}</td>
                  <td className="py-2 pr-3 text-foreground">{entry.companyName}</td>
                  <td className={`text-right py-2 pr-3 font-bold ${entry.finalSv > 100 ? 'text-success' : entry.finalSv >= 80 ? 'text-gold' : 'text-error'}`}>{entry.finalSv}</td>
                  <td className={`text-right py-2 pr-3 ${entry.governanceHealth >= 70 ? 'text-success' : entry.governanceHealth >= 40 ? 'text-warning' : 'text-error'}`}>{entry.governanceHealth}</td>
                  <td className="py-2 pr-3 text-foreground/70 text-xs">{entry.careerTitle}</td>
                  <td className="text-right py-2 pr-3 text-foreground/60">{entry.eventsResolved}</td>
                  <td className="text-right py-2 text-foreground/40 text-xs">{new Date(entry.datePlayed).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between mt-6">
          <button onClick={onClose} className="text-sm text-foreground/50 hover:text-foreground transition-colors">&larr; Back</button>
          {entries.length > 0 && (
            showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-error">Clear all history?</span>
                <button onClick={() => { clearLeaderboard(); setEntries([]); setShowClearConfirm(false); }} className="text-xs bg-error/20 text-error px-3 py-1 rounded hover:bg-error/30">Yes, clear</button>
                <button onClick={() => setShowClearConfirm(false)} className="text-xs text-foreground/50 px-3 py-1 rounded hover:text-foreground">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowClearConfirm(true)} className="text-xs text-foreground/30 hover:text-error transition-colors">Clear History</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function HomeInner() {
  const [mounted, setMounted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [careerGc, setCareerGc] = useState(0);

  useEffect(() => {
    setMounted(true);
    const stats = getCareerStats();
    setCareerGc(stats.totalGc);
  }, []);

  return (
    <div className="relative min-h-screen bg-navy flex flex-col items-center justify-center text-foreground overflow-hidden">
      {/* Animated background — slow-moving diagonal lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              135deg,
              transparent,
              transparent 80px,
              rgba(42, 85, 128, 0.06) 80px,
              rgba(42, 85, 128, 0.06) 81px
            )`,
            backgroundSize: '113px 113px',
            animation: 'bgSlide 30s linear infinite',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 120px,
              rgba(200, 150, 12, 0.03) 120px,
              rgba(200, 150, 12, 0.03) 121px
            )`,
            backgroundSize: '170px 170px',
            animation: 'bgSlide2 45s linear infinite',
          }}
        />
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes bgSlide {
          from { transform: translate(0, 0); }
          to { transform: translate(113px, 113px); }
        }
        @keyframes bgSlide2 {
          from { transform: translate(0, 0); }
          to { transform: translate(-170px, 170px); }
        }
      `}</style>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <h1
          className="text-6xl md:text-7xl font-bold text-gold tracking-[0.3em] mb-6 opacity-0"
          style={{
            fontFamily: 'Georgia, serif',
            animation: 'fadeInUp 1s ease-out 0.3s forwards',
          }}
        >
          BOARDCRAFT
        </h1>

        {/* Tagline */}
        <p
          className="font-narrative text-lg md:text-xl text-foreground/80 mb-2 max-w-2xl text-center opacity-0 leading-relaxed"
          style={{ animation: 'fadeInUp 1s ease-out 0.8s forwards' }}
        >
          The corporate governance strategy game.
        </p>
        <p
          className="font-narrative text-sm md:text-base text-foreground/50 mb-14 max-w-lg text-center opacity-0"
          style={{ animation: 'fadeInUp 1s ease-out 1.1s forwards' }}
        >
          Build your board. Navigate the crises. Maximise shareholder value.
        </p>

        {/* CTA */}
        <div
          className="flex flex-col items-center gap-4 opacity-0"
          style={{ animation: 'fadeInUp 0.8s ease-out 1.5s forwards' }}
        >
          <Link
            href="/play"
            className="px-14 py-5 bg-gold text-navy-dark font-bold text-xl rounded-lg hover:bg-gold-light transition-all active:scale-[0.97] shadow-lg shadow-gold/20"
          >
            Start Playing
          </Link>

          <button
            onClick={() => setShowLeaderboard(true)}
            className="px-8 py-2 rounded-lg border border-gold/30 text-gold/80 text-sm font-semibold hover:bg-gold/10 hover:text-gold transition-colors"
          >
            Leaderboard
          </button>
        </div>

      </div>

      {/* Version badge */}
      <div className="absolute bottom-4 right-4 text-foreground/20 text-xs">
        v0.1 prototype
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeInner />
    </ErrorBoundary>
  );
}
