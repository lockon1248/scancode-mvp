<template>
  <div class="min-h-screen bg-slate-100">
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 bg-black/50 z-40 md:hidden"
      @click="mobileMenuOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-50 transform transition-transform duration-200 ease-out',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0'
      ]"
    >
      <!-- Logo -->
      <div class="p-6 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center">
            <Shield class="w-6 h-6 text-white" />
          </div>
          <div>
            <div class="text-white">後台管理</div>
            <div class="text-xs text-slate-400">雲力橘子</div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="p-4">
        <div class="space-y-1">
          <button
            v-for="item in menuItems"
            :key="item.path"
            @click="handleNavigate(item.path)"
            :class="[
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              route.path === item.path
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </button>
        </div>
      </nav>

      <!-- User Section -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
              <span class="text-white text-sm">{{ sessionUser?.name?.slice(0, 1) || '後' }}</span>
            </div>
            <div>
              <div class="text-white text-sm">{{ sessionUser?.name || '未登入' }}</div>
              <div class="text-xs text-slate-400">{{ roleLabel }}</div>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="登出"
          >
            <LogOut class="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="md:ml-64">
      <!-- Header -->
      <header class="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div class="px-4 py-3 md:px-8 md:py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button
                class="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                @click="mobileMenuOpen = true"
                aria-label="開啟選單"
              >
                <Menu class="w-5 h-5" />
              </button>
              <h1 class="text-lg md:text-2xl text-slate-900">
                {{ currentPageTitle }}
              </h1>
            </div>
            <div class="hidden sm:flex items-center gap-3">
              <div class="relative" ref="notificationRootRef">
                <button
                  type="button"
                  class="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  @click="toggleNotifications"
                  aria-label="開啟通知"
                >
                  <Bell class="w-5 h-5" />
                  <span
                    v-if="unreadNotificationCount > 0"
                    class="absolute -right-0.5 -top-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center"
                  >
                    {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
                  </span>
                </button>

                <div
                  v-if="notificationOpen"
                  class="absolute right-0 mt-2 w-[360px] max-w-[80vw] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div class="text-sm text-slate-800">通知中心</div>
                    <button
                      type="button"
                      class="text-xs text-brand-600 hover:text-brand-700 cursor-pointer"
                      @click="refreshNotifications"
                    >
                      重新整理
                    </button>
                  </div>
                  <div v-if="isNotificationLoading" class="px-4 py-5 text-sm text-slate-500">
                    載入通知中...
                  </div>
                  <div v-else-if="notifications.length === 0" class="px-4 py-5 text-sm text-slate-500">
                    目前沒有通知
                  </div>
                  <div v-else class="max-h-96 overflow-y-auto">
                    <div
                      v-for="notice in notifications"
                      :key="notice.id"
                      class="px-4 py-3 border-b border-slate-100 last:border-b-0"
                    >
                      <div class="text-sm text-slate-900">{{ notice.title }}</div>
                      <div class="text-xs text-slate-600 mt-1">{{ notice.content }}</div>
                      <div class="text-xs text-slate-400 mt-2">{{ notice.timeText }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-sm text-slate-600">
                {{ currentDate }}
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 md:p-8">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Shield, LayoutDashboard, Users, FileCheck, Lock, Coins, LogOut, Menu, Bell } from 'lucide-vue-next';
import { listBackendApplications, type BackendApplication } from '@/services/mock-api/backendApplicationsApi';
import { getStoredBackendSession, logoutBackend } from '../services/state/backendSession';

const router = useRouter();
const route = useRoute();
const mobileMenuOpen = ref(false);
const sessionUser = getStoredBackendSession();
const notificationOpen = ref(false);
const notificationRootRef = ref<HTMLElement | null>(null);
const notifications = ref<Array<{ id: string; title: string; content: string; timeText: string; createdAtMs: number }>>([]);
const isNotificationLoading = ref(false);
const pollHandle = ref<number | null>(null);
const NOTIFICATION_SEEN_KEY = 'backend_notification_seen_at_v1';

const allMenuItems = [
  { icon: LayoutDashboard, label: '儀表板', path: '/admin/dashboard' },
  { icon: Users, label: '客戶管理', path: '/admin/customers' },
  { icon: FileCheck, label: '帳號申請', path: '/admin/applications' },
  { icon: Coins, label: '點數儲值申請', path: '/admin/topup-requests' },
  { icon: Lock, label: '權限管理', path: '/admin/permissions' },
  { icon: Coins, label: '點數管理', path: '/admin/credits' },
];

const menuItems = computed(() => {
  if (sessionUser?.role === 'pm') {
    return allMenuItems.filter(item => item.path === '/admin/applications' || item.path === '/admin/topup-requests');
  }
  if (sessionUser?.role === 'sales') {
    return allMenuItems.filter(item =>
      item.path === '/admin/applications' || item.path === '/admin/customers' || item.path === '/admin/topup-requests'
    );
  }
  return allMenuItems;
});

const currentPageTitle = computed(() => {
  const item = allMenuItems.find(i => route.path.startsWith(i.path));
  return item?.label || '後台管理';
});

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
});

