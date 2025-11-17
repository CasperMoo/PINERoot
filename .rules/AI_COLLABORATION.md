# AI 协作规范

> 本文档定义 AI 工具（Claude、Cursor、Windsurf 等）的协作规范和 Git 工作流。

## AI 工作流程

### 标准流程

```
1. 收到任务
   ↓
2. 阅读 CLAUDE.md 确定文档
   ↓
3. 阅读对应的 .rules/ 文档
   ↓
4. 规划任务（使用 TodoWrite 工具）
   ↓
5. 执行任务（创建新文件优先）
   ↓
6. Git验证改动
   ↓
7. 测试功能
   ↓
8. 更新文档（如有新的已完成模块）
```

### 每次开始前的检查清单

- [ ] 我读了 `CLAUDE.md`（本文档）
- [ ] 我读了对应的规则文档（BACKEND/ 或 FRONTEND/）
- [ ] 我理解了禁止修改的模块
- [ ] 我会用 Git 验证改动范围
- [ ] 我会在提交前运行测试

## 开发规范

### 1. 添加新功能

**✅ 推荐做法**：创建新文件

```bash
# 后端：创建新路由文件
src/routes/newFeature.ts

# 前端：创建新页面目录
src/pages/NewFeature/index.tsx
```

**❌ 避免**：修改已完成模块

```bash
# 不要直接修改已完成的文件
src/routes/auth.ts  # 禁止修改（除非得到确认）
```

### 2. 需要修改已完成模块

如果必须修改已完成模块：

1. **先说明原因**
   ```
   需要修改 src/routes/auth.ts 的原因：
   - 添加新的用户角色（MODERATOR）
   - 影响范围：roleAuth.ts 也需要更新
   - 测试计划：运行所有认证相关测试
   ```

2. **等待确认**
   - 说明影响范围
   - 提供替代方案（如有）
   - 承诺测试覆盖

3. **得到确认后再修改**

### 3. 每次开始开发新功能前的标准开场白

#### 后端开发

```
【项目上下文】
1. 先阅读 CLAUDE.md 确定任务类型
2. 阅读 .rules/BACKEND/README.md 确定要读哪些子文档
3. 技术栈：Fastify + TypeScript + Prisma + MySQL
4. 后端API：https://api.mumumumu.net
5. 已完成模块：[查看 BACKEND/MODULES.md]

【本次任务】
[具体描述要做什么]

【要求】
1. 遵循 BACKEND/DEVELOPMENT.md 中的代码规范
2. 只创建新文件，不修改已完成模块
3. 使用TypeScript，所有类型必须定义
4. 如果必须修改已有文件，先说明原因

【开始】
[具体需求]
```

#### 前端开发

```
【项目上下文】
1. 先阅读 CLAUDE.md 确定任务类型
2. 阅读 .rules/FRONTEND/README.md 确定要读哪些子文档
3. 技术栈：React + Vite + TypeScript + Ant Design + Tailwind
4. 后端API：https://api.mumumumu.net
5. 已完成模块：[查看 FRONTEND/MODULES.md]

【本次任务】
[具体描述要做什么]

【要求】
1. 遵循 FRONTEND/DEVELOPMENT.md 中的代码规范
2. 只创建新文件，不修改已完成模块
3. 使用TypeScript，所有类型必须定义
4. 响应式设计：支持移动/平板/PC
5. 如果必须修改已有文件，先说明原因

【开始】
[具体需求]
```

### 4. 组件开发规范

- ✅ 一次只让 AI 生成一个页面或组件
- ✅ 文件不超过 200 行，超过就拆分
- ✅ 生成后立即用 Git 验证改动范围

### 5. 验证改动范围

**每次修改后必须运行**：

```bash
# 查看改动的文件
git status

# 查看具体改动内容
git diff

# 确认：
# 1. 是否误改了已完成模块
# 2. 改动范围是否符合预期
# 3. 是否有意外的文件被修改
```

## Git 工作流

### 提交规范

#### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type（必须）**：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修改bug的代码变动）
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动

