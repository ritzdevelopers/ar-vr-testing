"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function Scene({
  modelSrc = "/Tower-A.glb",
  modelPosition = "0 0 -3",
  cameraPosition = "0 1 -2.6",
  height = "70vh",
}) {
  const [isClientReady, setIsClientReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [modelStatus, setModelStatus] = useState("Loading model...");
  const modelRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadAFrame() {
      await import("aframe");

      // Registers FBX loader support for .fbx assets.
      await import("aframe-extras");

      if (mounted) {
        setIsClientReady(true);
      }
    }

    loadAFrame();

    return () => {
      mounted = false;
    };
  }, []);

  const modelProps = useMemo(() => {
    const isFbx = modelSrc.toLowerCase().endsWith(".fbx");
    return isFbx
      ? { "fbx-model": `url(${modelSrc})` }
      : { "gltf-model": `url(${modelSrc})` };
  }, [modelSrc]);

  useEffect(() => {
    const modelEl = modelRef.current;
    if (!modelEl) {
      return undefined;
    }

    const handleEnter = () => setIsHovered(true);
    const handleLeave = () => setIsHovered(false);
    const handleClick = () => setClickCount((prev) => prev + 1);

    modelEl.addEventListener("mouseenter", handleEnter);
    modelEl.addEventListener("mouseleave", handleLeave);
    modelEl.addEventListener("click", handleClick);

    return () => {
      modelEl.removeEventListener("mouseenter", handleEnter);
      modelEl.removeEventListener("mouseleave", handleLeave);
      modelEl.removeEventListener("click", handleClick);
    };
  }, [isClientReady]);

  useEffect(() => {
    const modelEl = modelRef.current;
    if (!isClientReady || !modelEl) {
      return undefined;
    }

    const handleModelLoaded = () => {
      try {
        const THREE = window.AFRAME?.THREE;
        const mesh = modelEl.getObject3D("mesh");

        if (!THREE || !mesh) {
          setModelStatus("Model loaded.");
          return;
        }

        const box = new THREE.Box3().setFromObject(mesh);
        if (box.isEmpty()) {
          setModelStatus("Model loaded, but mesh appears empty.");
          return;
        }

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const fitScale = 1.6 / maxDim;
          modelEl.object3D.scale.set(fitScale, fitScale, fitScale);
        }

        // Improve GLB material appearance when textures/colors appear too dark.
        mesh.traverse((node) => {
          if (!node.isMesh || !node.material) {
            return;
          }

          const materials = Array.isArray(node.material)
            ? node.material
            : [node.material];

          materials.forEach((material) => {
            if (material.map) {
              if (THREE.SRGBColorSpace) {
                material.map.colorSpace = THREE.SRGBColorSpace;
              } else if (THREE.sRGBEncoding) {
                material.map.encoding = THREE.sRGBEncoding;
              }
            }

            if (material.emissiveMap) {
              if (THREE.SRGBColorSpace) {
                material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
              } else if (THREE.sRGBEncoding) {
                material.emissiveMap.encoding = THREE.sRGBEncoding;
              }
            }

            // Some GLB assets become too dark due to baked AO without uv2 support.
            if (material.aoMap) {
              material.aoMapIntensity = 0;
            }

            if (typeof material.envMapIntensity === "number") {
              material.envMapIntensity = Math.max(material.envMapIntensity, 2.2);
            }

            if (typeof material.metalness === "number") {
              material.metalness = Math.min(material.metalness, 0.55);
            }

            if (typeof material.roughness === "number") {
              material.roughness = Math.min(Math.max(material.roughness, 0.35), 0.8);
            }

            if (typeof material.emissiveIntensity === "number") {
              material.emissiveIntensity = Math.max(material.emissiveIntensity, 0.35);
            }

            material.side = THREE.DoubleSide;

            material.needsUpdate = true;
          });
        });

        // Center model pivot and place it on the ground.
        mesh.position.x -= center.x;
        mesh.position.z -= center.z;
        mesh.position.y -= box.min.y;

        setModelStatus("Model loaded.");
      } catch {
        setModelStatus("Model loaded.");
      }
    };

    const handleModelError = () => {
      setModelStatus("Model failed to load. Check path and FBX format.");
    };

    modelEl.addEventListener("model-loaded", handleModelLoaded);
    modelEl.addEventListener("model-error", handleModelError);

    return () => {
      modelEl.removeEventListener("model-loaded", handleModelLoaded);
      modelEl.removeEventListener("model-error", handleModelError);
    };
  }, [isClientReady, modelSrc]);

  if (!isClientReady) {
    return (
      <div className="flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300" style={{ height }}>
        Loading 3D scene...
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height }}>
      <a-scene
        embedded
        renderer="antialias: true; colorManagement: true; physicallyCorrectLights: true; exposure: 2.3; toneMapping: ACESFilmic"
        background="color: #dbeafe"
      >
        <a-assets timeout="30000">
          <a-asset-item id="vedvan-model" src={modelSrc}></a-asset-item>
        </a-assets>

        <a-entity camera look-controls position={cameraPosition}>
          <a-cursor color={isHovered ? "#22c55e" : "#ffffff"}></a-cursor>
        </a-entity>

        <a-light type="ambient" color="#ffffff" intensity="1.8"></a-light>
        <a-light type="hemisphere" color="#f8fbff" groundColor="#d1d5db" intensity="1.2"></a-light>
        <a-light type="directional" color="#fff8ef" intensity="2.1" position="3 5 3"></a-light>
        <a-light type="directional" color="#f0f9ff" intensity="1.4" position="-3 3 1"></a-light>
        <a-light type="directional" color="#ffffff" intensity="1.1" position="0 2 -4"></a-light>
        <a-sky color="#dbeafe"></a-sky>

        <a-plane
          position="0 -0.5 -3"
          rotation="-90 0 0"
          width="16"
          height="16"
          color="#bfdbfe"
          shadow="receive: true"
        ></a-plane>

        <a-entity
          ref={modelRef}
          {...modelProps}
          position={modelPosition}
          scale="1 1 1"
          animation="property: rotation; to: 0 360 0; loop: true; dur: 12000; easing: linear"
        ></a-entity>

        <a-entity
          position="0 2.3 -3"
          text={`value: ${isHovered ? "Hovering model" : `Clicks: ${clickCount}`} | ${modelStatus}; align: center; color: #111827; width: 6`}
        ></a-entity>
      </a-scene>
    </div>
  );
}
