import { OrbitControls } from "@react-three/drei";
import { Buddy } from "./Buddy";
import { useEffect, useRef, useState } from "react";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

const BackgroundRoom = () => {
  const model = useGLTF("/assets/abandoned_room_interior_style_5.glb");
  return (
    <primitive 
      object={model.scene} 
      position={[-4, 0.0001, 7]} // Yerde ve Buddy'nin arkasında
      scale={[0.05, 0.05, 0.05]} // Odayı büyüt
    />
  );
};

export const Experience = ({ headTurnY, cameraTarget, cameraPosition }: { headTurnY: number; cameraTarget: [number, number, number]; cameraPosition: [number, number, number] }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [prevPos, setPrevPos] = useState<THREE.Vector3 | null>(null);
  const [prevTarget, setPrevTarget] = useState<THREE.Vector3 | null>(null);
  const [transition, setTransition] = useState(false);
  const [t, setT] = useState(0); // 0: baş, 1: son

  // Hedef değiştiğinde geçiş başlat
  useEffect(() => {
    if (controlsRef.current) {
      setPrevPos(controlsRef.current.object.position.clone());
      setPrevTarget(controlsRef.current.target.clone());
      setT(0);
      setTransition(true);
    }
  }, [cameraPosition, cameraTarget]);

  useFrame(() => {
    if (controlsRef.current) {
      const cam = controlsRef.current.object;
      const tgt = controlsRef.current.target;
      if (transition && prevPos && prevTarget) {
        // Linear (lerpVectors) ile pozisyonu ve target'ı güncelle
        const to = new THREE.Vector3(...cameraPosition);
        const lerpedPos = new THREE.Vector3();
        lerpedPos.lerpVectors(prevPos, to, t);
        cam.position.copy(lerpedPos);
        const targetTo = new THREE.Vector3(...cameraTarget);
        const lerpedTarget = new THREE.Vector3();
        lerpedTarget.lerpVectors(prevTarget, targetTo, t);
        tgt.copy(lerpedTarget);
        controlsRef.current.update();
        // t'yi yavaş artır (daha yavaş geçiş için 0.015)
        if (t < 1) {
          setT(t + 0.015);
        } else {
          setTransition(false);
        }
      } else {
        // Hedefteyken doğrudan set et
        cam.position.lerp(new THREE.Vector3(...cameraPosition), 0.08);
        tgt.lerp(new THREE.Vector3(...cameraTarget), 0.08);
        controlsRef.current.update();
      }
    }
  });

  //useEffect(() => {
  //  const interval = setInterval(() => {
  //    if (controlsRef.current && controlsRef.current.object) {
  //      const cam = controlsRef.current.object;
  //      const pos = cam.position;
  //      const target = controlsRef.current.target;
  //      console.log("Kamera pozisyonu:", pos.x, pos.y, pos.z);
  //      console.log("Kamera target:", target.x, target.y, target.z);
  //    }
  //  }, 1000);
  //  return () => clearInterval(interval);
  //}, []);

  return (
    <>
      <OrbitControls ref={controlsRef} makeDefault />
      <directionalLight position={[1, 2, 3]} intensity={4.5} />
      <ambientLight intensity={1.5} />
      <BackgroundRoom />
      <Buddy headTurnY={headTurnY} />
    </>
  );
};