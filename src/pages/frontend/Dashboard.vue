<template>
  <FrontendLayout>
    <div class="space-y-6">
      <div class="relative bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-8 text-white">
        <div
          v-if="isTrialAccount"
          class="absolute right-4 top-4 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs text-white backdrop-blur-sm"
        >
          試用版帳號
        </div>
        <h1 class="text-3xl mb-2">歡迎回來，{{ displayName }}</h1>
        <p class="text-brand-100 mb-6">讓我們開始進行程式碼安全檢測</p>
        <p v-if="isTrialAccount" class="mb-4 text-sm text-brand-100/95">
          目前為試用版，正式啟用可解鎖完整功能與更高額度。
        </p>
        <button
          @click="router.push('/scan')"
          class="bg-white text-brand-600 px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-2"
        >
          <Upload class="w-5 h-5" />
          上傳新的掃描
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="bg-white rounded-xl p-6 border border-slate-200"
        >
          <div class="flex items-start justify-between mb-4">
            <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', stat.colorClass]">
              <component :is="stat.icon" class="w-6 h-6" />
            </div>
          </div>
          <div class="text-3xl mb-1">{{ stat.value }}</div>
          <div class="text-sm text-slate-600">{{ stat.label }}</div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200">
        <div class="p-6 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl">最近掃描記錄</h2>
            <button
              @click="router.push('/history')"
              class="text-sm text-brand-600 hover:text-brand-700"
            >
              查看全部
            </button>
          </div>
        </div>
        <div class="divide-y divide-slate-200">
          <div
            v-for="scan in recentScans"
            :key="scan.id"
            class="p-6 hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-sm text-slate-500">{{ scan.id }}</span>
                  <span :class="getStatusBadgeClass(scan.status)">
                    {{ getStatusText(scan.status) }}
                  </span>
                </div>
                <div class="text-slate-900 mb-1">{{ scan.name }}</div>
                <div class="flex items-center gap-4 text-sm text-slate-500">
                  <span class="flex items-center gap-1">
                    <Calendar class="w-4 h-4" />
                    {{ formatDisplayDateTime(scan.uploadDate) }}
                  </span>
                  <span v-if="scan.issues" class="flex items-center gap-1">
                    <AlertTriangle class="w-4 h-4" />
                    {{ scan.issues.critical + scan.issues.high + scan.issues.medium + scan.issues.low }} 個問題
                  </span>
                </div>
              </div>
              <button
                v-if="scan.status === 'completed'"
                class="px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              >
                下載報告
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-center gap-2 mb-4">
          <TrendingUp class="w-5 h-5 text-slate-600" />
          <h2 class="text-xl">使用趨勢</h2>
        </div>

        <div class="flex w-full flex-wrap rounded-lg border border-slate-300 bg-white p-1 mb-4 gap-1 sm:inline-flex sm:w-auto">
          <button
            @click="activeTrendTab = 'scans'"
            :class="activeTrendTab === 'scans' ? 'bg-brand-500 text-white' : 'text-slate-700'"
            class="flex-1 sm:flex-none px-3 py-2 text-sm rounded-md whitespace-nowrap text-center"
          >
            掃描次數趨勢
          </button>
          <button
            @click="activeTrendTab = 'credits'"
            :class="activeTrendTab === 'credits' ? 'bg-brand-500 text-white' : 'text-slate-700'"
            class="flex-1 sm:flex-none px-3 py-2 text-sm rounded-md whitespace-nowrap text-center"
          >
            點數消耗趨勢
          </button>
          <button
            @click="activeTrendTab = 'issues'"
            :class="activeTrendTab === 'issues' ? 'bg-brand-500 text-white' : 'text-slate-700'"
            class="flex-1 sm:flex-none px-3 py-2 text-sm rounded-md whitespace-nowrap text-center"
          >
            問題等級趨勢
          </button>
        </div>

        <div v-if="activeTrendTab === 'scans'" class="space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <AppSelect v-model="scanRangeDays" :options="rangeOptions" :cast-number="true" />
            <AppSelect v-model="scanAccountFilter" :options="scanAccountOptions" />
          </div>

        </div>

        <div v-else-if="activeTrendTab === 'credits'" class="space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <AppSelect v-model="creditRangeDays" :options="rangeOptions" :cast-number="true" />
            <AppSelect v-model="creditStatusFilter" :options="creditStatusOptions" />
          </div>

        </div>

        <div v-else class="space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <AppSelect v-model="issueRangeDays" :options="rangeOptions" :cast-number="true" />
            <AppSelect v-model="issueBucket" :options="issueBucketOptions" />
          </div>

        </div>

        <div class="mt-5 bg-slate-50 rounded-lg p-3 md:p-4 border border-slate-200">
          <div ref="trendChartEl" class="h-64 md:h-72 w-full"></div>
        </div>
      </div>
    </div>
  </FrontendLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import FrontendLayout from '@/components/FrontendLayout.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import { Upload, FileCheck, AlertTriangle, Clock, TrendingUp, Calendar } from 'lucide-vue-next';
