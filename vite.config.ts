import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  // Relative asset paths, so the build works from any sub-path (e.g. GitHub Pages).
  base: "./",
  plugins: [vue()],
  // Class field semantics of `tsc` with `useDefineForClassFields: false` (see the library README).
  oxc: {
    assumptions: { setPublicClassFields: true },
    typescript: { removeClassFieldsWithoutInitializer: true },
  },
  // The playground bundles the TypeScript compiler (~1 MB gzipped), lazily loaded.
  build: { chunkSizeWarningLimit: 4500 },
  server: { port: 5176 },
})
