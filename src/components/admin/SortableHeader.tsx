import {
  type ParticipantSortField,
  type SortDirection,
} from "~/hooks/useParticipantSort";

type SortableHeaderProps = {
  label: string;
  field: ParticipantSortField;
  currentSortField: ParticipantSortField;
  sortDirection: SortDirection;
  onSort: (field: ParticipantSortField) => void;
};

export const SortableHeader = ({
  label,
  field,
  currentSortField,
  sortDirection,
  onSort,
}: SortableHeaderProps) => (
  <th
    className="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:bg-gray-100"
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