const roleLabel = computed(() => {
  if (sessionUser?.role === 'adm') return '系統管理員';
  if (sessionUser?.role === 'pm') return 'PDM';
  return '業務';
});

const parseDateToMs = (text?: string): number => {
  if (!text) return 0;
  const m = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!m) return 0;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = Number(m[4] ?? '0');
  const minute = Number(m[5] ?? '0');
  const second = Number(m[6] ?? '0');
  return new Date(year, month, day, hour, minute, second).getTime();
};

const getSeenAtMs = () => {
  if (!sessionUser) return 0;
  const raw = localStorage.getItem(NOTIFICATION_SEEN_KEY);
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return Number(parsed[sessionUser.id] || 0);
  } catch {
    return 0;
  }
};

const setSeenAtMs = (seenAtMs: number) => {
  if (!sessionUser) return;
  const raw = localStorage.getItem(NOTIFICATION_SEEN_KEY);
  let parsed: Record<string, number> = {};
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, number>;
    } catch {
      parsed = {};
    }
  }
  parsed[sessionUser.id] = seenAtMs;
  localStorage.setItem(NOTIFICATION_SEEN_KEY, JSON.stringify(parsed));
};

const buildPmNotifications = (apps: BackendApplication[]) => {
  return apps
    .filter(app => app.status === 'pending')
    .map(app => {
      const createdAtMs = parseDateToMs(app.submittedDate);
      return {
        id: `pm-pending-${app.id}`,
        title: '有新的待審核申請',
        content: `${app.id}｜${app.company}（${app.type === 'user_addition' ? '個人申請' : '公司申請'}）`,
        timeText: app.submittedDate,
        createdAtMs,
      };
    });
};

const buildSalesNotifications = (apps: BackendApplication[]) => {
  if (!sessionUser) return [] as Array<{ id: string; title: string; content: string; timeText: string; createdAtMs: number }>;
  const marker = `- ${sessionUser.name}`;
  return apps
    .filter(app => app.status === 'rejected' && app.submittedBy.includes(marker))
    .map(app => {
      const timeText = app.rejectedDate || app.submittedDate;
      const createdAtMs = parseDateToMs(timeText);
      const subject =
        app.type === 'user_addition'
          ? `${app.company}｜申請人：${app.applicant}`
          : app.company;
      return {
        id: `sales-rejected-${app.id}`,
        title: '審核未通過',
        content: `${app.id}｜${subject}${app.rejectionReason ? `：${app.rejectionReason}` : ''}`,
        timeText,
        createdAtMs,
      };
    });
};

const buildAdmNotifications = (apps: BackendApplication[]) => {
  const pending = buildPmNotifications(apps);
  const rejected = apps
    .filter(app => app.status === 'rejected')
    .map(app => {
      const timeText = app.rejectedDate || app.submittedDate;
      const createdAtMs = parseDateToMs(timeText);
      const subject =
        app.type === 'user_addition'
          ? `${app.company}｜申請人：${app.applicant}`
          : app.company;
      return {
        id: `adm-rejected-${app.id}`,
        title: '有申請被拒絕',
        content: `${app.id}｜${subject}${app.rejectionReason ? `：${app.rejectionReason}` : ''}`,
        timeText,
        createdAtMs,
      };
    });
  return [...pending, ...rejected];
};

const refreshNotifications = async () => {
  if (!sessionUser) return;
  isNotificationLoading.value = true;
  try {
    const apps = await listBackendApplications();
    let next: Array<{ id: string; title: string; content: string; timeText: string; createdAtMs: number }> = [];
    if (sessionUser.role === 'pm') {
      next = buildPmNotifications(apps);
    } else if (sessionUser.role === 'sales') {
      next = buildSalesNotifications(apps);
    } else {
      next = buildAdmNotifications(apps);
    }
    notifications.value = next.sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, 12);
  } finally {
    isNotificationLoading.value = false;
  }
};

const unreadNotificationCount = computed(() => {
  const seenAtMs = getSeenAtMs();
  return notifications.value.filter(item => item.createdAtMs > seenAtMs).length;
});

const toggleNotifications = async () => {
  notificationOpen.value = !notificationOpen.value;
  if (notificationOpen.value) {
    await refreshNotifications();
    setSeenAtMs(Date.now());
  }
};

const handleWindowClick = (event: MouseEvent) => {
  if (!notificationOpen.value) return;
  const target = event.target as Node | null;
  if (!target) return;
  if (!notificationRootRef.value?.contains(target)) {
    notificationOpen.value = false;
  }
};

const handleNavigate = (path: string) => {
  router.push(path);
  mobileMenuOpen.value = false;
};

const handleLogout = () => {
  mobileMenuOpen.value = false;
  logoutBackend();
  router.push('/admin');
};

watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false;
    notificationOpen.value = false;
    void refreshNotifications();
  }
);

onMounted(() => {
  void refreshNotifications();
  pollHandle.value = window.setInterval(() => {
    void refreshNotifications();
  }, 20000);
  window.addEventListener('click', handleWindowClick);
});

onBeforeUnmount(() => {
  if (pollHandle.value) {
    window.clearInterval(pollHandle.value);
    pollHandle.value = null;
  }
  window.removeEventListener('click', handleWindowClick);
});
</script>
