import { EXTENSION_NAME, wrapPlaceholder, getPlaceholderDelimiter } from '../consts.js';

/**
 * @typedef {Object} PlaceholderInfo
 * @property {string} find - Placeholder to find, without %%
 * @property {string} [replace] - Value to replace the placeholder with, if custom
 * @property {boolean} [custom] - Custom placeholder
 * @property {boolean} [present] - Placeholder is present in the current workflow
 * @property {boolean} [valid] - Placeholder is present in the editor's placeholder list
 */

const slugify = (str) => str.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');


/**
 * Get current placeholders in the workflow editor as name: value select options with %% around them
 *
 * @returns {Record<string,string>} Placeholder options
 */
export function getPlaceholderOptions() {
    const rulesPlaceholders = getCurrentPlaceholders();
    const placeholderOptions = {};
    for (const [key] of Object.entries(rulesPlaceholders)) {
        placeholderOptions[key] = wrapPlaceholder(key);
    }
    return placeholderOptions;
}

/**
 * Get current placeholder values in the workflow editor with %% around them
 *
 * @returns {string[]}
 */
export function getPlaceholderOptionValues() {
    // console.log(`[${EXTENSION_NAME}]`, 'getPlaceholderOptionValues: ', placeholderOptionValues);
    return Object.values(getPlaceholderOptions());
}

/**
 * Get the current placeholders in the workflow editor
 *
 * @returns {Record<string,PlaceholderInfo>} Placeholder info
 */
export function getCurrentPlaceholders() {
    const workflow = document.getElementById('sd_comfy_workflow_editor_workflow')?.value;
    if (!workflow) {
        console.warn(`[${EXTENSION_NAME}]`, 'getCurrentPlaceholders: Could not find workflow');
    }
    const placeholderList = document.querySelectorAll('.sd_comfy_workflow_editor_placeholder_list > li[data-placeholder]') || [];
    if (!placeholderList.length) {
        console.warn(`[${EXTENSION_NAME}]`, 'getCurrentPlaceholders: Could not find placeholder list');
        return {};
    }
    const delimiter = getPlaceholderDelimiter();
    const placeholders = {};
    for (const placeholder of placeholderList) {
        const key = placeholder.getAttribute('data-placeholder');
        const wrapped = wrapPlaceholder(key);
        const present = workflow?.search(`"${wrapped}"`) !== -1;
        placeholders[key] = {
            find: key,
            value: key, // for compatibility with the replacement rule dialog
            replace: null,
            custom: false,
            present,
            valid: true,
        };
    }
    const customPlaceholders = document.querySelectorAll('.sd_comfy_workflow_editor_placeholder_list_custom > li[data-placeholder]') || [];
    for (const placeholder of customPlaceholders) {
        const key = placeholder.getAttribute('data-placeholder');
        const wrapped = wrapPlaceholder(key);
        const present = workflow?.search(`"${wrapped}"`) !== -1;
        const value = placeholder.find('.text_pole sd_comfy_workflow_editor_custom_replace').value;
        placeholders[key] = {
            find: key,
            replace: value,
            custom: true,
            present,
            valid: true,
        };
    }
    return placeholders;
}

/**
 * Add a custom placeholder to the workflow editor
 * @param {PlaceholderInfo} placeholder - Placeholder info
 */
export function addCustomPlaceholderToSD(placeholder) {
    const addBtn = document.getElementById('sd_comfy_workflow_editor_placeholder_add');

    // get a blank placeholder in the DOM
    addBtn.click();
    const newPlaceholder = document.querySelector('#sd_comfy_workflow_editor_placeholder_list_custom > li:last-child');
    const find = newPlaceholder.querySelector('.sd_comfy_workflow_editor_custom_find');
    find.value = slugify(placeholder.find);
    const replace = newPlaceholder.querySelector('.sd_comfy_workflow_editor_custom_replace');
    replace.value = placeholder.replace;
    find.dispatchEvent(new Event('input'));
    replace.dispatchEvent(new Event('input'));
    console.log(`[${EXTENSION_NAME}]`, 'addCustomPlaceholderToSD: ', placeholder);
}
