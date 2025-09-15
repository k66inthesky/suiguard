// import { Logo } from "@extension/ui";

export default function Header() {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {/* <div className="relative">
         <Logo size={128} page="popup" className="w-15 h-15" />
         <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div> 
      </div> */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Sui Guard</h1>
        <p className="text-xs text-gray-500 -mt-1">Security Extension</p>
      </div>
    </div>
  );
}
