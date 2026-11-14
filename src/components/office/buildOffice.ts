import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

/**
 * The company-secretary's office, built in code.
 *
 * Layout (metres, y up). The seated camera looks along +z, across the desk,
 * at a full-width window wall and a dusk skyline. The door is on the +x wall
 * (the seated viewer's left).
 *
 *        z = +4.5  ── window wall ──────────────
 *                   lounge            plant
 *                        ┌──── desk ────┐
 *                              seat              ← door (x = +4)
 *        z = -3.5  ── slatted back wall ────────
 *
 * Furniture models, wood/leather textures and the skyline photograph are CC0
 * assets from Poly Haven (polyhaven.com), served from /public/office.
 */

export const ROOM = { x0: -4, x1: 4, z0: -3.5, z1: 4.5, h: 3 };
export const DESK = { cx: 0.2, cz: -0.95, w: 2.4, d: 1.05, top: 0.76 };
export const SEAT = new THREE.Vector3(0.2, 1.24, -2.02);
/** Where the seated camera rests its gaze: just past the folders. */
export const SEAT_LOOK = new THREE.Vector3(0.2, 0.9, -0.2);

const ASSET = '/office';

export interface FolderSpec {
  id: string;
  cover: HTMLCanvasElement;
  page: HTMLCanvasElement;
  sealed: boolean;
  recommended: boolean;
}

export interface FolderHandle {
  id: string;
  sealed: boolean;
  group: THREE.Group;
  coverPivot: THREE.Group;
  hit: THREE.Mesh;
  home: { pos: THREE.Vector3; quat: THREE.Quaternion };
  /** 0–1 hover lift, eased in the render loop */
  lift: number;
}

export interface OfficeHandles {
  scene: THREE.Scene;
  folders: FolderHandle[];
  laptop: {
    group: THREE.Group;
    lidPivot: THREE.Group;
    screen: THREE.Mesh;
    screenMat: THREE.MeshBasicMaterial;
    glow: THREE.PointLight;
    canvas: HTMLCanvasElement;
    texture: THREE.CanvasTexture;
    /** Screen size in metres */
    size: { w: number; h: number };
  };
  doorPivot: THREE.Group;
  chair: THREE.Group;
  /** Axis-aligned footprints the roaming camera can't enter: [x0, z0, x1, z1] */
  colliders: [number, number, number, number][];
  dispose: () => void;
}

function tex(loader: THREE.TextureLoader, file: string, repeat: [number, number], srgb = false): THREE.Texture {
  const t = loader.load(`${ASSET}/tex/${file}`);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function shadowed<T extends THREE.Object3D>(o: T, cast = true, receive = true): T {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) { c.castShadow = cast; c.receiveShadow = receive; }
  });
  return o;
}

