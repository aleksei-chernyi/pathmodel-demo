import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

// The package's layout and template components (`src/**/*.vue`) import the library's TypeScript
// source, so the package root resolves to that source too. Otherwise the app would load two
// copies of the library (`dist/` and `src/`), and their `FormBase` classes would differ.
const librarySource = fileURLToPath(
  new URL("./node_modules/@aleksei-chernyi/pathmodel/src/index.ts", import.meta.url)
)

export default defineConfig({
  // Relative asset paths, so the build works from any sub-path (e.g. GitHub Pages).
  base: "./",
  plugins: [vue()],
  resolve: {
    alias: [{ find: /^@aleksei-chernyi\/pathmodel$/, replacement: librarySource }],
  },
  // Class field semantics of `tsc` with `useDefineForClassFields: false` (see the library README).
  oxc: {
    assumptions: { setPublicClassFields: true },
    typescript: { removeClassFieldsWithoutInitializer: true },
  },
  // The playground bundles the TypeScript compiler (~1 MB gzipped), lazily loaded.
  build: { chunkSizeWarningLimit: 4500 },
  server: { port: 5176 },
})
