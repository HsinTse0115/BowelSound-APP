import { useEffect, useRef, useState } from 'react';
import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/native';

export function useUnsavedChanges(dirty: boolean, busy = false) {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const route = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const local = useRef<(() => void) | null>(null);
  usePreventRemove(!leaving && (dirty || busy), ({ data }) => {
    if (busy) return;
    route.current = data.action;
    local.current = null;
    setVisible(true);
  });
  useEffect(() => {
    if (leaving && route.current) {
      const action = route.current; route.current = null; navigation.dispatch(action);
    }
  }, [leaving, navigation]);
  useEffect(() => {
    if ((!dirty && !busy) || leaving || typeof window === 'undefined') return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy, leaving]);
  return {
    visible,
    requestDiscard(action: () => void) {
      if (busy) return;
      if (!dirty) { action(); return; }
      route.current = null; local.current = action; setVisible(true);
    },
    onCancel() { route.current = null; local.current = null; setVisible(false); },
    onConfirm() {
      if (busy) return;
      setVisible(false);
      if (route.current) setLeaving(true);
      else { const action = local.current; local.current = null; action?.(); }
    },
  };
}
