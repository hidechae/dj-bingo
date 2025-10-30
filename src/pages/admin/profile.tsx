import { type NextPage } from "next";
import Head from "next/head";
import { useSession, signOut } from "next-auth/react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useState } from "react";

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

  const updateNameMutation = api.user.updateName.useMutation({
    onSuccess: () => {
      void refetch();
      setShowEditNameModal(false);
      setEditedName("");
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
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    認証方法
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    パスワードレス認証（メールリンク）/ OAuth（Google, Spotify）
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() => void router.push("/admin")}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              管理画面に戻る
            </button>
          </div>
        </div>

        {/* 名前編集モーダル */}
        {showEditNameModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* 背景オーバーレイ */}
              <div
                className="bg-opacity-75 fixed inset-0 bg-gray-500 transition-opacity"
                onClick={() => {
                  setShowEditNameModal(false);
                  setEditedName("");
                }}
              ></div>

              {/* モーダルコンテンツ */}
              <div className="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        名前を編集
                      </h3>
                      <div className="mt-4">
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
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={() => {
                      if (editedName.trim()) {
                        updateNameMutation.mutate({ name: editedName });
                      }
                    }}
                    disabled={
                      !editedName.trim() || updateNameMutation.isPending
                    }
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:w-auto"
                  >
                    {updateNameMutation.isPending ? "保存中..." : "保存"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditNameModal(false);
                      setEditedName("");
                    }}
                    disabled={updateNameMutation.isPending}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default AdminProfile;
