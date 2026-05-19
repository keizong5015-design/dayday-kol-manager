import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmtNum, calcScore } from './KolCard'

const PLATFORMS = ['IG', 'TikTok', 'YouTube']
const ALL_STYLES = ['穿搭', '美妝', '生活', '美食', '旅遊', '健身', '寵物', '3C', '親子', '藝術', '時尚']
const STATUSES = ['洽談中', '已核准', '已寄信', '已確認', '合作完成', '暫緩', '已取消']
const STATUS_COLOR = {
  '洽談中':   { bg: '#FEF3C7', color: '#92400E' },
  '已核准':   { bg: '#D1FAE5', color: '#065F46' },
  '已寄信':   { bg: '#EDE9FE', color: '#6D28D9' },
  '已確認':   { bg: '#DBEAFE', color: '#1E40AF' },
  '合作完成': { bg: '#BBF7D0', color: '#14532D' },
  '暫緩':     { bg: '#F3F4F6', color: '#6B7280' },
  '已取消':   { bg: '#FEE2E2', color: '#991B1B' },
}

const EMPTY = {
  name: '', ig_handle: '', photo_url: '', platforms: [], styles: [],
  followers_ig: '', followers_yt: '', followers_tiktok: '',
  engagement_rate: '', status: '洽談中',
  contact: '', fee_ntd: '', brand_value: '', note: '',
}

const igToPhotoUrl = (handle) => {
  const clean = handle.replace(/^@/, '').trim()
  if (!clean) return ''
  return `https://unavatar.io/instagram/${clean}`
}

// ── DAYDAY 試配度 ─────────────────────────────────────────
// 根據風格標籤、平台、IG 粉絲數、互動率 自動計算與品牌契合程度（0–100）
const calcFit = (form) => {
  let score = 0

  // 風格契合度（最多 45 分）— 美妝/穿搭/生活/時尚 最符合護膚品牌
  const STYLE_W = {
    '美妝': 15, '穿搭': 12, '生活': 10, '時尚': 10,
    '健身': 8,  '親子': 7,  '旅遊': 6,  '美食': 5,
    '寵物': 5,  '藝術': 5,  '3C': 3,
  }
  score += Math.min((form.styles || []).reduce((s, st) => s + (STYLE_W[st] || 0), 0), 45)

  // 平台（IG 視覺屬性最適合護膚品）+15
  if ((form.platforms || []).includes('IG')) score += 15

  // IG 粉絲甜蜜點（最多 25 分）— 奈米/微型網紅互動率高
  const ig = Number(form.followers_ig) || 0
  if      (ig >= 10000  && ig < 50000)  score += 25   // 奈米網紅
  else if (ig >= 50000  && ig < 200000) score += 20   // 微型網紅
  else if (ig >= 200000 && ig < 500000) score += 15   // 中型網紅
  else if (ig >= 500000)                score += 10   // 大型網紅
  else if (ig > 0)                      score += 5

  // 互動率（最多 15 分）
  const er = parseFloat(form.engagement_rate) || 0
  if      (er >= 5) score += 15
  else if (er >= 3) score += 12
  else if (er >= 1) score += 8
  else if (er > 0)  score += 4

  return Math.min(Math.round(score), 100)
}

const fitInfo = (fit) => {
  if (fit >= 85) return { label: '超級契合 🔥', color: '#22C55E', bg: '#F0FDF4' }
  if (fit >= 70) return { label: '非常契合 ✨', color: '#16A34A', bg: '#DCFCE7' }
  if (fit >= 55) return { label: '契合 👌',     color: '#F59E0B', bg: '#FFFBEB' }
  if (fit >= 40) return { label: '尚可 🤔',     color: '#3B82F6', bg: '#EFF6FF' }
  return              { label: '待評估',        color: '#9CA3AF', bg: '#F9FAFB' }
}

