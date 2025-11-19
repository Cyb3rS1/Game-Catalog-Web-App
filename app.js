// Grab elements
const searchInput = document.getElementById("q");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const statusDiv = document.getElementById("status");
const emptyDiv = document.getElementById("empty");
const API_BASE = "http://gamecatalogapp.us-east-2.elasticbeanstalk.com";

// landing page elements
let landingPage = document.getElementById("landing-page");
let landingPageLinks = document.querySelectorAll(".landing-page-link");
let currentModal = landingPage;
let helloMessages = document.querySelectorAll(".hello-message");
let profilePictures = document.querySelectorAll(".profile-picture");
let navbarTogglers = document.querySelectorAll(".navbar-toggler");

// log in page elements
let logInModal = document.getElementById("log-in-modal");
let logInModalGreeting = document.getElementById("log-in-modal-greeting");
let signUpTab = document.getElementById("sign-up-tab");
let logInTab = document.getElementById("log-in-tab");
let mode;

let signUpFields = document.querySelectorAll(".sign-up-field");
let logInButton = document.getElementById("log-in-button");
const errorMessage = document.getElementById("error-message");
const logOutLink = document.getElementById("log-out-link");


const nicknameField = document.getElementById("nick-name");
const emailField = document.getElementById("email");
const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");


// Profile/Dashboard elements
const dashboardModal = document.getElementById("dashboard-modal");
let dashboardMessage = document.getElementById("dashboard-message");
const profileModal = document.getElementById("profile-modal");
let profileMessage = document.getElementById("profile-message");


// buttons
let viewDashboardLinks = document.querySelectorAll(".view-dashboard-link");
let logInLinks = document.querySelectorAll(".log-in-link");
let profileLinks = document.querySelectorAll(".profile-link");


let currentIndex = 0;

/* document.getElementById("clear-users").addEventListener("click", () => {
  // Remove all user-specific data
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("user_")) localStorage.removeItem(key);
  });

  // Remove shared keys
  localStorage.removeItem("currentUser");
  localStorage.removeItem("users"); // ← remove any legacy users array

  showToast("🧹 All user accounts and data have been cleared.", "info");
}); */

let userInfo = {

  name: undefined,
  username: undefined,
  password: undefined,
  profile_picture: undefined,
  saved_playlists: {},
  played_games: [],

}

// 🔹 Load a specific user’s data
function loadUser(username) {
   const userData = localStorage.getItem(`user_${username}`);
  return userData ? JSON.parse(userData) : null;
}

// 🔹 Save a specific user’s data
function saveUser(user) {
  if (!user || !user.username) return;
  localStorage.setItem(`user_${user.username}`, JSON.stringify(user));
}

// 🔹 Get the currently logged-in user object
function getCurrentUser() {
  const username = localStorage.getItem("currentUser");
  return username ? loadUser(username) : null;
}

function showModal(modalToShow) {

  hideElement(currentModal);

  // hideElement(landingPage);
  showElement(modalToShow);
  currentModal = modalToShow;

}

const showProfileModal = () => showModal(profileModal);
const showDashboardModal = () => showModal(dashboardModal);

function refreshUIAfterLogin() {

  console.log("refreshUIAfterLogin function executed!");
  const currentUser = getCurrentUser(); // use your existing helper
  if (!currentUser) return;

  // Update dashboard and profile headings
  dashboardMessage.innerHTML = `${currentUser.name}'s Dashboard`;
  profileMessage.innerHTML = `${currentUser.name}'s Profile`;

  // Populate hello messages
  helloMessages.forEach(message => {
    message.textContent = `Hello ${currentUser.name || currentUser.username}!`;
  });

  // Profile links → open profile modal
  profileLinks.forEach(link => {

    link.removeEventListener("click", handleLogInClick);
    link.addEventListener("click", showProfileModal);

  });

  // Dashboard links → open dashboard modal
  viewDashboardLinks.forEach(link => {

    showElement(link);
    link.addEventListener("click", showDashboardModal);
  });

  // Clear old dashboard before repopulating
  const dashboardContainer = document.querySelector("#dashboard-modal .container-fluid");
  if (dashboardContainer) dashboardContainer.innerHTML = "";

  // Hide "Log In" links since they're already logged in
  logInLinks.forEach(hideElement);
  
  showElement(logOutLink);
}


