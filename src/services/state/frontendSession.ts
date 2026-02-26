import { computed, ref } from 'vue';
import { getCompanyById } from '../mock-api/companyApi';
import { getFrontendUserById, loginFrontend as loginFrontendApi } from '../mock-api/authApi';
import type { Company, FrontendPermissionSet, FrontendUser } from '../types/model';

const SESSION_KEY = 'orange_frontend_user_id';

const initialized = ref(false);
const sessionUser = ref<FrontendUser | null>(null);
const sessionCompany = ref<Company | null>(null);

export const isFrontendLoggedIn = computed(() => Boolean(sessionUser.value));

export const hasStoredFrontendSession = (): boolean =>
  Boolean(localStorage.getItem(SESSION_KEY));

export const initializeFrontendSession = async (): Promise<void> => {
  if (initialized.value) return;
  initialized.value = true;

  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) return;

  const user = await getFrontendUserById(userId);
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  const company = await getCompanyById(user.companyId);
  if (!company) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  sessionUser.value = user;
  sessionCompany.value = company;
};

export const loginFrontend = async (email: string, password: string): Promise<void> => {
  const result = await loginFrontendApi(email, password);
  sessionUser.value = result.user;
  sessionCompany.value = result.company;
  localStorage.setItem(SESSION_KEY, result.user.id);
};

export const refreshFrontendSession = async (): Promise<void> => {
  if (!sessionUser.value) return;
  const freshUser = await getFrontendUserById(sessionUser.value.id);
  if (!freshUser) {
    logoutFrontend();
    return;
  }
  const freshCompany = await getCompanyById(freshUser.companyId);
  sessionUser.value = freshUser;
  sessionCompany.value = freshCompany;
};

export const logoutFrontend = (): void => {
  sessionUser.value = null;
  sessionCompany.value = null;
  localStorage.removeItem(SESSION_KEY);
};

export const useFrontendSession = () => {
  return {
    sessionUser,
    sessionCompany,
    isFrontendLoggedIn,
    loginFrontend,
    refreshFrontendSession,
    logoutFrontend,
  };
};

export const getCurrentFrontendPermission = (): FrontendPermissionSet | null =>
  sessionUser.value?.permissions ?? null;
