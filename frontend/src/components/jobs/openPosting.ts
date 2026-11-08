"use client";

// Opens the firm's posting in a separate pop-up window beside Epigram. Modifier clicks
// (cmd/ctrl/shift/middle) keep the browser's normal behaviour, and the link's own
// target="_blank" still works if pop-ups are blocked.
export function openPostingWindow(e: React.MouseEvent<HTMLAnchorElement>, url: string) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  const width = Math.min(1100, window.screen.availWidth - 80);
  const height = Math.min(900, window.screen.availHeight - 80);
  const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));
  const popup = window.open("about:blank", "_blank", `popup,width=${width},height=${height},left=${left},top=${top}`);
  if (!popup) return;
  e.preventDefault();
  popup.opener = null;
  popup.location.href = url;
}