**Scope（可选）**：
- 后端：`auth`, `image`, `activity`, `database` 等
- 前端：`login`, `dashboard`, `ui`, `api` 等

**Subject（必须）**：
- 简短描述（不超过 50 字符）
- 使用祈使句（"add" 而不是 "added"）
- 不要大写首字母
- 结尾不加句号

**示例**：
```bash
# ✅ 好的 commit message
feat(auth): add password reset functionality
fix(image): resolve upload failure on large files
docs(backend): update API documentation for v2

# ❌ 不好的 commit message
update
fix bug
改了一些东西
```

### 分支管理

#### 主分支

- `main` / `master`: 生产环境代码
- `develop`: 开发环境代码（如有）

#### 功能分支

```bash
# 创建功能分支
git checkout -b feature/add-user-profile

# 开发功能...

# 提交代码
git add .
git commit -m "feat(user): add user profile page"

# 推送到远程
git push origin feature/add-user-profile
```

#### 修复分支

```bash
# 创建修复分支
git checkout -b fix/login-error

# 修复 bug...

# 提交代码
git add .
git commit -m "fix(auth): resolve login redirect issue"

# 推送到远程
git push origin fix/login-error
```

### 提交前验证

```bash
# 1. 查看改动
git status
git diff

# 2. 运行测试（后端）
pnpm test:ci

# 3. 运行构建（确保没有类型错误）
pnpm build

# 4. 提交代码
git add .
git commit -m "feat: add new feature"
```

### 提交代码的完整流程

```bash
# 开发新功能
git checkout -b feature/new-feature

# 验证改动
git status
git diff

# 运行测试
pnpm test:ci  # 后端
pnpm build    # 前端

# 提交
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 自动触发 CI/CD 部署（如配置）
```

## Git 提交（AI 专用流程）

⚠️ **重要**：只在用户明确要求时才创建提交。

### 何时创建提交

- ✅ 用户明确说"提交代码"、"创建 commit"
- ✅ 用户说"完成后提交"
- ❌ 不要主动提交（即使代码完成）

### 提交流程

当用户要求创建提交时，遵循以下步骤：

#### 1. 并行运行 Git 命令

```bash
# 同时运行以下命令（在一个响应中）
git status
git diff
git log --oneline -5
```

#### 2. 分析改动并起草 commit message

基于 git diff 和 git status 的结果：

- 总结改动的性质（feat/fix/docs/refactor 等）
- 确定 scope（如 auth, image, ui 等）
- 起草简洁的描述（1-2 句话，关注"为什么"而不是"是什么"）
- 参考 git log 的风格保持一致

#### 3. 并行运行：添加文件 + 创建提交 + 查看状态

```bash
# 添加改动的文件
git add .

# 创建提交（使用 HEREDOC 格式化 message）
git commit -m "$(cat <<'EOF'
feat(scope): short description

Detailed explanation if needed.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 提交后查看状态
git status
```

**注意**：
- ✅ 使用 HEREDOC 格式化 commit message
- ✅ 添加 Claude Code 署名
- ❌ 不要跳过 hooks（`--no-verify`）
- ❌ 不要修改 git config
- ❌ 不要 force push 到 main/master

#### 4. 处理 pre-commit hook 失败

如果 pre-commit hook 修改了文件：

```bash
# 1. 检查 authorship
git log -1 --format='%an %ae'

# 2. 检查是否已推送
git status  # 应该显示 "Your branch is ahead"

# 3. 如果两者都满足，amend commit
git add .
git commit --amend --no-edit

# 4. 如果不满足，创建新 commit
git add .
git commit -m "chore: apply pre-commit hook changes"
```

### 推送代码

**不要主动推送**，除非用户明确要求。

如果用户要求推送：

```bash
# 推送到远程
git push origin <branch-name>

# 如果是新分支，使用 -u 参数
git push -u origin <branch-name>
```

## 创建 Pull Request（AI 专用流程）

⚠️ **重要**：只在用户明确要求时才创建 PR。

### 何时创建 PR

