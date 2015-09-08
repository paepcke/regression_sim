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

	// Function line object:
	var line = null;
	var lineStrokeWidth = 4;
	
	var lineDragHandle;
	var lineDragHandleWidth      = gridSize;
	var lineDragHandleHeight     = gridSize;
	var lineDragHandleHalfHeight = Math.round(lineDragHandleHeight / 2.0);
	var lineDragHandleRestColor  = 'yellow';
	var lineDragHandleMoveColor  = 'green';
	var lineDragHandleState = {'x' : 0, 'y' : 0, 'dragging' : false};
	
	var rotateHandle;
	var rotateHandleWidth      = gridSize;
	var rotateHandleHeight     = gridSize;
	var rotateHandleHalfWidth  = Math.round(rotateHandleWidth/ 2.0);
	var rotateHandleHalfHeight = Math.round(rotateHandleHeight/ 2.0);
	var rotateHandleRestColor  = 'yellow';
	var rotateHandleMoveColor  = 'green';
	var rotateHandleState = {'x' : 0, 'y' : 0, 'dragging' : false};

	
	// Array of objs: {'x' : <val>, 'y' : <val>, 'id' : <val>}:
	var dataPtSpecArr = [];
	// Array of SVG data point objects:
	var dataPtObjArr  = [];
	var dataPtRadius  = 10; // pixels
	var dataPtFill    = 'darkblue';
	var dataPtStroke  = 'yellow';
	
	var errLineStrokeWidth = 2;
	// Horizontal space between error line and its numeric value text:
	var errMagPadding = 4
	
	// Error quantities: mean absolute error, mean square error,
	// and root mean square error:
	var MEA;
	var MSE;
	var RMSE;
	
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
		
	
		// Draw the datapoints so that their error
		// lines are below the function line, which we
		// will draw below:
		dataPtSpecArr = [{'x' : 4, 'y' : 13, 'id' : 'pt1'},
		                 {'x' : 8, 'y' : 9, 'id' : 'pt2'},
		                 {'x' : 15, 'y' : 12, 'id' : 'pt3'},
		                 ];
		placeDataPoints(dataPtSpecArr);
		
		// Draw the initial function line:
		line = drawFuncLine(currCoordSlope, currCoordIntercept);
		adjustErrorLines(currCoordSlope, currCoordIntercept);
		svgArea.appendChild(line);
		
		// Draw line drag handle:
		lineDragHandle = makeLineDragHandle();
		svgArea.appendChild(lineDragHandle);
		lineDragHandleState.x = lineDragHandle.x.baseVal.value;
		lineDragHandleState.y = lineDragHandle.y.baseVal.value;
		
		rotateHandle = makeRotateHandle();
		svgArea.appendChild(rotateHandle);
		rotateHandleState.x = rotateHandle.x.baseVal.value;
		rotateHandleState.y = rotateHandle.y.baseVal.value;
		
		adjustErrFomulas();
	}
	
	this.lineMoveHandleMouseDown = function(evt) {
		evt.preventDefault();
		evt.target.style.cursor = 'move';
		lineDragHandleState.dragging = true;
		lineDragHandleState.x = evt.clientX;
		lineDragHandleState.y = evt.clientY;
		evt.target.setAttribute('fill', lineDragHandleMoveColor);
		document.getElementById('svgArea').addEventListener('mousemove', regSim.lineMoveHandleMove);
		document.getElementById('svgArea').addEventListener('mouseup', regSim.lineMoveHandleMouseUp);
	}
		
	this.lineMoveHandleMove = function(evt) {
		evt.preventDefault();
		if (lineDragHandleState.dragging) {
			// Diff between mouse and upper edge of line drag handle:
			var dY = evt.clientY - lineDragHandle.y.baseVal.value;
			// Want mouse right in middle of handle:
			dY -= lineDragHandleHalfHeight;
			var newY= lineDragHandle.y.baseVal.value + dY;
			if ((newY > yAxisHeight - lineDragHandleHalfHeight) ||
				(newY < lineDragHandleHeight)) {
				// Don't allow handle below x axis or into y-axis arrow head:
				return;
			}
			lineDragHandle.y.baseVal.value = newY;
			lineDragHandleState.y = newY;
			currPixelCoordIntercept = newY;
			currCoordIntercept      = pixels2Intercept(newY);
			
			newXY = moveRotateHandle(0, -dY);
			drawFuncLineGivenPixelDims(currPixelCoordSlope, newY);
			adjustErrorLines(currPixelCoordSlope, currPixelCoordIntercept);
			adjustErrFomulas();
		}
	}
	
	this.lineMoveHandleMouseUp = function(evt) {
		evt.target.style.cursor = 'default';
		lineDragHandleState.dragging = false;
		lineDragHandleState.x = evt.clientX;
		lineDragHandleState.y = evt.clientY;
		lineDragHandle.setAttribute('fill', lineDragHandleRestColor);
		document.getElementById('svgArea').removeEventListener('mousemove', regSim.lineMoveHandleMove);
		document.getElementById('svgArea').removeEventListener('mouseup', regSim.lineMoveHandleMouseUp);
	}

	this.rotateHandleMouseDown = function(evt) {
		evt.preventDefault();
		evt.target.style.cursor = 'move';
		rotateHandleState.dragging = true;
		rotateHandleState.x = evt.clientX;
		rotateHandleState.y = evt.clientY;
		evt.target.setAttribute('fill', rotateHandleMoveColor);
		document.getElementById('svgArea').addEventListener('mousemove', regSim.rotateHandleMove);
		document.getElementById('svgArea').addEventListener('mouseup', regSim.rotateHandleMouseUp);
	}
		
	this.rotateHandleMove = function(evt) {
		evt.preventDefault();
		if (rotateHandleState.dragging) {
			
			// Diff between mouse and upper edge of rotation drag handle:
			var dXUpperLeft = rotateHandleState.x + evt.clientX;

			// Diff between mouse and left edge of rotation drag handle:
			var dYUpperLeft = rotateHandleState.y - evt.clientY;
			
			var newXY = moveRotateHandle(dXUpperLeft, dYUpperLeft);
			var newPixelLeftEdge  = newXY.x;
			var newPixelUpperEdge = newXY.y;

			// Remember mouse position for next call into this move method:
			rotateHandleState.x = evt.clientX;
			rotateHandleState.y = evt.clientY;
	
			var newSlope = computeSlopeFromRotateHandle(newPixelLeftEdge, newPixelUpperEdge);
			
			// Update our ready-at-hand values of coord and pixel slopes:
			var newPixelSlope = slope2Pixels(newSlope);
			currPixelCoordSlope = newPixelSlope;
			currCoordSlope      = newSlope;
			
			drawFuncLineGivenPixelDims(newPixelSlope, currPixelCoordIntercept);
			adjustErrorLines(currPixelCoordSlope, currPixelCoordIntercept);
			adjustErrFomulas();
		}
	}
	
	var moveRotateHandle = function(dx, dy) {

		// Candidate new pos of handle's left edge:
			var newPixelLeftEdge = rotateHandle.x.baseVal.value + dx;
			// But don't let handle go more than half into y-axis on left:
			newPixelLeftEdge = Math.max(newPixelLeftEdge, yAxisLeftPadding + rotateHandleHalfWidth);
			// ... nor with any of its body beyond the end of the x axis:
			newPixelLeftEdge = Math.min(newPixelLeftEdge, xAxisWidth - rotateHandleHalfWidth);

			// Candidate new pos of handle's upper edge (subtract b/c y grows down):
			var newPixelUpperEdge = rotateHandle.y.baseVal.value - dy;
			// Don't move the handle below the x axis; just allow middle of
			// handle to be on the x-axis:
			newPixelUpperEdge = Math.min(newPixelUpperEdge, (yAxisHeight - rotateHandleHalfHeight)); 
			// Don't allow part of the handle to move above the coord sys either:
			newPixelUpperEdge = Math.max(newPixelUpperEdge, 0);
			
			
			
			// Move the rotate handle:
			rotateHandle.x.baseVal.value = newPixelLeftEdge;
			rotateHandle.y.baseVal.value = newPixelUpperEdge;
			
			return {'x' : newPixelLeftEdge, 'y' : newPixelUpperEdge};
	}
	
	var computeSlopeFromRotateHandle = function(newPixelLeftEdge, newPixelUpperEdge) {
		/**
		 * Given x (left edge) and y (top edge) of rotate handle
		 * position, return the *coordinate* slope.
		 */
			// Prepare to move the line's end point to land in center
			// of new handle position; get (user coordinates) of that 
			// center point:
			var rotHandleCoordPt = pixelsPt2Coord(newPixelLeftEdge  + rotateHandleHalfWidth, 
												  newPixelUpperEdge + rotateHandleHalfHeight);
			var newSlope = (rotHandleCoordPt.y - currCoordIntercept) / rotHandleCoordPt.x;
			return newSlope;
	}
	
	var computePixelSlopeFromLine = function() {
		return line.y.baseVal.value / line.x.baseVal.value;
	}
	
	this.rotateHandleMouseUp = function(evt) {
		evt.target.style.cursor = 'default';
		rotateHandleState.dragging = false;
		rotateHandle.setAttribute('fill', rotateHandleRestColor);
		document.getElementById('svgArea').removeEventListener('mousemove', regSim.lineMoveHandleMove);
		document.getElementById('svgArea').removeEventListener('mouseup', regSim.lineMoveHandleMouseUp);
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
    		pixelxMax = xAxisWidth;
    	} else {
    		// Add one gridSize, b/c the y-axis is shifted
    		// right by one grid width to make room for the
    		// y-axis label:
    		pixelxMax = gridSize + gridSize * xMax;
    	}
    	
    	pixelIntercept = intercept2Pixels(intercept);
    	pixelSlope     = slope2Pixels(slope);
    	return drawFuncLineGivenPixelDims(pixelSlope, pixelIntercept, pixelxMax);
    }
    
    var drawFuncLineGivenPixelDims = function(pixelSlope, pixelIntercept, pixelxMax) {

    	if (pixelxMax === undefined) {
    		pixelxMax = xAxisWidth;
    	}
    	
    	if (line === null) {
    		line = document.createElementNS(NS, 'line');
    	}
    	
    	// Ensure that right most line point isn't 
    	// lower than x-axis:
    	var y2 = Math.min(pixelSlope * pixelxMax + pixelIntercept, yAxisHeight);
    	// If endpoint-y gets stopped at zero, must also update x:
    	if (y2 === yAxisHeight) {
    		pixelxMax = ((y2 - pixelIntercept)/pixelSlope);
    	}
    	
    	line.setAttribute('stroke', 'black');
    	line.setAttribute('stroke-width', lineStrokeWidth);
    	line.setAttribute('x1', yAxisLeftPadding);
    	line.setAttribute('y1', pixelIntercept);
    	line.setAttribute('x2', pixelxMax);
    	line.setAttribute('y2', y2);
    	
    	currCoordSlope      	= pixels2Slope(pixelSlope);
    	currPixelCoordSlope 	= pixelSlope;
    	currCoordIntercept      = pixels2Intercept(pixelIntercept);
    	currPixelCoordIntercept = pixelIntercept;
    	
    	return line;
    }

    var pixelsPt2Coord = function(pixelX, pixelY) {
    	/**
    	 * Given pixel values for a point, return an 
    	 * object where x = x-in-coord-system, and 
    	 * y = y-in-coord-system.
    	 */
    	var coordX = (pixelX - yAxisLeftPadding) / gridSize;
    	var coordY = (yAxisHeight - pixelY) / gridSize;
    	return {'x' : coordX, 'y' : coordY};
    }
    
    var coordPt2Pixels= function(coordX, coordY) {
    	/**
    	 * Given coordinate system values for a point, return an 
    	 * object where x = x-in-pixels, and 
    	 * y = y-in-pixels.
    	 */
    	// The following min/max guard against 
    	// points being outside the visible range:
    	var pixelsX = Math.min(coordX * gridSize + yAxisLeftPadding, xAxisWidth);
    	var pixelsY = Math.max(yAxisHeight - (coordY * gridSize), 0);
    	// Keep points about the x axis:
    	if (pixelsY > yAxisHeight) {
    		pixelsY = yAxisHeight;
    	}
    	
    	return {'x' : pixelsX, 'y' : pixelsY};
    }
    
    var intercept2Pixels = function(intercept) {
    	return yAxisHeight - (gridSize * intercept);
    }
    
    var pixels2Intercept = function(pixelIntercept) {
    	return Math.round((yAxisHeight - pixelIntercept) / gridSize);
    }
    
    var slope2Pixels = function(slope) {
    	return - slope;
    }
    
    var pixels2Slope = function(pixelSlope) {
    	return - pixelSlope;
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
		return handle;
	}

	var makeRotateHandle = function() {
		var handle = document.createElementNS(NS, 'rect');
		handle.setAttribute('id', 'rotateHandle');
		
		var handlePos = computeRotHandlePixelCoords();
		handle.setAttribute('x', handlePos.x - Math.round(rotateHandleWidth / 2));
		handle.setAttribute('y', handlePos.y - Math.round(lineDragHandleHeight / 2.0));
		handle.setAttribute('width',  rotateHandleWidth);
		handle.setAttribute('height', rotateHandleHeight);
		handle.setAttribute('fill',   rotateHandleRestColor);
		handle.setAttribute('stroke', 'black');
		return handle;
	}
	
	var placeDataPoints = function(ptCoordArray) {
		/**
		 * Given an array of {'x' : <num>, 'y' : <num> 'id' : <id>},
		 * draw those points if they don't exist, or move them
		 * if they do exist. Units are user level coord system.
		 */
		var errLine;
		var ptCircle;
		var errMagTxt;
		var arrLen = ptCoordArray.length;
		for (var i=0; i<arrLen;  i++) {
			
			var ptSpec = ptCoordArray[i];
			// Does datapoint already exist?:
			var ptErrLineGrp = document.getElementById(ptSpec.id);
			if (ptErrLineGrp === null) {
				// No: create the point/errLine group:
				var ptErrLineGrp = document.createElementNS(NS, 'g');
				ptErrLineGrp.setAttribute('id', ptSpec.id);
				
				// Make the circle of the data point:
				ptCircle =  document.createElementNS(NS, 'circle');
				
				// Create an error line to go with the point:
				errLine = document.createElementNS(NS, 'line');
				errLine.setAttribute('stroke', 'red');
				errLine.setAttribute('stroke-width', 3);
				
				// Make an error number text element for the
				// data point. Its position will be set later in
				// this method:
				errMagTxt = document.createElementNS(NS, 'text');
				errMagTxt.setAttribute('fill', 'red');
				errMagTxt.textContent = '000';				

				// Add circle and error line to the group,
				// putting the err line first to be under
				// the circle:
				
				ptErrLineGrp.appendChild(errLine);
				ptErrLineGrp.appendChild(errMagTxt);
				ptErrLineGrp.appendChild(ptCircle);
				
				// Show the point:
				svgArea.appendChild(ptErrLineGrp);
				dataPtObjArr.push(ptErrLineGrp);
			}
			
			// Style and position the circle:
			ptCircle = ptObjCircle(ptErrLineGrp);
			var pixelPt = coordPt2Pixels(ptSpec.x, ptSpec.y);
			ptCircle.setAttribute('cx', pixelPt.x);
			ptCircle.setAttribute('cy', pixelPt.y);
			ptCircle.setAttribute('r', dataPtRadius);
			ptCircle.setAttribute('fill', dataPtFill);
			ptCircle.setAttribute('stroke', dataPtStroke);
			
			// Style and position the error line:
			errLine = ptObjErrLine(ptErrLineGrp);
			errLine.x1.baseVal.value = ptCircle.cx.baseVal.value;
			errLine.y1.baseVal.value = ptCircle.cy.baseVal.value;
			errLine.x2.baseVal.value = ptCircle.cx.baseVal.value;
			errLine.y2.baseVal.value = ptCircle.cy.baseVal.value; // end pt on top of start pt.
			errLine.style.color = 'red';
			errLine.style.strokeWidth = errLineStrokeWidth;
			
			// Style and position the error magnitude text element
			// to the left of the error line:
			errMagTxt    = ptObjMagTxt(ptErrLineGrp);
			// Length of err line:
			var magnitude    = errLine.y2.baseVal.value - errLine.y1.baseVal.value;
			// String version of magnitude with one decimal point:
			var magnitudeStr = magnitude.toFixed(1).toString();
			var magStrPixelWidth = pixelsInEm(errMagTxt) * magnitudeStr.length;
			errMagTxt.setAttribute('x', errLine.x1.baseVal.value - magStrPixelWidth - errMagPadding);
			// Want text half-way down the error line:
			var errMagStrYPos =  errLine.y1.baseVal.value + Math.round(magnitude / 2);
			errMagTxt.setAttribute('y', errMagStrYPos);
			errMagTxt.textContent = magnitude.toString();
			
		}
		if (currPixelCoordSlope !== undefined && currPixelCoordIntercept !== undefined) {
			adjustErrorLines(currPixelCoordSlope, currPixelCoordIntercept);
			adjustErrFomulas();			
		}
	}
	
	var adjustErrorLines = function(pixelSlope, pixelIntercept) {
		for (var i=0; i<dataPtObjArr.length; i++) {
			// Get one group: circle/errLine:
			var dataObj = dataPtObjArr[i];
			// Get the data point's circle, error line, 
			// and err magnitude txt element:
			var dataCircle = ptObjCircle(dataObj);
			var errLine    = ptObjErrLine(dataObj);
			var errMagTxt  = ptObjMagTxt(dataObj);
			
			var pixelX  = dataCircle.cx.baseVal.value;
			var pixelY  = dataCircle.cy.baseVal.value;
			var lineY   = solveEquation(pixelX);
			var errorLen = lineY - pixelY + Math.round(dataPtRadius / 2);
			
			// Set the error line length, taking account
			// of the line starting in the middle of the
			// data point circle, and ending in the middle
			// of the line:
			//****var correction = Math.round(lineStrokeWidth / 2) + Math.round(dataPtRadius/2); 
			//****var correction = Math.round(dataPtRadius/2);
			var correction = 0;
			errLine.setAttribute('y2', lineY + correction);
			
			// Convert the pixel error magnitude to 
			// coord sys:
			var errorLenCoord = (errorLen / gridSize).toFixed(1);
			// Set the error magnitude text:
			errMagTxt.textContent = errorLenCoord;
			// Set (or initially add) the error magnitude to
			// the point object group:
			dataObj.setAttribute('errMagnitude', errorLenCoord);
		}
	}
	
	var ptObjCircle = function(dataPtGrp) {
		return dataPtGrp.children[2];
	}
	
	var ptObjErrLine= function(dataPtGrp) {
		return dataPtGrp.children[0];
	}

	var ptObjMagTxt = function(dataPtGrp) {
		return dataPtGrp.children[1];
	}

	
	var solveEquation = function(pixelX) {
		return currPixelCoordSlope * pixelX + currPixelCoordIntercept;
	}
	
	var pixelsInEm = function(parentElement) {
		/**
		 * Given an optional parent element, return the width
		 * of one em in pixels. If parentElement is not provided,
		 * uses document.body.
		 */
		parentElement = parentElement || document.body;
		return Number(getComputedStyle(parentElement, "").fontSize.match(/(\d*(\.\d*)?)px/)[1]);		
	}
	
	var computeRotHandlePixelCoords = function() {
		/**
		 * Find the right-most visible point on the line.
		 */
		var x = Math.min(xAxisWidth, Math.round(-currPixelCoordIntercept / currPixelCoordSlope));
		var y = currPixelCoordSlope * x + currPixelCoordIntercept;
		return {'x' : x, 'y' : y};
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
	
	/*------------------------------- Error equation creation/updates ------------- */

	var adjustErrFomulas = function() {
		/**
		 * Gets the error residual magnitudes, and 
		 * updates the formulas.
		 */
		
		// Clear the whole display table:
		clearFormulas();
		
		// The estimator names:
		document.getElementById('maeNameCell').innerHTML  = 'mean absolute error (MEA)';
		document.getElementById('mseNameCell').innerHTML  = 'mean squared error (MSE)';
		document.getElementById('rmseNameCell').innerHTML = 'root mean squared error (RMSE)';

		// Equal signs between estimator name and the sum terms:
		document.getElementById('maeEqualsCell').innerHTML  = '=';
		document.getElementById('mseEqualsCell').innerHTML  = '=';
		document.getElementById('rmseEqualsCell').innerHTML = '=';
		
		var maeSumCell  = document.getElementById('maeSumCell'); 
		var mseSumCell  = document.getElementById('mseSumCell'); 
		var rmseSumCell = document.getElementById('rmseSumCell'); 
		
		rmseSumCell.innerHTML = '<span style="white-space: nowrap; font-size:larger">&radic;<span style="text-decoration:overline;">&nbsp;';
		
		// Accumulate the sum terms:
		var maeFormulaStr  = '';
		var mseFormulaStr  = '';
		var rmseFormulaStr = '';
		
		// Build the sum of terms part:
		var errorEstimators = computeErrorEstimators();
		for (var i=0; i<dataPtObjArr.length; i++) {
			dataPtObj = dataPtObjArr[i];
			nxtError = dataPtObj.getAttribute('errMagnitude');
			if (i != 0) {
				maeFormulaStr  += ' + ';
				mseFormulaStr  += ' + ';
				rmseFormulaStr += ' + ';
			}
			maeFormulaStr  += nxtError;
			mseFormulaStr  += nxtError + '<sup>2</sup>';
			rmseFormulaStr += nxtError + '<sup>2</sup>';
		}
		// Close the square root:
		rmseFormulaStr += '&nbsp;</span>';
		
		// Stick the sum terms into their table cells:
		maeSumCell.innerHTML  = maeFormulaStr;
		mseSumCell.innerHTML  = mseFormulaStr;
		rmseSumCell.innerHTML = rmseFormulaStr;
		
		// The right-side equal signs:
		document.getElementById('maeSumEqualsCell').innerHTML  = '=';
		document.getElementById('mseSumEqualsCell').innerHTML  = '=';
		document.getElementById('rmseSumEqualsCell').innerHTML = '=';

		// The final results:
		var estimators = computeErrorEstimators();
		document.getElementById('maeTotalSumCell').innerHTML  = estimators.mae;
		document.getElementById('mseTotalSumCell').innerHTML  = estimators.mse;
		document.getElementById('rmseTotalSumCell').innerHTML = estimators.rmse;
		
	}
	
	var clearFormulas = function() {
		/**
		 * Clears the formula display, ensuring that every cell in the
		 * display table is reset to an empty string.
		 */
		var table = document.getElementById('formulaTable');
		for (var rowNum=0; rowNum<table.children.length; rowNum++) {
			var row = table.children[rowNum];
			for (var cellNum=0; cellNum<row.children.length; cellNum++) {
				var cell = row.children.innerHTML = '';
			}
		}
	}
	
	/*------------------------------- Number Crunching ------------- */

	var computeErrorEstimators = function() {
		/**
		 * Goes through all the data points, expecting that
		 * they hold an attribute 'errMagnitude' with the error
		 * amount in coordinate system units. Populates class
		 * variables MAE, MSE, and RMSE.
		 * 
		 * In addition, returns an object with properties
		 * 'mae', 'mse', and 'rmse'.
		 */
		
		var errSum = 0.0;
		var errSquaredSum = 0.0;
		var nxtError;
		for (var i=0; i<dataPtObjArr.length; i++) {
			var dataPtObj = dataPtObjArr[i];
			nxtError = dataPtObj.getAttribute('errMagnitude');
			errSum += parseFloat(nxtError);
			errSquaredSum += Math.pow(parseFloat(nxtError),2.0);
		}
		var numDataPts = dataPtObjArr.length;
		var MAE  = (errSum/numDataPts).toFixed(1);
		// Don't fix MSE to 1 decimal pt until
		// it was used to compute the RMSE:
		var MSE  = errSquaredSum/numDataPts;
		var RMSE = Math.sqrt(MSE).toFixed(1);
		// Reduce MSE to one decimal point:
		var MSE  = MSE.toFixed(1);
		return({'mae' : MAE, 'mse' : MSE, 'rmse' : RMSE});
	}
}

regSim = new RegressionSim();
regSim.setup();

document.getElementById('lineDragHandle').addEventListener('mousedown', regSim.lineMoveHandleMouseDown);
document.getElementById('lineDragHandle').addEventListener('mouseup'  , regSim.lineMoveHandleMouseUp);
document.getElementById('rotateHandle').addEventListener('mousedown', regSim.rotateHandleMouseDown);
document.getElementById('rotateHandle').addEventListener('mouseup'  , regSim.rotateHandleMouseUp);

