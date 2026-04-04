# 秋云轻图

<p align="center">
  <img src="https://img.shields.io/badge/WeChat%20Mini%20Program-07C160?style=flat-square&logo=wechat&logoColor=white" alt="微信小程序">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Local%20Processing-Privacy%20Safe-success?style=flat-square" alt="本地处理">
</p>

<p align="center">
  <b>极简高效的本地图片处理工具</b>
</p>

<p align="center">
  <a href="#功能介绍">功能介绍</a> •
  <a href="#技术架构">技术架构</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#贡献指南">贡献指南</a>
</p>

***

## 📱 项目简介

**秋云轻图**是一款基于微信小程序的本地图片处理工具，主打"极简、高效、安全"的理念。所有图片处理操作均在本地完成，不上传任何数据，全面保护用户隐私。

### ✨ 核心特性

- 🔒 **完全本地处理** - 图片不上传服务器，保护隐私安全
- ⚡ **极简操作** - 一键式处理，实时预览效果
- 🎨 **功能丰富** - 10+种常用图片处理功能
- 📦 **轻量快速** - 小程序即用即走，无需安装

***

## 🎯 功能介绍

### 基础功能

| 功能           | 描述                        | 状态    |
| ------------ | ------------------------- | ----- |
| 🗜️ **图片压缩** | 质量调节（30%-100%），极速/均衡/高清预设 | ✅ 已完成 |
| 📐 **尺寸调整**  | 等比缩放、指定尺寸、常用预设            | ✅ 已完成 |
| 🔄 **格式转换**  | 多格式导入，转为 JPG/PNG                    | ✅ 已完成 |
| 🎨 **滤镜美化**  | 20+滤镜效果，强度调节              | ✅ 已完成 |
| 📝 **添加水印**  | 文字水印，位置选择，透明度调节           | ✅ 已完成 |
| 🧩 **拼图拼接**  | 2-9张图片，多种布局               | ✅ 已完成 |

### 高级功能

| 功能           | 描述                 | 状态    |
| ------------ | ------------------ | ----- |
| ✂️ **图片裁剪**  | 自由裁剪，四角缩放          | ✅ 已完成 |
| 🔄 **旋转翻转**  | 90度旋转，水平/垂直翻转      | ✅ 已完成 |
| 🖌️ **图片标注** | 画笔涂鸦，橡皮擦，颜色选择      | ✅ 已完成 |
| 🎨 **图片取色**  | 点击取色，HEX/RGB/HSL格式 | ✅ 已完成 |

***

## 🛠️ 技术架构

### 技术栈

- **框架**: 微信小程序原生框架
- **语言**: TypeScript
- **样式**: CSS3 + CSS Variables
- **构建**: 微信开发者工具

### 设计模式

- **组件化架构** - 高复用性组件设计
- **工具函数封装** - 统一的工具函数库
- **本地存储** - 历史记录本地化管理
- **Canvas 2D** - 高性能图片处理

***

## 🚀 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) (最新稳定版)
- Node.js >= 16.0.0
- Git

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/qiuqyCN/qiuyun-lite-pic.git
cd qiuyun-lite-pic
```

1. **导入项目**

- 打开微信开发者工具
- 选择「导入项目」
- 选择项目根目录
- 填写你的 AppID
- 点击「确定」

***

## 📁 项目结构

```
qiuyun-lite-pic/
├── miniprogram/                 # 小程序源码
│   ├── app.ts                   # 应用入口
│   ├── app.json                 # 全局配置
│   ├── app.wxss                 # 全局样式
│   ├── pages/                   # 页面目录
│   │   ├── index/               # 首页
│   │   ├── compress/            # 图片压缩
│   │   ├── resize/              # 尺寸调整
│   │   ├── convert/             # 格式转换
│   │   ├── filter/              # 滤镜美化
│   │   ├── watermark/           # 添加水印
│   │   ├── collage/             # 拼图拼接
│   │   ├── crop/                # 图片裁剪
│   │   ├── rotate/              # 旋转翻转
│   │   ├── annotate/            # 图片标注
│   │   ├── colorpicker/         # 图片取色
│   │   ├── history/             # 历史记录
│   │   └── settings/            # 设置页面
│   ├── components/              # 公共组件
│   │   ├── action-buttons/      # 操作按钮组
│   │   ├── image-preview/       # 图片预览
│   │   ├── image-upload/        # 图片上传
│   │   ├── format-selector/     # 格式选择器
│   │   ├── slider-control/      # 滑块控制
│   │   └── color-picker/        # 颜色选择器
│   ├── utils/                   # 工具函数
│   │   ├── ui.ts                # UI提示
│   │   ├── error.ts             # 错误处理
│   │   ├── file.ts              # 文件操作
│   │   ├── image.ts             # 图片处理
│   │   ├── canvas.ts            # Canvas操作
│   │   ├── history.ts           # 历史记录
│   │   └── debounce.ts          # 防抖函数
│   ├── constants/               # 常量定义
│   └── types/                   # 类型定义
├── 秋云轻图需求文档.md           # 产品需求文档
└── README.md                    # 项目说明
```

***

## 🎨 UI设计规范

### 颜色体系

```css
/* 主色调 */
--accent: #41bc3f;
--accent-light: #e8f8e8;
--accent-dark: #369c34;

/* 背景色 */
--bg-primary: #ffffff;
--bg-secondary: #f5f5f7;
--bg-tertiary: #fafafa;

/* 文字色 */
--text-primary: #1d1d1f;
--text-secondary: #86868b;
--text-tertiary: #c7c7cc;
```

### 字体规范

| 级别        | 大小   | 用途    |
| --------- | ---- | ----- |
| text-xs   | 12px | 标签、徽章 |
| text-sm   | 14px | 辅助文字  |
| text-base | 16px | 正文内容  |
| text-lg   | 18px | 小标题   |
| text-xl   | 22px | 标题    |
| text-2xl  | 28px | 大标题   |

***

## 🔒 隐私说明

### 权限使用

| 权限      | 用途       | 是否必须 |
| ------- | -------- | ---- |
| 微信昵称、头像 | -        | ❌  否 |
| 相册（仅写入） | 保存处理后的图片 | ✅ 是  |
| 选中的照片   | 进行图片处理   | ✅ 是  |
| 剪切板     | 复制颜色值    | ✅ 是  |

### 隐私承诺

- ✅ 所有处理完全本地完成
- ✅ 不上传任何图片数据
- ✅ 不收集用户个人信息
- ✅ 历史记录仅存储本地

***

## 🤝 贡献指南

### 提交 Issue

- 使用清晰的标题描述问题
- 提供复现步骤
- 附上相关截图或日志

### 提交代码

如果你是项目维护者，可以直接提交到 main 分支：

```bash
# 添加更改
git add .

# 提交更改
git commit -m "描述你的更改"

# 推送到 main 分支
git push origin main
```

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 规范
- 添加必要的注释
- 保持代码简洁清晰

***

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源。

***

## 🙏 致谢

- [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/framework/) - 小程序框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript

***

<p align="center">
  Made with ❤️ by 秋云
</p>
