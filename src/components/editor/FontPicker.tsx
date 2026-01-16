"use client";

import React, { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Search } from "lucide-react";
import { POPULAR_FONTS, loadGoogleFont } from "@/utils/googleFonts";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FontPickerProps {
  selectedFont: string;
  onSelect: (fontFamily: string) => void;
  className?: string;
}

export const FontPicker: React.FC<FontPickerProps> = ({
  selectedFont,
  onSelect,
  className,
}) => {
  const [search, setSearch] = useState("");
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  // フィルタリングされたフォント
  const filteredFonts = POPULAR_FONTS.filter((font) =>
    font.toLowerCase().includes(search.toLowerCase())
  );

  // フォントを選択時にロード
  const handleSelect = (fontFamily: string) => {
    loadGoogleFont(fontFamily);
    onSelect(fontFamily);
  };

  // 表示されているフォントをプリロード
  useEffect(() => {
    const toLoad = filteredFonts.slice(0, 10);
    toLoad.forEach((font) => {
      if (!loadedFonts.has(font)) {
        loadGoogleFont(font);
        setLoadedFonts((prev) => new Set(prev).add(font));
      }
    });
  }, [filteredFonts, loadedFonts]);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 bg-[#111] border border-[#333] rounded-lg h-[400px]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-gray-200 font-bold text-sm">Select Font</h3>
        <span className="text-xs text-gray-500">
          {POPULAR_FONTS.length} fonts
        </span>
      </div>

      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          placeholder="Search fonts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#222] text-gray-200 text-xs rounded-md pl-8 pr-3 py-1.5 border border-[#333] focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
        />
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 gap-1 pr-1 custom-scrollbar">
        {filteredFonts.length > 0 ? (
          filteredFonts.map((font) => (
            <button
              key={font}
              onClick={() => handleSelect(font)}
              className={cn(
                "text-left px-3 py-2 rounded transition-all text-sm truncate flex items-center min-h-[36px]",
                "hover:bg-[#222] text-gray-300",
                selectedFont === font
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/50"
                  : "border border-transparent"
              )}
              style={{ fontFamily: `"${font}", sans-serif` }}
              title={font}
            >
              <span className="truncate w-full">{font}</span>
            </button>
          ))
        ) : (
          <div className="text-gray-500 text-xs text-center py-4">
            No fonts found
          </div>
        )}
      </div>
    </div>
  );
};
