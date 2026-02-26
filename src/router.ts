import { createRouter, createWebHistory } from 'vue-router';
import FrontendLogin from './pages/frontend/Login.vue';
import FrontendDashboard from './pages/frontend/Dashboard.vue';
import FrontendScanUpload from './pages/frontend/ScanUpload.vue';
import FrontendScanHistory from './pages/frontend/ScanHistory.vue';
import FrontendProfile from './pages/frontend/Profile.vue';
import FrontendForgotPassword from './pages/frontend/ForgotPassword.vue';
import FrontendResetPassword from './pages/frontend/ResetPassword.vue';
import BackendLogin from './pages/backend/Login.vue';
import BackendDashboard from './pages/backend/Dashboard.vue';
import BackendCustomers from './pages/backend/Customers.vue';
import BackendCustomerDetail from './pages/backend/CustomerDetail.vue';
import BackendCustomerTopUpReview from './pages/backend/CustomerTopUpReview.vue';
import BackendApplications from './pages/backend/Applications.vue';
import BackendPermissions from './pages/backend/Permissions.vue';
import BackendCredits from './pages/backend/Credits.vue';
import BackendApplicationCreate from './pages/backend/ApplicationCreate.vue';
import BackendTopUpReviews from './pages/backend/TopUpReviews.vue';
import NotFound from './pages/NotFound.vue';
import { getCurrentFrontendPermission, hasStoredFrontendSession } from './services/state/frontendSession';
import { getBackendRole, hasStoredBackendSession } from './services/state/backendSession';

const routes = [
  { path: '/', component: FrontendLogin },
  { path: '/forgot-password', component: FrontendForgotPassword },
  { path: '/reset-password/:token', component: FrontendResetPassword },
  { path: '/dashboard', component: FrontendDashboard },
  { path: '/scan', component: FrontendScanUpload },
  { path: '/history', component: FrontendScanHistory },
  { path: '/profile', component: FrontendProfile },
  { path: '/admin', component: BackendLogin },
  { path: '/admin/dashboard', component: BackendDashboard },
  { path: '/admin/customers', component: BackendCustomers },
  { path: '/admin/customers/:companyId', component: BackendCustomerDetail },
  { path: '/admin/customers/:companyId/topup', component: BackendCustomerTopUpReview },
  { path: '/admin/applications', component: BackendApplications },
  { path: '/admin/applications/new', component: BackendApplicationCreate },
  { path: '/admin/topup-requests', component: BackendTopUpReviews },
  { path: '/admin/permissions', component: BackendPermissions },
  { path: '/admin/credits', component: BackendCredits },
  { path: '/:pathMatch(.*)*', component: NotFound },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

const frontendProtected = new Set(['/dashboard', '/scan', '/history', '/profile']);

router.beforeEach((to) => {
  const isBackendPath = to.path.startsWith('/admin');
  const isBackendLogin = to.path === '/admin';

  if (isBackendPath && !isBackendLogin && !hasStoredBackendSession()) {
    return '/admin';
  }
  if (isBackendLogin && hasStoredBackendSession()) {
    const role = getBackendRole();
    return role === 'adm' ? '/admin/dashboard' : '/admin/applications';
  }

  const role = getBackendRole();
  if (isBackendPath) {
    if (role === 'sales' && ![
      '/admin',
      '/admin/applications',
      '/admin/applications/new',
      '/admin/customers',
      '/admin/topup-requests',
    ].includes(to.path) && !to.path.startsWith('/admin/customers/')) {
      return '/admin/applications';
    }
    if (role === 'pm' && !['/admin', '/admin/applications', '/admin/topup-requests'].includes(to.path)) {
      return '/admin/applications';
    }
  }

  if (frontendProtected.has(to.path) && !hasStoredFrontendSession()) {
    return '/';
  }
  if (to.path === '/scan' && !getCurrentFrontendPermission()?.uploadCode) {
    return '/dashboard';
  }
  if (to.path === '/' && hasStoredFrontendSession()) {
    return '/dashboard';
  }
  return true;
});
