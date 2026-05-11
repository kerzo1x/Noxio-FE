export interface EdupageTimetableLesson {
  id: string
  subject: string
  date: string
  startTime: string
  endTime: string
}

export interface EdupageTimetableData {
  isConnected: boolean
  isSyncing: boolean
  syncedAt: string | null
  lessons: EdupageTimetableLesson[]
}
