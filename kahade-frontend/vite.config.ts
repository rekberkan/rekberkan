import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// MULTI-SUBDOMAIN BUILD CONFIGURATION
// Build modes: landing | app | admin
// =============================================================================

const APP_MODE = process.env.VITE_APP_MODE || 'landing';
const PROJECT_ROOT = import.meta.dirname;

// Output directories per app mode
const OUTPUT_DIRS: Record<string, string> = {
  landing: 'dist/landing',
  app: 'dist/app',
  admin: 'dist/admin',
};

// Development ports per app mode
const DEV_PORTS: Record<string, number> = {
  landing: 5000,
  app: 5001,
  admin: 5002,
};

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: Record<string, unknown>) => {
          if (Array.isArray(payload.consoleLogs) && payload.consoleLogs.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (Array.isArray(payload.networkRequests) && payload.networkRequests.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (Array.isArray(payload.sessionEvents) && payload.sessionEvents.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody as Record<string, unknown>);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

const plugins = [
  react(), 
  tailwindcss(), 
  vitePluginManusRuntime(), 
  vitePluginManusDebugCollector()
];

export default defineConfig({
  plugins,
  define: {
    'import.meta.env.VITE_APP_MODE': JSON.stringify(APP_MODE),
  },
  resolve: {
    alias: {
      "@": path.resolve(PROJECT_ROOT, "client", "src"),
      "@shared": path.resolve(PROJECT_ROOT, "shared"),
      "@assets": path.resolve(PROJECT_ROOT, "attached_assets"),
    },
  },
  envDir: path.resolve(PROJECT_ROOT),
  root: path.resolve(PROJECT_ROOT, "client"),
  build: {
    outDir: path.resolve(PROJECT_ROOT, OUTPUT_DIRS[APP_MODE] || 'dist/public'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 800, // Adjusted for complex SPA with many features
    rollupOptions: {
      output: {
        // Use function-based manualChunks to properly handle dependencies
        manualChunks(id) {
          // Skip non-node_modules
          if (!id.includes('node_modules')) {
            return undefined;
          }

          // Radix UI - group all together
          if (id.includes('@radix-ui/')) {
            return 'ui-radix';
          }

          // Framer motion
          if (id.includes('framer-motion')) {
            return 'animations';
          }

          // Form libraries
          if (id.includes('react-hook-form') || 
              id.includes('@hookform/') || 
              id.includes('/zod/')) {
            return 'forms';
          }

          // Icons
          if (id.includes('@phosphor-icons/') || 
              id.includes('lucide-react')) {
            return 'icons';
          }

          // Charts and D3
          if (id.includes('recharts') || 
              id.includes('d3-')) {
            return 'charts';
          }

          // Utilities
          if (id.includes('/axios/') || 
              id.includes('/clsx/') || 
              id.includes('class-variance-authority') || 
              id.includes('tailwind-merge')) {
            return 'utils';
          }

          // React ecosystem - keep together to avoid circular deps
          if (id.includes('/react/') || 
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')) {
            return 'react-vendor';
          }

          // Let Vite handle other vendor modules automatically
          return undefined;
        },
      },
    },
  },
  server: {
    port: DEV_PORTS[APP_MODE] || 5000,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: DEV_PORTS[APP_MODE] || 5000,
    host: "0.0.0.0",
  },
});
