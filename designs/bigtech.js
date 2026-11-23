(function () {
  document.querySelectorAll('[data-tab-group]').forEach(function (group) {
    group.querySelectorAll('[data-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        group.querySelectorAll('[data-tab]').forEach(function (item) { item.classList.remove('active'); });
        tab.classList.add('active');
        var type = tab.dataset.tab;
        document.querySelectorAll('[data-type]').forEach(function (item) {
          item.hidden = type !== 'all' && item.dataset.type !== type;
        });
      });
    });
  });
  document.querySelectorAll('[data-open-search]').forEach(function (button) {
    button.addEventListener('click', function () {
      var panel = document.querySelector('.search-panel');
      panel.classList.add('open');
      panel.querySelector('input').focus();
    });
  });
  document.querySelectorAll('[data-close-search]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelector('.search-panel').classList.remove('open');
    });
  });
  document.querySelectorAll('[data-follow]').forEach(function (button) {
    button.addEventListener('click', function () {
      button.textContent = button.textContent === '已关注' ? '关注' : '已关注';
    });
  });
})();
