"use client";

import { useEffect, useState, type ReactNode } from "react";

export function ScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -10% 0px" },
    );

    const el = document.querySelector(`[data-scroll-reveal="${delay}"]`);
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, [visible, delay]);

  return (
    <div
      data-scroll-reveal={delay}
      className={className}
      style={{
        transitionDelay: `${delay}s`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: visible
          ? `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`
          : `opacity 0s ease-out ${delay}s, transform 0s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
