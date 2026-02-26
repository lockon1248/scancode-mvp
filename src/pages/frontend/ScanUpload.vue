<template>
  <FrontendLayout>
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl mb-2">程式碼安全掃描</h1>
        <p class="text-slate-600">上傳您的程式碼檔案進行安全檢測，每次掃描扣 1 點</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- File Upload Area -->
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <label class="block text-sm text-slate-700 mb-3">
            上傳檔案 <span class="text-red-500">*</span>
          </label>
          
          <div
            v-if="!selectedFile"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
            :class="[
              'border-2 border-dashed rounded-xl p-12 text-center transition-colors',
              isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400'
            ]"
          >
            <Upload class="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p class="text-slate-700 mb-2">拖放檔案至此，或點擊選擇檔案</p>
            <p class="text-sm text-slate-500 mb-4">支援 .zip, .tar.gz 格式，最大 500MB</p>
            <label class="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 cursor-pointer transition-colors">
              選擇檔案
              <input
                type="file"
                class="hidden"
                accept=".zip,.tar.gz"
                @change="handleFileSelect"
              />
            </label>
          </div>

          <div v-else class="border-2 border-green-200 bg-green-50 rounded-xl p-6">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <File class="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div class="text-slate-900 mb-1">{{ selectedFile.name }}</div>
                  <div class="text-sm text-slate-600">
                    {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                  </div>
                </div>
              </div>
              <button
                type="button"
                @click="selectedFile = null"
                class="text-slate-500 hover:text-slate-700"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Scan Details -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label class="block text-sm text-slate-700 mb-2">
              掃描名稱 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="scanName"
              type="text"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="例如：Payment Service v2.3"
              required
            />
          </div>

          <div>
            <label class="block text-sm text-slate-700 mb-2">
              描述（選填）
            </label>
            <textarea
              v-model="description"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              rows="3"
              placeholder="簡述此次掃描的目的或版本資訊"
            />
          </div>
        </div>

        <!-- Info Box -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div class="flex gap-3">
            <AlertCircle class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-blue-900">
              <p class="mb-2">掃描說明：</p>
              <ul class="list-disc list-inside space-y-1 text-blue-800">
                <li>每次掃描扣 1 點</li>
                <li>掃描作業需要約 24 小時完成</li>
                <li>完成後可下載 HTML 或 PDF 格式報告</li>
                <li>請確保上傳的程式碼已移除敏感資訊</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="text-sm text-slate-600">
            此次掃描將扣除 <span class="text-brand-600">{{ scanCost }} 點數</span>，目前剩餘 <span class="text-brand-600">{{ availableCredits.toLocaleString() }} 點</span>
          </div>
          <button
            type="submit"
            :disabled="!selectedFile || !scanName || isSubmitting || !canUpload || availableCredits < scanCost"
            class="px-8 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <CheckCircle class="w-5 h-5" />
            {{ isSubmitting ? '提交中...' : '提交掃描' }}
          </button>
        </div>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <p v-if="!canUpload" class="text-sm text-amber-700">目前帳號沒有上傳權限，請聯繫管理員開通。</p>
      </form>
    </div>
  </FrontendLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import FrontendLayout from '@/components/FrontendLayout.vue';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-vue-next';
import { createScanTask } from '@/services/mock-api/scanApi';
import { getScanCost } from '@/services/mock-api/core';
import { useFrontendSession } from '@/services/state/frontendSession';

const selectedFile = ref<File | null>(null);
const scanName = ref('');
const description = ref('');
const isDragging = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

const router = useRouter();
const { sessionUser, sessionCompany, refreshFrontendSession } = useFrontendSession();
const scanCost = getScanCost();
const availableCredits = computed(() => sessionCompany.value?.credits ?? 0);
const canUpload = computed(() => Boolean(sessionUser.value?.permissions.uploadCode));

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedFile.value = file;
    if (!scanName.value) {
      scanName.value = file.name.replace(/\.[^/.]+$/, '');
    }
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) {
    selectedFile.value = file;
    if (!scanName.value) {
      scanName.value = file.name.replace(/\.[^/.]+$/, '');
    }
  }
};

const handleSubmit = async () => {
  if (!sessionUser.value || !sessionCompany.value) {
    errorMessage.value = '登入狀態失效，請重新登入';
    return;
  }
  if (!canUpload.value) {
    errorMessage.value = '目前帳號沒有上傳權限';
    return;
  }
  if (!selectedFile.value || !scanName.value) {
    errorMessage.value = '請先填寫必要欄位';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';
  try {
    await createScanTask({
      companyId: sessionCompany.value.id,
      userId: sessionUser.value.id,
      scanName: scanName.value,
      fileName: selectedFile.value.name,
      description: description.value,
    });
    await refreshFrontendSession();
    router.push('/history');
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '提交失敗，請稍後再試';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
