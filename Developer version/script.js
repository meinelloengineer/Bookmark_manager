let editMode = false; // Tracks if the popup is in edit mode
let currentEditId = null; // Stores the ID of the bookmark being edited
var currentContainerId = null; // Stores the ID of the container for new or edited bookmarks

// Show the popup form, optionally in edit mode
function showPopup(containerId, isEdit = false, bookmark = {}) {
    editMode = isEdit;
    currentEditId = bookmark.id || null;
    currentContainerId = containerId; // Set the current container ID

    // Set form title and button text based on mode
    document.getElementById('popupTitle').textContent = editMode ? 'Edit Link' : 'Add a New Link';
    document.getElementById('popupButton').textContent = editMode ? 'Save Changes' : 'Add Link';

    // Pre-fill form fields if in edit mode
    document.getElementById('linkName').value = editMode ? bookmark.name : '';
    document.getElementById('linkURL').value = editMode ? bookmark.url : '';
    document.getElementById('linkColor').value = editMode ? bookmark.color || '#65a9d7' : '#65a9d7';
    document.getElementById('linkComment').value = editMode ? bookmark.comment || '' : '';

    document.getElementById('popupForm').style.display = 'block';
    document.getElementById('popupOverlay').style.display = 'block';
}

// Hide the popup form and reset mode
function hidePopup() {
    document.getElementById('popupForm').style.display = 'none';
    document.getElementById('popupOverlay').style.display = 'none';
    editMode = false;
    currentEditId = null;
    currentContainerId = null;
}

// Save the link (either adding or editing)
async function saveLink() {
    const name = document.getElementById('linkName').value;
    let url = document.getElementById('linkURL').value;
    const color = document.getElementById('linkColor').value;
    const comment = document.getElementById('linkComment').value; // Optional comment field

    // Ensure the URL starts with "http://" or "https://"
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;  // Prepend "https://" if missing
    }

    if (name && url) { // Check mandatory fields
        let order = 0;

        if (!editMode) {
            // Get the highest current order value if adding a new bookmark
            const bookmarks = await getBookmarksByContainer(currentContainerId);
            order = bookmarks.length > 0 ? Math.max(...bookmarks.map(b => b.order)) + 1 : 0;
        } else{
            const currentBookmark = await getBookmarkById(currentEditId)
            order = currentBookmark.order
        }

        console.log("Updating / saving bookmark with values:", {
            id: currentEditId,
            name,
            url,
            color,
            comment,
            order,
            currentContainerId
        });

        if (editMode && currentEditId !== null) {
            // Edit existing bookmark
            await updateBookmark(currentEditId, name, url, color, comment, order, currentContainerId);
        } else {
            // Add new bookmark with calculated order and container ID
            await addBookmark(name, url, color, comment, order, currentContainerId);
        }

        displayBookmarks(currentContainerId); // Refresh the displayed list for the specific container
        hidePopup(); // Close the popup
    }
}

// Edit an existing link by opening the popup in edit mode
function editLink(id, name, url, color, comment, containerId) {
    showPopup(containerId, true, { id, name, url, color, comment, containerId});
}

// Edit an existing page by opening the popup in edit mode
function editPage(id, name, color, comment, containerId) {
    showPagePopup(containerId, true, {id, name, color, comment, containerId});
}

// Delete a link and refresh the display
async function deleteLink(id, containerId) {
    if (confirm("Are you sure you want to delete this link?")) {
        await deleteBookmark(id);
        displayBookmarks(containerId); // Refresh the display for the specific container
    }
}

// Delete a link and refresh the display
async function deletePage(id, containerId) {
    if (confirm("Are you sure you want to delete this page?")) {
        await deletePageFromDB(id);
        displayPages(containerId); // Refresh the display for the specific container
    }
}

function showSettingsPopup() {
    document.getElementById('settingsOverlay').style.display = 'block';
    document.getElementById('settingsForm').style.display = 'block';
}

async function hideSettingsPopup() {
    location.reload();
    document.getElementById('settingsOverlay').style.display = 'none';
    document.getElementById('settingsForm').style.display = 'none';
}

function editContainer(id, name, color) {
    showPopup(id, true, { id, name, color }, "container");
}