const generateAnalysis = (form) => {
  const fit     = calcFit(form)
  const ig      = Number(form.followers_ig) || 0
  const er      = parseFloat(form.engagement_rate) || 0
  const styles  = form.styles || []
  const platforms = form.platforms || []
  const lines   = []

  // 規模評估
  if (ig >= 10000 && ig < 50000)
    lines.push('📊 規模：奈米網紅（1萬-5萬），互動率高、受眾黏著度強，最適合 DAYDAY 真實口碑推廣。')
  else if (ig >= 50000 && ig < 200000)
    lines.push('📊 規模：微型網紅（5萬-20萬），精準受眾，品牌契合度高，CP值佳。')
  else if (ig >= 200000 && ig < 500000)
    lines.push('📊 規模：中型網紅（20萬-50萬），曝光量大，需確認受眾是否與 DAYDAY 25-38歲都市女性重疊。')
  else if (ig >= 500000)
    lines.push('📊 規模：大型網紅（50萬+），曝光強但互動率可能偏低，需仔細評估 ROI。')
  else
    lines.push('📊 規模：粉絲數未填或偏少，建議先確認帳號是否在成長期。')

  // 互動率
  if (er >= 5)
    lines.push(`💬 互動率 ${er}%：非常優異（業界平均約 1-3%），受眾高度活躍，推文轉換力強。`)
  else if (er >= 3)
    lines.push(`💬 互動率 ${er}%：良好，符合品牌推廣需求，受眾真實度高。`)
  else if (er >= 1)
    lines.push(`💬 互動率 ${er}%：中等，建議多觀察留言互動質量，確認是否為真實粉絲。`)
  else if (er > 0)
    lines.push(`💬 互動率 ${er}%：偏低，需了解粉絲組成，避免花費預算在無效曝光。`)

  // 風格契合
  const goodStyles = styles.filter(s => ['美妝','穿搭','生活','時尚'].includes(s))
  const otherStyles = styles.filter(s => !['美妝','穿搭','生活','時尚'].includes(s))
  if (goodStyles.length > 0)
    lines.push(`✅ 風格契合：${goodStyles.join('、')} 高度符合 DAYDAY「純淨×有感×生活感」DNA。`)
  if (otherStyles.length > 0)
    lines.push(`🔍 其他風格：${otherStyles.join('、')} 與護膚品牌的關聯度較低，合作時需設計適合的腳本。`)
  if (styles.length === 0)
    lines.push('⚠️ 風格標籤未填，請補充以提升分析準確度。')

  // 平台
  if (platforms.includes('IG'))
    lines.push('📸 IG 視覺屬性最適合護膚品牌，適合開箱、GRWM、成分教育等內容形式。')
  if (platforms.includes('TikTok'))
    lines.push('🎵 TikTok 適合短影音病毒式傳播，可主打「快速見效」或「成分揭密」角度。')

  // ROI 估算
  if (ig > 0) {
    const roi = Math.round(ig * 0.3 * 0.1 * 1919)
    lines.push(`💰 預估 ROI：NT$${roi.toLocaleString()}（粉絲 × 30%觸及 × 10%轉換 × AOV NT$1,919）`)
  }

  // 總結建議
  if (fit >= 85)
    lines.push('👉 建議：強力推薦優先接洽，具備長期合作潛力，可考慮獨家或首波合作。')
  else if (fit >= 70)
    lines.push('👉 建議：優先接洽，適合作為核心 KOL 合作夥伴，建議從 1-2 篇試合作開始。')
  else if (fit >= 55)
    lines.push('👉 建議：可試合作，先以 1 篇測試受眾反應，再評估後續投入。')
  else if (fit >= 40)
    lines.push('👉 建議：謹慎評估，受眾重疊度有限，合作前需確認腳本方向。')
  else
    lines.push('👉 建議：目前資料不足或契合度偏低，建議補充更多資訊後再評估。')

  return lines.join('\n')
}

