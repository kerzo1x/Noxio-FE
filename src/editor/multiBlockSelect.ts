import { Extension } from '@tiptap/core'
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state'

const multiBlockSelectKey = new PluginKey<{ positions: number[] }>('multiBlockSelect')

function findTopLevelBlockPos(doc: import('@tiptap/pm/model').Node, pos: number): number | null {
  const $pos = doc.resolve(pos)
  for (let depth = $pos.depth; depth > 0; depth--) {
    if ($pos.node(depth).type.spec.group === 'block' && depth === 1) {
      return $pos.before(depth)
    }
  }
  if ($pos.depth === 1) {
    return $pos.before(1)
  }
  return null
}

export const multiBlockSelectExtension = Extension.create({
  name: 'multiBlockSelect',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: multiBlockSelectKey,
        state: {
          init: () => ({ positions: [] as number[] }),
          apply(tr, value) {
            const meta = tr.getMeta(multiBlockSelectKey) as { positions?: number[] } | undefined
            if (meta?.positions) {
              return { positions: meta.positions }
            }
            if (!tr.docChanged) return value
            return { positions: [] }
          },
        },
        props: {
          handleClick(view, pos, event) {
            const blockPos = findTopLevelBlockPos(view.state.doc, pos)
            if (blockPos === null) return false

            const pluginState = multiBlockSelectKey.getState(view.state)

            if (event.shiftKey) {
              const current = [...(pluginState?.positions ?? [])]
              const index = current.indexOf(blockPos)
              if (index >= 0) {
                current.splice(index, 1)
              } else {
                current.push(blockPos)
              }
              const tr = view.state.tr.setMeta(multiBlockSelectKey, { positions: current })
              view.dispatch(tr)
              return true
            }

            const tr = view.state.tr
              .setSelection(NodeSelection.create(view.state.doc, blockPos))
              .setMeta(multiBlockSelectKey, { positions: [] })
            view.dispatch(tr)
            return true
          },
          handleKeyDown(view, event) {
            if (event.key !== 'Delete' && event.key !== 'Backspace') return false
            const positions = multiBlockSelectKey.getState(view.state)?.positions ?? []
            if (positions.length < 2) return false

            const sorted = [...positions].sort((a, b) => b - a)
            let tr = view.state.tr
            for (const blockPos of sorted) {
              const node = view.state.doc.nodeAt(blockPos)
              if (!node) continue
              tr = tr.delete(blockPos, blockPos + node.nodeSize)
            }
            tr = tr.setMeta(multiBlockSelectKey, { positions: [] })
            view.dispatch(tr)
            return true
          },
        },
      }),
    ]
  },
})
