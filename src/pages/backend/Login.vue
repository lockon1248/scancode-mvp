<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-2xl mb-4 shadow-lg border border-slate-600">
          <Shield class="w-9 h-9 text-brand-400" />
        </div>
        <h1 class="text-3xl text-white mb-2">後台管理系統</h1>
        <p class="text-slate-400">雲力橘子資安檢測平台</p>
      </div>

      <!-- Login Form -->
      <div class="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <h2 class="text-2xl mb-6 text-white">管理員登入</h2>
        
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm text-slate-300 mb-2">
              電子信箱
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                v-model="email"
                type="email"
                class="w-full pl-11 pr-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-slate-500"
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label class="block text-sm text-slate-300 mb-2">
              密碼
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                v-model="password"
                type="password"
                class="w-full pl-11 pr-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-slate-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group"
          >
            登入後台
            <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        <p v-if="errorMessage" class="mt-4 text-sm text-red-300">{{ errorMessage }}</p>
        <p class="mt-4 text-xs text-slate-400">
          測試帳號：adm@orange.com / 123（管理員）、sales@orange.com / 123（業務）、sales.lidaming@orange.com / 123（業務-李大明）、pm@orange.com / 123（PM）
        </p>

        <div class="mt-6 text-center">
          <router-link to="/" class="text-sm text-slate-400 hover:text-slate-300">
            返回前台登入
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-vue-next';
import { loginBackend } from '@/services/state/backendSession';

const router = useRouter();
const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  errorMessage.value = '';
  try {
    isSubmitting.value = true;
    const session = await loginBackend(email.value, password.value);
    if (session.role === 'sales' || session.role === 'pm') {
      router.push('/admin/applications');
      return;
    }
    router.push('/admin/dashboard');
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '登入失敗';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
