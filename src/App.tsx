import { useEffect, useState } from "react";
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
import { createEmptyTab } from "@/lib/factories";

export default function App() {
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>("collections");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [perfOpen, setPerfOpen] = useState(true);
  const [perfHistory, setPerfHistory] = useState<number[]>([]);

  const { tabs, activeTabId, openTab } = useTabStore();
  const { settings, hydrate, update } = useSettingsStore();
  const loadEnvironments = useEnvironmentStore((s) => s.load);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  useEffect(() => {
    hydrate();
    loadEnvironments().catch(() => {});
    if (tabs.length === 0) openTab(createEmptyTab());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab?.response) {
      setPerfHistory((h) => [...h.slice(-9), activeTab.response!.timing.totalMs]);
    }
  }, [activeTab?.response]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-base text-text-primary">
      {/* Title bar - Restructured layout to prevent items squeezing away */}
      <div className="flex items-center justify-between border-b border-border bg-bg-base px-4 py-1">
        
        {/* Left Side: Brand Logo & Subtitle (Guaranteed to stay in place) */}
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[15px] font-semibold tracking-wide">
            Web<span className="text-accent">RequestKit</span>
          </span>
          <span className="text-[11px] text-text-muted hidden sm:inline">
            Fast. Lightweight. Rust-powered.
          </span>
        </div>

        {/* Center: Tab Bar Wrapper (Takes up free middle room, safely masking horizontal scrolls) */}
        <div className="mx-4 flex-1 overflow-hidden">
          <TabBar />
        </div>

        {/* Right Side: Environment Menu & App Settings (Guaranteed to stay visible) */}
        <div className="flex shrink-0 items-center">
          <EnvironmentSelector onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </div>

      {/* Main App Workspace */}
      <div className="flex min-h-0 flex-1">
        <IconRail
          active={sidebarPanel}
          onChange={setSidebarPanel}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <div
          style={{ width: settings.panelSizes.sidebarWidth }}
          className="shrink-0 border-r border-border bg-bg-panel"
        >
          <Sidebar panel={sidebarPanel} />
        </div>
        <ResizeHandle
          direction="horizontal"
          onResize={(d) =>
            update({
              panelSizes: {
                ...settings.panelSizes,
                sidebarWidth: Math.max(200, settings.panelSizes.sidebarWidth + d),
              },
            })
          }
        />

        {/* Center: Request Builder over Response Viewer */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {activeTab ? (
            <>
              <div style={{ height: settings.panelSizes.requestEditorHeight }} className="shrink-0 overflow-hidden">
                <RequestBuilder tab={activeTab} />
              </div>
              <ResizeHandle
                direction="vertical"
                onResize={(d) =>
                  update({
                    panelSizes: {
                      ...settings.panelSizes,
                      requestEditorHeight: Math.max(
                        180,
                        settings.panelSizes.requestEditorHeight + d
                      ),
                    },
                  })
                }
              />
              <div
                style={{ height: settings.panelSizes.responseViewerHeight }}
                className="shrink-0 overflow-hidden"
              >
                <ResponseViewer tab={activeTab} />
              </div>
              <ResizeHandle
                direction="vertical"
                onResize={(d) =>
                  update({
                    panelSizes: {
                      ...settings.panelSizes,
                      responseViewerHeight: Math.max(
                        160,
                        settings.panelSizes.responseViewerHeight + d
                      ),
                    },
                  })
                }
              />
              {/* Absorbs leftover vertical space to maintain independent heights */}
              <div className="min-h-0 flex-1 overflow-auto bg-bg-base" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              No request open
            </div>
          )}
        </div>

        {/* Right: Performance Panel */}
        {perfOpen && (
          <>
            <ResizeHandle
              direction="horizontal"
              onResize={(d) =>
                update({
                  panelSizes: {
                    ...settings.panelSizes,
                    performancePanelWidth: Math.max(
                      220,
                      settings.panelSizes.performancePanelWidth - d
                    ),
                  },
                })
              }
            />
            <div
              style={{ width: settings.panelSizes.performancePanelWidth }}
              className="shrink-0 border-l border-border bg-bg-panel"
            >
              {activeTab && (
                <PerformancePanel
                  tab={activeTab}
                  onClose={() => setPerfOpen(false)}
                  history={perfHistory}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between border-t border-border bg-bg-base px-3 py-1 text-[11px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-status-success" /> Ready
        </span>
        <span>Rust · Tauri · v0.1.0</span>
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}