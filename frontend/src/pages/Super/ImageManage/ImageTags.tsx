import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Space, App, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { imageTagApi, type ImageTag } from '@/api/imageTag'

/**
 * 图片标签管理模块
 */
export default function ImageTags() {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  // 图片标签相关状态
  const [tags, setTags] = useState<ImageTag[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [tagModalVisible, setTagModalVisible] = useState(false)
  const [editingTag, setEditingTag] = useState<ImageTag | null>(null)

  // 加载图片标签
  const loadTags = async () => {
    setTagsLoading(true)
    try {
      const data = await imageTagApi.getTags()
      setTags(data)
    } catch (error) {
      message.error('加载标签失败')
    } finally {
      setTagsLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadTags()
  }, [])

  // 创建/编辑标签
  const handleTagSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingTag) {
        await imageTagApi.updateTag(editingTag.id, values)
        message.success('标签修改成功')
      } else {
        await imageTagApi.createTag(values)
        message.success('标签创建成功')
      }
      setTagModalVisible(false)
      form.resetFields()
      setEditingTag(null)
      loadTags()
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      message.error(error.message || '操作失败')
    }
  }

  // 删除标签
  const handleDeleteTag = async (id: number) => {
    try {
      await imageTagApi.deleteTag(id)
      message.success('标签删除成功')
      loadTags()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  // 标签表格列
  const tagColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ImageTag) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTag(record)
              form.setFieldsValue({ name: record.name })
              setTagModalVisible(true)
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个标签吗？"
            onConfirm={() => handleDeleteTag(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={record.id === 1}
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              disabled={record.id === 1}
            >
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
            setEditingTag(null)
            form.resetFields()
            setTagModalVisible(true)
          }}
        >
          创建标签
        </Button>
      </div>
      <Table
        columns={tagColumns}
        dataSource={tags}
        rowKey="id"
        loading={tagsLoading}
        pagination={false}
      />

      {/* 创建/编辑标签弹窗 */}
      <Modal
        title={editingTag ? '编辑标签' : '创建标签'}
        open={tagModalVisible}
        onOk={handleTagSubmit}
        onCancel={() => {
          setTagModalVisible(false)
          form.resetFields()
          setEditingTag(null)
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[
              { required: true, message: '请输入标签名称' },
              { max: 50, message: '标签名称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
