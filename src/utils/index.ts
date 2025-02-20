export const parseJson = <T>(data: string): T | undefined => {
  try {
    return JSON.parse(data)
  } catch (error) {
    console.log(`parse解析错误，错误信息为：${error}`)
  }
}
