import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Layers,
  ChevronDown,
  FlipHorizontal,
  FlipVertical,
  SlidersHorizontal,
  MoveHorizontal,
  MoveVertical,
  Sparkles,
} from 'lucide-react';
import { CanvasElement } from '../types/canvas';
import { AVAILABLE_FONTS } from '../data/stockAssets';

interface ElementToolbarProps {
  element: CanvasElement | null;
  canvasWidth: number;
  canvasHeight: number;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: (direction: 'up' | 'down' | 'front' | 'back') => void;
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
}

export const ElementToolbar: React.FC<ElementToolbarProps> = ({
  element,
  canvasWidth,
  canvasHeight,
  onUpdate,
  onDuplicate,
  onDelete,
  onReorder,
  onAlign,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showPositionMenu, setShowPositionMenu] = useState(false);

  if (!element) {
    return (
      <div className="h-11 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between text-xs text-neutral-400 select-none">
        <span>Select any element on the canvas to customize its typography, colors, and layout</span>
        <span className="text-[11px] font-mono text-neutral-400">Canvas: {canvasWidth} × {canvasHeight} px</span>
      </div>
    );
  }

  const isText = element.type === 'text';
  const isShape = element.type === 'shape';
  const isImage = element.type === 'image';
  const isQr = element.type === 'qrcode';

  return (
    <div className="h-11 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 flex items-center justify-between gap-2 overflow-x-auto select-none text-xs z-20">
      {/* Left zone: Type-specific controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* TEXT CONTROLS */}
        {isText && (
          <>
            {/* Font Family Dropdown */}
            <select
              value={element.fontFamily || "'Plus Jakarta Sans', sans-serif"}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="h-7 px-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 max-w-[130px] font-medium cursor-pointer"
            >
              {AVAILABLE_FONTS.map((f) => (
                <option key={f.name} value={f.family}>
                  {f.name}
                </option>
              ))}
            </select>

            {/* Font Size */}
            <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 h-7 px-1">
              <button
                onClick={() => onUpdate({ fontSize: Math.max(8, (element.fontSize || 24) - 2) })}
                className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                -
              </button>
              <input
                type="number"
                value={element.fontSize || 24}
                onChange={(e) => onUpdate({ fontSize: Math.max(6, parseInt(e.target.value) || 12) })}
                className="w-9 text-center bg-transparent text-xs font-mono tabular-nums text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
              />
              <button
                onClick={() => onUpdate({ fontSize: Math.min(240, (element.fontSize || 24) + 2) })}
                className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                +
              </button>
            </div>

            {/* Text Color */}
            <label
              title="Text Color"
              className="w-7 h-7 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center cursor-pointer overflow-hidden p-0.5"
            >
              <input
                type="color"
                value={element.color || '#000000'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-full h-full cursor-pointer opacity-0 absolute"
              />
              <div
                className="w-full h-full rounded-md border border-black/10"
                style={{ backgroundColor: element.color || '#000000' }}
              />
            </label>

            <div className="h-4 w-px bg-neutral-200 dark:border-neutral-800 mx-0.5" />

            {/* Formatting: Bold, Italic, Underline */}
            <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg p-0.5 bg-neutral-50 dark:bg-neutral-800">
              <button
                onClick={() =>
                  onUpdate({
                    fontWeight: element.fontWeight === '700' ? '400' : '700',
                  })
                }
                title="Bold"
                className={`p-1 rounded-sm transition-colors ${
                  element.fontWeight === '700'
                    ? 'bg-indigo-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  onUpdate({
                    fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                title="Italic"
                className={`p-1 rounded-sm transition-colors ${
                  element.fontStyle === 'italic'
                    ? 'bg-indigo-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  onUpdate({
                    textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline',
                  })
                }
                title="Underline"
                className={`p-1 rounded-sm transition-colors ${
                  element.textDecoration === 'underline'
                    ? 'bg-indigo-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg p-0.5 bg-neutral-50 dark:bg-neutral-800">
              <button
                onClick={() => onUpdate({ textAlign: 'left' })}
                title="Align Left"
                className={`p-1 rounded-sm ${
                  element.textAlign === 'left' || !element.textAlign
                    ? 'bg-indigo-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdate({ textAlign: 'center' })}
                title="Align Center"
                className={`p-1 rounded-sm ${
                  element.textAlign === 'center' ? 'bg-indigo-600 text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdate({ textAlign: 'right' })}
                title="Align Right"
                className={`p-1 rounded-sm ${
                  element.textAlign === 'right' ? 'bg-indigo-600 text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {/* SHAPE CONTROLS */}
        {isShape && (
          <>
            {/* Fill Color */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-500">Fill:</span>
              <label
                title="Shape Fill Color"
                className="w-7 h-7 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center cursor-pointer overflow-hidden p-0.5 relative"
              >
                <input
                  type="color"
                  value={element.fillColor || '#4F46E5'}
                  onChange={(e) => onUpdate({ fillColor: e.target.value })}
                  className="w-full h-full cursor-pointer opacity-0 absolute"
                />
                <div
                  className="w-full h-full rounded-md border border-black/10"
                  style={{ backgroundColor: element.fillColor || '#4F46E5' }}
                />
              </label>
            </div>

            {/* Stroke Color & Width */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-500">Border:</span>
              <label
                title="Stroke Color"
                className="w-7 h-7 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center cursor-pointer overflow-hidden p-0.5 relative"
              >
                <input
                  type="color"
                  value={element.strokeColor || '#000000'}
                  onChange={(e) =>
                    onUpdate({
                      strokeColor: e.target.value,
                      strokeWidth: element.strokeWidth || 2,
                    })
                  }
                  className="w-full h-full cursor-pointer opacity-0 absolute"
                />
                <div
                  className="w-full h-full rounded-md border border-black/10"
                  style={{ backgroundColor: element.strokeColor || '#000000' }}
                />
              </label>

              <input
                type="number"
                min="0"
                max="24"
                value={element.strokeWidth || 0}
                onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) || 0 })}
                className="w-10 h-7 text-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono"
                title="Border Width (px)"
              />
            </div>

            {/* Border Radius */}
            {(element.shapeType === 'rectangle' || element.shapeType === 'rounded-rect') && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-neutral-500">Radius:</span>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={element.borderRadius || 0}
                  onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) })}
                  className="w-16 accent-indigo-600"
                />
                <span className="text-[11px] font-mono text-neutral-500">{element.borderRadius || 0}px</span>
              </div>
            )}
          </>
        )}

        {/* IMAGE CONTROLS */}
        {isImage && (
          <>
            {/* Filters toggle */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                  showFilters
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {/* Filter popup dropdown */}
              {showFilters && (
                <div className="absolute left-0 top-9 w-60 p-3 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    <span>Adjustments</span>
                    <button
                      onClick={() =>
                        onUpdate({
                          filters: {
                            brightness: 100,
                            contrast: 100,
                            saturation: 100,
                            grayscale: 0,
                            blur: 0,
                            sepia: 0,
                          },
                        })
                      }
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                      <span>Brightness</span>
                      <span className="font-mono">{element.filters?.brightness ?? 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={element.filters?.brightness ?? 100}
                      onChange={(e) =>
                        onUpdate({
                          filters: {
                            ...(element.filters || {
                              contrast: 100,
                              saturation: 100,
                              grayscale: 0,
                              blur: 0,
                              sepia: 0,
                            }),
                            brightness: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* Contrast */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                      <span>Contrast</span>
                      <span className="font-mono">{element.filters?.contrast ?? 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={element.filters?.contrast ?? 100}
                      onChange={(e) =>
                        onUpdate({
                          filters: {
                            ...(element.filters || {
                              brightness: 100,
                              saturation: 100,
                              grayscale: 0,
                              blur: 0,
                              sepia: 0,
                            }),
                            contrast: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* Saturation */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                      <span>Saturation</span>
                      <span className="font-mono">{element.filters?.saturation ?? 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={element.filters?.saturation ?? 100}
                      onChange={(e) =>
                        onUpdate({
                          filters: {
                            ...(element.filters || {
                              brightness: 100,
                              contrast: 100,
                              grayscale: 0,
                              blur: 0,
                              sepia: 0,
                            }),
                            saturation: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Flip Horiz / Vert */}
            <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg p-0.5 bg-neutral-50 dark:bg-neutral-800">
              <button
                onClick={() => onUpdate({ flipX: !element.flipX })}
                title="Flip Horizontal"
                className={`p-1 rounded-sm ${
                  element.flipX ? 'bg-indigo-600 text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdate({ flipY: !element.flipY })}
                title="Flip Vertical"
                className={`p-1 rounded-sm ${
                  element.flipY ? 'bg-indigo-600 text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <FlipVertical className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Corner Radius */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-500">Radius:</span>
              <input
                type="range"
                min="0"
                max="60"
                value={element.borderRadius || 0}
                onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) })}
                className="w-16 accent-indigo-600"
              />
            </div>
          </>
        )}

        {/* QR CODE CONTROLS */}
        {isQr && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500">QR URL:</span>
            <input
              type="text"
              value={element.qrText || ''}
              onChange={(e) => onUpdate({ qrText: e.target.value })}
              className="h-7 px-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 w-44 font-mono"
            />
          </div>
        )}
      </div>

      {/* Right zone: Universal element actions (Position, Opacity, Layers, Duplicate, Lock, Delete) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Opacity slider */}
        <div className="flex items-center gap-1.5 border-l border-neutral-200 dark:border-neutral-800 pl-2">
          <span className="text-[11px] text-neutral-500">Opacity:</span>
          <input
            type="range"
            min="10"
            max="100"
            value={Math.round((element.opacity ?? 1) * 100)}
            onChange={(e) => onUpdate({ opacity: parseInt(e.target.value) / 100 })}
            className="w-16 accent-indigo-600"
          />
          <span className="text-[11px] font-mono text-neutral-500 w-7">
            {Math.round((element.opacity ?? 1) * 100)}%
          </span>
        </div>

        {/* Alignment Position Menu */}
        <div className="relative">
          <button
            onClick={() => setShowPositionMenu(!showPositionMenu)}
            title="Align on Canvas"
            className="h-7 px-2 flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <span>Position</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showPositionMenu && (
            <div className="absolute right-0 top-9 w-44 p-1.5 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 space-y-1">
              <span className="text-[10px] uppercase font-mono text-neutral-400 px-2 py-0.5 block">
                Align to Canvas
              </span>
              <button
                onClick={() => {
                  onAlign('left');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-2 py-1 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md"
              >
                Left
              </button>
              <button
                onClick={() => {
                  onAlign('center');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-2 py-1 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md"
              >
                Center (Horizontal)
              </button>
              <button
                onClick={() => {
                  onAlign('right');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-2 py-1 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md"
              >
                Right
              </button>
              <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
              <button
                onClick={() => {
                  onAlign('top');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-2 py-1 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md"
              >
                Top
              </button>
              <button
                onClick={() => {
                  onAlign('middle');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-2 py-1 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md"
              >
                Middle (Vertical)
              </button>
              <button
                onClick={() => {
                  onAlign('bottom');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-2 py-1 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md"
              >
                Bottom
              </button>
            </div>
          )}
        </div>

        {/* Layer order buttons */}
        <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg p-0.5 bg-neutral-50 dark:bg-neutral-800">
          <button
            onClick={() => onReorder('up')}
            title="Bring Forward"
            className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-sm"
          >
            <MoveVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onReorder('front')}
            title="Bring to Front"
            className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-sm"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Duplicate */}
        <button
          onClick={onDuplicate}
          title="Duplicate Element (Ctrl+D)"
          className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Lock */}
        <button
          onClick={() => onUpdate({ locked: !element.locked })}
          title={element.locked ? 'Unlock Element' : 'Lock Element'}
          className={`p-1.5 rounded-lg transition-colors ${
            element.locked
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          {element.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          title="Delete Element (Del/Backspace)"
          className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
