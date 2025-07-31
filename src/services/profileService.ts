import { supabase } from '../lib/supabase'

export type UserProfile = {
  id: string
  user_id: string
  first_name: string
  last_name: string
  age: number
  created_at: string
  updated_at: string
}

export type CreateProfileData = {
  user_id: string
  first_name: string
  last_name: string
  age: number
}

export type UpdateProfileData = {
  first_name?: string
  last_name?: string
  age?: number
}

class ProfileService {
  // Kullanıcı profili oluştur
  async createProfile(data: CreateProfileData): Promise<{ profile: UserProfile | null; error: any }> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: data.user_id,
          first_name: data.first_name,
          last_name: data.last_name,
          age: data.age,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      return { profile, error }
    } catch (error) {
      return { profile: null, error }
    }
  }

  // Kullanıcı profilini getir
  async getProfile(userId: string): Promise<{ profile: UserProfile | null; error: any }> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      return { profile, error }
    } catch (error) {
      return { profile: null, error }
    }
  }

  // Kullanıcı profilini güncelle
  async updateProfile(userId: string, data: UpdateProfileData): Promise<{ profile: UserProfile | null; error: any }> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      return { profile, error }
    } catch (error) {
      return { profile: null, error }
    }
  }

  // Kullanıcı profilini sil
  async deleteProfile(userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)

      return { error }
    } catch (error) {
      return { error }
    }
  }
}

export const profileService = new ProfileService()