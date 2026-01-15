import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "@/components/layout/Sidebar";

describe("Sidebar", () => {
  it("renders sidebar buttons", () => {
    const setActiveTab = jest.fn();
    render(<Sidebar activeTab="subtitle" setActiveTab={setActiveTab} />);

    expect(screen.getByText("字幕")).toBeInTheDocument();
    expect(screen.getByText("AI編集")).toBeInTheDocument();
    expect(screen.getByText("設定")).toBeInTheDocument();
  });

  it("calls setActiveTab when a button is clicked", () => {
    const setActiveTab = jest.fn();
    render(<Sidebar activeTab="subtitle" setActiveTab={setActiveTab} />);

    fireEvent.click(screen.getByText("AI編集"));
    expect(setActiveTab).toHaveBeenCalledWith("ai");
  });
});
