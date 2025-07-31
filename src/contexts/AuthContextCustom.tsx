import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type User, type AuthError } from '../lib/supabase'

type AuthContextType = {
  user: User | null
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

type AuthProviderProps = {
  children: React.ReactNode
}

// Şifre hashleme için basit bir fonksiyon (production'da bcrypt kullanın)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // LocalStorage'dan user session'ını kontrol et
    const checkUser = () => {
      const savedUser = localStorage.getItem('ai-buddy-user')
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
        } catch (error) {
          localStorage.removeItem('ai-buddy-user')
        }
      }
      setLoading(false)
    }

    checkUser()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const hashedPassword = await hashPassword(password)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', hashedPassword)
        .single()

      if (error || !data) {
        return { user: null, error: { message: 'Email veya şifre hatalı' } }
      }

      const user: User = {
        id: data.id.toString(),
        email: data.email,
        created_at: data.created_at
      }

      setUser(user)
      localStorage.setItem('ai-buddy-user', JSON.stringify(user))

      return { user, error: null }
    } catch (error) {
      return { user: null, error: { message: 'Giriş yapılırken bir hata oluştu' } }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      // Email zaten var mı kontrol et
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single()

      if (existingUser) {
        return { user: null, error: { message: 'Bu email adresi zaten kullanılıyor' } }
      }

      const hashedPassword = await hashPassword(password)
      
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password_hash: hashedPassword,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) {
        return { user: null, error: { message: 'Hesap oluşturulurken bir hata oluştu' } }
      }

      const user: User = {
        id: data.id.toString(),
        email: data.email,
        created_at: data.created_at
      }

      return { user, error: null }
    } catch (error) {
      return { user: null, error: { message: 'Hesap oluşturulurken bir hata oluştu' } }
    }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('ai-buddy-user')
  }

  const value: AuthContextType = {
    user,
    signIn,
    signUp,
    signOut,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}