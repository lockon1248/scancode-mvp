<template>
  <BackendLayout>
    <div class="max-w-5xl mx-auto space-y-6">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-2xl">{{ isEditMode ? '編輯申請單' : '新增帳號申請' }}</h1>
        <button
          @click="router.push('/admin/applications')"
          class="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1"
        >
          <ArrowLeft class="w-4 h-4" />
          回申請列表
        </button>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
      <p v-if="successMessage" class="text-sm text-green-600">{{ successMessage }}</p>

      <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 class="text-lg text-slate-900 mb-3">1. 公司資料</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-slate-700 mb-1">公司名稱 <span class="text-red-500">*</span></label>
            <input v-model="form.company" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label class="block text-sm text-slate-700 mb-1">統一編號 <span class="text-red-500">*</span></label>
            <input v-model="form.taxId" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label class="block text-sm text-slate-700 mb-1">申請點數 <span class="text-red-500">*</span></label>
            <input v-model.number="form.requestedCredits" type="number" min="1" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div class="border-t border-slate-200 pt-4 space-y-4">
          <h2 class="text-lg text-slate-900">2. 公司用戶資料</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input v-model="userDraft.name" type="text" placeholder="姓名*" class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <input v-model="userDraft.email" type="email" placeholder="Email*" class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <input v-model="userDraft.phone" type="text" placeholder="電話" class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <button
              type="button"
              @click="addUser"
              class="px-3 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 inline-flex items-center justify-center gap-1"
            >
              <Plus class="w-4 h-4" />
              新增用戶
            </button>
          </div>
          <div class="flex flex-wrap gap-4 text-sm">
            <label class="inline-flex items-center gap-2">
              <input v-model="userDraft.permissions.uploadCode" type="checkbox" class="w-4 h-4 accent-brand-500" />
              上傳程式碼
            </label>
            <label class="inline-flex items-center gap-2">
              <input v-model="userDraft.permissions.downloadReport" type="checkbox" class="w-4 h-4 accent-brand-500" />
              下載報告
            </label>
            <label class="inline-flex items-center gap-2">
              <input v-model="userDraft.permissions.viewHistory" type="checkbox" class="w-4 h-4 accent-brand-500" />
              查看歷史
            </label>
          </div>

          <div class="bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto">
            <table class="w-full min-w-[840px]">
              <thead class="border-b border-slate-200">
                <tr>
                  <th class="px-3 py-2 text-left text-sm text-slate-700">姓名</th>
                  <th class="px-3 py-2 text-left text-sm text-slate-700">Email</th>
                  <th class="px-3 py-2 text-left text-sm text-slate-700">電話</th>
                  <th class="px-3 py-2 text-left text-sm text-slate-700">權限</th>
                  <th class="px-3 py-2 text-left text-sm text-slate-700">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="form.companyUsers.length === 0">
                  <td colspan="5" class="px-3 py-6 text-center text-sm text-slate-500">尚未新增公司用戶，請至少新增 1 位</td>
                </tr>
                <tr v-for="(user, index) in form.companyUsers" :key="`${user.email}-${index}`" class="border-b border-slate-200 last:border-b-0">
                  <td class="px-3 py-2 text-sm text-slate-800">{{ user.name }}</td>
                  <td class="px-3 py-2 text-sm text-slate-700">{{ user.email }}</td>
                  <td class="px-3 py-2 text-sm text-slate-700">{{ user.phone || '-' }}</td>
                  <td class="px-3 py-2 text-sm text-slate-700">{{ renderPermissionSummary(user) }}</td>
                  <td class="px-3 py-2">
                    <button
                      type="button"
                      @click="removeUser(index)"
                      class="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 inline-flex items-center gap-1"
                    >
                      <Trash2 class="w-3 h-3" />
                      移除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-slate-500">送出時會以第一位用戶作為申請主要聯絡人。</p>
        </div>

        <div>
          <label class="block text-sm text-slate-700 mb-1">備註</label>
          <textarea
            v-model="form.notes"
            rows="4"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          ></textarea>
        </div>

        <div class="pt-2 flex flex-wrap items-center gap-2">
          <button
            :disabled="isSubmitting"
            @click="saveDraft"
            class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {{ isEditMode ? '更新草稿' : '暫存草稿' }}
          </button>
          <button
            :disabled="isSubmitting"
            @click="submit"
            class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            送出給 PM 審核
          </button>
        </div>
      </div>
    </div>
  </BackendLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-vue-next';
import BackendLayout from '@/components/BackendLayout.vue';
import { useAppMessage } from '@/services/state/appMessage';
import {
  getBackendApplicationById,
  saveBackendApplicationDraft,
  submitBackendApplication,
  type BackendApplicationUser,
} from '@/services/mock-api/backendApplicationsApi';
import type { FrontendPermissionSet } from '@/services/types/model';

