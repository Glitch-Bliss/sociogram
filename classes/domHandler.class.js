
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
     * Init the form for cell editing
     * Toggles visibility
     */
    setCellsForm() {

    }

    /**
     * When adding new actor
     */
    addActor() {
        const name = document.querySelector("#actorname").value;
        GlobalService.lokiDb.addActor({ name: name });
        this.updateDomEvent();
    }

    /**
     * Add actor when clicked on button
     */
    addActorButtonListener() {
        document.querySelector("#button-actor").addEventListener('click', () => this.addActor());
    }

    /**
     * Add actor when enter keyup
     */
    addActorKeyListener() {
        document.querySelector("#actorname").addEventListener('keyup', (event) => {
            if (event.keyCode === 13) {
                this.addActor();
                document.querySelector("#actorname").value = "";
                document.querySelector("#actorname").focus();
            }
        });
    }

    /**
     * Adds a new qualifier element
     */
    addQualifier() {
        const qualifier = document.querySelector("#qualifiername").value;
        GlobalService.lokiDb.addQualifier({ name: qualifier });
        this.updateDomEvent();
    }

    /**
     * Add actor when clicked on button
     */
    addQualifierButtonListener() {
        document.querySelector("#button-qualifier").addEventListener('click', () => this.addQualifier());
    }

    /**
     * Add actor when enter keyup
     */
    addQualifierKeyListener() {
        document.querySelector("#qualifiername").addEventListener('keyup', (event) => {
            if (event.keyCode === 13) {
                this.addQualifier();
                document.querySelector("#qualifiername").value = "";
                document.querySelector("#qualifiername").focus();
            }
        });
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

                console.info("Event ? ", event);
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
                        //The image is a base64 image now !!!
                        const base64Image = fileReader.result;
                        const image = document.querySelector(".nodeImage");
                        image.src = base64Image;
                        form.imageDataURL.value = base64Image;
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
            GlobalService.lokiDb.nodes.update(node);

            this.updateDomEvent();
            this.renderGraph();

        })
    }

    /**
     * Add listener and behavior for load button
     */
    loadConfigurationListener() {
        document.querySelector("#load-configuration").addEventListener('click', (event) => {
            event.preventDefault();

            ipcRenderer.invoke('dialog:open').then(result => {
                try {
                    let openedFile = fs.readFileSync(result.filePaths[0]);
                    let jsonConfiguration = JSON.parse(openedFile);

                    // GlobalService.lokiDb.nodes.removeDataOnly();
                    GlobalService.lokiDb.nodes.insert(jsonConfiguration.nodes);
                    // GlobalService.lokiDb.relations.removeDataOnly();
                    GlobalService.lokiDb.relations.insert(jsonConfiguration.relations);

                    console.info("GlobalService.lokiDb.nodes ", GlobalService.lokiDb.nodes);
                    this.updateDomEvent();
                    this.renderGraph();
                } catch (error) {
                    console.log(`Erreur lors de l'ouverture de ${result.filePaths[0]}`, error)
                    const options = {
                        type: 'error',
                        title: 'Erreur d\'ouverture',
                        message: `Erreur lors de l'ouverture de ${result.filePaths[0]}\n Message : ${error}`
                    }
                    ipcRenderer.invoke('dialog:message', options);
                }
            })
        });
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
     * Add listener and behavior for save button
     */
    saveConfigurationListener() {
        document.querySelector("#save-configuration").addEventListener('click', (event) => {
            let jsonConfiguration = {
                "nodes": [],
                "relations": []
            };

            GlobalService.lokiDb.nodes.find().forEach((node) => {
                const { $loki, meta, ...cleanedNode } = node;
                jsonConfiguration.nodes.push(cleanedNode);
            });
            GlobalService.lokiDb.getRelations().forEach((node) => {
                const { $loki, meta, ...cleanedNode } = node;
                jsonConfiguration.relations.push(cleanedNode);
            });

            ipcRenderer.invoke('dialog:save').then(path => {
                if (path && path.filePath) {

                    const sgPath = path.filePath;
                    let data = JSON.stringify(jsonConfiguration)

                    fs.writeFile(sgPath, data, (error) => {
                        let options = {};
                        try {
                            if (error) throw error
                            options = {
                                type: 'info',
                                title: 'Information',
                                message: `Le Sociographe ${sgPath} a bien été sauvegardé.`
                            }
                        } catch (error) {
                            console.log(`Erreur lors de la sauvegarde de ${sgPath}: `, error)
                            options = {
                                type: 'error',
                                title: 'Erreur d\'enregistrement',
                                message: `Le Sociographe n'a PAS été sauvegardé. \n Message : ${error}`
                            }
                        } finally {
                            ipcRenderer.invoke('dialog:message', options);
                        }
                    })
                }
            })

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
     * Main upate func of the app lifecycle
     */
    updateDomEvent() {
        /**
         * Actors tags update
         */
        const actorsFound = GlobalService.lokiDb.getActors();
        console.info("actorsFound ", actorsFound);

        let actorsTag = "";
        for (let i = 0; i < actorsFound.length; i++) {
            console.info("actorsFound[i] ", actorsFound[i]);
            const id = actorsFound[i].id;
            const name = actorsFound[i].name;
            const selected = actorsFound[i].selected ? 'selected' : '';
            const actorTag = '<a href="#" class="tag btn btn-sm animated-button thar-one ' + selected + '" data-id="' + id + '" data-name="' + name + '" data-type="actor">' + name + '</a>';
            actorsTag += actorTag;
        }

        console.info("actorsTag ", actorsTag);

        document.querySelectorAll(".actorsTag").forEach((actorTagList) => {
            actorTagList.innerHTML = actorsTag;
            if (actorTagList.classList.contains("emettor")) {
                actorTagList.querySelectorAll(".tag").forEach((actorTag) => {
                    if (actorTag.dataset.id == this.idActorSelected.emettor.id) {
                        actorTag.classList.add("selected");
                    }
                });
            }

            if (actorTagList.classList.contains("receptor")) {
                actorTagList.querySelectorAll(".tag").forEach((actorTag) => {
                    if (actorTag.dataset.id == this.idActorSelected.receptor.id) {
                        actorTag.classList.add("selected");
                    }
                });
            }
        });

        /**
         * Qualifiers tags update
         */
        const qualifiersFound = GlobalService.lokiDb.getQualifiers();
        let qualifiersTag = "";
        for (let i = 0; i < qualifiersFound.length; i++) {
            const id = qualifiersFound[i].id;
            const name = qualifiersFound[i].name;
            const selected = this.idQualifierSelected == id ? 'selected' : '';
            const actorTag = '<a href="#" class="tag btn btn-sm animated-button thar-one ' + selected + '" data-id="' + id + '" data-name="' + name + '" data-type="qualifier">' + name + '</a>';
            qualifiersTag += actorTag;
        }
        document.querySelectorAll(".qualifiersTag").forEach((qualifierTag) => {
            qualifierTag.innerHTML = qualifiersTag;
        });

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
        document.querySelector("#relationsList").innerHTML = relationsList;

        // Removes a relation
        document.querySelectorAll(".close").forEach((closeButton) => {
            closeButton.addEventListener('click', (event) => {
                const id = event.currentTarget.dataset.id;
                GlobalService.lokiDb.relations.remove(parseInt(id));
                this.updateDomEvent();
                this.renderGraph();
            });
        });


        //     _______  _______  _______  _______ _________ _______  _______    _______    _        _______             _______  _______  _        _______ __________________ _______  _         
        //    (  ____ \(  ____ )(  ____ \(  ___  )\__   __/(  ____ \(  ____ \  (  ___  )  ( (    /|(  ____ \|\     /|  (  ____ )(  ____ \( \      (  ___  )\__   __/\__   __/(  ___  )( (    /|  
        //    | (    \/| (    )|| (    \/| (   ) |   ) (   | (    \/| (    \/  | (   ) |  |  \  ( || (    \/| )   ( |  | (    )|| (    \/| (      | (   ) |   ) (      ) (   | (   ) ||  \  ( |  
        //    | |      | (____)|| (__    | (___) |   | |   | (__    | (_____   | (___) |  |   \ | || (__    | | _ | |  | (____)|| (__    | |      | (___) |   | |      | |   | |   | ||   \ | |  
        //    | |      |     __)|  __)   |  ___  |   | |   |  __)   (_____  )  |  ___  |  | (\ \) ||  __)   | |( )| |  |     __)|  __)   | |      |  ___  |   | |      | |   | |   | || (\ \) |  
        //    | |      | (\ (   | (      | (   ) |   | |   | (            ) |  | (   ) |  | | \   || (      | || || |  | (\ (   | (      | |      | (   ) |   | |      | |   | |   | || | \   |  
        //    | (____/\| ) \ \__| (____/\| )   ( |   | |   | (____/\/\____) |  | )   ( |  | )  \  || (____/\| () () |  | ) \ \__| (____/\| (____/\| )   ( |   | |   ___) (___| (___) || )  \  |  
        //    (_______/|/   \__/(_______/|/     \|   )_(   (_______/\_______)  |/     \|  |/    )_)(_______/(_______)  |/   \__/(_______/(_______/|/     \|   )_(   \_______/(_______)|/    )_)  

        const tags = document.querySelectorAll(".tag");
        tags.forEach((tag) => {
            tag.addEventListener('click', (event) => {
                event.preventDefault();
                const element = event.currentTarget;

                if (element.parentNode.classList.contains("emettor")) {
                    if (event.ctrlKey) {
                        GlobalService.lokiDb.nodes.findAndRemove({ id: element.dataset.id });
                    } else {
                        document.querySelector("#emettor").dataset.id = element.dataset.id;
                        document.querySelector("#emettor").dataset.name = element.dataset.name;
                        this.idActorSelected.emettor.id = element.dataset.id;
                    }
                }

                if (element.parentNode.classList.contains("qualifier")) {
                    if (event.ctrlKey) {
                        qualifiers.findAndRemove({ id: element.dataset.id });
                    } else {
                        document.querySelector("#qualifier").dataset.id = element.dataset.id;
                        document.querySelector("#qualifier").dataset.name = element.dataset.name;
                        this.idQualifierSelected = element.dataset.id;
                    }
                }

                if (element.parentNode.classList.contains("receptor")) {
                    if (event.ctrlKey) {
                        GlobalService.lokiDb.nodes.findAndRemove({ id: element.dataset.id });
                    } else {
                        document.querySelector("#receptor").dataset.id = element.dataset.id;
                        document.querySelector("#receptor").dataset.name = element.dataset.name;

                        this.idActorSelected.receptor.id = element.dataset.id;

                        this.idActorSelected = {
                            "emettor": {
                                "id": null
                            },
                            "receptor": {
                                "id": null
                            }
                        };

                        this.idQualifierSelected = null;

                        const emettorElement = document.querySelector("#emettor");
                        const receptorElement = document.querySelector("#receptor");
                        const qualifierElement = document.querySelector("#qualifier");
                        try {
                            GlobalService.lokiDb.addRelation(emettorElement.dataset.id, qualifierElement.dataset.id, receptorElement.dataset.id);
                        } catch (error) {
                            ipcRenderer.invoke('alert:message', { message: error, icon: "error" });
                        }

                        this.renderGraph();
                        GlobalService.Utils.emptyRelationChunks();
                    }
                }
                this.updateDomEvent();
            });
        });


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
        document.getElementById("save-configuration").classList.toggle("visible", actorsVisibility);
        document.querySelectorAll(".actorTitle").forEach((title) => title.classList.toggle("visible", actorsVisibility));
        document.querySelectorAll(".qualifierTitle").forEach((title) => title.classList.toggle("visible", qualifierVisibility));        
    }
}

// why instance rather than class ? Singleton ! https://medium.com/swlh/node-js-and-singleton-pattern-7b08d11c726a
module.exports = new DomHandler();