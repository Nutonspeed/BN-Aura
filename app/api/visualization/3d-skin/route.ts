import { NextRequest, NextResponse } from 'next/server';
import { SkinVisualization3D } from '@/lib/visualization/skinVisualization3D';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action,
      customerId,
      analysisData,
      modelId,
      simulationId,
      progress,
      modelData,
      simulationData
    } = body;

    // Initialize 3D visualization
    const visualization3D = new SkinVisualization3D();

    switch (action) {
      case 'create_analysis':
        if (!customerId || !analysisData) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields: customerId, analysisData' 
            },
            { status: 400 }
          );
        }

        const analysis = await visualization3D.createSkinAnalysis3D(
          customerId,
          analysisData,
          modelId || 'default_face'
        );

        return NextResponse.json({
          success: true,
          data: {
            analysis,
            availableModels: visualization3D.getAvailableModels(),
            availableSimulations: visualization3D.getAvailableSimulations()
          }
        });

      case 'update_model':
        if (!modelId || !modelData) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields: modelId, modelData' 
            },
            { status: 400 }
          );
        }

        visualization3D.updateModel(modelId, modelData);
        
        return NextResponse.json({
          success: true,
          data: {
            model: visualization3D.getModel(modelId),
            message: 'Model updated successfully'
          }
        });

      case 'update_simulation':
        if (!simulationId || !simulationData) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields: simulationId, simulationData' 
            },
            { status: 400 }
          );
        }

        visualization3D.updateSimulation(simulationId, simulationData);
        
        return NextResponse.json({
          success: true,
          data: {
            simulation: visualization3D.getSimulation(simulationId),
            message: 'Simulation updated successfully'
          }
        });

      case 'export_model':
        if (!modelId) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required field: modelId' 
            },
            { status: 400 }
          );
        }

        const exportedModel = visualization3D.exportModel(modelId);
        
        return NextResponse.json({
          success: true,
          data: {
            modelData: exportedModel,
            modelId
          }
        });

      case 'import_model':
        if (!modelId || !modelData) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields: modelId, modelData' 
            },
            { status: 400 }
          );
        }

        try {
          visualization3D.importModel(modelId, modelData);
          
          return NextResponse.json({
            success: true,
            data: {
              model: visualization3D.getModel(modelId),
              message: 'Model imported successfully'
            }
          });
        } catch (error) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Failed to import model',
              details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 400 }
          );
        }

      case 'export_simulation':
        if (!simulationId) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required field: simulationId' 
            },
            { status: 400 }
          );
        }

        const exportedSimulation = visualization3D.exportSimulation(simulationId);
        
        return NextResponse.json({
          success: true,
          data: {
            simulationData: exportedSimulation,
            simulationId
          }
        });

      case 'import_simulation':
        if (!simulationId || !simulationData) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields: simulationId, simulationData' 
            },
            { status: 400 }
          );
        }

        try {
          visualization3D.importSimulation(simulationId, simulationData);
          
          return NextResponse.json({
            success: true,
            data: {
              simulation: visualization3D.getSimulation(simulationId),
              message: 'Simulation imported successfully'
            }
          });
        } catch (error) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Failed to import simulation',
              details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[3D Skin Visualization] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process 3D visualization request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const simulationId = searchParams.get('simulationId');

    const visualization3D = new SkinVisualization3D();

    if (modelId) {
      // Get specific model
      const model = visualization3D.getModel(modelId);
      
      if (!model) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Model not found' 
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          model,
          defaultSettings: visualization3D.getDefaultSettings()
        }
      });
    }

    if (simulationId) {
      // Get specific simulation
      const simulation = visualization3D.getSimulation(simulationId);
      
      if (!simulation) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Simulation not found' 
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          simulation,
          defaultSettings: visualization3D.getDefaultSettings()
        }
      });
    }

    // Get all available resources
    return NextResponse.json({
      success: true,
      data: {
        models: visualization3D.getAvailableModels(),
        simulations: visualization3D.getAvailableSimulations(),
        defaultSettings: visualization3D.getDefaultSettings(),
        supportedFormats: {
          models: ['json', 'obj', 'fbx', 'gltf'],
          textures: ['jpg', 'png', 'webp', 'hdr'],
          animations: ['json', 'fbx', 'gltf']
        },
        features: {
          realTimeRendering: true,
          interactiveControls: true,
          treatmentSimulation: true,
          skinAnalysis: true,
          exportImport: true,
          multiLighting: true,
          materialEditing: true,
          animationSupport: true
        }
      }
    });

  } catch (error) {
    console.error('[3D Skin Visualization GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get 3D visualization data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
