import api from '@/api'
import type { ApiSuccess } from '@/types/api'
import type { EdupageTimetableData } from '@/types/edupage'

export function getTimetable(workspaceId: string) {
  return api.get<ApiSuccess<EdupageTimetableData>>(
    `/workspaces/${workspaceId}/integrations/edupage/timetable`,
  )
}

export function syncTimetable(workspaceId: string) {
  return api.post(`/workspaces/${workspaceId}/integrations/edupage/timetable/sync`)
}
