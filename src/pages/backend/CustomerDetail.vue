<template>
  <BackendLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-3">
        <button
          @click="handleBack"
          class="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1"
        >
          <ArrowLeft class="w-4 h-4" />
          {{
            fromApplicationsCreateMode || fromApplicationsEditRequestMode
              ? "回帳號申請"
              : "回客戶列表"
          }}
        </button>
        <h1 class="text-xl sm:text-2xl">
          {{
            fromApplicationsCreateMode
              ? "新增帳號"
              : fromApplicationsEditRequestMode
                ? "編輯個人申請"
                : selectedCompany?.name || "客戶詳細管理"
          }}
        </h1>
      </div>

      <p v-if="pageError" class="text-sm text-red-600">{{ pageError }}</p>
      <p v-if="pageMessage" class="text-sm text-green-600">{{ pageMessage }}</p>

      <div
        v-if="isLoading"
        class="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center gap-3"
      >
        <div
          class="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin"
        ></div>
        <p class="text-sm text-slate-600">載入公司資料中...</p>
      </div>

      <div
        v-else-if="!selectedCompany"
        class="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600"
      >
        找不到此公司資料。
      </div>

      <template v-else>
        <div
          v-if="!fromApplicationsCreateMode && !fromApplicationsEditRequestMode"
          class="inline-flex rounded-lg border border-slate-300 bg-white p-1"
        >
          <button
            @click="activeTab = 'company'"
            :class="
              activeTab === 'company'
                ? 'bg-brand-500 text-white'
                : 'text-slate-700'
            "
            class="px-4 py-2 text-sm rounded-md"
          >
            公司資料
          </button>
          <button
            @click="activeTab = 'users'"
            :class="
              activeTab === 'users'
                ? 'bg-brand-500 text-white'
                : 'text-slate-700'
            "
            class="px-4 py-2 text-sm rounded-md"
          >
            使用者管理
          </button>
        </div>

        <section v-if="activeTab === 'company'" class="space-y-4 relative z-20">
          <div
            class="bg-white rounded-xl border border-slate-200 p-4 md:p-6 relative z-20 overflow-visible"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-700 mb-1"
                  >公司名稱 <span class="text-red-500">*</span></label
                >
                <input
                  v-model="companyDraft.name"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-700 mb-1"
                  >統一編號 <span class="text-red-500">*</span></label
                >
                <input
                  v-model="companyDraft.taxId"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-700 mb-1"
                  >帳號類型 <span class="text-red-500">*</span></label
                >
                <AppSelect
                  v-model="companyDraft.accountType"
                  :options="accountTypeOptions"
                  :full-width="true"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-700 mb-1"
                  >剩餘點數</label
                >
                <div class="flex items-center gap-2">
                  <span class="text-2xl text-slate-800">{{
                    companyDraft.credits.toLocaleString()
                  }}</span>
                  <button
                    @click="goToCredits"
                    class="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                  >
                    儲值點數
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-5">
              <button
                @click="saveCompany"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                儲存公司資料
              </button>
            </div>
          </div>
        </section>

        <section v-else class="space-y-4">
          <div
            v-if="
              !(
                (fromApplicationsCreateMode && userViewMode === 'create') ||
                (fromApplicationsEditRequestMode &&
                  userViewMode === 'edit_request')
              )
            "
            class="bg-white rounded-xl border border-slate-200 p-4 md:p-6"
          >
            <div
              class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
            >
              <div
                v-if="userViewMode === 'table'"
                class="flex flex-col sm:flex-row sm:items-center gap-2"
              >
                <div class="text-sm text-slate-600 sm:mr-2">
                  目前人數：{{ companyDraft.userCount }} 人
                </div>
                <div class="relative">
                  <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  />
                  <input
                    v-model="userSearchTerm"
                    type="text"
                    placeholder="搜尋姓名或帳號"
                    class="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <button
                  @click="openCreateUser"
                  :disabled="isSubmitting"
                  class="px-3 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  新增使用者
                </button>
              </div>

              <div v-else class="flex items-center gap-2">
                <button
                  @click="backToUserTable"
                  class="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  <ArrowLeft class="w-4 h-4" />
                  回到上一頁
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="userViewMode === 'table'"
            class="bg-white rounded-xl border border-slate-200 overflow-x-auto"
          >
            <table class="w-full min-w-245">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap"
                  >
                    姓名
                  </th>
                  <th
                    class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap"
                  >
                    帳號（Email）
                  </th>
                  <th
                    class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap"
                  >
                    電話
                  </th>
                  <th
                    class="text-center px-3 py-3 text-sm text-slate-700 whitespace-nowrap"
                  >
                    上傳
                  </th>
                  <th
                    class="text-center px-3 py-3 text-sm text-slate-700 whitespace-nowrap"
                  >
                    下載
                  </th>
                  <th
                    class="text-center px-3 py-3 text-sm text-slate-700 whitespace-nowrap"
                  >
                    歷史
                  </th>
                  <th
                    class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap"
                  >
                    審核狀態
                  </th>
                  <th
                    class="text-left px-4 py-3 text-sm text-slate-700 whitespace-nowrap"
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-if="filteredUsers.length === 0">
                  <td
                    colspan="8"
                    class="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    目前沒有使用者
                  </td>
                </tr>
                <tr
                  v-for="user in filteredUsers"
                  :key="user.id"
                  class="hover:bg-slate-50"
                  @click="openEditUser(user.id)"
                >
                  <td
                    class="px-4 py-3 text-sm text-slate-800 whitespace-nowrap"
                  >
                    {{ user.name }}
                  </td>
                  <td
                    class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap"
                  >
                    {{ user.email }}
                  </td>
                  <td
                    class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap"
                  >
                    {{ user.phone || "-" }}
                  </td>
                  <td class="px-3 py-3 text-center">
                    <span
                      :class="permissionDot(user.permissions.uploadCode)"
                    ></span>
                  </td>
                  <td class="px-3 py-3 text-center">
                    <span
                      :class="permissionDot(user.permissions.downloadReport)"
                    ></span>
                  </td>
                  <td class="px-3 py-3 text-center">
                    <span
                      :class="permissionDot(user.permissions.viewHistory)"
                    ></span>
                  </td>
                  <td class="px-4 py-3 text-sm whitespace-nowrap">
                    <span :class="statusBadgeClass(user.reviewStatus)">{{
                      statusLabel(user.reviewStatus)
                    }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <template v-if="user.reviewStatus === 'pending'">
                      <span class="text-xs text-slate-500">審核中不可編輯</span>
                    </template>
                    <template v-else>
                      <button
                        @click.stop="openEditUser(user.id)"
                        class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                      >
                        編輯
                      </button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-else
            class="bg-white rounded-xl border border-slate-200 p-4 md:p-6"
          >
            <h3 class="text-lg mb-4">
              {{ userViewMode === "create" ? "新增使用者" : "編輯使用者" }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-700 mb-1"
                  >姓名 <span class="text-red-500">*</span></label
                >
                <input
                  v-model="userForm.name"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-700 mb-1"
                  >帳號（Email） <span class="text-red-500">*</span></label
                >
                <input
                  v-model="userForm.email"
                  type="email"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div
                v-if="
                  userViewMode === 'create' || userViewMode === 'edit_request'
                "
              >
                <label class="block text-sm text-slate-700 mb-1">
                  公司 <span class="text-red-500">*</span>
                </label>
                <AppSelect
                  v-model="createTargetCompanyId"
                  :options="createCompanyOptions"
                  :full-width="true"
                  :disabled="
                    userViewMode === 'edit_request' || !canSelectCreateCompany
                  "
                />
                <p
                  v-if="userViewMode === 'edit_request'"
                  class="text-xs text-slate-500 mt-1"
                >
                  個人申請草稿的公司不可變更。
                </p>
                <p
                  v-else-if="!canSelectCreateCompany"
                  class="text-xs text-slate-500 mt-1"
                >
                  從客戶管理進入時，公司固定為目前客戶。
                </p>
              </div>
              <div>
                <label class="block text-sm text-slate-700 mb-1">電話</label>
                <input
                  v-model="userForm.phone"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-700 mb-1">
                  {{
                    userViewMode === "create"
                      ? "初始密碼（預設 123）"
                      : "新密碼（留白不變更）"
                  }}
                  <span v-if="isPasswordRequired" class="text-red-500">*</span>
                </label>
                <input
                  v-model="userForm.password"
                  type="password"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div class="mt-5">
              <div
                class="text-sm text-slate-700 mb-2 inline-flex items-center gap-2"
              >
                <Shield class="w-4 h-4" /> 權限
              </div>
              <div class="flex flex-wrap gap-4 text-sm">
                <label class="inline-flex items-center gap-2">
                  <input
                    v-model="userForm.permissions.uploadCode"
                    type="checkbox"
                    class="w-4 h-4 accent-brand-500"
                  />上傳程式碼
                </label>
                <label class="inline-flex items-center gap-2">
                  <input
                    v-model="userForm.permissions.downloadReport"
                    type="checkbox"
                    class="w-4 h-4 accent-brand-500"
                  />下載報告
                </label>
                <label class="inline-flex items-center gap-2">
                  <input
                    v-model="userForm.permissions.viewHistory"
                    type="checkbox"
                    class="w-4 h-4 accent-brand-500"
                  />查看歷史
                </label>
              </div>
            </div>

            <div class="mt-6 flex items-center gap-2 flex-wrap">
              <button
                v-if="canSubmitUserReview"
                @click="saveUserDraft"
                :disabled="isSubmitting"
                class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                暫存草稿
              </button>
              <button
                @click="submitUserForm"
                :disabled="isSubmitting"
                class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 inline-flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <Save class="w-4 h-4" />
                {{
                  canSubmitUserReview
                    ? "送出審核"
                    : userViewMode === "create"
                      ? "建立使用者"
                      : "儲存變更"
                }}
              </button>
              <button
                @click="backToUserTable"
                class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>
  </BackendLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Save, Search, Shield } from "lucide-vue-next";
import BackendLayout from "@/components/BackendLayout.vue";
import AppSelect from "@/components/ui/AppSelect.vue";
import {
  createFrontendUserForCompany,
  listBackendCustomers,
  listFrontendUsersByCompany,
  updateBackendCustomer,
  updateFrontendUserCredentialAndPermissions,
  type BackendCustomerRow,
} from "@/services/mock-api/backendAdminApi";
import {
  listUserAdditionRequestsByCompany,
  saveUserAdditionDraft,
  submitUserAdditionForReview,
  type BackendApplication,
  type BackendApplicationUser,
} from "@/services/mock-api/backendApplicationsApi";
import { getStoredBackendSession } from "@/services/state/backendSession";
import type {
  FrontendPermissionSet,
  FrontendUser,
} from "@/services/types/model";

type UserViewMode = "table" | "edit" | "create" | "edit_request";
type ReviewStatus = "draft" | "pending" | "approved" | "rejected";
type UserSource = "actual" | "request";

type UserForm = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  permissions: FrontendPermissionSet;
};

