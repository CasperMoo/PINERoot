import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  App,
  Popconfirm,
  Tag,
  Typography,
  Row,
  Col
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  BellOutlined
} from '@ant-design/icons'
import {
  reminderApi,
  type Reminder,
  type CreateReminderRequest,
  type UpdateReminderRequest,
  type ReminderFrequency,
  type ReminderStatus
} from '@/api/reminder'
import dayjs from 'dayjs'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

/**
 * 频率选项
 */
const FREQUENCY_OPTIONS = [
  { label: '单次', value: 'ONCE' },
  { label: '每天', value: 'DAILY' },
  { label: '每隔 X 天', value: 'EVERY_X_DAYS' },
  { label: '每周', value: 'WEEKLY' },
  { label: '每月', value: 'MONTHLY' },
  { label: '每年', value: 'YEARLY' }
]

/**
 * 星期选项
 */
const WEEKDAY_OPTIONS = [
  { label: '周日', value: 'SUNDAY' },
  { label: '周一', value: 'MONDAY' },
  { label: '周二', value: 'TUESDAY' },
  { label: '周三', value: 'WEDNESDAY' },
  { label: '周四', value: 'THURSDAY' },
  { label: '周五', value: 'FRIDAY' },
  { label: '周六', value: 'SATURDAY' }
]

/**
 * 状态标签颜色
 */
const STATUS_COLORS: Record<ReminderStatus, string> = {
  PENDING: 'blue',
  COMPLETED: 'green'
}

/**
 * 状态标签文本
 */
const STATUS_LABELS: Record<ReminderStatus, string> = {
  PENDING: '待处理',
  COMPLETED: '已完成'
}

/**
 * 提醒事项页面
 */
