// ===================
// Imports
// ===================
// Підключає необхідні модулі та бібліотеки для роботи сервера

const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const app = express();
const nodemailer = require('nodemailer');
const config = require('./config');
const multer = require('multer');


// Mail transporter
const mailer = nodemailer.createTransport(config.smtp);

// App configuration
const PORT = process.env.PORT || 3000;

// Database initialization
const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

// Ініціалізація таблиці
const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
db.exec(initSql);


// Admin templates
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));


// Avatar uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.body.userId || 'unknown';

    cb(null, `user-${userId}.png`);
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Дозволено завантажувати тільки зображення.'));
    }
    cb(null, true);
  }
});

// ===================
// Profile avatar api
// ===================
// Приймає аватар користувача та оновлює його в профілі

app.post('/api/profile/avatar', uploadAvatar.single('avatar'), (req, res) => {
  const userId = req.body.userId;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Не передано userId.' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Файл не завантажено.' });
  }

  const filename = `user-${userId}.png`;
  const publicUrl = `/uploads/avatars/${filename}`;

  // Оновлюємо запис у таблиці users – зберігаємо URL аватара
  db.run(
    'UPDATE users SET avatar_url = ? WHERE id = ?',
    [publicUrl, userId],
    (err) => {
      if (err) {
        console.error('DB error (avatar_url):', err);
        return res.status(500).json({ success: false, error: 'DB error при збереженні аватара.' });
      }

      return res.json({
        success: true,
        avatarUrl: publicUrl
      });
    }
  );
});

// ===================
// Authentication api
// ===================
// Реалізує реєстрацію, підтвердження email та авторизацію

app.post('/api/register', (req, res) => {
  const { fullname, email, password } = req.body;

  if (!fullname || fullname.trim().length < 3) {
    return res.status(400).json({ error: 'Імʼя має містити мінімум 3 символи.' });
  }

  const emailVal = (email || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailVal)) {
    return res.status(400).json({ error: 'Некоректний email.' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Пароль має містити не менше 8 символів.' });
  }

  db.get("SELECT id FROM users WHERE email = ?", [emailVal], async (err, row) => {
    if (row) return res.status(400).json({ error: "Такий email уже існує." });

    try {
      const hash = await bcrypt.hash(password, 10);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      db.run(
        `INSERT INTO users (fullname, email, password_hash, verification_code, email_verified)
         VALUES (?, ?, ?, ?, 0)`,
        [fullname.trim(), emailVal, hash, verificationCode],
        async function (err2) {
          if (err2) return res.status(500).json({ error: 'DB error' });

          // Надсилання листа з підтвердженням
          try {
            await mailer.sendMail({
              from: '"HealthPlate" <your-email@gmail.com>',
              to: emailVal,
              subject: "Підтвердження реєстрації",
              html: `
                <h2>Підтвердження email на HealthPlate</h2>
                <p>Ваш код підтвердження:</p>
                <h1>${verificationCode}</h1>
                <p>Введіть його у вікні підтвердження на сайті.</p>
              `,
            });
          } catch (mailErr) {
            console.error("Помилка email:", mailErr);
            return res.status(500).json({ error: "Не вдалося надіслати лист з підтвердженням." });
          }

          res.json({
            success: true,
            userId: this.lastID,
            message: "Реєстрація успішна. Код підтвердження надіслано на email."
          });
        }
      );
    } catch (hashErr) {
      return res.status(500).json({ error: "Помилка хешування пароля." });
    }
  });
});

// ===================
// Verify email api
// ===================
// Перевіряє код підтвердження та активує акаунт

app.post('/api/verify-email', (req, res) => {
  const { userId, code } = req.body;

  db.get(
    "SELECT verification_code FROM users WHERE id = ?",
    [userId],
    (err, row) => {
      if (!row) return res.status(404).json({ error: "Користувача не знайдено" });

      if (row.verification_code !== code.trim()) {
        return res.status(400).json({ error: "Невірний код підтвердження" });
      }

      db.run(
        "UPDATE users SET email_verified = 1 WHERE id = ?",
        [userId],
        (err2) => {
          if (err2) return res.status(500).json({ error: "DB error" });

          res.json({ success: true, message: "Email підтверджено!" });
        }
      );
    }
  );
});

// ===================
// Login api
// ===================
// Перевіряє облікові дані та повертає дані користувача

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Введіть email та пароль.' });
  }

  const emailVal = email.trim();

  db.get(
    'SELECT id, fullname, email, password_hash, weight, height, goal, email_verified, avatar_url FROM users WHERE email = ?',
    [emailVal],
    async (err, user) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!user) return res.status(400).json({ error: 'Невірний email або пароль.' });

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(400).json({ error: 'Невірний email або пароль.' });

      if (!user.email_verified) {
        return res.status(403).json({ error: 'Потрібно підтвердити email.' });
      }

      const avatarUrl = user.avatar_url || null;

      res.json({
        success: true,
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          weight: user.weight,
          height: user.height,
          goal: user.goal,
          avatarUrl: avatarUrl
        }
      });
    }
  );
});

