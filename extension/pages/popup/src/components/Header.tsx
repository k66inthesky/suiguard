import { Logo } from "@extension/ui";

import { EXTENSION_NAME } from "@src/constants";

export default function Header() {
  return (
    <div className="mb-4 flex shrink-0 items-center justify-between bg-[linear-gradient(135deg,hsl(217,91%,35%),hsl(217,91%,50%))] px-4 py-4">
      <div className="flex items-center gap-2">
        <Logo
          className="text-primary-foreground h-5 w-5"
          variant="white"
          page="popup"
          size={16}
        />
        <h1 className="text-primary-foreground text-xl font-bold text-gray-100">
          {EXTENSION_NAME}
        </h1>
      </div>
    </div>
  );
}
