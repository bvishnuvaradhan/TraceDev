const loadUsersButton = document.getElementById("loadUsers");
const result = document.getElementById("result");

loadUsersButton.addEventListener("click", loadUsers);

async function loadUsers() {
    console.log("Load Users clicked");

    try {
        const response = await fetch("/api/users");

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        const users = await response.json();

        result.textContent = JSON.stringify(users, null, 2);

    } catch (error) {
        console.error("Failed to load users:", error);
        result.textContent = "Failed to load users";
    }
}