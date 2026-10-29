import React, { useState, useRef } from 'react';
import {
  LayoutTemplate,
  Shapes,
  Type,
  Image as ImageIcon,
  QrCode,
  Layers as LayersIcon,
  Palette,
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
  GripVertical,
  X,
  Mail,
  BookOpen,
  FolderUp,
} from 'lucide-react';
import { CanvasElement } from '../types/canvas';
import { TEMPLATES_LIBRARY, TemplateDefinition } from '../data/templates';
import {
  SHAPES_CONFIG,
  STOCK_PHOTOS,
  TEXT_PRESETS,
  STOCK_ICONS,
  COLOR_PALETTES,
} from '../data/stockAssets';

interface SidebarProps {
  onAddElement: (element: Partial<CanvasElement>, dropX?: number, dropY?: number) => void;
  onApplyTemplate: (template: TemplateDefinition) => void;
  elements: CanvasElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onReorderElement: (id: string, direction: 'up' | 'down') => void;
  onApplyPalette: (colors: string[]) => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
  onImportFile?: (file: File) => void;
}

type TabType = 'templates' | 'postcards' | 'elements' | 'text' | 'photos' | 'qrcode' | 'layers' | 'palettes';

export const Sidebar: React.FC<SidebarProps> = ({
  onAddElement,
  onApplyTemplate,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onReorderElement,
  onApplyPalette,
  isOpenOnMobile = false,
  onCloseMobile,
  onImportFile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [templateSearch, setTemplateSearch] = useState('');
  const [customPhotos, setCustomPhotos] = useState<{ id: string; title: string; src: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // QR Code state
  const [qrInputText, setQrInputText] = useState('https://canvascraft.app');
  const [qrFgColor, setQrFgColor] = useState('#0F172A');
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF');

  // Set drag data for HTML5 Drag and Drop onto canvas
  const handleDragStart = (e: React.DragEvent, elementData: Partial<CanvasElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify(elementData));
    e.dataTransfer.effectAllowed = 'copy';
  };

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
    { id: 'postcards', label: 'Print/Cards', icon: Mail },
    { id: 'elements', label: 'Shapes', icon: Shapes },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'photos', label: 'Uploads', icon: ImageIcon },
    { id: 'qrcode', label: 'QR Code', icon: QrCode },
    { id: 'layers', label: 'Layers', icon: LayersIcon },
    { id: 'palettes', label: 'Styles', icon: Palette },
  ];

  const sortedLayers = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static top-14 bottom-0 left-0 w-84 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex shrink-0 z-40 select-none transition-transform duration-200 ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
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
          {/* Mobile Close Button Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 lg:hidden">
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
              {activeTab}
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Design Templates
                </h3>
                <p className="text-xs text-neutral-500">Tap to load full professional layouts</p>
              </div>

              {/* Open Existing Design Project Card */}
              {onImportFile && (
                <div className="mb-3">
                  <input
                    type="file"
                    ref={projectInputRef}
                    accept=".json,.canvascraft"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onImportFile) {
                        onImportFile(file);
                        if (onCloseMobile) onCloseMobile();
                      }
                      if (e.target) e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => projectInputRef.current?.click()}
                    className="w-full p-3 rounded-xl border border-dashed border-indigo-400 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 flex items-center justify-between transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                        <FolderUp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                          Upload & Open Project
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono block">
                          .json / .canvascraft design files
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              )}

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
                    onClick={() => {
                      onApplyTemplate(tpl);
                      if (onCloseMobile) onCloseMobile();
                    }}
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
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        Apply
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRINT & POSTCARDS TAB */}
          {activeTab === 'postcards' && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span>Postcards & Brochures</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Tap or drag</span> print building blocks
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Postcard Elements */}
                <div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                    Postcard Address & Postal Blocks
                  </span>
                  <div className="space-y-2">
                    {[
                      {
                        data: {
                          type: 'shape' as const,
                          shapeType: 'rectangle' as const,
                          width: 180,
                          height: 220,
                          fillColor: '#F8FAFC',
                          strokeColor: '#94A3B8',
                          strokeWidth: 2,
                          name: 'Stamp Box Placeholder',
                        },
                        label: 'Stamp Box ("PLACE STAMP HERE")',
                        sub: 'Postal Stamp Frame',
                      },
                      {
                        data: {
                          type: 'text' as const,
                          text: 'RECIPIENT ADDRESS:\n\n_______________________________\n\n_______________________________\n\n_______________________________',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 20,
                          fontWeight: '600',
                          color: '#475569',
                          width: 520,
                          height: 220,
                          name: 'Recipient Address Lines',
                        },
                        label: 'Address Lines & Recipient Block',
                        sub: 'To / Address Divider Lines',
                      },
                      {
                        data: {
                          type: 'shape' as const,
                          shapeType: 'rectangle' as const,
                          width: 4,
                          height: 600,
                          fillColor: '#CBD5E1',
                          name: 'Postcard Vertical Divider',
                        },
                        label: 'Center Vertical Divider',
                        sub: 'Separates Message from Address',
                      },
                      {
                        data: {
                          type: 'text' as const,
                          text: 'SENDER:\nYour Brand Name / Studio\n100 Main Street, Suite 200\nSeattle, WA 98101',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 14,
                          fontWeight: '500',
                          color: '#64748B',
                          width: 380,
                          height: 90,
                          name: 'Return Address Tag',
                        },
                        label: 'Return Address Block',
                        sub: 'Sender Details Tag',
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.data)}
                        onClick={() => {
                          onAddElement(item.data);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className="w-full p-3 min-h-[48px] rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer flex items-center justify-between active:scale-98"
                      >
                        <div>
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block truncate">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            {item.sub}
                          </span>
                        </div>
                        <GripVertical className="w-4 h-4 text-neutral-400 shrink-0 opacity-50" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brochure Panel Elements */}
                <div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                    Brochure Layout & Offer Blocks
                  </span>
                  <div className="space-y-2">
                    {[
                      {
                        data: {
                          type: 'shape' as const,
                          shapeType: 'rounded-rect' as const,
                          width: 480,
                          height: 160,
                          fillColor: '#FEF3C7',
                          strokeColor: '#D97706',
                          strokeWidth: 2,
                          borderRadius: 16,
                          name: 'Coupon Snippet Box',
                        },
                        label: 'Coupon / Tear-off Offer Box',
                        sub: 'Promotional Offer Card',
                      },
                      {
                        data: {
                          type: 'text' as const,
                          text: 'CONTACT & LOCATION\n📍 450 Grand Avenue, Suite 100\n📞 +1 (800) 555-0199\n🌐 www.yourcompany.com',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 18,
                          fontWeight: '600',
                          color: '#0F172A',
                          width: 420,
                          height: 120,
                          name: 'Contact Info Footer',
                        },
                        label: 'Contact & Hours Block',
                        sub: 'Brochure Footer Info',
                      },
                      {
                        data: {
                          type: 'shape' as const,
                          shapeType: 'rectangle' as const,
                          width: 320,
                          height: 700,
                          fillColor: '#F8FAFC',
                          strokeColor: '#E2E8F0',
                          strokeWidth: 2,
                          name: 'Panel Container Box',
                        },
                        label: '3-Panel Column Container',
                        sub: 'Tri-Fold Panel Background',
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.data)}
                        onClick={() => {
                          onAddElement(item.data);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className="w-full p-3 min-h-[48px] rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer flex items-center justify-between active:scale-98"
                      >
                        <div>
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block truncate">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            {item.sub}
                          </span>
                        </div>
                        <GripVertical className="w-4 h-4 text-neutral-400 shrink-0 opacity-50" />
                      </button>
                    ))}
                  </div>
                </div>
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
                <p className="text-xs text-neutral-500">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Tap or drag</span> to insert vector shapes
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* Geometric Shapes Grid */}
                <div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                    Basic Geometric Shapes
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {SHAPES_CONFIG.map((s) => {
                      const itemData: Partial<CanvasElement> = {
                        type: 'shape',
                        shapeType: s.type,
                        fillColor: '#4F46E5',
                        width: s.type === 'rectangle' ? 240 : 180,
                        height: s.type === 'arrow' ? 80 : 180,
                        borderRadius: s.type === 'rounded-rect' ? 20 : 0,
                        name: s.label,
                      };
                      return (
                        <button
                          key={s.type}
                          draggable
                          onDragStart={(e) => handleDragStart(e, itemData)}
                          onClick={() => {
                            onAddElement(itemData);
                            if (onCloseMobile) onCloseMobile();
                          }}
                          className="flex items-center gap-2 p-3 min-h-[44px] rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-left transition-all group cursor-pointer active:scale-95"
                        >
                          <GripVertical className="w-4 h-4 text-neutral-400 shrink-0 opacity-40 group-hover:opacity-100" />
                          <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Graphic Icons */}
                <div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                    Icons & Graphics
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {STOCK_ICONS.map((icon, idx) => {
                      const iconData: Partial<CanvasElement> = {
                        type: 'icon',
                        iconName: icon.name,
                        width: 100,
                        height: 100,
                        color: '#4F46E5',
                        name: icon.name,
                      };
                      return (
                        <button
                          key={idx}
                          draggable
                          onDragStart={(e) => handleDragStart(e, iconData)}
                          onClick={() => {
                            onAddElement(iconData);
                            if (onCloseMobile) onCloseMobile();
                          }}
                          className="h-14 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95"
                        >
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5">
                            {icon.name}
                          </span>
                          <span className="text-[9px] text-neutral-400 uppercase font-mono">
                            Icon
                          </span>
                        </button>
                      );
                    })}
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
                <p className="text-xs text-neutral-500">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Tap or drag text</span> to insert onto canvas
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Quick Text Starters */}
                <div className="space-y-2">
                  {[
                    {
                      type: 'text' as const,
                      text: 'Add a heading',
                      fontSize: 48,
                      fontWeight: '700',
                      fontFamily: "'Outfit', sans-serif",
                      width: 500,
                      height: 60,
                      color: '#0F172A',
                      label: 'Heading',
                    },
                    {
                      type: 'text' as const,
                      text: 'Add a subheading',
                      fontSize: 28,
                      fontWeight: '600',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      width: 450,
                      height: 45,
                      color: '#334155',
                      label: 'Subheading',
                    },
                    {
                      type: 'text' as const,
                      text: 'Add body paragraph text to describe details, features, or offers.',
                      fontSize: 18,
                      fontWeight: '400',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      width: 450,
                      height: 60,
                      color: '#64748B',
                      label: 'Body text',
                    },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onClick={() => {
                        onAddElement(item);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className="w-full p-3 min-h-[48px] rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer flex items-center justify-between active:scale-98"
                    >
                      <span
                        className="block truncate max-w-[200px]"
                        style={{
                          fontFamily: item.fontFamily,
                          fontSize: `${Math.min(item.fontSize, 22)}px`,
                          fontWeight: item.fontWeight,
                        }}
                      >
                        {item.text}
                      </span>
                      <GripVertical className="w-4 h-4 text-neutral-400 shrink-0 opacity-50" />
                    </button>
                  ))}
                </div>

                {/* Styled Font Presets */}
                <div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                    Curated Font Combinations
                  </span>
                  <div className="space-y-2">
                    {TEXT_PRESETS.map((preset) => {
                      const presetData: Partial<CanvasElement> = {
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
                      };
                      return (
                        <button
                          key={preset.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, presetData)}
                          onClick={() => {
                            onAddElement(presetData);
                            if (onCloseMobile) onCloseMobile();
                          }}
                          className="w-full p-3 min-h-[48px] rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer active:scale-98"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-neutral-400 uppercase font-mono block">
                              {preset.label}
                            </span>
                            <GripVertical className="w-3.5 h-3.5 text-neutral-400 opacity-50" />
                          </div>
                          <span
                            className="text-base text-neutral-900 dark:text-neutral-100 block truncate"
                            style={{ fontFamily: preset.fontFamily }}
                          >
                            {preset.text}
                          </span>
                        </button>
                      );
                    })}
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
                <p className="text-xs text-neutral-500">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Tap or drag photos</span> onto canvas
                </p>
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
                className="w-full py-3 px-3 min-h-[44px] rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors mb-4 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Images from Device</span>
              </button>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* User Uploads */}
                {customPhotos.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                      Your Uploads
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {customPhotos.map((p) => {
                        const imgData: Partial<CanvasElement> = {
                          type: 'image',
                          src: p.src,
                          name: p.title,
                          width: 380,
                          height: 280,
                        };
                        return (
                          <div
                            key={p.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, imgData)}
                            onClick={() => {
                              onAddElement(imgData);
                              if (onCloseMobile) onCloseMobile();
                            }}
                            className="aspect-square rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-indigo-500 transition-colors group relative"
                          >
                            <img
                              src={p.src}
                              alt={p.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stock Photos */}
                <div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                    Curated Stock Photos
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {STOCK_PHOTOS.map((photo) => {
                      const photoData: Partial<CanvasElement> = {
                        type: 'image',
                        src: photo.src,
                        name: photo.title,
                        width: 480,
                        height: 360,
                      };
                      return (
                        <div
                          key={photo.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, photoData)}
                          onClick={() => {
                            onAddElement(photoData);
                            if (onCloseMobile) onCloseMobile();
                          }}
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
                      );
                    })}
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
                <p className="text-xs text-neutral-500">Insert scannable QR codes</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Destination URL / Text
                  </label>
                  <input
                    type="text"
                    value={qrInputText}
                    onChange={(e) => setQrInputText(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-neutral-900 dark:text-neutral-100 min-h-[40px]"
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
                        className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0"
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
                        className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        {qrBgColor}
                      </span>
                    </div>
                  </div>
                </div>

                {(() => {
                  const qrData: Partial<CanvasElement> = {
                    type: 'qrcode',
                    qrText: qrInputText.trim() || 'https://canvascraft.app',
                    fgColor: qrFgColor,
                    bgColor: qrBgColor,
                    width: 160,
                    height: 160,
                    name: 'QR Code',
                  };
                  return (
                    <button
                      draggable
                      onDragStart={(e) => handleDragStart(e, qrData)}
                      onClick={() => {
                        onAddElement(qrData);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className="w-full py-3 px-4 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add QR Code</span>
                    </button>
                  );
                })()}
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
                  {elements.length} elements on current page
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
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
                        className={`flex items-center justify-between p-2.5 min-h-[44px] rounded-xl border text-xs transition-all cursor-pointer ${
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReorderElement(el.id, 'up');
                            }}
                            title="Bring Forward"
                            className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center hover:text-indigo-600 text-neutral-400 rounded-md"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReorderElement(el.id, 'down');
                            }}
                            title="Send Backward"
                            className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center hover:text-indigo-600 text-neutral-400 rounded-md"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateElement(el.id, { hidden: !el.hidden });
                            }}
                            title={el.hidden ? 'Show' : 'Hide'}
                            className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
                          >
                            {el.hidden ? <EyeOff className="w-4 h-4 text-neutral-400" /> : <Eye className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateElement(el.id, { locked: !el.locked });
                            }}
                            title={el.locked ? 'Unlock' : 'Lock'}
                            className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
                          >
                            {el.locked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteElement(el.id);
                            }}
                            title="Delete"
                            className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-neutral-400 hover:text-red-500 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STYLES & PALETTES TAB */}
          {activeTab === 'palettes' && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  <span>Designer Color Palettes</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Instantly apply brand themes to your canvas
                </p>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {COLOR_PALETTES.map((pal, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onApplyPalette(pal.colors);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {pal.name}
                      </span>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        Apply Theme
                      </span>
                    </div>
                    <div className="flex h-7 rounded-xl overflow-hidden shadow-inner">
                      {pal.colors.map((c, i) => (
                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
