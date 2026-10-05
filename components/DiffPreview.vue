<script setup lang="ts">
import type { DiffOp } from '../domain/writing/diff'

defineProps<{ ops: DiffOp[] }>()
</script>

<template>
  <p class="diff-text">
    <template v-for="(op, index) in ops" :key="index">
      <ins v-if="op.type === 'add'" class="diff-add">{{ op.text }}</ins>
      <del v-else-if="op.type === 'remove'" class="diff-remove">{{ op.text }}</del>
      <span v-else>{{ op.text }}</span>
    </template>
  </p>
</template>
