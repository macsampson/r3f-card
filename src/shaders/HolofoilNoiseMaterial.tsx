import { shaderMaterial } from "@react-three/drei"
import { extend } from "@react-three/fiber"
import * as THREE from "three"

export const HolofoilNoiseMaterial = shaderMaterial(
  {
    uMousePos: new THREE.Vector2(0, 0),
    uTexture: null,
    uNoiseScale: new THREE.Vector2(13.0, 10.0),
    uDiagonalStrength: 5.0,
    uEdgeThickness: 0.005,
    uEdgeSensitivity: 10.0,
    uFalloffDistance: 0.8,
    uBrightness: 1.0,
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
    uniform vec2 uMousePos;
    uniform sampler2D uTexture;
    uniform vec2 uNoiseScale;
    uniform float uDiagonalStrength;
    uniform float uEdgeThickness;
    uniform float uEdgeSensitivity;
    uniform float uFalloffDistance;
    uniform float uBrightness;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    // hash function to pseudo-randomize each grid cell
    vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)),
                dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    // Rainbow function
    vec3 rainbow(float x) {
      return 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.25, 0.5) + x));
    }


    float perlinNoise(vec2 uv) {
      vec2 i = floor(uv);
      vec2 f = fract(uv);
      
      // Smooth curve
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      // Gradient noise at each corner
      float a = dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
      float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
      float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
      float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
      
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }


    void main() {

      vec4 base = texture2D(uTexture, vUv);


      float diagonal = (vUv.x - vUv.y) * uDiagonalStrength;


      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.0);
      float facing = dot(vNormal, viewDir);


      vec2 noiseUV = vUv * uNoiseScale; // vec2 for directional stretching + freq
      noiseUV.x += diagonal * 4.0;
      noiseUV += facing * 2.0;


      float noise = perlinNoise(noiseUV);

      // Sample neighboring noise values for gradient
      float noiseOffset = uEdgeThickness; // Controls edge thickness
      float noiseR = perlinNoise(noiseUV + vec2(noiseOffset, 0.0));
      float noiseU = perlinNoise(noiseUV + vec2(0.0, noiseOffset));

      // Calculate gradient magnitude (edge detection)
      vec2 gradient = vec2(noise - noiseR, noise - noiseU);
      float edgeStrength = length(gradient) * uEdgeSensitivity; // Amplify edges

      // Create falloff from edges
      float edgeMask = smoothstep(0.0, 0.3, edgeStrength);
      float falloff = smoothstep(uFalloffDistance, 0.0, edgeStrength); // Bright at edge, fades away


      float hue = diagonal + noise * 0.3 + facing * 0.5 + uMousePos.y * 0.8 + uMousePos.x;
      vec3 rainbowColor = rainbow(hue);


      // Streaks visibility depends on viewing angle
      float streakThreshold = mix(0.4, 0.5, facing); // Threshold changes with angle
      float streaks = smoothstep(streakThreshold, streakThreshold + 0.2, noise * 0.5 + 0.5);


      // Brightness modulated by both fresnel and facing
      // float brightness = streaks * (0.5 + facing * 0.3 + fresnel * 0.3);

      // Combine edge + falloff
      float brightness = edgeMask * (falloff * 3.5 + fresnel * 0.3) * (0.8 + facing * 0.7);   

      vec3 holo = rainbowColor * brightness;


      vec3 finalColor = base.rgb + holo * uBrightness;


      vec3 testing = vec3(streaks);


      gl_FragColor = vec4(finalColor, base.a);
    }
  `
)

extend({ HolofoilNoiseMaterial })

// TypeScript declaration for the custom material
declare module "@react-three/fiber" {
  interface ThreeElements {
    holofoilNoiseMaterial: ThreeElements["shaderMaterial"] & {
      ref?: React.Ref<any>
      uMousePos?: THREE.Vector2
      uTexture?: THREE.Texture | null
      uNoiseScale?: THREE.Vector2
      uDiagonalStrength?: number
      uEdgeThickness?: number
      uEdgeSensitivity?: number
      uFalloffDistance?: number
      uBrightness?: number
    }
  }
}
