import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Lobby.css' // Mevcut stilleri kullanacağız

type LoginProps = {
  onSwitchToRegister: () => void
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Lütfen tüm alanları doldurun')
      setIsLoading(false)
      return
    }

    const { error: signInError } = await signIn(email, password)
    
    if (signInError) {
      setError(signInError.message)
    }
    
    setIsLoading(false)
  }

  return (
    <div className="lobby-container poppins-font" style={{
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Karakter görseli */}
      <img
        src="/assets/character_smiling.png"
        alt="AI Buddy"
        className="lobby-avatar lobby-avatar-glow"
        style={{ marginBottom: '20px' }}
      />
      
      <h1 className="lobby-title lobby-title-spacing">
        Hoş Geldin!
      </h1>
      
      <p style={{
        color: '#a78bfa',
        fontSize: '16px',
        textAlign: 'center',
        marginBottom: '40px',
        fontWeight: 500
      }}>
        AI çalışma arkadaşınla buluşmak için giriş yap
      </p>

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '400px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Email Input */}
        <div className="lobby-input-floating-container">
          <input
            className="lobby-input lobby-input-spacing"
            type="email"
            id="email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoComplete="email"
            disabled={isLoading}
          />
          <label
            htmlFor="email-input"
            className={
              "lobby-input-label" +
              ((emailFocused || email) ? " lobby-input-label--active" : "")
            }
          >
            E-posta Adresi
          </label>
        </div>

        {/* Password Input */}
        <div className="lobby-input-floating-container">
          <input
            className="lobby-input lobby-input-spacing"
            type="password"
            id="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            autoComplete="current-password"
            disabled={isLoading}
          />
          <label
            htmlFor="password-input"
            className={
              "lobby-input-label" +
              ((passwordFocused || password) ? " lobby-input-label--active" : "")
            }
          >
            Şifre
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#fca5a5',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          className="lobby-button lobby-button-glow"
          type="submit"
          disabled={isLoading}
          style={{
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>

        {/* Register Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <span style={{ color: '#a78bfa', fontSize: '14px' }}>
            Hesabın yok mu?{' '}
          </span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#7c3aed',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#8b5cf6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#7c3aed'
            }}
          >
            Hesap Oluştur
          </button>
        </div>
      </form>
    </div>
  )
}