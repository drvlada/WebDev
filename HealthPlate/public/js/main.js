// ===================
// Init
// ===================
// Ініціалізує всі модулі після повного завантаження DOM

document.addEventListener('DOMContentLoaded', () => {
  initBurger();
  initThemeToggle();   
  initCommunityPage();
  initStoryPage();
  initRecipesPage();
  initRecipePage();
  initContactForm();
  initFavouritesPage();
  initMenuGenerator();
  initFooterDate();
  initAccordion();
  addInfoParagraph();
  highlightRecipeCards();
  initNavHoverJS();
  initFontSizeHotkeys();
});

// ===================
// Burger-menu
// ===================
// Перемикає мобільне меню навігації при кліку на бургер

function initBurger() {
  const burger = document.getElementById('burgerMenu');
  const nav = document.getElementById('mainNav');

  if (burger && nav) {
    burger.addEventListener('click', () => {
      nav.classList.toggle('active');
    });
  }
}

// ===================
// API helpers
// ===================
// Містить функції для отримання даних (stories, recipes) з бекенду

async function fetchStories() {
  const res = await fetch('/api/stories');
  if (!res.ok) throw new Error('Failed to load stories');
  const data = await res.json();
  return data.stories || [];
}

async function fetchStoryBySlug(slug) {
  const res = await fetch('/api/stories/' + encodeURIComponent(slug));
  if (!res.ok) throw new Error('Story not found');
  return await res.json();
}

async function fetchRecipes() {
  const res = await fetch('/api/recipes');
  if (!res.ok) throw new Error('Failed to load recipes');
  const data = await res.json();
  return data.recipes || [];
}