function logOutUser() {
  console.log("logOutUser function executed!");

  localStorage.removeItem("currentUser");
  showToast("👋 You’ve been logged out successfully!", "success");

  refreshUIAfterLogout()
}

function refreshUIAfterLogout() {
  console.log("refreshUIAfterLogout function executed!");

  // clear sensitive info in memory
  nicknameField.value = "";
  emailField.value = "";
  usernameField.value = "";
  passwordField.value = "";

  // Profile links → open profile modal
  profileLinks.forEach(link => {

    link.removeEventListener("click", showProfileModal);
    link.addEventListener("click", handleLogInClick);

    showElement(link);

  });

  viewDashboardLinks.forEach(link => hideElement(link));
  logInLinks.forEach(link => showElement(link));
  hideElement(logOutLink);

  helloMessages.forEach(message => {
    message.textContent = "Hello Gamer!";
  });

  showModal(landingPage)
  console.log("landing page shown!");

}

function handleLogInClick(e) {

  console.log("handleLogInClick function executed!");

  e.preventDefault();
  e.stopPropagation(); // Prevent nav collapse

  showElement(logInModal);
  console.log("login modal shown!");

  currentModal = logInModal;
  mode = "login";
}

function checkLoginStatus() {
  console.log("checkLoginStatus function executed!");

  const currentUser = getCurrentUser();

  if (currentUser) {
    console.log(`✅ Logged in as ${currentUser.username}`);
    refreshUIAfterLogin(); // Rebuild your UI to match the logged-in state
    renderDashboardPlaylists(currentUser);
  } else {
    console.log("🚫 No user logged in");
    console.log("🚫 No valid user session found — logging out.");
    
    refreshUIAfterLogout(); // optional: a function that handles the reset
  }

}

function openGameDetailsModal(game) {
  const modalEl = document.getElementById("gameDetailsModal");
  const modal = new bootstrap.Modal(modalEl);

  const screenshotImg = document.getElementById("modal-cover-img");
  const titleEl = document.getElementById("modal-title");
  const yearEl = document.getElementById("modal-year");
  const platformsEl = document.getElementById("modal-platforms");
  const genresEl = document.getElementById("modal-genres");
  const summaryEl = document.getElementById("modal-summary");

  if (!screenshotImg || !titleEl || !yearEl || !platformsEl || !genresEl || !summaryEl) {
    console.error("Modal elements not found in DOM!");
    return;
  }

  // --- Use first screenshot if available, otherwise fallback to cover ---
  if (game.screenshots && game.screenshots.length > 0) {
    screenshotImg.src = "https:" + game.screenshots[0].url.replace("t_thumb", "t_720p");
  } else if (game.cover && game.cover.url) {
    screenshotImg.src = "https:" + game.cover.url.replace("t_thumb", "t_720p");
  } else {
    screenshotImg.src = "./assets/fallback-image.png";
  }
  screenshotImg.alt = game.name || "Game cover";

  // Title
  titleEl.textContent = game.name || "Untitled";

  // Release Year
  if (game.first_release_date) {
    const year = new Date(game.first_release_date * 1000).getFullYear();
    yearEl.textContent = year;
    yearEl.style.display = "inline";
  } else {
    yearEl.style.display = "none";
  }

  // Platforms
  platformsEl.innerHTML = "";
  if (game.platforms) {
    game.platforms.forEach(p => {
      const badge = document.createElement("span");
      badge.className = "badge bg-info me-1";
      badge.textContent = p.name;
      platformsEl.appendChild(badge);
    });
  }

  // Genres
  genresEl.innerHTML = "";
  if (game.genres) {
    game.genres.forEach(g => {
      const badge = document.createElement("span");
      badge.className = "badge bg-dark me-1";
      badge.textContent = g.name;
      genresEl.appendChild(badge);
    });
  }

  // Summary
  summaryEl.textContent = game.summary || "No summary available.";

  // --- Store the game object in the modal dataset ---
  modalEl.dataset.game = JSON.stringify(game);

  // Show modal
  modal.show();
}

