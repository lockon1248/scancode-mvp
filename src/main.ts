import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './styles/tailwind-built.css';
import { initializeFrontendSession } from './services/state/frontendSession';

const bootstrap = async () => {
  await initializeFrontendSession();
  const app = createApp(App);
  app.use(router);
  app.mount('#app');
};

bootstrap();
