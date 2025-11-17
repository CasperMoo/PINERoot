import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Upload,
  Select,
  Image as AntImage,
  App,
  Popconfirm,
  Progress,
  List,
  Tag
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { imageTagApi, type ImageTag } from '@/api/imageTag'
import { imageApi, type Image } from '@/api/image'

// 文件上传状态
interface FileUploadStatus {
  uid: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  uploadedImage?: Image
}

/**
 * 图片列表管理模块
 */
export default function ImageList() {
  const { message } = App.useApp()
  const [uploadForm] = Form.useForm()

  // 图片标签相关状态
  const [tags, setTags] = useState<ImageTag[]>([])

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
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>(undefined)

  // 上传进度相关状态
  const [uploadFiles, setUploadFiles] = useState<FileUploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // 加载图片标签
  const loadTags = async () => {
    try {
      const data = await imageTagApi.getTags()
      setTags(data)
    } catch (error) {
      message.error('加载标签失败')
    }
  }

  // 加载图片列表
  const loadImages = async (page = 1, pageSize = 10, tagId?: number) => {
    setImagesLoading(true)
    try {
      const data = await imageApi.getList({
        page,
        pageSize,
        tagId: tagId !== undefined ? tagId : selectedTagId
      })
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

  // 处理标签筛选变化
  const handleTagFilterChange = (tagId: number | undefined) => {
    setSelectedTagId(tagId)
    loadImages(1, pagination.pageSize, tagId)
  }

  // 初始化加载
  useEffect(() => {
    loadTags()
    loadImages()
  }, [])

  // 上传单个文件
  const uploadSingleFile = async (
    fileStatus: FileUploadStatus,
    tagId?: number
  ): Promise<void> => {
    // 更新状态为上传中
    setUploadFiles((prev) =>
      prev.map((f) =>
        f.uid === fileStatus.uid ? { ...f, status: 'uploading' as const, progress: 0 } : f
      )
    )

    try {
      const image = await imageApi.uploadSingle(fileStatus.file, tagId)

      // 更新状态为成功
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.uid === fileStatus.uid
            ? {
                ...f,
                status: 'success' as const,
                progress: 100,
                uploadedImage: image
              }
            : f
        )
      )
    } catch (error: any) {
      // 更新状态为失败
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.uid === fileStatus.uid
            ? {
                ...f,
                status: 'error' as const,
                progress: 0,
                error: error.message || '上传失败'
              }
            : f
        )
      )
      throw error
    }
  }

  // 开始上传所有文件
  const handleUpload = async () => {
    try {
      const values = await uploadForm.validateFields()
      if (fileList.length === 0) {
        message.error('请选择要上传的图片')
        return
      }

      // 初始化上传文件状态
      const initialUploadFiles: FileUploadStatus[] = fileList.map((file) => ({
        uid: file.uid,
        file: file.originFileObj as File,
        status: 'pending' as const,
        progress: 0
      }))

      setUploadFiles(initialUploadFiles)
      setIsUploading(true)

      // 逐个上传文件
      let successCount = 0
      let failedCount = 0

      for (const fileStatus of initialUploadFiles) {
        try {
          await uploadSingleFile(fileStatus, values.tagId)
          successCount++
        } catch (error) {
          failedCount++
          // 继续上传下一个文件
        }
      }

      setIsUploading(false)

      // 显示上传结果
      if (successCount > 0) {
        message.success(`成功上传 ${successCount} 张图片`)
      }
      if (failedCount > 0) {
        message.warning(`${failedCount} 张图片上传失败，您可以点击重试按钮重新上传`)
      }

      // 刷新图片列表
      loadImages()
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      message.error(error.message || '上传失败')
      setIsUploading(false)
    }
  }

  // 重试上传失败的文件
  const handleRetry = async (fileStatus: FileUploadStatus) => {
    const values = uploadForm.getFieldsValue()
    try {
      await uploadSingleFile(fileStatus, values.tagId)
      message.success('重试成功')
      loadImages()
    } catch (error) {
      message.error('重试失败')
    }
  }

  // 关闭上传弹窗
  const handleCloseUploadModal = () => {
    if (isUploading) {
      message.warning('正在上传中，请稍后关闭')
      return
    }
    setUploadModalVisible(false)
    uploadForm.resetFields()
    setFileList([])
    setUploadFiles([])
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
        record.width && record.height ? `${record.width} × ${record.height}` : '-'
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
    <>
      <div className="mb-4 flex items-center gap-4">
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
        <div className="flex items-center gap-2">
          <span className="text-gray-600">标签筛选：</span>
          <Select
            style={{ width: 200 }}
            placeholder="全部标签"
            allowClear
            value={selectedTagId}
            onChange={handleTagFilterChange}
            options={[
              { label: '全部标签', value: undefined },
              ...tags.map((tag) => ({
                label: tag.name,
                value: tag.id
              }))
            ]}
          />
        </div>
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
          loadImages(newPagination.current || 1, newPagination.pageSize || 10)
        }}
      />

      {/* 上传图片弹窗 */}
      <Modal
        title="上传图片"
        open={uploadModalVisible}
        onOk={handleUpload}
        onCancel={handleCloseUploadModal}
        okText={isUploading ? '上传中...' : '开始上传'}
        cancelText="关闭"
        width={700}
        okButtonProps={{ disabled: isUploading || fileList.length === 0 }}
        cancelButtonProps={{ disabled: isUploading }}
        maskClosable={!isUploading}
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item name="tagId" label="选择标签">
            <Select
              placeholder="请选择标签（可选）"
              allowClear
              disabled={isUploading}
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
              disabled={isUploading}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>选择图片</div>
              </div>
            </Upload>
            <div className="text-gray-500 text-sm mt-2">
              支持格式：JPEG、PNG、GIF、WebP，单张最大5MB
            </div>
          </Form.Item>

          {/* 上传进度 */}
          {uploadFiles.length > 0 && (
            <Form.Item label="上传进度">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span>
                    总进度：{uploadFiles.filter((f) => f.status === 'success').length} /{' '}
                    {uploadFiles.length}
                  </span>
                  <span>
                    {Math.round(
                      (uploadFiles.filter((f) => f.status === 'success').length /
                        uploadFiles.length) *
                        100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  percent={Math.round(
                    (uploadFiles.filter((f) => f.status === 'success').length /
                      uploadFiles.length) *
                      100
                  )}
                  status={
                    isUploading
                      ? 'active'
                      : uploadFiles.some((f) => f.status === 'error')
                      ? 'exception'
                      : 'success'
                  }
                />
              </div>

              <List
                size="small"
                bordered
                dataSource={uploadFiles}
                renderItem={(item) => (
                  <List.Item
                    actions={
                      [
                        item.status === 'error' && !isUploading ? (
                          <Button
                            type="link"
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={() => handleRetry(item)}
                          >
                            重试
                          </Button>
                        ) : null
                      ].filter(Boolean) as React.ReactElement[]
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        item.status === 'uploading' ? (
                          <LoadingOutlined className="text-blue-500" />
                        ) : item.status === 'success' ? (
                          <CheckCircleOutlined className="text-green-500" />
                        ) : item.status === 'error' ? (
                          <CloseCircleOutlined className="text-red-500" />
                        ) : (
                          <PictureOutlined className="text-gray-400" />
                        )
                      }
                      title={
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-xs">{item.file.name}</span>
                          <Tag
                            color={
                              item.status === 'uploading'
                                ? 'processing'
                                : item.status === 'success'
                                ? 'success'
                                : item.status === 'error'
                                ? 'error'
                                : 'default'
                            }
                          >
                            {item.status === 'uploading'
                              ? '上传中'
                              : item.status === 'success'
                              ? '成功'
                              : item.status === 'error'
                              ? '失败'
                              : '等待中'}
                          </Tag>
                        </div>
                      }
                      description={
                        item.status === 'error' ? (
                          <span className="text-red-500">{item.error}</span>
                        ) : item.status === 'success' ? (
                          <span className="text-green-500">
                            {(item.file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            {(item.file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )
                      }
                    />
                  </List.Item>
                )}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  )
}
