import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import { Smartphone } from 'lucide-vue-next'

export interface ClipboardItem {
  id: string
  type: string
  content: string
  timestamp: string
}

export interface DeviceClipboardItem {
  name: string
  icon: any
  data: ClipboardItem
  replies?: string[]
}

export const useClipboardStore = defineStore('clipboard', () => {
  // State
  const items = ref<DeviceClipboardItem[]>([])
  const selectedDevice = ref<string>('All devices')
  const inputValue = ref('')

  // Computed property for filtered items
  const filteredItems = computed(() =>
    selectedDevice.value === 'All devices'
      ? items.value
      : items.value.filter((item) => item.name === selectedDevice.value),
  )

  // Actions
  const addItem = (content: string, deviceName: string = 'This device') => {
    const newItem: DeviceClipboardItem = {
      name: deviceName,
      icon: Smartphone, // Default icon
      data: {
        id: uuid(),
        type: 'text',
        content: content,
        timestamp: new Date().toISOString(),
      },
    }

    items.value.unshift(newItem) // Add to start (newest first)
  }

  const addReply = (id: string, reply: string) => {
    items.value = items.value.map((item) =>
      item.data.id === id ? { ...item, replies: [...(item.replies || []), reply] } : item,
    )
  }

  const removeItem = (id: string) => {
    items.value = items.value.filter((item) => item.data.id !== id)
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
    removeItem,
    setSelectedDevice,
    clearItems,
  }
})
