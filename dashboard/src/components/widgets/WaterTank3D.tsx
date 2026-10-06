import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Reading } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  latest: Reading | null;
}

/* ------------- Water volume ---------------- */
function WaterVolume({ algaeDetected, isDark }: { algaeDetected: boolean; isDark: boolean }) {
  const color = algaeDetected
    ? isDark ? '#3ab87a' : '#1c8a56'   // brighter green in dark, deeper in light
    : isDark ? '#00c8e5' : '#006a85';  // bright cyan dark, deep blue light
  return (
    <mesh position={[0, 1.25, 0]}>
      <boxGeometry args={[2.4, 2.5, 2.4]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={isDark ? 0.5 : 0.65}
        roughness={0.1}
        metalness={0.2}
        transmission={0.4}
        thickness={1}
      />
    </mesh>
  );
}

/* ------------- Tank cage ---------------- */
function TankCage({ isDark }: { isDark: boolean }) {
  return (
    <mesh position={[0, 1.25, 0]}>
      <boxGeometry args={[2.6, 2.6, 2.6]} />
      <meshBasicMaterial
        color={isDark ? '#ffffff' : '#0A0E1A'}
        wireframe
        transparent
        opacity={isDark ? 0.18 : 0.35}
      />
    </mesh>
  );
}

/* ------------- LDR probe (attached to a wall, rod + sensor bead) ------------- */
function LDRProbe({
  y,
  isDark,
  label,
  transmission,
}: {
  y: number;
  isDark: boolean;
  label: string;
  transmission: number;
}) {
  // Wall at x = -1.25. Rod extends inward to x = -0.6
  const rodStart = -1.25;
  const rodEnd = -0.6;
  const rodLength = rodEnd - rodStart;
  const rodCenter = (rodStart + rodEnd) / 2;

  // Color follows transmission (red when algae risk)
  const sensorColor = transmission < 60 ? '#ff4d6d' : isDark ? '#00e5ff' : '#006a85';
  const rodColor = isDark ? '#cfd8e0' : '#3a4a5a';

  return (
    <group>
      {/* Rod from wall into water (horizontal, along X axis) */}
      <mesh position={[rodCenter, y, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, Math.abs(rodLength), 8]} />
        <meshStandardMaterial color={rodColor} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Bracket at wall */}
      <mesh position={[rodStart, y, 0]}>
        <boxGeometry args={[0.08, 0.15, 0.15]} />
        <meshStandardMaterial color={rodColor} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Sensor bead at the tip */}
      <mesh position={[rodEnd, y, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color={sensorColor}
          emissive={sensorColor}
          emissiveIntensity={isDark ? 1.8 : 0.9}
        />
      </mesh>

      {/* Small halo ring around sensor */}
      <mesh position={[rodEnd, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.015, 12, 24]} />
        <meshBasicMaterial color={sensorColor} transparent opacity={0.7} />
      </mesh>

      {/* Label sprite — small colored block above probe */}
      <mesh position={[rodEnd, y + 0.25, 0]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={sensorColor} />
      </mesh>
      {label && null}
    </group>
  );
}

/* ------------- DS18B20 temp probe (vertical rod into water) ------------- */
function TempProbe({ isDark, temperature }: { isDark: boolean; temperature: number }) {
  // Position in a corner, hanging from above
  const x = 0.9;
  const z = -0.9;
  const topY = 3.2;   // sticks out top
  const tipY = 1.4;   // submerged tip
  const length = topY - tipY;
  const centerY = (topY + tipY) / 2;

  // Color shifts from blue (cold) to warm (yellow-ish) based on temp
  const hue = Math.max(0, Math.min(1, (temperature - 15) / 20));
  const tempColor = isDark
    ? `hsl(${200 - hue * 200}, 90%, 65%)`
    : `hsl(${200 - hue * 200}, 70%, 45%)`;

  const metalColor = isDark ? '#c8cdd4' : '#5a6470';
  const cableColor = isDark ? '#1a1a1a' : '#3a3a3a';

  return (
    <group position={[x, 0, z]}>
      {/* Stainless tube — submerged portion */}
      <mesh position={[0, centerY, 0]}>
        <cylinderGeometry args={[0.05, 0.05, length, 12]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>

      {/* Sensor tip */}
      <mesh position={[0, tipY, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={tempColor}
          emissive={tempColor}
          emissiveIntensity={isDark ? 1.2 : 0.6}
        />
      </mesh>

      {/* Top cap / connector */}
      <mesh position={[0, topY + 0.06, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Cable going up (fades out) */}
      <mesh position={[0, topY + 0.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
        <meshStandardMaterial color={cableColor} />
      </mesh>
    </group>
  );
}

/* ------------- Pump ---------------- */
function Pump({ pumpOn, isDark }: { pumpOn: boolean; isDark: boolean }) {
  const bladeRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (bladeRef.current && pumpOn) bladeRef.current.rotation.y += delta * 6;
  });
  const color = pumpOn ? '#00ffa3' : isDark ? '#555' : '#999';
  const bodyColor = isDark ? '#1a2332' : '#c8cdd4';

  return (
    <group position={[1.9, 0.3, 1.9]}>
      <mesh>
        <boxGeometry args={[0.5, 0.6, 0.5]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh ref={bladeRef} position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.06, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={pumpOn ? 1.5 : 0}
        />
      </mesh>
    </group>
  );
}

/* ------------- Rotating wrapper ---------------- */
function RotatingScene({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.18;
  });
  return <group ref={ref}>{children}</group>;
}

/* ------------- Main export ---------------- */
export default function WaterTank3D({ latest }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const transmission = latest?.light_transmission ?? 80;
  const algaeDetected = latest?.algae_detected ?? false;
  const pumpOn = latest?.pump_on ?? false;
  const temperature = latest?.temperature ?? 24;

  // Top LDR: at water surface (y = 2.5, exactly at water top)
  const topLDRY = 2.5;
  // Bottom LDR: 60% below surface → 2.5 - 0.6 * 2.5 = 1.0
  const bottomLDRY = 1.0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-0">
        <h2 className="text-sm uppercase tracking-widest text-white/60">Digital Twin</h2>
        <span className="text-xs font-mono text-white/40">
          Clarity: {transmission.toFixed(0)}%
        </span>
      </div>

      <div style={{ height: 380 }} className="mt-3">
        <Canvas
          camera={{ position: [5, 4, 5], fov: 45 }}
          style={{ background: isDark ? '#0A0E1A' : '#EEF2F7' }}
        >
          <ambientLight intensity={isDark ? 0.5 : 0.85} />
          <directionalLight position={[6, 8, 6]} intensity={isDark ? 1 : 1.3} />
          <pointLight position={[-4, 4, -4]} intensity={0.6} color={isDark ? '#00e5ff' : '#0091b0'} />
          <pointLight position={[4, 6, -4]} intensity={0.4} color="#ffffff" />

          <RotatingScene>
            <TankCage isDark={isDark} />
            <WaterVolume algaeDetected={algaeDetected} isDark={isDark} />

            {/* Two LDR probes attached to left wall */}
            <LDRProbe y={topLDRY} isDark={isDark} label="TOP" transmission={transmission} />
            <LDRProbe y={bottomLDRY} isDark={isDark} label="BOTTOM" transmission={transmission} />

            {/* DS18B20 temp probe */}
            <TempProbe isDark={isDark} temperature={temperature} />

            {/* Pump */}
            <Pump pumpOn={pumpOn} isDark={isDark} />
          </RotatingScene>

          <OrbitControls
            enablePan={false}
            minDistance={4}
            maxDistance={12}
            target={[0, 1.3, 0]}
          />
        </Canvas>
      </div>

      <div className="px-5 pb-5 grid grid-cols-3 gap-2 text-[10px] font-mono uppercase tracking-widest">
        <div className="flex items-center gap-2 text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00e5ff]" />
          <span>Clear: {transmission >= 60 ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex items-center gap-2 text-white/50">
          <span className={`h-1.5 w-1.5 rounded-full ${algaeDetected ? 'bg-[#ff4d6d]' : 'bg-white/20'}`} />
          <span>Algae: {algaeDetected ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex items-center gap-2 text-white/50">
          <span className={`h-1.5 w-1.5 rounded-full ${pumpOn ? 'bg-[#00ffa3] animate-pulse' : 'bg-white/20'}`} />
          <span>Pump: {pumpOn ? 'On' : 'Off'}</span>
        </div>
      </div>
    </div>
  );
}