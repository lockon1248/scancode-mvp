<template>
  <div ref="rootRef" :class="wrapperClass">
    <button
      type="button"
      :disabled="disabled"
      :class="triggerClass"
      @click="toggleOpen"
    >
      <span class="truncate">{{ selectedLabel }}</span>
      <ChevronDown
        :class="[
          'h-4 w-4 text-slate-700 transition-transform',
          open ? 'rotate-180' : ''
        ]"
      />
    </button>

    <div
      v-if="open"
      class="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-120 max-h-60 overflow-auto rounded-2xl border border-slate-300 bg-white p-1 shadow-lg"
    >
      <button
        v-for="option in options"
        :key="String(option.value)"
        type="button"
        class="w-full rounded-xl px-3 py-2 text-left text-sm transition-colors"
        :class="option.value === modelValue ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-slate-100'"
        @click="selectOption(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

type SelectOption = {
  label: string;
  value: string | number;
};

const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    options: SelectOption[];
    disabled?: boolean;
    fullWidth?: boolean;
    castNumber?: boolean;
  }>(),
  {
    disabled: false,
    fullWidth: false,
    castNumber: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);

const wrapperClass = computed(() => (props.fullWidth ? 'relative w-full' : 'relative inline-block'));

const triggerClass = computed(() => [
  'flex h-12 items-center justify-between rounded-2xl border border-slate-300 bg-white pl-5 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-100',
  props.fullWidth ? 'w-full' : 'min-w-[160px]',
]);

const selectedLabel = computed(() => {
  return props.options.find(option => option.value === props.modelValue)?.label ?? '';
});

const toggleOpen = () => {
  if (props.disabled) return;
  open.value = !open.value;
};

const selectOption = (value: string | number) => {
  if (props.disabled) return;
  emit('update:modelValue', props.castNumber ? Number(value) : value);
  open.value = false;
};

const onDocumentClick = (event: MouseEvent) => {
  if (!rootRef.value) return;
  if (!rootRef.value.contains(event.target as Node)) {
    open.value = false;
  }
};

const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    open.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onEscape);
});
</script>
