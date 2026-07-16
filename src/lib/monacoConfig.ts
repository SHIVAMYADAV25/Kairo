import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";

// Point @monaco-editor/react at the locally-bundled monaco-editor package
// instead of its default behavior of fetching Monaco from a CDN at runtime.
// In a Tauri desktop app that network fetch is unreliable, and when it fails
// it throws inside the editor component with nothing to catch it — this is
// what was causing the JSON body tab to blank the whole screen.
loader.config({ monaco });