export function restoreFocus(control) {
  const target =
    control?.isConnected && !control.disabled
      ? control
      : document.getElementById("main-content");
  target?.focus({ preventScroll: true });
}
