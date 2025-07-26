import { useGLTF } from "@react-three/drei";

export const Jellyfish = () => {
  const model = useGLTF("./assets/jellyfish.glb");

  return (
    <primitive
      object={model.scene}
      scale={0.1}
      position={[0.03, 1.2, 0.6]}
    />
  );
};

// Preload the model
useGLTF.preload("./assets/jellyfish.glb"); 