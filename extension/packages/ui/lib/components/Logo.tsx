import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"img"> & {
  variant?: "white" | "black";
  page: "popup" | "new-tab" | "options" | "side-panel" | "devtools-panel";
  size: 16 | 48 | 128;
};

export const Logo = ({
  size,
  page,
  className,
  variant,
  ...props
}: LogoProps) => {
  const logoPath = variant
    ? `${page}/logo${size}_${variant}.png`
    : `${page}/logo${size}.png`;

  return (
    <img
      src={chrome.runtime.getURL(logoPath)}
      className={className}
      alt="logo"
      {...props}
    />
  );
};
