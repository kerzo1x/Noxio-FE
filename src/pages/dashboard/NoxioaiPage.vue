<script setup lang="ts">
import sentIcon from '@/assets/img/sent.svg'

const prompts = [
  { name: 'prompt name', active: true },
  { name: 'prompt name', active: false },
  { name: 'prompt name', active: false },
  { name: 'prompt name', active: false },
  { name: 'prompt name', active: false },
]
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
        <div class="flex flex-1 items-center justify-center px-4">
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

        <div class="mb-[213px] shrink-0">
          <div
            class="relative mx-auto h-[50px] w-full max-w-[650px] rounded-full bg-[#161616]"
          >
            <button
              type="button"
              class="absolute left-5 top-1/2 flex size-[18px] -translate-y-1/2 items-center justify-center"
              aria-hidden="true"
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

            <p
              class="pointer-events-none absolute left-[73px] top-1/2 -translate-y-1/2 text-sm leading-[1.4] text-white/50"
            >
              What is on your mind today ...
            </p>

            <button
              type="button"
              class="absolute right-2 top-1/2 flex h-[34px] w-[55px] -translate-y-1/2 items-center justify-center rounded-full bg-white"
              aria-hidden="true"
              tabindex="-1"
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