async function showContainerPopup(containerId, isEdit = false, container = {}) {
    editMode = isEdit;
    currentEditId = containerId || null;

    // Set popup title and button text
    document.getElementById('containerPopupTitle').textContent = isEdit ? 'Edit Container' : 'Add a New Container';
    document.getElementById('containerPopupButton').textContent = isEdit ? 'Save' : 'Add Container';

    // Pre-fill fields if editing
    document.getElementById('containerName').value = isEdit ? container.name : '';
    document.getElementById('containerColor').value = isEdit ? container.color || '#4285f4' : '#4285f4';
    
    // Handle radio button selection
    const containerType = isEdit ? container.type || 'links' : 'links'; // Default to 'links'
    document.querySelector(`input[name="containerType"][value="${containerType}"]`).checked = true;
    
    // Disable radio buttons in edit mode
    document.getElementById('radioLinks').disabled = isEdit;
    document.getElementById('radioPages').disabled = isEdit;
    
    // Show move/copy options and dropdown only if in edit mode
    const containerOptions = document.getElementById('containerOptions');
    if (isEdit) {
        containerOptions.style.display = 'block';
        
        // Populate the dropdown with all pages in the database
        const parentPageDropdown = document.getElementById('parentPageDropdown');
        parentPageDropdown.innerHTML = '<option value="" disabled selected>Select a page</option>'; // Reset options
        let option;
        try {
            const childContainers = await getPageContainers(container.parentPageId); // Fetch all pages from IndexedDB
            // Remove the container with id === containerId
            const filteredContainers = childContainers.filter(childContainer => childContainer.id !== containerId);
            console.log('filteredContainers:', filteredContainers);
            filteredContainers.forEach(async childContainer =>{
                if (childContainer.id !== containerId){
                    const pages = await getPagesByContainer(childContainer.id);
                    option = document.createElement('option');
                    if (pages){
                        pages.forEach(async page => {
                            option = document.createElement('option');
                            option.value = page.id;
                            option.textContent = page.name;
                            parentPageDropdown.appendChild(option);
                        });
                    }
                }
            })
            const parentPage = await getPageById(container.parentPageId);
            console.log('parentPage:', parentPage);
            try {
                const parentPageContainer = await getContainerById(parentPage.containerId);
                console.log('parentPageContainer:', parentPageContainer);
                const parentContainers = await getContainersByParentPageId(parentPageContainer.parentPageId);
                console.log('parentContainers:', parentContainers);
                parentContainers.forEach(async parentContainer =>{
                    const pages = await getPagesByContainer(parentContainer.id);
                    if (pages){
                        console.log(pages);
                        pages.forEach(async page => {
                            option = document.createElement('option');
                            option.value = page.id;
                            option.textContent = page.name;
                            parentPageDropdown.appendChild(option);
                        });
                    }
                })
                // Add Home directory
                option = document.createElement('option');
                option.value = 0;
                option.textContent = 'Home';
                parentPageDropdown.appendChild(option);
                // add parentPage without producing double Home
                if (parentPageContainer.parentPageId != 0){
                    const directParentPage = await getPageById(parentPageContainer.parentPageId);
                    option = document.createElement('option');
                    option.value = parentPageContainer.parentPageId;
                    option.textContent = directParentPage.name;
                    parentPageDropdown.appendChild(option);
                }
            } catch (error) {
                console.log('Current Page has no parent')
            }

            // Pre-select the current parent page, if applicable
            if (container.parentPageId) {
                parentPageDropdown.value = container.parentPageId;
            }
        } catch (error) {
            console.error('Error populating parent page dropdown:', error);
        }
    } else {
        containerOptions.style.display = 'none';
    }

    // Show the popup
    document.getElementById('containerPopupForm').style.display = 'block';
    document.getElementById('containerPopupOverlay').style.display = 'block';
}


function hideContainerPopup() {
    document.getElementById('containerPopupForm').style.display = 'none';
    document.getElementById('containerPopupOverlay').style.display = 'none';
    editMode = false;
    currentEditId = null;
}

