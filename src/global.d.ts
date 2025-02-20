declare interface Window {
  /** 微前端访问父应用的window */
  rawWindow: Window
  /** 微前端暴露给父应用挂载函数 */
  mount: () => void
  /** 微前端暴露给父应用卸载载函数 */
  unmount: () => void
}
