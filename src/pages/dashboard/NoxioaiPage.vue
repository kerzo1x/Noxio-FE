<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useTemplateRef } from 'vue'
import sentIcon from '@/assets/img/sent.svg'
import userAvatar from '@/assets/img/user.svg'

const ASSISTANT_RESPONSE = `The old village lay quietly between rolling hills, as if time itself had chosen to rest there. Narrow cobblestone paths wound between small houses built of stone and wood, their walls worn smooth by decades of wind and rain. Roofs of faded clay tiles sagged slightly under the weight of years, and ivy crept patiently along their edges, reclaiming what once belonged to nature.

At the center of the village stood a weathered well, its wooden beam creaking softly whenever someone drew water. Nearby, a large oak tree spread its branches wide, offering shade to the worn benches beneath it. This was where villagers once gathered to share stories, exchange news, and watch the slow rhythm of life unfold.

The air carried a mixture of scents—fresh earth, burning firewood, and distant fields of grain. Chickens wandered freely across the paths, while an old dog dozed lazily in the afternoon sun. Every corner of the village seemed to hold a memory: a doorway polished by countless hands, a fence repaired more times than anyone could count, a window that had witnessed generations grow and fade.

Though many of the younger people had left for distant cities, the village remained alive in its own quiet way. A few elderly residents still tended their gardens, grew vegetables, and kept traditions alive. Their lives moved with the seasons, guided not by clocks, but by sunrise, harvest, and the turning of the year.

As evening approached, a golden light settled over the village, softening its edges and deepening its shadows. Smoke rose gently from chimneys, and the sound of distant bells echoed through the valley. In that moment, the old village seemed untouched by the rush of the modern world—a place where the past lingered, not as something forgotten, but as something still gently breathing.`

const WORD_DELAY_MS = 35
const THINKING_DELAY_MS = 2000

type StreamToken = { type: 'word'; value: string } | { type: 'break' }

function tokenizeForStreaming(text: string): StreamToken[] {
  const paragraphs = text.split(/\n\n+/)
  const tokens: StreamToken[] = []

  paragraphs.forEach((paragraph, index) => {
    paragraph
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .forEach((word) => tokens.push({ type: 'word', value: word }))

    if (index < paragraphs.length - 1) tokens.push({ type: 'break' })
  })

  return tokens
}

function tokensToText(tokens: StreamToken[], count: number): string {
  let result = ''
  let wordInParagraph = false

  for (let index = 0; index < count && index < tokens.length; index += 1) {
    const token = tokens[index]

    if (token.type === 'break') {
      result += '\n\n'
      wordInParagraph = false
      continue
    }

    result += wordInParagraph ? ` ${token.value}` : token.value
    wordInParagraph = true
  }

  return result
}

type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  text: string
  isStreaming?: boolean
}

const CHAT_HISTORY_POOL = [
  'Math explaining',
  'Essay draft help',
  'Chemistry homework',
  'Meeting notes',
  'Research outline',
  'Resume feedback',
  'Presentation prep',
  'Study plan',
  'Code review',
  'Lab report draft',
  'Literature analysis',
  'Project timeline',
  'Lecture recap',
  'Team standup',
  'Budget proposal',
  'History essay',
  'Physics problem set',
  'Internship cover letter',
  'Thesis chapter draft',
  'Weekly report',
]

function pickRandomChats(historyCount: number) {
  const shuffled = [...CHAT_HISTORY_POOL].sort(() => Math.random() - 0.5)
  const history = shuffled.slice(0, historyCount).map((name) => ({
    name,
    active: false,
  }))

  return [{ name: 'New chat', active: true }, ...history]
}

const prompts = ref(pickRandomChats(4))

const inputText = ref('')
const messages = ref<ChatMessage[]>([])
const isThinking = ref(false)
const isStreaming = ref(false)
const chatEndRef = useTemplateRef<HTMLDivElement>('chatEnd')

let thinkingTimeoutId: ReturnType<typeof setTimeout> | null = null
let streamIntervalId: ReturnType<typeof setInterval> | null = null
let messageId = 0

