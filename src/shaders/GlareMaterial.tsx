import { shaderMaterial, useTexture } from "@react-three/drei"
import { extend } from "@react-three/fiber"
import * as THREE from "three"

export const GlareMaterial = shaderMaterial(
  {
    uTexture: null,
    uGlareWidth: 0.15,
    uGlareIntensity: 2.0,
    uGlareColor: new THREE.Color(1.0, 1.0, 1.0),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      // World position
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uTexture;
    uniform float uGlareWidth;
    uniform float uGlareIntensity;
    uniform vec3 uGlareColor;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      // UVs flipped - TODO: fix the geo in blender
      vec2 flippedUV = vec2(vUv.x, 1.0 - vUv.y);
      vec4 texColor = texture2D(uTexture, flippedUV);

      if (texColor.a < 0.001) {
        discard;
      }

      // View direction
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      
      // Which edges face camera - use world normal
      vec3 worldNormal = normalize(vNormal);
      float viewAngle = abs(dot(worldNormal, viewDir));

      // Fresnel - stronger at grazing angles
      float fresnel = pow(viewAngle, 5.0);
      
      // Modulate with intensity
      float glare = uGlareIntensity * fresnel;

      // Makes it more focused
      glare = pow(glare, 1.0); 
      glare += fresnel;
      
      // Debug: choose variable
      // gl_FragColor = vec4(vec3(glare) * texColor.rgb, texColor.a);
      // return;
      
      // vec3 glareColor = uGlareColor * glare;
      vec3 finalColor = texColor.rgb * glare;
      
      gl_FragColor = vec4(finalColor, texColor.a);

    }
  `
)

extend({ GlareMaterial })

// TypeScript declaration for the custom material
declare module "@react-three/fiber" {
  interface ThreeElements {
    glareMaterial: ThreeElements["shaderMaterial"] & {
      uTexture?: THREE.Texture | null
      uGlareWidth?: number
      uGlareIntensity?: number
      uGlareColor?: THREE.Color
      transparent?: boolean
      blending?: THREE.Blending
      depthWrite?: boolean
    }
  }
}
