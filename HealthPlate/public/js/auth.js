// Показ помилок у формі
function setFieldError(input, message) {
  const group = input.closest('.form-group') || input.parentElement;
  if (!group) return;
  const errorEl = group.querySelector('.form-error');
  if (errorEl) {
    errorEl.textContent = message || '';
  }
  if (message) {
    input.classList.add('input-error');
  } else {
    input.classList.remove('input-error');
  }
}

// Реєстрація
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullname = form.querySelector('#fullname');
    const email = form.querySelector('#reg-email');
    const password = form.querySelector('#reg-password');
    const confirmPassword = form.querySelector('#confirm-password');
    const terms = form.querySelector('#terms');

    if (!terms.checked) {
      alert('Ви повинні погодитися з правилами.');
      return;
    }

    if (password.value !== confirmPassword.value) {
      alert('Паролі не співпадають.');
      return;
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullname: fullname.value.trim(),
        email: email.value.trim(),
        password: password.value,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error || 'Помилка реєстрації.');
      return;
    }

    alert('Реєстрація успішна. Код підтвердження надіслано на email.');

    const code = prompt('Введіть код підтвердження з пошти:');
    if (code) {
      const verifyRes = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.userId, code }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        alert(verifyData.error || 'Помилка підтвердження.');
        return;
      }

      alert('Email підтверджено! Тепер ви можете увійти.');
      window.location.href = 'authorization.html';
    }
  });
}

// Логін 
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.querySelector('#email');
    const password = form.querySelector('#password');

    let valid = true;

    if (!email.value.trim()) {
      setFieldError(email, 'Введіть email.');
      valid = false;
    } else {
      setFieldError(email, '');
    }

    if (!password.value) {
      setFieldError(password, 'Введіть пароль.');
      valid = false;
    } else {
      setFieldError(password, '');
    }

    if (!valid) return;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Помилка входу.');
        return;
      }

      // Зберігаємо користувача в localStorage
      localStorage.setItem('hpCurrentUser', JSON.stringify(data.user));

      // Перехід у профіль
      window.location.href = 'profile.html';
    } catch (err) {
      console.error(err);
      alert('Сервер недоступний.');
    }
  });
}

// Logout
function initLogoutLink() {
  const logoutLink = document.getElementById('logoutLink');
  if (!logoutLink) return;

  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();

    localStorage.removeItem('hpCurrentUser');

    // Перекидуємо на сторінку логіну
    window.location.href = 'authorization.html';
  });
}

// Редірект, якщо вже залогінена і зайшла на сторінку логіну
function redirectIfLoggedInOnAuthPage() {

  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  const userJson = localStorage.getItem('hpCurrentUser');
  if (userJson) {

    window.location.href = 'profile.html';
  }
}


async function initProfilePage() {
  const form = document.querySelector('.profile-form');
  if (!form) return;

  const userJson = localStorage.getItem('hpCurrentUser');
  if (!userJson) {
    window.location.href = 'authorization.html';
    return;
  }

  const user = JSON.parse(userJson);

  const nameInput = form.querySelector('#name');
  const emailInput = form.querySelector('#email');
  const weightInput = form.querySelector('#weight');
  const heightInput = form.querySelector('#height');
  const goalSelect = form.querySelector('#goal');

  if (nameInput) nameInput.value = user.fullname || '';
  if (emailInput) emailInput.value = user.email || '';
  if (weightInput && user.weight != null) weightInput.value = user.weight;
  if (heightInput && user.height != null) heightInput.value = user.height;
  if (goalSelect && user.goal) goalSelect.value = user.goal;

  const avatarImg = document.getElementById('profileAvatar');
  const avatarInput = document.getElementById('avatarInput');

  if (avatarImg) {

    avatarImg.src = 'images/avatar-default.jpg';

    if (user.avatarUrl) {
      avatarImg.src = user.avatarUrl + '?t=' + Date.now();
    } else {
      const candidateSrc = `/uploads/avatars/user-${user.id}.png`;
      const testImg = new Image();
      testImg.onload = () => {
        avatarImg.src = candidateSrc + '?t=' + Date.now();
      };
      testImg.onerror = () => {
      };
      testImg.src = candidateSrc + '?t=' + Date.now();
    }
  }

  if (avatarInput && avatarImg) {
    avatarInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('userId', String(user.id));
      formData.append('avatar', file);

      try {
        const res = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(data.error || 'Помилка завантаження аватара.');
          return;
        }

        avatarImg.src = data.avatarUrl + '?t=' + Date.now();

        user.avatarUrl = data.avatarUrl;
        localStorage.setItem('hpCurrentUser', JSON.stringify(user));
      } catch (err) {
        console.error(err);
        alert('Сервер недоступний.');
      }
    });
  }

  // Збереження профілю
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          fullname: nameInput.value.trim(),
          weight: weightInput.value ? Number(weightInput.value) : null,
          height: heightInput.value ? Number(heightInput.value) : null,
          goal: goalSelect.value || null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Помилка збереження профілю.');
        return;
      }

      user.fullname = nameInput.value.trim();
      user.weight = weightInput.value ? Number(weightInput.value) : null;
      user.height = heightInput.value ? Number(heightInput.value) : null;
      user.goal = goalSelect.value || null;
      localStorage.setItem('hpCurrentUser', JSON.stringify(user));

      alert('Профіль оновлено.');
    } catch (err) {
      console.error(err);
      alert('Сервер недоступний.');
    }
  });

  initFavouritesOnProfile(user);
}

