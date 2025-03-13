<template>
  <div class="w-screen h-screen flex flex-col md:flex-row bg-color5">
    <Toast />
    <div class="w-full md:w-[70px] h-[60px] md:h-full"><NavBar /></div>
    <div class="w-full md:w-[calc(100%-70px)] h-[calc(100%-60px)] md:h-full overflow-auto">
      <slot />
    </div>
  </div>

  <ShoppingCart />
  <WishList />

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
import {
  Dialog,
  Select,
  Toast,
  // ScrollTop,
} from 'primevue'
// import { computed } from 'vue'

// const router = useRouter();

// const isDrawerVisible = computed(() => {
//   return shoppingCartStore.showShoppingCart || wishListStore.showWishList
// })
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
