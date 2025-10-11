import { useState } from "react";
import { api } from "~/utils/api";

type AdminManagementProps = {
  gameId: string;
  onClose: () => void;
};

export const AdminManagement = ({ gameId, onClose }: AdminManagementProps) => {
  const [email, setEmail] = useState("");
  const [showCopyMessage, setShowCopyMessage] = useState<string | null>(null);

  const { data: adminData, refetch } = api.bingo.getGameAdmins.useQuery({
    gameId,
  });

  const addAdminMutation = api.bingo.addAdmin.useMutation({
    onSuccess: async (newAdmin) => {
      await refetch();
      setEmail("");
      // Show copy message for the newly added admin
      setShowCopyMessage(generateInviteMessage(newAdmin.user.name || newAdmin.user.email!));
    },
    onError: () => {
      // Completely suppress error propagation
      // The UI will display the error via addAdminMutation.error
    },
    retry: false, // Don't retry on error
  });

  const removeAdminMutation = api.bingo.removeAdmin.useMutation({
    onSuccess: () => {
      void refetch();
    },
    onError: (error) => {
      // Log error and show user-friendly message
      console.error("Failed to remove admin:", error);
      alert("管理者の削除に失敗しました。もう一度お試しください。");
    },
  });

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      // Use mutate instead of mutateAsync to avoid unhandled promise rejections
      addAdminMutation.mutate({
        gameId,
        email: email.trim(),
      });
    } catch {
      // Catch any synchronous errors and suppress them completely
      // The error will still be available via addAdminMutation.error for UI display
    }
  };

  const handleRemoveAdmin = (adminId: string) => {
    if (!confirm("このユーザーを管理者から削除しますか？")) return;

    // Use mutate instead of mutateAsync to avoid unhandled promise rejections
    removeAdminMutation.mutate({
      gameId,
      adminId,
    });
  };

  const generateInviteMessage = (adminName: string) => {
    const baseUrl = window.location.origin;
    return `${adminName}さんがDJ Bingoゲームの管理者に追加されました！

以下のリンクからログインして管理画面にアクセスできます：
${baseUrl}/admin

※Google認証（Gmail または Google Workspace アカウント）でログインしてください。`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("メッセージをクリップボードにコピーしました！");
    }).catch(() => {
      alert("コピーに失敗しました。手動でコピーしてください。");
    });
  };

  const closeCopyMessage = () => {
    setShowCopyMessage(null);
  };

  if (!adminData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">管理者の管理</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Add Admin Form */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">管理者を追加</h3>
          <form onSubmit={handleAddAdmin} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                ※ Google認証でログインできるアドレス（Gmail または Google Workspace）のみ対応しています
              </p>
            </div>
            <button
              type="submit"
              disabled={addAdminMutation.isPending || !email.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addAdminMutation.isPending ? "追加中..." : "管理者を追加"}
            </button>
            {addAdminMutation.error && (
              <p className="text-red-600 text-sm mt-2">
                {addAdminMutation.error.message}
              </p>
            )}
          </form>
        </div>

        {/* Current Admins List */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">現在の管理者</h3>
          <div className="space-y-3">
            {/* Creator */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
              <div>
                <div className="font-medium text-gray-900">
                  {adminData.creator.name || adminData.creator.email}
                </div>
                <div className="text-sm text-gray-500">
                  {adminData.creator.email}
                </div>
                <div className="text-xs text-blue-600 font-medium">作成者</div>
              </div>
            </div>

            {/* Additional Admins */}
            {adminData.admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {admin.user.name || admin.user.email}
                  </div>
                  <div className="text-sm text-gray-500">{admin.user.email}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(admin.addedAt).toLocaleDateString("ja-JP")} に追加
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAdmin(admin.id)}
                  disabled={removeAdminMutation.isPending}
                  className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                >
                  削除
                </button>
              </div>
            ))}

            {adminData.admins.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                追加の管理者はいません
              </div>
            )}
          </div>
        </div>

        {/* Copy Message Modal */}
        {showCopyMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  招待メッセージ
                </h3>
                <button
                  onClick={closeCopyMessage}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="mb-4">
                <textarea
                  value={showCopyMessage}
                  readOnly
                  className="w-full h-32 p-3 border border-gray-300 rounded-md text-sm resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(showCopyMessage)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  クリップボードにコピー
                </button>
                <button
                  onClick={closeCopyMessage}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};