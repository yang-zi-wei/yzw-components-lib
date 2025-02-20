import Quill from 'quill'
const Parchment = Quill.import('parchment')

class AtUserBlot extends Parchment.EmbedBlot {
  static blotName = 'atUser'
  static tagName = 'u'
  static className = 'at-user-text'

  static create(userInfo: { id: number; userName: string }) {
    const { id, userName } = userInfo
    const node = super.create() as HTMLElement
    node.innerText = `@${userName}`
    node.style.color = '#2196F3'
    node.setAttribute('data-username', userName)
    node.setAttribute('data-userid', id.toString())
    return node
  }

  static value(node: HTMLElement) {
    return {
      username: node.dataset.username,
      userid: node.dataset.userid,
    }
  }
  static formats() {
    return true;
  }
}
Quill.register(AtUserBlot)
