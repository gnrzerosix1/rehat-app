export const BANNED_WORDS = [
  "konten hasil ai",
  "tulisan ai",
  "ini sih ai",
  "goblok",
  "tolol",
  "bego",
  "anjing",
  "bangsat",
  "babi",
  "buatan ai",
  "pake ai",
  "chatgpt",
  "ai murahan",
  "dasar ai",
  "ketahuan ai"
];

export const containsBadWords = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some(word => lowerText.includes(word));
};
