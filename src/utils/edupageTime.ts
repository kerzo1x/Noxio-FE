/**
 * EduPage timetable datetimes are ISO strings with a Z suffix whose
 * year/month/day/hour/minute are school wall-clock values, not a real UTC instant.
 */
export function parseEdupageDateTime(iso: string): Date {
  return new Date(iso)
}

/** Match lesson's encoded calendar day to the user's local "today". */
export function isEdupageLessonOnLocalToday(
  lessonStart: Date,
  now: Date = new Date(),
): boolean {
  return (
    lessonStart.getUTCFullYear() === now.getFullYear() &&
    lessonStart.getUTCMonth() === now.getMonth() &&
    lessonStart.getUTCDate() === now.getDate()
  )
}

export function formatEdupageHm(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}
