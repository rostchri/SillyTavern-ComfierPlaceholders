import { settingsKey, wrapPlaceholder } from '../consts.js';
import { showReplacementRuleDialog } from './replacementRuleDialog.js';
import { icon } from './icon.js';
import { ButtonType, iconButton } from './iconButton.js';
import { EXTENSION_NAME } from '../consts.js';

const t = SillyTavern.getContext().t;

function ruleFilter(className, text, title, faClass) {
    faClass = faClass || 'asterisk';
    const workflowIcon = icon(faClass, title);
    workflowIcon.style.marginRight = '5px';
    const workflowNameText = text || 'Any';
    const workflowNameLabel = document.createElement('div');
    workflowNameLabel.appendChild(workflowIcon);
    workflowNameLabel.classList.add(className, 'tag_name');
    workflowNameLabel.appendChild(document.createTextNode(workflowNameText));
    workflowNameLabel.isAny = !text;
    return workflowNameLabel;
}

/**
 * Edit a replacement rule
 *
 * @returns {Promise<void>}
 */
async function onEditButtonClick(callback) {
    console.log(`[${EXTENSION_NAME}]`, t`Editing replacement rule at index`, this.dataset.index);
    const context = SillyTavern.getContext();
    const settings = context.extensionSettings[settingsKey];

    const index = parseInt(this.dataset.index);
    const replacement = settings.replacements[index];
    const newReplacement = await showReplacementRuleDialog(replacement);
    if (!newReplacement) return;

    settings.replacements[index] = newReplacement;
    context.saveSettingsDebounced();
    // renderReplacements();
    callback();
}

/**
 * Crazy town
 *
 * @param callback
 * @returns {Promise<void>}
 */
async function onRemoveButtonClick(callback) {
    console.log(`[${EXTENSION_NAME}]`, t`Removing replacement rule at index`, this.dataset.index);
    const context = SillyTavern.getContext();
    const settings = context.extensionSettings[settingsKey];
    const index = parseInt(this.dataset.index);
    console.log(`[${EXTENSION_NAME}] Removing replacement rule at index`, index, 'this:', this, settings.replacements[index]);
    settings.replacements.splice(index, 1);
    context.saveSettingsDebounced();
    // renderReplacements();
    callback();
}

/**
 * Create a card for a replacement rule
 *
 * @param replacement
 * @param index
 * @param onEditButtonClick
 * @param onRemoveButtonClick
 * @returns {HTMLDivElement}
 */
function createReplacementRuleCard(replacement, index, onEditButtonClick, onRemoveButtonClick) {
    const card = document.createElement('div');
    card.classList.add('replacement-card');
    card.style.border = '1px solid #666';
    card.style.borderRadius = '8px';
    card.style.padding = '10px';
    card.style.backgroundColor = '--SmartThemeBodyColor)';

    const workflowNameLabel = ruleFilter('workflow-name', replacement.workflowName, 'Workflow Name', 'code-branch');
    const nodeTitleLabel = ruleFilter('node-title', replacement.nodeTitle, 'Node Title', 'martini-glass');
    const nodeClassLabel = ruleFilter('node-class', replacement.nodeClass, 'Node Class', 'code-commit');
    const inputNameLabel = ruleFilter('input-name', replacement.inputName, 'Input Name', 'code');
    const placeholderLabel = ruleFilter('placeholder', wrapPlaceholder(replacement.placeholder), 'Placeholder', 'percent');

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('flex-container');
    cardHeader.style.marginBottom = '8px';

    const cardDescription = document.createElement('h4');
    cardDescription.textContent = replacement.description || replacement.placeholder;
    cardDescription.classList.add('flexGrow', 'justifyLeft');
    cardHeader.appendChild(cardDescription);

    const editButton = iconButton('Edit', 'edit', { srOnly: true });
    editButton.dataset.index = `${index}`;
    editButton.addEventListener('click', onEditButtonClick);
    cardHeader.appendChild(editButton);

    const removeButton = iconButton('Remove', 'trash-alt', { srOnly: true, buttonType: ButtonType.DANGER });
    removeButton.dataset.index = `${index}`;
    removeButton.classList.add('remove-button', 'text-danger');
    removeButton.addEventListener('click', onRemoveButtonClick);
    cardHeader.appendChild(removeButton);

    const cardBody = document.createElement('div');
    workflowNameLabel.isAny || cardBody.appendChild(workflowNameLabel);
    nodeTitleLabel.isAny || cardBody.appendChild(nodeTitleLabel);
    cardBody.append(nodeClassLabel, inputNameLabel, placeholderLabel);
    cardBody.classList.add('flex-container', 'flexFlowColumn');

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    return card;
}

