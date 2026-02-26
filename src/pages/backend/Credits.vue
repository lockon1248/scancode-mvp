<template>
  <BackendLayout>
    <div class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <div class="bg-white rounded-xl p-6 border border-slate-200">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Coins class="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div class="text-3xl mb-1">320</div>
          <div class="text-sm text-slate-600">總剩餘點數</div>
        </div>

        <div class="bg-white rounded-xl p-6 border border-slate-200">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp class="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div class="text-3xl mb-1">120</div>
          <div class="text-sm text-slate-600">本月充值點數</div>
        </div>

        <div class="bg-white rounded-xl p-6 border border-slate-200">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
              <TrendingDown class="w-6 h-6 text-brand-600" />
            </div>
          </div>
          <div class="text-3xl mb-1">37</div>
          <div class="text-sm text-slate-600">本月使用點數</div>
        </div>
      </div>

      <!-- Customer Credits Table -->
      <div class="bg-white rounded-xl border border-slate-200">
        <div class="p-6 border-b border-slate-200">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <h2 class="text-xl">客戶點數管理</h2>
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative flex-1">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  v-model="searchTerm"
                  type="text"
                  placeholder="搜尋客戶..."
                  class="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-sm"
                />
              </div>
              <button
                @click="showAddModal = true"
                class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus class="w-4 h-4" />
                點數充值
              </button>
            </div>
          </div>
        </div>

        <table class="hidden md:table w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-6 py-4 text-sm text-slate-700">客戶</th>
              <th class="text-left px-6 py-4 text-sm text-slate-700">剩餘點數</th>
              <th class="text-left px-6 py-4 text-sm text-slate-700">已使用</th>
              <th class="text-left px-6 py-4 text-sm text-slate-700">使用率</th>
              <th class="text-left px-6 py-4 text-sm text-slate-700">最近充值</th>
              <th class="text-left px-6 py-4 text-sm text-slate-700">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="customer in filteredCustomers"
              :key="customer.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                    <Building2 class="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <div class="text-sm text-slate-900">{{ customer.name }}</div>
                    <div class="text-xs text-slate-500">{{ customer.id }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <Coins class="w-4 h-4 text-green-500" />
                  <span class="text-lg text-green-600">{{ customer.remaining.toLocaleString() }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700">{{ customer.used.toLocaleString() }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-slate-200 rounded-full h-2 max-w-25">
                    <div
                      class="bg-brand-500 h-2 rounded-full"
                      :style="{ width: `${(customer.used / customer.credits * 100).toFixed(1)}%` }"
                    ></div>
                  </div>
                  <span class="text-sm text-slate-600">{{ (customer.used / customer.credits * 100).toFixed(1) }}%</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div>
                  <div class="text-sm text-slate-900">+{{ customer.topUpAmount.toLocaleString() }}</div>
                  <div class="text-xs text-slate-500">{{ customer.lastTopUp }}</div>
                </div>
              </td>
              <td class="px-6 py-4">
                <button
                  @click="showAddModal = true"
                  class="px-3 py-1 text-sm text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  充值
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="md:hidden p-4 space-y-3">
          <div
            v-for="customer in filteredCustomers"
            :key="customer.id"
            class="border border-slate-200 rounded-xl p-4 space-y-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 class="w-5 h-5 text-brand-600" />
                </div>
                <div class="min-w-0">
                  <div class="text-sm text-slate-900 truncate">{{ customer.name }}</div>
                  <div class="text-xs text-slate-500">{{ customer.id }}</div>
                </div>
              </div>
              <button
                @click="showAddModal = true"
                class="px-3 py-1 text-xs text-brand-600 hover:bg-brand-50 rounded-lg transition-colors shrink-0"
              >
                充值
              </button>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div class="text-xs text-slate-500 mb-1">剩餘點數</div>
                <div class="text-green-600">{{ customer.remaining.toLocaleString() }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-500 mb-1">已使用</div>
                <div class="text-slate-700">{{ customer.used.toLocaleString() }}</div>
              </div>
              <div class="col-span-2">
                <div class="text-xs text-slate-500 mb-1">使用率 {{ (customer.used / customer.credits * 100).toFixed(1) }}%</div>
                <div class="bg-slate-200 rounded-full h-2">
                  <div
                    class="bg-brand-500 h-2 rounded-full"
                    :style="{ width: `${(customer.used / customer.credits * 100).toFixed(1)}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="text-xs text-slate-500 border-t border-slate-200 pt-3">
              最近充值：+{{ customer.topUpAmount.toLocaleString() }}（{{ customer.lastTopUp }}）
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white rounded-xl border border-slate-200">
        <div class="p-6 border-b border-slate-200">
          <h2 class="text-xl">最近交易記錄</h2>
        </div>
        <div class="divide-y divide-slate-200">
          <div
            v-for="transaction in recentTransactions"
            :key="transaction.id"
            class="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-center gap-4">
              <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', transaction.type === 'topup' ? 'bg-green-100' : 'bg-brand-100']">
                <TrendingUp v-if="transaction.type === 'topup'" class="w-5 h-5 text-green-600" />
                <TrendingDown v-else class="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div class="text-sm text-slate-900">{{ transaction.customer }}</div>
                <div class="text-xs text-slate-500">
                  {{ transaction.type === 'topup' ? `充值 · ${transaction.operator}` : transaction.description }}
                </div>
                <div class="text-xs text-slate-400">{{ transaction.date }}</div>
              </div>
            </div>
            <div :class="transaction.amount > 0 ? 'text-base sm:text-lg text-green-600' : 'text-base sm:text-lg text-brand-600'">
              {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount.toLocaleString() }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Credits Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showAddModal = false"
    >
      <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4" @click.stop>
        <h2 class="text-2xl mb-6">點數充值</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-slate-700 mb-2">選擇客戶</label>
            <AppSelect
              v-model="selectedCustomerId"
              :options="customerOptions"
              :full-width="true"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-700 mb-2">充值點數</label>
            <input
              type="number"
              placeholder="輸入充值點數"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-700 mb-2">備註（選填）</label>
            <textarea
              placeholder="輸入備註資訊"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              rows="3"
            />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showAddModal = false" class="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
            取消
          </button>
          <button @click="showAddModal = false" class="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
            確認充值
          </button>
        </div>
      </div>
    </div>
  </BackendLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import BackendLayout from '@/components/BackendLayout.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import { Coins, Search, Plus, TrendingUp, TrendingDown, Building2 } from 'lucide-vue-next';

const searchTerm = ref('');
const showAddModal = ref(false);
const selectedCustomerId = ref('none');

const customers = [
  { id: 'C-001', name: '台積電股份有限公司', credits: 120, used: 14, remaining: 106, lastTopUp: '2024-02-01', topUpAmount: 120 },
  { id: 'C-002', name: '聯發科技股份有限公司', credits: 80, used: 8, remaining: 72, lastTopUp: '2024-02-05', topUpAmount: 80 },
  { id: 'C-003', name: '華碩電腦股份有限公司', credits: 100, used: 12, remaining: 88, lastTopUp: '2024-01-28', topUpAmount: 100 },
  { id: 'C-004', name: '宏達國際電子股份有限公司', credits: 60, used: 3, remaining: 57, lastTopUp: '2024-02-03', topUpAmount: 60 },
];

const customerOptions = computed(() => [
  { label: '請選擇客戶', value: 'none' },
  ...customers.map(customer => ({ label: customer.name, value: customer.id })),
]);

const filteredCustomers = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase();
  if (!keyword) return customers;

  return customers.filter(customer =>
    customer.id.toLowerCase().includes(keyword) ||
    customer.name.toLowerCase().includes(keyword)
  );
});

const recentTransactions = [
  { id: 'T-001', customer: '台積電股份有限公司', type: 'topup', amount: 120, date: '2024-02-01 10:30', operator: '業務 - 張小美' },
  { id: 'T-002', customer: '台積電股份有限公司', type: 'usage', amount: -1, date: '2024-02-10 14:30', description: '程式碼掃描 SC-2024-001' },
  { id: 'T-003', customer: '聯發科技股份有限公司', type: 'topup', amount: 80, date: '2024-02-05 15:20', operator: '業務 - 李大明' },
  { id: 'T-004', customer: '台積電股份有限公司', type: 'usage', amount: -1, date: '2024-02-11 09:15', description: '程式碼掃描 SC-2024-002' },
];
</script>
