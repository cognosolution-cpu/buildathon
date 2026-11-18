import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CATALOG } from '../../data/catalog';
import type { CartItem } from '../../types';
import { buildProceduralProduct, createContactShadowTexture, detectSoftwareGl } from './threeUtils';

interface Cart3DProps {
  items: CartItem[];
  pulseKey: number;
  simpleView: boolean;
  onToggleSimpleView: () => void;
}

export const Cart3D: React.FC<Cart3DProps> = ({
  items,
  pulseKey,
  simpleView,
  onToggleSimpleView,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const itemsGroupRef = useRef<THREE.Group | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});
  const flashTimerRef = useRef<number>(0);

  useEffect(() => {
    if (simpleView) return;
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = Math.max(container.clientWidth, 260);
    const height = Math.max(container.clientHeight, 260);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(1.85, 1.55, 2.45);

    const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.0);
    keyLight.position.set(2.5, 4, 2.2);
    const hemi = new THREE.HemisphereLight(0x9fb8d6, 0x1a120d, 0.85);
    const rimLight = new THREE.PointLight(0xff6a00, 3.4, 7);
    rimLight.position.set(0, 1.4, -1.5);
    rimLightRef.current = rimLight;
    scene.add(keyLight, hemi, rimLight);

    const shadowTex = createContactShadowTexture();
    const shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 32),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.01;
    scene.add(shadowDisc);

    // Sleek composite glass & anodized aluminum shopping basket
    const basketGroup = new THREE.Group();
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.14,
      metalness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.82,
      transparent: true,
      opacity: isSoftwareGl ? 0.34 : 0.92,
      ior: 1.5,
      thickness: 0.25,
      depthWrite: false,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x242428,
      roughness: 0.35,
      metalness: 0.8,
    });
    const orangeTrimMat = new THREE.MeshStandardMaterial({
      color: 0xff6a00,
      roughness: 0.3,
      metalness: 0.6,
      emissive: new THREE.Color(0xff5500),
      emissiveIntensity: 0.2,
    });

    const floorPlate = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 0.96), frameMat);
    floorPlate.position.y = 0.05;

    const glassWallFront = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.72, 0.04), glassMat);
    glassWallFront.position.set(0, 0.44, 0.46);
    glassWallFront.renderOrder = 2;

    const glassWallBack = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.72, 0.04), glassMat);
    glassWallBack.position.set(0, 0.44, -0.46);
    glassWallBack.renderOrder = 2;

    const glassWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.9), glassMat);
    glassWallLeft.position.set(-0.65, 0.44, 0);
    glassWallLeft.renderOrder = 2;

    const glassWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.9), glassMat);
    glassWallRight.position.set(0.65, 0.44, 0);
    glassWallRight.renderOrder = 2;

    const rimTopFront = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.04, 0.06), orangeTrimMat);
    rimTopFront.position.set(0, 0.81, 0.46);
    const rimTopBack = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.04, 0.06), orangeTrimMat);
    rimTopBack.position.set(0, 0.81, -0.46);

    const handleArch = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.03, 12, 28, Math.PI),
      frameMat
    );
    handleArch.rotation.y = Math.PI / 2;
    handleArch.position.set(0, 0.82, 0);

    basketGroup.add(
      floorPlate,
      glassWallFront,
      glassWallBack,
      glassWallLeft,
      glassWallRight,
      rimTopFront,
      rimTopBack,
      handleArch
    );
    scene.add(basketGroup);

    const itemsGroup = new THREE.Group();
    itemsGroupRef.current = itemsGroup;
    scene.add(itemsGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.45, 0);
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 4.5;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.enableDamping = !isSoftwareGl;
    controls.autoRotate = !isSoftwareGl;
    controls.autoRotateSpeed = 0.9;

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        controls.update();
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (!disposed && (renderDirty || (!isSoftwareGl && controls.autoRotate))) {
            requestRender();
          }
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    requestRenderRef.current = requestRender;
    controls.addEventListener('change', requestRender);

    const ro = new ResizeObserver(() => {
      if (!container || disposed) return;
      const w = Math.max(container.clientWidth, 240);
      const h = Math.max(container.clientHeight, 240);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    ro.observe(container);

    requestRender();

    return () => {
      disposed = true;
      clearTimeout(flashTimerRef.current);
      ro.disconnect();
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      shadowTex.dispose();
      envTex.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [simpleView]);

  // Populate miniature 3D product models inside the glass basket whenever cart items change
  useEffect(() => {
    const group = itemsGroupRef.current;
    if (simpleView || !group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      child.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => m.dispose());
        }
      });
    }

    const expanded: Array<{ preset: (typeof CATALOG)[number]['modelPreset']; hex: string }> = [];
    for (const item of items) {
      const prod = CATALOG.find((p) => p.id === item.productId);
      if (!prod) continue;
      const hex = prod.variants.find((v) => v.name === item.variantName)?.hex ?? '#ff6a00';
      for (let q = 0; q < Math.min(item.quantity, 3); q++) {
        expanded.push({ preset: prod.modelPreset, hex });
      }
    }

    expanded.slice(0, 6).forEach((entry, idx) => {
      const mini = buildProceduralProduct(entry.preset, entry.hex);
      mini.scale.setScalar(0.32);
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      mini.position.set(-0.36 + col * 0.36, 0.1 + row * 0.28, -0.14 + row * 0.24);
      mini.rotation.y = idx * 0.5;
      group.add(mini);
    });

    requestRenderRef.current();
  }, [items, simpleView]);

  // Brief green flash (#2EE59D) when an item is added
  useEffect(() => {
    if (!pulseKey || simpleView || !rimLightRef.current) return;
    rimLightRef.current.color.setHex(0x2ee59d);
    requestRenderRef.current();
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => {
      if (rimLightRef.current) {
        rimLightRef.current.color.setHex(0xff6a00);
        requestRenderRef.current();
      }
    }, 900);
  }, [pulseKey, simpleView]);

  const totalCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="relative w-full h-[300px] sm:h-[340px] rounded-[20px] bg-[#0B0B0B] border border-white/10 overflow-hidden">
      {simpleView ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex -space-x-3">
            {items.slice(0, 4).map((item) => {
              const p = CATALOG.find((c) => c.id === item.productId);
              if (!p) return null;
              return (
                <img
                  key={`${item.productId}-${item.variantName}`}
                  src={p.imageUrl}
                  alt={p.title}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#111111]"
                />
              );
            })}
          </div>
          <p className="text-sm text-[#9A9A9A]">
            {totalCount} item{totalCount === 1 ? '' : 's'} ready for checkout
          </p>
        </div>
      ) : (
        <div
          ref={mountRef}
          data-testid="three-cart-canvas"
          className="w-full h-full cursor-grab active:cursor-grabbing"
          aria-label="Interactive 3D glass shopping cart"
        />
      )}

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
        <span className="px-3 py-1.5 rounded-lg bg-[#141414]/95 border border-white/10 text-xs text-[#F5F5F5] tabular-nums pointer-events-auto">
          3D Tote · {totalCount} item{totalCount === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={onToggleSimpleView}
          className="px-3 py-1.5 rounded-lg bg-[#141414]/95 border border-white/10 text-xs font-medium text-[#F5F5F5] hover:border-[#FF6A00]/60 transition-colors cursor-pointer pointer-events-auto"
        >
          {simpleView ? 'Switch to 3D Cart' : 'Simple View'}
        </button>
      </div>
    </div>
  );
};
