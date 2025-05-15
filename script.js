// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set focus to the editor
    document.getElementById('editor').focus();

    // Initialize ribbon tabs
    initializeRibbon();

    // Add event listeners for font changes
    document.getElementById('fontName').addEventListener('change', function() {
        formatDoc('fontName', this.value);

        // Apply the selected font to the dropdown to show a preview
        this.style.fontFamily = this.value;
    });

    // Initialize font dropdown with font previews
    initializeFontDropdown();

    document.getElementById('fontSize').addEventListener('change', function() {
        formatDoc('fontSize', this.value);
    });

    // Add click event listeners to toolbar buttons to toggle active state
    const buttons = document.querySelectorAll('.toolbar-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    // Initialize style selector
    document.getElementById('styleSelector').addEventListener('change', function() {
        applyStyle(this.value);
    });



    // Check for saved spell check preference
    const savedSpellCheck = localStorage.getItem('spellCheckEnabled');
    if (savedSpellCheck === 'false') {
        document.getElementById('editor').setAttribute('spellcheck', 'false');
        document.getElementById('spellCheckText').textContent = 'تفعيل التدقيق الإملائي';
        document.getElementById('spellCheckBtn').classList.add('disabled');
    }

    // Check for auto-save preference
    if (localStorage.getItem('autoSaveEnabled') === 'true') {
        const interval = parseInt(localStorage.getItem('autoSaveInterval')) || 30000;
        startAutoSave(interval);
    }

    // Load page settings
    loadPageSettings();

    // Add event listener for editor content changes
    document.getElementById('editor').addEventListener('input', function(e) {
        // Update word count
        updateWordCount();

        // Save state for undo/redo
        saveUndoState();
    });

    // Initialize word count
    updateWordCount();

    // Save initial state for undo/redo
    saveUndoState();

    // Update undo/redo button states
    updateUndoRedoButtons();

    // Check for saved content in local storage
    checkSavedContent();
});

// Function to execute document commands for formatting
function formatDoc(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('editor').focus();
}

// Function to save content as a text file
function saveAsTxt() {
    const content = document.getElementById('editor').innerText;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.txt';
    a.click();

    URL.revokeObjectURL(url);
}

// Function to save content as a PDF file
function saveAsPdf() {
    const element = document.getElementById('editor');
    const opt = {
        margin: 1,
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };

    // Use html2pdf library to generate PDF
    html2pdf().set(opt).from(element).save();
}

// Function to clear the editor content
function clearEditor() {
    if (confirm('هل أنت متأكد من رغبتك في مسح كل المحتوى؟')) {
        document.getElementById('editor').innerHTML = '<p>أهلاً بك في محرر النصوص! يمكنك البدء بالكتابة هنا...</p>';
    }
}

// Function to handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'b':
                e.preventDefault();
                formatDoc('bold');
                break;
            case 'i':
                e.preventDefault();
                formatDoc('italic');
                break;
            case 'u':
                e.preventDefault();
                formatDoc('underline');
                break;
        }
    }
});

// Function to handle paste events to strip formatting if needed
document.getElementById('editor').addEventListener('paste', function(e) {
    // If you want to paste as plain text, uncomment these lines:
    // e.preventDefault();
    // const text = (e.originalEvent || e).clipboardData.getData('text/plain');
    // document.execCommand('insertText', false, text);
});

// Function to handle image insertion
function insertImage() {
    // Create or show image dialog
    let imageDialog = document.getElementById('imageDialog');

    if (!imageDialog) {
        // Create dialog if it doesn't exist
        imageDialog = document.createElement('div');
        imageDialog.id = 'imageDialog';
        imageDialog.className = 'dialog';

        const dialogContent = document.createElement('div');
        dialogContent.className = 'dialog-content';

        const heading = document.createElement('h3');
        heading.textContent = 'إدراج صورة';

        // URL input
        const urlGroup = document.createElement('div');
        urlGroup.className = 'form-group';

        const urlLabel = document.createElement('label');
        urlLabel.setAttribute('for', 'imageUrl');
        urlLabel.textContent = 'رابط الصورة:';

        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.id = 'imageUrl';
        urlInput.className = 'dialog-input';
        urlInput.placeholder = 'https://example.com/image.jpg';

        urlGroup.appendChild(urlLabel);
        urlGroup.appendChild(urlInput);

        // File upload
        const fileGroup = document.createElement('div');
        fileGroup.className = 'form-group';

        const fileLabel = document.createElement('label');
        fileLabel.setAttribute('for', 'imageFile');
        fileLabel.textContent = 'أو اختر ملف من جهازك:';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'imageFile';
        fileInput.accept = 'image/*';
        fileInput.className = 'dialog-input';

        fileGroup.appendChild(fileLabel);
        fileGroup.appendChild(fileInput);

        // Image size options
        const sizeGroup = document.createElement('div');
        sizeGroup.className = 'form-group';

        const sizeLabel = document.createElement('label');
        sizeLabel.textContent = 'حجم الصورة:';

        const sizeOptions = document.createElement('div');
        sizeOptions.className = 'size-options';
        sizeOptions.style.display = 'flex';
        sizeOptions.style.gap = '10px';
        sizeOptions.style.marginTop = '5px';

        const sizeSmall = document.createElement('button');
        sizeSmall.type = 'button';
        sizeSmall.className = 'dialog-btn size-btn';
        sizeSmall.textContent = 'صغير';
        sizeSmall.dataset.size = 'small';

        const sizeMedium = document.createElement('button');
        sizeMedium.type = 'button';
        sizeMedium.className = 'dialog-btn size-btn active';
        sizeMedium.textContent = 'متوسط';
        sizeMedium.dataset.size = 'medium';

        const sizeLarge = document.createElement('button');
        sizeLarge.type = 'button';
        sizeLarge.className = 'dialog-btn size-btn';
        sizeLarge.textContent = 'كبير';
        sizeLarge.dataset.size = 'large';

        const sizeCustom = document.createElement('button');
        sizeCustom.type = 'button';
        sizeCustom.className = 'dialog-btn size-btn';
        sizeCustom.textContent = 'مخصص';
        sizeCustom.dataset.size = 'custom';

        sizeOptions.appendChild(sizeSmall);
        sizeOptions.appendChild(sizeMedium);
        sizeOptions.appendChild(sizeLarge);
        sizeOptions.appendChild(sizeCustom);

        sizeGroup.appendChild(sizeLabel);
        sizeGroup.appendChild(sizeOptions);

        // Custom size inputs (hidden by default)
        const customSizeGroup = document.createElement('div');
        customSizeGroup.className = 'form-group';
        customSizeGroup.id = 'customSizeGroup';
        customSizeGroup.style.display = 'none';

        const widthGroup = document.createElement('div');
        widthGroup.style.display = 'flex';
        widthGroup.style.alignItems = 'center';
        widthGroup.style.gap = '10px';
        widthGroup.style.marginBottom = '5px';

        const widthLabel = document.createElement('label');
        widthLabel.setAttribute('for', 'imageWidth');
        widthLabel.textContent = 'العرض:';
        widthLabel.style.width = '60px';

        const widthInput = document.createElement('input');
        widthInput.type = 'number';
        widthInput.id = 'imageWidth';
        widthInput.className = 'dialog-input';
        widthInput.min = '1';
        widthInput.value = '300';
        widthInput.style.width = '100px';

        const widthUnit = document.createElement('span');
        widthUnit.textContent = 'بكسل';

        widthGroup.appendChild(widthLabel);
        widthGroup.appendChild(widthInput);
        widthGroup.appendChild(widthUnit);

        const heightGroup = document.createElement('div');
        heightGroup.style.display = 'flex';
        heightGroup.style.alignItems = 'center';
        heightGroup.style.gap = '10px';

        const heightLabel = document.createElement('label');
        heightLabel.setAttribute('for', 'imageHeight');
        heightLabel.textContent = 'الارتفاع:';
        heightLabel.style.width = '60px';

        const heightInput = document.createElement('input');
        heightInput.type = 'number';
        heightInput.id = 'imageHeight';
        heightInput.className = 'dialog-input';
        heightInput.min = '1';
        heightInput.value = '200';
        heightInput.style.width = '100px';

        const heightUnit = document.createElement('span');
        heightUnit.textContent = 'بكسل';

        heightGroup.appendChild(heightLabel);
        heightGroup.appendChild(heightInput);
        heightGroup.appendChild(heightUnit);

        customSizeGroup.appendChild(widthGroup);
        customSizeGroup.appendChild(heightGroup);

        // Alt text
        const altGroup = document.createElement('div');
        altGroup.className = 'form-group';

        const altLabel = document.createElement('label');
        altLabel.setAttribute('for', 'imageAlt');
        altLabel.textContent = 'النص البديل (للوصول):';

        const altInput = document.createElement('input');
        altInput.type = 'text';
        altInput.id = 'imageAlt';
        altInput.className = 'dialog-input';
        altInput.placeholder = 'وصف الصورة';

        altGroup.appendChild(altLabel);
        altGroup.appendChild(altInput);

        // Buttons
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'dialog-buttons';

        const insertBtn = document.createElement('button');
        insertBtn.className = 'dialog-btn';
        insertBtn.textContent = 'إدراج';
        insertBtn.onclick = function() {
            insertImageFromDialog();
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'dialog-btn';
        cancelBtn.textContent = 'إلغاء';
        cancelBtn.onclick = function() {
            closeImageDialog();
        };

        buttonGroup.appendChild(insertBtn);
        buttonGroup.appendChild(cancelBtn);

        // Add all elements to dialog
        dialogContent.appendChild(heading);
        dialogContent.appendChild(urlGroup);
        dialogContent.appendChild(fileGroup);
        dialogContent.appendChild(sizeGroup);
        dialogContent.appendChild(customSizeGroup);
        dialogContent.appendChild(altGroup);
        dialogContent.appendChild(buttonGroup);

        imageDialog.appendChild(dialogContent);
        document.body.appendChild(imageDialog);

        // Add event listeners for size buttons
        const sizeButtons = imageDialog.querySelectorAll('.size-btn');
        sizeButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                sizeButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');

                // Show/hide custom size inputs
                if (this.dataset.size === 'custom') {
                    document.getElementById('customSizeGroup').style.display = 'block';
                } else {
                    document.getElementById('customSizeGroup').style.display = 'none';
                }
            });
        });

        // Add event listener for file input
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                // Clear URL input when file is selected
                document.getElementById('imageUrl').value = '';
            }
        });
    }

    // Show dialog
    imageDialog.style.display = 'flex';
    document.getElementById('imageUrl').focus();
}

// Function to close image dialog
function closeImageDialog() {
    document.getElementById('imageDialog').style.display = 'none';
}

// Function to insert image from dialog
function insertImageFromDialog() {
    const urlInput = document.getElementById('imageUrl');
    const fileInput = document.getElementById('imageFile');
    const altText = document.getElementById('imageAlt').value;

    // Get selected size
    const sizeBtn = document.querySelector('.size-btn.active');
    const size = sizeBtn.dataset.size;

    let width, height;

    // Set dimensions based on selected size
    if (size === 'small') {
        width = 150;
        height = 'auto';
    } else if (size === 'medium') {
        width = 300;
        height = 'auto';
    } else if (size === 'large') {
        width = 500;
        height = 'auto';
    } else if (size === 'custom') {
        width = document.getElementById('imageWidth').value;
        height = document.getElementById('imageHeight').value;
    }

    // Check if URL is provided
    if (urlInput.value) {
        const img = document.createElement('img');
        img.src = urlInput.value;
        img.alt = altText;
        img.style.width = width + 'px';
        if (height !== 'auto') {
            img.style.height = height + 'px';
        }

        // Insert image
        document.execCommand('insertHTML', false, img.outerHTML);
        closeImageDialog();
    }
    // Check if file is selected
    else if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = altText;
            img.style.width = width + 'px';
            if (height !== 'auto') {
                img.style.height = height + 'px';
            }

            // Insert image
            document.execCommand('insertHTML', false, img.outerHTML);
            closeImageDialog();
        };

        reader.readAsDataURL(fileInput.files[0]);
    } else {
        alert('الرجاء إدخال رابط الصورة أو اختيار ملف');
    }
}

// Function to update word and character count
function updateWordCount() {
    const text = document.getElementById('editor').innerText;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const charCount = text.length;

    document.getElementById('wordCount').textContent = wordCount;
    document.getElementById('charCount').textContent = charCount;
}

