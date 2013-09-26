
function draw_side_bar_diagram(container_name, a, b, color1, color2) {
	var zoom = 1;
	if(a > b) {
		zoom = 1.0/a;
	}
	else {
		zoom = 1.0/b;
	}
	
	var stage = new Kinetic.Stage({
		container: container_name,
		draggable: false,
		width:500,
		height:120
	});	
	
	var layer = new Kinetic.Layer();
	
	var target_start_bar = new Kinetic.Rect({
		x: 140,
		y: 20,
		width: 1,
		height: 25,
        fill: 'black'
	});
    layer.add(target_start_bar);
    
    var regulator_start_bar = new Kinetic.Rect({
		x: 140,
		y: 75,
		width: 1,
		height: 25,
        fill: 'black'
	});
    layer.add(regulator_start_bar);
	
	var target_bar = new Kinetic.Rect({
		x: 140,
		y: 20,
		width: 300*a*zoom,
		height: 25,
        fill: color1
	});
    layer.add(target_bar);
    
    var regulator_bar = new Kinetic.Rect({
		x: 140,
		y: 75,
		width: 300*b*zoom,
		height: 25,
        fill: color2,
	});
    layer.add(regulator_bar);
    
    var target_label = new Kinetic.Text({
        x: 0,
        y: 10,
        text: 'Transcriptional\nTargets',
        fontSize: 20,
        fontFamily: 'Calibri',
        fill: 'black'
        });
    layer.add(target_label);
        
    var regulators_label = new Kinetic.Text({
        x: 0,
        y: 65,
        text: 'Transcriptional\nRegulators',
        fontSize: 20,
        fontFamily: 'Calibri',
        fill: 'black'
        });
    layer.add(regulators_label);
    
    var target_count = new Kinetic.Text({
        x: 145 + 300*a*zoom,
        y: 25,
        text: a,
        fontSize: 14,
        fontFamily: 'Calibri',
        fill: 'black'
        });
    layer.add(target_count);
    
    var regulators_count = new Kinetic.Text({
        x: 145 + 300*b*zoom,
        y: 80,
        text: b,
        fontSize: 14,
        fontFamily: 'Calibri',
        fill: 'black'
        });
    layer.add(regulators_count);
        
    stage.add(layer);
    
	return stage;
}



