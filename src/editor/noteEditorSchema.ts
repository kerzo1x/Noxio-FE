import { Extension, InputRule, Node, mergeAttributes } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'
import Bold from '@tiptap/extension-bold'
import BulletList from '@tiptap/extension-bullet-list'
import Color from '@tiptap/extension-color'
import Document from '@tiptap/extension-document'
import Gapcursor from '@tiptap/extension-gapcursor'
import History from '@tiptap/extension-history'
import ListItem from '@tiptap/extension-list-item'
import Text from '@tiptap/extension-text'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { blockSizeClass, createListItemId } from '@/utils/noteContent'
import type { NoteBlockSize } from '@/types/notes'
import { multiBlockSelectExtension } from '@/editor/multiBlockSelect'
import { blockDragHandleExtension } from '@/editor/blockDragHandle'

export const MAX_TOP_LEVEL_BLOCKS = 500

export const BackendDocument = Document.extend({
  content: '(backendParagraph | backendBulletedList)+',
})

export const BackendParagraph = Node.create({
  name: 'backendParagraph',
  group: 'block',
  content: 'inline*',
  addAttributes() {
    return {
      size: {
        default: 'medium' as NoteBlockSize,
        parseHTML: (element) =>
          (element.getAttribute('data-size') as NoteBlockSize) || 'medium',
        renderHTML: (attributes) => ({
          'data-size': attributes.size,
          class: blockSizeClass(attributes.size as NoteBlockSize),
        }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'p[data-type="backend-paragraph"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'backend-paragraph',
        class: 'note-editor-paragraph',
      }),
      0,
    ]
  },
})

export const ListParagraph = Node.create({
  name: 'paragraph',
  priority: 200,
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'p' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { class: 'note-editor-list-paragraph' }), 0]
  },
})

export const BackendBulletedList = Node.create({
  name: 'backendBulletedList',
  group: 'block',
  content: 'bulletList',
  parseHTML() {
    return [{ tag: 'div[data-type="backend-bulleted-list"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'backend-bulleted-list' }), 0]
  },
})

export const BackendListItem = ListItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      itemId: {
        default: null as string | null,
        parseHTML: (element) => element.getAttribute('data-item-id'),
        renderHTML: (attributes) =>
          attributes.itemId ? { 'data-item-id': attributes.itemId } : {},
      },
      size: {
        default: 'small' as NoteBlockSize,
        parseHTML: (element) =>
          (element.getAttribute('data-size') as NoteBlockSize) || 'small',
        renderHTML: (attributes) => ({
          'data-size': attributes.size,
          class: blockSizeClass(attributes.size as NoteBlockSize),
        }),
      },
      bulleted: {
        default: true,
        parseHTML: (element) => element.getAttribute('data-bulleted') !== 'false',
        renderHTML: (attributes) => ({
          'data-bulleted': attributes.bulleted === false ? 'false' : 'true',
        }),
      },
    }
  },
})

const BulletListInputRule = Extension.create({
  name: 'bulletListInputRule',
  addInputRules() {
    return [
      new InputRule({
        find: /^- $/,
        handler: ({ state, range, chain }) => {
          const $from = state.doc.resolve(range.from)
          let blockDepth: number | null = null
          for (let depth = $from.depth; depth > 0; depth--) {
            if ($from.node(depth).type.name === 'backendParagraph') {
              blockDepth = depth
              break
            }
          }
          if (blockDepth === null) return null

          const blockNode = $from.node(blockDepth)
          const blockStart = $from.before(blockDepth)
          const blockEnd = $from.after(blockDepth)
          const size = blockNode.attrs.size ?? 'medium'

          // keep any text that follows the typed "- " instead of discarding it
          const rest = blockNode.content.cut(range.to - $from.start(blockDepth))

          chain()
            .focus()
            .deleteRange({ from: blockStart, to: blockEnd })
            .insertContentAt(blockStart, {
              type: 'backendBulletedList',
              content: [
                {
                  type: 'bulletList',
                  content: [
                    {
                      type: 'listItem',
                      attrs: {
                        itemId: createListItemId(),
                        size: size === 'large' ? 'medium' : size,
                      },
                      content: [
                        rest.size > 0
                          ? { type: 'paragraph', content: rest.toJSON() }
                          : { type: 'paragraph' },
                      ],
                    },
                  ],
                },
              ],
            })
            .run()
        },
      }),
    ]
  },
})

