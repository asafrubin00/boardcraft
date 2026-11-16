'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MAP, LAND_ROWS } from './landDots';
import CompanyLogo from '@/components/CompanyLogo';
import { playCardDeal, playPaperSlide } from '@/engine/soundEngine';
import './worldmap.css';

export interface MapPin {
  id: string;
  name: string;
  place: string;
  lat: number;
  lon: number;
  /** Lines shown in the bubble, most important first. */
  lines: string[];
  hook: string;
  sealed?: boolean;
  recommended?: boolean;
  /** Put the place label to the left of the pin (for neighbours that would collide). */
  labelLeft?: boolean;
}

const CELL = 8;
const W = MAP.cols * CELL;
const H = MAP.rows * CELL;
const px = (lon: number) => ((lon + 180) / 360) * W;
const py = (lat: number) => ((MAP.latTop - lat) / (MAP.latTop - MAP.latBottom)) * H;

/**
 * The world as the Board Adviser sees it: a dotted map with one lit pin per
 * file on the desk. Hover a pin for the brief, click to open the file.
 */
export default function WorldMap({ pins, onPick, onClose }: { pins: MapPin[]; onPick: (id: string) => void; onClose: () => void }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    playPaperSlide();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dots = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    LAND_ROWS.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) if (row[c] === '1') out.push({ x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 });
    });
    return out;
  }, []);

  const pin = pins.find((p) => p.id === active) ?? null;
  // Keep the bubble on the map: flip it to the other side near an edge.
  const bx = pin ? px(pin.lon) / W : 0;
  const by = pin ? py(pin.lat) / H : 0;

  return (
    <motion.div className="wm-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} role="dialog" aria-label="World map">
      <header className="wm-top">
        <div>
          <p className="wm-over">BoardCraft · the files on your desk</p>
          <h2 className="wm-title">Where the boards are</h2>
        </div>
        <button className="wm-close" onClick={onClose}>Back to your desk ✕</button>
      </header>

      <div className="wm-stage">
        <div className="wm-map" onMouseLeave={() => setActive(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} className="wm-svg" aria-hidden>
            <defs>
              <radialGradient id="wm-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#E8C766" stopOpacity="0.55" />
                <stop offset="1" stopColor="#E8C766" stopOpacity="0" />
              </radialGradient>
            </defs>
            {[-120, -60, 0, 60, 120].map((lon) => <line key={lon} x1={px(lon)} x2={px(lon)} y1={0} y2={H} className="wm-grat" />)}
            {[60, 30, 0, -30].map((lat) => <line key={lat} x1={0} x2={W} y1={py(lat)} y2={py(lat)} className="wm-grat" />)}
            {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={2.1} className="wm-dot" />)}
            {/* Lines from every file to the one under the cursor */}
            {pin && pins.filter((p) => p.id !== pin.id && !p.sealed).map((p) => (
              <line key={p.id} x1={px(pin.lon)} y1={py(pin.lat)} x2={px(p.lon)} y2={py(p.lat)} className="wm-link" />
            ))}
            {pins.map((p) => (
              <circle key={p.id} cx={px(p.lon)} cy={py(p.lat)} r={active === p.id ? 46 : 30} fill="url(#wm-glow)" opacity={p.sealed ? 0.25 : 1} style={{ transition: 'r .25s' }} />
            ))}
          </svg>

          {pins.map((p, i) => (
            <motion.button
              key={p.id}
              className={`wm-pin ${p.sealed ? 'wm-pin-sealed' : ''} ${active === p.id ? 'wm-pin-on' : ''}`}
              style={{ left: `${(px(p.lon) / W) * 100}%`, top: `${(py(p.lat) / H) * 100}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.09, type: 'spring', stiffness: 300, damping: 16 }}
              onMouseEnter={() => { if (active !== p.id) { setActive(p.id); playCardDeal(); } }}
              onFocus={() => setActive(p.id)}
              onClick={() => { if (active !== p.id) { setActive(p.id); return; } if (!p.sealed) onPick(p.id); }}
              aria-label={`${p.name}, ${p.place}`}
            >
              <span className="wm-ring" />
              <span className="wm-core" />
              <span className={`wm-name ${p.labelLeft ? 'wm-name-left' : ''}`}>{p.sealed ? '?' : p.place}</span>
            </motion.button>
          ))}

          {pin && (
            <motion.div
              key={pin.id}
              className="wm-bubble"
              style={{
                left: `${bx * 100}%`, top: `${by * 100}%`,
                transform: `translate(${bx > 0.62 ? 'calc(-100% - 26px)' : '26px'}, ${by > 0.55 ? 'calc(-100% + 18px)' : '-18px'})`,
              }}
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.16 }}
            >
              <div className="flex items-center gap-2.5">
                {!pin.sealed && <CompanyLogo companyId={pin.id} size={34} />}
                <div className="min-w-0">
                  <p className="wm-b-name">{pin.name}</p>
                  <p className="wm-b-place">{pin.place}</p>
                </div>
              </div>
              <p className="wm-b-hook">{pin.hook}</p>
              {pin.lines.length > 0 && (
                <ul className="wm-b-lines">
                  {pin.lines.map((l) => <li key={l}>{l}</li>)}
                </ul>
              )}
              {pin.recommended && <p className="wm-b-rec">Recommended for you</p>}
              {pin.sealed ? (
                <p className="wm-b-sealed">Sealed · coming soon</p>
              ) : (
                <button className="wm-b-open" onClick={() => onPick(pin.id)}>Open the file →</button>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <p className="wm-foot">Hover a light for the brief. Click it to open the file.</p>
    </motion.div>
  );
}
