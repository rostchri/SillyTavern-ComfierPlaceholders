// noinspection DuplicatedCode

import { settingsKey, EXTENSION_NAME } from '../consts.js';

function renderExtensionSettings() {
    const context = SillyTavern.getContext();
    const settingsContainer = document.getElementById(`${settingsKey}-container`) ?? document.getElementById('extensions_settings2');
    if (!settingsContainer) {
        return;
    }

    const inlineDrawer = document.createElement('div');
    inlineDrawer.classList.add('inline-drawer');
    settingsContainer.append(inlineDrawer);

    const inlineDrawerToggle = document.createElement('div');
    inlineDrawerToggle.classList.add('inline-drawer-toggle', 'inline-drawer-header');

    const extensionName = document.createElement('b');
    extensionName.textContent = context.t`${EXTENSION_NAME}`;

    const inlineDrawerIcon = document.createElement('div');
    inlineDrawerIcon.classList.add('inline-drawer-icon', 'fa-solid', 'fa-circle-chevron-down', 'down');

    inlineDrawerToggle.append(extensionName, inlineDrawerIcon);

    const inlineDrawerContent = document.createElement('div');
    inlineDrawerContent.classList.add('inline-drawer-content');

    inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);

    /** @type {SillyTavernComfierPlaceholdersSettings} */
    const settings = context.extensionSettings[settingsKey];

    // Enabled checkbox
    const enabledCheckboxLabel = document.createElement('label');
    enabledCheckboxLabel.classList.add('checkbox_label');
    enabledCheckboxLabel.htmlFor = `${settingsKey}-enabled`;
    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.id = `${settingsKey}-enabled`;
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.checked = settings.enabled;
    enabledCheckbox.addEventListener('change', () => {
        settings.enabled = enabledCheckbox.checked;
        context.saveSettingsDebounced();
    });
    const enabledCheckboxText = document.createElement('span');
    enabledCheckboxText.textContent = context.t`Enabled`;
    enabledCheckboxLabel.append(enabledCheckbox, enabledCheckboxText);
    inlineDrawerContent.append(enabledCheckboxLabel);

    // Placeholder delimiter selector
    const delimiterLabel = document.createElement('label');
    delimiterLabel.classList.add('checkbox_label');
    delimiterLabel.style.marginTop = '10px';
    delimiterLabel.style.display = 'flex';
    delimiterLabel.style.alignItems = 'center';
    delimiterLabel.style.gap = '10px';
    const delimiterText = document.createElement('span');
    delimiterText.textContent = 'Placeholder delimiter:';
    const delimiterSelect = document.createElement('select');
    delimiterSelect.id = `${settingsKey}-delimiter`;
    delimiterSelect.style.marginLeft = 'auto';
    delimiterSelect.style.minWidth = '80px';
    const optionPercent = document.createElement('option');
    optionPercent.value = '%';
    optionPercent.textContent = '%';
    const optionStar = document.createElement('option');
    optionStar.value = '*';
    optionStar.textContent = '*';
    delimiterSelect.append(optionPercent, optionStar);
    delimiterSelect.value = settings.placeholderDelimiter || '%';
    delimiterSelect.addEventListener('change', () => {
        settings.placeholderDelimiter = delimiterSelect.value;
        context.saveSettingsDebounced();
    });
    delimiterLabel.append(delimiterText, delimiterSelect);
    inlineDrawerContent.append(delimiterLabel);

    // Manage replacements button
    const manageButton = document.createElement('button');
    manageButton.classList.add('menu_button');
    manageButton.textContent = 'Replacement rules';
    manageButton.style.marginTop = '10px';
    manageButton.addEventListener('click', () => {
        import('./ruleManagerDialog.js').then(({ showReplacementRuleManagerDialog }) => {
            showReplacementRuleManagerDialog();
        });
    });
    inlineDrawerContent.appendChild(manageButton);

    // Add Manage Associations button
    const manageAssociationsButton = document.createElement('button');
    manageAssociationsButton.classList.add('menu_button');
    manageAssociationsButton.textContent = 'Workflow links';
    manageAssociationsButton.style.marginTop = '10px';
    manageAssociationsButton.addEventListener('click', () => {
        import('./associationsManagerDialog.js').then(({ showAssociationsManagerDialog }) => {
            showAssociationsManagerDialog();
        });
    });
    inlineDrawerContent.appendChild(manageAssociationsButton);
}

export { renderExtensionSettings, settingsKey, EXTENSION_NAME };
