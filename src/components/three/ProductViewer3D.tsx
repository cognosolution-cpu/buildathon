import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { ProductPreset } from '../../types';
import { buildProceduralProduct, createContactShadowTexture, detectSoftwareGl } from './threeUtils';

interface ProductViewer3DProps {
  preset: ProductPreset;
  accentHex: string;
  title: string;
  imageUrl: string;
  simpleView: boolean;
  onToggleSimpleView: () => void;
}

export const ProductViewer3D: React.FC<ProductViewer3DProps> = ({
  preset,
  accentHex,
  title,
  imageUrl,
  simpleView,
  onToggleSimpleView,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});
  const resetCamRef = useRef<() => void>(() => {});
  const [imgError, setImgError] = React.useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  useEffect(() => {
    if (simpleView) return;
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = Math.max(container.clientWidth, 280);
    const height = Math.max(container.clientHeight, 280);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(1.9, 1.35, 2.35);

    // 3-point warm/cool studio rig + orange rim under-glow
    const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.2);
    keyLight.position.set(2.5, 4.0, 2.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;

    const hemi = new THREE.HemisphereLight(0x9fb8d6, 0x1a120d, 0.9);
    const orangeRim = new THREE.PointLight(0xff6a00, 3.2, 6);
    orangeRim.position.set(-1.6, 0.6, -1.4);
    scene.add(keyLight, hemi, orangeRim);

    // Subtle dark obsidian plinth disc + contact shadow
    const shadowTex = createContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 32),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.008;
    scene.add(shadowPlane);

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.22, 0.08, 40),
      new THREE.MeshStandardMaterial({ color: 0x0e0e10, roughness: 0.65, metalness: 0.2 })
    );
    plinth.position.y = -0.04;
    plinth.receiveShadow = true;
    scene.add(plinth);

    const productGroup = buildProceduralProduct(preset, accentHex);
    groupRef.current = productGroup;
    scene.add(productGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.45, 0);
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 4.2;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.autoRotate = !isSoftwareGl;
    controls.autoRotateSpeed = 1.1;

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
          if (!disposed && (renderDirty || !isSoftwareGl)) {
            if (!isSoftwareGl && controls.autoRotate) {
              requestRender();
            } else if (renderDirty) {
              requestRender();
            }
          }
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    requestRenderRef.current = requestRender;
    resetCamRef.current = () => {
      camera.position.set(1.9, 1.35, 2.35);
      controls.target.set(0, 0.45, 0);
      controls.update();
      requestRender();
    };

    controls.addEventListener('change', requestRender);

    const onResize = () => {
      if (!container || disposed) return;
      const w = Math.max(container.clientWidth, 260);
      const h = Math.max(container.clientHeight, 260);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    requestRender();

    return () => {
      disposed = true;
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

  // Swap procedural model preset or accent color without tearing down WebGLRenderer
  useEffect(() => {
    if (simpleView || !sceneRef.current) return;
    if (groupRef.current) {
      sceneRef.current.remove(groupRef.current);
      groupRef.current.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => m.dispose());
        }
      });
    }
    const nextGroup = buildProceduralProduct(preset, accentHex);
    groupRef.current = nextGroup;
    sceneRef.current.add(nextGroup);
    requestRenderRef.current();
  }, [preset, accentHex, simpleView]);

  return (
    <div className="relative w-full aspect-square max-h-[460px] rounded-[20px] bg-[#0B0B0B] border border-white/10 overflow-hidden">
      {simpleView ? (
        <div
          data-testid="simple-view-photo"
          className="relative z-0 w-full h-full bg-gradient-to-br from-[#16120F] to-[#080808] flex items-center justify-center"
        >
          {!imgError ? (
            <img
              src={imageUrl}
              alt={title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 space-y-2">
              <div
                className="w-16 h-16 rounded-2xl mx-auto border border-white/15 flex items-center justify-center"
                style={{ backgroundColor: accentHex }}
              >
                <span className="font-display text-lg font-bold text-[#050505]">2D</span>
              </div>
              <p className="text-sm font-medium text-[#F5F5F5]">{title}</p>
            </div>
          )}
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#050505]/85 border border-[#2EE59D]/40 text-[11px] font-semibold text-[#2EE59D]">
            2D Studio Photo
          </span>
        </div>
      ) : (
        <div
          ref={mountRef}
          data-testid="three-product-canvas"
          className="relative z-0 w-full h-full cursor-grab active:cursor-grabbing"
          aria-label={`Interactive 3D view of ${title}`}
        />
      )}

      {/* Solid non-blur controls bar per Three.js WebGL rules */}
      <div className="relative z-10 -mt-12 px-3 pb-3 flex items-center justify-between gap-2 pointer-events-none">
        <span className="px-3 py-1.5 rounded-lg bg-[#141414]/95 border border-white/10 text-xs text-[#9A9A9A] pointer-events-auto">
          {simpleView ? 'Simple View (2D)' : 'Drag to rotate 3D'}
        </span>
        <div className="flex items-center gap-2 pointer-events-auto">
          {!simpleView && (
            <button
              type="button"
              onClick={() => resetCamRef.current()}
              className="px-3 py-1.5 rounded-lg bg-[#141414]/95 border border-white/10 text-xs font-medium text-[#F5F5F5] hover:border-[#FF6A00]/60 transition-colors cursor-pointer"
            >
              Reset angle
            </button>
          )}
          <button
            type="button"
            onClick={onToggleSimpleView}
            className="px-3 py-1.5 rounded-lg bg-[#141414]/95 border border-[#FF6A00]/40 text-xs font-medium text-[#FFA040] hover:bg-[#FF6A00] hover:text-[#050505] transition-colors cursor-pointer"
          >
            {simpleView ? 'Switch to 3D View' : 'Simple View (2D)'}
          </button>
        </div>
      </div>
    </div>
  );
};
