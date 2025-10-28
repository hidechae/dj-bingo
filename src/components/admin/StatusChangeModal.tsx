import { GameStatus, type IncompleteParticipant } from "~/types";
import { Modal } from "~/components/ui/Modal";

type StatusChangeModalProps = {
  isOpen: boolean;
  currentStatus: GameStatus;
  pendingStatus: GameStatus;
  incompleteParticipants?: IncompleteParticipant[];
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
  return (
    <Modal isOpen={isOpen} size="sm" className="w-96 p-5">
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
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-sm bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400"
          >
            キャンセル
          </button>
        </div>
      </div>
    </Modal>
  );
};

const PlayingToEntryConfirmation = ({
  onConfirm,
}: {
  onConfirm: (options?: { preservePlayedSongs?: boolean }) => void;
}) => (
  <div className="space-y-3 text-sm text-gray-500">
    <p>「ゲーム中」から「エントリー中」に戻します。</p>
    <p>演奏済み楽曲の状態を維持しますか？</p>
    <div className="flex justify-center gap-2">
      <button
        onClick={() => onConfirm({ preservePlayedSongs: true })}
        className="cursor-pointer rounded-sm bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        維持する
      </button>
      <button
        onClick={() => onConfirm({ preservePlayedSongs: false })}
        className="cursor-pointer rounded-sm bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
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
  <div className="space-y-3 text-sm text-gray-500">
    <p>「エントリー中」から「編集中」に戻します。</p>
    <p>参加者のエントリー状態を維持しますか？</p>
    <div className="flex justify-center gap-2">
      <button
        onClick={() => onConfirm({ preserveParticipants: true })}
        className="cursor-pointer rounded-sm bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        維持する
      </button>
      <button
        onClick={() => onConfirm({ preserveParticipants: false })}
        className="cursor-pointer rounded-sm bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
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
  incompleteParticipants?: IncompleteParticipant[];
  onConfirm: (options?: Record<string, never>) => void;
}) => (
  <div className="space-y-3 text-sm text-gray-500">
    <p>「エントリー中」から「ゲーム中」に変更します。</p>
    {incompleteParticipants && incompleteParticipants.length > 0 && (
      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
        <p className="font-medium text-yellow-800">警告</p>
        <p className="text-yellow-700">
          {incompleteParticipants.length}
          人の参加者がまだグリッドを完成させていません：
        </p>
        <ul className="mt-1 list-inside list-disc text-xs text-yellow-700">
          {incompleteParticipants.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
        <p className="mt-2 text-yellow-700">
          ゲーム中に変更すると、参加者はグリッドを編集できなくなります。
        </p>
      </div>
    )}
    <div className="flex justify-center gap-2">
      <button
        onClick={() => onConfirm()}
        className="cursor-pointer rounded-sm bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
      >
        変更する
      </button>
    </div>
  </div>
);