async function fetchRecipeBySlug(slug) {
  const res = await fetch('/api/recipes/' + encodeURIComponent(slug));
  if (!res.ok) throw new Error('Recipe not found');
  return await res.json();
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// ===================
// Community page
// ===================
// Завантажує та відображає список статей спільноти

async function initCommunityPage() {
  const feed = document.getElementById('communityFeed');
  if (!feed) return;

  const originalHTML = feed.innerHTML;

  try {
    const stories = await fetchStories();
    if (!stories.length) return;

    feed.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'Articles';
    feed.appendChild(heading);

    stories.forEach(story => {
      const article = document.createElement('article');
      article.className = 'post post-with-image';

      article.innerHTML = `
    ${story.image ? `
      <div class="post-thumb">
        <img src="${story.image}" alt="${story.title}">
      </div>
    ` : ''}
    <div class="post-body">
      <h3>${story.title}</h3>
      <p class="date">
        ${formatDate(story.date)} · ${story.readTime ? story.readTime + ' min read' : ''}
      </p>
      <p>${story.excerpt || ''}</p>
      <a href="story.html?slug=${encodeURIComponent(story.slug)}">Read more...</a>
    </div>
  `;

      feed.appendChild(article);
    });

  } catch (err) {
    console.error('Error loading stories for community:', err);
    feed.innerHTML = originalHTML;
  }
}


// ===================
// Story page
// ===================
// Відображає окрему статтю на основі slug з URL

async function initStoryPage() {
  const container = document.getElementById('storyContainer');
  if (!container) return; 

  const slug = getQueryParam('slug');
  if (!slug) {
    container.innerHTML = `
      <h2>Story not found</h2>
      <p>Missing story id in URL.</p>
    `;
    return;
  }

  try {
    const story = await fetchStoryBySlug(slug);

    document.title = `${story.title} | Health Plate`;

    container.innerHTML = `
      <h2>${story.title}</h2>
      <p class="date">
        ${formatDate(story.date)} · ${story.readTime ? story.readTime + ' min read · ' : ''}${story.author || ''}
      </p>
      ${story.image ? `<img src="${story.image}" alt="${story.title}" style="max-width:100%; border-radius:16px; margin-bottom:1rem;">` : ''}
      ${story.content && story.content.length
        ? story.content.map(p => `<p>${p}</p>`).join('')
        : '<p>No content yet.</p>'
      }
    `;
  } catch (err) {
    console.error('Error loading story:', err);
    container.innerHTML = `
      <h2>Story not found</h2>
      <p>Maybe it was removed or the link is incorrect.</p>
    `;
  }
}

// ===================
// Favorites helpers
// ===================
// Керує збереженням улюблених рецептів у localStorage

const FAV_KEY = 'hpFavorites';

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch (e) {
    console.error('Failed to parse favorites from localStorage', e);
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

function isFavorite(slug) {
  const favs = loadFavorites();
  return favs.includes(slug);
}

function toggleFavorite(slug) {
  let favs = loadFavorites();
  if (favs.includes(slug)) {
    favs = favs.filter(s => s !== slug);
  } else {
    favs.push(slug);
  }
  saveFavorites(favs);
}

// ===================
// Recipes page
// ===================
// Відображає список усіх рецептів і керує лайками

async function initRecipesPage() {
  const list = document.querySelector('.recipes-list');
  if (!list) return;

  const originalHTML = list.innerHTML;

  try {
    const recipes = await fetchRecipes();
    if (!recipes.length) return;

    list.innerHTML = '';

    recipes.forEach(recipe => {
      const article = document.createElement('article');
      article.className = 'recipe-card';

      if (recipe.category) {
        const cat = recipe.category.toString().trim().toLowerCase();
        article.id = cat;               // щоб якорі #breakfast працювали
        article.dataset.category = cat; // ← ВАЖЛИВО для фільтра
      }

      article.dataset.slug = recipe.slug;

      article.innerHTML = `
        <button class="favorite-btn" aria-label="Add to favorites"></button>
        <div class="recipe-image">
          ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}">` : ''}
          ${recipe.category ? `<span class="recipe-tag">${recipe.category}</span>` : ''}
        </div>
        <div class="recipe-content">
          <h3>${recipe.title}</h3>
          <p class="recipe-desc">
            ${recipe.shortDesc || ''}
          </p>
          <p class="recipe-meta">
            ~${recipe.cookingTime || ''} • ${recipe.calories ? recipe.calories + ' kcal' : ''}
          </p>
          <a href="recipe.html?slug=${encodeURIComponent(recipe.slug)}" class="recipe-btn">View Recipe</a>
        </div>
      `;

      list.appendChild(article);

      const favBtn = article.querySelector('.favorite-btn');
      if (favBtn) {
        if (isFavorite(recipe.slug)) {
          favBtn.classList.add('favorite-btn--active');
        }
        favBtn.addEventListener('click', () => {
          toggleFavorite(recipe.slug);
          favBtn.classList.toggle('favorite-btn--active');
        });
      }
    });

    document.dispatchEvent(new CustomEvent('recipesRendered'));
    initRecipeFilters();
    highlightRecipeCards();    
  } catch (err) {
    console.error('Error loading recipes:', err);
    list.innerHTML = originalHTML;
  }
}

// ===================
// Recipe page (detail)
// ===================
// Показує детальну інформацію про один рецепт

async function initRecipePage() {
  const container = document.getElementById('recipeContainer');
  if (!container) return; 

  const slug = getQueryParam('slug');
  if (!slug) {
    container.innerHTML = `
      <h2>Recipe not found</h2>
      <p>Missing recipe id in URL.</p>
      <p><a href="recipes.html">← Back to recipes</a></p>
    `;
    return;
  }

  try {
    const recipe = await fetchRecipeBySlug(slug);

    document.title = `${recipe.title} | Health Plate`;

    const paragraphs = recipe.content
      ? recipe.content
        .split(/\r?\n\r?\n|\r?\n/)
        .map(p => p.trim())
        .filter(Boolean)
      : [];

    container.innerHTML = `
      <h2>${recipe.title}</h2>
      <p class="date">
        ${recipe.category ? recipe.category + ' · ' : ''}
        ${recipe.cookingTime || ''}
        ${recipe.calories ? ' · ' + recipe.calories : ''}
      </p>
      ${recipe.image ? `
        <img src="${recipe.image}" alt="${recipe.title}"
             style="max-width:100%; border-radius:16px; margin-bottom:1rem;">
      ` : ''}
      ${recipe.shortDesc ? `<p class="recipe-desc">${recipe.shortDesc}</p>` : ''}
      ${paragraphs.length
        ? paragraphs.map(p => `<p>${p}</p>`).join('')
        : '<p>No full recipe content yet.</p>'
      }
      <p style="margin-top:1.5rem;">
        <a href="recipes.html">← Back to recipes</a>
      </p>
    `;
  } catch (err) {
    console.error('Error loading recipe:', err);
    container.innerHTML = `
      <h2>Recipe not found</h2>
      <p>Maybe it was removed or the link is incorrect.</p>
      <p><a href="recipes.html">← Back to recipes</a></p>
    `;
  }
}

// ===================
// Theme (dark / light)
// ===================
// Додає перемикання між світлою та темною темою

function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark-theme');
  } else {
    root.classList.remove('dark-theme');
  }
}

function initThemeToggle() {
  const root = document.documentElement;
  const headerInner = document.querySelector('.header-inner');
  if (!headerInner) return;

  const saved = localStorage.getItem('hpTheme');
  const initialTheme = saved === 'dark' ? 'dark' : 'light';
  applyTheme(initialTheme);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';

  const iconSpan = document.createElement('span');
  iconSpan.className = 'theme-toggle__icon';

  const labelSpan = document.createElement('span');
  labelSpan.className = 'theme-toggle__label';

  function render(theme) {
    if (theme === 'dark') {
      iconSpan.textContent = '🌙';
      labelSpan.textContent = 'Dark';
    } else {
      iconSpan.textContent = '☀️';
      labelSpan.textContent = 'Light';
    }
  }

  render(initialTheme);

  btn.appendChild(iconSpan);
  btn.appendChild(labelSpan);

  btn.addEventListener('click', () => {
    const isDarkNow = root.classList.contains('dark-theme');
    const newTheme = isDarkNow ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('hpTheme', newTheme);
    render(newTheme);
  });

  headerInner.appendChild(btn);
}

// ==============================
// Contact form initialization
// ==============================
// обробляє форму зворотного звʼязку з валідацією та відправкою

function initContactForm() {
  const form = document.querySelector('.contact-form');
  const output = document.querySelector('.contact-output');

  if (!form || !output) return;

  if (form.dataset.hpContactInited === '1') return;
  form.dataset.hpContactInited = '1';

  const nameInput = form.elements['name'];
  const emailInput = form.elements['email'];
  const messageInput = form.elements['message'];

  // хелпер: показати помилку
  function showError(input, message) {
    input.classList.add('input-error');

    let error = input.nextElementSibling;
    if (!error || !error.classList.contains('field-error')) {
      error = document.createElement('div');
      error.className = 'field-error';
      input.after(error);
    }

    error.textContent = message;
  }

  // хелпер: очистити помилку
  function clearError(input) {
    input.classList.remove('input-error');
    const error = input.nextElementSibling;
    if (error && error.classList.contains('field-error')) {
      error.remove();
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // очистка попередніх станів
    [nameInput, emailInput, messageInput].forEach(clearError);
    output.textContent = '';
    output.className = 'contact-output';
    output.style.display = 'none';

    let hasError = false;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    // перевірка імені
    if (name.length < 3) {
      showError(nameInput, 'Імʼя має містити щонайменше 3 символи');
      hasError = true;
    }

    // перевірка email
    if (!isValidEmail(email)) {
      showError(emailInput, 'Введіть коректну електронну адресу');
      hasError = true;
    }

    // перевірка повідомлення
    if (message.length < 10) {
      showError(messageInput, 'Повідомлення має бути не менше 10 символів');
      hasError = true;
    }

    if (hasError) return;

    // надсилання
    try {
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });

      if (resp.ok) {
        output.textContent = 'Форма успішно надіслана!';
        output.classList.add('success');
        output.style.display = 'block';

        form.reset();

        setTimeout(() => {
          output.textContent = '';
          output.style.display = 'none';
        }, 3000);
      } else {
        throw new Error();
      }
    } catch {
      output.textContent = 'Сталася помилка при надсиланні. Спробуйте пізніше.';
      output.classList.add('error');
      output.style.display = 'block';
    }
  });
}


// ==============================
// Email validation function
// ==============================
// перевіряє коректність email-адреси

function isValidEmail(email) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return false;

  const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!domainPattern.test(domain)) return false;

  const localPattern = /^[a-zA-Z0-9._%+-]+$/;
  if (!localPattern.test(local)) return false;

  return true;
}

// ==============================
// Favourites page initialization
// ==============================
// відображає збережені улюблені рецепти

async function initFavouritesPage() {
  const list = document.getElementById('favouriteList');
  if (!list) return;

  const favSlugs = loadFavorites();
  if (!favSlugs.length) {
    list.innerHTML = '<p>You have no favourite recipes yet.</p>';
    return;
  }

  try {
    const recipes = await fetchRecipes();
    const favRecipes = recipes.filter(r => favSlugs.includes(r.slug));

    list.innerHTML = '';

    favRecipes.forEach(recipe => {
      const article = document.createElement('article');
      article.className = 'recipe-card';
      article.dataset.slug = recipe.slug;

      article.innerHTML = `
        <button class="favorite-btn favorite-btn--active"
                aria-label="Remove from favorites"></button>
        <div class="recipe-image">
          ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}">` : ''}
          ${recipe.category ? `<span class="recipe-tag">${recipe.category}</span>` : ''}
        </div>
        <div class="recipe-content">
          <h3>${recipe.title}</h3>
          <p class="recipe-desc">
            ${recipe.shortDesc || ''}
          </p>
          <p class="recipe-meta">
            ~${recipe.cookingTime || ''} • ${recipe.calories ? recipe.calories + ' kcal' : ''}
          </p>
          <a href="recipe.html?slug=${encodeURIComponent(recipe.slug)}" class="recipe-btn">
            View Recipe
          </a>
        </div>
      `;

      list.appendChild(article);

      const favBtn = article.querySelector('.favorite-btn');
      favBtn.addEventListener('click', () => {
        toggleFavorite(recipe.slug); 
        article.remove();           
      });
    });
    highlightRecipeCards();
  } catch (err) {
    console.error('Error loading favourite recipes:', err);
    list.innerHTML = '<p>Failed to load favourite recipes.</p>';
  }
}

// ===================
// Menu generator
// ===================
// Генерує меню на основі цілі та типу прийому їжі

async function initMenuGenerator() {
  const form = document.getElementById('menuForm');
  const output = document.getElementById('menuOutput');

  if (!form || !output) return;

  let recipes = [];
  try {
    recipes = await fetchRecipes();
    console.log('Loaded recipes for menu:', recipes);
  } catch (err) {
    console.error('Cannot load recipes for menu generator:', err);
    output.textContent = 'Unable to load recipes.';
    return;
  }

  const normalized = recipes.map(r => ({
    ...r,
    caloriesNum: Number(r.calories) || 0
  }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const mealType = document.getElementById('mealType').value; 
    const goal = document.getElementById('goal').value;         

    // 1) Фільтрація за калоріями відповідно до цілі

    let candidates = normalized.filter(r => r.caloriesNum > 0);

    candidates = candidates.filter(r => {
      const c = r.caloriesNum;

      if (goal === 'lose') {
        return c >= 0 && c <= 270;
      } else if (goal === 'maintain') {
        return c >= 270 && c <= 380;
      } else if (goal === 'gain') {
        return c > 380;
      }
      return true;
    });

    console.log('After calories filter:', candidates);

    if (!candidates.length) {
      output.textContent = 'No recipes found for selected filters.';
      return;
    }

    const buildCard = (recipe) => `
  <article class="recipe-card" data-slug="${recipe.slug}">
    <button type="button"
            class="favorite-btn ${isFavorite(recipe.slug) ? 'favorite-btn--active' : ''}"
            aria-label="Add to favorites"></button>

    <div class="recipe-image">
      ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}">` : ''}
      ${recipe.category ? `<span class="recipe-tag">${recipe.category}</span>` : ''}
    </div>

    <div class="recipe-content">
      <h3>${recipe.title}</h3>
      <p class="recipe-desc">${recipe.shortDesc || ''}</p>
      <p class="recipe-meta">~${recipe.cookingTime || ''} • ${recipe.caloriesNum} kcal</p>
      <a href="recipe.html?slug=${encodeURIComponent(recipe.slug)}" class="recipe-btn">View Recipe</a>
    </div>
  </article>
`;

    // 2) Логіка для "All Meal Types"

    if (mealType === 'all') {
      const categoriesOrder = ['breakfast', 'lunch', 'dinner', 'dessert'];
      const picked = [];

      categoriesOrder.forEach(cat => {
        const inCat = candidates.filter(r =>
          (r.category || '').toString().trim().toLowerCase() === cat
        );

        if (inCat.length) {
          const random = inCat[Math.floor(Math.random() * inCat.length)];
          picked.push(random);
        }
      });

      if (!picked.length) {
        output.textContent = 'No recipes found for selected filters.';
        return;
      }

      const totalCalories = picked.reduce((sum, r) => sum + r.caloriesNum, 0);

      output.innerHTML = `
        <p><strong>Total calories ≈ ${totalCalories} kcal</strong></p>
        <div class="recipes-list menu-recipes-list">
          ${picked.map(buildCard).join('')}
        </div>
      `;
      initFavoriteButtons(output);
      highlightRecipeCards();
      return;
    }
    
    // 3) Логіка для конкретного типу прийому їжі

    const typeLower = mealType.toLowerCase();

    let filteredByType = candidates.filter(r =>
      (r.category || '').toString().trim().toLowerCase() === typeLower
    );

    console.log('After mealType filter:', filteredByType);

    if (!filteredByType.length) {
      output.textContent = 'No recipes found for selected filters.';
      return;
    }

    filteredByType = filteredByType.sort(() => Math.random() - 0.5);

    const picked = filteredByType.slice(0, 4);
    const totalCalories = picked.reduce((sum, r) => sum + r.caloriesNum, 0);

    output.innerHTML = `
  <div class="recipes-list menu-recipes-list">
    ${picked.map(buildCard).join('')}
  </div>
`;
    initFavoriteButtons(output);
    highlightRecipeCards();
  });
}

// ==============================
// Recipe filters initialization
// ==============================
// фільтрує рецепти за категоріями без перезавантаження сторінки

function initRecipeFilters() {
  const links = document.querySelectorAll(".recipe-filter-list a");
  const cards = document.querySelectorAll(".recipe-card");

  if (!links.length || !cards.length) return;

  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();

      const cat = link.getAttribute("href").replace("#", "").toLowerCase();

      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      cards.forEach(card => {
        const recipeCat =
          (card.dataset.category || card.id || '').toString().toLowerCase();

        if (cat === "all" || recipeCat === cat) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

// ==============================
// Footer date initialization
// ==============================
// виводить поточну дату у футері

function initFooterDate() {
  const el = document.getElementById('footerDate');
  if (!el) return;

  const now = new Date();
  el.textContent = now.toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ==============================
// Accordion initialization
// ==============================
// керує відкриттям і закриттям accordion-блоків

function initAccordion() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".accordion-btn");
    if (!btn) return;

    const panel = btn.nextElementSibling;
    const isOpen = btn.getAttribute("aria-expanded") === "true";

    btn.setAttribute("aria-expanded", String(!isOpen));
    btn.textContent = isOpen ? "Show more" : "Show less";
    panel.hidden = isOpen;
  });
}

// ==============================
// Info paragraph
// ==============================
// додає інформаційний текст у кінець основного контенту

function addInfoParagraph() {
  const main = document.querySelector('main');
  if (!main) return;

  const p = document.createElement('p');
  p.textContent = 'Stay healthy and enjoy your meals with Health Plate!';
  p.style.marginTop = '2rem';
  p.style.color = '#22c55e';
  p.style.fontWeight = '500';
  p.style.textAlign = 'center';

  main.append(p);
}

// ==============================
// Recipe cards highlighting
// ==============================
// візуально підсвічує картки рецептів

function highlightRecipeCards() {
  const cards = document.querySelectorAll('.recipe-card');

  cards.forEach(card => {
    card.style.backgroundColor = 'rgba(34, 197, 94, 0.08)';
    card.style.border = '1px solid #22c55e';
  });
}

// ==============================
// Navigation hover effects
// ==============================
// додає hover-ефекти для пунктів навігації

function initNavHoverJS() {
  const links = document.querySelectorAll('.main-nav a');
  if (!links.length) return;

  links.forEach(a => {
    a.addEventListener('mouseenter', () => a.classList.add('nav-hover'));
    a.addEventListener('mouseleave', () => a.classList.remove('nav-hover'));
  });
}

// ==============================
// Font size hotkeys
// ==============================
// змінює розмір шрифту за допомогою клавіш зі стрілками

function initFontSizeHotkeys() {
  const root = document.documentElement;

  let scale = Number(localStorage.getItem('hpFontScale')) || 1;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const apply = () => {
    root.style.setProperty('--font-scale', scale.toFixed(2));
    localStorage.setItem('hpFontScale', scale.toFixed(2));
  };

  apply();

  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      scale = clamp(scale + 0.05, 0.85, 1.25);
      apply();
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      scale = clamp(scale - 0.05, 0.85, 1.25);
      apply();
    }
  });
}

// ==============================
// Favorite buttons initialization
// ==============================
// ініціалізує кнопки додавання рецептів до улюблених

function initFavoriteButtons(scope = document) {
  const cards = scope.querySelectorAll('.recipe-card');

  cards.forEach(card => {
    const slug = card.dataset.slug;
    const btn = card.querySelector('.favorite-btn');
    if (!slug || !btn) return;

    if (isFavorite(slug)) btn.classList.add('favorite-btn--active');

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFavorite(slug);
      btn.classList.toggle('favorite-btn--active');
    });
  });
}
