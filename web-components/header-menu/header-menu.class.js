// https://kinsta.com/blog/web-components/
// https://css-tricks.com/styling-a-web-component/
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const GlobalService = require("../../classes/global.service.class");

fetch("./web-components/header-menu/header-menu.html")
    .then(stream => stream.text())
    .then(text => define(text));

function define(html) {
    class HeaderMenu extends HTMLElement {

        shadowDom;
        updateEvent = new CustomEvent("updateEvent");
        loadedEvent = new CustomEvent("fileLoadedEvent");

        constructor() {
            super();
            console.info("Header menu component initialized");

            this.shadowDom = this.attachShadow({ mode: 'open' });
            this.shadowDom.innerHTML = html;
            this.shadowDom.querySelector("#button-actor").addEventListener('click', this.addActor.bind(this));
            this.shadowDom.querySelector("#button-qualifier").addEventListener('click', () => this.addActor(true));
            this.shadowDom.querySelector("#actorname").addEventListener('keyup', this.addActorKeyListener.bind(this));
            this.shadowDom.querySelector("#button-qualifier").addEventListener('click', this.addQualifier.bind(this));
            this.shadowDom.querySelector("#qualifiername").addEventListener('keyup', this.addQualifierKeyListener.bind(this));
            this.shadowDom.querySelector("#load-configuration").addEventListener('click', this.loadConfigurationListener.bind(this));
            this.shadowDom.querySelector("#save-configuration").addEventListener('click', this.saveConfigurationListener.bind(this));
            this.shadowDom.querySelector("#add-relation").addEventListener('click', this.addRelation.bind(this));

            document.addEventListener("actorSelected", (event) => {
                const socket = event.detail.socket;
                this.shadowDom.querySelector(`#${socket}`).innerHTML = event.detail.actor.name;
            })
        }

        // component attributes
        static get observedAttributes() {
            // return ['name'];
        }

        // attribute change
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            this[property] = newValue;
        }

        // connect component
        connectedCallback() {

        }

        /**
         * Add a new relation to graph using the three elements of emettor qualifier receptor 
         * @param {*} event 
         */
        addRelation(event) {
            const trinity = GlobalService.trinity;
            GlobalService.lokiDb.addRelation(trinity.emettor.id, trinity.qualifier.id, trinity.receptor.id);
            document.dispatchEvent(this.updateEvent);
        }

        /**
         * We add listener when adding new actor with enter key
         * @param {*} event 
         */
        addActorKeyListener(event) {
            if (event.keyCode === 13) {
                this.addActor();
                this.shadowDom.querySelector("#actorname").value = "";
                this.shadowDom.querySelector("#actorname").focus();
            }
        }

        /**
         * Effective handling of adding actor
         */
        addActor(isQualifier) {
            const name = this.shadowDom.querySelector("#actorname").value;
            let lokiActor;
            if (isQualifier) {                
                lokiActor = GlobalService.lokiDb.addQualifier({ name: name });
            } else {
                lokiActor = GlobalService.lokiDb.addActor({ name: name });
            }

            document.dispatchEvent(this.updateEvent);
            document.dispatchEvent(new CustomEvent("addActorEvent", {
                detail: {
                    actor: {
                        ...lokiActor
                    }
                }
            }));
        }

        /**
         * Adds a new qualifier element
         */
        addQualifier() {
            const qualifier = this.shadowDom.querySelector("#qualifiername").value;
            GlobalService.lokiDb.addQualifier({ name: qualifier });
            document.dispatchEvent(this.updateEvent);
        }


        /**
         * Add actor when enter keyup
         */
        addQualifierKeyListener(event) {
            if (event.keyCode === 13) {
                this.addQualifier();
                const qualifier = document.querySelector("#qualifiername");
                if (qualifier) {
                    qualifier.value = "";
                    qualifier.focus();
                }
            }
        }

        /**
         * Add listener and behavior for load button
         */
        loadConfigurationListener(event) {
            event.preventDefault();

            ipcRenderer.invoke('dialog:open').then(result => {
                try {
                    let openedFile = fs.readFileSync(result.filePaths[0]);
                    let jsonConfiguration = JSON.parse(openedFile);

                    // GlobalService.lokiDb.nodes.removeDataOnly();
                    GlobalService.lokiDb.nodes.insert(jsonConfiguration.nodes);
                    // GlobalService.lokiDb.relations.removeDataOnly();
                    GlobalService.lokiDb.relations.insert(jsonConfiguration.relations);
                    document.dispatchEvent(this.updateEvent);
                    document.dispatchEvent(this.loadedEvent);

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
        }


        /**
         * Add listener and behavior for save button
         */
        saveConfigurationListener() {
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

        }
    }

    window.customElements.define('header-menu', HeaderMenu);
}