// ===================
// Profile update api
// ===================
// Оновлює особисті дані користувача

app.post('/api/profile/update', (req, res) => {
  const { id, fullname, weight, height, goal } = req.body;
  if (!id) return res.status(400).json({ error: 'Не передано id користувача.' });

  db.run(
    `UPDATE users
     SET fullname = ?, weight = ?, height = ?, goal = ?
     WHERE id = ?`,
    [
      fullname || null,
      weight || null,
      height || null,
      goal || null,
      id
    ],
    function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ success: true });
    }
  );
});

// ===================
// Favourites api
// ===================
// Повертає та змінює список улюблених рецептів користувача

app.get('/api/favourites', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId обовʼязковий.' });

  db.all(
    'SELECT * FROM favourite_recipes WHERE user_id = ?',
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ favourites: rows });
    }
  );
});

app.post('/api/favourites/toggle', (req, res) => {
  const { userId, recipe } = req.body;
  if (!userId || !recipe || !recipe.slug) {
    return res.status(400).json({ error: 'Невірні дані.' });
  }

  db.get(
    'SELECT id FROM favourite_recipes WHERE user_id = ? AND recipe_slug = ?',
    [userId, recipe.slug],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });

      if (row) {
        db.run(
          'DELETE FROM favourite_recipes WHERE id = ?',
          [row.id],
          err2 => {
            if (err2) return res.status(500).json({ error: 'DB error' });
            res.json({ favourite: false });
          }
        );
      } else {
        db.run(
          `INSERT INTO favourite_recipes
           (user_id, recipe_slug, recipe_title, recipe_image, recipe_meta)
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            recipe.slug,
            recipe.title || '',
            recipe.image || '',
            recipe.meta || ''
          ],
          err2 => {
            if (err2) return res.status(500).json({ error: 'DB error' });
            res.json({ favourite: true });
          }
        );
      }
    }
  );
});

// ===================
// Public api
// ===================
// Надає дані для фронтенду (stories та recipes)

app.get('/api/stories', (req, res) => {
  db.all('SELECT * FROM stories ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });

    const stories = rows.map(row => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      date: row.date,
      readTime: row.read_time,
      author: row.author,
      image: row.image,
      excerpt: row.excerpt,
      tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
      featured: !!row.featured
    }));

    res.json({ stories });
  });
});

// Одна історія
app.get('/api/stories/:slug', (req, res) => {
  db.get(
    'SELECT * FROM stories WHERE slug = ?',
    [req.params.slug],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(404).json({ error: 'Not found' });

      const story = {
        id: row.id,
        slug: row.slug,
        title: row.title,
        category: row.category,
        date: row.date,
        readTime: row.read_time,
        author: row.author,
        image: row.image,
        excerpt: row.excerpt,
        tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
        featured: !!row.featured,
        content: row.content
          ? row.content.split(/\n\s*\n/).map(p => p.trim())
          : []
      };

      res.json(story);
    }
  );
});

// Список рецептів
app.get('/api/recipes', (req, res) => {
  db.all('SELECT * FROM recipes ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });

    const recipes = rows.map(row => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      cookingTime: row.cooking_time,
      calories: row.calories,
      image: row.image,
      shortDesc: row.short_desc,
      tags: row.tags ? row.tags.split(',').map(t => t.trim()) : []
    }));

    res.json({ recipes });
  });
});

// Окремий рецепт по slug
app.get('/api/recipes/:slug', (req, res) => {
  db.get(
    'SELECT * FROM recipes WHERE slug = ?',
    [req.params.slug],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(404).json({ error: 'Not found' });

      const recipe = {
        id: row.id,
        slug: row.slug,
        title: row.title,
        category: row.category,
        cookingTime: row.cooking_time,
        calories: row.calories,
        image: row.image,
        shortDesc: row.short_desc,
        content: row.content || '',
        tags: row.tags ? row.tags.split(',').map(t => t.trim()) : []
      };

      res.json(recipe);
    }
  );
});


// Admin panel
app.get('/admin', (req, res) => res.redirect('/admin/stories'));

// Admin stories
app.get('/admin/stories', (req, res) => {
  db.all(
    'SELECT id, title, slug, date, featured FROM stories ORDER BY date DESC',
    [],
    (err, rows) => {
      if (err) return res.status(500).send('DB error');
      res.render('stories-list', { stories: rows });
    }
  );
});

// форма створення
app.get('/admin/stories/new', (req, res) => {
  res.render('story-form', {
    story: {},
    action: '/admin/stories/new',
    buttonText: 'Create story'
  });
});

// створення
app.post('/admin/stories/new', (req, res) => {
  const {
    slug, title, category, date, read_time,
    author, image, excerpt, content, tags, featured
  } = req.body;

  db.run(
    `INSERT INTO stories
      (slug, title, category, date, read_time, author, image, excerpt, content, tags, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      slug, title, category, date, read_time || null,
      author, image, excerpt, content, tags, featured ? 1 : 0
    ],
    err => {
      if (err) {
        console.error(err);
        return res.status(500).send('DB error');
      }
      res.redirect('/admin/stories');
    }
  );
});