// shows a BootStrap toast that unobtrusively notifies the user of success/failure
function showToast(message, type = "success") {
  const toastContainer = document.querySelector(".toast-container");

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();

  // Remove toast from DOM when hidden
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

let selectedGame = null; // holds the game from the Game Details Modal

// -------------------- Add a game to a playlist modal --------------------

function openAddToPlaylistModal(game) {

  const currentUser = getCurrentUser();

  if (!currentUser) {
    showToast("Please log in first to add games to a playlist!", "info");
    return;
  }

  // Try to load the user, or create them if missing
  let user = loadUser(currentUser);
  if (!user) {
    user = { username: currentUser, saved_playlists: {} };
    saveUser(user);
  }

  if (!user.saved_playlists) user.saved_playlists = {};

  const playlistSelect = document.getElementById("playlistSelect");
  const playlistContainer = document.getElementById("playlistSelectContainer");
  const newPlaylistContainer = document.getElementById("newPlaylistContainer");

  // Reset modal state
  newPlaylistContainer.classList.add("d-none");
  playlistContainer.classList.remove("d-none");
  playlistSelect.innerHTML = "";

  // Populate existing playlists
  const playlistNames = Object.keys(user.saved_playlists);
  if (playlistNames.length > 0) {
    playlistNames.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      playlistSelect.appendChild(opt);
    });
  } else {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No playlists found.";
    playlistSelect.appendChild(opt);
  }

  // Open modal
  const modal = new bootstrap.Modal(document.getElementById("addToPlaylistModal"));
  modal.show();

  // Handle "Create New Playlist" button
  document.getElementById("newPlaylistBtn").onclick = () => {
    playlistContainer.classList.add("d-none");
    newPlaylistContainer.classList.remove("d-none");

    console.log("newPlaylistContainer shown!")
  };

  // Handle "Cancel" new playlist
  document.getElementById("cancelNewPlaylist").onclick = () => {
    newPlaylistContainer.classList.add("d-none");
    playlistContainer.classList.remove("d-none");

    console.log("newPlaylistContainer hidden!")
  };

  // Handle "Save" new playlist
  document.getElementById("saveNewPlaylist").onclick = () => {
    const newName = document.getElementById("newPlaylistName").value.trim();
    if (!newName) return showToast("Please enter a name.", "info");
    if (user.saved_playlists[newName]) return alert("That playlist already exists!", "info");

    user.saved_playlists[newName] = [];
    saveUser(user);

    const opt = document.createElement("option");
    opt.value = newName;
    opt.textContent = newName;
    playlistSelect.appendChild(opt);
    playlistSelect.value = newName;

    showToast(`💾 Playlist "${newName}" created!`, "success");
  };

  // Handle "Add Game"
  document.getElementById("confirmAddToPlaylist").onclick = () => {
    const selectedPlaylist = playlistSelect.value;
    if (!selectedPlaylist) return showToast("Please select or create a playlist first.");

    // Reload the most up-to-date user from storage
    const currentUser = getCurrentUser();
    let user = loadUser(currentUser.username);

    if (!user.saved_playlists[selectedPlaylist]) {
      user.saved_playlists[selectedPlaylist] = [];
    }

    // Only add if not already in the playlist
    const alreadyAdded = user.saved_playlists[selectedPlaylist].some(g => g.id === game.id);
    if (!alreadyAdded) {
      user.saved_playlists[selectedPlaylist].push(game);
      saveUser(user);

      showToast(`✅ "${game.name}" added to playlist "${selectedPlaylist}"!`, "success");

      // Reload dashboard from the latest saved data
      const updatedUser = getCurrentUser();
      renderDashboardPlaylists(updatedUser);

      modal.hide();

      // If this playlist is being viewed, refresh its contents too
      const heading = document.querySelector(".playlist-games-heading");
      if (heading && heading.textContent.includes(selectedPlaylist)) {
        renderGamesInPlaylist(selectedPlaylist, user.saved_playlists[selectedPlaylist]);
      }
    } else {
      showToast(`⚠️ "${game.name}" is already in playlist "${selectedPlaylist}".`, "warning");
    }
  };

  
}

