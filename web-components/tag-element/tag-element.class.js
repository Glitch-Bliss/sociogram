// https://kinsta.com/blog/web-components/
// https://css-tricks.com/styling-a-web-component/
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const GlobalService = require("../../classes/global.service.class");

fetch("./web-components/tag-element/tag-element.html")
    .then(stream => stream.text())
    .then(text => define(text));

function define(html) {
    class TagElement extends HTMLElement {

        id;
        type;
        name;

        constructor() {
            super();
            console.info("Tag component initialized");

            this.id = this.getAttribute("id");
            this.type = this.getAttribute("type");
            this.name = this.getAttribute("name");

            this.shadowDom = this.attachShadow({ mode: 'open' });
            this.shadowDom.innerHTML = html;
            // this.shadowDom.querySelector("#button-actor").addEventListener('click', this.addActor.bind(this));
            this.shadowDom.querySelector(".tag").textContent = this.name;


        }

        // component attributes
        static get observedAttributes() {
            // return ['name'];
        }

    }

    window.customElements.define('tag-element', TagElement);
}
