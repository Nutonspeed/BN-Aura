'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Globe, 
  HardDrives, 
  WifiHigh, 
  WifiSlash, 
  Warning,
  CheckCircle,
  Clock,
  Pulse,
  Buildings,
  Users,
  Database,
  Cloud,
  Shield,
  CaretLeft,
  CaretRight,
  ArrowsClockwise,
  WifiHigh as WifiIcon
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import NetworkTopology from '@/components/NetworkTopology';
import NetworkHeatMap from '@/components/NetworkHeatMap';
import TrafficFlowVisualization from '@/components/TrafficFlowVisualization';
import NetworkNodeDetailPanel from '@/components/NetworkNodeDetailPanel';
import NetworkAlertCenter from '@/components/NetworkAlertCenter';
import NetworkPerformanceCharts from '@/components/NetworkPerformanceCharts';
import NetworkExportMenu from '@/components/NetworkExportMenu';
import { useRealNetworkData } from '@/hooks/useRealNetworkData';
import { useResponsive } from '@/hooks/useResponsive';

export interface NetworkNode {
  id: string;
  name: string;
  type: 'clinic' | 'server' | 'database' | 'api' | 'auth' | 'storage';
  status: 'online' | 'offline' | 'warning';
  location: string;
  metrics: {
    latency: number;
    uptime: number;
    load: number;
    users?: number;
    staff?: number;
  };
}

