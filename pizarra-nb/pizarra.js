/*
 * This is a Jupyter Notebook Extension that adds drawing capabilities to
 * notebooks.
 * This is, more or less, similar to the live drawing capabilities available 
 * on Powerpoint during live presentations.
 * https://support.office.com/en-us/article/Draw-on-slides-during-a-presentation-80a78a11-cb5d-4dfc-a1ad-a26e877da770
*/

define([
    'base/js/namespace',
    'base/js/dialog'
], function (
    Jupyter,
    Dialog
) {
    "use strict";

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
    
    var create_svg = function(html) {
        return undefined;
    };

    var handler = function() {
        Dialog.modal({
            title: 'Hello world',
            body: '<h1>Hi</h1>, lorem ipsum and such',
            buttons: {
                'kthxbye': {}
            },
            sanitize: false
        })
        /*
        var cell = Jupyter.notebook.get_selected_cell();
        cell.execute();
        
        if (cell.cell_type === "markdown") {
            var html_text = cell.get_rendered();
            cell.set_rendered("<p>Pizarra</p>" + html_text)
        } else if (cell.cell_type === "code") {
            var html_text = cell
                .element.get()[0]
                .getElementsByClassName("output_subarea")[0].innerHTML
            cell.element.get()[0]
                .getElementsByClassName("output_subarea")[0]
                .innerHTML = "<p>Pizarra</p>" + html_text
        } else {
            alert("Pizarra only works on markdown and code cells...")
        }
        */
    };

    function load_jupyter_extension () {
        return Jupyter.notebook.config.loaded.then(initialize);
    }

    return {
        load_jupyter_extension: load_jupyter_extension,
        load_ipython_extension: load_jupyter_extension
    };
});