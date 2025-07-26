import { useGLTF } from "@react-three/drei";

export const Desk = () => {
  const model = useGLTF("./assets/student_desk.glb");
  return <primitive object={model.scene} />;
};

// Preload the model for a smoother experience
useGLTF.preload("./assets/student_desk.glb"); 