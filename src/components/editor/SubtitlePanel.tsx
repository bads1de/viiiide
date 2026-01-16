"use client";

import {
  Film,
  X,
  Wand2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Palette,
  Type,
  PaintBucket,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Edit,
  Layers,
} from "lucide-react";
import { useState } from "react";
import { FontPicker } from "./FontPicker";
import { AnimationType, ANIMATION_PRESETS } from "@/types/animation";
import { SubtitleEditModal } from "./SubtitleEditModal";
import { Subtitle } from "@/types/subtitle";
import { STYLE_PRESETS, getPresetById } from "@/data/stylePresets";

type ProcessingState = {
  status: "idle" | "processing" | "done" | "error";
  message: string;
  progress: number;
};

type SubtitlePanelProps = {
  videoPath: string | null;
  videoFileName: string | null;
  processingState: ProcessingState;
  onRemoveVideo: () => void;
  onGenerateSubtitles: () => void;
  subtitles: Subtitle[];
  onSubtitlesUpdate: (newSubtitles: Subtitle[]) => void;
  subtitleStyle: {
    presetId?: string;
    fontSize: number;
    color: string;
    strokeColor: string;
    fontFamily: string;
    animation: AnimationType;
  };
  onStyleChange: (
    style: Partial<{
      presetId: string;
      fontSize: number;
      color: string;
      strokeColor: string;
      fontFamily: string;
      animation: AnimationType;
    }>
  ) => void;
};

