<!-- TODO: side menu, project logo, feedback dialog -->

<template>
  <div
    class="w-full h-full p-4 flex flex-row md:flex-col justify-between items-center text-color6 bg-color4 rounded-bl-2xl md:rounded-bl-none rounded-br-2xl rounded-tr-none md:rounded-tr-2xl"
  >
    <div class="flex md:hidden flex-row items-center">
      <RouterLink to="/" class="cursor-pointer !hover:bg-color2">
        <img src="@/assets/logo.svg" alt="" class="h-12 max-h-full text-color1" />
      </RouterLink>
    </div>

    <div class="hidden md:flex flex-col items-center gap-y-2">
      <RouterLink
        v-for="(item, index) in menuItems"
        :key="index"
        :to="item.path"
        :class="[
          pathname === item.path ? selectedOptionStyles : 'bg-transparent text-color6',
          'flex justify-center items-center rounded-3xl size-12  md:size-14 lg:size-16',
        ]"
      >
        <component :is="item.icon" size="20" />
      </RouterLink>

      <button
        class="bg-transparent text-color6 flex justify-center items-center rounded-3xl size-12 md:size-14 lg:size-16 border-none"
        @click="openFeedbackDialog"
      >
        <MessageCircleHeart size="20" />
      </button>
    </div>

    <div class="block">
      <button
        class="bg-transparent text-color6 flex justify-center items-center rounded-3xl aspect-square w-12 lg:w-16 h-full lg:h-16 border-none"
        @click="toggleSideMenu"
      >
        <Menu size="20" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { House, MessageCircleHeart, Menu } from 'lucide-vue-next'
import toastHandler from '@/composables/toastHandeler'

const { showToast } = toastHandler()
const route = useRoute()
const pathname = ref(route.path)

const selectedOptionStyles = 'bg-color2 text-black'

const menuItems = [{ path: '/', icon: House }]

const openFeedbackDialog = () => {
  showToast('info', 'Info', 'Feature under development')
}

const toggleSideMenu = () => {
  showToast('info', 'Info', 'Feature under development')
}
</script>

<style scoped>
/* Add any necessary styles here */
</style>
