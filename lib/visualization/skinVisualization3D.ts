/**
 * 3D Skin Visualization System
 * Advanced 3D rendering and visualization for skin analysis and treatment planning
 * Includes 3D models, textures, and interactive visualization
 */

export interface SkinModel3D {
  id: string;
  name: string;
  description: string;
  vertices: Array<{
    x: number;
    y: number;
    z: number;
  }>;
  faces: Array<{
    vertices: [number, number, number];
    normals: [number, number, number];
    uvs: [number, number];
    texture: string;
  }>;
  materials: Array<{
    name: string;
    diffuseColor: string;
    specularColor: string;
    shininess: number;
    opacity: number;
  }>;
  textures: Record<string, string>;
  scale: {
    x: number;
    y: number;
    z: number;
  };
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}

export interface VisualizationSettings {
  renderMode: 'solid' | 'wireframe' | 'textured' | 'transparent';
  lighting: {
    ambient: number;
    directional: number;
    point: number;
  };
  camera: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    target: {
      x: number;
      y: number;
      z: number;
    };
    fov: number;
    near: number;
    far: number;
  };
  background: {
    color: string;
    gradient: boolean;
    environment: string;
  };
  animation: {
    enabled: boolean;
    rotationSpeed: number;
    autoRotate: boolean;
  };
}

export interface TreatmentSimulation3D {
  id: string;
  name: string;
  description: string;
  beforeModel: SkinModel3D;
  afterModel: SkinModel3D;
  progress: number;
  duration: number;
  effects: {
    volume: number;
    texture: number;
    color: number;
  };
  timeline: Array<{
    time: number;
    model: SkinModel3D;
    description: string;
  }>;
}

export interface InteractiveControls {
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  zoom: number;
  pan: {
    x: number;
    y: number;
  };
  lighting: {
    ambient: number;
    directional: number;
    point: number;
  };
  fov: number;
  near: number;
  far: number;
}

class SkinVisualization3D {
  private models: Map<string, SkinModel3D> = new Map();
  private simulations: Map<string, TreatmentSimulation3D> = new Map();
  private defaultSettings!: VisualizationSettings;
  
  constructor() {
    this.defaultSettings = {
      renderMode: 'textured',
      lighting: {
        ambient: 0.4,
        directional: 0.6,
        point: 0.3
      },
      camera: {
        position: { x: 0, y: 0, z: 5 },
        target: { x: 0, y: 0, z: 0 },
        fov: 45,
        near: 0.1,
        far: 100
      },
      background: {
        color: '#1a1a2e',
        gradient: true,
        environment: 'studio'
      },
      animation: {
        enabled: true,
        rotationSpeed: 1,
        autoRotate: false
      }
    };
    this.initializeDefaultModels();
    this.initializeDefaultSimulations();
  }

  private initializeDefaultModels() {
    // Create a basic face model
    const faceModel: SkinModel3D = {
      id: 'default_face',
      name: 'Default Face Model',
      description: 'Basic 3D face model for visualization',
      vertices: this.generateFaceVertices(),
      faces: this.generateFaceFaces(),
      materials: [
        {
          name: 'skin',
          diffuseColor: '#fdbcb4',
          specularColor: '#f4e4c4',
          shininess: 30,
          opacity: 0.95
        }
      ],
      textures: {},
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    };

    this.models.set('default_face', faceModel);
  }

  private initializeDefaultSimulations() {
    // Create default treatment simulations
    const simulations: TreatmentSimulation3D[] = [
      {
        id: 'botox_simulation',
        name: 'Botox Treatment Simulation',
        description: '3D visualization of Botox treatment effects',
        beforeModel: this.models.get('default_face')!,
        afterModel: this.createBotoxAfterModel(this.models.get('default_face')!),
        progress: 0,
        duration: 30,
        effects: {
          volume: -10,
          texture: 5,
          color: 2
        },
        timeline: []
      }
    ];

    simulations.forEach(sim => {
      this.simulations.set(sim.id, sim);
    });
  }

  /**
   * Generate basic face vertices
   */
  private generateFaceVertices(): Array<{ x: number; y: number; z: number }> {
    const vertices: Array<{ x: number; y: number; z: number }> = [];
    
    // Generate a simple sphere-like face shape
    const rings = 10;
    const segments = 20;
    
    for (let ring = 0; ring < rings; ring++) {
      for (let segment = 0; segment < segments; segment++) {
        const theta = (segment / segments) * 2 * Math.PI;
        const phi = (ring / rings) * Math.PI;
        
        const x = Math.sin(phi) * Math.cos(theta) * 2;
        const y = Math.cos(phi) * 2;
        const z = Math.sin(phi) * Math.sin(theta) * 2;
        
        vertices.push({ x, y, z });
      }
    }
    
    return vertices;
  }

