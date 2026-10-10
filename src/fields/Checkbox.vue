<template>
  <label class="pg-field pg-field--inline">
    <input
      type="checkbox"
      :checked="Boolean(node.getValue())"
      @change="node.setValue(($event.target as HTMLInputElement).checked)"
    />
    <span class="pg-field__label">
      {{ fieldProps.label ?? node.name }}<b v-if="node.isRequired()">*</b>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { FieldNode } from "@aleksei-chernyi/pathmodel"

const props = defineProps<{ node: FieldNode }>()
const fieldProps = computed(() => props.node.getProps() as Record<string, any>)
</script>