export default function ReminderPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  // 状态管理
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)

  // 分页和过滤
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [frequencyFilter, setFrequencyFilter] = useState<ReminderFrequency | undefined>()
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | undefined>()

  // 表单状态
  const [selectedFrequency, setSelectedFrequency] = useState<ReminderFrequency>('ONCE')

  // 加载提醒列表
  const loadReminders = async () => {
    setLoading(true)
    try {
      const data = await reminderApi.getList({
        page,
        limit,
        frequency: frequencyFilter,
        status: statusFilter
      })
      setReminders(data.items)
      setTotal(data.total)
    } catch (error: any) {
      message.error(error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadReminders()
  }, [page, limit, frequencyFilter, statusFilter])

  // 打开创建/编辑弹窗
  const openModal = (reminder?: Reminder) => {
    if (reminder) {
      setEditingReminder(reminder)
      const formData: any = {
        title: reminder.title,
        description: reminder.description,
        frequency: reminder.frequency,
        nextTriggerDate: dayjs(reminder.nextTriggerDate)
      }

      // 根据频率类型设置额外字段
      if (reminder.startDate) {
        formData.startDate = dayjs(reminder.startDate)
      }
      if (reminder.interval) {
        formData.interval = reminder.interval
      }
      if (reminder.weekDays) {
        formData.weekDays = reminder.weekDays
      }
      if (reminder.dayOfMonth) {
        formData.dayOfMonth = reminder.dayOfMonth
      }

      setSelectedFrequency(reminder.frequency)
      form.setFieldsValue(formData)
    } else {
      setEditingReminder(null)
      // 创建时,循环提醒默认开始日期为今天
      form.resetFields()
      form.setFieldsValue({
        startDate: dayjs()
      })
      setSelectedFrequency('ONCE')
    }
    setModalVisible(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingReminder) {
        // 更新提醒 - 允许修改所有字段
        const updatePayload: UpdateReminderRequest = {
          title: values.title,
          description: values.description,
          frequency: values.frequency
        }

        // 添加开始日期
        if (values.startDate) {
          updatePayload.startDate = values.startDate.format('YYYY-MM-DD')
        }

        // 根据频率添加额外字段
        if (values.interval) {
          updatePayload.interval = values.interval
        }
        if (values.weekDays) {
          updatePayload.weekDays = values.weekDays
        }
        if (values.dayOfMonth) {
          updatePayload.dayOfMonth = values.dayOfMonth
        }

        // 添加下次触发日期(可选,不传则后端自动重新计算)
        if (values.nextTriggerDate) {
          updatePayload.nextTriggerDate = values.nextTriggerDate.format('YYYY-MM-DD')
        }

        await reminderApi.update(editingReminder.id, updatePayload)
        message.success('提醒更新成功')
      } else {
        // 创建提醒 - 转换日期格式
        const payload: CreateReminderRequest = {
          title: values.title,
          description: values.description,
          frequency: values.frequency
        }

        // 添加开始日期(单次提醒为触发日期,循环提醒为开始日期)
        if (values.startDate) {
          payload.startDate = values.startDate.format('YYYY-MM-DD')
        }

        // 根据频率添加额外字段
        if (values.interval) {
          payload.interval = values.interval
        }
        if (values.weekDays) {
          payload.weekDays = values.weekDays
        }
        if (values.dayOfMonth) {
          payload.dayOfMonth = values.dayOfMonth
        }

        await reminderApi.create(payload)
        message.success('提醒创建成功')
      }

      setModalVisible(false)
      form.resetFields()
      setEditingReminder(null)
      loadReminders()
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      message.error(error.message || '操作失败')
    }
  }

  // 删除提醒
  const handleDelete = async (id: number) => {
    try {
      await reminderApi.delete(id)
      message.success('提醒删除成功')
      loadReminders()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  // 标记完成
  const handleComplete = async (id: number) => {
    try {
      await reminderApi.complete(id)
      message.success('已标记完成')
      loadReminders()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  // 频率类型变化
  const handleFrequencyChange = (value: ReminderFrequency) => {
    setSelectedFrequency(value)
  }

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string | null) => text || '-'
    },
    {
      title: '频率',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 120,
      render: (frequency: ReminderFrequency) => {
        const option = FREQUENCY_OPTIONS.find(opt => opt.value === frequency)
        return option?.label || frequency
      }
    },
    {
      title: '下次触发',
      dataIndex: 'nextTriggerDate',
      key: 'nextTriggerDate',
      width: 120,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ReminderStatus) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Reminder) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleComplete(record.id)}
            disabled={record.status === 'COMPLETED' && record.frequency === 'ONCE'}
          >
            完成
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个提醒吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} className="!mb-4 flex items-center">
            <BellOutlined className="mr-2" />
            提醒事项
          </Title>
        </div>

        {/* 内容区域 */}
        <Card>
          {/* 工具栏 */}
          <div className="mb-4">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openModal()}
                  block
                  className="mb-2 md:mb-0"
                >
                  创建提醒
                </Button>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="筛选频率"
                  allowClear
                  value={frequencyFilter}
                  onChange={setFrequencyFilter}
                  style={{ width: '100%' }}
                  className="mb-2 md:mb-0"
                >
                  {FREQUENCY_OPTIONS.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="筛选状态"
                  allowClear
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="PENDING">待处理</Option>
                  <Option value="COMPLETED">已完成</Option>
                </Select>
              </Col>
            </Row>
          </div>

          {/* 表格 */}
          <Table
            columns={columns}
            dataSource={reminders}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000 }}
            pagination={{
              current: page,
              pageSize: limit,
              total: total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPage(page)
                setLimit(pageSize)
              }
            }}
          />
        </Card>

        {/* 创建/编辑弹窗 */}
        <Modal
          title={editingReminder ? '编辑提醒' : '创建提醒'}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={() => {
            setModalVisible(false)
            form.resetFields()
            setEditingReminder(null)
          }}
          width={600}
          okText="确定"
          cancelText="取消"
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input placeholder="请输入提醒标题" />
            </Form.Item>

            <Form.Item name="description" label="描述">
              <TextArea rows={3} placeholder="请输入描述(可选)" />
            </Form.Item>

            <Form.Item
              name="frequency"
              label="频率"
              rules={[{ required: true, message: '请选择频率' }]}
            >
              <Select
                placeholder="请选择频率"
                onChange={handleFrequencyChange}
              >
                {FREQUENCY_OPTIONS.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 每隔 X 天 - 间隔天数 */}
            {selectedFrequency === 'EVERY_X_DAYS' && (
              <Form.Item
                name="interval"
                label="间隔天数"
                rules={[{ required: true, message: '请输入间隔天数' }]}
              >
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>
            )}

            {/* 每周 - 选择星期 */}
            {selectedFrequency === 'WEEKLY' && (
              <Form.Item
                name="weekDays"
                label="星期"
                rules={[{ required: true, message: '请选择星期' }]}
              >
                <Select mode="multiple" placeholder="请选择星期">
                  {WEEKDAY_OPTIONS.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {/* 每月 - 日期 */}
            {selectedFrequency === 'MONTHLY' && (
              <Form.Item
                name="dayOfMonth"
                label="每月日期"
                rules={[{ required: true, message: '请输入日期' }]}
              >
                <InputNumber
                  min={1}
                  max={31}
                  style={{ width: '100%' }}
                  placeholder="1-31"
                />
              </Form.Item>
            )}

            {/* 单次提醒:触发日期 */}
            {!editingReminder && selectedFrequency === 'ONCE' && (
              <Form.Item
                name="startDate"
                label="触发日期"
                rules={[{ required: true, message: '请选择触发日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择触发日期" />
              </Form.Item>
            )}

            {/* 循环提醒:开始日期(默认今天) */}
            {!editingReminder && selectedFrequency !== 'ONCE' && (
              <Form.Item
                name="startDate"
                label="开始日期"
                tooltip="提醒从哪一天开始生效,默认今天"
              >
                <DatePicker style={{ width: '100%' }} placeholder="默认今天" />
              </Form.Item>
            )}

            {/* 编辑时:开始日期和下次触发日期 */}
            {editingReminder && (
              <>
                {selectedFrequency !== 'ONCE' && (
                  <Form.Item
                    name="startDate"
                    label="开始日期"
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                )}
                <Form.Item
                  name="nextTriggerDate"
                  label="下次触发日期"
                  tooltip="留空则根据频率参数自动重新计算"
                >
                  <DatePicker style={{ width: '100%' }} placeholder="留空自动计算" />
                </Form.Item>
              </>
            )}
          </Form>
        </Modal>
      </div>
    </div>
  )
}
