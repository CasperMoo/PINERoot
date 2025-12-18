#!/usr/bin/env node

/**
 * 后端 i18n 检查脚本
 * 检查 src/ 目录下需要国际化的硬编码文本
 *
 * 使用方法:
 *   node scripts/check-i18n.js           # 仅显示警告
 *   node scripts/check-i18n.js --strict  # 发现问题时退出码为 1
 */

const fs = require('fs');
const path = require('path');

// 检查是否为严格模式
const args = process.argv.slice(2);
const strictMode = args.includes('--strict');

// 要检查的目录
const srcDir = path.join(__dirname, '../src');

// 要忽略的文件和目录
const ignorePatterns = [
  'node_modules',
  'dist',
  '.git',
  'test',
  'tests',
  'migrations',
  '*.test.ts',
  '*.spec.ts'
];

// 检查是否应该忽略该文件
function shouldIgnore(filePath) {
  return ignorePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(path.basename(filePath));
    }
    return filePath.includes(pattern);
  });
}

// 递归获取所有 TypeScript 文件
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !shouldIgnore(filePath)) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// 检查文件中的硬编码文本
function checkHardcodedText(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  // 匹配模式（排除已使用 request.t() 或 t() 的行）
  const patterns = [
    // error() 调用中的硬编码字符串（排除模板字符串和已国际化的）
    {
      regex: /error\(reply,\s*\d+,\s*['"]([^'"$]+)['"]\)/g,
      type: 'error-call',
      checkLine: (line) => !line.includes('request.t(') && !line.includes('.t(')
    },
    // ok() 调用中的硬编码字符串（排除单个参数的情况）
    {
      regex: /ok\(reply,\s*[^,]+,\s*['"]([^'"$]+)['"]\)/g,
      type: 'ok-call',
      checkLine: (line) => !line.includes('request.t(') && !line.includes('.t(')
    },
    // throw new Error() 中的硬编码字符串
    {
      regex: /throw new Error\(['"]([^'"$]+)['"]\)/g,
      type: 'throw-error',
      checkLine: (line) => !line.includes('request.t(') && !line.includes('.t(')
    },
    // console.error/log 中的硬编码字符串（通常是调试信息）
    {
      regex: /console\.(error|log)\(['"]([^'"$]+)['"]\)/g,
      type: 'console-log',
      checkLine: (line) => true // console 日志可能不需要国际化，仅作提示
    }
  ];

  lines.forEach((line, index) => {
    patterns.forEach((pattern, patternIndex) => {
      // 跳过不需要检查的行
      if (!pattern.checkLine(line)) {
        return;
      }

      let match;
      // 重置正则表达式的 lastIndex
      pattern.regex.lastIndex = 0;

      while ((match = pattern.regex.exec(line)) !== null) {
        const text = match[1] || match[2]; // 支持不同的捕获组

        // 过滤掉一些不需要国际化的文本
        const skipPatterns = [
          /^[a-zA-Z0-9._-]+$/, // 纯英文标识符
          /^OK$/, // 默认成功消息
          /^Service Unavailable$/, // HTTP 标准状态
          /^Unauthorized:/, // 已在 auth 模块处理
          /^Forbidden:/, // 已在 auth 模块处理
          /^https?:\/\//, // URL
          /^[0-9]+$/, // 纯数字
          /^Test$/, // 测试相关
          /^error$/, // 简单错误标识
          /^[a-zA-Z0-9 _-]+ failed: .*$/, // 带变量的错误消息
          /^Error during .*/, // 调试错误
          /^Get .* error:/, // 调试错误
          /^Upload error:/, // 调试错误
          /^OSS .* failed:/, // 调试错误
          /^删除失败不抛出异常/ // 注释说明
        ];

        const shouldSkip = skipPatterns.some(skipPattern => {
          if (skipPattern instanceof RegExp) {
            return skipPattern.test(text);
          }
          return text.includes(skipPattern);
        });

        if (!shouldSkip && text.length > 1) {
          issues.push({
            line: index + 1,
            text: text,
            type: ['error-call', 'ok-call', 'throw-error', 'console-log'][patternIndex],
            context: line.trim()
          });
        }
      }
    });
  });

  return issues;
}

// 主函数
function main() {
  console.log('🔍 检查后端代码中的硬编码文本...\n');

  const files = getAllTsFiles(srcDir);
  const totalIssues = [];

  files.forEach(filePath => {
    const relativePath = path.relative(__dirname, filePath);
    const issues = checkHardcodedText(filePath);

    if (issues.length > 0) {
      console.log(`📄 ${relativePath}`);
      issues.forEach(issue => {
        console.log(`  Line ${issue.line}: [${issue.type}] "${issue.text}"`);
        console.log(`    Context: ${issue.context}`);
        console.log('');
      });
      totalIssues.push(...issues);
    }
  });

  console.log(`\n✅ 检查完成！`);
  console.log(`📊 总计发现 ${totalIssues.length} 处可能需要国际化的文本`);

  if (totalIssues.length > 0) {
    console.log('\n💡 建议操作：');
    console.log('1. 将硬编码文本提取到翻译文件 (locales/zh-CN.json 和 locales/en-US.json)');
    console.log('2. 使用 request.t() 方法替换硬编码文本');
    console.log('3. 运行测试确保功能正常');

    // 生成建议的翻译键
    console.log('\n📝 建议的翻译键：');
    const groupedTexts = {};

    files.forEach(filePath => {
      const module = path.basename(filePath, '.ts');
      const issues = checkHardcodedText(filePath);

      if (issues.length > 0) {
        if (!groupedTexts[module]) {
          groupedTexts[module] = [];
        }
        issues.forEach(issue => {
          groupedTexts[module].push(issue.text);
        });
      }
    });

    Object.entries(groupedTexts).forEach(([module, texts]) => {
      const uniqueTexts = [...new Set(texts)];
      console.log(`\n${module}:`);
      uniqueTexts.slice(0, 5).forEach(text => {
        const key = text
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '_')
          .replace(/^_|_$/g, '');
        console.log(`  "${module}.${key}": "${text}"`);
      });
      if (uniqueTexts.length > 5) {
        console.log(`  ... 还有 ${uniqueTexts.length - 5} 个`);
      }
    });
  }

  // 只在 strict 模式下，发现问题时退出码为 1
  if (strictMode && totalIssues.length > 0) {
    console.log('\n⚠️  严格模式: 检查未通过');
    process.exit(1);
  } else if (totalIssues.length > 0) {
    console.log('\n💡 提示: 使用 --strict 参数可在 CI/CD 中强制检查');
  }

  process.exit(0);
}

// 运行主函数
main();