'use client';

import React, { useState } from 'react';
import { Download, FileText, FileJs, FileXls, SpinnerGap } from '@phosphor-icons/react';
import { NetworkNode } from '@/app/[locale]/(dashboard)/admin/network-map/page';

interface NetworkExportMenuProps {
  nodes: NetworkNode[];
  selectedNode?: NetworkNode | null;
}

export default function NetworkExportMenu({ nodes, selectedNode }: NetworkExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    setExporting(true);
    const data = selectedNode ? [selectedNode] : nodes;
    const headers = ['Name', 'Type', 'Status', 'Location', 'Latency (ms)', 'Uptime (%)', 'Load (%)'];
    const rows = data.map(node => [
      node.name,
      node.type,
      node.status,
      node.location,
      node.metrics.latency,
      node.metrics.uptime,
      node.metrics.load
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-map-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setTimeout(() => {
      setExporting(false);
      setIsOpen(false);
    }, 1000);
  };

  const exportToJSON = () => {
    setExporting(true);
    const data = selectedNode ? [selectedNode] : nodes;
    const exportData = {
      exportDate: new Date().toISOString(),
      totalNodes: data.length,
      nodes: data.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        status: node.status,
        location: node.location,
        metrics: node.metrics
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-map-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setTimeout(() => {
      setExporting(false);
      setIsOpen(false);
    }, 1000);
  };

  const exportToReport = () => {
    setExporting(true);
    const data = selectedNode ? [selectedNode] : nodes;
    const stats = {
      total: data.length,
      online: data.filter(n => n.status === 'online').length,
      warning: data.filter(n => n.status === 'warning').length,
      offline: data.filter(n => n.status === 'offline').length,
      avgLatency: Math.round(data.reduce((sum, n) => sum + n.metrics.latency, 0) / data.length),
      avgUptime: Math.round((data.reduce((sum, n) => sum + n.metrics.uptime, 0) / data.length) * 10) / 10
    };

    const report = `
NETWORK MAP REPORT
Generated: ${new Date().toLocaleString()}

=== SUMMARY ===
Total Nodes: ${stats.total}
Online: ${stats.online}
Warning: ${stats.warning}
Offline: ${stats.offline}
Average Latency: ${stats.avgLatency}ms
Average Uptime: ${stats.avgUptime}%

=== NODE DETAILS ===
${data.map(node => `
${node.name} (${node.type})
  Status: ${node.status.toUpperCase()}
  Location: ${node.location}
  Latency: ${node.metrics.latency}ms
  Uptime: ${node.metrics.uptime}%
  Load: ${node.metrics.load}%
`).join('\n')}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setTimeout(() => {
      setExporting(false);
      setIsOpen(false);
    }, 1000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/20 rounded-xl text-blue-400 font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <SpinnerGap className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Export</span>
      </button>

      {isOpen && !exporting && (
        <div className="absolute right-0 top-14 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 z-50 shadow-2xl">
          <div className="text-xs text-white/60 px-3 py-2 font-medium">
            {selectedNode ? `Export: ${selectedNode.name}` : `Export: All Nodes (${nodes.length})`}
          </div>
          <div className="h-px bg-white/10 my-1" />
          
          <button
            onClick={exportToCSV}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg transition-all text-left group"
          >
            <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-all">
              <FileXls className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Export as CSV</p>
              <p className="text-white/60 text-xs">Spreadsheet format</p>
            </div>
          </button>

          <button
            onClick={exportToJSON}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg transition-all text-left group"
          >
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all">
              <FileJs className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Export as JSON</p>
              <p className="text-white/60 text-xs">API-ready format</p>
            </div>
          </button>

          <button
            onClick={exportToReport}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg transition-all text-left group"
          >
            <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Export Report</p>
              <p className="text-white/60 text-xs">Text summary</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
