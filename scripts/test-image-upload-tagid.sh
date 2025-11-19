#!/bin/bash

# 图片上传 tagId 测试脚本
# 用于验证后端上传图片时是否正确处理 tagId 参数

set -e  # 遇到错误立即退出

echo "======================================"
echo "图片上传 tagId 功能测试"
echo "======================================"
echo ""

# 加载测试账号配置
ENV_FILE=".env.test.local"
if [ -f "$ENV_FILE" ]; then
    echo "📝 从 $ENV_FILE 加载测试账号信息"
    export $(grep -v '^#' $ENV_FILE | grep -v '^$' | xargs)
else
    echo "⚠️  $ENV_FILE 不存在，使用默认配置"
    API_BASE_URL="http://localhost:3000/api"
    TEST_ADMIN_EMAIL="admin@example.com"
    TEST_ADMIN_PASSWORD="123456"
fi

# 配置
ADMIN_EMAIL="${TEST_ADMIN_EMAIL}"
ADMIN_PASSWORD="${TEST_ADMIN_PASSWORD}"
TEST_IMAGE_PATH="./tests/temp/ckeditor-image_3a5950c2f1999c534f096099f8b8ca82.png"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查测试图片是否存在
if [ ! -f "$TEST_IMAGE_PATH" ]; then
    echo -e "${RED}❌ 测试图片不存在: $TEST_IMAGE_PATH${NC}"
    echo "请确保测试图片文件存在"
    exit 1
fi

echo -e "${YELLOW}📝 步骤 1: 登录获取管理员 Token${NC}"
echo "-------------------------------------"

# 登录获取 token
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

echo "登录响应: $LOGIN_RESPONSE"
echo ""

# 提取 token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ 登录失败，无法获取 token${NC}"
    echo "请确保管理员账号存在: $ADMIN_EMAIL / $ADMIN_PASSWORD"
    exit 1
fi

echo -e "${GREEN}✅ 登录成功，获取到 token${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 获取所有标签
echo -e "${YELLOW}📝 步骤 2: 获取所有标签${NC}"
echo "-------------------------------------"

TAGS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/image-tags" \
  -H "Authorization: Bearer $TOKEN")

echo "标签列表响应: $TAGS_RESPONSE"
echo ""

# 测试 1: 上传图片，不指定 tagId（应该使用默认 tagId=1）
echo -e "${YELLOW}📝 测试 1: 上传图片（不指定 tagId，应该默认为 1）${NC}"
echo "-------------------------------------"

UPLOAD_RESPONSE_1=$(curl -s -X POST "$API_BASE_URL/images/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@$TEST_IMAGE_PATH")

echo "上传响应: $UPLOAD_RESPONSE_1"
echo ""

# 提取返回的 tagId
TAG_ID_1=$(echo $UPLOAD_RESPONSE_1 | grep -o '"tagId":[0-9]*' | head -1 | cut -d':' -f2)

if [ "$TAG_ID_1" = "1" ]; then
    echo -e "${GREEN}✅ 测试 1 通过: tagId = 1 (默认值)${NC}"
else
    echo -e "${RED}❌ 测试 1 失败: 期望 tagId=1, 实际 tagId=$TAG_ID_1${NC}"
fi
echo ""

# 测试 2: 上传图片，指定 tagId=2
echo -e "${YELLOW}📝 测试 2: 上传图片（指定 tagId=2）${NC}"
echo "-------------------------------------"

UPLOAD_RESPONSE_2=$(curl -s -X POST "$API_BASE_URL/images/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@$TEST_IMAGE_PATH" \
  -F "tagId=2")

echo "上传响应: $UPLOAD_RESPONSE_2"
echo ""

# 提取返回的 tagId
TAG_ID_2=$(echo $UPLOAD_RESPONSE_2 | grep -o '"tagId":[0-9]*' | head -1 | cut -d':' -f2)

if [ "$TAG_ID_2" = "2" ]; then
    echo -e "${GREEN}✅ 测试 2 通过: tagId = 2 (指定值)${NC}"
else
    echo -e "${RED}❌ 测试 2 失败: 期望 tagId=2, 实际 tagId=$TAG_ID_2${NC}"
fi
echo ""

# 测试 3: 上传图片，指定不存在的 tagId=999
echo -e "${YELLOW}📝 测试 3: 上传图片（指定不存在的 tagId=999，应该失败）${NC}"
echo "-------------------------------------"

UPLOAD_RESPONSE_3=$(curl -s -X POST "$API_BASE_URL/images/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@$TEST_IMAGE_PATH" \
  -F "tagId=999")

echo "上传响应: $UPLOAD_RESPONSE_3"
echo ""

# 检查是否返回错误
ERROR_CODE=$(echo $UPLOAD_RESPONSE_3 | grep -o '"code":[0-9]*' | head -1 | cut -d':' -f2)

if [ "$ERROR_CODE" != "0" ]; then
    echo -e "${GREEN}✅ 测试 3 通过: 正确拒绝了不存在的 tagId${NC}"
else
    echo -e "${RED}❌ 测试 3 失败: 应该拒绝不存在的 tagId，但接受了${NC}"
fi
echo ""

# 总结
echo "======================================"
echo "测试总结"
echo "======================================"
if [ "$TAG_ID_1" = "1" ] && [ "$TAG_ID_2" = "2" ] && [ "$ERROR_CODE" != "0" ]; then
    echo -e "${GREEN}🎉 所有测试通过！后端 tagId 处理正确${NC}"
    exit 0
else
    echo -e "${RED}⚠️  部分测试失败，请检查后端实现${NC}"
    exit 1
fi
