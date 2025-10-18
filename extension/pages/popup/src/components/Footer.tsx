import { EXTENSION_NAME } from "@src/constants";

export default function Footer() {
  return (
    <div className="border-t border-gray-200 py-4 text-center">
      <p className="text-xs text-gray-500">
        Made by{" "}
        <a href="https://github.com/k66inthesky/suiguard" target="_blank">
          {EXTENSION_NAME} Team
        </a>
      </p>
    </div>
  );
}
