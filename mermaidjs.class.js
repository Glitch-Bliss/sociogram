const mermaid = require('mermaid');

// require = require('esm')(module)
// const mermaid = require("mermaid");

class MermaidJs {
    constructor() {
        const mermaidConfig = {
            startOnLoad: false,
            htmlLabels: true,
            callback: function (id) { },
            flowchart: {
                useMaxWidth: true,
            },
            logLevel: 5,
            theme: "dark",
            themeCSS: ".edgeLabel {background-color: black;padding:2px; }"
        };
        mermaid.initialize(mermaidConfig, "graph");
    }

    /**
     * Render the graph
     * @param {*} id 
     * @param {*} graphCode 
     * @param {*} callback 
     */
    render(id, graphCode, callback) {
        mermaid.render(id, graphCode, callback);
    }
}

// why instance rather than class ? Singleton ! https://medium.com/swlh/node-js-and-singleton-pattern-7b08d11c726a
module.exports = new MermaidJs();