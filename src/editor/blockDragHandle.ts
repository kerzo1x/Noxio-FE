import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import {
  HANDLE_DOTS_SVG,
  buildListSplitWithParagraph,
  copyListItemNode,
  copyParagraphNode,
  isInsideBulletList,
  paragraphPosInSplit,
  type DragSource,
  type DropGap,
} from '@/editor/blockDragHandleUtils'

class BlockDragHandleView {
  private view: EditorView
  private root: HTMLElement | null = null
  private handle: HTMLElement
  private indicator: HTMLElement
  private hoverOverlay: HTMLElement
  private hoveredEl: HTMLElement | null = null
  private currentGap: DropGap | null = null
  private gaps: DropGap[] = []
  private dragRootRect: DOMRect | null = null
  private dragPointerId: number | null = null
  private rafPending = false
  private hoverRafPending = false
  private source: DragSource | null = null

  constructor(view: EditorView) {
    this.view = view

    this.handle = document.createElement('div')
    this.handle.className = 'note-drag-handle'
    this.handle.innerHTML = HANDLE_DOTS_SVG

    this.indicator = document.createElement('div')
    this.indicator.className = 'note-drop-indicator'

    this.hoverOverlay = document.createElement('div')
    this.hoverOverlay.className = 'note-block-hover-overlay'

    this.view.dom.addEventListener('mousemove', this.onMouseMove)
    this.handle.addEventListener('pointerdown', this.onPointerDown)
    this.handle.addEventListener('pointermove', this.onPointerMove)
    this.handle.addEventListener('pointerup', this.onPointerUp)
    this.handle.addEventListener('pointercancel', this.onPointerCancel)
  }

  destroy() {
    this.view.dom.removeEventListener('mousemove', this.onMouseMove)
    this.root?.removeEventListener('mouseleave', this.onRootLeave)
    document.body.classList.remove('note-block-grabbing')
    this.handle.remove()
    this.indicator.remove()
    this.hoverOverlay.remove()
  }

  // The editor DOM is attached to the page after the plugin view is created,
  // so the overlay elements have to be (re)mounted lazily.
  private ensureAttached(): boolean {
    if (!this.view.dom.isConnected) return false
    const root = this.view.dom.closest('.note-tiptap-root') as HTMLElement | null
    if (!root) return false
    if (this.root !== root) {
      this.root?.removeEventListener('mouseleave', this.onRootLeave)
      this.root = root
      root.appendChild(this.hoverOverlay)
      root.appendChild(this.handle)
      root.appendChild(this.indicator)
      root.addEventListener('mouseleave', this.onRootLeave)
    }
    return true
  }

  private onMouseMove = (e: MouseEvent) => {
    if (this.source) return
    // never touch hover state while a mouse button is down — it would
    // interfere with native text selection inside the editor
    if (e.buttons !== 0 || this.hoverRafPending) return
    if (!this.ensureAttached()) return
    const x = e.clientX
    const y = e.clientY
    this.hoverRafPending = true
    requestAnimationFrame(() => {
      this.hoverRafPending = false
      if (!this.source) this.updateHover(x, y)
    })
  }

  // highlight the block nearest to the pointer, even when the pointer is in
  // the gutters — no need to be exactly over the text
  private updateHover(x: number, y: number) {
    const contentRect = this.view.dom.getBoundingClientRect()
    // sticky zone: while the pointer travels through the right gutter towards
    // the handle, keep the current block so the dots stay catchable
    if (this.hoveredEl && x >= contentRect.right - 52) return
    const left = Math.min(Math.max(x, contentRect.left + 2), contentRect.right - 2)
    const top = Math.min(Math.max(y, contentRect.top + 2), contentRect.bottom - 2)
    const coords = this.view.posAtCoords({ left, top })
    if (!coords) {
      this.clearHover()
      return
    }
    const $pos = this.view.state.doc.resolve(coords.pos)
    let blockPos: number | null = null
    for (let d = $pos.depth; d > 0; d--) {
      if ($pos.node(d).type.name === 'listItem') {
        blockPos = $pos.before(d)
        break
      }
    }
    if (blockPos === null && $pos.depth >= 1 && $pos.node(1).type.name === 'backendParagraph') {
      blockPos = $pos.before(1)
    }
    if (blockPos === null) {
      this.clearHover()
      return
    }
    const el = this.view.nodeDOM(blockPos)
    if (!(el instanceof HTMLElement)) {
      this.clearHover()
      return
    }
    if (el !== this.hoveredEl) this.setHover(el)
  }

  private onRootLeave = () => {
    if (!this.source) this.clearHover()
  }

