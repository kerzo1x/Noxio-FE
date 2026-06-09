import Document from '@tiptap/extension-document'
import Bold from '@tiptap/extension-bold'
import BulletList from '@tiptap/extension-bullet-list'
import Color from '@tiptap/extension-color'
import Gapcursor from '@tiptap/extension-gapcursor'
import History from '@tiptap/extension-history'
import Text from '@tiptap/extension-text'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { multiBlockSelectExtension } from '@/editor/multiBlockSelect'
import { blockDragHandleExtension } from '@/editor/blockDragHandle'
import { BackendParagraph, ListParagraph } from '@/editor/nodes/backendParagraph'
import {
  BackendBulletedList,
  BackendListItem,
  BulletListInputRule,
  ListExitOnEmptyEnter,
} from '@/editor/nodes/backendBulletedList'

export const MAX_TOP_LEVEL_BLOCKS = 500

export const BackendDocument = Document.extend({
  content: '(backendParagraph | backendBulletedList)+',
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
