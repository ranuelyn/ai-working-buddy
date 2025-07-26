import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type BuddyProps = {
  headTurnY: number;
};

const EPSILON = 0.02; // Hedef açıya yakınlık toleransı

export const Buddy = ({ headTurnY }: BuddyProps) => {
  const model = useGLTF("./assets/buddy.glb");
  const groupRef = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(model.animations, groupRef);
  const headNodeRef = useRef<THREE.Object3D | null>(null);
  const [currentY, setCurrentY] = useState(0);
  const [animState, setAnimState] = useState<'playing' | 'stopped'>('playing');
  const [targetY, setTargetY] = useState(0);

//   useEffect(() => {
//   model.scene.traverse((obj) => {
//     if ((obj as THREE.Mesh).isMesh) {
//       console.log("Mesh:", obj.name);
//     }
//   });
// }, [model]);

  // // Debug: Morph target (blend shape) isimlerini konsola yazdır
  // useEffect(() => {
  //   model.scene.traverse((obj) => {
  //     if ((obj as THREE.Mesh).morphTargetDictionary) {
  //       const mesh = obj as THREE.Mesh;
  //       console.log("Morph targets for", mesh.name, ":", mesh.morphTargetDictionary);
  //     }
  //   });
  // }, [model]);

  // // Debug: Animasyon isimlerini ve actions'ı konsola yazdır
  // useEffect(() => {
  //   console.log("Animasyon isimleri:", names);
  //   console.log("Actions:", actions);
  //   console.log("Model animasyonları:", model.animations);
  // }, [names, actions, model]);

  // Head node'u bir kez bul ve referansa ata
  useEffect(() => {
    if (!model.scene) return;
    model.scene.traverse((obj) => {
      if (obj.name === "Head_10") {
        headNodeRef.current = obj;
      }
    });
  }, [model]);

  // Başlangıçta animasyonu başlat
  useEffect(() => {
    if (!actions || names.length === 0) return;
    const action = actions[names[0]];
    if (!action) return;
    
    // Animasyonu başlat
    action.reset();
    action.paused = false;
    action.play();
    setAnimState('playing');
  }, [actions, names]);

  // Kullanıcı kafa döndürmek isterse animasyonu durdur ve hedef açıyı ayarla
  useEffect(() => {
    if (!actions || names.length === 0) return;
    const action = actions[names[0]];
    if (!action) return;
    if (headTurnY !== 0) {
      if (animState !== 'stopped') {
        action.stop();
        setAnimState('stopped');
      }
      setTargetY(headTurnY);
    } else {
      setTargetY(0);
    }
  }, [headTurnY, actions, names, animState]);

  // Kafayı sadece animasyon durduysa smooth döndür
  useFrame(() => {
    if (headNodeRef.current) {
      if (animState === 'stopped') {
        const lerpSpeed = 0.08;
        const newY = THREE.MathUtils.lerp(headNodeRef.current.rotation.y, targetY, lerpSpeed);
        headNodeRef.current.rotation.y = newY;
        setCurrentY(newY);
      }
    }
  });

  // Kafa düzdeyse ve açı neredeyse sıfırsa animasyonu başlat
  useEffect(() => {
    if (!actions || names.length === 0) return;
    const action = actions[names[0]];
    if (!action) return;
    if (Math.abs(currentY - 0) < EPSILON && headTurnY === 0) {
      if (animState !== 'playing') {
        action.reset();
        action.paused = false;
        action.play();
        setAnimState('playing');
      }
    }
  }, [currentY, headTurnY, actions, names, animState]);

  return (
    <group ref={groupRef}>
      <primitive object={model.scene} />
    </group>
  );
};

useGLTF.preload("./assets/buddy.glb");