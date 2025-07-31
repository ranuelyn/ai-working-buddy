import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { profileService } from '../services/profileService'
import './Lobby.css' // Mevcut stilleri kullanacağız

type RegisterProps = {
  onSwitchToLogin: () => void
  onRegisterSuccess: () => void
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)
  const [firstNameFocused, setFirstNameFocused] = useState(false)
  const [lastNameFocused, setLastNameFocused] = useState(false)
  const [ageFocused, setAgeFocused] = useState(false)
  
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!email.trim() || !password.trim() || !confirmPassword.trim() || !firstName.trim() || !lastName.trim() || !age.trim()) {
      setError('Lütfen tüm alanları doldurun')
      setIsLoading(false)
      return
    }

    const ageNumber = parseInt(age.trim())
    if (isNaN(ageNumber) || ageNumber < 13 || ageNumber > 100) {
      setError('Lütfen geçerli bir yaş girin (13-100 arası)')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı')
      setIsLoading(false)
      return
    }

    const { user, error: signUpError } = await signUp(email, password)
    
    if (signUpError) {
      setError(signUpError.message)
    } else if (user) {
      // Profil oluştur
      const { error: profileError } = await profileService.createProfile({
        user_id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        age: ageNumber
      })

      if (profileError) {
        console.error('Profil oluşturma hatası:', profileError)
      }

      setSuccess('Hesap başarıyla oluşturuldu! E-postanızı kontrol edin.')
      setTimeout(() => {
        onRegisterSuccess()
      }, 2000)
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
        Hesap Oluştur
      </h1>
      
      <p style={{
        color: '#a78bfa',
        fontSize: '16px',
        textAlign: 'center',
        marginBottom: '40px',
        fontWeight: 500
      }}>
        AI çalışma arkadaşınla tanışmaya hazır ol!
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
            id="register-email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoComplete="email"
            disabled={isLoading}
          />
          <label
            htmlFor="register-email-input"
            className={
              "lobby-input-label" +
              ((emailFocused || email) ? " lobby-input-label--active" : "")
            }
          >
            E-posta Adresi
          </label>
        </div>

        {/* First Name Input */}
        <div className="lobby-input-floating-container">
          <input
            className="lobby-input lobby-input-spacing"
            type="text"
            id="register-firstname-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onFocus={() => setFirstNameFocused(true)}
            onBlur={() => setFirstNameFocused(false)}
            autoComplete="given-name"
            disabled={isLoading}
          />
          <label
            htmlFor="register-firstname-input"
            className={
              "lobby-input-label" +
              ((firstNameFocused || firstName) ? " lobby-input-label--active" : "")
            }
          >
            Ad
          </label>
        </div>

        {/* Last Name Input */}
        <div className="lobby-input-floating-container">
          <input
            className="lobby-input lobby-input-spacing"
            type="text"
            id="register-lastname-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onFocus={() => setLastNameFocused(true)}
            onBlur={() => setLastNameFocused(false)}
            autoComplete="family-name"
            disabled={isLoading}
          />
          <label
            htmlFor="register-lastname-input"
            className={
              "lobby-input-label" +
              ((lastNameFocused || lastName) ? " lobby-input-label--active" : "")
            }
          >
            Soyad
          </label>
        </div>

        {/* Age Input */}
        <div className="lobby-input-floating-container">
          <input
            className="lobby-input lobby-input-spacing"
            type="number"
            id="register-age-input"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            onFocus={() => setAgeFocused(true)}
            onBlur={() => setAgeFocused(false)}
            min="13"
            max="100"
            disabled={isLoading}
          />
          <label
            htmlFor="register-age-input"
            className={
              "lobby-input-label" +
              ((ageFocused || age) ? " lobby-input-label--active" : "")
            }
          >
            Yaş
          </label>
        </div>

        {/* Password Input */}
        <div className="lobby-input-floating-container">
          <input
            className="lobby-input lobby-input-spacing"
            type="password"
            id="register-password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            autoComplete="new-password"
            disabled={isLoading}
          />
          <label
            htmlFor="register-password-input"
            className={
              "lobby-input-label" +
              ((passwordFocused || password) ? " lobby-input-label--active" : "")
            }
          >
            Şifre (en az 6 karakter)
          </label>
        </div>

        {/* Confirm Password Input */}
        <div className="lobby-input-floating-container">
          <input
            className="lobby-input lobby-input-spacing"
            type="password"
            id="confirm-password-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => setConfirmPasswordFocused(true)}
            onBlur={() => setConfirmPasswordFocused(false)}
            autoComplete="new-password"
            disabled={isLoading}
          />
          <label
            htmlFor="confirm-password-input"
            className={
              "lobby-input-label" +
              ((confirmPasswordFocused || confirmPassword) ? " lobby-input-label--active" : "")
            }
          >
            Şifre Tekrar
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

        {/* Success Message */}
        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#6ee7b7',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        {/* Register Button */}
        <button
          className="lobby-button lobby-button-glow"
          type="submit"
          disabled={isLoading}
          style={{
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
        </button>

        {/* Login Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <span style={{ color: '#a78bfa', fontSize: '14px' }}>
            Zaten hesabın var mı?{' '}
          </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
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
            Giriş Yap
          </button>
        </div>
      </form>
    </div>
  )
}