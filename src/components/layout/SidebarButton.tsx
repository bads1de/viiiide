import React from "react";

type SidebarButtonProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

export const SidebarButton = ({
  icon,
  label,
  active = false,
  onClick,
}: SidebarButtonProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 w-full py-3 relative group transition-all ${
      active ? "text-blue-400" : "text-gray-400 hover:text-white"
    }`}
  >
    {active && (
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-r-full" />
    )}
    <div
      className={`transition-transform duration-200 ${
        active ? "scale-110" : "group-hover:scale-110"
      }`}
    >
      {icon}
    </div>
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);
