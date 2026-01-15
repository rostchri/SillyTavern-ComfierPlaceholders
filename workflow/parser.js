import { settingsKey, EXTENSION_NAME, getPlaceholderDelimiter, wrapPlaceholder } from '../consts.js';
import { addCustomPlaceholderToSD, getPlaceholderOptionValues } from './placeholders.js';

/**
 * @typedef {Object} WorkflowNode
 * @property {Object} inputs - Node inputs
 * @property {string} class_type - Type of the node
 * @property {Object} _meta - Node metadata
 * @property {string} _meta.title - Node title
 */

/**
 * @typedef {Object} NodeInputInfo Input to a ComfyUI workflow node
 * @property {string} name - Input name
 * @property {string} value - Input value, either original constant or a placeholder
 * @property {string} suggested - Suggested placeholder value from checking rules, with %%
 */

/**
 * @typedef {Object} NodeInfo Node in a ComfyUI workflow
 * @property {string} id - Node ID
 * @property {string} title - Node title
 * @property {string} class_type - Node
 * @property {Record<string,NodeInputInfo>} inputs - Node inputs
 */

/**
 * Parse a ComfyUI workflow and extract relevant node information
 * @param {string} workflowName - The name of the workflow
 * @param {string} workflowJson - The workflow JSON string
 * @returns {NodeInfo[]} List of nodes with inputs
 */
function parseWorkflow(workflowName, workflowJson) {
    const workflow = JSON.parse(workflowJson);
    /** @type {NodeInfo[]} */
    const nodes = [];

    for (const [nodeId, node] of Object.entries(workflow)) {

        // We're only interested in nodes that have inputs
        if (!node.inputs) continue;

        const nodeInfo = makeNodeInfo(nodeId, node._meta?.title || 'Untitled', node.class_type, {});

        // Only include non-node inputs (nodes are referenced by array [nodeId, outputIndex])
        for (const [inputName, inputValue] of Object.entries(node.inputs)) {
            if (!Array.isArray(inputValue)) {
                nodeInfo.inputs[inputName] = makeNodeInput(inputName, inputValue);
                const rules = findMatchingRulesForNode(workflowName, nodeInfo, inputName);
                if (rules.length > 0) {
                    const ph = rules[0].placeholder;
                    nodeInfo.inputs[inputName].suggested = wrapPlaceholder(ph);
                }
            }
        }

        nodes.push(nodeInfo);
    }

    return nodes;
}

/**
 * Replace a node's input value with a placeholder
 * @param {string} workflowJson - The workflow JSON string
 * @param {string} nodeId - The ID of the node to modify
 * @param {string} inputName - The name of the input to replace
 * @param {string} placeholder - The placeholder to use (without %%)
 * @returns {string} The modified workflow JSON
 */
function replaceInputWithPlaceholder(workflowJson, nodeId, inputName, placeholder) {
    const delimiter = getPlaceholderDelimiter();
    const delimiterRegex = new RegExp(`[${delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g');
    const unwrapped = placeholder.replace(delimiterRegex, '');
    if (!unwrapped) {
        throw new Error('Placeholder cannot be empty');
    }
    const wrapped = wrapPlaceholder(unwrapped);
    console.log(`[${EXTENSION_NAME}]`, `Replacing input ${inputName} in node ${nodeId} with placeholder ${wrapped}`);
    if (unwrapped !== placeholder) {
        console.log(`[${EXTENSION_NAME}]`, `Removing ${delimiter} from placeholder:`, placeholder, unwrapped);
    }
    // console.log(`[${EXTENSION_NAME}]`, 'Workflow JSON:', workflowJson);
    const workflow = JSON.parse(workflowJson);
    if (!workflow[nodeId]?.inputs?.[inputName]) {
        throw new Error(`Input ${inputName} not found in node ${nodeId}`);
    }

    workflow[nodeId].inputs[inputName] = wrapped;
    return JSON.stringify(workflow, null, 2);
}

/**
 * Find all placeholders currently used in the workflow
 * @param {string} workflowJson - The workflow JSON string
 * @returns {Set<string>} Set of placeholders found (without %%)
 */
function findExistingPlaceholders(workflowJson) {
    const placeholders = new Set();
    const delimiter = getPlaceholderDelimiter();
    // Escape delimiter for regex if it's a special character
    const escapedDelimiter = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const placeholderRegex = new RegExp(`${escapedDelimiter}([^${escapedDelimiter}]+)${escapedDelimiter}`, 'g');
    let match;

    while ((match = placeholderRegex.exec(workflowJson)) !== null) {
        placeholders.add(match[1]);
    }

    return placeholders;
}

/**
 *
 * @param {string} nodeId
 * @param {string} title
 * @param {string} class_type
 * @param {Object} inputs
 * @returns {NodeInfo}
 */
function makeNodeInfo(nodeId, title, class_type, inputs) {
    return {
        id: nodeId,
        title,
        class_type,
        inputs,
    };
}

/**
 *
 * @param inputName
 * @param value
 * @returns {NodeInputInfo}
 */
function makeNodeInput(inputName, value) {
    return {
        name: inputName,
        value,
        suggested: '',
    };
}


/**
 * Find all matching replacement rules for a node
 *
 * @param {NodeInfo} node
 * @param {string} workflowName
 * @param {string} inputName
 * @returns {ReplacementRule[]}
 */
function findMatchingRulesForNode(workflowName, node, inputName) {
    const context = SillyTavern.getContext();
    const settings = context.extensionSettings[settingsKey];

    /** @type {ReplacementRule[]} */
    const rules = settings.replacements;

    const predicates = [
        rule => !rule.workflowName || rule.workflowName === workflowName,
        rule => !rule.nodeTitle || rule.nodeTitle === node.title,
        rule => !rule.nodeClass || rule.nodeClass === node.class_type,
        rule => rule.inputName === inputName,
    ];
    return rules.filter(rule => predicates.every(predicate => predicate(rule)));
}

function replaceAllPlaceholders(workflowName, workflowJson) {
    const nodes = parseWorkflow(workflowName, workflowJson);
    let updatedWorkflow = workflowJson;

    for (const node of nodes) {
        // for (const [inputName, inputValue] of Object.entries(node.inputs)) {
        //     const rules = findMatchingRulesForNode(workflowName, node, inputName);
        //     for (const rule of rules) {
        //         if (rule.placeholder === inputValue.value) continue;
        //         updatedWorkflow = replaceInputWithPlaceholder(updatedWorkflow, node.id, inputName, rule.placeholder);
        //     }
        // }
        // the parser already adds the suggested placeholder to the input, so we can just use that
        for (const [inputName, inputValue] of Object.entries(node.inputs)) {
            if (inputValue.suggested && inputValue.suggested !== inputValue.value) {
                updatedWorkflow = replaceInputWithPlaceholder(updatedWorkflow, node.id, inputName, inputValue.suggested);

                // does the placeholder exist or do we need to add it?
                const placeholders = getPlaceholderOptionValues();
                if (!placeholders.includes(inputValue.suggested)) {
                    console.log(`[${EXTENSION_NAME}]`, `Adding placeholder ${inputValue.suggested}`);
                    addCustomPlaceholderToSD({ find: inputValue.suggested, replace: inputValue.value, custom: true });
                }
            }
        }
    }

    return updatedWorkflow;
}

export { parseWorkflow, replaceInputWithPlaceholder, findExistingPlaceholders, replaceAllPlaceholders };
