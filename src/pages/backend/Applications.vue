<template>
  <BackendLayout>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl">帳號申請</h1>
          <p class="text-sm text-slate-600">
            {{ roleDescription }}
          </p>
        </div>
        <div v-if="canCreate" class="flex items-center gap-2">
          <button
            v-if="majorType === 'company'"
            @click="router.push('/admin/applications/new')"
            class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            新增公司申請
          </button>
          <button
            v-else
            @click="goCreateAccount"
            class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            新增帳號
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
      <p v-if="successMessage" class="text-sm text-green-600">{{ successMessage }}</p>

      <div class="bg-white rounded-xl border border-slate-200 p-2 flex gap-2 overflow-x-auto">
        <button
          @click="majorType = 'company'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            majorType === 'company' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          公司申請
        </button>
        <button
          @click="majorType = 'individual'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            majorType === 'individual' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          個人申請
        </button>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-2 flex gap-2 overflow-x-auto">
        <button
          v-if="canCreate"
          @click="filter = 'draft'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            filter === 'draft' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          草稿 ({{ majorApplications.filter(a => a.status === 'draft').length }})
        </button>
        <button
          @click="filter = 'pending'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            filter === 'pending' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          待審核 ({{ majorApplications.filter(a => a.status === 'pending').length }})
        </button>
        <button
          @click="filter = 'approved'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            filter === 'approved' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          已核准 ({{ majorApplications.filter(a => a.status === 'approved').length }})
        </button>
        <button
          @click="filter = 'rejected'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            filter === 'rejected' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          已拒絕 ({{ majorApplications.filter(a => a.status === 'rejected').length }})
        </button>
      </div>

      <div v-if="isLoading" class="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        <p class="text-sm text-slate-600">載入申請資料中...</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="app in filteredApplications"
          :key="app.id"
          class="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-sm text-slate-500">{{ app.id }}</span>
                <span :class="getStatusBadgeClass(app.status)" class="flex items-center gap-1">
                  <component :is="getStatusIcon(app.status)" class="w-3 h-3" />
                  {{ getStatusText(app.status) }}
                </span>
                <span
                  v-if="app.type === 'user_addition'"
                  class="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full"
                >
                  個人申請
                </span>
              </div>
              <h3 class="text-xl text-slate-900 mb-1">
                {{ app.type === 'user_addition' ? `${app.company}｜申請人：${app.applicant}` : app.company }}
              </h3>
              <p class="text-sm text-slate-600">
                {{ app.type === 'user_addition' ? `個人追加申請｜統編：${app.taxId}` : `統編：${app.taxId}` }}
              </p>
            </div>

            <div v-if="canCreate && (app.status === 'draft' || app.status === 'rejected')" class="flex flex-col sm:flex-row gap-2">
              <button
                @click="editDraft(app)"
                class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors text-sm"
              >
                {{ app.status === 'rejected' ? '重新編輯' : '編輯草稿' }}
              </button>
            </div>

            <div v-else-if="canReview && app.status === 'pending'" class="flex flex-col sm:flex-row gap-2">
              <button
                :disabled="processingId === app.id"
                @click="approve(app.id)"
                class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <CheckCircle class="w-4 h-4" />
                核准
              </button>
              <button
                :disabled="processingId === app.id"
                @click="openRejectDialog(app.id)"
                class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <XCircle class="w-4 h-4" />
                拒絕
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div class="text-sm text-slate-600 mb-1">申請人資訊</div>
              <div class="text-slate-900">{{ app.applicant }}</div>
              <div class="text-sm text-slate-600">{{ app.email }}</div>
              <div class="text-sm text-slate-600">{{ app.phone }}</div>
            </div>

            <div>
              <div class="text-sm text-slate-600 mb-1">申請內容</div>
              <template v-if="app.type === 'user_addition'">
                <div class="text-slate-900">類型：單一人員追加</div>
                <div class="text-slate-900">新增人員：{{ app.applicant }}</div>
              </template>
              <template v-else>
                <div class="text-slate-900">用戶數：{{ getUserCount(app) }} 個</div>
                <div class="text-slate-900">點數：{{ app.requestedCredits.toLocaleString() }} 點</div>
              </template>
            </div>
          </div>

          <div class="border-t border-slate-200 pt-4 mb-4">
            <div class="text-sm text-slate-600 mb-2">公司用戶清單</div>
            <div v-if="getUsers(app).length === 0" class="text-sm text-slate-500">未提供用戶資料</div>
            <div v-else class="overflow-x-auto rounded-lg border border-slate-200">
              <table class="w-full min-w-[680px] bg-white">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs text-slate-600">姓名</th>
                    <th class="px-3 py-2 text-left text-xs text-slate-600">Email</th>
                    <th class="px-3 py-2 text-left text-xs text-slate-600">電話</th>
                    <th class="px-3 py-2 text-left text-xs text-slate-600">權限</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(user, index) in getUsers(app)"
                    :key="`${user.email}-${index}`"
                    class="border-b border-slate-100 last:border-b-0"
                  >
                    <td class="px-3 py-2 text-sm text-slate-800">{{ user.name }}</td>
                    <td class="px-3 py-2 text-sm text-slate-700">{{ user.email }}</td>
                    <td class="px-3 py-2 text-sm text-slate-700">{{ user.phone || '-' }}</td>
                    <td class="px-3 py-2 text-sm text-slate-700">{{ permissionSummary(user.permissions) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="border-t border-slate-200 pt-4 mb-4">
            <div class="text-sm text-slate-600 mb-2">提交資訊</div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-700">
              <span>提交時間：{{ app.submittedDate }}</span>
              <span>提交人：{{ app.submittedBy }}</span>
            </div>
          </div>

          <div v-if="app.status === 'approved'" class="border-t border-slate-200 pt-4 mb-4">
            <div class="text-sm text-slate-600 mb-2">審核資訊</div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-700">
              <span>審核時間：{{ app.approvedDate }}</span>
              <span>審核人：{{ app.approvedBy }}</span>
            </div>
          </div>

          <div v-if="app.status === 'rejected'" class="border-t border-slate-200 pt-4 mb-4">
            <div class="text-sm text-slate-600 mb-2">拒絕原因</div>
            <div class="text-sm text-slate-900 bg-red-50 p-3 rounded-lg border border-red-200">
              {{ app.rejectionReason }}
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 mt-2">
              <span>拒絕時間：{{ app.rejectedDate }}</span>
              <span>拒絕人：{{ app.rejectedBy }}</span>
            </div>
          </div>

          <div v-if="app.notes" class="border-t border-slate-200 pt-4">
            <div class="text-sm text-slate-600 mb-2">備註</div>
            <div class="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
              {{ app.notes }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="!isLoading && filteredApplications.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <FileText class="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p class="text-slate-600">
          目前沒有{{
            filter === 'draft'
              ? '草稿'
              : filter === 'pending'
                ? '待審核'
                : filter === 'approved'
                  ? '已核准'
                  : '已拒絕'
          }}的申請
        </p>
      </div>
    </div>

    <div
      v-if="rejectDialogOpen"
      class="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="closeRejectDialog"
    >
      <div class="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 class="text-lg text-slate-900">拒絕申請</h3>
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
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-vue-next';
import {
  approveBackendApplication,
  listBackendApplications,
  rejectBackendApplication,
  type BackendApplicationUser,
  type BackendApplication,
} from '@/services/mock-api/backendApplicationsApi';
import { listBackendCustomers } from '@/services/mock-api/backendAdminApi';
import { getStoredBackendSession } from '@/services/state/backendSession';
import { useAppMessage } from '@/services/state/appMessage';

const router = useRouter();
const session = getStoredBackendSession();
const canCreate = session?.role === 'sales' || session?.role === 'adm';
const canReview = session?.role === 'pm' || session?.role === 'adm';

const roleDescription = computed(() => {
  if (session?.role === 'adm') return '目前身份：ADM，可建立申請與執行審核';
  if (session?.role === 'pm') return '目前身份：PM，僅可進行核准或拒絕';
  return '目前身份：業務，僅可建立與查看申請內容';
});

const majorType = ref<'company' | 'individual'>('company');
const filter = ref<'draft' | 'pending' | 'approved' | 'rejected'>(canCreate ? 'draft' : 'pending');
const applications = ref<BackendApplication[]>([]);
const isLoading = ref(false);
const processingId = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const message = useAppMessage();
const rejectDialogOpen = ref(false);
const rejectTargetId = ref('');
const rejectReason = ref('');
const rejectDialogError = ref('');

const visibleApplications = computed(() => {
  if (session?.role !== 'sales') return applications.value;
  const marker = `- ${session.name}`;
  return applications.value.filter(app => app.submittedBy.includes(marker));
});

const majorApplications = computed(() =>
  visibleApplications.value.filter(app => {
    const type = app.type || 'company_onboarding';
    return majorType.value === 'company' ? type === 'company_onboarding' : type === 'user_addition';
  })
);

const filteredApplications = computed(() =>
  majorApplications.value.filter(app => app.status === filter.value)
);

const getUsers = (app: BackendApplication) => {
  if (app.companyUsers && app.companyUsers.length > 0) return app.companyUsers;
  return [{ name: app.applicant, email: app.email, phone: app.phone, role: 'admin' as const }];
};

const permissionSummary = (permissions: BackendApplicationUser['permissions']) => {
  const p = {
    uploadCode: Boolean(permissions?.uploadCode),
    downloadReport: permissions?.downloadReport ?? true,
    viewHistory: permissions?.viewHistory ?? true,
  };
  const labels: string[] = [];
  if (p.uploadCode) labels.push('上傳程式碼');
  if (p.downloadReport) labels.push('下載報告');
  if (p.viewHistory) labels.push('查看歷史');
  return labels.length > 0 ? labels.join('、') : '無';
};

const getUserCount = (app: BackendApplication) => {
  if (app.companyUsers && app.companyUsers.length > 0) return app.companyUsers.length;
  return app.requestedUsers;
};

const getStatusBadgeClass = (status: string) => {
  if (status === 'draft') return 'px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full';
  if (status === 'approved') return 'px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full';
  if (status === 'pending') return 'px-3 py-1 bg-brand-100 text-brand-700 text-xs rounded-full';
  return 'px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full';
};

const getStatusText = (status: string) => {
  if (status === 'draft') return '草稿';
  if (status === 'approved') return '已核准';
  if (status === 'pending') return '待審核';
  return '已拒絕';
};

const getStatusIcon = (status: string) => {
  if (status === 'draft') return FileText;
  if (status === 'approved') return CheckCircle;
  if (status === 'pending') return Clock;
  return XCircle;
};

const editDraft = (app: BackendApplication) => {
  if ((app.type || 'company_onboarding') === 'user_addition' && app.companyId) {
    router.push({
      path: `/admin/customers/${app.companyId}`,
      query: { entry: 'applications', tab: 'users', mode: 'edit_request', requestId: app.id },
    });
    return;
  }
  router.push({ path: '/admin/applications/new', query: { draftId: app.id } });
};

const goCreateAccount = async () => {
  try {
    const customers = await listBackendCustomers();
    const first = customers[0];
    if (!first) {
      message.error('目前沒有可用的客戶公司資料');
      return;
    }
    router.push({
      path: `/admin/customers/${first.id}`,
      query: { entry: 'applications', tab: 'users', mode: 'create' },
    });
  } catch (err) {
    const text = err instanceof Error ? err.message : '無法開啟新增帳號頁面';
    message.error(text);
  }
};

const clearTips = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const loadApplications = async () => {
  isLoading.value = true;
  try {
    applications.value = await listBackendApplications();
  } catch (err) {
    const text = err instanceof Error ? err.message : '載入申請資料失敗';
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
    await loadApplications();
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
    await loadApplications();
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
  await loadApplications();
});
</script>
