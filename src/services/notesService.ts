import { supabase } from '../lib/supabase'

export type UserNote = {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

class NotesService {
  // Kullanıcının notlarını getir
  async getUserNotes(userId: string): Promise<{ notes: UserNote | null; error: unknown }> {
    try {
      const { data: notes, error } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', userId)
        .single()

      return { notes, error }
    } catch (error) {
      return { notes: null, error }
    }
  }

  // Notları oluştur veya güncelle (upsert)
  async saveUserNotes(userId: string, content: string): Promise<{ notes: UserNote | null; error: unknown }> {
    try {
      const { data: notes, error } = await supabase
        .from('user_notes')
        .upsert({
          user_id: userId,
          content: content,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      return { notes, error }
    } catch (error) {
      return { notes: null, error }
    }
  }

  // Notları sil
  async deleteUserNotes(userId: string): Promise<{ error: unknown }> {
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('user_id', userId)

      return { error }
    } catch (error) {
      return { error }
    }
  }
}

export const notesService = new NotesService()