// Function to open advanced list dialog
function openAdvancedListDialog() {
    const dialog = document.getElementById('advancedListDialog');
    dialog.style.display = 'flex';

    // Set default values based on current selection
    const selection = window.getSelection();
    const parentList = getParentElement(selection.anchorNode, ['UL', 'OL']);

    if (parentList) {
        // Set list type
        document.getElementById('listType').value = parentList.tagName.toLowerCase();
        toggleListOptions();

        // Set list style
        if (parentList.tagName === 'UL') {
            const listStyleType = window.getComputedStyle(parentList).listStyleType;
            document.getElementById('bulletStyle').value = listStyleType || 'disc';
        } else if (parentList.tagName === 'OL') {
            const listStyleType = window.getComputedStyle(parentList).listStyleType;
            document.getElementById('numberStyle').value = listStyleType || 'decimal';

            // Set start number if available
            if (parentList.hasAttribute('start')) {
                document.getElementById('listStartNumber').value = parentList.getAttribute('start');
            }
        }

        // Set indentation and spacing if available
        const marginLeft = parseInt(window.getComputedStyle(parentList).marginLeft);
        if (!isNaN(marginLeft)) {
            document.getElementById('listIndent').value = marginLeft;
        }

        const marginBottom = parseInt(window.getComputedStyle(parentList.querySelector('li')).marginBottom);
        if (!isNaN(marginBottom)) {
            document.getElementById('listItemSpacing').value = marginBottom;
        }
    }
}

// Function to toggle list options based on list type
function toggleListOptions() {
    const listType = document.getElementById('listType').value;
    const bulletOptions = document.getElementById('bulletListOptions');
    const numberedOptions = document.getElementById('numberedListOptions');
    const startNumberLabel = document.getElementById('startNumberLabel');

    if (listType === 'ul') {
        bulletOptions.style.display = 'block';
        numberedOptions.style.display = 'none';
        startNumberLabel.textContent = 'عدد العناصر:';
    } else {
        bulletOptions.style.display = 'none';
        numberedOptions.style.display = 'block';
        startNumberLabel.textContent = 'رقم البداية:';
    }
}

// Function to close advanced list dialog
function closeAdvancedListDialog() {
    document.getElementById('advancedListDialog').style.display = 'none';
}

// Function to apply advanced list formatting
function applyAdvancedList() {
    const listType = document.getElementById('listType').value;
    const listIndent = document.getElementById('listIndent').value;
    const listItemSpacing = document.getElementById('listItemSpacing').value;
    const startNumber = document.getElementById('listStartNumber').value;

    let listStyleType;
    if (listType === 'ul') {
        listStyleType = document.getElementById('bulletStyle').value;
    } else {
        listStyleType = document.getElementById('numberStyle').value;
    }

    // Create a new list element
    const list = document.createElement(listType);
    list.style.marginLeft = listIndent + 'px';
    list.style.listStyleType = listStyleType;

    if (listType === 'ol' && startNumber !== '1') {
        list.setAttribute('start', startNumber);
    }

    // Get selected text or create a default list item
    const selection = window.getSelection();
    let content = '';

    if (selection.toString().trim() !== '') {
        // Split selected text by new lines to create list items
        const lines = selection.toString().split(/\n/);
        for (const line of lines) {
            if (line.trim() !== '') {
                content += `<li>${line.trim()}</li>`;
            }
        }
    } else {
        // Create default list items
        const itemCount = listType === 'ul' ? 3 : parseInt(startNumber) + 2;
        const startIdx = listType === 'ul' ? 1 : parseInt(startNumber);

        for (let i = startIdx; i < itemCount; i++) {
            content += `<li>عنصر القائمة ${i}</li>`;
        }
    }

    list.innerHTML = content;

    // Apply spacing to list items
    const items = list.querySelectorAll('li');
    items.forEach(item => {
        item.style.marginBottom = listItemSpacing + 'px';
    });

    // Insert the list
    document.execCommand('insertHTML', false, list.outerHTML);

    // Close the dialog
    closeAdvancedListDialog();
}

// Function to open header and footer dialog
function openHeaderFooterDialog() {
    const dialog = document.getElementById('headerFooterDialog');
    dialog.style.display = 'flex';

    // Load current header/footer settings if available
    const headerText = localStorage.getItem('headerText') || '';
    const footerText = localStorage.getItem('footerText') || '';
    const headerAlignment = localStorage.getItem('headerAlignment') || 'center';
    const footerAlignment = localStorage.getItem('footerAlignment') || 'center';
    const includePageNumber = localStorage.getItem('includePageNumber') !== 'false';
    const includeDate = localStorage.getItem('includeDate') === 'true';

    document.getElementById('headerText').value = headerText;
    document.getElementById('footerText').value = footerText;
    document.getElementById('headerAlignment').value = headerAlignment;
    document.getElementById('footerAlignment').value = footerAlignment;
    document.getElementById('includePageNumber').checked = includePageNumber;
    document.getElementById('includeDate').checked = includeDate;
}

// Function to close header and footer dialog
function closeHeaderFooterDialog() {
    document.getElementById('headerFooterDialog').style.display = 'none';
}

// Function to apply header and footer settings
function applyHeaderFooter() {
    const headerText = document.getElementById('headerText').value;
    const footerText = document.getElementById('footerText').value;
    const headerAlignment = document.getElementById('headerAlignment').value;
    const footerAlignment = document.getElementById('footerAlignment').value;
    const includePageNumber = document.getElementById('includePageNumber').checked;
    const includeDate = document.getElementById('includeDate').checked;

    // Save settings to localStorage
    localStorage.setItem('headerText', headerText);
    localStorage.setItem('footerText', footerText);
    localStorage.setItem('headerAlignment', headerAlignment);
    localStorage.setItem('footerAlignment', footerAlignment);
    localStorage.setItem('includePageNumber', includePageNumber);
    localStorage.setItem('includeDate', includeDate);

    // Apply header and footer to the document
    updateHeaderFooter();

    // Close the dialog
    closeHeaderFooterDialog();

    // Show notification
    showNotification('تم تطبيق إعدادات الرأس والتذييل');
}

// Function to update header and footer in the document
function updateHeaderFooter() {
    // Remove existing headers and footers
    const existingHeaders = document.querySelectorAll('.page-header');
    const existingFooters = document.querySelectorAll('.page-footer');

    existingHeaders.forEach(header => header.remove());
    existingFooters.forEach(footer => footer.remove());

    // Get settings from localStorage
    const headerText = localStorage.getItem('headerText') || '';
    const footerText = localStorage.getItem('footerText') || '';
    const headerAlignment = localStorage.getItem('headerAlignment') || 'center';
    const footerAlignment = localStorage.getItem('footerAlignment') || 'center';
    const includePageNumber = localStorage.getItem('includePageNumber') !== 'false';
    const includeDate = localStorage.getItem('includeDate') === 'true';

    // If we're in page mode, add headers and footers to each page
    const editorWithPages = document.querySelector('.editor-with-pages');
    if (editorWithPages) {
        const pages = document.querySelectorAll('.editor-page');

        pages.forEach((page, index) => {
            // Create header if text is provided or date is included
            if (headerText || includeDate) {
                const header = document.createElement('div');
                header.className = 'page-header';
                header.style.textAlign = headerAlignment;

                let headerContent = headerText;

                if (includeDate) {
                    const today = new Date();
                    const dateStr = today.toLocaleDateString('ar-SA');

                    if (headerContent) {
                        headerContent += ' | ' + dateStr;
                    } else {
                        headerContent = dateStr;
                    }
                }

                header.textContent = headerContent;
                page.appendChild(header);
            }

            // Create footer if text is provided or page numbers are included
            if (footerText || includePageNumber) {
                const footer = document.createElement('div');
                footer.className = 'page-footer';
                footer.style.textAlign = footerAlignment;

                let footerContent = footerText;

                if (includePageNumber) {
                    const pageNumber = `الصفحة ${index + 1} من ${pages.length}`;

                    if (footerContent) {
                        footerContent += ' | ' + pageNumber;
                    } else {
                        footerContent = pageNumber;
                    }
                }

                footer.textContent = footerContent;
                page.appendChild(footer);
            }
        });
    }
}

// Helper function to get parent element of a specific type
function getParentElement(element, types) {
    if (!element) return null;

    // If element is a text node, get its parent
    if (element.nodeType === 3) {
        element = element.parentNode;
    }

    // Traverse up the DOM tree
    while (element && !types.includes(element.tagName)) {
        element = element.parentNode;
        if (!element || element.tagName === 'BODY') {
            return null;
        }
    }

    return element;
}

// Function to open document styles dialog
function openDocumentStylesDialog() {
    const dialog = document.getElementById('documentStylesDialog');
    dialog.style.display = 'flex';

    // Load current document style settings if available
    const documentTheme = localStorage.getItem('documentTheme') || 'default';
    const colorScheme = localStorage.getItem('colorScheme') || 'default';
    const fontScheme = localStorage.getItem('fontScheme') || 'default';
    const paragraphSpacing = localStorage.getItem('paragraphSpacing') || 'normal';

    document.getElementById('documentTheme').value = documentTheme;
    document.getElementById('colorScheme').value = colorScheme;
    document.getElementById('fontScheme').value = fontScheme;
    document.getElementById('paragraphSpacing').value = paragraphSpacing;

    // Preview the current theme
    previewDocumentTheme();
}

// Function to close document styles dialog
function closeDocumentStylesDialog() {
    document.getElementById('documentStylesDialog').style.display = 'none';
}

// Function to preview document theme
function previewDocumentTheme() {
    const theme = document.getElementById('documentTheme').value;
    const colorScheme = document.getElementById('colorScheme').value;
    const fontScheme = document.getElementById('fontScheme').value;
    const paragraphSpacing = document.getElementById('paragraphSpacing').value;

    const preview = document.getElementById('stylePreview');

    // Reset preview styles
    preview.className = 'style-preview';
    preview.style = '';

    // Apply theme class
    preview.classList.add(`theme-${theme}`);

    // Apply color scheme
    let primaryColor, secondaryColor, accentColor;

    switch (colorScheme) {
        case 'blue':
            primaryColor = '#1a73e8';
            secondaryColor = '#4285f4';
            accentColor = '#8ab4f8';
            break;
        case 'green':
            primaryColor = '#0f9d58';
            secondaryColor = '#34a853';
            accentColor = '#81c995';
            break;
        case 'red':
            primaryColor = '#d93025';
            secondaryColor = '#ea4335';
            accentColor = '#f28b82';
            break;
        case 'purple':
            primaryColor = '#673ab7';
            secondaryColor = '#9c27b0';
            accentColor = '#d0bcff';
            break;
        case 'orange':
            primaryColor = '#f4511e';
            secondaryColor = '#ff7043';
            accentColor = '#ffab91';
            break;
        case 'monochrome':
            primaryColor = '#202124';
            secondaryColor = '#5f6368';
            accentColor = '#dadce0';
            break;
        default:
            primaryColor = '#1a73e8';
            secondaryColor = '#4285f4';
            accentColor = '#8ab4f8';
    }

    // Apply font scheme
    let headingFont, bodyFont;

    switch (fontScheme) {
        case 'traditional':
            headingFont = 'Times New Roman, serif';
            bodyFont = 'Georgia, serif';
            break;
        case 'modern':
            headingFont = 'Helvetica, Arial, sans-serif';
            bodyFont = 'Helvetica, Arial, sans-serif';
            break;
        case 'minimal':
            headingFont = 'Arial, sans-serif';
            bodyFont = 'Arial, sans-serif';
            break;
        case 'decorative':
            headingFont = 'Palatino, serif';
            bodyFont = 'Palatino, serif';
            break;
        case 'arabic':
            headingFont = 'Amiri, serif';
            bodyFont = 'Amiri, serif';
            break;
        default:
            headingFont = 'Arial, sans-serif';
            bodyFont = 'Arial, sans-serif';
    }

    // Apply paragraph spacing
    let lineHeight, paragraphMargin;

    switch (paragraphSpacing) {
        case 'compact':
            lineHeight = '1.2';
            paragraphMargin = '0.5em';
            break;
        case 'normal':
            lineHeight = '1.5';
            paragraphMargin = '1em';
            break;
        case 'relaxed':
            lineHeight = '1.8';
            paragraphMargin = '1.5em';
            break;
        case 'double':
            lineHeight = '2';
            paragraphMargin = '2em';
            break;
        default:
            lineHeight = '1.5';
            paragraphMargin = '1em';
    }

    // Apply styles to preview elements
    const heading = preview.querySelector('.preview-heading');
    const subheading = preview.querySelector('.preview-subheading');
    const paragraph = preview.querySelector('.preview-paragraph');

    // Apply heading styles
    heading.style.color = primaryColor;
    heading.style.fontFamily = headingFont;
    heading.style.borderBottom = `2px solid ${accentColor}`;

    // Apply subheading styles
    subheading.style.color = secondaryColor;
    subheading.style.fontFamily = headingFont;

    // Apply paragraph styles
    paragraph.style.color = '#333';
    paragraph.style.fontFamily = bodyFont;
    paragraph.style.lineHeight = lineHeight;
    paragraph.style.marginBottom = paragraphMargin;

    // Apply theme-specific styles
    switch (theme) {
        case 'modern':
            heading.style.fontWeight = '300';
            heading.style.letterSpacing = '0.05em';
            subheading.style.fontWeight = '300';
            break;
        case 'elegant':
            heading.style.fontStyle = 'italic';
            heading.style.fontWeight = '400';
            break;
        case 'professional':
            heading.style.textTransform = 'uppercase';
            heading.style.letterSpacing = '0.1em';
            heading.style.fontSize = '1.1em';
            break;
        case 'creative':
            heading.style.textShadow = '1px 1px 2px rgba(0,0,0,0.2)';
            preview.style.background = '#f9f9f9';
            preview.style.padding = '15px';
            preview.style.borderRadius = '5px';
            break;
        case 'academic':
            heading.style.fontFamily = 'Times New Roman, serif';
            subheading.style.fontFamily = 'Times New Roman, serif';
            paragraph.style.fontFamily = 'Times New Roman, serif';
            paragraph.style.textIndent = '2em';
            break;
    }
}

