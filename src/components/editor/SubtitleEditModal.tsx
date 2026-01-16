import React, { useState, useEffect } from "react";
import { Subtitle } from "@/types/subtitle";
import { X, Save, Clock, Trash2, Plus } from "lucide-react";

interface SubtitleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: Subtitle[];
  onSave: (newSubtitles: Subtitle[]) => void;
}

export const SubtitleEditModal: React.FC<SubtitleEditModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  onSave,
}) => {
  const [editingSubtitles, setEditingSubtitles] = useState<Subtitle[]>([]);

  useEffect(() => {
    if (isOpen && subtitles) {
      setEditingSubtitles(JSON.parse(JSON.stringify(subtitles)));
    }
  }, [isOpen, subtitles]);

  const handleTextChange = (index: number, newText: string) => {
    const newSubs = [...editingSubtitles];
    newSubs[index].text = newText;
    setEditingSubtitles(newSubs);
  };

  const handleTimeChange = (
    index: number,
    field: "startInMs" | "endInMs",
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      const newSubs = [...editingSubtitles];
      newSubs[index][field] = numValue;
      setEditingSubtitles(newSubs);
    }
  };

  const handleDelete = (index: number) => {
    const newSubs = editingSubtitles.filter((_, i) => i !== index);
    setEditingSubtitles(newSubs);
  };

  const handleSave = () => {
    onSave(editingSubtitles);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="w-[800px] h-[85vh] bg-[#1a1a1a] border border-[#333] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        {/* Header */}
        <div className="h-16 border-b border-[#2a2a2a] flex items-center justify-between px-6 bg-[#1f1f1f] bg-opacity-90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Clock size={16} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              字幕エディタ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333] rounded-full transition-all text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#111]">
          {editingSubtitles.length > 0 ? (
            editingSubtitles.map((sub, index) => (
              <div
                key={index}
                className="group flex gap-4 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:border-blue-500/30 hover:bg-[#1f1f1f] transition-all relative"
              >
                {/* ID Badge */}
                <div className="pt-2">
                  <span className="flex items-center justify-center w-6 h-6 text-xs font-mono font-medium text-gray-500 bg-[#252525] rounded-md border border-[#333]">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  {/* Time Inputs */}
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1 bg-[#111] px-2 py-1 rounded border border-[#2a2a2a] group-hover:border-[#333] transition-colors">
                      <Clock size={10} className="text-blue-500" />
                      <input
                        type="number"
                        value={sub.startInMs}
                        onChange={(e) =>
                          handleTimeChange(index, "startInMs", e.target.value)
                        }
                        className="w-12 bg-transparent text-gray-300 focus:text-white outline-none text-right"
                      />
                      <span className="text-gray-600">ms</span>
                    </div>
                    <span className="text-gray-600">→</span>
                    <div className="flex items-center gap-1 bg-[#111] px-2 py-1 rounded border border-[#2a2a2a] group-hover:border-[#333] transition-colors">
                      <input
                        type="number"
                        value={sub.endInMs}
                        onChange={(e) =>
                          handleTimeChange(index, "endInMs", e.target.value)
                        }
                        className="w-12 bg-transparent text-gray-300 focus:text-white outline-none text-right"
                      />
                      <span className="text-gray-600">ms</span>
                    </div>

                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(index)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Text Input */}
                  <textarea
                    value={sub.text}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none leading-relaxed"
                    rows={2}
                    placeholder="テキストを入力..."
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
              <p>字幕が見つかりません</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-20 border-t border-[#2a2a2a] flex items-center justify-between px-6 bg-[#1f1f1f] bg-opacity-95">
          <div className="text-xs text-gray-500 font-mono">
            Total: {editingSubtitles.length} lines
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95"
            >
              <Save size={16} />
              変更を保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
