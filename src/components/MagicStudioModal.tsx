import React, { useState } from 'react';
import { X, Sparkles, Wand2, Palette, Type, Plus, Loader2, ArrowRight } from 'lucide-react';
import { CanvasElement } from '../types/canvas';

interface MagicStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTextElement: (element: Partial<CanvasElement>) => void;
  onApplyPalette: (colors: string[]) => void;
}

export const MagicStudioModal: React.FC<MagicStudioModalProps> = ({
  isOpen,
  onClose,
  onAddTextElement,
  onApplyPalette,
}) => {
  const [activeTab, setActiveTab] = useState<'copy' | 'palette'>('copy');

  // Copywriter state
  const [copyPrompt, setCopyPrompt] = useState('');
  const [copyType, setCopyType] = useState('headline');
  const [copyTone, setCopyTone] = useState('bold');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [copyResults, setCopyResults] = useState<{ content: string; variants: string[] } | null>(null);

  // Palette state
  const [paletteTopic, setPaletteTopic] = useState('');
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);
  const [paletteResult, setPaletteResult] = useState<{
    name: string;
    vibe: string;
    colors: string[];
    fonts?: { title: string; body: string };
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerateCopy = async () => {
    if (!copyPrompt.trim()) return;
    setIsGeneratingCopy(true);
    try {
      const res = await fetch('/api/magic/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: copyPrompt,
          type: copyType,
          tone: copyTone,
        }),
      });
      const data = await res.json();
      setCopyResults(data);
    } catch (err) {
      console.error(err);
      // Fallback
      setCopyResults({
        content: `Discover The Future: ${copyPrompt}`,
        variants: [
          `Unleash Your Potential with ${copyPrompt}`,
          `Crafted Exclusively For You`,
          `Join the Movement Today`,
        ],
      });
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleGeneratePalette = async () => {
    if (!paletteTopic.trim()) return;
    setIsGeneratingPalette(true);
    try {
      const res = await fetch('/api/magic/palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: paletteTopic }),
      });
      const data = await res.json();
      setPaletteResult(data);
    } catch (err) {
      console.error(err);
      setPaletteResult({
        name: 'Electric Horizon',
        vibe: 'Modern dynamic sunset energy',
        colors: ['#4F46E5', '#EC4899', '#F59E0B', '#10B981', '#0F172A'],
        fonts: { title: 'Outfit', body: 'Plus Jakarta Sans' },
      });
    } finally {
      setIsGeneratingPalette(false);
    }
  };

  const handleInsertCopy = (text: string) => {
    const isBig = copyType === 'headline';
    onAddTextElement({
      text,
      fontFamily: isBig ? "'Bebas Neue', sans-serif" : "'Outfit', sans-serif",
      fontSize: isBig ? 64 : 28,
      fontWeight: '700',
      color: '#0F172A',
      width: 600,
      height: isBig ? 80 : 50,
      letterSpacing: isBig ? 2 : 1,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-linear-to-r from-indigo-50/40 via-purple-50/30 to-transparent dark:from-indigo-950/20 dark:via-purple-950/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-500 text-white rounded-xl shadow-xs shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                Magic Studio AI
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Powered by Gemini AI for creative graphics copywriting & color design
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

        {/* Tab Strip */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            onClick={() => setActiveTab('copy')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'copy'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Magic Copywriter</span>
          </button>
          <button
            onClick={() => setActiveTab('palette')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'palette'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Magic Palette & Fonts</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'copy' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  What are you creating? (Topic or Concept)
                </label>
                <textarea
                  rows={2}
                  value={copyPrompt}
                  onChange={(e) => setCopyPrompt(e.target.value)}
                  placeholder="e.g. Weekend Flash Sale with 50% discount on summer apparel..."
                  className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    Copy Format
                  </label>
                  <select
                    value={copyType}
                    onChange={(e) => setCopyType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="headline">Catchy Headline</option>
                    <option value="subhead">Supporting Subtitle</option>
                    <option value="cta">Action Button (CTA)</option>
                    <option value="quote">Inspirational Quote</option>
                    <option value="announcement">Event Announcement</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    Tone of Voice
                  </label>
                  <select
                    value={copyTone}
                    onChange={(e) => setCopyTone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="bold">Bold & High Impact</option>
                    <option value="luxury">Luxury & Sophisticated</option>
                    <option value="friendly">Friendly & Warm</option>
                    <option value="playful">Playful & Vibrant</option>
                    <option value="minimalist">Clean & Minimalist</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateCopy}
                disabled={isGeneratingCopy || !copyPrompt.trim()}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-xs shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isGeneratingCopy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing copy...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Copy Options</span>
                  </>
                )}
              </button>

              {/* Copy Results */}
              {copyResults && (
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                      Featured Proposal
                    </span>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      "{copyResults.content}"
                    </p>
                    <button
                      onClick={() => handleInsertCopy(copyResults.content)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Canvas</span>
                    </button>
                  </div>

                  {copyResults.variants?.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block mb-2">
                        Alternative Variations
                      </span>
                      <div className="space-y-2">
                        {copyResults.variants.map((v, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 transition-colors"
                          >
                            <span className="text-xs text-neutral-800 dark:text-neutral-200 font-medium">
                              "{v}"
                            </span>
                            <button
                              onClick={() => handleInsertCopy(v)}
                              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors shrink-0 ml-3"
                              title="Add to Canvas"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'palette' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Describe Theme / Mood
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paletteTopic}
                    onChange={(e) => setPaletteTopic(e.target.value)}
                    placeholder="e.g. Nordic Winter Fog, Cyberpunk Tokyo, Organic Matcha Cafe..."
                    className="flex-1 px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                  />
                  <button
                    onClick={handleGeneratePalette}
                    disabled={isGeneratingPalette || !paletteTopic.trim()}
                    className="py-2 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-xs shadow-indigo-600/20 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    {isGeneratingPalette ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {paletteResult && (
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {paletteResult.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {paletteResult.vibe}
                    </p>
                  </div>

                  {/* Swatches */}
                  <div className="grid grid-cols-5 gap-2">
                    {paletteResult.colors?.map((col, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          className="w-full h-14 rounded-lg shadow-inner border border-black/10"
                          style={{ backgroundColor: col }}
                        />
                        <span className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400 mt-1 uppercase">
                          {col}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      onApplyPalette(paletteResult.colors);
                      onClose();
                    }}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Apply Colors to Canvas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