// Function to apply document style
function applyDocumentStyle() {
    const theme = document.getElementById('documentTheme').value;
    const colorScheme = document.getElementById('colorScheme').value;
    const fontScheme = document.getElementById('fontScheme').value;
    const paragraphSpacing = document.getElementById('paragraphSpacing').value;

    // Save settings to localStorage
    localStorage.setItem('documentTheme', theme);
    localStorage.setItem('colorScheme', colorScheme);
    localStorage.setItem('fontScheme', fontScheme);
    localStorage.setItem('paragraphSpacing', paragraphSpacing);

    // Apply styles to the document
    const editor = document.getElementById('editor');

    // Remove any existing theme classes
    const themeClasses = Array.from(editor.classList).filter(cls => cls.startsWith('theme-'));
    themeClasses.forEach(cls => editor.classList.remove(cls));

    // Add new theme class
    editor.classList.add(`theme-${theme}`);

    // Apply color scheme
    let primaryColor, secondaryColor, accentColor;

    switch (colorScheme) {
        case 'blue':
            primaryColor = '#1a73e8';
            secondaryColor = '#4285f4';
            accentColor = '#8ab4f8';
            break;
        case 'green':
            primaryColor = '#0f9d58';
            secondaryColor = '#34a853';
            accentColor = '#81c995';
            break;
        case 'red':
            primaryColor = '#d93025';
            secondaryColor = '#ea4335';
            accentColor = '#f28b82';
            break;
        case 'purple':
            primaryColor = '#673ab7';
            secondaryColor = '#9c27b0';
            accentColor = '#d0bcff';
            break;
        case 'orange':
            primaryColor = '#f4511e';
            secondaryColor = '#ff7043';
            accentColor = '#ffab91';
            break;
        case 'monochrome':
            primaryColor = '#202124';
            secondaryColor = '#5f6368';
            accentColor = '#dadce0';
            break;
        default:
            primaryColor = '#1a73e8';
            secondaryColor = '#4285f4';
            accentColor = '#8ab4f8';
    }

    // Apply font scheme
    let headingFont, bodyFont;

    switch (fontScheme) {
        case 'traditional':
            headingFont = 'Times New Roman, serif';
            bodyFont = 'Georgia, serif';
            break;
        case 'modern':
            headingFont = 'Helvetica, Arial, sans-serif';
            bodyFont = 'Helvetica, Arial, sans-serif';
            break;
        case 'minimal':
            headingFont = 'Arial, sans-serif';
            bodyFont = 'Arial, sans-serif';
            break;
        case 'decorative':
            headingFont = 'Palatino, serif';
            bodyFont = 'Palatino, serif';
            break;
        case 'arabic':
            headingFont = 'Amiri, serif';
            bodyFont = 'Amiri, serif';
            break;
        default:
            headingFont = 'Arial, sans-serif';
            bodyFont = 'Arial, sans-serif';
    }

    // Apply paragraph spacing
    let lineHeight, paragraphMargin;

    switch (paragraphSpacing) {
        case 'compact':
            lineHeight = '1.2';
            paragraphMargin = '0.5em';
            break;
        case 'normal':
            lineHeight = '1.5';
            paragraphMargin = '1em';
            break;
        case 'relaxed':
            lineHeight = '1.8';
            paragraphMargin = '1.5em';
            break;
        case 'double':
            lineHeight = '2';
            paragraphMargin = '2em';
            break;
        default:
            lineHeight = '1.5';
            paragraphMargin = '1em';
    }

    // Create a style element for the document
    let styleElement = document.getElementById('document-theme-styles');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'document-theme-styles';
        document.head.appendChild(styleElement);
    }

    // Define CSS rules
    const css = `
        #editor.theme-${theme} {
            line-height: ${lineHeight};
            font-family: ${bodyFont};
        }

        #editor.theme-${theme} h1,
        #editor.theme-${theme} h2,
        #editor.theme-${theme} h3,
        #editor.theme-${theme} h4,
        #editor.theme-${theme} h5,
        #editor.theme-${theme} h6 {
            font-family: ${headingFont};
            color: ${primaryColor};
        }

        #editor.theme-${theme} h1 {
            border-bottom: 2px solid ${accentColor};
        }

        #editor.theme-${theme} h2,
        #editor.theme-${theme} h3 {
            color: ${secondaryColor};
        }

        #editor.theme-${theme} p {
            margin-bottom: ${paragraphMargin};
        }
    `;

    // Add theme-specific styles
    let themeSpecificCSS = '';

    switch (theme) {
        case 'modern':
            themeSpecificCSS = `
                #editor.theme-modern h1,
                #editor.theme-modern h2,
                #editor.theme-modern h3 {
                    font-weight: 300;
                    letter-spacing: 0.05em;
                }
            `;
            break;
        case 'elegant':
            themeSpecificCSS = `
                #editor.theme-elegant h1 {
                    font-style: italic;
                    font-weight: 400;
                }
            `;
            break;
        case 'professional':
            themeSpecificCSS = `
                #editor.theme-professional h1 {
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-size: 1.5em;
                }
            `;
            break;
        case 'creative':
            themeSpecificCSS = `
                #editor.theme-creative {
                    background-color: #f9f9f9;
                    padding: 15px;
                    border-radius: 5px;
                }
                #editor.theme-creative h1 {
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
                }
            `;
            break;
        case 'academic':
            themeSpecificCSS = `
                #editor.theme-academic {
                    font-family: 'Times New Roman', serif;
                }
                #editor.theme-academic p {
                    text-indent: 2em;
                }
            `;
            break;
    }

    // Set the style content
    styleElement.textContent = css + themeSpecificCSS;

    // Close the dialog
    closeDocumentStylesDialog();

    // Show notification
    showNotification('تم تطبيق نمط المستند');
}

// Function to open watermark dialog
function openWatermarkDialog() {
    const dialog = document.getElementById('watermarkDialog');
    dialog.style.display = 'flex';

    // Load current watermark settings if available
    const watermarkType = localStorage.getItem('watermarkType') || 'text';
    const watermarkText = localStorage.getItem('watermarkText') || 'مسودة';
    const watermarkFont = localStorage.getItem('watermarkFont') || 'Arial';
    const watermarkSize = localStorage.getItem('watermarkSize') || '50';
    const watermarkColor = localStorage.getItem('watermarkColor') || '#cccccc';
    const watermarkRotation = localStorage.getItem('watermarkRotation') || '-30';
    const watermarkOpacity = localStorage.getItem('watermarkOpacity') || '30';

    document.getElementById('watermarkType').value = watermarkType;
    document.getElementById('watermarkText').value = watermarkText;
    document.getElementById('watermarkFont').value = watermarkFont;
    document.getElementById('watermarkSize').value = watermarkSize;
    document.getElementById('watermarkColor').value = watermarkColor;
    document.getElementById('watermarkRotation').value = watermarkRotation;
    document.getElementById('watermarkOpacity').value = watermarkOpacity;

    // Update display values
    document.getElementById('watermarkSizeValue').textContent = watermarkSize + 'px';
    document.getElementById('watermarkRotationValue').textContent = watermarkRotation + '°';
    document.getElementById('watermarkOpacityValue').textContent = watermarkOpacity + '%';

    // Show/hide options based on watermark type
    toggleWatermarkOptions();

    // Add event listeners for range inputs
    document.getElementById('watermarkSize').addEventListener('input', function() {
        document.getElementById('watermarkSizeValue').textContent = this.value + 'px';
    });

    document.getElementById('watermarkRotation').addEventListener('input', function() {
        document.getElementById('watermarkRotationValue').textContent = this.value + '°';
    });

    document.getElementById('watermarkOpacity').addEventListener('input', function() {
        document.getElementById('watermarkOpacityValue').textContent = this.value + '%';
    });
}

// Function to toggle watermark options based on type
function toggleWatermarkOptions() {
    const watermarkType = document.getElementById('watermarkType').value;
    const textOptions = document.getElementById('textWatermarkOptions');
    const imageOptions = document.getElementById('imageWatermarkOptions');

    if (watermarkType === 'text') {
        textOptions.style.display = 'block';
        imageOptions.style.display = 'none';
    } else {
        textOptions.style.display = 'none';
        imageOptions.style.display = 'block';
    }
}

// Function to close watermark dialog
function closeWatermarkDialog() {
    document.getElementById('watermarkDialog').style.display = 'none';
}

// Function to apply watermark
function applyWatermark() {
    const watermarkType = document.getElementById('watermarkType').value;
    const watermarkColor = document.getElementById('watermarkColor').value;
    const watermarkRotation = document.getElementById('watermarkRotation').value;

    // Save settings to localStorage
    localStorage.setItem('watermarkType', watermarkType);
    localStorage.setItem('watermarkColor', watermarkColor);
    localStorage.setItem('watermarkRotation', watermarkRotation);

    if (watermarkType === 'text') {
        const watermarkText = document.getElementById('watermarkText').value;
        const watermarkFont = document.getElementById('watermarkFont').value;
        const watermarkSize = document.getElementById('watermarkSize').value;

        localStorage.setItem('watermarkText', watermarkText);
        localStorage.setItem('watermarkFont', watermarkFont);
        localStorage.setItem('watermarkSize', watermarkSize);

        applyTextWatermark(watermarkText, watermarkFont, watermarkSize, watermarkColor, watermarkRotation);
    } else {
        const watermarkImage = document.getElementById('watermarkImage').files[0];
        const watermarkOpacity = document.getElementById('watermarkOpacity').value;

        localStorage.setItem('watermarkOpacity', watermarkOpacity);

        if (watermarkImage) {
            applyImageWatermark(watermarkImage, watermarkOpacity, watermarkRotation);
        } else {
            alert('الرجاء اختيار صورة للعلامة المائية');
            return;
        }
    }

    // Close the dialog
    closeWatermarkDialog();

    // Show notification
    showNotification('تم تطبيق العلامة المائية');
}

// Function to apply text watermark
function applyTextWatermark(text, font, size, color, rotation) {
    // Remove existing watermark
    removeWatermark();

    // Create watermark container
    const watermarkContainer = document.createElement('div');
    watermarkContainer.id = 'watermark-container';
    watermarkContainer.style.position = 'absolute';
    watermarkContainer.style.top = '0';
    watermarkContainer.style.left = '0';
    watermarkContainer.style.width = '100%';
    watermarkContainer.style.height = '100%';
    watermarkContainer.style.pointerEvents = 'none';
    watermarkContainer.style.overflow = 'hidden';
    watermarkContainer.style.zIndex = '1000';

    // Create watermark element
    const watermark = document.createElement('div');
    watermark.id = 'watermark';
    watermark.textContent = text;
    watermark.style.position = 'absolute';
    watermark.style.top = '50%';
    watermark.style.left = '50%';
    watermark.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    watermark.style.fontSize = `${size}px`;
    watermark.style.fontFamily = font;
    watermark.style.color = color;
    watermark.style.opacity = '0.3';
    watermark.style.whiteSpace = 'nowrap';
    watermark.style.pointerEvents = 'none';

    // Add watermark to container
    watermarkContainer.appendChild(watermark);

    // Add container to editor
    const editorPages = document.querySelectorAll('.editor-page');
    if (editorPages.length > 0) {
        // If using page layout, add watermark to each page
        editorPages.forEach(page => {
            const pageWatermark = watermarkContainer.cloneNode(true);
            page.appendChild(pageWatermark);
        });
    } else {
        // Otherwise add to editor
        document.getElementById('editor').appendChild(watermarkContainer);
    }
}

