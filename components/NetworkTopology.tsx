'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionMode,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  HardDrives, 
  Database, 
  Cloud, 
  Shield, 
  HardDrive, 
  Buildings,
  WifiSlash,
  Warning,
  CheckCircle,
  Pulse,
  Globe
} from '@phosphor-icons/react';

interface NetworkNodeData extends Record<string, unknown> {
  label: string;
  type: 'clinic' | 'server' | 'database' | 'api' | 'auth' | 'storage';
  status: 'online' | 'offline' | 'warning';
  location: string;
  metrics: {
    latency: number;
    uptime: number;
    load: number;
    users?: number;
    staff?: number;
    tickets?: number;
  };
}

interface NetworkTopologyProps {
  nodes: NetworkNodeData[];
  onNodeClick?: (node: NetworkNodeData) => void;
  isMobile?: boolean;
  isTablet?: boolean;
  width?: number;
  height?: number;
}

type CustomNode = Node<NetworkNodeData>;

const getNodeIcon = (type: string, status: string) => {
  const iconClass = status === 'online' ? 'text-emerald-400' : 
                   status === 'warning' ? 'text-amber-400' : 
                   'text-red-400';
  
  switch (type) {
    case 'server': return <Server className={`w-6 h-6 ${iconClass}`} />;
    case 'database': return <Database className={`w-6 h-6 ${iconClass}`} />;
    case 'api': return <Cloud className={`w-6 h-6 ${iconClass}`} />;
    case 'auth': return <Shield className={`w-6 h-6 ${iconClass}`} />;
    case 'storage': return <Database className={`w-6 h-6 ${iconClass}`} />;
    case 'clinic': return <Building2 className={`w-6 h-6 ${iconClass}`} />;
    default: return <Globe className={`w-6 h-6 ${iconClass}`} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return '#10b981';
    case 'warning': return '#f59e0b';
    case 'offline': return '#ef4444';
    default: return '#6b7280';
  }
};

