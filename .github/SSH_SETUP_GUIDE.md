# GitHub Actions 自动化部署配置指南

> 本文档指导如何配置 SSH 密钥和 GitHub Secrets，实现前端自动化部署。

## 📋 配置步骤

### 步骤1: 生成 SSH 密钥对（如果还没有的话）

在**本地终端**执行：

```bash
# 生成新的 SSH 密钥对（专门用于 GitHub Actions）
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# 按提示操作：
# 1. 按 Enter（使用默认路径）
# 2. 输入密码（可选，建议留空以便自动化）
# 3. 再次确认密码
```

**生成的文件**：
- `~/.ssh/github_actions_deploy` - 私钥（⚠️ 保密，用于 GitHub Secrets）
- `~/.ssh/github_actions_deploy.pub` - 公钥（部署到服务器）

---

### 步骤2: 将公钥添加到服务器

#### 方式1: 通过命令行（推荐）

```bash
# 将公钥复制到服务器
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub your-username@your-server-ip

# 或者手动复制
cat ~/.ssh/github_actions_deploy.pub
# 复制输出的内容
```

然后登录服务器：

```bash
ssh your-username@your-server-ip

# 在服务器上执行
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "粘贴刚才复制的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### 方式2: 通过 1Panel（如果你习惯用界面）

1. 复制公钥内容：
   ```bash
   cat ~/.ssh/github_actions_deploy.pub
   ```

2. 登录服务器，编辑 `~/.ssh/authorized_keys` 文件，将公钥内容添加进去

---

### 步骤3: 测试 SSH 连接

```bash
# 测试能否使用新密钥连接服务器
ssh -i ~/.ssh/github_actions_deploy your-username@your-server-ip

# 如果能成功登录，说明配置正确 ✅
```

---

### 步骤4: 获取私钥内容

```bash
# 查看私钥内容（用于配置 GitHub Secrets）
cat ~/.ssh/github_actions_deploy
```

**输出示例**：
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBqjC7Q...
...
-----END OPENSSH PRIVATE KEY-----
```

⚠️ **重要**: 完整复制包含 `-----BEGIN` 到 `-----END` 的全部内容！

---

### 步骤5: 配置 GitHub Secrets

1. **打开 GitHub 仓库**
   - 访问你的仓库: `https://github.com/your-username/your-repo`

2. **进入 Settings**
   - 点击仓库顶部的 `Settings` 标签

3. **进入 Secrets 配置**
   - 左侧菜单: `Secrets and variables` > `Actions`

4. **添加以下 Secrets**（点击 `New repository secret`）

   | Name | Value | 说明 |
   |------|-------|------|
   | `SERVER_HOST` | `your-server-ip` | 服务器 IP 地址<br>（如 `123.45.67.89`） |
   | `SERVER_USER` | `your-username` | SSH 登录用户名<br>（如 `root` 或 `ubuntu`） |
   | `SSH_PRIVATE_KEY` | 私钥全部内容 | 步骤4复制的完整私钥<br>（包含 BEGIN/END） |
   | `SERVER_PORT` | `22` | SSH 端口（可选）<br>（默认22，如果没改可以不配置） |

**示例**：

- **SERVER_HOST**:
  ```
  123.45.67.89
  ```

- **SERVER_USER**:
  ```
  root
  ```

- **SSH_PRIVATE_KEY**:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
  ...（完整的私钥内容）...
  -----END OPENSSH PRIVATE KEY-----
  ```

---

### 步骤6: 验证配置

#### 6.1 提交代码触发部署

```bash
# 在项目根目录
git add .github/workflows/deploy-frontend.yml
git commit -m "ci: 添加前端自动化部署 workflow"
git push origin master
```

#### 6.2 查看部署状态

1. 访问 GitHub 仓库的 `Actions` 标签页
2. 查看 "Deploy Frontend" workflow 运行状态
3. 点击进入查看详细日志

**成功标志**：
- ✅ 所有步骤都是绿色勾号
- ✅ 最后显示 "Frontend deployed successfully!"
- ✅ 访问 https://mumumumu.net 可以看到最新内容

---

## 🔍 常见问题排查

### 问题1: `Permission denied (publickey)`

**原因**: 公钥未正确添加到服务器

**解决**:
```bash
# 在服务器上检查
cat ~/.ssh/authorized_keys
# 确认公钥内容存在

