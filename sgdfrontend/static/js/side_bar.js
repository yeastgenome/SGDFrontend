
function draw_bar(x, y, height, color, label_text, count_text, vertical, layer) {
	
	if(vertical) {
		var start_bar = new Kinetic.Rect({
			x: y - 13,
			y: 9 + x,
			width: 50,
			height: 1,
	        fill: 'black'
		});
	    layer.add(start_bar);
	    
	    var bar = new Kinetic.Rect({
			x: y - 13,
			y: 10 + x-height,
			width: 50,
			height: height,
	        fill: color
		});
	    layer.add(bar);
	    
	    var label = new Kinetic.Text({
	        x: y - 18,
	        y: x + 15,
	        text: label_text,
	        fontSize: 15,
	        fontFamily: 'Calibri',
	        fill: 'black',
	        width: 60,
	        align: 'center'
	        });
	    layer.add(label);
	    
	    
	    var count = new Kinetic.Text({
	        x: y - 18,
	        y: x-height-5,
	        text: count_text,
	        fontSize: 14,
	        fontFamily: 'Calibri',
	        fill: 'black',
	        width: 60,
	        align: 'center'
	        });
	    layer.add(count);
	}
	else {
		var start_bar = new Kinetic.Rect({
			x: x,
			y: y,
			width: 1,
			height: 25,
	        fill: 'black'
		});
	    layer.add(start_bar);
	    
	    var bar = new Kinetic.Rect({
			x: x,
			y: y,
			width: height,
			height: 25,
	        fill: color
		});
	    layer.add(bar);
	    
	    var label = new Kinetic.Text({
	        x: x - 140,
	        y: y - 5,
	        text: label_text,
	        fontSize: 16,
	        fontFamily: 'Calibri',
	        fill: 'black'
	        });
	    layer.add(label);
	    
	    var count = new Kinetic.Text({
	        x: x + 5 + height,
	        y: y + 5,
	        text: count_text,
	        fontSize: 14,
	        fontFamily: 'Calibri',
	        fill: 'black'
	        });
	    layer.add(count);
	}
}

function draw_side_bar_diagram(container_name, values, labels, colors, vertical) {
	var zoom = 1.0/Math.max.apply(Math, values);;
	
	var width;
	var height;
	var spacer;
	var max_height;
	if(vertical) {
		width = 100*values.length;
		height = 210;
		spacer = 80;
		max_height = 130;
	}
	else {
		width = 500;
		height = 20 + 50*values.length;
		spacer = 50;
		max_height = 300;
	}
	var stage = new Kinetic.Stage({
		container: container_name,
		draggable: false,
		width:width,
		height: height
	});	

	var layer = new Kinetic.Layer();
	
	var x =  140
	var y = 20
	for (var i=0; i < values.length; i++) {
		var value = values[i];
		var height = max_height*value*zoom;
		var color = colors[i];
		var label = labels[i];
		draw_bar(x, y, height, color, label, value, vertical, layer);
		y = y + spacer;
	}
    
    stage.add(layer);
    
	return stage;
}



