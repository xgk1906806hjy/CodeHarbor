(function () {
  function toast(message) {
    var node = document.querySelector('[data-toast]');
    if (!node) {
      node = document.createElement('div');
      node.setAttribute('data-toast', '');
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () {
      node.classList.remove('is-visible');
    }, 2200);
  }

  document.querySelectorAll('[data-save]').forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      button.classList.toggle('is-saved');
      var saved = button.classList.contains('is-saved');
      var label = button.querySelector('[data-save-label]');
      if (label) label.textContent = saved ? '已收藏' : '收藏';
      toast(saved ? '已收藏到你的工作台' : '已取消收藏');
    });
  });

  document.querySelectorAll('[data-feed-tabs]').forEach(function (group) {
    group.querySelectorAll('[data-tab]').forEach(function (button) {
      button.addEventListener('click', function () {
        group.querySelectorAll('[data-tab]').forEach(function (item) {
          item.classList.remove('is-active');
          item.setAttribute('aria-selected', 'false');
        });
        button.classList.add('is-active');
        button.setAttribute('aria-selected', 'true');
        var kind = button.getAttribute('data-tab');
        document.querySelectorAll('[data-feed-item]').forEach(function (item) {
          item.hidden = kind !== 'all' && item.getAttribute('data-feed-item') !== kind;
        });
      });
    });
  });

  document.querySelectorAll('[data-mobile-menu]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
    });
  });

  document.querySelectorAll('[data-search-open]').forEach(function (button) {
    button.addEventListener('click', function () {
      var panel = document.querySelector('[data-search-panel]');
      if (!panel) return;
      panel.classList.add('is-open');
      var input = panel.querySelector('input');
      if (input) setTimeout(function () { input.focus(); }, 50);
    });
  });

  document.querySelectorAll('[data-search-close]').forEach(function (button) {
    button.addEventListener('click', function () {
      var panel = document.querySelector('[data-search-panel]');
      if (panel) panel.classList.remove('is-open');
    });
  });
})();
