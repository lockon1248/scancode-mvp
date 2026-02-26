<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
    <div class="text-center">
      <AlertCircle class="w-16 h-16 text-brand-500 mx-auto mb-4" />
      <h1 class="text-4xl mb-2">404</h1>
      <p class="text-slate-600 mb-6">找不到此頁面</p>
      <router-link to="/" class="text-brand-600 hover:text-brand-700 underline">
        返回首頁
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next';
</script>
