// 直接定义翻译资源，避免 JSON 导入问题

export const resources = {
  'en-US': {
    common: {
      button: {
        submit: "Submit",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        save: "Save",
        back: "Back",
        confirm: "Confirm",
        upload: "Upload",
        create: "Create",
        close: "Close",
        search: "Search",
        reset: "Reset"
      },
      status: {
        loading: "Loading...",
        success: "Success",
        error: "Error",
        pending: "Pending",
        completed: "Completed",
        failed: "Failed"
      },
      action: {
        confirmDelete: "Are you sure you want to delete?",
        operationSuccess: "Operation successful",
        operationFailed: "Operation failed",
        deleteSuccess: "Delete successful",
        createSuccess: "Create successful",
        updateSuccess: "Update successful",
        uploadSuccess: "Upload successful",
        noData: "No data"
      },
      navigation: {
        home: "Home",
        dashboard: "Dashboard",
        admin: "Admin",
        profile: "Profile",
        settings: "Settings",
        logout: "Logout"
      },
      language: {
        switch: "Language",
        english: "English",
        chinese: "简体中文"
      }
    },
    auth: {
      login: {
        title: "Sign In",
        emailLabel: "Email",
        emailPlaceholder: "Enter your email",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter your password",
        submitButton: "Login",
        registerLink: "Don't have an account? Register",
        forgotPassword: "Forgot password?",
        rememberMe: "Remember me"
      },
      register: {
        title: "Sign Up",
        emailLabel: "Email",
        emailPlaceholder: "Enter your email",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter your password",
        confirmPasswordLabel: "Confirm Password",
        confirmPasswordPlaceholder: "Confirm your password",
        nicknameLabel: "Nickname (optional)",
        nicknamePlaceholder: "Enter your nickname",
        submitButton: "Register",
        loginLink: "Already have an account? Login",
        termsAndPrivacy: "By registering, you agree to our Terms of Service and Privacy Policy"
      },
      logout: {
        confirmTitle: "Confirm Logout",
        confirmMessage: "Are you sure you want to logout?",
        success: "Logout successful"
      }
    },
    validation: {
      required: "This field is required",
      emailInvalid: "Invalid email format",
      passwordTooShort: "Password must be at least 6 characters",
      passwordTooWeak: "Password must contain letters and numbers",
      passwordMismatch: "Passwords do not match",
      emailExists: "Email already exists",
      loginFailed: "Invalid email or password",
      networkError: "Network error, please try again",
      serverError: "Server error, please try again later",
      fileTooLarge: "File size exceeds limit",
      fileTypeNotSupported: "File type not supported",
      minLength: "Must be at least {{count}} characters",
      maxLength: "Must not exceed {{count}} characters",
      min: "Must be at least {{count}}",
      max: "Must not exceed {{count}}"
    },
    admin: {
      title: "Admin Panel",
      dashboard: {
        welcome: "Welcome to Admin Panel",
        description: "Manage your application from here",
        stats: {
          totalUsers: "Total Users",
          totalImages: "Total Images",
          totalTags: "Total Tags"
        }
      },
      imageManage: {
        title: "Image Management",
        tabs: {
          imageList: "Image List",
          tagManagement: "Tag Management"
        },
        table: {
          columns: {
            id: "ID",
            name: "Name",
            url: "URL",
            tags: "Tags",
            status: "Status",
            createdAt: "Created At",
            actions: "Actions"
          },
          noData: "No images found"
        },
        upload: {
          title: "Upload Images",
          description: "Click or drag files to upload",
          hint: "Support for single or bulk upload. Maximum 10 files.",
          button: "Select Files",
          batchUpload: "Batch Upload"
        },
        tag: {
          title: "Tag Management",
          create: "Create Tag",
          edit: "Edit Tag",
          delete: "Delete Tag",
          tagName: "Tag Name",
          deleteConfirm: "Are you sure you want to delete this tag?",
          defaultTagWarning: "Cannot delete the default tag"
        },
        actions: {
          view: "View",
          edit: "Edit",
          delete: "Delete",
          changeTag: "Change Tag"
        },
        status: {
          active: "Active",
          inactive: "Inactive"
        }
      },
      form: {
        create: "Create {{type}}",
        edit: "Edit {{type}}",
        name: "Name",
        description: "Description",
        save: "Save",
        cancel: "Cancel"
      }
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome, {{name}}!",
      subtitle: "Here's what's happening with your application today.",
      stats: {
        totalImages: "Total Images",
        totalTags: "Total Tags",
        recentActivity: "Recent Activity"
      },
      quickActions: {
        title: "Quick Actions",
        manageImages: "Manage Images",
        manageTags: "Manage Tags",
        viewProfile: "View Profile"
      },
      emptyState: {
        title: "No data yet",
        description: "Start by uploading some images or creating tags."
      }
    },
    home: {
      hero: {
        title: "Welcome to the Tool Collection Platform",
        subtitle: "Efficient, concise, and modern tool experience",
        getStarted: "Get Started",
        enterDashboard: "Enter Dashboard"
      },
      features: {
        title: "Our Tools",
        subtitle: "More tools are under development, stay tuned",
        vocabulary: {
          title: "Vocabulary Book",
          description: "Search and save Japanese/Chinese words with detailed meanings and examples"
        },
        reminder: {
          title: "Reminders",
          description: "Set important reminders and never miss critical moments"
        },
        tasks: {
          title: "Task Management",
          description: "Efficiently manage your to-do items and plan your work and life"
        },
        notes: {
          title: "Notes Tool",
          description: "Record your inspirations anytime with rich text and Markdown support"
        },
        analytics: {
          title: "Data Analytics",
          description: "Visualize your data and generate professional charts and reports"
        },
        utilities: {
          title: "Utilities",
          description: "More practical utilities to boost your work efficiency"
        }
      }
    },
    vocabulary: {
      title: "Vocabulary Book",
      tabs: {
        search: "Search Words",
        myWords: "My Vocabulary"
      },
      search: {
        placeholder: "Enter Chinese or Japanese word",
        button: "Search",
        searching: "Searching...",
        notFound: "No results found",
        tryAgain: "Try a different word",
        fromCache: "From cache"
      },
      word: {
        frequency: "Frequency",
        example: "Example",
        usage: "Usage",
        synonyms: "Synonyms",
        collect: "Add to Vocabulary",
        collected: "Already Added",
        remove: "Remove",
        myNote: "My Note",
        collectedAt: "Added on",
        confirmRemove: "Remove this word from your vocabulary?",
        removeSuccess: "Removed successfully",
        collectSuccess: "Added to vocabulary",
        pronounce: "Pronounce",
        pitch: "Pitch",
        noTextToSpeak: "No text available to pronounce",
        speechNotSupported: "Your browser does not support speech synthesis",
        speechError: "Pronunciation failed, please try again",
        stopSpeaking: "Stop pronunciation"
      },
      myWords: {
        empty: "Your vocabulary is empty",
        emptyHint: "Search and add words to start learning",
        status: {
          all: "All",
          new: "New",
          learning: "Learning",
          mastered: "Mastered"
        },
        total: "Total: {{count}} words"
      },
      error: {
        searchFailed: "Search failed",
        collectFailed: "Failed to add",
        removeFailed: "Failed to remove",
        loadFailed: "Failed to load",
        networkError: "Network error, please try again",
        textRequired: "Please enter a word",
        textTooLong: "Word cannot exceed 500 characters"
      },
      pos: {
        noun: "Noun",
        verb: "Verb",
        adjective: "Adjective",
        adverb: "Adverb",
        particle: "Particle"
      },
      development: {
        underDevelopment: "Under Development",
        comingSoon: "Coming Soon..."
      },
      reminder: {
        title: "Reminders",
        frequency: {
          once: "Once",
          daily: "Daily",
          everyXDays: "Every X Days",
          weekly: "Weekly",
          monthly: "Monthly",
          yearly: "Yearly"
        },
        weekDays: {
          sunday: "Sunday",
          monday: "Monday",
          tuesday: "Tuesday",
          wednesday: "Wednesday",
          thursday: "Thursday",
          friday: "Friday",
          saturday: "Saturday"
        },
        status: {
          triggerToday: "Pending Today",
          overdue: "Overdue",
          completedToday: "Completed Today",
          notStarted: "Not Started",
          completed: "Completed",
          deleted: "Deleted"
        },
        table: {
          title: "Title",
          description: "Description",
          frequency: "Frequency",
          nextTrigger: "Next Trigger",
          status: "Status",
          actions: "Actions"
        },
        form: {
          createReminder: "Create Reminder",
          editReminder: "Edit Reminder",
          title: "Title",
          description: "Description",
          frequency: "Frequency",
          intervalDays: "Interval Days",
          weekDays: "Week Days",
          dayOfMonth: "Day of Month",
          triggerDate: "Trigger Date",
          startDate: "Start Date",
          nextTriggerDate: "Next Trigger Date",
          ok: "OK",
          cancel: "Cancel"
        },
        placeholder: {
          title: "Enter reminder title",
          description: "Enter description (optional)",
          frequency: "Select frequency",
          intervalDays: "Enter interval days",
          weekDays: "Select week days",
          dayOfMonth: "Enter day of month",
          triggerDate: "Select trigger date",
          startDate: "Default today",
          nextTriggerDate: "Leave empty to auto calculate",
          filterFrequency: "Filter frequency",
          filterDatabaseStatus: "Filter database status",
          filterDisplayStatus: "Filter display status"
        },
        validation: {
          titleRequired: "Please enter title",
          frequencyRequired: "Please select frequency",
          intervalDaysRequired: "Please enter interval days",
          weekDaysRequired: "Please select week days",
          dayOfMonthRequired: "Please enter day of month",
          triggerDateRequired: "Please select trigger date"
        },
        action: {
          markComplete: "Mark Complete",
          cannotComplete: "Only pending today or overdue reminders can be marked as complete",
          confirmDelete: "Are you sure you want to delete this reminder?",
          deleteSuccess: "Reminder deleted successfully",
          deleteFailed: "Delete failed",
          loadFailed: "Load failed",
          operationFailed: "Operation failed",
          updateSuccess: "Reminder updated successfully",
          createSuccess: "Reminder created successfully",
          markCompletedSuccess: "Marked as completed"
        },
        pagination: {
          total: "Total {{count}} items"
        },
        tooltip: {
          startDate: "The date from which the reminder takes effect, default today",
          nextTriggerDate: "Leave empty to auto calculate based on frequency parameters"
        }
      }
    }
  },
  'zh-CN': {
    common: {
      button: {
        submit: "提交",
        cancel: "取消",
        delete: "删除",
        edit: "编辑",
        save: "保存",
        back: "返回",
        confirm: "确认",
        upload: "上传",
        create: "创建",
        close: "关闭",
        search: "搜索",
        reset: "重置"
      },
      status: {
        loading: "加载中...",
        success: "成功",
        error: "错误",
        pending: "待处理",
        completed: "已完成",
        failed: "失败"
      },
      action: {
        confirmDelete: "确定要删除吗？",
        operationSuccess: "操作成功",
        operationFailed: "操作失败",
        deleteSuccess: "删除成功",
        createSuccess: "创建成功",
        updateSuccess: "更新成功",
        uploadSuccess: "上传成功",
        noData: "暂无数据"
      },
      navigation: {
        home: "首页",
        dashboard: "工作台",
        admin: "管理后台",
        profile: "个人资料",
        settings: "设置",
        logout: "退出登录"
      },
      language: {
        switch: "语言",
        english: "English",
        chinese: "简体中文"
      }
    },
    auth: {
      login: {
        title: "登录",
        emailLabel: "邮箱",
        emailPlaceholder: "请输入邮箱",
        passwordLabel: "密码",
        passwordPlaceholder: "请输入密码",
        submitButton: "登录",
        registerLink: "还没有账号？注册",
        forgotPassword: "忘记密码？",
        rememberMe: "记住我"
      },
      register: {
        title: "注册",
        emailLabel: "邮箱",
        emailPlaceholder: "请输入邮箱",
        passwordLabel: "密码",
        passwordPlaceholder: "请输入密码",
        confirmPasswordLabel: "确认密码",
        confirmPasswordPlaceholder: "请确认密码",
        nicknameLabel: "昵称（可选）",
        nicknamePlaceholder: "请输入昵称",
        submitButton: "注册",
        loginLink: "已有账号？登录",
        termsAndPrivacy: "注册即表示您同意我们的服务条款和隐私政策"
      },
      logout: {
        confirmTitle: "确认退出",
        confirmMessage: "确定要退出登录吗？",
        success: "退出成功"
      }
    },
    validation: {
      required: "此字段为必填项",
      emailInvalid: "邮箱格式不正确",
      passwordTooShort: "密码至少需要 6 个字符",
      passwordTooWeak: "密码必须包含字母和数字",
      passwordMismatch: "两次输入的密码不一致",
      emailExists: "邮箱已存在",
      loginFailed: "邮箱或密码错误",
      networkError: "网络错误，请重试",
      serverError: "服务器错误，请稍后重试",
      fileTooLarge: "文件大小超出限制",
      fileTypeNotSupported: "不支持的文件类型",
      minLength: "至少需要 {{count}} 个字符",
      maxLength: "不能超过 {{count}} 个字符",
      min: "最小值为 {{count}}",
      max: "最大值为 {{count}}"
    },
    admin: {
      title: "管理后台",
      dashboard: {
        welcome: "欢迎来到管理后台",
        description: "在这里管理您的应用程序",
        stats: {
          totalUsers: "用户总数",
          totalImages: "图片总数",
          totalTags: "标签总数"
        }
      },
      imageManage: {
        title: "图片管理",
        tabs: {
          imageList: "图片列表",
          tagManagement: "标签管理"
        },
        table: {
          columns: {
            id: "ID",
            name: "名称",
            url: "地址",
            tags: "标签",
            status: "状态",
            createdAt: "创建时间",
            actions: "操作"
          },
          noData: "暂无图片"
        },
        upload: {
          title: "上传图片",
          description: "点击或拖拽文件到此处上传",
          hint: "支持单个或批量上传，最多 10 个文件。",
          button: "选择文件",
          batchUpload: "批量上传"
        },
        tag: {
          title: "标签管理",
          create: "创建标签",
          edit: "编辑标签",
          delete: "删除标签",
          tagName: "标签名称",
          deleteConfirm: "确定要删除此标签吗？",
          defaultTagWarning: "不能删除默认标签"
        },
        actions: {
          view: "查看",
          edit: "编辑",
          delete: "删除",
          changeTag: "更改标签"
        },
        status: {
          active: "启用",
          inactive: "禁用"
        }
      },
      form: {
        create: "创建{{type}}",
        edit: "编辑{{type}}",
        name: "名称",
        description: "描述",
        save: "保存",
        cancel: "取消"
      }
    },
    dashboard: {
      title: "工作台",
      welcome: "欢迎，{{name}}！",
      subtitle: "这是您今天的应用程序动态。",
      stats: {
        totalImages: "图片总数",
        totalTags: "标签总数",
        recentActivity: "最近活动"
      },
      quickActions: {
        title: "快速操作",
        manageImages: "管理图片",
        manageTags: "管理标签",
        viewProfile: "查看资料"
      },
      emptyState: {
        title: "暂无数据",
        description: "开始上传一些图片或创建标签吧。"
      }
    },
    home: {
      hero: {
        title: "欢迎使用工具集合平台",
        subtitle: "高效、简洁、现代化的工具体验",
        getStarted: "立即开始",
        enterDashboard: "进入工作台"
      },
      features: {
        title: "我们的工具",
        subtitle: "更多工具正在开发中，敬请期待",
        vocabulary: {
          title: "单词本",
          description: "查询和收藏中日文单词，包含详细释义和例句"
        },
        reminder: {
          title: "提醒事项",
          description: "设置重要事项提醒，永不错过关键时刻"
        },
        tasks: {
          title: "任务管理",
          description: "高效管理您的待办事项，轻松规划工作和生活"
        },
        notes: {
          title: "笔记工具",
          description: "随时记录您的灵感，支持富文本和 Markdown"
        },
        analytics: {
          title: "数据分析",
          description: "可视化您的数据，生成专业的图表和报表"
        },
        utilities: {
          title: "实用工具",
          description: "更多实用小工具，提升您的工作效率"
        }
      }
    },
    vocabulary: {
      title: "单词本",
      tabs: {
        search: "单词查询",
        myWords: "我的单词本"
      },
      search: {
        placeholder: "请输入中文或日文单词",
        button: "查询",
        searching: "查询中...",
        notFound: "未找到相关单词",
        tryAgain: "试试其他单词",
        fromCache: "来自缓存"
      },
      word: {
        frequency: "常用度",
        example: "例句",
        usage: "用法说明",
        synonyms: "同义词",
        collect: "加入单词本",
        collected: "已加入",
        remove: "移除",
        myNote: "我的笔记",
        collectedAt: "收藏时间",
        confirmRemove: "确定要从单词本中移除这个单词吗？",
        removeSuccess: "移除成功",
        collectSuccess: "已加入单词本",
        pronounce: "发音",
        pitch: "声调",
        noTextToSpeak: "没有可发音的文本",
        speechNotSupported: "您的浏览器不支持语音功能",
        speechError: "发音失败，请重试",
        stopSpeaking: "停止发音"
      },
      myWords: {
        empty: "您的单词本还是空的",
        emptyHint: "快去查询单词并添加吧",
        status: {
          all: "全部",
          new: "新学习",
          learning: "学习中",
          mastered: "已掌握"
        },
        total: "共 {{count}} 个单词"
      },
      error: {
        searchFailed: "查询失败",
        collectFailed: "添加失败",
        removeFailed: "移除失败",
        loadFailed: "加载失败",
        networkError: "网络错误，请重试",
        textRequired: "请输入单词",
        textTooLong: "单词长度不能超过 500 个字符"
      },
      pos: {
        noun: "名词",
        verb: "动词",
        adjective: "形容词",
        adverb: "副词",
        particle: "助词"
      },
      development: {
        underDevelopment: "功能开发中",
        comingSoon: "敬请期待..."
      },
      reminder: {
        title: "提醒事项",
        frequency: {
          once: "单次",
          daily: "每天",
          everyXDays: "每隔 X 天",
          weekly: "每周",
          monthly: "每月",
          yearly: "每年"
        },
        weekDays: {
          sunday: "周日",
          monday: "周一",
          tuesday: "周二",
          wednesday: "周三",
          thursday: "周四",
          friday: "周五",
          saturday: "周六"
        },
        status: {
          triggerToday: "今日待完成",
          overdue: "已过期",
          completedToday: "今日已完成",
          notStarted: "未开始",
          completed: "已完成",
          deleted: "已删除"
        },
        table: {
          title: "标题",
          description: "描述",
          frequency: "频率",
          nextTrigger: "下次触发",
          status: "状态",
          actions: "操作"
        },
        form: {
          createReminder: "创建提醒",
          editReminder: "编辑提醒",
          title: "标题",
          description: "描述",
          frequency: "频率",
          intervalDays: "间隔天数",
          weekDays: "星期",
          dayOfMonth: "每月日期",
          triggerDate: "触发日期",
          startDate: "开始日期",
          nextTriggerDate: "下次触发日期",
          ok: "确定",
          cancel: "取消"
        },
        placeholder: {
          title: "请输入提醒标题",
          description: "请输入描述(可选)",
          frequency: "请选择频率",
          intervalDays: "请输入间隔天数",
          weekDays: "请选择星期",
          dayOfMonth: "请输入日期",
          triggerDate: "请选择触发日期",
          startDate: "默认今天",
          nextTriggerDate: "留空自动计算",
          filterFrequency: "筛选频率",
          filterDatabaseStatus: "筛选数据库状态",
          filterDisplayStatus: "筛选显示状态"
        },
        validation: {
          titleRequired: "请输入标题",
          frequencyRequired: "请选择频率",
          intervalDaysRequired: "请输入间隔天数",
          weekDaysRequired: "请选择星期",
          dayOfMonthRequired: "请输入日期",
          triggerDateRequired: "请选择触发日期"
        },
        action: {
          markComplete: "标记完成",
          cannotComplete: "只有今日待完成或已过期的提醒才能标记完成",
          confirmDelete: "确定要删除这个提醒吗?",
          deleteSuccess: "提醒删除成功",
          deleteFailed: "删除失败",
          loadFailed: "加载失败",
          operationFailed: "操作失败",
          updateSuccess: "提醒更新成功",
          createSuccess: "提醒创建成功",
          markCompletedSuccess: "已标记完成"
        },
        pagination: {
          total: "共 {{count}} 条"
        },
        tooltip: {
          startDate: "提醒从哪一天开始生效,默认今天",
          nextTriggerDate: "留空则根据频率参数自动重新计算"
        }
      }
    }
  }
} as const