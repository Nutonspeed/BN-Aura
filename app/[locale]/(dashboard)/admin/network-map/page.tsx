'use client';

import { 
  ArrowLeft,
  Globe,
  HardDrives,
  WifiSlash,
  Warning,
  CheckCircle,
  Clock,
  Pulse,
  Buildings,
  Database,
  Cloud,
  Shield,
  CaretLeft,
  CaretRight,
  ArrowsClockwise,
  WifiHigh as WifiIcon,
  SpinnerGap,
  MagnifyingGlass,
  Monitor,
  IdentificationBadge,
  Sparkle,
  TrendUp,
  Icon,
  Funnel,
  SquaresFour,
  List as ListIcon,
  X
} from '@phosphor-icons/react';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import NetworkTopology from '@/components/NetworkTopology';
import NetworkHeatMap from '@/components/NetworkHeatMap';
import TrafficFlowVisualization from '@/components/TrafficFlowVisualization';
import NetworkNodeDetailPanel from '@/components/NetworkNodeDetailPanel';
import NetworkAlertCenter from '@/components/NetworkAlertCenter';
import NetworkPerformanceCharts from '@/components/NetworkPerformanceCharts';
import NetworkExportMenu from '@/components/NetworkExportMenu';
import { useRealNetworkData } from '@/hooks/useRealNetworkData';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { goBack } = useBackNavigation();
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

  const { width, isMobile, isTablet } = useResponsive();

  const { 
    nodes: realTimeNodes, 
    isLoading: realTimeLoading, 
    error: dataError,
    connectionStatus, 
    lastUpdate, 
    refresh 
  } = useRealNetworkData();

  useEffect(() => {
    if (dataError) {
      console.error('Data fetch error:', dataError);
      setNodes([]);
      setLoading(false);
      return;
    }
    
    if (realTimeNodes.length > 0) {
      setNodes(realTimeNodes);
    }
    setLoading(realTimeLoading);
  }, [realTimeNodes, realTimeLoading, dataError]);

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
  }, [filteredNodes, currentPage, itemsPerPage]);

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
      case 'online': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'offline': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-muted-foreground bg-secondary border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-3 h-3" />;
      case 'offline': return <WifiSlash className="w-3 h-3" />;
      case 'warning': return <Warning className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getNodeIcon = useCallback((type: string) => {
    switch (type) {
      case 'server': return <HardDrives className="w-5 h-5" />;
      case 'database': return <Database className="w-5 h-5" />;
      case 'api': return <Cloud className="w-5 h-5" />;
      case 'auth': return <Shield className="w-5 h-5" />;
      case 'storage': return <Database className="w-5 h-5" />;
      case 'clinic': return <Buildings className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  }, []);

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 flex flex-col gap-6">
        <Breadcrumb />
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => goBack('/admin')} 
            className="p-3 bg-secondary border border-border rounded-xl hover:bg-accent transition-colors text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-foreground">Network Map</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse font-medium uppercase tracking-widest">Loading network topology...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <Button 
            variant="outline"
            onClick={() => goBack('/admin')}
            className="p-4 h-14 w-14 border-border rounded-2xl text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft weight="bold" className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <Globe weight="duotone" className="w-4 h-4" />
              Global Topology Node
            </motion.div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight uppercase">
              Network <span className="text-primary">Intelligence</span>
            </h1>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span>Last Sync: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'INITIALIZING...'}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <div className="flex items-center gap-2">
                <WifiIcon weight="bold" className={cn("w-3.5 h-3.5", connectionStatus === 'connected' ? 'text-emerald-500' : 'text-amber-500')} />
                <span>{connectionStatus === 'connected' ? 'SECURE_UPLINK' : 'RECONNECTING...'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <NetworkExportMenu nodes={nodes} selectedNode={selectedNode || undefined} />
          <NetworkAlertCenter alerts={alerts} />
          <Button
            variant="outline"
            onClick={refresh}
            className="p-4 h-14 w-14 border-border rounded-2xl text-muted-foreground hover:text-primary transition-all"
          >
            <ArrowsClockwise weight="bold" className={cn("w-5 h-5", realTimeLoading && "animate-spin")} />
          </Button>
          
          <div className="flex bg-secondary/50 border border-border/50 p-1.5 rounded-[24px] shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-3 rounded-xl transition-all border",
                viewMode === 'grid' 
                  ? "bg-card text-primary border-border/50 shadow-sm" 
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              <SquaresFour weight="duotone" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-3 rounded-xl transition-all border",
                viewMode === 'list' 
                  ? "bg-card text-primary border-border/50 shadow-sm" 
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              <ListIcon weight="duotone" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 px-2">
        <StatCard
          title="Consolidated Nodes"
          value={stats.total}
          icon={Globe as Icon}
          className="p-4"
        />
        <StatCard
          title="Clinical Terminals"
          value={stats.clinics}
          icon={Buildings as Icon}
          iconColor="text-emerald-500"
          className="p-4"
        />
        <StatCard
          title="Operational Services"
          value={stats.services}
          icon={HardDrives as Icon}
          iconColor="text-purple-500"
          className="p-4"
        />
        <StatCard
          title="Warning Delta"
          value={stats.warning}
          icon={Warning as Icon}
          iconColor="text-amber-500"
          className="p-4"
        />
        <StatCard
          title="Offline Nodes"
          value={stats.offline}
          icon={WifiSlash as Icon}
          iconColor="text-rose-500"
          className="p-4"
        />
      </div>

      {/* Selected Node Intelligence */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-2"
          >
            <Card className="rounded-[40px] border-primary/20 bg-primary/[0.01] shadow-premium overflow-hidden group">
              <CardHeader className="p-8 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <Pulse weight="duotone" className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black uppercase tracking-tight">Telemetry: {selectedNode.name}</CardTitle>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Real-time performance matrix</p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedNode(null)} className="h-10 w-10 p-0 rounded-xl hover:bg-primary/5">
                    <X weight="bold" className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <NetworkPerformanceCharts nodes={nodes} selectedNode={selectedNode} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-2">
        {/* Main Visualization Node */}
        <div className="lg:col-span-2 space-y-10">
          <Card className="rounded-[48px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex bg-secondary/50 p-1.5 rounded-[24px] border border-border/50 shadow-inner shrink-0">
                  {[
                    { id: 'topology', label: 'Topology', icon: Globe },
                    { id: 'heatmap', label: 'Heat Map', icon: Sparkle },
                    { id: 'traffic', label: 'Traffic', icon: Pulse }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex items-center gap-2",
                        activeTab === tab.id 
                          ? "bg-primary text-primary-foreground border-primary shadow-premium" 
                          : "text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <tab.icon weight={activeTab === tab.id ? "fill" : "bold"} className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Live Biometric Feed</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 bg-secondary/10">
              <div className="relative h-[500px] xl:h-[600px] w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
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
                        height={isMobile ? 400 : isTablet ? 500 : 580}
                      />
                    )}
                    {activeTab === 'heatmap' && (
                      <NetworkHeatMap 
                        nodes={nodes}
                        trafficData={{} as Record<string, number>}
                        width={isMobile ? width - 64 : isTablet ? width - 120 : 900}
                        height={isMobile ? 400 : isTablet ? 500 : 580}
                      />
                    )}
                    {activeTab === 'traffic' && (
                      <TrafficFlowVisualization 
                        nodes={nodes}
                        trafficData={{} as Record<string, number>}
                        width={isMobile ? width - 64 : isTablet ? width - 120 : 900}
                        height={isMobile ? 400 : isTablet ? 500 : 580}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Filters Node */}
          <Card className="p-8 rounded-[40px] border-border/50 shadow-card">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Search Registry</label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                  <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                  <input
                    type="text"
                    placeholder="Search nodes by name or location..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10 font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Node Type Filter</label>
                <div className="relative group/input">
                  <select
                    value={filterType}
                    onChange={handleTypeFilterChange}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest shadow-inner"
                  >
                    {uniqueTypes.map(type => (
                      <option key={type} value={type} className="bg-card">
                        {type === 'all' ? 'PROTOCOL: ALL' : type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <Funnel weight="bold" className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Operational Status</label>
                <div className="relative group/input">
                  <select
                    value={filterStatus}
                    onChange={handleStatusFilterChange}
                    className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest shadow-inner"
                  >
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status} className="bg-card">
                        {status === 'all' ? 'STATUS: ALL' : status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <Pulse weight="bold" className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Area: Node Registry */}
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_hsl(var(--primary)/0.6)]" />
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Identity Hub</h2>
              </div>
              <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest uppercase px-4 py-1">
                {filteredNodes.length} Detected
              </Badge>
            </div>
            
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar pb-10">
              <AnimatePresence mode="popLayout">
                {paginatedNodes.map((node, index) => (
                  <motion.div
                    key={node.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "bg-card border rounded-[32px] p-6 cursor-pointer transition-all duration-500 group relative overflow-hidden",
                      selectedNode?.id === node.id 
                        ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.02] shadow-premium' 
                        : 'border-border/50 hover:border-primary/30 shadow-card hover:shadow-card-hover'
                    )}
                    onClick={() => handleNodeClick(node)}
                  >
                    {selectedNode?.id === node.id && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                    )}
                    
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner transition-all duration-500",
                          node.status === 'online' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                          node.status === 'offline' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                          "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        )}>
                          {getNodeIcon(node.type)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-foreground text-sm truncate uppercase tracking-tight group-hover:text-primary transition-colors">{node.name}</h3>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5 opacity-60 italic">{node.location}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "p-1.5 rounded-full shadow-sm",
                        node.status === 'online' ? "bg-emerald-500/10 text-emerald-500" :
                        node.status === 'offline' ? "bg-rose-500/10 text-rose-500" :
                        "bg-amber-500/10 text-amber-500"
                      )}>
                        {getStatusIcon(node.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 border-t border-border/30 pt-5 mt-2 relative z-10">
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-[8px] font-black uppercase tracking-[0.2em] block">Latency</span>
                        <span className="text-foreground text-xs font-black tabular-nums">{node.metrics.latency}ms</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-[8px] font-black uppercase tracking-[0.2em] block">Uptime</span>
                        <span className="text-foreground text-xs font-black tabular-nums">{node.metrics.uptime}%</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-[8px] font-black uppercase tracking-[0.2em] block">Load</span>
                        <span className="text-foreground text-xs font-black tabular-nums">{node.metrics.load}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination Protocol */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 pt-4 border-t border-border/30">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Page {currentPage} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-10 w-10 p-0 rounded-xl border-border/50 hover:bg-secondary disabled:opacity-20 transition-all"
                  >
                    <CaretLeft weight="bold" className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-10 w-10 p-0 rounded-xl border-border/50 hover:bg-secondary disabled:opacity-20 transition-all"
                  >
                    <CaretRight weight="bold" className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Card className="p-8 rounded-[40px] border-primary/10 bg-primary/[0.02] space-y-4 group overflow-hidden relative shadow-inner">
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />
            <div className="flex items-center gap-3 relative z-10">
              <Sparkle weight="duotone" className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Network Intelligence</h4>
            </div>
            <p className="text-[11px] text-muted-foreground italic font-medium leading-relaxed relative z-10 opacity-80">
              Global system architecture is maintained at 99.99% parity. Real-time biometric transmissions are currently distributed across sector theta.
            </p>
          </Card>
        </div>
      </div>

      {/* Mobile Status Bar Node */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-2xl border-t border-border/50 p-5 z-20 shadow-premium">
        <div className="flex items-center justify-around text-[9px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-emerald-500">Online: {stats.online}</span>
          </div>
          <div className="flex items-center gap-2.5 text-amber-500">
            <Warning weight="bold" className="w-3.5 h-3.5" />
            <span>Warning: {stats.warning}</span>
          </div>
          <div className="flex items-center gap-2.5 text-rose-500">
            <WifiSlash weight="bold" className="w-3.5 h-3.5" />
            <span>Offline: {stats.offline}</span>
          </div>
        </div>
      </div>

      {/* Node Detail Panel Node */}
      <NetworkNodeDetailPanel 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />
    </motion.div>
  );
}