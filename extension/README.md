# 🚀 SuiGuard Chrome Extension

[![License](https://img.shields.io/github/license/k66inthesky/suiguard/extension)](./LICENSE)

<!-- [![Build Status](https://img.shields.io/github/actions/workflow/status/yourname/yourrepo/ci.yml)](https://github.com/yourname/yourrepo/actions)
[![npm version](https://img.shields.io/npm/v/your-package)](https://www.npmjs.com/package/your-package) -->

A chrome Extension to protect your Sui Wallet.

---

## 🛠 Features

- Malicious phishing websites, addressed check from verified blacklists
- Sign Check
- Report suspicious addressed or phishing websites

---

## 🧰 Tech Stack

- **Node.js** v22.12+
- **TypeScript** v5+
- **pnpm** v9+
- **turborepo**

---

## 📖 Quick Start

### Prerequisites

- Node.js >= 22.12
- pnpm

### 📦 Installation

```bash
git clone git@github.com:k66inthesky/suiguard.git
cd extension
pnpm install
pnpm build
```

- Load the extension in you browser

1. Open chrome://extensions in Chrome
2. Enable "Developer mode" toggle in the upper right side
3. Click "Load unpacked" in the upper left corner
4. Select the `extension/dist` directory from suiguard project

### Start dev server

```bash
pnpm dev
```

## 📜 Licenses

This project is licensed under the MIT License.

This project includes code from [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/tree/main?tab=readme-ov-file#community), licensed under MIT.

## 🙏 Acknowledgements

This project is built upon [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/tree/main?tab=readme-ov-file#community).

## ✨ WIP

- Sep 14 2025: upgrade tailwindCSS from V3 to V4 using pnpm audit, popup already solved build error, other archived modules haven't.

---
