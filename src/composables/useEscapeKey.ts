import { onMounted, onUnmounted, type MaybeRefOrGetter, toValue } from 'vue'

export function useEscapeKey(
  onEscape: () => void,
  when?: MaybeRefOrGetter<boolean>,
) {
  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape') return
    if (when !== undefined && !toValue(when)) return
    onEscape()
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}