// форма редагування
app.get('/admin/stories/:id/edit', (req, res) => {
  db.get(
    'SELECT * FROM stories WHERE id = ?',
    [req.params.id],
    (err, row) => {
      if (err || !row) return res.status(404).send('Story not found');

      res.render('story-form', {
        story: row,
        action: `/admin/stories/${row.id}/edit`,
        buttonText: 'Save changes'
      });
    }
  );
});

// збереження редагування
app.post('/admin/stories/:id/edit', (req, res) => {
  const {
    slug, title, category, date, read_time,
    author, image, excerpt, content, tags, featured
  } = req.body;

  db.run(
    `UPDATE stories SET
      slug=?, title=?, category=?, date=?, read_time=?,
      author=?, image=?, excerpt=?, content=?, tags=?, featured=?
     WHERE id = ?`,
    [
      slug, title, category, date, read_time || null,
      author, image, excerpt, content, tags, featured ? 1 : 0,
      req.params.id
    ],
    err => {
      if (err) {
        console.error(err);
        return res.status(500).send('DB error');
      }
      res.redirect('/admin/stories');
    }
  );
});

// видалення
app.post('/admin/stories/:id/delete', (req, res) => {
  db.run(
    'DELETE FROM stories WHERE id = ?',
    [req.params.id],
    err => {
      if (err) return res.status(500).send('DB error');
      res.redirect('/admin/stories');
    }
  );
});


// Admin recipes
app.get('/admin/recipes', (req, res) => {
  db.all('SELECT * FROM recipes ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).send('DB error');
    res.render('recipes-list', { recipes: rows });
  });
});

// форма створення нового рецепта
app.get('/admin/recipes/new', (req, res) => {
  res.render('recipe-form', {
    recipe: {},
    action: '/admin/recipes/new',
    buttonText: 'Create'
  });
});

// створення
app.post('/admin/recipes/new', (req, res) => {
  const {
    slug,
    title,
    category,
    cooking_time,
    calories,
    image,
    short_desc,
    content,
    tags
  } = req.body;

  db.run(
    `INSERT INTO recipes
     (slug, title, category, cooking_time, calories, image, short_desc, content, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [slug, title, category, cooking_time, calories, image, short_desc, content, tags],
    err => {
      if (err) return res.status(500).send('DB error');
      res.redirect('/admin/recipes');
    }
  );
});

// форма редагування
app.get('/admin/recipes/:id/edit', (req, res) => {
  db.get('SELECT * FROM recipes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).send('DB error');
    if (!row) return res.status(404).send('Not found');

    res.render('recipe-form', {
      recipe: row,
      action: '/admin/recipes/' + row.id + '/edit',
      buttonText: 'Save'
    });
  });
});

// збереження змін
app.post('/admin/recipes/:id/edit', (req, res) => {
  const {
    slug,
    title,
    category,
    cooking_time,
    calories,
    image,
    short_desc,
    content,
    tags
  } = req.body;

  db.run(
    `UPDATE recipes
     SET slug = ?, title = ?, category = ?, cooking_time = ?, calories = ?, image = ?,
         short_desc = ?, content = ?, tags = ?
     WHERE id = ?`,
    [slug, title, category, cooking_time, calories, image, short_desc, content, tags, req.params.id],
    err => {
      if (err) return res.status(500).send('DB error');
      res.redirect('/admin/recipes');
    }
  );
});

// видалення
app.post('/admin/recipes/:id/delete', (req, res) => {
  db.run('DELETE FROM recipes WHERE id = ?', [req.params.id], err => {
    if (err) return res.status(500).send('DB error');
    res.redirect('/admin/recipes');
  });
});

// ===================
// Server start
// ===================
// Запускає сервер та починає приймати запити

app.listen(PORT, () => {
  console.log(`CMS running → http://localhost:${PORT}`);
});

// ===================
// Contact api
// ===================
// Приймає повідомлення з контактної форми та зберігає їх у файл

app.post('/api/contact', (req, res) => {
  console.log('/api/contact викликано, body:', req.body);

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    console.log('Неповні дані, файл не пишемо');
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  const text =
`---------------------------
Name: ${name}
Email: ${email}
Message: ${message}
Date: ${new Date().toLocaleString()}
---------------------------

`;

  const filePath = path.join(__dirname, 'feedback.txt');
  console.log('Пишемо у файл:', filePath);

  fs.appendFile(filePath, text, (err) => {
    if (err) {
      console.error("Помилка запису у файл:", err);
      return res.status(500).json({ success: false });
    }

    console.log('Запис успішно додано до feedback.txt');
    res.json({ success: true });
  });
});
