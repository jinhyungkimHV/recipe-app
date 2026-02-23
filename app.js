const STORAGE_KEY = "recipe-vault-v1";

const state = {
  recipes: loadRecipes(),
  editingId: null,
  photoDraft: null,
  filters: {
    search: "",
    category: "",
    favoritesOnly: false,
    sort: "newest",
  },
};

const form = document.querySelector("#recipeForm");
const formTitle = document.querySelector("#formTitle");
const submitBtn = document.querySelector("#submitBtn");
const cancelEditBtn = document.querySelector("#cancelEditBtn");
const recipesContainer = document.querySelector("#recipesContainer");
const recipeCardTemplate = document.querySelector("#recipeCardTemplate");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const favoritesOnlyInput = document.querySelector("#favoritesOnly");
const sortSelect = document.querySelector("#sortSelect");
const stats = document.querySelector("#stats");
const photoInput = document.querySelector("#photo");
const photoPreview = document.querySelector("#photoPreview");
const clearPhotoBtn = document.querySelector("#clearPhotoBtn");
const updateToast = document.querySelector("#updateToast");
const refreshAppBtn = document.querySelector("#refreshAppBtn");
const dismissUpdateBtn = document.querySelector("#dismissUpdateBtn");

let waitingServiceWorker = null;
let isRefreshing = false;
let isPhotoProcessing = false;

form.addEventListener("submit", onFormSubmit);
cancelEditBtn.addEventListener("click", resetForm);

searchInput.addEventListener("input", (event) => {
  state.filters.search = event.target.value.trim().toLowerCase();
  render();
});

categoryFilter.addEventListener("change", (event) => {
  state.filters.category = event.target.value;
  render();
});

favoritesOnlyInput.addEventListener("change", (event) => {
  state.filters.favoritesOnly = event.target.checked;
  render();
});

sortSelect.addEventListener("change", (event) => {
  state.filters.sort = event.target.value;
  render();
});

photoInput.addEventListener("change", onPhotoInputChange);
clearPhotoBtn.addEventListener("click", clearPhotoDraft);

refreshAppBtn?.addEventListener("click", activateUpdate);
dismissUpdateBtn?.addEventListener("click", hideUpdateToast);

registerServiceWorker();
render();

function loadRecipes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecipes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recipes));
}

async function onFormSubmit(event) {
  event.preventDefault();
  if (isPhotoProcessing) return;

  const formData = new FormData(form);
  const recipe = normalizeRecipe(formData);
  const existingRecipe = state.recipes.find(
    (item) => item.id === state.editingId
  );
  const photo = resolveRecipePhoto(existingRecipe);

  if (state.editingId) {
    state.recipes = state.recipes.map((existing) =>
      existing.id === state.editingId
        ? { ...existing, ...recipe, photo }
        : existing
    );
  } else {
    state.recipes.unshift({
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      favorite: false,
      photo,
      ...recipe,
    });
  }

  saveRecipes();
  resetForm();
  render();
}

function normalizeRecipe(formData) {
  const ingredients = String(formData.get("ingredients") || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    name: String(formData.get("name") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    tags,
    ingredients,
    instructions: String(formData.get("instructions") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
  };
}

function resetForm() {
  state.editingId = null;
  state.photoDraft = null;
  form.reset();
  hidePhotoPreview();
  formTitle.textContent = "Add Recipe";
  submitBtn.textContent = "Save Recipe";
  cancelEditBtn.classList.add("hidden");
  clearPhotoBtn.classList.add("hidden");
}

function render() {
  renderCategoryFilter();
  renderRecipes();
  renderStats();
}

function renderCategoryFilter() {
  const categories = Array.from(
    new Set(
      state.recipes
        .map((recipe) => recipe.category)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
    )
  );

  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    if (category === state.filters.category) option.selected = true;
    categoryFilter.append(option);
  });
}

function renderRecipes() {
  recipesContainer.innerHTML = "";
  const filtered = getVisibleRecipes();

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "stats";
    empty.textContent =
      state.recipes.length === 0
        ? "No recipes yet. Add your first one on the left."
        : "No recipes match your current filters.";
    recipesContainer.append(empty);
    return;
  }

  filtered.forEach((recipe) => {
    const fragment = recipeCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".recipe-card");
    const name = fragment.querySelector(".recipe-name");
    const meta = fragment.querySelector(".recipe-meta");
    const favoriteBtn = fragment.querySelector(".favorite-btn");
    const recipePhoto = fragment.querySelector(".recipe-photo");
    const tagList = fragment.querySelector(".tag-list");
    const ingredientsList = fragment.querySelector(".ingredients-list");
    const instructions = fragment.querySelector(".instructions");
    const notes = fragment.querySelector(".notes");
    const editBtn = fragment.querySelector(".edit-btn");
    const deleteBtn = fragment.querySelector(".delete-btn");

    name.textContent = recipe.name;
    meta.textContent = recipe.category || "Uncategorized";
    favoriteBtn.textContent = recipe.favorite ? "★" : "☆";
    favoriteBtn.classList.toggle("active", recipe.favorite);
    instructions.textContent = recipe.instructions;
    if (recipe.photo) {
      recipePhoto.classList.remove("hidden");
      recipePhoto.src = recipe.photo;
    }

    if (recipe.notes) {
      notes.classList.remove("hidden");
      notes.textContent = `Note: ${recipe.notes}`;
    }

    recipe.tags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag";
      chip.textContent = `#${tag}`;
      tagList.append(chip);
    });

    recipe.ingredients.forEach((ingredient) => {
      const li = document.createElement("li");
      li.textContent = ingredient;
      ingredientsList.append(li);
    });

    favoriteBtn.addEventListener("click", () => toggleFavorite(recipe.id));
    editBtn.addEventListener("click", () => startEdit(recipe));
    deleteBtn.addEventListener("click", () => deleteRecipe(recipe.id));

    card.dataset.id = recipe.id;
    recipesContainer.append(fragment);
  });
}

