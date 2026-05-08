# 🚀 KOL Manager 部署完整教學

> 完成後你將擁有一個 **永久固定網址** 的內部系統，同仁隨時可以連上查閱、新增網紅資料。

---

## 架構總覽

```
瀏覽器 → Vercel（前端 React）→ Supabase（PostgreSQL 資料庫）
```

- **Vercel**：免費靜態托管，自動 HTTPS，永久固定網址（yourapp.vercel.app）
- **Supabase**：免費 PostgreSQL 資料庫 + REST API（500MB 儲存空間，足夠存幾千筆網紅資料）
- **GitHub**：程式碼倉庫（Vercel 從這裡自動部署）

---

## STEP 1：建立 Supabase 資料庫

### 1-1 建立帳號與專案

1. 前往 [https://supabase.com](https://supabase.com) → 點 **Start your project**
2. 用 GitHub 帳號登入（免費）
3. 點 **New project**
4. 填入：
   - Project name：`kol-manager`
   - Database Password：設一個強密碼（記住它）
   - Region：選 **Northeast Asia (Tokyo)**（台灣最快）
5. 點 **Create new project**，等待約 1-2 分鐘

### 1-2 建立資料表

1. 左側選單點 **SQL Editor**
2. 點 **+ New query**
3. 貼入以下 SQL 後點 **Run**（▶️）：

```sql
-- 建立網紅資料表
CREATE TABLE influencers (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT        NOT NULL,
  photo_url       TEXT,
  platforms       TEXT[]      DEFAULT '{}',
  styles          TEXT[]      DEFAULT '{}',
  followers_ig    BIGINT      DEFAULT 0,
  followers_yt    BIGINT      DEFAULT 0,
  followers_tiktok BIGINT     DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  status          TEXT        DEFAULT '洽談中',
  contact         TEXT,
  fee_ntd         INTEGER     DEFAULT 0,
  brand_value     TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 啟用 Row Level Security
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;

-- 允許公開讀取（所有人可以瀏覽名單）
CREATE POLICY "public_read" ON influencers
  FOR SELECT USING (true);

-- 允許寫入（前端密碼已保護管理功能）
CREATE POLICY "anon_write" ON influencers
  FOR ALL USING (true) WITH CHECK (true);
```

4. 看到 **Success** 代表成功

### 1-3 取得 API 金鑰

1. 左側選單點 **Project Settings**（齒輪圖示）
2. 點 **API**
3. 複製以下兩個值（待會要用）：
   - **Project URL**（例：`https://abcdefgh.supabase.co`）
   - **anon public** key（一長串 eyJ 開頭的字串）

---

## STEP 2：上傳程式碼到 GitHub

### 2-1 建立 GitHub 帳號（已有可跳過）

前往 [https://github.com](https://github.com) 免費註冊

### 2-2 建立新倉庫

1. 點右上角 **+** → **New repository**
2. Repository name：`kol-manager`
3. 選 **Private**（私有，公司內部使用）
4. 點 **Create repository**

### 2-3 上傳專案資料夾

方法 A（不需安裝 Git，最簡單）：

1. 在 GitHub 新建倉庫頁面，點 **uploading an existing file**
2. 將整個 `kol-manager` 資料夾內的所有檔案拖曳進去
   - ⚠️ 注意：要上傳資料夾**內部的檔案**，不是資料夾本身
   - 需要包含：`package.json`、`vite.config.js`、`index.html`、`src/` 資料夾等
   - **不要上傳** `.env` 檔（機密資訊）
3. 點 **Commit changes**

方法 B（如果已安裝 Git）：

```bash
cd kol-manager
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/你的帳號/kol-manager.git
git push -u origin main
```

---

## STEP 3：部署到 Vercel

### 3-1 建立 Vercel 帳號

1. 前往 [https://vercel.com](https://vercel.com)
2. 點 **Start Deploying** → 選 **Continue with GitHub**
3. 授權 Vercel 存取你的 GitHub

### 3-2 匯入專案

1. 點 **Add New** → **Project**
2. 找到 `kol-manager` 倉庫 → 點 **Import**
3. Framework Preset 選 **Vite**（通常會自動偵測）
4. **先不要點 Deploy**，先做下一步設定環境變數

### 3-3 設定環境變數（最重要！）

在 Deploy 頁面，展開 **Environment Variables**，新增以下三個：

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | 你的 Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | 你的 Supabase anon public key |
| `VITE_ADMIN_PASSWORD` | 你自訂的管理員密碼（例：Dayday@2024） |

每個都要點 **Add** 確認加入

### 3-4 部署

1. 點 **Deploy** 按鈕
2. 等待約 1-2 分鐘，看到 **Congratulations!** 代表成功
3. Vercel 會給你一個固定網址，例如：`https://kol-manager-xxx.vercel.app`

---

## STEP 4：驗證系統運作

1. 打開你的 Vercel 網址
2. 應該看到 **KOL Manager** 介面（空白，因為還沒有資料）
3. 點右上角 **⚙️ 管理後台**
4. 輸入你設定的管理員密碼
5. 點 **＋ 新增網紅**，試著填入一筆資料並儲存
6. 回到 **🖼️ 網紅名單**，確認資料出現在 Gallery 中

---

## STEP 5：分享給同仁

直接把 Vercel 網址傳給同仁即可。

- **瀏覽名單**：任何人都可以看（不需要密碼）
- **新增 / 編輯 / 刪除**：需要輸入管理員密碼

---

## 更新程式碼（之後如需修改功能）

只要把修改後的檔案重新上傳到 GitHub，Vercel 會**自動偵測並重新部署**，網址不變。

---

## 常見問題

**Q：網頁打開是空白的？**
→ 打開瀏覽器 F12 → Console，看看有沒有錯誤訊息。通常是環境變數沒設好。

**Q：新增資料後重新整理就消失？**
→ 代表 Supabase 連線有問題。確認 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 在 Vercel 設定正確，且 SQL 建表成功。

**Q：管理後台密碼忘記了？**
→ 到 Vercel → 你的專案 → Settings → Environment Variables，找到 `VITE_ADMIN_PASSWORD` 修改，然後重新部署。

**Q：想加上自訂網域（例如 kol.dayday.com）？**
→ Vercel → Settings → Domains → 輸入你的網域，照指示設定 DNS。

---

## 費用說明

| 服務 | 免費方案限制 | 是否足夠 |
|------|-------------|---------|
| Vercel | 100GB 流量/月 | ✅ 綽綽有餘 |
| Supabase | 500MB 資料庫 + 5GB 流量/月 | ✅ 儲存幾千筆完全沒問題 |
| GitHub | 無限私有倉庫 | ✅ |

**→ 完全免費，不需要任何信用卡**
