import { ref } from 'vue';

export type AppMessageType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface AppMessageItem {
  id: number;
  type: AppMessageType;
  content: string;
}

const messages = ref<AppMessageItem[]>([]);
let seq = 0;
const timers = new Map<number, number>();

const remove = (id: number) => {
  messages.value = messages.value.filter(item => item.id !== id);
  const timer = timers.get(id);
  if (timer) {
    window.clearTimeout(timer);
    timers.delete(id);
  }
};

const open = (params: {
  type?: AppMessageType;
  content: string;
  duration?: number;
}) => {
  const id = ++seq;
  const type = params.type ?? 'info';
  const duration = params.duration ?? 2200;

  messages.value = [...messages.value, { id, type, content: params.content }];
  if (messages.value.length > 5) {
    const first = messages.value[0];
    if (first) remove(first.id);
  }

  if (duration > 0) {
    const timer = window.setTimeout(() => remove(id), duration);
    timers.set(id, timer);
  }

  return () => remove(id);
};

export const useAppMessage = () => {
  return {
    open,
    success: (content: string, duration?: number) => open({ type: 'success', content, duration }),
    error: (content: string, duration?: number) => open({ type: 'error', content, duration }),
    info: (content: string, duration?: number) => open({ type: 'info', content, duration }),
    warning: (content: string, duration?: number) => open({ type: 'warning', content, duration }),
    loading: (content: string) => open({ type: 'loading', content, duration: 0 }),
    destroy: remove,
    clearAll: () => {
      const ids = messages.value.map(item => item.id);
      ids.forEach(remove);
    },
  };
};

export const useAppMessageState = () => messages;
