import Quill from 'quill'
const Parchment = Quill.import('parchment')

class AtUserBlot extends Parchment.EmbedBlot {
  static blotName = 'atUser'
  static tagName = 'u'
  static className = 'at-user-text'

  static create(userInfo: { userId: number; userName: string }) {
    const { userId, userName } = userInfo
    const node = super.create() as HTMLElement
    node.innerText = `@${userName}`
    node.style.color = '#2196F3'
    node.setAttribute('data-user-name', userName)
    node.setAttribute('data-user-id', userId.toString())
    return node
  }

  static value(node: HTMLElement) {
    return {
      userName: node.dataset.userName,
      userId: node.dataset.userId,
    }
  }
  static formats() {
    return true;
  }
}
Quill.register(AtUserBlot)
