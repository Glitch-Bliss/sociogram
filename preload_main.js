const Dom = require('./classes/domHandler.class');

document.addEventListener("DOMContentLoaded", () => {
    Dom.updateDomEvent();
    Dom.addActorFormListener();
    Dom.addCellClickListener();
    Dom.saveImageListener();
    Dom.loadConfigurationListener();
    Dom.saveConfigurationListener();
    Dom.addActorButtonListener();
    Dom.addActorKeyListener();
    Dom.addQualifierButtonListener();
    Dom.addQualifierKeyListener();
    Dom.setCellsForm();
});
