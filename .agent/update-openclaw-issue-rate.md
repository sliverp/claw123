# Update OpenClaw Issue Rate Chart

当 openclaw/openclaw 发布新 release 后，更新 issue 变化率图表数据。

## 触发方式

用户提到：更新 openclaw issue 图表、添加新 release 数据、openclaw 出新版本了、等类似意图。

## 文件清单

| 文件 | 用途 | 是否需要修改 |
|---|---|---|
| `claw123/public/openclaw-issue-rate.json` | 数据源 | ✅ 追加新条目 |
| `claw123/public/openclaw-issue-rate.html` | 图表页面 | ❌ 自动加载 JSON |

## 操作流程

### Step 1: 确定需要添加哪些 release

先读取现有 JSON，获取最后一条记录的 version：

```bash
python3 -c "import json; d=json.load(open('claw123/public/openclaw-issue-rate.json')); print(d[-1]['version'], d[-1]['date'])"
```

再获取仓库最新 release 列表：

```bash
gh release list --repo openclaw/openclaw --limit 20 2>&1 | cat
```

对比找出 JSON 中 **尚未收录的正式版 release**（忽略 Pre-release / beta）。

### Step 2: 对每个新 release，获取三类数据

对每个新 release tag（如 `v2026.4.20`），依次执行：

#### 2a. 获取 release 详情（changelog + 日期）

```bash
gh release view <TAG> --repo openclaw/openclaw --json tagName,publishedAt,body
```

- 从 `publishedAt` 提取日期，取 `YYYY-MM-DD` 部分

#### 2b. 查询截至该日期的累计 issue 数

```bash
# 累计创建总数
gh api "search/issues?q=repo:openclaw/openclaw+is:issue+created:<=YYYY-MM-DD&per_page=1" --jq .total_count

# （等待 2 秒，避免 rate limit）

# 累计关闭总数
gh api "search/issues?q=repo:openclaw/openclaw+is:issue+is:closed+closed:<=YYYY-MM-DD&per_page=1" --jq .total_count
```

> ⚠️ GitHub Search API 有速率限制，每次查询间隔至少 **2 秒**。

#### 2c. 解析 changelog 为三类

从 release body（Markdown 格式）中提取以 `- ` 或 `* ` 开头的条目，分为：

**分类规则（按优先级）：**

1. 在 `### Breaking` / `## Breaking` section 下的 → **breaking**
2. 在 `### Fix` / `## Fix` / `### Bug` section 下的 → **fixes**
3. 不在特定 section 下时，按关键词自动判断：
   - 含 `fix`/`bug`/`patch`/`crash`/`regression`/`resolve`/`repair`/`correct ` → **fixes**
   - 含 `breaking`/`remove deprecated`/`rename `/`drop support` → **breaking**
   - 其余 → **features**

**每个条目提取三个字段：**

```json
{
  "text": "简短描述，去掉 PR 链接和 Thanks @xxx 后缀，最长 200 字符",
  "pr": 12345,
  "by": "contributor_username"
}
```

提取方法：
- `pr`: 从 `(#12345)` 或 `https://github.com/openclaw/openclaw/pull/12345` 中提取数字
- `by`: 从 `Thanks @username` 或 `by @username` 中提取
- `text`: 原文去掉 `(#12345)`、`Thanks @xxx.`、`by @xxx`、`in https://...` 等后缀
- `pr` 和 `by` 可选，没有就不加

### Step 3: 追加到 JSON

读取 `claw123/public/openclaw-issue-rate.json`，在数组末尾追加新条目：

```json
{
  "version": "v2026.X.XX",
  "date": "YYYY-MM-DD",
  "created": 30000,
  "closed": 18000,
  "features": [
    {"text": "Models/Google: add Gemini 3.2 support", "pr": 50123, "by": "dev1"}
  ],
  "fixes": [
    {"text": "fix(gateway): handle timeout on reconnect", "pr": 50456, "by": "dev2"}
  ],
  "breaking": [
    {"text": "Config: rename api.key to api.token", "pr": 50789}
  ]
}
```

### Step 4: 验证

运行以下检查：

```bash
python3 -c "
import json
d = json.load(open('claw123/public/openclaw-issue-rate.json'))
for i in range(1, len(d)):
    assert d[i]['created'] >= d[i-1]['created'], f'created not monotonic at {d[i][\"version\"]}'
    assert d[i]['closed'] >= d[i-1]['closed'], f'closed not monotonic at {d[i][\"version\"]}'
    assert d[i]['created'] >= d[i]['closed'], f'created < closed at {d[i][\"version\"]}'
print(f'✅ {len(d)} entries, last: {d[-1][\"version\"]} ({d[-1][\"date\"]})')
print(f'   features={len(d[-1].get(\"features\",[]))} fixes={len(d[-1].get(\"fixes\",[]))} breaking={len(d[-1].get(\"breaking\",[]))}')
"
```

确认：
- JSON 格式正确
- `created` 和 `closed` 单调递增
- `created >= closed`
- `features`/`fixes`/`breaking` 数组非空（除非 release 确实没有内容）

## 完整数据格式参考

```json
[
  {
    "version": "v2026.4.15",
    "date": "2026-04-16",
    "created": 29437,
    "closed": 17142,
    "features": [
      {"text": "Models/Google: add Gemini 3.2 support", "pr": 50123, "by": "contributor"},
      {"text": "CLI: add --json output format"}
    ],
    "fixes": [
      {"text": "fix(gateway): handle timeout on reconnect", "pr": 50456, "by": "dev1"}
    ],
    "breaking": []
  }
]
```

## 图表自动计算的衍生指标

HTML 页面从 JSON 自动计算：

- **每日新增速率** = (当前 created - 上一条 created) / 间隔天数
- **Net Open** = created - closed
- **健康评级 A/B/C/D/F** = 基于 features/fixes 数量 vs breaking/新 issue 数量
- 堆叠柱状图展示每个 release 的 features(绿)/fixes(蓝)/breaking(红)
- 黄色虚线展示期间新增 issue 总量

## 关键注意事项

1. **只需修改 JSON 文件**，HTML 页面完全不用动
2. **保持数组按日期升序排列**
3. **不要重复添加已存在的版本**
4. **API 速率限制**：每次 `gh api search/issues` 调用间隔至少 2 秒
5. **数据准确性**：release 发布后建议等 1 小时再查询 issue 数，GitHub 索引有延迟
6. 如果 release tag 有后缀（如 `v2026.3.13-1`），version 字段用简化名（如 `v2026.3.13`）
