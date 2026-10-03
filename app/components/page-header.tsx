"use client";

interface PageHeaderProps {
  title: string;
  description: string;
  search?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  actionLabel?: string;
  onAction?: () => void;
  actionClassName?: string;
}

export default function PageHeader({
  title,
  description,
  search,
  searchPlaceholder,
  onSearch,
  actionLabel,
  onAction,
  actionClassName = "bg-[#004aad] hover:bg-[#003882] text-[#d4ed31] font-heading px-6 py-3 rounded-lg shadow-sm whitespace-nowrap",
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div>
        <h1 className="font-heading text-4xl text-[#004aad] uppercase">{title}</h1>
        <p className="font-body text-slate-500 mt-1">{description}</p>
      </div>
      {(onSearch || onAction) && (
        <div className="flex items-center gap-4 w-full md:w-auto">
          {onSearch && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              className="w-full md:w-64 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#38b6ff] text-slate-700 font-body text-sm shadow-sm"
            />
          )}
          {onAction && actionLabel && (
            <button type="button" onClick={onAction} className={actionClassName}>
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
