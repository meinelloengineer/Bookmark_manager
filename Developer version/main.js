// adding new pages is an issue. Maxybe because of how IDs are currently being handled || ID is always null.
document.addEventListener("DOMContentLoaded", async () => {
    //deleteDatabase();
    await initDB();
    await loadSettings(pageId = 0);
    const homepage = await getPageById(pageId = 0);
    navigateToParentPage(pageId = 0, pageName = 'Home', homepage.image);
    displayContainers(parentPageId = 0); // 0 being the page ID of the home folder
});

function deleteDatabase() {
    if (confirm("Are you sure you want to delete this entire database?")) {
        const dbName = "BookmarksDB"; // Replace with your actual database name
        const request = indexedDB.deleteDatabase(dbName);

        request.onsuccess = () => {
            console.log(`Database "${dbName}" deleted successfully.`);
        };

        request.onerror = (event) => {
            console.error(`Error deleting database "${dbName}":`, event.target.errorCode);
        };

        request.onblocked = () => {
            console.warn(`Database "${dbName}" deletion is blocked. Close all open tabs using this database.`);
        };
    };
}

// Add a new container
async function addContainer() {
    const containerId = Date.now(); // Use timestamp as unique ID
    const containerName = "New Container"; // Default name
    const currentParentPageId = getParentPageID();
    await addContainerToDB(containerId, containerName, currentParentPageId);
    showContainerPopup(containerId, isEdit = false, {name: containerName})
    // Save new container to database
    displayContainers(currentParentPageId); // Refresh display to include new container
}

async function displayContainers(parentPageId) {
    console.log('starting to display', parentPageId);
    const containers = await getPageContainers(parentPageId); // Get all containers from IndexedDB
    console.log('retrieved container:', containers);
    const containerList = document.getElementById('containers-list');
    containerList.innerHTML = ''; // Clear existing containers

    containers.sort((a, b) => a.order - b.order).forEach(container => {
        // Create a container div for each container
        const containerDiv = document.createElement('div');
        containerDiv.classList.add('link-container');
        containerDiv.dataset.id = container.id; // Store container ID

        // Container title div
        const titleDiv = document.createElement('div');
        titleDiv.classList.add('subsubtopic');
        titleDiv.style.display = 'flex';
        titleDiv.style.justifyContent = 'space-between';
        titleDiv.style.alignItems = 'center';
        titleDiv.style.backgroundColor = container.color || '#4285f4';
        titleDiv.style.borderRadius = '5px';
        titleDiv.style.width = '100%';

        // Editable container title
        const containerTitle = document.createElement('h2');
        containerTitle.textContent = container.name;
        containerTitle.classList.add('container-title');
        containerTitle.style.margin = 0;
        containerTitle.style.color = '#fff';

        // Button container for Edit and Delete buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.alignItems = 'center';

        // Edit button
        const editButton = document.createElement('button');
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.onclick = () => showContainerPopup(container.id, true, container);

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteButton.onclick = async () => {
            if (confirm("Are you sure you want to delete this container and all its links?")) {
                await deleteContainerAndLinks(container.id); // Delete container and its links
                displayContainers(parentPageId); // Refresh the containers list
            }
        };

        // Button container for Right and Left arrow buttons
        const orderButtonContainer = document.createElement('div');
        orderButtonContainer.style.display = 'flex';
        orderButtonContainer.style.flexDirection = 'column';
        orderButtonContainer.style.alignItems = 'center';

        // Move right button
        const rightButton = document.createElement('button');
        rightButton.innerHTML = '<i class="fa fa-arrow-right"></i>';
        rightButton.onclick = async () => {
            await updateContainerOrder(container.id, container.order+1.5);
            await displayContainers(parentPageId);
            // Update order values in IndexedDB based on the new positions
            const allContainers = Array.from(document.querySelectorAll('.link-container'));
            const newOrder = allContainers.map((container, index) => ({
                id: parseInt(container.dataset.id, 10),
                order: index,
            }));
            for (const { id, order } of newOrder) {
                await updateContainerOrder(id, order);
            }
            await displayContainers(parentPageId);
        }

        // Move left button
        const leftButton = document.createElement('button');
        leftButton.innerHTML = '<i class="fa fa-arrow-left"></i>';
        leftButton.onclick = async () => {
            await updateContainerOrder(container.id, container.order-1.5);
            await displayContainers(parentPageId);
            // Update order values in IndexedDB based on the new positions
            const allContainers = Array.from(document.querySelectorAll('.link-container'));
            const newOrder = allContainers.map((container, index) => ({
                id: parseInt(container.dataset.id, 10),
                order: index,
            }));
            for (const { id, order } of newOrder) {
                await updateContainerOrder(id, order);
            }
            await displayContainers(parentPageId);
        }

        // Append buttons to the button container
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);
        // Append order-buttons to the button container
        orderButtonContainer.appendChild(rightButton);
        orderButtonContainer.appendChild(leftButton);

        // Append title and buttons to titleDiv
        titleDiv.appendChild(containerTitle);
        titleDiv.appendChild(buttonContainer);
        titleDiv.appendChild(orderButtonContainer);

        // Append titleDiv to containerDiv
        containerDiv.appendChild(titleDiv);
        
        if (container.type == 'links'){
            // Bookmarks list for this container
            const bookmarksList = document.createElement('div');
            bookmarksList.id = `bookmarks-list-${container.id}`;
            bookmarksList.style.width = `100%`;
            bookmarksList.style.overflow = 'auto'; /* Make contents scrollable if they exceed the height */
            bookmarksList.classList.add('bookmarks-list');
            containerDiv.appendChild(bookmarksList);
            // "Add Link" button for this container
            const addLinkButton = document.createElement('button');
            addLinkButton.textContent = "+ Add Link";
            addLinkButton.onclick = () => showPopup(container.id); // Opens popup for this container
            containerDiv.appendChild(addLinkButton);
            // Add container to the main list
            containerList.appendChild(containerDiv);
            // Display bookmarks within this container
            displayBookmarks(container.id);
        } else if (container.type == 'pages'){
            // Pages list for this container
            const pagesList = document.createElement('div');
            pagesList.id = `pages-list-${container.id}`;
            pagesList.style.width = `100%`;
            pagesList.style.overflow = 'auto'; /* Make contents scrollable if they exceed the height */
            pagesList.classList.add('pages-list');
            containerDiv.appendChild(pagesList);
            // "Add Link" button for this container
            const addLinkButton = document.createElement('button');
            addLinkButton.textContent = "+ Add Page";
            addLinkButton.onclick = () => showPagePopup(container.id); // Opens popup for this container
            containerDiv.appendChild(addLinkButton);
            // Add container to the main list
            containerList.appendChild(containerDiv);
            // Display pages within this container
            console.log('now we display pages of:', container.id);
            displayPages(container.id);
        } else{
            console.log("unknown container type:", container.type);
        }
    })
}


