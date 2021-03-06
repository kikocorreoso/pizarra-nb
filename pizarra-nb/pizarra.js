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

    // adapted from https://stackoverflow.com/a/21648508
    var hexToRgbA = function(hex, alpha){
        var c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length== 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255, alpha].join(',')+')';
        }
        throw new Error('Bad Hex');
    };

    var create_div = function(width, height, canvas, pizarra) {
        // Main div to be included in the modal.
        // The div contains an area for the canvas and an area for the controls
        var div_main = document.createElement("div");
        div_main.width = width + 2;
        div_main.height = height + 52;
            // div containing the html transformed to canvas using html2canvas
            var div_canvas = document.createElement("div");
            div_canvas.width = width + 1;
            div_canvas.height = height + 1;
            div_canvas.style = "text-align: center";
            div_canvas.appendChild(canvas);
            div_main.appendChild(div_canvas);
            // div containing the controls to draw on the canvas
            var div_tools = document.createElement("div");
            div_tools.classList.add("form-inline");
            div_main.appendChild(div_tools);
                // Button to undo an action (included in div_tools)
                var btn = document.createElement("button");
                btn.innerHTML = "undo";
                btn.onclick = undo;
                btn.classList.add("btn");
                btn.classList.add("btn-default");
                div_tools.appendChild(btn);
                // Button to redo an action (included in div_tools)
                var btn = document.createElement("button");
                btn.innerHTML = "redo";
                btn.onclick = redo;
                btn.classList.add("btn");
                btn.classList.add("btn-default");
                div_tools.appendChild(btn);
                // select element to choose the tool to be used to paint (included in div_tools)
                var slt = document.createElement("select");
                slt.classList.add("span2");
                slt.name = "category";
                slt.style.fontFamily = "font-family: sans-serif, 'FontAwesome'";
                var slt_options = {
                    "brush": "&#xf1fc; Brush",
                    "rectangle": "&#xf096; Rectangle",
                    "circle": "&#xf1db; Circle",
                    "arrow": "&#xf178; Arrow",
                    "arrows": "&#xf07e; Arrows",
                };
                for (var opt in slt_options){
                    var option = document.createElement('option');
                    option.value = opt;
                    option.innerHTML = slt_options[opt];
                    slt.appendChild(option);
                };
                slt.disabled = "disabled"; ///// At this moment this control is disabled as only the brush/pen is available
                div_tools.appendChild(slt);
                // label and input range for pen/text width/size (included in div_tools)
                var lab = document.createElement("label");
                lab.for = "width-range";
                lab.innerHTML = "Width:";
                div_tools.appendChild(lab);
                var div = document.createElement("div");
                div.classList.add("form-group");
                div.style.border = "1px solid #888";
                    var input = document.createElement("input");
                    input.type = "range";
                    input.classList.add("form-control");
                    input.id = "width-range";
                    input.style.width = "100px";
                    input.value = "5";
                    input.min = "1";
                    input.max = "50";
                    input.addEventListener("change", size);
                    div.appendChild(input);
                div_tools.appendChild(div);
                // label and input range for pen transparency (included in div_tools)
                var lab = document.createElement("label");
                lab.for = "alpha-range";
                lab.innerHTML = "Alpha:";
                div_tools.appendChild(lab);
                var div = document.createElement("div");
                div.classList.add("form-group");
                div.style.border = "1px solid #888";
                    var input = document.createElement("input");
                    input.type = "range";
                    input.classList.add("form-control");
                    input.id = "alpha-range";
                    input.style.width = "100px";
                    input.value = "1";
                    input.min = "0";
                    input.max = "1";
                    input.step = "0.05";
                    input.addEventListener("change", transparency);
                    div.appendChild(input);
                div_tools.appendChild(div);
                // input color to get a the color to draw (included in div_tools)
                var input = document.createElement("input");
                input.id = "color_picker";
                input.type = "color";
                input.value = "#aaaaaa";
                input.addEventListener("change", color);
                div_tools.appendChild(input);
                // link button to save to png (included in div_tools)
                var link = document.createElement('a');
                link.innerHTML = 'save as png';
                link.classList.add("btn");
                link.classList.add("btn-default");
                link.role = "button";
                link.onclick = save_png;
                link.download = "cell_result.png";
                div_tools.appendChild(link);
                // button to save to cell below (included in div_tools)
                var btn = document.createElement("button");
                btn.innerHTML = "save to cell below";
                btn.onclick = save_cell;
                btn.classList.add("btn");
                btn.classList.add("btn-default");
                div_tools.appendChild(btn);
                // button to clear the included modifications (included in div_tools)
                var btn = document.createElement("button");
                btn.innerHTML = "reset";
                btn.onclick = reset;
                btn.classList.add("btn");
                btn.classList.add("btn-default");
                div_tools.appendChild(btn);

        function undo() {
            pizarra.undo();
        };
        function redo() {
          pizarra.redo();
        };
        function color(event) {
          pizarra.color = $(event.target).val();
        };
        function size(event) {
          pizarra.penSize = $(event.target).val();
        };
        function transparency(event) {
          pizarra.alpha = $(event.target).val();
        };
        function save_png(event) {
            $(event.target).attr("href", pizarra.toPNG());
        };
        function save_cell() {
            var result =  pizarra.toPNG();
            Jupyter.notebook.insert_cell_below("markdown");
            var next_cell = Jupyter.notebook.get_next_cell();
            next_cell.set_text('<img src="' + result + '" />');
            next_cell.execute();
        };
        function reset() {
          pizarra.reset();
        };
        /*
        function animateSketchpad() {
          pizarra.animate(10);
        };
        */
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