// ── 開發信產生器 ──────────────────────────────────────────
const generateEmail = (inf) => `Hi ${inf.name}

我們是台灣的保養品牌 dayday skincare團隊

這個品牌由創辦人醫美醫師 Tina 一手打造，從「日常保養應該溫柔、簡潔且可信賴」的理念出發，專注開發低刺激、高效保濕的護膚產品。

我們長期關注您在網路上分享的內容，非常欣賞也慕名已久。

想與您分享我們的產品「保濕修護面膜」以及「煥白透亮面膜」兩款都是無酒精、不含防腐劑及香精，成分跟配方都是敏感肌、醫美術後、孕婦可以放心使用的。

【品牌簡介】
dayday 專注於日常保養體驗的提升，產品設計強調：
• 保濕成分
• 低刺激配方
• 極簡設計
• 穩定有效的肌膚修護感受
www.daydayskincare.com

目前主力產品包含保濕修護與透亮系列面膜，主打穩定膚況、提升肌膚舒適度與光澤感。
若是用了後喜歡也希望有機會再討論後續更進一步的合作！

【合作模式】
形式可彈性調整，例如：
✓ IG / Reels / 限動分享
✓ 使用體驗開箱
✓ 團購專屬優惠連結
✓ 專屬折扣碼
✓ 粉絲福利活動

【合作資源】
我們可提供：
✓ 全品項正貨試用
✓ 專屬團購優惠機制
✓ 分潤合作方案
✓ 團購素材支援（圖片 / 文案 / 教學）
✓ 專人客服與出貨支援

若您有興趣體驗看看我們的產品，歡迎直接回覆此信，提供收件的資料，我們將立即安排寄出。

祝一切順心
dayday skincare
品牌合作窗口
instagram: @dayday.skincare`

