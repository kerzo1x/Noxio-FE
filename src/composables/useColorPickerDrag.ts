import { ref } from 'vue'
import { clamp } from '@/utils/colorUtils'

function createPointerDrag(onMove: (clientX: number, clientY: number) => void) {
  const dragging = ref(false)

  function onPointerDown(e: PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragging.value = true
    onMove(e.clientX, e.clientY)
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging.value) return
    onMove(e.clientX, e.clientY)
  }

  function onPointerUp(e: PointerEvent) {
    if (dragging.value) {
      dragging.value = false
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
  }

  return { dragging, onPointerDown, onPointerMove, onPointerUp }
}

export function useSvPanelDrag(
  getPanelEl: () => HTMLElement | null,
  onChange: (sat: number, val: number) => void,
) {
  return createPointerDrag((clientX, clientY) => {
    const el = getPanelEl()
    if (!el) return
    const rect = el.getBoundingClientRect()
    onChange(
      clamp((clientX - rect.left) / rect.width, 0, 1),
      clamp(1 - (clientY - rect.top) / rect.height, 0, 1),
    )
  })
}

export function useHueSliderDrag(
  getTrackEl: () => HTMLElement | null,
  onChange: (hue: number) => void,
) {
  return createPointerDrag((clientX) => {
    const el = getTrackEl()
    if (!el) return
    const rect = el.getBoundingClientRect()
    onChange(clamp(((clientX - rect.left) / rect.width) * 360, 0, 359.999))
  })
}