function createReplacementRulesList() {
    const context = SillyTavern.getContext();
    const settings = context.extensionSettings[settingsKey];

    const container = document.createElement('div');
    container.classList.add('replacements-list');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    function renderReplacements() {
        container.innerHTML = '';
        const replacements = settings.replacements;
        replacements.sort((a, b) => {
            a.workflowName = a.workflowName || '';
            b.workflowName = b.workflowName || '';
            a.nodeTitle = a.nodeTitle || '';
            b.nodeTitle = b.nodeTitle || '';
            a.nodeClass = a.nodeClass || '';
            b.nodeClass = b.nodeClass || '';
            a.inputName = a.inputName || '';
            b.inputName = b.inputName || '';
            a.placeholder = a.placeholder || '';
            b.placeholder = b.placeholder || '';

            if (a.workflowName !== b.workflowName) {
                return a.workflowName.localeCompare(b.workflowName);
            }
            if (a.nodeTitle !== b.nodeTitle) {
                return a.nodeTitle.localeCompare(b.nodeTitle);
            }
            if (a.nodeClass !== b.nodeClass) {
                return a.nodeClass.localeCompare(b.nodeClass);
            }
            if (a.inputName !== b.inputName) {
                return a.inputName.localeCompare(b.inputName);
            }
            return a.placeholder.localeCompare(b.placeholder);
        });
        replacements.forEach((replacement, index) => {
            const onEdit = () => onEditButtonClick.call({ dataset: { index } }, renderReplacements);
            const onRemove = () => onRemoveButtonClick.call({ dataset: { index } }, renderReplacements);
            const card = createReplacementRuleCard(replacement, index, onEdit, onRemove);
            container.appendChild(card);
        });
    }

    renderReplacements();
    return { container, renderReplacements };
}

async function showReplacementRuleManagerDialog() {
    const context = SillyTavern.getContext();
    const settings = context.extensionSettings[settingsKey];

    const dialog = document.createElement('div');
    dialog.classList.add('replacements-dialog');

    const header = document.createElement('div');
    header.style.marginBottom = '1em';
    const h3 = document.createElement('h3');
    h3.textContent = t`Manage replacement rules`;
    header.appendChild(h3);

    const addButton = iconButton(t`Add rule`, 'plus');
    addButton.addEventListener('click', onAddRuleClick);

    const exportButton = iconButton(t`Export rules`, 'file-export');
    exportButton.addEventListener('click', onExportRulesClick);

    const importButton = iconButton(t`Import rules`, 'file-import');
    importButton.addEventListener('click', onImportRulesClick);

    async function onImportRulesClick() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', async () => {
            const file = input.files[0];
            if (!file) return;
            const text = await file.text();
            try {
                const replacements = JSON.parse(text);
                if (!Array.isArray(replacements)) {
                    throw new Error('Invalid JSON');
                }
                settings.replacements = replacements;
                context.saveSettingsDebounced();
                renderReplacements();
            } catch (error) {
                console.error('Failed to import replacements:', error);
                alert('Failed to import replacements');
            }
        });
        input.click();
    }
    function onExportRulesClick() {
        const data = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(settings.replacements, null, 2))}`;
        const a = document.createElement('a');
        a.setAttribute('href', data);
        a.setAttribute('download', 'replacements.json');
        a.click();
    }
    async function onAddRuleClick() {
        const newReplacement = await showReplacementRuleDialog();
        if (!newReplacement) return;

        settings.replacements.push(newReplacement);
        context.saveSettingsDebounced();
        renderReplacements();
    }

    const { container, renderReplacements } = createReplacementRulesList();

    const controls = document.createElement('div');
    controls.classList.add('flex-container', 'flexFlowRow', 'alignItemsCenter', 'justifySpaceBetween');
    controls.append(addButton, importButton, exportButton);

    dialog.append(header, controls, container);
    await context.callGenericPopup(dialog, context.POPUP_TYPE.TEXT, '', {
        wide: true,
        large: true,
        allowVerticalScrolling: true,
        okButton: 'Close',
    });
}

export { showReplacementRuleManagerDialog };
