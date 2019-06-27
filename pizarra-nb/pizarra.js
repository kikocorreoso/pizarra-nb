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
    './html2canvas'
], function (
    $,
    Jupyter,
    Dialog,
    h2c
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
    
    /*var create_svg = function(html) {
        return undefined;
    };

    var get_html = function() {
        var cell = Jupyter.notebook.get_selected_cell();
        //cell.execute(); // Do not execute code. It should be done by the user
        
        var html_text;
        var header;
        
        if (cell.cell_type === "markdown") {
            header = "Pizarra-nb";
            html_text = cell.get_rendered();
        } else if (cell.cell_type === "code") {
            try {
                var element = cell.element.find(".output_subarea").get()[0];
                header = "Pizarra-nb";
                html_text = element.innerHTML;
            } catch(error) {
                header = "Pizarra-nb - ERROR!!!";
                html_text = "<p>It seems there is no output to show.</p>"
                html_text += "<p>Have you run the code cell?</p>"                
            }
        } else {
            header = "Pizarra-nb - ONLY MARKDOWN AND CODE CELLS ARE VALID!!!"
            html_text = "Pizarra only works on markdown and code cells...";
        };
        return [header, html_text];
    };
    
    var convert_to_canvas = function(html) {
        var canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 400;
        var ctx = canvas.getContext('2d'); 
        var data = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">' +
                   '<foreignObject width="100%" height="100%">' +
                   '<div xmlns="http://www.w3.org/1999/xhtml">' +
                   html +
                   '</div>' +
                   '</foreignObject>' +
                   '</svg>';
        console.log(data);
        var DOMURL = window.URL || window.webkitURL || window;
        var img = new Image();
        var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        var url = DOMURL.createObjectURL(svg);
        img.onload = function () {
          ctx.drawImage(img, 0, 0);
          DOMURL.revokeObjectURL(url);
        }
        img.src = url;
        return canvas;
    };
    
    var handler = function() {
        var result = get_html();
        var canvas = convert_to_canvas(result[1]);
        Dialog.modal({
            title: result[0],
            body: canvas,
            buttons: {
                'Close': {}
            },
            sanitize: false
        })
    };*/
    
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
    
    var convert2canvas = function() {
        // get current cell data
        
        var result = get_html();
        var canvas = document.createElement('canvas');
        var options = {width: result.width, height: result.height};
        h2c(result.element, options).then(canvas => {
            var modal = Dialog.modal({
                title: "Pizarra-nb",
                body: canvas,
                buttons: {
                    'Close': {}
                },
                //sanitize: false
            });
            modal.children().width(result.width + 40)
        });
        return canvas;
    };
    
    var handler = function() {
        convert2canvas();
    };

    function load_jupyter_extension () {
        return Jupyter.notebook.config.loaded.then(initialize);
    }

    return {
        load_jupyter_extension: load_jupyter_extension,
        load_ipython_extension: load_jupyter_extension
    };
});