// Display bookmarks within a specific container
async function displayBookmarks(containerId) {
    var bookmarks = await getBookmarksByContainer(containerId); // Fetch bookmarks for this container
    var containerDiv = document.getElementById(`bookmarks-list-${containerId}`);
    containerDiv.innerHTML = ''; // Clear existing links

    bookmarks.sort((a, b) => a.order - b.order).forEach(bookmark => {
        // Create a div for each bookmark link and its buttons
        const linkDiv = document.createElement('div');
        linkDiv.classList.add('bookmarkContainer');
        linkDiv.style.backgroundColor = bookmark.color || '#65a9d7';
        linkDiv.draggable = true;
        linkDiv.dataset.id = bookmark.id;

        // Set up drag-and-drop event listeners
        linkDiv.addEventListener('dragstart', handleDragStart);
        linkDiv.addEventListener('dragover', handleDragOver);
        linkDiv.addEventListener('drop', handleDrop);

        // Link and comment container
        const linkContainer = document.createElement('div');
        linkContainer.style.display = 'flex';
        linkContainer.style.flexDirection = 'column';
        linkContainer.style.flexGrow = '1';
        linkContainer.style.overflow = 'scoll';

        // Link element
        const link = document.createElement('a');
        link.href = bookmark.url;
        link.target = '_blank';
        link.textContent = bookmark.name;

        // Comment element below the link
        const commentDiv = document.createElement('div');
        commentDiv.style.fontSize = '0.7em';
        commentDiv.style.color = '#eee';
        commentDiv.style.marginTop = '4px';
        commentDiv.textContent = bookmark.comment || '';

        // Append link and comment to the link container
        link.appendChild(commentDiv);
        linkContainer.appendChild(link);

        // Button container for Edit and Delete buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.alignItems = 'center';

        // Edit button
        const editButton = document.createElement('button');
        editButton.innerHTML = '<i class="fas fa-edit"></i>'; // Add Font Awesome edit icon
        editButton.onclick = () => editLink(bookmark.id, bookmark.name, bookmark.url, bookmark.color, bookmark.comment, bookmark.containerId);

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Add Font Awesome trash icon
        deleteButton.onclick = () => deleteLink(bookmark.id, containerId);


        // Append buttons to the button container
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);

        // Flex layout for linkDiv to align buttonContainer to the right
        linkDiv.style.display = 'flex';
        linkDiv.style.alignItems = 'center';

        // Append linkContainer and buttonContainer to linkDiv
        linkDiv.appendChild(linkContainer);
        linkDiv.appendChild(buttonContainer);

        // Append the entire linkDiv to the container-specific bookmarks list
        containerDiv.appendChild(linkDiv);
    });
}

