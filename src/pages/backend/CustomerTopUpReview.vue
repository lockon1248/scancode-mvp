<template>
  <BackendLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-2xl">儲值點數送審</h1>
      </div>

      <p v-if="pageError" class="text-sm text-red-600">{{ pageError }}</p>
      <p v-if="pageMessage" class="text-sm text-green-600">{{ pageMessage }}</p>

      <div v-if="isLoading" class="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        <p class="text-sm text-slate-600">載入公司資料中...</p>
      </div>

      <div v-else-if="!company" class="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
        找不到公司資料。
      </div>

      <div v-else class="bg-white rounded-xl border border-slate-200 p-4 md:p-6 space-y-5 max-w-2xl">
        <div class="text-sm text-slate-600">
          公司：<span class="text-slate-900">{{ company.name }}</span>
        </div>

        <div
          v-if="rejectedReason"
          class="rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <div class="text-sm text-red-700">PM 審核未通過原因</div>
          <div class="mt-1 text-sm text-red-800">{{ rejectedReason }}</div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="rounded-lg border border-slate-200 p-4">
            <div class="text-xs text-slate-500 mb-1">剩餘點數</div>
            <div class="text-2xl text-slate-900">{{ company.credits.toLocaleString() }}</div>
          </div>

          <div class="rounded-lg border border-slate-200 p-4">
            <label class="block text-xs text-slate-500 mb-1">追加點數</label>
            <input
              v-model="topUpInput"
              type="number"
              min="0"
              step="1"
              placeholder="輸入追加點數"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div class="rounded-lg border border-slate-200 p-4">
            <div class="text-xs text-slate-500 mb-1">結果點數</div>
            <div class="text-2xl text-brand-700">{{ resultCredits.toLocaleString() }}</div>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            @click="goBack"
            class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            取消
          </button>
          <button
            :disabled="isSubmitting || !canSubmit"
            @click="submitReview"
            class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            確認送出審核
          </button>
        </div>
      </div>
    </div>
  </BackendLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BackendLayout from '@/components/BackendLayout.vue';
import { listBackendCustomers, type BackendCustomerRow } from '@/services/mock-api/backendAdminApi';
import { getBackendApplicationById, submitCreditTopUpForReview } from '@/services/mock-api/backendApplicationsApi';

const route = useRoute();
const router = useRouter();
const companyId = String(route.params.companyId ?? '');
const applicationId = typeof route.query.applicationId === 'string' ? route.query.applicationId : '';

const isLoading = ref(false);
const isSubmitting = ref(false);
const pageError = ref('');
const pageMessage = ref('');
const company = ref<BackendCustomerRow | null>(null);
const topUpInput = ref('');
const rejectedReason = ref('');

const topUpAmount = computed(() => {
  const parsed = Number(topUpInput.value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
});

const resultCredits = computed(() => (company.value?.credits ?? 0) + topUpAmount.value);
const canSubmit = computed(() => topUpAmount.value > 0 && Boolean(company.value));

const goBack = () => {
  router.push({ path: `/admin/customers/${companyId}` });
};

const submitReview = async () => {
  pageError.value = '';
  pageMessage.value = '';
  if (!company.value) {
    pageError.value = '找不到公司資料';
    return;
  }
  if (topUpAmount.value <= 0) {
    pageError.value = '追加點數必須大於 0';
    return;
  }

  try {
    isSubmitting.value = true;
    const app = await submitCreditTopUpForReview({
      companyId: company.value.id,
      company: company.value.name,
      taxId: company.value.taxId,
      requestedCredits: topUpAmount.value,
    });
    pageMessage.value = `已送出審核（${app.id}）`;
    router.push({
      path: `/admin/customers/${company.value.id}`,
      query: { topupSubmitted: '1', appId: app.id },
    });
  } catch (err) {
    pageError.value = err instanceof Error ? err.message : '送出審核失敗';
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  isLoading.value = true;
  try {
    const customers = await listBackendCustomers();
    company.value = customers.find(c => c.id === companyId) ?? null;
    if (!company.value) {
      pageError.value = '找不到此公司資料';
      return;
    }

    if (applicationId) {
      const app = await getBackendApplicationById(applicationId);
      if (
        app &&
        app.type === 'credit_topup' &&
        app.status === 'rejected' &&
        app.companyId === companyId
      ) {
        topUpInput.value = String(app.requestedCredits);
        rejectedReason.value = app.rejectionReason || '未提供原因';
      }
    }
  } catch (err) {
    pageError.value = err instanceof Error ? err.message : '載入資料失敗';
  } finally {
    isLoading.value = false;
  }
});
</script>
