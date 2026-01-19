
import { contextBridge, shell } from 'electron';

// تعريض Electron API بشكل آمن لعملية العرض (Renderer)
contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => {
    // تحقق بسيط لضمان فتح روابط الويب فقط
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
  }
});
