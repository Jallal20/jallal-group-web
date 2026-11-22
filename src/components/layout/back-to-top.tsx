"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const y = window.scrollY;
      setVisible(y > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`
        back-to-top ${visible ? "visible" : ""}
        flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white shadow-card text-ink
        transition-colors hover:bg-ink hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/20
      `}
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
