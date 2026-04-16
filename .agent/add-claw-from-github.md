# Add Claw from GitHub

从 GitHub 仓库 URL 自动添加 Claw 项目到 claw123 网站。

## 触发方式

用户提供一个或多个 GitHub 仓库 URL（格式：`https://github.com/{owner}/{repo}`）。

## 完整流程

对每个 GitHub 仓库 URL，按以下步骤执行：

### Step 1: 用 gh CLI 获取仓库基本信息

```bash
gh api repos/{owner}/{repo} --jq '{name: .name, description: .description, homepage: .homepage, owner_avatar: .owner.avatar_url, default_branch: .default_branch, topics: .topics}'
```

需要提取的字段：
- `name` → YAML 的 `name`
- `description` → 基于此生成中文 `description`（AI 翻译/润色为简洁中文描述）
- `homepage` → YAML 的 `homepage`（如果为空，则用 GitHub 仓库 URL）
- `default_branch` → 用于后续拼接 raw 文件 URL
- `topics` → 用作 `tags`

### Step 2: 从 README 中提取项目 Logo

```bash
gh api repos/{owner}/{repo}/readme --jq '.content' | base64 -d | head -40
```

在 README 头部找 `<img src="...">` 标签中的 logo/图标路径，常见模式：
- `docs/assets/logo.png`
- `.github/assets/xxx.png`
- `src/assets/logo.svg`
- `public/assets/xxx-logo.png`
- 仓库根目录下的 `logo.png` / `{name}.png`

然后用 raw URL 下载：
```bash
curl -sL "https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{logo_path}" -o claw123/public/icons/{slug}.{ext}
```

**如果 README 中没有找到 logo 图片**，则使用 GitHub 仓库的 OG 图作为备选：
```bash
curl -sL "https://github.com/{owner}/{repo}" | grep -oP 'property="og:image" content="\K[^"]+'
```
如果 OG 图是 `repository-images.githubusercontent.com` 开头（自定义社交预览图），则下载它。否则回退到 owner 头像：
```bash
curl -sL "{owner_avatar}&s=256" -o claw123/public/icons/{slug}.png
```

### Step 3: 确定 slug

- 从仓库名生成：全部小写，空格和特殊字符替换为 `-`
- 检查 `claw123/claws/` 目录下是否已存在同名 YAML，避免冲突

### Step 4: 确定 category

根据项目描述和功能，归类到以下之一：
- `gateway` — API 网关、请求路由
- `proxy` — 代理、转发
- `aggregator` — 聚合多个服务/模型
- `tool` — 工具、桌面客户端、CLI 工具
- `assistant` — AI 助手、Agent 框架
- `other` — 其他

### Step 5: 生成 YAML 配置文件

写入 `claw123/claws/{slug}.yaml`，格式：

```yaml
slug: {slug}
name: {name}
description: {中文描述，一句话，涵盖核心功能和特色}
category: {category}
homepage: {homepage_url}
github: https://github.com/{owner}/{repo}
icon: /icons/{slug}.{ext}
tags:
  - {tag1}
  - {tag2}
  - {tag3}
  - {tag4}
  - {tag5}
```

**YAML 规范：**
- `description` 必须是中文，简洁有力，一句话概括项目
- `tags` 取 3-5 个，优先使用 GitHub topics，不足时从描述中提炼
- `icon` 路径必须与实际下载的文件名/扩展名一致

### Step 6: 验证

- 确认 YAML 文件格式正确
- 确认图标文件已下载且大小合理（> 1KB）
- 如果图标太大（> 1MB），提醒用户可能需要压缩

## 批量处理

多个 URL 时，并行获取仓库信息（Step 1 和 Step 2 可并行），然后逐个生成 YAML。

## 注意事项

- 所有图标文件放在 `claw123/public/icons/`
- 所有 YAML 文件放在 `claw123/claws/`
- 部署后 `initDatabase()` 会自动同步 YAML 到数据库，无需手动操作
- SVG 格式的 logo 直接使用，无需转换