type CompanyDraft = {
  name: string;
  taxId: string;
  accountType: string;
  credits: number;
  userCount: number;
};

type DisplayUserRow = {
  id: string;
  source: UserSource;
  requestId: string | null;
  name: string;
  email: string;
  phone: string;
  permissions: FrontendPermissionSet;
  reviewStatus: ReviewStatus;
};

const router = useRouter();
const route = useRoute();
const companyId = String(route.params.companyId ?? "");
const session = getStoredBackendSession();
const isSales = session?.role === "sales";

const activeTab = ref<"company" | "users">("company");
const userSearchTerm = ref("");
const userViewMode = ref<UserViewMode>("table");

const customers = ref<BackendCustomerRow[]>([]);
const users = ref<FrontendUser[]>([]);
const userAdditionRequests = ref<BackendApplication[]>([]);
const selectedUserId = ref("");
const selectedRequestId = ref("");
const createTargetCompanyId = ref("");

const pageError = ref("");
const pageMessage = ref("");
const isLoading = ref(false);
const isSubmitting = ref(false);
const accountTypeOptions = [
  { label: "標準版", value: "標準版" },
  { label: "試用版", value: "試用版" },
];

const companyDraft = ref<CompanyDraft>({
  name: "",
  taxId: "",
  accountType: "標準版",
  credits: 0,
  userCount: 0,
});

