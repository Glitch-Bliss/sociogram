

import '../scss/main.scss';
import mermaidAPI from 'mermaid';

// /**
//  * LOKI JS
 
// const loki = require("lokijs");

// var db = new loki("quickstart.db");
// var users = db.addCollection("users");

// users.insert({ name: 'odin', age: 50 });
// users.insert({ name: 'thor', age: 35 });

// var result = users.find({ age: { $lte: 35 } });

// // dumps array with 1 doc (thor) to console
// console.log(result);
// */

/**
 * MERMAID
 */

var mermaidConfig = {
    startOnLoad:true,
    htmlLabels:true,
    callback:function(id){
        console.log(id,' rendered');
    },
    flowchart:{
            useMaxWidth:true,
        }
};
mermaidAPI.initialize(mermaidConfig);

function mermaidExecution() {
    var element = document.querySelector(".mermaidGraph");
    var insertSvg = function (svgCode, bindFunctions) {
        element.innerHTML = svgCode;
    };

    var graphDefinition = 'graph TB\na-->b';
    var graph = mermaidAPI.render('mermaidGraph', graphDefinition, insertSvg);
}

/**
 * App logic
 */

document.addEventListener("DOMContentLoaded", () => {
    mermaidExecution();
});

console.info("ok");
