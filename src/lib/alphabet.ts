const PINYIN_BOUNDARIES = [
  { letter: 'A', boundary: '阿' },
  { letter: 'B', boundary: '八' },
  { letter: 'C', boundary: '嚓' },
  { letter: 'D', boundary: '哒' },
  { letter: 'E', boundary: '妸' },
  { letter: 'F', boundary: '发' },
  { letter: 'G', boundary: '旮' },
  { letter: 'H', boundary: '哈' },
  { letter: 'J', boundary: '击' },
  { letter: 'K', boundary: '喀' },
  { letter: 'L', boundary: '垃' },
  { letter: 'M', boundary: '妈' },
  { letter: 'N', boundary: '拿' },
  { letter: 'O', boundary: '哦' },
  { letter: 'P', boundary: '啪' },
  { letter: 'Q', boundary: '期' },
  { letter: 'R', boundary: '然' },
  { letter: 'S', boundary: '撒' },
  { letter: 'T', boundary: '塌' },
  { letter: 'W', boundary: '挖' },
  { letter: 'X', boundary: '昔' },
  { letter: 'Y', boundary: '压' },
  { letter: 'Z', boundary: '匝' },
] as const;

const pinyinCollator = new Intl.Collator('zh-CN-u-co-pinyin', {
  sensitivity: 'base',
  numeric: true,
});

export function compareAlphaNames(a: string, b: string): number {
  return pinyinCollator.compare(a, b);
}

export function getAlphaGroup(name: string): string {
  const firstChar = name.trim()[0];
  if (!firstChar) return '#';

  const upper = firstChar.toUpperCase();
  if (/[A-Z]/.test(upper)) {
    return upper;
  }

  let currentLetter = '#';
  for (const item of PINYIN_BOUNDARIES) {
    if (pinyinCollator.compare(firstChar, item.boundary) >= 0) {
      currentLetter = item.letter;
    } else {
      break;
    }
  }

  return currentLetter;
}
