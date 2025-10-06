import { GameStatus } from "~/types";

type StatusChangeModalProps = {
  isOpen: boolean;
  currentStatus: GameStatus;
  pendingStatus: GameStatus;
  incompleteParticipants?: any[];
  onConfirm: (options?: {
    preservePlayedSongs?: boolean;
    preserveParticipants?: boolean;
  }) => void;
  onCancel: () => void;
};

export const StatusChangeModal = ({
  isOpen,
  currentStatus,
  pendingStatus,
  incompleteParticipants,
  onConfirm,
  onCancel,
}: StatusChangeModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg font-medium text-gray-900">
            ステータス変更の確認
          </h3>
          <div className="mt-2 px-7 py-3">
            {pendingStatus === GameStatus.ENTRY &&
              currentStatus === GameStatus.PLAYING && (
                <PlayingToEntryConfirmation onConfirm={onConfirm} />
              )}

            {pendingStatus === GameStatus.EDITING &&
              currentStatus === GameStatus.ENTRY && (
                <EntryToEditingConfirmation onConfirm={onConfirm} />
              )}

            {pendingStatus === GameStatus.PLAYING &&
              currentStatus === GameStatus.ENTRY && (
                <EntryToPlayingConfirmation
                  incompleteParticipants={incompleteParticipants}
                  onConfirm={onConfirm}
                />
              )}
          </div>
          <div className="flex gap-2 justify-center mt-4">
            <button
              onClick={onCancel}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-400"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayingToEntryConfirmation = ({
  onConfirm,
}: {
  onConfirm: (options?: { preservePlayedSongs?: boolean }) => void;
}) => (
  <div className="text-sm text-gray-500 space-y-3">
    <p>「ゲーム中」から「エントリー中」に戻します。</p>
    <p>演奏済み楽曲の状態を維持しますか？</p>
    <div className="flex gap-2 justify-center">
      <button
        onClick={() => onConfirm({ preservePlayedSongs: true })}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
      >
        維持する
      </button>
      <button
        onClick={() => onConfirm({ preservePlayedSongs: false })}
        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
      >
        リセットする
      </button>
    </div>
  </div>
);

const EntryToEditingConfirmation = ({
  onConfirm,
}: {
  onConfirm: (options?: { preserveParticipants?: boolean }) => void;
}) => (
  <div className="text-sm text-gray-500 space-y-3">
    <p>「エントリー中」から「編集中」に戻します。</p>
    <p>参加者のエントリー状態を維持しますか？</p>
    <div className="flex gap-2 justify-center">
      <button
        onClick={() => onConfirm({ preserveParticipants: true })}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
      >
        維持する
      </button>
      <button
        onClick={() => onConfirm({ preserveParticipants: false })}
        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
      >
        削除する
      </button>
    </div>
  </div>
);

const EntryToPlayingConfirmation = ({
  incompleteParticipants,
  onConfirm,
}: {
  incompleteParticipants?: any[];
  onConfirm: (options?: Record<string, never>) => void;
}) => (
  <div className="text-sm text-gray-500 space-y-3">
    <p>「エントリー中」から「ゲーム中」に変更します。</p>
    {incompleteParticipants && incompleteParticipants.length > 0 && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <p className="font-medium text-yellow-800">警告</p>
        <p className="text-yellow-700">
          {incompleteParticipants.length}
          人の参加者がまだグリッドを完成させていません：
        </p>
        <ul className="text-yellow-700 text-xs mt-1 list-disc list-inside">
          {incompleteParticipants.map((p: any) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
        <p className="text-yellow-700 mt-2">
          ゲーム中に変更すると、参加者はグリッドを編集できなくなります。
        </p>
      </div>
    )}
    <div className="flex gap-2 justify-center">
      <button
        onClick={() => onConfirm()}
        className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
      >
        変更する
      </button>
    </div>
  </div>
);
