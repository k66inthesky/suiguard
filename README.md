<div align="center">
  <img src="logo16.png" alt="SUI Guard Logo" width="64" height="64">
</div>

# SUI Guard

🛡️ 一個專為 SUI 區塊鏈生態系統設計的安全防護 Chrome 擴展

https://github.com/user-attachments/assets/730de456-5851-405e-80a8-20d0d8030459

---
## Meeting Notes 會議紀要
<details>
<summary>Sep. 7, 2025 - Decide key functions(user report, parse string, sign check, AI smart contract check, security bagde) and daily tasks in this week.</summary>
&nbsp;&nbsp;&nbsp;&nbsp;Team collaboration rules, ask for data authorization, and study how to implement sui sign check
</details>


---
### Goal & Welcome to join us! 初衷 & 誠摯邀請你加入
- web3被盜事件太多，想做公益項目造福大家。
  > 例如今年2月Bybit被盜15億美元、5月Cetus被盜2.2億美元。我先拋磚引玉做出初版，期待我們一起做出更助人的web3防禦工具!
- 因參加SUI 9月黑客松，故選在SUI鏈。
- 任何關於此項目的想法皆歡迎!
  > 任何延伸的想法、延伸商用、擴容至整個web3，甚至是更多能助人的功能。
  - **歡迎開issue討論(tag打idea)，或者**
  - **在SUI線下工作坊討論(期待你準備一張系統架構圖或產品設計藍圖)**


## Features 功能特色

### 🔍 SUI黑名單檢測
- 實時檢測 Coin Address、Object ID、Domain、Package ID 是否在官方黑名單
- 支援批量檢測（多行輸入）
- 直接從 MystenLabs 官方 GitHub 倉庫獲取最新黑名單數據
- 詳細的檢測結果視覺化顯示

### ⚠️ 回報可疑地址
- 結構化回報表單
- 支援四種地址類型回報
- 本地存儲回報記錄
- 感謝訊息確認機制


## 技術特色

- ✅ Chrome Manifest V3 規範
- ✅ 實時 GitHub API 資料獲取
- ✅ 完整錯誤處理和除錯功能
- ✅ 支援鍵盤快捷鍵（Enter 檢測）
- ✅ 本地資料存儲功能

## 安裝方式

### 開發者安裝
1. 下載或克隆此倉庫
2. 打開 Chrome 瀏覽器
3. 前往 `chrome://extensions/`
4. 開啟「開發人員模式」
5. 點擊「載入未封裝項目」
6. 選擇 suiguard 資料夾

## 使用說明

1. **首頁導航**：點擊擴展圖標後選擇需要的功能
2. **黑名單檢測**：選擇地址類型，輸入地址，點擊檢測
3. **回報可疑地址**：填寫回報表單，提交可疑地址信息

## TODO 

### 🔧 功能改進

#### 0. Logo
- [ ] **Logo設計**：預計是盾牌+SUI，歡迎設計師/擅長者貢獻所長!

#### 1. 黑名單檢測優化
- [ ] **地址格式驗證**：SUI 的 Coin Address、Object ID 和 Package ID 皆為 32 bytes，需加入基本格式檢查
- [ ] **輸入防呆機制**：當輸入格式錯誤時提醒用戶正確的地址格式
- [ ] **地址類型自動識別**：根據輸入內容自動判斷地址類型

#### 2. 資料處理改進  
- [ ] **Regular Expression 篩選**：目前直接抓取 GitHub JSON 整串資料，未來使用正則表達式篩選字串
- [ ] **資料格式優化**：改善資料顯示方式，讓檢測結果更適合人類閱讀

#### 3. 回報系統增強
- [ ] **回報內容驗證**：加入防呆/防亂設計，確保回報內容的品質
- [ ] **重複回報檢查**：避免用戶重複回報相同地址
- [ ] **回報格式規範**：建立標準化的回報格式和必填欄位

#### 4. 雲端整合與審核機制
- [ ] **雲端資料庫**：建立雲端存儲系統收集回報資料
- [ ] **MystenLabs 整合**：研究如何將回報資料提交到 `mystenlabs/wallet_blocklist` 倉庫
- [ ] **審核流程設計**：建立回報審核機制，確保資料準確性
- [ ] **API 介接**：設計 API 來處理回報提交和狀態追蹤

### 📊 文件與視覺化

#### 5. 流程圖與說明
- [ ] **系統架構圖**：展示整體系統運作流程
- [ ] **使用者流程圖**：詳細說明用戶操作步驟
- [ ] **資料流圖**：說明資料如何從 GitHub 到用戶界面

#### 6. 功能擴充
- [ ] **白名單功能**：新增信任地址白名單機制
- [ ] **歷史紀錄**：加入檢測歷史和統計功能
- [ ] **風險評分**：為地址提供風險等級評估
- [ ] **通知系統**：檢測到危險地址時的警告通知
- [ ] **批量導入**：支援 CSV 檔案批量檢測
- [ ] **API 模式**：提供 API 給其他應用程式使用

### 🚀 技術債務
- [ ] **單元測試**：加入完整的測試覆蓋率
- [ ] **效能優化**：改善大量地址檢測時的效能
- [ ] **錯誤處理**：加強網路錯誤和異常狀況處理
- [ ] **國際化**：支援多國語言介面
- [ ] **無障礙設計**：改善視障和行動不便用戶的使用體驗

### 💡 未來願景
- [ ] **社群功能**：建立用戶社群，分享安全資訊
- [ ] **機器學習**：使用 AI 技術自動識別可疑模式
- [ ] **跨鏈支援**：擴展到其他區塊鏈生態系統
- [ ] **移動端應用**：開發手機版應用程式

## 資料來源

黑名單數據來源於 [MystenLabs 官方黑名單倉庫](https://github.com/MystenLabs/wallet_blocklist)：
- coin-list.json
- object-list.json  
- domain-list.json
- package-list.json

## 技術棧

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **API**: GitHub Raw API
- **存儲**: Chrome Storage API
- **架構**: Chrome Extension Manifest V3

## 貢獻指南

歡迎提交 Issues 和 Pull Requests 來改善這個項目！

### 如何貢獻
1. Fork 這個倉庫
2. 建立你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟一個 Pull Request

### 回報問題
如果你發現任何問題或有改進建議，請：
- 查看現有的 Issues 避免重複
- 使用 Issue 模板提供詳細資訊
- 歡迎讓我知道你對防呆/防亂設計的想法！

## Team Member

👨‍💻 **k66** - [k66's GitHub Profile](https://github.com/k66inthesky)

👨‍💻 **Emily** - [Emily's GitHub Profile](https://github.com/lienweb)


## 授權條款

MIT License - 詳見 LICENSE 文件

---

<div align="center">
  為 SUI 生態系統的安全做出貢獻 🚀
  <br>
  <sub>Built with ❤️ for the SUI Community</sub>
</div>