// Function to apply image watermark
function applyImageWatermark(imageFile, opacity, rotation) {
    // Remove existing watermark
    removeWatermark();

    const reader = new FileReader();

    reader.onload = function(e) {
        // Create watermark container
        const watermarkContainer = document.createElement('div');
        watermarkContainer.id = 'watermark-container';
        watermarkContainer.style.position = 'absolute';
        watermarkContainer.style.top = '0';
        watermarkContainer.style.left = '0';
        watermarkContainer.style.width = '100%';
        watermarkContainer.style.height = '100%';
        watermarkContainer.style.pointerEvents = 'none';
        watermarkContainer.style.overflow = 'hidden';
        watermarkContainer.style.zIndex = '1000';

        // Create watermark element
        const watermark = document.createElement('img');
        watermark.id = 'watermark';
        watermark.src = e.target.result;
        watermark.style.position = 'absolute';
        watermark.style.top = '50%';
        watermark.style.left = '50%';
        watermark.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        watermark.style.maxWidth = '50%';
        watermark.style.maxHeight = '50%';
        watermark.style.opacity = opacity / 100;
        watermark.style.pointerEvents = 'none';

        // Add watermark to container
        watermarkContainer.appendChild(watermark);

        // Add container to editor
        const editorPages = document.querySelectorAll('.editor-page');
        if (editorPages.length > 0) {
            // If using page layout, add watermark to each page
            editorPages.forEach(page => {
                const pageWatermark = watermarkContainer.cloneNode(true);
                page.appendChild(pageWatermark);
            });
        } else {
            // Otherwise add to editor
            document.getElementById('editor').appendChild(watermarkContainer);
        }
    };

    reader.readAsDataURL(imageFile);
}

// Function to remove watermark
function removeWatermark() {
    // Remove all watermark containers
    const watermarkContainers = document.querySelectorAll('#watermark-container');
    watermarkContainers.forEach(container => container.remove());

    // Show notification
    showNotification('تمت إزالة العلامة المائية');

    // Close the dialog
    closeWatermarkDialog();
}

// Enhanced undo/redo functionality
let undoStack = [];
let redoStack = [];
let isUndoRedo = false;
const MAX_STACK_SIZE = 50;

// Function to save current state to undo stack
function saveUndoState() {
    if (isUndoRedo) return;

    const content = document.getElementById('editor').innerHTML;
    undoStack.push(content);

    // Limit stack size
    if (undoStack.length > MAX_STACK_SIZE) {
        undoStack.shift();
    }

    // Clear redo stack when new changes are made
    redoStack = [];

    // Update button states
    updateUndoRedoButtons();
}

// Function to handle undo
function undo() {
    if (undoStack.length === 0) return;

    // Save current state to redo stack
    const currentContent = document.getElementById('editor').innerHTML;
    redoStack.push(currentContent);

    // Get previous state
    const previousContent = undoStack.pop();

    // Apply previous state
    isUndoRedo = true;
    document.getElementById('editor').innerHTML = previousContent;
    isUndoRedo = false;

    // Update button states
    updateUndoRedoButtons();

    // Update word count
    updateWordCount();
}

// Function to handle redo
function redo() {
    if (redoStack.length === 0) return;

    // Save current state to undo stack
    const currentContent = document.getElementById('editor').innerHTML;
    undoStack.push(currentContent);

    // Get next state
    const nextContent = redoStack.pop();

    // Apply next state
    isUndoRedo = true;
    document.getElementById('editor').innerHTML = nextContent;
    isUndoRedo = false;

    // Update button states
    updateUndoRedoButtons();

    // Update word count
    updateWordCount();
}

// Function to update undo/redo button states
function updateUndoRedoButtons() {
    const undoBtn = document.querySelector('button[onclick="undo()"]');
    const redoBtn = document.querySelector('button[onclick="redo()"]');

    if (undoBtn) {
        undoBtn.disabled = undoStack.length === 0;
        undoBtn.style.opacity = undoStack.length === 0 ? '0.5' : '1';
    }

    if (redoBtn) {
        redoBtn.disabled = redoStack.length === 0;
        redoBtn.style.opacity = redoStack.length === 0 ? '0.5' : '1';
    }
}

// Functions for find and replace
function openFindReplace() {
    document.getElementById('findReplaceDialog').style.display = 'flex';
    document.getElementById('findText').focus();
}

function closeFindReplace() {
    document.getElementById('findReplaceDialog').style.display = 'none';
}

function findText() {
    const searchText = document.getElementById('findText').value;
    if (searchText === '') return;

    window.find(searchText);
}

function replaceText() {
    const searchText = document.getElementById('findText').value;
    const replaceText = document.getElementById('replaceText').value;

    if (searchText === '') return;

    if (window.getSelection().toString() === searchText) {
        document.execCommand('insertText', false, replaceText);
        findText(); // Find next occurrence
    } else {
        findText();
    }
}

function replaceAllText() {
    const searchText = document.getElementById('findText').value;
    const replaceText = document.getElementById('replaceText').value;
    const editorContent = document.getElementById('editor').innerHTML;

    if (searchText === '') return;

    // Use regex to replace all occurrences
    const regex = new RegExp(escapeRegExp(searchText), 'g');
    const newContent = editorContent.replace(regex, replaceText);

    document.getElementById('editor').innerHTML = newContent;
    updateWordCount();
}

// Helper function to escape special characters in regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Functions for table insertion and editing
function insertTable() {
    document.getElementById('tableDialog').style.display = 'flex';
    document.getElementById('tableRows').focus();
}

function closeTableDialog() {
    document.getElementById('tableDialog').style.display = 'none';
}

function createTable() {
    const rows = parseInt(document.getElementById('tableRows').value);
    const cols = parseInt(document.getElementById('tableCols').value);
    const hasHeader = document.getElementById('tableHeader').checked;
    const tableStyle = document.getElementById('tableStyle').value;

    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) {
        alert('الرجاء إدخال أرقام صحيحة للصفوف والأعمدة');
        return;
    }

    // Define table styles
    let tableStyles = {
        'default': {
            table: 'width:100%; border-collapse: collapse; margin: 15px 0;',
            th: 'border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold; text-align: center;',
            td: 'border: 1px solid #ddd; padding: 8px; min-width: 50px;'
        },
        'striped': {
            table: 'width:100%; border-collapse: collapse; margin: 15px 0;',
            th: 'border: 1px solid #ddd; padding: 8px; background-color: #4CAF50; color: white; font-weight: bold; text-align: center;',
            td: 'border: 1px solid #ddd; padding: 8px; min-width: 50px;',
            evenRow: 'background-color: #f2f2f2;'
        },
        'borderless': {
            table: 'width:100%; border-collapse: collapse; margin: 15px 0;',
            th: 'border-bottom: 2px solid #ddd; padding: 8px; font-weight: bold; text-align: center;',
            td: 'border-bottom: 1px solid #ddd; padding: 8px; min-width: 50px;'
        },
        'dark': {
            table: 'width:100%; border-collapse: collapse; margin: 15px 0; background-color: #333; color: white;',
            th: 'border: 1px solid #444; padding: 8px; background-color: #222; font-weight: bold; text-align: center;',
            td: 'border: 1px solid #444; padding: 8px; min-width: 50px;'
        }
    };

    const style = tableStyles[tableStyle] || tableStyles['default'];

    let tableHTML = `<table style="${style.table}" class="editable-table">`;

    // Create header row if requested
    if (hasHeader) {
        tableHTML += '<thead><tr>';
        for (let j = 0; j < cols; j++) {
            tableHTML += `<th style="${style.th}" contenteditable="true">عنوان ${j+1}</th>`;
        }
        tableHTML += '</tr></thead>';
    }

    tableHTML += '<tbody>';
    for (let i = 0; i < rows; i++) {
        const rowStyle = tableStyle === 'striped' && i % 2 === 1 ? ` style="${style.evenRow}"` : '';
        tableHTML += `<tr${rowStyle}>`;
        for (let j = 0; j < cols; j++) {
            tableHTML += `<td style="${style.td}" contenteditable="true">محتوى</td>`;
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table>';

    document.execCommand('insertHTML', false, tableHTML);

    // Add table editing functionality after insertion
    setupTableEditingTools();

    closeTableDialog();
}

// Function to set up table editing tools
function setupTableEditingTools() {
    // Add click event listener to all tables in the editor
    const editor = document.getElementById('editor');
    const tables = editor.querySelectorAll('table.editable-table');

    tables.forEach(table => {
        if (!table.hasAttribute('data-table-initialized')) {
            table.setAttribute('data-table-initialized', 'true');

            // Add context menu for table cells
            const cells = table.querySelectorAll('th, td');
            cells.forEach(cell => {
                cell.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    showTableCellContextMenu(e, cell);
                });
            });

            // Add hover effect for table
            table.addEventListener('mouseover', function() {
                if (!document.getElementById('tableToolbar')) {
                    createTableToolbar(table);
                }
            });
        }
    });
}

// Function to create table toolbar
function createTableToolbar(table) {
    // Remove any existing toolbar
    const existingToolbar = document.getElementById('tableToolbar');
    if (existingToolbar) {
        existingToolbar.remove();
    }

    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.id = 'tableToolbar';
    toolbar.className = 'table-toolbar';

    // Add buttons
    const addRowBtn = document.createElement('button');
    addRowBtn.innerHTML = '<i class="fa-solid fa-plus"></i> صف';
    addRowBtn.title = 'إضافة صف';
    addRowBtn.onclick = function() { addTableRow(table); };

    const addColBtn = document.createElement('button');
    addColBtn.innerHTML = '<i class="fa-solid fa-plus"></i> عمود';
    addColBtn.title = 'إضافة عمود';
    addColBtn.onclick = function() { addTableColumn(table); };

    const deleteRowBtn = document.createElement('button');
    deleteRowBtn.innerHTML = '<i class="fa-solid fa-minus"></i> صف';
    deleteRowBtn.title = 'حذف صف';
    deleteRowBtn.onclick = function() { deleteTableRow(table); };

    const deleteColBtn = document.createElement('button');
    deleteColBtn.innerHTML = '<i class="fa-solid fa-minus"></i> عمود';
    deleteColBtn.title = 'حذف عمود';
    deleteColBtn.onclick = function() { deleteTableColumn(table); };

    const deleteTableBtn = document.createElement('button');
    deleteTableBtn.innerHTML = '<i class="fa-solid fa-trash"></i> جدول';
    deleteTableBtn.title = 'حذف الجدول';
    deleteTableBtn.onclick = function() {
        if (confirm('هل أنت متأكد من حذف الجدول؟')) {
            table.remove();
            toolbar.remove();
        }
    };

    // Add buttons to toolbar
    toolbar.appendChild(addRowBtn);
    toolbar.appendChild(addColBtn);
    toolbar.appendChild(deleteRowBtn);
    toolbar.appendChild(deleteColBtn);
    toolbar.appendChild(deleteTableBtn);

    // Position toolbar near the table
    const tableRect = table.getBoundingClientRect();
    const editorRect = document.getElementById('editor').getBoundingClientRect();

    toolbar.style.position = 'absolute';
    toolbar.style.top = (tableRect.top - editorRect.top - 40) + 'px';
    toolbar.style.left = (tableRect.left - editorRect.left) + 'px';

    // Add toolbar to editor
    document.getElementById('editor').appendChild(toolbar);

    // Remove toolbar when mouse leaves table area
    const tableArea = document.createElement('div');
    tableArea.style.position = 'absolute';
    tableArea.style.top = (tableRect.top - editorRect.top - 50) + 'px';
    tableArea.style.left = (tableRect.left - editorRect.left - 10) + 'px';
    tableArea.style.width = (tableRect.width + 20) + 'px';
    tableArea.style.height = (tableRect.height + 60) + 'px';

    tableArea.addEventListener('mouseleave', function() {
        toolbar.remove();
        tableArea.remove();
    });

    document.getElementById('editor').appendChild(tableArea);
}