export function buildOffice(manager: THREE.LoadingManager, folderSpecs: FolderSpec[]): OfficeHandles {
  RectAreaLightUniformsLib.init();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#141a2a');
  const loader = new THREE.TextureLoader(manager);
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(d: T): T => { disposables.push(d); return d; };

  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene, r = 0) => {
    const geo = track(r > 0 ? new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d));
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ── Materials ──
  const walnut = track(new THREE.MeshStandardMaterial({
    map: tex(loader, 'walnut_diff.jpg', [1.6, 0.8], true),
    normalMap: tex(loader, 'walnut_nor.jpg', [1.6, 0.8]),
    roughnessMap: tex(loader, 'walnut_arm.jpg', [1.6, 0.8]),
    roughness: 0.75, metalness: 0, color: '#a5846a', envMapIntensity: 0.6,
  }));
  const walnutDark = track(new THREE.MeshStandardMaterial({
    map: tex(loader, 'walnut_diff.jpg', [0.5, 2.2], true),
    normalMap: tex(loader, 'walnut_nor.jpg', [0.5, 2.2]),
    roughness: 0.6, color: '#7d6450',
  }));
  const parquet = track(new THREE.MeshStandardMaterial({
    map: tex(loader, 'parquet_diff.jpg', [4.4, 4.4], true),
    normalMap: tex(loader, 'parquet_nor.jpg', [4.4, 4.4]),
    roughness: 0.5, color: '#927a66', envMapIntensity: 0.6,
  }));
  const leatherNor = tex(loader, 'leather_nor.jpg', [1.5, 2]);
  const leatherNavy = track(new THREE.MeshStandardMaterial({ color: '#0f1f38', roughness: 0.62, envMapIntensity: 0.5, normalMap: leatherNor, normalScale: new THREE.Vector2(0.6, 0.6) }));
  const leatherBlack = track(new THREE.MeshStandardMaterial({ color: '#15171b', roughness: 0.5, normalMap: tex(loader, 'leather_nor.jpg', [5, 2.5]), normalScale: new THREE.Vector2(0.5, 0.5) }));
  const steel = track(new THREE.MeshStandardMaterial({ color: '#1a1c20', roughness: 0.42, metalness: 0.85 }));
  const brass = track(new THREE.MeshStandardMaterial({ color: '#b08a3c', roughness: 0.36, metalness: 1, envMapIntensity: 0.8 }));
  const aluminium = track(new THREE.MeshStandardMaterial({ color: '#aeb2ba', roughness: 0.32, metalness: 1 }));
  const plaster = track(new THREE.MeshStandardMaterial({ color: '#343a47', roughness: 0.95 }));
  const ceilingMat = track(new THREE.MeshStandardMaterial({ color: '#1a1d24', roughness: 1 }));
  const paper = track(new THREE.MeshStandardMaterial({ color: '#efe7d4', roughness: 0.9 }));
  const wool = track(new THREE.MeshStandardMaterial({ color: '#2b3344', roughness: 1 }));
  const warmGlow = track(new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0').multiplyScalar(3.2), toneMapped: false }));
  const glass = track(new THREE.MeshPhysicalMaterial({ color: '#cfe0ff', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.07, envMapIntensity: 1.6, depthWrite: false }));

  const { x0, x1, z0, z1, h } = ROOM;
  const W = x1 - x0;
  const D = z1 - z0;
  const mx = (x0 + x1) / 2;
  const mz = (z0 + z1) / 2;

  // ── Shell ──
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(W, D)), parquet);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(mx, 0, mz);
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(track(new THREE.PlaneGeometry(W, D)), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(mx, h, mz);
  scene.add(ceiling);

  // -x wall (seated viewer's right)
  box(0.1, h, D, plaster, x0 - 0.05, h / 2, mz);
  // +x wall with the door opening (z from -0.25 to 0.75, 2.2 m high)
  const door = { z0: -0.25, z1: 0.75, h: 2.2 };
  box(0.1, h, door.z0 - z0, plaster, x1 + 0.05, h / 2, (z0 + door.z0) / 2);
  box(0.1, h, z1 - door.z1, plaster, x1 + 0.05, h / 2, (door.z1 + z1) / 2);
  box(0.1, h - door.h, door.z1 - door.z0, plaster, x1 + 0.05, (h + door.h) / 2, (door.z0 + door.z1) / 2);
  // Door frame + leaf (hinged on the window side, swings into the room)
  box(0.14, door.h + 0.06, 0.06, steel, x1 + 0.05, door.h / 2, door.z0 - 0.03);
  box(0.14, door.h + 0.06, 0.06, steel, x1 + 0.05, door.h / 2, door.z1 + 0.03);
  box(0.14, 0.06, door.z1 - door.z0 + 0.12, steel, x1 + 0.05, door.h + 0.03, (door.z0 + door.z1) / 2);
  const doorPivot = new THREE.Group();
  doorPivot.position.set(x1 + 0.02, 0, door.z1);
  scene.add(doorPivot);
  box(0.05, door.h, door.z1 - door.z0, walnutDark, 0, door.h / 2, -(door.z1 - door.z0) / 2, doorPivot);
  box(0.03, 0.03, 0.16, brass, -0.05, 1.02, -(door.z1 - door.z0) + 0.14, doorPivot, 0.01);
  // Corridor outside the door: a dark box so the first frames have a "before"
  const corridor = track(new THREE.MeshStandardMaterial({ color: '#0d0f14', roughness: 1, side: THREE.BackSide }));
  const corr = new THREE.Mesh(track(new THREE.BoxGeometry(3, h, 3.4)), corridor);
  corr.position.set(x1 + 1.6, h / 2, 0.25);
  scene.add(corr);

  // Back wall: plaster behind vertical walnut slats
  box(W, h, 0.1, plaster, mx, h / 2, z0 - 0.05);
  const slatGeo = track(new THREE.BoxGeometry(0.07, h - 0.24, 0.045));
  const slatCount = Math.floor(W / 0.115);
  const slats = new THREE.InstancedMesh(slatGeo, walnutDark, slatCount);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < slatCount; i++) {
    m4.makeTranslation(x0 + 0.06 + i * 0.115, h / 2, z0 + 0.03);
    slats.setMatrixAt(i, m4);
  }
  slats.castShadow = true;
  slats.receiveShadow = true;
  scene.add(slats);
  // Cove light washing down the slats
  box(W - 0.4, 0.02, 0.05, warmGlow, mx, h - 0.06, z0 + 0.16).castShadow = false;
  // Floating shelf
  box(2.6, 0.045, 0.3, walnut, -1.9, 1.5, z0 + 0.2, scene, 0.008);
  box(2.6, 0.045, 0.3, walnut, -1.9, 2.0, z0 + 0.2, scene, 0.008);

  // ── Window wall (z = +4.5) ──
  const pane = new THREE.Mesh(track(new THREE.PlaneGeometry(W, h)), glass);
  pane.position.set(mx, h / 2, z1);
  pane.rotation.y = Math.PI;
  pane.renderOrder = 5;
  scene.add(pane);
  for (let i = 0; i <= 4; i++) box(0.06, h, 0.1, steel, x0 + (W / 4) * i, h / 2, z1);
  box(W, 0.08, 0.12, steel, mx, 0.04, z1);
  box(W, 0.1, 0.12, steel, mx, h - 0.05, z1);
  // Terrace beyond the glass: hides the bottom edge of the skyline photograph
  box(W + 6, 0.2, 2.4, plaster, mx, -0.1, z1 + 1.25).castShadow = false;
  const rail = new THREE.Mesh(track(new THREE.PlaneGeometry(W + 6, 1.0)), glass);
  rail.position.set(mx, 0.5, z1 + 2.4);
  rail.rotation.y = Math.PI;
  scene.add(rail);
  box(W + 6, 0.04, 0.05, steel, mx, 1.02, z1 + 2.4).castShadow = false;

  // Skyline: a photographed dusk panorama on a section of sphere
  const skyTex = loader.load(`${ASSET}/skyline.jpg`);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  skyTex.anisotropy = 8;
  const deg = Math.PI / 180;
  const skyGeo = track(new THREE.SphereGeometry(160, 64, 32, (90 - 68.4) * deg, 136.8 * deg, 36 * deg, 72 * deg));
  const sky = new THREE.Mesh(skyGeo, track(new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, toneMapped: false, color: new THREE.Color(0.86, 0.86, 0.92), fog: false })));
  sky.position.set(0, 1.5, z1);
  sky.scale.x = -1; // seen from inside: un-mirror the photograph
  scene.add(sky);

  // ── Ceiling details ──
  // Linear pendant over the desk
  box(1.7, 0.045, 0.07, steel, DESK.cx, 2.18, DESK.cz, scene, 0.012);
  box(1.62, 0.006, 0.045, warmGlow, DESK.cx, 2.155, DESK.cz).castShadow = false;
  for (const dx of [-0.75, 0.75]) box(0.004, h - 2.2, 0.004, steel, DESK.cx + dx, (h + 2.2) / 2, DESK.cz).castShadow = false;
  // Recessed strip by the window
  box(W - 0.6, 0.015, 0.05, warmGlow, mx, h - 0.01, z1 - 0.5).castShadow = false;

  // ── Desk ──
  const desk = new THREE.Group();
  desk.position.set(DESK.cx, 0, DESK.cz);
  scene.add(desk);
  box(DESK.w, 0.05, DESK.d, walnut, 0, DESK.top - 0.025, 0, desk, 0.012);
  for (const sx of [-1, 1]) {
    box(0.05, DESK.top - 0.05, DESK.d - 0.16, steel, sx * (DESK.w / 2 - 0.16), (DESK.top - 0.05) / 2, 0, desk, 0.006);
  }
  box(DESK.w - 0.4, 0.34, 0.02, walnutDark, 0, DESK.top - 0.24, DESK.d / 2 - 0.2, desk);
  // Leather desk mat under the folders
  box(1.3, 0.004, 0.86, leatherBlack, 0, DESK.top + 0.002, -0.02, desk, 0.002);
  // Pen, cup, nameplate
  const pen = new THREE.Mesh(track(new THREE.CylinderGeometry(0.0045, 0.0045, 0.14, 12)), brass);
  pen.rotation.set(Math.PI / 2, 0, 0.5);
  pen.position.set(-0.78, DESK.top + 0.006, -0.3);
  pen.castShadow = true;
  desk.add(pen);
  const cup = new THREE.Mesh(track(new THREE.CylinderGeometry(0.04, 0.032, 0.085, 28, 1, true)), track(new THREE.MeshStandardMaterial({ color: '#f3efe6', roughness: 0.25, side: THREE.DoubleSide })));
  cup.position.set(-0.98, DESK.top + 0.0425, -0.02);
  cup.castShadow = true;
  desk.add(cup);
  const coffee = new THREE.Mesh(track(new THREE.CircleGeometry(0.037, 28)), track(new THREE.MeshStandardMaterial({ color: '#24150c', roughness: 0.15 })));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.set(-0.98, DESK.top + 0.068, -0.02);
  desk.add(coffee);
  box(0.36, 0.055, 0.03, brass, 0.0, DESK.top + 0.03, DESK.d / 2 - 0.09, desk, 0.004).rotation.x = -0.3;

  // ── Folders: two rows of three on the mat ──
  const FW = 0.25;
  const FD = 0.33;
  const folders: FolderHandle[] = [];
  folderSpecs.forEach((spec, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const g = new THREE.Group();
    // Viewer sits at -z looking +z: turn the folder so its local +x is the viewer's right
    const jitter = [0.05, -0.03, 0.04, -0.045, 0.025, -0.02][i % 6];
    g.rotation.y = Math.PI + jitter;
    g.position.set(DESK.cx + (1 - col) * 0.37, DESK.top + 0.004, DESK.cz - 0.22 + row * 0.4);
    scene.add(g);

    box(FW, 0.006, FD, leatherNavy, 0, 0.003, 0, g, 0.003);
    box(FW - 0.018, 0.007, FD - 0.02, paper, 0.004, 0.0095, 0, g);
    const pageTex = track(new THREE.CanvasTexture(spec.page));
    pageTex.colorSpace = THREE.SRGBColorSpace;
    pageTex.anisotropy = 8;
    const page = new THREE.Mesh(track(new THREE.PlaneGeometry(FW - 0.018, FD - 0.02)), track(new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.9 })));
    page.rotation.x = -Math.PI / 2;
    page.position.set(0.004, 0.0132, 0);
    page.receiveShadow = true;
    g.add(page);

    const coverPivot = new THREE.Group();
    coverPivot.position.set(-FW / 2, 0.0145, 0);
    g.add(coverPivot);
    box(FW, 0.005, FD, leatherNavy, FW / 2, 0.0025, 0, coverPivot, 0.0024);
    const coverTex = track(new THREE.CanvasTexture(spec.cover));
    coverTex.colorSpace = THREE.SRGBColorSpace;
    coverTex.anisotropy = 16;
    const face = new THREE.Mesh(track(new THREE.PlaneGeometry(FW - 0.006, FD - 0.006)), track(new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.66, envMapIntensity: 0.45, normalMap: leatherNor, normalScale: new THREE.Vector2(0.3, 0.3) })));
    face.rotation.x = -Math.PI / 2;
    face.position.set(FW / 2, 0.0052, 0);
    face.receiveShadow = true;
    coverPivot.add(face);

    if (spec.recommended) {
      // Brass page-marker ribbon out of the top edge
      box(0.018, 0.0015, 0.07, brass, 0.07, 0.0142, -FD / 2 - 0.02, g).castShadow = false;
    }
    if (spec.sealed) {
      const band = track(new THREE.MeshStandardMaterial({ color: '#6e1f1f', roughness: 0.6 }));
      box(FW + 0.004, 0.0012, 0.04, band, FW / 2, 0.0062, 0.04, coverPivot).castShadow = false;
      const seal = new THREE.Mesh(track(new THREE.CylinderGeometry(0.02, 0.022, 0.006, 24)), track(new THREE.MeshStandardMaterial({ color: '#8f2a22', roughness: 0.35 })));
      seal.position.set(FW / 2, 0.0095, 0.04);
      coverPivot.add(seal);
    }

    const hit = new THREE.Mesh(track(new THREE.BoxGeometry(FW + 0.02, 0.05, FD + 0.02)), track(new THREE.MeshBasicMaterial({ visible: false })));
    hit.position.y = 0.02;
    hit.userData.folderIndex = i;
    g.add(hit);

    folders.push({ id: spec.id, sealed: spec.sealed, group: g, coverPivot, hit, home: { pos: g.position.clone(), quat: g.quaternion.clone() }, lift: 0 });
  });

  // ── Laptop (viewer's right, turned toward the chair) ──
  const LW = 0.34;
  const LD = 0.235;
  const laptopGroup = new THREE.Group();
  laptopGroup.position.set(DESK.cx - 0.8, DESK.top + 0.001, DESK.cz + 0.12);
  // local +z (front edge) should face the seat
  laptopGroup.rotation.y = Math.atan2(SEAT.x - laptopGroup.position.x, SEAT.z - laptopGroup.position.z);
  scene.add(laptopGroup);
  box(LW, 0.013, LD, aluminium, 0, 0.0065, 0, laptopGroup, 0.006);
  const keys = new THREE.Mesh(track(new THREE.PlaneGeometry(LW - 0.05, 0.105)), track(new THREE.MeshStandardMaterial({ color: '#17191d', roughness: 0.6 })));
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(0, 0.0133, -0.04);
  laptopGroup.add(keys);
  const pad = new THREE.Mesh(track(new THREE.PlaneGeometry(0.11, 0.07)), track(new THREE.MeshStandardMaterial({ color: '#9da1a9', roughness: 0.25, metalness: 1 })));
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 0.0133, 0.065);
  laptopGroup.add(pad);
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.0135, -LD / 2);
  laptopGroup.add(lidPivot);
  box(LW, 0.006, LD, aluminium, 0, 0.003, LD / 2, lidPivot, 0.003);
  const screenSize = { w: LW - 0.022, h: (LW - 0.022) / 1.6 };
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 800;
  const screenTex = track(new THREE.CanvasTexture(canvas));
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = 16;
  const screenMat = track(new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, color: new THREE.Color(0, 0, 0) }));
  const bezel = new THREE.Mesh(track(new THREE.PlaneGeometry(LW - 0.006, LD - 0.006)), track(new THREE.MeshStandardMaterial({ color: '#08090b', roughness: 0.2 })));
  bezel.rotation.x = Math.PI / 2;
  bezel.position.set(0, -0.0002, LD / 2);
  lidPivot.add(bezel);
  const screen = new THREE.Mesh(track(new THREE.PlaneGeometry(screenSize.w, screenSize.h)), screenMat);
  screen.rotation.x = Math.PI / 2;
  screen.position.set(0, -0.0006, LD / 2 + 0.004);
  lidPivot.add(screen);
  const glow = new THREE.PointLight('#9fc0ff', 0, 1.6, 2);
  glow.position.set(0, 0.12, 0.1);
  laptopGroup.add(glow);

  // ── Soft furnishings built in code ──
  box(3.4, 0.012, 2.6, wool, -2.35, 0.006, 2.3, scene, 0.005).castShadow = false;
  // Low credenza under the slats
  box(2.2, 0.55, 0.42, walnut, 2.2, 0.33, z0 + 0.3, scene, 0.01);
  box(2.1, 0.05, 0.36, steel, 2.2, 0.03, z0 + 0.3);
  // Framed piece on the -x wall
  const art = document.createElement('canvas');
  art.width = 512;
  art.height = 640;
  const a = art.getContext('2d');
  if (a) {
    const g = a.createLinearGradient(0, 0, 0, 640);
    g.addColorStop(0, '#0d1b2f');
    g.addColorStop(1, '#16304f');
    a.fillStyle = g;
    a.fillRect(0, 0, 512, 640);
    a.strokeStyle = '#c8960c';
    a.lineWidth = 3;
    for (let i = 0; i < 9; i++) { a.globalAlpha = 0.25 + i * 0.07; a.beginPath(); a.arc(256, 760, 180 + i * 46, Math.PI, Math.PI * 2); a.stroke(); }
    a.globalAlpha = 1;
    a.fillStyle = '#e0b044';
    a.beginPath(); a.arc(256, 250, 34, 0, Math.PI * 2); a.fill();
  }
  const artTex = track(new THREE.CanvasTexture(art));
  artTex.colorSpace = THREE.SRGBColorSpace;
  const artMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(1.1, 1.375)), track(new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.7 })));
  artMesh.rotation.y = Math.PI / 2;
  artMesh.position.set(x0 + 0.03, 1.65, -1.4);
  scene.add(artMesh);
  box(0.03, 1.44, 1.16, steel, x0 + 0.012, 1.65, -1.4).castShadow = false;
  // Floor lamp by the sofa
  box(0.02, 1.5, 0.02, brass, x0 + 0.45, 0.75, 3.55);
  const shade = new THREE.Mesh(track(new THREE.CylinderGeometry(0.13, 0.17, 0.26, 32, 1, true)), track(new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0').multiplyScalar(1.15), toneMapped: false, side: THREE.DoubleSide })));
  shade.position.set(x0 + 0.45, 1.6, 3.55);
  scene.add(shade);
  const baseDisc = new THREE.Mesh(track(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 32)), brass);
  baseDisc.position.set(x0 + 0.45, 0.01, 3.55);
  scene.add(baseDisc);

  // ── Lights ──
  scene.add(new THREE.HemisphereLight('#8fa3cf', '#4a3526', 0.55));
  // Recessed downlights: warm pools on the floor so the room isn't lit by the window alone
  for (const [lx, lz] of [[2.6, 1.6], [-2.2, 2.3], [2.4, -2.2], [-2.6, -1.6]] as const) {
    const dl = new THREE.SpotLight('#ffd6a8', 9, 5, 0.6, 0.9, 1.5);
    dl.position.set(lx, h - 0.02, lz);
    dl.target.position.set(lx, 0, lz);
    scene.add(dl, dl.target);
    const can = new THREE.Mesh(track(new THREE.CircleGeometry(0.045, 20)), warmGlow);
    can.rotation.x = Math.PI / 2;
    can.position.set(lx, h - 0.004, lz);
    scene.add(can);
  }
  const dusk = new THREE.DirectionalLight('#ffb08a', 1.15);
  dusk.position.set(-5.5, 3.4, 13);
  dusk.target.position.set(0.4, 0, -0.5);
  dusk.castShadow = true;
  dusk.shadow.mapSize.set(2048, 2048);
  const sc = dusk.shadow.camera;
  sc.left = -7; sc.right = 7; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 30;
  dusk.shadow.bias = -0.0004;
  dusk.shadow.normalBias = 0.03;
  dusk.shadow.radius = 5;
  scene.add(dusk, dusk.target);
  const windowFill = new THREE.RectAreaLight('#9fb6ea', 1.5, W, h);
  windowFill.position.set(mx, h / 2, z1 - 0.05);
  windowFill.lookAt(mx, h / 2, 0);
  scene.add(windowFill);
  const pendant = new THREE.SpotLight('#ffe1b0', 7.5, 5, 0.85, 0.8, 1.6);
  pendant.position.set(DESK.cx, 2.14, DESK.cz);
  pendant.target.position.set(DESK.cx, 0, DESK.cz);
  pendant.castShadow = true;
  pendant.shadow.mapSize.set(1024, 1024);
  pendant.shadow.bias = -0.0005;
  pendant.shadow.radius = 6;
  scene.add(pendant, pendant.target);
  const slatWash = new THREE.SpotLight('#ffcf96', 14, 6, 1.25, 0.9, 1.4);
  slatWash.position.set(mx, h - 0.1, z0 + 0.6);
  slatWash.target.position.set(mx, 0.6, z0);
  scene.add(slatWash, slatWash.target);
  const floorLamp = new THREE.PointLight('#ffc98f', 3.5, 5.5, 1.8);
  floorLamp.position.set(x0 + 0.55, 1.55, 3.5);
  scene.add(floorLamp);
  const lampLight = new THREE.SpotLight('#ffcf9a', 4, 2.2, 0.8, 0.8, 1.4);
  lampLight.position.set(DESK.cx + 0.98, DESK.top + 0.48, DESK.cz + 0.22);
  lampLight.target.position.set(DESK.cx + 0.72, DESK.top, DESK.cz + 0.05);
  scene.add(lampLight, lampLight.target);

  // ── Furniture models (Poly Haven, CC0) ──
  const gltf = new GLTFLoader(manager);
  const chair = new THREE.Group();
  scene.add(chair);
  const place = (name: string, parent: THREE.Object3D, pos: [number, number, number], rotY: number, scale = 1, onLoad?: (o: THREE.Object3D) => void) => {
    gltf.load(`${ASSET}/models/${name}/${name}.gltf`, (g) => {
      const o = shadowed(g.scene);
      o.position.set(...pos);
      o.rotation.y = rotY;
      o.scale.setScalar(scale);
      parent.add(o);
      onLoad?.(o);
    }, undefined, () => { /* a missing model just leaves that spot empty */ });
  };
  place('modern_arm_chair_01', chair, [DESK.cx, 0, SEAT.z - 0.25], 0, 1.05);
  place('desk_lamp_arm_01', scene, [DESK.cx + 1.0, DESK.top + 0.09, DESK.cz + 0.33], -2.3, 0.9, (o) => {
    // The model is a workshop-orange arm lamp; repaint it blackened steel
    o.traverse((c) => {
      const mat = (c as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (mat && mat.isMeshStandardMaterial && !mat.name.includes('light')) { mat.map = null; mat.color.set('#1b1d21'); mat.metalness = 0.7; mat.roughness = 0.45; mat.needsUpdate = true; }
    });
  });
  // Sofa (built here: the available models were period pieces)
  const fabric = track(new THREE.MeshStandardMaterial({ color: '#3a4250', roughness: 1, normalMap: tex(loader, 'leather_nor.jpg', [6, 3]), normalScale: new THREE.Vector2(0.25, 0.25) }));
  const sofa = new THREE.Group();
  sofa.position.set(x0 + 0.62, 0, 2.2);
  sofa.rotation.y = Math.PI / 2;
  scene.add(sofa);
  box(2.5, 0.26, 0.98, fabric, 0, 0.27, 0, sofa, 0.05);
  box(2.5, 0.52, 0.2, fabric, 0, 0.58, -0.39, sofa, 0.08);
  for (const sx of [-1, 1]) {
    box(0.2, 0.42, 0.98, fabric, sx * 1.15, 0.47, 0, sofa, 0.08);
    for (const sz of [-0.38, 0.38]) box(0.03, 0.14, 0.03, steel, sx * 1.12, 0.07, sz, sofa);
  }
  for (const cx of [-0.7, 0, 0.7]) {
    box(0.68, 0.15, 0.7, fabric, cx, 0.47, 0.08, sofa, 0.06);
    box(0.66, 0.36, 0.16, fabric, cx, 0.66, -0.24, sofa, 0.07).rotation.x = -0.18;
  }
  place('modern_coffee_table_01', scene, [-2.2, 0, 2.2], 0);
  place('mid_century_lounge_chair', scene, [-1.5, 0, 3.55], Math.PI + 0.5);
  place('potted_plant_02', scene, [3.25, 0.2, 3.75], 0.6, 2.1);
  place('potted_plant_02', scene, [2.75, 0.69, z0 + 0.3], 2.2, 0.75);
  place('book_encyclopedia_set_01', scene, [-2.9, 1.523, z0 + 0.3], 0, 1);
  place('book_encyclopedia_set_01', scene, [-1.55, 2.023, z0 + 0.3], 0, 1);

  const colliders: [number, number, number, number][] = [
    [DESK.cx - DESK.w / 2 - 0.25, DESK.cz - DESK.d / 2 - 0.25, DESK.cx + DESK.w / 2 + 0.25, DESK.cz + DESK.d / 2 + 0.25],
    [x0, 0.6, x0 + 1.35, 3.8],
    [-2.75, 1.4, -1.65, 3.0],
    [-2.1, 2.95, -0.95, 4.2],
    [1.0, z0, 3.4, z0 + 0.75],
  ];

  return {
    scene,
    folders,
    laptop: { group: laptopGroup, lidPivot, screen, screenMat, glow, canvas, texture: screenTex, size: screenSize },
    doorPivot,
    chair,
    colliders,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (!m) return;
          for (const v of Object.values(m)) if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
          m.dispose();
        });
      });
    },
  };
}
