<template>
  <div class="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-3">
    <TransitionGroup name="msg">
      <div
        v-for="item in messageList"
        :key="item.id"
        :class="containerClass(item.type)"
        class="pointer-events-auto w-full max-w-xl rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm"
      >
        <div class="flex items-center gap-2 text-sm">
          <component :is="iconOf(item.type)" class="h-4 w-4 shrink-0" />
          <span>{{ item.content }}</span>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CheckCircle2, CircleAlert, Info, LoaderCircle, TriangleAlert } from 'lucide-vue-next';
import type { AppMessageType } from '@/services/state/appMessage';
import { useAppMessageState } from '@/services/state/appMessage';

const state = useAppMessageState();
const messageList = computed(() => state.value);

const iconOf = (type: AppMessageType) => {
  if (type === 'success') return CheckCircle2;
  if (type === 'error') return CircleAlert;
  if (type === 'warning') return TriangleAlert;
  if (type === 'loading') return LoaderCircle;
  return Info;
};

const containerClass = (type: AppMessageType) => {
  if (type === 'success') return 'border-green-200 bg-green-50 text-green-800';
  if (type === 'error') return 'border-red-200 bg-red-50 text-red-800';
  if (type === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (type === 'loading') return 'border-brand-200 bg-brand-50 text-brand-800';
  return 'border-blue-200 bg-blue-50 text-blue-800';
};
</script>

<style scoped>
.msg-enter-active,
.msg-leave-active {
  transition: all 0.2s ease;
}

.msg-enter-from,
.msg-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
