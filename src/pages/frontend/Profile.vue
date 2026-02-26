<template>
  <FrontendLayout>
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl mb-2">帳號設定</h1>
        <p class="text-slate-600">管理您的個人資料與帳號資訊</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column - Personal Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Personal Information -->
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="text-xl mb-4 flex items-center gap-2">
              <User class="w-5 h-5" />
              個人資料
            </h2>
            <form @submit.prevent="handleSave" class="space-y-4">
              <div>
                <label class="block text-sm text-slate-700 mb-2">姓名</label>
                <input
                  v-model="name"
                  type="text"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label class="block text-sm text-slate-700 mb-2">電子信箱</label>
                <input
                  v-model="email"
                  type="email"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label class="block text-sm text-slate-700 mb-2">聯絡電話</label>
                <input
                  v-model="phone"
                  type="tel"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                class="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-2"
              >
                <Save class="w-4 h-4" />
                儲存變更
              </button>
            </form>
          </div>

          <!-- Password Change -->
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="text-xl mb-4 flex items-center gap-2">
              <Key class="w-5 h-5" />
              變更密碼
            </h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-slate-700 mb-2">目前密碼</label>
                <input
                  v-model="currentPassword"
                  type="password"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label class="block text-sm text-slate-700 mb-2">新密碼</label>
                <input
                  v-model="newPassword"
                  type="password"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label class="block text-sm text-slate-700 mb-2">確認新密碼</label>
                <input
                  v-model="confirmPassword"
                  type="password"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                @click="handleChangePassword"
                class="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                更新密碼
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column - Company Info & Permissions -->
        <div class="space-y-6">
          <!-- Company Info -->
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="text-xl mb-4 flex items-center gap-2">
              <Building2 class="w-5 h-5" />
              公司資訊
            </h2>
            <div class="space-y-3 text-sm">
              <div>
                <div class="text-slate-600 mb-1">公司名稱</div>
                <div class="text-slate-900">{{ company?.name || '-' }}</div>
              </div>
              <div>
                <div class="text-slate-600 mb-1">統一編號</div>
                <div class="text-slate-900">{{ company?.taxId || '-' }}</div>
              </div>
              <div>
                <div class="text-slate-600 mb-1">帳號類型</div>
                <div class="text-slate-900">{{ company?.accountType || '-' }}</div>
              </div>
            </div>
          </div>

          <!-- Permissions -->
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="text-xl mb-4 flex items-center gap-2">
              <Shield class="w-5 h-5" />
              我的權限
            </h2>
            <div class="space-y-2">
              <div
                v-for="perm in permissions"
                :key="perm.name"
                class="flex items-center justify-between py-2"
              >
                <span class="text-sm text-slate-700">{{ perm.name }}</span>
                <span
                  :class="perm.enabled ? 'text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full' : 'text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full'"
                >
                  {{ perm.enabled ? '啟用' : '停用' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Credits Display -->
          <div class="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-6 text-white">
            <div class="flex items-center gap-2 mb-2">
              <Coins class="w-5 h-5" />
              <h2 class="text-lg">可用點數</h2>
            </div>
            <div class="text-4xl mb-1">{{ (company?.credits ?? 0).toLocaleString() }}</div>
            <p class="text-brand-100 text-sm">公司共用點數池</p>
          </div>
        </div>
      </div>
      <p v-if="feedbackMessage" class="text-sm text-green-600">{{ feedbackMessage }}</p>
      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

      <!-- Credit History -->
      <div class="bg-white rounded-xl border border-slate-200">
        <div class="p-6 border-b border-slate-200">
          <h2 class="text-xl flex items-center gap-2">
            <History class="w-5 h-5" />
            點數使用記錄
          </h2>
        </div>
        <div class="divide-y divide-slate-200">
          <div
            v-for="(record, index) in creditHistory"
            :key="index"
            class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div>
              <div class="text-sm text-slate-900 mb-1">{{ record.description }}</div>
              <div class="text-xs text-slate-500">{{ record.date }}</div>
            </div>
            <div :class="record.amount > 0 ? 'text-lg text-green-600' : 'text-lg text-red-600'">
              {{ record.amount > 0 ? '+' : '' }}{{ record.amount }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </FrontendLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import FrontendLayout from '@/components/FrontendLayout.vue';
import { User, Building2, Shield, Key, Save, History, Coins } from 'lucide-vue-next';
import { changeFrontendPassword, updateFrontendProfile } from '@/services/mock-api/authApi';
import { formatDisplayDateTime } from '@/services/mock-api/core';
import { listCompanyCreditTransactions } from '@/services/mock-api/scanApi';
import { useFrontendSession } from '@/services/state/frontendSession';

const { sessionUser, sessionCompany, refreshFrontendSession } = useFrontendSession();
const name = ref('');
const email = ref('');
const phone = ref('');

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const feedbackMessage = ref('');
const errorMessage = ref('');

const company = computed(() => sessionCompany.value);
const permissions = computed(() => {
  const p = sessionUser.value?.permissions;
  if (!p) return [];
  return [
    { name: '上傳程式碼', enabled: p.uploadCode },
    { name: '下載報告', enabled: p.downloadReport },
    { name: '查看掃描記錄', enabled: p.viewHistory },
  ];
});

const creditHistory = ref<Array<{ date: string; amount: number; description: string }>>([]);

const loadData = async () => {
  if (!sessionUser.value || !sessionCompany.value) return;
  name.value = sessionUser.value.name;
  email.value = sessionUser.value.email;
  phone.value = sessionUser.value.phone;
  const tx = await listCompanyCreditTransactions(sessionCompany.value.id);
  creditHistory.value = tx.map(t => ({
    date: formatDisplayDateTime(t.date),
    amount: t.amount,
    description: t.description,
  }));
};

const handleSave = async () => {
  if (!sessionUser.value) return;
  errorMessage.value = '';
  feedbackMessage.value = '';
  try {
    await updateFrontendProfile(sessionUser.value.id, {
      name: name.value,
      email: email.value,
      phone: phone.value,
    });
    await refreshFrontendSession();
    feedbackMessage.value = '個人資料已更新';
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '更新失敗';
  }
};

const handleChangePassword = async () => {
  if (!sessionUser.value) return;
  errorMessage.value = '';
  feedbackMessage.value = '';
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '新密碼與確認密碼不一致';
    return;
  }
  try {
    await changeFrontendPassword(sessionUser.value.id, currentPassword.value, newPassword.value);
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    feedbackMessage.value = '密碼已更新';
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '更新密碼失敗';
  }
};

onMounted(loadData);
</script>
