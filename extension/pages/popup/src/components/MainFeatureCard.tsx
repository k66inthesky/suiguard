export default function MainFeatureCard({
  icon,
  title,
  description,
  btnText = "Start Audit",
  onClick,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
  btnText?: string;
  onClick: () => void;
}>) {
  return (
    <div className="rounded-lg border-2 border-[#155cd0] bg-gradient-to-br from-[#8bb4f7] via-[#fff] shadow-lg transition-all hover:scale-[1.02]">
      <div className="p-6 pb-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-lg bg-[#0c45a1] px-2 py-1 text-xs font-medium text-gray-100">
            Featured
          </span>
        </div>
        <div className="text-card-foreground mb-2 flex items-center gap-2 text-base font-semibold">
          <div className="rounded-lg bg-[hsl(217,53%,76%)] p-2">{icon}</div>
          <span className="text-shadow-gray-700">{title}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-gray-400">
          {description}
        </p>
      </div>
      <div className="px-6 pb-6">
        <button
          className="hover:bg-primary/90 h-9 w-full cursor-pointer rounded-md bg-[#0c45a1] px-4 text-sm font-medium text-gray-200 transition-colors"
          onClick={onClick}
        >
          {btnText}
        </button>
      </div>
    </div>
  );
}
