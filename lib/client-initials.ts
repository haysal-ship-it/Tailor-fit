const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

export function clientInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  while (words.length > 1 && /^(jr\.?|sr\.?|ii|iii|iv)$/i.test(words[words.length - 1])) words.pop();
  const parts = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return parts.map(word => segmenter?.segment(word).containing(0)?.segment ?? Array.from(word)[0]).join('').toUpperCase() || 'CL';
}
