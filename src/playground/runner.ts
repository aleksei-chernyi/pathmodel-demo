import ts from "typescript"
import * as vue from "vue"
import * as zod from "zod"
import { FormBase } from "@aleksei-chernyi/pathmodel"
import { layouts, pathmodel } from "./modules/pathmodel"
import * as fields from "./modules/fields"

const LIBRARY = "@aleksei-chernyi/pathmodel"

/** Modules the playground code can import. */
const modules: Record<string, unknown> = {
  [LIBRARY]: pathmodel,
  ...Object.fromEntries(
    Object.entries(layouts).map(([name, component]) => [
      `${LIBRARY}/src/layout/${name}.vue`,
      // `__esModule` stops the compiled default import from wrapping it a second time.
      { __esModule: true, default: component },
    ])
  ),
  [`${LIBRARY}/fields`]: fields,
  // Short alias used by the Quick start hero snippet.
  "./fields": fields,
  vue,
  zod,
}

export const availableModules = [LIBRARY, `${LIBRARY}/fields`, "zod", "vue"]

export class PlaygroundError extends Error {
  constructor(
    public readonly stage: "compile" | "run",
    message: string
  ) {
    super(message)
  }
}

function compile(source: string): string {
  const result = ts.transpileModule(source, {
    reportDiagnostics: true,
    fileName: "playground.ts",
    compilerOptions: {
      target: ts.ScriptTarget.ES2019,
      module: ts.ModuleKind.CommonJS,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      useDefineForClassFields: false,
      esModuleInterop: true,
    },
  })

  const errors = (result.diagnostics ?? []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error
  )
  if (errors.length) {
    throw new PlaygroundError(
      "compile",
      errors
        .map((d) => {
          const text = ts.flattenDiagnosticMessageText(d.messageText, "\n")
          if (!d.file || d.start === undefined) return text
          const { line, character } = d.file.getLineAndCharacterOfPosition(d.start)
          return `Line ${line + 1}:${character + 1} — ${text}`
        })
        .join("\n")
    )
  }

  return result.outputText
}

function playgroundRequire(name: string) {
  if (!(name in modules)) {
    throw new PlaygroundError(
      "run",
      `Cannot import "${name}". Available modules: ${availableModules.join(", ")}`
    )
  }
  return modules[name]
}

/** Called with the reactive root form: `actions` become buttons, `display` values a live panel. */
export type FormFunctions = Record<string, (form: any) => unknown>

export interface PlaygroundModule {
  form: FormBase
  actions: FormFunctions
  display: FormFunctions
}

/** Keeps only the function entries of an optional `actions` / `display` export. */
function functionsOf(value: unknown): FormFunctions {
  if (!value || typeof value !== "object") return {}
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => typeof entry === "function")
  ) as FormFunctions
}

/** Compiles and runs the code, and returns the root form. See `runModule`. */
export function run(source: string): FormBase {
  return runModule(source).form
}

/**
 * Compiles and runs the code. The code must `export default` either a form class (created with
 * `{ title: "Playground" }`) or a form instance. It may also export `actions` and `display`.
 */
export function runModule(source: string): PlaygroundModule {
  const code = compile(source)
  const module = { exports: {} as Record<string, any> }

  try {
    new Function("require", "module", "exports", code)(playgroundRequire, module, module.exports)
  } catch (error) {
    if (error instanceof PlaygroundError) throw error
    throw new PlaygroundError("run", error instanceof Error ? error.message : String(error))
  }

  const exported = module.exports.default
  let form: unknown = exported
  if (typeof exported === "function") {
    try {
      form = new exported({ title: "Playground" })
    } catch (error) {
      throw new PlaygroundError("run", error instanceof Error ? error.message : String(error))
    }
  }

  if (!(form instanceof FormBase)) {
    throw new PlaygroundError(
      "run",
      "The code must `export default` a class extending FormBase, or an instance of one."
    )
  }

  return {
    form,
    actions: functionsOf(module.exports.actions),
    display: functionsOf(module.exports.display),
  }
}