// ─────────────────────────────────────────────────────────
export default function AdminPanel({ influencers, onRefresh, onBack, showToast }) {
  const [modal, setModal]               = useState(false)
  const [form, setForm]                 = useState(EMPTY)
  const [editId, setEditId]             = useState(null)
  const [saving, setSaving]             = useState(false)
  const [err, setErr]                   = useState('')
  const [search, setSearch]             = useState('')
  const [pasteUploading, setPasteUploading] = useState(false)
  const [emailModal, setEmailModal]     = useState(false)
  const [emailInf, setEmailInf]         = useState(null)
  const [copiedEmail, setCopiedEmail]   = useState(false)
  const [markingSent, setMarkingSent]   = useState(false)
  const [emailSentDone, setEmailSentDone] = useState(false)

  const openEmail = (inf) => { setEmailInf(inf); setCopiedEmail(false); setEmailSentDone(false); setEmailModal(true) }
  const copyEmail = () => {
    if (!emailInf) return
    navigator.clipboard.writeText(generateEmail(emailInf)).then(() => {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2500)
    })
  }

  const filtered = influencers.filter(inf =>
    inf.name.toLowerCase().includes(search.toLowerCase())
  )

  const set       = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const toggleArr = (key, val) => setForm(p => ({
    ...p,
    [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val]
  }))

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setErr(''); setModal(true) }
  const openEdit = (inf) => {
    setForm({
      name: inf.name || '', ig_handle: inf.ig_handle || '', photo_url: inf.photo_url || '',
      platforms: inf.platforms || [], styles: inf.styles || [],
      followers_ig: inf.followers_ig || '', followers_yt: inf.followers_yt || '',
      followers_tiktok: inf.followers_tiktok || '', engagement_rate: inf.engagement_rate || '',
      status: inf.status || '洽談中', contact: inf.contact || '',
      fee_ntd: inf.fee_ntd || '', brand_value: inf.brand_value || '', note: inf.note || '',
    })
    setEditId(inf.id); setErr(''); setModal(true)
  }

  // ── 貼上圖片 → 直接轉 base64 存入資料庫（不需要 Storage）─
  useEffect(() => {
    if (!modal) return
    const onPaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (!item.type.startsWith('image/')) continue
        const file = item.getAsFile()
        if (!file) continue

        setPasteUploading(true)
        const reader = new FileReader()
        reader.onload = (ev) => {
          setForm(p => ({ ...p, photo_url: ev.target.result }))
          setPasteUploading(false)
          showToast('圖片貼上成功！')
        }
        reader.onerror = () => {
          setErr('圖片讀取失敗，請再試一次')
          setPasteUploading(false)
        }
        reader.readAsDataURL(file)
        break
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [modal, showToast])

  // ── Delete / Save ────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`確定刪除「${name}」？此操作無法復原。`)) return
    const { error } = await supabase.from('influencers').delete().eq('id', id)
    if (error) { showToast('刪除失敗：' + error.message, 'error'); return }
    showToast(`已刪除「${name}」`); onRefresh()
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setErr('請填寫網紅名稱'); return }
    setSaving(true); setErr('')
    // 正規化 ig_handle：若貼入完整 URL 自動萃取帳號名
    const rawHandle = form.ig_handle || ''
    const urlMatch  = rawHandle.match(/instagram\.com\/([^/?#\s]+)/)
    const cleanHandle = urlMatch
      ? '@' + urlMatch[1]
      : rawHandle.replace(/^@/, '').trim() ? '@' + rawHandle.replace(/^@/, '').trim() : ''

    const payload = {
      ...form,
      ig_handle:       cleanHandle,
      followers_ig:    Number(form.followers_ig)          || 0,
      followers_yt:    Number(form.followers_yt)          || 0,
      followers_tiktok:Number(form.followers_tiktok)      || 0,
      engagement_rate: parseFloat(form.engagement_rate)   || 0,
      fee_ntd:         Number(form.fee_ntd)               || 0,
    }
    const { error } = editId
      ? await supabase.from('influencers').update(payload).eq('id', editId)
      : await supabase.from('influencers').insert([payload])
    if (error) { setErr('儲存失敗：' + error.message); setSaving(false); return }
    showToast(editId ? `已更新「${form.name}」` : `已新增「${form.name}」`)
    setSaving(false); setModal(false); onRefresh()
  }

  // Styles
  const inputS = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '13px' }
  const labelS = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }

  // 試配度（即時計算）
  const fit  = calcFit(form)
  const fi   = fitInfo(fit)
  const markAsSent = async () => {
    if (!emailInf || markingSent) return
    setMarkingSent(true)
    const { error } = await supabase.from('influencers').update({ status: '已寄信' }).eq('id', emailInf.id)
    setMarkingSent(false)
    if (error) { showToast('更新失敗：' + error.message, 'error'); return }
    setEmailSentDone(true)
    showToast('✅ ' + emailInf.name + ' 已標記為「已寄信」')
    onRefresh()
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>⚙️ 管理後台</h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '3px' }}>新增、編輯、刪除網紅資料</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 快速搜尋..."
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '13px', width: '200px' }}
          />
          <button className="btn-secondary" onClick={onBack}>← 返回名單</button>
          <button className="btn-primary"   onClick={openAdd}>＋ 新增網紅</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FFF8F6', borderBottom: '2px solid #F0E8E6' }}>
              {['網紅', '平台', '粉絲 / 互動率', '推薦分', '試配度', '狀態', '報價', '操作'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                  {influencers.length === 0 ? '還沒有任何資料，點右上角「新增網紅」開始！' : '找不到符合的網紅'}
                </td>
              </tr>
            ) : filtered.map((inf, i) => {
              const total = (inf.followers_ig||0)+(inf.followers_yt||0)+(inf.followers_tiktok||0)
              const score = calcScore(inf)
              const rowFit = calcFit(inf)
              const rowFi  = fitInfo(rowFit)
              const sc     = STATUS_COLOR[inf.status] || STATUS_COLOR['洽談中']
              return (
                <tr key={inf.id} style={{ borderBottom: '1px solid #F9FAFB', background: i % 2 === 0 ? 'white' : '#FEFEFE' }}>
                  {/* Name + Photo */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', background: '#F3F4F6', flexShrink: 0 }}>
                        {inf.photo_url
                          ? <img src={inf.photo_url} alt={inf.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{inf.name}</div>
                        {inf.ig_handle && (
                          <a
                            href={`https://www.instagram.com/${inf.ig_handle.replace(/^@/, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '11px', color: '#E1306C', textDecoration: 'none', fontWeight: 600 }}
                          >
                            ↗ {inf.ig_handle.startsWith('@') ? inf.ig_handle : '@' + inf.ig_handle}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Platforms */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(inf.platforms||[]).map(p => (
                        <span key={p} style={{ background: p==='IG'?'#FEE2E2':p==='YouTube'?'#FEE2E2':'#F3F4F6', color: p==='IG'?'#BE185D':p==='YouTube'?'#DC2626':'#374151', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>{p}</span>
                      ))}
                    </div>
                  </td>
                  {/* Followers */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>{fmtNum(total)}</div>
                    <div style={{ fontSize: '11px', color: '#E8523A', fontWeight: 600 }}>{inf.engagement_rate ? `互動率 ${inf.engagement_rate}%` : '-'}</div>
                  </td>
                  {/* Score */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 800, fontSize: '16px', color: score>=80?'#22C55E':score>=60?'#F59E0B':score>=40?'#3B82F6':'#9CA3AF' }}>{score}</span>
                  </td>
                  {/* 試配度 */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '48px', height: '6px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${rowFit}%`, background: rowFi.color, borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: rowFi.color }}>{rowFit}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: rowFi.color, marginTop: '2px' }}>{rowFi.label}</div>
                  </td>
                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px' }}>{inf.status || '洽談中'}</span>
                  </td>
                  {/* Fee */}
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: inf.fee_ntd ? '#065F46' : '#9CA3AF', fontWeight: inf.fee_ntd ? 600 : 400 }}>
                    {inf.fee_ntd ? `NT$${Number(inf.fee_ntd).toLocaleString()}` : '-'}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {inf.status === '已核准' && (
                        <button
                          onClick={() => openEmail(inf)}
                          style={{ padding: '5px 12px', borderRadius: '6px', border: '1.5px solid #BBF7D0', background: '#F0FDF4', fontSize: '12px', color: '#15803D', cursor: 'pointer', fontWeight: 700 }}
                        >✉️ 開發信</button>
                      )}
                      <button onClick={() => openEdit(inf)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1.5px solid #E5E7EB', background: 'white', fontSize: '12px', color: '#374151', cursor: 'pointer' }}>✏️ 編輯</button>
                      <button onClick={() => handleDelete(inf.id, inf.name)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1.5px solid #FEE2E2', background: '#FFF5F5', fontSize: '12px', color: '#E8523A', cursor: 'pointer' }}>🗑️ 刪除</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Email Modal ── */}
      {emailModal && emailInf && (
        <div
          onClick={e => e.target === e.currentTarget && setEmailModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '620px', maxHeight: '88vh', overflow: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>✉️ 開發信</h2>
                <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>收件人：{emailInf.name}{emailInf.ig_handle ? ` (${emailInf.ig_handle})` : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={copyEmail}
                  style={{
                    padding: '8px 18px', borderRadius: '10px',
                    background: copiedEmail ? '#D1FAE5' : '#E8523A',
                    color: copiedEmail ? '#065F46' : 'white',
                    border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {copiedEmail ? '✅ 已複製！' : '📋 複製全文'}
                </button>
                <div style={{ background: '#EDE9FE', border: '1px solid #DDD6FE', borderRadius: '8px', padding: '12px 16px', marginTop: '8px' }}>
                  <p style={{ margin: '0 0 8px 0', color: '#6D28D9', fontWeight: 600, fontSize: '14px' }}>📮 寄信追蹤</p>
                  {emailSentDone
                    ? <p style={{ margin: 0, color: '#6D28D9', fontSize: '14px' }}>✅ 已標記為「已寄信」</p>
                    : <button onClick={markAsSent} disabled={markingSent}
                        style={{ background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: markingSent ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: markingSent ? 0.7 : 1 }}>
                        {markingSent ? '更新中...' : '📮 確認已寄出'}
                      </button>
                  }
                </div>
                <button
                  onClick={() => setEmailModal(false)}
                  style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', color: '#6B7280', cursor: 'pointer' }}
                >✕</button>
              </div>
            </div>
            <pre style={{
              background: '#F9FAFB', borderRadius: '12px', padding: '20px',
              fontSize: '13px', lineHeight: '1.7', color: '#374151',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              border: '1.5px solid #E5E7EB', fontFamily: 'inherit',
              maxHeight: '60vh', overflow: 'auto',
            }}>
              {generateEmail(emailInf)}
            </pre>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '12px', textAlign: 'center' }}>
              點「複製全文」後，貼入 Gmail / LINE 傳給網紅
            </p>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div
          onClick={e => e.target === e.currentTarget && setModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '92vh', overflow: 'auto', padding: '28px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>{editId ? '✏️ 編輯網紅資料' : '➕ 新增網紅'}</h2>
              <button onClick={() => setModal(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', color: '#6B7280', cursor: 'pointer' }}>✕</button>
            </div>

            {err && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>⚠️ {err}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* 名稱 */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>網紅名稱 *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="例如：王大明" style={inputS} />
              </div>

              {/* IG Handle */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>📸 IG 帳號</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: '13px' }}>@</span>
                    <input
                      value={form.ig_handle}
                      onChange={e => {
                        const val = e.target.value.replace(/^@/, '')
                        set('ig_handle', val)
                        if (val && !form.photo_url) set('photo_url', igToPhotoUrl(val))
                      }}
                      placeholder="輸入帳號，例如：9.amez"
                      style={{ ...inputS, paddingLeft: '28px' }}
                    />
                  </div>
                  {form.ig_handle && (
                    <a
                      href={`https://www.instagram.com/${form.ig_handle.replace(/^@/, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ padding: '8px 14px', borderRadius: '8px', background: '#FFF0EE', color: '#E1306C', fontSize: '12px', fontWeight: 700, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                      ↗ 開啟 IG
                    </a>
                  )}
                </div>
              </div>

              {/* ── 貼上圖片區 ── */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>🖼️ 大頭照（貼上圖片 Ctrl+V）</label>
                <div style={{
                  border: `2px dashed ${pasteUploading ? '#E8523A' : form.photo_url ? '#22C55E' : '#D1D5DB'}`,
                  borderRadius: '12px', padding: '18px', textAlign: 'center',
                  background: pasteUploading ? '#FFF8F6' : form.photo_url ? '#F0FDF4' : '#FAFAFA',
                  transition: 'all 0.2s',
                }}>
                  {pasteUploading ? (
                    <div style={{ color: '#E8523A', fontWeight: 700, fontSize: '14px' }}>⏳ 上傳中...</div>
                  ) : form.photo_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center' }}>
                      <img
                        src={form.photo_url} alt="preview"
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #22C55E' }}
                        onError={e => e.target.style.display='none'}
                      />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#065F46' }}>✅ 已設定大頭照</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px' }}>再按 Ctrl+V 可更換 · 或在下方修改網址</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '28px', marginBottom: '6px' }}>📋</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>複製圖片後按 Ctrl+V</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>支援從 IG、LINE、截圖、瀏覽器直接貼上</div>
                    </>
                  )}
                </div>
              </div>

              {/* 圖片網址（手動備用） */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>圖片網址（手動輸入或覆蓋）</label>
                <input
                  value={form.photo_url}
                  onChange={e => set('photo_url', e.target.value)}
                  placeholder="貼上後自動填入，或手動輸入 https://..."
                  style={{ ...inputS, color: '#6B7280' }}
                />
              </div>

              {/* 平台 */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>平台（可多選）</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {PLATFORMS.map(p => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                      <input type="checkbox" checked={form.platforms.includes(p)} onChange={() => toggleArr('platforms', p)} style={{ accentColor: '#E8523A', width: '15px', height: '15px' }} />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              {/* 粉絲數 */}
              <div>
                <label style={labelS}>📸 IG 粉絲數</label>
                <input type="number" value={form.followers_ig} onChange={e => set('followers_ig', e.target.value)} placeholder="例：150000" style={inputS} />
              </div>
              <div>
                <label style={labelS}>▶️ YouTube 訂閱數</label>
                <input type="number" value={form.followers_yt} onChange={e => set('followers_yt', e.target.value)} placeholder="例：80000" style={inputS} />
              </div>
              <div>
                <label style={labelS}>🎵 TikTok 粉絲數</label>
                <input type="number" value={form.followers_tiktok} onChange={e => set('followers_tiktok', e.target.value)} placeholder="例：200000" style={inputS} />
              </div>
              <div>
                <label style={labelS}>互動率 (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={form.engagement_rate} onChange={e => set('engagement_rate', e.target.value)} placeholder="例：4.5" style={inputS} />
              </div>

              {/* 風格標籤 */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>風格標籤（可多選）</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ALL_STYLES.map(s => {
                    const active = form.styles.includes(s)
                    return (
                      <label key={s} style={{ cursor: 'pointer', background: active ? '#FFF0EE' : '#F9FAFB', border: active ? '1.5px solid #FDDDD9' : '1.5px solid #E5E7EB', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: active ? '#E8523A' : '#6B7280', fontWeight: active ? 700 : 400, transition: 'all 0.15s' }}>
                        <input type="checkbox" checked={active} onChange={() => toggleArr('styles', s)} style={{ display: 'none' }} />
                        {s}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* ── 試配度即時預覽 ── */}
              <div style={{ gridColumn: '1 / -1', background: fi.bg, borderRadius: '14px', padding: '18px', border: `1.5px solid ${fi.color}22` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.8px' }}>🎯 DAYDAY 試配度</span>
                  <div>
                    <span style={{ fontWeight: 900, fontSize: '26px', color: fi.color }}>{fit}</span>
                    <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}> / 100</span>
                  </div>
                </div>
                {/* 進度條 */}
                <div style={{ height: '10px', background: '#E5E7EB', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${fit}%`, background: fi.color, borderRadius: '5px', transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: fi.color }}>{fi.label}</span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>依 風格・平台・粉絲數・互動率 計算</span>
                </div>
                {/* 分數明細提示 */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { k: '風格', v: Math.min((form.styles||[]).reduce((s,st)=>s+({美妝:15,穿搭:12,生活:10,時尚:10,健身:8,親子:7,旅遊:6,美食:5,寵物:5,藝術:5,'3C':3}[st]||0),0), 45), max: 45 },
                    { k: 'IG', v: (form.platforms||[]).includes('IG') ? 15 : 0, max: 15 },
                    { k: '粉絲', v: (() => { const ig=Number(form.followers_ig)||0; return ig>=10000&&ig<50000?25:ig>=50000&&ig<200000?20:ig>=200000&&ig<500000?15:ig>=500000?10:ig>0?5:0 })(), max: 25 },
                    { k: '互動', v: (() => { const er=parseFloat(form.engagement_rate)||0; return er>=5?15:er>=3?12:er>=1?8:er>0?4:0 })(), max: 15 },
                  ].map(({ k, v, max }) => (
                    <div key={k} style={{ background: 'white', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', color: '#374151', border: '1px solid #E5E7EB' }}>
                      {k} <strong style={{ color: v > 0 ? fi.color : '#9CA3AF' }}>{v}</strong><span style={{ color: '#D1D5DB' }}>/{max}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 狀態 & 報價 */}
              <div>
                <label style={labelS}>合作狀態</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inputS, background: 'white', cursor: 'pointer' }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>報價 / 篇 (NTD)</label>
                <input type="number" value={form.fee_ntd} onChange={e => set('fee_ntd', e.target.value)} placeholder="例：15000" style={inputS} />
              </div>

              {/* 聯絡方式 */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>聯絡方式</label>
                <input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Email 或 IG 帳號 @xxx" style={inputS} />
              </div>

              {/* 品牌說明 */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ ...labelS, marginBottom: 0 }}>品牌幫助說明</label>
                  <button
                    type="button"
                    onClick={() => set('brand_value', generateAnalysis(form))}
                    style={{
                      background: 'linear-gradient(135deg, #E8523A, #F59E0B)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      padding: '4px 12px', fontSize: '12px', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    🎯 自動分析
                  </button>
                </div>
                <textarea value={form.brand_value} onChange={e => set('brand_value', e.target.value)} placeholder="點「🎯 自動分析」自動生成，或手動描述與 DAYDAY 品牌的契合點..." rows={5} style={{ ...inputS, resize: 'vertical' }} />
              </div>

              {/* 備註 */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>備註</label>
                <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="合作腳本方向、過往成效、注意事項..." rows={2} style={{ ...inputS, resize: 'vertical' }} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>取消</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ 儲存中...' : '💾 儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
