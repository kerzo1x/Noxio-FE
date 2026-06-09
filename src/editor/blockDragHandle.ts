import { Extension } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { createListItemId } from '@/utils/noteContent'

interface DragSource {
  node: PMNode
  isListItem: boolean
  deleteFrom: number
  deleteTo: number
  el: HTMLElement
}

interface DropGap {
  insertPos: number
  inList: boolean
  y: number
  left: number
  width: number
}

const HANDLE_DOTS_SVG =
  '<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
  '<circle cx="5" cy="3" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="5" cy="13" r="1.5"/></svg>'

class BlockDragHandleView {
  private view: EditorView
  private root: HTMLElement
  private handle: HTMLElement
  private indicator: HTMLElement
  private hoveredEl: HTMLElement | null = null
  private currentGap: DropGap | null = null
  private gaps: DropGap[] = []
  source: DragSource | null = null

  constructor(view: EditorView) {
    this.view = view
    this.root =
      (view.dom.closest('.note-tiptap-root') as HTMLElement | null) ??
      (view.dom.parentElement as HTMLElement)

    this.handle = document.createElement('div')
    this.handle.className = 'note-drag-handle'
    this.handle.draggable = true
    this.handle.innerHTML = HANDLE_DOTS_SVG

    this.indicator = document.createElement('div')
    this.indicator.className = 'note-drop-indicator'

    this.root.appendChild(this.handle)
    this.root.appendChild(this.indicator)

    this.view.dom.addEventListener('mousemove', this.onMouseMove)
    this.root.addEventListener('mouseleave', this.onRootLeave)
    this.handle.addEventListener('dragstart', this.onHandleDragStart)
    this.handle.addEventListener('dragend', this.onHandleDragEnd)
  }

  destroy() {
    this.view.dom.removeEventListener('mousemove', this.onMouseMove)
    this.root.removeEventListener('mouseleave', this.onRootLeave)
    this.handle.removeEventListener('dragstart', this.onHandleDragStart)
    this.handle.removeEventListener('dragend', this.onHandleDragEnd)
    this.handle.remove()
    this.indicator.remove()
    this.clearHover()
  }

  private onMouseMove = (e: MouseEvent) => {
    if (this.source) return
    const target = e.target as HTMLElement | null
    const block = (target?.closest?.('li, p[data-type="backend-paragraph"]') ??
      null) as HTMLElement | null
    if (!block || !this.view.dom.contains(block)) {
      // keep the handle while the pointer is in the gutter next to the hovered block
      if (this.hoveredEl) {
        const r = this.hoveredEl.getBoundingClientRect()
        if (e.clientY >= r.top && e.clientY <= r.bottom) return
      }
      this.clearHover()
      return
    }
    if (block === this.hoveredEl) return
    this.setHover(block)
  }

  private onRootLeave = () => {
    if (!this.source) this.clearHover()
  }

  private setHover(el: HTMLElement) {
    this.clearHover()
    this.hoveredEl = el
    el.classList.add('note-block-hover')
    const rootRect = this.root.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    this.handle.style.top = `${r.top - rootRect.top + 4}px`
    this.handle.style.left = `${r.left - rootRect.left - 26}px`
    this.handle.classList.add('visible')
  }

  private clearHover() {
    this.hoveredEl?.classList.remove('note-block-hover')
    this.hoveredEl = null
    this.handle.classList.remove('visible')
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
          // last item in the list: remove the whole backendBulletedList wrapper
          deleteFrom = $pos.before(1)
          deleteTo = $pos.after(1)
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

  private onHandleDragStart = (e: DragEvent) => {
    if (!this.hoveredEl || !e.dataTransfer) {
      e.preventDefault()
      return
    }
    const info = this.resolveBlock(this.hoveredEl)
    if (!info) {
      e.preventDefault()
      return
    }
    this.source = info
    this.gaps = this.computeGaps()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', info.node.textContent || ' ')
    e.dataTransfer.setDragImage(this.hoveredEl, 12, 12)
    const el = this.hoveredEl
    // defer so the browser captures the drag image before the block turns transparent
    requestAnimationFrame(() => el.classList.add('note-block-dragging'))
    this.handle.classList.remove('visible')
  }

  private onHandleDragEnd = () => {
    this.endDrag()
  }

  private computeGaps(): DropGap[] {
    const { doc } = this.view.state
    const rootRect = this.root.getBoundingClientRect()
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

  onDragOver(e: DragEvent): boolean {
    if (!this.source) return false
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    const rootRect = this.root.getBoundingClientRect()
    const relY = e.clientY - rootRect.top
    const relX = e.clientX - rootRect.left

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
    return true
  }

  onDrop(e: DragEvent): boolean {
    const source = this.source
    const gap = this.currentGap
    if (!source) return false
    e.preventDefault()
    if (!gap) {
      this.endDrag()
      return true
    }

    const { state } = this.view
    const schema = state.schema
    const sizeAttr = (source.node.attrs.size as string) || (source.isListItem ? 'small' : 'medium')

    let insertNode: PMNode
    if (gap.inList && source.isListItem) {
      insertNode = source.node
    } else if (gap.inList) {
      insertNode = schema.nodes.listItem.create(
        { itemId: createListItemId(), size: sizeAttr === 'large' ? 'medium' : sizeAttr },
        schema.nodes.paragraph.create(null, source.node.content),
      )
    } else if (source.isListItem) {
      const para = source.node.firstChild
      insertNode = schema.nodes.backendParagraph.create({ size: sizeAttr }, para ? para.content : null)
    } else {
      insertNode = source.node
    }

    const tr = state.tr
    try {
      // insert first so the doc never becomes empty when the source is its only block
      tr.insert(gap.insertPos, insertNode)
      const assoc = gap.insertPos <= source.deleteFrom ? 1 : -1
      const delFrom = tr.mapping.map(source.deleteFrom, assoc)
      const delTo = tr.mapping.map(source.deleteTo, assoc)
      tr.delete(delFrom, delTo)
    } catch (error) {
      console.error('Block drop failed:', error)
      this.endDrag()
      return true
    }

    const finalPos =
      gap.insertPos > source.deleteFrom
        ? gap.insertPos - (source.deleteTo - source.deleteFrom)
        : gap.insertPos
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
    return true
  }

  private endDrag() {
    this.source?.el.classList.remove('note-block-dragging')
    this.source = null
    this.currentGap = null
    this.gaps = []
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
            // the drag handle lives outside the editor DOM, so any dragstart
            // from inside is native text dragging — block it entirely
            dragstart: (_view, event) => {
              event.preventDefault()
              return true
            },
            dragover: (_view, event) => handleView?.onDragOver(event) ?? false,
            drop: (_view, event) => handleView?.onDrop(event) ?? false,
          },
        },
      }),
    ]
  },
})
