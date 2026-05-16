import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Gallery from './components/Gallery'
import AdminPanel from './components/AdminPanel'

const SITE_PWD   = import.meta.env.VITE_SITE_PASSWORD  || 'dayday'
const ADMIN_PWD  = import.meta.env.VITE_ADMIN_PASSWORD || 'dayday2024'
const SESSION_KEY = 'kol_site_authed'

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFF0EE 0%, #FFF8F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '48px 40px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 40px rgba(232,82,58,0.12)', animation: shake ? 'shake 0.4s ease' : 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>â­</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A' }}>KOL Manager</h1>
          <span style={{ background: '#FFF0EE', color: '#E8523A', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px' }}>DAYDAY</span>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '10px' }}>å¬å¸å§é¨ç³»çµ±ï¼è«è¼¸å¥å¯ç¢¼é²å¥</p>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <input type='password' value={pwd} onChange={e => { setPwd(e.target.value); setErr(false) }} onKeyDown={e => e.key === 'Enter' && submit()} placeholder='è¼¸å¥é²å¥å¯ç¢¼' autoFocus style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: err ? '2px solid #E8523A' : '2px solid #F0E8E6', fontSize: '15px', outline: 'none', textAlign: 'center', letterSpacing: '4px', transition: 'border-color 0.2s' }} />
          {err && <p style={{ textAlign: 'center', fontSize: '13px', color: '#E8523A', marginTop: '8px', fontWeight: 600 }}>â å¯ç¢¼é¯èª¤ï¼è«éè©¦</p>}
        </div>
        <button onClick={submit} style={{ width: '100%', padding: '13px', background: '#E8523A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>é²å¥ç³»çµ± â</button>
      </div>
      <style>{'@keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 40% { transform: translateX(10px); } 60% { transform: translateX(-8px); } 80% { transform: translateX(8px); } }'}</style>
    </div>
  )
}

export default function App() {
  const [siteAuthed, setSiteAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [view, setView]             = useState('gallery')
  const [adminAuthed, setAdminAuthed] = useState(false)
  const [influencers, setInfluencers] = useState([])
  const [loading, setLoading]       = useState(true)
  const [toast, setToast]           = useState(null)

  useEffect(() => { if (siteAuthed) fetchAll() }, [siteAuthed])

  const fetchAll = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('influencers').select('*').order('created_at', { ascending: false })
    if (error) showToast('è¼å¥å¤±æï¼' + error.message, 'error')
    else setInfluencers(data || [])
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const goAdmin = () => {
    if (adminAuthed) { setView('admin'); return }
    const pwd = prompt('ð è«è¼¸å¥ç®¡çå¡å¯ç¢¼ï¼')
    if (pwd === ADMIN_PWD) { setAdminAuthed(true); setView('admin') }
    else if (pwd !== null) alert('â å¯ç¢¼é¯èª¤')
  }

  if (!siteAuthed) return <LoginGate onUnlock={() => setSiteAuthed(true)} />

  const navBtn = (target, label) => (
    <button onClick={target === 'admin' ? goAdmin : () => setView(target)} style={{ padding: '7px 18px', borderRadius: '8px', border: view === target ? 'none' : '1.5px solid #E5E7EB', fontSize: '13px', fontWeight: 600, background: view === target ? '#E8523A' : 'white', color: view === target ? 'white' : '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}>{label}</button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F6' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid #F0E8E6', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>â­</span>
            <div>
              <span style={{ fontWeight: 800, fontSize: '17px', color: '#1A1A1A', letterSpacing: '-0.3px' }}>KOL Manager</span>
              <span style={{ marginLeft: '8px', background: '#FFF0EE', color: '#E8523A', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', letterSpacing: '1px' }}>DAYDAY</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!loading && <span style={{ fontSize: '12px', color: '#9CA3AF' }}>å± <strong style={{ color: '#E8523A' }}>{influencers.length}</strong> ä½ç¶²ç´</span>}
            {navBtn('gallery', 'ð¼ï¸ ç¶²ç´åå®')}
            {navBtn('admin', 'âï¸ ç®¡çå¾å°')}
            <button onClick={() => { sessionStorage.removeItem(SESSION_KEY); setSiteAuthed(false) }} style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #F0E8E6', background: 'transparent', fontSize: '12px', color: '#9CA3AF', cursor: 'pointer' }} title='ç»åº'>ðª</button>
          </div>
        </div>
      </nav>
      {view === 'gallery' ? (
        <Gallery influencers={influencers} loading={loading} onGoAdmin={goAdmin} onRefresh={fetchAll} />
      ) : (
        <AdminPanel influencers={influencers} onRefresh={fetchAll} onBack={() => setView('gallery')} showToast={showToast} />
      )}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, background: toast.type === 'error' ? '#FEE2E2' : '#D1FAE5', color: toast.type === 'error' ? '#DC2626' : '#065F46', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          {toast.type === 'error' ? 'â ' : 'â '}{toast.msg}
        </div>
      )}
    </div>
  )
                                                                                   }
