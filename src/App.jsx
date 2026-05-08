import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Gallery from './components/Gallery'
import AdminPanel from './components/AdminPanel'

const SITE_PWD   = import.meta.env.VITE_SITE_PASSWORD  || 'dayday'
const ADMIN_PWD  = import.meta.env.VITE_ADMIN_PASSWORD || 'dayday2024'
const SESSION_KEY = 'kol_site_authed'

// ── 全站登入畫面 ──────────────────────────────────────────
function LoginGate({ onUnlock }) {
  const [pwd, setPwd]     = useState('')
  const [err, setErr]     = useState(false)
  const [shake, setShake] = useState(false)

  const submit = () => {
    if (pwd === SITE_PWD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlock()
    } else {
      setErr(true)
      setShake(true)
      setPwd('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #FFF0EE 0%, #FFF8F6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '48px 40px',
        width: '100%', maxWidth: '400px',
        boxShadow: '0 8px 40px rgba(232,82,58,0.12)',
        animation: shake ? 'shake 0.4s ease' : 'none',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A' }}>KOL Manager</h1>
          <span style={{
            background: '#FFF0EE', color: '#E8523A',
            fontSize: '11px', fontWeight: 700,
            padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px',
          }}>DAYDAY</span>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '10px' }}>公司內部系統，請輸入密碼進入</p>
        </div>

        {/* Input */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setErr(false) }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="輸入進入密碼"
            autoFocus
            style={{
              width: '100%', padding: '12px 16px',
              borderRadius: '12px',
              border: err ? '2px solid #E8523A' : '2px solid #F0E8E6',
              fontSize: '15px', outline: 'none',
              textAlign: 'center', letterSpacing: '4px',
              transition: 'border-color 0.2s',
            }}
          />
          {err && (
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#E8523A', marginTop: '8px', fontWeight: 600 }}>
              ❌ 密碼錯誤，請重試
            </p>
          )}
        </div>

        <button
          onClick={submit}
          style={{
            width: '100%', padding: '13px',
            background: '#E8523A', color: 'white',
            border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          進入系統 →
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-10px); }
          40%      { transform: translateX(10px); }
          60%      { transform: translateX(-8px); }
          80%      { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}

// ── 主應用 ────────────────────────────────────────────────
export default function App() {
  const [siteAuthed, setSiteAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  )
  const [view, setView]           = useState('gallery')
  const [adminAuthed, setAdminAuthed] = useState(false)
  const [influencers, setInfluencers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState(null)

  useEffect(() => { if (siteAuthed) fetchAll() }, [siteAuthed])

  const fetchAll = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('influencers')
      .select('*')
      .orde
