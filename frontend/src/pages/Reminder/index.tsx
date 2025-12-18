import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
import {
  getReminderDisplayInfo,
  type DisplayStatus
} from '@/utils/reminderHelper'
import dayjs from 'dayjs'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select


/**
 * 提醒事项页面
 */
export default function ReminderPage() {
  const { t } = useTranslation('reminder')
  const { message } = App.useApp()
  const [form] = Form.useForm()

  // 动态选项
  const frequencyOptions = [
    { label: t('frequency.once'), value: 'ONCE' },
    { label: t('frequency.daily'), value: 'DAILY' },
    { label: t('frequency.everyXDays'), value: 'EVERY_X_DAYS' },
    { label: t('frequency.weekly'), value: 'WEEKLY' },
    { label: t('frequency.monthly'), value: 'MONTHLY' },
    { label: t('frequency.yearly'), value: 'YEARLY' }
  ]

  const weekDayOptions = [
    { label: t('weekDays.sunday'), value: 'SUNDAY' },
    { label: t('weekDays.monday'), value: 'MONDAY' },
    { label: t('weekDays.tuesday'), value: 'TUESDAY' },
    { label: t('weekDays.wednesday'), value: 'WEDNESDAY' },
    { label: t('weekDays.thursday'), value: 'THURSDAY' },
    { label: t('weekDays.friday'), value: 'FRIDAY' },
    { label: t('weekDays.saturday'), value: 'SATURDAY' }
  ]

  const displayStatusOptions = [
    { label: t('status.triggerToday'), value: 'TRIGGER_TODAY' },
    { label: t('status.overdue'), value: 'OVERDUE' },
    { label: t('status.completedToday'), value: 'COMPLETED_TODAY' },
    { label: t('status.notStarted'), value: 'NOT_STARTED' },
    { label: t('status.completed'), value: 'COMPLETED' }
  ]

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
  const [displayStatusFilter, setDisplayStatusFilter] = useState<DisplayStatus | undefined>()

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

      // 如果有显示状态筛选，进行前端过滤
      let filteredItems = data.items
      if (displayStatusFilter) {
        filteredItems = data.items.filter(item => {
          const displayInfo = getReminderDisplayInfo(item)
          return displayInfo.displayStatus === displayStatusFilter
        })
      }

      setReminders(filteredItems)
      setTotal(displayStatusFilter ? filteredItems.length : data.total)
    } catch (error: any) {
      message.error(error.message || t('action.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadReminders()
  }, [page, limit, frequencyFilter, statusFilter, displayStatusFilter])

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
        message.success(t('action.updateSuccess'))
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
        message.success(t('action.createSuccess'))
      }

      setModalVisible(false)
      form.resetFields()
      setEditingReminder(null)
      loadReminders()
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      message.error(error.message || t('action.operationFailed'))
    }
  }

  // 删除提醒
  const handleDelete = async (id: number) => {
    try {
      await reminderApi.delete(id)
      message.success(t('action.deleteSuccess'))
      loadReminders()
    } catch (error: any) {
      message.error(error.message || t('action.deleteFailed'))
    }
  }

  // 标记完成
  const handleComplete = async (id: number) => {
    try {
      await reminderApi.complete(id)
      message.success(t('action.markCompletedSuccess'))
      loadReminders()
    } catch (error: any) {
      message.error(error.message || t('action.operationFailed'))
    }
  }

  // 频率类型变化
  const handleFrequencyChange = (value: ReminderFrequency) => {
    setSelectedFrequency(value)
  }

  // 表格列定义
  const columns = [
    {
      title: t('table.title'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: t('table.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string | null) => text || '-'
    },
    {
      title: t('table.frequency'),
      dataIndex: 'frequency',
      key: 'frequency',
      width: 120,
      render: (frequency: ReminderFrequency) => {
        const option = frequencyOptions.find(opt => opt.value === frequency)
        return option?.label || frequency
      }
    },
    {
      title: t('table.nextTrigger'),
      dataIndex: 'nextTriggerDate',
      key: 'nextTriggerDate',
      width: 120,
      render: (text: string, record: Reminder) => {
        const displayInfo = getReminderDisplayInfo(record)
        return (
          <div>
            <div>{dayjs(text).format('YYYY-MM-DD')}</div>
            <div className="text-xs text-gray-500">{displayInfo.daysText}</div>
          </div>
        )
      }
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (_: any, record: Reminder) => {
        const displayInfo = getReminderDisplayInfo(record)
        const { statusConfig } = displayInfo
        return (
          <Tag color={statusConfig.color} title={statusConfig.description}>
            {statusConfig.text}
          </Tag>
        )
      }
    },
    {
      title: t('table.actions'),
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Reminder) => {
        const displayInfo = getReminderDisplayInfo(record)
        // 只有"今日待完成"和"已过期"状态才能点击完成按钮
        const canComplete = displayInfo.displayStatus === 'TRIGGER_TODAY'
                         || displayInfo.displayStatus === 'OVERDUE'

        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record.id)}
              disabled={!canComplete}
              title={canComplete ? t('action.markComplete') : t('action.cannotComplete')}
            >
              {t('action.markComplete')}
            </Button>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
            >
              {t('common.button.edit')}
            </Button>
            <Popconfirm
              title={t('action.confirmDelete')}
              onConfirm={() => handleDelete(record.id)}
              okText={t('form.ok')}
              cancelText={t('form.cancel')}
            >
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                {t('common.button.delete')}
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} className="!mb-4 flex items-center">
            <BellOutlined className="mr-2" />
            {t('title')}
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
                  {t('form.createReminder')}
                </Button>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder={t('placeholder.filterFrequency')}
                  allowClear
                  value={frequencyFilter}
                  onChange={setFrequencyFilter}
                  style={{ width: '100%' }}
                  className="mb-2 md:mb-0"
                >
                  {frequencyOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder={t('placeholder.filterDatabaseStatus')}
                  allowClear
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                  className="mb-2 md:mb-0"
                >
                  <Option value="PENDING">{t('status.notStarted')}</Option>
                  <Option value="COMPLETED">{t('status.completed')}</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder={t('placeholder.filterDisplayStatus')}
                  allowClear
                  value={displayStatusFilter}
                  onChange={setDisplayStatusFilter}
                  style={{ width: '100%' }}
                >
                  {displayStatusOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
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
              showTotal: (total) => t('pagination.total', { count: total }),
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
          title={editingReminder ? t('form.editReminder') : t('form.createReminder')}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={() => {
            setModalVisible(false)
            form.resetFields()
            setEditingReminder(null)
          }}
          width={600}
          okText={t('form.ok')}
          cancelText={t('form.cancel')}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item
              name="title"
              label={t('form.title')}
              rules={[{ required: true, message: t('validation.titleRequired') }]}
            >
              <Input placeholder={t('placeholder.title')} />
            </Form.Item>

            <Form.Item name="description" label={t('form.description')}>
              <TextArea rows={3} placeholder={t('placeholder.description')} />
            </Form.Item>

            <Form.Item
              name="frequency"
              label={t('form.frequency')}
              rules={[{ required: true, message: t('validation.frequencyRequired') }]}
            >
              <Select
                placeholder={t('placeholder.frequency')}
                onChange={handleFrequencyChange}
              >
                {frequencyOptions.map(opt => (
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
                label={t('form.intervalDays')}
                rules={[{ required: true, message: t('validation.intervalDaysRequired') }]}
              >
                <InputNumber min={1} max={365} style={{ width: '100%' }} placeholder={t('placeholder.intervalDays')} />
              </Form.Item>
            )}

            {/* 每周 - 选择星期 */}
            {selectedFrequency === 'WEEKLY' && (
              <Form.Item
                name="weekDays"
                label={t('form.weekDays')}
                rules={[{ required: true, message: t('validation.weekDaysRequired') }]}
              >
                <Select mode="multiple" placeholder={t('placeholder.weekDays')}>
                  {weekDayOptions.map(opt => (
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
                label={t('form.dayOfMonth')}
                rules={[{ required: true, message: t('validation.dayOfMonthRequired') }]}
              >
                <InputNumber
                  min={1}
                  max={31}
                  style={{ width: '100%' }}
                  placeholder={t('placeholder.dayOfMonth')}
                />
              </Form.Item>
            )}

            {/* 单次提醒:触发日期 */}
            {!editingReminder && selectedFrequency === 'ONCE' && (
              <Form.Item
                name="startDate"
                label={t('form.triggerDate')}
                rules={[{ required: true, message: t('validation.triggerDateRequired') }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder={t('placeholder.triggerDate')} />
              </Form.Item>
            )}

            {/* 循环提醒:开始日期(默认今天) */}
            {!editingReminder && selectedFrequency !== 'ONCE' && (
              <Form.Item
                name="startDate"
                label={t('form.startDate')}
                tooltip={t('tooltip.startDate')}
              >
                <DatePicker style={{ width: '100%' }} placeholder={t('placeholder.startDate')} />
              </Form.Item>
            )}

            {/* 编辑时:开始日期和下次触发日期 */}
            {editingReminder && (
              <>
                {selectedFrequency !== 'ONCE' && (
                  <Form.Item
                    name="startDate"
                    label={t('form.startDate')}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                )}
                <Form.Item
                  name="nextTriggerDate"
                  label={t('form.nextTriggerDate')}
                  tooltip={t('tooltip.nextTriggerDate')}
                >
                  <DatePicker style={{ width: '100%' }} placeholder={t('placeholder.nextTriggerDate')} />
                </Form.Item>
              </>
            )}
          </Form>
        </Modal>
      </div>
    </div>
  )
}
