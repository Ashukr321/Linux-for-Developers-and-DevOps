export const SITE = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Linux for Developers and DevOps",
  shortName: "Linux DevOps",
  description:
    "Free Linux and Unix notes for developers and DevOps engineers in English, Hindi and Hinglish: filesystem, processes, commands, shell scripting, sed, awk and sysadmin.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  accent: "#22c55e",
};

export const LANG_LABELS = { en: "English", hinglish: "Hinglish", hi: "हिन्दी" } as const;
/** Runs before paint (next/script beforeInteractive) so there is no theme or language flash. */
export const PREFS_SCRIPT = `try{var d=document.documentElement,t=localStorage.getItem("theme"),l=localStorage.getItem("lang");if(t!=="light")d.classList.add("dark");if(l==="hi"||l==="hinglish"){d.dataset.lang=l;if(l==="hi")d.lang="hi"}}catch(e){document.documentElement.classList.add("dark")}`;
