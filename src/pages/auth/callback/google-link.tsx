import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

const GoogleLinkCallback: NextPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleGoogleLinking = async () => {
      // This would typically be handled by NextAuth callbacks
      // For now, we'll show a success message and redirect
      try {
        if (session?.user) {
          setStatus("success");
          setMessage("Googleアカウントの関連付けが完了しました");
          
          setTimeout(() => {
            void router.push("/admin/profile");
          }, 2000);
        } else {
          setStatus("error");
          setMessage("認証が必要です");
        }
      } catch (error) {
        console.error("Google linking error:", error);
        setStatus("error");
        setMessage("Googleアカウントの関連付けに失敗しました");
      }
    };

    if (router.isReady) {
      void handleGoogleLinking();
    }
  }, [router, session]);

  return (
    <>
      <Head>
        <title>Google認証関連付け - DJ Bingo</title>
        <meta name="description" content="Google認証関連付け処理" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex max-w-md flex-col items-center justify-center gap-8 px-4 py-16">
          {status === "loading" && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-white mb-2">
                処理中...
              </h1>
              <p className="text-white/70">
                Googleアカウントを関連付けています
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="rounded-full bg-green-600 p-3 mx-auto mb-4 w-fit">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                関連付け完了
              </h1>
              <p className="text-white/70 mb-6">
                {message}
              </p>
              <p className="text-sm text-white/60">
                2秒後にプロフィール画面に戻ります...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="rounded-full bg-red-600 p-3 mx-auto mb-4 w-fit">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                エラーが発生しました
              </h1>
              <p className="text-white/70 mb-6">
                {message}
              </p>
              <Link
                href="/admin/profile"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
              >
                プロフィール画面に戻る
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default GoogleLinkCallback;