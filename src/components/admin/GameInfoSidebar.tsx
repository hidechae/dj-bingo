import Image from "next/image";
import Link from "next/link";
import { GameStatus, type BingoGame, type Participant } from "~/types";

type GameInfoSidebarProps = {
  bingoGame: BingoGame;
  participants: Participant[];
  qrCodeDataUrl: string;
  gameUrl: string;
  gameId: string;
};

export const GameInfoSidebar = ({
  bingoGame,
  participants,
  qrCodeDataUrl,
  gameUrl,
  gameId,
}: GameInfoSidebarProps) => {
  const winnersCount = participants?.filter((p) => p.hasWon).length ?? 0;
  const completedGridsCount =
    participants?.filter((p) => p.isGridComplete).length ?? 0;

  const currentStatus = bingoGame.status as GameStatus;

  return (
    <div className="space-y-6">
      {/* QR Code */}
      {currentStatus === GameStatus.ENTRY && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            参加用QRコード
          </h3>
          {qrCodeDataUrl && (
            <div className="text-center">
              <Image
                src={qrCodeDataUrl}
                alt="QR Code for game participation"
                width={200}
                height={200}
                className="mx-auto mb-4"
              />
              <p className="text-sm text-gray-600">
                参加者はこのQRコードをスキャンして参加
              </p>
              <p className="mt-2 text-xs break-all text-gray-500">{gameUrl}</p>
              <div className="mt-4">
                <Link
                  href={`/admin/game/${gameId}/qr`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  印刷用ページ
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Info */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-900">ゲーム情報</h3>
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-medium">サイズ:</span> {bingoGame.size}
          </p>
          <p>
            <span className="font-medium">楽曲数:</span>{" "}
            {bingoGame.songs.length}
          </p>
          <p>
            <span className="font-medium">参加者数:</span>{" "}
            {participants?.length ?? 0}
          </p>
          <p>
            <span className="font-medium">グリッド完成:</span>{" "}
            {completedGridsCount}
          </p>
          <p>
            <span className="font-medium">勝者数:</span> {winnersCount}
          </p>
        </div>
      </div>
    </div>
  );
};
