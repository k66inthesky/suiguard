import { useStorage } from "@extension/shared";
import { exampleThemeStorage } from "@extension/storage";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"img"> & {
  variant?: "vertical" | "horizontal";
  page?: "popup" | "new-tab" | "options" | "side-panel" | "devtools-panel";
  size?: number;
};

export const Logo = ({
  size,
  page = "popup",
  className,
  ...props
}: LogoProps) => {
  const { isLight } = useStorage(exampleThemeStorage);

  const getLogoPath = () => {
    const theme = isLight ? "" : "_dark";
    return `${page}/logo${size}.png`;
  };

  return (
    <img
      src={chrome.runtime.getURL(getLogoPath())}
      className={cn("App-logo", className)}
      alt="logo"
      {...props}
    />
  );
};
