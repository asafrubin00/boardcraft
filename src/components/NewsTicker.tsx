'use client';

import type { NewsHeadline } from '@/hooks/useNewsTicker';

interface NewsTickerProps {
  headlines: NewsHeadline[];
}

export default function NewsTicker({ headlines }: NewsTickerProps) {
  if (headlines.length === 0) return null;

  // Single long string of all headlines joined by centred dot
  const tickerText = headlines.map((h) => h.text).join(' \u00b7 ');

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center overflow-hidden select-none"
      style={{ height: 40, backgroundColor: '#080F1A' }}
    >
      {/* LIVE badge - fixed, does not scroll */}
      <div
        className="shrink-0 flex items-center gap-1 px-3 h-full z-10"
        style={{ backgroundColor: '#080F1A' }}
      >
        <span
          className="inline-block rounded font-bold tracking-wider px-2 py-1 leading-none"
          style={{ fontSize: '11px', backgroundColor: '#C8960C', color: '#080F1A' }}
        >
          LIVE
        </span>
      </div>

      {/* Scrolling headlines - pauses on hover */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center news-ticker-area">
        <div
          className="news-ticker-text whitespace-nowrap text-foreground/60"
          style={{ fontSize: '13px' }}
        >
          {tickerText}
        </div>
      </div>

      <style jsx>{`
        .news-ticker-area:hover .news-ticker-text {
          animation-play-state: paused;
        }
        .news-ticker-text {
          display: inline-block;
          animation: news-ticker-slide 45s linear infinite;
        }
        @keyframes news-ticker-slide {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
