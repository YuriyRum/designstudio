import React, { useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, Sparkles, Check, Loader2 } from 'lucide-react';
import { CanvasProject } from '../types/canvas';
import { exportPageAsImage, exportProjectAsPdf, exportProjectJson } from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CanvasProject;
}

type ExportFormat = 'png' | 'jpeg' | 'pdf' | 'json';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<number>(2); // 2x default for crisp HD
  const [quality, setQuality] = useState<number>(92);
  const [pageSelection, setPageSelection] = useState<'current' | 'all'>('current');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPage = project.pages[project.currentPageIndex] || project.pages[0];

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);

      if (format === 'png' || format === 'jpeg') {
        if (pageSelection === 'all' && project.pages.length > 1) {
          // Export each page sequentially
          for (let i = 0; i < project.pages.length; i++) {
            const p = project.pages[i];
            await exportPageAsImage(
              p,
              project.width,
              project.height,
              format,
              scale,
              quality / 100,
              `${project.title.toLowerCase().replace(/\s+/g, '-')}-page-${i + 1}.${format}`
            );
          }
        } else {
          await exportPageAsImage(
            currentPage,
            project.width,
            project.height,
            format,
            scale,
            quality / 100,
            `${project.title.toLowerCase().replace(/\s+/g, '-')}.${format}`
          );
        }
      } else if (format === 'pdf') {
        await exportProjectAsPdf(
          project,
          pageSelection === 'all' ? 'all' : project.currentPageIndex,
          `${project.title.toLowerCase().replace(/\s+/g, '-')}.pdf`
        );
      } else if (format === 'json') {
        exportProjectJson(project);
      }

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please check the browser console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Export & Download
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Download your design as high-res images, print-ready PDF, or project JSON
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
        <div className="p-6 space-y-6">
          {/* Format Selection Tabs */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
              File Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'png', label: 'PNG Image', ext: 'Best for Web / Social', icon: ImageIcon },
                { id: 'jpeg', label: 'JPEG Image', ext: 'Compact size', icon: ImageIcon },
                { id: 'pdf', label: 'PDF Document', ext: 'Print / Multi-page', icon: FileText },
                { id: 'json', label: 'Project JSON', ext: 'Save editable backup', icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = format === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setFormat(item.id as ExportFormat)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/60'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-500'}`} />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block mt-0.5 leading-tight">
                      {item.ext}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format-Specific Options */}
          {(format === 'png' || format === 'jpeg') && (
            <div className="space-y-4 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
              {/* Resolution Scale */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Resolution Scale
                  </span>
                  <span className="text-xs font-mono text-neutral-500">
                    {project.width * scale} × {project.height * scale} px ({scale}x)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 1, label: '1x (Standard)' },
                    { value: 2, label: '2x (HD Crisp)' },
                    { value: 3, label: '3x (Print Ultra)' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setScale(s.value)}
                      className={`py-1.5 px-3 text-xs rounded-lg font-medium transition-colors ${
                        scale === s.value
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality slider for JPEG */}
              {format === 'jpeg' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      JPEG Quality
                    </span>
                    <span className="text-xs font-mono text-neutral-500">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}
            </div>
          )}

          {/* Page Scope Selection */}
          {project.pages.length > 1 && (
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                Pages to Export
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPageSelection('current')}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl border text-center transition-colors ${
                    pageSelection === 'current'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Current Page ({project.currentPageIndex + 1})
                </button>
                <button
                  onClick={() => setPageSelection('all')}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl border text-center transition-colors ${
                    pageSelection === 'all'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  All Pages ({project.pages.length} pages {format === 'pdf' ? 'in 1 PDF' : 'batch'})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {format === 'pdf'
              ? 'Multi-page vector & image document'
              : `${project.width * scale} × ${project.height * scale} px · ${format.toUpperCase()}`}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-xs shadow-indigo-600/20 transition-colors"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rendering...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {format.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
