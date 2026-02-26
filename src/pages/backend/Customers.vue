<template>
  <BackendLayout>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 class="text-2xl">客戶管理</h1>
        <p class="text-sm text-slate-600">點擊公司列可進入該公司的詳細管理頁</p>
      </div>

      <p v-if="pageError" class="text-sm text-red-600">{{ pageError }}</p>

      <div v-if="isLoading" class="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        <p class="text-sm text-slate-600">正在載入客戶資料...</p>
      </div>

      <template v-else>
      <div class="flex items-center gap-2 max-w-xl">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="搜尋公司名稱、統編或 ID"
            class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            @keyup.enter="applySearch"
          />
        </div>
        <button
          type="button"
          @click="applySearch"
          class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          搜尋
        </button>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table class="w-full min-w-[980px]">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap">公司 ID</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap">公司名稱</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap">統一編號</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap">帳號類型</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap">剩餘積分</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap">人數</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap">點數申請狀態</th>
              <th class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap">追加申請點數</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="company in pagedCustomers"
              :key="company.id"
              class="hover:bg-slate-50 transition-colors cursor-pointer"
              @click="goDetail(company.id)"
            >
              <td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{{ company.id }}</td>
              <td class="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">{{ company.name }}</td>
              <td class="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{{ company.taxId }}</td>
              <td class="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{{ company.accountType }}</td>
              <td class="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{{ company.credits.toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{{ company.userCount }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span :class="statusBadgeClass(company.topUpStatus)">{{ statusText(company.topUpStatus) }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                {{ company.topUpRequestedCredits === null ? '-' : `+${company.topUpRequestedCredits.toLocaleString()}` }}
              </td>
            </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-500">沒有符合條件的公司</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-600">
        <div>
          顯示第 {{ pageStart }} - {{ pageEnd }} 筆，共 {{ filteredCustomers.length }} 筆
        </div>
        <div class="flex items-center gap-2">
          <button
            :disabled="currentPage <= 1"
            @click="currentPage -= 1"
            class="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            上一頁
          </button>
          <span class="text-slate-700">第 {{ currentPage }} / {{ totalPages }} 頁</span>
          <button
            :disabled="currentPage >= totalPages"
            @click="currentPage += 1"
            class="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            下一頁
          </button>
        </div>
      </div>
      </template>
    </div>
  </BackendLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search } from 'lucide-vue-next';
import BackendLayout from '@/components/BackendLayout.vue';
import { listBackendCustomers, type BackendCustomerRow } from '@/services/mock-api/backendAdminApi';
import { listBackendApplications, type BackendApplication, type BackendApplicationStatus } from '@/services/mock-api/backendApplicationsApi';
import { getStoredBackendSession } from '@/services/state/backendSession';

const router = useRouter();
const route = useRoute();
const session = getStoredBackendSession();
const searchInput = ref('');
const searchTerm = ref('');
const pageError = ref('');
type CustomerWithTopUp = BackendCustomerRow & {
  topUpStatus: BackendApplicationStatus | null;
  topUpRequestedCredits: number | null;
};
const customers = ref<CustomerWithTopUp[]>([]);
const isLoading = ref(false);
const pageSize = 10;
const currentPage = ref(1);

const filteredCustomers = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase();
  if (!keyword) return customers.value;
  return customers.value.filter(customer =>
    customer.name.toLowerCase().includes(keyword) ||
    customer.taxId.toLowerCase().includes(keyword) ||
    customer.id.toLowerCase().includes(keyword)
  );
});

const applySearch = () => {
  searchTerm.value = searchInput.value;
  currentPage.value = 1;
};

const totalPages = computed(() => Math.max(1, Math.ceil(filteredCustomers.value.length / pageSize)));

const pagedCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredCustomers.value.slice(start, start + pageSize);
});

const pageStart = computed(() => {
  if (filteredCustomers.value.length === 0) return 0;
  return (currentPage.value - 1) * pageSize + 1;
});

const pageEnd = computed(() => {
  if (filteredCustomers.value.length === 0) return 0;
  return Math.min(currentPage.value * pageSize, filteredCustomers.value.length);
});

const goDetail = (companyId: string) => {
  const entry = typeof route.query.entry === 'string' ? route.query.entry : '';
  router.push({
    path: `/admin/customers/${companyId}`,
    query: entry ? { entry } : undefined,
  });
};

const parseDateToMs = (text?: string): number => {
  if (!text) return 0;
  const m = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!m) return 0;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = Number(m[4] ?? '0');
  const minute = Number(m[5] ?? '0');
  const second = Number(m[6] ?? '0');
  return new Date(year, month, day, hour, minute, second).getTime();
};

const statusText = (status: BackendApplicationStatus | null) => {
  if (!status) return '-';
  if (status === 'pending') return '待審核';
  if (status === 'rejected') return '審核失敗';
  return '-';
};

const statusBadgeClass = (status: BackendApplicationStatus | null) => {
  if (!status) return 'px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full';
  if (status === 'pending') return 'px-2 py-1 bg-brand-100 text-brand-700 text-xs rounded-full';
  if (status === 'rejected') return 'px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full';
  return 'px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full';
};

watch(
  () => filteredCustomers.value.length,
  () => {
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
  }
);

onMounted(async () => {
  isLoading.value = true;
  try {
    const [rows, apps] = await Promise.all([listBackendCustomers(), listBackendApplications()]);
    const topUpApps = apps.filter((app: BackendApplication) => app.type === 'credit_topup');
    const visibleTopUpApps = session?.role === 'sales'
      ? topUpApps.filter(app => app.submittedBy.includes(`- ${session.name}`))
      : topUpApps;

    const latestMap = new Map<string, BackendApplication>();
    for (const app of visibleTopUpApps) {
      if (!app.companyId) continue;
      const prev = latestMap.get(app.companyId);
      if (!prev || parseDateToMs(app.submittedDate) > parseDateToMs(prev.submittedDate)) {
        latestMap.set(app.companyId, app);
      }
    }

    customers.value = rows.map(customer => {
      const latest = latestMap.get(customer.id);
      const normalizedStatus = latest?.status === 'pending' || latest?.status === 'rejected'
        ? latest.status
        : null;
      return {
        ...customer,
        topUpStatus: normalizedStatus,
        topUpRequestedCredits: normalizedStatus ? latest?.requestedCredits ?? null : null,
      };
    });
  } catch (err) {
    pageError.value = err instanceof Error ? err.message : '載入客戶資料失敗';
  } finally {
    isLoading.value = false;
  }
});
</script>
