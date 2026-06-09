import { Node, mergeAttributes } from '@tiptap/core'
import { blockSizeClass } from '@/utils/noteContent'
import type { NoteBlockSize } from '@/types/notes'

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
