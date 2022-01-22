
const fs = require('fs');
const path = require('path');
const os = require('os');
const { contextBridge, ipcRenderer } = require('electron');
const { serialize, deserialize } = require('v8');

/**
 * Classes
 */
const GlobalService = require("./global.service.class");

class DomHandler {

    document;
    updateEvent = new Event('update');
    idActorSelected = {
        "emettor": {
            "list": null,
            "id": null
        },
        "receptor": {
            "list": null,
            "id": null
        }
    };
    idQualifierSelected = null;

    constructor(document) {
        this.document = document;
    }

    /**
     * Triggers when a graph cell is clicked
     */
    addCellClickListener() {
        document.addEventListener("cellClick", (event) => {
            const formWindow = document.querySelector(".cellForm");
            formWindow.classList.add("open");

            const id = event.detail.getAttribute("id");
            const node = GlobalService.lokiDb.nodes.find({ id: id });

            console.info("Node clicked => ", node);

            const form = document.querySelector(".cellDetails");
            form.reset();

            //We fill form
            for (let attribute in node[0]) {
                if (form[attribute]) {
                    form[attribute].value = node[0][attribute];
                }
            }
            const image = document.querySelector(".nodeImage");
            if (node[0].imageDataURL) {
                image.src = node[0].imageDataURL;
            }

        })
    }


    /**
     * Updates datas from details cell form
     */
    addActorFormListener() {
        const imageDrop = document.querySelector(".imageDrop");
        const form = document.querySelector(".cellDetails");

        /**
         * Handles close button behavior
         */
        const formWindow = document.querySelector(".cellForm");
        document.querySelector(".formClose").addEventListener("click", () => {
            formWindow.classList.remove("open");
        });

        /**
         * Handles image drags behavior
         * Used for style behavior
         */
        ['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave'].forEach((eventName) => {
            imageDrop.addEventListener(eventName, (event) => {
                event.preventDefault();
                event.stopPropagation();
            });
        });

        /**
         * Handles image drop
         * Used to convert image to a base64 code usable in cell style later
         */
        imageDrop.addEventListener("drop", (event) => {
            event.preventDefault();
            event.stopPropagation();

            let items = event.dataTransfer.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    //image
                    let blob = items[i].getAsFile();

                    let fileReader = new FileReader();
                    fileReader.onloadend = () => {

                        // Image resizing
                        let img = document.createElement("img");
                        const base64Image = fileReader.result;
                        img.src = base64Image;

                        img.onload = () => {
                            let canvas = document.createElement("canvas");
                            let ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0);

                            let MAX_WIDTH = 50;
                            let MAX_HEIGHT = 50;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                }
                            } else {
                                if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                }
                            }
                            canvas.width = width;
                            canvas.height = height;

                            ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0, width, height);
                            let miniatureDataurl = canvas.toDataURL();

