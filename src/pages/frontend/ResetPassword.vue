<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
      <h1 class="text-2xl text-slate-900 mb-2">重設密碼</h1>

      <p v-if="isValidating" class="text-sm text-slate-600">驗證連結中...</p>

      <template v-else-if="tokenInfo">
        <p class="text-sm text-slate-600 mb-6">
          帳號：{{ tokenInfo.email }}<br />
          連結有效至：{{ tokenInfo.expiresAtText }}
        </p>

        <form @submit.prevent="handleReset" class="space-y-4">
          <div>
            <label class="block text-sm text-slate-700 mb-2">新密碼</label>
            <input
              v-model="newPassword"
              type="password"
              required
              minlength="8"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="至少 8 碼"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-700 mb-2">確認新密碼</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              minlength="8"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full px-4 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300"
          >
            {{ isSubmitting ? '更新中...' : '更新密碼' }}
          </button>
        </form>
      </template>

      <p v-if="successMessage" class="mt-4 text-sm text-green-600">{{ successMessage }}</p>
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
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatDisplayDateTime } from '@/services/mock-api/core';
import { resetPasswordByToken, validateResetToken } from '@/services/mock-api/passwordResetApi';

const route = useRoute();
const router = useRouter();
const token = String(route.params.token || '');

const isValidating = ref(true);
const isSubmitting = ref(false);
const tokenInfo = ref<{ email: string; expiresAtText: string } | null>(null);

const newPassword = ref('');
const confirmPassword = ref('');
const successMessage = ref('');
const errorMessage = ref('');

const loadTokenInfo = async () => {
  isValidating.value = true;
  errorMessage.value = '';
  try {
    const info = await validateResetToken(token);
    tokenInfo.value = {
      email: info.email,
      expiresAtText: formatDisplayDateTime(info.expiresAt),
    };
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '連結驗證失敗';
    tokenInfo.value = null;
  } finally {
    isValidating.value = false;
  }
};

const handleReset = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '新密碼與確認密碼不一致';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await resetPasswordByToken(token, newPassword.value);
    successMessage.value = '密碼已更新，3 秒後返回登入頁';
    setTimeout(() => router.push('/'), 3000);
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '更新失敗';
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(loadTokenInfo);
</script>
