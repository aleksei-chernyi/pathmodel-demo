<template>
  <div ref="host" class="pg-editor"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import { EditorView, basicSetup } from "codemirror"
import { keymap } from "@codemirror/view"
import { indentWithTab } from "@codemirror/commands"
import { javascript } from "@codemirror/lang-javascript"

const model = defineModel<string>({ required: true })
const host = ref<HTMLElement | null>(null)
let view: EditorView | null = null

onMounted(() => {
  view = new EditorView({
    parent: host.value!,
    doc: model.value,
    extensions: [
      basicSetup,
      keymap.of([indentWithTab]),
      javascript({ typescript: true }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) model.value = update.state.doc.toString()
      }),
    ],
  })
})

// Replace the document when the code changes from outside (e.g. an example is picked).
watch(model, (code) => {
  if (view && code !== view.state.doc.toString()) {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } })
  }
})

onBeforeUnmount(() => view?.destroy())
</script>
