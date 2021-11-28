const Dom = require('./classes/domHandler.class');

document.addEventListener("DOMContentLoaded", () => {
    Dom.updateDomEvent();
    Dom.saveImageListener();
    Dom.loadConfigurationListener();
    Dom.saveConfigurationListener();
    Dom.addActorButtonListener();
    Dom.addActorKeyListener();
    Dom.addQualifierButtonListener();
    Dom.addQualifierKeyListener();
});
