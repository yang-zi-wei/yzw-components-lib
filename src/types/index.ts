/** 左侧会话列表 */
export interface ConversationListItem {
  id: string
  title: string
  data: Array<UserInput | Reply>
}

/** 用户输入 */
export interface UserInput {
  inputValue: string
  id: string
}

export interface Reply {
  id: string
  content: string
  reasoning_content: string
  role: string
}

/** AI输出有关内容部分 */
export interface Message {
  content: string
  reasoning_content: string
  role: string
}

export interface Choice {
  // 流式输出存在此字段
  delta?: Message
  // 非流式输出存在此字段
  message?: Message
  finish_reason: string
  index: number
  logprobs: null
}

/** AI输出的token信息 */
export interface Usage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

/** AI的输出 */
export interface ResPonseData {
  choices: Choice[]
  object: string
  usage: Usage
  created: number
  system_fingerprint: null
  model: 'deepseek-r1'
  id: string
}

/** AI的流式输出 */
export interface SteamResponseData {
  choices: [
    {
      delta: {
        content: string
        reasoning_content: string
      }
      finish_reason: null
      index: number
      logprobs: null
    },
  ]
  object: 'chat.completion.chunk'
  usage: null
  created: 1739071797
  system_fingerprint: null
  model: 'deepseek-r1'
  id: string
}