// 折りたたみ可能なセクションコンポーネント
const CollapsibleSection = ({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-[#222] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-200">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
      </button>
      {isOpen && <div className="p-3 border-t border-[#333]">{children}</div>}
    </div>
  );
};

export const SubtitlePanel = ({
  videoPath,
  videoFileName,
  processingState,
  onRemoveVideo,
  onGenerateSubtitles,
  subtitles,
  onSubtitlesUpdate,
  subtitleStyle,
  onStyleChange,
}: SubtitlePanelProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <SubtitleEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        subtitles={subtitles}
        onSave={onSubtitlesUpdate}
      />

      <aside className="w-[320px] bg-[#111] border-r border-[#333] flex flex-col">
        <div className="p-6 border-b border-[#333]">
          <h2 className="text-xl font-bold mb-1 text-white">字幕</h2>
          <p className="text-sm text-gray-400">AIで自動生成または手動追加</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
          {/* 動画が選択されていない場合 */}
          {!videoPath && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#252525] flex items-center justify-center">
                <Film size={28} className="text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm mb-2">動画がありません</p>
              <p className="text-gray-500 text-xs">
                右のエリアに動画をドロップしてください
              </p>
            </div>
          )}

          {/* 動画が選択されている場合 */}
          {videoPath && (
            <>
              {/* 選択中の動画 */}
              <div className="bg-[#1a1a1a] rounded-xl p-3 border border-[#333]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                    <Film size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-200">
                      {videoFileName}
                    </p>
                    <p className="text-xs text-gray-500">アップロード済み</p>
                  </div>
                  <button
                    onClick={onRemoveVideo}
                    className="p-1.5 hover:bg-[#333] rounded-lg transition-colors"
                    aria-label="Remove video"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* 字幕生成 */}
              <div
                className={`bg-[#1a1a1a] rounded-xl p-4 border transition-all duration-300 ${
                  processingState.status === "processing"
                    ? "border-blue-500/50 shadow-lg shadow-blue-500/10"
                    : "border-[#333]"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 size={16} className="text-blue-400" />
                  <h3 className="font-semibold text-sm text-gray-200">
                    AI字幕生成
                  </h3>
                </div>

                {processingState.status === "processing" && (
                  <div className="mb-4">
                    <div className="h-1.5 w-full bg-[#333] rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${processingState.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-300">
                        {processingState.message}
                      </span>
                      <span className="text-xs font-mono text-blue-300">
                        {Math.round(processingState.progress)}%
                      </span>
                    </div>
                  </div>
                )}

                {processingState.status === "done" && (
                  <div className="mb-4 p-2 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-xs flex items-center gap-2">
                    <CheckCircle2 size={14} /> 完了しました
                  </div>
                )}

                {processingState.status === "error" && (
                  <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} /> {processingState.message}
                  </div>
                )}

                <button
                  onClick={onGenerateSubtitles}
                  disabled={processingState.status === "processing"}
                  className={`w-full py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                    processingState.status === "processing"
                      ? "bg-[#333] text-gray-500 cursor-wait"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                  }`}
                >
                  {processingState.status === "processing" ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> 生成中...
                    </>
                  ) : (
                    "字幕を生成する"
                  )}
                </button>
              </div>

              <div className="h-px bg-[#333] my-2" />

              {/* スタイル設定 (アコーディオン) */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Style Settings
                </h3>

                {/* 字幕データ編集 */}
                <div className="mb-2">
                  <CollapsibleSection title="字幕データ" icon={Edit}>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full py-2 bg-[#222] hover:bg-[#333] border border-[#333] rounded text-sm text-gray-300 transition-colors"
                    >
                      字幕内容を編集
                    </button>
                  </CollapsibleSection>
                </div>

                {/* スタイルプリセット */}
                <CollapsibleSection
                  title="スタイルプリセット"
                  icon={Layers}
                  defaultOpen={true}
                >
                  <div className="space-y-2">
                    {STYLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          const fullPreset = getPresetById(preset.id);
                          if (fullPreset) {
                            onStyleChange({
                              presetId: preset.id,
                              fontSize: fullPreset.baseStyle.fontSize,
                              color: fullPreset.baseStyle.color,
                              strokeColor: fullPreset.baseStyle.strokeColor,
                              fontFamily: fullPreset.baseStyle.fontFamily,
                              animation: fullPreset.animation,
                            });
                          }
                        }}
                        className={`w-full p-3 rounded-lg text-left transition-all border ${
                          subtitleStyle.presetId === preset.id
                            ? "bg-blue-600/20 border-blue-500/50"
                            : "bg-[#1a1a1a] border-[#333] hover:border-[#444] hover:bg-[#222]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                subtitleStyle.presetId === preset.id
                                  ? "text-blue-400"
                                  : "text-gray-200"
                              }`}
                            >
                              {preset.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {preset.description}
                            </p>
                          </div>
                          {/* プレビュー */}
                          <div className="flex items-baseline gap-0.5">
                            <span
                              style={{
                                fontFamily: preset.baseStyle.fontFamily,
                                fontSize: "10px",
                                color: preset.baseStyle.color,
                              }}
                            >
                              say
                            </span>
                            <span
                              style={{
                                fontFamily: preset.activeStyle.fontFamily,
                                fontSize: "12px",
                                color: preset.activeStyle.color,
                                fontStyle: preset.activeStyle.italic
                                  ? "italic"
                                  : "normal",
                              }}
                            >
                              that
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* アニメーション設定 */}
                <CollapsibleSection
                  title="アニメーション"
                  icon={Sparkles}
                  defaultOpen={false}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {ANIMATION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => onStyleChange({ animation: preset.id })}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                          subtitleStyle.animation === preset.id
                            ? "bg-blue-600/20 border border-blue-500/50 text-blue-400"
                            : "bg-[#222] border border-transparent hover:bg-[#333] text-gray-300"
                        }`}
                      >
                        <span className="text-lg">{preset.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {preset.name}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* フォント設定 */}
                <CollapsibleSection title="フォント" icon={Type}>
                  <FontPicker
                    selectedFont={subtitleStyle.fontFamily}
                    onSelect={(font) => onStyleChange({ fontFamily: font })}
                    className="h-[240px] border-none bg-transparent p-0"
                  />
                </CollapsibleSection>

                {/* サイズ設定 */}
                <CollapsibleSection title="サイズ" icon={Type}>
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">文字の大きさ</span>
                      <span className="text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {subtitleStyle.fontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={150}
                      step={2}
                      value={subtitleStyle.fontSize}
                      onChange={(e) =>
                        onStyleChange({ fontSize: Number(e.target.value) })
                      }
                      className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </CollapsibleSection>

                {/* カラー設定 */}
                <CollapsibleSection title="カラー" icon={Palette}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-xs text-gray-400 block">
                        文字色
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {[
                          "#ffffff",
                          "#ffff00",
                          "#ff0000",
                          "#00ff00",
                          "#00ffff",
                          "#ff00ff",
                        ].map((c) => (
                          <button
                            key={c}
                            onClick={() => onStyleChange({ color: c })}
                            className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                              subtitleStyle.color === c
                                ? "border-blue-500 scale-110 ring-1 ring-blue-500 ring-offset-1 ring-offset-[#1a1a1a]"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <div className="w-6 h-6 rounded-md overflow-hidden border border-[#444] relative">
                          <input
                            type="color"
                            value={subtitleStyle.color}
                            onChange={(e) =>
                              onStyleChange({ color: e.target.value })
                            }
                            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer p-0 border-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs text-gray-400 block">
                        縁取り
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {[
                          "#000000",
                          "#333333",
                          "#666666",
                          "#ffffff",
                          "#ff0000",
                          "#0000ff",
                        ].map((c) => (
                          <button
                            key={c}
                            onClick={() => onStyleChange({ strokeColor: c })}
                            className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                              subtitleStyle.strokeColor === c
                                ? "border-blue-500 scale-110 ring-1 ring-blue-500 ring-offset-1 ring-offset-[#1a1a1a]"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <div className="w-6 h-6 rounded-md overflow-hidden border border-[#444] relative">
                          <input
                            type="color"
                            value={subtitleStyle.strokeColor}
                            onChange={(e) =>
                              onStyleChange({ strokeColor: e.target.value })
                            }
                            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer p-0 border-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