const defaultPermissions = (): FrontendPermissionSet => ({
  uploadCode: false,
  downloadReport: true,
  viewHistory: true,
});

const emptyUserForm = (): UserForm => ({
  id: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  permissions: defaultPermissions(),
});

const userForm = ref<UserForm>(emptyUserForm());

const selectedCompany = computed(
  () => customers.value.find((customer) => customer.id === companyId) ?? null,
);
const fromApplicationsEntry = computed(
  () => route.query.entry === "applications",
);
const fromApplicationsCreateMode = computed(
  () => fromApplicationsEntry.value && route.query.mode === "create",
);
const fromApplicationsEditRequestMode = computed(
  () => fromApplicationsEntry.value && route.query.mode === "edit_request",
);
const canSubmitUserReview = computed(
  () =>
    isSales &&
    (userViewMode.value === "create" || userViewMode.value === "edit_request"),
);
const isPasswordRequired = computed(
  () => userViewMode.value === "create" && !canSubmitUserReview.value,
);
const canSelectCreateCompany = computed(
  () => userViewMode.value === "create" && fromApplicationsEntry.value,
);
const createCompanyOptions = computed(() =>
  customers.value.map((customer) => ({
    label: customer.name,
    value: customer.id,
  })),
);

const displayUsers = computed<DisplayUserRow[]>(() => {
  const approvedRows: DisplayUserRow[] = users.value.map((user) => ({
    id: user.id,
    source: "actual",
    requestId: null,
    name: user.name,
    email: user.email,
    phone: user.phone,
    permissions: user.permissions,
    reviewStatus: "approved",
  }));

  const requestRows: DisplayUserRow[] = userAdditionRequests.value
    .filter(
      (app) =>
        app.status === "draft" ||
        app.status === "pending" ||
        app.status === "rejected",
    )
    .map((app) => {
      const reqUser = app.companyUsers?.[0];
      return {
        id: app.id,
        source: "request",
        requestId: app.id,
        name: reqUser?.name || app.applicant,
        email: reqUser?.email || app.email,
        phone: reqUser?.phone || app.phone,
        permissions: reqUser?.permissions || defaultPermissions(),
        reviewStatus: app.status as ReviewStatus,
      };
    });

  return [...approvedRows, ...requestRows];
});

