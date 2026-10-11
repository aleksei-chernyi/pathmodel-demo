// What `import ... from "@aleksei-chernyi/pathmodel"` gives playground code: the library plus its
// layout components, so older snippets that import layouts from the package root keep working.
// The package is CommonJS, so it is spread into an object rather than re-exported with
// `export *`, which Vite's dev server can't do for CommonJS.
import * as library from "@aleksei-chernyi/pathmodel"
import Row from "@aleksei-chernyi/pathmodel/src/layout/Row.vue"
import Col from "@aleksei-chernyi/pathmodel/src/layout/Col.vue"
import Wrapper from "@aleksei-chernyi/pathmodel/src/layout/Wrapper.vue"
import Switch from "@aleksei-chernyi/pathmodel/src/layout/Switch.vue"
import Stepper from "@aleksei-chernyi/pathmodel/src/layout/Stepper.vue"
import Case from "@aleksei-chernyi/pathmodel/src/layout/Case.vue"
import Empty from "@aleksei-chernyi/pathmodel/src/layout/Empty.vue"

export const layouts = { Row, Col, Wrapper, Switch, Stepper, Case, Empty }

export const pathmodel = { ...library, ...layouts }
