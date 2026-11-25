"use client";
// v2 — position.set() fix
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ─── Props ─────────────────────────────────────────────────────── */
interface Avatar3DProps {
  isSpeaking: boolean;
  isConnected: boolean;
  /** hex e.g. "#c8956c" */
  skinTone?: string;
  /** hex e.g. "#5b8c5a" */
  eyeColor?: string;
  /** hex e.g. "#1a1008" */
  hairColor?: string;
}

/* ─── Iris canvas texture ───────────────────────────────────────── */
function makeIrisTexture(hexColor: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;

  const base = new THREE.Color(hexColor);
  const r = Math.round(base.r * 255);
  const g = Math.round(base.g * 255);
  const b = Math.round(base.b * 255);

  // Radial depth gradient
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0,   `rgb(${(r * 0.3) | 0},${(g * 0.3) | 0},${(b * 0.3) | 0})`);
  grad.addColorStop(0.3, `rgb(${(r * 0.6) | 0},${(g * 0.6) | 0},${(b * 0.6) | 0})`);
  grad.addColorStop(0.72,`rgb(${r},${g},${b})`);
  grad.addColorStop(1,   `rgb(${(r * 0.55) | 0},${(g * 0.55) | 0},${(b * 0.55) | 0})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Radial fiber lines
  for (let i = 0; i < 56; i++) {
    const angle = (i / 56) * Math.PI * 2 + Math.random() * 0.08;
    const len   = 48 + Math.random() * 60;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128 + Math.cos(angle) * len, 128 + Math.sin(angle) * len);
    ctx.strokeStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.07})`;
    ctx.lineWidth   = 0.5 + Math.random() * 1.2;
    ctx.stroke();
  }

  // Circular clipping mask
  ctx.globalCompositeOperation = "destination-in";
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  return new THREE.CanvasTexture(c);
}

