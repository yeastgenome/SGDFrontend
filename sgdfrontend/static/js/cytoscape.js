
function create_cytoscape_vis(div_id, layout, style, data, f) {
	var cytoscape_div = $("#" + div_id);

	var height = .5*$(window).height();
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
		    edges: data['edges'],
		},
    };

	$('#' + div_id).cytoscape(options);
    var cy = $('#' + div_id).cytoscape("get");

    cy.zoomingEnabled(false);
    if(f != null) {
        f();
	}
	cy.on('tap', 'node', function(evt){
  		var node = evt.cyTarget;
  		window.location.href = node.data().link;
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
	    var singletons = cy.elements("node:visible");
	    var connectedNodes = cy.elements("edge:visible").connectedNodes();
	    singletons = singletons.not(connectedNodes);
        singletons.hide();
	};

	var recenter_button = document.createElement('a');
	recenter_button.id = "cy_recenter";
	recenter_button.className = "small button secondary";
	recenter_button.innerHTML = "Reset";
	recenter_button.onclick = function() {
		var old_zoom_value = cy.zoomingEnabled();
		cy.zoomingEnabled(true);
		cy.reset();
		cy.layout().run();
		cy.zoomingEnabled(old_zoom_value);
	};
	cytoscape_div.before(recenter_button, cytoscape_div);
	recenter_button.setAttribute('disabled', 'disabled');
	return cy;
}

function create_multimax_slider(slider_id, graph, min_value, max_value, slider_filter) {
    var slider = $("#" + slider_id);
    var max_to_slider = {};
    var current_slider = null;
    slider.update_new_max = function(smax) {
        var prev_value = null;
        if(current_slider != null) {
            current_slider.hide();
            prev_value = current_slider.val();
        }

        if(smax in max_to_slider) {
            current_slider = max_to_slider[smax];
        }
        else {
            var new_slider = document.createElement('div');
            new_slider.className = 'noUiSlider';
            new_slider.style.width = '100%';
            new_slider.id = 'slider' + smax;
            slider.append(new_slider);
            current_slider = setup_new_slider(new_slider.id, min_value, smax, Math.max(3, min_value),
                function() {
                    var cutoff = $("#" + new_slider.id).val()
                    graph.filters['slider'] = slider_filter(cutoff);
                    graph.applyFilters();
                }
            );
            max_to_slider[smax] = current_slider;
        }

        if(prev_value != null) {
            current_slider.val(Math.min(evidence_max, prev_value))
        }

        current_slider.show();
    };
    slider.update_new_max(max_value);
    return slider;
}

function setup_new_slider(div_id, min, max, current, slide_f) {
	if(max==min) {
		var slider = $("#" + div_id).noUiSlider({
			range: [min, min+1]
			,start: min
			,step: 1
			,handles: 1
			,slide: slide_f
		});
		slider.attr('disabled', 'disabled');
		var spacing =  92;
	    i = min-1
	    var value = i+1;
	    if(value >= 10) {
	    	var left = (spacing * (i-min+1))+2
	       	$('<span class="ui-slider-tick-mark muted">10+</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo(slider);
	    }
	    else {
	    	var left = (spacing * (i-min+1))+3.5
			$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo(slider);
		}
	}
	else {
		var slider = $("#" + div_id).noUiSlider({
			range: [min, max]
			,start: current
			,step: 1
			,handles: 1
			,connect: "lower"
			,slide: slide_f
		});

		var spacing =  92 / (max - min);
	    for (var i = min-1; i < max ; i=i+1) {
	    	var value = i+1;
	    	if(value >= 10) {
	    		var left = (spacing * (i-min+1))+2
	        	$('<span class="ui-slider-tick-mark muted">10+</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo(slider);
	    	}
	    	else {
	    		var left = (spacing * (i-min+1))+3.5
				$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo(slider);
	    	}
		}
	}
	return slider;
}

function create_discrete_filter(radio_id, graph, multimax_slider, target_filter, max_value) {
    var radio = $("#" + radio_id);
    radio.click(function() {
        multimax_slider.update_new_max(max_value);
        graph.filters['discrete'] = target_filter();
        graph.applyFilters();
    });
}