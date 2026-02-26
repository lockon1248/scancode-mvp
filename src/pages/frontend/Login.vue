<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-4 shadow-lg">
          <Shield class="w-9 h-9 text-white" />
        </div>
        <h1 class="text-3xl text-white mb-2">雲力橘子</h1>
        <p class="text-slate-300">資安檢測平台</p>
      </div>

      <!-- Login Form -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h2 class="text-2xl mb-6 text-slate-800">登入您的帳號</h2>
        
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm text-slate-700 mb-2">
              電子信箱
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                v-model="email"
                type="email"
                class="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label class="block text-sm text-slate-700 mb-2">
              密碼
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                v-model="password"
                type="password"
                class="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center text-slate-600">
              <input type="checkbox" class="mr-2 rounded" />
              記住我
            </label>
            <router-link to="/forgot-password" class="text-brand-600 hover:text-brand-700">
              忘記密碼？
            </router-link>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group"
          >
            {{ isSubmitting ? '登入中...' : '登入' }}
            <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        </form>

        <div class="mt-6 pt-6 border-t border-slate-200 text-center text-sm text-slate-600">
          需要申請帳號？請聯繫業務人員
        </div>

        <div class="mt-4 text-center">
          <router-link to="/admin" class="text-sm text-slate-500 hover:text-slate-700">
            後台管理入口
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
import { loginFrontend } from '@/services/state/frontendSession';

const router = useRouter();
const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  errorMessage.value = '';
  isSubmitting.value = true;
  try {
    await loginFrontend(email.value, password.value);
    router.push('/dashboard');
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '登入失敗，請稍後再試';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
