export const copyClipboardItem = async (content: string, showToast: Function) => {
  if (!navigator.clipboard) {
    console.warn('Clipboard API not available.')
    showToast('warn', 'Warning', 'Clipboard API not available.')
  }

  try {
    await navigator.clipboard.writeText(content)
    showToast('success', 'Success', 'Content copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy content to clipboard:', error)
    showToast('error', 'Error', 'Failed to copy content to clipboard.')
  }
}

export const downloadClipboardItem = async (content: string, showToast: Function, type: string) => {
  try {
    let blob
    let fileName = 'clipboard_content'

    if (type === 'text') {
      blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      fileName += '.txt'
    } else if (type === 'image') {
      const response = await fetch(content) // Fetch the image data
      blob = await response.blob()
      fileName += '.png' // Defaulting to PNG
    } else {
      throw new Error('Unsupported content type')
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url) // Cleanup

    showToast('success', 'Success', 'Content downloaded successfully!')
  } catch (error) {
    console.error('Failed to download content:', error)
    showToast('error', 'Error', 'Failed to download content.')
  }
}
