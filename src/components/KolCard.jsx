import { useState } from 'react'
import { supabase } from '../lib/supabase'

const PLATFORM_COLOR = { IG: '#E1306C', TikTok: '#010101', YouTube: '#FF0000' }

const AVATAR_COLORS = [
  'linear-gradient(135deg, #E8523A, #F87171)',
  'linear-gradient(135deg, #F59E0B, #FBBF24)',
  'linear-gradient(135deg, #10B981, #34D399)',
  'linear-gradient(135deg, #3B82F6, #60A5FA)',
  'linear-gradient(135deg, #8B5CF6, #A78BFA)',
  'linear-gradient(135deg, #EC4899, #F9A8D4)',
]
const avatarBg      = (name) => AVATAR_COLORS[((name || '?').charCodeAt(0)) % AVATAR_COLORS.length]
const avatarInitial = (name) => (name || '?').charAt(0).toUpperCase()

const STATUS_STYLE = {
  '洽談中':   { bg: '#FEF3C7', color: '#92400E' },
  '已核准':   { bg: '#D1FAE5', color: '#065F46' },
  '已寄信':   { bg: '#EDE9FE', color: '#6D28D9' },
  '已確認':   { bg: '#DBEAFE', color: '#1E40AF' },
  '合作完成': { bg: '#BBF7D0', color: '#14532D' },
  '暫緩':     { bg: '#F3F4F6', color: '#6B7280' },
  '已取消':   { bg: '#FEE2E2', color: '#991B1B' },
}

export const fmtNum = (n) => {
  if (!n || n === 0) return '-'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return Math.round(n / 1_000) + 'K'
  return String(n)
}

export const calcScore = (inf) => {
  const total    = (inf.followers_ig || 0) + (inf.followers_yt || 0) + (inf.followers_tiktok || 0)
  const engScore = Math.min((inf.engagement_rate || 0) * 10, 60)
  const follScore= Math.min(total / 50_000, 40)
  return Math.round((engScore + follScore) * 10) / 10
}

const scoreColor = (s) => {
  if (s >= 80) return '#22C55E'
  if (s >= 60) return '#F59E0B'
  if (s >= 40) return '#3B82F6'
  return '#9CA3AF'
}

