import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  App,
  Popconfirm,
  Card,
  Descriptions,
  Tag,
  Collapse
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  RollbackOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { activityConfigApi, type ActivityConfig as ActivityConfigType } from '@/api/activityConfig'

const { TextArea } = Input
const { Panel } = Collapse

/**
 * 活动配置管理模块
 */
export default function ActivityConfig() {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  // 活动配置相关状态
  const [configs, setConfigs] = useState<ActivityConfigType[]>([])
  const [configsLoading, setConfigsLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [updateModalVisible, setUpdateModalVisible] = useState(false)
  const [historyModalVisible, setHistoryModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<ActivityConfigType | null>(null)
  const [historyList, setHistoryList] = useState<ActivityConfigType[]>([])

  // 加载活动配置列表
  const loadConfigs = async () => {
    setConfigsLoading(true)
    try {
      const data = await activityConfigApi.getList()
      setConfigs(data)
    } catch (error: any) {
      message.error(error.message || '加载活动配置失败')
    } finally {
      setConfigsLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadConfigs()
  }, [])

  // 创建活动配置
  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      // 解析 JSON 字符串
      const config = JSON.parse(values.config)
      await activityConfigApi.create({
        activityId: values.activityId,
        config
      })
      message.success('活动配置创建成功')
      setCreateModalVisible(false)
      form.resetFields()
      loadConfigs()
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      if (error instanceof SyntaxError) {
        message.error('配置格式错误，请输入有效的 JSON')
        return
      }
      message.error(error.message || '创建失败')
    }
  }

  // 更新活动配置
  const handleUpdate = async () => {
    if (!selectedConfig) return

    try {
      const values = await form.validateFields()
      // 解析 JSON 字符串
      const config = JSON.parse(values.config)
      await activityConfigApi.update(selectedConfig.activityId, { config })
      message.success('活动配置更新成功')
      setUpdateModalVisible(false)
      form.resetFields()
      setSelectedConfig(null)
      loadConfigs()
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      if (error instanceof SyntaxError) {
        message.error('配置格式错误，请输入有效的 JSON')
        return
      }
      message.error(error.message || '更新失败')
    }
  }

  // 查看历史版本
  const handleViewHistory = async (config: ActivityConfigType) => {
    try {
      const history = await activityConfigApi.getHistory(config.activityId)
      setHistoryList(history)
      setSelectedConfig(config)
      setHistoryModalVisible(true)
    } catch (error: any) {
      message.error(error.message || '获取历史版本失败')
    }
  }

  // 回滚到指定版本
  const handleRollback = async (version: number) => {
    if (!selectedConfig) return

    try {
      await activityConfigApi.rollback(selectedConfig.activityId, { version })
      message.success(`已回滚到版本 ${version}`)
      setHistoryModalVisible(false)
      loadConfigs()
    } catch (error: any) {
      message.error(error.message || '回滚失败')
    }
  }

  // 删除活动配置
  const handleDelete = async (activityId: string) => {
    try {
      await activityConfigApi.delete(activityId)
      message.success('活动配置删除成功')
      loadConfigs()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  // 查看配置详情
  const handleViewDetail = (config: ActivityConfigType) => {
    setSelectedConfig(config)
    setDetailModalVisible(true)
  }

  // 活动配置表格列
  const configColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '活动ID',
      dataIndex: 'activityId',
      key: 'activityId',
      width: 200
    },
    {
      title: '当前版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (version: number) => <Tag color="blue">v{version}</Tag>
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: ActivityConfigType) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedConfig(record)
              form.setFieldsValue({
                config: JSON.stringify(record.config, null, 2)
              })
              setUpdateModalVisible(true)
            }}
          >
            更新
          </Button>
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record)}
          >
            历史
          </Button>
          <Popconfirm
            title="确定要删除这个活动配置吗？"
            onConfirm={() => handleDelete(record.activityId)}
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
    <>
      <div className="mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields()
            setCreateModalVisible(true)
          }}
        >
          创建活动配置
        </Button>
      </div>
      <Table
        columns={configColumns}
        dataSource={configs}
        rowKey="id"
        loading={configsLoading}
        pagination={false}
      />

      {/* 创建活动配置弹窗 */}
      <Modal
        title="创建活动配置"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalVisible(false)
          form.resetFields()
        }}
        okText="创建"
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="activityId"
            label="活动ID"
            rules={[
              { required: true, message: '请输入活动ID' },
              { max: 100, message: '活动ID不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入活动ID（例如：halloween-2024）" />
          </Form.Item>
          <Form.Item
            name="config"
            label="配置内容（JSON格式）"
            rules={[
              { required: true, message: '请输入配置内容' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve()
                  try {
                    JSON.parse(value)
                    return Promise.resolve()
                  } catch {
                    return Promise.reject(new Error('请输入有效的 JSON 格式'))
                  }
                }
              }
            ]}
          >
            <TextArea
              rows={12}
              placeholder='请输入 JSON 格式的配置内容，例如：&#10;{&#10;  "enabled": true,&#10;  "startTime": "2024-10-01T00:00:00Z",&#10;  "endTime": "2024-10-31T23:59:59Z"&#10;}'
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 更新活动配置弹窗 */}
      <Modal
        title="更新活动配置"
        open={updateModalVisible}
        onOk={handleUpdate}
        onCancel={() => {
          setUpdateModalVisible(false)
          form.resetFields()
          setSelectedConfig(null)
        }}
        okText="更新"
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="活动ID">
            <Input value={selectedConfig?.activityId} disabled />
          </Form.Item>
          <Form.Item label="当前版本">
            <Tag color="blue">v{selectedConfig?.version}</Tag>
          </Form.Item>
          <Form.Item
            name="config"
            label="配置内容（JSON格式）"
            rules={[
              { required: true, message: '请输入配置内容' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve()
                  try {
                    JSON.parse(value)
                    return Promise.resolve()
                  } catch {
                    return Promise.reject(new Error('请输入有效的 JSON 格式'))
                  }
                }
              }
            ]}
          >
            <TextArea rows={12} placeholder="请输入 JSON 格式的配置内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 历史版本弹窗 */}
      <Modal
        title={`历史版本 - ${selectedConfig?.activityId}`}
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false)
          setSelectedConfig(null)
          setHistoryList([])
        }}
        footer={null}
        width={900}
      >
        <Collapse accordion>
          {historyList.map((item) => (
            <Panel
              header={
                <div className="flex items-center justify-between">
                  <Space>
                    <Tag color={item.deletedAt ? 'default' : 'blue'}>v{item.version}</Tag>
                    <span>更新于 {new Date(item.updatedAt).toLocaleString()}</span>
                    {item.deletedAt && <Tag color="red">已删除</Tag>}
                    {!item.deletedAt && <Tag color="green">当前版本</Tag>}
                  </Space>
                </div>
              }
              key={item.id}
              extra={
                item.deletedAt && (
                  <Popconfirm
                    title={`确定要回滚到版本 ${item.version} 吗？`}
                    onConfirm={(e) => {
                      e?.stopPropagation()
                      handleRollback(item.version)
                    }}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="link"
                      size="small"
                      icon={<RollbackOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    >
                      回滚
                    </Button>
                  </Popconfirm>
                )
              }
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="配置内容">
                  <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(item.config, null, 2)}
                  </pre>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {new Date(item.createdAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {new Date(item.updatedAt).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Panel>
          ))}
        </Collapse>
      </Modal>

      {/* 配置详情弹窗 */}
      <Modal
        title="配置详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setSelectedConfig(null)
        }}
        footer={null}
        width={700}
      >
        {selectedConfig && (
          <Card>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="活动ID">{selectedConfig.activityId}</Descriptions.Item>
              <Descriptions.Item label="版本">
                <Tag color="blue">v{selectedConfig.version}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="配置内容">
                <pre className="bg-gray-50 p-2 rounded overflow-x-auto max-h-96">
                  {JSON.stringify(selectedConfig.config, null, 2)}
                </pre>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedConfig.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(selectedConfig.updatedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Modal>
    </>
  )
}
