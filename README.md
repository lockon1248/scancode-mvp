
# 前後台管理系統設計

This is a code bundle for 前後台管理系統設計.  
Figma 原始設計稿：  
https://www.figma.com/design/n8Mz5BE7CMHv8fGA6uhyNU/%E5%89%8D%E5%BE%8C%E5%8F%B0%E7%AE%A1%E7%90%86%E7%B3%BB%E7%B5%B1%E8%A8%AD%E8%A8%88

## 專案簡介

- 前台：企業使用者登入、掃描上傳、歷史紀錄、個人資料
- 後台：客戶管理、帳號申請、點數管理、權限管理
- 資料來源：`IndexedDB + Promise-based mock API`
- 目前定位：MVP Demo（本機開發與流程驗證）

## 啟動方式

1. 安裝套件：`npm i`
2. 啟動開發：`npm run dev`
3. 產出建置：`npm run build`

## 後台角色與權限

- `ADM`：完整後台功能
- `Sales`：客戶管理、帳號申請、點數儲值申請
- `PM`：帳號申請審核、點數儲值申請審核

## 點數儲值申請流程（最新）

### Sales 端

1. 進入 `客戶管理`
2. 點選任一公司列進入公司資料頁
3. 點 `儲值點數`，填寫追加點數後送出審核
4. 送出後會回到公司資料頁
5. 若 PM 退回，可到側邊欄 `點數儲值申請` 查看拒絕原因
6. 在拒絕案件按 `重新申請`，會自動帶回原申請點數與拒絕原因

### PM 端

1. 進入側邊欄 `點數儲值申請`
2. 查看 `待審核` 清單
3. 可對每筆申請 `核准` 或 `拒絕`
4. 核准後系統會把該申請點數加到公司剩餘點數

## 客戶管理頁目前欄位

- 公司 ID
- 公司名稱
- 統一編號
- 帳號類型
- 剩餘積分
- 人數
- 點數申請狀態（`待審核` / `審核失敗` / `-`）
- 追加申請點數

備註：公司列表支援按鈕觸發搜尋與分頁（每頁 10 筆）。

## MVP Demo Account (Frontend)

All frontend demo accounts use Password: `123`.

- Company: 台積電（shared credits）
  - `ming.chang@tsmc.com` (all permissions)
  - `hua.li@tsmc.com` (history + download)
  - `upload.only@tsmc.com` (upload only)
  - `viewer@tsmc.com` (history + download)
  - `profile.editor@tsmc.com` (edit profile only)
  - `finance@tsmc.com` (download only)
- Company: 聯發科（shared credits）
  - `manager@mediatek.com` (all permissions)
  - `viewer@mediatek.com` (history + download)
  - `upload@mediatek.com` (upload only)
  - `profile@mediatek.com` (edit profile only)
- Company: 華碩（shared credits）
  - `admin@asus.com` (all permissions)
  - `report@asus.com` (history + download)
  - `upload@asus.com` (upload only)
- Company: HTC（shared credits）
  - `owner@htc.com` (all permissions)
  - `member@htc.com` (history only)
  - `viewer@htc.com` (history + download)

## MVP Demo Account (Backend)

All backend demo accounts use Password: `123`.

- `adm@orange.com` (ADM, full backend access)
- `sales@orange.com` (Sales)
- `pm@orange.com` (PM)
  
