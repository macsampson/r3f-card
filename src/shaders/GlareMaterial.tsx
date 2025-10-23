import { shaderMaterial } from "@react-three/drei"
import { extend } from "@react-three/fiber"
import * as THREE from "three"

export const GlareMaterial = shaderMaterial(
  {
    uTexture: null,
    uGlareWidth: 0.5,
    uGlareIntensity: 2.0,
    uGlareColor: new THREE.Color(1.0, 1.0, 1.0),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vObjectViewDir;
    varying float vCameraDistance;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);

      // World position
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;

      // vCameraDistance = length(cameraPosition - vWorldPosition);

      // Object space view dir
      vec3 objectSpaceCamera = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
      vObjectViewDir = normalize(objectSpaceCamera - position);
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
    varying vec3 vObjectViewDir;
    varying float vCameraDistance;
    
    void main() {
      vec2 flippedUV = vec2(vUv.x, 1.0 - vUv.y);
      vec4 texColor = texture2D(uTexture, flippedUV);

      if (texColor.a < 0.001) {
        discard;
      }

      // float distanceFactor = 1.0 / (vCameraDistance + 1.0);
      // distanceFactor = pow(distanceFactor, 0.7);

      // View direction
      // vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      
      // Which edges face camera - use world normal
      // vec3 worldNormal = normalize(vNormal);
      // float viewAngle = dot(worldNormal, viewDir);

      // Fresnel - stronger at grazing angles
      // float fresnel = pow(viewAngle, 3.0);
      
      // Modulate with intensity
      // float glare = uGlareIntensity * fresnel;

      // Makes it more focused
      // glare = pow(glare, 5.0); 
      // glare += fresnel;
      
      // Debug: choose variable
      // gl_FragColor = vec4(vec3(fresnel) * texColor.rgb, texColor.a);
      // return;


      // 

      vec3 normalizedViewDir = normalize(vObjectViewDir);
      
      float glarePosition = (normalizedViewDir.x - normalizedViewDir.y) + 1.0 * 0.5;
      
      float dist = abs(glarePosition - flippedUV.x);
      float glareMask = smoothstep(uGlareWidth, 0.0, dist);
      
      float sharpness = 5.0; 
      glareMask = pow(glareMask, sharpness);
      
      float angleFalloff = 1.0 - abs(dot(vNormal, normalizedViewDir));
      glareMask *= angleFalloff;
      
      float glare = glareMask * uGlareIntensity;
      
      vec3 glareColor = uGlareColor * glare;
      vec3 finalColor = (texColor.rgb + glareColor);
      // finalColor *= (1.0 + distanceFactor * 2.0);

      float finalAlpha = max(texColor.a, glare);
      
      gl_FragColor = vec4(finalColor, texColor.a);
      
      // if (finalAlpha < 0.001) {
      //   discard;
      // }
      
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
