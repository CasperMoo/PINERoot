# 人设创建功能设计文档

**目标**: 在前端 Chat 调试页面添加人设创建功能，让 Admin 用户可以方便地创建和切换聊天人设。

## 功能概述

在 Chat 调试页面的 DebugPanel 中添加"创建人设"按钮，点击后弹出 Modal 对话框。用户可以选择预设模板或手动输入人设信息，创建成功后自动切换到新人设。

## 组件结构

### 1. CreatePersonaModal 组件 (新建)

**文件**: `frontend/src/pages/Super/Chat/CreatePersonaModal.tsx`

**Props**:
```typescript
interface CreatePersonaModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (personaId: number) => void;
  personas: PersonaTemplate[];
}
```

**功能**:
- 展示预设卡片区域（3-5 个卡片）
- 表单输入区域（名称、描述、提示词）
- 表单验证和提交
- Loading 状态管理

**预设卡片数据**:
```typescript
// 可选：放在单独文件 frontend/src/pages/Super/Chat/presets.ts
export const PERSONA_PRESETS = [
  {
    name: '温柔倾听者',
    description: '温暖陪伴，善于倾听和理解用户的心声',
    prompt: '你是一个温暖、善解人意的朋友，愿意倾听用户的心声，给予情感支持和陪伴。请用温和、真诚的语气与用户交流，像一个知心朋友一样。'
  },
  {
    name: '专业顾问',
    description: '提供专业建议和深度分析',
    prompt: '你是一位专业顾问，能够提供深入的分析和建议。请用专业、客观的语气回答问题，并在适当时候提出启发性问题。'
  },
  {
    name: '幽默伙伴',
    description: '轻松愉快，幽默风趣的聊天伙伴',
    prompt: '你是一个幽默风趣的聊天伙伴，喜欢用轻松愉快的方式交流。可以适当使用幽默和玩笑，让对话更加生动有趣。'
  }
];
```

**表单字段**:
- **名称** (name): Input，必填，1-100 字符
- **描述** (description): TextArea，可选，0-500 字符
- **提示词** (prompt): TextArea，必填，1-10000 字符

### 2. DebugPanel 组件修改

**文件**: `frontend/src/pages/Super/Chat/DebugPanel.tsx`

**改动**:
- 在模型和人设选择器旁添加"创建人设"按钮
- 添加 `onCreatePersona` 回调 prop
- 新增 Button 组件，使用 Ant Design 的 PlusOutlined 图标

## 数据流

```
用户点击"创建人设"按钮
  ↓
打开 CreatePersonaModal
  ↓
用户选择预设卡片（自动填充表单）
  ↓
用户编辑/确认表单内容
  ↓
点击"创建"按钮
  ↓
调用 createPersonaTemplate API
  ↓
成功后：
  - 显示成功提示
  - 调用 changePersona(newId) 切换
  - 刷新 personas 列表
  - 关闭 Modal
```

## 状态管理

使用 React hooks 进行状态管理：

```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
const [form] = Form.useForm();
const [loading, setLoading] = useState(false);
```

## 表单验证

使用 Ant Design Form 的 rules 属性：

```typescript
const rules = {
  name: [
    { required: true, message: '请输入人设名称' },
    { min: 1, max: 100, message: '名称长度为 1-100 个字符' }
  ],
  description: [
    { max: 500, message: '描述最多 500 个字符' }
  ],
  prompt: [
    { required: true, message: '请输入提示词' },
    { min: 1, max: 10000, message: '提示词长度为 1-10000 个字符' }
  ]
};
```

## 错误处理

### API 错误
- 创建失败：显示错误 message，保持 Modal 打开
- 网络超时：提示"网络错误，请重试"
- 权限错误（403/401）：提示并跳转登录

### 边界情况
- 重复名称：后端验证
- 提示词过长：前端限制 + 后端验证
- 创建后列表未更新：重新获取 personas 列表

## Loading 状态

- 创建中：按钮显示 loading 状态
- 禁用表单输入和取消按钮
- 防止重复提交

## UI/UX 细节

### 预设卡片样式
- 卡片式布局，hover 效果
- 选中状态：高亮边框
- 点击后自动填充表单

### Modal 布局
- 宽度：600-800px
- 预设区域：可横向滚动或网格布局
- 表单区域：垂直排列，间距合理

### 成功反馈
- message.success 显示创建成功提示
- 自动切换到新人设
- DebugPanel 中的下拉框自动更新

## 测试要点

1. 选择预设后表单正确填充
2. 手动修改预设内容后能正常提交
3. 表单验证规则生效
4. 创建成功后自动切换
5. 创建失败时错误提示正确
6. Loading 状态正常显示
7. 取消操作清空表单

## 实现文件清单

### 新建文件
- `frontend/src/pages/Super/Chat/CreatePersonaModal.tsx`
- `frontend/src/pages/Super/Chat/presets.ts` (可选)

### 修改文件
- `frontend/src/pages/Super/Chat/DebugPanel.tsx`
- `frontend/src/pages/Super/Chat/index.tsx` (传递回调)

## API 使用

使用现有的 `createPersonaTemplate` API：

```typescript
import { createPersonaTemplate } from '@/api/persona';

const result = await createPersonaTemplate({
  name: values.name,
  description: values.description,
  prompt: values.prompt
});
```

## 后续优化

- 考虑添加人设编辑功能
- 考虑添加人设删除功能（已实现 API）
- 考虑添加人设预览功能
- 考虑添加预设管理功能（让 Admin 自定义预设）
