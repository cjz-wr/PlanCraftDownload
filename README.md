<p align="center">
  <img src="app/src/main/res/mipmap-xxhdpi/ic_launcher.png" width="120" height="120" alt="PlanCraft">
</p>

<h1 align="center">📅 PlanCraft</h1>

<p align="center">
  <em>全功能时间规划 · 端到端加密同步 · AI 智能辅助 · 数据百分百本地</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/version-1.1.6-blue.svg" alt="版本"></a>
  <a href="#"><img src="https://img.shields.io/badge/Android-8.0%2B-green.svg" alt="最低版本"></a>
  <a href="#"><img src="https://img.shields.io/badge/license-Apache%202.0-lightgrey.svg" alt="许可证"></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs欢迎"></a>
</p>

---

## 🎯 简介

**PlanCraft** 是一款集**任务管理、笔记、打卡、AI 聊天、番茄钟、课程表导入、桌面小组件**于一体的原生 Android 应用。  
它没有复杂的订阅，**所有数据保存在本地**，AI 能力由您自己的 API Key 驱动，并设有**全局隐私开关**，让您完全掌控自己的数据。  
更有**多平台云端同步**（GitHub / Gitee / GitCode）支持，让多设备协同轻松无忧。

---

## ✨ 核心亮点

- 🔐 **端到端加密同步** – 数据本地加密后上传，服务商无法窥探内容。
- 🌐 **多服务商支持** – 自由切换 GitHub、Gitee、GitCode，配置独立存储。
- 🧠 **AI 通用智能体** – 聊天中自然生成任务/待办/笔记/打卡计划，一键写入。
- 🛡️ **双重隐私控制** – 全局 AI 数据开关 + 聊天内“携带计划数据”次级开关。
- 📚 **智能课程表导入** – 社区贡献的 JS 解析规则，及时更新，WebView 沙箱安全执行。
- 🧩 **丰富桌面小组件** – Glance 实现，支持自定义背景、字体颜色，数据快照防卡死。
- 🍅 **番茄钟专注模式** – 屏蔽干扰应用，异步加载应用列表，不卡 UI。
- 📊 **效率看板** – 日报/周报/月报，自动聚合数据，支持 AI 增强总结。

---

## 📱 功能总览

### 🗓️ 日历（任务中枢）
- 月 / 周 / 日 / 列表四种视图，手势滑动切换，缩放支持
- 周/日视图采用课表式时间轴，任务卡片按时间定位
- 自然语言快速创建（AI 解析 + 正则回退）
- 子任务无限嵌套、标签多选、优先级、重复任务（RRULE）
- 四象限看板（拖拽移动）、甘特图

### 📝 笔记
- 轻量文本笔记，支持置顶、分类筛选、全文搜索
- Markdown 实时预览（双栏编辑）
- 一键转为待办

### ✅ 打卡
- 自定义计划（日期范围、每日多个时间点/时间段）
- 月度热力图、连续天数、补签功能

### 🤖 AI 聊天
- 多轮对话，流式输出，Markdown 渲染
- 侧边会话抽屉，历史自动保存
- 意图识别：生成任务/待办/笔记/打卡计划卡片，确认后写入

### 🍅 番茄钟
- 前台服务 + 唤醒锁，后台持续计时
- 绑定任务自动记录专注时长
- 专注模式屏蔽应用（黑/白名单）

### 🧩 桌面小组件
- 多种样式（当前待办、当前+下一个计划、自定义）
- 自定义背景图、字体颜色
- 实时数据更新，无卡顿

### 📚 智能导入课程表
- 社区规则引擎（GitHub 托管 JS 脚本）
- 双源下载（GitHub → GitCode 自动降级）
- 预览后一键写入系统日历，密码不落地

### 📊 效率看板
- 日报/周报/月报，统计完成任务、专注时长、打卡等
- 本地规则生成总结，可选 AI 增强

### 🔐 云端同步（多服务支持）
- 支持 GitHub、Gitee、GitCode，服务自由切换
- 端到端加密，密钥自动派生（密码/昵称）
- 身份防撞库，LWW 冲突仲裁，自动备份
- 修改密码/昵称自动拉取→合并→重加密上传

### 🎨 主题与外观
- 浅色/深色/跟随系统，独立背景色/背景图
- 背景图亮度、透明度可调

### 📦 更多工具
- 待办清单（闹钟提醒 + 自定义铃声）
- 备忘录（提醒功能）
- 习惯追踪（简化版打卡）
- Excel / Markdown 表格导入（内置示例）
- 数据导出（计划/待办/笔记/备忘录）
- 加密备份与恢复（SAF 存储）
- 回收站（软删除，自动清理）
- 全局搜索（含批量删除）
- 系统日历单向同步（自动识别节假日）
- 通知与铃声定制（各类型独立设置）
- 多 AI 管理（存储多个 API Key）
- 用户系统（本地注册/登录，多账户隔离）
- 每日签到（3D 翻转语录卡片，经验值升级）
- 在线公告、自动更新（断点续传）

---

## 📲 快速开始

## 📥 下载安装

稳定版 APK 请从 [Releases](https://github.com/cjz-wr/PlanCraftDownload/releases) 页面下载。

当前版本：**v1.1.6**（适配 Android 16，支持平板横屏适配）

---

## 🤝 参与贡献

我们欢迎各种形式的贡献！

- 🐛 **报告 Bug** – 提交 [Issue](https://github.com/cjz-wr/PlanCraftDownload/issues)
- 💡 **功能建议** – 提交 [Issue](https://github.com/cjz-wr/PlanCraftDownload/issues) 并标注 `enhancement`
- 📚 **课程表规则** – 为您的学校编写 JS 脚本，提交至 [PlanCraftDownload](https://github.com/cjz-wr/PlanCraftDownload) 仓库
- 🔧 **代码贡献** – 提交 Pull Request，请遵循项目代码风格

交流 QQ 群：[578148848](https://qun.qq.com/universal-share/share?ac=1&authKey=bcWsNjcbkn%2Fm5LBE0zzE09Kn4pSInw9O7z%2B2Dd1hj3uPPOsaruoEkIEwp2yAbAw4&busi_data=eyJncm91cENvZGUiOiI1NzgxNDg4NDgiLCJ0b2tlbiI6IkdRNjJsSFlIQk1Vb2NoSHVvclZPV2NiSlJiejBLWWxnODh3RmovcW85L21nNGc3OVVkUEExMkRuNDBBd3lONTMiLCJ1aW4iOiIyOTYzMzkzMzQ4In0%3D&data=tnjVCQEiG8ztbLxkN1DqY_Z-iuz-x4t8OGh71jCccqiJEsHE8tAMjqrKdbqcrKBdmh_YGgFtr79ognfmf5N9aQ&svctype=4&tempid=h5_group_info)

交流微信群:![xz](./PlanCraft官方群.png)

---

## 📄 许可证

本项目采用 [Apache License 2.0](LICENSE)。

---

## 🙏 致谢

- 图标来自 Material Icons
- AI 能力由用户自行配置的第三方大模型提供
- 感谢所有内测用户和贡献者

<p align="center">
  <strong>Made with ❤️ by 七千云喵~</strong>
</p>
```