- ✅ 用户明确说"创建 PR"、"创建 pull request"
- ✅ 用户说"准备合并"
- ❌ 不要主动创建 PR

### PR 创建流程

#### 1. 并行运行 Git 命令（了解分支状态）

```bash
# 同时运行以下命令
git status
git diff
git log <base-branch>...HEAD  # 查看所有将被包含的 commits
git diff <base-branch>...HEAD  # 查看所有改动
```

**重要**：必须查看**所有** commits，不仅仅是最新的！

#### 2. 分析所有改动并起草 PR 描述

基于所有 commits 和 diff：

- 总结所有改动（不仅仅是最新 commit）
- 列出关键变更点（2-5 个 bullet points）
- 提供测试计划

#### 3. 并行运行：创建分支（如需要）+ 推送 + 创建 PR

```bash
# 如果需要创建新分支
git checkout -b feature/new-feature

# 推送到远程（带 -u 参数）
git push -u origin feature/new-feature

# 使用 gh cli 创建 PR
gh pr create --title "feat: add new feature" --body "$(cat <<'EOF'
## Summary
- Added feature A
- Updated feature B
- Fixed bug C

## Test plan
- [ ] Test feature A on mobile
- [ ] Test feature B on desktop
- [ ] Verify API calls work correctly

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**注意**：
- ✅ 使用 HEREDOC 格式化 PR body
- ✅ 包含所有改动的总结（不仅仅是最新 commit）
- ✅ 提供测试计划
- ✅ 添加 Claude Code 署名
- ✅ PR 创建后返回 PR URL

## 常见场景

### 场景1：添加新 API 端点

```bash
# 1. 创建功能分支
git checkout -b feature/add-user-api

# 2. 开发功能（创建新文件）
# src/routes/user.ts
# src/services/user.ts
# tests/integration/user.test.ts

# 3. 验证改动
git status
git diff

# 4. 运行测试
pnpm test:ci

# 5. 提交代码
git add .
git commit -m "feat(user): add user management API"

# 6. 推送代码（如用户要求）
git push -u origin feature/add-user-api
```

### 场景2：修复 bug

```bash
# 1. 创建修复分支
git checkout -b fix/login-redirect

# 2. 修复 bug
# 修改相关文件...

# 3. 验证改动
git status
git diff

# 4. 运行测试
pnpm test:ci

# 5. 提交代码
git add .
git commit -m "fix(auth): resolve login redirect issue

- Fixed redirect URL after successful login
- Added test case for redirect behavior

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 6. 推送代码（如用户要求）
git push -u origin fix/login-redirect
```

### 场景3：更新文档

```bash
# 1. 创建文档分支
git checkout -b docs/update-api-docs

# 2. 更新文档
# .rules/BACKEND/MODULES.md

# 3. 验证改动
git status
git diff

# 4. 提交代码
git add .
git commit -m "docs(backend): update module documentation"

# 5. 推送代码（如用户要求）
git push -u origin docs/update-api-docs
```

## 禁止的操作

### ❌ 绝对禁止

1. **修改 git config**
   ```bash
   git config user.name "..."  # 禁止！
   ```

2. **运行破坏性命令**
   ```bash
   git push --force main  # 禁止！
   git reset --hard       # 禁止！
   git rebase -i          # 禁止！（需要交互）
   ```

3. **跳过 hooks**
   ```bash
   git commit --no-verify  # 禁止！（除非用户明确要求）
   ```

4. **未经用户确认就提交/推送**
   ```bash
   # ❌ 不要主动提交
   # ❌ 不要主动推送
   # ❌ 不要主动创建 PR
   ```

### ⚠️ 需谨慎

1. **Amend commit**
   - 只在以下情况使用：
     - 用户明确要求 amend
     - Pre-commit hook 修改了文件且满足条件
   - 使用前必须检查 authorship 和是否已推送

2. **Force push**
   - 只在用户明确要求时使用
   - 绝不 force push 到 main/master
   - 警告用户风险

## 测试环境管理

### 数据库隔离机制

项目采用**开发/测试数据库完全分离**的策略：

```bash
# 开发数据库（用于日常开发）
pine_test

