
// Burger-menu
function initBurger() {
  const burger = document.getElementById('burgerMenu');
  const nav = document.getElementById('mainNav');

  if (burger && nav) {
    burger.addEventListener('click', () => {
      nav.classList.toggle('active');
    });
  }
}
document.addEventListener('DOMContentLoaded', initBurger);
document.addEventListener("click", function (e) {
  const btn = e.target.closest(".favorite-btn");
  if (!btn) return;
  btn.classList.toggle("active");
});
