interface ChevronLeftIconProps {
  className?: string;
}

export const ChevronLeftIcon: React.FC<ChevronLeftIconProps> = ({
  className = "h-6 w-6",
}) => {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
};
