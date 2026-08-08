"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import gsap from "gsap";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import * as THREE from "three";

const ORANGE = "#FF5500";
const ORANGE_DEEP = "#E04800";
const ORANGE_SOFT = "#FF6B24";
const NAVY = "#0B0F19";
const PARTICLE_COUNT = 6_000;
const STORM_COUNT = 12_000;
const BOX = 1.4;
const WALL = 0.09;
/** X logo half-extent — kept inside camera frame */
const X_SIZE = 1.35;

type Phase = "idle" | "anticipate" | "opening" | "morph" | "outro";

export type GiftBeat =
  | "idle"
  | "anticipate"
  | "opening"
  | "rise"
  | "welcome"
  | "done";

type AnimState = {
  open: number;
  rise: number;
  morph: number;
  boxFade: number;
  /** Cosmic particle storm burst (0–1) */
  storm: number;
  /** Pre-open tremble amplitude (0–1) */
  shake: number;
  /** Sparkle burst around emerging sphere (0–1) */
  sparkle: number;
};

function hash01(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function sampleSphere(i: number, count: number, radius: number): THREE.Vector3 {
  // Fibonacci sphere — evenly distributed
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / Math.max(1, count - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = golden * i;
  return new THREE.Vector3(
    Math.cos(theta) * r * radius,
    y * radius,
    Math.sin(theta) * r * radius
  );
}

function sampleX(i: number, count: number, size = X_SIZE): THREE.Vector3 {
  const half = Math.floor(count / 2);
  const arm = i < half ? 0 : 1;
  const local = arm === 0 ? i : i - half;
  const armCount = arm === 0 ? half : count - half;
  const u = (local + 0.5) / armCount;
  const t = u * 2 - 1;
  const thick = 0.11;
  const ox = (hash01(i * 1.3) - 0.5) * thick;
  const oy = (hash01(i * 2.1) - 0.5) * thick;
  const oz = (hash01(i * 3.9) - 0.5) * thick * 1.1;
  if (arm === 0) return new THREE.Vector3(t * size + ox, t * size + oy, oz);
  return new THREE.Vector3(t * size + ox, -t * size + oy, oz);
}

function makeShellMat(shade: string = ORANGE) {
  return new THREE.MeshStandardMaterial({
    color: shade,
    metalness: 0.35,
    roughness: 0.42,
    emissive: ORANGE_DEEP,
    emissiveIntensity: 0.22,
    side: THREE.FrontSide,
  });
}

/** Opaque orange gift box — body + separate lid with skirt. */
function SolidCube({
  anim,
  phase,
  onOpen,
}: {
  anim: MutableRefObject<AnimState>;
  phase: Phase;
  onOpen: () => void;
}) {
  const root = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const hovered = useRef(false);

  const mats = useMemo(
    () => ({
      shell: makeShellMat(ORANGE),
      side: makeShellMat(ORANGE_SOFT),
      bottom: makeShellMat(ORANGE_DEEP),
      lid: makeShellMat(ORANGE),
      lidSide: makeShellMat(ORANGE_SOFT),
      inner: new THREE.MeshStandardMaterial({
        color: ORANGE_DEEP,
        roughness: 0.75,
        metalness: 0.15,
        emissive: ORANGE,
        emissiveIntensity: 0.2,
      }),
    }),
    []
  );

  useFrame((_, delta) => {
    const open = anim.current.open;
    const fade = anim.current.boxFade;
    const shake = anim.current.shake;

    if (lid.current) {
      lid.current.rotation.x = -open * Math.PI * 0.95;
    }
    if (body.current) {
      body.current.position.y = -fade * 1.8;
      body.current.rotation.x = fade * 0.25;
    }
    if (root.current) {
      const pulse =
        phase === "idle" ? 1 + Math.sin(performance.now() * 0.0028) * 0.025 : 1;
      const hover = hovered.current && phase === "idle" ? 1.05 : 1;
      root.current.scale.setScalar(pulse * hover);
      const t = performance.now() * 0.055;
      root.current.position.x = Math.sin(t * 1.7) * shake * 0.045;
      root.current.position.z = Math.cos(t * 2.1) * shake * 0.03;
      if (phase === "idle") root.current.rotation.y += delta * 0.32;
      root.current.visible = fade < 0.98;

      root.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.Material) {
          const m = obj.material as THREE.MeshStandardMaterial;
          if ("opacity" in m) {
            m.transparent = fade > 0.01;
            m.opacity = 1 - fade;
          }
        }
      });
    }
  });

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (phase !== "idle") return;
    onOpen();
  }

  // Body = open-top box; Lid = separate cap with short skirt (gift-box style)
  const bodySize = BOX;
  const bodyH = BOX * 0.78;
  const lidOver = 0.045;
  const lidSize = bodySize + lidOver * 2;
  const lidTop = WALL * 0.95;
  const lidSkirt = WALL * 1.15;
  const bodyTopY = -BOX / 2 + bodyH;
  const halfB = bodySize / 2;

  return (
    <Float
      speed={phase === "idle" ? 1.4 : 0.15}
      rotationIntensity={phase === "idle" ? 0.25 : 0}
      floatIntensity={phase === "idle" ? 0.3 : 0}
    >
      <group
        ref={root}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (phase === "idle") {
            hovered.current = true;
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          hovered.current = false;
          document.body.style.cursor = "auto";
        }}
      >
        <group ref={body}>
          {/* Bottom */}
          <mesh position={[0, -BOX / 2 + WALL / 2, 0]} material={mats.bottom}>
            <boxGeometry args={[bodySize, WALL, bodySize]} />
          </mesh>
          {/* Four walls — open top */}
          <mesh
            position={[0, -BOX / 2 + WALL + (bodyH - WALL) / 2, halfB - WALL / 2]}
            material={mats.side}
          >
            <boxGeometry args={[bodySize, bodyH - WALL, WALL]} />
          </mesh>
          <mesh
            position={[0, -BOX / 2 + WALL + (bodyH - WALL) / 2, -halfB + WALL / 2]}
            material={mats.side}
          >
            <boxGeometry args={[bodySize, bodyH - WALL, WALL]} />
          </mesh>
          <mesh
            position={[halfB - WALL / 2, -BOX / 2 + WALL + (bodyH - WALL) / 2, 0]}
            material={mats.shell}
          >
            <boxGeometry args={[WALL, bodyH - WALL, bodySize - WALL * 2]} />
          </mesh>
          <mesh
            position={[-halfB + WALL / 2, -BOX / 2 + WALL + (bodyH - WALL) / 2, 0]}
            material={mats.shell}
          >
            <boxGeometry args={[WALL, bodyH - WALL, bodySize - WALL * 2]} />
          </mesh>
          {/* Inner floor */}
          <mesh position={[0, -BOX / 2 + WALL + 0.02, 0]} material={mats.inner}>
            <boxGeometry args={[bodySize - WALL * 2, 0.04, bodySize - WALL * 2]} />
          </mesh>
        </group>

        {/* Separate gift lid — top plate + downward skirt, hinged at back */}
        <group ref={lid} position={[0, bodyTopY, -lidSize / 2]}>
          <mesh position={[0, lidTop / 2, lidSize / 2]} material={mats.lid}>
            <boxGeometry args={[lidSize, lidTop, lidSize]} />
          </mesh>
          <mesh
            position={[0, -lidSkirt / 2, lidSize - WALL / 2]}
            material={mats.lidSide}
          >
            <boxGeometry args={[lidSize, lidSkirt, WALL]} />
          </mesh>
          <mesh
            position={[0, -lidSkirt / 2, WALL / 2]}
            material={mats.lidSide}
          >
            <boxGeometry args={[lidSize, lidSkirt, WALL]} />
          </mesh>
          <mesh
            position={[lidSize / 2 - WALL / 2, -lidSkirt / 2, lidSize / 2]}
            material={mats.lidSide}
          >
            <boxGeometry args={[WALL, lidSkirt, lidSize - WALL * 2]} />
          </mesh>
          <mesh
            position={[-lidSize / 2 + WALL / 2, -lidSkirt / 2, lidSize / 2]}
            material={mats.lidSide}
          >
            <boxGeometry args={[WALL, lidSkirt, lidSize - WALL * 2]} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