import { formatDisplayDateTime } from '@/services/mock-api/core';
import { listCompanyScans } from '@/services/mock-api/scanApi';
import { useFrontendSession } from '@/services/state/frontendSession';
import type { ScanTask } from '@/services/types/model';
import { init, use } from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

const router = useRouter();
const { sessionUser, sessionCompany } = useFrontendSession();
const scans = ref<ScanTask[]>([]);

const activeTrendTab = ref<'scans' | 'credits' | 'issues'>('scans');
const scanRangeDays = ref<7 | 30 | 90>(30);
const scanAccountFilter = ref<'all' | 'mine'>('all');
const creditRangeDays = ref<7 | 30 | 90>(30);
const creditStatusFilter = ref<'all' | 'completed'>('all');
const issueRangeDays = ref<7 | 30 | 90>(30);
const issueBucket = ref<'day' | 'week'>('day');
const trendChartEl = ref<HTMLElement | null>(null);
use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

let trendChart: ReturnType<typeof init> | null = null;
let resizeObserver: ResizeObserver | null = null;

const rangeOptions = [
  { label: '近 7 天', value: 7 },
  { label: '近 30 天', value: 30 },
  { label: '近 90 天', value: 90 },
];

const scanAccountOptions = [
  { label: '全部帳號', value: 'all' },
  { label: '僅我的帳號', value: 'mine' },
];

const creditStatusOptions = [
  { label: '全部狀態', value: 'all' },
  { label: '僅已完成掃描', value: 'completed' },
];

const issueBucketOptions = [
  { label: '日趨勢', value: 'day' },
  { label: '週趨勢', value: 'week' },
];

const displayName = computed(() => sessionUser.value?.name ?? '使用者');
const isTrialAccount = computed(() => sessionCompany.value?.accountType === '試用版');

const stats = computed(() => {
  const total = scans.value.length;
  const completed = scans.value.filter(s => s.status === 'completed').length;
  const processing = scans.value.filter(s => s.status === 'processing').length;
  const issues = scans.value
    .filter(s => s.status === 'completed' && s.issues)
    .reduce((sum, s) => {
      if (!s.issues) return sum;
      return sum + s.issues.critical + s.issues.high + s.issues.medium + s.issues.low;
    }, 0);

  return [
    { label: '累計掃描次數', value: String(total), icon: Upload, colorClass: 'bg-blue-100 text-blue-600' },
    { label: '已完成', value: String(completed), icon: FileCheck, colorClass: 'bg-green-100 text-green-600' },
    { label: '處理中', value: String(processing), icon: Clock, colorClass: 'bg-brand-100 text-brand-600' },
    { label: '發現問題', value: String(issues), icon: AlertTriangle, colorClass: 'bg-red-100 text-red-600' },
  ];
});

const recentScans = computed(() => scans.value.slice(0, 5));