# 测试数据库（仅用于测试）
pine_test_case
```

### 测试执行命令

```bash
# 标准测试
pnpm test:ci

# 完整测试流程（同步数据库 + 运行测试）
pnpm test:full

# 仅同步测试数据库结构
pnpm test:sync-db
```

### 测试数据创建流程

#### 1. 创建测试账户

```bash
# 创建 Admin 账户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser1@example.com", "password": "123456", "name": "测试用户1"}'

# 创建多个测试账户（User 角色）
# testuser2@example.com, testuser3@example.com
```

#### 2. 账户信息配置

将测试账户信息添加到 `.env` 文件：

```bash
# 测试账户信息
TEST_USER1_EMAIL=testuser1@example.com
TEST_USER1_PASSWORD=123456
TEST_USER1_ID=1536
TEST_USER1_TOKEN=<登录后获取的token>

TEST_USER2_EMAIL=testuser2@example.com
TEST_USER2_PASSWORD=123456
TEST_USER2_ID=1537
TEST_USER2_TOKEN=<登录后获取的token>

TEST_USER3_EMAIL=testuser3@example.com
TEST_USER3_PASSWORD=123456
TEST_USER3_ID=1538
TEST_USER3_TOKEN=<登录后获取的token>
```

#### 3. 创建图片标签

```bash
# 使用 Admin Token 创建标签
curl -X POST http://localhost:3000/api/image-tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"name": "anchor_2024"}'

curl -X POST http://localhost:3000/api/image-tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"name": "anchor_2023"}'

curl -X POST http://localhost:3000/api/image-tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"name": "anchor_2022"}'
```

#### 4. 上传测试图片

```bash
# 上传图片到指定标签
curl -X POST http://localhost:3000/api/images/upload \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -F "tagId=1344" \
  -F "file=@/path/to/image.jpg"
```

#### 5. 创建活动配置

```bash
# 创建 Halloween 活动配置
curl -X POST http://localhost:3000/api/activity-configs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "activityId": "anchor_halloween",
    "config": {
      "galleries": [
        {
          "imageTag": "anchor_2024",
          "name": "🎃 Halloween 2024"
        },
        {
          "imageTag": "anchor_2023",
          "name": "🎃 Halloween 2023"
        },
        {
          "imageTag": "anchor_2022",
          "name": "🎃 Halloween 2022"
        }
      ]
    }
  }'
```

### 数据库同步脚本

当 Schema 变更时，确保测试数据库结构同步：

```bash
# 运行同步脚本
tsx scripts/sync-test-db.ts

# 或者使用快捷命令
pnpm test:sync-db
```

### 测试验证步骤

1. **验证数据库隔离**：
   ```bash
   # 检查开发数据库中的数据是否完整
   # 运行测试后检查开发数据是否被清理
   ```

2. **验证 API 功能**：
   ```bash
   # 测试 Halloween 相册接口
   curl http://localhost:3000/api/anchor/halloween/galleries
   curl "http://localhost:3000/api/anchor/halloween/images?tagName=anchor_2024"
   ```

3. **验证前端功能**：
   - 访问 Halloween 相册页面
   - 测试图片加载和动画效果
   - 验证相册切换功能

### 常见测试场景

#### Halloween 相册测试数据

完整测试数据包括：
- **3 个测试用户**（1个 Admin + 2 个 User）
- **3 个图片标签**（anchor_2022/2023/2024）
- **40 张测试图片**（平均分配到各标签）
- **1 个活动配置**（Halloween 相册配置）

#### 数据隔离验证

```bash
# 1. 在开发数据库创建测试数据
# 2. 运行 pnpm test:ci
# 3. 验证开发数据未被影响
# 4. 验证测试数据库有对应的测试数据
```

## 相关文档

- 项目概述：`PROJECT_OVERVIEW.md`
- 后端规范：`BACKEND/README.md`
- 前端规范：`FRONTEND/README.md`
- 数据库迁移：`DATABASE_MIGRATION.md`
