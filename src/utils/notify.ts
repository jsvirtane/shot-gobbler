/**
 * Shows a message to the user. Every user-facing message from data
 * import and export goes through here, so the mechanism can be swapped
 * in one place.
 */
export const notify = (message: string): void => {
  window.alert(message);
};
