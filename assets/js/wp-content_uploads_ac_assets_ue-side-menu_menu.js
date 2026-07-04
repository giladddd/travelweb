/* UCSideMenu polyfill for static local copy */
function UCSideMenu() {}

UCSideMenu.prototype.initSideMenu = function(id, ajaxUrl) {
  var container = jQuery('#' + id);
  var panel     = container.find('.uc-side-menu-wrapper');
  var openBtn   = container.find('.open_side_menu, .uc-menu-button-wrapper');
  var closeBtn  = container.find('.uc-close-side-menu');

  function openMenu() {
    panel.removeClass('menu-right-close').addClass('menu-right-open');
    panel.css('display', '');
    jQuery('body').addClass('uc-menu-open');
  }

  function closeMenu() {
    panel.removeClass('menu-right-open').addClass('menu-right-close');
    jQuery('body').removeClass('uc-menu-open');
  }

  openBtn.on('click', function(e) {
    e.stopPropagation();
    if (panel.hasClass('menu-right-open')) { closeMenu(); } else { openMenu(); }
  });

  closeBtn.on('click', function(e) {
    e.stopPropagation();
    closeMenu();
  });

  // Handle sub-menu expand/collapse
  container.find('.uc-list-menu .menu-item-has-children > a').on('click', function(e) {
    var parent = jQuery(this).parent();
    var sub = parent.find('> ul.sub-menu');
    if (sub.length) {
      e.preventDefault();
      sub.slideToggle(300);
      parent.toggleClass('menu-open');
    }
  });
};
