import { type NextPage } from "next";
import Head from "next/head";
import { useSession, signOut, signIn } from "next-auth/react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useState } from "react";
import { Modal } from "~/components/ui/Modal";
import {
  GoogleIcon,
  SpotifyIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
} from "~/components/icons";

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
                  <ChevronLeftIcon />
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
                  <ChevronDownIcon />
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
                      <GoogleIcon />
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
                      <SpotifyIcon className="h-6 w-6 text-white" />
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
