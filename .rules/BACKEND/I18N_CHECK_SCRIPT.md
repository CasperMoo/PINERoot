# 后端多语言 SOP

## 标准操作流程

新增或变更多语言文本时，按以下 4 步操作：

### 1️⃣ 扫描

运行检查脚本，扫描硬编码文本：

```bash
pnpm i18n:check
```

脚本会输出文件路径、行号、硬编码文本内容。

### 2️⃣ 检查

查看扫描结果，确认需要国际化的文本：
- 排除已使用 `request.t()` 的代码（脚本已自动过滤）
- 排除调试日志、纯标识符、URL 等（脚本已自动过滤）
- 确认需要翻译的业务文本

### 3️⃣ 翻译

在 `locales/zh-CN.json` 和 `locales/en-US.json` 中添加翻译键：

**翻译键组织规则**：
- `common.*` - 通用错误
- `translation.*` - 翻译服务错误
- `oss.*` - 对象存储错误
- `date.*` - 日期验证错误
- `{模块名}.*` - 业务模块错误（如 `vocabulary.*`、`reminder.*`）

**命名规范**：`模块.功能`（如 `vocabulary.textRequired`）

```json
// locales/zh-CN.json
{
  "vocabulary": {
    "textRequired": "输入文本不能为空"
  }
}

// locales/en-US.json
{
  "vocabulary": {
    "textRequired": "Input text cannot be empty"
  }
}
```

### 4️⃣ 更新

替换代码中的硬编码文本：

**在路由层**（有 `request` 对象）：
```typescript
throw new Error(request.t('vocabulary.textRequired'));
```

**在服务层**（无 `request` 对象）：
```typescript
// 服务函数接收翻译函数作为参数
async function service(text: string, t: TFunction) {
  throw new Error(t('vocabulary.textRequired'));
}

// 路由层调用时传入
await service(body.text, request.t);
```

---

## 快速参考

**扫描命令**：
- `pnpm i18n:check` - 普通模式
- `node scripts/check-i18n.js --strict` - 严格模式（CI/CD）

**翻译文件**：
- `locales/zh-CN.json`
- `locales/en-US.json`

**使用方法**：
- 路由层：`request.t('key')`
- 服务层：通过参数传递 `request.t`