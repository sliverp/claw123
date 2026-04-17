# Update OpenClaw Issue Rate Chart

当 openclaw/openclaw 发布新 release 后，更新 issue 变化率图表数据。

## 触发方式

用户提到要更新 openclaw issue 图表、添加新 release 数据、或提供新的 release 版本号。

## 数据文件

- 数据源: `claw123/public/openclaw-issue-rate.json`
- 图表页面: `claw123/public/openclaw-issue-rate.html`（无需修改，自动从 JSON 加载）

## 完整流程

### Step 1: 获取最新 release 列表

```bash
gh release list --repo openclaw/openclaw --limit 10 2>&1 | cat
```

找到 JSON 中尚未收录的新正式版 release（忽略 Pre-release/beta）。

### Step 2: 确定每个新 release 的日期

从 release list 输出中提取发布日期（UTC），取日期部分（YYYY-MM-DD）。

### Step 3: 查询截至该日期的累计 issue 数

对每个新 release 日期，用 GitHub Search API 查询：

```bash
# 累计创建的 issue 总数（截至该日期）
gh api "search/issues?q=repo:openclaw/openclaw+is:issue+created:<=YYYY-MM-DD&per_page=1" --jq .total_count

# 累计关闭的 issue 总数（截至该日期）
gh api "search/issues?q=repo:openclaw/openclaw+is:issue+is:closed+closed:<=YYYY-MM-DD&per_page=1" --jq .total_count
```

**注意**: GitHub Search API 有速率限制，每次查询间隔至少 2 秒。

### Step 4: 追加数据到 JSON

读取 `claw123/public/openclaw-issue-rate.json`，在数组末尾追加新条目：

```json
{
  "version": "v2026.X.XX",
  "date": "YYYY-MM-DD",
  "created": <累计创建总数>,
  "closed": <累计关闭总数>
}
```

**要求**:
- 保持数组按日期升序排列
- 不要重复添加已存在的版本
- `version` 字段从 release tag 中提取（如 `v2026.4.15`）
- `date` 为 release 的发布日期（UTC）

### Step 5: 验证

- 确认 JSON 格式正确（可用 `python3 -c "import json; json.load(open('path'))"` 验证）
- 确认新数据的 `created` 和 `closed` 值大于前一条记录（累计值应单调递增）
- 确认 `created >= closed`

## JSON 数据格式参考

```json
[
  {"version":"v2026.2.19","date":"2026-02-19","created":9978,"closed":5824},
  {"version":"v2026.4.15","date":"2026-04-16","created":29437,"closed":17142}
]
```

每条记录包含:
- `version`: release 版本号
- `date`: 发布日期
- `created`: 截至该日期的累计创建 issue 总数
- `closed`: 截至该日期的累计关闭 issue 总数

图表页面会自动计算导数（变化率）、净 Open 数、关闭率等衍生指标。

## 注意事项

- 只需修改 JSON 文件，HTML 页面无需任何改动
- JSON 文件路径: `claw123/public/openclaw-issue-rate.json`
- 如果一次要添加多个 release，注意 API 速率限制，每次查询间隔 2 秒
- 数据准确性很重要：GitHub Search API 的结果可能有轻微延迟，建议 release 后等待至少 1 小时再查询
