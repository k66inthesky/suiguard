<div align="center">
  <img src="extension/icons/logo16.png" alt="SUI Guard Logo" width="64" height="64">
</div>

# SUI Guard

🛡️ 一個專為 SUI 區塊鏈生態系統設計的即時安全防護 Chrome 擴展

Real-time Security Extension for SUI UsersSuiGuard got 3rd place at 2025 Sui Taipei Dev Hackathon

https://github.com/user-attachments/assets/e86bb764-5eee-476c-a666-227a94ca7108

---

## 🏆 Awards

- 🥉 2025 Sui Taipei Dev Hackathon - 3rd Place

## 🚀 Join us! 初衷 & 誠摯邀請你加入

- web3 被盜事件太多，想做公益項目造福大家。
  > 即使是相對安全的 Sui，其生態系的協議也在不斷受到威脅。例如 2025 年 5 月 Cetus 被盜$0.22B、9 月 nemo protocol 被盜$3M。故我們 SuiGuard 團隊期待與您一起做出更助人的 web3 防禦工具！

## Meeting Notes 會議紀要

- Sep. 07, 2025 - Decide key functions(user report, parse string, sign check, AI smart contract check, security badge) and daily tasks in this week.
- Sep. 08, 2025 - Decide Team collaboration rules, ask for data authorization, and study how to implement sui sign check.
- Sep. 09, 2025 - Complete implement sui sign check.
- Sep. 10, 2025 - HOH weekly report, labeling, manually monitor and do cross verification while approve action in wallet.
- Sep. 11, 2025 - Implement chrome extension intercept network requests
- Sep. 12, 2025 - Implement AI risk-assessment analyzer
- Sep. 13, 2025 - Deploy to GCP, deploy to SUI testnet
- Sep. 14, 2025 - SUI Taipei Demo Day
- Sep. 15, 2025 - Update Pitch Deck
- Sep. 22, 2025 - Do ML research
- Sep. 26, 2025 - Design detail ML roadmap
- Sep. 27, 2025 - Design core team member recruit  SOP
- Sep. 28, 2025 - Interview core team candidates. Introduce & assign tasks. 

---

## Features 功能特色

> 詳細功能介紹請參考 [簡報(會再更新)](https://github.com/k66inthesky/suiguard/tree/main/docs)第三頁的 5 點：

1. Sui 版 whoscall - 即時黑名單偵測與回報
2. 用 ML 模型分析智能合約安全性，並做以下事情：
   - Sign check - 方便用戶在簽名前，做快速合約檢查
   - 3-color security light - 讓用戶一眼看出目前瀏覽的網站安全性
   - Security badge - 讓用戶在瀏覽器上看到網站的安全徽章
3. Real-time webhook notification - 鏈上有大事時即時通知企業用戶(像是 SUI 生態系的 protocols, wallet, DeFi, NFT marketplace, Memecoins 等項目方)

4. Real-Time Blocklist 初版資料來源

   > 目前正在與 MystenLabs 聯繫，爭取成為官方合作夥伴，取得更即時的黑名單資料，同時也希望能將我們 SuiGuard 用戶提交的黑名單反饋給 MystenLabs。
   > 黑名單數據來源於 [MystenLabs 官方黑名單倉庫](https://github.com/MystenLabs/wallet_blocklist)

   - coin-list.json
   - object-list.json
   - domain-list.json
   - package-list.json

預期將用戶提交的黑名單：我們自己 own 一個，也分享回報給[MystenLabs](https://github.com/MystenLabs/wallet_blocklist)或[suiet](https://github.com/suiet/guardians)。

## 安裝方式

See `extension/Readme.md`&`backend/Readme.md`

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

## Core Team Member 核心團隊成員

👨‍💻 [k66](https://github.com/k66inthesky) - Backend, ML, CI/CD, System Design

👨‍💻 [Emily](https://github.com/lienweb) - Frontend, UI/UX, System Design


## How to join Core Team Member? 如何加入核心團隊成員?
請依以下順序:
1. 先確認下次月會時間，你可否到場。
2. 填表單(https://forms.gle/oE3AUChoMqkhruD79) ，約費時22分鐘。
3. 開issue，tag選`join core team`，標題寫[Join Core Team]，並留下你填表單的email，我們將寄信聯繫你。
4. 再正式成為core team member前會先稱呼為core team candidate。
5. core team candidate需和整個core team一起工作一個月，期間須完成指定工作、每次準時交付程式碼。
6. 一個月後，每個月月會上，會公布晉升成為core team member的人員名單。

+ Core team member與contributor有何不同?
  + Core team member為整個SuiGaurd專案中貢獻最多的人。 
  + 前者一定兼任後者，後者不一定是前者。

## 下次月會時間
> 有興趣成為`SuiGuard Core Team Member`者請務必關注此日期。

## 授權條款

MIT License - 詳見 LICENSE 文件

---

<div align="center">
  為 SUI 生態系統的安全做出貢獻 🚀
  <br>
  <sub>Built with ❤️ for the SUI Community</sub>
</div>
