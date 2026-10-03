export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: process.env.NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? ['@clerk/nuxt'] : [],
  runtimeConfig: {
    clerkSecretKey: process.env.NUXT_CLERK_SECRET_KEY || '',
    appwriteApiKey: process.env.NUXT_APPWRITE_API_KEY || '',
    appwriteDatabaseId: process.env.NUXT_APPWRITE_DATABASE_ID || '',
    exaApiKey: process.env.NUXT_EXA_API_KEY || '',
    googleOAuthClientId: process.env.NUXT_GOOGLE_OAUTH_CLIENT_ID || '',
    googleOAuthClientSecret: process.env.NUXT_GOOGLE_OAUTH_CLIENT_SECRET || '',
    googleOAuthProjectId: process.env.NUXT_GOOGLE_OAUTH_PROJECT_ID || '',
    oauthSessionSecret: process.env.NUXT_OAUTH_SESSION_SECRET || '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
      clerkPublishableKey: process.env.NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      appwriteEndpoint: process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
      appwriteProjectId: process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID || '',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'Ruang Skripsi — Kerjakan Skripsi dengan Arah yang Jelas',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Kerangka, AI Lab, jurnal, dan revisi skripsi dalam satu ruang kerja yang rapi.' },
        { name: 'theme-color', content: '#173f35' },
      ],
    },
  },
  css: ['~/assets/main.css'],
})