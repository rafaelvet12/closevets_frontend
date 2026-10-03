interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="p-12 text-center">
      <p className="font-body text-slate-500 font-medium">{message}</p>
    </div>
  );
}
