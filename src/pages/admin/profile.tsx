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

  const { data: userProfile } = api.user.getProfile.useQuery(undefined, {
    enabled: !!session,
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
              <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
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
                        onClick={() => void router.push("/admin")}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        管理画面に戻る
                      </button>
                      <button
                        onClick={() => void signOut({ callbackUrl: "/" })}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
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
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">名前</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {userProfile?.name || "未設定"}
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
      </main>
    </>
  );
};

export default AdminProfile;
