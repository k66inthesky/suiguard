export default function FunctionCard({
  title,
  icon,
  onClick,
}: Readonly<{
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}>) {
  return (
    <button
      onClick={onClick}
      className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center cursor-pointer"
    >
      <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </button>
  );
}