const router = useRouter();
const route = useRoute();
const draftId = computed(() => {
  const raw = route.query.draftId;
  return typeof raw === 'string' ? raw : '';
});
const isEditMode = computed(() => Boolean(draftId.value));

const form = reactive({
  company: '',
  taxId: '',
  companyUsers: [] as BackendApplicationUser[],
  requestedCredits: 1000,
  notes: '',
});

const normalizePermissions = (permissions?: Partial<FrontendPermissionSet>): FrontendPermissionSet => ({
  uploadCode: Boolean(permissions?.uploadCode),
  downloadReport: permissions?.downloadReport ?? true,
  viewHistory: permissions?.viewHistory ?? true,
});

const defaultPermissions = (): FrontendPermissionSet => ({
  uploadCode: false,
  downloadReport: true,
  viewHistory: true,
});

const userDraft = reactive<BackendApplicationUser>({
  name: '',
  email: '',
  phone: '',
  role: 'member',
  permissions: defaultPermissions(),
});

const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const message = useAppMessage();

const clearUserDraft = () => {
  userDraft.name = '';
  userDraft.email = '';
  userDraft.phone = '';
  userDraft.permissions = defaultPermissions();
};

const addUser = () => {
  const name = userDraft.name.trim();
  const email = userDraft.email.trim().toLowerCase();
  const phone = userDraft.phone.trim();
  if (!name || !email) {
    errorMessage.value = '新增公司用戶時，姓名與 Email 為必填';
    return;
  }
  const duplicated = form.companyUsers.some(user => user.email.toLowerCase() === email);
  if (duplicated) {
    errorMessage.value = '公司用戶 Email 不可重複';
    return;
  }
  errorMessage.value = '';
  form.companyUsers.push({
    name,
    email,
    phone,
    role: 'member',
    permissions: normalizePermissions(userDraft.permissions),
  });
  clearUserDraft();
};

const removeUser = (index: number) => {
  form.companyUsers.splice(index, 1);
};

const renderPermissionSummary = (user: BackendApplicationUser) => {
  const p = normalizePermissions(user.permissions);
  if (!p) return '未設定';
  const labels: string[] = [];
  if (p.uploadCode) labels.push('上傳程式碼');
  if (p.downloadReport) labels.push('下載報告');
  if (p.viewHistory) labels.push('查看歷史');
  return labels.length > 0 ? labels.join('、') : '無';
};

const validateForm = (): string | null => {
  if (!form.company.trim() || !form.taxId.trim()) {
    return '請完整填寫公司資料';
  }
  if (form.companyUsers.length <= 0) {
    return '請至少新增 1 位公司用戶';
  }
  if (form.requestedCredits <= 0) {
    return '申請點數需大於 0';
  }
  return null;
};

const saveDraft = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  const validation = validateForm();
  if (validation) {
    errorMessage.value = validation;
    message.error(validation);
    return;
  }

  try {
    isSubmitting.value = true;
    await saveBackendApplicationDraft(form, draftId.value || undefined);
    const successText = `草稿已${isEditMode.value ? '更新' : '暫存'}`;
    successMessage.value = successText;
    message.success(successText);
    await router.push('/admin/applications');
  } catch (err) {
    const text = err instanceof Error ? err.message : '暫存草稿失敗';
    errorMessage.value = text;
    message.error(text);
  } finally {
    isSubmitting.value = false;
  }
};

const submit = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  const validation = validateForm();
  if (validation) {
    errorMessage.value = validation;
    message.error(validation);
    return;
  }

  try {
    isSubmitting.value = true;
    await submitBackendApplication(form, draftId.value || undefined);
    successMessage.value = '申請已送出';
    message.success('申請已送出，已送交 PM 審核');
    setTimeout(() => {
      router.push('/admin/applications');
    }, 400);
  } catch (err) {
    const text = err instanceof Error ? err.message : '新增申請失敗';
    errorMessage.value = text;
    message.error(text);
  } finally {
    isSubmitting.value = false;
  }
};

const loadDraft = async () => {
  if (!draftId.value) return;
  errorMessage.value = '';
  try {
    const draft = await getBackendApplicationById(draftId.value);
    if (!draft || !['draft', 'rejected'].includes(draft.status)) {
      errorMessage.value = '找不到可編輯的申請';
      return;
    }
    form.company = draft.company;
    form.taxId = draft.taxId;
    form.requestedCredits = draft.requestedCredits;
    form.notes = draft.notes || '';
    form.companyUsers = (draft.companyUsers || []).map(user => ({
      ...user,
      permissions: normalizePermissions(user.permissions),
    }));
  } catch (err) {
    const text = err instanceof Error ? err.message : '載入草稿失敗';
    errorMessage.value = text;
    message.error(text);
  }
};

onMounted(loadDraft);
</script>
