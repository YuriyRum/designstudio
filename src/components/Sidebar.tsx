import React, { useState, useRef } from 'react';
import {
  LayoutTemplate,
  Shapes,
  Type,
  Image as ImageIcon,
  QrCode,
  Layers as LayersIcon,
  Sparkles,
  Upload,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
} from 'lucide-react';
import { CanvasElement, ShapeType } from '../types/canvas';
import { TEMPLATES_LIBRARY, TemplateDefinition } from '../data/templates';
import {
  AVAILABLE_FONTS,
  SHAPES_CONFIG,
  STOCK_PHOTOS,
  TEXT_PRESETS,
  STOCK_ICONS,
  COLOR_PALETTES,
} from '../data/stockAssets';

interface SidebarProps {
  onAddElement: (element: Partial<CanvasElement>) => void;
  onApplyTemplate: (template: TemplateDefinition) => void;
  elements: CanvasElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onReorderElement: (id: string, direction: 'up' | 'down') => void;
  onOpenMagicModal: () => void;
  onApplyPalette: (colors: string[]) => void;
}

type TabType = 'templates' | 'elements' | 'text' | 'photos' | 'qrcode' | 'layers' | 'magic';

export const Sidebar: React.FC<SidebarProps> = ({
  onAddElement,
  onApplyTemplate,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onReorderElement,
  onOpenMagicModal,
  onApplyPalette,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [templateSearch, setTemplateSearch] = useState('');
  const [photoSearch, setPhotoSearch] = useState('');
  const [customPhotos, setCustomPhotos] = useState<{ id: string; title: string; src: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // QR Code state
  const [qrInputText, setQrInputText] = useState('https://canvascraft.app');
  const [qrFgColor, setQrFgColor] = useState('#0F172A');
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF');

  // Handle local user image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const newPhoto = {
          id: `custom-${Date.now()}-${i}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          src,
        };
        setCustomPhotos((prev) => [newPhoto, ...prev]);
        // Also auto-add to canvas
        onAddElement({
          type: 'image',
          src,
          name: newPhoto.title,
          width: 400,
          height: 300,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const navItems = [
    { id: 'templates', label: 'Design', icon: LayoutTemplate },
    { id: 'elements', label: 'Shapes', icon: Shapes },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'photos', label: 'Uploads', icon: ImageIcon },
    { id: 'qrcode', label: 'QR Code', icon: QrCode },
    { id: 'layers', label: 'Layers', icon: LayersIcon },
    { id: 'magic', label: 'Magic AI', icon: Sparkles },
  ];

  const sortedLayers = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <aside className="w-84 h-[calc(100vh-3.5rem)] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex shrink-0 z-30 select-none">
      {/* Dock Bar (Far Left Tabs) */}
      <div className="w-18 bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col items-center py-3 gap-1 shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-14 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/60'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Content Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900">
        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Design Templates
              </h3>
              <p className="text-xs text-neutral-500">Click to apply professional layouts</p>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {TEMPLATES_LIBRARY.filter(
                (t) =>
                  !templateSearch ||
                  t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
                  t.category.toLowerCase().includes(templateSearch.toLowerCase())
              ).map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => onApplyTemplate(tpl)}
                  className="group relative rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
                >
                  <div className="aspect-square bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <img
                      src={tpl.thumbnail}
                      alt={tpl.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2.5 bg-white dark:bg-neutral-900 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[160px]">
                        {tpl.title}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {tpl.width} × {tpl.height}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHAPES & ELEMENTS TAB */}
        {activeTab === 'elements' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Shapes & Elements
              </h3>
              <p className="text-xs text-neutral-500">Drag or click to insert vector shapes</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Geometric Shapes Grid */}
              <div>
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                  Basic Geometric Shapes
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {SHAPES_CONFIG.map((s) => (
                    <button
                      key={s.type}
                      onClick={() =>
                        onAddElement({
                          type: 'shape',
                          shapeType: s.type,
                          fillColor: '#4F46E5',
                          width: s.type === 'rectangle' ? 240 : 180,
                          height: s.type === 'arrow' ? 80 : 180,
                          borderRadius: s.type === 'rounded-rect' ? 20 : 0,
                          name: s.label,
                        })
                      }
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:text-indigo-600">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Graphic Stickers / Icons */}
              <div>
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                  Icons & Stickers
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {STOCK_ICONS.map((icon, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        onAddElement({
                          type: 'icon',
                          iconName: icon.name,
                          width: 80,
                          height: 80,
                          color: '#4F46E5',
                          name: icon.name,
                        })
                      }
                      title={`Add ${icon.name}`}
                      className="h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 flex flex-col items-center justify-center transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-500 mb-0.5" />
                      <span className="text-[10px] text-neutral-600 dark:text-neutral-400 truncate max-w-[55px]">
                        {icon.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEXT TAB */}
        {activeTab === 'text' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Text & Typography
              </h3>
              <p className="text-xs text-neutral-500">Click to add formatted headings or text styles</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Quick Text Starters */}
              <div className="space-y-2">
                <button
                  onClick={() =>
                    onAddElement({
                      type: 'text',
                      text: 'Add a heading',
                      fontSize: 48,
                      fontWeight: '700',
                      fontFamily: "'Outfit', sans-serif",
                      width: 500,
                      height: 60,
                      color: '#0F172A',
                    })
                  }
                  className="w-full py-3 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer"
                >
                  <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100 block">
                    Add a heading
                  </span>
                </button>

                <button
                  onClick={() =>
                    onAddElement({
                      type: 'text',
                      text: 'Add a subheading',
                      fontSize: 28,
                      fontWeight: '600',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      width: 450,
                      height: 45,
                      color: '#334155',
                    })
                  }
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer"
                >
                  <span className="text-base font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Add a subheading
                  </span>
                </button>

                <button
                  onClick={() =>
                    onAddElement({
                      type: 'text',
                      text: 'Add a little bit of body text for explanations, details, or descriptions.',
                      fontSize: 18,
                      fontWeight: '400',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      width: 450,
                      height: 60,
                      color: '#64748B',
                    })
                  }
                  className="w-full py-2 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer"
                >
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 block">
                    Add body text
                  </span>
                </button>
              </div>

              {/* Styled Font Presets */}
              <div>
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                  Curated Font Combinations
                </span>
                <div className="space-y-2">
                  {TEXT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() =>
                        onAddElement({
                          type: 'text',
                          text: preset.text,
                          fontFamily: preset.fontFamily,
                          fontSize: preset.fontSize,
                          fontWeight: preset.fontWeight,
                          fontStyle: preset.fontStyle,
                          color: preset.color,
                          backgroundColor: preset.backgroundColor,
                          letterSpacing: preset.letterSpacing,
                          lineHeight: preset.lineHeight,
                          width: 500,
                          height: preset.fontSize * 1.5,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer"
                    >
                      <span className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                        {preset.label}
                      </span>
                      <span
                        className="text-base text-neutral-900 dark:text-neutral-100 block truncate"
                        style={{ fontFamily: preset.fontFamily }}
                      >
                        {preset.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPLOADS & PHOTOS TAB */}
        {activeTab === 'photos' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Images & Uploads
              </h3>
              <p className="text-xs text-neutral-500">Upload your own photos or use curated assets</p>
            </div>

            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors mb-4 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Images from Device</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* User Uploads (if any) */}
              {customPhotos.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                    Your Uploads
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {customPhotos.map((p) => (
                      <div
                        key={p.id}
                        onClick={() =>
                          onAddElement({
                            type: 'image',
                            src: p.src,
                            name: p.title,
                            width: 380,
                            height: 280,
                          })
                        }
                        className="aspect-square rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-indigo-500 transition-colors group"
                      >
                        <img
                          src={p.src}
                          alt={p.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Curated High-Res Stock Photos */}
              <div>
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                  Curated Stock Photos
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {STOCK_PHOTOS.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() =>
                        onAddElement({
                          type: 'image',
                          src: photo.src,
                          name: photo.title,
                          width: 480,
                          height: 360,
                        })
                      }
                      className="group aspect-4/3 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-indigo-500 transition-colors relative"
                    >
                      <img
                        src={photo.src}
                        alt={photo.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="text-[10px] text-white font-medium block truncate">
                          {photo.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR CODE GENERATOR TAB */}
        {activeTab === 'qrcode' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                QR Code Generator
              </h3>
              <p className="text-xs text-neutral-500">Insert scannable QR codes for links, wifi, or text</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Destination URL / Content
                </label>
                <input
                  type="text"
                  value={qrInputText}
                  onChange={(e) => setQrInputText(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Foreground Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrFgColor}
                      onChange={(e) => setQrFgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                      {qrFgColor}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                      {qrBgColor}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!qrInputText.trim()) return;
                  onAddElement({
                    type: 'qrcode',
                    qrText: qrInputText.trim(),
                    fgColor: qrFgColor,
                    bgColor: qrBgColor,
                    width: 160,
                    height: 160,
                    name: 'QR Code',
                  });
                }}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add QR Code to Canvas</span>
              </button>
            </div>
          </div>
        )}

        {/* LAYERS TAB */}
        {activeTab === 'layers' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Canvas Layers
              </h3>
              <p className="text-xs text-neutral-500">
                {elements.length} elements in current page (top to bottom)
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {sortedLayers.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No elements on this page yet.
                </div>
              ) : (
                sortedLayers.map((el) => {
                  const isSelected = el.id === selectedElementId;
                  return (
                    <div
                      key={el.id}
                      onClick={() => onSelectElement(el.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-medium truncate">{el.name || el.type}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          z:{el.zIndex}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Reorder Up/Down */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderElement(el.id, 'up');
                          }}
                          title="Bring Forward"
                          className="p-1 hover:text-indigo-600 text-neutral-400 rounded-sm"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderElement(el.id, 'down');
                          }}
                          title="Send Backward"
                          className="p-1 hover:text-indigo-600 text-neutral-400 rounded-sm"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Visibility */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateElement(el.id, { hidden: !el.hidden });
                          }}
                          title={el.hidden ? 'Show' : 'Hide'}
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-sm"
                        >
                          {el.hidden ? <EyeOff className="w-3.5 h-3.5 text-neutral-400" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        {/* Lock */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateElement(el.id, { locked: !el.locked });
                          }}
                          title={el.locked ? 'Unlock' : 'Lock'}
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-sm"
                        >
                          {el.locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteElement(el.id);
                          }}
                          title="Delete"
                          className="p-1 text-neutral-400 hover:text-red-500 rounded-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* MAGIC AI TAB */}
        {activeTab === 'magic' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Magic Studio Assistant</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Gemini AI powered copywriting and dynamic designer palettes
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={onOpenMagicModal}
                className="w-full p-4 rounded-xl bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-800 text-left hover:border-indigo-400 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    Open AI Magic Studio
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-normal">
                  Generate instant headlines, slogans, marketing bullet points, and harmonious color schemes.
                </p>
              </button>

              {/* Trending Palettes */}
              <div>
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                  Quick Palette Presets
                </span>
                <div className="space-y-2">
                  {COLOR_PALETTES.map((pal, idx) => (
                    <div
                      key={idx}
                      onClick={() => onApplyPalette(pal.colors)}
                      className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                          {pal.name}
                        </span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                          Apply
                        </span>
                      </div>
                      <div className="flex h-5 rounded-md overflow-hidden shadow-inner">
                        {pal.colors.map((c, i) => (
                          <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
