import { useEffect } from "react";

export function useKeyboard({ onLeft, onRight, onDrop, disabled }) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onLeft?.();
          break;
        case "ArrowRight":
          e.preventDefault();
          onRight?.();
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          onDrop?.();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onLeft, onRight, onDrop, disabled]);
}