const isChatActive = computed(
  () => messages.value.length > 0 || isThinking.value || isStreaming.value,
)

const isBusy = computed(() => isThinking.value || isStreaming.value)

onUnmounted(() => {
  if (thinkingTimeoutId) clearTimeout(thinkingTimeoutId)
  if (streamIntervalId) clearInterval(streamIntervalId)
})

async function scrollToBottom() {
  await nextTick()
  chatEndRef.value?.scrollIntoView({ behavior: 'smooth' })
}

function streamAssistantResponse(assistantMessageId: number, fullText: string) {
  const tokens = tokenizeForStreaming(fullText)
  let tokenIndex = 0

  isStreaming.value = true

  streamIntervalId = setInterval(() => {
    const message = messages.value.find((item) => item.id === assistantMessageId)
    if (!message || tokenIndex >= tokens.length) {
      if (streamIntervalId) clearInterval(streamIntervalId)
      streamIntervalId = null
      if (message) {
        message.text = fullText
        message.isStreaming = false
      }
      isStreaming.value = false
      return
    }

    tokenIndex += 1
    message.text = tokensToText(tokens, tokenIndex)
    void scrollToBottom()
  }, WORD_DELAY_MS)
}

function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isBusy.value) return

  messages.value.push({
    id: ++messageId,
    role: 'user',
    text,
  })
  inputText.value = ''
  isThinking.value = true
  void scrollToBottom()

  thinkingTimeoutId = setTimeout(() => {
    isThinking.value = false

    const assistantMessageId = ++messageId
    messages.value.push({
      id: assistantMessageId,
      role: 'assistant',
      text: '',
      isStreaming: true,
    })
    thinkingTimeoutId = null
    void scrollToBottom()
    streamAssistantResponse(assistantMessageId, ASSISTANT_RESPONSE)
  }, THINKING_DELAY_MS)
}
</script>

