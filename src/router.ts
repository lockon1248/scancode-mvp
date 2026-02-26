import { createRouter, createWebHistory } from 'vue-router';
import { getCurrentFrontendPermission, hasStoredFrontendSession } from './services/state/frontendSession';
import { getBackendRole, hasStoredBackendSession } from './services/state/backendSession';

const routes = [
  { path: '/', component: () => import('./pages/frontend/Login.vue') },
  { path: '/forgot-password', component: () => import('./pages/frontend/ForgotPassword.vue') },
  { path: '/reset-password/:token', component: () => import('./pages/frontend/ResetPassword.vue') },
  { path: '/dashboard', component: () => import('./pages/frontend/Dashboard.vue') },
  { path: '/scan', component: () => import('./pages/frontend/ScanUpload.vue') },
  { path: '/history', component: () => import('./pages/frontend/ScanHistory.vue') },
  { path: '/profile', component: () => import('./pages/frontend/Profile.vue') },
  { path: '/admin', component: () => import('./pages/backend/Login.vue') },
  { path: '/admin/dashboard', component: () => import('./pages/backend/Dashboard.vue') },
  { path: '/admin/customers', component: () => import('./pages/backend/Customers.vue') },
  { path: '/admin/customers/:companyId', component: () => import('./pages/backend/CustomerDetail.vue') },
  { path: '/admin/customers/:companyId/topup', component: () => import('./pages/backend/CustomerTopUpReview.vue') },
  { path: '/admin/applications', component: () => import('./pages/backend/Applications.vue') },
  { path: '/admin/applications/new', component: () => import('./pages/backend/ApplicationCreate.vue') },
  { path: '/admin/topup-requests', component: () => import('./pages/backend/TopUpReviews.vue') },
  { path: '/admin/permissions', component: () => import('./pages/backend/Permissions.vue') },
  { path: '/admin/credits', component: () => import('./pages/backend/Credits.vue') },
  { path: '/:pathMatch(.*)*', component: () => import('./pages/NotFound.vue') },
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
