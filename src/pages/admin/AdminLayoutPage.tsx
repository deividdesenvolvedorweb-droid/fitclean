import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Eye, EyeOff, Undo2, Redo2, ArrowLeft, Clipboard, ClipboardPaste } from "lucide-react";
import { useHomeBlocks } from "@/hooks/admin/useHomeBlocks";
import { Button } from "@/components/ui/button";
import { LayoutSidebar } from "@/components/admin/layout/LayoutSidebar";
import { DeviceToggle, type DeviceMode } from "@/components/admin/layout/ResponsiveControl";
import { LayoutPreview } from "@/components/admin/layout/LayoutPreview";
import { type DropPosition } from "@/components/admin/layout/BlockWrapper";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface DraftBlock {
  id: string;
  type: string;
  config: Record<string, any>;
  sort_order: number;
  active: boolean;
  _isNew?: boolean;
  _isDeleted?: boolean;
}

const LAYOUT_DRAFT_STORAGE_KEY = "admin-layout-draft-v1";

interface LayoutDraftSnapshot {
  blocks: DraftBlock[];
  selectedId: string | null;
  deviceMode: DeviceMode;
  updatedAt: number;
}

function loadLayoutDraftFromSession(): LayoutDraftSnapshot | null {
  try {
    const raw = sessionStorage.getItem(LAYOUT_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LayoutDraftSnapshot;
    if (!parsed || !Array.isArray(parsed.blocks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Extract style keys from config
function extractStyleKeys(config: Record<string, any>): Record<string, any> {
  const style: Record<string, any> = {};
  for (const [k, v] of Object.entries(config)) {
    if (k.startsWith("style_") || k.startsWith("hover_") || k.startsWith("adv_")) {
      style[k] = v;
    }
  }
  return style;
}

export default function AdminLayoutPage() {
  const { blocks: serverBlocks, isLoading } = useHomeBlocks();
  const queryClient = useQueryClient();
  const { state: draftBlocks, set: setDraftBlocks, undo, redo, canUndo, canRedo, reset: resetDraft } = useUndoRedo<DraftBlock[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [copiedStyle, setCopiedStyle] = useState<Record<string, any> | null>(null);
  const isMobile = useIsMobile();

  // Initialize draft from server/session
  useEffect(() => {
    if (isLoading || initialized) return;

    const persistedDraft = loadLayoutDraftFromSession();
    if (persistedDraft) {
      resetDraft(persistedDraft.blocks.map((b) => ({ ...b, config: b.config || {} })));
      setSelectedId(persistedDraft.selectedId ?? null);
      setDeviceMode(persistedDraft.deviceMode ?? "desktop");
      toast.info("Rascunho restaurado da sessão.");
    } else {
      resetDraft(serverBlocks.map((b) => ({ ...b, config: b.config || {} })));
    }

    setInitialized(true);
  }, [serverBlocks, isLoading, initialized, resetDraft]);

  // Persist draft during editing so browser tab reload/discard does not lose work
  useEffect(() => {
    if (!initialized) return;
    try {
      const snapshot: LayoutDraftSnapshot = {
        blocks: draftBlocks,
        selectedId,
        deviceMode,
        updatedAt: Date.now(),
      };
      sessionStorage.setItem(LAYOUT_DRAFT_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore storage errors
    }
  }, [draftBlocks, selectedId, deviceMode, initialized]);

  // Reorder blocks (drag & drop structure panel)
  const reorderBlock = useCallback((fromIndex: number, toIndex: number) => {
    setDraftBlocks(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((b, i) => ({ ...b, sort_order: i }));
    });
  }, [setDraftBlocks]);

  // Drop block with directional positioning
  const handleDropBlock = useCallback((fromId: string, toId: string, position: DropPosition) => {
    setDraftBlocks(prev => {
      const fromIdx = prev.findIndex(b => b.id === fromId);
      const toIdx = prev.findIndex(b => b.id === toId);
      if (fromIdx < 0 || toIdx < 0) return prev;

      const fromBlock = prev[fromIdx];
      const toBlock = prev[toIdx];

      // Drop inside a section/container
      if (position === "inside" && (toBlock.type === "section" || toBlock.type === "container")) {
        const layout = toBlock.config?.layout || (toBlock.type === "container" ? "1/2+1/2" : "1");
        const colCount = layout === "1" ? 1 : layout.split("+").length;
        const currentChildren: any[][] = Array.isArray(toBlock.config?.children) ? toBlock.config.children : [];
        const newChildren = Array.from({ length: colCount }, (_, i) => Array.isArray(currentChildren[i]) ? [...currentChildren[i]] : []);
        // Add to first column
        newChildren[0].push({ type: fromBlock.type, config: { ...fromBlock.config } });
        const next = prev.filter(b => b.id !== fromId).map(b => {
          if (b.id === toId) return { ...b, config: { ...b.config, children: newChildren } };
          return b;
        });
        return next.map((b, i) => ({ ...b, sort_order: i }));
      }

      if (position === "left" || position === "right") {
        // Place side by side — assign same _row
        const rowId = toBlock.config?._row || crypto.randomUUID();
        const rowBlocks = prev.filter(b => b.config?._row === rowId && b.id !== fromId);
        const colCount = rowBlocks.length + 1; // +1 for the new block
        // Only allow max 4 columns
        if (colCount > 4) return prev;

        const colWidth = `${(100 / colCount).toFixed(1)}%`;

        // Remove from old position
        let next = prev.filter(b => b.id !== fromId);

        // Update target block's row
        next = next.map(b => {
          if (b.config?._row === rowId || b.id === toId) {
            return { ...b, config: { ...b.config, _row: rowId, _col_width: colWidth } };
          }
          return b;
        });

        // Insert the moved block next to target
        const newToIdx = next.findIndex(b => b.id === toId);
        const insertAt = position === "right" ? newToIdx + 1 : newToIdx;
        const movedBlock = { ...fromBlock, config: { ...fromBlock.config, _row: rowId, _col_width: colWidth } };
        next.splice(insertAt, 0, movedBlock);

        // Update widths for all blocks in the same row
        const finalRowBlocks = next.filter(b => b.config?._row === rowId);
        const finalWidth = `${(100 / finalRowBlocks.length).toFixed(1)}%`;
        next = next.map(b => b.config?._row === rowId ? { ...b, config: { ...b.config, _col_width: finalWidth } } : b);

        return next.map((b, i) => ({ ...b, sort_order: i }));
      }

      // Above / Below — remove from any row and stack vertically
      let next = prev.filter(b => b.id !== fromId);
      
      // Clean row from source block
      const cleanedFrom = { ...fromBlock, config: { ...fromBlock.config } };
      delete cleanedFrom.config._row;
      delete cleanedFrom.config._col_width;

      // If source was in a row, update remaining row members
      const sourceRowId = fromBlock.config?._row;
      if (sourceRowId) {
        const remaining = next.filter(b => b.config?._row === sourceRowId);
        if (remaining.length === 1) {
          // Only 1 left in row — remove row grouping
          next = next.map(b => {
            if (b.config?._row === sourceRowId) {
              const cfg = { ...b.config };
              delete cfg._row;
              delete cfg._col_width;
              return { ...b, config: cfg };
            }
            return b;
          });
        } else if (remaining.length > 1) {
          const newWidth = `${(100 / remaining.length).toFixed(1)}%`;
          next = next.map(b => b.config?._row === sourceRowId ? { ...b, config: { ...b.config, _col_width: newWidth } } : b);
        }
      }

      const newToIdx = next.findIndex(b => b.id === toId);
      const insertAt = position === "below" ? newToIdx + 1 : newToIdx;
      next.splice(insertAt, 0, cleanedFrom);

      return next.map((b, i) => ({ ...b, sort_order: i }));
    });
  }, [setDraftBlocks]);

  // (keyboard shortcuts moved after all callbacks)

  const hasChanges = initialized && (() => {
    const draftComparable = draftBlocks.map(b => ({ id: b.id, type: b.type, config: b.config, sort_order: b.sort_order, active: b.active }));
    const serverComparable = serverBlocks.map(b => ({ id: b.id, type: b.type, config: b.config, sort_order: b.sort_order, active: b.active }));
    return JSON.stringify(draftComparable) !== JSON.stringify(serverComparable);
  })();

  const addBlock = useCallback((type: string, position?: number) => {
    const newBlock: DraftBlock = {
      id: crypto.randomUUID(),
      type,
      config: {},
      sort_order: 0,
      active: true,
      _isNew: true,
    };
    setDraftBlocks(prev => {
      const pos = position ?? prev.length;
      const next = [...prev];
      next.splice(pos, 0, newBlock);
      return next.map((b, i) => ({ ...b, sort_order: i }));
    });
    setSelectedId(newBlock.id);
  }, [setDraftBlocks]);

  // Drop a new widget from sidebar onto an existing block
  const handleDropNewWidget = useCallback((widgetType: string, targetBlockId: string, position: DropPosition) => {
    const newBlock: DraftBlock = {
      id: crypto.randomUUID(),
      type: widgetType,
      config: {},
      sort_order: 0,
      active: true,
      _isNew: true,
    };

    setDraftBlocks(prev => {
      const targetIdx = prev.findIndex(b => b.id === targetBlockId);
      if (targetIdx < 0) return prev;
      const targetBlock = prev[targetIdx];

      // Drop inside a section/container
      if (position === "inside" && (targetBlock.type === "section" || targetBlock.type === "container")) {
        const layout = targetBlock.config?.layout || (targetBlock.type === "container" ? "1/2+1/2" : "1");
        const colCount = layout === "1" ? 1 : layout.split("+").length;
        const currentChildren: any[][] = Array.isArray(targetBlock.config?.children) ? targetBlock.config.children : [];
        const newChildren = Array.from({ length: colCount }, (_, i) => Array.isArray(currentChildren[i]) ? [...currentChildren[i]] : []);
        newChildren[0].push({ type: widgetType, config: {} });
        return prev.map(b => {
          if (b.id === targetBlockId) return { ...b, config: { ...b.config, children: newChildren } };
          return b;
        });
      }

      if (position === "left" || position === "right") {
        const rowId = targetBlock.config?._row || crypto.randomUUID();
        const rowBlocks = prev.filter(b => b.config?._row === rowId && b.id !== newBlock.id);
        const colCount = rowBlocks.length + (targetBlock.config?._row ? 1 : 2);
        if (colCount > 4) return prev;
        const colWidth = `${(100 / colCount).toFixed(1)}%`;

        let next = prev.map(b => {
          if (b.config?._row === rowId || b.id === targetBlockId) {
            return { ...b, config: { ...b.config, _row: rowId, _col_width: colWidth } };
          }
          return b;
        });

        const tIdx = next.findIndex(b => b.id === targetBlockId);
        const insertAt = position === "right" ? tIdx + 1 : tIdx;
        const movedBlock = { ...newBlock, config: { ...newBlock.config, _row: rowId, _col_width: colWidth } };
        next.splice(insertAt, 0, movedBlock);

        const finalRowBlocks = next.filter(b => b.config?._row === rowId);
        const finalWidth = `${(100 / finalRowBlocks.length).toFixed(1)}%`;
        next = next.map(b => b.config?._row === rowId ? { ...b, config: { ...b.config, _col_width: finalWidth } } : b);

        return next.map((b, i) => ({ ...b, sort_order: i }));
      }

      // Above / Below
      const next = [...prev];
      const insertAt = position === "below" ? targetIdx + 1 : targetIdx;
      next.splice(insertAt, 0, newBlock);
      return next.map((b, i) => ({ ...b, sort_order: i }));
    });

    setSelectedId(newBlock.id);
  }, [setDraftBlocks]);

  const updateBlockConfig = useCallback((id: string, config: Record<string, any>) => {
    setDraftBlocks(prev => prev.map(b => b.id === id ? { ...b, config } : b));
  }, [setDraftBlocks]);

  const moveBlock = useCallback((index: number, direction: -1 | 1) => {
    setDraftBlocks(prev => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next.map((b, i) => ({ ...b, sort_order: i }));
    });
  }, [setDraftBlocks]);

  const duplicateBlock = useCallback((index: number) => {
    setDraftBlocks(prev => {
      const source = prev[index];
      const dup: DraftBlock = { ...source, id: crypto.randomUUID(), config: { ...source.config }, _isNew: true };
      const next = [...prev];
      next.splice(index + 1, 0, dup);
      return next.map((b, i) => ({ ...b, sort_order: i }));
    });
  }, [setDraftBlocks]);

  const deleteBlock = useCallback((index: number) => {
    setDraftBlocks(prev => prev.filter((_, i) => i !== index).map((b, i) => ({ ...b, sort_order: i })));
    setSelectedId(null);
  }, [setDraftBlocks]);

  const toggleActive = useCallback((id: string) => {
    setDraftBlocks(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  }, [setDraftBlocks]);

  const discard = useCallback(() => {
    resetDraft(serverBlocks.map((b) => ({ ...b, config: b.config || {} })));
    setSelectedId(null);
    try {
      sessionStorage.removeItem(LAYOUT_DRAFT_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, [serverBlocks, resetDraft]);

  // Copy / Paste style
  const copyStyle = useCallback(() => {
    const block = draftBlocks.find(b => b.id === selectedId);
    if (!block) return;
    setCopiedStyle(extractStyleKeys(block.config));
    toast.success("Estilo copiado!");
  }, [draftBlocks, selectedId]);

  const pasteStyle = useCallback(() => {
    if (!copiedStyle || !selectedId) return;
    setDraftBlocks(prev => prev.map(b => {
      if (b.id !== selectedId) return b;
      // Remove existing style keys and apply copied
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(b.config)) {
        if (!k.startsWith("style_") && !k.startsWith("hover_") && !k.startsWith("adv_")) {
          cleaned[k] = v;
        }
      }
      return { ...b, config: { ...cleaned, ...copiedStyle } };
    }));
    toast.success("Estilo colado!");
  }, [copiedStyle, selectedId, setDraftBlocks]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const serverIds = new Set(serverBlocks.map(b => b.id));
      const draftIds = new Set(draftBlocks.map(b => b.id));

      // Batch deletes
      const toDelete = serverBlocks.filter(b => !draftIds.has(b.id));
      if (toDelete.length > 0) {
        const { error } = await supabase.from("home_blocks").delete().in("id", toDelete.map(b => b.id));
        if (error) throw error;
      }

      // Batch upserts
      const upsertData = draftBlocks.map(b => ({
        id: b.id,
        type: b.type,
        config: b.config,
        sort_order: b.sort_order,
        active: b.active,
        updated_at: new Date().toISOString(),
      }));

      if (upsertData.length > 0) {
        const { error } = await supabase.from("home_blocks").upsert(upsertData);
        if (error) throw error;
      }

      setDraftBlocks(prev => prev.map(b => ({ ...b, _isNew: false })));
      queryClient.invalidateQueries({ queryKey: ["admin-home-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["public-home-blocks"] });
      try {
        sessionStorage.removeItem(LAYOUT_DRAFT_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
      toast.success("Layout salvo com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }, [draftBlocks, serverBlocks, queryClient, setDraftBlocks]);

  // Keyboard shortcuts (after all callbacks)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if (mod && e.key === "s") { e.preventDefault(); save(); }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          const idx = draftBlocks.findIndex(b => b.id === selectedId);
          if (idx >= 0) { e.preventDefault(); deleteBlock(idx); }
        }
      }
      if (mod && e.key === "d") {
        if (selectedId) {
          const idx = draftBlocks.findIndex(b => b.id === selectedId);
          if (idx >= 0) { e.preventDefault(); duplicateBlock(idx); }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, save, selectedId, draftBlocks, deleteBlock, duplicateBlock]);

  const selectedBlock = draftBlocks.find(b => b.id === selectedId) || null;
  const selectedIndex = draftBlocks.findIndex(b => b.id === selectedId);

  if (isLoading || !initialized) return <LoadingState />;

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Toolbar */}
        <div className="flex items-center justify-between h-12 px-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/admin"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <span className="font-semibold text-sm hidden sm:inline">Layout da Home</span>
            {isMobile && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? "Fechar Painel" : "Painel"}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Undo / Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo}>
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo}>
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refazer (Ctrl+Y)</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

            {/* Copy / Paste Style */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyStyle} disabled={!selectedId}>
                  <Clipboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar estilo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={pasteStyle} disabled={!copiedStyle || !selectedId}>
                  <ClipboardPaste className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Colar estilo</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

            <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)} className="text-xs gap-1.5">
              {previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{previewMode ? "Editar" : "Visualizar"}</span>
            </Button>
            <div className="hidden sm:block">
              <DeviceToggle deviceMode={deviceMode} onChange={setDeviceMode} />
            </div>
            <Button variant="ghost" size="sm" onClick={discard} disabled={!hasChanges} className="text-xs gap-1.5">
              <Undo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Descartar</span>
            </Button>
            <Button size="sm" onClick={save} disabled={!hasChanges || saving} className="text-xs gap-1.5">
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Salvando..." : "Salvar"}</span>
            </Button>
          </div>
        </div>

        {/* Editor body */}
        <div className="flex flex-1 overflow-hidden">
          {isMobile && sidebarOpen && (
            <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setSidebarOpen(false)} />
          )}
          {(!isMobile || sidebarOpen) && (
            <div className={cn("shrink-0 overflow-hidden", isMobile ? "fixed inset-y-12 left-0 z-40 w-72 shadow-xl bg-background" : "w-72 xl:w-80")}>
              <LayoutSidebar
                blocks={draftBlocks}
                selectedBlock={selectedBlock}
                selectedIndex={selectedIndex}
                total={draftBlocks.length}
                deviceMode={deviceMode}
                onAddWidget={(type) => addBlock(type)}
                onUpdateConfig={(config) => selectedId && updateBlockConfig(selectedId, config)}
                onMove={(dir) => selectedIndex >= 0 && moveBlock(selectedIndex, dir)}
                onDuplicate={() => selectedIndex >= 0 && duplicateBlock(selectedIndex)}
                onDelete={() => selectedIndex >= 0 && deleteBlock(selectedIndex)}
                onToggleActive={() => selectedId && toggleActive(selectedId)}
                onSelect={setSelectedId}
                onReorder={reorderBlock}
              />
            </div>
          )}

          {/* Preview */}
          <div className="flex-1 overflow-y-auto bg-muted/30 flex justify-center">
            <div className={cn(
              "transition-all duration-300 mx-auto bg-background",
              deviceMode === "desktop" && "w-full max-w-6xl",
              deviceMode === "tablet" && "w-[768px] shadow-xl border-x border-border",
              deviceMode === "mobile" && "w-[375px] shadow-xl border-x border-border"
            )}>
              <LayoutPreview
                blocks={draftBlocks}
                selectedId={selectedId}
                previewMode={previewMode}
                onSelect={setSelectedId}
                onMove={moveBlock}
                onDuplicate={duplicateBlock}
                onDelete={deleteBlock}
                onToggleActive={toggleActive}
                onInsertAt={addBlock}
                onDeselect={() => setSelectedId(null)}
                onDropBlock={handleDropBlock}
                onDropNewWidget={handleDropNewWidget}
                onCopyStyle={copyStyle}
                onPasteStyle={pasteStyle}
                canPasteStyle={!!copiedStyle}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
