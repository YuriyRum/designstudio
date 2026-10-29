import React, { useState, useEffect, useCallback } from 'react';
import { CanvasElement, CanvasPage, CanvasProject } from './types/canvas';
import { TEMPLATES_LIBRARY, TemplateDefinition } from './data/templates';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { ElementToolbar } from './components/ElementToolbar';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { ResizeCanvasModal } from './components/ResizeCanvasModal';
import { ExportModal } from './components/ExportModal';
import { MagicStudioModal } from './components/MagicStudioModal';
import { fitCanvasToViewport } from './utils/geometry';

export default function App() {
  // Initialize project with the first featured template
  const initialTemplate = TEMPLATES_LIBRARY[0];
  const [project, setProject] = useState<CanvasProject>({
    id: 'proj-1',
    title: 'Alpine Expedition 2026',
    width: initialTemplate.width,
    height: initialTemplate.height,
    unit: 'px',
    currentPageIndex: 0,
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        backgroundColor: initialTemplate.backgroundColor,
        elements: initialTemplate.elements.map((el) => ({ ...el })),
      },
    ],
  });

  // History stacks for Undo / Redo
  const [undoStack, setUndoStack] = useState<CanvasProject[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasProject[]>([]);

  // Selection & Viewport
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.65);
  const [showGrid, setShowGrid] = useState<boolean>(false);

  // Modals
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMagicOpen, setIsMagicOpen] = useState(false);

  const currentPage = project.pages[project.currentPageIndex] || project.pages[0];
  const selectedElement =
    currentPage?.elements.find((el) => el.id === selectedElementId) || null;

  // Push current state to undo history before mutations
  const pushToHistory = useCallback((currentProj: CanvasProject) => {
    setUndoStack((prev) => [...prev.slice(-30), JSON.parse(JSON.stringify(currentProj))]);
    setRedoStack([]);
  }, []);

  // Fit to screen on initial mount
  const handleFitToScreen = useCallback(() => {
    const availW = window.innerWidth - 336; // minus sidebar width (84px * 4 = 336px)
    const availH = window.innerHeight - 56 - 44 - 44; // minus topbar, toolbar, and footer
    const newZoom = fitCanvasToViewport(project.width, project.height, availW, availH, 100);
    setZoom(newZoom);
  }, [project.width, project.height]);

  useEffect(() => {
    handleFitToScreen();
  }, [handleFitToScreen]);

  // Undo / Redo handlers
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(project))]);
    setProject(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(project))]);
    setProject(next);
  };

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Project Title
  const handleUpdateTitle = (newTitle: string) => {
    setProject((p) => ({ ...p, title: newTitle }));
  };

  // Add Element
  const handleAddElement = (elementData: Partial<CanvasElement>) => {
    pushToHistory(project);

    // Compute center position
    const w = elementData.width || 200;
    const h = elementData.height || 100;
    const x = Math.round((project.width - w) / 2);
    const y = Math.round((project.height - h) / 2);

    const maxZ = currentPage.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);

    const newElement: CanvasElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: elementData.type || 'shape',
      name: elementData.name || elementData.type || 'Element',
      x,
      y,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: maxZ + 1,
      ...elementData,
    };

    setProject((prev) => {
      const updatedPages = [...prev.pages];
      const p = { ...updatedPages[prev.currentPageIndex] };
      p.elements = [...p.elements, newElement];
      updatedPages[prev.currentPageIndex] = p;
      return { ...prev, pages: updatedPages };
    });

    setSelectedElementId(newElement.id);
  };

  // Update Element
  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    setProject((prev) => {
      const updatedPages = [...prev.pages];
      const p = { ...updatedPages[prev.currentPageIndex] };
      p.elements = p.elements.map((el) => (el.id === id ? { ...el, ...updates } : el));
      updatedPages[prev.currentPageIndex] = p;
      return { ...prev, pages: updatedPages };
    });
  };

  // Delete Element
  const handleDeleteElement = (id: string) => {
    pushToHistory(project);
    setProject((prev) => {
      const updatedPages = [...prev.pages];
      const p = { ...updatedPages[prev.currentPageIndex] };
      p.elements = p.elements.filter((el) => el.id !== id);
      updatedPages[prev.currentPageIndex] = p;
      return { ...prev, pages: updatedPages };
    });
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  // Duplicate Element
  const handleDuplicateElement = (id: string) => {
    const el = currentPage.elements.find((item) => item.id === id);
    if (!el) return;

    pushToHistory(project);
    const maxZ = currentPage.elements.reduce((max, item) => Math.max(max, item.zIndex), 0);

    const duplicated: CanvasElement = {
      ...JSON.parse(JSON.stringify(el)),
      id: `el-${Date.now()}`,
      name: `${el.name || el.type} (Copy)`,
      x: el.x + 24,
      y: el.y + 24,
      zIndex: maxZ + 1,
    };

    setProject((prev) => {
      const updatedPages = [...prev.pages];
      const p = { ...updatedPages[prev.currentPageIndex] };
      p.elements = [...p.elements, duplicated];
      updatedPages[prev.currentPageIndex] = p;
      return { ...prev, pages: updatedPages };
    });

    setSelectedElementId(duplicated.id);
  };

  // Reorder Layer
  const handleReorderElement = (
    id: string,
    direction: 'up' | 'down' | 'front' | 'back'
  ) => {
    pushToHistory(project);
    setProject((prev) => {
      const updatedPages = [...prev.pages];
      const p = { ...updatedPages[prev.currentPageIndex] };
      const list = [...p.elements].sort((a, b) => a.zIndex - b.zIndex);
      const idx = list.findIndex((el) => el.id === id);
      if (idx === -1) return prev;

      if (direction === 'up' && idx < list.length - 1) {
        const temp = list[idx].zIndex;
        list[idx].zIndex = list[idx + 1].zIndex;
        list[idx + 1].zIndex = temp;
      } else if (direction === 'down' && idx > 0) {
        const temp = list[idx].zIndex;
        list[idx].zIndex = list[idx - 1].zIndex;
        list[idx - 1].zIndex = temp;
      } else if (direction === 'front') {
        const maxZ = list.reduce((m, el) => Math.max(m, el.zIndex), 0);
        list[idx].zIndex = maxZ + 1;
      } else if (direction === 'back') {
        const minZ = list.reduce((m, el) => Math.min(m, el.zIndex), 0);
        list[idx].zIndex = Math.max(1, minZ - 1);
      }

      p.elements = list;
      updatedPages[prev.currentPageIndex] = p;
      return { ...prev, pages: updatedPages };
    });
  };

  // Align Element on Canvas
  const handleAlignElement = (
    type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ) => {
    if (!selectedElement) return;
    pushToHistory(project);

    let newX = selectedElement.x;
    let newY = selectedElement.y;

    if (type === 'left') newX = 0;
    if (type === 'center') newX = Math.round((project.width - selectedElement.width) / 2);
    if (type === 'right') newX = project.width - selectedElement.width;
    if (type === 'top') newY = 0;
    if (type === 'middle') newY = Math.round((project.height - selectedElement.height) / 2);
    if (type === 'bottom') newY = project.height - selectedElement.height;

    handleUpdateElement(selectedElement.id, { x: newX, y: newY });
  };

  // Apply Template
  const handleApplyTemplate = (template: TemplateDefinition) => {
    pushToHistory(project);
    setProject((prev) => {
      const updatedPages = [...prev.pages];
      updatedPages[prev.currentPageIndex] = {
        id: updatedPages[prev.currentPageIndex].id,
        name: template.title,
        backgroundColor: template.backgroundColor,
        elements: template.elements.map((el) => ({ ...el, id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` })),
      };
      return {
        ...prev,
        width: template.width,
        height: template.height,
        title: template.title,
        pages: updatedPages,
      };
    });
    setSelectedElementId(null);
  };

  // Apply Color Palette to Canvas
  const handleApplyPalette = (colors: string[]) => {
    if (colors.length < 2) return;
    pushToHistory(project);

    setProject((prev) => {
      const updatedPages = [...prev.pages];
      const p = { ...updatedPages[prev.currentPageIndex] };

      // Set page background to softest or dominant color
      p.backgroundColor = colors[colors.length - 1];

      // Update elements colors with palette
      p.elements = p.elements.map((el, i) => {
        const c = colors[i % (colors.length - 1)];
        if (el.type === 'shape') {
          return { ...el, fillColor: c };
        }
        if (el.type === 'text') {
          return { ...el, color: colors[0] };
        }
        return el;
      });

      updatedPages[prev.currentPageIndex] = p;
      return { ...prev, pages: updatedPages };
    });
  };

  // Resize Project
  const handleResizeProject = (newWidth: number, newHeight: number) => {
    pushToHistory(project);
    setProject((prev) => ({
      ...prev,
      width: newWidth,
      height: newHeight,
    }));
  };

  // Page Operations
  const handleSelectPage = (index: number) => {
    setProject((p) => ({ ...p, currentPageIndex: index }));
    setSelectedElementId(null);
  };

  const handleAddPage = () => {
    pushToHistory(project);
    const newPage: CanvasPage = {
      id: `page-${Date.now()}`,
      name: `Page ${project.pages.length + 1}`,
      backgroundColor: '#FFFFFF',
      elements: [],
    };
    setProject((p) => ({
      ...p,
      pages: [...p.pages, newPage],
      currentPageIndex: p.pages.length,
    }));
    setSelectedElementId(null);
  };

  const handleDuplicatePage = (index: number) => {
    pushToHistory(project);
    const target = project.pages[index];
    if (!target) return;

    const dupPage: CanvasPage = {
      ...JSON.parse(JSON.stringify(target)),
      id: `page-${Date.now()}`,
      name: `${target.name} (Copy)`,
    };

    setProject((p) => {
      const nextPages = [...p.pages];
      nextPages.splice(index + 1, 0, dupPage);
      return {
        ...p,
        pages: nextPages,
        currentPageIndex: index + 1,
      };
    });
    setSelectedElementId(null);
  };

  const handleDeletePage = (index: number) => {
    if (project.pages.length <= 1) return;
    pushToHistory(project);

    setProject((p) => {
      const nextPages = p.pages.filter((_, i) => i !== index);
      const nextIdx = Math.min(index, nextPages.length - 1);
      return {
        ...p,
        pages: nextPages,
        currentPageIndex: nextIdx,
      };
    });
    setSelectedElementId(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      {/* 1. Universal Top Navigation Bar */}
      <TopBar
        project={project}
        onUpdateTitle={handleUpdateTitle}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitToScreen={handleFitToScreen}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onOpenResizeModal={() => setIsResizeOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenMagicModal={() => setIsMagicOpen(true)}
      />

      {/* 2. Main Studio Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Dock with Design Library & Tools */}
        <Sidebar
          onAddElement={handleAddElement}
          onApplyTemplate={handleApplyTemplate}
          elements={currentPage.elements}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onReorderElement={(id, dir) => handleReorderElement(id, dir)}
          onOpenMagicModal={() => setIsMagicOpen(true)}
          onApplyPalette={handleApplyPalette}
        />

        {/* Center Canvas Area with Contextual Toolbar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Dynamic Element Context Toolbar */}
          <ElementToolbar
            element={selectedElement}
            canvasWidth={project.width}
            canvasHeight={project.height}
            onUpdate={(updates) => selectedElement && handleUpdateElement(selectedElement.id, updates)}
            onDuplicate={() => selectedElement && handleDuplicateElement(selectedElement.id)}
            onDelete={() => selectedElement && handleDeleteElement(selectedElement.id)}
            onReorder={(dir) => selectedElement && handleReorderElement(selectedElement.id, dir)}
            onAlign={handleAlignElement}
          />

          {/* Interactive Infinite Canvas Workspace */}
          <CanvasWorkspace
            project={project}
            currentPage={currentPage}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            onAddElement={handleAddElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onSelectPage={handleSelectPage}
            onAddPage={handleAddPage}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
            zoom={zoom}
            onZoomChange={setZoom}
            onFitToScreen={handleFitToScreen}
            showGrid={showGrid}
          />
        </div>
      </div>

      {/* Modals */}
      <ResizeCanvasModal
        isOpen={isResizeOpen}
        onClose={() => setIsResizeOpen(false)}
        currentWidth={project.width}
        currentHeight={project.height}
        onApplyResize={handleResizeProject}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
      />

      <MagicStudioModal
        isOpen={isMagicOpen}
        onClose={() => setIsMagicOpen(false)}
        onAddTextElement={handleAddElement}
        onApplyPalette={handleApplyPalette}
      />
    </div>
  );
}
