<template>
  <div class="pg">
    <header class="pg-header">
      <div class="pg-header__examples">
        <span class="pg-muted">Examples</span>
        <button
          v-for="example in examples"
          :key="example.id"
          class="pg-button pg-button--small"
          :class="{ 'pg-button--current': example.code === code }"
          @click="openExample(example)"
        >
          {{ example.name }}
        </button>
      </div>
      <span class="pg-header__hint">
        <span class="pg-muted">Imports</span>
        <code v-for="m in availableModules" :key="m">{{ m }}</code>
      </span>
      <button class="pg-button pg-button--small pg-header__share" @click="share">
        {{ shareLabel }}
      </button>
    </header>

    <main class="pg-main">
      <section class="pg-pane pg-pane--editor">
        <Editor v-model="code" />
      </section>

      <section class="pg-pane pg-pane--result">
        <div v-if="error" class="pg-error">
          <strong>{{ error.stage === "compile" ? "Compile error" : "Runtime error" }}</strong>
          <pre>{{ error.message }}</pre>
          <small v-if="form">Showing the last working version.</small>
        </div>

        <template v-if="form">
          <div class="pg-toolbar">
            <button class="pg-button pg-button--primary" @click="onValidate">Validate</button>
            <button class="pg-button" @click="form.clearValidationErrors()">Clear errors</button>
            <button class="pg-button" @click="rerun">Reset values</button>
            <span v-if="validationResult !== null" class="pg-badge" :class="validationResult">
              {{ validationResult === "valid" ? "Valid" : "Has errors" }}
            </span>
          </div>

          <div class="pg-form">
            <SchemaRenderer :key="runId" :nodes="nodes" :root="form" />
          </div>

          <div class="pg-panels">
            <div class="pg-panel">
              <h2>Value <small>getFormValue()</small></h2>
              <pre>{{ json(formValue) }}</pre>
            </div>
            <div class="pg-panel">
              <h2>Errors <small>getValidationErrors()</small></h2>
              <pre>{{ json(errors) }}</pre>
            </div>
          </div>

          <details class="pg-panel">
            <summary>
              <h2>Schema nodes <small>buildSchema()</small></h2>
            </summary>
            <pre>{{ tree }}</pre>
          </details>
        </template>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onErrorCaptured, reactive, ref, shallowRef, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import SchemaRenderer from "@aleksei-chernyi/pathmodel/src/template/SchemaRenderer.vue"
import { FieldNode, FormBase, LayoutNode, SomeNode } from "@aleksei-chernyi/pathmodel"
import Editor from "../playground/Editor.vue"
import { Example, examples } from "../playground/examples"
import { availableModules, PlaygroundError, run } from "../playground/runner"
import { decodeCode, encodeCode } from "../playground/share"

const STORAGE_KEY = "pathmodel-demo:code"

const route = useRoute()
const router = useRouter()

function loadStoredCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** `?code=` (a shared link) wins over `?example=`, which wins over the last session. */
async function initialCode(): Promise<string> {
  const { code: encoded, example } = route.query
  if (typeof encoded === "string") {
    try {
      return await decodeCode(encoded)
    } catch {
      // A broken link falls through to the defaults.
    }
  }
  const byId = examples.find((e) => e.id === example)
  if (byId) return byId.code
  return loadStoredCode() ?? examples[0].code
}

const code = ref("")
const form = shallowRef<FormBase | null>(null)
const nodes = shallowRef<SomeNode[]>([])
const error = ref<{ stage: string; message: string } | null>(null)
const validationResult = ref<"valid" | "invalid" | null>(null)
const runId = ref(0)
const shareLabel = ref("Copy share link")

function rerun() {
  try {
    const instance = reactive(run(code.value)) as FormBase
    nodes.value = instance.buildSchema()
    form.value = instance
    error.value = null
    validationResult.value = null
    runId.value++
  } catch (e) {
    error.value =
      e instanceof PlaygroundError
        ? { stage: e.stage, message: e.message }
        : { stage: "run", message: e instanceof Error ? e.message : String(e) }
  }
}

function openExample(example: Example) {
  code.value = example.code
  router.replace({ query: { example: example.id } })
}

let timer: ReturnType<typeof setTimeout> | undefined
watch(code, (value, previous) => {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage may be unavailable; the playground still works without it.
  }
  clearTimeout(timer)
  // The first load runs at once; edits are debounced.
  if (previous === "") rerun()
  else timer = setTimeout(rerun, 400)
})

initialCode().then((value) => (code.value = value))

async function share() {
  const encoded = await encodeCode(code.value)
  await router.replace({ query: { code: encoded } })
  try {
    await navigator.clipboard.writeText(window.location.href)
    shareLabel.value = "Link copied"
  } catch {
    shareLabel.value = "Link is in the address bar"
  }
  setTimeout(() => (shareLabel.value = "Copy share link"), 2000)
}

async function onValidate() {
  if (!form.value) return
  try {
    validationResult.value = (await form.value.validate()) ? "valid" : "invalid"
  } catch (e) {
    error.value = { stage: "run", message: e instanceof Error ? e.message : String(e) }
  }
}

onErrorCaptured((e) => {
  error.value = { stage: "run", message: e instanceof Error ? e.message : String(e) }
  return false
})

const formValue = computed(() => form.value?.getFormValue() ?? {})
const errors = computed(() => form.value?.getValidationErrors() ?? {})

// The badge describes the last validation run; any edit makes it stale.
watch(formValue, () => (validationResult.value = null), { deep: true })

const json = (value: unknown) => JSON.stringify(value, null, 2)

function componentName(component: unknown): string {
  const c = component as { __name?: string; name?: string }
  return c?.__name ?? c?.name ?? "Anonymous"
}

function describe(list: SomeNode[], depth = 0): string[] {
  const pad = "  ".repeat(depth)
  return list.flatMap((node) => {
    if (node instanceof FieldNode) {
      const flags = [node.isRequired() && "required", node.options?.rules && "rules"]
        .filter(Boolean)
        .join(", ")
      return [
        `${pad}Field <${componentName(node.component)}> ${node.dotPath}` +
          (flags ? `  [${flags}]` : ""),
      ]
    }
    const layout = node as LayoutNode
    return [
      `${pad}Layout <${componentName(layout.component)}>${layout.label ? ` "${layout.label}"` : ""}`,
      ...describe(layout.children || [], depth + 1),
    ]
  })
}

const tree = computed(() => describe(nodes.value).join("\n"))
</script>
