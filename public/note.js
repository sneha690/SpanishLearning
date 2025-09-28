function openNotepad() {
    window.location.href = "notepad.html"; // Ensure this file exists in the correct directory
}
function homePage() {
    window.location.href = "qui.html"; // Update the filename if necessary
}

const notesContainer = document.querySelector(".notes-container");
const createBtn = document.querySelector(".btn2");

// Load saved notes from storage
function showNotes() {
    notesContainer.innerHTML = localStorage.getItem("notes") || "";
}
showNotes();

// Save current notesContainer content to localStorage
function updateStorage() {
    // Remove any toolbar elements before saving, so that toolbars are not restored on reload
    let toolbar = document.querySelector(".toolbar");
    if (toolbar) toolbar.remove();
    localStorage.setItem("notes", notesContainer.innerHTML);
}

// Helper: Remove any existing formatting toolbar
function removeToolbar() {
    let existingToolbar = document.querySelector(".toolbar");
    if (existingToolbar) {
        existingToolbar.remove();
    }
}

// Create a new note when the create button is clicked
createBtn.addEventListener("click", () => {
    let inputBox = document.createElement("p");
    let img = document.createElement("img");
    inputBox.className = "input-box";
    inputBox.setAttribute("contenteditable", "true");
    // Set a minimum height; it will expand on focus
    inputBox.style.minHeight = "50px";
    img.src = "images/delete.png";
    inputBox.appendChild(img);
    notesContainer.appendChild(inputBox);
    updateStorage();
});

// Event delegation for the notes container
notesContainer.addEventListener("click", function(e) {
    // --- Deletion Logic ---
    if (e.target.tagName === "IMG") {
        // When the delete image is clicked, remove its parent note
        e.target.parentElement.remove();
        updateStorage();
        removeToolbar();
    }
    // --- Redirect to Editor Logic ---
    else if (e.target.tagName === "P") {
        // Redirect to editor.html with the note's content passed as a query parameter.
        let noteContent = encodeURIComponent(e.target.innerText);
        window.location.href = `editor.html?note=${noteContent}`;
    }
});

