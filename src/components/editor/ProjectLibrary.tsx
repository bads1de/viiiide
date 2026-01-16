"use client";

import { Folder, Film, Clock, Play } from "lucide-react";

type Session = {
  id: string;
  originalName: string;
  videoPath: string;
  createdAt: string;
  hasSubtitles?: boolean;
};

type ProjectLibraryProps = {
  sessions: Session[];
  activeSessionId?: string | null;
  onLoadSession: (session: Session) => void;
  isLoading?: boolean;
};

export const ProjectLibrary = ({
  sessions,
  activeSessionId,
  onLoadSession,
  isLoading,
}: ProjectLibraryProps) => {
  return (
    <aside className="w-[280px] bg-[#111] border-r border-[#333] flex flex-col overflow-hidden">
      <div className="p-6 border-b border-[#333]">
        <div className="flex items-center gap-2 mb-1">
          <Folder size={18} className="text-blue-400" />
          <h2 className="text-xl font-bold text-white">ライブラリ</h2>
        </div>
        <p className="text-xs text-gray-400">アップロード済みのアセット</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-[#1a1a1a] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <Film size={20} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-xs text-center px-4">
              プロジェクトがありません。右のエリアに動画をアップロードしてください。
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onLoadSession(session)}
              className={`w-full group text-left p-3 rounded-xl border transition-all duration-200 ${
                activeSessionId === session.id
                  ? "bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20"
                  : "bg-[#1a1a1a] border-[#333] hover:border-[#444] hover:bg-[#222]"
              }`}
            >
              <div className="relative aspect-video mb-2 rounded-lg bg-black overflow-hidden flex items-center justify-center border border-[#333]">
                <Film
                  size={24}
                  className="text-gray-700 group-hover:text-gray-500 transition-colors"
                />
                {activeSessionId === session.id && (
                  <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                    <Play size={20} className="text-blue-400 fill-blue-400" />
                  </div>
                )}
                {session.hasSubtitles && (
                  <div className="absolute bottom-1 right-1 bg-emerald-500/80 text-[8px] font-bold text-white px-1 rounded uppercase tracking-tighter">
                    Subtitles
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p
                  className={`text-sm font-semibold truncate ${
                    activeSessionId === session.id
                      ? "text-blue-400"
                      : "text-gray-200"
                  }`}
                >
                  {session.originalName}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <Clock size={10} />
                  <span>
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};
