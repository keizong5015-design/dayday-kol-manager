import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Gallery from './components/Gallery'
import AdminPanel from './components/AdminPanel'

const ADMIN_PWD = import.meta.env.VITE_ADMIN_PASSWORD || 'dayday2024'

export default function App() {
  const [view, setView] = useState('gallery')
  const [authed, setAuthed] = useState(false)
  const [influencers, setInfluencers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('influencers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) showToast('載入失敗：' + error.message, 'error')
    else setInfluencers(data || [])
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const goAdmin = () => {
    if (authed) { setView('admin'); return }
    const pwd = prompt('🔐 請輸入管理員密碼：')
    if (pwd === ADMIN_PWD) {
      setAuthed(true)
      setView('admin')
    } else if (pwd !== null) {
      alert('❌ 密碼錯誤，請聯繫管理員')
    }
  }

  const navBtn = (target, label) => (
    <button
      onClick={target === 'admin' ? goAdmin : () => setView(target)}
      style={{
        padding: '7px 18px',
        borderRadius: '8px',
        border: view === target ? 'none' : '1.5px solid #E5E7EB',
        fontSize: '13px',
        fontWeight: 600,
        background: view === target ? '#E8523A' : 'white',
        color: view === target ? 'white' : '#6B7280',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F6' }}>

      {/* ── Navbar ── */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #F0E8E6',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          padding: '0 24px', height: '62px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⭐</span>
            <div>
              <span style={{ fontWeight: 800, fontSize: '17px', color: '#1A1A1A', letterSpacing: '-0.3px' }}>
                KOL Manager
              </span>
              <span style={{
                marginLeft: '8px',
                background: '#FFF0EE', color: '#E8523A',
                fontSize: '10px', fontWeight: 700,
                padding: '2px 7px', borderRadius: '20px', letterSpacing: '1px',
              }}>DAYDAY</span>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!loading && (
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                共 <strong style={{ color: '#E8523A' }}>{influencers.length}</strong> 位網紅
              </span>
            )}
            {navBtn('gallery', '🖼️ 網紅名單')}
            {navBtn('admin', '⚙️ 管理後台')}
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      {view === 'gallery' ? (
        <Gallery influencers={influencers} loading={loading} />
      ) : (
        <AdminPanel
          influencers={influencers}
          onRefresh={fetchAll}
          onBack={() => setView('gallery')}
          showToast={showToast}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
          background: toast.type === 'error' ? '#FEE2E2' : '#D1FAE5',
          color: toast.type === 'error' ? '#DC2626' : '#065F46',
          padding: '12px 20px', borderRadius: '12px',
          fontSize: '14px', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.type === 'error' ? '❌ ' : '✅ '}{toast.msg}
        </div>
      )}
    </div>
  )
}
