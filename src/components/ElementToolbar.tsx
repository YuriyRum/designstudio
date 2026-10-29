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
  MoveVertical,
  Minus,
  Plus,
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
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'center-both' | 'margin-inset') => void;
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
      <div className="h-12 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between text-xs text-neutral-400 select-none">
        <span>Tap any element on the canvas to customize typography, colors, and print layout</span>
        <span className="text-[11px] font-mono text-neutral-400 hidden sm:inline">Canvas: {canvasWidth} × {canvasHeight} px</span>
      </div>
    );
  }

  const isText = element.type === 'text';
  const isShape = element.type === 'shape';
  const isImage = element.type === 'image';
  const isQr = element.type === 'qrcode';

  return (
    <div className="h-12 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 flex items-center justify-between gap-2 select-none text-xs z-30 shrink-0 relative">
      {/* Left zone: Type-specific controls with 40px touch targets */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none shrink">
        {/* TEXT CONTROLS */}
        {isText && (
          <>
            {/* Font Family Dropdown */}
            <select
              value={element.fontFamily || "'Plus Jakarta Sans', sans-serif"}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="h-9 px-3 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 font-medium cursor-pointer shrink-0"
            >
              {AVAILABLE_FONTS.map((f) => (
                <option key={f.name} value={f.family}>
                  {f.name}
                </option>
              ))}
            </select>

            {/* Font Size (+ / - buttons) */}
            <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 h-9 px-1 shrink-0">
              <button
                onClick={() => onUpdate({ fontSize: Math.max(8, (element.fontSize || 24) - 2) })}
                className="w-8 h-8 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                value={element.fontSize || 24}
                onChange={(e) => onUpdate({ fontSize: Math.max(6, parseInt(e.target.value) || 12) })}
                className="w-10 text-center bg-transparent text-xs font-mono tabular-nums text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
              />
              <button
                onClick={() => onUpdate({ fontSize: Math.min(240, (element.fontSize || 24) + 2) })}
                className="w-8 h-8 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Text Color */}
            <label
              title="Text Color"
              className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center cursor-pointer overflow-hidden p-1 relative shrink-0"
            >
              <input
                type="color"
                value={element.color || '#000000'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-full h-full cursor-pointer opacity-0 absolute inset-0"
              />
              <div
                className="w-full h-full rounded-lg border border-black/10 shadow-xs"
                style={{ backgroundColor: element.color || '#000000' }}
              />
            </label>

            <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5 shrink-0" />

            {/* Formatting */}
            <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl p-0.5 bg-neutral-50 dark:bg-neutral-800 h-9 shrink-0">
              <button
                onClick={() =>
                  onUpdate({
                    fontWeight: element.fontWeight === '700' ? '400' : '700',
                  })
                }
                title="Bold"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  element.fontWeight === '700'
                    ? 'bg-indigo-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  onUpdate({
                    fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                title="Italic"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  element.fontStyle === 'italic'
                    ? 'bg-indigo-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  onUpdate({
                    textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline',
                  })
                }
                title="Underline"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  element.textDecoration === 'underline'
                    ? 'bg-indigo-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Underline className="w-4 h-4" />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl p-0.5 bg-neutral-50 dark:bg-neutral-800 h-9 shrink-0">
              <button
                onClick={() => onUpdate({ textAlign: 'left' })}
                title="Align Left"
                className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer ${
                  element.textAlign === 'left' || !element.textAlign
                    ? 'bg-indigo-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdate({ textAlign: 'center' })}
                title="Align Center"
                className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer ${
                  element.textAlign === 'center' ? 'bg-indigo-600 text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdate({ textAlign: 'right' })}
                title="Align Right"
                className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer ${
                  element.textAlign === 'right' ? 'bg-indigo-600 text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* SHAPE CONTROLS */}
        {isShape && (
          <>
            {/* Fill Color */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-neutral-500 font-medium">Fill:</span>
              <label
                title="Shape Fill Color"
                className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center cursor-pointer overflow-hidden p-1 relative"
              >
                <input
                  type="color"
                  value={element.fillColor || '#4F46E5'}
                  onChange={(e) => onUpdate({ fillColor: e.target.value })}
                  className="w-full h-full cursor-pointer opacity-0 absolute inset-0"
                />
                <div
                  className="w-full h-full rounded-lg border border-black/10"
                  style={{ backgroundColor: element.fillColor || '#4F46E5' }}
                />
              </label>
            </div>

            {/* Stroke Color & Width */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-neutral-500 font-medium">Border:</span>
              <label
                title="Stroke Color"
                className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center cursor-pointer overflow-hidden p-1 relative"
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
                  className="w-full h-full cursor-pointer opacity-0 absolute inset-0"
                />
                <div
                  className="w-full h-full rounded-lg border border-black/10"
                  style={{ backgroundColor: element.strokeColor || '#000000' }}
                />
              </label>

              <input
                type="number"
                min="0"
                max="24"
                value={element.strokeWidth || 0}
                onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) || 0 })}
                className="w-12 h-9 text-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono"
              />
            </div>
          </>
        )}

        {/* IMAGE CONTROLS */}
        {isImage && (
          <>
            <div className="relative shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 px-3 h-9 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  showFilters
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
              </button>

              {showFilters && (
                <div className="absolute left-0 top-11 w-64 p-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 space-y-4">
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
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      Reset
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
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
                      className="w-full h-6 accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
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
                      className="w-full h-6 accent-indigo-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Flip Horiz / Vert */}
            <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl p-0.5 bg-neutral-50 dark:bg-neutral-800 h-9 shrink-0">
              <button
                onClick={() => onUpdate({ flipX: !element.flipX })}
                title="Flip Horizontal"
                className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer ${
                  element.flipX ? 'bg-indigo-600 text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdate({ flipY: !element.flipY })}
                title="Flip Vertical"
                className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer ${
                  element.flipY ? 'bg-indigo-600 text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <FlipVertical className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* QR CODE CONTROLS */}
        {isQr && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-neutral-500 font-medium">QR URL:</span>
            <input
              type="text"
              value={element.qrText || ''}
              onChange={(e) => onUpdate({ qrText: e.target.value })}
              className="h-9 px-3 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 w-48 font-mono"
            />
          </div>
        )}
      </div>

      {/* Right zone: Alignment & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Direct Alignment Icons Bar */}
        <div className="hidden md:flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl p-0.5 bg-neutral-50 dark:bg-neutral-800 h-9">
          <button
            onClick={() => onAlign('left')}
            title="Align Left"
            className="w-7 h-7 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('center')}
            title="Center Horizontally"
            className="w-7 h-7 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign('right')}
            title="Align Right"
            className="w-7 h-7 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
          <button
            onClick={() => onAlign('top')}
            title="Align Top"
            className="w-7 h-7 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 rounded-lg cursor-pointer font-bold text-[10px]"
          >
            T
          </button>
          <button
            onClick={() => onAlign('middle')}
            title="Center Vertically"
            className="w-7 h-7 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 rounded-lg cursor-pointer font-bold text-[10px]"
          >
            M
          </button>
          <button
            onClick={() => onAlign('bottom')}
            title="Align Bottom"
            className="w-7 h-7 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 rounded-lg cursor-pointer font-bold text-[10px]"
          >
            B
          </button>
        </div>

        {/* Full Align Popover Menu */}
        <div className="relative">
          <button
            onClick={() => setShowPositionMenu(!showPositionMenu)}
            className="h-9 px-3 flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer bg-neutral-50/50 dark:bg-neutral-800/50"
          >
            <span>Align</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showPositionMenu && (
            <div className="absolute right-0 top-11 w-52 p-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <span className="text-[10px] uppercase font-mono text-neutral-400 px-2.5 py-1 block font-semibold">
                Align to Canvas
              </span>
              <button
                onClick={() => {
                  onAlign('left');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 dark:hover:bg-neutral-700 hover:text-indigo-600 rounded-xl flex items-center justify-between"
              >
                <span>Left Edge</span>
                <AlignLeft className="w-3.5 h-3.5 text-neutral-400" />
              </button>
              <button
                onClick={() => {
                  onAlign('center');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 dark:hover:bg-neutral-700 hover:text-indigo-600 rounded-xl flex items-center justify-between"
              >
                <span>Horizontal Center</span>
                <AlignCenter className="w-3.5 h-3.5 text-neutral-400" />
              </button>
              <button
                onClick={() => {
                  onAlign('right');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 dark:hover:bg-neutral-700 hover:text-indigo-600 rounded-xl flex items-center justify-between"
              >
                <span>Right Edge</span>
                <AlignRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>
              <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
              <button
                onClick={() => {
                  onAlign('top');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 dark:hover:bg-neutral-700 hover:text-indigo-600 rounded-xl"
              >
                Top Edge
              </button>
              <button
                onClick={() => {
                  onAlign('middle');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 dark:hover:bg-neutral-700 hover:text-indigo-600 rounded-xl"
              >
                Vertical Middle
              </button>
              <button
                onClick={() => {
                  onAlign('bottom');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 dark:hover:bg-neutral-700 hover:text-indigo-600 rounded-xl"
              >
                Bottom Edge
              </button>
              <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
              <button
                onClick={() => {
                  onAlign('center-both');
                  setShowPositionMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-neutral-700 rounded-xl"
              >
                Dead Center (H & V)
              </button>
            </div>
          )}
        </div>

        {/* Opacity slider */}
        <div className="hidden sm:flex items-center gap-1.5 border-l border-neutral-200 dark:border-neutral-800 pl-2">
          <span className="text-[11px] text-neutral-500">Opacity:</span>
          <input
            type="range"
            min="10"
            max="100"
            value={Math.round((element.opacity ?? 1) * 100)}
            onChange={(e) => onUpdate({ opacity: parseInt(e.target.value) / 100 })}
            className="w-14 h-6 accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Duplicate */}
        <button
          onClick={onDuplicate}
          title="Duplicate Element"
          className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Lock */}
        <button
          onClick={() => onUpdate({ locked: !element.locked })}
          title={element.locked ? 'Unlock' : 'Lock'}
          className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
            element.locked
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          {element.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          title="Delete Element"
          className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
