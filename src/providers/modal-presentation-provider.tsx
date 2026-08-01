import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

type ModalPresentationValue = {
  isModalPresented: boolean;
  setModalPresented: (presented: boolean) => void;
};

const ModalPresentationContext = createContext<ModalPresentationValue | null>(null);

export function ModalPresentationProvider({ children }: PropsWithChildren) {
  const [isModalPresented, setModalPresented] = useState(false);
  const value = useMemo(() => ({ isModalPresented, setModalPresented }), [isModalPresented]);
  return <ModalPresentationContext.Provider value={value}>{children}</ModalPresentationContext.Provider>;
}

export function useModalPresentation() {
  const value = useContext(ModalPresentationContext);
  if (!value) throw new Error('useModalPresentation must be used within ModalPresentationProvider');
  return value;
}