const CustomNode = ({ data, selected }: { data: NetworkNodeData; selected: boolean }) => {
  const [hovered, setHovered] = useState(false);
  
  const getNodeIcon = (type: string, status: string) => {
    const iconClass = `w-6 h-6 ${getStatusColor(status)}`;
    
    switch (type) {
      case 'clinic':
        return <Building2 className={iconClass} />;
      case 'server':
        return <Server className={iconClass} />;
      case 'database':
        return <Database className={iconClass} />;
      case 'api':
        return <Cloud className={iconClass} />;
      case 'auth':
        return <Shield className={iconClass} />;
      case 'storage':
        return <HardDrive className={iconClass} />;
      default:
        return <Activity className={iconClass} />;
    }
  };
  
  return (
    <div 
      className={`px-3 py-2 shadow-lg rounded-lg border-2 transition-all duration-300 ${
        selected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
      } ${hovered ? 'scale-105' : ''}`}
      style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: getStatusColor(data.status),
        minWidth: '140px',
        maxWidth: '180px'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Add handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: getStatusColor(data.status) }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: getStatusColor(data.status) }}
      />
      
      <div className="flex items-center gap-2">
        {getNodeIcon(data.type, data.status)}
        <div className="text-white flex-1">
          <div className="font-semibold text-xs truncate">{data.label}</div>
          <div className="text-xs text-white/60 truncate">{data.location}</div>
          {data.type === 'clinic' && (
            <div className="text-xs text-white/40 mt-1">
              👥 {data.metrics.users} | 👨‍⚕️ {data.metrics.staff}
            </div>
          )}
          <div className="flex items-center gap-1 mt-1 text-xs">
            <span className="text-white/60">⚡ {data.metrics.latency}ms</span>
            <span className="text-white/60">📊 {data.metrics.load}%</span>
          </div>
        </div>
      </div>
      {hovered && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full animate-pulse"
             style={{ backgroundColor: getStatusColor(data.status) }}
        />
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function NetworkTopology({ 
  nodes, 
  onNodeClick, 
  isMobile = false, 
  isTablet = false,
  width = 1200,
  height = 600 
}: NetworkTopologyProps) {
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState<CustomNode>([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Convert nodes data to ReactFlow format
  useEffect(() => {
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    
    const serviceNodes = nodes.filter(n => n.type !== 'clinic');
    const clinicNodes = nodes.filter(n => n.type === 'clinic');
    
    // Position service nodes in a circle around center
    const serviceFlowNodes: CustomNode[] = serviceNodes.map((node, index) => {
      const angle = (index / serviceNodes.length) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius * 0.6;
      const y = centerY + Math.sin(angle) * radius * 0.6;
      
      return {
        id: node.type === 'server' ? 'main-server' : node.type,
        type: 'custom',
        position: { x, y },
        data: node,
      };
    });
    
    // Position clinic nodes in a larger circle
    const clinicFlowNodes: CustomNode[] = clinicNodes.map((node, index) => {
      const angle = (index / clinicNodes.length) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      return {
        id: `clinic-${index}`,
        type: 'custom',
        position: { x, y },
        data: node,
      };
    });
    
    // Create edges
    const flowEdges: Edge[] = [];
    
    // Connect main server to services
    serviceNodes.forEach(node => {
      if (node.type !== 'server') {
        flowEdges.push({
          id: `main-server-${node.type}`,
          source: 'main-server',
          target: node.type,
          type: 'smoothstep',
          animated: node.status === 'online',
          style: {
            stroke: getStatusColor(node.status),
            strokeWidth: 2,
          },
        });
      }
    });
    
    // Connect API Gateway to clinics
    clinicNodes.forEach((node, index) => {
      flowEdges.push({
        id: `api-clinic-${index}`,
        source: 'api',
        target: `clinic-${index}`,
        type: 'smoothstep',
        animated: node.status === 'online',
        style: {
          stroke: getStatusColor(node.status),
          strokeWidth: 1,
        },
      });
    });
    
    setReactFlowNodes([...serviceFlowNodes, ...clinicFlowNodes]);
    setReactFlowEdges(flowEdges);
  }, [nodes, setReactFlowNodes, setReactFlowEdges]);

  const onConnect = useCallback(
    (params: any) => setReactFlowEdges((eds) => addEdge(params, eds)),
    [setReactFlowEdges]
  );

  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: CustomNode) => {
    setSelectedNode(node.id);
    if (onNodeClick && node.data) {
      onNodeClick(node.data);
    }
  }, [onNodeClick]);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: nodes.length,
    online: nodes.filter(n => n.status === 'online').length,
    warning: nodes.filter(n => n.status === 'warning').length,
    offline: nodes.filter(n => n.status === 'offline').length,
    clinics: nodes.filter(n => n.type === 'clinic').length,
    services: nodes.filter(n => n.type !== 'clinic').length,
  }), [nodes]);

  return (
    <div style={{ width, height }} className="relative">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView={!isMobile}
        defaultViewport={isMobile ? { x: 0, y: 0, zoom: 0.5 } : { x: 0, y: 0, zoom: 1 }}
        minZoom={isMobile ? 0.3 : 0.5}
        maxZoom={isMobile ? 1.5 : 2}
        nodesDraggable={!isMobile}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
      >
        <Background 
          color="#ffffff" 
          gap={20} 
          variant={BackgroundVariant.Dots}
          style={{ opacity: 0.1 }}
        />
        
        {!isMobile && (
          <>
            <Controls 
              showZoom={true}
              showFitView={true}
              showInteractive={false}
              position="bottom-left"
              className="bg-slate-800/80 border border-white/10"
            />
            
            {isTablet && (
              <MiniMap 
                nodeColor={(node) => getStatusColor(node.data?.status as string)}
                position="bottom-right"
                className="bg-slate-800/80 border border-white/10"
              />
            )}
          </>
        )}
        
        {isMobile && (
          <Panel position="bottom-center" className="flex gap-2">
            <button
              onClick={() => {
                const reactFlowWrapper = document.querySelector('.react-flow');
                if (reactFlowWrapper) {
                  reactFlowWrapper.scrollTo({ 
                    left: reactFlowWrapper.scrollWidth / 2 - reactFlowWrapper.clientWidth / 2,
                    behavior: 'smooth'
                  });
                }
              }}
              className="px-3 py-2 bg-slate-800/80 text-white rounded-lg border border-white/10 text-sm"
            >
              Center
            </button>
            <button
              onClick={() => {
                const reactFlowWrapper = document.querySelector('.react-flow');
                if (reactFlowWrapper) {
                  reactFlowWrapper.scrollTo({ left: 0, behavior: 'smooth' });
                }
              }}
              className="px-3 py-2 bg-slate-800/80 text-white rounded-lg border border-white/10 text-sm"
            >
              Left
            </button>
            <button
              onClick={() => {
                const reactFlowWrapper = document.querySelector('.react-flow');
                if (reactFlowWrapper) {
                  reactFlowWrapper.scrollTo({ left: reactFlowWrapper.scrollWidth, behavior: 'smooth' });
                }
              }}
              className="px-3 py-2 bg-slate-800/80 text-white rounded-lg border border-white/10 text-sm"
            >
              Right
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
