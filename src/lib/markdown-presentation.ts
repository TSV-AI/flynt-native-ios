export function sentenceCaseMarkdownListItems(markdown: string) {
  let fence: '```' | '~~~' | null = null;

  return markdown.split('\n').map((line) => {
    const fenceMarker = line.match(/^\s*(```|~~~)/)?.[1] as '```' | '~~~' | undefined;
    if (fenceMarker) {
      fence = fence === fenceMarker ? null : fenceMarker;
      return line;
    }
    if (fence) return line;

    return line.replace(
      /^(\s*(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s+)?(?:[*_~]{1,3})?)([a-z])(?=[a-z])/,
      (_, prefix: string, firstLetter: string) => `${prefix}${firstLetter.toLocaleUpperCase('en-US')}`,
    );
  }).join('\n');
}