  /**
   * Generate face faces (triangles)
   */
  private generateFaceFaces(): Array<{
    vertices: [number, number, number];
    normals: [number, number, number];
    uvs: [number, number];
    texture: string;
  }> {
    const faces: Array<{
      vertices: [number, number, number];
      normals: [number, number, number];
      uvs: [number, number];
      texture: string;
    }> = [];
    
    const rings = 10;
    const segments = 20;
    
    for (let ring = 0; ring < rings - 1; ring++) {
      for (let segment = 0; segment < segments; segment++) {
        const nextSegment = (segment + 1) % segments;
        const nextRing = ring + 1;
        
        const currentRing = ring;
        const currentSegment = segment;
        
        // Current ring vertices
        const v1 = currentRing * segments + currentSegment;
        const v2 = currentRing * segments + nextSegment;
        const v3 = nextRing * segments + nextSegment;
        
        faces.push({
          vertices: [v1, v2, v3],
          normals: [0, 0, 1],
          uvs: [segment / segments, ring / rings],
          texture: 'skin_texture'
        });
      }
    }
    
    return faces;
  }

  /**
   * Get vertices for specific face area
   */
  private getFaceAreaVertices(area: string): number[] {
    const vertices: number[] = [];
    
    switch (area) {
      case 'forehead':
        for (let i = 0; i < 20; i++) {
          const x = (i / 19) * 1.6 - 0.8;
          const y = -0.8;
          const z = (i / 19) * 0.6 - 0.3;
          vertices.push(...this.vertexToIndex(x, y, z));
        }
        break;
      
      case 'left_cheek':
        for (let i = 0; i < 20; i++) {
          const x = -1.2 + (i / 19) * 0.8;
          const y = -0.2 + (i / 19) * 0.4;
          const z = (i / 19) * 0.4 - 0.2;
          vertices.push(...this.vertexToIndex(x, y, z));
        }
        break;
      
      case 'right_cheek':
        for (let i = 0; i < 20; i++) {
          const x = 0.4 + (i / 19) * 0.8;
          const y = -0.2 + (i / 19) * 0.4;
          const z = (i / 19) * 0.4 - 0.2;
          vertices.push(...this.vertexToIndex(x, y, z));
        }
        break;
      
      case 'chin':
        for (let i = 0; i < 20; i++) {
          const x = (i / 19) * 0.6 - 0.3;
          const y = 0.2 + (i / 19) * 0.2;
          const z = (i / 19) * 0.3 - 0.15;
          vertices.push(...this.vertexToIndex(x, y, z));
        }
        break;
      
      case 'full_face':
        for (let i = 0; i < 100; i++) {
          const x = (i / 99) * 2 - 1;
          const y = (i / 99) * 2.5 - 1.25;
          const z = (i / 99) * 1 - 0.5;
          vertices.push(...this.vertexToIndex(x, y, z));
        }
        break;
    }
    
    return vertices;
  }

  /**
   * Convert vertex coordinates to index
   */
  private vertexToIndex(x: number, y: number, z: number): number[] {
    // Convert 3D coordinates to vertex array indices
    return [Math.floor(x * 1000), Math.floor(y * 1000), Math.floor(z * 1000)];
  }

  /**
   * Create Botox after-effect model
   */
  private createBotoxAfterModel(baseModel: SkinModel3D): SkinModel3D {
    const afterModel = { ...baseModel };
    
    // Apply Botox effects to the model
    afterModel.vertices = afterModel.vertices.map(vertex => ({
      ...vertex,
      y: vertex.y - 0.05 // Slight reduction in wrinkle depth
    }));
    
    return afterModel;
  }

  /**
   * Get model by ID
   */
  getModel(id: string): SkinModel3D | undefined {
    return this.models.get(id);
  }

  /**
   * Get simulation by ID
   */
  getSimulation(id: string): TreatmentSimulation3D | undefined {
    return this.simulations.get(id);
  }

  /**
   * Create new model
   */
  createModel(model: Omit<SkinModel3D, 'id'>): string {
    const id = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newModel: SkinModel3D = { ...model, id };
    this.models.set(id, newModel);
    return id;
  }