<template>
  <section class="dashboard-page-column">
    <div class="flex min-h-0 flex-1">
      <aside class="shrink-0 pt-[47px]">
        <ul class="flex flex-col gap-5">
          <li
            v-for="(prompt, index) in prompts"
            :key="index"
            class="text-sm leading-[1.4] whitespace-nowrap"
            :class="prompt.active ? 'text-white' : 'text-white/50'"
          >
            {{ prompt.name }}
          </li>
        </ul>
      </aside>

      <div class="flex min-h-0 min-w-0 flex-1 flex-col pl-10">
        <div
          class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            v-if="!isChatActive"
            class="flex h-full min-h-[200px] items-center justify-center"
          >
            <p class="text-center text-2xl leading-[1.4]">
              <span class="text-white/50">type prompt to start chat with </span>
              <span class="text-white">Noxio AI</span>
              <svg
                class="relative -top-[10px] ml-1 inline-block size-4"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4.788 1.2L5.025 2.64C5.237 3.928 6.248 4.939 7.535 5.15L8.975 5.388L7.535 5.625C6.248 5.837 5.237 6.848 5.025 8.135L4.788 9.575L4.55 8.135C4.339 6.848 3.328 5.837 2.04 5.625L0.6 5.388L2.04 5.15C3.328 4.939 4.339 3.928 4.55 2.64L4.788 1.2Z"
                  fill="white"
                />
                <path
                  d="M9.3 0.48L9.419 1.202C9.525 1.768 9.972 2.215 10.538 2.321L11.26 2.44L10.538 2.559C9.972 2.665 9.525 3.112 9.419 3.678L9.3 4.4L9.181 3.678C9.075 3.112 8.628 2.665 8.062 2.559L7.34 2.44L8.062 2.321C8.628 2.215 9.075 1.768 9.181 1.202L9.3 0.48Z"
                  fill="white"
                />
              </svg>
            </p>
          </div>

          <div v-else class="flex flex-col gap-10 py-6">
            <template v-for="message in messages" :key="message.id">
              <div
                v-if="message.role === 'user'"
                class="flex items-start justify-end gap-2"
              >
                <div
                  class="rounded-[10px] bg-[#161616] px-10 py-[11px] text-sm leading-[1.4] text-white"
                >
                  {{ message.text }}
                </div>
                <img
                  :src="userAvatar"
                  alt=""
                  class="size-[38px] shrink-0"
                  aria-hidden="true"
                />
              </div>

              <div v-else class="flex items-start gap-5">
                <div
                  class="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-white"
                >
                  <svg
                    class="size-5"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M7.98 5L8.375 7.401C8.729 9.548 10.412 11.231 12.559 11.584L14.959 11.98L12.559 12.375C10.412 12.729 8.729 14.412 8.375 16.559L7.98 18.959L7.584 16.559C7.231 14.412 5.548 12.729 3.401 12.375L1 11.98L3.401 11.584C5.548 11.231 7.231 9.548 7.584 7.401L7.98 5Z"
                      fill="#141B34"
                    />
                    <path
                      d="M15.5 2L15.698 3.204C15.876 4.28 16.72 5.124 17.796 5.302L19 5.5L17.796 5.698C16.72 5.876 15.876 6.72 15.698 7.796L15.5 9L15.302 7.796C15.124 6.72 14.28 5.876 13.204 5.698L12 5.5L13.204 5.302C14.28 5.124 15.124 4.28 15.302 3.204L15.5 2Z"
                      fill="#141B34"
                    />
                  </svg>
                </div>
                <p class="min-w-0 flex-1 text-sm leading-[1.4] whitespace-pre-wrap text-white">
                  {{ message.text }}
                </p>
              </div>
            </template>

            <div v-if="isThinking" class="flex items-center gap-5">
              <div
                class="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-white"
              >
                <svg
                  class="size-5"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M7.98 5L8.375 7.401C8.729 9.548 10.412 11.231 12.559 11.584L14.959 11.98L12.559 12.375C10.412 12.729 8.729 14.412 8.375 16.559L7.98 18.959L7.584 16.559C7.231 14.412 5.548 12.729 3.401 12.375L1 11.98L3.401 11.584C5.548 11.231 7.231 9.548 7.584 7.401L7.98 5Z"
                    fill="#141B34"
                  />
                  <path
                    d="M15.5 2L15.698 3.204C15.876 4.28 16.72 5.124 17.796 5.302L19 5.5L17.796 5.698C16.72 5.876 15.876 6.72 15.698 7.796L15.5 9L15.302 7.796C15.124 6.72 14.28 5.876 13.204 5.698L12 5.5L13.204 5.302C14.28 5.124 15.124 4.28 15.302 3.204L15.5 2Z"
                    fill="#141B34"
                  />
                </svg>
              </div>
              <p class="text-sm leading-[1.4] text-white">Thinking ...</p>
            </div>

            <div ref="chatEnd" aria-hidden="true" />
          </div>
        </div>

        <div
          class="shrink-0 transition-[margin-bottom] duration-500 ease-in-out"
          :class="isChatActive ? 'mb-[44px]' : 'mb-[213px]'"
        >
          <div
            class="relative mx-auto h-[50px] w-full max-w-[650px] rounded-full bg-[#161616]"
            :class="{ 'border border-[#212121]': isChatActive }"
          >
            <button
              type="button"
              class="absolute left-5 top-1/2 flex size-[18px] -translate-y-1/2 items-center justify-center"
              tabindex="-1"
            >
              <span class="sr-only">Add attachment</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M9 0V18M0 9H18"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>

            <input
              v-model="inputText"
              type="text"
              class="absolute top-1/2 right-[70px] left-[73px] -translate-y-1/2 bg-transparent text-sm leading-[1.4] text-white outline-none placeholder:text-white/50"
              placeholder="What is on your mind today ..."
              :disabled="isBusy"
              @keydown.enter.prevent="sendMessage"
            />

            <button
              type="button"
              class="absolute right-2 top-1/2 flex h-[34px] w-[55px] -translate-y-1/2 items-center justify-center rounded-full bg-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!inputText.trim() || isBusy"
              @click="sendMessage"
            >
              <span class="sr-only">Send message</span>
              <img :src="sentIcon" alt="" class="size-[14px]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
