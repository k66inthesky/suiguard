export default function OperationStatus({
  status,
}: Readonly<{ status: string }>) {
  {
    /* TODO: */
  }
  return (
    <div className="rounded-lg border border-green-300 bg-gradient-to-r from-green-50 to-green-50 text-green-700">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
          <span className="text-success text-sm font-medium">
            {status === "protected"
              ? "All systems operational"
              : "Partial Outage"}
          </span>
        </div>
      </div>
    </div>
  );
}