function renderStats() {
  const total = state.recipes.length;
  const visible = getVisibleRecipes().length;
  const favorites = state.recipes.filter((recipe) => recipe.favorite).length;
  stats.textContent = `${visible} of ${total} shown • ${favorites} favorite${
    favorites === 1 ? "" : "s"
  }`;
}

function getVisibleRecipes() {
  const { search, category, favoritesOnly, sort } = state.filters;
  const query = search.trim();

  const filtered = state.recipes.filter((recipe) => {
    const categoryPass = !category || recipe.category === category;
    const favoritePass = !favoritesOnly || recipe.favorite;
    const searchPass =
      !query ||
      [recipe.name, recipe.category, recipe.instructions, recipe.notes]
        .join(" ")
        .toLowerCase()
        .includes(query) ||
      recipe.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      recipe.ingredients.some((ingredient) =>
        ingredient.toLowerCase().includes(query)
      );

    return categoryPass && favoritePass && searchPass;
  });

  const sorted = [...filtered];
  if (sort === "az") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "favorites") {
    sorted.sort((a, b) => Number(b.favorite) - Number(a.favorite));
  } else {
    sorted.sort((a, b) => b.createdAt - a.createdAt);
  }

  return sorted;
}

function toggleFavorite(id) {
  state.recipes = state.recipes.map((recipe) =>
    recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe
  );
  saveRecipes();
  render();
}

function startEdit(recipe) {
  state.editingId = recipe.id;
  state.photoDraft = recipe.photo || "";
  formTitle.textContent = "Edit Recipe";
  submitBtn.textContent = "Update Recipe";
  cancelEditBtn.classList.remove("hidden");

  form.querySelector("#recipeId").value = recipe.id;
  form.querySelector("#name").value = recipe.name;
  form.querySelector("#category").value = recipe.category;
  form.querySelector("#tags").value = recipe.tags.join(", ");
  form.querySelector("#ingredients").value = recipe.ingredients.join("\n");
  form.querySelector("#instructions").value = recipe.instructions;
  form.querySelector("#notes").value = recipe.notes;
  photoInput.value = "";
  if (recipe.photo) {
    setPhotoPreview(recipe.photo);
    clearPhotoBtn.classList.remove("hidden");
  } else {
    hidePhotoPreview();
    clearPhotoBtn.classList.add("hidden");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteRecipe(id) {
  const target = state.recipes.find((recipe) => recipe.id === id);
  if (!target) return;

  const confirmed = window.confirm(`Delete "${target.name}"?`);
  if (!confirmed) return;

  state.recipes = state.recipes.filter((recipe) => recipe.id !== id);
  if (state.editingId === id) resetForm();
  saveRecipes();
  render();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((registration) => {
        if (registration.waiting) {
          showUpdateToast(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              showUpdateToast(newWorker);
            }
          });
        });
      })
      .catch((error) =>
        console.error("Service worker registration failed:", error)
      );
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (isRefreshing) return;
    isRefreshing = true;
    window.location.reload();
  });
}

function showUpdateToast(worker) {
  waitingServiceWorker = worker;
  updateToast?.classList.remove("hidden");
}

function hideUpdateToast() {
  updateToast?.classList.add("hidden");
}

function activateUpdate() {
  if (!waitingServiceWorker) return;
  waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
  hideUpdateToast();
}

function resolveRecipePhoto(existingRecipe) {
  if (state.photoDraft !== null) return state.photoDraft;
  return existingRecipe?.photo || "";
}

async function onPhotoInputChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    window.alert("Please choose an image file.");
    photoInput.value = "";
    return;
  }

  isPhotoProcessing = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Processing Image...";
  try {
    const dataUrl = await readFileAsDataUrl(file);
    state.photoDraft = dataUrl;
    setPhotoPreview(dataUrl);
    clearPhotoBtn.classList.remove("hidden");
  } catch {
    window.alert("Could not read that image. Please try another one.");
  } finally {
    isPhotoProcessing = false;
    submitBtn.disabled = false;
    submitBtn.textContent = state.editingId ? "Update Recipe" : "Save Recipe";
  }
}

function clearPhotoDraft() {
  state.photoDraft = "";
  photoInput.value = "";
  hidePhotoPreview();
  clearPhotoBtn.classList.add("hidden");
}

function setPhotoPreview(src) {
  photoPreview.src = src;
  photoPreview.classList.remove("hidden");
}

function hidePhotoPreview() {
  photoPreview.removeAttribute("src");
  photoPreview.classList.add("hidden");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}
