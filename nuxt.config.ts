// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'MAKHAMR',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'a Apps for Better Search & Filter data Magang Kampus Merdeka from kemdikbud' },
      ],
    }
  },
  modules: ['@nuxtjs/tailwindcss'],
})
