import * as THREE from 'three';

// Vertex shader for treatment simulation
export const treatmentVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader for filler treatment (volume enhancement)
export const fillerFragmentShader = `
  uniform float uIntensity;
  uniform float uTime;
  uniform vec2 uTargetRegion;
  uniform float uTargetRadius;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    // Calculate distance from target region
    float dist = distance(vUv, uTargetRegion);
    float influence = 1.0 - smoothstep(0.0, uTargetRadius, dist);
    
    // Base skin color
    vec3 skinColor = vec3(0.98, 0.88, 0.76);
    
    // Apply filler effect (subtle volume enhancement)
    vec3 fillerColor = vec3(1.0, 0.95, 0.9);
    vec3 finalColor = mix(skinColor, fillerColor, influence * uIntensity * 0.3);
    
    // Add subtle shine
    float shine = pow(max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 32.0);
    finalColor += vec3(shine * 0.2 * uIntensity);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Fragment shader for laser treatment (skin resurfacing)
export const laserFragmentShader = `
  uniform float uIntensity;
  uniform float uTime;
  uniform vec2 uLaserPosition;
  uniform float uLaserRadius;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  // Noise function for skin texture
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    // Base skin color with texture
    vec3 skinColor = vec3(0.98, 0.88, 0.76);
    float skinTexture = noise(vUv * 50.0) * 0.05;
    skinColor -= vec3(skinTexture);
    
    // Laser effect
    float dist = distance(vUv, uLaserPosition);
    float laserIntensity = 1.0 - smoothstep(0.0, uLaserRadius, dist);
    
    // Animated laser pulse
    laserIntensity *= sin(uTime * 10.0) * 0.5 + 0.5;
    
    // Apply laser treatment effect (skin smoothing)
    vec3 treatedColor = skinColor + vec3(0.02, 0.01, 0.01); // Slight reddening
    treatedColor = mix(skinColor, treatedColor, laserIntensity * uIntensity);
    
    // Reduce skin texture in treated area
    treatedColor += vec3(noise(vUv * 100.0) * 0.02 * (1.0 - laserIntensity * uIntensity));
    
    // Add laser glow
    vec3 laserGlow = vec3(1.0, 0.2, 0.1) * laserIntensity * uIntensity * 0.3;
    treatedColor += laserGlow;
    
    gl_FragColor = vec4(treatedColor, 1.0);
  }
`;

// Fragment shader for general skin improvement
export const skinImprovementFragmentShader = `
  uniform float uIntensity;
  uniform float uTime;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  // Improved noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    // Base skin color
    vec3 skinColor = vec3(0.98, 0.88, 0.76);
    
    // Add natural skin texture
    float texture1 = noise(vUv * 80.0) * 0.03;
    float texture2 = noise(vUv * 200.0) * 0.01;
    skinColor -= vec3(texture1 + texture2);
    
    // Apply improvement effect
    vec3 improvedColor = skinColor * 1.05; // Brighten slightly
    improvedColor.g += 0.01; // Add slight green tint for healthy look
    
    // Smooth skin based on intensity
    float smoothing = uIntensity * 0.5;
    improvedColor = mix(skinColor, improvedColor, smoothing);
    
    // Reduce pores and imperfections
    float imperfections = noise(vUv * 150.0) * 0.02;
    improvedColor += vec3(imperfections * (1.0 - smoothing));
    
    // Add subtle glow
    float glow = pow(max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 16.0);
    improvedColor += vec3(glow * 0.1 * uIntensity);
    
    gl_FragColor = vec4(improvedColor, 1.0);
  }
`;

export interface TreatmentShaderUniforms {
  uIntensity: number;
  uTime: number;
  uTargetRegion?: THREE.Vector2;
  uTargetRadius?: number;
  uLaserPosition?: THREE.Vector2;
  uLaserRadius?: number;
}

export function createTreatmentMaterial(
  type: 'filler' | 'laser' | 'skinImprovement',
  uniforms: TreatmentShaderUniforms
): THREE.ShaderMaterial {
  const shaderConfig = {
    filler: {
      vertexShader: treatmentVertexShader,
      fragmentShader: fillerFragmentShader,
      uniforms: {
        uIntensity: { value: uniforms.uIntensity },
        uTime: { value: uniforms.uTime },
        uTargetRegion: { value: uniforms.uTargetRegion || new THREE.Vector2(0.5, 0.5) },
        uTargetRadius: { value: uniforms.uTargetRadius || 0.2 },
      },
    },
    laser: {
      vertexShader: treatmentVertexShader,
      fragmentShader: laserFragmentShader,
      uniforms: {
        uIntensity: { value: uniforms.uIntensity },
        uTime: { value: uniforms.uTime },
        uLaserPosition: { value: uniforms.uLaserPosition || new THREE.Vector2(0.5, 0.5) },
        uLaserRadius: { value: uniforms.uLaserRadius || 0.1 },
      },
    },
    skinImprovement: {
      vertexShader: treatmentVertexShader,
      fragmentShader: skinImprovementFragmentShader,
      uniforms: {
        uIntensity: { value: uniforms.uIntensity },
        uTime: { value: uniforms.uTime },
      },
    },
  };

  const config = shaderConfig[type];

  return new THREE.ShaderMaterial({
    ...config,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  });
}
