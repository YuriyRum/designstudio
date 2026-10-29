import React, { useRef, useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize,
  RotateCw,
  Sparkles,
  Plus,
  Lock,
  Unlock,
  MoveVertical,
  SlidersHorizontal,
} from 'lucide-react';
import { CanvasElement, CanvasPage, CanvasProject, GuideLine } from '../types/canvas';
import { calculateSnapping, HandleType } from '../utils/geometry';

interface CanvasWorkspaceProps {
  project: CanvasProject;
  currentPage: CanvasPage;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onAddElement: (element: Partial<CanvasElement>, dropX?: number, dropY?: number) => void;
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
  showPrintGuides?: boolean;
  onToggleSidebar?: () => void;
  isSidebarOpenOnMobile?: boolean;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  project,
  currentPage,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onAddElement,
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
  showPrintGuides = false,
  onToggleSidebar,
  isSidebarOpenOnMobile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Multi-touch pinch tracking
  const [touchPinchDist, setTouchPinchDist] = useState<number | null>(null);

  // Active Pointer Interaction State
  const [interaction, setInteraction] = useState<{
    type: 'move' | 'resize' | 'rotate';
    elementId: string;
    handle?: HandleType;
    pointerId: number;
    targetElem: HTMLElement;
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

  // Spacebar & Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !editingTextId &&
        (e.target as HTMLElement).tagName !== 'INPUT' &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        setIsSpacePressed(true);
      }
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedElementId &&
        !editingTextId &&
        (e.target as HTMLElement).tagName !== 'INPUT' &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        onDeleteElement(selectedElementId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedElementId && !editingTextId) {
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

  // Mouse wheel zoom or pan
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      onZoomChange(Math.max(0.15, Math.min(3.0, zoom + delta)));
    } else {
      setPan((p) => ({ x: p.x - e.deltaX * 0.8, y: p.y - e.deltaY * 0.8 }));
    }
  };

  // Two-Finger Pinch-to-Zoom for touch screens
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchPinchDist(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchPinchDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - touchPinchDist) * 0.005;
      onZoomChange(Math.max(0.15, Math.min(3.0, zoom + delta)));
      setTouchPinchDist(dist);
    }
  };

  const handleTouchEnd = () => {
    setTouchPinchDist(null);
  };

  // Pointer down on canvas background
  const handlePointerDownViewport = (e: React.PointerEvent) => {
    if (isSpacePressed || e.button === 1 || e.pointerType === 'touch') {
      if (
        e.target === containerRef.current ||
        (e.target as HTMLElement).id === 'canvas-board-bg'
      ) {
        setIsPanning(true);
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        if (e.target === containerRef.current || (e.target as HTMLElement).id === 'canvas-board-bg') {
          onSelectElement(null);
          setEditingTextId(null);
        }
      }
    } else if (
      e.target === containerRef.current ||
      (e.target as HTMLElement).id === 'canvas-board-bg'
    ) {
      onSelectElement(null);
      setEditingTextId(null);
    }
  };

  // Pointer down on element to start dragging
  const handlePointerDownElement = (e: React.PointerEvent, el: CanvasElement) => {
    if (e.button !== 0 || isSpacePressed) return;
    e.stopPropagation();

    onSelectElement(el.id);

    if (el.locked) return;

    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Touch capture fallback
    }

    setInteraction({
      type: 'move',
      elementId: el.id,
      pointerId: e.pointerId,
      targetElem: target,
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

  // Pointer down on handles (resize or rotate)
  const handlePointerDownHandle = (e: React.PointerEvent, handle: HandleType) => {
    if (e.button !== 0 || !selectedElement || selectedElement.locked) return;
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Touch capture fallback
    }

    setInteraction({
      type: handle === 'rotate' ? 'rotate' : 'resize',
      elementId: selectedElement.id,
      handle,
      pointerId: e.pointerId,
      targetElem: target,
      startX: e.clientX,
      startY: e.clientY,
      elemStartX: selectedElement.x,
      elemStartY: selectedElement.y,
      elemStartW: selectedElement.width,
      elemStartH: selectedElement.height,
      elemStartRot: selectedElement.rotation || 0,
      aspectRatio: selectedElement.width / (selectedElement.height || 1),
    });
  };

  // Pointer Move listener during interaction
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        });
        return;
      }

      if (!interaction) return;

      const targetEl = currentPage.elements.find((item) => item.id === interaction.elementId);
      if (!targetEl) return;

      const dx = (e.clientX - interaction.startX) / zoom;
      const dy = (e.clientY - interaction.startY) / zoom;

      if (interaction.type === 'move') {
        let newX = Math.round(interaction.elemStartX + dx);
        let newY = Math.round(interaction.elemStartY + dy);

        // Snap calculation
        const snap = calculateSnapping(
          { ...targetEl, x: newX, y: newY },
          currentPage.elements,
          project.width,
          project.height
        );

        setActiveGuides(snap.guides);
        onUpdateElement(targetEl.id, { x: snap.x, y: snap.y });
      } else if (interaction.type === 'resize' && interaction.handle) {
        let newW = interaction.elemStartW;
        let newH = interaction.elemStartH;
        let newX = interaction.elemStartX;
        let newY = interaction.elemStartY;

        const h = interaction.handle;

        if (h.includes('e')) {
          newW = Math.max(20, interaction.elemStartW + dx);
        } else if (h.includes('w')) {
          const maxDx = interaction.elemStartW - 20;
          const clampedDx = Math.min(dx, maxDx);
          newW = interaction.elemStartW - clampedDx;
          newX = interaction.elemStartX + clampedDx;
        }

        if (h.includes('s')) {
          newH = Math.max(20, interaction.elemStartH + dy);
        } else if (h.includes('n')) {
          const maxDy = interaction.elemStartH - 20;
          const clampedDy = Math.min(dy, maxDy);
          newH = interaction.elemStartH - clampedDy;
          newY = interaction.elemStartY + clampedDy;
        }

        if (targetEl.type === 'image' || targetEl.type === 'icon' || targetEl.type === 'qrcode') {
          if (h === 'se' || h === 'nw' || h === 'ne' || h === 'sw') {
            const ratio = interaction.aspectRatio;
            newH = Math.round(newW / ratio);
          }
        }

        onUpdateElement(targetEl.id, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      } else if (interaction.type === 'rotate') {
        const board = boardRef.current;
        if (!board) return;
        const rect = board.getBoundingClientRect();

        const elemCenterX = rect.left + (interaction.elemStartX + interaction.elemStartW / 2) * zoom;
        const elemCenterY = rect.top + (interaction.elemStartY + interaction.elemStartH / 2) * zoom;

        const rad = Math.atan2(e.clientY - elemCenterY, e.clientX - elemCenterX);
        let deg = Math.round((rad * 180) / Math.PI) - 90;
        if (deg < 0) deg += 360;

        const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        for (const snapDeg of snapAngles) {
          if (Math.abs(deg - snapDeg) <= 3) {
            deg = snapDeg % 360;
            break;
          }
        }

        onUpdateElement(targetEl.id, { rotation: deg });
      }
    },
    [isPanning, startPan, interaction, currentPage.elements, zoom, project.width, project.height, onUpdateElement]
  );

  const handlePointerUp = useCallback(() => {
    if (interaction?.targetElem) {
      try {
        if (interaction.targetElem.hasPointerCapture(interaction.pointerId)) {
          interaction.targetElem.releasePointerCapture(interaction.pointerId);
        }
      } catch {
        // Fallback
      }
    }
    setIsPanning(false);
    setInteraction(null);
    setActiveGuides([]);
  }, [interaction]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // HTML5 Drag & Drop
  const handleDragOverCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDropCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const elementData = JSON.parse(rawData) as Partial<CanvasElement>;
      const board = boardRef.current;
      if (!board) return;

      const rect = board.getBoundingClientRect();
      const dropX = Math.round((e.clientX - rect.left) / zoom);
      const dropY = Math.round((e.clientY - rect.top) / zoom);

      const w = elementData.width || 200;
      const h = elementData.height || 100;

      onAddElement(
        elementData,
        Math.max(0, dropX - Math.round(w / 2)),
        Math.max(0, dropY - Math.round(h / 2))
      );
    } catch (err) {
      console.error('Sidebar drop error:', err);
    }
  };

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
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem-2.75rem)] bg-neutral-200/80 dark:bg-neutral-950 relative overflow-hidden select-none touch-none">
      {/* Central Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDownViewport}
        className={`flex-1 relative overflow-hidden flex items-center justify-center touch-none ${
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
          className="relative shrink-0 transition-transform duration-75 touch-none"
        >
          {/* Main Canvas Page Surface */}
          <div
            ref={boardRef}
            id="canvas-board-bg"
            onDragOver={handleDragOverCanvas}
            onDrop={handleDropCanvas}
            style={{
              width: project.width,
              height: project.height,
              backgroundColor: currentPage.backgroundColor || '#FFFFFF',
              backgroundImage: currentPage.backgroundImage ? `url(${currentPage.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className="absolute inset-0 shadow-2xl rounded-xs overflow-hidden select-none touch-none"
          >
            {/* Render Canvas Elements */}
            {sortedElements.map((el) => {
              if (el.hidden) return null;
              const isSelected = el.id === selectedElementId;
              const isEditing = el.id === editingTextId;

              const filterStyle = el.filters
                ? `brightness(${el.filters.brightness}%) contrast(${el.filters.contrast}%) saturate(${el.filters.saturation}%) grayscale(${el.filters.grayscale}%) blur(${el.filters.blur}px) sepia(${el.filters.sepia}%)`
                : undefined;

              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDownElement(e, el)}
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
                    touchAction: 'none',
                  }}
                  className={`group select-none touch-none ${
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
                      className="w-full h-full flex items-center justify-center font-bold text-lg"
                    >
                      <Sparkles className="w-full h-full" />
                    </div>
                  )}

                  {/* Touch-optimized Bounding Box & Handles */}
                  {isSelected && (
                    <div className="absolute -inset-1.5 border-2 border-indigo-600 pointer-events-none select-none touch-none">
                      {/* Floating Quick Touch Toolbar */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-neutral-900/95 text-white p-1 rounded-xl shadow-xl flex items-center gap-1 z-50 pointer-events-auto border border-neutral-700/80 backdrop-blur-md">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateElement(el.id);
                          }}
                          title="Duplicate"
                          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-200"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateElement(el.id, { rotation: ((el.rotation || 0) + 90) % 360 });
                          }}
                          title="Rotate 90°"
                          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-200"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateElement(el.id, { locked: !el.locked });
                          }}
                          title={el.locked ? 'Unlock' : 'Lock'}
                          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-200"
                        >
                          {el.locked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteElement(el.id);
                          }}
                          title="Delete"
                          className="p-1.5 hover:bg-red-600/80 rounded-lg text-neutral-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Large Touch Rotation Knob */}
                      {!el.locked && (
                        <div
                          onPointerDown={(e) => handlePointerDownHandle(e, 'rotate')}
                          title="Rotate"
                          className="absolute -top-22 left-1/2 -translate-x-1/2 w-9 h-9 min-w-[36px] min-h-[36px] bg-white border-2 border-indigo-600 rounded-full flex items-center justify-center cursor-grab pointer-events-auto shadow-md hover:scale-110 transition-transform active:scale-95"
                        >
                          <RotateCw className="w-4 h-4 text-indigo-600" />
                        </div>
                      )}

                      {/* 8 Touch-friendly 32px hit area Resize Handles */}
                      {!el.locked && (
                        <>
                          {/* NW */}
                          <div
                            onPointerDown={(e) => handlePointerDownHandle(e, 'nw')}
                            className="absolute -top-4 -left-4 w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-nwse-resize pointer-events-auto"
                          >
                            <div className="w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow-xs" />
                          </div>
                          {/* N */}
                          <div
                            onPointerDown={(e) => handlePointerDownHandle(e, 'n')}
                            className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-ns-resize pointer-events-auto"
                          >
                            <div className="w-5 h-2 bg-white border border-indigo-600 rounded-xs shadow-xs" />
                          </div>
                          {/* NE */}
                          <div
                            onPointerDown={(e) => handlePointerDownHandle(e, 'ne')}
                            className="absolute -top-4 -right-4 w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-nesw-resize pointer-events-auto"
                          >
                            <div className="w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow-xs" />
                          </div>
                          {/* E */}
                          <div
                            onPointerDown={(e) => handlePointerDownHandle(e, 'e')}
                            className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-ew-resize pointer-events-auto"
                          >
                            <div className="w-2 h-5 bg-white border border-indigo-600 rounded-xs shadow-xs" />
                          </div>
                          {/* SE */}
                          <div
                            onPointerDown={(e) => handlePointerDownHandle(e, 'se')}
                            className="absolute -bottom-4 -right-4 w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-nwse-resize pointer-events-auto"
                          >
                            <div className="w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow-xs" />
                          </div>
                          {/* S */}
                          <div
                            onPointerDown={(e) => handlePointerDownHandle(e, 's')}
                            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-ns-resize pointer-events-auto"
                          >
                            <div className="w-5 h-2 bg-white border border-indigo-600 rounded-xs shadow-xs" />
                          </div>
                          {/* SW */}
                          <div
                            onPointerDown={(e) => handlePointerDownHandle(e, 'sw')}
                            className="absolute -bottom-4 -left-4 w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-nesw-resize pointer-events-auto"
                          >
                            <div className="w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow-xs" />
                          </div>
                          {/* W */}
                          <div
                            onPointerDown={(e) => handlePointerDownHandle(e, 'w')}
                            className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-ew-resize pointer-events-auto"
                          >
                            <div className="w-2 h-5 bg-white border border-indigo-600 rounded-xs shadow-xs" />
                          </div>
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

            {/* Print & Fold Guide Overlays for Brochures and Postcards */}
            {showPrintGuides && (
              <div className="absolute inset-0 pointer-events-none z-40">
                {/* Print Bleed Border (12px outer inset) */}
                <div
                  style={{ top: '12px', bottom: '12px', left: '12px', right: '12px' }}
                  className="absolute border border-dashed border-red-500/70"
                >
                  <span className="absolute top-1 left-2 text-[9px] font-mono text-red-500 font-bold bg-white/80 dark:bg-black/80 px-1 rounded-xs">
                    TRIM / BLEED LINE
                  </span>
                </div>

                {/* Print Safety Zone Border (28px inner inset) */}
                <div
                  style={{ top: '28px', bottom: '28px', left: '28px', right: '28px' }}
                  className="absolute border border-dashed border-cyan-500/70"
                >
                  <span className="absolute bottom-1 right-2 text-[9px] font-mono text-cyan-600 font-bold bg-white/80 dark:bg-black/80 px-1 rounded-xs">
                    SAFE PRINT MARGIN
                  </span>
                </div>

                {/* Tri-Fold Brochure Fold Lines (3 panels) */}
                {project.width >= 2000 && project.width > project.height && (
                  <>
                    <div
                      style={{ left: `${Math.round(project.width / 3)}px` }}
                      className="absolute top-0 bottom-0 border-r-2 border-dashed border-indigo-500/80"
                    >
                      <span className="absolute top-2 -translate-x-1/2 text-[10px] font-bold font-mono text-indigo-600 bg-white/90 dark:bg-neutral-900/90 px-2 py-0.5 rounded-md shadow-xs">
                        FOLD 1 (LEFT FLAP)
                      </span>
                    </div>
                    <div
                      style={{ left: `${Math.round((2 * project.width) / 3)}px` }}
                      className="absolute top-0 bottom-0 border-r-2 border-dashed border-indigo-500/80"
                    >
                      <span className="absolute top-2 -translate-x-1/2 text-[10px] font-bold font-mono text-indigo-600 bg-white/90 dark:bg-neutral-900/90 px-2 py-0.5 rounded-md shadow-xs">
                        FOLD 2 (RIGHT COVER)
                      </span>
                    </div>
                  </>
                )}

                {/* Bi-Fold Brochure Fold Line (50% Center) */}
                {project.width < 2000 && project.width > project.height * 1.1 && (
                  <div
                    style={{ left: `${Math.round(project.width / 2)}px` }}
                    className="absolute top-0 bottom-0 border-r-2 border-dashed border-indigo-500/80"
                  >
                    <span className="absolute top-2 -translate-x-1/2 text-[10px] font-bold font-mono text-indigo-600 bg-white/90 dark:bg-neutral-900/90 px-2 py-0.5 rounded-md shadow-xs">
                      CENTER FOLD
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Multi-Page Strip & Canvas Controls */}
      <footer className="h-12 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between z-30 shrink-0 text-xs select-none">
        {/* Mobile Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{isSidebarOpenOnMobile ? 'Close Library' : 'Design Tools'}</span>
          </button>
        )}

        {/* Multi-page navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-xl">
            <button
              onClick={() => onSelectPage(Math.max(0, project.currentPageIndex - 1))}
              disabled={project.currentPageIndex === 0}
              title="Previous Page"
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 disabled:opacity-30 rounded-lg cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              {project.currentPageIndex + 1} / {project.pages.length}
            </span>
            <button
              onClick={() =>
                onSelectPage(Math.min(project.pages.length - 1, project.currentPageIndex + 1))
              }
              disabled={project.currentPageIndex === project.pages.length - 1}
              title="Next Page"
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 disabled:opacity-30 rounded-lg cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onAddPage}
            className="flex items-center gap-1 px-3 py-1.5 min-h-[36px] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-800 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Add Page</span>
          </button>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="20"
            max="250"
            value={Math.round(zoom * 100)}
            onChange={(e) => onZoomChange(parseInt(e.target.value) / 100)}
            className="w-20 sm:w-28 h-6 accent-indigo-600 cursor-pointer"
          />
          <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 min-w-[36px] text-right">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onFitToScreen}
            title="Fit to Screen"
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