// Display pages within a specific container
async function displayPages(containerId) {
    var pages = await getPagesByContainer(containerId); // Fetch bookmarks for this container
    console.log('received pages:', pages);
    var containerDiv = document.getElementById(`pages-list-${containerId}`);
    containerDiv.innerHTML = ''; // Clear existing links

    pages.sort((a, b) => a.order - b.order).forEach(page => {
        // Create a div for each bookmark link and its buttons
        const linkDiv = document.createElement('div');
        linkDiv.classList.add('subsubtopic');
        linkDiv.style.backgroundColor = page.color || '#65a9d7';
        linkDiv.draggable = true;
        linkDiv.dataset.id = page.id;

        // Set up drag-and-drop event listeners
        linkDiv.addEventListener('dragstart', handleDragStart);
        linkDiv.addEventListener('dragover', handleDragOver);
        linkDiv.addEventListener('drop', handleDrop);

        // Link and comment container
        const pageContainer = document.createElement('div');
        pageContainer.classList.add('pageContainer');
        pageContainer.style.display = 'flex';
        pageContainer.style.padding = '20px';
        pageContainer.style.flexDirection = 'column';
        pageContainer.style.flexGrow = '1';
        pageContainer.style.overflow = 'scroll';
        pageContainer.style.cursor = 'pointer';
        //pageContainer.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.5)";
        pageContainer.onclick = () => {
            navigateToParentPage(page.id, page.name, page.image);
         }


        // Page element as a button or div
        const pageName = document.createElement('div');
        pageName.textContent = page.name;
        pageName.style.color = '#ffffff';
        pageName.style.fontFamily = 'TimesNewRoman'
        pageName.style.fontSize = '1.5em'
        pageName.style.fontWeight = 'bold';
        pageName.style.alignSelf = 'center';

        // Comment element below the link
        const commentDiv = document.createElement('div');
        commentDiv.style.fontSize = '0.9em';
        commentDiv.style.color = '#eee';
        commentDiv.style.marginTop = '4px';
        commentDiv.textContent = page.comment || '';

        // Append link and comment to the link container
        pageContainer.appendChild(pageName);
        pageContainer.appendChild(commentDiv);

        // Button container for Edit and Delete buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.alignItems = 'center';

        // Edit button
        const editButton = document.createElement('button');
        editButton.innerHTML = '<i class="fas fa-edit"></i>'; // Add Font Awesome edit icon
        editButton.onclick = () => editPage(page.id, page.name, page.color, page.comment, page.containerId);

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Add Font Awesome trash icon
        deleteButton.onclick = () => deletePage(page.id, containerId);


        // Append buttons to the button container
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);

        // Flex layout for linkDiv to align buttonContainer to the right
        linkDiv.style.display = 'flex';
        linkDiv.style.alignItems = 'center';

        // Append linkContainer and buttonContainer to linkDiv
        linkDiv.appendChild(pageContainer);
        linkDiv.appendChild(buttonContainer);

        // Append the entire linkDiv to the container-specific bookmarks list
        containerDiv.appendChild(linkDiv);
    });
}

let draggedElement = null;

function handleDragStart(event) {
    draggedElement = event.currentTarget;
    event.dataTransfer.effectAllowed = 'move';

    // Attach the container ID and type (bookmarks/pages) to the data transfer
    const containerId = draggedElement.closest('.bookmarks-list, .pages-list').id.split('-')[2];
    const type = draggedElement.closest('.bookmarks-list') ? 'bookmark' : 'page';
    event.dataTransfer.setData('text/plain', JSON.stringify({ id: draggedElement.dataset.id, containerId, type }));
}

function handleDragOver(event) {
    event.preventDefault(); // Allow drop
    event.dataTransfer.dropEffect = 'move';
}

