// Standalone replacement for @lovable.dev/vite-tanstack-config.
//
// The Lovable wrapper package used to bundle all of this for you:
//   - TanStack Router codegen + TanStack Start SSR plugin
//   - React plugin
//   - Tailwind v4 plugin
//   - tsconfig path aliases (so `@/...` imports resolve)
//   - Nitro (server build), targeting Vercel
//
// This file wires up the same pieces directly, using packages that were
// already in package.json as direct dependencies.
//
// IMPORTANT: after removing the Lovable package, run `npm install` and then
// `npm run dev` locally before deploying. If you see an error about a plugin
// being registered twice (most likely tanstackRouter/tanstackStart), it means
// your installed @tanstack/react-start version already bundles the router
// plugin internally — in that case, delete the `tanstackRouter(...)` line
// below and keep the rest as-is.

import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    // File-based route codegen (produces src/routeTree.gen.ts).
    // Remove this line if it conflicts with tanstackStart() below.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro({
      preset: "vercel",
    }),
    viteReact(),
  ],
});
