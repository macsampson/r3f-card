import { shaderMaterial } from "@react-three/drei"
import { extend } from "@react-three/fiber"
import * as THREE from "three"

export const BackgroundMaterial = shaderMaterial(
  {
    uTexture: null,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uTexture;
    uniform vec2 uMaskScale;
    
    varying vec2 vUv;
    
    void main() {
      vec4 texColor = texture2D(uTexture, vUv);
      gl_FragColor = texColor;

    }
  `
)

extend({ BackgroundMaterial })

// TypeScript declaration for the custom material
declare module "@react-three/fiber" {
  interface ThreeElements {
    backgroundMaterial: ThreeElements["shaderMaterial"] & {
      uTexture?: THREE.Texture | null
      // uMask?: THREE.Texture | null
      // uMaskScale?: THREE.Vector2 | null
    }
  }
}
