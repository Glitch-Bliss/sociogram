const fs = require('fs');
const path = require('path');
const os = require('os');
const { contextBridge, ipcRenderer } = require('electron');
const { serialize, deserialize } = require('v8');

/**
 * Classes
 */
const lokiDb = require("./classes/lokiDb.class");
const Utils = require("./utils.class");
const GraphTools = require("./classes/graphTools.class");
const Dom = require('./classes/domHandler.class');

//We must declare it before requirement to allow functions to know it
// let mermaidAPI = null;
let randId = 0;
let lastSVGID = "sociograph";

/**
 * Render graph from relations
 */
const renderGraph = () => {

    // Graph rendering    
    GraphTools.init();
    GraphTools.addLayoutButtons();
    GraphTools.addMouseListeners();

    lokiDb.getRelations()?.forEach(
        (relation) => {
            const actor1 = lokiDb.nodes.find({ id: relation.from });
            const actor2 = lokiDb.nodes.find({ id: relation.to });
            const qualifier = lokiDb.nodes.find({ id: relation.by });
            if (actor1[0] && qualifier[0] && actor2[0]) {
                GraphTools.addRelationship(actor1[0], qualifier[0], actor2[0]);
            } else {
                console.error('An element is missing from relation', relation);
            }
        }
    );
    document.querySelector(".help").classList.add("hide");
}

/**
 * App logic
 */
const updateEvent = new Event('update');

