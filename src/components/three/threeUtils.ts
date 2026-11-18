import * as THREE from 'three';
import type { ProductPreset } from '../../types';

export function detectSoftwareGl(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds a composite 4-to-10 part procedural THREE.Group grounded at Y = 0
 * with distinct PBR roughness/metalness contrast across primary, secondary, and accent parts.
 */
export function buildProceduralProduct(preset: ProductPreset, accentHex: string): THREE.Group {
  const group = new THREE.Group();
  const accentColor = new THREE.Color(accentHex || '#ff6a00');

  const darkMatte = new THREE.MeshStandardMaterial({
    color: 0x161618,
    roughness: 0.78,
    metalness: 0.12,
  });
  const brushedMetal = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.24,
    metalness: 0.85,
  });
  const warmAccent = new THREE.MeshStandardMaterial({
    color: 0xff6a00,
    roughness: 0.3,
    metalness: 0.55,
    emissive: new THREE.Color(0xff5500),
    emissiveIntensity: 0.22,
  });
  const glossyGlass = new THREE.MeshPhysicalMaterial({
    color: 0x121418,
    roughness: 0.08,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  if (preset === 'earbuds') {
    // Open charging case base + lid + 2 earbuds with copper rings
    const caseBase = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.75), darkMatte);
    caseBase.position.set(-0.22, 0.21, 0);
    caseBase.castShadow = true;

    const caseRim = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.05, 0.78), brushedMetal);
    caseRim.position.set(-0.22, 0.42, 0);

    const caseLid = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.24, 0.72), darkMatte);
    caseLid.position.set(-0.22, 0.68, -0.34);
    caseLid.rotation.x = -0.95;
    caseLid.castShadow = true;

    const ledDot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), warmAccent);
    ledDot.position.set(-0.22, 0.25, 0.39);

    const makeBud = (x: number, z: number, rotY: number) => {
      const bud = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 16), darkMatte);
      shell.scale.set(1, 0.85, 1.15);
      const faceRing = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 12, 24), warmAccent);
      faceRing.position.set(0, 0.06, 0.16);
      const facePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 20), brushedMetal);
      facePlate.rotation.x = Math.PI / 2;
      facePlate.position.set(0, 0.06, 0.15);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), glossyGlass);
      tip.position.set(0, -0.05, -0.18);
      bud.add(shell, faceRing, facePlate, tip);
      bud.position.set(x, 0.17, z);
      bud.rotation.y = rotY;
      bud.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) c.castShadow = true;
      });
      return bud;
    };

    group.add(caseBase, caseRim, caseLid, ledDot, makeBud(0.56, 0.18, -0.4), makeBud(0.82, -0.16, 0.25));
  } else if (preset === 'headphones') {
    // Headband arch + yokes + earcups + plush cushions + metal faceplates
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.065, 16, 40, Math.PI),
      darkMatte
    );
    arch.position.set(0, 0.96, 0);
    arch.castShadow = true;

    const archPad = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.045, 14, 32, Math.PI * 0.65),
      brushedMetal
    );
    archPad.rotation.z = Math.PI * 0.175;
    archPad.position.set(0, 0.96, 0);

    const makeEarCup = (side: -1 | 1) => {
      const cupGroup = new THREE.Group();
      const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.34, 12), brushedMetal);
      yoke.position.set(side * 0.68, 0.78, 0);
      yoke.rotation.z = side * -0.12;

      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.16, 28), brushedMetal);
      shell.rotation.z = Math.PI / 2;
      shell.position.set(side * 0.65, 0.44, 0);

      const trim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.018, 12, 28), warmAccent);
      trim.rotation.y = Math.PI / 2;
      trim.position.set(side * 0.73, 0.44, 0);

      const pad = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.095, 16, 28), darkMatte);
      pad.rotation.y = Math.PI / 2;
      pad.position.set(side * 0.54, 0.44, 0);

      cupGroup.add(yoke, shell, trim, pad);
      cupGroup.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) c.castShadow = true;
      });
      return cupGroup;
    };

    group.add(arch, archPad, makeEarCup(-1), makeEarCup(1));
  } else if (preset === 'smartwatch') {
    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.54, 0.16, 36), brushedMetal);
    bezel.position.set(0, 0.56, 0);
    bezel.rotation.x = Math.PI / 2 - 0.35;

    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 36), glossyGlass);
    glass.position.set(0, 0.61, 0.04);
    glass.rotation.x = Math.PI / 2 - 0.35;

    const dialRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.022, 12, 36), warmAccent);
    dialRing.position.set(0, 0.62, 0.06);
    dialRing.rotation.x = -0.35;

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 16), warmAccent);
    crown.rotation.z = Math.PI / 2;
    crown.position.set(0.56, 0.58, 0);

    const strapTop = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.62, 0.09), darkMatte);
    strapTop.position.set(0, 0.92, -0.22);
    strapTop.rotation.x = -0.35;

    const strapBot = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.09), darkMatte);
    strapBot.position.set(0, 0.24, 0.14);
    strapBot.rotation.x = 0.25;

    group.add(bezel, glass, dialRing, crown, strapTop, strapBot);
    group.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) c.castShadow = true;
    });
  } else if (preset === 'speaker') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 1.35, 32), darkMatte);
    body.position.set(0, 0.69, 0);
    const baseFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 0.07, 32), brushedMetal);
    baseFoot.position.set(0, 0.035, 0);
    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.46, 0.08, 32), brushedMetal);
    topCap.position.set(0, 1.39, 0);
    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.024, 12, 36), warmAccent);
    haloRing.rotation.x = Math.PI / 2;
    haloRing.position.set(0, 1.435, 0);
    const touchPad = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 32), glossyGlass);
    touchPad.position.set(0, 1.43, 0);

    group.add(baseFoot, body, topCap, haloRing, touchPad);
    group.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) c.castShadow = true;
    });
  } else if (preset === 'sneakers') {
    // Sculpted sneaker silhouette: midsole + upper + heel clip + tongue + laces accent
    const midsole = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.22, 0.62), brushedMetal);
    midsole.position.set(0, 0.11, 0);
    const outsole = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.06, 0.64), darkMatte);
    outsole.position.set(0, 0.03, 0);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.42, 0.56), darkMatte);
    upper.position.set(-0.08, 0.42, 0);
    const toeBox = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), darkMatte);
    toeBox.scale.set(1.4, 0.65, 0.96);
    toeBox.position.set(0.52, 0.31, 0);
    const heelClip = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.58), warmAccent);
    heelClip.position.set(-0.58, 0.36, 0);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 12, 24), darkMatte);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(-0.32, 0.62, 0);

    group.add(outsole, midsole, upper, toeBox, heelClip, collar);
    group.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) c.castShadow = true;
    });
  } else {
    // Mechanical keyboard
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.86), brushedMetal);
    chassis.position.set(0, 0.11, 0);
    chassis.rotation.x = 0.1;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.04, 0.76), darkMatte);
    plate.position.set(0, 0.18, 0);
    plate.rotation.x = 0.1;
    group.add(chassis, plate);

    const keyGeo = new THREE.BoxGeometry(0.11, 0.07, 0.11);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 10; col++) {
        const isEsc = row === 0 && col === 0;
        const cap = new THREE.Mesh(keyGeo, isEsc ? warmAccent : darkMatte);
        cap.position.set(-0.72 + col * 0.16, 0.23 - row * 0.015, -0.25 + row * 0.16);
        cap.rotation.x = 0.1;
        cap.castShadow = true;
        group.add(cap);
      }
    }
  }

  return group;
}
