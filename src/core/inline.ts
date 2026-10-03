/** Inline markdown links in short content strings (FAQ answers). Text is escaped first. */
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function linkHtml(text: string): string {
  return escapeHtml(text).replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '<a href="$2">$1</a>');
}

export function plainText(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)\s]*\)/g, '$1');
}
