import { useEffect, useState } from 'react';

export function usePersistentStorage() {
  const [isPersisted, setIsPersisted] = useState(false);

  useEffect(() => {
    async function checkPersisted() {
      if (navigator.storage && navigator.storage.persisted) {
        const persisted = await navigator.storage.persisted();
        setIsPersisted(persisted);
        
        if (!persisted && navigator.storage.persist) {
          const granted = await navigator.storage.persist();
          setIsPersisted(granted);
          if (granted) {
            console.log('Persistent storage granted. Data will not be cleared by the OS.');
          } else {
            console.log('Persistent storage denied.');
          }
        }
      }
    }
    
    checkPersisted();
  }, []);

  return isPersisted;
}
