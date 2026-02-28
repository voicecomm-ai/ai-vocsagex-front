import { useEffect, useRef } from 'react';

function useClickOutside(popoverRef, triggerRef, handler) {
  useEffect(() => {
    function handleClickOutside(event) {
      const isOutsidePopover = popoverRef.current && !popoverRef.current.contains(event.target);
      const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(event.target);
      const isOutside = isOutsidePopover && isOutsideTrigger;
      if (isOutside) {
        handler(event);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popoverRef, triggerRef, handler]);
}

export default useClickOutside;