// https://kinsta.com/blog/web-components/
// https://css-tricks.com/styling-a-web-component/
const { contextBridge, ipcRenderer } = require('electron');
const { it } = require('eslint/lib/rule-tester/rule-tester');
const fs = require('fs');
const GlobalService = require("../../classes/global.service.class");

fetch("./web-components/tag-list/tag-list.html")
    .then(stream => stream.text())
    .then(text => define(text));

function define(html) {
    class TagList extends HTMLElement {

        type;
        socket;

        constructor() {
            super();
            console.info("Tag list component initialized");

            this.type = this.getAttribute("type");
            this.socket = this.getAttribute("socket");

            this.shadowDom = this.attachShadow({ mode: 'open' });
            this.shadowDom.innerHTML = html;

            /**
             * Event triggered when a new actor is added
             */
            document.addEventListener("addActorEvent", (event) => {
                this.addActor(event.detail.actor);
            });

            document.addEventListener("fileLoadedEvent", (event) => {
                this.fillAllActors();
            });
        }

        // component attributes
        static get observedAttributes() {
            // return ['name'];
        }

        /**
         * Adds a new actor
         * @param {*} actor 
         */
        addActor(actor) {
            console.info("type actor ", actor)
            console.info("this type", this.type)
            if (actor.type + 's' == this.type) {
                const template = this.shadowDom.querySelector("#tag");
                const buttonTag = template.content.cloneNode(true).querySelector("a");

                /**
                 * We create tag linked to actor
                 */
                buttonTag.innerText = actor.name;
                buttonTag.classList?.add(actor.selected ? 'selected' : 'not-selected', actor.type);
                buttonTag.addEventListener("click", (event) => {
                    event.preventDefault();

                    if (event.ctrlKey) {
                        GlobalService.lokiDb.nodes.findAndRemove({ id: actor.id });
                        // @TODO REMOVE KILLED ACTOR FROM LIST OF TAGS
                    } else {
                        this.tagClickHandler(actor);
                    }
                });
                this.shadowDom.appendChild(buttonTag);
            }
        }

        /**
         * Creates tags for ALL actors of db
         */
        fillAllActors() {
            let actorsFound = GlobalService.lokiDb.getActors();
            if (this.type == "qualifiers") {
                actorsFound = GlobalService.lokiDb.getQualifiers();
            }

            for (let i = 0; i < actorsFound.length; i++) {
                const id = actorsFound[i].id;
                const name = actorsFound[i].name;
                const selected = actorsFound[i].selected ? 'selected' : 'not-selected';
                this.addActor(actorsFound[i]);
            }
        }

        tagClickHandler(actor) {
            console.info(actor)
            document.dispatchEvent(new CustomEvent("actorSelected", {
                detail: {
                    socket: this.socket,
                    actor: {
                        ...actor
                    }
                }
            }));
        }

    }

    window.customElements.define('tag-list', TagList);
}
