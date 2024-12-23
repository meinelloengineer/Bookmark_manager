let db;

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("BookmarksDB", 2); // Increment to trigger onupgradeneeded()

        request.onupgradeneeded = async (event) => {
            db = event.target.result;

            // Create the "bookmarks" object store
            if (!db.objectStoreNames.contains("bookmarks")) {
                const bookmarksStore = db.createObjectStore("bookmarks", { keyPath: "id", autoIncrement: true });
                bookmarksStore.createIndex("name", "name", { unique: false });
                bookmarksStore.createIndex("url", "url", { unique: false });
                bookmarksStore.createIndex("color", "color", { unique: false });
                bookmarksStore.createIndex("comment", "comment", { unique: false });
                bookmarksStore.createIndex("order", "order", { unique: false });
                bookmarksStore.createIndex("containerId", "containerId", { unique: false });
            }
            // Create the "pages" object store
            if (!db.objectStoreNames.contains("pages")) {
                const pagesStore = db.createObjectStore("pages", { keyPath: "id", autoIncrement: true });
                pagesStore.createIndex("name", "name", { unique: false });
                pagesStore.createIndex("color", "color", { unique: false });
                pagesStore.createIndex("comment", "comment", { unique: false });
                pagesStore.createIndex("order", "order", { unique: false });
                pagesStore.createIndex("containerId", "containerId", { unique: false });
                pagesStore.createIndex("image", "image", { unique: false });
            }

            // Create the "containers" object store
            if (!db.objectStoreNames.contains("containers")) {
                const containersStore = db.createObjectStore("containers", { keyPath: "id", autoIncrement: true });
                containersStore.createIndex("type", "type", { unique: false });
                containersStore.createIndex("name", "name", { unique: false });
                containersStore.createIndex("color", "color", { unique: false });
                containersStore.createIndex("order", "order", { unique: false });
                containersStore.createIndex("parentPageId", "order", { unique: false });
            }

            // Create the "settings" object store
            if (!db.objectStoreNames.contains("settings")) {
                db.createObjectStore("settings", { keyPath: "id" });
            }

            // Create the "background" object store
            if (!db.objectStoreNames.contains("background")) {
                db.createObjectStore("background", { keyPath: "id" });
                //await fetchDefaultBackgroundImage(); // Fetch the default background
            }
        };

        request.onsuccess = async (event) => {
            db = event.target.result;
            // Create a first HomeParentPage
            try {
                await addPage(id = 0, 'Start', color='red', comment='', order=0, containerId='')
            } catch (error) {
                console.info("If it fails here: you can usually ignore it. ((It's because of the manual setting of id = 0 which is a unique identifier.))");   
                console.error(error)
            }            
            resolve();
        };

        request.onerror = (event) => {
            console.error("Error opening IndexedDB:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// instead, backgroundimage = '' as a default. -- Also, there was some error with this function anyway
// Fetch default background image and store it in the database
//async function fetchDefaultBackgroundImage() {
//    const defaultImageUrl = "https://media.istockphoto.com/id/539271875/es/foto/bobinado-mountain-road-sin-coches.webp?s=1024x1024&w=is&k=20&c=DlVy6JBde8xx3DKIpaWec8KT1IJiQ8DMgD0Twu4CrEI=";
//
//    try {
//        const response = await fetch(defaultImageUrl);
//        const blob = await response.blob();
//
//        // Open a transaction to the "background" store
//        const transaction = db.transaction(["background"], "readwrite");
//        const store = transaction.objectStore("background");
//
//        // Store the image in the database
//        await new Promise((resolve, reject) => {
//            const request = store.put({ id: "background", image: blob });
//            request.onsuccess = () => {
//                console.log("Default background image stored successfully.");
//                resolve();
//            };
//            request.onerror = (event) => {
//                console.error("Error storing default background image:", event.target.errorCode);
//                reject(event.target.errorCode);
//            };
//        });
//    } catch (error) {
//        console.error("Error fetching default background image:", error);
//    }
//}

// Add new container to IndexedDB
function addContainerToDB(id, name, parentPageId) {
    return new Promise((resolve, reject) => {
        console.log('parentID =', parentPageId)
        const transaction = db.transaction(["containers"], "readwrite");
        const store = transaction.objectStore("containers");
        const request = store.add({ id, name, parentPageId});

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.errorCode);
    });
}

function addFullContainerToDB(id, name, parentPageId, type, color, order) {
    return new Promise((resolve, reject) => {
        console.log('parentID =', parentPageId)
        const transaction = db.transaction(["containers"], "readwrite");
        const store = transaction.objectStore("containers");
        const request = store.add({id, name, parentPageId, type, color, order});

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.errorCode);
    });
}