/**
 * Full-viewport cosmic particle storm — bursts out as the lid opens.
 */
function CosmicStorm({ anim }: { anim: MutableRefObject<AnimState> }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { origin, space } = useMemo(() => {
    const origin = new Float32Array(STORM_COUNT * 3);
    const space = new Float32Array(STORM_COUNT * 3);
    for (let i = 0; i < STORM_COUNT; i++) {
      const i3 = i * 3;
      // Clustered inside the cube
      origin[i3] = (hash01(i * 0.13) - 0.5) * 0.85;
      origin[i3 + 1] = (hash01(i * 0.29) - 0.5) * 0.85;
      origin[i3 + 2] = (hash01(i * 0.47) - 0.5) * 0.85;

      // Wide nebula / starfield shell
      const r = 4 + hash01(i * 0.61) * 14;
      const theta = hash01(i * 0.73) * Math.PI * 2;
      const phi = Math.acos(2 * hash01(i * 0.89) - 1);
      space[i3] = r * Math.sin(phi) * Math.cos(theta);
      space[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.72;
      space[i3 + 2] = r * Math.cos(phi);
    }
    return { origin, space };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(origin.slice(), 3));
    return geo;
  }, [origin]);

  useFrame((_, delta) => {
    const storm = anim.current.storm;
    const morph = anim.current.morph;
    if (storm < 0.001 && pointsRef.current) {
      pointsRef.current.visible = false;
      return;
    }

    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    // Ease-out burst so particles rush outward then settle
    const t = 1 - Math.pow(1 - storm, 2.4);

    for (let i = 0; i < STORM_COUNT; i++) {
      const i3 = i * 3;
      const stagger = Math.min(1, t * (0.55 + hash01(i * 0.21) * 0.55));
      arr[i3] = origin[i3] + (space[i3] - origin[i3]) * stagger;
      arr[i3 + 1] = origin[i3 + 1] + (space[i3 + 1] - origin[i3 + 1]) * stagger;
      arr[i3 + 2] = origin[i3 + 2] + (space[i3 + 2] - origin[i3 + 2]) * stagger;
    }
    attr.needsUpdate = true;

    if (pointsRef.current) {
      pointsRef.current.visible = true;
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      // Strong during open, soften a bit when X forms so logo stays readable
      mat.opacity = Math.min(0.95, storm * 0.9) * (1 - morph * 0.25);
      mat.size = 0.018 + storm * 0.028;
      pointsRef.current.rotation.y += delta * (0.04 + storm * 0.06);
      pointsRef.current.rotation.x += delta * 0.015 * storm;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} visible={false}>
      <pointsMaterial
        size={0.02}
        color={ORANGE}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Orange core sphere that rises from the box, then particle-morphs into an X.
 */
function SphereToX({ anim }: { anim: MutableRefObject<AnimState> }) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const sparkleRef = useRef<THREE.Points>(null);
  const textRef = useRef<THREE.Group>(null);

  const { spherePos, xPos, sparklePos } = useMemo(() => {
    const spherePos = new Float32Array(PARTICLE_COUNT * 3);
    const xPos = new Float32Array(PARTICLE_COUNT * 3);
    const sparklePos = new Float32Array(400 * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const s = sampleSphere(i, PARTICLE_COUNT, 0.55);
      const x = sampleX(i, PARTICLE_COUNT);
      const i3 = i * 3;
      spherePos[i3] = s.x;
      spherePos[i3 + 1] = s.y;
      spherePos[i3 + 2] = s.z;
      xPos[i3] = x.x;
      xPos[i3 + 1] = x.y;
      xPos[i3 + 2] = x.z;
    }
    for (let i = 0; i < 400; i++) {
      const s = sampleSphere(i, 400, 0.7 + hash01(i) * 0.5);
      sparklePos[i * 3] = s.x;
      sparklePos[i * 3 + 1] = s.y;
      sparklePos[i * 3 + 2] = s.z;
    }
    return { spherePos, xPos, sparklePos };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(spherePos.slice(), 3));
    return geo;
  }, [spherePos]);

  const sparkleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(sparklePos.slice(), 3)
    );
    return geo;
  }, [sparklePos]);

  useFrame((_, delta) => {
    const rise = anim.current.rise;
    const morph = anim.current.morph;
    const open = anim.current.open;
    const sparkle = anim.current.sparkle;

    if (sphereRef.current) {
      const emerge = Math.min(1, rise * 1.2);
      const dissolve = Math.min(1, morph * 1.4);
      sphereRef.current.visible = emerge > 0.02 && dissolve < 0.95;
      // Soft float while rising
      const floatY = Math.sin(performance.now() * 0.003) * 0.04 * emerge;
      sphereRef.current.position.y = -0.1 + rise * 0.7 + floatY;
      sphereRef.current.scale.setScalar(
        0.12 + emerge * 0.42 * (1 - dissolve * 0.85)
      );
      const mat = sphereRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = emerge * (1 - dissolve);
      mat.emissiveIntensity = 0.6 + emerge * 1.4 + sparkle * 1.2;
      sphereRef.current.rotation.y += delta * 0.6;
    }

    if (lightRef.current) {
      lightRef.current.intensity =
        open * 1.2 + rise * 4 + morph * 6 + sparkle * 3;
      lightRef.current.position.y = -0.1 + rise * 1.1;
    }

    if (sparkleRef.current) {
      const mat = sparkleRef.current.material as THREE.PointsMaterial;
      const show = sparkle * (1 - morph * 0.9);
      sparkleRef.current.visible = show > 0.02;
      mat.opacity = show * 0.9;
      mat.size = 0.035 + sparkle * 0.04;
      sparkleRef.current.position.y = -0.1 + rise * 0.7;
      sparkleRef.current.rotation.y += delta * 0.8;
      sparkleRef.current.scale.setScalar(0.8 + sparkle * 0.6);
    }

    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const ease = morph * morph * (3 - 2 * morph);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const stagger = Math.min(1, ease * (0.65 + hash01(i * 0.17) * 0.55));
      arr[i3] = spherePos[i3] + (xPos[i3] - spherePos[i3]) * stagger;
      arr[i3 + 1] =
        spherePos[i3 + 1] +
        (xPos[i3 + 1] - spherePos[i3 + 1]) * stagger +
        rise * 0.55;
      arr[i3 + 2] = spherePos[i3 + 2] + (xPos[i3 + 2] - spherePos[i3 + 2]) * stagger;
    }
    attr.needsUpdate = true;

    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.opacity = Math.min(1, rise * 0.35 + morph * 0.9);
      mat.size = 0.022 + morph * 0.016;
      pointsRef.current.rotation.y += delta * (0.12 + morph * 0.15);
      pointsRef.current.visible = rise > 0.05;
    }

    if (textRef.current) {
      const show = Math.max(0, (morph - 0.55) / 0.45);
      textRef.current.visible = show > 0.02;
      textRef.current.scale.setScalar(0.7 + show * 0.3);
    }
  });

  return (
    <group>
      <mesh ref={sphereRef} visible={false}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          color={ORANGE}
          emissive={ORANGE}
          emissiveIntensity={1}
          metalness={0.2}
          roughness={0.25}
          transparent
          opacity={0}
        />
      </mesh>

      <pointLight
        ref={lightRef}
        color={ORANGE}
        intensity={0}
        distance={14}
        decay={2}
        position={[0, 0, 0]}
      />

      <points ref={sparkleRef} geometry={sparkleGeo} visible={false}>
        <pointsMaterial
          size={0.04}
          color="#FFE0C2"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <points ref={pointsRef} geometry={geometry} visible={false}>
        <pointsMaterial
          size={0.03}
          color={ORANGE}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <group ref={textRef} position={[0, -1.55, 0]} visible={false}>
        <Text
          fontSize={0.2}
          color={ORANGE}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
        >
          Welcome to INTERX
        </Text>
      </group>
    </group>
  );
}

