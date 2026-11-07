# 翻翻找朋友：素材来源

内置主题使用项目内 `public/game/memory/cards.js` 的原创 SVG 图形（由几何形状绘制），不含第三方图片、字体或网络素材。翻牌、配对与通关音效由 Web Audio API 在设备本地合成。

内置卡片的日语单词读音与配对成功鼓励语（`すごい！`、`いいね！`、`じょうず！`）由 OSS 公开地址 `https://japaflow-audio-bucket.oss-cn-shanghai.aliyuncs.com/memory-match/audio/` 提供，源文件位于 `public/game/memory/audio/`。它们以 Azure Speech Services 的 `ja-JP-NanamiNeural` 合成；输入词清单、可复现生成器和 OSS 上传器分别在 `scripts/generate-memory-audio.mjs`、`scripts/upload-memory-audio-to-oss.mjs`。凭据只从环境变量读取，不纳入仓库。家长导入的图片由使用者确认已获得使用授权，仅保存于该设备的 IndexedDB。
