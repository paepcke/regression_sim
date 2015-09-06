/**
 * 
 */

RegressionSim = function() {
	
	var NS = "http://www.w3.org/2000/svg";
	var svgArea;
	
	var gridSize = 20;
	var halfGridS = Math.round(gridSize/2.0);
	
	var gridLineWidth    = 1;
	var gridLineOpacity  = 0.2;
	
	var arrowDefaultWidth = 1;
	var arrowDefaultColor = 'black';
	
	var coordSys = {'topLeftX'  : gridSize,
					'topLeftY'  : 0,
					'width'     : 500,
					'height'    : 370	};

	var axisStrokeWidth  = 5;
	var yAxisHeight 	 = coordSys.height - halfGridS;
	var yAxisLeftPadding = gridSize;
	var xAxisWidth       = coordSys.width - gridSize;
	
	var xAxisLabel = "Distance";
	var yAxisLabel = "Potatoes";
	
	
	this.construct = function() {
		svgArea = document.getElementById('svgArea');
	}();
	
	this.setup = function() {
		// Create a reusable arrow head:
		arrowHead = createArrowHead();
		svgArea.appendChild(arrowHead);
		
		// Create grid lines, axes, and axis labels:
		coordSys = makeCoordSys();
		svgArea.appendChild(coordSys);
	}

	var makeCoordSys = function() {

		var coordFld = document.createElementNS(NS,"svg");
		coordFld.width  = coordSys.width;
		coordFld.height = coordSys.height;
		
    	// Draw vertical grid lines:
		for (var x = 0.5; x < coordSys.width; x += gridSize) {
			var gridLine = document.createElementNS(NS, 'line');
			gridLine.x1.baseVal.value = x;
			gridLine.y1.baseVal.value = 0.5;
			gridLine.x2.baseVal.value = x;
			gridLine.y2.baseVal.value = coordSys.height;
			gridLine.setAttribute('stroke', "black");
			gridLine.setAttribute('stroke-opacity', gridLineOpacity);
			gridLine.setAttribute('stroke-width', gridLineWidth);
			coordFld.appendChild(gridLine);
		}
		
		// Draw horizontal grid lines:
		for (var y = 0.5; y < coordSys.height; y += gridSize) {
			var gridLine = document.createElementNS(NS, 'line');
			gridLine.x1.baseVal.value = 0.5;
			gridLine.y1.baseVal.value = y;
			gridLine.x2.baseVal.value = coordSys.width
			gridLine.y2.baseVal.value = y;
			gridLine.setAttribute('stroke', "black");
			gridLine.setAttribute('stroke-opacity', gridLineOpacity);
			gridLine.setAttribute('stroke-width', gridLineWidth);
			coordFld.appendChild(gridLine);
		}
		
		// Draw y axis:
		var yAxis = makeArrow(yAxisLeftPadding, yAxisHeight,
			    		      yAxisLeftPadding, gridSize,
				    	      axisStrokeWidth);
		coordFld.appendChild(yAxis);
		
		// Draw x axis:
		var xAxis = makeArrow(yAxisLeftPadding - axisStrokeWidth/2, yAxisHeight,
							  xAxisWidth, yAxisHeight,
					          axisStrokeWidth);
		coordFld.appendChild(xAxis);
		
		// Draw x axis label:
		var xLabel = document.createElementNS(NS, 'text');
		xLabel.textContent = xAxisLabel;
		// Get text width:
		var labelWidth = xLabel.getBBox().width; 
		xLabel.setAttribute('x', xAxisWidth - labelWidth);
		// Make the label *end* at x:
		xLabel.setAttribute('text-anchor', 'end');
		xLabel.setAttribute('y', yAxisHeight);
		xLabel.setAttribute('fill', '#000');
		
		coordFld.appendChild(xLabel);
		
		// Draw y axis label
		var yLabel = document.createElementNS(NS, 'text');
		yLabel.textContent = yAxisLabel;
		// Get text width:
		//*****var labelWidth  = yLabel.getBBox().width;   <---- {0,0} Bad.
		//*****var labelHeight = yLabel.getBBox().height;
		var labelHeight = 100;
		var labelWidth  = 100;
		
		yLabel.setAttribute('x', halfGridS + labelWidth);
		yLabel.setAttribute('y', labelHeight);
		yLabel.setAttribute('fill', '#000');

		// Create a new SVG Transform:
		var rotationTransform = coordFld.createSVGTransform();
		rotationTransform.setRotate(-90, halfGridS + labelHeight, labelWidth);
		// Add the empty rotation transform to the yLabel list of 
		// SVGTransform objects as item(0):
		yLabel.transform.baseVal.initialize(rotationTransform);
		
		coordFld.appendChild(yLabel);
		
		return coordFld;
	}
	
	var makeArrow = function(x1, y1, x2, y2, strokeWidth) {
		if (strokeWidth === undefined) {
			strokeWidth = arrowDefaultWidth;
		}
		var arrow = document.createElementNS(NS, 'line');
		arrow.x1.baseVal.value = x1;
		arrow.y1.baseVal.value = y1;
		arrow.x2.baseVal.value = x2;
		arrow.y2.baseVal.value = y2;
		arrow.setAttribute('stroke', arrowDefaultColor);
		arrow.setAttribute('stroke-width', strokeWidth);
		arrow.setAttribute('marker-end', 'url(#arrowHead)');
		return arrow;
	}
	
	var createArrowHead = function() {
	    var arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

	    arrowHead.style.width = "200px";
	    arrowHead.style.height = "200px";
	    arrowHead.style.overflow = 'visible';
	    arrowHead.style.position = 'absolute';
	    arrowHead.setAttribute('version', '1.1');
	    arrowHead.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	    //****div.appendChild(svgNode);

	    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
	    var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
	    marker.setAttribute('id', 'arrowHead');
	    marker.setAttribute('viewBox', '0 0 10 10');
	    marker.setAttribute('refX', '0');
	    marker.setAttribute('refY', '5');
	    marker.setAttribute('markerUnits', 'strokeWidth');
	    marker.setAttribute('markerWidth', '4');
	    marker.setAttribute('markerHeight', '3');
	    marker.setAttribute('orient', 'auto');
	    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	    marker.appendChild(path);
	    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');

	    arrowHead.appendChild(defs);
	    defs.appendChild(marker);
	    
	    return arrowHead; 
	}
}

regSim = new RegressionSim();
regSim.setup();
