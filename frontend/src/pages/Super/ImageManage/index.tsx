import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  Select,
  Image as AntImage,
  Space,
  Typography,
  App,
  Popconfirm
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  PictureOutlined
} from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { imageTagApi, type ImageTag } from '@/api/imageTag'
import { imageApi, type Image } from '@/api/image'

const { Title } = Typography

/**
 * 图片管理页面
 */
export default function ImageManage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [uploadForm] = Form.useForm()

  // 图片标签相关状态
  const [tags, setTags] = useState<ImageTag[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [tagModalVisible, setTagModalVisible] = useState(false)
  const [editingTag, setEditingTag] = useState<ImageTag | null>(null)

  // 图片相关状态
  const [images, setImages] = useState<Image[]>([])
  const [imagesLoading, setImagesLoading] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

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

  // 加载图片列表
  const loadImages = async (page = 1, pageSize = 10) => {
    setImagesLoading(true)
    try {
      const data = await imageApi.getList({ page, pageSize })
      setImages(data.items)
      setPagination({
        current: data.page,
        pageSize: data.pageSize,
        total: data.total
      })
    } catch (error) {
      message.error('加载图片失败')
    } finally {
      setImagesLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadTags()
    loadImages()
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

  // 上传图片
  const handleUpload = async () => {
    try {
      const values = await uploadForm.validateFields()
      if (fileList.length === 0) {
        message.error('请选择要上传的图片')
        return
      }

      const files = fileList.map(file => file.originFileObj as File)
      const result = await imageApi.upload(files, values.tagId)

      if (result.success.length > 0) {
        message.success(`成功上传 ${result.success.length} 张图片`)
      }
      if (result.failed.length > 0) {
        message.warning(`${result.failed.length} 张图片上传失败`)
      }

      setUploadModalVisible(false)
      uploadForm.resetFields()
      setFileList([])
      loadImages()
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      message.error(error.message || '上传失败')
    }
  }

  // 删除图片
  const handleDeleteImage = async (id: number) => {
    try {
      await imageApi.delete(id)
      message.success('图片删除成功')
      loadImages(pagination.current, pagination.pageSize)
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

  // 图片表格列
  const imageColumns = [
    {
      title: '预览',
      dataIndex: 'ossUrl',
      key: 'preview',
      width: 100,
      render: (url: string) => (
        <AntImage
          src={url}
          width={60}
          height={60}
          style={{ objectFit: 'cover', borderRadius: '4px' }}
          preview={{
            mask: <PictureOutlined />
          }}
        />
      )
    },
    {
      title: '文件名',
      dataIndex: 'originalName',
      key: 'originalName'
    },
    {
      title: '标签',
      dataIndex: 'tag',
      key: 'tag',
      render: (tag: ImageTag | undefined) => tag?.name || '-'
    },
    {
      title: '尺寸',
      key: 'size',
      render: (_: any, record: Image) =>
        record.width && record.height
          ? `${record.width} × ${record.height}`
          : '-'
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'fileSize',
      render: (size: number) => {
        if (size < 1024) return `${size} B`
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
        return `${(size / 1024 / 1024).toFixed(2)} MB`
      }
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Image) => (
        <Popconfirm
          title="确定要删除这张图片吗？"
          onConfirm={() => handleDeleteImage(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/super')}
            >
              返回
            </Button>
            <Title level={2} className="!mb-0">
              图片管理
            </Title>
          </div>
        </div>

        {/* 内容区域 */}
        <Card>
          <Tabs
            items={[
              {
                key: 'tags',
                label: '图片标签',
                children: (
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
                  </>
                )
              },
              {
                key: 'images',
                label: '图片列表',
                children: (
                  <>
                    <div className="mb-4">
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={() => {
                          uploadForm.resetFields()
                          setFileList([])
                          setUploadModalVisible(true)
                        }}
                      >
                        上传图片
                      </Button>
                    </div>
                    <Table
                      columns={imageColumns}
                      dataSource={images}
                      rowKey="id"
                      loading={imagesLoading}
                      pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 张图片`
                      }}
                      onChange={(newPagination) => {
                        loadImages(
                          newPagination.current || 1,
                          newPagination.pageSize || 10
                        )
                      }}
                    />
                  </>
                )
              }
            ]}
          />
        </Card>

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

        {/* 上传图片弹窗 */}
        <Modal
          title="上传图片"
          open={uploadModalVisible}
          onOk={handleUpload}
          onCancel={() => {
            setUploadModalVisible(false)
            uploadForm.resetFields()
            setFileList([])
          }}
          okText="开始上传"
          cancelText="取消"
          width={600}
        >
          <Form form={uploadForm} layout="vertical">
            <Form.Item name="tagId" label="选择标签">
              <Select
                placeholder="请选择标签（可选）"
                allowClear
                options={tags.map((tag) => ({
                  label: tag.name,
                  value: tag.id
                }))}
              />
            </Form.Item>
            <Form.Item label="选择图片">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={() => false}
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                maxCount={10}
              >
                {fileList.length < 10 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>选择图片</div>
                  </div>
                )}
              </Upload>
              <div className="text-gray-500 text-sm mt-2">
                支持格式：JPEG、PNG、GIF、WebP，单张最大5MB，最多10张
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}
