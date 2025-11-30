"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  confirmNavigation: (callback: () => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null);

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

export function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const confirmNavigation = useCallback(
    (callback: () => void) => {
      if (hasUnsavedChanges) {
        setPendingCallback(() => callback);
        setShowDialog(true);
      } else {
        callback();
      }
    },
    [hasUnsavedChanges]
  );

  const handleConfirm = () => {
    setShowDialog(false);
    setHasUnsavedChanges(false);
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setPendingCallback(null);
  };

  return (
    <UnsavedChangesContext.Provider
      value={{ hasUnsavedChanges, setHasUnsavedChanges, confirmNavigation }}
    >
      {children}

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in your journal entry. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Leave anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}