document.addEventListener("DOMContentLoaded", () => {

    document.dispatchEvent(updateEvent);

    //     _______  _______           _______   _________ _______  _______  _______  _______ 
    //    (  ____ \(  ___  )|\     /|(  ____ \  \__   __/(       )(  ___  )(  ____ \(  ____ \
    //    | (    \/| (   ) || )   ( || (    \/     ) (   | () () || (   ) || (    \/| (    \/
    //    | (_____ | (___) || |   | || (__         | |   | || || || (___) || |      | (__    
    //    (_____  )|  ___  |( (   ) )|  __)        | |   | |(_)| ||  ___  || | ____ |  __)   
    //          ) || (   ) | \ \_/ / | (           | |   | |   | || (   ) || | \_  )| (      
    //    /\____) || )   ( |  \   /  | (____/\  ___) (___| )   ( || )   ( || (___) || (____/\
    //    \_______)|/     \|   \_/   (_______/  \_______/|/     \||/     \|(_______)(_______/                                                                                       

    document.querySelector("#save-image").addEventListener('click', (event) => {
        event.preventDefault();
        Utils.saveGraphToImage();

    });

    //     _        _______  _______  ______     _______  _______  _        _______ _________ _______           _______  _______ __________________ _______  _       
    //    ( \      (  ___  )(  ___  )(  __  \   (  ____ \(  ___  )( (    /|(  ____ \\__   __/(  ____ \|\     /|(  ____ )(  ___  )\__   __/\__   __/(  ___  )( (    /|
    //    | (      | (   ) || (   ) || (  \  )  | (    \/| (   ) ||  \  ( || (    \/   ) (   | (    \/| )   ( || (    )|| (   ) |   ) (      ) (   | (   ) ||  \  ( |
    //    | |      | |   | || (___) || |   ) |  | |      | |   | ||   \ | || (__       | |   | |      | |   | || (____)|| (___) |   | |      | |   | |   | ||   \ | |
    //    | |      | |   | ||  ___  || |   | |  | |      | |   | || (\ \) ||  __)      | |   | | ____ | |   | ||     __)|  ___  |   | |      | |   | |   | || (\ \) |
    //    | |      | |   | || (   ) || |   ) |  | |      | |   | || | \   || (         | |   | | \_  )| |   | || (\ (   | (   ) |   | |      | |   | |   | || | \   |
    //    | (____/\| (___) || )   ( || (__/  )  | (____/\| (___) || )  \  || )      ___) (___| (___) || (___) || ) \ \__| )   ( |   | |   ___) (___| (___) || )  \  |
    //    (_______/(_______)|/     \|(______/   (_______/(_______)|/    )_)|/       \_______/(_______)(_______)|/   \__/|/     \|   )_(   \_______/(_______)|/    )_)

    document.querySelector("#load-configuration").addEventListener('click', (event) => {
        event.preventDefault();

        ipcRenderer.invoke('dialog:open').then(result => {
            try {
                let openedFile = fs.readFileSync(result.filePaths[0]);
                let jsonConfiguration = JSON.parse(openedFile);

                lokiDb.nodes.removeDataOnly();
                lokiDb.nodes.insert(jsonConfiguration.nodes);
                lokiDb.relations.removeDataOnly();
                lokiDb.relations.insert(jsonConfiguration.relations);
                document.dispatchEvent(updateEvent);
                renderGraph();
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

    //     _______  _______           _______    _______  _______  _        _______ _________ _______           _______  _______ __________________ _______  _       
    //    (  ____ \(  ___  )|\     /|(  ____ \  (  ____ \(  ___  )( (    /|(  ____ \\__   __/(  ____ \|\     /|(  ____ )(  ___  )\__   __/\__   __/(  ___  )( (    /|
    //    | (    \/| (   ) || )   ( || (    \/  | (    \/| (   ) ||  \  ( || (    \/   ) (   | (    \/| )   ( || (    )|| (   ) |   ) (      ) (   | (   ) ||  \  ( |
    //    | (_____ | (___) || |   | || (__      | |      | |   | ||   \ | || (__       | |   | |      | |   | || (____)|| (___) |   | |      | |   | |   | ||   \ | |
    //    (_____  )|  ___  |( (   ) )|  __)     | |      | |   | || (\ \) ||  __)      | |   | | ____ | |   | ||     __)|  ___  |   | |      | |   | |   | || (\ \) |
    //          ) || (   ) | \ \_/ / | (        | |      | |   | || | \   || (         | |   | | \_  )| |   | || (\ (   | (   ) |   | |      | |   | |   | || | \   |
    //    /\____) || )   ( |  \   /  | (____/\  | (____/\| (___) || )  \  || )      ___) (___| (___) || (___) || ) \ \__| )   ( |   | |   ___) (___| (___) || )  \  |
    //    \_______)|/     \|   \_/   (_______/  (_______/(_______)|/    )_)|/       \_______/(_______)(_______)|/   \__/|/     \|   )_(   \_______/(_______)|/    )_)

    document.querySelector("#save-configuration").addEventListener('click', (event) => {
        let jsonConfiguration = {
            "nodes": [],
            "relations": []
        };

        lokiDb.nodes.find().forEach((node) => {
            jsonConfiguration.nodes.push({ 'name': node.name, 'id': node.id, 'type': node.type });
        });
        lokiDb.getRelations().forEach((relation) => {
            jsonConfiguration.relations.push({ 'from': relation.from, 'by': relation.by, 'to': relation.to, 'id': relation.id });
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

    //     _______  ______   ______  _________ _        _______    _______  _______ _________ _______  _______  _______ 
    //    (  ___  )(  __  \ (  __  \ \__   __/( (    /|(  ____ \  (  ___  )(  ____ \\__   __/(  ___  )(  ____ )(  ____ \
    //    | (   ) || (  \  )| (  \  )   ) (   |  \  ( || (    \/  | (   ) || (    \/   ) (   | (   ) || (    )|| (    \/
    //    | (___) || |   ) || |   ) |   | |   |   \ | || |        | (___) || |         | |   | |   | || (____)|| (_____ 
    //    |  ___  || |   | || |   | |   | |   | (\ \) || | ____   |  ___  || |         | |   | |   | ||     __)(_____  )
    //    | (   ) || |   ) || |   ) |   | |   | | \   || | \_  )  | (   ) || |         | |   | |   | || (\ (         ) |
    //    | )   ( || (__/  )| (__/  )___) (___| )  \  || (___) |  | )   ( || (____/\   | |   | (___) || ) \ \__/\____) |
    //    |/     \|(______/ (______/ \_______/|/    )_)(_______)  |/     \|(_______/   )_(   (_______)|/   \__/\_______)

    const addActor = () => {
        const name = document.querySelector("#actorname").value;
        lokiDb.addActor(name);
        document.dispatchEvent(updateEvent);
    }

    document.querySelector("#button-actor").addEventListener('click', addActor);
    document.querySelector("#actorname").addEventListener('keyup', (event) => {
        if (event.keyCode === 13) {
            addActor();
            document.querySelector("#actorname").value = "";
            document.querySelector("#actorname").focus();
        }
        document.dispatchEvent(updateEvent);
    });


    //     _______  ______   ______  _________ _        _______    _______           _______  _       _________ _______ _________ _______  _______  _______ 
    //    (  ___  )(  __  \ (  __  \ \__   __/( (    /|(  ____ \  (  ___  )|\     /|(  ___  )( \      \__   __/(  ____ \\__   __/(  ____ \(  ____ )(  ____ \
    //    | (   ) || (  \  )| (  \  )   ) (   |  \  ( || (    \/  | (   ) || )   ( || (   ) || (         ) (   | (    \/   ) (   | (    \/| (    )|| (    \/
    //    | (___) || |   ) || |   ) |   | |   |   \ | || |        | |   | || |   | || (___) || |         | |   | (__       | |   | (__    | (____)|| (_____ 
    //    |  ___  || |   | || |   | |   | |   | (\ \) || | ____   | |   | || |   | ||  ___  || |         | |   |  __)      | |   |  __)   |     __)(_____  )
    //    | (   ) || |   ) || |   ) |   | |   | | \   || | \_  )  | | /\| || |   | || (   ) || |         | |   | (         | |   | (      | (\ (         ) |
    //    | )   ( || (__/  )| (__/  )___) (___| )  \  || (___) |  | (_\ \ || (___) || )   ( || (____/\___) (___| )      ___) (___| (____/\| ) \ \__/\____) |
    //    |/     \|(______/ (______/ \_______/|/    )_)(_______)  (____\/_)(_______)|/     \|(_______/\_______/|/       \_______/(_______/|/   \__/\_______)

    const addQualifier = () => {
        const qualifier = document.querySelector("#qualifiername").value;
        lokiDb.addQualifier(qualifier);
        document.dispatchEvent(updateEvent);
    }

    document.querySelector("#button-qualifier").addEventListener('click', addQualifier);
    document.querySelector("#qualifiername").addEventListener('keyup', (event) => {
        if (event.keyCode === 13) {
            addQualifier();
            document.querySelector("#qualifiername").value = "";
            document.querySelector("#qualifiername").focus();
        }
    });
});

let idActorSelected = {
    "emettor": {
        "list": null,
        "id": null
    },
    "receptor": {
        "list": null,
        "id": null
    }
};
let idQualifierSelected = null;


//           _______  ______   _______ _________ _______    _______  _______  _        _______ 
// |\     /|(  ____ )(  __  \ (  ___  )\__   __/(  ____ \  / ___   )(  ___  )( (    /|(  ____ \
// | )   ( || (    )|| (  \  )| (   ) |   ) (   | (    \/  \/   )  || (   ) ||  \  ( || (    \/
// | |   | || (____)|| |   ) || (___) |   | |   | (__          /   )| |   | ||   \ | || (__    
// | |   | ||  _____)| |   | ||  ___  |   | |   |  __)        /   / | |   | || (\ \) ||  __)   
// | |   | || (      | |   ) || (   ) |   | |   | (          /   /  | |   | || | \   || (      
// | (___) || )      | (__/  )| )   ( |   | |   | (____/\   /   (_/\| (___) || )  \  || (____/\
// (_______)|/       (______/ |/     \|   )_(   (_______/  (_______/(_______)|/    )_)(_______/


document.addEventListener("update", () => {

    /**
     * Actors tags update
     */
    const actorsFound = lokiDb.getActors();
    let actorsTag = "";
    for (let i = 0; i < actorsFound.length; i++) {
        const id = actorsFound[i].id;
        const name = actorsFound[i].name;
        const selected = actorsFound[i].selected ? 'selected' : '';
        const actorTag = '<a href="#" class="tag btn btn-sm animated-button thar-one ' + selected + '" data-id="' + id + '" data-name="' + name + '" data-type="actor">' + name + '</a>';
        actorsTag += actorTag;
    }
    document.querySelectorAll(".actorsTag").forEach((actorTagList) => {
        actorTagList.innerHTML = actorsTag;
        if (actorTagList.classList.contains("emettor")) {
            actorTagList.querySelectorAll(".tag").forEach((actorTag) => {
                if (actorTag.dataset.id == idActorSelected.emettor.id) {
                    actorTag.classList.add("selected");
                }
            });
        }

        if (actorTagList.classList.contains("receptor")) {
            actorTagList.querySelectorAll(".tag").forEach((actorTag) => {
                if (actorTag.dataset.id == idActorSelected.receptor.id) {
                    actorTag.classList.add("selected");
                }
            });
        }
    });

    /**
     * Qualifiers tags update
     */
    const qualifiersFound = lokiDb.getQualifiers();
    let qualifiersTag = "";
    for (let i = 0; i < qualifiersFound.length; i++) {
        const id = qualifiersFound[i].id;
        const name = qualifiersFound[i].name;
        const selected = idQualifierSelected == id ? 'selected' : '';
        const actorTag = '<a href="#" class="tag btn btn-sm animated-button thar-one ' + selected + '" data-id="' + id + '" data-name="' + name + '" data-type="qualifier">' + name + '</a>';
        qualifiersTag += actorTag;
    }
    document.querySelectorAll(".qualifiersTag").forEach((qualifierTag) => {
        qualifierTag.innerHTML = qualifiersTag;
    });

    /**
     * Relations update
     */
    const relationsFound = lokiDb.getRelations();
    let relationsList = "";
    lokiDb.getRelations()?.forEach(
        (relation) => {
            console.info("Relation ", relation.$loki)
            const actor1 = lokiDb.nodes.find({ id: relation.from });
            const actor2 = lokiDb.nodes.find({ id: relation.to });
            const qualifier = lokiDb.nodes.find({ id: relation.by });
            const relationItem = `<div class="alert alert-success" role="alert" data-type="relation">${actor1[0]?.name} ${qualifier[0]?.name}  ${actor2[0]?.name}<div class="close" data-id="${relation.$loki}"><i class="fas fa-times"></i></div></div>`;
            relationsList += relationItem;
        }
    );
    document.querySelector("#relationsList").innerHTML = relationsList;

    // Removes a relation
    document.querySelectorAll(".close").forEach((closeButton) => {
        closeButton.addEventListener('click', (event) => {
            const id = event.currentTarget.dataset.id;
            lokiDb.relations.remove(parseInt(id));
            document.dispatchEvent(updateEvent);
            renderGraph();
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
                    lokiDb.nodes.findAndRemove({ id: element.dataset.id });
                } else {
                    document.querySelector("#emettor").dataset.id = element.dataset.id;
                    document.querySelector("#emettor").dataset.name = element.dataset.name;
                    idActorSelected.emettor.id = element.dataset.id;
                }
            }

            if (element.parentNode.classList.contains("qualifier")) {
                if (event.ctrlKey) {
                    qualifiers.findAndRemove({ id: element.dataset.id });
                } else {
                    document.querySelector("#qualifier").dataset.id = element.dataset.id;
                    document.querySelector("#qualifier").dataset.name = element.dataset.name;
                    idQualifierSelected = element.dataset.id;
                }
            }

            if (element.parentNode.classList.contains("receptor")) {
                if (event.ctrlKey) {
                    lokiDb.nodes.findAndRemove({ id: element.dataset.id });
                } else {
                    document.querySelector("#receptor").dataset.id = element.dataset.id;
                    document.querySelector("#receptor").dataset.name = element.dataset.name;

                    idActorSelected.receptor.id = element.dataset.id;

                    idActorSelected = {
                        "emettor": {
                            "id": null
                        },
                        "receptor": {
                            "id": null
                        }
                    };

                    idQualifierSelected = null;

                    const emettorElement = document.querySelector("#emettor");
                    const receptorElement = document.querySelector("#receptor");
                    const qualifierElement = document.querySelector("#qualifier");
                    try {
                        lokiDb.addRelation(emettorElement.dataset.id, qualifierElement.dataset.id, receptorElement.dataset.id);
                    } catch (error) {
                        ipcRenderer.invoke('alert:message', { message: error, icon: "error" });
                    }

                    renderGraph();
                    Utils.emptyRelationChunks();
                }
            }
            document.dispatchEvent(updateEvent);
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

    const relationsVisibility = lokiDb.getRelations().length > 0;
    const actorsVisibility = lokiDb.getActors().length > 0;
    const qualifierVisibility = lokiDb.getQualifiers().length > 0;
    document.getElementById("save-image").classList.toggle("visible", relationsVisibility);
    document.getElementById("graph").classList.toggle("visible", relationsVisibility);
    document.getElementById("save-configuration").classList.toggle("visible", actorsVisibility);
    document.querySelectorAll(".actorTitle").forEach((title) => title.classList.toggle("visible", actorsVisibility));
    document.querySelectorAll(".qualifierTitle").forEach((title) => title.classList.toggle("visible", qualifierVisibility));
    document.querySelector(".help").classList.toggle("visible", !qualifierVisibility && !actorsVisibility && !relationsVisibility);
});