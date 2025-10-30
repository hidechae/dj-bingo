# コーディングルール

このドキュメントでは、DJ Bingoプロジェクトにおけるコーディング規約とベストプラクティスを定義します。

## 目次

- [UI コンポーネント](#ui-コンポーネント)
  - [モーダルダイアログ](#モーダルダイアログ)

---

## UI コンポーネント

### モーダルダイアログ

モーダルダイアログを実装する際は、必ず共通コンポーネント `Modal` を使用してください。

#### 使用するコンポーネント

```tsx
import { Modal } from "~/components/ui/Modal";
```

#### 基本的な使い方

```tsx
const [showModal, setShowModal] = useState(false);

return (
  <>
    <button onClick={() => setShowModal(true)}>モーダルを開く</button>

    <Modal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      size="md" // "sm" | "md" | "lg" | "xl"
    >
      <div>
        <h3>モーダルのタイトル</h3>
        <p>モーダルの内容</p>
        <button onClick={() => setShowModal(false)}>閉じる</button>
      </div>
    </Modal>
  </>
);
```

#### Props

- `isOpen: boolean` - モーダルの表示/非表示を制御
- `onClose?: () => void` - モーダルを閉じる際のコールバック（背景クリック時に呼ばれる）
- `size?: "sm" | "md" | "lg" | "xl"` - モーダルのサイズ（デフォルト: "md"）
- `className?: string` - 追加のCSSクラス

#### 利点

1. **z-index管理の自動化**: `ModalStackContext`により、複数のモーダルが重なった場合でも適切なz-indexが自動的に設定されます
2. **一貫したUI/UX**: すべてのモーダルで統一されたスタイルと動作を提供します
3. **保守性の向上**: モーダルのスタイルや動作を一箇所で管理できます

#### 禁止事項

❌ **独自のモーダル実装を作成しない**

```tsx
// ❌ 悪い例
<div className="fixed inset-0 z-50">
  <div className="bg-opacity-75 bg-gray-500">{/* 独自のモーダル実装 */}</div>
</div>
```

✅ **共通コンポーネントを使用する**

```tsx
// ✅ 良い例
<Modal isOpen={showModal} onClose={() => setShowModal(false)}>
  {/* モーダルの内容 */}
</Modal>
```

---

## 今後のルール追加について

このドキュメントは継続的に更新されます。新しいコーディングルールやベストプラクティスが確立された際は、このドキュメントに追加してください。

### ルール追加時のガイドライン

1. **セクションを明確に分ける**: 関連するルールをグループ化してください
2. **具体例を含める**: 良い例と悪い例を示してください
3. **理由を説明する**: なぜそのルールが必要なのかを明記してください
4. **目次を更新する**: 新しいセクションを追加した際は目次も更新してください