// -------------------- Render dashboard playlists --------------------
function renderDashboardPlaylists(user) {
  const dashboard = document.getElementById("dashboard-modal");
  if (!dashboard) return;

  // Remove old container if present
  const oldContainer = dashboard.querySelector(".playlists-container");
  if (oldContainer) oldContainer.remove();

  // ---------------- Collapse All Button ----------------
  let collapseAllBtn = dashboard.querySelector("#collapse-all-btn");
  if (!collapseAllBtn) {
    collapseAllBtn = document.createElement("button");
    collapseAllBtn.id = "collapse-all-btn";
    collapseAllBtn.className = "btn btn-warning mb-3";
    collapseAllBtn.textContent = "Collapse All Playlists";
    dashboard.prepend(collapseAllBtn);

    collapseAllBtn.addEventListener("click", () => {
      const allCollapses = dashboard.querySelectorAll(".playlist-collapse.show");
      allCollapses.forEach((c) => {
        bootstrap.Collapse.getInstance(c)?.hide();
      });
    });
  }

  const container = document.createElement("div");
  container.className = "playlists-container row g-3 mt-3";

  const playlists = user.saved_playlists || {};

  if (Object.keys(playlists).length === 0) {
    const msg = document.createElement("p");
    msg.className = "text-center text-muted mt-3";
    msg.textContent = "You haven’t created any playlists yet. Start by adding games!";
    container.appendChild(msg);
  }

  Object.entries(playlists).forEach(([name, games], index) => {
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

    // Playlist card (click to toggle collapse)
    const card = document.createElement("div");
    card.className =
      "playlist-card card text-center p-2 bg-secondary text-light h-100 d-flex flex-column";
    card.style.cursor = "pointer";

    const title = document.createElement("h5");
    title.textContent = name;
    title.className = "mb-2 text-truncate";
    card.appendChild(title);

    const cover = document.createElement("div");
    cover.className = "playlist-cover mb-2 flex-grow-1";
    cover.style.height = "150px";
    cover.style.backgroundSize = "cover";
    cover.style.backgroundPosition = "center";
    cover.style.borderRadius = "6px";
    cover.style.backgroundImage =
      games.length > 0 && games[0].cover?.url
        ? `url("https:${games[0].cover.url.replace("t_thumb", "t_cover_big")}")`
        : `url("./assets/fallback-image.png")`;
    card.appendChild(cover);

    const count = document.createElement("p");
    count.textContent = `${games.length} game${games.length !== 1 ? "s" : ""}`;
    count.className = "mb-0";
    card.appendChild(count);

    // Collapse container (full-width, below grid)
    const collapseId = `collapse-${index}-${Date.now()}`;

    // Attach collapse toggle on the card
    card.setAttribute("data-bs-toggle", "collapse");
    card.setAttribute("data-bs-target", `#${collapseId}`);
    card.setAttribute("aria-expanded", "false");
    card.setAttribute("aria-controls", collapseId);

    // Add card to column and column to grid
    col.appendChild(card);
    container.appendChild(col);

    // After creating the grid, append the collapse BELOW the container
    const collapseDiv = document.createElement("div");
    collapseDiv.className = "collapse playlist-collapse mt-3 w-100";
    collapseDiv.id = collapseId;

    const collapseInner = document.createElement("div");
    collapseInner.className = "collapse-inner bg-dark rounded-4 p-3";
    collapseDiv.appendChild(collapseInner);

    // Render games only when expanded
    collapseDiv.addEventListener("show.bs.collapse", () => {
      collapseInner.innerHTML = "";
      renderGamesInPlaylist(name, games, collapseInner);
      collapseDiv.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Insert the collapse right after the playlist column
    col.insertAdjacentElement("afterend", collapseDiv);
  });

  dashboard.appendChild(container);
}

document.addEventListener("shown.bs.collapse", (e) => {
  e.target.scrollIntoView({ behavior: "smooth", block: "center" });
});


// -------------------- Render games in a playlist (inside collapsible) --------------------
function renderGamesInPlaylist(playlistName, games, containerEl) {
  if (!containerEl) return;

  // Create horizontal scrollable container
  const wrapper = document.createElement("div");
  wrapper.className = "playlist-games-wrapper position-relative mb-3";

  const gamesContainer = document.createElement("div");
  gamesContainer.className = "playlist-games d-flex overflow-auto py-2";
  gamesContainer.style.gap = "1rem";
  gamesContainer.style.scrollSnapType = "x mandatory";
  gamesContainer.style.paddingBottom = "0.5rem";

  // Populate game cards
  games.forEach((game) => {
    const cardWrapper = document.createElement("div");
    cardWrapper.className = "flex-shrink-0";
    cardWrapper.style.width = "150px";
    cardWrapper.style.scrollSnapAlign = "start";

    const card = document.createElement("div");
    card.className = "card h-100 playlist-card-hover";
    card.style.cursor = "pointer";

    const img = document.createElement("img");
    img.className = "card-img-top";
    img.src = game.cover?.url
      ? "https:" + game.cover.url.replace("t_thumb", "t_cover_big")
      : "./assets/fallback-image.png";
    img.alt = game.name || "Game cover";
    card.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body p-2";
    const title = document.createElement("h6");
    title.className = "card-title mb-0 text-truncate text-light";
    title.textContent = game.name || "Untitled";
    body.appendChild(title);
    card.appendChild(body);

    card.addEventListener("click", () => openGameDetailsModal(game));

    cardWrapper.appendChild(card);
    gamesContainer.appendChild(cardWrapper);
  });

  // Scroll buttons
  const leftBtn = document.createElement("button");
  leftBtn.className = "scroll-btn scroll-left btn btn-dark";
  leftBtn.innerHTML = "&#8249;";
  leftBtn.style.position = "absolute";
  leftBtn.style.top = "50%";
  leftBtn.style.left = "0";
  leftBtn.style.transform = "translateY(-50%)";
  leftBtn.style.zIndex = "10";
  leftBtn.style.opacity = "0";
  leftBtn.style.transition = "opacity 0.3s";

  const rightBtn = document.createElement("button");
  rightBtn.className = "scroll-btn scroll-right btn btn-dark";
  rightBtn.innerHTML = "&#8250;";
  rightBtn.style.position = "absolute";
  rightBtn.style.top = "50%";
  rightBtn.style.right = "0";
  rightBtn.style.transform = "translateY(-50%)";
  rightBtn.style.zIndex = "10";
  rightBtn.style.opacity = "0";
  rightBtn.style.transition = "opacity 0.3s";

  leftBtn.addEventListener("click", () => {
    gamesContainer.scrollBy({ left: -200, behavior: "smooth" });
  });
  rightBtn.addEventListener("click", () => {
    gamesContainer.scrollBy({ left: 200, behavior: "smooth" });
  });

  wrapper.appendChild(gamesContainer);
  wrapper.appendChild(leftBtn);
  wrapper.appendChild(rightBtn);
  containerEl.appendChild(wrapper);

  // Show/hide arrows dynamically
  function updateScrollButtons() {
    if (gamesContainer.scrollWidth > gamesContainer.clientWidth) {
      wrapper.classList.add("has-overflow");
    } else {
      wrapper.classList.remove("has-overflow");
    }
  }

  updateScrollButtons();
  window.addEventListener("resize", updateScrollButtons);

  // Fade buttons on hover
  wrapper.addEventListener("mouseenter", () => {
    if (wrapper.classList.contains("has-overflow")) {
      leftBtn.style.opacity = "1";
      rightBtn.style.opacity = "1";
    }
  });
  wrapper.addEventListener("mouseleave", () => {
    leftBtn.style.opacity = "0";
    rightBtn.style.opacity = "0";
  });
}

// 🔹 Download current user's data as a JSON file
function downloadUserData() {
  const user = getCurrentUser();
  if (!user) {
    showToast("Please log in to back up your account!", "warning");
    return;
  }

  const blob = new Blob([JSON.stringify(user, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  const fileName = `${user.username}_backup.json`;
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`💾 Backup downloaded for ${user.username}`, "success");
}

// 🔹 Restore uploaded user data from a JSON file
function restoreUserData(file) {
  const reader = new FileReader();

  reader.onload = e => {
    try {
      const userData = JSON.parse(e.target.result);

      if (!userData.username) {
        showToast("Invalid file format: missing username.", "danger");
        return;
      }

      // Save using your naming convention
      localStorage.setItem(`user_${userData.username}`, JSON.stringify(userData));

      // Optionally set as current user
      localStorage.setItem("currentUser", userData.username);

      showToast(`✅ Account for "${userData.username}" restored successfully!`, "success");
      refreshUIAfterLogin();
    } catch (error) {
      console.error(error);
      showToast("Error restoring account. Please check the file format.", "danger");
    }
  };

  reader.readAsText(file);
}

function setUpEventListeners() {

  /// Different Links Event Listeners

  // --- Landing Page Links ---
  landingPageLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (currentModal) hideElement(currentModal);
      showElement(landingPage);
      currentModal = landingPage;
    });
  });

  // Make log-in links open the Log-In Modal
  logInLinks.forEach(link => {
    
    link.addEventListener('click', handleLogInClick);
  });

  // Dashboard links → open dashboard modal
  viewDashboardLinks.forEach(link => {

    console.log("viewDashboardLinks function executed!");
    showElement(link);
    link.addEventListener("click", showDashboardModal);
  });


  /// Log-In Modal Event Listeners ///

  // --- Tabs inside modal ---
  signUpTab.addEventListener("click", () => {
    logInModalGreeting.textContent = "Welcome!";
    logInButton.textContent = "Create Account";
    mode = "signup";
    console.log("mode = " + mode);

    errorMessage.textContent = "";
    signUpFields.forEach(showElement);
  });

  logInTab.addEventListener("click", () => {
    logInModalGreeting.textContent = "Welcome back!";
    logInButton.textContent = "Log In";
    mode = "login";
     console.log("mode = " + mode);

    errorMessage.textContent = "";
    signUpFields.forEach(hideElement);
  });

  // resets log in message and input fields when logInModal is closed
  logInModal.addEventListener("hidden.bs.modal", () => {

    // Reset modal contents
    logInModalGreeting.textContent = "Log in / Sign up";
    logInButton.textContent = "Log In";
    errorMessage.textContent = "";

    // Reset tab state (show Log In tabs and panes)
    document.getElementById("log-in-tab").classList.add("active");
    document.getElementById("sign-up-tab").classList.remove("active");

    document.getElementById("log-in-tab-pane").classList.add("show", "active");
    document.getElementById("sign-up-tab-pane").classList.remove("show", "active");

    // Clear all input fields (optional, but helps UX)
    document.querySelectorAll("#log-in-modal input").forEach(input => {
      input.value = "";
    });
  })

  // Manual validation when clicking button
  logInButton.addEventListener("click", function() {
    errorMessage.textContent = ""; // reset
    let valid = true;

    document.querySelectorAll(".modal-body input").forEach(field => {
      // only check visible fields
      if (field.offsetParent !== null && !field.value.trim()) {
        valid = false;
        field.classList.add("is-invalid"); // bootstrap red border
      } else {
        field.classList.remove("is-invalid");
      }
    });

    if (!valid) {
      errorMessage.textContent = "⚠️ Please fill in all required fields.";
      return;
    } 

    if (mode === "signup") {
      const username = usernameField.value.trim();
      const existing = loadUser(username);

      if (existing) {
        errorMessage.textContent = "⚠️ Username already exists. Please log in instead.";
        return;
      }

      const newUser = {
        name: nicknameField.value.trim(),
        username,
        password: passwordField.value.trim(),
        email: emailField.value.trim(),
        profile_picture: undefined,
        saved_playlists: {},
        played_games: []
      };

      saveUser(newUser);
      localStorage.setItem("currentUser", username);

      // alert("✅ Account created!");
      showToast("✅ Account created!", "success");

      // ✅ Automatically log them in
      localStorage.setItem("currentUser", newUser.username);
      //alert(`✅ Welcome, ${newUser.name || newUser.username}! Your account has been created and you're now logged in.`);
      showToast(`✅ Welcome, ${newUser.name || newUser.username}! Your account has been created and you're now logged in.`, "success");

      // Immediately update the interface using your existing structure
      refreshUIAfterLogin();

      // Close the modal (Bootstrap way)
      const modal = bootstrap.Modal.getInstance(logInModal);
      if (modal) modal.hide();

      console.log("login modal hidden!");
      
      // reset the currentModal back to landingPage
      currentModal = landingPage;
      console.log(currentModal);
    
    } else if (mode === "login") {
      const enteredUsername = usernameField.value.trim();
      const enteredPassword = passwordField.value.trim();
      const existing = loadUser(enteredUsername);

      if (!existing) {
        errorMessage.textContent = "⚠️ No account found with that username.";
        return;
      }

      if (existing.password !== enteredPassword) {
        errorMessage.textContent = "⚠️ Incorrect password.";
        return;
      }

      localStorage.setItem("currentUser", existing.username);
      showToast(`✅ Welcome back, ${existing.name || existing.username}!`, "success");
      refreshUIAfterLogin();
      bootstrap.Modal.getInstance(logInModal)?.hide();
    }

  });

/// Search Query Event Listeners ///

  // Add click event
  searchBtn.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (!query) {
      // alert("Please enter a game name first.");
      showToast("Please enter a game name first :)");
      return;
    }

    statusDiv.textContent = `Searching for "${query}"…`;
    resultsDiv.innerHTML = "";
    emptyDiv.style.display = "none";

    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      if (!data.length) {
        emptyDiv.style.display = "block";
        statusDiv.textContent = "No results found.";
        return;
      }

      // Render results
      data.forEach((game, index) => {
        const tpl = document.getElementById("game-card-template");
        const fragment = tpl.content.cloneNode(true);

        // Get a direct reference to the actual .card element
        const cardEl = fragment.querySelector(".card");

        // --- unique IDs ---
        const accordionId = `accordion-${index}`;
        const collapseId = `collapse-${index}`;
        const collapseEl = cardEl.querySelector(".accordion-collapse");
        const buttonEl = cardEl.querySelector(".accordion-button");

        // update IDs inside card
        cardEl.querySelector(".accordion").id = accordionId;
        collapseEl.id = collapseId;
        collapseEl.setAttribute("data-bs-parent", `#${accordionId}`);
        buttonEl.setAttribute("data-bs-target", `#${collapseId}`);
        buttonEl.setAttribute("aria-controls", collapseId);

        // Cover art
        if (game.cover?.url) {
          const coverUrl = "https:" + game.cover.url.replace("t_thumb", "t_cover_big");
          cardEl.querySelector(".cover-art").style.backgroundImage = `url("${coverUrl}")`;
        } else {
          cardEl.querySelector(".cover-art").style.backgroundImage = `url("./assets/fallback-image.png")`;
        }

        // Title
        cardEl.querySelector(".title").textContent = game.name || "Untitled";

        // Release year
        if (game.first_release_date) {
          const year = new Date(game.first_release_date * 1000).getFullYear();
          cardEl.querySelector(".year").appendChild(makeBadge(year));
        }

        // Platforms
        if (game.platforms) {
          game.platforms.forEach(p => cardEl.querySelector(".platform").appendChild(makeBadge(p.name)));
        }

        // Genres
        if (game.genres) {
          game.genres.forEach(g => cardEl.querySelector(".genre").appendChild(makeBadge(g.name)));
        }

        // Summary
        cardEl.querySelector(".desc").textContent = game.summary || "No summary available.";

        // Store data for modal
        cardEl.dataset.game = JSON.stringify(game);

        // Click handler
        cardEl.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const selectedGame = JSON.parse(e.currentTarget.dataset.game);
          openGameDetailsModal(selectedGame);
        });

        // Add to results container
        resultsDiv.appendChild(fragment);
      });

      statusDiv.textContent = `Found ${data.length} result(s) for "${query}".`;
    } catch (err) {
      console.error(err);
      statusDiv.textContent = "Error fetching results.";
      resultsDiv.textContent = err.message;
    }
  });

  // Trigger search on Enter key
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchBtn.click();
    }
  });

