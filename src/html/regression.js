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
	
	// Will be replaced by the SVG 
	// obj that implements the coordinate
	// system:
	var coordSys = {'topLeftX'  : gridSize,
					'topLeftY'  : 0,
					'width'     : 500,
					'height'    : 370	};

	var axisStrokeWidth   = 5;
	var axisStrokeOpacity = 0.5;
	var yAxisHeight 	  = coordSys.height - halfGridS;
	var yAxisLeftPadding  = gridSize;
	var xAxisWidth        = coordSys.width - gridSize;
	
	var xAxisLabel = "Distance";
	var yAxisLabel = "Potatoes";
	
	var currCoordSlope = 0.5;
	var currCoordIntercept = 3;
	var currPixelCoordSlope;
	var currPixelCoordIntercept;

	var lineStrokeWidth = 4;
	
	var lineDragHandleWidth      = gridSize;
	var lineDragHandleHeight     = gridSize;
	var lineDragHandleRestColor  = 'yellow';
	var lineDragHandleMoveColor  = 'green';
	
	var lineDragHandleState = {'x' : 0, 'y' : 0, 'dragging' : false};
	var rotatingLine   = false;
		
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
				
		// We couldn't place the axis labels when they
		// were created, b/c their width/heights were 
		// unknown at the point. Move them now:
		
		var xLabel = document.getElementById('xLabel');
		var xLabelBox = xLabel.getBBox();
		// The x/y of labels are actually arrays of
		// SVGLength instances; grab the first (and only)
		// of those, and get it's value:
		var currY     = xLabel.y.baseVal[0].value;
		// Add the label's height to its y to move
		// it below the x axis:
		xLabel.setAttribute('y', currY + xLabelBox.height);

		// Rotate and move the y-axis label:
		// Create a new SVG Transform:
		var yLabel    = document.getElementById('yLabel');
		var yLabelBox = yLabel.getBBox();
		var rotationTransform = svgArea.createSVGTransform();
		rotationTransform.setRotate(-90, halfGridS + yLabelBox.height, yLabelBox.width);
		// Add the empty rotation transform to the yLabel list of 
		// SVGTransform objects as item(0):
		yLabel.transform.baseVal.initialize(rotationTransform);
		
		// I do not understand what's x vs. y after the
		// above transform; the two lines below are empirically
		// determined. But they work even when changing
		// the y-axis label:
		yLabel.setAttribute('x', 0);
		yLabel.setAttribute('y', yLabelBox.width - halfGridS - 5);
		
		// Draw the initial function line:
		line = drawFuncLine(currCoordSlope, currCoordIntercept, xAxisWidth);
		svgArea.appendChild(line);
		
		// Draw line drag handle:
		lineDragHandle = makeLineDragHandle();
		svgArea.appendChild(lineDragHandle);
		
		lineDragHandleState.x = lineDragHandle.x;
		lineDragHandleState.y = lineDragHandle.y;
	}

	this.lineMoveHandleMouseDown = function(evt) {
		evt.preventDefault();
		lineDragHandleState.dragging = true;
		lineDragHandleState.x = evt.clientX;
		lineDragHandleState.y = evt.clientY;
		evt.target.setAttribute('fill', lineDragHandleMoveColor);
	}
	
	this.lineMoveHandleMove = function(evt) {
		evt.preventDefault();
		if (lineDragHandleState.dragging) {
			var currX = lineDragHandleState.x;
			var currY = lineDragHandleState.y;
			//****var moveX = currX + (evt.clientX - currX);
			//****var moveY = currY + (evt.clientY - currY);
			// Only move vertically:
			var moveX = 0;
			//******
			//var moveY = evt.clientY - currY;
			var moveY = -1;
			//******

			var xFormList = evt.target.transform.baseVal;
			if (xFormList.length === 0) {
				translationXform = svgArea.createSVGTransform();
				xFormList.initialize(translationXform);
			} else {
				translationXform = xFormList[0];
			}
			translationXform.setTranslate(moveX, moveY);

			lineDragHandleState.y = evt.target.y;
		}
	}
	
	this.lineMoveHandleMouseUp = function(evt) {
		lineDragHandleState.dragging = false;
		lineDragHandleState.x = evt.clientX;
		lineDragHandleState.y = evt.clientY;
		evt.target.setAttribute('fill', lineDragHandleRestColor);
	}

	
    var drawFuncLine = function(slope, intercept, xMax) {
    	/**
    	 * Given slope and intercept, draw a line from 
    	 * the y-intercept to either the end of the x-axis
    	 * (if xMax is not provided), or to xMax, if it
    	 * is. All units are in terms of the visible grid.
    	 * This method converts to pixel dimension, and 
    	 * accounts for canvas y-dimension growing downward.
    	 */
    
    	if (xMax === undefined) {
    		pixelxMax = xAxisLen;
    	} else {
    		// Add one gridSize, b/c the y-axis is shifted
    		// right by one grid width to make room for the
    		// y-axis label:
    		pixelxMax = gridSize + gridSize * xMax;
    	}
    	
    	pixelIntercept = yAxisHeight - (gridSize * intercept);
    	pixelSlope     = - slope;
    	
    	line = document.createElementNS(NS, 'line');
    	line.setAttribute('stroke', 'black');
    	line.setAttribute('stroke-width', lineStrokeWidth);
    	line.setAttribute('x1', yAxisLeftPadding);
    	line.setAttribute('y1', pixelIntercept);
    	line.setAttribute('x2', xMax);
    	line.setAttribute('y2', pixelSlope * xMax + pixelIntercept);
    	
    	currCoordSlope      	= slope;
    	currPixelCoordSlope 	= pixelSlope;
    	currCoordIntercept      = intercept;
    	currPixelCoordIntercept = pixelIntercept;
    	
    	return line;
    }
	
	var makeCoordSys = function() {

		var coordFld = document.createElementNS(NS,"svg");
		coordFld.width  = coordSys.width;
		coordFld.height = coordSys.height;
		
    	// Draw vertical grid lines:
		for (var x = yAxisLeftPadding; x < coordSys.width; x += gridSize) {
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
			gridLine.x1.baseVal.value = yAxisLeftPadding;
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
				    	      axisStrokeWidth,
				    	      axisStrokeOpacity);
		coordFld.appendChild(yAxis);
		
		// Draw x axis:
		var xAxis = makeArrow(yAxisLeftPadding - axisStrokeWidth/2, yAxisHeight,
							  xAxisWidth, yAxisHeight,
					          axisStrokeWidth,
					          axisStrokeOpacity);
		coordFld.appendChild(xAxis);
		
		// Draw x axis label:
		var xLabel = document.createElementNS(NS, 'text');
		xLabel.setAttribute('id', 'xLabel');
		xLabel.textContent = xAxisLabel;
		// Get text width:
		xLabel.setAttribute('x', xAxisWidth);
		// Make the label *end* at x:
		xLabel.setAttribute('text-anchor', 'end');
		xLabel.setAttribute('y', yAxisHeight);
		xLabel.setAttribute('fill', '#000');
		
		coordFld.appendChild(xLabel);
		
		// Draw y axis label
		var yLabel = document.createElementNS(NS, 'text');
		yLabel.setAttribute('id', 'yLabel');
		yLabel.textContent = yAxisLabel;
		var labelHeight = 56;
		var labelWidth  = 100;
		
		yLabel.setAttribute('fill', '#000');

		coordFld.appendChild(yLabel);
		
		return coordFld;
	}
	
	var makeLineDragHandle = function() {
		var handle = document.createElementNS(NS, 'rect');
		handle.setAttribute('id', 'lineDragHandle');
		handle.setAttribute('x', yAxisLeftPadding - Math.round(lineDragHandleWidth / 2));
		handle.setAttribute('y', currPixelCoordIntercept - Math.round(lineDragHandleHeight / 2.0));
		handle.setAttribute('width', lineDragHandleWidth);
		handle.setAttribute('height', lineDragHandleHeight);
		handle.setAttribute('fill', lineDragHandleRestColor);
		handle.setAttribute('stroke', 'black');
		
		// Cause cursor to change when hovering over handle:
		//****handle.setAttribute('class', 'draggable');
		
		return handle;
	}
	
	var makeArrow = function(x1, y1, x2, y2, strokeWidth, strokeOpacity) {
		if (strokeWidth === undefined || strokeWidth === null) {
			strokeWidth = arrowDefaultWidth;
		}
		if (strokeOpacity === undefined || strokeOpacity=== null) {
			strokeOpacity = 1;
		}
		
		var arrow = document.createElementNS(NS, 'line');
		arrow.x1.baseVal.value = x1;
		arrow.y1.baseVal.value = y1;
		arrow.x2.baseVal.value = x2;
		arrow.y2.baseVal.value = y2;
		arrow.setAttribute('stroke', arrowDefaultColor);
		arrow.setAttribute('stroke-width', strokeWidth);
		arrow.setAttribute('stroke-opacity', axisStrokeOpacity);
		setArrowheadOpacity(strokeOpacity);
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
	    path.setAttribute('id', 'arrowHeadPath');
	    marker.appendChild(path);
	    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');

   	    arrowHead.appendChild(defs);
	    defs.appendChild(marker);
	    
	    return arrowHead; 
	}
	
	var setArrowheadOpacity = function(opacity) {
		arrHeadPath = document.getElementById('arrowHeadPath')
	    arrHeadPath.setAttribute('opacity', opacity);

	}
}

regSim = new RegressionSim();
regSim.setup();

document.getElementById('lineDragHandle').addEventListener('mousedown', regSim.lineMoveHandleMouseDown);
document.getElementById('lineDragHandle').addEventListener('mousemove', regSim.lineMoveHandleMove);
document.getElementById('lineDragHandle').addEventListener('mouseup'  , regSim.lineMoveHandleMouseUp);

