import React, { useState } from 'react';
import { CharacterConfig } from '../../types/story';
import { Scene02Phase, DropletConfig, ClaudyStageInfo } from './types';
import { Sliders, Copy, RotateCcw, Check, ChevronDown, ChevronUp, RefreshCw, PlayCircle, Droplet, Sparkles } from 'lucide-react';

interface Scene02DeveloperPanelProps {
  characters: CharacterConfig[];
  selectedId: string;
  onSelectCharacter: (id: string) => void;
  onChangeField: (id: string, field: 'x' | 'y' | 'height' | 'zIndex', value: number) => void;
  onResetSelected: (id: string) => void;
  onResetAll: () => void;
  onReplayDialogue?: () => void;
  currentPhase?: Scene02Phase;
  onPhaseChange?: (phase: Scene02Phase) => void;
  droplets?: DropletConfig[];
  isPositioningMode?: boolean;
  onTogglePositioningMode?: () => void;
  claudyDebugInfo?: {
    collectedCount: number;
    stageInfo: ClaudyStageInfo;
    scale: number;
  };
}

export const Scene02DeveloperPanel: React.FC<Scene02DeveloperPanelProps> = ({
  characters,
  selectedId,
  onSelectCharacter,
  onChangeField,
  onResetSelected,
  onResetAll,
  onReplayDialogue,
  currentPhase = 'conversation',
  onPhaseChange,
  droplets,
  isPositioningMode = false,
  onTogglePositioningMode,
  claudyDebugInfo,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'characters' | 'droplets'>('characters');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedDroplets, setCopiedDroplets] = useState<boolean>(false);

  const selectedChar = characters.find((c) => c.id === selectedId) || characters[0];

  const formattedSnippet = selectedChar
    ? `{
  id: '${selectedChar.id}',
  x: ${selectedChar.x},
  y: ${selectedChar.y},
  height: ${selectedChar.height ?? 30},
  zIndex: ${selectedChar.zIndex ?? 1}
}`
    : '';

  const dropletsSnippet = droplets
    ? `droplets: [\n` +
      droplets
        .map(
          (d) =>
            `  { id: '${d.id}', x: ${d.x}, y: ${d.y}, size: ${d.size}, zIndex: ${d.zIndex ?? 10} }`
        )
        .join(',\n') +
      `\n]`
    : '';

  const handleCopySnippet = () => {
    if (!formattedSnippet) return;
    navigator.clipboard.writeText(formattedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyDropletsSnippet = () => {
    if (!dropletsSnippet) return;
    navigator.clipboard.writeText(dropletsSnippet).then(() => {
      setCopiedDroplets(true);
      setTimeout(() => setCopiedDroplets(false), 2000);
    });
  };

  return (
    <div className="absolute top-4 left-4 z-40 bg-slate-900/95 text-slate-100 p-3.5 rounded-2xl border border-sky-500/40 shadow-2xl backdrop-blur-md w-80 text-xs font-mono select-none max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2 text-sky-400 font-bold">
          <Sliders className="w-4 h-4" />
          <span className="text-sm tracking-tight">Scene 2 Position Controls</span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-3 space-y-3.5">
          {/* Claudy Stage Debug HUD */}
          {claudyDebugInfo && (
            <div className="bg-slate-950 p-2.5 rounded-xl border border-sky-500/30 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Claudy Stage Info
                </span>
                <span className="text-white bg-sky-900/80 px-2 py-0.5 rounded-full text-[9px] font-bold border border-sky-400/40">
                  {claudyDebugInfo.collectedCount} / 10 Droplets
                </span>
              </div>
              <div className="text-[11px] text-white font-black tracking-tight">
                Stage {claudyDebugInfo.stageInfo.stage}: {claudyDebugInfo.stageInfo.name}
              </div>
              <div className="text-[10px] text-slate-300 flex justify-between items-center pt-0.5">
                <span>Scale: <strong className="text-amber-300 font-bold">{claudyDebugInfo.scale.toFixed(2)}x</strong></span>
                <span className="text-[9px] text-slate-400 font-mono truncate max-w-[130px]" title={claudyDebugInfo.stageInfo.asset}>
                  {claudyDebugInfo.stageInfo.asset.split('/').pop()}
                </span>
              </div>
            </div>
          )}
          {/* Droplet Positioning Mode Toggle */}
          {onTogglePositioningMode && (
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                <Droplet className="w-3.5 h-3.5 text-sky-400" />
                <span>Droplet Repositioning</span>
              </div>
              <button
                onClick={onTogglePositioningMode}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                  isPositioningMode
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isPositioningMode ? 'ON (Draggable)' : 'OFF (Fixed)'}
              </button>
            </div>
          )}

          {/* Phase Selector */}
          {onPhaseChange && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">
                Scene 2 Phase
              </label>
              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['conversation', 'ready', 'droplet-intro', 'interaction'] as Scene02Phase[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => onPhaseChange(p)}
                    className={`py-1 px-1 rounded-lg text-[9px] text-center font-bold capitalize transition cursor-pointer ${
                      currentPhase === p
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {p.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Character Selector */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">
              Select Character
            </label>
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => onSelectCharacter(char.id)}
                  className={`py-1.5 px-1 rounded-lg text-[11px] text-center font-bold transition cursor-pointer ${
                    selectedChar?.id === char.id
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {char.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders and Inputs for Selected Character */}
          {selectedChar && (
            <div className="space-y-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/90">
              <div className="text-sky-300 font-semibold flex justify-between items-center text-[11px]">
                <span>Adjusting: {selectedChar.name}</span>
                <span className="text-[10px] text-slate-400">
                  (id: {selectedChar.id})
                </span>
              </div>

              {/* X Position */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-300">
                  <span>X Position (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={selectedChar.x}
                    onChange={(e) =>
                      onChangeField(
                        selectedChar.id,
                        'x',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-bold text-sky-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={selectedChar.x}
                  onChange={(e) =>
                    onChangeField(selectedChar.id, 'x', parseFloat(e.target.value))
                  }
                  className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Y Position */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-300">
                  <span>Y Position (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={selectedChar.y}
                    onChange={(e) =>
                      onChangeField(
                        selectedChar.id,
                        'y',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-bold text-sky-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={selectedChar.y}
                  onChange={(e) =>
                    onChangeField(selectedChar.id, 'y', parseFloat(e.target.value))
                  }
                  className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Size (Height) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-300">
                  <span>Size (Height %)</span>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    step="0.1"
                    value={selectedChar.height ?? 30}
                    onChange={(e) =>
                      onChangeField(
                        selectedChar.id,
                        'height',
                        parseFloat(e.target.value) || 5
                      )
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-bold text-sky-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="0.1"
                  value={selectedChar.height ?? 30}
                  onChange={(e) =>
                    onChangeField(
                      selectedChar.id,
                      'height',
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* zIndex */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-300">
                  <span>z-Index</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="1"
                    value={selectedChar.zIndex ?? 1}
                    onChange={(e) =>
                      onChangeField(
                        selectedChar.id,
                        'zIndex',
                        parseInt(e.target.value, 10) || 1
                      )
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-bold text-sky-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={selectedChar.zIndex ?? 1}
                  onChange={(e) =>
                    onChangeField(
                      selectedChar.id,
                      'zIndex',
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Reset & Replay Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => selectedChar && onResetSelected(selectedChar.id)}
              className="inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-1.5 px-2 rounded-xl text-[10px] font-bold transition cursor-pointer border border-slate-700"
              title="Reset selected character to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Selected</span>
            </button>
            <button
              onClick={onResetAll}
              className="inline-flex items-center justify-center gap-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white py-1.5 px-2 rounded-xl text-[10px] font-bold transition cursor-pointer border border-rose-800/50"
              title="Reset all Scene 2 characters to defaults"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>

          {onReplayDialogue && (
            <button
              onClick={onReplayDialogue}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-sky-950/80 hover:bg-sky-900/90 text-sky-300 hover:text-white py-1.5 px-2 rounded-xl text-[10px] font-bold transition cursor-pointer border border-sky-800/60"
            >
              <RotateCcw className="w-3 h-3 text-sky-400" />
              <span>Replay Scene 2 Dialogue</span>
            </button>
          )}

          {/* Config Snippet & Copy */}
          <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('characters')}
                  className={`text-[10px] font-bold transition cursor-pointer px-2 py-0.5 rounded ${
                    activeTab === 'characters'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Char Config
                </button>
                {droplets && (
                  <button
                    onClick={() => setActiveTab('droplets')}
                    className={`text-[10px] font-bold transition cursor-pointer px-2 py-0.5 rounded flex items-center gap-1 ${
                      activeTab === 'droplets'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Droplet className="w-3 h-3 text-sky-300" />
                    <span>Droplets ({droplets.length})</span>
                  </button>
                )}
              </div>

              {activeTab === 'characters' ? (
                <button
                  onClick={handleCopySnippet}
                  className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold transition cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              ) : (
                <button
                  onClick={handleCopyDropletsSnippet}
                  className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold transition cursor-pointer"
                >
                  {copiedDroplets ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedDroplets ? 'Copied!' : 'Copy All'}</span>
                </button>
              )}
            </div>

            <pre className="text-[10px] text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800 overflow-x-auto select-all max-h-48">
              {activeTab === 'characters' ? formattedSnippet : dropletsSnippet}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
