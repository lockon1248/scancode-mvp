<template>
  <BackendLayout>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl">後台帳號管理</h1>
          <p class="text-sm text-slate-600">僅 ADM 可管理 Sales / PM 帳號</p>
        </div>
        <button
          @click="openCreate"
          class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          新增後台帳號
        </button>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
      <p v-if="successMessage" class="text-sm text-green-600">{{ successMessage }}</p>

      <div class="bg-white rounded-xl border border-slate-200 p-2 flex gap-2 overflow-x-auto">
        <button
          @click="activeTab = 'sales'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            activeTab === 'sales' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          Sales
        </button>
        <button
          @click="activeTab = 'pm'"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap',
            activeTab === 'pm' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          PM
        </button>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="relative max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="搜尋姓名或 Email"
            class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table class="w-full min-w-[760px]">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-6 py-3 text-sm text-slate-700">姓名</th>
              <th class="text-left px-6 py-3 text-sm text-slate-700">Email</th>
              <th class="text-left px-6 py-3 text-sm text-slate-700">角色</th>
              <th class="text-left px-6 py-3 text-sm text-slate-700">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="isLoading">
              <td colspan="4" class="px-6 py-8 text-center text-sm text-slate-500">載入中...</td>
            </tr>
            <tr v-else-if="filteredAccounts.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-sm text-slate-500">目前沒有符合條件的帳號</td>
            </tr>
            <tr v-for="account in filteredAccounts" :key="account.id" class="hover:bg-slate-50">
              <td class="px-6 py-3 text-sm text-slate-800">{{ account.name }}</td>
              <td class="px-6 py-3 text-sm text-slate-700">{{ account.email }}</td>
              <td class="px-6 py-3 text-sm text-slate-700">{{ account.role === 'sales' ? 'Sales' : 'PM' }}</td>
              <td class="px-6 py-3">
                <div class="flex items-center gap-2">
                  <button
                    @click="openEdit(account)"
                    class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-100"
                  >
                    編輯
                  </button>
                  <button
                    @click="openDeleteConfirm(account)"
                    class="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 class="text-lg">新增後台帳號</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-slate-700 mb-1">姓名</label>
            <input
              v-model="createForm.name"
              type="text"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-700 mb-1">Email</label>
            <input
              v-model="createForm.email"
              type="email"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-700 mb-1">密碼</label>
            <input
              v-model="createForm.password"
              type="password"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            :disabled="isSubmitting"
            @click="submitCreate"
            class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            建立帳號
          </button>
          <button
            @click="openCreate"
            class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            清空
          </button>
        </div>
      </div>

      <div
        v-if="editModal.open"
        class="fixed inset-0 z-[145] flex items-center justify-center bg-slate-900/50 px-4"
        @click="closeEditModal"
      >
        <div
          class="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
          @click.stop
        >
          <h3 class="text-lg text-slate-900">編輯後台帳號</h3>
          <p class="mt-1 text-sm text-slate-600">修改帳號資料後按下儲存變更。</p>

          <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-slate-700 mb-1">姓名</label>
              <input
                v-model="editModal.name"
                type="text"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-1">Email</label>
              <input
                v-model="editModal.email"
                type="email"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-slate-700 mb-1">新密碼（留白不變更）</label>
              <input
                v-model="editModal.password"
                type="password"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-2">
            <button
              :disabled="isUpdating"
              @click="closeEditModal"
              class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              :disabled="isUpdating"
              @click="submitEdit"
              class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {{ isUpdating ? '儲存中...' : '儲存變更' }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="deleteModal.open"
        class="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/50 px-4"
        @click="closeDeleteConfirm"
      >
        <div
          class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
          @click.stop
        >
          <h3 class="text-lg text-slate-900">確認刪除後台帳號</h3>
          <p class="mt-2 text-sm text-slate-600">
            你即將刪除
            <span class="text-slate-900">{{ deleteModal.name || '此帳號' }}</span>
            （{{ deleteModal.email || '-' }}），此操作無法復原。
          </p>
          <div class="mt-6 flex items-center justify-end gap-2">
            <button
              :disabled="isDeleting"
              @click="closeDeleteConfirm"
              class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              :disabled="isDeleting"
              @click="confirmDelete"
              class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {{ isDeleting ? '刪除中...' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </BackendLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Search } from 'lucide-vue-next';
import BackendLayout from '@/components/BackendLayout.vue';
import {
  createBackendOperatorAccount,
  deleteBackendOperatorAccount,
  listBackendOperatorAccounts,
  updateBackendOperatorAccount,
  type BackendOperatorAccount,
  type BackendOperatorRole,
} from '@/services/state/backendSession';

const accounts = ref<BackendOperatorAccount[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const isUpdating = ref(false);
const searchTerm = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const activeTab = ref<BackendOperatorRole>('sales');
const isDeleting = ref(false);
const editModal = reactive<{
  open: boolean;
  accountId: string;
  name: string;
  email: string;
  password: string;
}>({
  open: false,
  accountId: '',
  name: '',
  email: '',
  password: '',
});
const deleteModal = reactive<{
  open: boolean;
  accountId: string;
  name: string;
  email: string;
}>({
  open: false,
  accountId: '',
  name: '',
  email: '',
});

const createForm = reactive<{
  name: string;
  email: string;
  password: string;
}>({
  name: '',
  email: '',
  password: '',
});

const filteredAccounts = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase();
  const byRole = accounts.value.filter(item => item.role === activeTab.value);
  if (!keyword) return byRole;
  return byRole.filter(
    item =>
      item.name.toLowerCase().includes(keyword) ||
      item.email.toLowerCase().includes(keyword)
  );
});

const clearTips = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const resetCreateForm = () => {
  createForm.name = '';
  createForm.email = '';
  createForm.password = '';
};

const loadAccounts = async () => {
  isLoading.value = true;
  clearTips();
  try {
    accounts.value = await listBackendOperatorAccounts();
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '載入後台帳號失敗';
  } finally {
    isLoading.value = false;
  }
};

const openCreate = () => {
  resetCreateForm();
};

const openEdit = (account: BackendOperatorAccount) => {
  clearTips();
  editModal.open = true;
  editModal.accountId = account.id;
  editModal.name = account.name;
  editModal.email = account.email;
  editModal.password = '';
};

const closeEditModal = () => {
  if (isUpdating.value) return;
  resetEditModalState();
};

const resetEditModalState = () => {
  editModal.open = false;
  editModal.accountId = '';
  editModal.name = '';
  editModal.email = '';
  editModal.password = '';
};

const openDeleteConfirm = (account: BackendOperatorAccount) => {
  clearTips();
  deleteModal.open = true;
  deleteModal.accountId = account.id;
  deleteModal.name = account.name;
  deleteModal.email = account.email;
};

const closeDeleteConfirm = () => {
  if (isDeleting.value) return;
  deleteModal.open = false;
  deleteModal.accountId = '';
  deleteModal.name = '';
  deleteModal.email = '';
};

const resetDeleteModalState = () => {
  deleteModal.open = false;
  deleteModal.accountId = '';
  deleteModal.name = '';
  deleteModal.email = '';
};

const submitCreate = async () => {
  clearTips();
  if (!createForm.name.trim() || !createForm.email.trim()) {
    errorMessage.value = '姓名與 Email 為必填';
    return;
  }
  if (createForm.password.trim().length < 3) {
    errorMessage.value = '密碼長度至少 3 碼';
    return;
  }

  try {
    isSubmitting.value = true;
    await createBackendOperatorAccount({
      name: createForm.name,
      email: createForm.email,
      role: activeTab.value,
      password: createForm.password,
    });
    successMessage.value = '後台帳號已建立';
    await loadAccounts();
    resetCreateForm();
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '操作失敗';
  } finally {
    isSubmitting.value = false;
  }
};

const submitEdit = async () => {
  clearTips();
  if (!editModal.accountId) return;
  if (!editModal.name.trim() || !editModal.email.trim()) {
    errorMessage.value = '姓名與 Email 為必填';
    return;
  }
  if (editModal.password.trim() && editModal.password.trim().length < 3) {
    errorMessage.value = '密碼長度至少 3 碼';
    return;
  }

  try {
    isUpdating.value = true;
    await updateBackendOperatorAccount(editModal.accountId, {
      name: editModal.name,
      email: editModal.email,
      role: activeTab.value,
      password: editModal.password.trim() ? editModal.password : undefined,
    });
    successMessage.value = '後台帳號已更新';
    resetEditModalState();
    await loadAccounts();
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '操作失敗';
  } finally {
    isUpdating.value = false;
  }
};

const confirmDelete = async () => {
  if (!deleteModal.accountId) return;
  const accountId = deleteModal.accountId;
  try {
    isDeleting.value = true;
    await deleteBackendOperatorAccount(accountId);
    successMessage.value = '後台帳號已刪除';
    if (editModal.accountId === accountId) resetEditModalState();
    resetDeleteModalState();
    await loadAccounts();
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '刪除失敗';
  } finally {
    isDeleting.value = false;
  }
};

onMounted(loadAccounts);
</script>