// Get all containers with the specified parentPageId from IndexedDB
function getPageContainers(parentPageId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["containers"], "readonly");
        const store = transaction.objectStore("containers");
        // not using the index search because of trouble in the implementation
        const request = store.getAll(); // Fetch all containers
        
        request.onsuccess = () => {
            const filteredArray = request.result.filter(item => item.parentPageId === parentPageId);
            console.log('result:', filteredArray);
            resolve(filteredArray);
        };
        request.onerror = (event) => reject(event.target.errorCode);
    });
}

// Function to get a container by its ID from IndexedDB
function getContainerById(containerId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["containers"], "readonly");
        const store = transaction.objectStore("containers");
        const request = store.get(containerId);

        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result); // Return the container object
            } else {
                reject(`Container with ID ${containerId} not found.`);
            }
        };

        request.onerror = (event) => {
            console.error("Error fetching container:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

function getContainersByParentPageId(parentPageId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["containers"], "readonly");
        const store = transaction.objectStore("containers");

        const request = store.getAll(); // Fetch all containers

        request.onsuccess = () => {
            const allContainers = request.result;

            // Filter the containers by parentPageId
            const filteredContainers = allContainers.filter(container => {
                const parsedParentPageId = typeof parentPageId === "string" ? parseInt(parentPageId, 10) : parentPageId;
                return container.parentPageId === parsedParentPageId;
            });

            console.log(`Filtered containers with parentPageId=${parentPageId}:`, filteredContainers);
            resolve(filteredContainers);
        };

        request.onerror = (event) => {
            console.error("Error fetching all containers:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

async function deleteContainerAndLinks(containerId) {
    // Delete links associated with this container
    const transactionLinks = db.transaction(["bookmarks"], "readwrite");
    const bookmarksStore = transactionLinks.objectStore("bookmarks");
    const links = await getBookmarksByContainer(containerId);
    if (links){
        for (const link of links) {
            //await bookmarksStore.delete(link.id);
            bookmarksStore.delete(link.id);
        }
    }
    const pages = await getPagesByContainer(containerId);
    console.log('all Pages:', pages);
    if (pages){
        for (const page of pages) {
            console.log('deleting page:', page);
            await deletePageFromDB(page.id);
        }
    }

    // Delete the container
    const transactionContainer = db.transaction(["containers"], "readwrite");
    const containerStore = transactionContainer.objectStore("containers");
    containerStore.delete(containerId);
}

// Get bookmarks by container ID
function getBookmarksByContainer(containerId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["bookmarks"], "readonly");
        const store = transaction.objectStore("bookmarks");
        const index = store.index("containerId");

        // Ensure containerId is the correct type, assuming integer storage
        const parsedContainerId = typeof containerId === 'string' ? parseInt(containerId, 10) : containerId;
        console.log('ContainerID to parse:', parsedContainerId);
        const request = index.getAll(parsedContainerId);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error("Error fetching bookmarks by containerId:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// Get bookmarks by container ID
function getPagesByContainer(containerId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["pages"], "readonly");
        const store = transaction.objectStore("pages");
        const index = store.index("containerId");
        // Ensure containerId is the correct type, assuming integer storage
        const parsedContainerId = typeof containerId === 'string' ? parseInt(containerId, 10) : containerId;
        const request = index.getAll(parsedContainerId);
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = (event) => {
            console.error("Error fetching pages by containerId:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

function addBookmark(name, url, color, comment, order, containerId) {
    return new Promise((resolve, reject) => {
        //const Id = Date.now(); // Use timestamp as unique ID
        const transaction = db.transaction(["bookmarks"], "readwrite");
        const store = transaction.objectStore("bookmarks");
        const request = store.add({name, url, color, comment, order, containerId });

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error("Error adding bookmark:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

function addPage(id, name, color, comment, order, containerId, image) {
    return new Promise(async (resolve, reject) => {
        const transaction = db.transaction(["pages"], "readwrite");
        const store = transaction.objectStore("pages");
        const request = await store.add({ id, name, color, comment, order, containerId, image});
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = (event) => {
            console.error("Error adding page:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

function getBookmarks() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["bookmarks"], "readonly");
        const store = transaction.objectStore("bookmarks");
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error("Error fetching bookmarks:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

function getBookmarkById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["bookmarks"], "readonly");
        const store = transaction.objectStore("bookmarks");
        const request = store.get(id);

        request.onsuccess = () => {
            const requestcopy = request.result;
            resolve(requestcopy);
        };

        request.onerror = (event) => {
            console.error("Error retrieving bookmark by ID:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

function getPageById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["pages"], "readonly");
        const store = transaction.objectStore("pages");
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error("Error retrieving pages by ID:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// Update Container Order upon drop
async function updateContainerOrder(id, newOrder) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["containers"], "readwrite");
        const store = transaction.objectStore("containers");
        const request = store.get(id);
        
        request.onsuccess = () => {
            const data = request.result;
            data.order = newOrder;

            const updateRequest = store.put(data);
            updateRequest.onsuccess = () => {
                console.log("container order updated successfully:", data);
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

// Update a bookmark by ID
async function updateBookmark(id, newName, newUrl, newColor, newComment, newOrder, newContainerId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["bookmarks"], "readwrite");
        const store = transaction.objectStore("bookmarks");
        const request = store.get(id);
        const newContainerIdInt = parseInt(newContainerId, 10); // Ensure containerId is an integer
        
        request.onsuccess = () => {
            const data = request.result;
            data.name = newName;
            data.url = newUrl;
            data.color = newColor;
            data.comment = newComment;
            data.order = newOrder;
            data.containerId = newContainerIdInt;

            const updateRequest = store.put(data);
            updateRequest.onsuccess = () => {
                console.log("Bookmark updated successfully:", data);
                resolve();
            };
            updateRequest.onerror = (event) => {
                console.error("Error updating bookmark:", event.target.errorCode);
                reject(event.target.errorCode);
            };
        };

        request.onerror = (event) => {
            console.error("Error retrieving bookmark:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// Update a page by ID
function updatePage(id, newName, newColor, newComment, newOrder, newContainerId, image) {
    return new Promise((resolve, reject) => {
        console.log("Updating page:", { id, newName, newColor, newComment, newOrder, newContainerId, image });
        const transaction = db.transaction(["pages"], "readwrite");
        const store = transaction.objectStore("pages");
        const request = store.get(id);
        const newContainerIdInt = parseInt(newContainerId, 10); // Ensure containerId is an integer

        request.onsuccess = () => {
            const data = request.result;
            data.name = newName;
            data.color = newColor;
            data.comment = newComment;
            data.order = newOrder;
            data.containerId = newContainerIdInt;
            data.image = image;

            const updateRequest = store.put(data);
            updateRequest.onsuccess = () => {
                console.log("Page updated successfully:", data);
                resolve();
            };
            updateRequest.onerror = (event) => {
                console.error("Error updating page:", event.target.errorCode);
                reject(event.target.errorCode);
            };
        };

        request.onerror = (event) => {
            console.error("Error retrieving page:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// Delete a bookmark by ID
function deleteBookmark(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["bookmarks"], "readwrite");
        const store = transaction.objectStore("bookmarks");
        const request = store.delete(id);

        request.onsuccess = resolve;
        request.onerror = (event) => {
            console.error("Error deleting bookmark:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// Delete a bookmark by ID
async function deletePageFromDB(id) {
    return new Promise(async (resolve, reject) => {
        const subcontainers = await getContainersByParentPageId(id);
        if (subcontainers){
            subcontainers.forEach(async subcontainer => {
                await deleteContainerAndLinks(subcontainer.id);
            });
        }
        const transaction = db.transaction(["pages"], "readwrite");
        const store = transaction.objectStore("pages");
        const request = store.delete(id);
        request.onsuccess = resolve;
        request.onerror = (event) => {
            console.error("Error deleting page:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

async function loadSettings(pageId) {
    const page = await getPageById(pageId);
    const transaction = db.transaction("settings", "readonly");
    const settingsStore = transaction.objectStore("settings");
    document.querySelector('h1').innerText = page.name || "NoHomepage";
    document.querySelector('title').innerText = "My Bookmarks";

    settingsStore.get(1).onsuccess = (event) => {
        const settings = event.target.result;
        if (settings) {
            document.querySelector('title').innerText = settings.title || "My Bookmarks";
            console.log("Updating Title:", settings.title);
        }
    };

    transaction.onerror = (event) => {
        console.error("Error loading settings:", event.target.errorCode);
    };
}


async function saveSettings() {
    const newTitle = document.getElementById('mainTitle').value;
    const fileInput = document.getElementById('backgroundImageUpload'); // File input for local image upload
    const newFile = fileInput.files[0]; // Get the selected file
    if (newFile) {
        const blob = await newFile.arrayBuffer(); // Convert file to Blob
        const fileBlob = new Blob([blob], { type: newFile.type });
        await updatePage(id=0, newTitle, color = "", comment = '', order = 0, newContainerId = '', image = fileBlob);
    }else{
        await updatePage(id = 0, newTitle);
    }

    try {
        // Save the settings data
        const settingsTransaction = db.transaction("settings", "readwrite");
        const settingsStore = settingsTransaction.objectStore("settings");

        const settingsData = { id: 1, title: newTitle };
        await new Promise((resolve, reject) => {
            const request = settingsStore.put(settingsData);
            request.onsuccess = resolve;
            request.onerror = (event) => reject(event.target.errorCode);
        });
        hideSettingsPopup(); // Close the settings popup
    } catch (error) {
        console.error("Error saving settings:", error);
    }
}

async function exportDatabase() {
    try {
        const exportData = {};
        
        for (const storeName of db.objectStoreNames) {
            const transaction = db.transaction(storeName, "readonly");
            console.log('Storename:', storeName);
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            const data = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            // Wait for transaction to complete
            await new Promise((resolve, reject) => {
                transaction.oncomplete = () => {
                    console.log(`Transaction for store "${storeName}" completed.`);
                    resolve();
                };
                transaction.onerror = (event) => {
                    console.error(`Transaction error for store "${storeName}":`, event.target.error);
                    reject(event.target.error);
                };
            });

            // Handle page.image conversion for "pages" store after transaction
            if (storeName === "pages") {
                for (const item of data) {
                    if (item.image && item.image !== '' && item.image instanceof Blob) {
                        console.log('Queueing image conversion for item:', item);
                        console.log('Inspecting Blob:', item.image);
                        try {
                            item.image = await blobToBase64(item.image);
                            console.log('Conversion success:', item);
                        } catch (error) {
                            console.warn('Error converting image, clearing image field:', error);
                            item.image = '';
                        }
                    } else if (item.image) {
                        console.log('Setting image to zero:', item);
                        item.image = '';
                    } else {
                        item.image = '';
                        console.log('Missing image property at:', item);
                    }
                }
            }
            exportData[storeName] = data;
        }

        console.log('Done 3');

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "BookmarksDB.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log("Database exported successfully.");
    } catch (error) {
        console.error("Error exporting database:", error);
    }
}


async function importDatabase(event) {
    const file = event.target.files[0];
    let homePageImage;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importData = JSON.parse(e.target.result);
            // Rehydrate page.image from Base64 strings
            for (const page of importData.pages || []) {
                if (page.image && page.image != '') {
                    page.image = await base64ToBlob(page.image);
                    if (page.id == 0){
                        homePageImage = page.image;
                    }
                }
            }

            // Order of processing: pages -> containers -> bookmarks
            const processingOrder = ["pages", "containers", "bookmarks"];
            const pageIdMap = {}; // Map of old-to-new page IDs
            const containerIdMap = {}; // Map of old-to-new container IDs

            // Create a new "Import" page
            const importedPageName = file.name.replace(".json", ""); // Use file name as a base
            const newImportPageId = Date.now();
            // Check if "Import" container exists, otherwise create it
            const importContainer = await ensureImportContainer();
            // Create a new page under the "Import" container
            const importedPageId = await createNewPageInImportContainer(importContainer.id, file.name, homePageImage);
            //await addPage(newImportPageId, `Imported: ${importedPageName}`, "#808080", "Imported database content", 0, 0, homePageImage);
            // First Pass: Assign new IDs
            for (const storeName of processingOrder) {
                const items = importData[storeName] || [];
                let nextId = await getNextId(storeName);

                for (const item of items) {
                    if (storeName === "pages") {
                        // Map old page ID to new page ID
                        const oldPageId = item.id;
                        item.id = nextId++;
                        pageIdMap[oldPageId] = item.id;

                        // Pages reference containers via containerId
                        if (containerIdMap[item.containerId]) {
                            item.containerId = containerIdMap[item.containerId];
                        }
                        if (oldPageId == 0){
                            console.log('old Homepage:', item);
                        }
                    } else if (storeName === "containers") {
                        // Map old container ID to new container ID
                        const oldContainerId = item.id;
                        item.id = nextId++;
                        containerIdMap[oldContainerId] = item.id;

                        // If parentPageId is 0, assign the new Import Page ID
                        item.parentPageId = item.parentPageId === 0 ? importedPageId : pageIdMap[item.parentPageId] || item.parentPageId;
                    } else if (storeName === "bookmarks") {
                        // Bookmarks reference containers via containerId
                        console.log('bookmark before:', item);
                        if (containerIdMap[item.containerId]) {
                            item.containerId = containerIdMap[item.containerId];
                        }
                        item.id = nextId++;
                        console.log('bookmark after:', item);
                    }
                }
            }

            // Second Pass: Update cross-references (e.g., page.containerId to new IDs)
            for (const page of importData.pages || []) {
                if (containerIdMap[page.containerId]) {
                    page.containerId = containerIdMap[page.containerId];
                }
            }
            //// Second Pass: Update cross-references (e.g., page.containerId to new IDs)
            //for (const bookmark of importData.bookmarks || []) {
            //    if (containerIdMap[bookmark.containerId]) {
            //        bookmark.containerId = containerIdMap[bookmark.containerId];
            //        console.log('newly assigned Bookmark ID');
            //    }
            //}

            // Import the updated data
            for (const storeName of processingOrder) {
                await new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, "readwrite");
                    const store = transaction.objectStore(storeName);

                    const items = importData[storeName] || [];
                    for (const item of items) {
                        const addRequest = store.add(item);
                        addRequest.onsuccess = () => {};
                        addRequest.onerror = (event) => reject(event.target.error);
                    }

                    transaction.oncomplete = resolve;
                    transaction.onerror = (event) => reject(event.target.error);
                });
            }

            console.log("Database imported successfully.");
            displayContainers(0); // Refresh the UI
        } catch (error) {
            console.error("Error importing database:", error);
        }
    };

    reader.readAsText(file);
}



async function getNextId(storeName) {
    return new Promise(async (resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = await store.getAll();

        request.onsuccess = () => {
            const allItems = request.result;
            const maxId = allItems.length > 0 ? Math.max(...allItems.map(item => item.id)) : 0;
            resolve(maxId + 1);
        };

        request.onerror = (event) => {
            console.error(`Error retrieving next ID for ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Helper function to convert Blob to Base64
async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (e) => reject(new Error(`FileReader failed: ${e.target.error?.code}`));
        console.log('blob:', blob);
        reader.readAsDataURL(blob); // Converts Blob to Base64 string
    });
}


// Helper function to convert Base64 string back to Blob
async function base64ToBlob(base64) {
    try {
        const [metadata, data] = base64.split(",");
        const mime = metadata.match(/:(.*?);/)[1];
        const binary = atob(data);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        console.log('SUCCESS');
        return new Blob([new Uint8Array(array)], { type: mime });
    } catch (error) {
        console.log('skipped image conversion', error, base64);
        return '';
    }
}