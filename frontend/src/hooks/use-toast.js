import * as React from 'react';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

let count = 0;
function genId() { count = (count + 1) % Number.MAX_SAFE_INTEGER; return count.toString(); }

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
};

let memoryState = { toasts: [] };
const listeners = [];
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function reducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case actionTypes.UPDATE_TOAST:
      return { ...state, toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t) };
    case actionTypes.DISMISS_TOAST:
      return { ...state, toasts: state.toasts.map((t) => t.id === action.toastId || action.toastId === undefined ? { ...t, open: false } : t) };
    case actionTypes.REMOVE_TOAST:
      return action.toastId === undefined ? { ...state, toasts: [] } : { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };
    default:
      return state;
  }
}

export function toast({ ...props }) {
  const id = genId();
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss(); } },
  });
  setTimeout(() => dismiss(), TOAST_REMOVE_DELAY);
  return { id, dismiss };
}

export function useToast() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => { const idx = listeners.indexOf(setState); if (idx > -1) listeners.splice(idx, 1); };
  }, []);
  return { ...state, toast, dismiss: (id) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id }) };
}
