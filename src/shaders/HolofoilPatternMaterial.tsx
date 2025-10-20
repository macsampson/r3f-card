import { shaderMaterial } from "@react-three/drei"
import { extend } from "@react-three/fiber"
import * as THREE from "three"

export const HolofoilPatternMaterial = shaderMaterial(
  {
    uTime: 0,
    uMousePos: new THREE.Vector2(0, 0),
    uTexture: null,
    uMaskTexture: null,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec2 uMousePos;
    uniform sampler2D uTexture;
    uniform sampler2D uMaskTexture;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      // Sample the base texture (card art)
      vec4 texColor = texture2D(uTexture, vUv);
      
      // Sample the mask
      float holoMask = texture2D(uMaskTexture, vUv).r;
      // vec2 vUv = vUv * 5.0; // adjust scale

      float stripe = sin((vUv.x - vUv.y + uMousePos.x) * 20.0) * 0.5 + 0.5;

      // Rainbow gradient based on position and mouse
      float hue = fract(vUv.x + vUv.y + uMousePos.x * 0.3 + uMousePos.y * 0.3);
      vec3 rainbow = hsv2rgb(vec3(hue, 0.8, 2.0));

      // Holographic shimmer
      float shimmer = pow(stripe, 2.0);

      // Fresnel effect (edges glow)
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - dot(vNormal, viewDirection), 3.0);

      // Combine holographic effects
      vec3 holoColor = mix(vec3(0.1), rainbow, shimmer * 0.6 + fresnel * 0.4);

      // Add mask
      // vec3 finalColor = mix(texColor.rgb, holoColor, holoMask);
      vec3 finalColor = texColor.rgb + holoColor * 0.2;

      gl_FragColor = vec4(finalColor, texColor.a);
    }
  `
)

extend({ HolofoilPatternMaterial })

// TypeScript declaration for the custom material
declare module "@react-three/fiber" {
  interface ThreeElements {
    holofoilPatternMaterial: ThreeElements["shaderMaterial"] & {
      ref?: React.Ref<any>
      uTime?: number
      uMousePos?: THREE.Vector2
      uTexture?: THREE.Texture | null
      uMaskTexture?: THREE.Texture | null
    }
  }
}
