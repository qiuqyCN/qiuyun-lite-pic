// history.ts
// 历史记录页面

import { getHistory, clearHistory, removeHistoryItem } from '../../utils/history';

Component({
  data: {
    historyList: [] as any[],
    hasMore: false,
    touchStartX: 0,
    touchStartY: 0,
    currentSwipingId: null as string | null,
    swipeThreshold: -80 // 滑动阈值，负值表示向左滑动
  },

  lifetimes: {
    attached() {
      this.loadHistory();
    }
  },

  pageLifetimes: {
    show() {
      this.loadHistory();
    }
  },

  methods: {
    // 格式化相对时间
    formatRelativeTime(timestamp: number): string {
      const now = Date.now();
      const diff = now - timestamp;
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      const week = 7 * day;
      const month = 30 * day;

      if (diff < minute) {
        return '刚刚';
      } else if (diff < hour) {
        return `${Math.floor(diff / minute)}分钟前`;
      } else if (diff < day) {
        return `${Math.floor(diff / hour)}小时前`;
      } else if (diff < week) {
        return `${Math.floor(diff / day)}天前`;
      } else if (diff < month) {
        return `${Math.floor(diff / week)}周前`;
      } else {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    },

    // 格式化完整时间
    formatTime(timestamp: number): string {
      const date = new Date(timestamp);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${month}-${day} ${hours}:${minutes}`;
    },

    /**
     * 判断颜色是否为浅色
     * 支持 HEX、RGB、HSL 格式
     * @param color 颜色值
     * @returns 是否为浅色
     */
    isLightColor(color: string): boolean {
      if (!color) return false;

      let r = 0, g = 0, b = 0;

      // HEX 格式: #ffffff 或 #fff
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        if (hex.length === 3) {
          // 短格式 #fff
          r = parseInt(hex[0] + hex[0], 16) || 0;
          g = parseInt(hex[1] + hex[1], 16) || 0;
          b = parseInt(hex[2] + hex[2], 16) || 0;
        } else {
          // 长格式 #ffffff
          r = parseInt(hex.substring(0, 2), 16) || 0;
          g = parseInt(hex.substring(2, 4), 16) || 0;
          b = parseInt(hex.substring(4, 6), 16) || 0;
        }
      }
      // RGB 格式: rgb(255, 255, 255)
      else if (color.startsWith('rgb(')) {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          r = parseInt(match[1], 10) || 0;
          g = parseInt(match[2], 10) || 0;
          b = parseInt(match[3], 10) || 0;
        }
      }
      // RGBA 格式: rgba(255, 255, 255, 1)
      else if (color.startsWith('rgba(')) {
        const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
        if (match) {
          r = parseInt(match[1], 10) || 0;
          g = parseInt(match[2], 10) || 0;
          b = parseInt(match[3], 10) || 0;
        }
      }
      // HSL 格式: hsl(360, 100%, 100%)
      else if (color.startsWith('hsl(')) {
        const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (match) {
          const h = parseInt(match[1], 10) / 360;
          const s = parseInt(match[2], 10) / 100;
          const l = parseInt(match[3], 10) / 100;
          // HSL 转 RGB
          const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
          };
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
          g = Math.round(hue2rgb(p, q, h) * 255);
          b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
        }
      }
      // 不支持的格式
      else {
        return false;
      }

      // 计算亮度（YIQ公式）
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      // 亮度大于200认为是浅色
      return brightness > 200;
    },

    loadHistory() {
      const history = getHistory();

      // 调试：打印原始数据到控制台
      console.log('=== 历史记录原始数据 ===');
      console.log(JSON.stringify(history, null, 2));
      console.log('========================');

      // 添加相对时间和格式化时间，以及颜色文字颜色
      const formattedHistory = history.map(item => {
        const formattedItem: any = {
          ...item,
          timeStr: this.formatTime(item.timestamp),
          relativeTime: this.formatRelativeTime(item.timestamp),
          translateX: 0
        };

        // 为取色和标注涂鸦添加边框和文字颜色（浅色时需要才能看清）
        if (item.type === 'colorpicker' && item.params && item.params.color) {
          const isLight = this.isLightColor(item.params.color);
          formattedItem.colorBorder = isLight ? '1px solid #ddd' : 'none';
          formattedItem.colorText = isLight ? '#666' : '#fff';
        }
        if (item.type === 'annotate' && item.params && item.params.brushColor) {
          const isLight = this.isLightColor(item.params.brushColor);
          formattedItem.colorBorder = isLight ? '1px solid #ddd' : 'none';
          formattedItem.colorText = isLight ? '#666' : '#fff';
        }

        return formattedItem;
      });

      this.setData({
        historyList: formattedHistory
      });
    },

    // 触摸开始
    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      const touch = e.touches[0];
      const id = e.currentTarget.dataset.id;
      
      this.setData({
        touchStartX: touch.clientX,
        touchStartY: touch.clientY,
        currentSwipingId: id
      });

      // 重置其他项的滑动状态
      const { historyList } = this.data;
      let needUpdate = false;
      const newList = historyList.map((item: any) => {
        if (item.id !== id && item.translateX !== 0) {
          needUpdate = true;
          return { ...item, translateX: 0 };
        }
        return item;
      });
      
      if (needUpdate) {
        this.setData({ historyList: newList });
      }
    },

    // 触摸移动
    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      const touch = e.touches[0];
      const { touchStartX, currentSwipingId, swipeThreshold, historyList } = this.data;
      
      if (!currentSwipingId) return;

      const deltaX = touch.clientX - touchStartX;
      
      // 只允许向左滑动
      let translateX = deltaX;
      if (translateX > 0) {
        translateX = 0;
      } else if (translateX < swipeThreshold) {
        translateX = swipeThreshold;
      }

      const newList = historyList.map((item: any) => {
        if (item.id === currentSwipingId) {
          return { ...item, translateX };
        }
        return item;
      });

      this.setData({ historyList: newList });
    },

    // 触摸结束
    onTouchEnd(_e: WechatMiniprogram.TouchEvent) {
      const { currentSwipingId, swipeThreshold, historyList } = this.data;
      
      if (!currentSwipingId) return;

      const item = historyList.find((h: any) => h.id === currentSwipingId);
      if (!item) return;

      // 判断是否超过阈值，决定是展开还是收起
      let translateX = 0;
      if (item.translateX <= swipeThreshold / 2) {
        translateX = swipeThreshold; // 展开
      }

      const newList = historyList.map((h: any) => {
        if (h.id === currentSwipingId) {
          return { ...h, translateX };
        }
        return h;
      });

      this.setData({
        historyList: newList,
        currentSwipingId: null
      });
    },

    // 删除单条记录
    onDeleteItem(e: WechatMiniprogram.TouchEvent) {
      const { id } = e.currentTarget.dataset;
      
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？',
        showCancel: true,
        cancelText: '取消',
        confirmText: '删除',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            removeHistoryItem(id);
            this.loadHistory();
            wx.showToast({
              title: '已删除',
              icon: 'success'
            });
          }
        }
      });
    },

    onHistoryTap(e: WechatMiniprogram.TouchEvent) {
      // 如果正在滑动，不触发点击
      const { item } = e.currentTarget.dataset;
      if (item.translateX !== 0) {
        // 收起滑动
        const { historyList } = this.data;
        const newList = historyList.map((h: any) => {
          if (h.id === item.id) {
            return { ...h, translateX: 0 };
          }
          return h;
        });
        this.setData({ historyList: newList });
        return;
      }

      // 预览处理后的图片
      if (item.resultPath) {
        wx.previewImage({
          urls: [item.resultPath],
          current: item.resultPath
        });
      }
    },

    // 图片加载失败
    onImageError(e: WechatMiniprogram.TouchEvent) {
      const { id } = e.currentTarget.dataset;
      const { historyList } = this.data;
      const newList = historyList.map((item: any) => {
        if (item.id === id) {
          return { ...item, imageError: true };
        }
        return item;
      });
      this.setData({ historyList: newList });
    },

    onClearHistory() {
      if (this.data.historyList.length === 0) {
        console.log('历史记录为空，不执行清除');
        return;
      }

      console.log('点击清空按钮，显示确认对话框');

      wx.showModal({
        title: '确认清除',
        content: '确定要清除所有历史记录吗？此操作不可恢复',
        showCancel: true,
        cancelText: '取消',
        confirmText: '清除',
        success: (res) => {
          console.log('对话框结果:', res);
          if (res.confirm) {
            console.log('用户确认清除');
            clearHistory();
            this.setData({ historyList: [] });
            wx.showToast({
              title: '已清除',
              icon: 'success'
            });
          }
        },
        fail: (err) => {
          console.error('showModal 失败:', err);
        }
      });
    },

    // 返回首页
    goToHome() {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
});
