# HealthPlate

Виконали: Драган Влада, Завальська Анастасія КІ-33

## Опис проєкту
HealthPlate - це онлайн-сервіс для персоналізованого планування здорового харчування. Користувачі можуть створювати індивідуальні плани харчування, враховуючи вік, стать, рівень активності, цілі, харчові вподобання та алергії. Сервіс надаватиме готові рецепти, підрахунок калорій та формування списку продуктів.

## Основний функціонал 
* Можливість зареєструватись, увійти в профіль, а також редагувати його
* Перегляд стрічки зі статтями
* Пошук рецептів за фільтрами, перегляд їх харчової цінності, зберігання улюблених рецептів
* Створення персоналізованого меню на основі особистих параметрів та мети (зменшення/утримання/набір ваги)
* Можливість зворотнього зв'язку

## Основні сторінки
* index.html - головна сторінка, опис функціоналу сервісу
* about.html - інформація про розробників
* authorization.html - авторизація користувача
* community.html - стрічка, у якій публікуються статті пов'язані зі здоров'ям та їжею
* contacts.html - сторінка з контактами для зворотного зв'язку
* menu.html - створення персоналізованого меню
* profile.html - профіль користувача
* recipes.html - перелік рецептів за вподобаннями
  
## Структура проєкту
HealthPlate/ \
|— node_modules \
|— backend/ \
&nbsp;&nbsp;&nbsp;&nbsp;|— views/ \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— layout.ejs \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— recipe-form.ejs \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— recipes-list.ejs \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— stories-list.ejs \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— story-form.ejs \
&nbsp;&nbsp;&nbsp;&nbsp;|— config.js \
&nbsp;&nbsp;&nbsp;&nbsp;|— db.sqlite \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— feedback.txt \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— init.sql \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— server.js \
|— public/ \
&nbsp;&nbsp;&nbsp;&nbsp;|— css/ \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— auth.css \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— base.css \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— components.css \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— layout.css \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— style.css \
&nbsp;&nbsp;&nbsp;&nbsp;|— images/ \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— community \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— recipes \
&nbsp;&nbsp;&nbsp;&nbsp;|— js/ \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— main.js \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|— auth.js	 \
&nbsp;&nbsp;&nbsp;&nbsp;|— uploads/ \
&nbsp;&nbsp;&nbsp;&nbsp;|— about.html \
&nbsp;&nbsp;&nbsp;&nbsp;|— authorization.html \
&nbsp;&nbsp;&nbsp;&nbsp;|— community.html \ 
&nbsp;&nbsp;&nbsp;&nbsp;|— contacts.html \
&nbsp;&nbsp;&nbsp;&nbsp;|— favorites.html \
&nbsp;&nbsp;&nbsp;&nbsp;|— index.html \
&nbsp;&nbsp;&nbsp;&nbsp;|— menu.html \
&nbsp;&nbsp;&nbsp;&nbsp;|— profile.html \
&nbsp;&nbsp;&nbsp;&nbsp;|—recipe.html \
&nbsp;&nbsp;&nbsp;&nbsp;|— recipes.html \
&nbsp;&nbsp;&nbsp;&nbsp;|— register.html \
&nbsp;&nbsp;&nbsp;&nbsp;|—story.html 


&nbsp;
## Опис використаних технологій
HTML5 — семантична розмітка та структура сторінок \
CSS3 — стилізація інтерфейсу, адаптивний дизайн \
JavaScript — бургер-меню та мінімальна інтерактивність 

## HTML-елементи
Семантичні теги: \
header, nav, main, footer, section, article, form, figure, figcaption 

Текст та списки: \
h1–h3, p, ul, li, strong, span 

Форми: \
input, label, button, textarea 

Медіа та навігація: \
img, a 

Службові елементи: \
div, hr 

## CSS-технології

* CSS Custom Properties (змінні)
* Flexbox для побудови макетів
* CSS Grid для сіток
* Media Queries для адаптивності
* Reset та уніфікація стилів через *, *::before, *::after { box-sizing: border-box; }
* Модульна структура (base.css, layout.css, components.css, auth.css)
* Головний файл style.css з підключенням модулів через @import
* Breakpoints: 768px, 480px
* Перебудова блоків під мобільні пристрої
* Реалізоване бургер-меню для маленьких екранів
* Особливості реалізації
* Плавні переходи та hover-ефекти
* Тіні та скруглення елементів
* Активні стани інпутів та кнопок
* Уніфікована система відступів і кольорів
* Кросбраузерна підтримка

