/* ==============================
   Stories table
   ==============================
   Зберігає статті для сторінок community та story
*/
CREATE TABLE IF NOT EXISTS stories ( 
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  date TEXT NOT NULL,
  read_time INTEGER,
  author TEXT,
  image TEXT,
  excerpt TEXT,
  content TEXT,
  tags TEXT,
  featured INTEGER DEFAULT 0
);

/* ==============================
   Recipes table
   ==============================
   Зберігає рецепти для сторінок recipes, recipe та генератора меню
*/
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,     
  title TEXT NOT NULL,           
  category TEXT,                 
  cooking_time TEXT,             
  calories INTEGER,              
  image TEXT,                   
  short_desc TEXT,              
  content TEXT,                  
  tags TEXT                      
);

/* ==============================
   Users table
   ==============================
   Зберігає дані зареєстрованих користувачів
*/
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  weight REAL,
  height REAL,
  goal TEXT,
  email_verified INTEGER DEFAULT 0,
  verification_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  avatar_url TEXT                
);

/* ==============================
   Favourite recipes table
   ==============================
   Зберігає збережені улюблені рецепти користувачів
*/
CREATE TABLE IF NOT EXISTS favourite_recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  recipe_slug TEXT NOT NULL,
  recipe_title TEXT NOT NULL,
  recipe_image TEXT,
  recipe_meta TEXT,
  UNIQUE(user_id, recipe_slug)
);
