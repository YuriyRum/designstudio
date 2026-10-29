import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  Download,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
} from 'lucide-react';
import { CanvasProject } from '../types/canvas';

interface TopBarProps {
  project: CanvasProject;
  onUpdateTitle: (title: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitToScreen: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onOpenResizeModal: () => void;
  onOpenExportModal: () => void;
  onOpenMagicModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  project,
  onUpdateTitle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitToScreen,
  showGrid,
  onToggleGrid,
  onOpenResizeModal,
  onOpenExportModal,
  onOpenMagicModal,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    } else {
      setTitleInput(project.title);
    }
  };

  const zoomPercent = Math.round(zoom * 100);

  return (
    <header className="h-14 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 z-40 gap-4 shrink-0 select-none">
      {/* Zone 1: Brand & Project Name */}
      <div className="flex items-center gap-4 shrink-0">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs shadow-indigo-500/20">
            <span className="font-extrabold text-sm tracking-tighter">C</span>
          </div>
          <span>CanvasCraft</span>
        </a>

        <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

        {/* Project Title Input */}
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="text-xs font-semibold px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md border border-indigo-400 focus:outline-hidden text-neutral-900 dark:text-neutral-100 max-w-[200px]"
          />
        ) : (
          <button
            onClick={() => {
              setTitleInput(project.title);
              setIsEditingTitle(true);
            }}
            title="Click to rename design"
            className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors truncate max-w-[180px]"
          >
            {project.title}
          </button>
        )}

        {/* Dimensions badge / Resize trigger */}
        <button
          onClick={onOpenResizeModal}
          title="Change canvas dimensions"
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-800"
        >
          <Maximize2 className="w-3 h-3 text-neutral-400" />
          <span>
            {project.width} × {project.height}
          </span>
        </button>
      </div>

      {/* Zone 2: Navigation & Canvas Tools */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg p-0.5 bg-neutral-50 dark:bg-neutral-900">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 rounded-md hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 rounded-md hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Grid toggle */}
        <button
          onClick={onToggleGrid}
          title={showGrid ? 'Hide Alignment Grid' : 'Show Alignment Grid'}
          className={`p-1.5 rounded-lg border transition-colors ${
            showGrid
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 border-indigo-200 dark:border-indigo-800'
              : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg p-0.5 bg-neutral-50 dark:bg-neutral-900 text-xs">
          <button
            onClick={() => onZoomChange(Math.max(0.15, zoom - 0.1))}
            title="Zoom Out"
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 font-mono tabular-nums text-neutral-700 dark:text-neutral-300 min-w-[42px] text-center text-xs">
            {zoomPercent}%
          </span>

          <button
            onClick={() => onZoomChange(Math.min(3.0, zoom + 0.1))}
            title="Zoom In"
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onFitToScreen}
            title="Fit Canvas to Screen"
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 rounded-md hover:bg-white dark:hover:bg-neutral-800 transition-colors ml-0.5 border-l border-neutral-200 dark:border-neutral-800"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Magic Studio AI */}
        <button
          onClick={onOpenMagicModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl border border-indigo-200 dark:border-indigo-800/80 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>Magic Studio</span>
        </button>

        {/* Download / Export */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs shadow-indigo-600/20 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
