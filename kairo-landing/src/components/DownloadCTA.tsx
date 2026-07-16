"use client"
import { useState, useRef, useEffect } from "react";
import { AppleIcon, ChevronDownIcon, InfoIcon, LinuxIcon, WindowsIcon } from "./icons";

type Platform = "linux" | "windows" | "mac";

type ReleaseAsset = { name: string; browser_download_url: string };
type ReleaseAssets = {
  macArm?: string;
  macIntel?: string;
  winExe?: string;
  winMsi?: string;
  linuxX64?: string;
  linuxArm?: string;
  version?: string;
};

const GITHUB_LATEST_RELEASE_API = "https://api.github.com/repos/SHIVAMYADAV25/Kairo/releases/latest";

export default function DownloadCTA() {
  const [activeDropdown, setActiveDropdown] = useState<Platform | null>(null);
  const [showInfo, setShowInfo] = useState<Platform | null>(null);
  const [assets, setAssets] = useState<ReleaseAssets>({});

  const macRef = useRef<HTMLDivElement>(null);
  const windowsRef = useRef<HTMLDivElement>(null);
  const linuxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(GITHUB_LATEST_RELEASE_API)
      .then((r) => r.json())
      .then((release: { tag_name: string; assets: ReleaseAsset[] }) => {
        const find = (pattern: RegExp) =>
          release.assets.find((a) => pattern.test(a.name))?.browser_download_url;

        setAssets({
          macArm: find(/aarch64\.dmg$/),
          macIntel: find(/x64\.dmg$/),
          winExe: find(/x64-setup\.exe$/),
          winMsi: find(/x64_en-US\.msi$/),
          linuxX64: find(/x64\.app\.tar\.gz$/),
          linuxArm: find(/aarch64\.app\.tar\.gz$/),
          version: release.tag_name,
        });
      })
      .catch(() => {
        // API rate-limited or offline — dropdowns will just show no links below
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        (activeDropdown === "mac" && macRef.current && !macRef.current.contains(event.target as Node)) ||
        (activeDropdown === "windows" && windowsRef.current && !windowsRef.current.contains(event.target as Node)) ||
        (activeDropdown === "linux" && linuxRef.current && !linuxRef.current.contains(event.target as Node))
      ) {
        setActiveDropdown(null);
        setShowInfo(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  const toggleDropdown = (platform: Platform) => {
    if (activeDropdown === platform) {
      setActiveDropdown(null);
      setShowInfo(null);
    } else {
      setActiveDropdown(platform);
      setShowInfo(null);
    }
  };

  const toggleInfo = (e: React.MouseEvent, platform: Platform) => {
    e.stopPropagation();
    setShowInfo(showInfo === platform ? null : platform);
    setActiveDropdown(platform);
  };

  return (
    <section id="download" className="relative py-24 overflow-hidden">
      <div className="glow w-[500px] h-[500px] bg-orange-500/[0.10] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-neutral-400 mb-8 max-w-lg mx-auto">
            Download Kairo for free and start building better APIs today.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">

            {/* macOS DOWNLOAD */}
            <div ref={macRef} className="relative">
              <button
                onClick={() => toggleDropdown("mac")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all bg-orange-600 hover:bg-orange-500 text-white"
              >
                <AppleIcon /> macOS <ChevronDownIcon className={`transition-transform duration-200 ${activeDropdown === "mac" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "mac" && (
                <div className="absolute top-[52px] left-1/2 -translate-x-1/2 z-50 w-[310px] rounded-lg border border-[#181818] bg-[#111111] p-3 shadow-2xl text-left">
                  <div className="flex flex-col text-[12px] -mx-1 -my-1">
                    
                    <a
                      href={assets.macArm}
                      className={`flex items-center gap-3 p-3 text-left hover:bg-[#1a1a1e] rounded transition-colors group ${!assets.macArm ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className="text-[#666666] group-hover:text-white"><AppleIcon /></div>
                      <div>
                        <div className="font-semibold text-white">Apple Silicon (.dmg)</div>
                        <div className="text-[11px] text-[#666666]">Universal build optimized for M-series chips</div>
                      </div>
                    </a>
                    <div className="h-px bg-[#181818]" />
                    <a
                      href={assets.macIntel}
                      className={`flex items-center gap-3 p-3 text-left hover:bg-[#1a1a1e] rounded transition-colors group ${!assets.macIntel ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className="text-[#666666] group-hover:text-white"><AppleIcon /></div>
                      <div>
                        <div className="font-semibold text-white">Intel DMG (.dmg)</div>
                        <div className="text-[11px] text-[#666666]">Legacy compilation archive architecture package</div>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Windows DOWNLOAD */}
            <div ref={windowsRef} className="relative">
              <button
                onClick={() => toggleDropdown("windows")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all bg-orange-600 hover:bg-orange-500 text-white"
              >
                <WindowsIcon /> Windows <ChevronDownIcon className={`transition-transform duration-200 ${activeDropdown === "windows" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "windows" && (
                <div className="absolute top-[52px] left-1/2 -translate-x-1/2 z-50 w-[310px] rounded-lg border border-[#181818] bg-[#111111] p-3 shadow-2xl text-left">
                  <div className="flex flex-col text-[12px] -mx-1 -my-1">
                    <a
                      href={assets.winExe}
                      className={`flex items-center gap-3 p-3 text-left hover:bg-[#1a1a1e] rounded transition-colors group ${!assets.winExe ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className="text-[#666666] group-hover:text-white"><WindowsIcon /></div>
                      <div>
                        <div className="font-semibold text-white">Installer (.exe)</div>
                        <div className="text-[11px] text-[#666666]">Standard setup wizard installation runtime executable</div>
                      </div>
                    </a>
                    <div className="h-px bg-[#181818]" />
                    <a
                      href={assets.winMsi}
                      className={`flex items-center gap-3 p-3 text-left hover:bg-[#1a1a1e] rounded transition-colors group ${!assets.winMsi ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className="text-[#666666] group-hover:text-white"><WindowsIcon /></div>
                      <div>
                        <div className="font-semibold text-white">Windows Installer (.msi)</div>
                        <div className="text-[11px] text-[#666666]">Enterprise deployable en-US package configuration</div>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Linux DOWNLOAD */}
            <div ref={linuxRef} className="relative">
              <div className="flex items-center">
                <button
                  onClick={() => toggleDropdown("linux")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-l-lg text-sm font-medium transition-all bg-orange-600 hover:bg-orange-500 text-white"
                >
                  <LinuxIcon /> Linux <ChevronDownIcon className={`transition-transform duration-200 ${activeDropdown === "linux" && !showInfo ? "rotate-180" : ""}`} />
                </button>
                <button
                  onClick={(e) => toggleInfo(e, "linux")}
                  className="inline-flex items-center justify-center px-2.5 py-3 rounded-r-lg text-sm font-medium transition-all bg-orange-600 hover:bg-orange-500 border-l border-orange-400/30 text-orange-100 hover:text-white"
                  title="Installation instructions"
                  aria-label="Installation instructions"
                >
                  <InfoIcon />
                </button>
              </div>

              {activeDropdown === "linux" && (
                <div className="absolute top-[52px] left-1/2 -translate-x-1/2 z-50 w-[310px] rounded-lg border border-[#181818] bg-[#111111] p-3 shadow-2xl text-left">
                  {showInfo === "linux" ? (
                    <div className="space-y-3 text-[12px]">
                      <div>
                        <div className="text-center font-medium text-[#aaaaaa] mb-1.5 text-[11px]">AppImage Tarball (recommended)</div>
                        <div className="bg-[#151515] p-2.5 rounded border border-[#1e1e1e] font-mono text-[#00ca54] leading-relaxed select-text text-[11px]">
                          tar -xvf Kairo_{assets.version ?? "x.x.x"}_x64.app.tar.gz
                          <br />
                          ./Kairo.AppImage
                        </div>
                      </div>
                      <div className="text-center text-[10px] text-[#666666] mt-1">Requires x86_64 or aarch64 architectures.</div>
                    </div>
                  ) : (
                    <div className="flex flex-col text-[12px] -mx-1 -my-1">
                      <a
                        href={assets.linuxX64}
                        className={`flex items-center gap-3 p-3 text-left hover:bg-[#1a1a1e] rounded transition-colors group ${!assets.linuxX64 ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <div className="text-[#666666] group-hover:text-white"><LinuxIcon /></div>
                        <div>
                          <div className="font-semibold text-white">x64 Tarball (.tar.gz)</div>
                          <div className="text-[11px] text-[#666666]">Standard portable execution package bin</div>
                        </div>
                      </a>
                      <div className="h-px bg-[#181818]" />
                      <a
                        href={assets.linuxArm}
                        className={`flex items-center gap-3 p-3 text-left hover:bg-[#1a1a1e] rounded transition-colors group ${!assets.linuxArm ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <div className="text-[#666666] group-hover:text-white"><LinuxIcon /></div>
                        <div>
                          <div className="font-semibold text-white">aarch64 Tarball (.tar.gz)</div>
                          <div className="text-[11px] text-[#666666]">ARM64 compatible Linux release variant</div>
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
          <p className="text-sm text-neutral-600">Built with Rust. Runs on macOS, Windows, and Linux.</p>
          <p className="text-xs text-neutral-700 mt-2">{assets.version ?? "Loading version…"}</p>
        </div>
      </div>
    </section>
  );
}