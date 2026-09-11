<script setup lang="ts">
const { pending, answer } = useConfirm()
const dialog = ref<HTMLDialogElement>()
watch(pending, (p) => (p ? dialog.value?.showModal() : dialog.value?.close()))
</script>

<template>
  <dialog
    ref="dialog"
    class="sheet"
    aria-labelledby="confirm-title"
    @close="answer(false)"
    @click.self="answer(false)"
  >
    <div v-if="pending" class="dlg !w-[min(420px,calc(100%-32px))] !mt-[24vh] p-5">
      <h2 id="confirm-title" class="serif text-[18px] leading-snug">{{ pending.title }}</h2>
      <p v-if="pending.detail" class="mt-2 text-[13.5px] text-muted">{{ pending.detail }}</p>
      <div class="mt-5 flex justify-end gap-2">
        <button class="btn" autofocus @click="answer(false)">Cancel</button>
        <button class="btn btn-solid" @click="answer(true)">{{ pending.action }}</button>
      </div>
    </div>
  </dialog>
</template>