// Function to show context menu for table cell
function showTableCellContextMenu(event, cell) {
    // Remove any existing context menu
    const existingMenu = document.getElementById('cellContextMenu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Create context menu
    const menu = document.createElement('div');
    menu.id = 'cellContextMenu';
    menu.className = 'context-menu';

    // Add menu items
    const menuItems = [
        { text: 'تغيير لون الخلفية', icon: 'fa-fill-drip', action: function() { changeCellBackgroundColor(cell); } },
        { text: 'تغيير لون النص', icon: 'fa-font', action: function() { changeCellTextColor(cell); } },
        { text: 'محاذاة للوسط', icon: 'fa-align-center', action: function() { cell.style.textAlign = 'center'; } },
        { text: 'محاذاة لليمين', icon: 'fa-align-right', action: function() { cell.style.textAlign = 'right'; } },
        { text: 'محاذاة لليسار', icon: 'fa-align-left', action: function() { cell.style.textAlign = 'left'; } }
    ];

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.innerHTML = `<i class="fa-solid ${item.icon}"></i> ${item.text}`;
        menuItem.onclick = function() {
            item.action();
            menu.remove();
        };
        menu.appendChild(menuItem);
    });

    // Position menu at cursor
    menu.style.position = 'absolute';
    menu.style.top = (event.clientY - document.getElementById('editor').getBoundingClientRect().top) + 'px';
    menu.style.left = (event.clientX - document.getElementById('editor').getBoundingClientRect().left) + 'px';

    // Add menu to editor
    document.getElementById('editor').appendChild(menu);

    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Function to change cell background color
function changeCellBackgroundColor(cell) {
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.style.position = 'absolute';
    colorPicker.style.left = '-9999px';
    document.body.appendChild(colorPicker);

    colorPicker.addEventListener('change', function() {
        cell.style.backgroundColor = this.value;
        this.remove();
    });

    colorPicker.click();
}

// Function to change cell text color
function changeCellTextColor(cell) {
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.style.position = 'absolute';
    colorPicker.style.left = '-9999px';
    document.body.appendChild(colorPicker);

    colorPicker.addEventListener('change', function() {
        cell.style.color = this.value;
        this.remove();
    });

    colorPicker.click();
}

// Function to add a row to the table
function addTableRow(table) {
    const numCols = table.rows[0].cells.length;
    const newRow = table.insertRow(-1);

    for (let i = 0; i < numCols; i++) {
        const cell = newRow.insertCell(i);
        cell.contentEditable = true;
        cell.style.cssText = table.rows[table.rows.length - 2].cells[i].style.cssText;
        cell.innerHTML = 'محتوى';

        // Add context menu for new cell
        cell.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            showTableCellContextMenu(e, cell);
        });
    }
}

// Function to add a column to the table
function addTableColumn(table) {
    const rows = table.rows;

    for (let i = 0; i < rows.length; i++) {
        const cell = rows[i].insertCell(-1);
        cell.contentEditable = true;

        if (rows[i].cells.length > 1) {
            cell.style.cssText = rows[i].cells[rows[i].cells.length - 2].style.cssText;
        } else {
            cell.style.border = '1px solid #ddd';
            cell.style.padding = '8px';
            cell.style.minWidth = '50px';
        }

        cell.innerHTML = i === 0 && rows[0].parentNode.tagName === 'THEAD' ? 'عنوان' : 'محتوى';

        // Add context menu for new cell
        cell.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            showTableCellContextMenu(e, cell);
        });
    }
}

// Function to delete a row from the table
function deleteTableRow(table) {
    if (table.rows.length <= 1) {
        alert('لا يمكن حذف الصف الوحيد في الجدول');
        return;
    }

    const rowIndex = prompt('أدخل رقم الصف المراد حذفه (1-' + table.rows.length + '):', '1');
    if (rowIndex === null) return;

    const index = parseInt(rowIndex) - 1;
    if (isNaN(index) || index < 0 || index >= table.rows.length) {
        alert('رقم صف غير صحيح');
        return;
    }

    table.deleteRow(index);
}

// Function to delete a column from the table
function deleteTableColumn(table) {
    if (table.rows[0].cells.length <= 1) {
        alert('لا يمكن حذف العمود الوحيد في الجدول');
        return;
    }

    const colIndex = prompt('أدخل رقم العمود المراد حذفه (1-' + table.rows[0].cells.length + '):', '1');
    if (colIndex === null) return;

    const index = parseInt(colIndex) - 1;
    if (isNaN(index) || index < 0 || index >= table.rows[0].cells.length) {
        alert('رقم عمود غير صحيح');
        return;
    }

    for (let i = 0; i < table.rows.length; i++) {
        table.rows[i].deleteCell(index);
    }
}

// Functions for local storage
let autoSaveInterval;
let lastSavedContent = '';
let documentTitle = 'مستند بدون عنوان';
let documentsList = [];

// Function to save content to local storage
function saveToLocalStorage(silent = false) {
    const content = document.getElementById('editor').innerHTML;
    const timestamp = new Date().toISOString();

    // Only save if content has changed
    if (content !== lastSavedContent) {
        // Create document object
        const document = {
            id: localStorage.getItem('currentDocumentId') || generateDocumentId(),
            title: documentTitle,
            content: content,
            lastModified: timestamp
        };

        // Save current document
        localStorage.setItem('currentDocumentId', document.id);
        localStorage.setItem(`document_${document.id}`, JSON.stringify(document));
        lastSavedContent = content;

        // Update documents list
        updateDocumentsList(document);

        // Show notification if not silent
        if (!silent) {
            showNotification('تم حفظ المحتوى بنجاح!');
        }

        // Update last saved indicator
        updateLastSavedIndicator();
    }
}

// Function to generate a unique document ID
function generateDocumentId() {
    return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Function to update the documents list
function updateDocumentsList(document) {
    // Get existing list
    let documentsList = JSON.parse(localStorage.getItem('documentsList') || '[]');

    // Check if document already exists in the list
    const existingIndex = documentsList.findIndex(doc => doc.id === document.id);

    if (existingIndex >= 0) {
        // Update existing document
        documentsList[existingIndex] = {
            id: document.id,
            title: document.title,
            lastModified: document.lastModified
        };
    } else {
        // Add new document
        documentsList.push({
            id: document.id,
            title: document.title,
            lastModified: document.lastModified
        });
    }

    // Sort by last modified date (newest first)
    documentsList.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    // Save updated list
    localStorage.setItem('documentsList', JSON.stringify(documentsList));
}

// Function to load content from local storage
function loadFromLocalStorage(documentId = null) {
    let content, docTitle;

    if (documentId) {
        // Load specific document
        const documentJson = localStorage.getItem(`document_${documentId}`);
        if (documentJson) {
            const document = JSON.parse(documentJson);
            content = document.content;
            docTitle = document.title;
            localStorage.setItem('currentDocumentId', documentId);
        }
    } else {
        // Load current document
        const currentDocumentId = localStorage.getItem('currentDocumentId');
        if (currentDocumentId) {
            const documentJson = localStorage.getItem(`document_${currentDocumentId}`);
            if (documentJson) {
                const document = JSON.parse(documentJson);
                content = document.content;
                docTitle = document.title;
            }
        }
    }

    if (content) {
        document.getElementById('editor').innerHTML = content;
        documentTitle = docTitle;
        updateDocumentTitle();
        updateWordCount();
        lastSavedContent = content;

        // Reset undo/redo stacks
        undoStack = [];
        redoStack = [];
        saveUndoState();
        updateUndoRedoButtons();

        return true;
    } else {
        if (!documentId) {
            alert('لا يوجد محتوى محفوظ!');
        }
        return false;
    }
}

// Function to check for saved content on startup
function checkSavedContent() {
    const currentDocumentId = localStorage.getItem('currentDocumentId');
    if (currentDocumentId) {
        const documentJson = localStorage.getItem(`document_${currentDocumentId}`);
        if (documentJson) {
            if (confirm('تم العثور على محتوى محفوظ. هل تريد استعادته؟')) {
                loadFromLocalStorage();
            } else {
                // Create new document
                createNewDocument();
            }
        }
    }
}

// Function to create a new document
function createNewDocument() {
    // Confirm if there are unsaved changes
    if (document.getElementById('editor').innerHTML !== lastSavedContent) {
        if (!confirm('هناك تغييرات غير محفوظة. هل أنت متأكد من إنشاء مستند جديد؟')) {
            return;
        }
    }

    // Clear editor
    document.getElementById('editor').innerHTML = '<p>أهلاً بك في محرر النصوص! يمكنك البدء بالكتابة هنا...</p>';

    // Generate new document ID
    const newDocId = generateDocumentId();
    localStorage.setItem('currentDocumentId', newDocId);

    // Set default title
    documentTitle = 'مستند بدون عنوان';
    updateDocumentTitle();

    // Reset undo/redo stacks
    undoStack = [];
    redoStack = [];
    saveUndoState();
    updateUndoRedoButtons();

    // Save the new document
    saveToLocalStorage();
}

// Function to update document title
function updateDocumentTitle() {
    document.title = documentTitle + ' - محرر النصوص';

    // Update title in UI if we have a title element
    const titleElement = document.getElementById('documentTitle');
    if (titleElement) {
        titleElement.textContent = documentTitle;
    }
}

// Function to rename document
function renameDocument() {
    const newTitle = prompt('أدخل عنوان المستند الجديد:', documentTitle);
    if (newTitle !== null && newTitle.trim() !== '') {
        documentTitle = newTitle.trim();
        updateDocumentTitle();
        saveToLocalStorage();
    }
}

// Function to show notification
function showNotification(message, duration = 2000) {
    // Remove existing notification
    const existingNotification = document.getElementById('notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Hide after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

// Function to update last saved indicator
function updateLastSavedIndicator() {
    const lastSavedElement = document.getElementById('lastSaved');
    if (lastSavedElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lastSavedElement.textContent = `آخر حفظ: ${timeString}`;
    }
}

// Function to start auto-save
function startAutoSave(interval = 30000) { // Default: 30 seconds
    // Clear any existing interval
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }

    // Set new interval
    autoSaveInterval = setInterval(() => {
        saveToLocalStorage(true); // Silent save
    }, interval);

    // Save auto-save preference
    localStorage.setItem('autoSaveEnabled', 'true');
    localStorage.setItem('autoSaveInterval', interval.toString());

    // Update UI
    const autoSaveBtn = document.getElementById('autoSaveBtn');
    if (autoSaveBtn) {
        autoSaveBtn.classList.add('active');
        document.getElementById('autoSaveText').textContent = 'إيقاف الحفظ التلقائي';
    }
}

// Function to stop auto-save
function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }

    // Save preference
    localStorage.setItem('autoSaveEnabled', 'false');

    // Update UI
    const autoSaveBtn = document.getElementById('autoSaveBtn');
    if (autoSaveBtn) {
        autoSaveBtn.classList.remove('active');
        document.getElementById('autoSaveText').textContent = 'تفعيل الحفظ التلقائي';
    }
}

// Function to toggle auto-save
function toggleAutoSave() {
    if (autoSaveInterval) {
        stopAutoSave();
        showNotification('تم إيقاف الحفظ التلقائي');
    } else {
        startAutoSave();
        showNotification('تم تفعيل الحفظ التلقائي (كل 30 ثانية)');
    }
}

// Function to open documents dialog
function openDocumentsDialog() {
    // Get documents list
    const documentsList = JSON.parse(localStorage.getItem('documentsList') || '[]');

    // Get dialog element
    const dialog = document.getElementById('documentsDialog');
    const listContainer = document.getElementById('documentsList');

    // Clear previous content
    listContainer.innerHTML = '';

    if (documentsList.length === 0) {
        // Show no documents message
        listContainer.innerHTML = '<div class="no-documents">لا توجد مستندات محفوظة</div>';
    } else {
        // Add documents to list
        documentsList.forEach(doc => {
            const docItem = document.createElement('div');
            docItem.className = 'document-item';

            // Format date
            const date = new Date(doc.lastModified);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Create document info
            const docInfo = document.createElement('div');
            docInfo.className = 'document-info';
            docInfo.innerHTML = `
                <div class="document-title">${doc.title}</div>
                <div class="document-date">${formattedDate}</div>
            `;

            // Create document actions
            const docActions = document.createElement('div');
            docActions.className = 'document-actions';

            // Open button
            const openBtn = document.createElement('button');
            openBtn.className = 'document-action-btn';
            openBtn.innerHTML = '<i class="fa-solid fa-folder-open"></i>';
            openBtn.title = 'فتح';
            openBtn.onclick = function(e) {
                e.stopPropagation();
                loadFromLocalStorage(doc.id);
                closeDocumentsDialog();
            };

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'document-action-btn delete';
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            deleteBtn.title = 'حذف';
            deleteBtn.onclick = function(e) {
                e.stopPropagation();
                if (confirm(`هل أنت متأكد من حذف المستند "${doc.title}"؟`)) {
                    deleteDocument(doc.id);
                    openDocumentsDialog(); // Refresh dialog
                }
            };

            // Add buttons to actions
            docActions.appendChild(openBtn);
            docActions.appendChild(deleteBtn);

            // Add info and actions to item
            docItem.appendChild(docInfo);
            docItem.appendChild(docActions);

            // Add click event to open document
            docItem.addEventListener('click', function() {
                loadFromLocalStorage(doc.id);
                closeDocumentsDialog();
            });

            // Add item to list
            listContainer.appendChild(docItem);
        });
    }

    // Show dialog
    dialog.style.display = 'flex';
}

