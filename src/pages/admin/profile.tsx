import { type NextPage } from "next";
import Head from "next/head";
import { useSession, signOut } from "next-auth/react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { GoogleIcon } from "~/components/icons/GoogleIcon";

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
  const [showDropdown, setShowDropdown] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

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
        account_already_linked:
          "このGoogleアカウントは既に他のユーザーに関連付けられています",
        user_already_has_google:
          "このユーザーには既にGoogleアカウントが関連付けられています",
        internal_error: "内部エラーが発生しました",
      };

      setError(
        errorMessages[urlError as string] || "不明なエラーが発生しました"
      );
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
        <div className="sticky top-0 z-50 bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/admin")}
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  title="ダッシュボードに戻る"
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
                <h1 className="text-xl font-semibold text-gray-900">
                  プロフィール設定
                </h1>
              </div>
              <div className="relative" data-dropdown>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="メニュー"
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
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="ring-opacity-5 absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black">
                    <div className="py-1">
                      <button
                        disabled
                        className="block w-full cursor-not-allowed px-4 py-2 text-left text-sm text-gray-400"
                      >
                        マイページ
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          void signOut();
                        }}
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white shadow-sm">
            <div className="p-6">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                アカウント情報
              </h2>

              <div className="mb-6 space-y-4">
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
                  <h3 className="mb-4 text-lg font-medium text-gray-900">
                    パスワードを設定
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
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
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="パスワードを再入力"
                      />
                    </div>

                    {error && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                        {success}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={setPasswordMutation.isPending}
                      className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                  <h3 className="mb-4 text-lg font-medium text-gray-900">
                    パスワード変更
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
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
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="新しいパスワードを再入力"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {changePasswordMutation.isPending
                        ? "変更中..."
                        : "パスワードを変更"}
                    </button>
                  </form>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="mb-4 text-lg font-medium text-gray-900">
                  Google認証の管理
                </h3>

                {userProfile?.hasGoogleAccount ? (
                  <div>
                    <p className="mb-4 text-sm text-gray-600">
                      Googleアカウントが関連付けられています。Googleアカウントでもログインできます。
                    </p>
                    {userProfile?.hasPassword ? (
                      <button
                        onClick={() => unlinkGoogleMutation.mutate()}
                        disabled={unlinkGoogleMutation.isPending}
                        className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {unlinkGoogleMutation.isPending
                          ? "解除中..."
                          : "Google認証を解除"}
                      </button>
                    ) : (
                      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                        <p className="text-sm text-yellow-800">
                          パスワードが設定されていないため、Googleアカウントの関連付けを解除できません。
                          先にパスワードを設定してください。
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="mb-4 text-sm text-gray-600">
                      Googleアカウントを関連付けると、Googleアカウントでもログインできるようになります。
                    </p>
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a
                      href="/api/auth/link-google-oauth"
                      className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                    >
                      <GoogleIcon className="mr-2 h-4 w-4" />
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
