window.ISF = window.ISF || {};

(function () {
  window.ISF.initAccordion = function (root = document) {
    const cards = [...root.querySelectorAll('.accordion-card')];
    if (!cards.length) return;

    cards.forEach((card) => {
      const chevron = card.querySelector('.accordion-card__chevron');
      if (chevron) chevron.innerHTML = window.ISF.icon('chevron');
    });

    function setExpanded(card, expanded) {
      const toggle = card.querySelector('.accordion-card__toggle');
      const panel = card.querySelector('.accordion-card__panel');
      card.classList.toggle('is-expanded', expanded);
      toggle?.setAttribute('aria-expanded', String(expanded));
      panel?.setAttribute('aria-hidden', String(!expanded));
    }

    cards.forEach((card) => {
      const toggle = card.querySelector('.accordion-card__toggle');
      toggle?.addEventListener('click', () => {
        if (card.classList.contains('is-expanded')) return;
        cards.forEach((c) => setExpanded(c, c === card));
      });
    });

    // Deep links (the top "Launch" button, Playbook's day-card links) jump
    // straight to a specific card's #id — make sure that card is the one
    // that's actually open, not just scrolled-to-while-collapsed.
    function openFromHash() {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const target = cards.find((c) => c.id === id);
      if (target && !target.classList.contains('is-expanded')) {
        cards.forEach((c) => setExpanded(c, c === target));
      }
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  };
})();
