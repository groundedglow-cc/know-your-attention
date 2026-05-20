# Obsidian 插件化改造备忘

> 把当前 H5 工具迁移成 Obsidian 插件的工作计划。
> 业务代码（React 组件、reducer、时长统计）90% 可原样保留，主要是**容器替换 + 存储替换 + 导入导出走 Vault**。

---

## 1. 项目骨架（半天）

- 删除 `vite.config.ts` / `index.html` / `src/main.tsx`
- 新建 Obsidian 插件标配文件：
  - `manifest.json`：`id` / `name` / `version` / `minAppVersion` / `isDesktopOnly: false`（设 false 才能在 iPad / 手机用）
  - `versions.json`
  - `styles.css`（合并所有 css，Obsidian 自动加载）
  - `esbuild.config.mjs`：打包 `main.js`，把 `obsidian` / `electron` 列为 external
- 调整 `tsconfig.json`：`module: CommonJS`、`target: ES2018`、保留 React JSX 配置
- `main.ts` 作为入口，`export default class KyaPlugin extends Plugin` 实现 `onload` / `onunload`

## 2. UI 容器（关键）

- 注册一个 `ItemView` 子类（例如 `KyaView extends ItemView`），实现：
  - `getViewType()` / `getDisplayText()` / `getIcon()`
- 在 `onOpen()` 里：
  ```ts
  this.root = createRoot(this.contentEl);
  this.root.render(<App plugin={this.plugin} />);
  ```
- `onClose()` 里 `this.root?.unmount()`，防内存泄漏
- `onload()` 中：
  - `this.registerView(VIEW_TYPE, leaf => new KyaView(leaf, this))`
  - 加 ribbon 图标
  - 加 command "打开 KYA 面板"
- 当前的双栏 420 + 420 布局在 Obsidian 侧栏会偏窄；建议把 `app-shell` 的固定宽度改成弹性（`flex: 1 1 50%`），或允许用户在右键菜单选"在新窗口/tab 打开"

## 3. 存储替换（最重要的改动）

当前的三个 `localStorage` key（`kya.tasks` / `kya.notes` / `kya.taskNotes`）→ 改成 Obsidian 的 `Plugin.loadData()` / `saveData()`：

```ts
const data = (await this.loadData()) ?? {};
await this.saveData({ ...data, tasks });
```

**两种落地策略：**

### A. 整体存 plugin data（黑盒）
- 实现简单，但用户看不到文件，无法做 Obsidian 内的反向链接
- 适合 v0.1 快速跑通

### B. 写进 vault 文件（白盒，**推荐**）
- `kya.tasks` → 写到 `MyAttention/_data.json`
- 每条事项的右侧 textarea 备注 → 自动生成 `MyAttention/notes/<task-text>.md`
- 这样：可被双链 `[[…]]`、可被 Dataview 索引、可被全局搜索；用户停用插件后笔记仍能读 —— 这是 Obsidian 插件的"灵魂"

**重要：** 业务代码层抽一个 `StorageAdapter` 接口，本地版用 localStorage，Obsidian 版用 plugin data 或 vault。这样还能保留 web 端独立运行能力。

## 4. 导入导出走 Vault

- 浏览器的 `Blob + a.click()` 下载 → 替换为：
  ```ts
  await this.app.vault.create('My Attention 2026-05-19.md', content);
  ```
- 文件选择导入：
  - 用 `Modal` 让用户从已有 vault 文件中选
  - 或让用户直接把 JSON 拖进 vault，再调用 `vault.adapter.read(path)` 解析
- `window.confirm` / `window.alert` → 换成 Obsidian 的 `Notice` 与 `Modal` 子类

## 5. 快捷键迁移

