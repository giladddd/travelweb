function UCFullscreenMenu(menuWrapperID){
  
  var t = this;
  
  //classes / ids
  var g_menuWrapperID, g_subMenuClass, g_collapsedClass, g_expandedClass, g_noTransitionClass, g_listMenuClass, g_menuItemPointerClass, g_menuOpenedClass, g_isActiveCLass, g_menuItemHasChildrenClass, ucForceDisablePageScroll;
  
  //selectors
  var g_subMenuSelector, g_expandedSelector, g_menuItemPointerSelector, g_checkboxToggleSelector, g_objBody, g_objHTML, g_objWindow, g_innerMenuExpandIconSelector, g_innerMenuCollapseIconSelector;
  
  //obj
  var g_objWidget, g_objInnerMenu, g_objMenuLinks, g_objListMenu, g_objMenuItemPointers, g_objMenuItemHasChildren, g_objHamburgerMenu, g_objCheckboxToggle, g_objUCHamburger, g_objUCHamburgerLink;
  
  //helpers
  var g_isIconClicked = false, g_isCloseOnOpen = false, g_isLoaded = false, g_isClickable, g_dataOpenOnHover, g_isDesktopViewport;
  
  /**
  * collapse inner section
  */
  function collapseInnerSection(element, link){    
    var sectionHeight = element.scrollHeight;    
    var elementTransition = element.style.transition;
    element.style.transition = '';    
    
    requestAnimationFrame(function() {
      element.style.height = sectionHeight + 'px';
      element.style.transition = elementTransition;      
      
      requestAnimationFrame(function() {	
        element.style.height = 0 + 'px';        
      });
    });
    
    element.setAttribute('data-collapsed', 'true');
  }
  
  /**
  * expand the inner of the section
  */
  function expandSectionInner(element){
    var sectionHeight = element.scrollHeight;
    
    element.style.height = sectionHeight + 'px';
    
    element.addEventListener('transitionend', function(e) {
      element.removeEventListener('transitionend', arguments.callee);
      element.style.height = null;
    });
    
    element.setAttribute('data-collapsed', 'false');    
  }
  
  /**
  * expand section
  */
  function expandSection(section, objLink){    
    expandSectionInner(section);
    
    section.setAttribute('data-collapsed', 'false')
    objLink.removeClass(g_collapsedClass);
    objLink.addClass(g_expandedClass);    
  }
  
  /**
  * collapse the section
  */
  function collapseSection(section, objLink){    
    collapseInnerSection(section, objLink);
    
    objLink.addClass(g_collapsedClass);
    objLink.removeClass(g_expandedClass);
  }
  
  /**
  * collapse all expanded sections
  */
  function collapseAllExpanded(clickedItem){
    var clickedParentExpanded = jQuery(clickedItem).parents(g_subMenuSelector).prev();    
    var clickedChildrenExpanded = jQuery(clickedItem).next().find(g_expandedSelector);     
    var objAllExpanded = g_objInnerMenu.find(g_expandedSelector).not(clickedChildrenExpanded).not(clickedParentExpanded);
    
    if(objAllExpanded.length == false)
      return(false);
    
    jQuery.each(objAllExpanded, function(index, link){
      var objLink = jQuery(link);
      var section = link.nextElementSibling;
      
      collapseSection(section, objLink);      
    });
  }
  
  /**
  * close or open link
  */
  function toggleSection(objLink){    
    var link = objLink[0];
    var section = link.nextElementSibling;    
    var isCollapsed = section.getAttribute('data-collapsed') === 'true';
    
    if (isCollapsed) {		//expend current      
      if(g_isCloseOnOpen == true)
        collapseAllExpanded(link);
      
      expandSection(section, objLink);      
    } else {		//collapse current      
      collapseSection(section,objLink);
    }    
  }
  
  /**
  * open or close some item
  */
  function openCloseItem(link, event){    
    var section = link.nextElementSibling;
    
    if(!section)
      return(true);
    
    var objSection = jQuery(section);
    if(objSection.hasClass(g_subMenuClass) == false)
      return(true);
    
    if(event)
      event.preventDefault();
    
    var objLink = jQuery(link);    
    var isCollapsed = section.getAttribute('data-collapsed') === 'true';
    
    if (isCollapsed) {		//expend current      
      if(g_isCloseOnOpen == true)
        collapseAllExpanded(link);
      
      expandSection(section, objLink);      
    } else {		//collapse current      
      collapseSection(section,objLink);
    }    
  }
  
  /**
  * got to item
  */
  function showExpandCollapseIcons(e, objLink){   
    toggleIcon(objLink);
    
    var url = objLink.attr("href");
    url = jQuery.trim(url);
    
    if(!url)
      return(true);
    
    var objLinkParent = objLink.parent();    
    var expandCollapsed = g_objListMenu.find(g_menuItemPointerSelector)
    var target = e.target
    
    if(expandCollapsed && expandCollapsed.length > 0 && target.className == expandCollapsed[0].className)
      return(true);
    
    if(g_isClickable == false){
      
      if(objLinkParent.hasClass(g_menuItemHasChildrenClass) == true)
        return(true)
      else
        resetMenuState();      
      
    }else{
      resetMenuState();
    }
    
    return(true);
  }
  
  /**
  * on menu item click, if sub menu, open or close
  */
  function onMenuItemClick(event){   
    openCloseItem(this, event);    
    
    var objLink = jQuery(this);
    
    showExpandCollapseIcons(event, objLink);    
  }
  
  /**
  * expand current item tree
  */
  function expandCurrentItemTree(){    
    //disable transition    
    var objCurrentItem = g_objInnerMenu.find(".current-menu-item");
    
    if(objCurrentItem.length == 0)
      return(false);
    
    g_objInnerMenu.addClass(g_noTransitionClass);
    
    setTimeout(function(){
      g_objInnerMenu.removeClass(g_noTransitionClass);
    },300);
    
    var objParents = objCurrentItem.parents("li");
    
    if(objParents.length == 0)
      return(false);
    
    jQuery.each(objParents, function(index, parent){      
      var objParent = jQuery(parent);
      var objLink = objParent.children("a");      
      var link = objLink[0];
      
      openCloseItem(link);      
    });    
  }
  
  // collapse all except the current	
  this.collapseAll = function(){    
    g_objMenuLinks.each((i, item) => {
      var objLink = jQuery(item);
      
      collapseAllExpanded(objLink[0]);		    
    });
  }  
  
  /**
  * expand all
  */
  this.expandAllAfterPageLoad = function(){
    var dataExpandAll = g_objInnerMenu.data("expandall");
    
    if(dataExpandAll == false)
      return(false);
    
    if(!g_objMenuItemHasChildren || g_objMenuItemHasChildren.length == 0)
      return(false);
    
    //disable transition temporarely
    g_objInnerMenu.addClass(g_noTransitionClass);
    setTimeout(function(){
      g_objInnerMenu.removeClass(g_noTransitionClass);
    },300);
    
    g_objMenuItemHasChildren.each(function(){
      var objItem = jQuery(this);
      var objLink = objItem.children("a");      
      var link = objLink[0];
      
      openCloseItem(link); 
    });
  }
  
  /*
  * open current page menu item
  */
  this.openCurrentPageMenuItem = function(){
    var currentLocation =  window.location.href;
    
    g_objMenuLinks.each((i, item) => {
      
      var objLink = jQuery(item);
      var section = item.nextElementSibling;  
      var objLinkItemHref = objLink.attr('href');
      
      if(currentLocation == objLinkItemHref){
        
        if(jQuery(section) && jQuery(section).length > 0)
          expandSection(section, objLink); 
        
        var objParentSection = objLink.parents(g_subMenuSelector);
        
        if(!objParentSection)
          return(true)
        
        var objParentLink = objParentSection.prev();
        
        if(!objParentLink)
          return(true)
        
        if(objParentSection && objParentSection.length > 0)
          expandSection(objParentSection[0], objParentLink);
      }    
    });    
  }  
  
  /*
  * position fixed protection from parents transform rules
  */
  function protectForFixed(){    
    //find element with position fixed css rule
    var objFixedElement = g_objInnerMenu.parents('.ue_menu');
    
    //find all parents and look at each one
    var objFixedParents = objFixedElement.parents();
    
    objFixedParents.each(function(){      
      var objFixedParent = jQuery(this);
      
      //check if parent has one of issued css rules
      var transformRule = objFixedParent.css('transform');
      
      //if transform is epsent then skip and move to another css rule
      if(transformRule == 'none')
        return(true);
      
      //if finds transform then remove it
      objFixedParent.css('transform', '');
      
      //animation-fill-mode
      var fillmodeRule = objFixedParent.css('animation-fill-mode');
      
      if(fillmodeRule == 'none')
        return(true);
      
      objFixedParent.css('animation-fill-mode', 'none');
      
      //perspective
      var perspectiveRule = objFixedParent.css('perspective');
      
      if(perspectiveRule == 'none')
        return(true);
      
      objFixedParent.css('perspective', 'none');
      
      //filter
      var filterRule = objFixedParent.css('filter');
      
      if(filterRule == 'none')
        return(true);
      
      objFixedParent.css('filter', 'none');      
    });    
  }  
  
  /**
  * on hamburger menu icon keydown
  */
  function onHamburgerKeydown(event){
    var keyCode =  event.keyCode;
    
    if(keyCode == 13 && g_objHamburgerMenu.is(":focus")){
      
      g_objCheckboxToggle.trigger("click");
    }
  }
  
  /**
  * close menu
  */
  function closeMenu(){
    g_objBody.removeClass(g_menuOpenedClass);
    g_objHTML.removeClass(g_menuOpenedClass);
    g_objWidget.removeClass(g_menuOpenedClass);
    g_objHamburgerMenu.attr("aria-expanded", false);
  }
  
  /**
  * reset menu state
  */
  function resetMenuState(){    
    g_objCheckboxToggle.prop('checked',false);    
    
    closeMenu();
    
    if(g_objUCHamburger && g_objUCHamburger.length > 0){
      g_objUCHamburger.removeClass(g_isActiveCLass);
      g_objUCHamburgerLink.removeClass(g_isActiveCLass);
    }
  }
  
  /**
  * toggle icons
  */
  function toggleIcons() {
    var objExpandIconHTML = g_objWidget.find(g_innerMenuExpandIconSelector).html();
    var objCollapseIconHTML = g_objWidget.find(g_innerMenuCollapseIconSelector).html();
    
    g_objMenuLinks.each(function() {
      var objLink = jQuery(this);
      var isLinkOpened = objLink.hasClass(g_expandedClass);
      var objLinkContainer = objLink.find(g_menuItemPointerSelector);
      
      // Update icon based on the state of the menu item
      if (isLinkOpened == true) {
        objLinkContainer.html(objCollapseIconHTML);
      } else {
        objLinkContainer.html(objExpandIconHTML);
      }
    });
  }
  
  /**
  * toggle icon for a specific link
  */
  function toggleIcon(objLink) {
    var isLinkOpened = objLink.hasClass(g_expandedClass);
    var objLinkContainer = objLink.find(g_menuItemPointerSelector);
    var objExpandIconHTML = g_objWidget.find(g_innerMenuExpandIconSelector).html();
    var objCollapseIconHTML = g_objWidget.find(g_innerMenuCollapseIconSelector).html();
    
    // Update icon based on the state of the menu item
    if (isLinkOpened) {
      objLinkContainer.html(objCollapseIconHTML);
    } else {
      objLinkContainer.html(objExpandIconHTML);
    }
    
    // Update all icons
    toggleIcons();
  }
  
  /**
  * open menu
  */
  function openMenu(){
    var dataOpenCurrentOnLoad = g_objInnerMenu.data("open-current-menu");
    
    g_objBody.addClass(g_menuOpenedClass);
    g_objHTML.addClass(g_menuOpenedClass);
    g_objWidget.addClass(g_menuOpenedClass);
    t.collapseAll();
    g_objHamburgerMenu.attr("aria-expanded", true);
    
    if(dataOpenCurrentOnLoad == true)
      objMenu.openCurrentPageMenuItem();
    
    if(g_isLoaded == false){
      t.expandAllAfterPageLoad();
    }
    
    g_isLoaded = true;                                                                                       
    
    g_objMenuLinks.each(function(){
      var objLink = jQuery(this);
      
      toggleIcon(objLink);
    });
    
    if(g_objUCHamburger && g_objUCHamburger.length > 0){
      g_objUCHamburger.addClass(g_isActiveCLass);
      g_objUCHamburgerLink.addClass(g_isActiveCLass);
    } 
  }
  
  /**
  * on checkbox toggle click
  */
  function onCheckboxToggleClick(){
    var isChecked = g_objCheckboxToggle.is(":checked");
    
    if(isChecked == true){
      openMenu();      
    }else{
      resetMenuState();      
    }  
  }
  
  /**
  * on window keydown 
  */
  function onWindowKeydown(event) {
    if(event.key == "Escape"){   
      resetMenuState();
    } 
  }
  
  /**
  * init close icon position
  */
  function initCloseIconPosition(){
    var closeIconPosition = g_objInnerMenu.data('close-position');
    
    if(closeIconPosition == 'top'){
      var scrolledDistance;
      
      g_objInnerMenu.on('scroll', function(e){          
        scrolledDistance = g_objInnerMenu.scrollTop();
        
        g_objCheckboxToggle.css({
          'transform': 'translate(0, -' + scrolledDistance + 'px)',
          'transition': 'unset'
        });
        g_objHamburgerMenu.css({
          'transform': 'translate(0, -' + scrolledDistance + 'px)',
          'transition': 'unset'
        });
      });
      
      g_objWidget.delegate(g_checkboxToggleSelector, 'click', function(){
        
        g_objCheckboxToggle.css({
          'transform': 'translate(0, 0)',
          'transition': ''
        });
        
        g_objHamburgerMenu.css({
          'transform': 'translate(0, 0)',
          'transition': ''
        });
      });
    }
  }
  
  /**
  * on mouse hover
  */
  function onMouseHover(){
    if(g_dataOpenOnHover == false)
      return(true);
    
    if(g_isDesktopViewport == false)
      return(true);
    
    var objLink = jQuery(this);
    var objLinkParent = objLink.parent();
    
    if(objLinkParent.hasClass(g_menuItemHasChildrenClass) == false)
      return(true);
    
    if(g_isClickable == true){
      if(objLink.hasClass(g_expandedClass) == true)
        return(true);
      
      var objLinkIcon = objLink.find(g_menuItemPointerSelector);
      
      objLinkIcon.trigger("click");
    }else{
      if(objLink.hasClass(g_expandedClass) == true)
        return(true);
      
      objLink.trigger("click");
    }
  } 
  
  /**
  * init exp / collase icons
  */
  function initExpandCollapseIcons(){
    var dataShowIcons = g_objInnerMenu.data("show-menuicons");
    
    if(dataShowIcons == false)
      return(false);
    
    g_objMenuLinks.each(function(){
      objLink = jQuery(this);
      
      toggleIcon(objLink);
    }); 
  }
  
  /**
  * on mouse leave
  */
  function onMouseLeave(){        
    if(g_dataOpenOnHover == false)
      return(true);
    
    if(g_isDesktopViewport == false)
      return(true);
    
    var objLinkParent = jQuery(this);
    var objLink = objLinkParent.find('> a');    
    
    if(g_isClickable == true){
      
      if(objLink.hasClass(g_collapsedClass) == true)
        return(false);
      
      var objLinkIcon = objLink.find(g_menuItemPointerSelector);
      
      setTimeout(function(){
        objLinkIcon.trigger("click");
      }, 600);
      
    }else{
      if(objLink.hasClass(g_collapsedClass) == true)
        return(false);
      
      setTimeout(function(){
        objLink.trigger("click");
      }, 600);
    }    
  }
  
  /**
  * fix for sticky parent section
  */
  function initFixForStickyParent(){
    var objParents = g_objWidget.parents();
    var ucVisibleClass = "uc-visible";
    var ucHiddenClass = "uc-hidden";
    
    objParents.each(function(){
      var objParent = jQuery(this); 
      
      if(objParent.hasClass("elementor-sticky") == true){
        var isParentVisible = objParent.is(":visible");
        g_objBody.addClass(ucForceDisablePageScroll);
        g_objHTML.addClass(ucForceDisablePageScroll);
        
        if(isParentVisible == true){
          objParent.addClass(ucVisibleClass);
          objParent.removeClass(ucHiddenClass);
        } else{
          objParent.addClass(ucHiddenClass);
          objParent.removeClass(ucVisibleClass);
        }        
      }	      
    });
  }
  
  /**
  * init fix for safari browser
  */
  function initFixForSafari(){
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) 
      g_objWidget.closest(".e-flex.e-con-boxed.e-con.e-parent").css("overflow", "visible");    
  }
  
  /**
  * outer button click func
  */
  this.ueOpenFullscreenMenu = function(){
    openMenu(); 
  }
  
  /**
  * outer button click func
  */
  this.ueCloseFullscreenMenu = function(){
    resetMenuState(); 
  }
  
  /**
  * run the menu, init
  */
  function runMenu(menuWrapperID){    
    //classes / ids
    g_menuWrapperID = menuWrapperID;
    g_subMenuClass = "sub-menu";
    g_collapsedClass = "collapsed";
    g_expandedClass = "expanded";
    g_noTransitionClass = "uc-no-transition";
    g_listMenuClass = "uc-list-menu";
    g_menuItemPointerClass = "uc-menu-item-pointer";
    g_menuOpenedClass = "menu-opened";
    g_isActiveCLass = "is-active";
    g_menuItemHasChildrenClass = "menu-item-has-children";
    ucForceDisablePageScroll = "uc-force-disable-page-scroll";
    
    //selectors
    g_subMenuSelector = "."+g_subMenuClass;
    g_expandedSelector = "."+g_expandedClass;
    g_menuItemPointerSelector = "."+g_menuItemPointerClass;
    g_checkboxToggleSelector = ".checkbox-toggle";
    g_innerMenuExpandIconSelector = ".ue_inner_menu_expand_icon";
    g_innerMenuCollapseIconSelector = ".ue_inner_menu_collapse_icon";
    
    //init globals
    g_objWindow = jQuery(window);
    g_objHTML = jQuery("html");
    g_objBody = jQuery("body");
    g_objWidget = jQuery("#"+g_menuWrapperID);    
    g_objInnerMenu = g_objWidget.find(".ue_inner_menu");
    g_objListMenu = g_objWidget.find(".uc-list-menu");
    g_objMenuLinks = g_objListMenu.find("a");
    g_objHamburgerMenu = g_objWidget.find(".ue_hamburger");
    g_objCheckboxToggle = g_objWidget.find(g_checkboxToggleSelector);
    g_objUCHamburger = g_objWidget.find(".uc_hamburger");
    g_objUCHamburgerLink = g_objWidget.find(".uc_animated_hamburger_icon");    
    g_objMenuItemHasChildren = g_objListMenu.find("."+g_menuItemHasChildrenClass);
    
    //helpers
    g_isCloseOnOpen = g_objInnerMenu.data("closeothers");
    g_isCloseOnOpen = (g_isCloseOnOpen == "yes");    
    g_isClickable = g_objInnerMenu.data("clickable");
    g_dataOpenOnHover = g_objInnerMenu.data("openonhover");
    g_isDesktopViewport = window.matchMedia("(min-width: 1024px)");
    
    if(g_objWidget.length == 0){
      console.log("menu with ID: "+g_menuWrapperID+" not found!");
      
      return(false);
    }
    
    resetMenuState();
    initCloseIconPosition();
    initExpandCollapseIcons();
    initFixForSafari();
    setTimeout(initFixForStickyParent,300);
    
    jQuery(window).on("scroll", function(){
      //init fix for sticky
      setTimeout(initFixForStickyParent,100);
    });
    
    //collapse all except the current    
    g_objMenuLinks.each((i, item) => {
      //add area haspopup
      var objHasChildrenLinks = g_objMenuItemHasChildren.find("> a");
      
      if(objHasChildrenLinks && objHasChildrenLinks.length > 0){
        objHasChildrenLinks.attr("aria-haspopup", "true");
      }
      
      if(item.nextElementSibling){        
        var objItem = jQuery(item);
        var iconPosition = g_objInnerMenu.data('icon-position');
        
        if(iconPosition == 'start')
          objItem.prepend("<span class='"+g_menuItemPointerClass+"'></span>");
        
        if(iconPosition == 'end')
          objItem.append("<span class='"+g_menuItemPointerClass+"'></span>");
        
        collapseInnerSection(item.nextElementSibling, item);
        
        item.nextElementSibling.style.display = "block";
        
        jQuery(item).addClass(g_collapsedClass);
        jQuery(item).removeClass(g_expandedClass);
      }      
    });
    
    g_objMenuItemPointers = g_objListMenu.find(g_menuItemPointerSelector);
    
    //init events
    
    if(g_isClickable == false){      
      g_objMenuLinks.on("click", onMenuItemClick);      
    }else{      
      //pointer click - toggle section      
      g_objMenuItemPointers.on("click", function(event){       
        g_isIconClicked = true;
        
        var objLink = jQuery(this).parent();
        
        toggleSection(objLink);
      });
      
      g_objMenuLinks.on("click", function(e){
        
        //check if icon was clicked if not make sure that no icon found in clicked link
        if(g_isIconClicked == true){
          var objIcon = jQuery(this).find(g_menuItemPointerSelector);
          
          if(objIcon && objIcon.length > 0){
            e.preventDefault();
            
            g_isIconClicked = false;
          }
        }
        
        showExpandCollapseIcons(e, jQuery(this));
      });
    }
    
    g_objHamburgerMenu.on("keydown", function(event){
      onHamburgerKeydown(event);
    });
    
    g_objWidget.delegate(g_checkboxToggleSelector, "click", onCheckboxToggleClick);
    
    g_objWindow.on("keydown", function(e) {
      onWindowKeydown(e);
    });
    
    g_objMenuLinks.on("mouseover", onMouseHover);
    g_objMenuItemHasChildren.on("mouseleave", onMouseLeave);
    
    //open the section with current item    
    setTimeout(expandCurrentItemTree,100);
    
    //protection for elements with position fixed rule    
    setTimeout(protectForFixed,2000);    
  }  
  
  this.initFullscreenMenu = function(id){
    runMenu(id);
  }
}
