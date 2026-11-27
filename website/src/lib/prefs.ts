"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "@/lib/content";

const EVENT = "prefschange";
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
};

export function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.lang as Lang) ?? "en",
    () => "en" as Lang,
  );
  return [
    lang,
    (l) => {
      const html = document.documentElement;
      if (l === "en") delete html.dataset.lang;
      else html.dataset.lang = l;
      html.lang = l === "hi" ? "hi" : "en";
      save("lang", l);
    },
  ];
}

export function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  save("theme", dark ? "dark" : "light");
}

const noop = () => () => {};
export const useModKey = () =>
  useSyncExternalStore(
    noop,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );

