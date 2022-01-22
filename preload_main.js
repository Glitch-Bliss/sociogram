const Dom = require('./classes/domHandler.class');

document.addEventListener("DOMContentLoaded", () => {

    Dom.createWebComponents();
    Dom.updateDomEvent();
    Dom.addActorFormListener();
    Dom.addCellClickListener();
    Dom.saveImageListener();

});
