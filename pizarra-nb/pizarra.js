/*
 * This is a Jupyter Notebook Extension that adds drawing capabilities to
 * notebooks.
 * This is, more or less, similar to the live drawing capabilities available 
 * on Powerpoint during live presentations.
 * https://support.office.com/en-us/article/Draw-on-slides-during-a-presentation-80a78a11-cb5d-4dfc-a1ad-a26e877da770
*/

define([
    'jquery',
    'base/js/namespace',
    'base/js/dialog',
    './html2canvas',
    './sketchpad'
], function (
    $,
    Jupyter,
    Dialog,
    h2c,
    sp
) {
    "use strict";
    var modal_width;

    var initialize = function() {
        Jupyter.toolbar.add_buttons_group([
            Jupyter.keyboard_manager.actions.register(
                {
                    help   : 'Open Pizarra and draw tools',
                    icon   : 'fa-paint-brush',
                    handler: handler
                }, 
                'draw-on-notebook', 
                'pizarra-nb'
            )
        ])
    };
    
    var get_html = function() {
        var cell = Jupyter.notebook.get_selected_cell();
        var w = cell.element.width();
        var h = cell.element.height();
        var element = document.getElementsByClassName("selected")[0];
        var header = "Pizarra-nb";

        return {header: header, 
                element: element,
                width: w,
                height: h};
    };

    var create_div = function(width, height, canvas, pizarra) {
        var div_main = document.createElement("div");
        div_main.width = width + 2;
        div_main.height = height + 52;
        var div_canvas = document.createElement("div");
        div_canvas.width = width + 1;
        div_canvas.height = height + 1;
        div_canvas.style = "text-align: center";
        div_canvas.appendChild(canvas);
        div_main.appendChild(div_canvas);
        var div_tools = document.createElement("div");
        div_tools.width = width + 1;
        div_tools.height = 50 + 1;
        div_tools.style = "text-align: center";
        var btn = document.createElement("button");
        btn.innerHTML = "undo";
        btn.onclick = undo;
        btn.style.display = "inline-block";
        div_tools.appendChild(btn);
        var btn = document.createElement("button");
        btn.innerHTML = "redo";
        btn.onclick = redo;
        btn.style.display = "inline-block";
        div_tools.appendChild(btn);
        var inp = document.createElement("input");
        inp.id = "color_picker";
        inp.type = "color";
        pizarra.color = "#aaaaaa";
        inp.value = "#aaaaaa";
        inp.addEventListener("change", color);
        inp.style.display = "inline-block";
        div_tools.appendChild(inp);
        var div_range = document.createElement("div");
        inp.style.display = "inline-block";
        var lab = document.createElement("label");
        lab.for = "range";
        lab.innerHTML = "width:";
        div_range.appendChild(lab);
        var inp = document.createElement("input");
        inp.id = "size_picker";
        inp.type = "range";
        inp.value = "5";
        inp.min = "1";
        inp.max = "50";
        inp.style.background = "#555555";
        inp.style.width = "100px";
        inp.style.display = "inline-block";
        inp.addEventListener("change", size);
        div_range.appendChild(inp);
        div_tools.appendChild(div_range);
        div_main.appendChild(div_tools);
        function undo() {
            pizarra.undo();
        }
        function redo() {
          pizarra.redo();
        }
        function color(event) {
          pizarra.color = $(event.target).val();
        }
        function size(event) {
          pizarra.penSize = $(event.target).val();
        }
        function animateSketchpad() {
          pizarra.animate(10);
        }
        return div_main;
    };

    var start_the_magic = function() {
        // get current cell data (HTML stuff)
        var result = get_html();
        var options = {width: result.width, height: result.height};
        // Here HTML is converted to canvas
        h2c(result.element, options).then(canvas => {
            // In the promise

            // Create a sketchpad with the html converted
            var pizarra = new sp({
                canvas: canvas,
                width: result.width,
                height: result.height
            });

            // Create div with canvas and tools
            var main_div = create_div(
                options.width,
                options.height,
                canvas,
                pizarra
            );

            var modal = Dialog.modal({
                title: "Pizarra-nb",
                body: main_div,
                buttons: {
                    'Close': {}
                },
                //sanitize: false
            });
            modal.children().width(result.width + 40)
        });
    };
    
    var handler = function() {
        start_the_magic();
    };

    function load_jupyter_extension () {
        return Jupyter.notebook.config.loaded.then(initialize);
    }

    return {
        load_jupyter_extension: load_jupyter_extension,
        load_ipython_extension: load_jupyter_extension
    };
});