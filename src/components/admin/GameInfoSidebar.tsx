import Image from "next/image";
import { GameStatus, getStatusDisplay, isValidStatusTransition } from "~/types";

type GameInfoSidebarProps = {
  bingoGame: any;
  participants: any[];
  qrCodeDataUrl: string;
  gameUrl: string;
  onStatusChange: (newStatus: GameStatus) => void;
  isChangingStatus: boolean;
};

export const GameInfoSidebar = ({
  bingoGame,
  participants,
  qrCodeDataUrl,
  gameUrl,
  onStatusChange,
  isChangingStatus,
}: GameInfoSidebarProps) => {
  const winnersCount = participants?.filter((p: any) => p.hasWon).length ?? 0;
  const completedGridsCount =
    participants?.filter((p: any) => p.isGridComplete).length ?? 0;

  const currentStatus = bingoGame.status as GameStatus;

  return (
    <div className="space-y-6">
      {/* QR Code */}
      {currentStatus === GameStatus.ENTRY && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
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
              <p className="text-xs text-gray-500 mt-2 break-all">{gameUrl}</p>
            </div>
          )}
        </div>
      )}

      {/* Game Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ゲーム情報</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">状態:</span>{" "}
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                getStatusDisplay(currentStatus).color
              }`}
            >
              {getStatusDisplay(currentStatus).text}
            </span>
          </div>
          <p>
            <span className="font-medium">サイズ:</span> {bingoGame.size}
          </p>
          <p>
            <span className="font-medium">楽曲数:</span> {bingoGame.songs.length}
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

      {/* Status Controls */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          ステータス変更
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onStatusChange(GameStatus.EDITING)}
            disabled={
              currentStatus === GameStatus.EDITING ||
              isChangingStatus ||
              !isValidStatusTransition(currentStatus, GameStatus.EDITING)
            }
            className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            編集中
          </button>
          <button
            onClick={() => onStatusChange(GameStatus.ENTRY)}
            disabled={
              currentStatus === GameStatus.ENTRY ||
              isChangingStatus ||
              !isValidStatusTransition(currentStatus, GameStatus.ENTRY)
            }
            className="px-3 py-2 text-sm rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            エントリー中
          </button>
          <button
            onClick={() => onStatusChange(GameStatus.PLAYING)}
            disabled={
              currentStatus === GameStatus.PLAYING ||
              isChangingStatus ||
              !isValidStatusTransition(currentStatus, GameStatus.PLAYING)
            }
            className="px-3 py-2 text-sm rounded-md border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ゲーム中
          </button>
          <button
            onClick={() => onStatusChange(GameStatus.FINISHED)}
            disabled={
              currentStatus === GameStatus.FINISHED ||
              isChangingStatus ||
              !isValidStatusTransition(currentStatus, GameStatus.FINISHED)
            }
            className="px-3 py-2 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            終了
          </button>
        </div>
      </div>
    </div>
  );
};
