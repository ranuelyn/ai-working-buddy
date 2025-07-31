import React from 'react'
import { useAuth } from '../contexts/AuthContext'

type ProfileProps = {
  onClose: () => void
}

export const Profile: React.FC<ProfileProps> = ({ onClose }) => {
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Çıkış yapmak istediğinizden emin misiniz?')
    if (confirmLogout) {
      await signOut()
    }
  }

  if (!user) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        color: '#fff',
        border: '1px solid rgba(124, 58, 237, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '30px'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '28px',
            background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            👤 Profil
          </h1>
          <button 
            onClick={onClose} 
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a78bfa',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '50%'
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ 
          marginBottom: '30px',
          padding: '20px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#a78bfa' }}>Email:</strong>
          </div>
          <div style={{ fontSize: '16px' }}>
            {user.email}
          </div>
        </div>
        
        <div style={{ 
          marginBottom: '20px',
          padding: '15px',
          background: 'rgba(167, 139, 250, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(167, 139, 250, 0.3)',
          textAlign: 'center',
          color: '#a78bfa',
          fontSize: '14px'
        }}>
          Hesap oluşturulma: {new Date(user.created_at).toLocaleDateString('tr-TR')}
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          🚪 Güvenli Çıkış
        </button>
      </div>
    </div>
  )
}