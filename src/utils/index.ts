/** 微前端下访问基座window方式为：window.rawWindow */
export const getWindow = () => window.rawWindow || window
export const getDocument = () => window.rawWindow?.document || document

export const parseJson = <T>(data: string): T | undefined => {
  try {
    return JSON.parse(data)
  } catch (error) {
    console.log(`parse解析错误，错误信息为：${error}`)
  }
}