const getStatusBadgeClass = (status: string) => {
  if (status === 'completed') return 'px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full';
  if (status === 'processing') return 'px-2 py-1 bg-brand-100 text-brand-700 text-xs rounded-full';
  return 'px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full';
};

const getStatusText = (status: string) => {
  if (status === 'completed') return '已完成';
  if (status === 'processing') return '處理中';
  return '待處理';
};

const msPerDay = 24 * 60 * 60 * 1000;

const toDateKey = (iso: string): string => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toLabel = (key: string): string => key.slice(5).replace('-', '/');

const buildDailyKeys = (days: number): string[] => {
  const now = new Date();
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * msPerDay);
    keys.push(toDateKey(d.toISOString()));
  }
  return keys;
};

const inRange = (iso: string, days: number): boolean => {
  const t = new Date(iso).getTime();
  return Date.now() - t <= days * msPerDay;
};

const scanTrendBase = computed(() => {
  return scans.value.filter(scan => {
    if (!inRange(scan.uploadDate, scanRangeDays.value)) return false;
    if (scanAccountFilter.value === 'mine') {
      return scan.uploadedByUserId === sessionUser.value?.id;
    }
    return true;
  });
});

const scanTrendData = computed(() => {
  const keys = buildDailyKeys(scanRangeDays.value);
  const counter = new Map(keys.map(key => [key, 0]));
  scanTrendBase.value.forEach(scan => {
    const key = toDateKey(scan.uploadDate);
    if (counter.has(key)) counter.set(key, (counter.get(key) || 0) + 1);
  });
  return keys.map(key => ({ key, label: toLabel(key), value: counter.get(key) || 0 }));
});

const scanLineDots = computed(() => {
  const data = scanTrendData.value;
  if (data.length === 0) return [];
  const max = Math.max(...data.map(item => item.value), 1);
  return data.map((item, idx) => {
    const x = data.length === 1 ? 50 : (idx / (data.length - 1)) * 100;
    const y = 35 - (item.value / max) * 30;
    return { x, y };
  });
});

const scanLinePoints = computed(() => scanLineDots.value.map(dot => `${dot.x},${dot.y}`).join(' '));

const creditTrendData = computed(() => {
  const keys = buildDailyKeys(creditRangeDays.value);
  const counter = new Map(keys.map(key => [key, 0]));
  scans.value.forEach(scan => {
    if (!inRange(scan.uploadDate, creditRangeDays.value)) return;
    if (creditStatusFilter.value === 'completed' && scan.status !== 'completed') return;
    const key = toDateKey(scan.uploadDate);
    if (!counter.has(key)) return;
    counter.set(key, (counter.get(key) || 0) + scan.creditsCost);
  });

  const raw = keys.map(key => ({ label: toLabel(key), value: counter.get(key) || 0 }));
  const max = Math.max(...raw.map(item => item.value), 1);
  return raw.map(item => ({ ...item, height: Math.max((item.value / max) * 100, item.value > 0 ? 8 : 2) }));
});

