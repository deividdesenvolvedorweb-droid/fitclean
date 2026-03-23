import { useState, useEffect } from "react";
import { WidgetGrid } from "./WidgetGrid";
import { BlockConfigPanel } from "./BlockConfigPanel";
import { StructurePanel } from "./StructurePanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type DeviceMode } from "./ResponsiveControl";

interface DraftBlock {
  id: string;
  type: string;
  config: Record<string, any>;
  sort_order: number;
  active: boolean;
}

interface LayoutSidebarProps {
  blocks: DraftBlock[];
  selectedBlock: DraftBlock | null;
  selectedIndex: number;
  total: number;
  onAddWidget: (type: string) => void;
  onUpdateConfig: (config: Record<string, any>) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  deviceMode: DeviceMode;
}

type TabType = "widgets" | "config" | "structure";

export function LayoutSidebar({
  blocks, selectedBlock, selectedIndex, total, deviceMode,
  onAddWidget, onUpdateConfig, onMove, onDuplicate, onDelete, onToggleActive, onSelect, onReorder
}: LayoutSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>(selectedBlock ? "config" : "widgets");

  // Auto-switch to config when a block is selected
  useEffect(() => {
    if (selectedBlock && activeTab === "widgets") {
      setActiveTab("config");
    }
  }, [selectedBlock?.id]);

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {(["widgets", "config", "structure"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2.5 text-[10px] font-semibold tracking-wide uppercase transition-colors",
              activeTab === tab
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "widgets" ? "Widgets" : tab === "config" ? "Config" : "Estrutura"}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === "widgets" && <WidgetGrid onAdd={onAddWidget} />}

        {activeTab === "config" && (
          selectedBlock ? (
            <BlockConfigPanel
              block={selectedBlock}
              index={selectedIndex}
              total={total}
              onUpdate={onUpdateConfig}
              onMove={onMove}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              deviceMode={deviceMode}
            />
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <p>Selecione um bloco no preview para editar</p>
            </div>
          )
        )}

        {activeTab === "structure" && (
          <StructurePanel blocks={blocks} selectedId={selectedBlock?.id || null} onSelect={onSelect} onReorder={onReorder} />
        )}
      </ScrollArea>
    </div>
  );
}
