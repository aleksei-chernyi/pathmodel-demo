<template>
  <label class="pg-field">
    <span class="pg-field__label">
      {{ fieldProps.label ?? node.name }}<b v-if="node.isRequired()">*</b>
    </span>
    <input
      class="pg-input"
      :class="{ 'pg-input--error': hasError }"
      type="number"
      :min="fieldProps.min"
      :max="fieldProps.max"
      :value="node.getValue() ?? ''"
      @input="onInput"
    />
  </label>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { FieldNode } from "@aleksei-chernyi/pathmodel"

const props = defineProps<{ node: FieldNode; hasError?: boolean }>()
const fieldProps = computed(() => props.node.getProps() as Record<string, any>)

const onInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value
  props.node.setValue(raw === "" ? null : Number(raw))
}
</script>
