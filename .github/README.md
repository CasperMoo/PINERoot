# GitHub Actions 自动化部署

本目录包含项目的 CI/CD 自动化配置。

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `workflows/deploy-frontend.yml` | 前端自动化部署 workflow |
| `SSH_SETUP_GUIDE.md` | SSH 密钥配置详细指南 |

## 🚀 快速开始

### 前端自动化部署

**状态**: ✅ 已配置，待激活

**触发条件**: 推送到 `master` 分支且修改了 `frontend/` 目录

**配置步骤**:

1. **查看详细配置指南**
   ```bash
   cat .github/SSH_SETUP_GUIDE.md
   ```

2. **生成 SSH 密钥**
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
   ```

3. **将公钥添加到服务器**
   ```bash
   ssh-copy-id -i ~/.ssh/github_actions_deploy.pub your-username@your-server-ip
   ```

4. **在 GitHub 配置 Secrets**

   访问: `Settings` > `Secrets and variables` > `Actions` > `New repository secret`

   添加以下 4 个 Secrets:
   - `SERVER_HOST` - 服务器 IP
   - `SERVER_USER` - SSH 用户名
   - `SSH_PRIVATE_KEY` - SSH 私钥（完整内容）
   - `SERVER_PORT` - SSH 端口（可选，默认 22）

5. **测试部署**
   ```bash
   # 修改前端代码并推送
   cd frontend
   echo "// test" >> src/App.tsx
   git add .
   git commit -m "test: 测试自动化部署"
   git push origin master

   # 访问 GitHub Actions 查看部署状态
   ```

## 📊 部署流程

```
修改前端代码
    ↓
git commit & push
    ↓
GitHub Actions 触发
    ↓
自动执行:
  1. Checkout 代码
  2. 安装依赖
  3. Build 项目
  4. SCP 上传到服务器
    ↓
部署完成 ✅
```

## 🔍 监控部署

- **查看部署状态**: GitHub 仓库 > `Actions` 标签页
- **查看部署日志**: 点击具体的 workflow run
- **部署历史**: Actions 页面显示所有历史部署记录

## 📚 相关文档

- 详细配置指南: [SSH_SETUP_GUIDE.md](./SSH_SETUP_GUIDE.md)
- 前端部署规范: [../.rules/FRONTEND/DEPLOYMENT.md](../.rules/FRONTEND/DEPLOYMENT.md)
- GitHub Actions 官方文档: https://docs.github.com/en/actions

## ⚠️ 注意事项

1. **首次配置**需要手动设置 SSH 密钥和 GitHub Secrets
2. **只有修改 `frontend/` 目录**才会触发前端部署
3. **部署失败**时，GitHub 会发送邮件通知
4. **私钥安全**：不要将私钥提交到 Git 仓库

---

**配置完成后，每次推送前端代码都会自动部署！** 🎉
