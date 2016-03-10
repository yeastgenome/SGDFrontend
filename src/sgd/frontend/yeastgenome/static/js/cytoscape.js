
function create_cytoscape_vis(div_id, layout, style, data, f, hide_singletons, legendType) {
	// legend type defaults to false (only loci)
	legendType = legendType || false;

	var cytoscape_div = $("#" + div_id);
	var height = Math.min(.75*$(window).height(), 600);
	var width = $('#' + div_id).width();
	var offset = 75;
	cytoscape_div.height(height);

	$(".j-sgd-cyto-canvas")
		.attr("width", width)
		.attr("height", height + offset);
	$(".j-sgd-cyto-canvas").css("margin-top", '2rem');;

	var _legendOffsets = {
		protein: 0,
		go: 75,
		phenotype: 75,
		literature: 0,
		interaction: 150,
		regulation: 150,
		expression: 75,
		phenotypeOntology: 0,
		goOntology: 0,
		observable: 0
	};
	var _legendOffset = _legendOffsets[legendType];
	$(".sgd-cyto-canvas-container").parent().height(height + offset + _legendOffset);

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

    var legendY = height + 35;

    // add date
    var $canvas = $("#j-sgd-visible-cyto-canvas")[0]
	var ctx = $canvas.getContext("2d");
	var fontSize = 12;
	ctx.font = fontSize + "pt Helvetica";
	var now = new Date();
	var month = (now.getMonth() + 1).toString();
	var date = now.getDate().toString();
	if (month.length === 1) month = "0" + month;
	if (date.length === 1) date = "0" + date;
	var txt = "SGD " + now.getFullYear() + "-" + month + "-" + date;
	var txtWidth = ctx.measureText(txt).width;
	ctx.fillText(txt, width - txtWidth - fontSize, legendY + 5);

	/// *** draw legend ***

	// helper method to draw legend nodes
	var drawLegendNode = function (ctx, text, x, y, color, isCircle, isBlackText) {
		ctx.fillStyle = color;
		if (isCircle) {
			ctx.beginPath();
			ctx.arc(x, y, 15, 0, 2 * Math.PI, false);
			ctx.closePath();
			ctx.fill();
		} else {
			ctx.beginPath();
			ctx.rect(x - 15, y - 15, 30, 30);
			ctx.closePath();
			ctx.fill();
		}
		
		var textX = x - ctx.measureText(text).width / 2;
		var textY = y + 3;
		ctx.font = 12 + "pt Helvetica";	
		ctx.strokeStyle = isBlackText ? 'white': '#757575';
	    ctx.lineWidth = 5;
	    ctx.strokeText(text, textX, textY);
		ctx.fillStyle = isBlackText ? '#757575' : 'white';
		ctx.fillText(text, textX, textY);
	};

	var mainText = "Current Locus";
	var secondText = "Other Locus";
	if (legendType === "goOntology") {
		mainText = "Current Term";
		secondText = "Other Term";
	} else if (legendType === "phenotypeOntology" || legendType === "observable") {
		mainText = "Current Observable";
		secondText = "Other Observable";
	}
	var secondColor = (legendType === "goOntology") ? "#458FD3" :  "#757575";
	if (legendType === "observable") secondColor = "#FF6A00";

	// draw legend
	var startX = (legendType === "phenotypeOntology" || legendType === "observable") ? 74 : 53;
	drawLegendNode(ctx, mainText, startX, legendY, '#F9DA56', true, false);
	var secondX = (legendType === "phenotypeOntology" || legendType === "observable") ? 230 : 160;
	if (legendType !== "literature") drawLegendNode(ctx, secondText, secondX, legendY, secondColor, true, true);
	var nextLegendX = (legendType === "phenotypeOntology" || legendType === "observable") ? 360 : 245;
	if (legendType === "protein") {
		drawLegendNode(ctx, "Domain", nextLegendX, legendY, '#3366cc', false, true);	
	} else if (legendType === "go") {
		drawLegendNode(ctx, "GO Term", nextLegendX, legendY, '#6CB665', false, true);
	} else if (legendType === "phenotype") {
		drawLegendNode(ctx, "Phenotype", nextLegendX, legendY, '#C591F5', false, true);
	} else if (legendType === "literature") {
		drawLegendNode(ctx, "Reference", nextLegendX, legendY, '#C591F5', true, true);
	} else if (legendType === "observable") {
		drawLegendNode(ctx, "Ontology", nextLegendX, legendY, "#757575", true, true);
	}

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

    var recenter_button = $('#' + div_id + '_recenter');
    recenter_button.click(function() {
		var old_zoom_value = cy.zoomingEnabled();
		cy.zoomingEnabled(true);
		cy.reset();
        if(typeof cy.layout().run === 'function') {
		    cy.layout().run();
        }
		cy.zoomingEnabled(old_zoom_value);
	});

	return cy;
}