  /**
   * Create new simulation
   */
  createSimulation(simulation: Omit<TreatmentSimulation3D, 'id' | 'timeline'>): string {
    const id = `simulation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSimulation: TreatmentSimulation3D = {
      ...simulation,
      id,
      timeline: []
    };
    this.simulations.set(id, newSimulation);
    return id;
  }

  /**
   * Update model
   */
  updateModel(id: string, updates: Partial<SkinModel3D>): boolean {
    const model = this.models.get(id);
    if (!model) return false;
    
    const updatedModel = { ...model, ...updates };
    this.models.set(id, updatedModel);
    return true;
  }

  /**
   * Update simulation
   */
  updateSimulation(id: string, updates: Partial<TreatmentSimulation3D>): boolean {
    const simulation = this.simulations.get(id);
    if (!simulation) return false;
    
    const updatedSimulation = { ...simulation, ...updates };
    this.simulations.set(id, updatedSimulation);
    return true;
  }

  /**
   * Delete model
   */
  deleteModel(id: string): boolean {
    return this.models.delete(id);
  }

  /**
   * Delete simulation
   */
  deleteSimulation(id: string): boolean {
    return this.simulations.delete(id);
  }

  /**
   * Get all models
   */
  getAllModels(): SkinModel3D[] {
    return Array.from(this.models.values());
  }

  /**
   * Get all simulations
   */
  getAllSimulations(): TreatmentSimulation3D[] {
    return Array.from(this.simulations.values());
  }

  /**
   * Alias for compatibility with API routes
   */
  getAvailableModels(): SkinModel3D[] {
    return this.getAllModels();
  }

  /**
   * Alias for compatibility with API routes
   */
  getAvailableSimulations(): TreatmentSimulation3D[] {
    return this.getAllSimulations();
  }

  /**
   * Apply treatment to model
   */
  applyTreatment(modelId: string, treatmentType: string, intensity: number): SkinModel3D | null {
    const model = this.models.get(modelId);
    if (!model) return null;

    const modifiedModel = { ...model };
    
    switch (treatmentType) {
      case 'botox':
        modifiedModel.vertices = modifiedModel.vertices.map(vertex => ({
          ...vertex,
          y: vertex.y - (0.05 * intensity)
        }));
        break;
      
      case 'filler':
        modifiedModel.vertices = modifiedModel.vertices.map(vertex => ({
          ...vertex,
          x: vertex.x * (1 + 0.1 * intensity)
        }));
        break;
      
      case 'laser':
        modifiedModel.vertices = modifiedModel.vertices.map(vertex => ({
          ...vertex,
          z: vertex.z * (1 - 0.05 * intensity)
        }));
        break;
    }
    
    this.models.set(modelId, modifiedModel);
    return modifiedModel;
  }

  /**
   * Generate a lightweight 3D analysis payload for a customer
   */
  async createSkinAnalysis3D(
    customerId: string,
    analysisData: any,
    modelId: string = 'default_face'
  ): Promise<any> {
    const model = this.models.get(modelId) || this.getAllModels()[0];
    if (!model) {
      throw new Error('No models available for analysis');
    }

    const stats = this.getModelStats(model.id);
    const timeline = [
      { time: 0, description: 'Baseline', metrics: analysisData?.baseline || {} },
      { time: 30, description: 'Projected', metrics: analysisData?.projection || {} }
    ];

    return {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      timestamp: new Date().toISOString(),
      model,
      metrics: analysisData,
      stats,
      timeline
    };
  }

  /**
   * Get visualization settings
   */
  getSettings(): VisualizationSettings {
    return { ...this.defaultSettings };
  }

  /**
   * Backward-compatible getter used by API routes
   */
  getDefaultSettings(): VisualizationSettings {
    return this.getSettings();
  }

  /**
   * Update visualization settings
   */
  updateSettings(settings: Partial<VisualizationSettings>): void {
    this.defaultSettings = { ...this.defaultSettings, ...settings };
  }

  /**
   * Reset to default settings
   */
  resetSettings(): void {
    this.defaultSettings = {
      renderMode: 'textured',
      lighting: {
        ambient: 0.4,
        directional: 0.6,
        point: 0.3
      },
      camera: {
        position: { x: 0, y: 0, z: 5 },
        target: { x: 0, y: 0, z: 0 },
        fov: 45,
        near: 0.1,
        far: 100
      },
      background: {
        color: '#1a1a2e',
        gradient: true,
        environment: 'studio'
      },
      animation: {
        enabled: true,
        rotationSpeed: 1,
        autoRotate: false
      }
    };
  }

  /**
   * Export model to JSON
   */
  exportModel(id: string): string | null {
    const model = this.models.get(id);
    if (!model) return null;
    
    return JSON.stringify(model, null, 2);
  }

  /**
   * Import model from JSON
   */
  importModel(idOrJson: string, jsonData?: string): string | null {
    try {
      const payload = jsonData ?? idOrJson;
      const model = (typeof payload === 'string' ? JSON.parse(payload) : payload) as SkinModel3D;

      const providedId = jsonData ? idOrJson : undefined;
      model.id = providedId || model.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.models.set(model.id, model);
      return model.id;
    } catch (error) {
      console.error('Failed to import model:', error);
      return null;
    }
  }

  /**
   * Export simulation to JSON
   */
  exportSimulation(id: string): string | null {
    const simulation = this.simulations.get(id);
    if (!simulation) return null;
    return JSON.stringify(simulation, null, 2);
  }

  /**
   * Import simulation from JSON
   */
  importSimulation(idOrJson: string, jsonData?: string): string | null {
    try {
      const payload = jsonData ?? idOrJson;
      const simulation = (typeof payload === 'string' ? JSON.parse(payload) : payload) as TreatmentSimulation3D;

      const providedId = jsonData ? idOrJson : undefined;
      simulation.id = providedId || simulation.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.simulations.set(simulation.id, simulation);
      return simulation.id;
    } catch (error) {
      console.error('Failed to import simulation:', error);
      return null;
    }
  }

  /**
   * Calculate model statistics
   */
  getModelStats(id: string): {
    vertexCount: number;
    faceCount: number;
    materialCount: number;
    boundingBox: {
      min: { x: number; y: number; z: number };
      max: { x: number; y: number; z: number };
    };
  } | null {
    const model = this.models.get(id);
    if (!model) return null;

    const boundingBox = {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 }
    };

    // Calculate bounding box
    model.vertices.forEach(vertex => {
      boundingBox.min.x = Math.min(boundingBox.min.x, vertex.x);
      boundingBox.min.y = Math.min(boundingBox.min.y, vertex.y);
      boundingBox.min.z = Math.min(boundingBox.min.z, vertex.z);
      boundingBox.max.x = Math.max(boundingBox.max.x, vertex.x);
      boundingBox.max.y = Math.max(boundingBox.max.y, vertex.y);
      boundingBox.max.z = Math.max(boundingBox.max.z, vertex.z);
    });

    return {
      vertexCount: model.vertices.length,
      faceCount: model.faces.length,
      materialCount: model.materials.length,
      boundingBox
    };
  }

  /**
   * Optimize model for performance
   */
  optimizeModel(id: string): boolean {
    const model = this.models.get(id);
    if (!model) return false;

    // Remove duplicate vertices
    const uniqueVertices = new Map<string, { x: number; y: number; z: number; index: number }>();
    let vertexIndex = 0;

    model.vertices.forEach(vertex => {
      const key = `${vertex.x.toFixed(3)},${vertex.y.toFixed(3)},${vertex.z.toFixed(3)}`;
      if (!uniqueVertices.has(key)) {
        uniqueVertices.set(key, { ...vertex, index: vertexIndex });
        vertexIndex++;
      }
    });

    // Update face indices
    const optimizedFaces = model.faces.map(face => {
      const v1Key = `${model.vertices[face.vertices[0]].x.toFixed(3)},${model.vertices[face.vertices[0]].y.toFixed(3)},${model.vertices[face.vertices[0]].z.toFixed(3)}`;
      const v2Key = `${model.vertices[face.vertices[1]].x.toFixed(3)},${model.vertices[face.vertices[1]].y.toFixed(3)},${model.vertices[face.vertices[1]].z.toFixed(3)}`;
      const v3Key = `${model.vertices[face.vertices[2]].x.toFixed(3)},${model.vertices[face.vertices[2]].y.toFixed(3)},${model.vertices[face.vertices[2]].z.toFixed(3)}`;

      return {
        ...face,
        vertices: [
          uniqueVertices.get(v1Key)!.index,
          uniqueVertices.get(v2Key)!.index,
          uniqueVertices.get(v3Key)!.index
        ] as [number, number, number]
      };
    });

    const optimizedModel: SkinModel3D = {
      ...model,
      vertices: Array.from(uniqueVertices.values()).map(v => ({ x: v.x, y: v.y, z: v.z })),
      faces: optimizedFaces
    };

    this.models.set(id, optimizedModel);
    return true;
  }
}

export { SkinVisualization3D };
