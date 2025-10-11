import {
  type ParticipantSortField,
  type SortDirection,
} from "~/hooks/useParticipantSort";
import { type Participant } from "~/types";
import { SortableHeader } from "./SortableHeader";

type ParticipantTableProps = {
  participants: Participant[];
  sortField: ParticipantSortField;
  sortDirection: SortDirection;
  onSort: (field: ParticipantSortField) => void;
};

export const ParticipantTable = ({
  participants,
  sortField,
  sortDirection,
  onSort,
}: ParticipantTableProps) => {
  if (!participants || participants.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-medium text-gray-900">参加者一覧</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                label="名前"
                field="name"
                currentSortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                label="グリッド状態"
                field="isGridComplete"
                currentSortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                label="勝利状態"
                field="hasWon"
                currentSortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                label="参加時間"
                field="createdAt"
                currentSortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {participants.map((participant) => (
              <tr key={participant.id}>
                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                  {participant.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      participant.isGridComplete
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {participant.isGridComplete ? "完成" : "設定中"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {participant.hasWon ? (
                    <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                      勝利！
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">未勝利</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                  {new Date(participant.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
