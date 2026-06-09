import type { EdupageTimetableLesson } from '@/types/edupage'
import { isEdupageLessonOnLocalToday, parseEdupageDateTime } from '@/utils/edupageTime'

export interface TimetableSlotGroup {
  slotIndex: number
  start: Date
  end: Date
  lessons: EdupageTimetableLesson[]
}

export function lessonsForLocalToday(
  list: EdupageTimetableLesson[],
  now: Date = new Date(),
): EdupageTimetableLesson[] {
  return list.filter((l) =>
    isEdupageLessonOnLocalToday(parseEdupageDateTime(l.startTime), now),
  )
}

export function buildSlotGroups(
  dayLessons: EdupageTimetableLesson[],
): TimetableSlotGroup[] {
  const sorted = [...dayLessons].sort(
    (a, b) =>
      parseEdupageDateTime(a.startTime).getTime() -
      parseEdupageDateTime(b.startTime).getTime(),
  )
  const clusters: EdupageTimetableLesson[][] = []
  for (const lesson of sorted) {
    const t = parseEdupageDateTime(lesson.startTime).getTime()
    const prev = clusters[clusters.length - 1]
    if (prev && parseEdupageDateTime(prev[0].startTime).getTime() === t) {
      prev.push(lesson)
    } else {
      clusters.push([lesson])
    }
  }
  return clusters.map((group, i) => {
    const start = parseEdupageDateTime(group[0].startTime)
    const endMs = Math.max(
      ...group.map((l) => parseEdupageDateTime(l.endTime).getTime()),
    )
    return { slotIndex: i + 1, start, end: new Date(endMs), lessons: group }
  })
}