/* ─── Component ─────────────────────────────────────────────────── */
export default function Avatar3D({
  isSpeaking,
  isConnected,
  skinTone  = "#c8956c",
  eyeColor  = "#5b8c5a",
  hairColor = "#1a1008",
}: Avatar3DProps) {
  const mountRef     = useRef<HTMLDivElement>(null);
  const speakingRef  = useRef(isSpeaking);
  const connectedRef = useRef(isConnected);

  useEffect(() => { speakingRef.current  = isSpeaking;   }, [isSpeaking]);
  useEffect(() => { connectedRef.current = isConnected;  }, [isConnected]);

  /* ── Three.js scene (mount-once) ─────────────────────────────── */
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.clientWidth  || 400;
    const H = container.clientHeight || 600;

    /* renderer */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled  = true;
    renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
    renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    renderer.outputColorSpace   = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    /* scene */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060610);
    scene.fog = new THREE.FogExp2(0x060610, 0.028);

    /* camera — portrait framing : head + shoulders */
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 50);
    camera.position.set(0, 0.3, 5.5);
    camera.lookAt(0, -0.2, 0);

    /* ── Lighting: 3-point studio ── */
    scene.add(new THREE.AmbientLight(0x9090b0, 1.4));

    // Key — warm upper-left
    const keyLight = new THREE.SpotLight(0xfff8e7, 6.5);
    keyLight.position.set(-2.0, 2.8, 3.5);
    keyLight.target.position.set(0, 0.1, 0);
    keyLight.angle = Math.PI / 5;
    keyLight.penumbra = 0.60;
    keyLight.decay = 1.2;
    keyLight.distance = 18;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight, keyLight.target);

    // Fill — symmetric right-side (balanced with key)
    const fillLight = new THREE.PointLight(0xd0e8ff, 3.5, 14, 2);
    fillLight.position.set(2.0, 1.0, 3.5);
    scene.add(fillLight);

    // Front fill — broad face illumination
    const frontLight = new THREE.PointLight(0xfff8e0, 2.5, 12, 2);
    frontLight.position.set(0, 0.3, 5.5);
    scene.add(frontLight);

    // Rim — from behind for silhouette
    const rimLight = new THREE.SpotLight(0xffebd0, 3.0);
    rimLight.position.set(0.6, 2.2, -3.2);
    rimLight.target.position.set(0, 0.3, 0);
    rimLight.angle = Math.PI / 5;
    rimLight.penumbra = 0.45;
    scene.add(rimLight, rimLight.target);

    // Under fill — subtle bounce
    const underLight = new THREE.PointLight(0x4a4a6a, 0.8, 6, 2);
    underLight.position.set(0, -1.6, 1.0);
    scene.add(underLight);

    /* ── Materials ── */
    const skinCol = new THREE.Color(skinTone);

    const skinMat = new THREE.MeshStandardMaterial({
      color: skinCol,
      roughness: 0.63,
      metalness: 0.02,
    });
    const darkSkinMat = new THREE.MeshStandardMaterial({
      color: skinCol.clone().multiplyScalar(0.80),
      roughness: 0.70,
      metalness: 0.0,
    });
    const lipMat = new THREE.MeshStandardMaterial({
      color: skinCol.clone().lerp(new THREE.Color(0.6, 0.25, 0.22), 0.25),
      roughness: 0.55,
      metalness: 0.0,
    });
    const browMat = new THREE.MeshStandardMaterial({
      color: skinCol.clone().multiplyScalar(0.5).lerp(new THREE.Color(0.1, 0.07, 0.05), 0.4),
      roughness: 0.90,
      metalness: 0.0,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairColor),
      roughness: 0.88,
      metalness: 0.0,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c2e,
      roughness: 0.85,
      metalness: 0.0,
    });
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xf0ede8,
      roughness: 0.70,
      metalness: 0.0,
    });

    /* ── Head group ── */
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.1, 0);

    /* Head sphere — shaped into cranial proportions */
    const headGeo = new THREE.SphereGeometry(1, 64, 64);
    {
      const pos = headGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        // Skull proportions: narrow sides, slightly squished height, shallower depth
        const cheek = 1 + 0.07 * Math.exp(-(y * y) * 3.5);
        x *= 0.80 * cheek;
        y *= 0.93;
        z *= 0.76;
        // Chin taper
        if (y < -0.25) x *= 1.0 - ((-y - 0.25) * 0.45);
        // Back of head slightly flatter
        if (z < -0.2) z *= 0.88;
        pos.setXYZ(i, x, y, z);
      }
      headGeo.computeVertexNormals();
    }
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headGroup.add(headMesh);

    /* Neck */
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.24, 0.52, 32),
      skinMat
    );
    neck.position.set(0, -0.95, 0);
    neck.castShadow = true;
    headGroup.add(neck);

    /* Shoulders */
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.88, 1.08, 0.5, 32),
      shirtMat
    );
    torso.position.set(0, -1.52, -0.1);
    torso.scale.z = 0.72;
    headGroup.add(torso);

    /* Chest front panel */
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.4), shirtMat);
    chest.position.set(0, -1.44, 0.07);
    headGroup.add(chest);

    /* Collar */
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.26), collarMat);
    collar.position.set(0, -1.21, 0.14);
    headGroup.add(collar);

    /* ── Eyes ── */
    const irisTexL = makeIrisTexture(eyeColor);
    const irisTexR = makeIrisTexture(eyeColor);

    function createEye(tex: THREE.CanvasTexture): THREE.Group {
      const g = new THREE.Group();

      // Socket shadow
      const socket = new THREE.Mesh(new THREE.SphereGeometry(0.165, 24, 24), darkSkinMat);
      socket.position.set(0, 0, -0.03);
      g.add(socket);

      // Sclera
      const scleraMat = new THREE.MeshStandardMaterial({
        color: 0xf4ede4, roughness: 0.12, metalness: 0.0,
      });
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.138, 32, 32), scleraMat));

      // Iris
      const irisDisk = new THREE.Mesh(
        new THREE.CircleGeometry(0.078, 32),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.28, metalness: 0.0 })
      );
      irisDisk.position.z = 0.126;
      g.add(irisDisk);

      // Pupil
      const pupil = new THREE.Mesh(
        new THREE.CircleGeometry(0.038, 32),
        new THREE.MeshStandardMaterial({ color: 0x060304, roughness: 0.5, metalness: 0.0 })
      );
      pupil.position.z = 0.128;
      g.add(pupil);

      // Cornea — high-gloss transparent (specular only)
      const cornea = new THREE.Mesh(
        new THREE.SphereGeometry(0.148, 32, 32),
        new THREE.MeshStandardMaterial({
          transparent: true,
          opacity: 0.0,
          roughness: 0.0,
          metalness: 0.15,
        })
      );
      g.add(cornea);

      // Specular highlight dot (simulates corneal catch-light)
      const specDot = new THREE.Mesh(
        new THREE.CircleGeometry(0.018, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      specDot.position.set(0.038, 0.038, 0.148);
      g.add(specDot);

      // Upper eyelid
      const lidGeo = new THREE.SphereGeometry(0.158, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
      const lid = new THREE.Mesh(lidGeo, new THREE.MeshStandardMaterial({
        color: skinCol.clone().multiplyScalar(0.87), roughness: 0.75,
      }));
      lid.rotation.x = Math.PI;
      lid.position.set(0, 0.025, 0.004);
      lid.name = "upper_lid";
      g.add(lid);

      // Lower eyelid
      const lowerLid = new THREE.Mesh(
        new THREE.SphereGeometry(0.154, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.21),
        new THREE.MeshStandardMaterial({
          color: skinCol.clone().multiplyScalar(0.87), roughness: 0.75,
        })
      );
      lowerLid.position.set(0, -0.02, 0.004);
      g.add(lowerLid);

      return g;
    }

    const eyeL = createEye(irisTexL);
    eyeL.position.set(-0.255, 0.18, 0.72);
    headGroup.add(eyeL);

    const eyeR = createEye(irisTexR);
    eyeR.position.set(0.255, 0.18, 0.72);
    headGroup.add(eyeR);

    /* ── Eyebrows ── */
    function makeBrow(x: number) {
      const brow = new THREE.Mesh(
        new THREE.BoxGeometry(0.195, 0.028, 0.038),
        browMat
      );
      brow.position.set(x, 0.345, 0.70);
      brow.rotation.z = x > 0 ? -0.09 : 0.09;
      brow.rotation.y = x > 0 ? 0.08 : -0.08;
      return brow;
    }
    headGroup.add(makeBrow(-0.252), makeBrow(0.252));

    /* ── Nose ── */
    // Bridge
    const noseBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.22, 0.055),
      skinMat
    );
    noseBridge.position.set(0, 0.025, 0.73);
    noseBridge.scale.z = 0.6;
    headGroup.add(noseBridge);

    // Tip
    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 16), skinMat);
    noseTip.scale.set(1.1, 0.78, 0.88);
    noseTip.position.set(0, -0.1, 0.75);
    headGroup.add(noseTip);

    // Nostrils
    function makeNostril(x: number) {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), darkSkinMat);
      n.scale.set(1, 0.68, 0.58);
      n.position.set(x, -0.17, 0.72);
      return n;
    }
    headGroup.add(makeNostril(-0.072), makeNostril(0.072));

    /* ── Mouth ── */
    const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.048, 0.078), lipMat);
    upperLip.position.set(0, -0.33, 0.70);
    upperLip.name = "upper_lip";
    headGroup.add(upperLip);

    const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.055, 0.088), lipMat);
    lowerLip.position.set(0, -0.40, 0.70);
    lowerLip.name = "lower_lip";
    headGroup.add(lowerLip);

    // Mouth line
    const mouthLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.235, 0.014, 0.025),
      new THREE.MeshStandardMaterial({ color: skinCol.clone().multiplyScalar(0.60), roughness: 0.9 })
    );
    mouthLine.position.set(0, -0.365, 0.715);
    headGroup.add(mouthLine);

    /* ── Ears ── */
    function makeEar(x: number) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
      ear.scale.set(0.5, 0.72, 0.42);
      ear.position.set(x, 0.03, 0.0);
      return ear;
    }
    headGroup.add(makeEar(-0.80), makeEar(0.80));

    /* ── Hair cap ── */
    // Top cap
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(1.04, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.48),
      hairMat
    );
    hairCap.position.y = 0.0;
    headGroup.add(hairCap);

    // Side coverage (temples + sides)
    function makeHairSide(x: number) {
      const side = new THREE.Mesh(
        new THREE.SphereGeometry(0.86, 24, 20, 0, Math.PI * 0.55, Math.PI * 0.22, Math.PI * 0.56),
        hairMat
      );
      side.scale.x = 0.95;
      side.position.set(x * 0.02, 0, 0);
      side.rotation.y = x > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      return side;
    }
    headGroup.add(makeHairSide(-1), makeHairSide(1));

    scene.add(headGroup);

    /* ── Background gradient sphere (vignette) ── */
    const vignetteMesh = new THREE.Mesh(
      new THREE.SphereGeometry(12, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x040310, side: THREE.BackSide })
    );
    scene.add(vignetteMesh);

    /* ── Animation loop ── */
    let animFrame: number;
    let lastTime = 0;

    // Blink state machine
    let blinkTimer   = 0;
    let blinkInterval = 3200 + Math.random() * 4800;
    let blinkPhase   = 0;        // 0=open 1=closing 2=closed 3=opening
    let blinkPhaseT  = 0;

    // Upper lids for quick access
    const lidL = eyeL.getObjectByName("upper_lid") as THREE.Mesh;
    const lidR = eyeR.getObjectByName("upper_lid") as THREE.Mesh;

    // Mesh refs for speaking
    let lowerLipMesh: THREE.Mesh | undefined;
    let upperLipMesh: THREE.Mesh | undefined;
    headGroup.traverse(o => {
      if (o.name === "lower_lip") lowerLipMesh = o as THREE.Mesh;
      if (o.name === "upper_lip") upperLipMesh = o as THREE.Mesh;
    });

    function animate(now: number) {
      animFrame = requestAnimationFrame(animate);

      const t  = now / 1000;
      const dt = lastTime === 0 ? 0 : Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const speaking  = speakingRef.current;

      /* — Organic idle head motion (3 sine waves, non-resonant frequencies) — */
      headGroup.rotation.y =
        Math.sin(t * 0.31) * 0.022 +
        Math.sin(t * 0.73) * 0.008 +
        (speaking ? Math.sin(t * 2.3) * 0.012 : 0);

      headGroup.rotation.x =
        Math.sin(t * 0.27) * 0.010 +
        (speaking ? Math.sin(t * 3.1) * 0.006 : 0);

      headGroup.rotation.z = Math.sin(t * 0.19) * 0.009;

      /* — Breathing — */
      headGroup.position.y = 0.1 + Math.sin(t * 0.42) * 0.006;

      /* — Speaking: jaw movement — */
      if (lowerLipMesh && upperLipMesh) {
        if (speaking) {
          const jaw = (Math.sin(t * 9.7) * 0.5 + 0.5) * 0.045;
          lowerLipMesh.position.y = -0.40 - jaw;
          upperLipMesh.position.y = -0.33 + jaw * 0.18;
        } else {
          lowerLipMesh.position.y = -0.40;
          upperLipMesh.position.y = -0.33;
        }
      }

      /* — Blinking — */
      blinkTimer += dt * 1000;
      if (blinkTimer > blinkInterval && blinkPhase === 0) {
        blinkPhase  = 1;
        blinkPhaseT = 0;
        blinkTimer  = 0;
        blinkInterval = 2600 + Math.random() * 5200;
      }

      if (blinkPhase > 0) {
        blinkPhaseT += dt * 1000;
        const setLidY = (sy: number) => {
          if (lidL) lidL.scale.y = sy;
          if (lidR) lidR.scale.y = sy;
        };

        if (blinkPhase === 1) {         // closing ~70ms
          const p = Math.min(blinkPhaseT / 70, 1);
          setLidY(1 - p * p);
          if (p >= 1) { blinkPhase = 2; blinkPhaseT = 0; }
        } else if (blinkPhase === 2) {  // closed ~50ms
          setLidY(0);
          if (blinkPhaseT > 50) { blinkPhase = 3; blinkPhaseT = 0; }
        } else if (blinkPhase === 3) {  // opening ~110ms (ease-out)
          const p = Math.min(blinkPhaseT / 110, 1);
          setLidY(p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p);
          if (p >= 1) { blinkPhase = 0; }
        }
      }

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    /* ── Resize observer ── */
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(animFrame);
      ro.disconnect();
      renderer.dispose();
      irisTexL.dispose();
      irisTexR.dispose();
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      scene.clear();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // mount-once; speaking/connected state flows through refs

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", display: "block", overflow: "hidden" }}
    />
  );
}