const filteredUsers = computed(() => {
  const keyword = userSearchTerm.value.trim().toLowerCase();
  if (!keyword) return displayUsers.value;
  return displayUsers.value.filter(
    (user) =>
      user.name.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword),
  );
});

const selectedUser = computed(
  () => users.value.find((u) => u.id === selectedUserId.value) ?? null,
);

const clearMessages = () => {
  pageError.value = "";
  pageMessage.value = "";
};

const handleBack = () => {
  if (
    fromApplicationsCreateMode.value ||
    fromApplicationsEditRequestMode.value
  ) {
    router.push("/admin/applications");
    return;
  }
  router.push("/admin/customers");
};

// 跳轉至點數管理頁面，可帶上公司 ID 供篩選
const goToCredits = () => {
  router.push({ path: `/admin/customers/${companyId}/topup` });
};

const permissionDot = (enabled: boolean) =>
  enabled
    ? "inline-block w-3 h-3 rounded-full bg-emerald-500"
    : "inline-block w-3 h-3 rounded-full bg-slate-300";

const syncCompanyDraft = () => {
  if (!selectedCompany.value) return;
  companyDraft.value = {
    name: selectedCompany.value.name,
    taxId: selectedCompany.value.taxId,
    accountType: selectedCompany.value.accountType,
    credits: selectedCompany.value.credits,
    userCount: selectedCompany.value.userCount,
  };
};

const loadData = async () => {
  customers.value = await listBackendCustomers();
  syncCompanyDraft();
  if (selectedCompany.value) {
    users.value = await listFrontendUsersByCompany(selectedCompany.value.id);
    userAdditionRequests.value = await listUserAdditionRequestsByCompany(
      selectedCompany.value.id,
    );
  }
};

