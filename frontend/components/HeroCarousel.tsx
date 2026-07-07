"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "/hero-action.png", label: "קפיצת מדבר" },
  { src: "/hero-1.png", label: "אנדורו יער בוצי" },
  { src: "/hero-2.png", label: "אנדורו מדבר" },
  { src: "/hero-3.png", label: "טיפוס סלעים" },
];

const INTERVAL_MS = 8000;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ transform: "translate3d(0,0,0)" }}>
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: "translate3d(0,0,0)" }}
        >
          <Image
            src={slide.src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className="slow-pan object-cover"
          />
        </div>
      ))}
    </div>
  );
}
