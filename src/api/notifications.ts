import api from '@/api'

export interface NotificationItem {
  id: string
  title: string
  read: boolean
}

interface NotificationsPayload {
  success?: boolean
  data?: { items?: NotificationItem[] }
}

export function listNotifications(workspaceId: string, limit = 20) {
  return api.get<NotificationsPayload>(`/workspaces/${workspaceId}/notifications`, {
    params: { limit },
  })
}
