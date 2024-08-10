import { ComponentProps, ElementRef, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { useHotkeys } from "react-hotkeys-hook";

interface MenuItemProps extends ComponentProps<"button"> {
  hotkey?: string;
}

function getSymbolCombination(hotkey: string) {
  const modifierMap: Record<string, string> = {
    shift: "⇧",
    ctrl: "^",
    alt: "⌥",
    meta: "⌘",
    mod: isMacOS() ? "⌘" : "^",
  };

  const keys = hotkey.split("+");

  const symbolModifiers = keys
    .map((key) => {
      return key in modifierMap ? modifierMap[key] : key.toLocaleUpperCase();
    })
    .join("");

  return symbolModifiers;
}

function isMacOS() {
  return navigator.userAgent.toUpperCase().includes("MAC");
}

export function MenuItem({
  hotkey = "",
  children,
  className,
  ...props
}: MenuItemProps) {
  const buttonRef = useRef<ElementRef<"button">>(null);

  useHotkeys(
    hotkey,
    () => {
      const clickEvent = new MouseEvent("click", {
        view: window,
        bubbles: true,
      });

      buttonRef.current?.dispatchEvent(clickEvent);
    },
    {
      enabled: hotkey !== "",
      preventDefault: true,
    }
  );

  return (
    <button
      ref={buttonRef}
      className={twMerge(
        "flex group px-2.5 py-1.5 cursor-default items-center rounded-sm gap-2 hover:bg-blue-600/90 mt-2 w-full justify-between text-white text-sm",
        className
      )}
      {...props}
    >
      <div className="flex gap-2 items-center">{children}</div>
      <div className="self-end">{hotkey && getSymbolCombination(hotkey)}</div>
    </button>
  );
}
