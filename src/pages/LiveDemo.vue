<template>
  <div class="live">
    <div class="live__form">
      <SchemaRenderer v-if="form" :nodes="nodes" :root="form" />
      <div class="live__actions">
        <button class="pg-button pg-button--primary" @click="validate">Validate</button>
        <span v-if="result" class="pg-badge" :class="result">
          {{ result === "valid" ? "Valid" : "Has errors" }}
        </span>
      </div>
    </div>
    <div class="live__value">
      <div class="live__label">getFormValue()</div>
      <pre>{{ JSON.stringify(form?.getFormValue() ?? {}, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, shallowRef, watch } from "vue"
import SchemaRenderer from "@aleksei-chernyi/pathmodel/src/template/SchemaRenderer.vue"
import { FormBase, SomeNode } from "@aleksei-chernyi/pathmodel"
import { run } from "../playground/runner"

const props = defineProps<{ code: string }>()

const form = shallowRef<FormBase | null>(null)
const nodes = shallowRef<SomeNode[]>([])
const result = ref<"valid" | "invalid" | null>(null)

const instance = reactive(run(props.code)) as FormBase
nodes.value = instance.buildSchema()
form.value = instance

watch(
  () => form.value?.getFormValue(),
  () => (result.value = null),
  { deep: true }
)

async function validate() {
  result.value = (await form.value!.validate()) ? "valid" : "invalid"
}
</script>