type IssueStackRow = {
  label: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

const issueStackData = computed<IssueStackRow[]>(() => {
  const completed = scans.value.filter(scan => scan.status === 'completed' && scan.issues && inRange(scan.uploadDate, issueRangeDays.value));

  if (issueBucket.value === 'day') {
    return completed
      .sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime())
      .map(scan => {
        const issues = scan.issues || { critical: 0, high: 0, medium: 0, low: 0 };
        const total = issues.critical + issues.high + issues.medium + issues.low;
        return {
          label: scan.name,
          total,
          critical: issues.critical,
          high: issues.high,
          medium: issues.medium,
          low: issues.low,
        };
      });
  }

  const weeks = Math.max(Math.ceil(issueRangeDays.value / 7), 1);
  const buckets = Array.from({ length: weeks }, (_, idx) => ({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
    names: [] as string[],
  }));

  completed.forEach(scan => {
    if (!scan.issues) return;
    const age = Math.floor((Date.now() - new Date(scan.uploadDate).getTime()) / msPerDay);
    const reverseBucket = Math.floor(age / 7);
    const bucketIndex = weeks - 1 - reverseBucket;
    if (bucketIndex < 0 || bucketIndex >= weeks) return;

    buckets[bucketIndex].critical += scan.issues.critical;
    buckets[bucketIndex].high += scan.issues.high;
    buckets[bucketIndex].medium += scan.issues.medium;
    buckets[bucketIndex].low += scan.issues.low;
    buckets[bucketIndex].total +=
      scan.issues.critical + scan.issues.high + scan.issues.medium + scan.issues.low;
    if (!buckets[bucketIndex].names.includes(scan.name)) {
      buckets[bucketIndex].names.push(scan.name);
    }
  });

  return buckets.map(bucket => ({
    label:
      bucket.names.length === 0
        ? '無資料'
        : bucket.names.length === 1
          ? bucket.names[0]
          : `${bucket.names[0]} 等 ${bucket.names.length} 項`,
    total: bucket.total,
    critical: bucket.critical,
    high: bucket.high,
    medium: bucket.medium,
    low: bucket.low,
  }));
});

const currentChartOption = computed(() => {
  if (activeTrendTab.value === 'scans') {
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 20, right: 16, top: 20, bottom: 32, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: scanTrendData.value.map(item => item.label),
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [
        {
          type: 'line',
          data: scanTrendData.value.map(item => item.value),
          smooth: true,
          symbolSize: 7,
          lineStyle: { width: 3, color: '#00b2e3' },
          itemStyle: { color: '#00b2e3' },
          areaStyle: { color: 'rgba(0,178,227,0.12)' },
        },
      ],
    };
  }

  if (activeTrendTab.value === 'credits') {
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 20, right: 16, top: 20, bottom: 32, containLabel: true },
      xAxis: {
        type: 'category',
        data: creditTrendData.value.map(item => item.label),
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 18,
          data: creditTrendData.value.map(item => item.value),
          itemStyle: { color: '#00b2e3', borderRadius: [6, 6, 0, 0] },
        },
      ],
    };
  }

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      top: 0,
      textStyle: { color: '#64748b', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    grid: { left: 20, right: 16, top: 34, bottom: 32, containLabel: true },
    xAxis: {
      type: 'category',
      data: issueStackData.value.map(item => item.label),
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [
      { name: '嚴重', type: 'bar', stack: 'issues', data: issueStackData.value.map(item => item.critical), itemStyle: { color: '#ef4444' } },
      { name: '高', type: 'bar', stack: 'issues', data: issueStackData.value.map(item => item.high), itemStyle: { color: '#06b6d4' } },
      { name: '中', type: 'bar', stack: 'issues', data: issueStackData.value.map(item => item.medium), itemStyle: { color: '#f59e0b' } },
      { name: '低', type: 'bar', stack: 'issues', data: issueStackData.value.map(item => item.low), itemStyle: { color: '#6366f1' } },
    ],
  };
});

const renderTrendChart = async () => {
  await nextTick();
  if (!trendChartEl.value) return;
  if (!trendChart) {
    trendChart = init(trendChartEl.value);
  }
  trendChart.setOption(currentChartOption.value, true);
};

onMounted(async () => {
  if (!sessionCompany.value) return;
  scans.value = await listCompanyScans(sessionCompany.value.id);
  await renderTrendChart();
  if (trendChartEl.value) {
    resizeObserver = new ResizeObserver(() => {
      trendChart?.resize();
    });
    resizeObserver.observe(trendChartEl.value);
  }
});

watch(
  [
    activeTrendTab,
    scanRangeDays,
    scanAccountFilter,
    creditRangeDays,
    creditStatusFilter,
    issueRangeDays,
    issueBucket,
    scans,
  ],
  () => {
    renderTrendChart();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (resizeObserver && trendChartEl.value) {
    resizeObserver.unobserve(trendChartEl.value);
  }
  resizeObserver = null;
  trendChart?.dispose();
  trendChart = null;
});
</script>