const saveCompany = async () => {
  clearMessages();
  if (!selectedCompany.value) return;

  if (
    !companyDraft.value.name.trim() ||
    !companyDraft.value.taxId.trim() ||
    !companyDraft.value.accountType.trim()
  ) {
    pageError.value = "公司名稱、統一編號、帳號類型不得為空";
    return;
  }
  if (companyDraft.value.credits < 0) {
    pageError.value = "剩餘點數不能小於 0";
    return;
  }

  try {
    isSubmitting.value = true;
    await updateBackendCustomer(selectedCompany.value.id, {
      name: companyDraft.value.name,
      taxId: companyDraft.value.taxId,
      accountType: companyDraft.value.accountType,
      credits: companyDraft.value.credits,
      userCount: selectedCompany.value.userCount,
    });
    await loadData();
    pageMessage.value = `公司 ${selectedCompany.value.id} 已更新`;
  } catch (err) {
    pageError.value = err instanceof Error ? err.message : "更新公司資料失敗";
  } finally {
    isSubmitting.value = false;
  }
};

const openEditUser = (userId: string) => {
  clearMessages();
  const row = filteredUsers.value.find((u) => u.id === userId);
  if (!row) return;
  if (row.reviewStatus === "pending") {
    pageError.value = "審核中的內容不可編輯";
    return;
  }

  if (row.source === "request") {
    const request = userAdditionRequests.value.find(
      (app) => app.id === row.requestId,
    );
    if (!request) return;
    const requestUser = request.companyUsers?.[0];
    selectedRequestId.value = request.id;
    selectedUserId.value = "";
    userForm.value = {
      id: "",
      name: requestUser?.name || request.applicant,
      email: requestUser?.email || request.email,
      phone: requestUser?.phone || request.phone,
      password: requestUser?.password || "123",
      permissions: requestUser?.permissions || defaultPermissions(),
    };
    userViewMode.value = "edit_request";
    return;
  }

  const user = users.value.find((u) => u.id === row.id);
  if (!user) return;

  selectedUserId.value = user.id;
  selectedRequestId.value = "";
  userForm.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    password: "",
    permissions: {
      uploadCode: user.permissions.uploadCode,
      downloadReport: user.permissions.downloadReport,
      viewHistory: user.permissions.viewHistory,
    },
  };
  userViewMode.value = "edit";
};

const openCreateUser = () => {
  clearMessages();
  selectedUserId.value = "";
  selectedRequestId.value = "";
  createTargetCompanyId.value = fromApplicationsEntry.value
    ? ""
    : selectedCompany.value?.id || "";
  userForm.value = emptyUserForm();
  if (isSales) userForm.value.password = "123";
  userViewMode.value = "create";
};

const openEditRequestById = (requestId: string) => {
  const request = userAdditionRequests.value.find(
    (app) => app.id === requestId,
  );
  if (!request) return;
  const requestUser = request.companyUsers?.[0];
  createTargetCompanyId.value =
    request.companyId || selectedCompany.value?.id || "";
  selectedRequestId.value = request.id;
  selectedUserId.value = "";
  userForm.value = {
    id: "",
    name: requestUser?.name || request.applicant,
    email: requestUser?.email || request.email,
    phone: requestUser?.phone || request.phone,
    password: requestUser?.password || "123",
    permissions: requestUser?.permissions || defaultPermissions(),
  };
  userViewMode.value = "edit_request";
};

const backToUserTable = () => {
  if (
    (fromApplicationsCreateMode.value && userViewMode.value === "create") ||
    (fromApplicationsEditRequestMode.value &&
      userViewMode.value === "edit_request")
  ) {
    router.push("/admin/applications");
    return;
  }
  clearMessages();
  userViewMode.value = "table";
  selectedUserId.value = "";
  selectedRequestId.value = "";
  userForm.value = emptyUserForm();
};

const buildUserAdditionPayload = (): {
  companyId: string;
  company: string;
  taxId: string;
  user: BackendApplicationUser;
  notes?: string;
} | null => {
  if (fromApplicationsEntry.value && !createTargetCompanyId.value) {
    pageError.value = "請先選擇公司";
    return null;
  }
  const targetCompany =
    customers.value.find((c) => c.id === createTargetCompanyId.value) ||
    selectedCompany.value;
  if (!targetCompany) return null;
  return {
    companyId: targetCompany.id,
    company: targetCompany.name,
    taxId: targetCompany.taxId,
    user: {
      name: userForm.value.name,
      email: userForm.value.email,
      phone: userForm.value.phone,
      role: "member",
      password: userForm.value.password || "123",
      permissions: userForm.value.permissions,
    },
    notes: "",
  };
};

