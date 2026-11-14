'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import CompanyLogo from '../CompanyLogo';
import {
  playDirectorSelect, playPaperSlide, playPageTurn, playFolderOpen, playFootstep, playDoorOpen,
  playLaptopBoot, playZoomWhoosh, startOfficeAmbience, stopOfficeAmbience,
} from '@/engine/soundEngine';
import { buildOffice, ROOM, SEAT, SEAT_LOOK, type FolderSpec, type OfficeHandles } from './buildOffice';
import { drawCover, drawPage, drawScreen } from './officeTextures';
import { Tweens, ease } from './tween';
import './office.css';

export interface OfficeFolder {
  id: string;
  name: string;
  /** e.g. "UK · UK Corporate Governance Code" */
  regime: string;
  sealed: boolean;
  recommended: boolean;
}

interface OfficeSceneProps {
  folders: OfficeFolder[];
  /** Skip the walk-in and start at the desk (returning players, reduced motion) */
  skipIntro: boolean;
  /** The company sheet shown once a folder is open */
  renderPaper: (folderId: string, actions: { onStart: () => void; onBack: () => void }) => ReactNode;
  /** Fired once the laptop zoom has finished */
  onLaunch: (folderId: string) => void;
  onListView: () => void;
  /** Fired when the camera first settles at the desk */
  onSeated?: () => void;
  /** WebGL could not start — the caller should fall back to the list */
  onUnsupported: () => void;
}

type Phase = 'loading' | 'door' | 'walk' | 'seated' | 'roam' | 'busy' | 'reading' | 'launch';

const HINT: Record<Phase, string> = {
  loading: '',
  door: '',
  walk: '',
  seated: 'Six files on your desk. Pick a company.',
  roam: 'W A S D to walk · drag to look',
  busy: '',
  reading: '',
  launch: '',
};

function yawPitch(from: THREE.Vector3, to: THREE.Vector3): { yaw: number; pitch: number } {
  const d = to.clone().sub(from).normalize();
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) };
}

function quatFromYawPitch(yaw: number, pitch: number): THREE.Quaternion {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
}

/** Serialise a rendered inline SVG logo into an image the canvas can draw. */
function svgToImage(svg: SVGElement): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    try {
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    } catch {
      resolve(null);
    }
  });
}

