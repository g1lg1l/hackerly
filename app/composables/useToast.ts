let hideTimer: ReturnType<typeof setTimeout> | undefined

/** One-line status message at the bottom of the screen, shown for 1.6 seconds. */
export function useToast() {
  const message = useState('toast', () => '')

  function show(text: string) {
    message.value = text
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      message.value = ''
    }, 1600)
  }

  return { message, show }
}