- 移除自己的 `window.addEventListener('keydown', …)`（在 Obsidian 内会和它的 hotkey 抢）
- 把每个动作改成 `this.addCommand({ id, name, callback / hotkeys })`
- 用户在 Obsidian 设置里可以**自由重绑**任何快捷键
- `src/shortcuts.ts` 配置正好能直接喂给 `addCommand`，迁移成本低
- 浮层提示仍可保留，但要在 Obsidian 编辑器 focus 状态下不触发（用 `this.app.workspace.activeLeaf` 判断）

## 6. 主题与 CSS

把 `App.css` 里的硬编码颜色替换为 Obsidian CSS 变量，跟随用户主题：

| 当前硬编码 | Obsidian 变量 |
|---|---|
| `#f8fafc` 背景 | `var(--background-primary)` |
| `#fff` 卡片背景 | `var(--background-secondary)` |
| `#111827` 主文字 | `var(--text-normal)` |
| `#6b7280` 次文字 | `var(--text-muted)` |
| `#2563eb` 强调 | `var(--interactive-accent)` |
| `#eef0f3` 边框 | `var(--background-modifier-border)` |

这样用户切深色 / 自定义主题不会撞色。

## 7. 移动端 / 兼容性

- `manifest.json` 设 `isDesktopOnly: false`
- 移除 `beforeunload` 监听（移动 webview 不可靠），改在 `plugin.onunload` 里 flush
- 不能依赖 `URL.createObjectURL` 做下载 —— 已被 vault 写文件方案替代
- 测试 iOS Obsidian webview 的 `requestAnimationFrame` / `Date.now()` 行为（长按完成的进度条逻辑要确认）
- 透明度 hover 效果在移动端无 hover 概念，需要替换为长时间无操作淡出

## 8. 设置面板

- 实现 `PluginSettingTab` 子类，提供：
  - 默认 emoji
  - 面板默认布局（左/右/底）
  - 是否把数据落到 vault 文件
  - Markdown 导出路径模板（如 `{{date}} My Attention.md`）
  - 是否禁用页面透明度淡出
- 设置改动通过 `await this.saveSettings()` 持久化

## 9. 发布

- `manifest.json` 加 `funding`、`authorUrl` 字段
- README 增加 "Manual install" 章节（把 `main.js` / `manifest.json` / `styles.css` 放到 `.obsidian/plugins/know-your-attention/`）
- 提交到 [obsidian-releases](https://github.com/obsidianmd/obsidian-releases) 进社区市场

---

## 工作量评估

| 工作项 | 预计耗时 |
|---|---|
| React 组件、reducer、时长统计 | 几乎不动 |
| 容器、入口、esbuild 构建 | 1 天 |
| 存储 adapter + 导入导出走 vault | 1~2 天 |
| 快捷键迁移到 `addCommand` + 浮层适配 | 0.5 天 |
| 主题 CSS 变量化 | 0.5 天 |
| 设置面板 + 兼容性测试 | 1 天 |

**总计大约 3~5 天**能出一个能用的 v0.1 版本。

---

## 最大决策点

**数据存在 plugin data（黑盒）vs. 写进 vault 文件（白盒）**。

后者意味着用户每条事项的备注都是真正的 markdown 笔记，可以双链、可以被 Dataview 查询、可以被搜索、用户停用插件后笔记仍能读 —— 这才是 Obsidian 插件的"灵魂"。

**强烈推荐走白盒路线**，会让这个工具的价值在 Obsidian 内被放大数倍。

---

## 后续可探索

- **Daily Note 集成**：把当天的"事项快照 + 时长汇总"自动追加到 Daily Note 末尾
- **Dataview 友好元数据**：每个事项备注 markdown 文件的 frontmatter 里写入 `status` / `accumulatedMs` / `createdAt`，让 Dataview 能直接查询
- **Callout / Codeblock 嵌入**：允许在任意笔记中用 ```` ```kya ```` 代码块嵌入一个迷你视图，定位到指定事项
- **WebView 同源版本**：保留独立 web 部署，并通过 WebDAV / S3 同步数据，使浏览器版与 Obsidian 版互通
