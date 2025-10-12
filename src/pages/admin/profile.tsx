import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const AdminProfile: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const utils = api.useUtils();

  const { data: userProfile } = api.user.getProfileWithPasswordInfo.useQuery(
    undefined,
    { enabled: !!session }
  );

  const setPasswordMutation = api.user.setPassword.useMutation({
    onSuccess: (data) => {
      setSuccess(data.message);
      setError("");
      setPassword("");
      setConfirmPassword("");
      // Refetch user profile to update hasPassword status
      void utils.user.getProfileWithPasswordInfo.invalidate();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      void router.push("/auth/signin");
    }
  }, [session, status, router]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上である必要があります");
      return;
    }

    setPasswordMutation.mutate({ password });
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>プロフィール - DJ Bingo</title>
        <meta name="description" content="DJ Bingo ユーザープロフィール" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← 管理画面に戻る
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">
                  プロフィール設定
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {session.user?.name}さん
                </span>
                <button
                  onClick={() => signOut()}
                  className="cursor-pointer text-sm text-gray-500 hover:text-gray-700"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                アカウント情報
              </h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    名前
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {userProfile?.name || "未設定"}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    メールアドレス
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {userProfile?.email || "未設定"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    パスワード認証
                  </label>
                  <div className="mt-1 text-sm">
                    {userProfile?.hasPassword ? (
                      <span className="text-green-600">設定済み</span>
                    ) : (
                      <span className="text-gray-500">未設定</span>
                    )}
                  </div>
                </div>
              </div>

              {!userProfile?.hasPassword && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    パスワードを設定
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    パスワードを設定すると、Googleアカウント以外にメールアドレスとパスワードでもログインできるようになります。
                  </p>
                  
                  <form onSubmit={handleSetPassword} className="space-y-4">
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        パスワード
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="6文字以上のパスワードを入力"
                      />
                    </div>
                    
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        パスワード（確認）
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="パスワードを再入力"
                      />
                    </div>

                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                        {success}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={setPasswordMutation.isPending}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {setPasswordMutation.isPending
                        ? "設定中..."
                        : "パスワードを設定"}
                    </button>
                  </form>
                </div>
              )}

              {userProfile?.hasPassword && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    パスワード認証
                  </h3>
                  <p className="text-sm text-gray-600">
                    パスワードが設定されています。メールアドレスとパスワードでログインできます。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminProfile;