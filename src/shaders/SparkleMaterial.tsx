import { shaderMaterial } from "@react-three/drei"
import { extend } from "@react-three/fiber"
import * as THREE from "three"

export const SparkleMaterial = shaderMaterial(
  {
    // uTime: 0,
    uMousePos: new THREE.Vector2(0, 0),
    uDensity: 50.0,
    uSize: 0.15,
    uBrightness: 3.0,
    uBorderWidth: 0.1,
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
    uniform float uDensity;
    uniform float uSize;
    uniform float uBrightness;
    uniform float uBorderWidth;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;


    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }


    // hash function to pseudo-randomize each grid cell
    vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)),
                dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float voronoi(vec2 uv, float seed) {
      vec2 g = floor(uv);
      vec2 f = fract(uv);
      
      float minDist = 8.0;
      vec2 minPoint = vec2(0.0);
      
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 point = hash2(g + neighbor + seed);
          point = 0.5 + 0.5 * point;
          
          vec2 diff = neighbor + point - f;
          float dist = length(diff);
          
          if (dist < minDist) {
            minDist = dist;
            minPoint = g + neighbor;
          }
        }
      }
      
      // Return sparkle intensity (bright center, fade out)
      return smoothstep(0.15, 0.0, minDist);
    }

    // Returns distance to nearest cell center + cell ID
    vec2 voronoi2(vec2 uv) {
      vec2 g = floor(uv);
      vec2 f = fract(uv);
      
      float minDist = 8.0;
      vec2 minPoint = vec2(0.0);
      
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 point = hash2(g + neighbor);
          point = 0.5 + 0.5 * point;
          
          vec2 diff = neighbor + point - f;
          float dist = length(diff);
          
          if (dist < minDist) {
            minDist = dist;
            minPoint = g + neighbor;
          }
        }
      }
      
      return vec2(minDist, hash(minPoint));
    }
    
    void main() {

      vec2 edgeDist = min(vUv, 1.0 - vUv);
      float minEdgeDist = min(edgeDist.x, edgeDist.y);
      float borderMask = smoothstep(uBorderWidth - 0.02, uBorderWidth, minEdgeDist);

      vec2 sparkleUV = vUv * uDensity;
      sparkleUV += uMousePos * 1.5;

      vec2 res = voronoi2(sparkleUV);
      float dist = res.x;
      float cellID = res.y;

      // View angle dependent visibility
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float viewAngle = dot(vNormal, viewDir);

      float threshold = fract(cellID * 7.85);
      float angleVis = smoothstep(threshold - 0.15, threshold + 0.15, viewAngle);

      // Cross shape instead of circle
      vec2 g = floor(sparkleUV);
      vec2 f = fract(sparkleUV);
      vec2 sparklePos = hash2(g) * 0.5 + 0.5; // Center of cell
      vec2 toSparkle = f - sparklePos;

      // Sparkle
      float angle = atan(toSparkle.y, toSparkle.x);
      float radialDist = length(toSparkle);

      float star = cos(angle * 2.0) * 0.5 + 0.5; // 4 lobes
      star = pow(star, 2.0); // Sharpen arms


      float sparkle = (1.0 - smoothstep(0.0, uSize, radialDist)) * star;
      sparkle = pow(sparkle, 1.5);

      float center = smoothstep(uSize * 0.2, 0.0, radialDist);
      sparkle = max(sparkle, center * 1.5);

      // Twinkle variation
      float twinkle = sin(viewAngle * 15.0 + cellID * 6.28) * 0.4 + 0.6;

      // Yellow-white sparkle
      vec3 color = mix(vec3(1.0, 1.0, 0.7), vec3(1.0), sparkle * 0.5);
      float alpha = sparkle * angleVis * twinkle * uBrightness * borderMask;

      gl_FragColor = vec4(color, alpha);

    }
  `
)

extend({ SparkleMaterial })

// TypeScript declaration for the custom material
declare module "@react-three/fiber" {
  interface ThreeElements {
    sparkleMaterial: ThreeElements["shaderMaterial"] & {
      ref?: React.Ref<any>
      uMousePos?: THREE.Vector2
      uDensity?: number
      uSize?: number
      uBrightness?: number
      uBorderWidth?: number
    }
  }
}
