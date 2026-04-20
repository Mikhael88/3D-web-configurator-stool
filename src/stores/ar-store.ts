import { createXRStore } from '@react-three/xr'

// Singleton shared between Scene.tsx (XR provider) and page.tsx (enterAR trigger).
// 'hitTest' feature enables surface detection for tap-to-place AR.
export const xrStore = createXRStore({ hitTest: 'required' })