function Scene({
  onComplete,
  onUnboxStart,
  onBeat,
}: {
  onComplete: () => void;
  onUnboxStart?: () => void;
  onBeat?: (beat: GiftBeat) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const anim = useRef<AnimState>({
    open: 0,
    rise: 0,
    morph: 0,
    boxFade: 0,
    storm: 0,
    shake: 0,
    sparkle: 0,
  });
  const started = useRef(false);

  const runUnboxing = useCallback(() => {
    if (started.current) return;
    started.current = true;
    document.body.style.cursor = "auto";
    onUnboxStart?.();
    onBeat?.("anticipate");

    const a = anim.current;
    const tl = gsap.timeline({
      onComplete: () => {
        setPhase("outro");
        onBeat?.("done");
        onComplete();
      },
    });

    // Anticipation — tremble
    setPhase("anticipate");
    tl.to(a, { shake: 1, duration: 0.18, ease: "power1.inOut", yoyo: true, repeat: 5 });
    tl.add(() => {
      setPhase("opening");
      onBeat?.("opening");
    });

    // Lid opens + cosmic storm
    tl.to(a, { open: 1, duration: 1.15, ease: "power2.inOut" }, "+=0.05");
    tl.to(a, { shake: 0, duration: 0.2 }, "<");
    tl.to(a, { storm: 1, duration: 2.0, ease: "power2.out" }, "-=0.95");

    // Sphere rises with sparkle
    tl.add(() => onBeat?.("rise"), "-=1.2");
    tl.to(a, { rise: 1, duration: 1.25, ease: "power2.out" }, "-=1.15");
    tl.to(a, { sparkle: 1, duration: 0.55, ease: "power2.out" }, "-=1.1");
    tl.to(a, { sparkle: 0.35, duration: 0.8, ease: "sine.inOut" }, "-=0.4");

    // Box settles away
    tl.to(a, { boxFade: 1, duration: 1.1, ease: "power2.in" }, "-=0.9");

    // Sphere morphs into X + Welcome
    tl.add(() => setPhase("morph"), "-=0.2");
    tl.to(a, { morph: 1, duration: 2.0, ease: "power2.inOut" }, "-=0.15");
    tl.add(() => onBeat?.("welcome"), "-=0.55");
    tl.to({}, { duration: 3.5 });
  }, [onComplete, onUnboxStart, onBeat]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <>
      <color attach="background" args={[NAVY]} />
      <fog attach="fog" args={[NAVY, 12, 36]} />
      <ambientLight intensity={0.4} color="#1c2438" />
      <directionalLight position={[4, 6, 3]} intensity={0.85} color="#fff5ee" />
      <pointLight position={[-4, 3, -2]} intensity={0.35} color={ORANGE} />
      <SolidCube anim={anim} phase={phase} onOpen={runUnboxing} />
      <CosmicStorm anim={anim} />
      <SphereToX anim={anim} />
    </>
  );
}

/** Click cube → gift unbox → storm → sphere → X → onComplete */
export default function BrandCanvas({
  className = "h-full w-full",
  onComplete,
  onUnboxStart,
  onBeat,
}: {
  className?: string;
  onComplete?: () => void;
  onUnboxStart?: () => void;
  onBeat?: (beat: GiftBeat) => void;
}) {
  return (
    <div className={`bg-[#0B0F19] ${className}`}>
      <Canvas camera={{ position: [0, 0.35, 5.8], fov: 42 }} dpr={[1, 1.75]}>
        <Suspense fallback={null}>
          <Scene
            onComplete={onComplete ?? (() => undefined)}
            onUnboxStart={onUnboxStart}
            onBeat={onBeat}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