export default function NetworkMapPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'topology' | 'heatmap' | 'traffic'>('topology');
  const [alerts] = useState([
    { id: '1', type: 'warning' as const, title: 'High Latency Detected', message: 'API Gateway latency exceeds 80ms', timestamp: new Date(Date.now() - 900000), read: false },
    { id: '2', type: 'error' as const, title: 'Node Offline', message: 'Storage Server is not responding', timestamp: new Date(Date.now() - 1800000), read: false },
    { id: '3', type: 'success' as const, title: 'System Update', message: 'All nodes updated successfully', timestamp: new Date(Date.now() - 3600000), read: true },
  ]);

  const { width, height, isMobile, isTablet, isDesktop } = useResponsive();

  const { 
    nodes: realTimeNodes, 
    isLoading: realTimeLoading, 
    error: dataError,
    connectionStatus, 
    lastUpdate, 
    refresh 
  } = useRealNetworkData();

  useEffect(() => {
    console.log('=== Real Data Debug ===');
    console.log('Real-time nodes:', realTimeNodes);
    console.log('Is loading:', realTimeLoading);
    console.log('Data error:', dataError);
    console.log('Connection status:', connectionStatus);
    
    if (dataError) {
      console.error('Data fetch error:', dataError);
      // Fallback to empty state on error
      setNodes([]);
      setLoading(false);
      return;
    }
    
    if (realTimeNodes.length > 0) {
      console.log('Setting nodes from real data:', realTimeNodes.length);
      setNodes(realTimeNodes);
    }
    setLoading(realTimeLoading);
  }, [realTimeNodes, realTimeLoading, dataError, connectionStatus]);

  const uniqueTypes = ['all', ...Array.from(new Set(nodes.map(node => node.type)))];
  const uniqueStatuses = ['all', ...Array.from(new Set(nodes.map(node => node.status)))];

  const itemsPerPage = isMobile ? 8 : isTablet ? 9 : 12;

  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           node.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || node.type === filterType;
      const matchesStatus = filterStatus === 'all' || node.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [nodes, searchTerm, filterType, filterStatus]);

  const paginatedNodes = useMemo(() => {
    return filteredNodes.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredNodes, currentPage]);

  const totalPages = Math.ceil(filteredNodes.length / itemsPerPage);

  const stats = useMemo(() => ({
    total: nodes.length,
    online: nodes.filter(n => n.status === 'online').length,
    warning: nodes.filter(n => n.status === 'warning').length,
    offline: nodes.filter(n => n.status === 'offline').length,
    clinics: nodes.filter(n => n.type === 'clinic').length,
    services: nodes.filter(n => n.type !== 'clinic').length
  }), [nodes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'offline': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'warning': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-3 h-3" />;
      case 'offline': return <WifiOff className="w-3 h-3" />;
      case 'warning': return <AlertTriangle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getNodeIcon = useCallback((type: string) => {
    switch (type) {
      case 'server': return <Server className="w-5 h-5" />;
      case 'database': return <Database className="w-5 h-5" />;
      case 'api': return <Cloud className="w-5 h-5" />;
      case 'auth': return <Shield className="w-5 h-5" />;
      case 'storage': return <Database className="w-5 h-5" />;
      case 'clinic': return <Building2 className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  }, []);

  const handleNodeClick = useCallback((node: NetworkNode) => {
    setSelectedNode(node);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="p-3 hover:bg-white/10 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            <h1 className="text-3xl font-bold text-white">Network Map</h1>
          </div>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 text-primary/50 mx-auto mb-4 animate-pulse" />
              <p className="text-white/60">Loading network topology...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 text-white/80" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Network Map</h1>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span>Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Loading...'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <WifiIcon className={`w-4 h-4 ${connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span>{connectionStatus === 'connected' ? 'Connected' : 'Reconnecting...'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50" />
                <span className="text-white/80 font-medium">Online ({stats.online})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50" />
                <span className="text-white/80 font-medium">Warning ({stats.warning})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-400 rounded-full shadow-lg shadow-rose-400/50" />
                <span className="text-white/80 font-medium">Offline ({stats.offline})</span>
              </div>
            </div>
            
            <NetworkExportMenu nodes={nodes} selectedNode={selectedNode} />
            
            <NetworkAlertCenter alerts={alerts} />
            
            <button
              onClick={refresh}
              className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className={`w-5 h-5 text-white/80 ${realTimeLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <div className="flex gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? 'bg-white/20 text-white shadow-lg shadow-white/10' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  viewMode === 'list' 
                    ? 'bg-white/20 text-white shadow-lg shadow-white/10' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium">Total Nodes</p>
                <p className="text-white font-bold text-xl">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium">Clinics</p>
                <p className="text-white font-bold text-xl">{stats.clinics}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Server className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium">Services</p>
                <p className="text-white font-bold text-xl">{stats.services}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium">Warnings</p>
                <p className="text-white font-bold text-xl">{stats.warning}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-lg">
                <WifiOff className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium">Offline</p>
                <p className="text-white font-bold text-xl">{stats.offline}</p>
              </div>
            </div>
          </div>
        </div>

        {selectedNode && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <NetworkPerformanceCharts nodes={nodes} selectedNode={selectedNode} />
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all duration-300"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Activity className="w-5 h-5 text-white/40" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all duration-300"
              >
                {uniqueTypes.map(type => (
                  <option key={type} value={type} className="bg-slate-800">
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all duration-300"
              >
                {uniqueStatuses.map(status => (
                  <option key={status} value={status} className="bg-slate-800">
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-2">
              <div className="flex items-center justify-between mb-4 px-4 pt-4">
                <div className="flex gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setActiveTab('topology')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeTab === 'topology' 
                        ? 'bg-white/20 text-white shadow-lg shadow-white/10' 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Topology
                  </button>
                  <button
                    onClick={() => setActiveTab('heatmap')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeTab === 'heatmap' 
                        ? 'bg-white/20 text-white shadow-lg shadow-white/10' 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Heat Map
                  </button>
                  <button
                    onClick={() => setActiveTab('traffic')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeTab === 'traffic' 
                        ? 'bg-white/20 text-white shadow-lg shadow-white/10' 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Traffic
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs text-white/60">Live</span>
                </div>
              </div>
              
              <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden bg-slate-900/50 p-4">
                {activeTab === 'topology' && (
                  <NetworkTopology 
                    nodes={nodes.map(node => ({
                      label: node.name,
                      type: node.type,
                      status: node.status,
                      location: node.location,
                      metrics: node.metrics
                    }))}
                    onNodeClick={(nodeData) => {
                      const originalNode = nodes.find(n => n.name === nodeData.label);
                      setSelectedNode(originalNode || null);
                    }}
                    isMobile={isMobile}
                    isTablet={isTablet}
                    width={isMobile ? width - 64 : isTablet ? width - 120 : 900}
                    height={isMobile ? 350 : isTablet ? 450 : 480}
                  />
                )}
                {activeTab === 'heatmap' && (
                  <NetworkHeatMap 
                    nodes={nodes}
                    trafficData={{} as Record<string, number>}
                    width={isMobile ? width - 64 : isTablet ? width - 120 : 900}
                    height={isMobile ? 350 : isTablet ? 450 : 480}
                  />
                )}
                {activeTab === 'traffic' && (
                  <TrafficFlowVisualization 
                    nodes={nodes}
                    trafficData={{} as Record<string, number>}
                    width={isMobile ? width - 64 : isTablet ? width - 120 : 900}
                    height={isMobile ? 350 : isTablet ? 450 : 480}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Nodes</h2>
              <p className="text-white/60 text-sm">{filteredNodes.length} of {nodes.length}</p>
            </div>
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-3 max-h-96 lg:max-h-[500px] overflow-y-auto pr-2">
                {paginatedNodes.map((node, index) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-300 ${
                      selectedNode?.id === node.id ? 'ring-2 ring-emerald-400/50 bg-emerald-400/10' : ''
                    }`}
                    onClick={() => setSelectedNode(node)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${getStatusColor(node.status)}`}>
                          {getNodeIcon(node.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">{node.name}</h3>
                          <p className="text-xs text-white/60">{node.location}</p>
                        </div>
                      </div>
                      <div className={`p-1 rounded-full ${getStatusColor(node.status)}`}>
                        {getStatusIcon(node.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-white/60 block">Latency</span>
                        <span className="text-white font-medium">{node.metrics.latency}ms</span>
                      </div>
                      <div>
                        <span className="text-white/60 block">Uptime</span>
                        <span className="text-white font-medium">{node.metrics.uptime}%</span>
                      </div>
                      <div>
                        <span className="text-white/60 block">Load</span>
                        <span className="text-white font-medium">{node.metrics.load}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 lg:max-h-[500px] overflow-y-auto pr-2">
                {paginatedNodes.map((node, index) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all duration-300 ${
                      selectedNode?.id === node.id ? 'ring-2 ring-emerald-400/50' : ''
                    }`}
                    onClick={() => setSelectedNode(node)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${getStatusColor(node.status)}`}>
                          {getNodeIcon(node.type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-white text-sm">{node.name}</h3>
                          <p className="text-white/60 text-xs">{node.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-xs">{node.metrics.latency}ms</span>
                        {getStatusIcon(node.status)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-white/60 text-sm px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/5 backdrop-blur-xl border-t border-white/10 p-4 z-20">
          <div className="flex items-center justify-around text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white/80">{stats.online} Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-white/80">{stats.warning} Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
              <span className="text-white/80">{stats.offline} Offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Node Detail Panel */}
      <NetworkNodeDetailPanel 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />
    </div>
  );
}
