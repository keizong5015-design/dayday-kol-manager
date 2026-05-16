import { useState, useMemo } from 'react'
import KolCard, { calcScore } from './KolCard'

const PLATFORMS = ['IG', 'TikTok', 'YouTube']
const ALL_STYLES = ['ç©¿æ­', 'ç¾å¦', 'çæ´»', 'ç¾é£', 'æé', 'å¥èº«', 'å¯µç©', '3C', 'è¦ªå­', 'èè¡', 'æå°']
const STATUSES = ['å¨é¨', 'æ´½è«ä¸­', 'å·²ç¢ºèª', 'åä½å®æ', 'æ«ç·©']
const SORT_OPTIONS = [
  { value: 'newest', label: 'ææ°æ°å¢' },
  { value: 'score_desc', label: 'æ¨è¦åâ' },
  { value: 'score_asc', label: 'æ¨è¦åâ' },
  { value: 'engagement_desc', label: 'äºåçâ' },
  { value: 'followers_desc', label: 'ç²çµ²æ¸â' },
]

export default function Gallery({ influencers, loading, onGoAdmin, onRefresh }) {
  const [search, setSearch] = useState('')
  const [selPlatforms, setSelPlatforms] = useState([])
  const [selStyles, setSelStyles] = useState([])
  const [status, setStatus] = useState('å¨é¨')
  const [sort, setSort] = useState('newest')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleStatusChange = (newStatus) => {
    if (onRefresh) onRefresh()
    if (newStatus === '已取消') setStatus('已取消')
    if (newStatus === '已核准') setStatus('已核准')
  }

  const toggle = (arr, setArr, val) =>
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])

  const hasFilter = search || selPlatforms.length > 0 || selStyles.length > 0 || status !== 'å¨é¨'

  const result = useMemo(() => {
    let list = influencers.filter(inf => {
      if (search && !inf.name.toLowerCase().includes(search.toLowerCase())) return false
      if (selPlatforms.length > 0 && !selPlatforms.some(p => (inf.platforms || []).includes(p))) return false
      if (selStyles.length > 0 && !selStyles.some(s => (inf.styles || []).includes(s))) return false
      if (status !== 'å¨é¨' && inf.status !== status) return false
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
      default: return list
    }
  }, [influencers, search, selPlatforms, selStyles, status, sort])

  const clearAll = () => { setSearch(''); setSelPlatforms([]); setSelStyles([]); setStatus('å¨é¨') }

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #F0E8E6', fontSize: '13px' }

  return (
    <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto', padding: '24px', gap: '24px' }}>
      {sidebarOpen && (
        <aside style={{ width: '220px', flexShrink: 0 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', position: 'sticky', top: '86px', maxHeight: 'calc(100vh - 110px)', overflowY: 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder='ð æå°åç¨±...' style={inputStyle} />
            </div>
            <Section title='å¹³å°'>
              {PLATFORMS.map(p => <CheckRow key={p} label={p} checked={selPlatforms.includes(p)} onChange={() => toggle(selPlatforms, setSelPlatforms, p)} />)}
            </Section>
            <Section title='é¢¨æ ¼'>
              {ALL_STYLES.map(s => <CheckRow key={s} label={s} checked={selStyles.includes(s)} onChange={() => toggle(selStyles, setSelStyles, s)} />)}
            </Section>
            <Section title='åä½çæ'>
              {STATUSES.map(s => (
                <div key={s} onClick={() => setStatus(s)} style={{ padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginBottom: '2px', background: status === s ? '#FFF0EE' : 'transparent', color: status === s ? '#E8523A' : '#374151', fontWeight: status === s ? 700 : 400 }}>{s}</div>
              ))}
            </Section>
            {hasFilter && <button onClick={clearAll} style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '8px', border: '1.5px solid #F0E8E6', background: 'transparent', fontSize: '12px', color: '#9CA3AF', cursor: 'pointer' }}>æ¸é¤ææç¯©é¸</button>}
          </div>
        </aside>
      )}
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={{ background: 'white', border: '1.5px solid #F0E8E6', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#6B7280', cursor: 'pointer' }}>{sidebarOpen ? 'â æ¶èµ·ç¯©é¸' : 'â¶ å±éç¯©é¸'}</button>
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>é¡¯ç¤º <strong style={{ color: '#E8523A' }}>{result.length}</strong> / {influencers.length} ä½</span>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #F0E8E6', fontSize: '13px', background: 'white', color: '#374151', cursor: 'pointer' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {hasFilter && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {search && <Chip label={'æå°ï¼' + search} onRemove={() => setSearch('')} />}
            {selPlatforms.map(p => <Chip key={p} label={p} onRemove={() => toggle(selPlatforms, setSelPlatforms, p)} />)}
            {selStyles.map(s => <Chip key={s} label={s} onRemove={() => toggle(selStyles, setSelStyles, s)} />)}
            {status !== 'å¨é¨' && <Chip label={status} onRemove={() => setStatus('å¨é¨')} />}
          </div>
        )}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px', color: '#9CA3AF' }}>
            <div><div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>â³</div><div>è¼å¥ä¸­...</div></div>
          </div>
        ) : result.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px', color: '#9CA3AF' }}>
            {influencers.length === 0 ? (
              <>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>ð</div>
                <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#374151' }}>éæ²æä»»ä½ç¶²ç´è³æ</p>
                <p style={{ fontSize: '13px', marginBottom: '24px' }}>åå¾ç®¡çå¾å°æ°å¢ç¬¬ä¸ä½ KOL å§ï¼</p>
                {onGoAdmin && (
                  <button onClick={onGoAdmin} style={{ padding: '10px 24px', borderRadius: '10px', background: '#E8523A', color: 'white', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>ï¼ æ°å¢ç¬¬ä¸ä½ KOL</button>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>ð</div>
                <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>æ¾ä¸å°ç¬¦åæ¢ä»¶çç¶²ç´</p>
                <p style={{ fontSize: '13px' }}>è©¦è©¦èª¿æ´ç¯©é¸æ¢ä»¶</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '18px' }}>
            {result.map(inf => <KolCard key={inf.id} influencer={inf} onStatusChange={handleStatusChange} />)}
          </div>
        )}
      </main>
    </div>
  )
}

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
      <input type='checkbox' checked={checked} onChange={onChange} style={{ accentColor: '#E8523A', width: '14px', height: '14px' }} />
      <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
    </label>
  )
}

function Chip({ label, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FFF0EE', color: '#E8523A', border: '1px solid #FDDDD9', borderRadius: '20px', fontSize: '12px', fontWeight: 600, padding: '3px 10px' }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#E8523A', cursor: 'pointer', fontSize: '12px', padding: 0, lineHeight: 1 }}>â</button>
    </span>
  )
              }
