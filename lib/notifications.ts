import { supabase } from '@/lib/supabase'

export async function createNotification(
  clientId: string,
  type: 'account' | 'project' | 'invoice' | 'payment' | 'message' | 'file' | 'system',
  title: string,
  message: string,
  data: Record<string, any> = {}
) {
  try {
    const { error } = await supabase.from('notifications').insert({
      client_id: clientId,
      type,
      title,
      message,
      data,
    })
    
    if (error) {
      console.error('Failed to create notification:', error)
      return { success: false, error }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Notification creation exception:', error)
    return { success: false, error }
  }
}

export async function markNotificationRead(notificationId: number) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    
    if (error) {
      console.error('Failed to mark notification read:', error)
      return { success: false, error }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Mark read exception:', error)
    return { success: false, error }
  }
}

export async function markAllNotificationsRead(clientId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('client_id', clientId)
      .eq('read', false)
    
    if (error) {
      console.error('Failed to mark all notifications read:', error)
      return { success: false, error }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Mark all read exception:', error)
    return { success: false, error }
  }
}

export async function getUnreadNotificationCount(clientId: string) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('read', false)
    
    if (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
    
    return count || 0
  } catch (error) {
    console.error('Get unread count exception:', error)
    return 0
  }
}
