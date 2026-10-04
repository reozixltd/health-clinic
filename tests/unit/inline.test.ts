import { describe, expect, it } from 'vitest';
import { linkHtml, plainText } from '@/core/inline';

describe('linkHtml', () => {
  it('turns a site-relative markdown link into an anchor', () => {
    expect(linkHtml('See [our fees](/fees/) first.')).toBe('See <a href="/fees/">our fees</a> first.');
  });

  it('escapes markup in the text, including inside the link label', () => {
    expect(linkHtml('<script>x</script> & "q"')).toBe('&lt;script&gt;x&lt;/script&gt; &amp; &quot;q&quot;');
    expect(linkHtml('[<b>fees</b>](/fees/)')).toBe('<a href="/fees/">&lt;b&gt;fees&lt;/b&gt;</a>');
  });

  it('leaves links that do not start with a slash as text', () => {
    for (const href of ['javascript:alert(1)', 'https://example.test/', 'fees/']) {
      expect(linkHtml(`[x](${href})`)).not.toContain('<a');
    }
  });

  it('cannot break out of the href attribute', () => {
    expect(linkHtml('[x](/a"onclick="y)')).toBe('<a href="/a&quot;onclick=&quot;y">x</a>');
  });
});

describe('plainText', () => {
  it('keeps the link label and drops the target', () => {
    expect(plainText('See [our fees](/fees/) first.')).toBe('See our fees first.');
  });
});
