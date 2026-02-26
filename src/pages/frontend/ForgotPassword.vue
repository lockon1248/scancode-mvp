<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
      <h1 class="text-2xl text-slate-900 mb-2">忘記密碼</h1>
      <p class="text-sm text-slate-600 mb-6">
        輸入您的 Email，我們會產生重設連結
      </p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm text-slate-700 mb-2">電子信箱</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="you@company.com"
          />
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full px-4 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300"
        >
          {{ isSubmitting ? '送出中...' : '送出重設申請' }}
        </button>
      </form>

      <div v-if="resetInfo" class="mt-5 p-4 rounded-lg bg-brand-50 border border-brand-200 text-sm">
        <div class="text-slate-700 mb-1">模擬重設連結：</div>
        <router-link class="text-brand-700 underline break-all" :to="`/reset-password/${resetInfo.token}`">
          {{ `${origin}/reset-password/${resetInfo.token}` }}
        </router-link>
        <div class="text-xs text-slate-500 mt-2">有效期限至：{{ resetInfo.expiresAtText }}</div>
      </div>

      <p v-if="errorMessage" class="mt-4 text-sm text-red-600">{{ errorMessage }}</p>

      <div class="mt-6 text-center">
        <router-link to="/" class="text-sm text-slate-600 hover:text-slate-800 underline">
          返回登入
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { requestPasswordReset } from '@/services/mock-api/passwordResetApi';
import { formatDisplayDateTime } from '@/services/mock-api/core';

const email = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');
const resetInfo = ref<{ token: string; expiresAtText: string } | null>(null);
const origin = computed(() => window.location.origin);

const handleSubmit = async () => {
  isSubmitting.value = true;
  errorMessage.value = '';
  resetInfo.value = null;
  try {
    const result = await requestPasswordReset(email.value);
    resetInfo.value = {
      token: result.token,
      expiresAtText: formatDisplayDateTime(result.expiresAt),
    };
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '送出失敗';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
