// noinspection DuplicatedCode

/*
Comfier Placeholders

Objective:
Make it easier to replace inputs in the Image Generation workflow with placeholders.

Examples:
- for all nodes of class_type KSampler, the input "seed" should be replaced with the placeholder "%seed%"
- For Flux_img2img.json, KSampler input "denoise" should be replaced with "%denoise%"
- For Flux_txt2img.json, node titled "CLIP Loader", input "clip_name1" should be replaced with "%clip%"

TODO list:
- check for placeholders in the workflow that are not in the list and prompt the user to add them
*/

import { renderExtensionSettings } from './ui/settings.js';
import { settingsKey, EXTENSION_NAME } from './consts.js';
import { injectReplacerButton } from './ui/workflowEditor.js';

/**
 * @typedef {Object} ReplacementRule
 * @property {string|null} workflowName - Name of the workflow, or null for any workflow
 * @property {string|null} nodeTitle - Title of the node, or null for any node
 * @property {string|null} nodeClass - Class type of the node, or null for any class
 * @property {string|null} inputName - Name of the input, or null for any input
 * @property {string} placeholder - The placeholder to insert (without %%)
 * @property {string} description - Human readable description of what this replacement does
 */

/**
 * @typedef {Object} SavedVersion
 * @property {string} apiWorkflowName - Name of the source workflow
 * @property {string} dstWorkflowName - Name of the destination workflow
 * @property {string} lastUpdated - ISO timestamp of last update
 * @property {string} description - Optional description of the saved version
 */

/**
 * @type {SillyTavernComfierPlaceholdersSettings}
 * @typedef {Object} SillyTavernComfierPlaceholdersSettings
 * @property {boolean} enabled Whether the extension is enabled
 * @property {string} placeholderDelimiter Delimiter for placeholders ('%' or '*')
 * @property {Record<string,SavedVersion>} savedAs Saved versions of workflows
 * @property {ReplacementRule[]} replacements List of replacement rules
 */
const defaultSettings = Object.freeze({
    enabled: true,
    placeholderDelimiter: '%',
    savedAs: {
        // Example structure with new fields
        /*
        "workflow.json": {
            apiWorkflowName: "workflow.json",
            dstWorkflowName: "workflow_with_placeholders.json",
            lastUpdated: "2024-12-19T12:00:00Z",
            description: "Version with all inputs replaced by placeholders"
        }
        */
    },
    replacements: [
        // Default replacements extracted from sample workflows
        {
            workflowName: null,
            nodeTitle: null,
            nodeClass: 'KSampler',
            inputName: 'seed',
            placeholder: 'seed',
            description: 'Random seed for sampling',
        },
        {
            workflowName: null,
            nodeTitle: null,
            nodeClass: 'KSampler',
            inputName: 'steps',
            placeholder: 'steps',
            description: 'Number of sampling steps',
        },
        {
            workflowName: null,
            nodeTitle: null,
            nodeClass: 'KSampler',
            inputName: 'cfg',
            placeholder: 'scale',
            description: 'CFG scale value',
        },
        {
            workflowName: null,
            nodeTitle: null,
            nodeClass: 'KSampler',
            inputName: 'sampler_name',
            placeholder: 'sampler',
            description: 'Sampling algorithm',
        },
        {
            workflowName: null,
            nodeTitle: null,
            nodeClass: 'KSampler',
            inputName: 'scheduler',
            placeholder: 'scheduler',
            description: 'Scheduler algorithm',
        },
        {
            workflowName: null,
            nodeTitle: null,
            nodeClass: 'KSampler',
            inputName: 'denoise',
            placeholder: 'denoise',
            description: 'Denoising strength',
        },
        {
            workflowName: null,
            nodeTitle: null,
            nodeClass: 'CheckpointLoaderSimple',
            inputName: 'ckpt_name',
            placeholder: 'model',
            description: 'Model checkpoint name',
        },
        {
            workflowName: null,
            nodeTitle: null,
            nodeClass: 'CLIPTextEncode',
            inputName: 'text',
            placeholder: 'prompt',
            description: 'Main prompt text',
        },
        {
            workflowName: null,
            nodeTitle: null,
            nodeClass: 'EmptyLatentImage',
            inputName: 'width',
            placeholder: 'width',
            description: 'Image width',
        },
        {
            workflowName: null,
            nodeTitle: null,
            nodeClass: 'EmptyLatentImage',
            inputName: 'height',
            placeholder: 'height',
            description: 'Image height',
        },
        {
            workflowName: null,
            nodeTitle: 'CLIP Text Encode (Negative Prompt)',
            nodeClass: 'CLIPTextEncode',
            inputName: 'text',
            placeholder: 'negative_prompt',
            description: 'Negative prompt text',
        },
    ],
});


(function initExtension() {
    console.debug(`[${EXTENSION_NAME}]`, 'Initializing extension');
    const context = SillyTavern.getContext();

    if (!context.extensionSettings[settingsKey]) {
        context.extensionSettings[settingsKey] = structuredClone(defaultSettings);
    }

    for (const key of Object.keys(defaultSettings)) {
        if (context.extensionSettings[settingsKey][key] === undefined) {
            context.extensionSettings[settingsKey][key] = defaultSettings[key];
        }
    }

    context.saveSettingsDebounced();

    renderExtensionSettings();

    // Watch for workflow editor being added to DOM
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node instanceof HTMLElement && node.querySelector('.sd_comfy_workflow_editor')) {
                    injectReplacerButton();
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    console.debug(`[${EXTENSION_NAME}]`, 'Extension initialized');
})();
