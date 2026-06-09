import { Extension, InputRule, Node, mergeAttributes } from '@tiptap/core'
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

          const blockStart = $from.before(blockDepth)
          const blockEnd = $from.after(blockDepth)
          const size = $from.node(blockDepth).attrs.size ?? 'medium'

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
                      content: [{ type: 'paragraph' }],
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

export function createNoteEditorExtensions() {
  return [
    BackendDocument,
    BackendParagraph,
    ListParagraph,
    BackendBulletedList,
    BulletList.configure({
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
    BulletListInputRule,
  ]
}
