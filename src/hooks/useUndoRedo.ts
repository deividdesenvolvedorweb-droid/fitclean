import { useState, useCallback, useRef } from "react";

const MAX_HISTORY = 50;

export function useUndoRedo<T>(initial: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initial);
  const [future, setFuture] = useState<T[]>([]);
  const skipRef = useRef(false);

  const set = useCallback((newPresent: T | ((prev: T) => T)) => {
    setPresent(prev => {
      const next = typeof newPresent === "function" ? (newPresent as (p: T) => T)(prev) : newPresent;
      if (!skipRef.current) {
        setPast(p => [...p.slice(-MAX_HISTORY), prev]);
        setFuture([]);
      }
      skipRef.current = false;
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast(p => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      const newPast = p.slice(0, -1);
      setPresent(curr => {
        setFuture(f => [curr, ...f]);
        return previous;
      });
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const next = f[0];
      const newFuture = f.slice(1);
      setPresent(curr => {
        setPast(p => [...p, curr]);
        return next;
      });
      return newFuture;
    });
  }, []);

  const reset = useCallback((value: T) => {
    setPast([]);
    setFuture([]);
    setPresent(value);
  }, []);

  return {
    state: present,
    set,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
