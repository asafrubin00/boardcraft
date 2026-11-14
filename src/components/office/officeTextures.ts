/** Canvas-drawn surfaces for the office: folder covers, the page inside, the laptop screen. */

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

function goldFill(ctx: CanvasRenderingContext2D, y0: number, y1: number): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#f3d98a');
  g.addColorStop(0.5, '#c8960c');
  g.addColorStop(1, '#e8c468');
  return g;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export interface CoverInfo {
  name: string;
  /** e.g. "UK · UK Corporate Governance Code" */
  regime: string;
  logo: HTMLImageElement | null;
  sealed: boolean;
}

/** Navy leather portfolio cover with the company mark in gold foil. */
export function drawCover(info: CoverInfo): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 1014;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const g = ctx.createLinearGradient(0, 0, 768, 1014);
  g.addColorStop(0, '#16294a');
  g.addColorStop(1, '#0d1a30');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 768, 1014);

  // Stitched border
  ctx.strokeStyle = 'rgba(200,150,12,0.55)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 9]);
  ctx.strokeRect(34, 34, 700, 946);
  ctx.setLineDash([]);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(232,196,104,0.75)';
  ctx.font = `600 24px ${SANS}`;
  ctx.fillText(info.sealed ? 'S E A L E D' : 'B O A R D   F I L E', 384, 110);

  if (info.logo) {
    ctx.drawImage(info.logo, 384 - 130, 190, 260, 260);
  } else {
    ctx.strokeStyle = goldFill(ctx, 190, 450);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(384, 320, 120, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = goldFill(ctx, 260, 380);
    ctx.font = `700 130px ${SERIF}`;
    ctx.fillText('?', 384, 366);
  }

  ctx.fillStyle = goldFill(ctx, 540, 720);
  ctx.font = `700 70px ${SERIF}`;
  const lines = wrap(ctx, info.name, 620).slice(0, 3);
  lines.forEach((l, i) => ctx.fillText(l, 384, 590 + i * 82));

  const ruleY = 590 + lines.length * 82 - 20;
  ctx.fillStyle = 'rgba(200,150,12,0.7)';
  ctx.fillRect(384 - 70, ruleY, 140, 3);

  ctx.fillStyle = 'rgba(241,233,217,0.82)';
  ctx.font = `500 30px ${SANS}`;
  wrap(ctx, info.regime, 620).slice(0, 2).forEach((l, i) => ctx.fillText(l, 384, ruleY + 62 + i * 40));

  ctx.fillStyle = 'rgba(232,196,104,0.5)';
  ctx.font = `600 20px ${SANS}`;
  ctx.fillText(info.sealed ? 'C O M I N G   S O O N' : 'P R I V A T E   &   C O N F I D E N T I A L', 384, 940);
  return c;
}

/** The sheet inside the folder — only glimpsed while the cover swings open. */
export function drawPage(name: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 680;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  ctx.fillStyle = '#f3ecdc';
  ctx.fillRect(0, 0, 512, 680);
  ctx.fillStyle = '#1b2430';
  ctx.font = `700 13px ${SANS}`;
  ctx.fillText('B O A R D   F I L E', 44, 62);
  ctx.fillRect(44, 76, 424, 2);
  ctx.font = `700 34px ${SERIF}`;
  wrap(ctx, name, 420).slice(0, 2).forEach((l, i) => ctx.fillText(l, 44, 130 + i * 40));
  ctx.fillStyle = 'rgba(27,36,48,0.22)';
  for (let y = 230; y < 620; y += 22) ctx.fillRect(44, y, y % 110 === 10 ? 300 : 424, 5);
  return c;
}

/**
 * Laptop screen. `boot` runs 0→1 while the machine wakes; the end state is
 * the board-construction screen's own header on its own background colour, so
 * the zoom into the screen cuts cleanly to the real page.
 */
export function drawScreen(canvas: HTMLCanvasElement, companyName: string, boot: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#081220');
  g.addColorStop(0.45, '#0b1a2d');
  g.addColorStop(1, '#060d18');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const a = Math.min(1, boot * 2.2);
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.fillStyle = goldFill(ctx, h * 0.34, h * 0.46);
  ctx.font = `700 ${Math.round(h * 0.11)}px ${SERIF}`;
  // Letter-spaced wordmark
  const word = 'BOARDCRAFT';
  const spacing = h * 0.035;
  const widths = [...word].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((s, x) => s + x, 0) + spacing * (word.length - 1);
  let x = w / 2 - total / 2;
  ctx.textAlign = 'left';
  [...word].forEach((ch, i) => { ctx.fillText(ch, x, h * 0.44); x += widths[i] + spacing; });
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(200,150,12,0.8)';
  ctx.fillRect(w / 2 - h * 0.09, h * 0.5, h * 0.18, 2);
  ctx.fillStyle = 'rgba(241,233,217,0.85)';
  ctx.font = `400 ${Math.round(h * 0.042)}px ${SERIF}`;
  ctx.fillText(`Board Construction — ${companyName}`, w / 2, h * 0.585);

  // Progress bar
  const bw = w * 0.34;
  const bx = w / 2 - bw / 2;
  const by = h * 0.68;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(bx, by, bw, 6);
  ctx.fillStyle = '#e0b044';
  ctx.fillRect(bx, by, bw * Math.min(1, Math.max(0, (boot - 0.15) / 0.8)), 6);
  ctx.fillStyle = 'rgba(241,233,217,0.45)';
  ctx.font = `500 ${Math.round(h * 0.026)}px ${SANS}`;
  ctx.fillText('Opening the board file…', w / 2, by + h * 0.06);
  ctx.globalAlpha = 1;
}
