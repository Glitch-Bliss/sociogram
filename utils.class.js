
const { saveSvgAsPng } = require('save-svg-as-png');

class Utils {

    /**
 * Needed to avoid the svg classes bug in saveSvgAsPng
 * thanks to https://github.com/mermaid-js/mermaid/issues/146
 * @param {*} id 
 */
    static inlineCSStoSVG = (id) => {
        var nodes = document.querySelectorAll("#" + id + " *");
        for (var i = 0; i < nodes.length; ++i) {
            var elemCSS = window.getComputedStyle(nodes[i], null);
            nodes[i].removeAttribute('xmlns');
            nodes[i].style.fill = elemCSS.fill;
            nodes[i].style.fillOpacity = elemCSS.fillOpacity;
            nodes[i].style.stroke = elemCSS.stroke;
            nodes[i].style.strokeLinecap = elemCSS.strokeLinecap;
            nodes[i].style.strokeDasharray = elemCSS.strokeDasharray;
            nodes[i].style.strokeWidth = elemCSS.strokeWidth;
            nodes[i].style.fontSize = elemCSS.fontSize;
            nodes[i].style.fontFamily = elemCSS.fontFamily;
            //Solution to embbed HTML in foreignObject https://stackoverflow.com/a/37124551
            if (nodes[i].nodeName === "SPAN") {
                nodes[i].setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
            }
        }
    }

    static saveGraphToImage(id) {        
        Utils.inlineCSStoSVG(id);
        return saveSvgAsPng(document.getElementById(id), "sociographer.png");
    }

    static emptyRelationChunks() {
        document.querySelector("#emettor").dataset.id = "";
        document.querySelector("#emettor").dataset.name = "";
        document.querySelector("#qualifier").dataset.id = "";
        document.querySelector("#qualifier").dataset.name = "";
        document.querySelector("#receptor").dataset.id = "";
        document.querySelector("#receptor").dataset.name = "";
    }

}

module.exports = Utils;