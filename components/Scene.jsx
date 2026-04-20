"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function Scene({
  modelSrc = "/Vedvan Block-AB.fbx",
  modelPosition = "0 0 -3",
  height = "70vh",
}) {
  const [isClientReady, setIsClientReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
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

  if (!isClientReady) {
    return (
      <div className="flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300" style={{ height }}>
        Loading 3D scene...
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height }}>
      <a-scene embedded renderer="antialias: true; colorManagement: true" background="color: #dbeafe">
        <a-assets timeout="30000">
          <a-asset-item id="vedvan-model" src={modelSrc}></a-asset-item>
        </a-assets>

        <a-entity camera look-controls position="0 1.6 0">
          <a-cursor color={isHovered ? "#22c55e" : "#ffffff"}></a-cursor>
        </a-entity>

        <a-light type="ambient" color="#ffffff" intensity="0.6"></a-light>
        <a-light type="directional" color="#ffffff" intensity="0.8" position="1 3 2"></a-light>

        <a-plane
          position="0 -0.5 -3"
          rotation="-90 0 0"
          width="16"
          height="16"
          color="#93c5fd"
          shadow="receive: true"
        ></a-plane>

        <a-entity
          ref={modelRef}
          {...modelProps}
          position={modelPosition}
          scale="0.01 0.01 0.01"
          animation="property: rotation; to: 0 360 0; loop: true; dur: 12000; easing: linear"
        ></a-entity>

        <a-entity
          position="0 2.3 -3"
          text={`value: ${isHovered ? "Hovering model" : `Clicks: ${clickCount}`}; align: center; color: #111827; width: 4`}
        ></a-entity>
      </a-scene>
    </div>
  );
}
