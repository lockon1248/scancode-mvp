<template>
  <FrontendLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl mb-2">掃描記錄</h1>
        <p class="text-slate-600">查看所有程式碼掃描歷史記錄與報告</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1 relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="searchTerm"
              type="text"
              placeholder="搜尋掃描名稱或編號..."
              class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <!-- Status Filter -->
          <AppSelect
            v-model="statusFilter"
            :options="statusOptions"
          />
        </div>
      </div>

      <div v-if="!canViewHistory" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
        目前帳號沒有「查看掃描記錄」權限，請聯繫管理員開通。
      </div>

      <!-- Scans List -->
      <div v-else class="space-y-4">
        <div
          v-for="scan in filteredScans"
          :key="scan.id"
          class="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
        >
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-sm text-slate-500 whitespace-nowrap">{{ scan.id }}</span>
                <span :class="getStatusBadgeClass(scan.status)" class="flex items-center gap-1 whitespace-nowrap shrink-0">
                  <span v-if="scan.status === 'processing'" class="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span>
                  {{ getStatusText(scan.status) }}
                </span>
              </div>
              <h3 class="text-lg text-slate-900 mb-1">{{ scan.name }}</h3>
              <p class="text-sm text-slate-600 flex items-center gap-1">
                <FileCode class="w-4 h-4" />
                {{ scan.fileName }}
              </p>
            </div>

            <div v-if="scan.status === 'completed'" class="w-full sm:w-auto flex gap-2">
              <button
                v-if="canDownloadReport"
                @click="handleDownload(scan.id, 'pdf')"
                class="flex-1 sm:flex-none px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                <Download class="w-4 h-4" />
                PDF
              </button>
              <button
                v-if="canDownloadReport"
                @click="handleDownload(scan.id, 'html')"
                class="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                <Download class="w-4 h-4" />
                HTML
              </button>
            </div>
          </div>

          <!-- Timeline -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-600 mb-4">
            <div class="flex items-center gap-2">
              <Calendar class="w-4 h-4" />
              <span>上傳：{{ formatDisplayDateTime(scan.uploadDate) }}</span>
            </div>
            <div v-if="scan.completedDate" class="flex items-center gap-2">
              <Calendar class="w-4 h-4" />
              <span>完成：{{ formatDisplayDateTime(scan.completedDate) }}</span>
            </div>
            <div class="text-brand-600">
              扣除 {{ scan.creditsCost }} 點數
            </div>
          </div>

          <!-- Issues Summary -->
          <div v-if="scan.issues" class="border-t border-slate-200 pt-4">
            <div class="flex items-center gap-2 mb-3">
              <AlertTriangle class="w-4 h-4 text-slate-600" />
              <span class="text-sm text-slate-700">發現問題：</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <span class="text-sm text-slate-700">嚴重：</span>
                <span class="text-sm text-red-600">{{ scan.issues.critical }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-brand-500 rounded-full"></div>
                <span class="text-sm text-slate-700">高：</span>
                <span class="text-sm text-brand-600">{{ scan.issues.high }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span class="text-sm text-slate-700">中：</span>
                <span class="text-sm text-yellow-600">{{ scan.issues.medium }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span class="text-sm text-slate-700">低：</span>
                <span class="text-sm text-blue-600">{{ scan.issues.low }}</span>
              </div>
            </div>
          </div>

          <div v-if="scan.status === 'processing'" class="border-t border-slate-200 pt-4">
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <div class="w-full bg-slate-200 rounded-full h-2">
                <div class="bg-brand-500 h-2 rounded-full animate-pulse" style="width: 45%"></div>
              </div>
              <span class="whitespace-nowrap">預計剩餘 12 小時</span>
            </div>
          </div>
        </div>
      </div>
      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
    </div>
  </FrontendLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import FrontendLayout from '@/components/FrontendLayout.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import { Download, Search, Calendar, AlertTriangle, FileCode } from 'lucide-vue-next';
import { downloadScanReport, listCompanyScans } from '@/services/mock-api/scanApi';
import { formatDisplayDateTime } from '@/services/mock-api/core';
import { useFrontendSession } from '@/services/state/frontendSession';
import type { ScanTask } from '@/services/types/model';

const searchTerm = ref('');
const statusFilter = ref('all');
const scans = ref<ScanTask[]>([]);
const errorMessage = ref('');
const { sessionCompany, sessionUser } = useFrontendSession();
const canViewHistory = computed(() => Boolean(sessionUser.value?.permissions.viewHistory));
const canDownloadReport = computed(() => Boolean(sessionUser.value?.permissions.downloadReport));

const filteredScans = computed(() => {
  let items = [...scans.value];

  if (statusFilter.value !== 'all') {
    items = items.filter(s => s.status === statusFilter.value);
  }

  const keyword = searchTerm.value.trim().toLowerCase();
  if (keyword) {
    items = items.filter(s =>
      s.id.toLowerCase().includes(keyword) ||
      s.name.toLowerCase().includes(keyword) ||
      s.fileName.toLowerCase().includes(keyword)
    );
  }

  return items;
});

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: '全部狀態' },
  { value: 'completed', label: '已完成' },
  { value: 'processing', label: '處理中' },
];

const loadScans = async () => {
  if (!canViewHistory.value) {
    scans.value = [];
    return;
  }
  if (!sessionCompany.value) return;
  errorMessage.value = '';
  try {
    scans.value = await listCompanyScans(sessionCompany.value.id);
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '載入掃描記錄失敗';
  }
};

const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const handleDownload = async (scanId: string, format: 'pdf' | 'html') => {
  if (!canDownloadReport.value) {
    errorMessage.value = '目前帳號沒有下載報告權限';
    return;
  }
  errorMessage.value = '';
  try {
    const file = await downloadScanReport(scanId, format);
    triggerBrowserDownload(file.blob, file.fileName);
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '下載失敗';
  }
};

const getStatusBadgeClass = (status: string) => {
  if (status === 'completed') return 'px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full';
  if (status === 'processing') return 'px-3 py-1 bg-brand-100 text-brand-700 text-xs rounded-full';
  return 'px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full';
};

const getStatusText = (status: string) => {
  if (status === 'completed') return '已完成';
  if (status === 'processing') return '處理中';
  return '待處理';
};

onMounted(() => {
  loadScans();
});
</script>
