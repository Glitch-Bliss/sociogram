

import '../scss/main.scss';
import mermaidAPI from 'mermaid';

/**
 * LOKI JS
 */

const loki = require("lokijs");
/*
var db = new loki("quickstart.db");
var users = db.addCollection("users");

users.insert({ name: 'odin', age: 50 });
users.insert({ name: 'thor', age: 35 });

var result = users.find({ age: { $lte: 35 } });
*/
// dumps array with 1 doc (thor) to console
//console.log(result);

const db = new loki("sociogram.db");
const actors = db.addCollection("actors");
const qualifiers = db.addCollection("qualifiers");
const relations = db.addCollection("relations");

/**
 * MERMAID
 */

var mermaidConfig = {
    startOnLoad: true,
    htmlLabels: true,
    callback: function (id) {
        console.log(id, ' rendered');
    },
    flowchart: {
        useMaxWidth: true,
    }
};
mermaidAPI.initialize(mermaidConfig);

let graphDefinition = 'graph TB\n';
function renderGraph() {
    mermaidAPI.render('mermaidGraph', graphDefinition, (svgCode, bindFunctions) => {
        console.info("Rendering");
        document.querySelector(".mermaidGraph").innerHTML = svgCode;
    });
}

/**
 * App logic
 */
const updateEvent = new Event('update');

document.addEventListener("DOMContentLoaded", () => {

    //Pevent forms to try submitting
    document.querySelectorAll("form").forEach((form) => {
        form.addEventListener('submit', (event) => event.preventDefault());
    });

    // Adds an actor
    document.querySelector("#button-actor").addEventListener('click', (event) => {
        const name = document.querySelector("#actorname").value;
        if (name) {
            actors.insert({ name: name });
        }
        document.dispatchEvent(updateEvent);
    });

    // Adds qualifier
    document.querySelector("#button-qualifier").addEventListener('click', (event) => {
        const name = document.querySelector("#qualifiername").value;
        if (name) {
            qualifiers.insert({ name: name });
        }
        document.dispatchEvent(updateEvent);
    });

    // Adds relation
    document.querySelector('#button-relation').addEventListener('click', (event) => {

        const emettorId = document.querySelector("#actorsSelect").value;
        const emettor = document.querySelector("#actorsSelect").options[document.querySelector("#actorsSelect").selectedIndex].text;
        const qualifier = document.querySelector("#qualifiersSelect").options[document.querySelector("#qualifiersSelect").selectedIndex].text;
        const receptorId = document.querySelector("#receptorSelect").value;
        const receptor = document.querySelector("#receptorSelect").options[document.querySelector("#receptorSelect").selectedIndex].text;

        graphDefinition += emettorId + '[' + emettor + '] -->|' + qualifier + '| ' + receptorId + '[' + receptor + ']\n';
        console.info(graphDefinition);
        renderGraph();
        document.dispatchEvent(updateEvent);
    });
});

document.addEventListener("update", () => {

    /**
     * Actors tags update
     */
    const actorsFound = actors.find();
    let actorsTag = "";
    let actorsOptions = "";
    for (let i = 0; i < actorsFound.length; i++) {
        const id = actorsFound[i].$loki;
        const name = actorsFound[i].name;
        const actorTag = '<span class="tag badge" id="' + id + '">' + name + '<i class="far fa-times-circle"></i></span>';
        actorsTag += actorTag;
        const actorOption = '<option value="' + id + '">' + name + '</option>';
        actorsOptions += actorOption;
    }
    document.querySelector("#actorsTag").innerHTML = actorsTag;
    document.querySelector("#actorsSelect").innerHTML = actorsOptions;
    document.querySelector("#receptorSelect").innerHTML = actorsOptions;

    /**
     * Qualifiers tags update
     */
    const qualifiersFound = qualifiers.find();
    console.info("Qualifiers => ", qualifiersFound);
    let qualifiersTag = "";
    let qualifiersOptions = "";
    for (let i = 0; i < qualifiersFound.length; i++) {
        const id = qualifiersFound[i].$loki;
        const name = qualifiersFound[i].name;
        const actorTag = '<span class="tag badge" id="' + id + '">' + name + '<i class="far fa-times-circle"></i></span>';
        qualifiersTag += actorTag;
        const actorOption = '<option value="' + id + '">' + name + '</option>';
        qualifiersOptions += actorOption;
    }
    document.querySelector("#qualifiersTag").innerHTML = qualifiersTag;
    document.querySelector("#qualifiersSelect").innerHTML = qualifiersOptions;


    // Deletes an actor, must be call in update to bind new tags !
    // And MUST be called after tags update
    const tags = document.querySelectorAll(".tag");
    tags.forEach((tag) => {
        tag.addEventListener('click', (event) => {
            const id = event.currentTarget.id;
            if (id) {
                actors.remove({ $loki: id });
            }
            document.dispatchEvent(updateEvent);
        });
    });

});