const saveUserDraft = async () => {
  clearMessages();
  if (!canSubmitUserReview.value) return;
  const payload = buildUserAdditionPayload();
  if (!payload) {
    pageError.value = "找不到公司資料";
    return;
  }

  try {
    isSubmitting.value = true;
    const item = await saveUserAdditionDraft(
      payload,
      selectedRequestId.value || undefined,
    );
    pageMessage.value = "人員申請草稿已儲存";
    selectedRequestId.value = item.id;
    await loadData();
    backToUserTable();
  } catch (err) {
    pageError.value = err instanceof Error ? err.message : "暫存草稿失敗";
  } finally {
    isSubmitting.value = false;
  }
};

const submitUserForm = async () => {
  clearMessages();
  if (!selectedCompany.value) {
    pageError.value = "找不到公司資料";
    return;
  }

  try {
    isSubmitting.value = true;
    if (canSubmitUserReview.value) {
      const payload = buildUserAdditionPayload();
      if (!payload) throw new Error("找不到公司資料");
      await submitUserAdditionForReview(
        payload,
        selectedRequestId.value || undefined,
      );
      pageMessage.value = "人員新增申請已送出審核";
    } else if (userViewMode.value === "create") {
      const targetCompanyId =
        createTargetCompanyId.value || selectedCompany.value.id;
      await createFrontendUserForCompany(targetCompanyId, {
        name: userForm.value.name,
        email: userForm.value.email,
        phone: userForm.value.phone,
        password: userForm.value.password,
        permissions: userForm.value.permissions,
      });
      pageMessage.value = "使用者已新增";
    } else if (userViewMode.value === "edit") {
      await updateFrontendUserCredentialAndPermissions(userForm.value.id, {
        name: userForm.value.name,
        email: userForm.value.email,
        phone: userForm.value.phone,
        password: userForm.value.password,
        permissions: userForm.value.permissions,
      });
      pageMessage.value = `使用者 ${selectedUser.value?.name || ""} 已更新`;
    }

    if (selectedCompany.value) {
      users.value = await listFrontendUsersByCompany(selectedCompany.value.id);
    }
    await loadData();
    backToUserTable();
  } catch (err) {
    pageError.value = err instanceof Error ? err.message : "儲存使用者失敗";
  } finally {
    isSubmitting.value = false;
  }
};

const statusLabel = (status: ReviewStatus) => {
  if (status === "approved") return "審核通過";
  if (status === "pending") return "審核中";
  if (status === "rejected") return "審核失敗";
  return "草稿";
};

const statusBadgeClass = (status: ReviewStatus) => {
  if (status === "approved")
    return "px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full";
  if (status === "pending")
    return "px-2 py-1 bg-brand-100 text-brand-700 text-xs rounded-full";
  if (status === "rejected")
    return "px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full";
  return "px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full";
};

onMounted(async () => {
  isLoading.value = true;
  try {
    await loadData();
    if (!selectedCompany.value) {
      pageError.value = "找不到此公司資料";
      return;
    }
    createTargetCompanyId.value = selectedCompany.value.id;

    const requestedTab =
      typeof route.query.tab === "string" ? route.query.tab : "";
    if (route.query.topupSubmitted === "1") {
      const appId =
        typeof route.query.appId === "string" ? route.query.appId : "";
      pageMessage.value = appId
        ? `儲值申請 ${appId} 已送出審核`
        : "儲值申請已送出審核";
    }

    if (requestedTab === "users") {
      activeTab.value = "users";
    }
    const requestedMode =
      typeof route.query.mode === "string" ? route.query.mode : "";
    const requestId =
      typeof route.query.requestId === "string" ? route.query.requestId : "";
    if (requestedMode === "edit_request" && requestId) {
      activeTab.value = "users";
      openEditRequestById(requestId);
    } else if (requestedMode === "create") {
      activeTab.value = "users";
      openCreateUser();
    } else if (requestId) {
      activeTab.value = "users";
      openEditRequestById(requestId);
    }
  } catch (err) {
    pageError.value = err instanceof Error ? err.message : "載入資料失敗";
  } finally {
    isLoading.value = false;
  }
});
</script>
