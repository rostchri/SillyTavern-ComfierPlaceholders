export const settingsKey = 'SillyTavernComfierPlaceholders';
export const EXTENSION_NAME = 'Comfier Placeholders';

/**
 * Get the placeholder delimiter from settings
 * @returns {string} The delimiter ('%' or '*')
 */
export function getPlaceholderDelimiter() {
    const context = SillyTavern.getContext();
    const settings = context.extensionSettings[settingsKey];
    const delimiter = settings?.placeholderDelimiter || '%';
    // Ensure only valid delimiters are returned
    return delimiter === '*' ? '*' : '%';
}

/**
 * Wrap a placeholder name with delimiters
 * @param {string} placeholderName - The placeholder name without delimiters
 * @returns {string} The placeholder with delimiters
 */
export function wrapPlaceholder(placeholderName) {
    const delimiter = getPlaceholderDelimiter();
    return `${delimiter}${placeholderName}${delimiter}`;
}
