<div align="center">
  <img src="extension/icons/logo16.png" alt="SUI Guard Logo" width="64" height="64">
</div>

# SUI Guard

🛡️ 一個專為 SUI 區塊鏈生態系統設計的安全防護 Chrome 擴展

https://github.com/user-attachments/assets/730de456-5851-405e-80a8-20d0d8030459

---
## Meeting Notes 會議紀要

- Sep. 07, 2025 - Decide key functions(user report, parse string, sign check, AI smart contract check, security badge) and daily tasks in this week.
- Sep. 08, 2025 - Decide Team collaboration rules, ask for data authorization, and study how to implement sui sign check
- Sep. 9, 2025 - Complete implement sui sign check

---
### Goal & Welcome to join us! 初衷 & 誠摯邀請你加入
- web3 被盜事件太多，想做公益項目造福大家。
  > 即使是相對安全的 Sui，其生態系的協議也在不斷受到威脅。例如 2025 年 5 月 Cetus 被盜$0.22B、9 月 nemo protocol 被盜$3M。故我們 SuiGuard 團隊期待與您一起做出更助人的 web3 防禦工具！


## Features 功能特色

> 詳細功能介紹請參考 [簡報；簡報會再更新](https://github.com/k66inthesky/suiguard/blob/main/SuiGuard%20-%20Blockchain%20Security%20Solution%20PitchBlue%20And%20White%20Modern%20Illustrative%20Data%20Privacy%20and%20Protection%20Presentation.pdf)第三頁的 5 點：

1. Sui 版 whoscall - 即時黑名單偵測與回報
2. 用 ML 模型分析智能合約安全性，並做以下事情：
   - Sign check - 方便用戶在簽名前，做快速合約檢查
   - 3-color security light - 讓用戶一眼看出目前瀏覽的網站安全性
   - Security badge - 讓用戶在瀏覽器上看到網站的安全徽章
3. Real-time webhook notification - 鏈上有大事時即時通知企業用戶(像是 SUI 生態系的 protocols, wallet, DeFi, NFT marketplace, Memecoins 等項目方)


## 安裝方式

### 開發者安裝
1. 下載或克隆此倉庫
2. 打開 Chrome 瀏覽器
3. 前往 `chrome://extensions/`
4. 開啟「開發人員模式」
5. 點擊「載入未封裝項目」
6. 選擇 suiguard 資料夾

## Real-Time Blacklist 初版資料來源

> 目前正在與 MystenLabs 聯繫，爭取成為官方合作夥伴，取得更即時的黑名單資料，同時也希望能將我們 SuiGuard 用戶提交的黑名單反饋給 MystenLabs。

黑名單數據來源於 [MystenLabs 官方黑名單倉庫](https://github.com/MystenLabs/wallet_blocklist)：
- coin-list.json
- object-list.json
- domain-list.json
- package-list.json

預期將用戶提交的黑名單：我們自己 own 一個，也分享回報給[MystenLabs](https://github.com/MystenLabs/wallet_blocklist)或[suiet](https://github.com/suiet/guardians)。

## 技術棧

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **API**: GitHub Raw API
- **存儲**: Chrome Storage API
- **架構**: Chrome Extension Manifest V3
- **後端**: Python3.12 FastAPI, Jest, React Testing Library

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

## Team Member 團隊成員

👨‍💻 **Backend, CI/CD** - [k66](https://github.com/k66inthesky)

👨‍💻 **Frontend, UI/UX** - [Emily](https://github.com/lienweb)

## 授權條款

MIT License - 詳見 LICENSE 文件

---

<div align="center">
  為 SUI 生態系統的安全做出貢獻 🚀
  <br>
  <sub>Built with ❤️ for the SUI Community</sub>
</div>
