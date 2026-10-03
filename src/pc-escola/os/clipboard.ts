let localCopy = '';

export function selectedText(): string {
  // A document selection takes precedence over an address/search field that
  // happened to retain focus while the player dragged over the page.
  const selection = window.getSelection()?.toString();
  if (selection) return selection;
  const active = document.activeElement;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    const start = active.selectionStart;
    const end = active.selectionEnd;
    if (start !== null && end !== null && end > start) return active.value.slice(start, end);
  }
  return '';
}

// Keep the in-app fallback in sync even if the player uses native Ctrl+C.
export function trackNativeCopies(): () => void {
  const remember = (event: ClipboardEvent) => {
    const source = event.target;
    if (source instanceof HTMLInputElement || source instanceof HTMLTextAreaElement) {
      const { selectionStart: start, selectionEnd: end } = source;
      if (start !== null && end !== null && end > start) {
        localCopy = source.value.slice(start, end);
        return;
      }
    }
    const text = selectedText();
    if (text) localCopy = text;
  };
  document.addEventListener('copy', remember);
  return () => document.removeEventListener('copy', remember);
}

export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  localCopy = text;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to the classic copy command for local/insecure previews.
  }

  const selection = window.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
  const previousFocus = document.activeElement as HTMLElement | null;
  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  helper.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
  document.body.append(helper);
  helper.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    // Local fallback remains available through the in-app Paste buttons.
  }
  helper.remove();
  localCopy = text;
  previousFocus?.focus({ preventScroll: true });
  if (selection && ranges.length) {
    selection.removeAllRanges();
    ranges.forEach((range) => selection.addRange(range));
  }
  return copied;
}

export async function readCopiedText(): Promise<string> {
  try {
    const text = await navigator.clipboard?.readText();
    return text || localCopy;
  } catch {
    return localCopy;
  }
}