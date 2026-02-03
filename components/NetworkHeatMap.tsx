'use client';

import React, { useMemo } from 'react';
import { NetworkNode } from '@/app/[locale]/(dashboard)/admin/network-map/page';

interface NetworkHeatMapProps {
  nodes: NetworkNode[];
  trafficData?: Record<string, number>;
  width?: number;
  height?: number;
}

interface HeatMapData {
  x: number;
  y: number;
  value: number;
  label: string;
  type: string;
  status: string;
}

export default function NetworkHeatMap({ 
  nodes, 
  trafficData = {}, 
  width = 800, 
  height = 400 
}: NetworkHeatMapProps) {
  // Responsive grid size
  const getGridSize = () => {
    if (width < 480) return 30; // Mobile
    if (width < 768) return 40; // Tablet
    return 50; // Desktop
  };

  const gridSize = getGridSize();
  // Generate heat map data
  const heatMapData = useMemo(() => {
    const data: HeatMapData[] = [];
    const cols = Math.floor(width / gridSize);
    const rows = Math.floor(height / gridSize);

    // Create grid
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * gridSize + gridSize / 2;
        const y = row * gridSize + gridSize / 2;
        
        // Calculate heat value based on nearby nodes
        let heatValue = 0;
        let nearbyNode: NetworkNode | null = null;
        
        const serviceNodes: NetworkNode[] = nodes.filter((n) => n.type !== 'clinic');
        const clinicNodes: NetworkNode[] = nodes.filter((n) => n.type === 'clinic');
        
        // Check all nodes for proximity
        [...serviceNodes, ...clinicNodes].forEach((node: NetworkNode) => {
          // Calculate node position based on type
          let nodeX: number, nodeY: number;
          
          if (node.type === 'clinic') {
            const clinicIndex = clinicNodes.indexOf(node);
            const angle = clinicNodes.length > 0 ? (clinicIndex / clinicNodes.length) * 2 * Math.PI : 0;
            nodeX = 400 + Math.cos(angle) * 200;
            nodeY = 200 + Math.sin(angle) * 200;
          } else {
            const serviceIndex = ['server', 'database', 'api', 'auth', 'storage'].indexOf(node.type);
            const angle = serviceIndex >= 0 ? (serviceIndex / 5) * 2 * Math.PI : 0;
            nodeX = 400 + Math.cos(angle) * 120;
            nodeY = 200 + Math.sin(angle) * 120;
          }
          
          // Ensure coordinates are valid numbers
          if (isNaN(nodeX) || isNaN(nodeY)) {
            nodeX = 400;
            nodeY = 200;
          }
          
          const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2));
          
          if (distance < gridSize * 2) {
            const influence = 1 - (distance / (gridSize * 2));
            const nodeLoad = node.metrics.load / 100;
            const traffic = trafficData[node.id] || 0;
            const trafficNormalized = Math.min(traffic / 1000, 1);
            
            heatValue += influence * (nodeLoad * 0.6 + trafficNormalized * 0.4);
            
            if (influence > 0.5) {
              nearbyNode = node;
            }
          }
        });

        // Add some random noise for visual effect
        heatValue += Math.random() * 0.1;
        heatValue = Math.min(heatValue, 1);

        const nearbyNodeInfo = nearbyNode as unknown as {
          name?: string;
          type?: string;
          status?: string;
        } | null;

        if (heatValue > 0.1 || nearbyNode) {
          data.push({
            x,
            y,
            value: heatValue,
            label: nearbyNodeInfo?.name || '',
            type: nearbyNodeInfo?.type || '',
            status: nearbyNodeInfo?.status || ''
          });
        }
      }
    }

    return data;
  }, [nodes, trafficData, width, height]);

  const getHeatColor = (value: number) => {
    if (value < 0.2) return 'rgba(59, 130, 246, 0.2)'; // Blue - Low
    if (value < 0.4) return 'rgba(34, 197, 94, 0.3)'; // Green - Normal
    if (value < 0.6) return 'rgba(251, 191, 36, 0.4)'; // Yellow - Medium
    if (value < 0.8) return 'rgba(251, 146, 60, 0.5)'; // Orange - High
    return 'rgba(239, 68, 68, 0.6)'; // Red - Critical
  };

  return (
    <div className="relative bg-slate-900/50 rounded-2xl p-4 border border-white/10">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Network Performance Heat Map</h3>
        <div className="flex items-center gap-4 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500/20 rounded"></div>
            <span>Low Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/30 rounded"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500/40 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500/50 rounded"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500/60 rounded"></div>
            <span>Critical</span>
          </div>
        </div>
      </div>
      
      <div className="relative overflow-hidden rounded-xl" style={{ width, height }}>
        <svg width={width} height={height} className="absolute inset-0">
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid)" />
          
          {/* Heat map cells */}
          {heatMapData.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="20"
                fill={getHeatColor(point.value)}
                className="transition-all duration-1000"
              >
                <animate
                  attributeName="r"
                values="15;25;15"
                dur="3s"
                repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                values="0.5;1;0.5"
                dur="3s"
                repeatCount="indefinite"
                />
              </circle>
              
              {point.label && (
                <text
                  x={point.x}
                  y={point.y + 35}
                  textAnchor="middle"
                  className="text-xs fill-white/60 pointer-events-none"
                >
                  {point.label.length > 10 ? point.label.substring(0, 10) + '...' : point.label}
                </text>
              )}
            </g>
          ))}
          
          {/* Connection lines with traffic flow */}
          {nodes.filter(n => n.type !== 'server').map((node, index) => {
            const isService = node.type !== 'clinic';
            const sourceX = isService ? 
              400 + Math.cos(['server', 'database', 'api', 'auth', 'storage'].indexOf(node.type) / 5 * 2 * Math.PI) * 120 :
              400;
            const sourceY = isService ? 
              200 + Math.sin(['server', 'database', 'api', 'auth', 'storage'].indexOf(node.type) / 5 * 2 * Math.PI) * 120 :
              200;
            
            if (isService) {
              return (
                <line
                  key={`line-${node.id}`}
                  x1={400}
                  y1={200}
                  x2={sourceX}
                  y2={sourceY}
                  stroke={node.status === 'online' ? '#10b981' : '#ef4444'}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                values="0;10"
                dur="1s"
                repeatCount="indefinite"
                />
                </line>
              );
            }
            return null;
          })}
        </svg>
        
        {/* Real-time indicator */}
        <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-white/60">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
