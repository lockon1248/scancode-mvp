<template>
  <BackendLayout>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl">點數儲值申請</h1>
          <p class="text-sm text-slate-600">{{ pageDescription }}</p>
        </div>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
      <p v-if="successMessage" class="text-sm text-green-600">{{ successMessage }}</p>

      <div class="bg-white rounded-xl border border-slate-200 p-2 flex gap-2 overflow-x-auto">
        <button
          @click="statusFilter = 'all'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            statusFilter === 'all' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          全部 ({{ filteredByRole.length }})
        </button>
        <button
          v-if="canReview"
          @click="statusFilter = 'pending'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            statusFilter === 'pending' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          待審核 ({{ pendingCount }})
        </button>
        <button
          v-if="canReview"
          @click="statusFilter = 'approved'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            statusFilter === 'approved' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          已核准 ({{ approvedCount }})
        </button>
        <button
          @click="statusFilter = 'rejected'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            statusFilter === 'rejected' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          已拒絕 ({{ rejectedCount }})
        </button>
      </div>

      <div v-if="isLoading" class="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        <p class="text-sm text-slate-600">載入儲值申請中...</p>
      </div>

      <div v-else class="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table class="w-full min-w-[1180px]">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 text-sm text-slate-700">申請單號</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700">公司</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700">業務</th>
              <th class="text-right px-4 py-3 text-sm text-slate-700">目前點數</th>
              <th class="text-right px-4 py-3 text-sm text-slate-700">追加點數</th>
              <th class="text-right px-4 py-3 text-sm text-slate-700">結果點數</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700">狀態</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700">提交時間</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700">拒絕原因</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="rows.length === 0">
              <td colspan="10" class="px-4 py-8 text-center text-sm text-slate-500">目前沒有點數儲值申請</td>
            </tr>
            <tr v-for="row in rows" :key="row.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{{ row.id }}</td>
              <td class="px-4 py-3">
                <div class="text-sm text-slate-900 whitespace-nowrap">{{ row.company }}</div>
                <div class="text-xs text-slate-500 whitespace-nowrap">{{ row.taxId }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{{ row.salesName }}</td>
              <td class="px-4 py-3 text-sm text-slate-700 text-right">{{ row.currentCredits.toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm text-brand-700 text-right">+{{ row.requestedCredits.toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm text-slate-900 text-right">{{ row.afterCredits.toLocaleString() }}</td>
              <td class="px-4 py-3">
                <span :class="statusBadgeClass(row.status)">{{ statusText(row.status) }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{{ row.submittedDate }}</td>
              <td class="px-4 py-3 text-sm text-red-700">{{ row.rejectionReason || '-' }}</td>
              <td class="px-4 py-3">
                <div v-if="canReview && row.status === 'pending'" class="flex items-center gap-2">
                  <button
                    :disabled="processingId === row.id"
                    @click="approve(row.id)"
                    class="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    核准
                  </button>
                  <button
                    :disabled="processingId === row.id"
                    @click="openRejectDialog(row.id)"
                    class="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    拒絕
                  </button>
                </div>
                <div v-else-if="canResubmit(row)" class="flex items-center gap-2">
                  <button
                    @click="resubmit(row)"
                    class="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                  >
                    重新申請
                  </button>
                </div>
                <div v-else class="text-sm text-slate-500">-</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="rejectDialogOpen"
      class="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="closeRejectDialog"
    >
      <div class="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 class="text-lg text-slate-900">拒絕儲值申請</h3>
        <p class="mt-1 text-sm text-slate-600">請輸入拒絕原因，將顯示給業務端。</p>
        <textarea
          v-model="rejectReason"
          rows="4"
          class="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="請輸入拒絕原因..."
        ></textarea>
        <p v-if="rejectDialogError" class="mt-2 text-sm text-red-600">{{ rejectDialogError }}</p>
        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            :disabled="processingId !== ''"
            @click="closeRejectDialog"
          >
            取消
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
            :disabled="processingId !== ''"
            @click="confirmReject"
          >
            確認拒絕
          </button>
        </div>
      </div>
    </div>
  </BackendLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BackendLayout from '@/components/BackendLayout.vue';
import {
  approveBackendApplication,
  listBackendApplications,
  rejectBackendApplication,
  type BackendApplication,
} from '@/services/mock-api/backendApplicationsApi';
import { listBackendCustomers } from '@/services/mock-api/backendAdminApi';
import { getStoredBackendSession } from '@/services/state/backendSession';
import { useAppMessage } from '@/services/state/appMessage';

const session = getStoredBackendSession();
const router = useRouter();
const canReview = session?.role === 'pm' || session?.role === 'adm';
const isSales = session?.role === 'sales';

const isLoading = ref(false);
const processingId = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const rejectDialogOpen = ref(false);
const rejectTargetId = ref('');
const rejectReason = ref('');
const rejectDialogError = ref('');
const statusFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>(canReview ? 'pending' : 'rejected');

const apps = ref<BackendApplication[]>([]);
const currentCreditsMap = ref<Record<string, number>>({});
const message = useAppMessage();

const pageDescription = computed(() =>
  canReview
    ? 'PM 可審核儲值申請；核准後會更新公司點數。'
    : '查看 PM 退回原因，並可直接重新申請。'
);

const topUpApps = computed(() => apps.value.filter(app => app.type === 'credit_topup'));

const filteredByRole = computed(() => {
  if (isSales && session) {
    const marker = `- ${session.name}`;
    return topUpApps.value.filter(app => app.submittedBy.includes(marker));
  }
  return topUpApps.value;
});

const rows = computed(() => {
  const base = statusFilter.value === 'all'
    ? filteredByRole.value
    : filteredByRole.value.filter(app => app.status === statusFilter.value);

  return base.map(app => {
    const currentCredits = currentCreditsMap.value[app.companyId || ''] ?? 0;
    return {
      ...app,
      currentCredits,
      afterCredits: currentCredits + app.requestedCredits,
      salesName: app.submittedBy.replace(/^業務\s*-\s*/, ''),
    };
  });
});

const pendingCount = computed(() => filteredByRole.value.filter(app => app.status === 'pending').length);
const approvedCount = computed(() => filteredByRole.value.filter(app => app.status === 'approved').length);
const rejectedCount = computed(() => filteredByRole.value.filter(app => app.status === 'rejected').length);

const statusText = (status: BackendApplication['status']) => {
  if (status === 'approved') return '已核准';
  if (status === 'rejected') return '已拒絕';
  if (status === 'pending') return '待審核';
  return '草稿';
};

const statusBadgeClass = (status: BackendApplication['status']) => {
  if (status === 'approved') return 'px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full';
  if (status === 'rejected') return 'px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full';
  if (status === 'pending') return 'px-2 py-1 bg-brand-100 text-brand-700 text-xs rounded-full';
  return 'px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full';
};

const canResubmit = (row: BackendApplication) => isSales && row.status === 'rejected' && Boolean(row.companyId);

const resubmit = (row: BackendApplication) => {
  if (!row.companyId) return;
  router.push({
    path: `/admin/customers/${row.companyId}/topup`,
    query: { applicationId: row.id },
  });
};

const clearTips = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const loadData = async () => {
  isLoading.value = true;
  try {
    const nextApps = await listBackendApplications();
    apps.value = nextApps;

    // PM 帳號沒有客戶管理權限，無法呼叫 listBackendCustomers。
    // 這裡改為可選載入，失敗時仍顯示申請資料。
    try {
      const customers = await listBackendCustomers();
      currentCreditsMap.value = customers.reduce<Record<string, number>>((acc, customer) => {
        acc[customer.id] = customer.credits;
        return acc;
      }, {});
    } catch {
      currentCreditsMap.value = {};
    }
  } catch (err) {
    const text = err instanceof Error ? err.message : '載入資料失敗';
    errorMessage.value = text;
    message.error(text);
  } finally {
    isLoading.value = false;
  }
};

const approve = async (applicationId: string) => {
  clearTips();
  if (!canReview) return;
  try {
    processingId.value = applicationId;
    await approveBackendApplication(applicationId);
    await loadData();
    successMessage.value = `${applicationId} 已核准`;
    message.success(`${applicationId} 已核准`);
  } catch (err) {
    const text = err instanceof Error ? err.message : '核准失敗';
    errorMessage.value = text;
    message.error(text);
  } finally {
    processingId.value = '';
  }
};

const openRejectDialog = (applicationId: string) => {
  clearTips();
  if (!canReview) return;
  rejectTargetId.value = applicationId;
  rejectReason.value = '';
  rejectDialogError.value = '';
  rejectDialogOpen.value = true;
};

const closeRejectDialog = (force = false) => {
  if (processingId.value && !force) return;
  rejectDialogOpen.value = false;
  rejectTargetId.value = '';
  rejectReason.value = '';
  rejectDialogError.value = '';
};

const confirmReject = async () => {
  clearTips();
  if (!canReview || !rejectTargetId.value) return;
  const reason = rejectReason.value.trim();
  if (!reason) {
    rejectDialogError.value = '請輸入拒絕原因';
    return;
  }

  try {
    processingId.value = rejectTargetId.value;
    await rejectBackendApplication(rejectTargetId.value, reason);
    await loadData();
    successMessage.value = `${rejectTargetId.value} 已拒絕`;
    message.success(`${rejectTargetId.value} 已拒絕`);
    closeRejectDialog(true);
  } catch (err) {
    const text = err instanceof Error ? err.message : '拒絕失敗';
    errorMessage.value = text;
    message.error(text);
  } finally {
    processingId.value = '';
  }
};

onMounted(async () => {
  await loadData();
});
</script>
