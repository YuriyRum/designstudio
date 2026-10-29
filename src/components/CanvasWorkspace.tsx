import React, { useRef, useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { CanvasElement, CanvasPage, CanvasProject, GuideLine, ShapeType } from '../types/canvas';
import { calculateSnapping, HandleType } from '../utils/geometry';

interface CanvasWorkspaceProps {
  project: CanvasProject;
  currentPage: CanvasPage;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onAddElement: (element: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitToScreen: () => void;
  showGrid: boolean;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  project,
  currentPage,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  zoom,
  onZoomChange,
  onFitToScreen,
  showGrid,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Active Drag / Resize / Rotate Interaction State
  const [interaction, setInteraction] = useState<{
    type: 'move' | 'resize' | 'rotate';
    handle?: HandleType;
    startX: number;
    startY: number;
    elemStartX: number;
    elemStartY: number;
    elemStartW: number;
    elemStartH: number;
    elemStartRot: number;
    aspectRatio: number;
  } | null>(null);

  const [activeGuides, setActiveGuides] = useState<GuideLine[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});

  const selectedElement = currentPage.elements.find((el) => el.id === selectedElementId) || null;

  // Generate QR code data URLs for preview
  useEffect(() => {
    currentPage.elements.forEach(async (el) => {
      if (el.type === 'qrcode' && el.qrText) {
        try {
          const url = await QRCode.toDataURL(el.qrText, {
            color: { dark: el.fgColor || '#000000', light: el.bgColor || '#FFFFFF' },
            margin: 1,
            width: 300,
          });
          setQrCodeUrls((prev) => ({ ...prev, [el.id]: url }));
        } catch (e) {
          console.warn('QR preview error:', e);
        }
      }
    });
  }, [currentPage.elements]);

  // Spacebar tracking for canvas pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !editingTextId && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        setIsSpacePressed(true);
      }
      // Delete shortcut
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && !editingTextId && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        onDeleteElement(selectedElementId);
      }
      // Duplicate shortcut Ctrl+D / Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElementId && !editingTextId) {
        e.preventDefault();
        onDuplicateElement(selectedElementId);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElementId, editingTextId, onDeleteElement, onDuplicateElement]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      onZoomChange(Math.max(0.15, Math.min(3.0, zoom + delta)));
    } else {
      // Regular scroll pans the viewport
      setPan((p) => ({ x: p.x - e.deltaX * 0.8, y: p.y - e.deltaY * 0.8 }));
    }
  };

  // Start panning
  const handleMouseDownViewport = (e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) {
      // Middle click or Space+click
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (e.target === containerRef.current || (e.target as HTMLElement).id === 'canvas-board-bg') {
      onSelectElement(null);
      setEditingTextId(null);
    }
  };

  // Start moving element
  const handleMouseDownElement = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    if (isSpacePressed) return;
    if (el.locked) {
      onSelectElement(el.id);
      return;
    }

    onSelectElement(el.id);
    setInteraction({
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
      elemStartX: el.x,
      elemStartY: el.y,
      elemStartW: el.width,
      elemStartH: el.height,
      elemStartRot: el.rotation || 0,
      aspectRatio: el.width / (el.height || 1),
    });
  };

  // Start resizing handle
  const handleMouseDownHandle = (e: React.MouseEvent, handle: HandleType) => {
    e.stopPropagation();
    if (!selectedElement || selectedElement.locked) return;

    if (handle === 'rotate') {
      setInteraction({
        type: 'rotate',
        handle: 'rotate',
        startX: e.clientX,
        startY: e.clientY,
        elemStartX: selectedElement.x,
        elemStartY: selectedElement.y,
        elemStartW: selectedElement.width,
        elemStartH: selectedElement.height,
        elemStartRot: selectedElement.rotation || 0,
        aspectRatio: selectedElement.width / (selectedElement.height || 1),
      });
    } else {
      setInteraction({
        type: 'resize',
        handle,
        startX: e.clientX,
        startY: e.clientY,
        elemStartX: selectedElement.x,
        elemStartY: selectedElement.y,
        elemStartW: selectedElement.width,
        elemStartH: selectedElement.height,
        elemStartRot: selectedElement.rotation || 0,
        aspectRatio: selectedElement.width / (selectedElement.height || 1),
      });
    }
  };

  // Mouse Move listener during drag / resize / rotate
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        });
        return;
      }

      if (!interaction || !selectedElement) return;

      const dx = (e.clientX - interaction.startX) / zoom;
      const dy = (e.clientY - interaction.startY) / zoom;

      if (interaction.type === 'move') {
        let newX = Math.round(interaction.elemStartX + dx);
        let newY = Math.round(interaction.elemStartY + dy);

        // Snap calculation
        const snap = calculateSnapping(
          { ...selectedElement, x: newX, y: newY },
          currentPage.elements,
          project.width,
          project.height
        );

        setActiveGuides(snap.guides);
        onUpdateElement(selectedElement.id, { x: snap.x, y: snap.y });
      } else if (interaction.type === 'resize' && interaction.handle) {
        let newW = interaction.elemStartW;
        let newH = interaction.elemStartH;
        let newX = interaction.elemStartX;
        let newY = interaction.elemStartY;

        const h = interaction.handle;

        // East / West
        if (h.includes('e')) {
          newW = Math.max(20, interaction.elemStartW + dx);
        } else if (h.includes('w')) {
          const maxDx = interaction.elemStartW - 20;
          const clampedDx = Math.min(dx, maxDx);
          newW = interaction.elemStartW - clampedDx;
          newX = interaction.elemStartX + clampedDx;
        }

        // North / South
        if (h.includes('s')) {
          newH = Math.max(20, interaction.elemStartH + dy);
        } else if (h.includes('n')) {
          const maxDy = interaction.elemStartH - 20;
          const clampedDy = Math.min(dy, maxDy);
          newH = interaction.elemStartH - clampedDy;
          newY = interaction.elemStartY + clampedDy;
        }

        // Corner proportional lock for images or icons
        if (selectedElement.type === 'image' || selectedElement.type === 'icon' || selectedElement.type === 'qrcode') {
          if (h === 'se' || h === 'nw' || h === 'ne' || h === 'sw') {
            const ratio = interaction.aspectRatio;
            newH = Math.round(newW / ratio);
          }
        }

        onUpdateElement(selectedElement.id, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      } else if (interaction.type === 'rotate') {
        // Calculate center of element in screen coords
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Element center relative to viewport
        const elemCenterX = (project.width / 2 + pan.x) * zoom;
        const elemCenterY = (project.height / 2 + pan.y) * zoom;

        const rad = Math.atan2(e.clientY - elemCenterY, e.clientX - elemCenterX);
        let deg = Math.round((rad * 180) / Math.PI) - 90;
        if (deg < 0) deg += 360;

        // Snapping angle to 0, 45, 90, 180, 270
        const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        for (const snapDeg of snapAngles) {
          if (Math.abs(deg - snapDeg) <= 3) {
            deg = snapDeg % 360;
            break;
          }
        }

        onUpdateElement(selectedElement.id, { rotation: deg });
      }
    },
    [isPanning, startPan, interaction, selectedElement, zoom, pan, project.width, project.height, currentPage.elements, onUpdateElement]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setInteraction(null);
    setActiveGuides([]);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Render SVG Path for shapes
  const renderShapeSvg = (el: CanvasElement) => {
    const w = el.width;
    const h = el.height;
    const r = el.borderRadius || 0;
    const fill = el.fillColor || '#4F46E5';
    const stroke = el.strokeColor || 'none';
    const strokeW = el.strokeWidth || 0;

    switch (el.shapeType) {
      case 'rectangle':
      case 'rounded-rect':
        return (
          <rect
            x={strokeW / 2}
            y={strokeW / 2}
            width={w - strokeW}
            height={h - strokeW}
            rx={r}
            ry={r}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        );
      case 'circle':
        return (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={(w - strokeW) / 2}
            ry={(h - strokeW) / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        );
      case 'triangle':
        return (
          <polygon
            points={`${w / 2},${strokeW} ${w - strokeW},${h - strokeW} ${strokeW},${h - strokeW}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        );
      case 'diamond':
        return (
          <polygon
            points={`${w / 2},${strokeW} ${w - strokeW},${h / 2} ${w / 2},${h - strokeW} ${strokeW},${h / 2}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        );
      case 'star': {
        const spikes = 5;
        const outerR = Math.min(w, h) / 2 - strokeW;
        const innerR = outerR * 0.42;
        const cx = w / 2;
        const cy = h / 2;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        const pointsArr: string[] = [];
        for (let i = 0; i < spikes; i++) {
          pointsArr.push(`${cx + Math.cos(rot) * outerR},${cy + Math.sin(rot) * outerR}`);
          rot += step;
          pointsArr.push(`${cx + Math.cos(rot) * innerR},${cy + Math.sin(rot) * innerR}`);
          rot += step;
        }
        return (
          <polygon
            points={pointsArr.join(' ')}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        );
      }
      case 'heart':
        return (
          <path
            d={`M ${w / 2} ${h / 4} Q ${w / 2} 0 ${w / 4} 0 Q 0 0 0 ${h / 3} Q 0 ${(h * 2) / 3} ${w / 2} ${h} Q ${w} ${(h * 2) / 3} ${w} ${h / 3} Q ${w} 0 ${(w * 3) / 4} 0 Q ${w / 2} 0 ${w / 2} ${h / 4} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        );
      case 'arrow': {
        const headW = w * 0.35;
        const shaftH = h * 0.35;
        const shaftY = (h - shaftH) / 2;
        return (
          <polygon
            points={`0,${shaftY} ${w - headW},${shaftY} ${w - headW},0 ${w},${h / 2} ${w - headW},${h} ${w - headW},${shaftY + shaftH} 0,${shaftY + shaftH}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        );
      }
      case 'badge': {
        const points = 12;
        const outer = Math.min(w, h) / 2 - strokeW;
        const inner = outer * 0.82;
        const cx = w / 2;
        const cy = h / 2;
        const step = Math.PI / points;
        let rot = 0;
        const pointsArr: string[] = [];
        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? outer : inner;
          pointsArr.push(`${cx + Math.cos(rot) * radius},${cy + Math.sin(rot) * radius}`);
          rot += step;
        }
        return (
          <polygon
            points={pointsArr.join(' ')}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        );
      }
      default:
        return (
          <rect
            x={0}
            y={0}
            width={w}
            height={h}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
          />
        );
    }
  };

  const sortedElements = [...currentPage.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem-2.75rem)] bg-neutral-200/80 dark:bg-neutral-950 relative overflow-hidden select-none">
      {/* Central Interactive Infinite Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownViewport}
        className={`flex-1 relative overflow-hidden flex items-center justify-center ${
          isSpacePressed ? 'cursor-grab' : isPanning ? 'cursor-grabbing' : 'cursor-default'
        } ${showGrid ? 'canvas-grid-pattern' : ''}`}
      >
        {/* Transform Container with Pan and Zoom */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            width: project.width,
            height: project.height,
          }}
          className="relative shrink-0 transition-transform duration-75"
        >
          {/* Main Canvas Page Surface */}
          <div
            id="canvas-board-bg"
            style={{
              width: project.width,
              height: project.height,
              backgroundColor: currentPage.backgroundColor || '#FFFFFF',
              backgroundImage: currentPage.backgroundImage ? `url(${currentPage.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className="absolute inset-0 shadow-2xl rounded-xs overflow-hidden select-none"
          >
            {/* Render Canvas Elements */}
            {sortedElements.map((el) => {
              if (el.hidden) return null;
              const isSelected = el.id === selectedElementId;
              const isEditing = el.id === editingTextId;

              // Image filter string
              const filterStyle = el.filters
                ? `brightness(${el.filters.brightness}%) contrast(${el.filters.contrast}%) saturate(${el.filters.saturation}%) grayscale(${el.filters.grayscale}%) blur(${el.filters.blur}px) sepia(${el.filters.sepia}%)`
                : undefined;

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDownElement(e, el)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (el.type === 'text') setEditingTextId(el.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    transform: `rotate(${el.rotation || 0}deg)`,
                    transformOrigin: 'center center',
                    opacity: el.opacity ?? 1,
                    zIndex: el.zIndex,
                  }}
                  className={`group select-none ${
                    el.locked ? 'cursor-not-allowed' : 'cursor-move'
                  }`}
                >
                  {/* Element Content Rendering */}
                  {el.type === 'shape' && (
                    <svg
                      width="100%"
                      height="100%"
                      className="overflow-visible pointer-events-none drop-shadow-xs"
                    >
                      {renderShapeSvg(el)}
                    </svg>
                  )}

                  {el.type === 'text' && (
                    <div className="w-full h-full relative">
                      {isEditing ? (
                        <textarea
                          autoFocus
                          value={el.text || ''}
                          onChange={(e) => onUpdateElement(el.id, { text: e.target.value })}
                          onBlur={() => setEditingTextId(null)}
                          style={{
                            fontFamily: el.fontFamily,
                            fontSize: `${el.fontSize}px`,
                            fontWeight: el.fontWeight,
                            fontStyle: el.fontStyle,
                            color: el.color,
                            textAlign: el.textAlign || 'left',
                            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                            lineHeight: el.lineHeight || 1.3,
                            backgroundColor: el.backgroundColor || 'transparent',
                          }}
                          className="w-full h-full p-0 m-0 border border-indigo-500 rounded-xs bg-white/90 text-neutral-900 focus:outline-hidden resize-none overflow-hidden"
                        />
                      ) : (
                        <div
                          style={{
                            fontFamily: el.fontFamily,
                            fontSize: `${el.fontSize}px`,
                            fontWeight: el.fontWeight,
                            fontStyle: el.fontStyle,
                            color: el.color,
                            textAlign: el.textAlign || 'left',
                            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                            lineHeight: el.lineHeight || 1.3,
                            textDecoration: el.textDecoration,
                            textTransform: el.textTransform,
                            backgroundColor: el.backgroundColor,
                            WebkitTextStroke:
                              el.strokeColor && el.strokeWidth
                                ? `${el.strokeWidth}px ${el.strokeColor}`
                                : undefined,
                          }}
                          className="w-full h-full whitespace-pre-wrap select-none break-words"
                        >
                          {el.text}
                        </div>
                      )}
                    </div>
                  )}

                  {el.type === 'image' && el.src && (
                    <div
                      style={{
                        borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                        transform: `scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})`,
                      }}
                      className="w-full h-full overflow-hidden"
                    >
                      <img
                        src={el.src}
                        alt={el.alt || 'Canvas image'}
                        referrerPolicy="no-referrer"
                        style={{ filter: filterStyle }}
                        className="w-full h-full object-cover pointer-events-none select-none"
                      />
                    </div>
                  )}

                  {el.type === 'qrcode' && (
                    <div className="w-full h-full bg-white p-2 rounded-xs shadow-xs">
                      {qrCodeUrls[el.id] ? (
                        <img
                          src={qrCodeUrls[el.id]}
                          alt="QR Code"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs font-mono">
                          QR
                        </div>
                      )}
                    </div>
                  )}

                  {el.type === 'icon' && (
                    <div
                      style={{ color: el.color || '#4F46E5' }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <Sparkles className="w-full h-full" />
                    </div>
                  )}

                  {/* Bounding Box & 8 Handles for Selected Element */}
                  {isSelected && (
                    <div className="absolute -inset-1 border-2 border-indigo-600 pointer-events-none select-none">
                      {/* Live dimension & position tooltip while interacting */}
                      {interaction && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-white text-[10px] font-mono py-0.5 px-2 rounded-md whitespace-nowrap shadow-md">
                          {interaction.type === 'rotate'
                            ? `${el.rotation || 0}°`
                            : `${Math.round(el.width)} × ${Math.round(el.height)} px`}
                        </div>
                      )}

                      {/* Rotation Knob at Top */}
                      {!el.locked && (
                        <div
                          onMouseDown={(e) => handleMouseDownHandle(e, 'rotate')}
                          title="Rotate (Drag)"
                          className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border border-indigo-600 rounded-full flex items-center justify-center cursor-grab pointer-events-auto shadow-sm hover:scale-110 transition-transform"
                        >
                          <RotateCw className="w-3 h-3 text-indigo-600" />
                        </div>
                      )}

                      {/* 8 Resize Handles */}
                      {!el.locked && (
                        <>
                          <div
                            onMouseDown={(e) => handleMouseDownHandle(e, 'nw')}
                            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize pointer-events-auto"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDownHandle(e, 'n')}
                            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-indigo-600 rounded-xs cursor-ns-resize pointer-events-auto"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDownHandle(e, 'ne')}
                            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize pointer-events-auto"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDownHandle(e, 'e')}
                            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-4 bg-white border border-indigo-600 rounded-xs cursor-ew-resize pointer-events-auto"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDownHandle(e, 'se')}
                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize pointer-events-auto"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDownHandle(e, 's')}
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-indigo-600 rounded-xs cursor-ns-resize pointer-events-auto"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDownHandle(e, 'sw')}
                            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize pointer-events-auto"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDownHandle(e, 'w')}
                            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-4 bg-white border border-indigo-600 rounded-xs cursor-ew-resize pointer-events-auto"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Smart Snapping Alignment Guidelines */}
            {activeGuides.map((guide, idx) => {
              if (guide.type === 'vertical') {
                return (
                  <div
                    key={idx}
                    style={{ left: `${guide.position}px` }}
                    className="absolute top-0 bottom-0 w-px bg-pink-500 z-50 pointer-events-none"
                  />
                );
              } else {
                return (
                  <div
                    key={idx}
                    style={{ top: `${guide.position}px` }}
                    className="absolute left-0 right-0 h-px bg-pink-500 z-50 pointer-events-none"
                  />
                );
              }
            })}
          </div>
        </div>
      </div>

      {/* Bottom Multi-Page Strip & Canvas Controls */}
      <footer className="h-11 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between z-30 shrink-0 text-xs select-none">
        {/* Left: Multi-page navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
            <button
              onClick={() => onSelectPage(Math.max(0, project.currentPageIndex - 1))}
              disabled={project.currentPageIndex === 0}
              title="Previous Page"
              className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 disabled:opacity-30 rounded-md"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Page {project.currentPageIndex + 1} of {project.pages.length}
            </span>
            <button
              onClick={() =>
                onSelectPage(Math.min(project.pages.length - 1, project.currentPageIndex + 1))
              }
              disabled={project.currentPageIndex === project.pages.length - 1}
              title="Next Page"
              className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 disabled:opacity-30 rounded-md"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onAddPage}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-800"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add Page</span>
          </button>

          <button
            onClick={() => onDuplicatePage(project.currentPageIndex)}
            title="Duplicate Current Page"
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {project.pages.length > 1 && (
            <button
              onClick={() => onDeletePage(project.currentPageIndex)}
              title="Delete Page"
              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center: Hint for spacebar pan */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-neutral-400">
          <span>Hold</span>
          <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-[10px] font-mono text-neutral-600 dark:text-neutral-400">
            Space
          </kbd>
          <span>to pan · Scroll with</span>
          <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-[10px] font-mono text-neutral-600 dark:text-neutral-400">
            Ctrl
          </kbd>
          <span>to zoom</span>
        </div>

        {/* Right: Zoom slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="20"
            max="250"
            value={Math.round(zoom * 100)}
            onChange={(e) => onZoomChange(parseInt(e.target.value) / 100)}
            className="w-24 accent-indigo-600"
          />
          <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 min-w-[36px] text-right">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onFitToScreen}
            title="Fit to Screen"
            className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
