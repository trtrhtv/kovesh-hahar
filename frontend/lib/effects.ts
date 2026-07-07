/**
 * יוצר פרץ קצר של "חלקיקי אבק" בתוך אלמנט קונטיינר - מדמה צמיג אחורי
 * שמתיז אבנים/אבק. מיועד ללחיצות על פעולות עיקריות בלבד (ניווט, שליחת עדכון),
 * לא לכל כפתור באתר - זה אמור להישאר אפקט נדיר ומשמעותי.
 */
export function spawnDustBurst(container: HTMLElement | null) {
  if (!container) return;

  const burst = document.createElement("div");
  burst.className = "dust-burst";
  container.appendChild(burst);

  const count = 10;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "dust-particle";
    const angle = Math.PI + (Math.random() - 0.5) * 1.4; // בעיקר אחורה/למטה
    const distance = 20 + Math.random() * 30;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 10;
    particle.style.setProperty("--dx", `${dx}px`);
    particle.style.setProperty("--dy", `${dy}px`);
    particle.style.right = `${45 + Math.random() * 10}%`;
    particle.style.animationDelay = `${Math.random() * 40}ms`;
    burst.appendChild(particle);
  }

  setTimeout(() => burst.remove(), 600);
}
