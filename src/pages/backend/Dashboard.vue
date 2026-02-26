<template>
  <BackendLayout>
    <div class="space-y-6">
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="(stat, index) in stats"
          :key="stat.label"
          class="bg-white rounded-xl p-6 border border-slate-200"
        >
          <div class="flex items-start justify-between mb-4">
            <div :class="['relative w-12 h-12 rounded-lg flex items-center justify-center shadow-sm', stat.colorClass]">
              <component :is="stat.icon" class="w-6 h-6 text-white" />
            </div>
            <span v-if="stat.trend" class="text-sm text-green-600">{{ stat.trend }}</span>
          </div>
          <div class="text-3xl mb-1 tabular-nums">{{ formatStatValue(animatedStatValues[index] || 0) }}</div>
          <div class="text-sm text-slate-600">{{ stat.label }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Applications -->
        <div class="bg-white rounded-xl border border-slate-200">
          <div class="p-6 border-b border-slate-200">
            <div class="flex items-center justify-between">
              <h2 class="text-xl">最新申請</h2>
              <span class="text-sm text-brand-600">5 筆待審核</span>
            </div>
          </div>
          <div class="divide-y divide-slate-200">
            <div
              v-for="app in recentApplications"
              :key="app.id"
              class="p-4 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <div class="text-sm text-slate-500 mb-1">{{ app.id }}</div>
                  <div class="text-slate-900 mb-1">{{ app.company }}</div>
                  <div class="text-sm text-slate-600">申請人：{{ app.applicant }}</div>
                </div>
                <span :class="getStatusBadgeClass(app.status)">
                  {{ getStatusText(app.status) }}
                </span>
              </div>
              <div class="text-xs text-slate-500 flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ app.date }}
              </div>
            </div>
          </div>
          <div class="p-4 border-t border-slate-200 text-center">
            <button
              @click="router.push('/admin/applications')"
              class="text-sm text-brand-600 hover:text-brand-700"
            >
              查看全部申請
            </button>
          </div>
        </div>

        <!-- Recent Activities -->
        <div class="bg-white rounded-xl border border-slate-200">
          <div class="p-6 border-b border-slate-200">
            <h2 class="text-xl">最新活動</h2>
          </div>
          <div class="divide-y divide-slate-200">
            <div
              v-for="(activity, index) in recentActivities"
              :key="index"
              class="p-4 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 bg-brand-500 rounded-full mt-2 shrink-0"></div>
                <div class="flex-1">
                  <div class="text-sm text-slate-900 mb-1">
                    <span class="text-brand-600">{{ activity.action }}</span>
                    · {{ activity.target }}
                  </div>
                  <div class="text-xs text-slate-600">{{ activity.user }}</div>
                  <div class="text-xs text-slate-500 mt-1">{{ activity.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-center gap-2 mb-4">
          <TrendingUp class="w-5 h-5 text-slate-600" />
          <h2 class="text-xl">申請分析</h2>
        </div>
        <div class="mb-4 inline-flex rounded-lg border border-slate-300 bg-white p-1">
          <button
            @click="activeChartTab = 'trend'"
            :class="activeChartTab === 'trend' ? 'bg-brand-500 text-white' : 'text-slate-700'"
            class="px-3 py-2 text-sm rounded-md"
          >
            申請趨勢
          </button>
          <button
            @click="activeChartTab = 'type'"
            :class="activeChartTab === 'type' ? 'bg-brand-500 text-white' : 'text-slate-700'"
            class="px-3 py-2 text-sm rounded-md"
          >
            類型占比
          </button>
          <button
            @click="activeChartTab = 'sales'"
            :class="activeChartTab === 'sales' ? 'bg-brand-500 text-white' : 'text-slate-700'"
            class="px-3 py-2 text-sm rounded-md"
          >
            業務排行
          </button>
        </div>
        <div class="bg-slate-50 rounded-lg border border-slate-200 p-3 md:p-4">
          <div ref="adminChartEl" class="h-72 w-full"></div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <h2 class="text-xl mb-4">快速操作</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            @click="router.push('/admin/customers')"
            class="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors text-center"
          >
            <Users class="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <div class="text-sm text-slate-700">新增客戶</div>
          </button>
          <button
            @click="router.push('/admin/applications')"
            class="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors text-center"
          >
            <FileCheck class="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <div class="text-sm text-slate-700">審核申請</div>
          </button>
          <button
            @click="router.push('/admin/credits')"
            class="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors text-center"
          >
            <Coins class="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <div class="text-sm text-slate-700">點數充值</div>
          </button>
          <button
            @click="router.push('/admin/permissions')"
            class="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors text-center"
          >
            <Lock class="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <div class="text-sm text-slate-700">權限設定</div>
          </button>
        </div>
      </div>
    </div>
  </BackendLayout>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BackendLayout from '@/components/BackendLayout.vue';
import { Users, FileCheck, TrendingUp, Clock, CheckCircle, Coins, Lock } from 'lucide-vue-next';
import { listBackendApplications } from '@/services/mock-api/backendApplicationsApi';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

const router = useRouter();
const adminChartEl = ref<HTMLElement | null>(null);
const activeChartTab = ref<'trend' | 'type' | 'sales'>('trend');
let adminChart: ReturnType<typeof echarts.init> | null = null;
let resizeObserver: ResizeObserver | null = null;
let statsAnimationFrame: number | null = null;
const handleWindowResize = () => {
  adminChart?.resize();
};

const stats = [
  { label: '總客戶數', value: 128, icon: Users, colorClass: 'bg-blue-500', trend: '+12%' },
  { label: '待審核申請', value: 5, icon: FileCheck, colorClass: 'bg-brand-500', trend: '' },
  { label: '本月掃描', value: 1234, icon: TrendingUp, colorClass: 'bg-green-500', trend: '+8%' },
  { label: '活躍用戶', value: 456, icon: CheckCircle, colorClass: 'bg-purple-500', trend: '+5%' },
];
const animatedStatValues = ref<number[]>(stats.map(() => 0));

const formatStatValue = (value: number) => new Intl.NumberFormat('zh-TW').format(value);

const animateStats = () => {
  if (statsAnimationFrame) cancelAnimationFrame(statsAnimationFrame);
  const startAt = performance.now();
  const duration = 900;
  const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

  const step = (now: number) => {
    const progress = Math.min(1, (now - startAt) / duration);
    const eased = easeOutCubic(progress);
    animatedStatValues.value = stats.map((stat) => Math.round(stat.value * eased));
    if (progress < 1) {
      statsAnimationFrame = requestAnimationFrame(step);
    } else {
      statsAnimationFrame = null;
    }
  };

  statsAnimationFrame = requestAnimationFrame(step);
};

const recentApplications = [
  { id: 'APP-001', company: '聯發科技股份有限公司', applicant: '李經理', date: '2024-02-11', status: 'pending' },
  { id: 'APP-002', company: '華碩電腦股份有限公司', applicant: '陳主任', date: '2024-02-11', status: 'pending' },
  { id: 'APP-003', company: '宏達國際電子股份有限公司', applicant: '林副理', date: '2024-02-10', status: 'approved' },
];

const recentActivities = [
  { action: '新增客戶', user: '業務 - 張小美', target: '台積電股份有限公司', time: '30 分鐘前' },
  { action: '審核通過', user: 'PDM - 王小華', target: '帳號申請 APP-003', time: '1 小時前' },
  { action: '點數充值', user: '業務 - 李大明', target: '聯發科 +5000 點', time: '2 小時前' },
  { action: '權限變更', user: 'PDM - 王小華', target: '用戶 user@tsmc.com', time: '3 小時前' },
];

const getStatusBadgeClass = (status: string) => {
  if (status === 'approved') return 'px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full';
  if (status === 'pending') return 'px-2 py-1 bg-brand-100 text-brand-700 text-xs rounded-full';
  return 'px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full';
};

const getStatusText = (status: string) => {
  if (status === 'approved') return '已核准';
  if (status === 'pending') return '待審核';
  return '已拒絕';
};

const formatMonthLabel = (year: number, month: number) =>
  `${String(month + 1).padStart(2, '0')}月`;

const parseSubmittedDate = (value: string): Date | null => {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d);
};

const loadAdminCharts = async () => {
  const apps = await listBackendApplications();
  const now = new Date();
  const monthKeys: string[] = [];
  const monthLabels: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthKeys.push(key);
    monthLabels.push(formatMonthLabel(d.getFullYear(), d.getMonth()));
  }

  const pendingCounts = Array(monthKeys.length).fill(0);
  const approvedCounts = Array(monthKeys.length).fill(0);
  const rejectedCounts = Array(monthKeys.length).fill(0);
  const draftCounts = Array(monthKeys.length).fill(0);

  for (const app of apps) {
    const date = parseSubmittedDate(app.submittedDate);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const idx = monthKeys.indexOf(key);
    if (idx < 0) continue;
    if (app.status === 'pending') pendingCounts[idx] += 1;
    else if (app.status === 'approved') approvedCounts[idx] += 1;
    else if (app.status === 'rejected') rejectedCounts[idx] += 1;
    else draftCounts[idx] += 1;
  }

  const trendOption = {
    color: ['#0ea5e9', '#22c55e', '#ef4444', '#94a3b8'],
    animationDuration: 450,
    animationDurationUpdate: 550,
    animationEasingUpdate: 'cubicOut' as const,
    tooltip: { trigger: 'axis' as const },
    legend: {
      data: ['待審核', '已核准', '已拒絕', '草稿'],
      top: 0,
      textStyle: { color: '#475569' },
    },
    grid: { left: 28, right: 16, top: 36, bottom: 18, containLabel: true },
    xAxis: {
      type: 'category',
      data: monthLabels,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      { name: '待審核', type: 'bar', data: pendingCounts, barMaxWidth: 18, universalTransition: true },
      { name: '已核准', type: 'bar', data: approvedCounts, barMaxWidth: 18, universalTransition: true },
      { name: '已拒絕', type: 'bar', data: rejectedCounts, barMaxWidth: 18, universalTransition: true },
      { name: '草稿', type: 'bar', data: draftCounts, barMaxWidth: 18, universalTransition: true },
    ],
  } satisfies EChartsOption;

  const companyCount = apps.filter(a => (a.type || 'company_onboarding') === 'company_onboarding').length;
  const userAdditionCount = apps.filter(a => (a.type || 'company_onboarding') === 'user_addition').length;
  const typeOption = {
    color: ['#0ea5e9', '#f59e0b'],
    animationDuration: 450,
    animationDurationUpdate: 550,
    animationEasingUpdate: 'cubicOut' as const,
    tooltip: { trigger: 'item' as const },
    legend: {
      bottom: 0,
      textStyle: { color: '#475569' },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '45%'],
        label: { formatter: '{b}\n{c}' },
        universalTransition: true,
        data: [
          { name: '公司申請', value: companyCount },
          { name: '個人申請', value: userAdditionCount },
        ],
      },
    ],
  } satisfies EChartsOption;

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const salesMap = new Map<string, number>();
  for (const app of apps) {
    const date = parseSubmittedDate(app.submittedDate);
    if (!date || date < since) continue;
    const key = app.submittedBy.replace(/^業務\s*-\s*/, '').trim() || app.submittedBy;
    salesMap.set(key, (salesMap.get(key) || 0) + 1);
  }
  const ranking = Array.from(salesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const categories = ranking.map(item => item[0]);
  const values = ranking.map(item => item[1]);
  const salesOption = {
    color: ['#06b6d4'],
    animationDuration: 450,
    animationDurationUpdate: 550,
    animationEasingUpdate: 'cubicOut' as const,
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    grid: { left: 20, right: 16, top: 8, bottom: 18, containLabel: true },
    xAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: '#475569' },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    series: [
      {
        name: '申請數',
        type: 'bar',
        data: values,
        barMaxWidth: 18,
        label: { show: true, position: 'right', color: '#334155' },
        universalTransition: true,
      },
    ],
  } satisfies EChartsOption;

  const trendZeroOption = {
    ...trendOption,
    series: [
      { ...(trendOption.series[0] as object), data: pendingCounts.map(() => 0) },
      { ...(trendOption.series[1] as object), data: approvedCounts.map(() => 0) },
      { ...(trendOption.series[2] as object), data: rejectedCounts.map(() => 0) },
      { ...(trendOption.series[3] as object), data: draftCounts.map(() => 0) },
    ],
  } satisfies EChartsOption;
  const typeZeroOption = {
    ...typeOption,
    series: [
      {
        ...((typeOption.series[0] as object) || {}),
        data: [
          { name: '公司申請', value: 0 },
          { name: '個人申請', value: 0 },
        ],
      },
    ],
  } satisfies EChartsOption;
  const salesZeroOption = {
    ...salesOption,
    series: [
      {
        ...((salesOption.series[0] as object) || {}),
        data: values.map(() => 0),
      },
    ],
  } satisfies EChartsOption;

  await nextTick();
  if (!adminChartEl.value) return;
  if (!adminChart) adminChart = echarts.init(adminChartEl.value);

  if (activeChartTab.value === 'trend') {
    adminChart.setOption(trendZeroOption, true);
    requestAnimationFrame(() => adminChart?.setOption(trendOption, false));
  }
  if (activeChartTab.value === 'type') {
    adminChart.setOption(typeZeroOption, true);
    requestAnimationFrame(() => adminChart?.setOption(typeOption, false));
  }
  if (activeChartTab.value === 'sales') {
    adminChart.setOption(salesZeroOption, true);
    requestAnimationFrame(() => adminChart?.setOption(salesOption, false));
  }
};

onMounted(async () => {
  animateStats();
  await loadAdminCharts();
  if (adminChartEl.value) {
    resizeObserver = new ResizeObserver(() => adminChart?.resize());
    resizeObserver.observe(adminChartEl.value);
  }
  window.addEventListener('resize', handleWindowResize);
});

watch(activeChartTab, async () => {
  await loadAdminCharts();
  adminChart?.resize();
});

onBeforeUnmount(() => {
  if (statsAnimationFrame) cancelAnimationFrame(statsAnimationFrame);
  resizeObserver?.disconnect();
  resizeObserver = null;
  adminChart?.dispose();
  adminChart = null;
  window.removeEventListener('resize', handleWindowResize);
});
</script>
