<template>
  <label class="pg-field">
    <span class="pg-field__label">
      {{ fieldProps.label ?? node.name }}<b v-if="node.isRequired()">*</b>
    </span>
    <select
      class="pg-input"
      :class="{ 'pg-input--error': hasError }"
      :value="node.getValue() ?? ''"
      @change="onChange"
    >
      <option value="">—</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { FieldNode } from "@aleksei-chernyi/pathmodel"

/** `props.options`: strings, or `{ value, label }` objects. */
const props = defineProps<{ node: FieldNode; hasError?: boolean }>()
const fieldProps = computed(() => props.node.getProps() as Record<string, any>)

const options = computed(() =>
  ((fieldProps.value.options ?? []) as Array<string | { value: string; label: string }>).map(
    (option) => (typeof option === "string" ? { value: option, label: option } : option)
  )
)

const onChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  props.node.setValue(value === "" ? null : value)
}
</script>
