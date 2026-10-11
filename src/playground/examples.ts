// Each example is a real TypeScript file, so Prettier formats it and `npm run typecheck`
// checks it (examples/tsconfig.json). The playground gets its source text via `?raw`.
import basic from "./examples/basic.ts?raw"
import nested from "./examples/nested.ts?raw"
import stepper from "./examples/stepper.ts?raw"
import tabs from "./examples/tabs.ts?raw"

export interface Example {
  id: string
  name: string
  code: string
}

export const examples: Example[] = [
  { id: "basic", name: "Basic fields", code: basic },
  { id: "nested", name: "Nested + value schema", code: nested },
  { id: "tabs", name: "Switch (tabs)", code: tabs },
  { id: "stepper", name: "Stepper", code: stepper },
]
