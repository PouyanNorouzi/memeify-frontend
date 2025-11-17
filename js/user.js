import { API_LINK } from "./modules/apiLink.js";

const API_CAPTION_BASE = `${API_LINK}/api/caption`

document.getElementById("generateBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload an image first!");
        return;
    }

    // Show preview
    const previewImg = document.getElementById("previewImg");
    previewImg.src = URL.createObjectURL(file);
    document.getElementById("resultSection").style.display = "block";
    document.getElementById("captionResult").textContent = "Generating...";

    // Prepare FormData
    const formData = new FormData();
    formData.append("file", file); // MUST be "file"

    try {
        // CHANGED: Retrieve JWT token from localStorage (key is 'memeify_token')
        const token = localStorage.getItem('memeify_token');

        // DEBUG: Log all localStorage keys to see what's actually stored
        console.log('All localStorage keys:', Object.keys(localStorage));
        console.log('Token value:', token);

        // CHANGED: Check if token exists (user must be logged in)
        if (!token) {
            alert("Please log in first!");
            document.getElementById("captionResult").textContent = "Error: Not authenticated.";
            return;
        }

        const response = await fetch(API_CAPTION_BASE, {
            method: "POST",
            // CHANGED: Added Authorization header with Bearer token for authentication
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            // CHANGED: Enhanced error handling to show 401 (Unauthorized) errors
            if (response.status === 401) {
                throw new Error("Unauthorized: Please log in first.");
            }
            throw new Error("Failed to generate caption.");
        }

        const data = await response.json();
        document.getElementById("captionResult").textContent = data.caption;
    } catch (error) {
        document.getElementById("captionResult").textContent = "Error generating caption.";
        console.error(error);
    }
});
