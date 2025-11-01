import { type NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { api } from "~/utils/api";

const QRCodePrintPage: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [participantUrl, setParticipantUrl] = useState<string>("");

  const { data: bingoGame } = api.bingo.getByIdForAdmin.useQuery(
    { id: id as string },
    { enabled: !!id && !!session }
  );

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      void router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (id && typeof window !== "undefined") {
      const url = `${window.location.origin}/game/${id}`;
      setParticipantUrl(url);
      QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
      })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [id]);

  if (status === "loading" || !bingoGame || !qrCodeDataUrl) {
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{bingoGame.title} - QRコード</title>
        <meta name="description" content="ビンゴ参加用QRコード" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8">
        <div className="flex flex-col items-center space-y-8 text-center">
          {/* DJ Bingo ロゴ */}
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-gray-900">DJ Bingo</h1>
            <h2 className="text-3xl font-semibold text-gray-700">
              {bingoGame.title}
            </h2>
          </div>

          {/* QRコード */}
          <div className="rounded-lg border-4 border-gray-300 bg-white p-8 shadow-lg">
            {qrCodeDataUrl && (
              <img
                src={qrCodeDataUrl}
                alt="参加用QRコード"
                className="h-auto w-96"
              />
            )}
          </div>

          {/* URL */}
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-700">参加用URL</p>
            <p className="font-mono text-lg break-all text-gray-600">
              {participantUrl}
            </p>
          </div>

          {/* 説明 */}
          <div className="mt-8 space-y-2 text-gray-600">
            <p className="text-lg">上記のQRコードをスキャンして</p>
            <p className="text-lg">ビンゲームに参加してください</p>
          </div>

          {/* 印刷ボタン（印刷時は非表示） */}
          <div className="mt-8 print:hidden">
            <button
              onClick={() => window.print()}
              className="cursor-pointer rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              印刷する
            </button>
          </div>
        </div>
      </main>

      {/* 印刷用スタイル */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 2cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
};

export default QRCodePrintPage;