// Function to close documents dialog
function closeDocumentsDialog() {
    document.getElementById('documentsDialog').style.display = 'none';
}

// Function to delete a document
function deleteDocument(documentId) {
    // Remove document from storage
    localStorage.removeItem(`document_${documentId}`);

    // Update documents list
    let documentsList = JSON.parse(localStorage.getItem('documentsList') || '[]');
    documentsList = documentsList.filter(doc => doc.id !== documentId);
    localStorage.setItem('documentsList', JSON.stringify(documentsList));

    // If current document is deleted, create a new one
    if (localStorage.getItem('currentDocumentId') === documentId) {
        createNewDocument();
    }

    showNotification('تم حذف المستند');
}

// Function to open export dialog
function exportDocument() {
    document.getElementById('exportDialog').style.display = 'flex';
}

// Function to close export dialog
function closeExportDialog() {
    document.getElementById('exportDialog').style.display = 'none';
}

// Function to perform export
function performExport() {
    const format = document.getElementById('exportFormat').value;
    const content = document.getElementById('editor').innerHTML;
    const plainText = document.getElementById('editor').innerText;

    switch (format) {
        case 'txt':
            // Export as TXT
            saveAsTxt();
            break;
        case 'pdf':
            // Export as PDF
            saveAsPdf();
            break;
        case 'html':
            // Export as HTML
            const htmlBlob = new Blob([
                '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>' +
                documentTitle +
                '</title>\n</head>\n<body>\n' +
                content +
                '\n</body>\n</html>'
            ], { type: 'text/html;charset=utf-8' });

            const htmlUrl = URL.createObjectURL(htmlBlob);
            const htmlLink = document.createElement('a');
            htmlLink.href = htmlUrl;
            htmlLink.download = documentTitle + '.html';
            htmlLink.click();
            URL.revokeObjectURL(htmlUrl);
            break;
        case 'docx':
            // Alert that this feature requires additional libraries
            alert('تصدير DOCX يتطلب مكتبات إضافية. سيتم تنفيذ هذه الميزة في الإصدارات القادمة.');
            break;
    }

    closeExportDialog();
}

// Function to import document
function importDocument() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.html,.htm';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Add change event
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            const reader = new FileReader();

            reader.onload = function(e) {
                let content = e.target.result;

                // Handle different file types
                if (file.name.endsWith('.txt')) {
                    // Plain text - wrap in paragraph
                    content = '<p>' + content.replace(/\n/g, '</p><p>') + '</p>';
                    content = content.replace(/<p><\/p>/g, '<p><br></p>');
                } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
                    // Extract body content from HTML
                    const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(content);
                    if (bodyMatch && bodyMatch[1]) {
                        content = bodyMatch[1];
                    }
                }

                // Set content to editor
                document.getElementById('editor').innerHTML = content;

                // Set document title from file name
                documentTitle = file.name.replace(/\.[^/.]+$/, "");
                updateDocumentTitle();

                // Save the imported document
                saveToLocalStorage();

                // Update word count
                updateWordCount();

                // Reset undo/redo stacks
                undoStack = [];
                redoStack = [];
                saveUndoState();
                updateUndoRedoButtons();

                showNotification('تم استيراد المستند');
            };

            if (file.name.endsWith('.txt')) {
                reader.readAsText(file);
            } else {
                reader.readAsText(file);
            }
        }

        // Remove the input
        document.body.removeChild(fileInput);
    });

    // Trigger click
    fileInput.click();
}

// Function to toggle spell check
function toggleSpellCheck() {
    const editor = document.getElementById('editor');
    const spellCheckText = document.getElementById('spellCheckText');
    const spellCheckBtn = document.getElementById('spellCheckBtn');

    // Toggle spellcheck attribute
    if (editor.getAttribute('spellcheck') === 'true') {
        editor.setAttribute('spellcheck', 'false');
        spellCheckText.textContent = 'تفعيل التدقيق الإملائي';
        spellCheckBtn.classList.add('disabled');
    } else {
        editor.setAttribute('spellcheck', 'true');
        spellCheckText.textContent = 'إيقاف التدقيق الإملائي';
        spellCheckBtn.classList.remove('disabled');
    }

    // Force refresh of the editor to apply spellcheck changes
    const content = editor.innerHTML;
    editor.innerHTML = '';
    setTimeout(() => {
        editor.innerHTML = content;

        // Save spell check preference
        localStorage.setItem('spellCheckEnabled', editor.getAttribute('spellcheck'));
    }, 10);
}

// Page setup and paragraph formatting variables
let pageSettings = {
    size: 'a4',
    orientation: 'portrait',
    margins: {
        top: 25,
        right: 25,
        bottom: 25,
        left: 25
    },
    showPageNumbers: true,
    pageNumberPosition: 'bottom-center'
};

// Function to open page setup dialog
function openPageSetupDialog() {
    // Set current values in dialog
    document.getElementById('pageSize').value = pageSettings.size;

    // Set orientation radio buttons
    const orientationRadios = document.getElementsByName('pageOrientation');
    for (let radio of orientationRadios) {
        if (radio.value === pageSettings.orientation) {
            radio.checked = true;
        }
    }

    // Set margins
    document.getElementById('marginTop').value = pageSettings.margins.top;
    document.getElementById('marginRight').value = pageSettings.margins.right;
    document.getElementById('marginBottom').value = pageSettings.margins.bottom;
    document.getElementById('marginLeft').value = pageSettings.margins.left;

    // Set page numbers
    document.getElementById('showPageNumbers').checked = pageSettings.showPageNumbers;
    document.getElementById('pageNumberPosition').value = pageSettings.pageNumberPosition;

    // Show/hide page number position based on checkbox
    document.getElementById('pageNumberPositionGroup').style.display =
        pageSettings.showPageNumbers ? 'block' : 'none';

    // Add event listener for page numbers checkbox
    document.getElementById('showPageNumbers').addEventListener('change', function() {
        document.getElementById('pageNumberPositionGroup').style.display =
            this.checked ? 'block' : 'none';
    });

    // Show dialog
    document.getElementById('pageSetupDialog').style.display = 'flex';
}

// Function to close page setup dialog
function closePageSetupDialog() {
    document.getElementById('pageSetupDialog').style.display = 'none';
}

// Function to apply page setup
function applyPageSetup() {
    // Get values from dialog
    pageSettings.size = document.getElementById('pageSize').value;

    // Get orientation
    const orientationRadios = document.getElementsByName('pageOrientation');
    for (let radio of orientationRadios) {
        if (radio.checked) {
            pageSettings.orientation = radio.value;
            break;
        }
    }

    // Get margins
    pageSettings.margins.top = parseInt(document.getElementById('marginTop').value);
    pageSettings.margins.right = parseInt(document.getElementById('marginRight').value);
    pageSettings.margins.bottom = parseInt(document.getElementById('marginBottom').value);
    pageSettings.margins.left = parseInt(document.getElementById('marginLeft').value);

    // Get page numbers
    pageSettings.showPageNumbers = document.getElementById('showPageNumbers').checked;
    pageSettings.pageNumberPosition = document.getElementById('pageNumberPosition').value;

    // Apply settings to editor
    applyPageSettingsToEditor();

    // Save settings
    savePageSettings();

    // Close dialog
    closePageSetupDialog();

    // Show notification
    showNotification('تم تطبيق إعدادات الصفحة');
}

// Function to apply page settings to editor
function applyPageSettingsToEditor() {
    const editor = document.getElementById('editor');

    // Check if we're already in page mode
    const isPageMode = editor.parentElement.classList.contains('editor-with-pages');

    if (!isPageMode) {
        // Switch to page mode
        switchToPageMode();
    } else {
        // Update existing page mode
        updatePageMode();
    }
}

// Function to switch to page mode
function switchToPageMode() {
    const editor = document.getElementById('editor');
    const content = editor.innerHTML;

    // Create container for pages
    const container = document.createElement('div');
    container.className = 'editor-with-pages';

    // Create first page
    const page = createEditorPage(1);

    // Add page to container
    container.appendChild(page);

    // Replace editor with container
    editor.parentElement.insertBefore(container, editor);
    container.appendChild(editor);

    // Set content to page
    const pageContent = page.querySelector('.page-content-editable');
    pageContent.innerHTML = content;

    // Make page content editable
    pageContent.contentEditable = true;
    editor.contentEditable = false;

    // Hide original editor
    editor.style.display = 'none';

    // Add event listener for content changes
    pageContent.addEventListener('input', function() {
        // Update original editor content
        editor.innerHTML = this.innerHTML;

        // Update word count
        updateWordCount();

        // Save undo state
        saveUndoState();
    });
}

// Function to update page mode
function updatePageMode() {
    const pages = document.querySelectorAll('.editor-page');

    pages.forEach(page => {
        // Update page size and orientation
        if (pageSettings.orientation === 'portrait') {
            page.style.width = getSizeInMm(pageSettings.size).width + 'mm';
            page.style.minHeight = getSizeInMm(pageSettings.size).height + 'mm';
            page.classList.remove('landscape');
        } else {
            page.style.width = getSizeInMm(pageSettings.size).height + 'mm';
            page.style.minHeight = getSizeInMm(pageSettings.size).width + 'mm';
            page.classList.add('landscape');
        }

        // Update page content margins
        const pageContent = page.querySelector('.page-content-editable');
        pageContent.style.top = pageSettings.margins.top + 'mm';
        pageContent.style.right = pageSettings.margins.right + 'mm';
        pageContent.style.bottom = pageSettings.margins.bottom + 'mm';
        pageContent.style.left = pageSettings.margins.left + 'mm';
        pageContent.style.width = `calc(100% - ${pageSettings.margins.right + pageSettings.margins.left}mm)`;
        pageContent.style.height = `calc(100% - ${pageSettings.margins.top + pageSettings.margins.bottom}mm)`;

        // Update page numbers
        const pageNumber = page.querySelector('.page-number-display');
        if (pageSettings.showPageNumbers) {
            pageNumber.style.display = 'block';
            pageNumber.className = 'page-number-display ' + pageSettings.pageNumberPosition;
        } else {
            pageNumber.style.display = 'none';
        }
    });
}

// Function to create editor page
function createEditorPage(pageNum) {
    // Create page element
    const page = document.createElement('div');
    page.className = 'editor-page';
    if (pageSettings.orientation === 'landscape') {
        page.classList.add('landscape');
    }

    // Set page size
    if (pageSettings.orientation === 'portrait') {
        page.style.width = getSizeInMm(pageSettings.size).width + 'mm';
        page.style.minHeight = getSizeInMm(pageSettings.size).height + 'mm';
    } else {
        page.style.width = getSizeInMm(pageSettings.size).height + 'mm';
        page.style.minHeight = getSizeInMm(pageSettings.size).width + 'mm';
    }

    // Create page content
    const pageContent = document.createElement('div');
    pageContent.className = 'page-content-editable';
    pageContent.style.top = pageSettings.margins.top + 'mm';
    pageContent.style.right = pageSettings.margins.right + 'mm';
    pageContent.style.bottom = pageSettings.margins.bottom + 'mm';
    pageContent.style.left = pageSettings.margins.left + 'mm';
    pageContent.style.width = `calc(100% - ${pageSettings.margins.right + pageSettings.margins.left}mm)`;
    pageContent.style.height = `calc(100% - ${pageSettings.margins.top + pageSettings.margins.bottom}mm)`;

    // Create page number
    const pageNumber = document.createElement('div');
    pageNumber.className = 'page-number-display ' + pageSettings.pageNumberPosition;
    pageNumber.textContent = pageNum;
    if (!pageSettings.showPageNumbers) {
        pageNumber.style.display = 'none';
    }

    // Add content and page number to page
    page.appendChild(pageContent);
    page.appendChild(pageNumber);

    return page;
}

// Function to get page size in mm
function getSizeInMm(size) {
    const sizes = {
        'a4': { width: 210, height: 297 },
        'letter': { width: 215.9, height: 279.4 },
        'legal': { width: 215.9, height: 355.6 },
        'a3': { width: 297, height: 420 }
    };

    return sizes[size] || sizes['a4'];
}

// Function to save page settings
function savePageSettings() {
    localStorage.setItem('pageSettings', JSON.stringify(pageSettings));
}

// Function to load page settings
function loadPageSettings() {
    const savedSettings = localStorage.getItem('pageSettings');
    if (savedSettings) {
        pageSettings = JSON.parse(savedSettings);
    }
}