// Улюблені рецепти на профілі
async function fetchUserFavourites(userId) {
  const res = await fetch('/api/favourites?userId=' + encodeURIComponent(userId));
  if (!res.ok) return [];
  const data = await res.json();
  return data.favourites || [];
}

async function initFavouritesOnProfile(user) {
  const container = document.getElementById('favouriteList');
  if (!container) return;

  const favs = await fetchUserFavourites(user.id);
  if (!favs.length) {
    container.innerHTML = '<p>You don\'t have any favourite recipes yet.</p>';
    return;
  }

  let recipes = [];
  try {
    if (typeof fetchRecipes === 'function') {
      recipes = await fetchRecipes();
    }
  } catch (err) {
    console.error('Cannot load recipes for favourites:', err);
  }

  const recipesBySlug = new Map(
    recipes.map(r => [r.slug, r])
  );

  container.innerHTML = favs
    .map((f) => {
      const r = recipesBySlug.get(f.recipe_slug) || {};
      const image =
        r.image || f.recipe_image || 'images/recipes/avocado-toast.jpg';
      const shortDesc = r.shortDesc || '';
      const cookingTime = r.cookingTime || '';
      const calories = r.calories ? r.calories + ' kcal' : '';
      const meta =
        f.recipe_meta ||
        (cookingTime || calories
          ? `~${cookingTime}${cookingTime && calories ? ' • ' : ''}${calories}`
          : '');

      return `
        <article class="recipe-card">
          <div class="recipe-image">
            <img src="${image}" alt="${f.recipe_title}">
          </div>
          <div class="recipe-content">
            <h3>${f.recipe_title}</h3>
            ${
              shortDesc
                ? `<p class="recipe-desc">${shortDesc}</p>`
                : ''
            }
            <p class="recipe-meta">${meta}</p>
            <a href="recipe.html?slug=${encodeURIComponent(
              f.recipe_slug
            )}" class="recipe-btn">
              View Recipe
            </a>
          </div>
        </article>
      `;
    })
    .join('');
}


// Сторінка "Favourite Recipes" 
function initFavouritesPage() {
  const container = document.getElementById('favouriteList');
  if (!container) return; 

  const userJson = localStorage.getItem('hpCurrentUser');
  if (!userJson) {
    window.location.href = 'authorization.html';
    return;
  }

  const user = JSON.parse(userJson);
  initFavouritesOnProfile(user);
}


// Улюблені рецепти на сторінці рецептів
function initRecipesFavourites() {
  const list = document.querySelector('.recipes-list');
  if (!list) return;

  let currentUser = null;
  const userJson = localStorage.getItem('hpCurrentUser');
  if (userJson) {
    currentUser = JSON.parse(userJson);
  }

  async function applyInitialFavourites() {
    if (!currentUser) return;

    try {
      const favs = await fetchUserFavourites(currentUser.id);
      const favSlugs = favs.map((f) => f.recipe_slug);

      list.querySelectorAll('.recipe-card').forEach((card) => {
        const slug = card.dataset.slug;
        if (!slug) return;
        const btn = card.querySelector('.favorite-btn');
        if (!btn) return;

        if (favSlugs.includes(slug)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    } catch (err) {
      console.error('Cannot apply favourites', err);
    }
  }

  applyInitialFavourites();

  document.addEventListener('recipesRendered', applyInitialFavourites);

  list.addEventListener('click', async (e) => {
    const btn = e.target.closest('.favorite-btn');
    if (!btn) return;

    e.preventDefault();

    if (!currentUser) {
      window.location.href = 'authorization.html';
      return;
    }

    const card = btn.closest('.recipe-card');
    const slug = card.dataset.slug;
    const title = card.querySelector('h3')?.textContent.trim();
    const image = card.querySelector('.recipe-image img')?.getAttribute('src');
    const meta = card.querySelector('.recipe-meta')?.textContent.trim();

    try {
      const res = await fetch('/api/favourites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          recipe: { slug, title, image, meta },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Помилка збереження улюбленого рецепта.');
        return;
      }

      if (data.favourite) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    } catch (err) {
      console.error(err);
      alert('Сервер недоступний.');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initRegisterForm();
  initLoginForm();
  initContactForm();
  initProfilePage();
  initFavouritesPage();      
  initRecipesFavourites();
  redirectIfLoggedInOnAuthPage();
  initLogoutLink();
});

