export const HISTORY_LIMIT = 50;

const clone = (v) => structuredClone(v);

export function createHistory(limit = HISTORY_LIMIT) {
  const past = [];
  const future = [];

  return {
    record(snapshot) {
      past.push(clone(snapshot));
      if (past.length > limit) past.shift();
      future.length = 0;
    },
    undo(current) {
      if (!past.length) return null;
      future.push(clone(current));
      return past.pop();
    },
    redo(current) {
      if (!future.length) return null;
      past.push(clone(current));
      return future.pop();
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    get size() {
      return past.length;
    },
    clear() {
      past.length = 0;
      future.length = 0;
    },
  };
}