async function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const targetContainerId = event.currentTarget.closest('.bookmarks-list, .pages-list')?.id?.split('-')[2];
    const targetType = event.currentTarget.closest('.bookmarks-list') ? 'bookmark' : 'page';

    if (!targetContainerId || !draggedElement) {
        console.error("Error: Invalid drag-and-drop target.");
        return;
    }

    // Parse the data from the drag start
    const draggedData = JSON.parse(event.dataTransfer.getData('text/plain'));
    const { id, containerId: sourceContainerId, type } = draggedData;

    // Ensure source and target types match
    if (type !== targetType) {
        console.error("Error: Dragged element type and drop target type do not match.");
        return;
    }

    const sourceContainerDiv = document.getElementById(`${type === 'bookmark' ? 'bookmarks-list' : 'pages-list'}-${sourceContainerId}`);
    const targetContainerDiv = document.getElementById(`${type === 'bookmark' ? 'bookmarks-list' : 'pages-list'}-${targetContainerId}`);

    if (!sourceContainerDiv || !targetContainerDiv) {
        console.error("Error: Source or target container does not exist.");
        return;
    }

    // Update the UI: Move the dragged element to the new container
    targetContainerDiv.insertBefore(draggedElement, event.currentTarget);
    // updating target container
    try {
        // Update order values in IndexedDB based on the new positions
        const newOrder = Array.from(targetContainerDiv.children).map((child, index) => ({
            id: parseInt(child.dataset.id, 10), // Ensure ID is parsed as an integer
            order: index,
        }));
        console.log("newOrder", newOrder);
        // Save updated order for each bookmark in IndexedDB
        for (const { id, order } of newOrder) {
            if (type == 'bookmark'){
                const bookmark = await getBookmarkById(id); // Fetch bookmark by ID
                await updateBookmark(id, bookmark.name, bookmark.url, bookmark.color, bookmark.comment, order, targetContainerId);
            }else if (type == 'page'){
                const page = await getPageById(id); // Fetch bookmark by ID
                await updatePage(id, page.name, page.color, page.comment, order, targetContainerId);
            }
        }
        displayBookmarks(targetContainerId);

    } catch (error) {
        console.error("Error updating target container:", error);
    }
    // updating source container
    try {
        // Update order values in IndexedDB based on the new positions
        const newOrder = Array.from(sourceContainerDiv.children).map((child, index) => ({
            id: parseInt(child.dataset.id, 10), // Ensure ID is parsed as an integer
            order: index,
        }));
        // Save updated order for each bookmark in IndexedDB
        for (const { id, order } of newOrder) {
            if (type == 'bookmark'){
                const bookmark = await getBookmarkById(id); // Fetch bookmark by ID
                await updateBookmark(id, bookmark.name, bookmark.url, bookmark.color, bookmark.comment, order, sourceContainerId);
            }else if (type == 'page'){
                const page = await getPageById(id); // Fetch bookmark by ID
                await updatePage(id, page.name, page.color, page.comment, order, sourceContainerId);
            }
        }
        displayBookmarks(sourceContainerId);

    } catch (error) {
        console.error("Error updating source container:", error);
    }
    draggedElement = null; // Reset dragged element reference
}

async function logBookmarksForContainer(containerId) {
    const bookmarks = await getBookmarksByContainer(containerId);
    console.log(`Bookmarks for container ${containerId}:`, bookmarks);
}

let breadcrumbStack = []; // Stack to track navigation path
function getParentPageID() {
    return parseInt(document.getElementById('parentPageID').value, 10);
}

function setParentPageID(id) {
    document.getElementById('parentPageID').value = id;
    console.log("Parent Page ID set to:", id);
}
function updateBreadcrumb() {
    const breadcrumbNav = document.getElementById('breadcrumb');
    breadcrumbNav.innerHTML = ''; // Clear existing breadcrumbs

    breadcrumbStack.forEach((item, index) => {
        // Create breadcrumb element
        const breadcrumbItem = document.createElement('span');
        breadcrumbItem.textContent = item.name;
        breadcrumbItem.style.cursor = 'pointer';

        // Navigate to the corresponding parentPageID when clicked
        breadcrumbItem.onclick = () => {
            breadcrumbStack = breadcrumbStack.slice(0, index + 1); // Trim stack to selected level
            setParentPageID(item.id);
            displayContainers(item.id);
            if (item.image) {
                const imageUrl = URL.createObjectURL(item.image);
                console.log("Updating background with:", imageUrl);
                document.body.style.backgroundImage = `url('${imageUrl}')`;
            } else {
                console.warn("No background image found in the database.");
                document.body.style.backgroundImage = '';
            }
            updateBreadcrumb(); // Update breadcrumb UI
        };

        // Add a separator if not the last item
        breadcrumbNav.appendChild(breadcrumbItem);
        if (index < breadcrumbStack.length - 1) {
            const separator = document.createElement('span');
            separator.textContent = ' > ';
            breadcrumbNav.appendChild(separator);
        }
    });
}

function navigateToParentPage(parentPageId, parentPageName, image = '') {
    // update bg Image
    if (image) {
        console.log(image);
        const imageUrl = URL.createObjectURL(image);
        console.log("Updating background with:", imageUrl);
        document.body.style.backgroundImage = `url('${imageUrl}')`;
    } else {
        console.warn("No background image found in the database.");
        document.body.style.backgroundImage = '';
    }
    // Add the current page to the breadcrumb stack
    breadcrumbStack.push({ id: parentPageId, name: parentPageName, image: image });

    // Update the parentPageID and display
    setParentPageID(parentPageId);
    displayContainers(parentPageId);
    updateBreadcrumb(); // Refresh breadcrumb UI
}
