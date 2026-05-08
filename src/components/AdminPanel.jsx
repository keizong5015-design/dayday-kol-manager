import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmtNum, calcScore } from './KolCard'

const PLATFORMS = ['IG', 'TikTok', 'YouTube']
const ALL_STYLES = ['穿搭', '美妝', '生活', '美食', '旅遊', '健身', '寵物', '3C', '親子', '藝術', '時尚']
const STATUSES = ['洽談中', '已確認', '合作完成', '暫緩']
const STATUS_COLOR = {
  '洽談中':   { bg: '#FEF3C7', color: '#92400E' },
  '已確認':   { bg: '#DBEAFE', color: '#1E40AF' },
  '合作完成': { bg: '#D1FAE5', color: '#065F46' },
  '暫緩':     { bg: '#F3F4F6', color: '#6B7280' },
}

const EMPTY = {
  name: '', photo_url: '', platforms: [], styles: [],
  followers_ig: '', followers_yt: '', followers_tiktok: '',
  engagement_rate: '', status: '洽談中',
  contact: '', fee_ntd: '', brand_value: '', note: '',
}

export default function AdminPanel({ influencers, onRefresh, onBack, showToast }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [search, setSearch] = useState('')

  const filtered = influencers.filter(inf =>
    inf.name.toLowerCase().includes(search.toLowerCase())
  )

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const toggleArr = (key, val) => setForm(p => ({
    ...p,
    [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val]
  }))

  const openAdd = () => { setForm(EMPTY); setEditId(null); setErr(''); setModal(true) }
  const openEdit = (inf) => {
    setForm({
      name: inf.name || '',
      photo_url: inf.photo_url || '',
      platforms: inf.platforms || [],
      styles: inf.styles || [],
      followers_ig: inf.followers_ig || '',
      followers_yt: inf.followers_yt || '',
      followers_tiktok: inf.followers_tiktok || '',
      engagement_rate: inf.engagement_rate || '',
      status: inf.status || '洽談中',
      contact: inf.contact || '',
      fee_ntd: inf.fee_ntd || '',
      brand_value: inf.brand_value || '',
      note: inf.note || '',
    })
    setEditId(inf.id)
    setErr('')
    setModal(true)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`確定刪除「${name}」？此操作無法復原。`)) return
    const { error } = await supabase.from('influencers').delete().eq('id', id)
    if (error) { showToast('刪除失敗：' + error.message, 'error'); return }
    showToast(`已刪除「${name}」`)
    onRefresh()
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setErr('請填寫網紅名稱'); return }
    setSaving(true); setErr('')
    const payload = {
      ...form,
      followers_ig: Number(form.followers_ig) || 0,
      followers_yt: Number(form.followers_yt) || 0,
      followers_tiktok: Number(form.followers_tiktok) || 0,
      engagement_rate: parseFloat(form.engagement_rate) || 0,
      fee_ntd: Number(form.fee_ntd) || 0,
    }
    const { error } = editId
      ? await supabase.from('influencers').update(payload).eq('id', editId)
      : await supabase.from('influencers').insert([payload])
    if (error) { setErr('儲存失敗：' + error.message); setSaving(false); return }
    showToast(editId ? `已更新「${form.name}」` : `已新增「${form.name}」`)
    setSaving(false); setModal(false); onRefresh()
  }

  // Shared styles
  const inputS = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '13px' }
  const labelS = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }

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
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 快速搜尋..."
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '13px', width: '200px' }}
          />
          <button className="btn-secondary" onClick={onBack}>← 返回名單</button>
          <button className="btn-primary" onClick={openAdd}>＋ 新增網紅</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FFF8F6', borderBottom: '2px solid #F0E8E6' }}>
              {['網紅', '平台', '粉絲 / 互動率', '推薦分', '狀態', '報價', '操作'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                  {influencers.length === 0 ? '還沒有任何資料，點右上角「新增網紅」開始！' : '找不到符合的網紅'}
                </td>
              </tr>
            ) : filtered.map((inf, i) => {
              const total = (inf.followers_ig||0)+(inf.followers_yt||0)+(inf.followers_tiktok||0)
              const score = calcScore(inf)
              const sc = STATUS_COLOR[inf.status] || STATUS_COLOR['洽談中']
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
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{inf.name}</span>
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
                  {/* Followers / Engagement */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>{fmtNum(total)}</div>
                    <div style={{ fontSize: '11px', color: '#E8523A', fontWeight: 600 }}>
                      {inf.engagement_rate ? `互動率 ${inf.engagement_rate}%` : '-'}
                    </div>
                  </td>
                  {/* Score */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 800, fontSize: '16px', color: score>=80?'#22C55E':score>=60?'#F59E0B':score>=40?'#3B82F6':'#9CA3AF' }}>{score}</span>
                  </td>
                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px' }}>
                      {inf.status || '洽談中'}
                    </span>
                  </td>
                  {/* Fee */}
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: inf.fee_ntd ? '#065F46' : '#9CA3AF', fontWeight: inf.fee_ntd ? 600 : 400 }}>
                    {inf.fee_ntd ? `NT$${Number(inf.fee_ntd).toLocaleString()}` : '-'}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => openEdit(inf)}
                        style={{ padding: '5px 12px', borderRadius: '6px', border: '1.5px solid #E5E7EB', background: 'white', fontSize: '12px', color: '#374151', cursor: 'pointer' }}
                      >✏️ 編輯</button>
                      <button
                        onClick={() => handleDelete(inf.id, inf.name)}
                        style={{ padding: '5px 12px', borderRadius: '6px', border: '1.5px solid #FEE2E2', background: '#FFF5F5', fontSize: '12px', color: '#E8523A', cursor: 'pointer' }}
                      >🗑️ 刪除</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div
          onClick={e => e.target === e.currentTarget && setModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{
            background: 'white', borderRadius: '20px',
            width: '100%', maxWidth: '660px',
            maxHeight: '92vh', overflow: 'auto',
            padding: '28px',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
                {editId ? '✏️ 編輯網紅資料' : '➕ 新增網紅'}
              </h2>
              <button onClick={() => setModal(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', color: '#6B7280', cursor: 'pointer' }}>✕</button>
            </div>

            {err && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>
                ⚠️ {err}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Name */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>網紅名稱 *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="例如：王大明" style={inputS} />
              </div>

              {/* Photo */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>照片網址（貼入圖片連結）</label>
                <input value={form.photo_url} onChange={e => set('photo_url', e.target.value)} placeholder="https://i.imgur.com/xxx.jpg" style={inputS} />
                {form.photo_url && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={form.photo_url} alt="預覽" style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', border: '2px solid #F0E8E6' }} onError={e => e.target.style.opacity = '0.3'} />
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>圖片預覽</span>
                  </div>
                )}
              </div>

              {/* Platforms */}
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

              {/* Followers */}
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

              {/* Styles */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>風格標籤（可多選）</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ALL_STYLES.map(s => {
                    const active = form.styles.includes(s)
                    return (
                      <label key={s} style={{
                        cursor: 'pointer',
                        background: active ? '#FFF0EE' : '#F9FAFB',
                        border: active ? '1.5px solid #FDDDD9' : '1.5px solid #E5E7EB',
                        borderRadius: '20px', padding: '4px 12px',
                        fontSize: '12px', color: active ? '#E8523A' : '#6B7280',
                        fontWeight: active ? 700 : 400, transition: 'all 0.15s',
                      }}>
                        <input type="checkbox" checked={active} onChange={() => toggleArr('styles', s)} style={{ display: 'none' }} />
                        {s}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Status & Fee */}
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

              {/* Contact */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>聯絡方式</label>
                <input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Email 或 IG 帳號 @xxx" style={inputS} />
              </div>

              {/* Brand value */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>品牌幫助說明</label>
                <textarea value={form.brand_value} onChange={e => set('brand_value', e.target.value)} placeholder="描述與 DAYDAY 品牌的契合點，受眾重疊度等..." rows={2} style={{ ...inputS, resize: 'vertical' }} />
              </div>

              {/* Note */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>備註</label>
                <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="合作腳本方向、過往合作成效、注意事項..." rows={2} style={{ ...inputS, resize: 'vertical' }} />
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
