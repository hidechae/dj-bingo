import { type NextPage } from "next";
import Head from "next/head";
import { useSession, signOut, signIn } from "next-auth/react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useState } from "react";
import { Modal } from "~/components/ui/Modal";

const AdminProfile: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editedName, setEditedName] = useState("");

  const { data: userProfile, refetch } = api.user.getProfile.useQuery(
    undefined,
    {
      enabled: !!session,
    }
  );

  const { data: linkedAccounts, refetch: refetchAccounts } =
    api.user.getLinkedAccounts.useQuery(undefined, {
      enabled: !!session,
    });

  const updateNameMutation = api.user.updateName.useMutation({
    onSuccess: () => {
      void refetch();
      setShowEditNameModal(false);
      setEditedName("");
    },
  });

  const unlinkAccountMutation = api.user.unlinkAccount.useMutation({
    onSuccess: () => {
      void refetchAccounts();
    },
  });

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    void router.push("/auth/signin");
    return null;
  }

  return (
    <>
      <Head>
        <title>プロフィール - DJ Bingo</title>
        <meta name="description" content="ユーザープロフィール" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => void router.push("/admin")}
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  title="管理画面に戻る"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  プロフィール
                </h1>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  <span>{session?.user?.name || session?.user?.email}</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="ring-opacity-5 absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black">
                    <div className="py-1">
                      <button
                        onClick={() => void signOut({ callbackUrl: "/" })}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                ユーザー情報
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                アカウントの基本情報
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">名前</dt>
                  <dd className="mt-1 flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      {userProfile?.name || "未設定"}
                    </span>
                    <button
                      onClick={() => {
                        setEditedName(userProfile?.name || "");
                        setShowEditNameModal(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      編集
                    </button>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    メールアドレス
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {userProfile?.email || "未設定"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* アカウント連携 */}
          <div className="mt-6 overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                アカウント連携
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                複数のログイン方法を連携できます
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="space-y-4">
                {/* Google連携 */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow">
                      <svg className="h-6 w-6" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Google</p>
                      <p className="text-sm text-gray-500">
                        {linkedAccounts?.some((a) => a.provider === "google")
                          ? "連携済み"
                          : "未連携"}
                      </p>
                    </div>
                  </div>
                  {linkedAccounts?.some((a) => a.provider === "google") ? (
                    <button
                      onClick={() =>
                        unlinkAccountMutation.mutate({ provider: "google" })
                      }
                      disabled={unlinkAccountMutation.isPending}
                      className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {unlinkAccountMutation.isPending
                        ? "解除中..."
                        : "連携解除"}
                    </button>
                  ) : (
                    <button
                      onClick={() => void signIn("google")}
                      className="rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      連携する
                    </button>
                  )}
                </div>

                {/* Spotify連携 */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954]">
                      <svg
                        className="h-6 w-6 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Spotify</p>
                      <p className="text-sm text-gray-500">
                        {linkedAccounts?.some((a) => a.provider === "spotify")
                          ? "連携済み"
                          : "未連携"}
                      </p>
                    </div>
                  </div>
                  {linkedAccounts?.some((a) => a.provider === "spotify") ? (
                    <button
                      onClick={() =>
                        unlinkAccountMutation.mutate({ provider: "spotify" })
                      }
                      disabled={unlinkAccountMutation.isPending}
                      className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {unlinkAccountMutation.isPending
                        ? "解除中..."
                        : "連携解除"}
                    </button>
                  ) : (
                    <button
                      onClick={() => void signIn("spotify")}
                      className="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                    >
                      連携する
                    </button>
                  )}
                </div>

                {unlinkAccountMutation.error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">
                      {unlinkAccountMutation.error.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 名前編集モーダル */}
        <Modal
          isOpen={showEditNameModal}
          onClose={() => {
            setShowEditNameModal(false);
            setEditedName("");
          }}
          size="lg"
        >
          <div className="space-y-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              名前を編集
            </h3>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                名前
              </label>
              <input
                type="text"
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="名前を入力"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditNameModal(false);
                  setEditedName("");
                }}
                disabled={updateNameMutation.isPending}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editedName.trim()) {
                    updateNameMutation.mutate({ name: editedName });
                  }
                }}
                disabled={!editedName.trim() || updateNameMutation.isPending}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateNameMutation.isPending ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  );
};

export default AdminProfile;