# 检查权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

### 问题2: `rm: cannot remove 'xxx': Permission denied`

**原因**: GitHub Actions 没有权限删除服务器上的文件

**解决**:
```bash
# 在服务器上检查目标目录权限
ls -la /www/sites/mumumumu.net/

# 确保部署用户有写入权限
chown -R your-username:your-username /www/sites/mumumumu.net/index/
chmod -R 755 /www/sites/mumumumu.net/index/
```

---

### 问题3: 部署成功但网站没更新

**原因**: 浏览器缓存

**解决**:
```bash
# 1. 硬刷新浏览器 (Ctrl+Shift+R 或 Cmd+Shift+R)
# 2. 或者清除浏览器缓存
# 3. 或者访问时添加时间戳参数: https://mumumumu.net?t=123
```

---

### 问题4: workflow 没有触发

**原因**: 可能是因为只修改了非 frontend/ 目录的文件

**解决**:
```bash
# 检查 workflow 配置的触发路径
# .github/workflows/deploy-frontend.yml 中的:
# paths:
#   - 'frontend/**'

# 只有修改 frontend/ 目录下的文件才会触发部署
```

---

## 📊 部署流程示意

```
本地修改前端代码
    ↓
git commit & push
    ↓
GitHub 检测到 frontend/ 变化
    ↓
触发 Actions workflow
    ↓
自动执行:
  1. Checkout 代码
  2. 安装 Node.js & pnpm
  3. pnpm install
  4. pnpm build
  5. SCP 上传到服务器
    ↓
部署完成 ✅
    ↓
访问 https://mumumumu.net 查看最新版本
```

---

## 🎯 安全建议

1. **SSH 密钥管理**
   - ✅ 为 GitHub Actions 单独生成密钥（不要用个人密钥）
   - ✅ 定期轮换密钥（建议每6个月）
   - ✅ 不要将私钥提交到 Git 仓库

2. **服务器安全**
   - ✅ 只给部署用户最小权限
   - ✅ 考虑使用专门的部署用户（而非 root）
   - ✅ 定期审计 `authorized_keys` 文件

3. **GitHub Secrets**
   - ✅ Secrets 一旦创建就无法查看（只能更新）
   - ✅ 只有仓库管理员可以管理 Secrets
   - ✅ Actions 日志会自动隐藏 Secrets 内容

---

## 🚀 高级配置（可选）

### 添加部署通知

在 workflow 中添加通知步骤：

```yaml
- name: Notify Success
  if: success()
  run: |
    # 这里可以添加通知逻辑
    # 比如发送邮件、Slack 消息等
    echo "部署成功！"

- name: Notify Failure
  if: failure()
  run: |
    echo "部署失败，请检查日志"
```

### 部署到多个环境

```yaml
# 根据分支部署到不同环境
on:
  push:
    branches:
      - master      # 生产环境
      - develop     # 测试环境

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # ...
      - name: Deploy to Production
        if: github.ref == 'refs/heads/master'
        # 部署到生产服务器

      - name: Deploy to Staging
        if: github.ref == 'refs/heads/develop'
        # 部署到测试服务器
```

---

## 📚 相关文档

- GitHub Actions 文档: https://docs.github.com/en/actions
- SCP Action 文档: https://github.com/appleboy/scp-action
- SSH 密钥生成指南: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

---

**配置完成后，每次推送前端代码到 master 分支，都会自动部署到服务器！** 🎉