function updateContainer() {
    const selectedParentPageId = document.getElementById('parentPageDropdown').value;
    const selectedParentPageIdInt = parseInt(selectedParentPageId);
    const moveChecked = document.getElementById('moveContainer').checked;
    const NewParentPageId = getParentPageID();
    const NewParentPageIdInt = parseInt(NewParentPageId, 10);
    const newName = document.getElementById('containerName').value;
    const newColor = document.getElementById('containerColor').value;
    const newContainerType = document.querySelector('input[name="containerType"]:checked').value
    const id = currentEditId
    return new Promise(async (resolve, reject) => {
        const transaction = db.transaction(["containers"], "readwrite");
        const store = transaction.objectStore("containers");
        const request = await store.get(id);
        const currentParentPageId = getParentPageID();

        request.onsuccess = () => {
            const data = request.result;
            // Update container properties
            data.name = newName;
            data.color = newColor;
            data.type = newContainerType;
            data.parentPageId = NewParentPageIdInt;
            console.log('check?, pageID', moveChecked, selectedParentPageIdInt);
            if (moveChecked && selectedParentPageIdInt || moveChecked && selectedParentPageIdInt===0) {
                data.parentPageId = selectedParentPageIdInt;
                console.log('entered');
            }

            const updateRequest = store.put(data);
            updateRequest.onsuccess = () => {
                console.log("Container updated successfully:", data);
                hideContainerPopup();
                displayContainers(currentParentPageId);
                resolve();
            };
            updateRequest.onerror = (event) => {
                console.error("Error updating container:", event.target.errorCode);
                reject(event.target.errorCode);
            };
        };

        request.onerror = (event) => {
            console.error("Error retrieving container:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// Show the popup form, optionally in edit mode
function showPagePopup(containerId, isEdit = false, page = {}) {
    editMode = isEdit;
    console.log('editMode:', editMode);
    console.log('isEdit::', isEdit);
    console.log('containerID:', containerId);
    console.log('page:', page);
    currentEditId = page.id || null;
    currentContainerId = containerId; // Set the current container ID

    // Set form title and button text based on mode
    document.getElementById('pagePopupTitle').textContent = editMode ? 'Edit Page' : 'Add a New Page';
    document.getElementById('pagePopupButton').textContent = editMode ? 'Save Changes' : 'Add Page';

    // Pre-fill form fields if in edit mode
    document.getElementById('pageName').value = editMode ? page.name : '';
    document.getElementById('pageColor').value = editMode ? page.color || '#65a9d7' : '#65a9d7';
    document.getElementById('pageComment').value = editMode ? page.comment || '' : '';

    document.getElementById('pagePopupForm').style.display = 'block';
    document.getElementById('pagePopupOverlay').style.display = 'block';
}

function hidePagePopup() {
    document.getElementById('pagePopupForm').style.display = 'none';
    document.getElementById('pagePopupOverlay').style.display = 'none';
    editMode = false;
    currentEditId = null;
}

// Save the link (either adding or editing)
async function savePage() {
    const name = document.getElementById('pageName').value;
    const color = document.getElementById('pageColor').value;
    const comment = document.getElementById('pageComment').value; // Optional comment field
    const fileInput = document.getElementById('pageBackgroundImageUpload'); // File input for local image upload
    const newFile = fileInput.files[0]; // Get the selected file
    let fileBlob;
    if (newFile) {
        const blob = await newFile.arrayBuffer(); // Convert file to Blob
        fileBlob = new Blob([blob], { type: newFile.type });
    }
    if (name) { // Check mandatory field
        let order = 0;
        if (!editMode) {
            // Get the highest current order value if adding a new bookmark
            const pages = await getPagesByContainer(currentContainerId);
            order = pages.length > 0 ? Math.max(...pages.map(b => b.order)) + 1 : 0;
        }
        console.log("Updating page with values:", {
            id: currentEditId,
            name,
            color,
            comment,
            order,
            currentContainerId,
        });

        if (editMode && currentEditId !== null) {
            // Edit existing bookmark
            await updatePage(currentEditId, name, color, comment, order, currentContainerId, image = fileBlob);
        } else {
            // Add new bookmark with calculated order and container ID
            const newId = Date.now();
            await addPage(newId, name, color, comment, order, currentContainerId, image = fileBlob);
        }

        displayPages(currentContainerId); // Refresh the displayed list for the specific container
        hidePagePopup(); // Close the popup
    }
}

function getAllPages() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["pages"], "readonly");
        const store = transaction.objectStore("pages");
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.errorCode);
    });
}


function updateImportedHomeParentPageId(importData, newHomePageId) {
    for (const storeName of Object.keys(importData)) {
        if (storeName === "containers" || storeName === "pages") {
            for (const item of importData[storeName]) {
                if (item.parentPageId === 0) {
                    item.parentPageId = newHomePageId; // Update parentPageId
                }
                if (item.id === 0){
                    item.id = newHomePageId;
                }
            }
        }
    }
}


async function ensureImportContainer() {
    const containers = await getContainersByParentPageId(0); // Home containers
    let importContainer = containers.find((c) => c.name === "Import" && c.type === "pages");

    if (!importContainer) {
        const newContainerId = Date.now();
        importContainer = { id: newContainerId, name: "Import", parentPageId: 0, type: "pages", color: "#FFD700", order: 0 };
        await addFullContainerToDB(newContainerId, importContainer.name, importContainer.parentPageId, importContainer.type, importContainer.color, importContainer.order);
        console.log('Added Container:', importContainer)
    }

    return importContainer;
}

async function createNewPageInImportContainer(containerId, dbName, homePageImage) {
    const newPageId = Date.now();
    const newPageName = `Imported: ${dbName.replace('.json', '')}`;
    const pageColor = "#87CEFA"; // Default color for imported pages
    console.log('newpageid:', newPageId)
    await addPage(newPageId, newPageName, pageColor, "Imported database content", 0, containerId, homePageImage);
    return newPageId;
}
