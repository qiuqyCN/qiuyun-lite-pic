import drawQrcode from '../../miniprogram_npm/weapp-qrcode-canvas-2d/index';
import { saveToHistory } from '../../utils/history';

interface QRCodeData {
  currentType: string;
  typeList: Array<{ id: string; name: string; icon: string }>;
  textContent: string;
  urlContent: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiType: string;
  cardName: string;
  cardPhone: string;
  cardEmail: string;
  cardCompany: string;
  showMoreParams: boolean;
  foregroundColor: string;
  backgroundColor: string;
  logoPath: string;
  logoSize: number;
  correctLevel: number;
  correctLevelList: Array<{ id: number; name: string; value: number }>;
  hasGenerated: boolean;
  qrImagePath: string;
  fileType: string;
  isSaving: boolean;
  colorOptions: Array<{ id: string; name: string; color: string }>;
}

Page({
  data: {
    currentType: 'text',
    typeList: [
      { id: 'text', name: '文本', icon: '📝' },
      { id: 'url', name: '网址', icon: '🔗' },
      { id: 'wifi', name: 'WiFi', icon: '📶' },
      { id: 'card', name: '名片', icon: '👤' }
    ],
    textContent: '',
    urlContent: '',
    wifiSsid: '',
    wifiPassword: '',
    wifiType: 'WPA',
    cardName: '',
    cardPhone: '',
    cardEmail: '',
    cardCompany: '',
    showMoreParams: false,
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    logoPath: '',
    logoSize: 20,
    correctLevel: 1,
    correctLevelList: [
      { id: 0, name: 'L - 低', value: 1 },
      { id: 1, name: 'M - 中', value: 0 },
      { id: 2, name: 'Q - 较高', value: 3 },
      { id: 3, name: 'H - 高', value: 2 }
    ],
    hasGenerated: false,
    qrImagePath: '',
    fileType: 'jpg',
    isSaving: false,
    colorOptions: [
      { id: 'black', name: '黑色', color: '#000000' },
      { id: 'green', name: '绿色', color: '#41bc3f' },
      { id: 'blue', name: '蓝色', color: '#007aff' },
      { id: 'red', name: '红色', color: '#ff3b30' },
      { id: 'purple', name: '紫色', color: '#af52de' }
    ]
  } as QRCodeData,

  debounceTimer: null as number | null,
  canvasNode: null as any,

  onLoad() {
    this.initCanvas();
  },

  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#qrcodeCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          this.canvasNode = res[0].node;
        }
      });
  },

  onTypeSelect(e: any) {
    const { item } = e.detail;
    this.setData({ currentType: item.id });
    this.debounceGenerate();
  },

  onInputChange(e: any) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
    this.debounceGenerate();
  },

  onWifiTypeChange(e: any) {
    const types = ['WPA', 'WEP', 'nopass'];
    this.setData({ wifiType: types[Number(e.detail.value)] });
    this.debounceGenerate();
  },

  toggleMoreParams() {
    this.setData({ showMoreParams: !this.data.showMoreParams });
  },

  onForegroundColorChange(e: any) {
    const { color } = e.currentTarget.dataset;
    this.setData({ foregroundColor: color });
    this.debounceGenerate();
  },

  onBackgroundColorChange(e: any) {
    const { color } = e.currentTarget.dataset;
    this.setData({ backgroundColor: color });
    this.debounceGenerate();
  },

  onLogoSizeChange(e: any) {
    this.setData({ logoSize: e.detail.value });
    this.debounceGenerate();
  },

  onCorrectLevelChange(e: any) {
    this.setData({ correctLevel: Number(e.detail.value) });
    this.debounceGenerate();
  },

  async chooseLogo() {
    try {
      const res = await wx.showActionSheet({
        itemList: ['从手机相册选择', '从聊天记录选择']
      });

      let tempFilePath = '';

      if (res.tapIndex === 0) {
        const mediaRes = await wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album']
        });
        tempFilePath = mediaRes.tempFiles[0].tempFilePath;
      } else if (res.tapIndex === 1) {
        const msgRes = await wx.chooseMessageFile({
          count: 1,
          type: 'image'
        });
        tempFilePath = msgRes.tempFiles[0].path;
      }

      if (tempFilePath) {
        this.setData({ logoPath: tempFilePath });
        this.debounceGenerate();
      }
    } catch (err) {
      console.log('选择Logo取消或失败:', err);
    }
  },

  removeLogo() {
    this.setData({ logoPath: '' });
    this.debounceGenerate();
  },

  getQRContent(): string {
    const { currentType } = this.data;
    switch (currentType) {
      case 'text':
        return this.data.textContent;
      case 'url':
        return this.data.urlContent;
      case 'wifi':
        return `WIFI:T:${this.data.wifiType};S:${this.data.wifiSsid};P:${this.data.wifiPassword};;`;
      case 'card':
        let vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${this.data.cardName}\nTEL:${this.data.cardPhone}`;
        if (this.data.cardEmail) vcard += `\nEMAIL:${this.data.cardEmail}`;
        if (this.data.cardCompany) vcard += `\nORG:${this.data.cardCompany}`;
        vcard += `\nEND:VCARD`;
        return vcard;
      default:
        return '';
    }
  },

  debounceGenerate() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.generateQRCode();
    }, 300);
  },

  generateQRCode() {
    const content = this.getQRContent();
    if (!content.trim()) {
      this.setData({ hasGenerated: false, qrImagePath: '' });
      return;
    }

    if (!this.canvasNode) {
      this.initCanvas();
      return;
    }

    const { foregroundColor, backgroundColor, logoPath, logoSize, correctLevel, correctLevelList } = this.data;
    const canvas = this.canvasNode;

    // 获取正确的纠错级别值
    const correctLevelValue = correctLevelList[correctLevel].value;

    const options: any = {
      canvas,
      text: content,
      width: 200,
      height: 200,
      foreground: foregroundColor,
      background: backgroundColor,
      correctLevel: correctLevelValue,
    };

    if (logoPath) {
      const logoImg = canvas.createImage();
      logoImg.src = logoPath;
      logoImg.onload = () => {
        const logoWidth = Math.floor(200 * (logoSize / 100));
        options.image = {
          imageResource: logoImg,
          width: logoWidth,
          height: logoWidth,
          round: false
        };
        this.drawQRCode(options);
      };
      logoImg.onerror = () => {
        this.drawQRCode(options);
      };
    } else {
      this.drawQRCode(options);
    }
  },

  drawQRCode(options: any) {
    try {
      drawQrcode(options);
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvas: this.canvasNode,
          fileType: this.data.fileType as 'jpg' | 'png',
          success: (res) => {
            this.setData({
              hasGenerated: true,
              qrImagePath: res.tempFilePath
            });
          },
          fail: (err) => {
            console.error('导出二维码失败:', err);
          }
        });
      }, 200);
    } catch (err) {
      console.error('绘制二维码失败:', err);
    }
  },

  onFormatChange(e: any) {
    this.setData({ fileType: e.detail.format });
    if (this.data.hasGenerated) {
      this.debounceGenerate();
    }
  },

  onSave() {
    if (!this.data.qrImagePath) {
      wx.showToast({ title: '请先生成二维码', icon: 'none' });
      return;
    }

    this.setData({ isSaving: true });

    wx.saveImageToPhotosAlbum({
      filePath: this.data.qrImagePath,
      success: () => {
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.saveToHistory();
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '需要权限',
            content: '请允许保存图片到相册',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      },
      complete: () => {
        this.setData({ isSaving: false });
      }
    });
  },

  saveToHistory() {
    const { currentType, qrImagePath, textContent, urlContent, wifiSsid, cardName } = this.data;
    const typeMap: Record<string, string> = {
      text: '文本',
      url: '网址',
      wifi: 'WiFi',
      card: '名片'
    };

    saveToHistory({
      type: 'qrcode',
      typeName: `二维码生成 - ${typeMap[currentType]}`,
      originalPath: '',
      resultPath: qrImagePath,
      params: {
        qrcodeType: currentType,
        content: currentType === 'text' ? textContent :
                 currentType === 'url' ? urlContent :
                 currentType === 'wifi' ? wifiSsid :
                 currentType === 'card' ? cardName : ''
      }
    });
  },
  

  onReset() {
    this.setData({
      textContent: '',
      urlContent: '',
      wifiSsid: '',
      wifiPassword: '',
      wifiType: 'WPA',
      cardName: '',
      cardPhone: '',
      cardEmail: '',
      cardCompany: '',
      foregroundColor: '#000000',
      backgroundColor: '#ffffff',
      logoPath: '',
      logoSize: 20,
      correctLevel: 1,
      hasGenerated: false,
      qrImagePath: '',
      fileType: 'jpg'
    });
  }
});