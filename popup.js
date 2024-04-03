function generateRandomPassword(options) {
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numberChars = '0123456789';
    const otherChars = '!@#$%^&*()-_=+';

    let availableChars = lowercaseChars;
    if (options.includeUppercase) availableChars += uppercaseChars;
    if (options.includeNumbers) availableChars += numberChars;
    if (options.includeOtherChars) availableChars += otherChars;

    let password = '';
    for (let i = 0; i < options.length; i++) {
        const randomIndex = Math.floor(Math.random() * availableChars.length);
        password += availableChars.charAt(randomIndex);
    }
    return password;
}


document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('saveButton');
    const clearButton = document.getElementById('clearButton');
    const userInput = document.getElementById('userInput');
    const dataTable = document.getElementById('dataTable');
    const includeUppercaseCheckbox = document.getElementById('includeUppercaseCheckbox');
    const includeNumbersCheckbox = document.getElementById('includeNumbersCheckbox');
    const includeOtherCharsCheckbox = document.getElementById('includeOtherCharsCheckbox');
    const passwordLengthInput = document.getElementById('passwordLengthInput');
    const generateButton = document.getElementById('generateButton');
    const generatedPasswordElement = document.getElementById('generatedPassword');
    const copyButton = document.getElementById('copyButton');


    // Load existing data from storage
    chrome.storage.sync.get(['userData'], function(result) {
      if (result.userData) {
        // Populate table with existing data
        result.userData.forEach(data => {
            addRowToTable(data.text, data.hashedValue, data.tag, data.blurred);
        });
      }
    });

    // Save user input to storage and table
    saveButton.addEventListener('click', async function() {
        const text = userInput.value.trim();
        const tag = tagInput.value.trim();
        if (text) {
            const hashedValue = await hashText(text); // Calculate hash value
            // Add data to table
            addRowToTable(text, hashedValue, tag, true); // Initially blurred
            // Save data to storage
            chrome.storage.sync.get(['userData'], function(result) {
                const userData = result.userData || [];
                userData.push({ text: text, hashedValue: hashedValue, tag: tag, blurred: true });
                chrome.storage.sync.set({ 'userData': userData });
            });
            // Clear input fields
            userInput.value = '';
            tagInput.value = '';
        }
    });

    clearButton.addEventListener('click', function() {
        // Clear data from table
        dataTable.innerHTML = '';
        // Clear data from storage
        chrome.storage.sync.remove('userData');
    });


    generateButton.addEventListener('click', function() {
        const passwordLength = parseInt(passwordLengthInput.value);
        const includeUppercase = includeUppercaseCheckbox.checked;
        const includeNumbers = includeNumbersCheckbox.checked;
        const includeOtherChars = includeOtherCharsCheckbox.checked;
        const options = {
            length: passwordLength,
            includeUppercase: includeUppercase,
            includeNumbers: includeNumbers,
            includeOtherChars: includeOtherChars
        };
        const password = generateRandomPassword(options);
        generatedPasswordElement.textContent = password;
    });


    copyButton.addEventListener('click', function() {
        const tempInput = document.createElement('input');
        tempInput.value = generatedPasswordElement.textContent;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        const tooltip = document.getElementById("myTooltip");
        tooltip.innerHTML = "Copied!";
        setTimeout(function() {
            tooltip.innerHTML = "Copy to clipboard";
        }, 1500); // Reset tooltip text after 1.5 seconds
    });
    


    // Function to add a row to the table
    function addRowToTable(text, hashedValue, tag, blurred) {
        const row = dataTable.insertRow();
        const textCell = row.insertCell();
        const hashedValueCell = row.insertCell();
        const tagCell = row.insertCell();
        const actionCell = row.insertCell();
        const blurCell = row.insertCell();
        
        textCell.textContent = text;
        hashedValueCell.textContent = hashedValue;
        tagCell.textContent = tag;
        
        // Default to blurred
        if (blurred) {
            textCell.classList.add('blurred');
            hashedValueCell.classList.add('blurred');
        }

        // Add a button to delete the row
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function() {
            // Remove the row from the table
            row.remove();
            // Remove the data from storage
            chrome.storage.sync.get(['userData'], function(result) {
                if (result.userData) {
                    const updatedUserData = result.userData.filter(item => item.text !== text);
                    chrome.storage.sync.set({ 'userData': updatedUserData });
                }
            });
        });
        actionCell.appendChild(deleteButton);

        // Add checkbox for blur/unblur
        const blurCheckbox = document.createElement('input');
        blurCheckbox.type = 'checkbox';
        blurCheckbox.checked = blurred; // Initially checked (blurred)
        blurCheckbox.addEventListener('change', function() {
            if (this.checked) {
                textCell.classList.add('blurred');
                hashedValueCell.classList.add('blurred');
            } else {
                textCell.classList.remove('blurred');
                hashedValueCell.classList.remove('blurred');
            }
            // Update blur state in storage
            chrome.storage.sync.get(['userData'], function(result) {
                if (result.userData) {
                    const updatedUserData = result.userData.map(item => {
                        if (item.text === text) {
                            return { ...item, blurred: this.checked };
                        }
                        return item;
                    });
                    chrome.storage.sync.set({ 'userData': updatedUserData });
                }
            });
        });
        blurCell.appendChild(blurCheckbox);
    }

    // Function to hash text
    async function hashText(text) {
        const encoder = new TextEncoder();
        const salt = "hehejoz"
        const saltedText = salt + text
        const data = encoder.encode(saltedText);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
});
