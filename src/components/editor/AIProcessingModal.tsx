import React, { useState, useEffect } from "react";
import { X, Sparkles, Music2, Check, ExternalLink } from "lucide-react";

interface AIProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (options: {
    separateVocals: boolean;
    generateSubtitles: boolean;
  }) => void;
  isProcessing: boolean;
  hasSeparatedAudio: boolean;
}

export const AIProcessingModal: React.FC<AIProcessingModalProps> = ({
  isOpen,
  onClose,
  onRun,
  isProcessing,
  hasSeparatedAudio,
}) => {
  const [separateVocals, setSeparateVocals] = useState(false);
  const [generateSubtitles, setGenerateSubtitles] = useState(true);

  // Reset state when opening (optional, or persist)
  useEffect(() => {
    if (isOpen) {
      // If audio is already separated, maybe default to false or disable the toggle?
      // But user might want to re-run.
      if (hasSeparatedAudio) {
        setSeparateVocals(false);
      }
      setGenerateSubtitles(true);
    }
  }, [isOpen, hasSeparatedAudio]);

  if (!isOpen) return null;

  const handleRun = () => {
    onRun({ separateVocals, generateSubtitles });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300">
      <div className="w-[400px] bg-[#1a1a1a] border border-[#333] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden ring-1 ring-white/10 scale-100 opacity-100">
        {/* Header */}
        <div className="h-14 border-b border-[#2a2a2a] flex items-center justify-between px-5 bg-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400" />
            <h2 className="text-sm font-bold text-gray-200 tracking-tight">
              AI 処理設定
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#333] rounded-full transition-all text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Option 1: Vocal Separation */}
          <div
            className={`p-4 rounded-xl border border-[#333] transition-all cursor-pointer ${separateVocals ? "bg-purple-500/10 border-purple-500/30" : "bg-[#151515] hover:bg-[#1d1d1d]"}`}
            onClick={() => setSeparateVocals(!separateVocals)}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${separateVocals ? "bg-purple-500 border-purple-500 text-white" : "border-[#444] text-transparent"}`}
              >
                <Check size={14} strokeWidth={3} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Music2
                    size={16}
                    className={
                      separateVocals ? "text-purple-400" : "text-gray-400"
                    }
                  />
                  <span
                    className={`text-sm font-medium ${separateVocals ? "text-white" : "text-gray-300"}`}
                  >
                    ボーカル分離
                  </span>
                  {hasSeparatedAudio && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      分離済み
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  BGMを除去し、音声のみを抽出します。字幕の精度が大幅に向上します。
                </p>
              </div>
            </div>
          </div>

          {/* Option 2: Generate Subtitles */}
          <div
            className={`p-4 rounded-xl border border-[#333] transition-all cursor-pointer ${generateSubtitles ? "bg-indigo-500/10 border-indigo-500/30" : "bg-[#151515] hover:bg-[#1d1d1d]"}`}
            onClick={() => setGenerateSubtitles(!generateSubtitles)}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${generateSubtitles ? "bg-indigo-500 border-indigo-500 text-white" : "border-[#444] text-transparent"}`}
              >
                <Check size={14} strokeWidth={3} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-mono text-xs border border-gray-600 rounded px-1 text-gray-400">
                    CC
                  </div>
                  <span
                    className={`text-sm font-medium ${generateSubtitles ? "text-white" : "text-gray-300"}`}
                  >
                    AI字幕生成
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  音声を解析し、自動的に字幕を生成します。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          <button
            onClick={handleRun}
            disabled={!separateVocals && !generateSubtitles}
            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-lg ${
              !separateVocals && !generateSubtitles
                ? "bg-[#222] text-gray-500 cursor-not-allowed shadow-none"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25 active:scale-[0.98]"
            }`}
          >
            <Sparkles size={18} />
            <span>実行して適用する</span>
          </button>
        </div>
      </div>
    </div>
  );
};
