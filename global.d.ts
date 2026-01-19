
export interface IElectronAPI {
  openExternal: (url: string) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
