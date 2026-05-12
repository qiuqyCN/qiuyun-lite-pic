import { saveImageToAlbumWithUI, shareImageToChat } from '../../utils/file';

Component({
  properties: {
    isLoading: {
      type: Boolean,
      value: false
    },
    resetText: {
      type: String,
      value: '重置'
    },
    saveText: {
      type: String,
      value: '保存到相册'
    },
    loadingText: {
      type: String,
      value: '处理中...'
    },
    disabled: {
      type: Boolean,
      value: false
    },
    showShareChat: {
      type: Boolean,
      value: true
    },
    filePath: {
      type: String,
      value: ''
    }
  },

  data: {
    _saving: false
  },

  methods: {
    onResetTap() {
      if (this.data.isLoading || this.data._saving) return;
      this.triggerEvent('reset');
    },

    async onSaveTap() {
      if (this.data.isLoading || this.data.disabled || this.data._saving) return;

      if (this.data.filePath) {
        this.setData({ _saving: true });
        try {
          const success = await saveImageToAlbumWithUI(this.data.filePath);
          if (success) {
            this.triggerEvent('aftersave', { filePath: this.data.filePath });
          }
        } finally {
          this.setData({ _saving: false });
        }
      } else {
        this.triggerEvent('save');
      }
    },

    onShareChatTap() {
      if (this.data.isLoading || this.data.disabled || this.data._saving) return;
      if (!this.data.filePath) return;

      shareImageToChat(this.data.filePath);
      this.triggerEvent('aftersave', { filePath: this.data.filePath });
    }
  }
});
