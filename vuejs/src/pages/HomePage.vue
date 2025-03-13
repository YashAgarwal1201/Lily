<template>
  <PageLayout>
    <div class="w-full h-full p-4 flex flex-col justify-start text-color6">
      <div class="flex flex-col gap-y-4 md:gap-y-5">
        <h1 class="text-xl md:text-2xl font-heading">Lily</h1>
        <div
          class="w-full h-10 flex items-center gap-x-2 overflow-x-auto mb-4 rounded-lg scrollbar-hide"
        >
          <Button
            v-for="index in 5"
            :key="index"
            class="flex-shrink-0 text-xs md:text-sm rounded-full bg-color2 border border-color3 px-3 py-1"
            label="btn"
          />
        </div>
      </div>

      <div class="flex flex-col gap-y-4 flex-1 overflow-hidden">
        <div
          class="w-full flex-grow flex flex-col gap-5 overflow-y-auto rounded-2xl flex-1 font-content"
        >
          <template v-if="clipboardStore.filteredItems?.length > 0">
            <div
              v-for="(item, key) in clipboardStore.filteredItems"
              :key="key"
              class="rounded-lg flex flex-col gap-y-3 w-full sm:w-[85%] lg:w-[70%] relative"
            >
              <div class="flex flex-row gap-x-3 items-center">
                <div
                  class="size-8 md:size-9 flex justify-center items-center bg-color3 text-color1 rounded-full"
                >
                  <!-- Placeholder for Icon -->
                  <!-- <item.icon :size="16" color="white" /> -->
                  <User :size="16" color="white" />
                </div>
                <span class="font-medium font-subheading">
                  {{ item.name }}
                </span>
              </div>
              <div
                class="ml-0 md:ml-4 lg:ml-5 p-3 md:p-4 flex flex-col gap-y-4 md:gap-y-5 w-full bg-color4 rounded-3xl"
              >
                <div class="w-full select-none mb-3">
                  <p
                    v-if="item.data.type === 'text'"
                    class="text-sm md:text-base break-words font-content"
                  >
                    {{ item.data.content }}
                  </p>
                  <Image
                    v-else
                    :src="item.data.content"
                    alt="Clipboard content"
                    class="max-h-32 object-contain"
                  />
                </div>

                <!-- Action buttons -->
                <div class="w-full flex items-center justify-end gap-x-2">
                  <!-- Timestamp -->
                  <div class="flex justify-between items-center mr-auto">
                    <span class="text-color1 text-xs md:text-sm">
                      {{ formatTimestamp(item.data.timestamp) }}
                    </span>
                  </div>

                  <!-- Copy Button -->
                  <Button
                    rounded
                    text
                    title="Copy"
                    class="p-2 text-color2"
                    @click="handleCopyClipboard(item.data.content)"
                    ><Copy :size="16"
                  /></Button>

                  <!-- Download Button -->
                  <Button
                    rounded
                    text
                    @click="handleDownloadClipboardItem(item.data)"
                    title="Download"
                    class="p-2 text-color2"
                    ><Download :size="16"
                  /></Button>

                  <!-- Delete Button -->
                  <Button
                    rounded
                    text
                    @click="handleDeleteItem(item.data.id)"
                    title="Delete"
                    class="p-2 text-color2"
                    ><Trash :size="16"
                  /></Button>
                </div>
              </div>
            </div>
          </template>
          <div v-else>
            <p>No clipboard item found</p>
          </div>

          <ScrollTop
            target="parent"
            :threshold="100"
            class="!size-7 bg-color1 text-color6 ml-auto shadow-none"
            ><ChevronUp :size="16"
          /></ScrollTop>
        </div>

        <!-- Input field at the bottom -->
        <div class="w-full h-10 bg-color5 flex-shrink-0">
          <div class="flex gap-2 items-center">
            <InputText
              placeholder="Type text to add to clipboard..."
              class="w-full py-2 px-4 font-content rounded-full text-sm md:text-base bg-color2 text-color6 focus:outline-none focus:ring-2 focus:ring-color1 placeholder:text-color4"
              v-model="clipboardStore.inputValue"
              @keyup.enter="handleSendClipboard"
            />
            <Button
              rounded
              class="p-3 bg-color1 text-white"
              @click="handleSendClipboard"
              title="Add to clipboard"
              ><Send :size="16"
            /></Button>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageLayout from '@/layout/PageLayout.vue'
import { Button, Image, InputText, ScrollTop } from 'primevue'
import { Copy, Download, Trash, Send, ChevronUp, User } from 'lucide-vue-next'

import { useClipboardStore } from '@/stores/clipboardStore'
import { copyClipboardItem, downloadClipboardItem } from '@/utils/clipboardHandelers'
import toastHandler from '@/composables/toastHandeler'

const clipboardStore = useClipboardStore()
const { showToast } = toastHandler()

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString()
}

const handleCopyClipboard = (content: string) => {
  if (!content) {
    // showToast("warn", "Warning", "No content to copy");
  } else {
    copyClipboardItem(content, showToast)
  }
}

const handleSendClipboard = () => {
  if (!clipboardStore.inputValue.trim()) {
    showToast('warn', 'Warning', 'Please enter some text')
    return
  }

  // Add to clipboard using Zustand store
  clipboardStore.addItem(clipboardStore.inputValue)

  showToast('success', 'Success', 'Text added to clipboard')

  clipboardStore.inputValue = ''
}

const handleDownloadClipboardItem = (data: {
  type: string
  content: string
  id: string
  timestamp: string
}) => {
  if (!data) {
    showToast('warn', 'Warning', 'No content to download')
  } else {
    downloadClipboardItem(data.content, showToast, data.type)
  }
}

const handleDeleteItem = (id: string) => {
  clipboardStore.removeItem(id)
  // showToast("success", "Success", "Item removed from clipboard");
}
</script>
