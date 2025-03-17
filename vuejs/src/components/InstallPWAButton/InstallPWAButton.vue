<template>
  <button v-if="installPrompt" @click="installPWA">Install App</button>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const installPrompt = ref(null)

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault() // Prevent automatic prompt
    installPrompt.value = event // Store the event for later
  })
})

const installPWA = async () => {
  if (installPrompt.value) {
    installPrompt.value.prompt()
    const choiceResult = await installPrompt.value.userChoice
    if (choiceResult.outcome === 'accepted') {
      console.log('PWA installed')
    } else {
      console.log('PWA installation dismissed')
    }
    installPrompt.value = null // Reset prompt after interaction
  }
}
</script>
