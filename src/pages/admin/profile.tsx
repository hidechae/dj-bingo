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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
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

  const unlinkGoogleMutation = api.user.unlinkGoogleAccount.useMutation({
    onSuccess: (data) => {
      setSuccess(data.message);
      setError("");
      void utils.user.getProfileWithPasswordInfo.invalidate();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess("");
    },
  });

  const changePasswordMutation = api.user.changePassword.useMutation({
    onSuccess: (data) => {
      setSuccess(data.message);
      setError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
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

  // Handle URL parameters for success/error messages
  useEffect(() => {
    const { success, error: urlError } = router.query;
    
    if (success === "google_linked") {
      setSuccess("Googleアカウントが正常に関連付けられました");
      setError("");
      void utils.user.getProfileWithPasswordInfo.invalidate();
      // Clear URL parameters
      void router.replace("/admin/profile", undefined, { shallow: true });
    } else if (urlError) {
      const errorMessages: Record<string, string> = {
        oauth_error: "Google OAuth認証でエラーが発生しました",
        missing_parameters: "認証パラメータが不足しています",
        invalid_state: "無効な認証状態です",
        unauthorized: "認証されていません",
        token_exchange_failed: "トークン交換に失敗しました",
        user_info_failed: "ユーザー情報の取得に失敗しました",
        account_already_linked: "このGoogleアカウントは既に他のユーザーに関連付けられています",
        user_already_has_google: "このユーザーには既にGoogleアカウントが関連付けられています",
        internal_error: "内部エラーが発生しました",
      };
      
      setError(errorMessages[urlError as string] || "不明なエラーが発生しました");
      setSuccess("");
      // Clear URL parameters
      void router.replace("/admin/profile", undefined, { shallow: true });
    }
  }, [router, utils]);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmNewPassword) {
      setError("新しいパスワードが一致しません");
      return;
    }

    if (newPassword.length < 6) {
      setError("新しいパスワードは6文字以上である必要があります");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Google認証
                  </label>
                  <div className="mt-1 text-sm">
                    {userProfile?.hasGoogleAccount ? (
                      <span className="text-green-600">関連付け済み</span>
                    ) : (
                      <span className="text-gray-500">未関連付け</span>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    パスワード変更
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    パスワードが設定されています。現在のパスワードを変更できます。
                  </p>
                  
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label
                        htmlFor="currentPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        現在のパスワード
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="現在のパスワードを入力"
                      />
                    </div>
                    
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        新しいパスワード
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="6文字以上の新しいパスワードを入力"
                      />
                    </div>
                    
                    <div>
                      <label
                        htmlFor="confirmNewPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        新しいパスワード（確認）
                      </label>
                      <input
                        type="password"
                        id="confirmNewPassword"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="新しいパスワードを再入力"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changePasswordMutation.isPending
                        ? "変更中..."
                        : "パスワードを変更"}
                    </button>
                  </form>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Google認証の管理
                </h3>
                
                {userProfile?.hasGoogleAccount ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Googleアカウントが関連付けられています。Googleアカウントでもログインできます。
                    </p>
                    {userProfile?.hasPassword ? (
                      <button
                        onClick={() => unlinkGoogleMutation.mutate()}
                        disabled={unlinkGoogleMutation.isPending}
                        className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {unlinkGoogleMutation.isPending
                          ? "解除中..."
                          : "Google認証を解除"}
                      </button>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-sm text-yellow-800">
                          パスワードが設定されていないため、Googleアカウントの関連付けを解除できません。
                          先にパスワードを設定してください。
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Googleアカウントを関連付けると、Googleアカウントでもログインできるようになります。
                    </p>
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a
                      href="/api/auth/link-google-oauth"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Googleアカウントを関連付け
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminProfile;