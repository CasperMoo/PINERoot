# 线上数据库变更操作 SOP

> 本文档规定了所有生产环境数据库变更的标准操作流程，确保数据安全、零停机迁移。

---

## 📋 目录

- [适用场景](#适用场景)
- [前置要求](#前置要求)
- [标准流程](#标准流程)
- [回滚方案](#回滚方案)
- [常见问题](#常见问题)
- [安全检查清单](#安全检查清单)

---

## 适用场景

### 需要遵循本 SOP 的场景

- ✅ 修改 `prisma/schema.prisma` 数据模型
- ✅ 添加/删除/修改表字段
- ✅ 创建/删除索引
- ✅ 修改外键关系
- ✅ 数据迁移和转换

### 不需要本 SOP 的场景

- ❌ 纯代码逻辑修改（不涉及数据库结构）
- ❌ 配置文件修改（如 `.env`）
- ❌ 开发环境/测试环境的迁移

---

## 前置要求

### 1. 环境文件配置

**开发环境**：`.env`

```bash
# 测试数据库（47.94.222.165）
DATABASE_URL=mysql://pine_test:密码@47.94.222.165:3306/pine_test
SHADOW_DATABASE_URL=mysql://pine_test:密码@47.94.222.165:3306/prisma_shadow_pine
```

**生产环境**：`.env.production`

```bash
# 生产数据库（47.94.222.165）
DATABASE_URL=mysql://pine:密码@47.94.222.165:3306/pine
SHADOW_DATABASE_URL=mysql://pine:密码@47.94.222.165:3306/prisma_shadow_pine
NODE_ENV="production"
```

### 2. 必备工具

- [x] Prisma CLI (`npx prisma`)
- [x] 1Panel 数据库管理面板访问权限
- [x] 生产数据库连接凭证

### 3. 权限确认

- [x] 具备生产数据库读写权限
- [x] 可以访问 1Panel 进行备份
- [x] 可以重启生产服务（如需要）

---

## 标准流程

### 步骤 0️⃣：开发环境测试（必须）

**在开发/测试数据库上先验证迁移**

```bash
# 1. 修改 prisma/schema.prisma
# 2. 创建迁移
npx prisma migrate dev --name 描述性名称

# 3. 验证功能
pnpm test
pnpm build

# 4. 检查迁移文件
cat prisma/migrations/XXXXXX_描述性名称/migration.sql
```

**通过标准**：
- ✅ 测试数据库迁移成功
- ✅ 所有测试通过
- ✅ 迁移 SQL 语句已审查，确认无误

---

### 步骤 1️⃣：在 1Panel 备份生产数据库（强制）

**操作步骤**：

1. 登录 1Panel 管理面板
2. 进入 **数据库** → **MySQL** → 找到生产数据库 `pine`
3. 点击 **备份** 按钮
4. 记录备份文件名和时间（例如：`pine_20251113_120000.sql`）

**备份验证**：
- [x] 备份文件已生成
- [x] 备份文件大小正常（非 0 字节）
- [x] 记录备份文件路径

⚠️ **重要**：只有完成备份后才能继续下一步！

---

### 步骤 2️⃣：迁移前验证

**检查生产数据库连接和迁移状态**

```bash
# 测试连接
DATABASE_URL='mysql://pine:密码@47.94.222.165:3306/pine' \
npx prisma migrate status

# 预期输出示例：
# ✅ Database connection successful
# ✅ Following migration have not yet been applied:
#    20251113035246_add_image_tag_soft_delete
```

**检查点**：
- [x] 数据库连接成功
- [x] 待应用的迁移列表正确
- [x] 无异常迁移状态（如 failed、baseline-skip 等）

**如果出现问题**：
- ❌ 连接失败 → 检查 `.env.production` 配置
- ❌ 迁移状态异常 → 联系 DBA 或查看 Prisma 文档

---

### 步骤 3️⃣：执行生产迁移

**使用生产安全命令**

```bash
DATABASE_URL='mysql://pine:密码@47.94.222.165:3306/pine' \
npx prisma migrate deploy
```

**命令说明**：
- ✅ `migrate deploy`：生产环境专用，只应用已有迁移
- ❌ `migrate dev`：**禁止在生产环境使用**（会重置数据库）

**预期输出**：

```
Applying migration `20251113035246_add_image_tag_soft_delete`

The following migration(s) have been applied:
migrations/
  └─ 20251113035246_add_image_tag_soft_delete/
    └─ migration.sql

All migrations have been successfully applied.
```

**成功标志**：
- [x] 输出 `All migrations have been successfully applied.`
- [x] 无错误信息
- [x] 退出码为 0

---

### 步骤 4️⃣：迁移后验证

**验证数据库结构和数据完整性**

```bash
# 1. 确认迁移状态
DATABASE_URL='mysql://pine:密码@47.94.222.165:3306/pine' \
npx prisma migrate status

# 预期输出：Database schema is up to date!

# 2. 验证表结构（根据实际迁移内容调整）
DATABASE_URL='mysql://pine:密码@47.94.222.165:3306/pine' \
npx prisma db execute --schema=prisma/schema.prisma --stdin \
<<< "SHOW COLUMNS FROM 表名;"

# 3. 验证数据完整性（记录数量）
DATABASE_URL='mysql://pine:密码@47.94.222.165:3306/pine' \
npx prisma db execute --schema=prisma/schema.prisma --stdin \
<<< "SELECT COUNT(*) FROM 表名;"
```

**检查点**：
- [x] 迁移状态为 `up to date`
- [x] 新字段/索引已创建
- [x] 数据记录数量不变
- [x] 无数据丢失

---

### 步骤 5️⃣：重启生产服务（如需要）

**何时需要重启**：
- ✅ 添加了新表或新字段
- ✅ 修改了字段类型或约束
- ✅ Prisma Client 需要重新生成

**重启命令**（根据实际部署方式调整）：

```bash
# 方式1：PM2
pm2 restart my-base-service

# 方式2：Docker
docker-compose restart backend

# 方式3：Systemd
systemctl restart my-base-service
```

**重启后验证**：
- [x] 服务启动成功（无崩溃）
- [x] 日志无数据库连接错误
- [x] API 接口正常响应

---

### 步骤 6️⃣：功能测试

**在生产环境测试新功能**

1. 访问相关页面/接口
2. 触发新迁移相关的功能
3. 检查数据写入和读取

**示例测试**（软删除功能）：
- [x] 删除一条记录 → 检查 `deletedAt` 字段已设置
- [x] 列表查询 → 确认已删除记录不显示
- [x] 数据库查询 → 确认记录物理存在但标记为删除

---

## 回滚方案

### 何时需要回滚

- ❌ 迁移执行失败，数据库处于异常状态
- ❌ 迁移成功但导致服务崩溃
- ❌ 发现严重数据错误或业务逻辑问题

### 回滚方法

#### 方法 1：从备份恢复（最安全）

**适用场景**：迁移导致数据损坏或丢失

```bash
# 在 1Panel 中操作：
# 1. 进入数据库管理
# 2. 选择生产数据库
# 3. 点击"恢复"
# 4. 选择步骤1创建的备份文件
# 5. 确认恢复
```

⚠️ **注意**：恢复后会丢失备份时间点之后的所有数据变更！

#### 方法 2：手动回滚迁移（精细控制）

**适用场景**：迁移成功但需要撤销变更

```bash
# 1. 查看迁移记录
DATABASE_URL='...' npx prisma migrate status

# 2. 手动执行回滚 SQL（需要提前准备）
DATABASE_URL='...' npx prisma db execute --stdin <<< "
-- 撤销迁移的反向操作
ALTER TABLE ImageTag DROP INDEX ImageTag_deletedAt_idx;
ALTER TABLE ImageTag DROP COLUMN deletedAt;
"

# 3. 标记迁移为已解决
DATABASE_URL='...' npx prisma migrate resolve --rolled-back 20251113035246_add_image_tag_soft_delete
```

**准备回滚 SQL 示例**：

| 迁移操作               | 回滚 SQL                           |
| ---------------------- | ---------------------------------- |
| `ADD COLUMN`           | `DROP COLUMN`                      |
| `CREATE INDEX`         | `DROP INDEX`                       |
| `ALTER COLUMN` (类型)  | 恢复原类型                         |
| `INSERT INTO` (初始化) | `DELETE FROM` (删除初始化数据)     |

#### 方法 3：Prisma Migrate Resolve（迁移失败处理）

**适用场景**：迁移中途失败，需要清理状态

```bash
# 标记失败的迁移为已回滚
DATABASE_URL='...' npx prisma migrate resolve --rolled-back 迁移名称

# 标记失败的迁移为已应用（如果手动修复了数据库）
DATABASE_URL='...' npx prisma migrate resolve --applied 迁移名称
```

---

## 常见问题

### Q1: 迁移执行时提示 "baseline skip"

**原因**：数据库已存在表结构，但缺少迁移记录

**解决**：
```bash
DATABASE_URL='...' npx prisma migrate resolve --applied baseline
```

### Q2: 迁移失败，提示 "deadlock" 或 "lock timeout"

**原因**：数据库表被锁定（可能有长时间运行的查询）

**解决**：
1. 检查是否有慢查询或事务未提交
2. 等待查询完成后重试
3. 考虑在低峰时段执行迁移

### Q3: 需要修改已应用的迁移怎么办？

**答案**：**禁止修改已应用的迁移文件**

**正确做法**：
```bash
# 创建新的迁移来修正之前的错误
npx prisma migrate dev --name fix_previous_migration
```

### Q4: 开发环境和生产环境迁移不一致

**诊断**：
```bash
# 开发环境
npx prisma migrate status

# 生产环境
DATABASE_URL='...' npx prisma migrate status
```

**解决**：
- 确保使用相同的 `prisma/migrations/` 目录
- 使用 Git 管理迁移文件
- 按时间顺序逐个应用缺失的迁移

---

## 安全检查清单

### 执行前检查（Pre-flight）

- [ ] 已在开发/测试环境验证迁移
- [ ] 已阅读并理解迁移 SQL 内容
- [ ] 已在 1Panel 创建数据库备份
- [ ] 已确认 `.env.production` 配置正确
- [ ] 已确认迁移不会导致数据丢失
- [ ] 已准备回滚方案
- [ ] 已通知团队成员（如有需要）

### 执行中检查（In-flight）

- [ ] 使用 `migrate deploy` 而非 `migrate dev`
- [ ] 观察迁移输出，无错误信息
- [ ] 迁移时间在预期范围内（避免长时间锁表）

### 执行后检查（Post-flight）

- [ ] `migrate status` 显示 `up to date`
- [ ] 数据库表结构符合预期
- [ ] 数据记录数量正确
- [ ] 服务重启成功（如需要）
- [ ] 功能测试通过
- [ ] 日志无异常错误

---

## 高风险操作警告

### 🚨 绝对禁止的操作

1. **在生产环境使用 `migrate dev`**
   ```bash
   # ❌ 错误示例
   DATABASE_URL='生产数据库' npx prisma migrate dev

   # ✅ 正确示例
   DATABASE_URL='生产数据库' npx prisma migrate deploy
   ```

2. **未备份直接迁移**
   - ❌ 跳过备份步骤
   - ✅ 先备份，再迁移

3. **修改已应用的迁移文件**
   - ❌ 编辑 `prisma/migrations/XXXXXX/migration.sql`
   - ✅ 创建新迁移修正错误

4. **在高峰期执行重型迁移**
   - ❌ 工作日白天执行大表索引创建
   - ✅ 选择低峰时段（如凌晨）

### ⚠️ 需谨慎的操作

1. **删除字段**
   - 可能导致旧代码崩溃
   - 建议：先部署兼容代码，再删除字段

2. **修改字段类型**
   - 可能导致数据截断或转换失败
   - 建议：先测试数据转换逻辑

3. **添加 NOT NULL 字段**
   - 如果表有数据，需要提供默认值
   - 建议：先添加可空字段，填充数据后再改为 NOT NULL

4. **大表添加索引**
   - 可能锁表数分钟甚至更久
   - 建议：使用 `ALGORITHM=INPLACE` 或在从库创建后主从切换

---

## 最佳实践

### 1. 迁移命名规范

```bash
# 好的命名：描述性、动词开头
npx prisma migrate dev --name add_user_role_field
npx prisma migrate dev --name create_image_tag_table
npx prisma migrate dev --name add_index_on_user_email

# 不好的命名：无意义
npx prisma migrate dev --name update
npx prisma migrate dev --name fix
```

### 2. 分阶段部署（复杂变更）

**场景**：删除字段或重命名字段

**阶段 1**（代码兼容）：
- 部署支持新旧两种字段的代码
- 新字段可空，同时写入新旧字段

**阶段 2**（数据迁移）：
- 创建迁移，添加新字段
- 数据同步脚本（如果需要）

**阶段 3**（切换到新字段）：
- 部署只使用新字段的代码

**阶段 4**（清理）：
- 删除旧字段的迁移

### 3. 使用 Git 管理迁移

```bash
# 提交迁移文件到版本控制
git add prisma/migrations/
git commit -m "feat: add deletedAt field for soft delete"

# 团队协作：同步迁移
git pull
npx prisma migrate deploy
```

### 4. 环境变量管理

```bash
# 方式1：环境变量文件（推荐）
DATABASE_URL='...' npx prisma migrate deploy

# 方式2：dotenv 加载
export $(cat .env.production | grep -v '^#' | xargs)
npx prisma migrate deploy

# 方式3：Shell 脚本封装
# scripts/migrate-prod.sh
#!/bin/bash
set -e
source .env.production
npx prisma migrate deploy
```

---

## 附录：Prisma 迁移命令速查

| 命令                           | 用途                   | 使用环境     |
| ------------------------------ | ---------------------- | ------------ |
| `prisma migrate dev`           | 创建并应用迁移         | 开发环境     |
| `prisma migrate deploy`        | 应用已有迁移           | 生产环境     |
| `prisma migrate status`        | 查看迁移状态           | 所有环境     |
| `prisma migrate resolve`       | 解决迁移冲突           | 所有环境     |
| `prisma migrate diff`          | 比较数据库与 schema    | 调试         |
| `prisma db push`               | 直接同步 schema        | 原型开发     |
| `prisma db execute`            | 执行自定义 SQL         | 数据修复     |
| `prisma migrate reset`         | 重置数据库             | 仅开发环境   |

---

## 文档更新记录

| 日期       | 版本  | 更新内容                                 | 作者  |
| ---------- | ----- | ---------------------------------------- | ----- |
| 2025-11-13 | v1.0  | 初始版本，基于 ImageTag 软删除迁移实践   | Claude |

---

**记住**：数据库迁移无小事，慎之又慎！遇到不确定的情况，先在测试环境验证，再咨询团队成员。
