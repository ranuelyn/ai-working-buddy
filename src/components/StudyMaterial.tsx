import React from 'react';
import { Html } from '@react-three/drei';

interface StudyMaterialProps {
  materialData: string | null;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  distanceFactor?: number; // **YENİ**: Distance factor prop'u
}

export const StudyMaterial: React.FC<StudyMaterialProps> = ({ 
  materialData, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  distanceFactor = 1 // **YENİ**: Default distance factor
}) => {
  if (!materialData) return null;

  return (
    <Html
      position={position}
      rotation={rotation}
      transform
      distanceFactor={distanceFactor} // **YENİ**: Distance factor kullan
      style={{ 
        pointerEvents: 'auto',
        width: '400px',
        height: '300px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.1)'
      }}
    >
      <img 
        src={materialData} 
        alt="Çalışma Materyali"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </Html>
  );
}; 