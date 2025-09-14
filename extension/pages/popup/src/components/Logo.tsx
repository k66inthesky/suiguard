export default function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      <div className="relative">
        {/*img */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Sui Guard</h1>
        <p className="text-xs text-gray-500 -mt-1">Security Extension</p>
      </div>
    </div>
  );
}
