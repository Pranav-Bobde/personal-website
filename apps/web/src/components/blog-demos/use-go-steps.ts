import { useEffect, useState } from "react";

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/*
 * Plays a widget one step at a time after Go. Step 0 is the unresolved start, and
 * stepMs[n] is how long step n + 1 holds, so the last step comes after stepMs runs out.
 * Reduced motion skips straight to the last step. The timer ends with the step or the unmount.
 */
export function useGoSteps(stepMs: readonly number[]) {
  const [step, setStep] = useState(0);
  const lastStep = stepMs.length + 1;
  const done = step === lastStep;

  useEffect(() => {
    if (step === 0 || done) return;
    const timer = setTimeout(() => setStep((current) => current + 1), stepMs[step - 1]);
    return () => clearTimeout(timer);
  }, [step, done, stepMs]);

  return {
    step,
    done,
    go: () => setStep(prefersReducedMotion() ? lastStep : 1),
    reset: () => setStep(0),
  };
}
