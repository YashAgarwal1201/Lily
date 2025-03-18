<template>
  <PageLayout
    ><div
      class="w-full h-full flex flex-col justify-center items-center text-base md:text-lg font-content italic text-color2"
    >
      <Image :src="PageNotFound" alt="" class="max-w-full w-96" />
      <p>Page not found</p>
    </div></PageLayout
  >
</template>

<script setup lang="ts">
import { Image } from 'primevue'
import PageLayout from '@/layout/PageLayout.vue'
import PageNotFound from '@/assets/pageNotFound.svg'
</script>

<style scoped></style>
