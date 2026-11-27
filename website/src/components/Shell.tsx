"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Command } from "cmdk";
import { ChevronRight, Menu, Moon, PanelLeft, Search, Sun, Terminal, X } from "lucide-react";
import { L } from "@/components/L";
import type { Lang, Localized } from "@/lib/content";
import { toggleTheme, useLang, useModKey } from "@/lib/prefs";

export type NavDoc = { slug: string; url: string; title: Localized; group?: Localized };
export type NavCategory = { slug: string; title: Localized; url: string; docs: NavDoc[] };

const LANG_OPTIONS: { id: Lang; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "hinglish", label: "Hinglish" },
  { id: "hi", label: "हिन्दी" },
];

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/** Every typed word must appear somewhere in the item's text. */
const filter = (_value: string, search: string, keywords?: string[]) => {
  const hay = (keywords ?? []).join(" ").toLowerCase();
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w))
    ? 1
    : 0;
};

export function Shell({ siteName, nav, children }: { siteName: string; nav: NavCategory[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const mod = useModKey();
  const [lang, setLang] = useLang();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) setDesktopOpen((o) => !o);
    else setDrawerOpen((o) => !o);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.code === "KeyK") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (mod && e.code === "KeyB") {
        e.preventDefault();
        toggleSidebar();
      } else if (e.key === "Escape") {
        setDrawerOpen(false);
      } else if (!mod && !e.altKey && e.code === "Slash" && !isTyping(e.target)) {
        e.preventDefault();
        if (e.shiftKey) toggleSidebar();
        else setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSidebar]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-bg/85 px-3 backdrop-blur sm:px-4">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar (Ctrl+B or Shift+/)"
          className="icon-btn"
        >
          <Menu className="size-5 lg:hidden" />
          <PanelLeft className="hidden size-5 lg:block" />
        </button>
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-accent/15 text-accent">
            <Terminal className="size-4" />
          </span>
          <span className="hidden truncate sm:inline">{siteName}</span>
        </Link>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-9 items-center gap-2 rounded-md border border-border bg-muted px-2.5 text-sm text-fg-muted hover:text-fg sm:w-56"
          aria-label="Search topics"
        >
          <Search className="size-4" />
          <span className="hidden flex-1 text-left sm:inline">Search…</span>
          <kbd className="hidden rounded border border-border px-1.5 text-[11px] sm:inline">{mod} K</kbd>
        </button>
        <div className="flex h-9 items-center rounded-md border border-border p-0.5 text-xs" role="group" aria-label="Language">
          {LANG_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setLang(o.id)}
              aria-pressed={lang === o.id}
              className={`h-full rounded px-2 ${lang === o.id ? "bg-accent text-white" : "text-fg-muted hover:text-fg"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className="icon-btn">
          <Sun className="hidden size-5 dark:block" />
          <Moon className="size-5 dark:hidden" />
        </button>
      </header>

      <div className="flex">
        <div
          onClick={closeDrawer}
          aria-hidden
          className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        />
        <aside
          id="sidebar"
          aria-label="Topics"
          className={`fixed inset-y-0 left-0 z-50 w-72 shrink-0 overflow-hidden border-r border-border bg-bg transition-[translate,width,visibility] duration-300 ease-out lg:sticky lg:top-14 lg:bottom-auto lg:z-0 lg:h-[calc(100dvh-3.5rem)] lg:translate-x-0 ${drawerOpen ? "visible translate-x-0" : "invisible -translate-x-full"} ${desktopOpen ? "lg:visible lg:w-64" : "lg:invisible lg:w-0"}`}
        >
          <div className="flex h-full w-72 flex-col lg:w-64">
            <div className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
              <span className="font-semibold">Topics</span>
              <button type="button" onClick={closeDrawer} aria-label="Close sidebar" className="icon-btn">
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-4 text-sm">
              {nav.map((cat) => {
                const isActive = pathname === cat.url || cat.docs.some((d) => d.url === pathname);
                const open = toggled[cat.slug] ?? isActive;
                return (
                  <div key={cat.slug} className="mb-1">
                    <button
                      type="button"
                      onClick={() => setToggled((t) => ({ ...t, [cat.slug]: !open }))}
                      aria-expanded={open}
                      className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left font-medium hover:bg-muted ${isActive ? "text-fg" : "text-fg-muted"}`}
                    >
                      <ChevronRight className={`size-4 shrink-0 transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
                      <span className="truncate">
                        <L v={cat.title} />
                      </span>
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                      inert={!open}
                    >
                      <ul className="ml-4 overflow-hidden border-l border-border">
                        {cat.docs.map((d, i) => {
                          const groupHeading = d.group && d.group.en !== cat.docs[i - 1]?.group?.en ? d.group : undefined;
                          const active = d.url === pathname;
                          return (
                            <li key={d.slug}>
                              {groupHeading && (
                                <div className="mt-2 px-3 pb-1 text-[11px] font-semibold tracking-wider text-fg-muted uppercase">
                                  <L v={groupHeading} />
                                </div>
                              )}
                              <Link
                                href={d.url}
                                onClick={closeDrawer}
                                aria-current={active ? "page" : undefined}
                                className={`-ml-px block border-l-2 py-1.5 pr-2 pl-3 ${active ? "border-accent font-medium text-accent" : "border-transparent text-fg-muted hover:border-fg-muted hover:text-fg"}`}
                              >
                                <L v={d.title} />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <Command.Dialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        label="Search topics"
        filter={filter}
        overlayClassName="fixed inset-0 z-50 bg-black/60"
        contentClassName="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-bg shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-fg-muted" />
          <Command.Input placeholder="Search topics…" className="h-12 flex-1 bg-transparent outline-none placeholder:text-fg-muted" />
          <kbd className="rounded border border-border px-1.5 text-[11px] text-fg-muted">Esc</kbd>
        </div>
        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="p-6 text-center text-sm text-fg-muted">No topics found.</Command.Empty>
          {nav.map((cat) => (
            <Command.Group
              key={cat.slug}
              heading={<L v={cat.title} />}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-fg-muted"
            >
              {cat.docs.map((d) => (
                <Command.Item
                  key={d.slug}
                  value={d.slug}
                  keywords={[...Object.values(d.title), ...Object.values(cat.title), ...(d.group ? [d.group.en] : [])].filter(
                    (s): s is string => !!s,
                  )}
                  onSelect={() => {
                    setSearchOpen(false);
                    setDrawerOpen(false);
                    router.push(d.url);
                  }}
                  className="flex cursor-pointer flex-col rounded-md px-3 py-2 text-sm data-[selected=true]:bg-accent/15 data-[selected=true]:text-fg"
                >
                  <span>
                    <L v={d.title} />
                  </span>
                  <span className="text-xs text-fg-muted">
                    <L v={d.group ?? cat.title} />
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command.Dialog>
    </div>
  );
}