interface TopLevelListItemContext {
  item: PMNode
  itemDepth: number
  wrapper: PMNode
  list: PMNode
  itemIndex: number
  wrapperStart: number
  wrapperEnd: number
}

function getTopLevelListItemContext(
  state: import('@tiptap/pm/state').EditorState,
): TopLevelListItemContext | null {
  const { $from, empty } = state.selection
  if (!empty) return null
  let itemDepth: number | null = null
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'listItem') {
      itemDepth = d
      break
    }
  }
  // only handle items of a top-level list (doc > wrapper > bulletList > listItem)
  if (itemDepth !== 3) return null
  const wrapper = $from.node(1)
  if (wrapper.type.name !== 'backendBulletedList') return null
  return {
    item: $from.node(3),
    itemDepth,
    wrapper,
    list: $from.node(2),
    itemIndex: $from.index(2),
    wrapperStart: $from.before(1),
    wrapperEnd: $from.after(1),
  }
}

// Turns the current list item into top-level paragraph(s), keeping its content
// and splitting the list in two when the item is in the middle.
function liftListItemToParagraph(
  editor: import('@tiptap/core').Editor,
  ctx: TopLevelListItemContext,
): boolean {
  const { state } = editor
  const { item, wrapper, list, itemIndex, wrapperStart, wrapperEnd } = ctx
  const { backendParagraph, backendBulletedList, bulletList } = state.schema.nodes

  const itemsBefore: PMNode[] = []
  const itemsAfter: PMNode[] = []
  list.forEach((child, _offset, index) => {
    if (index < itemIndex) itemsBefore.push(child)
    else if (index > itemIndex) itemsAfter.push(child)
  })

  const size = item.attrs.size || 'medium'
  const paragraphs: PMNode[] = []
  item.forEach((child) => {
    if (child.isTextblock) {
      paragraphs.push(backendParagraph.create({ size }, child.content))
    }
  })
  if (!paragraphs.length) {
    paragraphs.push(backendParagraph.create({ size }))
  }

  const nodes: PMNode[] = []
  if (itemsBefore.length) {
    nodes.push(backendBulletedList.create(wrapper.attrs, bulletList.create(list.attrs, itemsBefore)))
  }
  nodes.push(...paragraphs)
  if (itemsAfter.length) {
    nodes.push(backendBulletedList.create(wrapper.attrs, bulletList.create(list.attrs, itemsAfter)))
  }

  return editor.commands.command(({ tr, dispatch }) => {
    if (dispatch) {
      tr.replaceWith(wrapperStart, wrapperEnd, nodes)
      const paraPos = wrapperStart + (itemsBefore.length ? nodes[0].nodeSize : 0)
      tr.setSelection(TextSelection.create(tr.doc, paraPos + 1))
      dispatch(tr)
    }
    return true
  })
}

// Notion-style list exits: Enter on an empty item leaves the list; Backspace
// at the start of an item converts it to a paragraph instead of merging it
// into the previous bullet (merged items lose content on save).
const ListExitOnEmptyEnter = Extension.create({
  name: 'listExitOnEmptyEnter',
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const ctx = getTopLevelListItemContext(editor.state)
        if (!ctx || ctx.item.textContent.length > 0) return false
        return liftListItemToParagraph(editor, ctx)
      },
      Backspace: ({ editor }) => {
        const ctx = getTopLevelListItemContext(editor.state)
        if (!ctx) return false
        const { $from } = editor.state.selection
        // only when the caret is at the very start of the item's first block
        if ($from.parentOffset !== 0 || $from.index(ctx.itemDepth) !== 0) return false
        return liftListItemToParagraph(editor, ctx)
      },
    }
  },
})

export function createNoteEditorExtensions() {
  return [
    BackendDocument,
    BackendParagraph,
    ListParagraph,
    BackendBulletedList,
    // disable the built-in "- " wrapping rule: it creates nested lists when
    // typed inside a list item; our BulletListInputRule handles paragraphs
    BulletList.extend({
      addInputRules() {
        return []
      },
    }).configure({
      HTMLAttributes: { class: 'note-editor-bullet-list' },
    }),
    BackendListItem,
    Text,
    Bold,
    Underline,
    TextStyle,
    Color.configure({ types: ['textStyle'] }),
    Gapcursor,
    History,
    multiBlockSelectExtension,
    blockDragHandleExtension,
    ListExitOnEmptyEnter,
    BulletListInputRule,
  ]
}
