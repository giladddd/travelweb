/* UCSideMenu polyfill for static local copy */
function UCSideMenu() {}

UCSideMenu.prototype.initSideMenu = function(id, ajaxUrl) {
  var container = jQuery('#' + id);
  var panel     = container.find('.uc-side-menu-wrapper');
  var openBtn   = container.find('.open_side_menu, .uc-menu-button-wrapper');
  var closeBtn  = container.find('.uc-close-side-menu');

  function openMenu() {
    panel.removeClass('menu-right-close').addClass('menu-right-open');
    jQuery('body').addClass('uc-menu-open');
    addArrows();
  }

  function closeMenu() {
    panel.removeClass('menu-right-open').addClass('menu-right-close');
    jQuery('body').removeClass('uc-menu-open');
  }

  function addArrows() {
    container.find('.uc-list-menu .menu-item-has-children > a').each(function() {
      if (!jQuery(this).find('.submenu-arrow').length) {
        jQuery(this).append('<span class="submenu-arrow" style="margin-right:8px;display:inline-block;transition:transform 0.2s;font-size:0.75em;opacity:0.85;float:left;">&#9660;</span>');
      }
    });
  }

  // Add arrows immediately on load too
  setTimeout(addArrows, 500);

  openBtn.on('click', function(e) {
    e.stopPropagation();
    if (panel.hasClass('menu-right-open')) { closeMenu(); } else { openMenu(); }
  });

  closeBtn.on('click', function(e) {
    e.stopPropagation();
    closeMenu();
  });

  // Sub-menu expand/collapse — stopPropagation prevents menu from closing
  container.on('click', '.uc-list-menu .menu-item-has-children > a', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var $parent = jQuery(this).parent();
    var $sub = $parent.find('> ul.sub-menu');
    if ($sub.length) {
      var opening = $sub.is(':hidden');
      $sub.slideToggle(250);
      $parent.toggleClass('menu-open', opening);
      jQuery(this).find('.submenu-arrow').css('transform', opening ? 'rotate(180deg)' : 'rotate(0deg)');
    }
  });
};
