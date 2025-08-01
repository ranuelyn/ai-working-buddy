export const CAMERA_PRESETS = {
    karsisina: {
        position: [-0.026520570261365544, 1.3744804750200883, 1.775869881963032] as [number, number, number],
        target: [-0.023552092242319966, 0.8180751831918213, -0.09971473150124284] as [number, number, number],
    },
    sagina: {
        position: [-0.9815690460313345, 1.2586819892180103, 0.3763493072041379] as [number, number, number],
        target: [-0.19858237477705712, 1.065890381899427, 0.5137877474380447] as [number, number, number],
    },
    soluna: {
        position: [1.0247792127868869, 1.2257331548960044, 0.4784032542752851] as [number, number, number],
        target: [-0.09962871842599526, 0.9265399779212176, 0.6135477525213948] as [number, number, number],
    },
} as const;

export type CameraPreset = typeof CAMERA_PRESETS.karsisina; 