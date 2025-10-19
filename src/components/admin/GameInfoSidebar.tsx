import Image from "next/image";
import Link from "next/link";
import {
  GameStatus,
  getStatusDisplay,
  isValidStatusTransition,
  type BingoGame,
  type Participant,
} from "~/types";

type GameInfoSidebarProps = {
  bingoGame: BingoGame;
  participants: Participant[];
  qrCodeDataUrl: string;
  gameUrl: string;
  gameId: string;
  onStatusChange: (newStatus: GameStatus) => void;
  isChangingStatus: boolean;
};

export const GameInfoSidebar = ({
  bingoGame,
  participants,
  qrCodeDataUrl,
  gameUrl,
  gameId,
  onStatusChange,
  isChangingStatus,
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
          <div>
            <span className="font-medium">状態:</span>{" "}
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
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

      {/* Status Controls */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          ステータス変更
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <StatusButton
            status={GameStatus.EDITING}
            currentStatus={currentStatus}
            isChangingStatus={isChangingStatus}
            onStatusChange={onStatusChange}
            label="編集中"
          />
          <StatusButton
            status={GameStatus.ENTRY}
            currentStatus={currentStatus}
            isChangingStatus={isChangingStatus}
            onStatusChange={onStatusChange}
            label="エントリー中"
          />
          <StatusButton
            status={GameStatus.PLAYING}
            currentStatus={currentStatus}
            isChangingStatus={isChangingStatus}
            onStatusChange={onStatusChange}
            label="ゲーム中"
          />
          <StatusButton
            status={GameStatus.FINISHED}
            currentStatus={currentStatus}
            isChangingStatus={isChangingStatus}
            onStatusChange={onStatusChange}
            label="終了"
          />
        </div>
      </div>
    </div>
  );
};

const StatusButton = ({
  status,
  currentStatus,
  isChangingStatus,
  onStatusChange,
  label,
}: {
  status: GameStatus;
  currentStatus: GameStatus;
  isChangingStatus: boolean;
  onStatusChange: (status: GameStatus) => void;
  label: string;
}) => {
  const isCurrent = currentStatus === status;
  const isDisabled =
    isCurrent ||
    isChangingStatus ||
    !isValidStatusTransition(currentStatus, status);

  const getButtonStyles = () => {
    if (isCurrent) {
      // Current status - prominent styling based on status type
      switch (status) {
        case GameStatus.EDITING:
          return "bg-gray-600 text-white border-gray-600 shadow-md font-semibold";
        case GameStatus.ENTRY:
          return "bg-blue-600 text-white border-blue-600 shadow-md font-semibold";
        case GameStatus.PLAYING:
          return "bg-green-600 text-white border-green-600 shadow-md font-semibold";
        case GameStatus.FINISHED:
          return "bg-red-600 text-white border-red-600 shadow-md font-semibold";
        default:
          return "bg-gray-600 text-white border-gray-600 shadow-md font-semibold";
      }
    }

    if (isDisabled) {
      // Disabled/inactive - muted styling
      return "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50";
    }

    // Available transition - colored but subtle
    switch (status) {
      case GameStatus.EDITING:
        return "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400";
      case GameStatus.ENTRY:
        return "border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400";
      case GameStatus.PLAYING:
        return "border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400";
      case GameStatus.FINISHED:
        return "border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400";
      default:
        return "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400";
    }
  };

  return (
    <button
      onClick={() => onStatusChange(status)}
      disabled={isDisabled}
      className={`relative cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed ${getButtonStyles()}`}
      aria-label={isCurrent ? `${label} (現在のステータス)` : label}
    >
      {isCurrent && (
        <span
          className="absolute -top-1 -right-1 flex h-3 w-3"
          aria-hidden="true"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
        </span>
      )}
      {label}
    </button>
  );
};
