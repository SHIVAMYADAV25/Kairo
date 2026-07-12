import { useEffect, useRef, useState } from "react";
import { BarChart3, PanelBottomOpen } from "lucide-react";
import { IconRail, type SidebarPanel } from "@/components/Sidebar/IconRail";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { EnvironmentSelector } from "@/components/Sidebar/EnvironmentSelector";
import { TabBar } from "@/components/Tabs/TabBar";
import { RequestBuilder } from "@/components/RequestBuilder/RequestBuilder";
import { ResponseViewer } from "@/components/ResponseViewer/ResponseViewer";
import { PerformancePanel } from "@/components/PerformancePanel/PerformancePanel";
import { SettingsDrawer } from "@/components/Settings/SettingsDrawer";
import { ResizeHandle } from "@/components/common/ResizeHandle";
import { useTabStore } from "@/stores/tabStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { createEmptyTab, createTabFromPersisted } from "@/lib/factories";
import { api } from "@/lib/api";

export default function App() {
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>("collections");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [perfOpen, setPerfOpen] = useState(true);
  const [responseOpen, setResponseOpen] = useState(true);
  const [perfHistoryByTab, setPerfHistoryByTab] = useState<Record<string, number[]>>({});

  const { tabs, activeTabId, openTab } = useTabStore();
  const { settings, hydrate, update } = useSettingsStore();
  const loadEnvironments = useEnvironmentStore((s) => s.load);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;
  const perfHistory = activeTab ? perfHistoryByTab[activeTab.id] ?? [] : [];

  useEffect(() => {
    (async () => {
      await hydrate();
      loadEnvironments().catch(() => {});

      const { settings: s } = useSettingsStore.getState();
      if (s.restoreLastSession) {
        try {
          const persisted = await api.tabs.listPersisted();
          if (persisted.length > 0) {
            for (const request of persisted) openTab(createTabFromPersisted(request));
            return;
          }
        } catch {
          /* backend not ready / first run */
        }
      }
      if (useTabStore.getState().tabs.length === 0) openTab(createEmptyTab());
    })();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      api.tabs.persist(tabs.map((t) => t.request)).catch(() => {});
    }, 800);
    return () => clearTimeout(handle);
  }, [tabs]);

  const recordedResponseRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!activeTab?.response) return;
    const id = activeTab.id;
    const receivedAt = activeTab.response.receivedAt;
    if (recordedResponseRef.current[id] === receivedAt) return;
    recordedResponseRef.current[id] = receivedAt;

    const ms = activeTab.response.timing.totalMs;
    setPerfHistoryByTab((h) => ({ ...h, [id]: [...(h[id] ?? []).slice(-49), ms] }));
    setPerfOpen(true);
    setResponseOpen(true);
  }, [activeTab?.response, activeTab?.id]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-base text-text-primary">
      {/* Top Bar Navigation Dashboard Header */}
      <div className="flex items-center justify-between border-b border-border bg-bg-base px-4 py-1">
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[15px] font-semibold tracking-wide">
            Web<span className="text-accent">RequestKit</span>
          </span>
          <span className="text-[11px] text-text-muted hidden sm:inline">
            Fast. Lightweight. Rust-powered.
          </span>
        </div>
        <div className="mx-4 flex-1 overflow-hidden">
          <TabBar />
        </div>
        <div className="flex shrink-0 items-center">
          <EnvironmentSelector onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </div>

      {/* Main Internal Application Workspace Panels */}
      <div className="flex min-h-0 flex-1">
        <IconRail active={sidebarPanel} onChange={setSidebarPanel} onOpenSettings={() => setSettingsOpen(true)} />

        <div style={{ width: settings.panelSizes.sidebarWidth }} className="shrink-0 border-r border-border bg-bg-panel">
          <Sidebar panel={sidebarPanel} />
        </div>
        <ResizeHandle
          direction="horizontal"
          onResize={(d) =>
            update({ panelSizes: { ...settings.panelSizes, sidebarWidth: Math.max(200, settings.panelSizes.sidebarWidth + d) } })
          }
        />

        {/* WORKSPACE MIDDLE STACK ROUTER PANEL VIEW */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {activeTab ? (
            <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
              {/* Request Panel Section */}
              <div style={{ height: settings.panelSizes.requestEditorHeight }} className="shrink-0 overflow-hidden">
                <RequestBuilder tab={activeTab} />
              </div>
              <ResizeHandle
                direction="vertical"
                onResize={(d) =>
                  update({ panelSizes: { ...settings.panelSizes, requestEditorHeight: Math.max(180, settings.panelSizes.requestEditorHeight + d) } })
                }
              />
              
              {/* Response Panel Section - Set to expand flex-1 to occupy remainder context */}
              {responseOpen ? (
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[#0b0b0b]">
                  <ResponseViewer tab={activeTab} onClose={() => setResponseOpen(false)} />
                </div>
              ) : (
                <div className="flex-1 bg-bg-base" />
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">No request open</div>
          )}
        </div>

        {perfOpen && (
          <>
            <ResizeHandle
              direction="horizontal"
              onResize={(d) =>
                update({ panelSizes: { ...settings.panelSizes, performancePanelWidth: Math.max(220, settings.panelSizes.performancePanelWidth - d) } })
              }
            />
            <div style={{ width: settings.panelSizes.performancePanelWidth }} className="shrink-0 border-l border-border bg-bg-panel">
              {activeTab && <PerformancePanel tab={activeTab} onClose={() => setPerfOpen(false)} history={perfHistory} />}
            </div>
          </>
        )}
      </div>

      {/* Footer System Status Metrics Bar */}
      <div className="flex items-center justify-between border-t border-border bg-bg-base px-3 py-1 text-[11px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-status-success" /> Ready
        </span>
        <div className="flex items-center gap-1">
          {!responseOpen && (
            <button onClick={() => setResponseOpen(true)} className="flex items-center gap-1 rounded px-2 py-0.5 text-text-muted hover:bg-bg-hover hover:text-text-primary" title="Reopen Response panel">
              <PanelBottomOpen size={12} /> Response
            </button>
          )}
          {!perfOpen && (
            <button onClick={() => setPerfOpen(true)} className="flex items-center gap-1 rounded px-2 py-0.5 text-text-muted hover:bg-bg-hover hover:text-text-primary" title="Reopen Performance panel">
              <BarChart3 size={12} /> Performance
            </button>
          )}
        </div>
        <span>Rust · Tauri · v0.1.0</span>
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}