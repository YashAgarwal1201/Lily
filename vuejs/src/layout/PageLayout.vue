<template>
  <div v-if="!isWatchScreen" class="w-screen h-screen flex flex-col md:flex-row bg-color5">
    <Toast />
    <div class="w-full md:w-[70px] h-[60px] md:h-full"><NavBar /></div>
    <div class="w-full md:w-[calc(100%-70px)] h-[calc(100%-60px)] md:h-full overflow-auto">
      <slot />
    </div>
  </div>

  <div v-else class="w-screen h-screen flex flex-col justify-center items-center p-2 text-xs">
    <p class="text-center text-color2">
      Use a phone, tablet or a larger screen device to view the application
    </p>
  </div>

  <!-- <Dialog
    v-model:visible="productsListStore.showFilters"
    v-on:hide="productsListStore.showFilters = false"
    dismissable-mask
    position="bottom"
    header="Apply search filters"
    class="w-full h-full"
  >
  </Dialog> -->
</template>

<script lang="ts" setup>
import NavBar from '@/components/NavBar/NavBar.vue'
import { Dialog, Select, Toast } from 'primevue'

import { ref, onMounted } from 'vue'

const isWatchScreen = ref(false)

onMounted(() => {
  const checkScreenSize = () => {
    isWatchScreen.value = window.innerWidth < 250
  }

  checkScreenSize() // Check on load
  window.addEventListener('resize', checkScreenSize)
})
</script>

<style lang="css">
.p-dialog-mask,
.p-drawer-mask {
  backdrop-filter: blur(8px);
}

.p-drawer {
  width: 768px !important;
  border-top-left-radius: 1.5rem;
  border-bottom-left-radius: 1.5rem;
}

@media screen and (max-width: 768px) {
  .p-drawer {
    width: 100% !important;
    border-top-left-radius: 0rem;
    border-bottom-left-radius: 0rem;
  }
}
</style>
