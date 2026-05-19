import { useState, useMemo } from 'react'
import KolCard, { calcScore } from './KolCard'

const PLATFORMS = ['IG', 'TikTok', 'YouTube']
const ALL_STYLES = ['穿搭', '美妝', '生活', '美食', '旅遊', '健身', '寵物', '3C', '親子', '藝術', '時尚']
const STATUSES = ['全部', '洽談中', '已核准', '已寄信', '已確認', '合作完成', '暫緩', '已取消']
const SORT_OPTIONS = [
  { value: 'newest', label: '最新新增' },
  { value: 'score_desc', label: '推薦分↓' },
  { value: 'score_asc', label: '推薦分↑' },
  { value: 'engagement_desc', label: '互動率↓' },
  { value: 'followers_desc', label: '粉絲數↓' },
]

export default function Gallery({ influencers, loading, onGoAdmin, onRefresh }) {
  const [search, setSearch] = useState('')
  const [selPlatforms, setSelPlatforms] = useState([])
  const [selStyles, setSelStyles] = useState([])
  const [status, setStatus] = useState('全部')
  const [sort, setSort] = useState('newest')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notif, setNotif] = useState(null)

  const handleStatusChange = (newStatus) => {
    if (onRefresh) onRefresh()
    if (newStatus === '已取消') setStatus('已取消')
    if (newStatus === '已核准') setStatus('已核准')
    if (newStatus === '已寄信') setStatus('已寄信')
    if (newStatus === '洽談中') setStatus('洽談中')
  }

  const toggle = (arr, setArr, val) =>
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])

  const hasFilter = search || selPlatforms.length > 0 || selStyles.length > 0 || status !== '全部'

  const result = useMemo(() => {
    let list = influencers.filter(inf => {
      if (search && !inf.name.toLowerCase().includes(search.toLowerCase())) return false
      if (selPlatforms.length > 0 && !selPlatforms.some(p => (inf.platforms || []).includes(p))) return false
      if (selStyles.length > 0 && !selStyles.some(s => (inf.styles || []).includes(s))) return false
      if (status !== '全部' && inf.status !== status) return false
      return true
    })

    switch (sort) {
      case 'score_desc':      return [...list].sort((a, b) => calcScore(b) - calcScore(a))
      case 'score_asc':       return [...list].sort((a, b) => calcScore(a) - calcScore(b))
      case 'engagement_desc': return [...list].sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
      case 'followers_desc':  return [...list].sort((a, b) => {
        const ta = (a.followers_ig||0)+(a.followers_yt||0)+(a.followers_tiktok||0)
        const tb = (b.followers_ig||0)+(b.followers_yt||0)+(b.followers_tiktok||0)
        return tb - ta
      })
      default: return list // newest = already sorted by DB
    }
  }, [influencers, search, selPlatforms, selStyles, status, sort])

  const clearAll = () => {
    setSearch(''); setSelPlatforms([]); setSelStyles([]); setStatus('全部')
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    borderRadius: '8px', border: '1.5px solid #F0E8E6',
    fontSize: '13px',
  }

  return (
    <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto', padding: '24px', gap: '24px' }}>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside style={{ width: '220px', flexShrink: 0 }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            position: 'sticky', top: '86px',
            maxHeight: 'calc(100vh - 110px)', overflowY: 'auto',
          }}>
            {/* Search */}
            <div style={{ marginBottom: '20px' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 搜尋名稱..."
                style={inputStyle}
              />
            </div>

            {/* Platform */}
            <Section title="平台">
              {PLATFORMS.map(p => (
                <CheckRow key={p} label={p} checked={selPlatforms.includes(p)} onChange={() => toggle(selPlatforms, setSelPlatforms, p)} />
              ))}
            </Section>

            {/* Style */}
            <Section title="風格">
              {ALL_STYLES.map(s => (
                <CheckRow key={s} label={s} checked={selStyles.includes(s)} onChange={() => toggle(selStyles, setSelStyles, s)} />
              ))}
            </Section>

            {/* Status */}
            <Section title="合作狀態">
              {STATUSES.map(s => (
                <div
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    padding: '5px 8px', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '13px', marginBottom: '2px',
                    background: status === s ? '#FFF0EE' : 'transparent',
                    color: status === s ? '#E8523A' : '#374151',
                    fontWeight: status === s ? 700 : 400,
                  }}
                >
                  {s}
                </div>
              ))}
            </Section>

            {hasFilter && (
              <button
                onClick={clearAll}
                style={{
                  width: '100%', marginTop: '8px', padding: '8px',
                  borderRadius: '8px', border: '1.5px solid #F0E8E6',
                  background: 'transparent', fontSize: '12px', color: '#9CA3AF', cursor: 'pointer',
                }}
              >
                清除所有篩選
              </button>
            )}
          </div>
        </aside>
      )}

      {/* ── Main ── */}
      {notif && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#7C3AED', color: 'white', padding: '14px 24px', textAlign: 'center', fontSize: '16px', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', letterSpacing: '0.5px' }}>
          📩 {notif} 已回覆！狀態已更新為「洽談中」
        </div>
      )}
      <main style={{ flex: 1, minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              style={{ background: 'white', border: '1.5px solid #F0E8E6', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#6B7280', cursor: 'pointer' }}
            >
              {sidebarOpen ? '◀ 收起篩選' : '▶ 展開篩選'}
            </button>
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
              顯示 <strong style={{ color: '#E8523A' }}>{result.length}</strong> / {influencers.length} 位
            </span>
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #F0E8E6', fontSize: '13px', background: 'white', color: '#374151', cursor: 'pointer' }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Active filters chips */}
        {hasFilter && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {search && <Chip label={`搜尋：${search}`} onRemove={() => setSearch('')} />}
            {selPlatforms.map(p => <Chip key={p} label={p} onRemove={() => toggle(selPlatforms, setSelPlatforms, p)} />)}
            {selStyles.map(s => <Chip key={s} label={s} onRemove={() => toggle(selStyles, setSelStyles, s)} />)}
            {status !== '全部' && <Chip label={status} onRemove={() => setStatus('全部')} />}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px', color: '#9CA3AF' }}>
            <div>
              <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>⏳</div>
              <div>載入中...</div>
            </div>
          </div>
        ) : result.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px', color: '#9CA3AF' }}>
            {influencers.length === 0 ? (
              <>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>🌟</div>
                <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#374151' }}>還沒有任何網紅資料</p>
                <p style={{ fontSize: '13px', marginBottom: '24px' }}>前往管理後台新增第一位 KOL 吧！</p>
                {onGoAdmin && (
                  <button
                    onClick={onGoAdmin}
                    style={{
                      padding: '10px 24px', borderRadius: '10px',
                      background: '#E8523A', color: 'white',
                      border: 'none', fontSize: '14px', fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ＋ 新增第一位 KOL
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>找不到符合條件的網紅</p>
                <p style={{ fontSize: '13px' }}>試試調整篩選條件</p>
              </>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '18px',
          }}>
            {result.map(inf => <KolCard key={inf.id} influencer={inf} onStatusChange={handleStatusChange} onReplyMark={(name) => { setNotif(name); setTimeout(() => setNotif(null), 4500) }} />)}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Sub-components ──

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.8px', marginBottom: '8px', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  )
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: '#E8523A', width: '14px', height: '14px' }} />
      <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
    </label>
  )
}

function Chip({ label, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: '#FFF0EE', color: '#E8523A',
      border: '1px solid #FDDDD9', borderRadius: '20px',
      fontSize: '12px', fontWeight: 600, padding: '3px 10px',
    }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#E8523A', cursor: 'pointer', fontSize: '12px', padding: 0, lineHeight: 1 }}>✕</button>
    </span>
  )
}
