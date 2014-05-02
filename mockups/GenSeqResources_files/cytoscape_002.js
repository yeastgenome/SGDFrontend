
function create_cytoscape_vis(div_id, layout, style, data, f, hide_singletons) {
	var cytoscape_div = $("#" + div_id);

	var height = Math.min(.75*$(window).height(), 600);
	var width = $('#' + div_id).width();
	cytoscape_div.height(height);

	options = {
		showOverlay: false,
		layout: layout,
		minZoom: 0.5,
		maxZoom: 2,
		style: style,

		elements: {
		    nodes: data['nodes'],
		    edges: data['edges']
		}
    };

	$('#' + div_id).cytoscape(options);
    var cy = $('#' + div_id).cytoscape("get");

    cy.zoomingEnabled(false);
    if(f != null) {
        f();
	}
	cy.on('tap', 'node', function(evt){
  		var node = evt.cyTarget;
        if(node.data().link != null) {
  		    window.location.href = node.data().link;
        }
	});
	cy.on('layoutstop', function(evt){
		$('#cy_recenter').removeAttr('disabled');
	});
	cy.on('tap', function (evt) {
		this.zoomingEnabled(true);
	});
	cy.on('mouseout', function(evt) {
		this.zoomingEnabled(false);
	});

	cy.filters = {};
	cy.applyFilters = function() {
        var elements = cy.elements("*");
	    for(var filterKey in cy.filters) {
            elements = elements.intersect(cy.filters[filterKey]);
	    }
	    elements.show();

	    var notElements = cy.elements("*");
	    notElements = notElements.not(elements);
	    notElements.hide();

	    //Hide singleton nodes
	    if(hide_singletons) {
            var centerNode = cy.elements("node[sub_type = 'FOCUS']")[0].id();
            var singletons = cy.elements("node:visible");
            var connectedNodes = cy.elements("edge[target = '" + centerNode + "']:visible, edge[source = '" + centerNode + "']:visible").connectedNodes();
            singletons = singletons.not(connectedNodes);
            singletons.hide();
        }
	};

	var recenter_button = document.createElement('a');
	recenter_button.id = "cy_recenter";
	recenter_button.className = "small button secondary";
	recenter_button.innerHTML = "Reset";
	recenter_button.onclick = function() {
		var old_zoom_value = cy.zoomingEnabled();
		cy.zoomingEnabled(true);
		cy.reset();
        if(typeof cy.layout().run === 'function') {
		    cy.layout().run();
        }
		cy.zoomingEnabled(old_zoom_value);
	};
	cytoscape_div.before(recenter_button, cytoscape_div);
	recenter_button.setAttribute('disabled', 'disabled');
	return cy;
}

function create_slider(slider_id, graph, min, max, slide_f, stop) {
    var range;
    var start;
	if(max==min) {
		range = [min, min+1];
		start = min;
	}
	else {
		range = [min, max];
		start = Math.max(3, min);
	}
	var slider = $("#" + slider_id).noUiSlider({
		range: range
		,start: start
		,step: 1
		,handles: 1
		,connect: "lower"
		,slide: function() {
            var cutoff = slider.val();
            graph.filters['slider'] = slide_f(cutoff);
            graph.applyFilters();
        }
	});

	if(max==min) {
	    slider.attr('disabled', 'disabled');
	}

	create_slider_ticks("slider_ticks", min, max, stop)

	slider.update_new_max = function(smax) {
        var slider_max = smax;
        if(slider_max == min) {
            slider_max = min+1;
        }
        $("#" + slider_id).noUiSlider({
            range: [min, slider_max]
        }, true);
        create_slider_ticks("slider_ticks", min, smax, stop);
        var cutoff = slider.val();
        graph.filters['slider'] = slide_f(cutoff);
        graph.applyFilters();
	};

	var cutoff = slider.val();
    graph.filters['slider'] = slide_f(cutoff);
    graph.applyFilters();

	return slider;
}

function create_slider_ticks(slider_tick_id, min, max, stop) {
    if(stop == null) {
        stop = 10;
    }
    $("#" + slider_tick_id).empty();
    if(max==min) {
		var spacing =  92;
	    i = min-1
	    var value = i+1;
	    if(value >= stop) {
	    	var left = (spacing * (i-min+1))+2
	       	$('<span class="ui-slider-tick-mark muted">' +stop+ '+</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo("#" + slider_tick_id);
	    }
	    else {
	    	var left = (spacing * (i-min+1))+3.5
			$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo("#" + slider_tick_id);
		}
	}
	else {
		var spacing =  92 / (max - min);
	    for (var i = min-1; i < max ; i=i+1) {
	    	var value = i+1;
	    	if(value >= stop) {
	    		var left = (spacing * (i-min+1))+2
	        	$('<span class="ui-slider-tick-mark muted">' +stop+ '+</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo("#" + slider_tick_id);
	    	}
	    	else {
	    		var left = (spacing * (i-min+1))+3.5
				$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo("#" + slider_tick_id);
	    	}
		}
	}
}

function create_discrete_filter(radio_id, graph, slider, target_filter, max_value) {
    var radio = $("#" + radio_id);
    radio.click(function() {
        slider.update_new_max(max_value);
        graph.filters['discrete'] = target_filter();
        graph.applyFilters();
    });
}