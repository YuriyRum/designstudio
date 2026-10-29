import React, { useState } from 'react';
import { X, Check, Maximize2 } from 'lucide-react';
import { DIMENSION_PRESETS } from '../data/stockAssets';
import { DimensionPreset } from '../types/canvas';

interface ResizeCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWidth: number;
  currentHeight: number;
  onApplyResize: (width: number, height: number) => void;
}

export const ResizeCanvasModal: React.FC<ResizeCanvasModalProps> = ({
  isOpen,
  onClose,
  currentWidth,
  currentHeight,
  onApplyResize,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [width, setWidth] = useState<number>(currentWidth);
  const [height, setHeight] = useState<number>(currentHeight);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: DimensionPreset) => {
    setSelectedPresetId(preset.id);
    setWidth(preset.width);
    setHeight(preset.height);
  };

  const handleApply = () => {
    if (width > 50 && height > 50 && width <= 4000 && height <= 4000) {
      onApplyResize(width, height);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Resize Canvas
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose standard social & print dimensions or enter custom pixels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Custom Dimension Inputs */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
              Custom Dimensions (px)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-neutral-500 block mb-1">Width</span>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    value={width}
                    onChange={(e) => {
                      setWidth(parseInt(e.target.value) || 100);
                      setSelectedPresetId('custom');
                    }}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 tabular-nums font-mono text-neutral-900 dark:text-neutral-100"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-neutral-400 font-mono">px</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">Height</span>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    value={height}
                    onChange={(e) => {
                      setHeight(parseInt(e.target.value) || 100);
                      setSelectedPresetId('custom');
                    }}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 tabular-nums font-mono text-neutral-900 dark:text-neutral-100"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-neutral-400 font-mono">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Presets List */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
              Standard Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIMENSION_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {preset.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                        {preset.width} × {preset.height} px
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs shadow-indigo-600/20 transition-colors"
          >
            Apply Resize
          </button>
        </div>
      </div>
    </div>
  );
};
