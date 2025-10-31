type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  resultLabel?: string;
  focusColor?: "blue" | "green";
  className?: string;
};

export const SearchInput = ({
  value,
  onChange,
  placeholder = "検索...",
  resultCount,
  resultLabel = "件が見つかりました",
  focusColor = "blue",
  className = "",
}: SearchInputProps) => {
  const focusClasses =
    focusColor === "green"
      ? "focus:border-green-500 focus:ring-green-500"
      : "focus:border-blue-500 focus:ring-blue-500";

  return (
    <div className={className}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-sm focus:ring-1 focus:outline-none ${focusClasses}`}
        />
        <svg
          className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-4 w-4"
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
          </button>
        )}
      </div>
      {value && resultCount !== undefined && (
        <p className="mt-2 text-sm text-gray-500">
          {resultCount}
          {resultLabel}
        </p>
      )}
    </div>
  );
};
