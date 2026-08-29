import React from 'react';
import { Database } from 'lucide-react';

export interface DatabaseInspectorFabProps {
  isSynced: boolean;
  onToggle: () => void;
}

/** Floating button that opens the Phase 4 relational database inspector. */
export const DatabaseInspectorFab: React.FC<DatabaseInspectorFabProps> = ({
  isSynced,
  onToggle,
}) => (
  <button
    id="fab-db-inspector"
    aria-label="Toggle Phase 4 Database Schema & Live Engine Inspector"
    title={
      isSynced
        ? 'Phase 4 Relational Database Inspector & Live Location Synced'
        : 'Phase 4 Relational Database Inspector (8 Entities & Live Event Engine)'
    }
    onClick={onToggle}
    className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 bg-[#2A0E3F] hover:bg-[#6B2D8C] text-white py-2.5 px-3.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold transition-all transform hover:scale-105 cursor-pointer border border-white/20 group"
  >
    <div className="relative">
      <Database className="w-4 h-4 text-[#F5EEF8] group-hover:text-white" />
      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
    </div>
    <span className="hidden sm:inline">DB Inspector</span>
    <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono">8 Tables</span>
  </button>
);

export default DatabaseInspectorFab;