function create_cy_download_button(cy, button_id, file_name) {
    $("#" + button_id).click(function() {

    	// get hidden canvas
    	var $hiddenCanvas = $("#j-sgd-hidden-cyto-canvas")[0];
    	var hiddenCtx = $hiddenCanvas.getContext("2d");
    	
    	// get custom canvas, write to hidden canvas
    	var $customCanvas = $("#j-sgd-visible-cyto-canvas")[0];
    	var customImage = new Image();
    	customImage.onload = function () {
    		hiddenCtx.drawImage(this, 0, 0);
	    	// write cyto hidden canvas
	    	var cytoImage = new Image();
	    	
	    	cytoImage.onload = function () {
	    		hiddenCtx.drawImage(this, 0, 16);
		    	post_to_url('/download_image', { "display_name":file_name, 'data': $hiddenCanvas.toDataURL("image/png") });
	    	}
	    	cytoImage.src = cy.png();
    	}
    	customImage.src = $customCanvas.toDataURL();
    	
		// hiddenCtx.drawImage(cytoImage, 0, 16);

    	// post_to_url('/download_image', { "display_name":file_name, 'data': $hiddenCanvas.toDataURL("image/png") });
    });
    $("#" + button_id).attr('disabled', false);
}

function create_slider(slider_id, graph, min, max, slide_f, stop) {
    var range;
    var start;
	if(max==min) {
		range = {'min': [min],
                'max': [min+1]};
		start = min;
	}
	else {
		range = {'min': [min],
                'max': [max]};
		start = Math.max(3, min);
	}
	var slider = $("#" + slider_id).noUiSlider({
		range: range
		,start: start
		,step: 1
		,handles: 1
		,connect: "lower"
	});
    slider.change(function() {
            var cutoff = slider.val();
            graph.filters['slider'] = slide_f(cutoff);
            graph.applyFilters();
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
            range: {'min': [min],
                    'max': [slider_max]}
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
		var spacing =  87;
	    i = min-1
	    var value = i+1;
	    if(value >= stop) {
	    	var left = (spacing * (i-min+1))+4.5
	       	$('<span class="ui-slider-tick-mark muted">' +stop+ '+</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo("#" + slider_tick_id);
	    }
	    else {
	    	var left = (spacing * (i-min+1))+6
			$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo("#" + slider_tick_id);
		}
	}
	else {
		var spacing =  87 / (max - min);
	    for (var i = min-1; i < max ; i=i+1) {
	    	var value = i+1;
	    	if(value >= stop) {
	    		var left = (spacing * (i-min+1))+4.5
	        	$('<span class="ui-slider-tick-mark muted">' +stop+ '+</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo("#" + slider_tick_id);
	    	}
	    	else {
	    		var left = (spacing * (i-min+1))+6
				$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('margin-top', '8px').appendTo("#" + slider_tick_id);
	    	}
		}
	}
}

function create_discrete_filter(radio_id, graph, slider, target_filter, max_value) {
    var radio = $("#" + radio_id);
    radio.click(function() {
        if(slider != null) {
            slider.update_new_max(max_value);
        }
        graph.filters['discrete'] = target_filter();
        graph.applyFilters();
    });
}