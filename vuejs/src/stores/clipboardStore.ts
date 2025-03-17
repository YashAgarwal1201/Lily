// TODO: saving data in indexDB, clipboard type can be anything (updating logics accordingly)

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import { Smartphone } from 'lucide-vue-next'
import toastHandler from '@/composables/toastHandeler'

export interface ClipboardItem {
  type: string
  content: string
  timestamp: string
}

export interface DeviceClipboardItem {
  id: string
  name: string
  icon: any
  data: ClipboardItem
  starred: boolean
  replies?: string[]
}

export const useClipboardStore = defineStore('clipboard', () => {
  // State
  const items = ref<DeviceClipboardItem[]>([])
  const selectedDevice = ref<string>('All devices')
  const inputValue = ref('')

  const { showToast } = toastHandler()

  // Computed property for filtered items
  const filteredItems = computed(() =>
    selectedDevice.value === 'All devices'
      ? items.value
      : selectedDevice.value === 'starred'
        ? items.value.filter((item) => item.starred === true)
        : items.value.filter((item) => item.name === selectedDevice.value),
  )

  const starredItems = computed(() => items.value.filter((item) => item.starred))

  // Actions
  const addItem = (content: string, deviceName: string = 'This device') => {
    const newItem: DeviceClipboardItem = {
      id: uuid(),
      name: deviceName,
      icon: Smartphone, // Default icon
      data: {
        type: 'text',
        content: content,
        timestamp: new Date().toISOString(),
      },
      starred: false,
    }

    items.value.unshift(newItem) // Add to start (newest first)
  }

  const addReply = (id: string, reply: string) => {
    items.value = items.value.map((item) =>
      item.id === id ? { ...item, replies: [...(item.replies || []), reply] } : item,
    )
  }

  const toggleStarred = (id: string) => {
    items.value = items.value.map((item) =>
      item.id === id ? { ...item, starred: !item.starred } : item,
    )

    // showToast()
  }

  const removeItem = (id: string) => {
    items.value = items.value.filter((item) => item.id !== id)
  }

  const setSelectedDevice = (device: string) => {
    selectedDevice.value = device
  }

  const clearItems = () => {
    items.value = []
  }

  return {
    items,
    selectedDevice,
    filteredItems,
    inputValue,
    addItem,
    addReply,
    toggleStarred,
    removeItem,
    setSelectedDevice,
    clearItems,
  }
})