export default function OfficeScene({ folders, skipIntro, renderPaper, onLaunch, onListView, onSeated, onUnsupported }: OfficeSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [progress, setProgress] = useState(0);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [veil, setVeil] = useState(1);

  // The render loop lives outside React; these refs are its control surface.
  const api = useRef<{
    skip: () => void;
    back: () => void;
    start: () => void;
    toDesk: () => void;
  } | null>(null);

  // Latest callbacks/props without re-running the scene effect
  const cb = useRef({ onLaunch, onSeated, onUnsupported });
  useEffect(() => { cb.current = { onLaunch, onSeated, onUnsupported }; });
  const foldersRef = useRef(folders);
  const skipIntroRef = useRef(skipIntro);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let raf = 0;
    let office: OfficeHandles | null = null;
    let composer: EffectComposer | null = null;
    const tweens = new Tweens();
    const specs = foldersRef.current;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch {
      cb.current.onUnsupported();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;

    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.03, 600);
    camera.rotation.order = 'YXZ';

    // ── Control state ──
    const S = {
      phase: 'loading' as Phase,
      // seated look: mouse position nudges the view, dragging turns it further
      mx: 0, my: 0,
      lookYaw: 0, lookPitch: 0,
      dragYaw: 0, dragPitch: 0,
      // roam
      yaw: 0, pitch: 0,
      keys: new Set<string>(),
      // pointer
      ndc: new THREE.Vector2(0, 0),
      pointerInside: false,
      down: null as null | { x: number; y: number; moved: boolean },
      hover: -1,
      // camera is script-driven while true
      scripted: true,
      walkT: 0,
      // dev/test only: run scripted motion faster than real time
      timeScale: 1,
    };
    const setP = (p: Phase) => { S.phase = p; setPhase(p); };
    // Read through a function so TypeScript doesn't narrow across awaits
    const at = (p: Phase) => S.phase === p;
    const base = yawPitch(SEAT, SEAT_LOOK);

    const walkPos = new THREE.CatmullRomCurve3([
      new THREE.Vector3(5.25, 1.62, 0.25),
      new THREE.Vector3(3.3, 1.62, 0.3),
      new THREE.Vector3(1.9, 1.62, 1.25),
      new THREE.Vector3(0.2, 1.62, 1.75),
      new THREE.Vector3(-1.45, 1.6, 0.85),
      new THREE.Vector3(-1.75, 1.55, -1.2),
      new THREE.Vector3(-0.9, 1.42, -2.1),
      SEAT.clone(),
    ], false, 'catmullrom', 0.5);
    const walkLook = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.5, 0.6),
      new THREE.Vector3(-1, 1.5, 2.6),
      new THREE.Vector3(-1.5, 1.7, 6.5),
      new THREE.Vector3(0.2, 1.9, 9),
      new THREE.Vector3(1.6, 1.4, 5),
      new THREE.Vector3(0.6, 1.0, 0.4),
      new THREE.Vector3(0.3, 0.85, -0.7),
      SEAT_LOOK.clone(),
    ], false, 'catmullrom', 0.5);

    const placeAtSeat = () => {
      camera.position.copy(SEAT);
      camera.quaternion.copy(quatFromYawPitch(base.yaw, base.pitch));
      S.lookYaw = S.lookPitch = S.dragYaw = S.dragPitch = 0;
    };

    const seated = () => {
      S.scripted = false;
      setP('seated');
      try { localStorage.setItem('boardcraft_office_seen', '1'); } catch { /* private mode */ }
      cb.current.onSeated?.();
    };

    const reveal = (from: number, dur: number) => tweens.run(dur, (k) => setVeil(from * (1 - k)), ease.out);

    const runIntro = async () => {
      if (!office) return;
      if (skipIntroRef.current) {
        office.doorPivot.rotation.y = 1.75;
        placeAtSeat();
        await reveal(1, 0.9);
        seated();
        return;
      }
      setP('door');
      camera.position.copy(walkPos.getPoint(0));
      camera.lookAt(walkLook.getPoint(0));
      await reveal(1, 0.7);
      if (disposed || !at('door')) return;
      const door = office.doorPivot;
      playDoorOpen();
      tweens.run(1.5, (k) => { door.rotation.y = 1.75 * k; }, ease.inOut);
      await tweens.wait(0.7);
      if (disposed || !at('door')) return;
      setP('walk');
      await tweens.run(9, (k) => {
        if (!at('walk')) return;
        S.walkT = k;
        // one footfall per half-cycle of the bob, until you're nearly seated
        const step = Math.floor((k * 44) / Math.PI);
        if (step !== lastStep && k < 0.93) { lastStep = step; playFootstep(step % 2 ? 1 : -1); }
        const p = walkPos.getPoint(k);
        // footfall: a small bob that fades out as you sit
        p.y += Math.sin(k * 44) * 0.012 * (1 - k);
        camera.position.copy(p);
        camera.lookAt(walkLook.getPoint(k));
      }, ease.inOut);
      if (disposed || !at('walk')) return;
      placeAtSeat();
      seated();
    };

    const skip = async () => {
      if (S.phase !== 'door' && S.phase !== 'walk') return;
      setP('busy');
      tweens.clear();
      await tweens.run(0.3, (k) => setVeil(k), ease.inOut);
      if (disposed || !office) return;
      office.doorPivot.rotation.y = 1.75;
      placeAtSeat();
      await reveal(1, 0.6);
      seated();
    };

    /** Camera back to the chair from wherever it has wandered. */
    const returnToSeat = async (dur = 0.9) => {
      S.scripted = true;
      const p0 = camera.position.clone();
      const q0 = camera.quaternion.clone();
      const q1 = quatFromYawPitch(base.yaw, base.pitch);
      await tweens.run(dur, (k) => {
        camera.position.lerpVectors(p0, SEAT, k);
        camera.quaternion.slerpQuaternions(q0, q1, k);
      }, ease.inOut);
      S.lookYaw = S.lookPitch = S.dragYaw = S.dragPitch = 0;
    };

    // Pose a folder is held at while it's being read: square to the camera
    const readingPose = () => {
      const q = quatFromYawPitch(base.yaw, base.pitch - 0.03);
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
      const pos = SEAT.clone().addScaledVector(fwd, 0.6).addScaledVector(up, -0.005);
      const m = new THREE.Matrix4().makeBasis(right, fwd.clone().negate(), up.clone().negate());
      return { camQuat: q, pos, quat: new THREE.Quaternion().setFromRotationMatrix(m) };
    };

    let active = -1;
    let lastStep = -1;
    let roamStepAt = 0;

    const openFolder = async (i: number) => {
      if (!office) return;
      const f = office.folders[i];
      if (f.sealed) {
        playDirectorSelect();
        setToast(`${specs[i].name} — coming soon`);
        const y0 = f.group.rotation.y;
        tweens.run(0.5, (k) => { f.group.rotation.y = y0 + Math.sin(k * Math.PI * 4) * 0.05 * (1 - k); }, ease.linear);
        window.setTimeout(() => setToast(null), 2200);
        return;
      }
      setP('busy');
      setHoverId(null);
      S.hover = -1;
      canvas.style.cursor = 'default';
      playFolderOpen();
      if (camera.position.distanceTo(SEAT) > 0.05) await returnToSeat(0.9);
      S.scripted = true;
      active = i;
      const pose = readingPose();
      const q0 = camera.quaternion.clone();
      const p0 = f.group.position.clone();
      const fq0 = f.group.quaternion.clone();
      await tweens.run(0.85, (k) => {
        camera.quaternion.slerpQuaternions(q0, pose.camQuat, k);
        f.group.position.lerpVectors(p0, pose.pos, k);
        f.group.position.y += Math.sin(k * Math.PI) * 0.06;
        f.group.quaternion.slerpQuaternions(fq0, pose.quat, k);
      }, ease.inOut);
      await tweens.run(0.6, (k) => { f.coverPivot.rotation.z = 2.95 * k; }, ease.inOut);
      if (disposed) return;
      setOpenId(f.id);
      setP('reading');
    };

    const putBack = async (i: number) => {
      if (!office) return;
      const f = office.folders[i];
      const z0 = f.coverPivot.rotation.z;
      await tweens.run(0.4, (k) => { f.coverPivot.rotation.z = z0 * (1 - k); }, ease.inOut);
      const p0 = f.group.position.clone();
      const fq0 = f.group.quaternion.clone();
      await tweens.run(0.6, (k) => {
        f.group.position.lerpVectors(p0, f.home.pos, k);
        f.group.position.y += Math.sin(k * Math.PI) * 0.05;
        f.group.quaternion.slerpQuaternions(fq0, f.home.quat, k);
      }, ease.inOut);
    };

    const back = async () => {
      if (S.phase !== 'reading' || active < 0) return;
      setP('busy');
      setOpenId(null);
      playPaperSlide();
      const i = active;
      const q0 = camera.quaternion.clone();
      const q1 = quatFromYawPitch(base.yaw, base.pitch);
      tweens.run(0.9, (k) => camera.quaternion.slerpQuaternions(q0, q1, k), ease.inOut);
      await putBack(i);
      active = -1;
      S.scripted = false;
      setP('seated');
    };

    const start = async () => {
      if (S.phase !== 'reading' || active < 0 || !office) return;
      setP('launch');
      setOpenId(null);
      const i = active;
      const lap = office.laptop;
      const name = specs[i].name;
      playPageTurn();

      // Turn to the laptop while the folder goes back to its place
      const lapCentre = lap.group.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.1, 0));
      const look = yawPitch(SEAT, lapCentre);
      const q0 = camera.quaternion.clone();
      const qLap = quatFromYawPitch(look.yaw, look.pitch);
      tweens.run(1.0, (k) => camera.quaternion.slerpQuaternions(q0, qLap, k), ease.inOut, 0.25);
      await putBack(i);
      active = -1;

      // Lid up, screen on
      playLaptopBoot();
      tweens.run(0.95, (k) => { lap.lidPivot.rotation.x = -1.83 * k; }, ease.inOut);
      tweens.run(0.7, (k) => { lap.screenMat.color.setScalar(k); lap.glow.intensity = 0.16 * k; }, ease.out, 0.45);
      const boot = tweens.run(2.3, (k) => { drawScreen(lap.canvas, name, k); lap.texture.needsUpdate = true; }, ease.linear, 0.45);
      await tweens.wait(1.25);
      if (disposed) return;

      // Push in until the screen fills the frame
      lap.screen.updateWorldMatrix(true, false);
      const wq = lap.screen.getWorldQuaternion(new THREE.Quaternion());
      const centre = lap.screen.getWorldPosition(new THREE.Vector3());
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(wq);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(wq);
      const rightV = new THREE.Vector3().crossVectors(up, normal);
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      const dist = Math.min(lap.size.h / 2 / Math.tan(vfov / 2), lap.size.w / 2 / Math.tan(hfov / 2)) * 0.93;
      const endPos = centre.clone().addScaledVector(normal, dist);
      const endQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(rightV, up, normal));
      const p0 = camera.position.clone();
      const qa = camera.quaternion.clone();
      playZoomWhoosh(1.6);
      await tweens.run(1.6, (k) => {
        camera.position.lerpVectors(p0, endPos, k);
        camera.quaternion.slerpQuaternions(qa, endQuat, Math.min(1, k * 1.25));
        setVeil(Math.max(0, (k - 0.72) / 0.28));
      }, ease.inOut);
      await boot;
      if (disposed) return;
      setVeil(1);
      cb.current.onLaunch(specs[i].id);
    };

    const toDesk = async () => {
      if (S.phase !== 'roam') return;
      setP('busy');
      await returnToSeat(1.0);
      S.scripted = false;
      setP('seated');
    };

    api.current = { skip, back, start, toDesk };

    // ── Input ──
    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      S.ndc.set(nx, -ny);
      S.mx = nx;
      S.my = ny;
      S.pointerInside = true;
      if (S.down) {
        const dx = e.clientX - S.down.x;
        const dy = e.clientY - S.down.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) S.down.moved = true;
        if (S.down.moved) {
          if (S.phase === 'roam') {
            S.yaw += e.movementX * 0.0032;
            S.pitch = THREE.MathUtils.clamp(S.pitch + e.movementY * 0.0032, -1.1, 1.1);
          } else if (S.phase === 'seated') {
            S.dragYaw = THREE.MathUtils.clamp(S.dragYaw + e.movementX * 0.0032, -2.6, 2.6);
            S.dragPitch = THREE.MathUtils.clamp(S.dragPitch + e.movementY * 0.0032, -0.5, 0.75);
          }
        }
      }
    };
    const onPointerDown = (e: PointerEvent) => { S.down = { x: e.clientX, y: e.clientY, moved: false }; };
    const onPointerUp = () => {
      const d = S.down;
      S.down = null;
      if (!d || d.moved) return;
      if ((S.phase === 'seated' || S.phase === 'roam') && S.hover >= 0) void openFolder(S.hover);
    };
    const MOVE_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        if (S.phase === 'reading') void back();
        else if (S.phase === 'roam') void toDesk();
        else if (S.phase === 'door' || S.phase === 'walk') void skip();
        return;
      }
      if (!MOVE_KEYS.has(k)) return;
      e.preventDefault();
      S.keys.add(k);
      if (S.phase === 'seated') {
        // Stand up: carry the current view direction into free-walk
        const e2 = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        S.yaw = e2.y;
        S.pitch = e2.x;
        setP('roam');
        setHoverId(null);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { S.keys.delete(e.key.toLowerCase()); };
    const onBlur = () => S.keys.clear();
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);

    // ── Frame ──
    const raycaster = new THREE.Raycaster();
    let last = performance.now();
    let tuned = false;
    let sampleMs = 0;
    let sampleN = 0;
    let gtaoPass: GTAOPass | null = null;
    let elapsed = 0;
    const tmp = new THREE.Vector3();
    const blocked = (x: number, z: number) => {
      const m = 0.3;
      if (x < ROOM.x0 + m || x > ROOM.x1 - m || z < ROOM.z0 + 0.45 || z > ROOM.z1 - 0.4) return true;
      return !!office?.colliders.some(([ax, az, bx, bz]) => x > ax - 0.1 && x < bx + 0.1 && z > az - 0.1 && z < bz + 0.1);
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const rawDt = (now - last) / 1000;
      const dt = Math.min(rawDt, 0.05) * S.timeScale;
      last = now;
      elapsed += dt;
      if (document.hidden || !office || !composer) return;
      tweens.tick(dt);

      if (!S.scripted) {
        if (S.phase === 'seated') {
          // Ease toward where the mouse is pointing; dragging adds to it
          const ty = -S.mx * 0.42 + S.dragYaw;
          const tp = -S.my * 0.2 + S.dragPitch;
          const a = 1 - Math.exp(-dt * 5);
          S.lookYaw += (ty - S.lookYaw) * a;
          S.lookPitch += (tp - S.lookPitch) * a;
          camera.position.copy(SEAT);
          camera.rotation.set(THREE.MathUtils.clamp(base.pitch + S.lookPitch, -1.2, 0.9), base.yaw + S.lookYaw, 0);
        } else if (S.phase === 'roam') {
          const fwd = (S.keys.has('w') || S.keys.has('arrowup') ? 1 : 0) - (S.keys.has('s') || S.keys.has('arrowdown') ? 1 : 0);
          const strafe = (S.keys.has('d') || S.keys.has('arrowright') ? 1 : 0) - (S.keys.has('a') || S.keys.has('arrowleft') ? 1 : 0);
          const speed = 1.7 * dt;
          const sin = Math.sin(S.yaw);
          const cos = Math.cos(S.yaw);
          const dx = (-sin * fwd + cos * strafe) * speed;
          const dz = (-cos * fwd - sin * strafe) * speed;
          let { x, z } = camera.position;
          if (!blocked(x + dx, z)) x += dx;
          if (!blocked(x, z + dz)) z += dz;
          const moving = fwd !== 0 || strafe !== 0;
          if (moving && elapsed - roamStepAt > 0.52) { roamStepAt = elapsed; playFootstep(Math.random() < 0.5 ? -1 : 1); }
          const targetY = 1.62 + (moving ? Math.sin(elapsed * 9) * 0.012 : 0);
          camera.position.set(x, camera.position.y + (targetY - camera.position.y) * (1 - Math.exp(-dt * 6)), z);
          camera.rotation.set(S.pitch, S.yaw, 0);
        }

        // Hover
        let hit = -1;
        if (S.pointerInside && !S.down?.moved) {
          raycaster.setFromCamera(S.ndc, camera);
          const hits = raycaster.intersectObjects(office.folders.map((f) => f.hit), false);
          if (hits.length) hit = hits[0].object.userData.folderIndex as number;
        }
        if (hit !== S.hover) {
          S.hover = hit;
          canvas.style.cursor = hit >= 0 ? 'pointer' : S.phase === 'roam' ? 'grab' : 'default';
          setHoverId(hit >= 0 ? office.folders[hit].id : null);
          if (hit >= 0) playDirectorSelect();
        }
      }

      // Hovered folder lifts off the desk
      office.folders.forEach((f, i) => {
        if (i === active) return;
        const target = i === S.hover && !S.scripted ? 1 : 0;
        f.lift += (target - f.lift) * (1 - Math.exp(-dt * 12));
        f.group.position.y = f.home.pos.y + f.lift * 0.028;
        f.group.rotation.x = -f.lift * 0.07;
      });

      // The chair is where your head ends up — fade it out of the way
      office.chair.visible = camera.position.distanceTo(tmp.set(SEAT.x, 1.1, SEAT.z - 0.2)) > 1.15;

      composer.render(dt);

      // Slow machine? After the first second of real frames, trade ambient
      // occlusion and resolution for a steady frame rate.
      if (!tuned && S.phase !== 'loading') {
        sampleMs += rawDt * 1000;
        if (++sampleN === 45) {
          tuned = true;
          if (sampleMs / sampleN > 30 && S.timeScale === 1) {
            if (gtaoPass) gtaoPass.enabled = false;
            renderer.setPixelRatio(1);
            composer.setPixelRatio(1);
            composer.setSize(window.innerWidth, window.innerHeight);
          }
        }
      }
    };

    // ── Boot ──
    (async () => {
      const logos: Record<string, HTMLImageElement | null> = {};
      const nodes = logosRef.current?.querySelectorAll<SVGElement>('[data-logo] svg') ?? [];
      await Promise.all([...nodes].map(async (svg) => {
        const id = svg.parentElement?.getAttribute('data-logo');
        if (id) logos[id] = await svgToImage(svg);
      }));
      if (disposed) return;

      const folderSpecs: FolderSpec[] = specs.map((f) => ({
        id: f.id,
        cover: drawCover({ name: f.name, regime: f.regime, logo: logos[f.id] ?? null, sealed: f.sealed }),
        page: drawPage(f.name),
        sealed: f.sealed,
        recommended: f.recommended,
      }));

      const manager = new THREE.LoadingManager();
      manager.onProgress = (_url, loaded, total) => setProgress(total ? loaded / total : 0);
      office = buildOffice(manager, folderSpecs);
      const scene = office.scene;
      drawScreen(office.laptop.canvas, '', 0);

      // Reflections: the dusk panorama, pre-filtered
      const pmrem = new THREE.PMREMGenerator(renderer);
      new THREE.TextureLoader(manager).load('/office/env.jpg', (t) => {
        t.mapping = THREE.EquirectangularReflectionMapping;
        t.colorSpace = THREE.SRGBColorSpace;
        if (disposed) { t.dispose(); return; }
        scene.environment = pmrem.fromEquirectangular(t).texture;
        scene.environmentIntensity = 0.42;
        scene.environmentRotation.y = Math.PI * 0.5;
        t.dispose();
        pmrem.dispose();
      });

      const w = window.innerWidth;
      const h = window.innerHeight;
      const target = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
      composer = new EffectComposer(renderer, target);
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.addPass(new RenderPass(scene, camera));
      const gtao = new GTAOPass(scene, camera, w, h);
      gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.4, thickness: 1, scale: 1.25, samples: 12 });
      gtao.blendIntensity = 0.9;
      composer.addPass(gtao);
      gtaoPass = gtao;
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.22, 0.6, 1.0));
      composer.addPass(new OutputPass());

      if (process.env.NODE_ENV !== 'production') {
        // Dev hook for automated screenshots
        (window as unknown as Record<string, unknown>).__office = {
          S, camera, office,
          view: (p: [number, number, number], t: [number, number, number]) => {
            tweens.clear();
            S.scripted = true;
            setP('busy');
            setVeil(0);
            if (office) office.doorPivot.rotation.y = 1.75;
            camera.position.set(...p);
            camera.lookAt(...t);
          },
          open: (i: number) => openFolder(i),
        };
      }

      placeAtSeat();
      let started = false;
      const begin = () => {
        if (started || disposed) return;
        started = true;
        setProgress(1);
        startOfficeAmbience();
        void runIntro();
      };
      manager.onLoad = () => window.setTimeout(begin, 250);
      window.setTimeout(begin, 15000);
      frame();
    })();

    return () => {
      disposed = true;
      stopOfficeAmbience();
      cancelAnimationFrame(raf);
      tweens.clear();
      api.current = null;
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      office?.dispose();
      composer?.dispose();
      renderer.dispose();
    };
  }, []);

  const onStart = useCallback(() => { void api.current?.start(); }, []);
  const onBack = useCallback(() => { void api.current?.back(); }, []);
  const hovered = hoverId ? folders.find((f) => f.id === hoverId) : null;
  const loading = phase === 'loading';

  return (
    <div className="of-root">
      <canvas ref={canvasRef} className="of-canvas" />
      <div className="of-vignette" />

      {/* Logos rendered once, off-screen, so they can be stamped onto the folder covers */}
      <div ref={logosRef} aria-hidden className="of-logos">
        {folders.filter((f) => !f.sealed).map((f) => (
          <span key={f.id} data-logo={f.id}><CompanyLogo companyId={f.id} size={256} /></span>
        ))}
      </div>

      <header className="of-top">
        <span className="of-wordmark font-narrative">BOARDCRAFT</span>
        <button className="of-link" onClick={onListView}>List view</button>
      </header>

      {(phase === 'door' || phase === 'walk') && (
        <button className="of-skip" onClick={() => void api.current?.skip()}>Skip ›</button>
      )}

      {phase === 'roam' && (
        <button className="of-skip" onClick={() => void api.current?.toDesk()}>Back to your desk</button>
      )}

      <div className={`of-hint ${hovered || HINT[phase] ? 'of-hint-on' : ''}`}>
        {hovered ? (
          <>
            <b>{hovered.name}</b>
            <span>{hovered.sealed ? 'Sealed — coming soon' : `${hovered.regime}${hovered.recommended ? ' · Recommended for you' : ''}`}</span>
          </>
        ) : (
          <span>{HINT[phase]}{phase === 'seated' ? <i> · W A S D to get up and walk</i> : null}</span>
        )}
      </div>

      {toast && <div className="of-toast">{toast}</div>}

      {openId && (
        <div className="of-paper-wrap">
          {renderPaper(openId, { onStart, onBack })}
        </div>
      )}

      <div className="of-veil" style={{ opacity: loading ? 1 : veil, pointerEvents: loading || veil > 0.5 ? 'auto' : 'none' }}>
        {loading && (
          <div className="of-loading">
            <p className="font-narrative">BOARDCRAFT</p>
            <div className="of-bar"><div style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <span>Preparing your office…</span>
          </div>
        )}
      </div>
    </div>
  );
}
