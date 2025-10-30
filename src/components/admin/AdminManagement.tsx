import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { useAlert } from "~/hooks/useAlert";

type AdminManagementProps = {
  gameId: string;
  onClose: () => void;
};

export const AdminManagement = ({ gameId, onClose }: AdminManagementProps) => {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [showCopyMessage, setShowCopyMessage] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removingAdminId, setRemovingAdminId] = useState<string | null>(null);
  const { showAlert, AlertComponent } = useAlert();

  const { data: adminData, refetch } = api.bingo.getGameAdmins.useQuery({
    gameId,
  });

  const addAdminMutation = api.bingo.addAdmin.useMutation({
    onSuccess: async (newAdmin) => {
      await refetch();
      setEmail("");

      // メール送信処理
      if (newAdmin && adminData) {
        const adminName = newAdmin.user.name || newAdmin.user.email || "管理者";
        const inviterName =
          adminData.creator.name || adminData.creator.email || "管理者";
        const baseUrl = window.location.origin;

        try {
          // メール送信APIを呼び出し
          const response = await fetch("/api/send-admin-invite", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: newAdmin.user.email,
              adminName,
              gameTitle: adminData.gameTitle,
              inviterName,
              loginUrl: `${baseUrl}/admin`,
            }),
          });

          if (response.ok) {
            showAlert("管理者を追加し、招待メールを送信しました。", {
              variant: "success",
              title: "成功",
            });
          } else {
            // メール送信失敗時もコピーメッセージを表示
            setShowCopyMessage(generateInviteMessage(adminName));
            showAlert(
              "管理者を追加しましたが、メール送信に失敗しました。手動で招待メッセージを送信してください。",
              {
                variant: "warning",
                title: "警告",
              }
            );
          }
        } catch (error) {
          // メール送信エラー時もコピーメッセージを表示
          console.error("Failed to send email:", error);
          setShowCopyMessage(generateInviteMessage(adminName));
          showAlert(
            "管理者を追加しましたが、メール送信に失敗しました。手動で招待メッセージを送信してください。",
            {
              variant: "warning",
              title: "警告",
            }
          );
        }
      }
    },
    onError: () => {
      // Completely suppress error propagation
      // The UI will display the error via addAdminMutation.error
    },
    retry: false, // Always false for mutations as requested
  });

  const removeAdminMutation = api.bingo.removeAdmin.useMutation({
    onSuccess: () => {
      void refetch();
    },
    onError: (error) => {
      // Log error and show user-friendly message
      console.error("Failed to remove admin:", error);
      showAlert("管理者の削除に失敗しました。もう一度お試しください。", {
        variant: "error",
        title: "エラー",
      });
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
    setRemovingAdminId(adminId);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveAdmin = () => {
    if (!removingAdminId) return;
    // Use mutate instead of mutateAsync to avoid unhandled promise rejections
    removeAdminMutation.mutate({
      gameId,
      adminId: removingAdminId,
    });
    setShowRemoveConfirm(false);
    setRemovingAdminId(null);
  };

  const generateInviteMessage = (adminName: string) => {
    const baseUrl = window.location.origin;
    return `${adminName}さんがDJ Bingoゲームの管理者に追加されました！

以下のリンクからログインして管理画面にアクセスできます：
${baseUrl}/admin`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showAlert("メッセージをクリップボードにコピーしました！", {
          variant: "success",
          title: "成功",
        });
      })
      .catch(() => {
        showAlert("コピーに失敗しました。手動でコピーしてください。", {
          variant: "error",
          title: "エラー",
        });
      });
  };

  const closeCopyMessage = () => {
    setShowCopyMessage(null);
  };

  if (!adminData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/20">
        <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AlertComponent />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/20">
        <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              管理者の管理
            </h2>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Add Admin Form */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-medium text-gray-900">
              管理者を追加
            </h3>
            <form onSubmit={handleAddAdmin} className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={addAdminMutation.isPending || !email.trim()}
                className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addAdminMutation.isPending ? "追加中..." : "管理者を追加"}
              </button>
              {addAdminMutation.error && (
                <p className="mt-2 text-sm text-red-600">
                  {addAdminMutation.error.message}
                </p>
              )}
            </form>
          </div>

          {/* Current Admins List */}
          <div>
            <h3 className="mb-3 text-lg font-medium text-gray-900">
              現在の管理者
            </h3>
            <div className="space-y-3">
              {/* Creator */}
              <div className="flex items-center justify-between rounded-md bg-blue-50 p-3">
                <div>
                  <div className="font-medium text-gray-900">
                    {adminData.creator.name || adminData.creator.email}
                  </div>
                  <div className="text-sm text-gray-500">
                    {adminData.creator.email}
                  </div>
                  <div className="text-xs font-medium text-blue-600">
                    作成者
                  </div>
                </div>
              </div>

              {/* Additional Admins */}
              {adminData.admins.map((admin) => {
                const isCurrentUser = session?.user?.id === admin.user.id;
                return (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between rounded-md bg-gray-50 p-3"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {admin.user.name || admin.user.email}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-blue-600">
                            (あなた)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {admin.user.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(admin.addedAt).toLocaleDateString("ja-JP")}{" "}
                        に追加
                      </div>
                    </div>
                    {!isCurrentUser && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.id)}
                        disabled={removeAdminMutation.isPending}
                        className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        削除
                      </button>
                    )}
                  </div>
                );
              })}

              {adminData.admins.length === 0 && (
                <div className="py-4 text-center text-gray-500">
                  追加の管理者はいません
                </div>
              )}
            </div>
          </div>

          {/* Copy Message Modal */}
          {showCopyMessage && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-gray-600/20">
              <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    招待メッセージ
                  </h3>
                  <button
                    onClick={closeCopyMessage}
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <textarea
                    value={showCopyMessage}
                    readOnly
                    className="h-32 w-full resize-none rounded-md border border-gray-300 p-3 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(showCopyMessage)}
                    className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    クリップボードにコピー
                  </button>
                  <button
                    onClick={closeCopyMessage}
                    className="cursor-pointer rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          )}

          <ConfirmDialog
            isOpen={showRemoveConfirm}
            title="管理者の削除"
            message="このユーザーを管理者から削除しますか？"
            confirmLabel="削除"
            confirmVariant="danger"
            onConfirm={confirmRemoveAdmin}
            onCancel={() => {
              setShowRemoveConfirm(false);
              setRemovingAdminId(null);
            }}
          />
        </div>
      </div>
    </>
  );
};
