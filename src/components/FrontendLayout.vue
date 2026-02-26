<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between min-h-16 py-3 sm:h-16 sm:py-0 gap-3">
          <!-- Logo -->
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <div class="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center">
              <Shield class="w-6 h-6 text-white" />
            </div>
            <div class="min-w-0">
              <div class="text-base sm:text-lg text-slate-900 truncate">雲力橘子</div>
              <div class="text-xs text-slate-500 hidden sm:block">資安檢測平台</div>
            </div>
          </div>

          <!-- Right Section -->
          <div class="flex items-center gap-2 sm:gap-4">
            <!-- Credits Display -->
            <div class="flex items-center gap-2 px-2 sm:px-4 py-2 bg-brand-50 rounded-lg border border-brand-200">
              <Coins class="w-4 h-4 sm:w-5 sm:h-5 text-brand-600" />
              <div>
                <div class="text-xs text-slate-600 hidden sm:block">可用點數</div>
                <div class="text-sm text-slate-900">{{ displayCredits.toLocaleString() }}</div>
              </div>
            </div>

            <!-- User Info -->
            <div class="flex items-center gap-3">
              <div class="text-right hidden sm:block">
                <div class="text-sm text-slate-900">{{ displayName }}</div>
                <div class="text-xs text-slate-500">{{ displayCompany }}</div>
              </div>
              <button
                @click="handleLogout"
                class="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="登出"
              >
                <LogOut class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="bg-white border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div class="flex gap-1 overflow-x-auto">
          <button
            v-for="item in menuItems"
            :key="item.path"
            @click="router.push(item.path)"
            :class="[
              'flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 transition-colors whitespace-nowrap',
              route.path === item.path
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            ]"
          >
            <component :is="item.icon" class="w-4 h-4" />
            <span class="text-sm">{{ item.label }}</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Shield, Upload, History, User, LogOut, Coins } from 'lucide-vue-next';
import { useFrontendSession } from '../services/state/frontendSession';

const router = useRouter();
const route = useRoute();
const { sessionUser, sessionCompany, logoutFrontend } = useFrontendSession();

const displayName = computed(() => sessionUser.value?.name ?? '使用者');
const displayCompany = computed(() => sessionCompany.value?.name ?? '尚未載入公司');
const displayCredits = computed(() => sessionCompany.value?.credits ?? 0);

const menuItems = computed(() => {
  const items = [
    { icon: Upload, label: '儀表板', path: '/dashboard' },
    { icon: History, label: '掃描記錄', path: '/history' },
    { icon: User, label: '帳號設定', path: '/profile' },
  ];

  if (sessionUser.value?.permissions.uploadCode) {
    items.splice(1, 0, { icon: Upload, label: '程式碼掃描', path: '/scan' });
  }

  return items;
});

const handleLogout = () => {
  logoutFrontend();
  router.push('/');
};
</script>
