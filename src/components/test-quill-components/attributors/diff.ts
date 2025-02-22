import Quill from "quill";

const Parchment = Quill.import('parchment')

const DiffBg = new Parchment.ClassAttributor(
  // 格式名
  'diff-bg',
  // 对应类名
  'diff-bg',
  // 应用到 Inline 范围
  { scope: Parchment.Scope.INLINE }
);
const DiffBgImage = new Parchment.ClassAttributor(
  // 格式名
  'diff-bg-image',
  // 对应类名
  'diff-bg-image',
  // 应用到 Inline 范围
  { scope: Parchment.Scope.INLINE_BLOT }
);

Quill.register(DiffBg, true)
Quill.register(DiffBgImage, true)
