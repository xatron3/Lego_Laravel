/**
 * Strip UTF-8 BOM (Byte Order Mark) from text if present.
 *
 * BOM is a Unicode character (U+FEFF) that can appear at the start of text files
 * to indicate the byte order and encoding. While harmless in many contexts, it can
 * cause parsing issues with LDraw files, especially when the LDrawLoader tries to
 * parse material definitions or part references.
 *
 * @param text - The text that may contain a BOM
 * @returns The text with BOM removed if it was present
 */
export function stripBOM(text: string): string {
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
