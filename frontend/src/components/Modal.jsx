import React, { useEffect, useId, useRef } from 'react';

export default function Modal({ title, children, onClose, className = '', describedBy, focusTitle = false }) {
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    if (focusTitle) {
      headingRef.current.focus({ preventScroll: true });
      dialog.scrollTop = 0;
    }
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [focusTitle]);

  return (
    <dialog
      ref={dialogRef}
      className={`confirm-dialog ${className}`}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 ref={headingRef} id={titleId} tabIndex={focusTitle ? -1 : undefined}>{title}</h2>
      {children}
    </dialog>
  );
}
