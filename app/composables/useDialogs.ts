export const usePalette = () => useState('palette-open', () => false)
export const useShortcuts = () => useState('shortcuts-open', () => false)

export interface ConfirmRequest {
  title: string
  detail?: string
  action: string
}

let resolveConfirm: ((ok: boolean) => void) | undefined

/** In-app confirmation dialog, rendered by ConfirmDialog.vue. Resolves false on cancel or Escape. */
export function useConfirm() {
  const pending = useState<ConfirmRequest | null>('confirm', () => null)

  function confirm(request: ConfirmRequest) {
    resolveConfirm?.(false)
    pending.value = request
    return new Promise<boolean>((resolve) => {
      resolveConfirm = resolve
    })
  }

  function answer(ok: boolean) {
    if (!pending.value) return
    pending.value = null
    resolveConfirm?.(ok)
    resolveConfirm = undefined
  }

  return { pending, confirm, answer }
}
