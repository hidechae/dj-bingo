import {
  type ParticipantSortField,
  type SortDirection,
} from "~/hooks/useParticipantSort";

type ParticipantTableProps = {
  participants: any[];
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
    <div className="mt-8 bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">参加者一覧</h3>
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
                label="参加時間"
                field="createdAt"
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants.map((participant: any) => (
              <tr key={participant.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {participant.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(participant.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      勝利！
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">未勝利</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SortableHeader = ({
  label,
  field,
  currentSortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: ParticipantSortField;
  currentSortField: ParticipantSortField;
  sortDirection: SortDirection;
  onSort: (field: ParticipantSortField) => void;
}) => (
  <th
    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center">
      {label}
      {currentSortField === field && (
        <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
      )}
    </div>
  </th>
);
