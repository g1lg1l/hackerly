/** One-shot "pop" flag for icon feedback: `trigger()` sets it for 300 ms. */
export function useBump() {
  const bump = ref(false)
  const { start } = useTimeoutFn(
    () => {
      bump.value = false
    },
    300,
    { immediate: false },
  )

  function trigger() {
    bump.value = true
    start()
  }

  return { bump, trigger }
}