const extractIgHandle = (handle) => {
  if (!handle) return ''
  // If it's a full URL, extract the username part
  const urlMatch = handle.match(/instagram\.com\/([^/?#\s]+)/)
  if (urlMatch) return urlMatch[1]
  // Otherwise strip @ and trim
  return handle.replace(/^@/, '').trim()
}
const igUrl = (handle) => {
  const h = extractIgHandle(handle)
  return h ? `https://www.instagram.com/${h}` : null
}

export default function KolCard({ influencer: inf, onStatusChange }) {
  const [showDetail, setShowDetail]       = useState(false)
  const [imgError, setImgError]           = useState(false)
  const [detailImgError, setDetailImgError] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const handleStatusUpdate = async (e, newStatus) => {
    e.stopPropagation()
    if (statusUpdating) return
    setStatusUpdating(true)
    await supabase.from('influencers').update({ status: newStatus }).eq('id', inf.id)
    setStatusUpdating(false)
    if (onStatusChange) onStatusChange(newStatus)
  }

  const score     = calcScore(inf)
  const ss        = STATUS_STYLE[inf.status] || STATUS_STYLE['洽談中']
  const total     = (inf.followers_ig || 0) + (inf.followers_yt || 0) + (inf.followers_tiktok || 0)
  const platforms = inf.platforms || []
  const styles    = inf.styles    || []
  const igLink    = igUrl(inf.ig_handle)
  const igDisplay = extractIgHandle(inf.ig_handle)

  return (
    <>
      {/* ── Card ── */}
      <div
        className="kol-card"
        onClick={() => setShowDetail(true)}
        style={{
          background: 'white', borderRadius: '16px',
          overflow: 'hidden', cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        }}
      >
        {/* Photo */}
        <div style={{ position: 'relative', paddingTop: '80%', background: '#F3F4F6' }}>
          {inf.photo_url && !imgError ? (
            <img
              src={inf.photo_url} alt={inf.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: avatarBg(inf.name),
              fontSize: '48px', color: 'white', fontWeight: 900, letterSpacing: '-1px',
            }}>
              {avatarInitial(inf.name)}
            </div>
          )}
          {/* Status badge */}
          <span style={{ position: 'absolute', top: 10, right: 10, background: ss.bg, color: ss.color, fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px' }}>
            {inf.status || '洽談中'}
          </span>
          {/* Score badge */}
          <span style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '12px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
            ★ {score}
          </span>
          {/* Platform badges */}
          {platforms.length > 0 && (
            <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: '4px' }}>
              {platforms.map(p => (
                <span key={p} style={{ background: PLATFORM_COLOR[p] || '#6B7280', color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>{p}</span>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
              {inf.name}
            </h3>
          </div>

          {/* IG 跳轉連結 */}
          {igLink && (
            <a
              href={igLink}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', color: '#E1306C', fontWeight: 600,
                textDecoration: 'none', marginBottom: '10px',
                background: '#FFF0F5', padding: '3px 9px', borderRadius: '20px',
                border: '1px solid #FECDD3',
              }}
            >
              📸 @{igDisplay} ↗
            </a>
          )}

          {/* Per-platform follower bars */}
          <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {inf.followers_ig > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span style={{ color: '#E1306C', fontWeight: 700, width: '22px', fontSize: '10px' }}>IG</span>
                <div style={{ flex: 1, height: '4px', background: '#F3F4F6', borderRadius: '2px' }}>
                  <div style={{ height: '100%', background: '#E1306C', borderRadius: '2px', width: `${Math.min((inf.followers_ig / Math.max(total, 1)) * 100, 100)}%` }} />
                </div>
                <span style={{ color: '#4B5563', minWidth: '36px', textAlign: 'right' }}>{fmtNum(inf.followers_ig)}</span>
              </div>
            )}
            {inf.followers_yt > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span style={{ color: '#FF0000', fontWeight: 700, width: '22px', fontSize: '10px' }}>YT</span>
                <div style={{ flex: 1, height: '4px', background: '#F3F4F6', borderRadius: '2px' }}>
                  <div style={{ height: '100%', background: '#FF0000', borderRadius: '2px', width: `${Math.min((inf.followers_yt / Math.max(total, 1)) * 100, 100)}%` }} />
                </div>
                <span style={{ color: '#4B5563', minWidth: '36px', textAlign: 'right' }}>{fmtNum(inf.followers_yt)}</span>
              </div>
            )}
            {inf.followers_tiktok > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span style={{ color: '#333', fontWeight: 700, width: '22px', fontSize: '10px' }}>TT</span>
                <div style={{ flex: 1, height: '4px', background: '#F3F4F6', borderRadius: '2px' }}>
                  <div style={{ height: '100%', background: '#333', borderRadius: '2px', width: `${Math.min((inf.followers_tiktok / Math.max(total, 1)) * 100, 100)}%` }} />
                </div>
                <span style={{ color: '#4B5563', minWidth: '36px', textAlign: 'right' }}>{fmtNum(inf.followers_tiktok)}</span>
              </div>
            )}
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '8px 0', margin: '10px 0', borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>互動率</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#E8523A' }}>{inf.engagement_rate ? `${inf.engagement_rate}%` : '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>總粉絲</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1A1A1A' }}>{fmtNum(total)}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>推薦分</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: scoreColor(score) }}>{score}</div>
            </div>
          </div>

          {/* Style tags */}
          {styles.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {styles.slice(0, 3).map(s => (
                <span key={s} style={{ background: '#FFF0EE', color: '#E8523A', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', border: '1px solid #FDDDD9' }}>{s}</span>
              ))}
              {styles.length > 3 && (
                <span style={{ background: '#F3F4F6', color: '#9CA3AF', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>+{styles.length - 3}</span>
              )}
            </div>
          )}

          {/* ── 核准 / 取消 快速操作 ── */}
          {(inf.status === '洽談中' || inf.status === '已核准') && (
            <div
              onClick={e => e.stopPropagation()}
              style={{ display: 'flex', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F3F4F6' }}
            >
              {inf.status !== '已核准' && (
                <button
                  onClick={e => handleStatusUpdate(e, '已核准')}
                  disabled={statusUpdating}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: '8px',
                    background: '#D1FAE5', color: '#065F46',
                    border: '1.5px solid #6EE7B7',
                    fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    opacity: statusUpdating ? 0.6 : 1,
                  }}
                >✅ 核准</button>
              )}
              {inf.status === '已核准' && (
                <div style={{ flex: 1, padding: '7px 0', borderRadius: '8px', background: '#D1FAE5', color: '#065F46', fontSize: '12px', fontWeight: 700, textAlign: 'center', border: '1.5px solid #6EE7B7' }}>
                  ✅ 已核准
                </div>
              )}
              <button
                onClick={e => handleStatusUpdate(e, '已取消')}
                disabled={statusUpdating}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: '8px',
                  background: '#FEE2E2', color: '#991B1B',
                  border: '1.5px solid #FECACA',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  opacity: statusUpdating ? 0.6 : 1,
                }}
              >❌ 取消</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {showDetail && (
        <div
          onClick={() => setShowDetail(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto' }}
          >
            {/* Photo header */}
            <div style={{ position: 'relative', paddingTop: '45%', background: '#F3F4F6' }}>
              {inf.photo_url && !detailImgError ? (
                <img src={inf.photo_url} alt={inf.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setDetailImgError(true)} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: avatarBg(inf.name), fontSize: '72px', color: 'white', fontWeight: 900 }}>
                  {avatarInitial(inf.name)}
                </div>
              )}
              <button onClick={() => setShowDetail(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Detail content */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>{inf.name}</h2>
                  <span style={{ background: ss.bg, color: ss.color, fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
                    {inf.status || '洽談中'}
                  </span>
                </div>
                <div style={{ textAlign: 'center', background: '#FFF0EE', borderRadius: '12px', padding: '10px 16px' }}>
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>推薦指數</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: scoreColor(score) }}>{score}</div>
                </div>
              </div>

              {/* IG 直跳連結 */}
              {igLink && (
                <a
                  href={igLink}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg, #E1306C, #F77737)',
                    color: 'white', fontSize: '13px', fontWeight: 700,
                    padding: '8px 18px', borderRadius: '10px',
                    textDecoration: 'none', marginBottom: '16px',
                  }}
                >
                  📸 @{igDisplay} — 開啟 Instagram ↗
                </a>
              )}

              {/* Platforms */}
              {platforms.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                  {platforms.map(p => (
                    <span key={p} style={{ background: PLATFORM_COLOR[p] || '#6B7280', color: 'white', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px' }}>{p}</span>
                  ))}
                </div>
              )}

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'IG 粉絲',  val: fmtNum(inf.followers_ig),  color: '#E1306C' },
                  { label: 'YouTube',  val: fmtNum(inf.followers_yt),  color: '#FF0000' },
                  { label: 'TikTok',   val: fmtNum(inf.followers_tiktok), color: '#333' },
                  { label: '互動率',   val: inf.engagement_rate ? `${inf.engagement_rate}%` : '-', color: '#E8523A' },
                  { label: '總粉絲',   val: fmtNum(total),              color: '#1A1A1A' },
                  { label: '報價/篇',  val: inf.fee_ntd ? `NT$${Number(inf.fee_ntd).toLocaleString()}` : '-', color: '#065F46' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: '#FFF8F6', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '3px' }}>{label}</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Styles */}
              {styles.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '6px' }}>風格</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {styles.map(s => (
                      <span key={s} style={{ background: '#FFF0EE', color: '#E8523A', fontSize: '12px', padding: '3px 10px', borderRadius: '20px', border: '1px solid #FDDDD9' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {inf.contact && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px' }}>聯絡方式</div>
                  <div style={{ fontSize: '13px', color: '#374151' }}>{inf.contact}</div>
                </div>
              )}

              {inf.brand_value && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px' }}>品牌幫助說明</div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{inf.brand_value}</div>
                </div>
              )}

              {inf.note && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px' }}>備註</div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, background: '#F9FAFB', padding: '10px', borderRadius: '8px' }}>{inf.note}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