                            //The image is a base64 image now !!!
                            // const base64Image = fileReader.result;
                            const image = document.querySelector(".nodeImage");
                            image.src = base64Image;
                            form.miniatureDataURL.value = miniatureDataurl;
                            form.imageDataURL.value = base64Image;
                        }
                    }
                    fileReader.readAsDataURL(blob);
                }
            }
        });

        /**
         * We update current node
         */
        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const node = GlobalService.lokiDb.nodes.findOne({ id: form.id.value });
            node.name = form.name.value;
            node.details = form.details.value;
            node.imageDataURL = form.imageDataURL.value;
            node.miniatureDataURL = form.miniatureDataURL.value;
            GlobalService.lokiDb.nodes.update(node);

            this.updateDomEvent();
            this.renderGraph();
        })
    }

    /**
     * Adds listener to the save image button
     */
    saveImageListener() {
        document.querySelector("#save-image").addEventListener('click', (event) => {
            event.preventDefault();
            GlobalService.Utils.saveGraphToImage();
        });
    }

    /**
     * Handles graph rendering from lokidb relations
     */
    renderGraph = () => {
        // Graph rendering    
        GlobalService.GraphTools.init();
        GlobalService.GraphTools.addLayoutButtons();
        GlobalService.GraphTools.addMouseListeners();

        GlobalService.lokiDb.getRelations()?.forEach(
            (relation) => {
                // We exclude lokidb internal vars and we must use var instead of let to redeclare meta and $loki
                var { meta, $loki, ...actor1 } = GlobalService.lokiDb.nodes.findOne({ id: relation.from });
                var { meta, $loki, ...actor2 } = GlobalService.lokiDb.nodes.findOne({ id: relation.to });
                var { meta, $loki, ...qualifier } = GlobalService.lokiDb.nodes.findOne({ id: relation.by });
                if (actor1 && qualifier && actor2) {
                    GlobalService.GraphTools.addRelationship(actor1, qualifier, actor2);
                } else {
                    console.error('An element is missing from relation', relation);
                }
            }
        );
    }

    /**
     * Initialize all components
     */
    createWebComponents() {
        require("../web-components/header-menu/header-menu.class");
        require("../web-components/tag-list/tag-list.class");
    }

    /**
     * Main upate func of the app lifecycle
     */
    updateDomEvent() {
        /**
         * Relations update
         */
        const relationsFound = GlobalService.lokiDb.getRelations();
        let relationsList = "";
        GlobalService.lokiDb.getRelations()?.forEach(
            (relation) => {
                const actor1 = GlobalService.lokiDb.nodes.find({ id: relation.from });
                const actor2 = GlobalService.lokiDb.nodes.find({ id: relation.to });
                const qualifier = GlobalService.lokiDb.nodes.find({ id: relation.by });
                const relationItem = `<div class="alert alert-success" role="alert" data-type="relation">${actor1[0]?.name} ${qualifier[0]?.name}  ${actor2[0]?.name}<div class="close" data-id="${relation.$loki}"><i class="fas fa-times"></i></div></div>`;
                relationsList += relationItem;
            }
        );
        document.querySelector(".relationsList").innerHTML = relationsList;

        // Removes a relation
        document.querySelectorAll(".close").forEach((closeButton) => {
            closeButton.addEventListener('click', (event) => {
                const id = event.currentTarget.dataset.id;
                GlobalService.lokiDb.relations.remove(parseInt(id));
                this.updateDomEvent();
                this.renderGraph();
            });
        });

        /**
         * Event updating base dom elements, like graph
         */
        document.addEventListener("updateEvent", (event) => {
            this.updateDomEvent();
            this.renderGraph();
        }, { once: true });

        //     _______           _______  _______  _                  _________ _______ _________ ______  _________ _       __________________            _______  _______    ______           __________________ _______  _        _______ 
        //    (  ____ \|\     /|(  ____ \(  ____ \| \    /\  |\     /|\__   __/(  ____ \\__   __/(  ___ \ \__   __/( \      \__   __/\__   __/|\     /|  (  ___  )(  ____ \  (  ___ \ |\     /|\__   __/\__   __/(  ___  )( (    /|(  ____ \
        //    | (    \/| )   ( || (    \/| (    \/|  \  / /  | )   ( |   ) (   | (    \/   ) (   | (   ) )   ) (   | (         ) (      ) (   ( \   / )  | (   ) || (    \/  | (   ) )| )   ( |   ) (      ) (   | (   ) ||  \  ( || (    \/
        //    | |      | (___) || (__    | |      |  (_/ /   | |   | |   | |   | (_____    | |   | (__/ /    | |   | |         | |      | |    \ (_) /   | |   | || (__      | (__/ / | |   | |   | |      | |   | |   | ||   \ | || (_____ 
        //    | |      |  ___  ||  __)   | |      |   _ (    ( (   ) )   | |   (_____  )   | |   |  __ (     | |   | |         | |      | |     \   /    | |   | ||  __)     |  __ (  | |   | |   | |      | |   | |   | || (\ \) |(_____  )
        //    | |      | (   ) || (      | |      |  ( \ \    \ \_/ /    | |         ) |   | |   | (  \ \    | |   | |         | |      | |      ) (     | |   | || (        | (  \ \ | |   | |   | |      | |   | |   | || | \   |      ) |
        //    | (____/\| )   ( || (____/\| (____/\|  /  \ \    \   /  ___) (___/\____) |___) (___| )___) )___) (___| (____/\___) (___   | |      | |     | (___) || )        | )___) )| (___) |   | |      | |   | (___) || )  \  |/\____) |
        //    (_______/|/     \|(_______/(_______/|_/    \/     \_/   \_______/\_______)\_______/|/ \___/ \_______/(_______/\_______/   )_(      \_/     (_______)|/         |/ \___/ (_______)   )_(      )_(   (_______)|/    )_)\_______)

        const relationsVisibility = GlobalService.lokiDb.getRelations().length > 0;
        const actorsVisibility = GlobalService.lokiDb.getActors().length > 0;
        const qualifierVisibility = GlobalService.lokiDb.getQualifiers().length > 0;
        document.getElementById("save-image").classList.toggle("visible", relationsVisibility);
        document.getElementById("graph").classList.toggle("visible", relationsVisibility);
        // document.getElementById("save-configuration").classList.toggle("visible", actorsVisibility);
        document.querySelectorAll(".actorTitle").forEach((title) => title.classList.toggle("visible", actorsVisibility));
        document.querySelectorAll(".qualifierTitle").forEach((title) => title.classList.toggle("visible", qualifierVisibility));
    }
}

// why instance rather than class ? Singleton ! https://medium.com/swlh/node-js-and-singleton-pattern-7b08d11c726a
module.exports = new DomHandler();