  private setHover(el: HTMLElement) {
    if (!this.root) return
    this.hoveredEl = el
    const rootRect = this.root.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24
    this.handle.style.top = `${r.top - rootRect.top + Math.max(0, (lineHeight - 26) / 2)}px`
    // handle sits in the right gutter of the editor (pr-10 on the content)
    this.handle.style.left = `${r.right - rootRect.left + 8}px`
    this.handle.classList.add('visible')
    this.hoverOverlay.style.top = `${r.top - rootRect.top - 2}px`
    this.hoverOverlay.style.left = `${r.left - rootRect.left - 4}px`
    this.hoverOverlay.style.width = `${r.width + 8}px`
    this.hoverOverlay.style.height = `${r.height + 4}px`
    this.hoverOverlay.style.display = 'block'
  }

  private clearHover() {
    this.hoveredEl = null
    this.handle.classList.remove('visible')
    this.hoverOverlay.style.display = 'none'
  }

  private resolveBlock(el: HTMLElement): DragSource | null {
    let pos: number
    try {
      pos = this.view.posAtDOM(el, 0)
    } catch {
      return null
    }
    const { doc } = this.view.state
    const $pos = doc.resolve(pos)
    if (el.tagName === 'LI') {
      for (let d = $pos.depth; d > 0; d--) {
        if ($pos.node(d).type.name !== 'listItem') continue
        const itemPos = $pos.before(d)
        const node = $pos.node(d)
        let deleteFrom = itemPos
        let deleteTo = itemPos + node.nodeSize
        if ($pos.node(d - 1).childCount === 1) {
          if (d === 3) {
            // last item of a top-level list: remove the whole backendBulletedList wrapper
            deleteFrom = $pos.before(1)
            deleteTo = $pos.after(1)
          } else {
            // last item of a nested list: remove only that nested bulletList
            deleteFrom = $pos.before(d - 1)
            deleteTo = $pos.after(d - 1)
          }
        }
        return { node, isListItem: true, deleteFrom, deleteTo, el }
      }
      return null
    }
    if ($pos.depth < 1) return null
    const node = $pos.node(1)
    if (node.type.name !== 'backendParagraph') return null
    const blockPos = $pos.before(1)
    return { node, isListItem: false, deleteFrom: blockPos, deleteTo: blockPos + node.nodeSize, el }
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || !this.hoveredEl || !this.root) return
    const info = this.resolveBlock(this.hoveredEl)
    if (!info) return
    e.preventDefault()
    this.source = info
    // all layout reads happen once here; pointer moves only reposition the indicator
    this.dragRootRect = this.root.getBoundingClientRect()
    this.gaps = this.computeGaps()
    this.dragPointerId = e.pointerId
    this.handle.setPointerCapture(e.pointerId)
    info.el.classList.add('note-block-dragging')
    document.body.classList.add('note-block-grabbing')
    this.hoverOverlay.style.display = 'none'
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.dragPointerId !== e.pointerId || !this.source || this.rafPending) return
    const x = e.clientX
    const y = e.clientY
    this.rafPending = true
    requestAnimationFrame(() => {
      this.rafPending = false
      if (this.source) this.updateIndicator(x, y)
    })
  }

  private onPointerUp = (e: PointerEvent) => {
    if (this.dragPointerId !== e.pointerId) return
    this.dragPointerId = null
    this.performDrop()
  }

  private onPointerCancel = (e: PointerEvent) => {
    if (this.dragPointerId !== e.pointerId) return
    this.dragPointerId = null
    this.endDrag()
  }

  private computeGaps(): DropGap[] {
    const rootRect = this.dragRootRect
    if (!rootRect) return []
    const { doc } = this.view.state
    const contentRect = this.view.dom.getBoundingClientRect()
    const gaps: DropGap[] = []
    const src = this.source
    const fullLeft = contentRect.left - rootRect.left
    const fullWidth = contentRect.width
    const push = (insertPos: number, inList: boolean, y: number, left = fullLeft, width = fullWidth) => {
      if (src && insertPos > src.deleteFrom && insertPos < src.deleteTo) return
      gaps.push({ insertPos, inList, y: y - rootRect.top, left, width })
    }
    let lastBottom = contentRect.top
    doc.forEach((node, offset) => {
      const dom = this.view.nodeDOM(offset)
      if (!(dom instanceof HTMLElement)) return
      const r = dom.getBoundingClientRect()
      push(offset, false, r.top)
      lastBottom = r.bottom
      if (node.type.name === 'backendBulletedList' && node.firstChild) {
        const list = node.firstChild
        let itemPos = offset + 2
        let lastItemRect: DOMRect | null = null
        list.forEach((item) => {
          const idom = this.view.nodeDOM(itemPos)
          if (idom instanceof HTMLElement) {
            const ir = idom.getBoundingClientRect()
            push(itemPos, true, ir.top, ir.left - rootRect.left, ir.width)
            lastItemRect = ir
          }
          itemPos += item.nodeSize
        })
        const endRect = lastItemRect as DOMRect | null
        if (endRect) {
          push(itemPos, true, endRect.bottom, endRect.left - rootRect.left, endRect.width)
        }
      }
    })
    push(doc.content.size, false, lastBottom)
    return gaps
  }

  private updateIndicator(clientX: number, clientY: number) {
    const rootRect = this.dragRootRect
    if (!rootRect) return
    const relY = clientY - rootRect.top
    const relX = clientX - rootRect.left

    let minDy = Infinity
    for (const g of this.gaps) {
      minDy = Math.min(minDy, Math.abs(g.y - relY))
    }
    let best: DropGap | null = null
    let bestDx = Infinity
    for (const g of this.gaps) {
      if (Math.abs(g.y - relY) > minDy + 6) continue
      const dx = Math.abs(g.left - relX)
      if (dx < bestDx) {
        bestDx = dx
        best = g
      }
    }
    this.currentGap = best
    if (best) {
      this.indicator.style.display = 'block'
      this.indicator.style.top = `${best.y - 1}px`
      this.indicator.style.left = `${best.left}px`
      this.indicator.style.width = `${best.width}px`
    } else {
      this.indicator.style.display = 'none'
    }
  }

  private performDrop() {
    const source = this.source
    const gap = this.currentGap
    if (!source || !gap) {
      this.endDrag()
      return
    }

    const { state } = this.view
    const schema = state.schema

    const tr = state.tr
    let finalPos: number
    try {
      if (!source.isListItem) {
        const paragraph = copyParagraphNode(schema, source.node)
        const listDrop = gap.inList && isInsideBulletList(state.doc, gap.insertPos)

        if (listDrop) {
          const split = buildListSplitWithParagraph(state.doc, gap.insertPos, paragraph, schema)
          if (!split) throw new Error('Could not resolve list drop position')
          tr.replaceWith(split.from, split.to, split.nodes)
          finalPos = paragraphPosInSplit(split.from, split.nodes)
          const delFrom = tr.mapping.map(source.deleteFrom, -1)
          const delTo = tr.mapping.map(source.deleteTo, -1)
          tr.delete(delFrom, delTo)
          if (source.deleteFrom < finalPos) {
            finalPos -= source.deleteTo - source.deleteFrom
          }
        } else {
          tr.insert(gap.insertPos, paragraph)
          finalPos =
            gap.insertPos > source.deleteFrom
              ? gap.insertPos - (source.deleteTo - source.deleteFrom)
              : gap.insertPos
          const assoc = gap.insertPos <= source.deleteFrom ? 1 : -1
          const delFrom = tr.mapping.map(source.deleteFrom, assoc)
          const delTo = tr.mapping.map(source.deleteTo, assoc)
          tr.delete(delFrom, delTo)
        }
      } else {
        const listItem = copyListItemNode(schema, source.node)
        if (!gap.inList) {
          // bullet between top-level blocks: stays a bullet as its own list
          tr.insert(
            gap.insertPos,
            schema.nodes.backendBulletedList.create(
              null,
              schema.nodes.bulletList.create(null, listItem),
            ),
          )
        } else {
          tr.insert(gap.insertPos, listItem)
        }
        finalPos =
          gap.insertPos > source.deleteFrom
            ? gap.insertPos - (source.deleteTo - source.deleteFrom)
            : gap.insertPos
        const assoc = gap.insertPos <= source.deleteFrom ? 1 : -1
        const delFrom = tr.mapping.map(source.deleteFrom, assoc)
        const delTo = tr.mapping.map(source.deleteTo, assoc)
        tr.delete(delFrom, delTo)
      }
    } catch (error) {
      console.error('Block drop failed:', error)
      this.endDrag()
      return
    }
    tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(finalPos + 1, tr.doc.content.size))))
    this.view.dispatch(tr)

    requestAnimationFrame(() => {
      const dom = this.view.nodeDOM(finalPos)
      if (dom instanceof HTMLElement) {
        dom.classList.add('note-block-drop-in')
        setTimeout(() => dom.classList.remove('note-block-drop-in'), 350)
      }
    })

    this.endDrag()
  }

  private endDrag() {
    this.source?.el.classList.remove('note-block-dragging')
    this.source = null
    this.currentGap = null
    this.gaps = []
    this.dragRootRect = null
    document.body.classList.remove('note-block-grabbing')
    this.indicator.style.display = 'none'
    this.clearHover()
  }
}

const blockDragHandleKey = new PluginKey('blockDragHandle')

export const blockDragHandleExtension = Extension.create({
  name: 'blockDragHandle',

  addProseMirrorPlugins() {
    let handleView: BlockDragHandleView | null = null
    return [
      new Plugin({
        key: blockDragHandleKey,
        view(editorView) {
          handleView = new BlockDragHandleView(editorView)
          return {
            destroy: () => {
              handleView?.destroy()
              handleView = null
            },
          }
        },
        props: {
          handleDOMEvents: {
            // blocks are moved via the drag handle; native text dragging is disabled
            dragstart: (_view, event) => {
              event.preventDefault()
              return true
            },
          },
        },
      }),
    ]
  },
})