// Function to open paragraph dialog
function openParagraphDialog() {
    // Get selected paragraph or create new one
    const selection = window.getSelection();
    let paragraph = null;

    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        paragraph = getSelectedParagraph(range);
    }

    // If no paragraph is selected, alert user
    if (!paragraph) {
        alert('الرجاء تحديد فقرة أولاً');
        return;
    }

    // Set current values in dialog
    setCurrentParagraphValues(paragraph);

    // Show dialog
    document.getElementById('paragraphDialog').style.display = 'flex';
}

// Function to get selected paragraph
function getSelectedParagraph(range) {
    let node = range.startContainer;

    // Navigate up to find paragraph
    while (node && node.nodeName !== 'P') {
        node = node.parentNode;
        if (node === document.body || node === null) {
            return null;
        }
    }

    return node;
}

// Function to set current paragraph values in dialog
function setCurrentParagraphValues(paragraph) {
    // Get computed style
    const style = window.getComputedStyle(paragraph);

    // Set alignment
    let alignment = 'right';
    if (style.textAlign === 'center') alignment = 'center';
    else if (style.textAlign === 'left') alignment = 'left';
    else if (style.textAlign === 'justify') alignment = 'justify';
    document.getElementById('paragraphAlignment').value = alignment;

    // Set line height
    const lineHeight = parseFloat(style.lineHeight) || 1;
    if (lineHeight === 1) document.getElementById('lineHeight').value = '1';
    else if (lineHeight === 1.15) document.getElementById('lineHeight').value = '1.15';
    else if (lineHeight === 1.5) document.getElementById('lineHeight').value = '1.5';
    else if (lineHeight === 2) document.getElementById('lineHeight').value = '2';
    else document.getElementById('lineHeight').value = '1';

    // Set indentation
    document.getElementById('textIndent').value = parseInt(style.textIndent) || 0;
    document.getElementById('paddingRight').value = parseInt(style.paddingRight) || 0;
    document.getElementById('paddingLeft').value = parseInt(style.paddingLeft) || 0;

    // Set spacing
    document.getElementById('marginTopP').value = parseInt(style.marginTop) || 0;
    document.getElementById('marginBottomP').value = parseInt(style.marginBottom) || 0;
}

// Function to close paragraph dialog
function closeParagraphDialog() {
    document.getElementById('paragraphDialog').style.display = 'none';
}

// Function to apply paragraph format
function applyParagraphFormat() {
    // Get selected paragraph
    const selection = window.getSelection();
    let paragraph = null;

    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        paragraph = getSelectedParagraph(range);
    }

    // If no paragraph is selected, alert user and return
    if (!paragraph) {
        alert('الرجاء تحديد فقرة أولاً');
        closeParagraphDialog();
        return;
    }

    // Get values from dialog
    const alignment = document.getElementById('paragraphAlignment').value;
    const lineHeight = document.getElementById('lineHeight').value;
    const textIndent = document.getElementById('textIndent').value + 'px';
    const paddingRight = document.getElementById('paddingRight').value + 'px';
    const paddingLeft = document.getElementById('paddingLeft').value + 'px';
    const marginTop = document.getElementById('marginTopP').value + 'px';
    const marginBottom = document.getElementById('marginBottomP').value + 'px';

    // Apply styles to paragraph
    paragraph.style.textAlign = alignment;
    paragraph.style.lineHeight = lineHeight;
    paragraph.style.textIndent = textIndent;
    paragraph.style.paddingRight = paddingRight;
    paragraph.style.paddingLeft = paddingLeft;
    paragraph.style.marginTop = marginTop;
    paragraph.style.marginBottom = marginBottom;

    // Close dialog
    closeParagraphDialog();

    // Show notification
    showNotification('تم تطبيق تنسيق الفقرة');

    // Save undo state
    saveUndoState();
}

// Function to initialize font dropdown with previews
function initializeFontDropdown() {
    const fontSelect = document.getElementById('fontName');
    const options = fontSelect.querySelectorAll('option');

    options.forEach(option => {
        option.style.fontFamily = option.value;
    });

    // Set initial font preview
    fontSelect.style.fontFamily = fontSelect.value;
}

// Function to show a font preview dialog
function showFontPreview() {
    // Create a dialog for font preview if it doesn't exist
    let previewDialog = document.getElementById('fontPreviewDialog');

    if (!previewDialog) {
        previewDialog = document.createElement('div');
        previewDialog.id = 'fontPreviewDialog';
        previewDialog.className = 'dialog';

        const dialogContent = document.createElement('div');
        dialogContent.className = 'dialog-content';
        dialogContent.style.width = '80%';
        dialogContent.style.maxWidth = '800px';

        const heading = document.createElement('h3');
        heading.textContent = 'معاينة الخطوط';

        const closeButton = document.createElement('button');
        closeButton.className = 'dialog-btn';
        closeButton.textContent = 'إغلاق';
        closeButton.onclick = () => { previewDialog.style.display = 'none'; };

        const previewContainer = document.createElement('div');
        previewContainer.id = 'fontPreviewContainer';
        previewContainer.style.maxHeight = '500px';
        previewContainer.style.overflowY = 'auto';
        previewContainer.style.marginTop = '15px';

        // Add Arabic fonts preview
        const arabicHeading = document.createElement('h4');
        arabicHeading.textContent = 'الخطوط العربية';
        arabicHeading.style.marginTop = '15px';
        previewContainer.appendChild(arabicHeading);

        const arabicFonts = [
            'Cairo', 'Tajawal', 'Almarai', 'Amiri', 'Changa',
            'El Messiri', 'Lateef', 'Reem Kufi', 'Scheherazade New'
        ];

        arabicFonts.forEach(font => {
            const preview = createFontPreview(font, 'هذا مثال على النص العربي بخط ' + font);
            previewContainer.appendChild(preview);
        });

        // Add English fonts preview
        const englishHeading = document.createElement('h4');
        englishHeading.textContent = 'الخطوط الإنجليزية';
        englishHeading.style.marginTop = '15px';
        previewContainer.appendChild(englishHeading);

        const englishFonts = [
            'Arial', 'Verdana', 'Tahoma', 'Times New Roman', 'Georgia',
            'Courier New', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
            'Poppins', 'Raleway', 'Playfair Display', 'Source Sans Pro', 'Ubuntu'
        ];

        englishFonts.forEach(font => {
            const preview = createFontPreview(font, 'This is a sample text in ' + font + ' font');
            previewContainer.appendChild(preview);
        });

        dialogContent.appendChild(heading);
        dialogContent.appendChild(previewContainer);
        dialogContent.appendChild(closeButton);
        previewDialog.appendChild(dialogContent);
        document.body.appendChild(previewDialog);
    }

    previewDialog.style.display = 'flex';
}

// Helper function to create a font preview element
function createFontPreview(fontName, sampleText) {
    const container = document.createElement('div');
    container.className = 'font-preview';
    container.style.padding = '10px';
    container.style.margin = '5px 0';
    container.style.borderBottom = '1px solid var(--border-color)';

    const nameLabel = document.createElement('div');
    nameLabel.textContent = fontName;
    nameLabel.style.fontWeight = 'bold';
    nameLabel.style.marginBottom = '5px';

    const textSample = document.createElement('div');
    textSample.textContent = sampleText;
    textSample.style.fontFamily = fontName;
    textSample.style.fontSize = '16px';

    const applyButton = document.createElement('button');
    applyButton.className = 'additional-btn';
    applyButton.textContent = 'استخدام هذا الخط';
    applyButton.style.marginTop = '5px';
    applyButton.onclick = () => {
        document.getElementById('fontName').value = fontName;
        formatDoc('fontName', fontName);
        document.getElementById('fontPreviewDialog').style.display = 'none';
    };

    container.appendChild(nameLabel);
    container.appendChild(textSample);
    container.appendChild(applyButton);

    return container;
}

// Function to add a comment to selected text
function addComment() {
    const selection = window.getSelection();
    if (selection.toString().trim() === '') {
        alert('الرجاء تحديد النص الذي تريد إضافة تعليق عليه');
        return;
    }

    // Show comment dialog
    const commentDialog = document.getElementById('commentDialog');
    commentDialog.style.display = 'flex';
    document.getElementById('commentText').focus();
}

// Function to close comment dialog
function closeCommentDialog() {
    document.getElementById('commentDialog').style.display = 'none';
}

// Function to insert comment
function insertComment() {
    const commentText = document.getElementById('commentText').value.trim();
    if (commentText === '') {
        alert('الرجاء إدخال نص التعليق');
        return;
    }

    const commentColor = document.getElementById('commentColor').value;
    const selection = window.getSelection();

    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        // Create comment marker
        const commentMarker = document.createElement('span');
        commentMarker.className = 'comment-marker';
        commentMarker.setAttribute('data-color', commentColor);
        commentMarker.setAttribute('data-comment', commentText);
        commentMarker.setAttribute('title', 'انقر لعرض التعليق');

        // Create tooltip
        const tooltip = document.createElement('span');
        tooltip.className = 'comment-tooltip';
        tooltip.textContent = commentText;

        commentMarker.appendChild(document.createTextNode(selectedText));
        commentMarker.appendChild(tooltip);

        // Replace selected text with comment marker
        range.deleteContents();
        range.insertNode(commentMarker);

        // Close dialog
        closeCommentDialog();

        // Clear comment text
        document.getElementById('commentText').value = '';
    }
}

// Function to toggle comments visibility
function toggleComments() {
    const editor = document.getElementById('editor');
    const commentMarkers = editor.querySelectorAll('.comment-marker');
    const toggleBtn = document.getElementById('toggleCommentsBtn');
    const toggleText = document.getElementById('toggleCommentsText');

    // Check if comments are currently visible
    const commentsVisible = commentMarkers.length > 0 &&
                           window.getComputedStyle(commentMarkers[0]).backgroundColor !== 'transparent';

    commentMarkers.forEach(marker => {
        if (commentsVisible) {
            // Hide comments
            marker.style.backgroundColor = 'transparent';
            marker.style.borderBottom = 'none';
        } else {
            // Show comments
            const color = marker.getAttribute('data-color');
            marker.style.backgroundColor = '';
            marker.style.borderBottom = '';
        }
    });

    // Update button text
    if (commentsVisible) {
        toggleText.textContent = 'إظهار التعليقات';
    } else {
        toggleText.textContent = 'إخفاء التعليقات';
    }
}

// Function to open print preview
function openPrintPreview() {
    const printPreviewDialog = document.getElementById('printPreviewDialog');
    const printPreviewContent = document.getElementById('printPreviewContent');
    const editor = document.getElementById('editor');

    // Apply current page settings
    const pageSettings = getPageSettings();

    // Clone editor content
    printPreviewContent.innerHTML = editor.innerHTML;

    // Apply page size and orientation
    printPreviewContent.style.width = pageSettings.pageSize === 'a4' ? '210mm' :
                                     pageSettings.pageSize === 'letter' ? '8.5in' :
                                     pageSettings.pageSize === 'legal' ? '8.5in' : '297mm';

    printPreviewContent.style.height = pageSettings.pageSize === 'a4' ? '297mm' :
                                      pageSettings.pageSize === 'letter' ? '11in' :
                                      pageSettings.pageSize === 'legal' ? '14in' : '420mm';

    if (pageSettings.pageOrientation === 'landscape') {
        // Swap width and height for landscape
        const temp = printPreviewContent.style.width;
        printPreviewContent.style.width = printPreviewContent.style.height;
        printPreviewContent.style.height = temp;
    }

    // Apply margins
    printPreviewContent.style.padding = `${pageSettings.marginTop}mm ${pageSettings.marginRight}mm ${pageSettings.marginBottom}mm ${pageSettings.marginLeft}mm`;

    // Show page numbers if enabled
    if (pageSettings.showPageNumbers) {
        const pageNumber = document.createElement('div');
        pageNumber.className = 'page-number';
        pageNumber.textContent = '1';

        // Position page number according to settings
        pageNumber.style.position = 'absolute';

        switch (pageSettings.pageNumberPosition) {
            case 'bottom-center':
                pageNumber.style.bottom = '10mm';
                pageNumber.style.left = '50%';
                pageNumber.style.transform = 'translateX(-50%)';
                break;
            case 'bottom-right':
                pageNumber.style.bottom = '10mm';
                pageNumber.style.right = '10mm';
                break;
            case 'bottom-left':
                pageNumber.style.bottom = '10mm';
                pageNumber.style.left = '10mm';
                break;
            case 'top-center':
                pageNumber.style.top = '10mm';
                pageNumber.style.left = '50%';
                pageNumber.style.transform = 'translateX(-50%)';
                break;
            case 'top-right':
                pageNumber.style.top = '10mm';
                pageNumber.style.right = '10mm';
                break;
            case 'top-left':
                pageNumber.style.top = '10mm';
                pageNumber.style.left = '10mm';
                break;
        }

        printPreviewContent.appendChild(pageNumber);
    }

    // Show dialog
    printPreviewDialog.style.display = 'flex';

    // Add event listener for scale change
    document.getElementById('printScale').addEventListener('change', function() {
        printPreviewContent.style.transform = `scale(${this.value})`;
        printPreviewContent.style.transformOrigin = 'top center';
    });
}