/// Dashboard Playlists Event Listeners ///

  // --- Triggered when clicking "Add to My List" ---
  document.getElementById("addToListBtn").addEventListener("click", () => {
    const gameDetailsModal = document.getElementById("gameDetailsModal");
    const gameData = gameDetailsModal.dataset.game;
    if (!gameData) return;

    selectedGame = JSON.parse(gameData);
    openAddToPlaylistModal(selectedGame);
  });

  const currentUser = getCurrentUser();

  if (currentUser) {
    renderDashboardPlaylists(currentUser);
  } else {
    console.log("No user logged in — no playlists to display.");
  }

  document.getElementById("downloadUserDataBtn").addEventListener("click", downloadUserData);

  document.getElementById("uploadUserDataInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) restoreUserData(file);
  });

}

/// DOM Ready ///
document.addEventListener("DOMContentLoaded", () => {

  console.log("DOM Content Loaded");

  setUpEventListeners();

  checkLoginStatus();


});

if (logOutLink) {
  logOutLink.addEventListener("click", e => {
    e.preventDefault();
    logOutUser();
  });
}



function truncateText(text, maxLength) {
  if (!text) return "No summary available.";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

// Helper to build badge spans
function makeBadge(text) {
  const span = document.createElement("span");
  span.className = "badge";
  span.textContent = text;
  return span;
}

function showElement(el) {
  if (!el) return;
  el.classList.remove("d-none");
}

function hideElement(el) {
  if (!el) return;
  el.classList.add("d-none");
}
