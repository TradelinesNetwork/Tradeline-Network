import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Browser-only enhancement; the page's semantic content never depends on WebGL.
const hero = document.querySelector('body.home-decorative .hero');
if (hero) initialize(hero);

function initialize(hero) {
  const host = document.createElement('div');
  host.className = 'tn-3d-scene';
  host.setAttribute('aria-hidden', 'true');
  hero.prepend(host);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch { host.remove(); return; }
  const styles = getComputedStyle(hero);
  const token = name => styles.getPropertyValue(name).trim();
  const gold = token('--tf-gold');
  const navy = token('--tf-deep');
  const ivory = token('--tf-surface');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 0, 12);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(ivory, navy, 2.1));
  const key = new THREE.DirectionalLight(ivory, 4);
  key.position.set(-3, 5, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(gold, 3);
  rim.position.set(4, 1, 3);
  scene.add(rim);
  const sculpture = new THREE.Group();
  scene.add(sculpture);
  const metal = new THREE.MeshStandardMaterial({ color: gold, metalness: 0.84, roughness: 0.28 });
  const dark = new THREE.MeshStandardMaterial({ color: navy, metalness: 0.55, roughness: 0.32 });

  // A dimensional, engraved medallion built around the original artwork.
  const medallion = new THREE.Group();
  medallion.position.set(0, 0.25, 0);
  sculpture.add(medallion);
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(1.67, 1.67, 0.19, 80), metal);
  edge.rotation.x = Math.PI / 2;
  medallion.add(edge);
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.57, 80), dark);
  face.position.z = 0.105;
  medallion.add(face);
  const medallionFrame = new THREE.Mesh(new THREE.TorusGeometry(1.61, 0.045, 12, 80), metal);
  medallionFrame.position.z = 0.15;
  medallion.add(medallionFrame);
  const textures = [];
  const loader = new THREE.TextureLoader();
  loader.load('/assets/score-crest.png', texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const artwork = new THREE.Mesh(new THREE.PlaneGeometry(3.02, 3.02), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    artwork.position.z = 0.17;
    medallion.add(artwork);
    draw();
  }, undefined, () => { /* The brand medallion remains visible. */ });

  function roundedShape(w, h, r) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  }
  const card = new THREE.Group();
  card.position.set(-1.1, -1.28, 0.85);
  card.rotation.set(0.08, -0.2, -0.12);
  const shape = roundedShape(2.65, 1.65, 0.12);
  card.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2, steps: 1 }), dark));
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = navy; ctx.fillRect(0, 0, 1024, 640);
    ctx.strokeStyle = gold; ctx.lineWidth = 1;
    for (let i = 0; i < 38; i++) {
      ctx.beginPath(); ctx.arc(940, 700, 160 + i * 16, Math.PI, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = gold; ctx.font = '600 42px Georgia'; ctx.fillText('TRADELINES', 70, 90);
    ctx.font = '24px sans-serif'; ctx.fillText('NETWORK', 72, 132);
    ctx.fillStyle = gold; ctx.fillRect(76, 235, 112, 83);
    ctx.strokeStyle = navy; ctx.lineWidth = 4;
    ctx.strokeRect(88, 247, 88, 59);
    ctx.beginPath(); ctx.moveTo(132, 235); ctx.lineTo(132, 318); ctx.moveTo(76, 276); ctx.lineTo(188, 276); ctx.stroke();
    ctx.fillStyle = ivory; ctx.font = '32px monospace'; ctx.fillText('••••  ••••  ••••  TN', 72, 430);
    ctx.font = '23px sans-serif'; ctx.fillText('BUILD  ·  IMPROVE  ·  ACHIEVE', 72, 554);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const front = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ map: texture, metalness: 0.45, roughness: 0.36 }));
    // ShapeGeometry UVs are world-space: map the card extent into [0, 1].
    const uv = front.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 1.325) / 2.65, (uv.getY(i) + 0.825) / 1.65);
    front.position.z = 0.077;
    card.add(front);
  }
  sculpture.add(card);
  // Small architectural growth bars, rather than oversized floating symbols.
  [0.36, 0.65, 0.96].forEach((height, index) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, height, 0.16), metal);
    bar.position.set(1.55 + index * 0.28, -0.95 + height / 2, 0.4);
    sculpture.add(bar);
  });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = new THREE.Vector2();
  let visible = true, disposed = false, frame = 0, time = 0;
  let lastTime = performance.now();
  function layout() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const small = width <= 1000;
    const worldHeight = 2 * 12 * Math.tan(THREE.MathUtils.degToRad(17));
    const worldWidth = worldHeight * camera.aspect;
    sculpture.position.x = small ? 0 : worldWidth * 0.26;
    sculpture.position.y = small ? worldHeight * (-0.5 + 106 / height) : 0;
    const scale = small ? Math.min(worldWidth / 5.5, worldHeight * (170 / height) / 4.2) : Math.min(worldWidth * 0.41 / 4.7, worldHeight / 5.5);
    sculpture.scale.setScalar(scale);
    draw();
  }
  function draw() {
    if (disposed) return;
    renderer.render(scene, camera);
    host.setAttribute('data-scene-ready', 'true');
    hero.classList.add('tn-3d-ready');
  }
  function animate() {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (!visible || document.hidden || reduced.matches) return;
    time += dt;
    sculpture.rotation.y = THREE.MathUtils.damp(sculpture.rotation.y, pointer.x * 0.16 + Math.sin(time * 0.4) * 0.07, 3, dt);
    sculpture.rotation.x = THREE.MathUtils.damp(sculpture.rotation.x, -pointer.y * 0.09, 3, dt);
    medallion.position.y = 0.25 + Math.sin(time * 0.8) * 0.065;
    draw();
  }
  function move(event) {
    const rect = hero.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
  }
  function reset() { pointer.set(0, 0); }
  hero.addEventListener('pointermove', move, { passive: true });
  hero.addEventListener('pointerleave', reset);
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); hero.classList.remove('tn-3d-ready'); });
  renderer.domElement.addEventListener('webglcontextrestored', draw);
  const resize = new ResizeObserver(layout); resize.observe(host);
  const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; }); observer.observe(hero);
  reduced.addEventListener('change', draw);
  layout(); animate();
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    disposed = true; cancelAnimationFrame(frame);
    resize.disconnect(); observer.disconnect();
    hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', reset);
    reduced.removeEventListener('change', draw);
    scene.traverse(object => {
      if (object.isMesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material.dispose());
      }
    });
    textures.forEach(texture => texture.dispose()); environment.dispose(); renderer.dispose();
  });
}