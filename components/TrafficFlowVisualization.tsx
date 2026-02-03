'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { NetworkNode } from '@/app/[locale]/(dashboard)/admin/network-map/page';

interface TrafficFlowVisualizationProps {
  nodes: NetworkNode[];
  trafficData?: Record<string, number>;
  width?: number;
  height?: number;
}

interface TrafficParticle {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  progress: number;
  speed: number;
  color: string;
  size: number;
}

export default function TrafficFlowVisualization({ 
  nodes, 
  trafficData = {},
  width = 800,
  height = 400 
}: TrafficFlowVisualizationProps) {
  const [particles, setParticles] = useState<TrafficParticle[]>([]);

  // Responsive dimensions
  const getDimensions = () => {
    if (width < 480) return { centerX: width/2, centerY: height/2, radius: 80 };
    if (width < 768) return { centerX: width/2, centerY: height/2, radius: 120 };
    return { centerX: 400, centerY: 200, radius: 200 };
  };

  const { centerX, centerY, radius } = getDimensions();

  // Calculate node positions
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number; type: string }> = {};
    
    nodes.forEach(node => {
      if (node.type === 'clinic') {
        const index = parseInt(node.id.replace('clinic-', ''));
        const angle = !isNaN(index) ? (index / 10) * 2 * Math.PI : 0;
        positions[node.id] = {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          type: node.type
        };
      } else {
        const serviceIndex = ['server', 'database', 'api', 'auth', 'storage'].indexOf(node.type);
        const angle = serviceIndex >= 0 ? (serviceIndex / 5) * 2 * Math.PI : 0;
        const x = centerX + Math.cos(angle) * (radius * 0.6);
        const y = centerY + Math.sin(angle) * (radius * 0.6);
        positions[node.id] = {
          x: isNaN(x) ? centerX : x,
          y: isNaN(y) ? centerY : y,
          type: node.type
        };
      }
    });
    
    return positions;
  }, [nodes]);

  // Generate traffic particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles: TrafficParticle[] = [];
      
      // Generate particles from server to services
      const serverPos = nodePositions['main-server'] || { x: 400, y: 200 };
      
      const serviceNodes = nodes.filter(n => n.type !== 'clinic' && n.type !== 'server') as NetworkNode[];
      serviceNodes.forEach(service => {
        const servicePos = nodePositions[service.type];
        if (servicePos && service.status === 'online') {
          const traffic = trafficData[service.id] || Math.random() * 500;
          const particleCount = Math.floor(traffic / 100);
          
          for (let i = 0; i < Math.min(particleCount, 5); i++) {
            newParticles.push({
              id: `server-${service.type}-${i}-${Date.now()}`,
              from: serverPos,
              to: servicePos,
              progress: Math.random(),
              speed: 0.01 + Math.random() * 0.02,
              color: service.status === 'online' ? '#10b981' : '#ef4444',
              size: 2 + Math.random() * 2
            });
          }
        }
      });
      
      // Generate particles from API to clinics
      const apiPos = nodePositions['api'];
      if (apiPos) {
        const clinicNodes = nodes.filter(n => n.type === 'clinic' && n.status === 'online') as NetworkNode[];
        clinicNodes.forEach(clinic => {
          const clinicPos = nodePositions[clinic.id];
          if (clinicPos) {
            const traffic = trafficData[clinic.id] || Math.random() * 300;
            const particleCount = Math.floor(traffic / 150);
            
            for (let i = 0; i < Math.min(particleCount, 3); i++) {
              newParticles.push({
                id: `api-${clinic.id}-${i}-${Date.now()}`,
                from: apiPos,
                to: clinicPos,
                progress: Math.random(),
                speed: 0.008 + Math.random() * 0.015,
                color: '#3b82f6',
                size: 1.5 + Math.random() * 1.5
              });
            }
          }
        });
      }
      
      setParticles(newParticles);
    };

    generateParticles();
    const interval = setInterval(generateParticles, 2000);
    
    return () => clearInterval(interval);
  }, [nodes, trafficData, nodePositions]);

  // Animate particles
  useEffect(() => {
    const animationFrame = requestAnimationFrame(function animate() {
      setParticles(prevParticles => 
        prevParticles
          .map(particle => ({
            ...particle,
            progress: particle.progress + particle.speed
          }))
          .filter(particle => particle.progress <= 1)
      );
      requestAnimationFrame(animate);
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="w-full bg-slate-900/50 rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Traffic Flow Visualization</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-white/60">Service Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            <span className="text-white/60">Clinic Data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-white/60">Error/Warning</span>
          </div>
        </div>
      </div>
      
      <div className="relative" style={{ width: '100%', height }}>
        <svg 
          width={width} 
          height={height}
          className="w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid)" />
          
          {/* Connection lines */}
          {nodes.filter(n => n.type !== 'clinic' && n.type !== 'server').map(service => {
            const servicePos = nodePositions[service.type];
            const serverPos = nodePositions['main-server'] || { x: 400, y: 200 };
            
            if (servicePos) {
              return (
                <line
                  key={`line-${service.type}`}
                  x1={serverPos.x}
                  y1={serverPos.y}
                  x2={servicePos.x}
                  y2={servicePos.y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                />
              );
            }
            return null;
          })}
          
          {/* API to clinic lines */}
          {nodes.filter(n => n.type === 'clinic').map(clinic => {
            const clinicPos = nodePositions[clinic.id];
            const apiPos = nodePositions['api'];
            
            if (clinicPos && apiPos) {
              return (
                <line
                  key={`line-${clinic.id}`}
                  x1={apiPos.x}
                  y1={apiPos.y}
                  x2={clinicPos.x}
                  y2={clinicPos.y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              );
            }
            return null;
          })}
          
          {/* Traffic particles */}
          {particles.map(particle => {
            const x = particle.from.x + (particle.to.x - particle.from.x) * particle.progress;
            const y = particle.from.y + (particle.to.y - particle.from.y) * particle.progress;
            
            return (
              <g key={particle.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={particle.size}
                  fill={particle.color}
                  opacity="0.8"
                >
                  <animate
                    attributeName="opacity"
                values="0;0.8;0.8;0"
                dur="2s"
                repeatCount="indefinite"
                />
                </circle>
                <circle
                  cx={x}
                  cy={y}
                  r={particle.size * 2}
                  fill={particle.color}
                  opacity="0.2"
                >
                  <animate
                    attributeName="r"
                values={particle.size + ';' + (particle.size * 3) + ';' + particle.size}
                dur="2s"
                repeatCount="indefinite"
                />
                  <animate
                    attributeName="opacity"
                values="0.5;0;0.5"
                dur="2s"
                repeatCount="indefinite"
                />
                </circle>
              </g>
            );
          })}
          
          {/* Node labels */}
          {nodes.map(node => {
            const pos = nodePositions[node.id];
            if (pos) {
              return (
                <g key={node.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="8"
                    fill={node.status === 'online' ? '#10b981' : node.status === 'warning' ? '#f59e0b' : '#ef4444'}
                    opacity="0.8"
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 15}
                    textAnchor="middle"
                    className="text-xs fill-white/60"
                  >
                    {node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name}
                  </text>
                </g>
              );
            }
            return null;
          })}
        </svg>
        
        {/* Traffic stats */}
        <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
          <div className="text-xs text-white/60">
            Active Connections: {particles.length}
          </div>
        </div>
      </div>
    </div>
  );
}
