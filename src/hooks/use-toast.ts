import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast"; // Assuming toast component exists at this path

const TOAST_LIMIT = 1; // Only show one toast at a time
const TOAST_REMOVE_DELAY = 1000000; // Very long delay, effectively manual dismiss

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

// Increments count safely
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

// All possible actions for the reducer
type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>; // Allows partial updates
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"]; // Optional: dismiss specific or all
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"]; // Optional: remove specific or all
    };

// Shape of the toast state
interface State {
  toasts: ToasterToast[];
}

// Map to hold timeouts for removing toasts after dismissal
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// Adds a toast ID to a queue for removal after a delay
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    // Already queued
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    // Dispatch action to remove the toast from state
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// Reducer function to manage toast state transitions
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    // Add a new toast to the beginning, respecting the limit
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    // Update an existing toast by ID
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    // Mark a toast (or all) as not open and start the removal timer
    case "DISMISS_TOAST": {
      const { toastId } = action;

      // Side effect: Start timer for removal
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        // Dismiss all: queue removal for every toast
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          // If it's the target toast or dismissing all, set open to false
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    // Remove a toast (or all) from the state entirely
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        // Remove all toasts
        return {
          ...state,
          toasts: [],
        };
      }
      // Remove specific toast by filtering
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// --- Global State and Listeners (Pub/Sub pattern) ---

const listeners: Array<(state: State) => void> = []; // Array of listener functions

let memoryState: State = { toasts: [] }; // Holds the current state outside React components

// Dispatches an action, updates state, and notifies listeners
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  // Call each listener function with the new state
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// Type for the toast function argument (omits 'id' as it's generated)
type Toast = Omit<ToasterToast, "id">;

// --- Public `toast` function ---
// Creates and adds a toast, returning methods to interact with it
function toast({ ...props }: Toast) {
  const id = genId(); // Generate unique ID

  // Function to update this specific toast
  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });

  // Function to dismiss this specific toast
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  // Dispatch the action to add the toast
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true, // Start as open
      // Set the onOpenChange handler to automatically dismiss when closed by the component
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Return control methods
  return {
    id: id,
    dismiss,
    update,
  };
}

// --- Public `useToast` hook ---
// Hook for components to subscribe to toast state changes
function useToast() {
  // Get the current state from memoryState
  const [state, setState] = React.useState<State>(memoryState);

  // Effect to subscribe/unsubscribe listeners
  React.useEffect(() => {
    // Add the setState function of this component instance to listeners
    listeners.push(setState);
    // Cleanup function: remove the listener when the component unmounts
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1); // Remove specific listener
      }
    };
  }, [state]); // Re-run effect only if state structure changes (usually never)

  // Return the current state and the globally available functions
  return {
    ...state, // Current toasts array
    toast, // Function to create new toasts
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }), // Function to dismiss toasts
  };
}

// Export the hook and the toast function
export { useToast, toast };