// Function to close print preview
function closePrintPreview() {
    document.getElementById('printPreviewDialog').style.display = 'none';
}

// Function to print document
function printDocument() {
    const editor = document.getElementById('editor');
    const pageSettings = getPageSettings();

    // Create a new window for printing
    const printWindow = window.open('', '_blank');

    // Create print-friendly content
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Document</title>
            <style>
                @page {
                    size: ${pageSettings.pageSize} ${pageSettings.pageOrientation};
                    margin: ${pageSettings.marginTop}mm ${pageSettings.marginRight}mm ${pageSettings.marginBottom}mm ${pageSettings.marginLeft}mm;
                }
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.5;
                }
                .page-number {
                    position: fixed;
                    ${pageSettings.pageNumberPosition.startsWith('bottom') ? 'bottom: 10mm;' : 'top: 10mm;'}
                    ${pageSettings.pageNumberPosition.endsWith('center') ? 'left: 50%; transform: translateX(-50%);' :
                      pageSettings.pageNumberPosition.endsWith('right') ? 'right: 10mm;' : 'left: 10mm;'}
                }
            </style>
        </head>
        <body>
            ${editor.innerHTML}
            ${pageSettings.showPageNumbers ? '<div class="page-number">1</div>' : ''}
        </body>
        </html>
    `);

    // Print and close
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    // Close preview dialog
    closePrintPreview();
}

// Function to open templates dialog
function openTemplatesDialog() {
    document.getElementById('templatesDialog').style.display = 'flex';
}

// Function to close templates dialog
function closeTemplatesDialog() {
    document.getElementById('templatesDialog').style.display = 'none';
}

// Function to apply template
function applyTemplate(templateType) {
    const editor = document.getElementById('editor');

    // Confirm before replacing content
    if (editor.textContent.trim() !== 'أهلاً بك في محرر النصوص! يمكنك البدء بالكتابة هنا...') {
        if (!confirm('سيتم استبدال المحتوى الحالي بالقالب المختار. هل تريد المتابعة؟')) {
            return;
        }
    }

    // Apply template based on type
    switch (templateType) {
        case 'letter':
            editor.innerHTML = `
                <div style="text-align: left; margin-bottom: 20px;">
                    <div>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</div>
                </div>
                <div style="text-align: right; margin-bottom: 30px;">
                    <div>المرسل: [اسم المرسل]</div>
                    <div>العنوان: [عنوان المرسل]</div>
                    <div>البريد الإلكتروني: [البريد الإلكتروني]</div>
                </div>
                <div style="margin-bottom: 30px;">
                    <div>المستلم: [اسم المستلم]</div>
                    <div>العنوان: [عنوان المستلم]</div>
                </div>
                <div style="margin-bottom: 20px;">
                    <div>الموضوع: [موضوع الرسالة]</div>
                </div>
                <div style="margin-bottom: 20px;">
                    <p>تحية طيبة وبعد،</p>
                </div>
                <div style="margin-bottom: 30px;">
                    <p>[نص الرسالة]</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <p>وتفضلوا بقبول فائق الاحترام والتقدير،</p>
                </div>
                <div style="margin-top: 40px;">
                    <div>[اسم المرسل]</div>
                    <div>[المسمى الوظيفي]</div>
                    <div>[التوقيع]</div>
                </div>
            `;
            break;
        case 'cv':
            editor.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-size: 24px;">السيرة الذاتية</h1>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">المعلومات الشخصية</h2>
                    <div style="margin-top: 10px;">
                        <div>الاسم: [الاسم الكامل]</div>
                        <div>تاريخ الميلاد: [التاريخ]</div>
                        <div>العنوان: [العنوان]</div>
                        <div>البريد الإلكتروني: [البريد الإلكتروني]</div>
                        <div>رقم الهاتف: [رقم الهاتف]</div>
                    </div>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">المؤهلات العلمية</h2>
                    <div style="margin-top: 10px;">
                        <div>[السنة] - [المؤهل]، [المؤسسة التعليمية]</div>
                        <div>[السنة] - [المؤهل]، [المؤسسة التعليمية]</div>
                    </div>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">الخبرات العملية</h2>
                    <div style="margin-top: 10px;">
                        <div>[السنة] - [الوظيفة]، [الشركة]</div>
                        <ul>
                            <li>[وصف المهام والإنجازات]</li>
                            <li>[وصف المهام والإنجازات]</li>
                        </ul>
                        <div>[السنة] - [الوظيفة]، [الشركة]</div>
                        <ul>
                            <li>[وصف المهام والإنجازات]</li>
                            <li>[وصف المهام والإنجازات]</li>
                        </ul>
                    </div>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">المهارات</h2>
                    <div style="margin-top: 10px;">
                        <ul>
                            <li>[المهارة 1]</li>
                            <li>[المهارة 2]</li>
                            <li>[المهارة 3]</li>
                        </ul>
                    </div>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">اللغات</h2>
                    <div style="margin-top: 10px;">
                        <div>العربية: [المستوى]</div>
                        <div>الإنجليزية: [المستوى]</div>
                    </div>
                </div>
            `;
            break;
        case 'report':
            editor.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-size: 24px;">تقرير</h1>
                    <h2 style="font-size: 18px;">[عنوان التقرير]</h2>
                    <div>إعداد: [الاسم]</div>
                    <div>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</div>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">ملخص تنفيذي</h2>
                    <p style="margin-top: 10px;">[ملخص التقرير]</p>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">المقدمة</h2>
                    <p style="margin-top: 10px;">[نص المقدمة]</p>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">المنهجية</h2>
                    <p style="margin-top: 10px;">[وصف المنهجية المستخدمة]</p>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">النتائج</h2>
                    <p style="margin-top: 10px;">[عرض النتائج]</p>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">التوصيات</h2>
                    <p style="margin-top: 10px;">[التوصيات]</p>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">الخاتمة</h2>
                    <p style="margin-top: 10px;">[نص الخاتمة]</p>
                </div>
            `;
            break;
        case 'memo':
            editor.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="font-size: 24px;">مذكرة داخلية</h1>
                </div>
                <div style="margin-bottom: 30px;">
                    <div><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}</div>
                    <div><strong>من:</strong> [المرسل]</div>
                    <div><strong>إلى:</strong> [المستلم]</div>
                    <div><strong>الموضوع:</strong> [موضوع المذكرة]</div>
                </div>
                <div style="margin-bottom: 30px;">
                    <p>[نص المذكرة]</p>
                </div>
                <div style="margin-top: 40px;">
                    <div>[التوقيع]</div>
                    <div>[الاسم]</div>
                    <div>[المسمى الوظيفي]</div>
                </div>
            `;
            break;
        case 'invoice':
            editor.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="font-size: 24px;">فاتورة</h1>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div>
                        <div><strong>من:</strong> [اسم الشركة/المؤسسة]</div>
                        <div>[العنوان]</div>
                        <div>[رقم الهاتف]</div>
                        <div>[البريد الإلكتروني]</div>
                    </div>
                    <div>
                        <div><strong>رقم الفاتورة:</strong> [رقم الفاتورة]</div>
                        <div><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}</div>
                        <div><strong>تاريخ الاستحقاق:</strong> [تاريخ الاستحقاق]</div>
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <div><strong>إلى:</strong> [اسم العميل]</div>
                    <div>[عنوان العميل]</div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">البند</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">الكمية</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">السعر</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">[وصف البند]</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">[الكمية]</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">[السعر]</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">[المجموع]</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">[وصف البند]</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">[الكمية]</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">[السعر]</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">[المجموع]</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: left;"><strong>المجموع الفرعي:</strong></td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">[المجموع الفرعي]</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: left;"><strong>الضريبة:</strong></td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">[الضريبة]</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: left;"><strong>المجموع النهائي:</strong></td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">[المجموع النهائي]</td>
                        </tr>
                    </tfoot>
                </table>
                <div style="margin-bottom: 20px;">
                    <div><strong>طريقة الدفع:</strong> [طريقة الدفع]</div>
                    <div><strong>ملاحظات:</strong> [ملاحظات إضافية]</div>
                </div>
                <div style="text-align: center; margin-top: 40px;">
                    <p>شكراً لتعاملكم معنا</p>
                </div>
            `;
            break;
        case 'article':
            editor.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-size: 24px;">[عنوان المقالة]</h1>
                    <div>بقلم: [اسم الكاتب]</div>
                    <div>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</div>
                </div>
                <div style="margin-bottom: 20px;">
                    <p>[مقدمة المقالة]</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 18px;">[العنوان الفرعي الأول]</h2>
                    <p>[نص الفقرة]</p>
                    <p>[نص الفقرة]</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 18px;">[العنوان الفرعي الثاني]</h2>
                    <p>[نص الفقرة]</p>
                    <p>[نص الفقرة]</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 18px;">[العنوان الفرعي الثالث]</h2>
                    <p>[نص الفقرة]</p>
                    <p>[نص الفقرة]</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 18px;">الخاتمة</h2>
                    <p>[نص الخاتمة]</p>
                </div>
                <div style="margin-top: 30px;">
                    <h3 style="font-size: 16px;">المراجع</h3>
                    <ul>
                        <li>[المرجع 1]</li>
                        <li>[المرجع 2]</li>
                        <li>[المرجع 3]</li>
                    </ul>
                </div>
            `;
            break;
    }

    // Close dialog
    closeTemplatesDialog();

    // Update word count
    updateWordCount();

    // Save undo state
    saveUndoState();
}

// Function to implement auto-correction
function initializeAutoCorrection() {
    const editor = document.getElementById('editor');
    const commonMistakes = {
        'انا': 'أنا',
        'الذى': 'الذي',
        'فى': 'في',
        'الى': 'إلى',
        'هذة': 'هذه',
        'انت': 'أنت',
        'انتم': 'أنتم',
        'هاذا': 'هذا',
        'لاكن': 'لكن',
        'اللذي': 'الذي',
        'اللذين': 'الذين'
    };

    editor.addEventListener('input', function(e) {
        // Get current cursor position
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const cursorPosition = range.startOffset;

        // Get the text node where the cursor is
        const node = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) return;

        const text = node.textContent;

        // Check for space or punctuation to detect end of word
        if (/[\s.,;:!?]/.test(text.charAt(cursorPosition - 1))) {
            // Get the word before the space
            const words = text.substring(0, cursorPosition).split(/[\s.,;:!?]/);
            const lastWord = words[words.length - 2]; // The word before the space

            if (lastWord && commonMistakes[lastWord]) {
                // Create a range for the word to replace
                const wordStart = text.lastIndexOf(lastWord, cursorPosition - 1);
                const wordEnd = wordStart + lastWord.length;

                // Create a suggestion element
                const suggestion = document.createElement('div');
                suggestion.className = 'autocorrect-suggestion';
                suggestion.innerHTML = `هل تقصد: <span data-word="${commonMistakes[lastWord]}">${commonMistakes[lastWord]}</span>؟`;

                // Position the suggestion near the word
                const rect = range.getBoundingClientRect();
                suggestion.style.position = 'absolute';
                suggestion.style.top = `${rect.top + window.scrollY - 30}px`;
                suggestion.style.left = `${rect.left + window.scrollX}px`;

                // Add click event to apply suggestion
                suggestion.querySelector('span').addEventListener('click', function() {
                    const correctedWord = this.getAttribute('data-word');

                    // Create a range for the word to replace
                    const replaceRange = document.createRange();
                    replaceRange.setStart(node, wordStart);
                    replaceRange.setEnd(node, wordEnd);

                    // Replace the word
                    replaceRange.deleteContents();
                    replaceRange.insertNode(document.createTextNode(correctedWord));

                    // Remove suggestion
                    document.body.removeChild(suggestion);
                });

                // Add the suggestion to the document
                document.body.appendChild(suggestion);

                // Remove suggestion after 5 seconds
                setTimeout(() => {
                    if (document.body.contains(suggestion)) {
                        document.body.removeChild(suggestion);
                    }
                }, 5000);
            }
        }
    });
}

// Initialize auto-correction when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAutoCorrection();
});
