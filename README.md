# pathmodel demo

A static site for [`@aleksei-chernyi/pathmodel`](https://www.npmjs.com/package/@aleksei-chernyi/pathmodel)
([source](https://github.com/aleksei-chernyi/pathmodel)) with two pages,
live at https://aleksei-chernyi.github.io/pathmodel-demo/:

- **Quick start** (`#/`): the specification, with a live form in the header. The text lives in
  `src/docs/quick-start.md`.
- **Playground** (`#/playground`): write form classes on the left and see the rendered form,
  its value, errors and schema tree on the right. **Copy share link** puts the code into the
  URL (compressed), so a link opens exactly what you wrote. `#/playground?example=<id>` opens a
  built-in example (`basic`, `nested`, `tabs`, `stepper`, `behavior`; see
  `src/playground/examples.ts`). Besides the default export, the code may export `actions`
  (buttons above the form) and `display` (values shown live), each a map of functions that
  receive the reactive root form.

## Development

```bash
npm install
npm run dev        # http://localhost:5176
npm run build      # static site in dist/
npm run preview    # serve dist/ locally
npm run typecheck  # the app, and the playground examples
npm run format     # Prettier (CI runs format:check)
```

The playground examples are real files in `src/playground/examples/`, loaded as text with
`?raw`, so Prettier formats them and `typecheck` checks them against the modules the playground
offers (`src/playground/modules/`, see `src/playground/examples/tsconfig.json`).

## The library

The demo uses the published [`@aleksei-chernyi/pathmodel`](https://www.npmjs.com/package/@aleksei-chernyi/pathmodel)
package. Its layout and template components (`src/**/*.vue`) import the library's TypeScript
source, so `vite.config.ts` resolves the package root to `src/index.ts` as well; that keeps a
single copy of the library in the bundle. To update it, run `npm install @aleksei-chernyi/pathmodel@latest`.

## Deploy

The build is plain static files with hash routing and relative asset paths, so it needs no
server rewrites and works from any sub-path.

| Host                                | Settings                                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Netlify / Vercel / Cloudflare Pages | Build command `npm run build`, output directory `dist`                                                                           |
| GitHub Pages                        | `.github/workflows/deploy.yml` builds and deploys every push to `main` (set **Settings → Pages → Source** to **GitHub Actions**) |
| Anything else                       | Upload the contents of `dist/`                                                                                                   |

The playground bundles the TypeScript compiler (about 1 MB gzipped). It only loads on the
playground page and for the live demo on the Quick start page, after the text has rendered.

## License

MIT
