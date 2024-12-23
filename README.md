# Bookmark Manager

A powerful, hierarchical Bookmark Manager that allows you to organize bookmarks, pages, and containers in a scalable, multi-level structure. Built entirely on client-side technologies like IndexedDB, this application provides a flexible and private way to manage your bookmarks without requiring a backend server.

---

## Features

### 1. Multi-Level Structure
- **Containers**: Act as folders to store links or sub-pages.
- **Pages**: Nested pages that can hold additional containers or links.
- **Bookmarks**: Links with customizable metadata, such as name, URL, color, and comments.

### 2. Dynamic Navigation
- **Breadcrumb Navigation**: Keep track of your location within the hierarchy.
- **Back Navigation**: Quickly return to previous levels.

### 3. Customizable Elements
- **Containers**:
  - Editable names, colors, and types (links or pages).
  - Supports drag-and-drop reordering.
- **Pages**:
  - Customizable background images.
  - Metadata including name, comments, and associated containers.
- **Bookmarks**:
  - Editable links with descriptions, colors, and order.

### 4. Import/Export
- Export the entire database as a JSON file.
- Import databases seamlessly:
  - Automatically reassigns IDs to prevent conflicts.
  - Imported content is placed into a dedicated "Import" section.

### 5. Local Storage
- Built on IndexedDB for offline functionality.
- All data is stored locally for privacy.

### 6. Drag-and-Drop Reordering
- Reorder bookmarks, pages, and containers interactively.
- Changes are reflected in the database to ensure persistence.

### 7. Limitations and DANGERS
- **Under certain curcumstances, your database of bookmarks might GET LOST or DELETED!!**
- **Using this tool will be on your own risk**
- In order to minimize any potential damage, it might be wise, to use the export function of this tool every once in a while. This way, you can always restore any losses up to your last saving point.  
- The database is stored in the backend of the browser that you are using which means:
  - when resetting or deinstalling your browser, you will loose all of your stored bookmarks forever. Just like it happens with those which are stored in the browser in the classical way.
  - Using this tool in multiple browsers at the same time is not possible (just like the Chrome browser can not access the bookmarks that you stored in Firefox).
  - Exporting your database before doing a browser reset will save your Bookmarks and your structures. Once the reset is done, you can just import them back in. 

---

## Installation
- Download the **Linktree.html** in the folder *User version*
- Double clickt the downloaded file and start interacting with the Page that you see
- If you are looking for further instructions / advice, start by having a look at my YouTube video about this project: (Link will be added here as soon as the video is online)

## Contribution
- I recommend to use the *Developer version* ofc.. There is no difference in the code, it's just spread across more files. 
- Please feel free to contribute to this repository and add whatever you are still missing. Just a couple of ideas here:
  - Improving coding style by 
    - sorting the functions better and possibly adding some .js files for a better overview
    - simplify the passing of arguments (look at some functions and you'll see what I mean)
  - Double check wether the deletion function works as intended and debug if needed
  - Add export functions for single / specific containers
  - Improve the styling of the page title. When using a dark image, the title is barely readable
  - Come up with methods for a storage system which is independend from the browser (Writing to local files won't be allowed, thus, working with an sql db on a local server could be an option)
  - Create workarounds for the issue that the database is gone as soon as the name of the .html file is being changed

- Please excuse that I didn't find the time and energy to tackle these problems. It is so easy to become a never ending story then... I'll move on to other projects for now. Thank you!
