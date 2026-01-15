"use client";

import { MonitorPlay, Type, Wand2, Settings } from "lucide-react";
import { SidebarButton } from "./SidebarButton";

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  return (
    <aside className="w-[72px] bg-[#0f0f0f] flex flex-col items-center py-6 border-r border-[#333] z-10">
      <div className="mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
          <MonitorPlay size={20} className="text-white" />
        </div>
      </div>

      <nav className="flex flex-col gap-6 w-full">
        <SidebarButton
          icon={<Type size={20} />}
          label="字幕"
          active={activeTab === "subtitle"}
          onClick={() => setActiveTab("subtitle")}
        />
        <SidebarButton
          icon={<Wand2 size={20} />}
          label="AI編集"
          active={activeTab === "ai"}
          onClick={() => setActiveTab("ai")}
        />
        <SidebarButton
          icon={<Settings size={20} />}
          label="設定"
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        />
      </nav>
    </aside>
  );
};
