// index.ts
// 首页逻辑 - 分类+列表式工具展示

interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  path: string;
  isHot?: boolean;
  isNew?: boolean;
  isDeveloping?: boolean;
}

interface ToolCategory {
  id: string;
  name: string;
  tools: ToolItem[];
}

interface UsageStats {
  todayCount: number;
  totalCount: number;
  savedSpace: number;
}

Component({
  data: {
    // 工具分类
    categories: [
      {
        id: 'basic',
        name: '基础处理',
        tools: [
          {
            id: 'compress',
            name: '图片压缩',
            description: '智能压缩图片大小，节省存储空间',
            icon: '📦',
            iconBg: '#e8f8e8',
            path: '/pages/compress/compress',
            isHot: true
          },
          {
            id: 'convert',
            name: '格式转换',
            description: '多格式导入，转为 JPG/PNG',
            icon: '🔄',
            iconBg: '#fff0f0',
            path: '/pages/convert/convert'
          },
          {
            id: 'resize',
            name: '尺寸调整',
            description: '裁剪、缩放，适配各种平台尺寸',
            icon: '📐',
            iconBg: '#f0f0ff',
            path: '/pages/resize/resize',
            isHot: true
          },
          {
            id: 'crop',
            name: '图片裁剪',
            description: '自由裁剪，支持多种比例',
            icon: '✂️',
            iconBg: '#ffe8e8',
            path: '/pages/crop/crop'
          },
          {
            id: 'rotate',
            name: '旋转翻转',
            description: '任意角度旋转，水平垂直翻转',
            icon: '↻',
            iconBg: '#e8f8ff',
            path: '/pages/rotate/rotate'
          }
        ]
      },
      {
        id: 'enhance',
        name: '美化编辑',
        tools: [
          {
            id: 'filter',
            name: '滤镜美化',
            description: '15+ 款精选滤镜，一键提升质感',
            icon: '✨',
            iconBg: '#fff8e8',
            path: '/pages/filter/filter'
          },
          {
            id: 'watermark',
            name: '添加水印',
            description: '文字或图片水印，保护作品版权',
            icon: '💧',
            iconBg: '#e8f8ff',
            path: '/pages/watermark/watermark'
          },
          {
            id: 'collage',
            name: '拼图拼接',
            description: '多种布局模板，轻松拼接图片',
            icon: '🖼️',
            iconBg: '#f0fff0',
            path: '/pages/collage/collage'
          },
          {
            id: 'annotate',
            name: '标注涂鸦',
            description: '自由涂鸦标注，支持多种颜色',
            icon: '✏️',
            iconBg: '#fff0e8',
            path: '/pages/annotate/annotate',
            isNew: true
          }
        ]
      },
      {
        id: 'advanced',
        name: '高级功能',
        tools: [
          {
            id: 'cutout',
            name: '智能抠图',
            description: 'AI 自动识别，一键更换背景',
            icon: '✂️',
            iconBg: '#ffe8f0',
            path: '/pages/cutout/cutout',
            isDeveloping: true
          },
          {
            id: 'colorpicker',
            name: '图片取色',
            description: '点击图片获取任意位置颜色值',
            icon: '🎨',
            iconBg: '#f8e8ff',
            path: '/pages/colorpicker/colorpicker',
            isNew: true
          }
        ]
      }
    ] as ToolCategory[],
    
    // 使用统计
    usageStats: {
      todayCount: 0,
      totalCount: 0,
      savedSpace: 0
    } as UsageStats,
    
    // 最近使用
    recentUsed: [] as string[]
  },

  lifetimes: {
    attached() {
      this.loadUsageStats();
    }
  },

  pageLifetimes: {
    show() {
      this.loadUsageStats();
    }
  },

  methods: {
    // 加载使用统计
    loadUsageStats() {
      const stats = wx.getStorageSync('usageStats') || {
        todayCount: 0,
        totalCount: 0,
        savedSpace: 0,
        lastDate: new Date().toDateString()
      };
      
      // 检查是否是新的一天
      const today = new Date().toDateString();
      if (stats.lastDate !== today) {
        stats.todayCount = 0;
        stats.lastDate = today;
      }
      
      this.setData({
        usageStats: {
          todayCount: stats.todayCount || 0,
          totalCount: stats.totalCount || 0,
          savedSpace: stats.savedSpace || 0
        }
      });
    },

    // 导航到工具页面
    navigateToTool(e: WechatMiniprogram.TouchEvent) {
      const { path, isDeveloping } = e.currentTarget.dataset;
      
      // 如果是开发中，显示提示
      if (isDeveloping) {
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
        return;
      }
      
      wx.navigateTo({ url: path });
    },

    // 更新使用统计
    updateUsageStats(savedSpace: number = 0) {
      const stats = wx.getStorageSync('usageStats') || {
        todayCount: 0,
        totalCount: 0,
        savedSpace: 0,
        lastDate: new Date().toDateString()
      };
      
      const today = new Date().toDateString();
      if (stats.lastDate !== today) {
        stats.todayCount = 0;
        stats.lastDate = today;
      }
      
      stats.todayCount++;
      stats.totalCount++;
      stats.savedSpace += savedSpace;
      
      wx.setStorageSync('usageStats', stats);
      
      this.setData({
        usageStats: {
          todayCount: stats.todayCount,
          totalCount: stats.totalCount,
          savedSpace: stats.savedSpace
        }
      });
    }
  }
});
