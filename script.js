//function reference with arguments
function partial(func) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var allArguments = args.concat(Array.prototype.slice.call(arguments));
    return func.apply(this, allArguments);
  };
}

//Point class
var Point = function(x,y) {
    this.x = x;
    this.y = y;
}
Point.prototype.map = function() {
    return new Point(this.x * R2Animation.pointToPixel,  this.y * R2Animation.pointToPixel);
}

//Line Class
var Line = function(yInt, slope) {
    this.yInt = yInt;
    this.slope = slope;
}
Line.prototype.solve = function(x) {
    return (this.yInt + this.slope*x);
}
Line.prototype.solveMap = function(pixelX) {
    return this.solve(pixelX/R2Animation.pointToPixel)*R2Animation.pointToPixel;
}

//R2 Animation Class
var R2Animation = function(canvasId, pointToPixel) {
    R2Animation.pointToPixel = pointToPixel;
    
    this.canvas = document.getElementById(canvasId);
    
    this.context = this.canvas.getContext("2d");
    this.context.translate(0, this.canvas.height);
	this.context.scale(1, -1);
    this.canvas.addEventListener("click", partial(this.canvasClick, this));
    this.reset();
    
    this.angle = 0;
}

R2Animation.prototype.setButtonDisable = function(disabled) {
    var buttons = document.getElementById("buttons").children;
    for (var i = 0; i < buttons.length-1; i++) {
        buttons[i].disabled = disabled;
	}
    this.disabled = disabled;
}

R2Animation.prototype.reset = function() {
    this.context.clearRect(0,0,800,800);
    this.drawGrid();
    this.setButtonDisable(true);
    this.pointList = [];
}

R2Animation.prototype.drawGrid = function() {
    var numberOfRows = Math.floor(this.canvas.width / R2Animation.pointToPixel);
    this.context.strokeStyle = "#d3d3d3";
    for(var i = 0; i<numberOfRows; i++) {
        this.context.beginPath();
        this.context.moveTo(i*R2Animation.pointToPixel, 0);
        this.context.lineTo(i*R2Animation.pointToPixel, this.canvas.height);
        this.context.stroke();
        this.context.moveTo(0, i*R2Animation.pointToPixel)
        this.context.lineTo(this.canvas.width, i*R2Animation.pointToPixel);
        this.context.stroke();
    }
};

R2Animation.prototype.canvasClick = function(that, e) {
    var x = (e.pageX - this.offsetLeft)/R2Animation.pointToPixel;
  	var y = (800-(e.pageY - this.offsetTop))/R2Animation.pointToPixel;
	that.addPoint(new Point(x,y));
}

R2Animation.prototype.addDefaultLine = function() {
    for(var i = 1; i<40; i++) {
        this.addPoint(new Point(i,i));
    }
    this.addPoint(new Point(2,1));
}

R2Animation.prototype.drawPoint = function(a) {
    this.context.beginPath();
    this.context.arc(a.x, a.y, 0.175*R2Animation.pointToPixel, 0, 2*Math.PI, false);
    this.context.fillStyle = "#000000";
    this.context.fill();
}

R2Animation.prototype.drawAllPoints = function() {
    for(var i = 0; i < this.pointList.length; i++) {
        this.drawPoint(this.pointList[i].map());
    }
}

R2Animation.prototype.addPoint = function(a) {
    this.pointList.push(a);
    this.scatterPlot();
    this.drawPoint(a.map());
    this.drawPointBoxes();
    if(this.disabled) {
         this.setButtonDisable(false);
    }
}

R2Animation.prototype.drawPointBoxes = function() {
    var ul = document.getElementById("points");
    var innerhtml = "";
    for(var i = 0; i<this.pointList.length; i++) {
        innerhtml += "<li>x: <input id='x"+i+"' type='number' value='"+this.pointList[i].x+"' min='0' max='20'> y: <input type='number' id='y"+i+"' value='"+this.pointList[i].y+"' min='0' max='20'> <button onclick='r2anim.removePoint("+i+")'>Remove</button> <button onclick='r2anim.updatePoint("+i+")'>Update</button>";
    }
    ul.innerHTML = innerhtml;
}

R2Animation.prototype.removePoint = function(i) {
    this.pointList.splice(i, 1);
    var ul = document.getElementById("points")
    ul.removeChild(ul.childNodes[i]);
    this.drawPointBoxes();
    this.scatterPlot();
    if(this.pointList.length == 0) {
        this.setButtonDisable(true);
    }
}

R2Animation.prototype.updatePoint = function(i) {
    this.pointList[i].x = document.getElementById("x"+i).value;
    this.pointList[i].y = document.getElementById("y"+i).value;
    this.scatterPlot();
}

R2Animation.prototype.scatterPlot = function() {
    this.context.clearRect(0,0,800,800);
    this.drawGrid();
    this.drawAllPoints();
}

R2Animation.prototype.mean = function(list) {
    var countX = 0;
    var countY = 0;
    var len = list.length;
    
    for(var i = 0; i < len; i++) {
        countX += list[i].x;
        countY += list[i].y;
    }
	return new Point(countX/len, countY/len); 
}

R2Animation.prototype.standardDeviation = function(mean) {
    var len = this.pointList.length;
    
    var stdDev = new Point(0,0);
    for(var i = 0; i<len; i++) {
        stdDev.x += Math.pow(this.pointList[i].x-mean.x, 2);
        stdDev.y += Math.pow(this.pointList[i].y-mean.y, 2);
    }
    
    stdDev.x = Math.sqrt(stdDev.x / (len-1));
    stdDev.y = Math.sqrt(stdDev.y / (len-1));
    return stdDev;
}

R2Animation.prototype.zscores = function(stdDev, mean) {
    var zscoreList = [];
    
    for(var i =0; i < this.pointList.length; i++) {
        var x = (this.pointList[i].x - mean.x)/stdDev.x;
        var y = (this.pointList[i].y - mean.y)/stdDev.y;
    	zscoreList.push(new Point(x,y));    
    }
    return zscoreList;
}

R2Animation.prototype.r = function(zscoreList) {
    var len = zscoreList.length;
    var zscoreProductSum = 0;
    
    for(var i = 0; i < len; i++) {
        zscoreProductSum += (zscoreList[i].x * zscoreList[i].y);
    }
    var r = zscoreProductSum/(len-1);
    return r;
}

R2Animation.prototype.lineOfBestFit = function() {
    this.context.clearRect(0,0,800,800);
    this.drawGrid();
    this.drawAllPoints();
    var mean = this.mean(this.pointList);
    var standardDeviation = this.standardDeviation(mean);
    var zscoreList = this.zscores(standardDeviation, mean);
    var r = this.r(zscoreList);
    
    var slope = r * standardDeviation.y / standardDeviation.x;
    
    var yInt = mean.y - slope*mean.x;
    var line = new Line(yInt, slope);
    this.context.beginPath();
    this.context.moveTo(0,yInt*R2Animation.pointToPixel);
    this.context.lineTo(800, line.solveMap(800));
    this.context.strokeStyle = "#696969";
    this.context.stroke();    
    return line;
}

R2Animation.prototype.residual = function(line) {
     var residualList = [];
    for(var i = 0; i<this.pointList.length; i++) {
        var currentPoint = this.pointList[i];
        var residual = currentPoint.y - line.solve(currentPoint.x);
        residualList.push(new Point(currentPoint.x, residual));
    }
    return residualList;
    
}

R2Animation.prototype.residualLine = function() {
    r2anim.context.clearRect(0,0,800,800);
    r2anim.drawGrid();
    r2anim.drawAllPoints();
    var residual = r2anim.residual(r2anim.lineOfBestFit());
    
    for(var i = 0; i<residual.length; i++) {  
        var currentPoint = r2anim.pointList[i];
        r2anim.context.beginPath();
    	r2anim.context.moveTo(currentPoint.x*R2Animation.pointToPixel, currentPoint.y*R2Animation.pointToPixel);
    	r2anim.context.lineTo(currentPoint.x*R2Animation.pointToPixel, (currentPoint.y-residual[i].y)*R2Animation.pointToPixel);
    	r2anim.context.strokeStyle = "#00ff00";
    	r2anim.context.stroke();
    }
}

R2Animation.prototype.residualPlot = function() {
    var line = r2anim.lineOfBestFit();
    var residual = r2anim.residual(line);
    r2anim.context.clearRect(0,0,800,800);
    r2anim.drawGrid();
    
    r2anim.context.beginPath();
    r2anim.context.moveTo(0,400);
    r2anim.context.strokeStyle = "#000000";
    r2anim.context.lineTo(800,400);
    r2anim.context.stroke();
    
    for(var i = 0; i < residual.length; i++) {
        var newPoint = residual[i].map();
        newPoint.y += 400;
        r2anim.drawPoint(newPoint);
        r2anim.context.beginPath();
        r2anim.context.moveTo(newPoint.x, newPoint.y);
        r2anim.context.lineTo(newPoint.x, 400);
        r2anim.context.strokeStyle = "#00ff00";
        r2anim.context.stroke();
    }
}

R2Animation.prototype.animate = function() {
    r2anim.setButtonDisable(true);
    r2anim.canvas.setAttribute("style", "pointer-events: none;");
    setTimeout(partial(r2anim.histogram, false), 2500);
    setTimeout(r2anim.residualLine, 5000);
    setTimeout(r2anim.residualPlot, 7500);
    setTimeout(function() {
    	r2anim.interval = setInterval(r2anim.rotate, 1000/60);
    }, 10000);
    
    setTimeout(function() {
    	r2anim.setButtonDisable(false);
        r2anim.canvas.setAttribute("style", "pointer-events: all;");
    }, 12500);
    r2anim.lineOfBestFit();
}

R2Animation.prototype.rotate = function() {
    if(r2anim.angle == 90) {
        r2anim.residualPlot();
		setTimeout(function() {
            r2anim.context.clearRect(0,0,800,800);
            r2anim.context.translate(400, 400);
        	r2anim.context.rotate(Math.PI/2*3);
        	r2anim.context.translate(-400,-400);
            r2anim.angle = 0;
            r2anim.histogram(true);
            setTimeout(r2anim.histogramComparison, 2500);
        }, 750);
        clearInterval(r2anim.interval);
        return;
    }
    r2anim.context.clearRect(0, 0, 800, 800);
    r2anim.context.translate(400, 400);
    r2anim.context.rotate(Math.PI/180);
    r2anim.context.translate(-400,-400);
    r2anim.angle++;
    r2anim.residualPlot();
}

R2Animation.prototype.histogram = function(residual) {
    var list;
    if(residual) {
        list = r2anim.residual(r2anim.lineOfBestFit());
    }
    else {
        list = r2anim.pointList;
    }
    
    var valueList = [];
    for(var i = 0; i<list.length; i++) {
       valueList.push(list[i].y);
    }
    valueList.sort(function(a,b) {
        return a-b;
    });
   
    var binWidth = parseInt(document.getElementById("binNumber").value);
    var binNumber = Math.ceil((valueList[valueList.length-1] - valueList[0])/binWidth);
    if(binNumber == 0) binNumber = 1;
    console.log(binWidth);
    console.log(binNumber);
    var bins = [];
   	for(var i = 0; i<binNumber+1; i++) {
    	bins[i] = valueList[0] + i*binWidth;
    }
        console.log(bins);
    
    var count = [];
    
    for(var i = 0; i<valueList.length; i++) {
        for(var j = 0; j<bins.length-1; j++) {
            if((valueList[i] >= bins[j]) && (valueList[i] < bins[j+1])) {
                if(count[j] === undefined) {
                    count[j] = 1;
                }
                else {
                    count[j]++;
                }    
            }
        }
    }
    
    console.log(count);
    
    r2anim.context.clearRect(0,0,800,800);
    r2anim.drawGrid();
    
    if(residual) {
        r2anim.context.beginPath();
        r2anim.context.strokeStyle = "#000000";
        r2anim.context.moveTo(400,0);
        r2anim.context.lineTo(400,800);
        r2anim.context.stroke();
    }
    
    for(var i = 0; i < bins.length; i++) {
        r2anim.context.beginPath();
        r2anim.context.fillStyle = "#000000";
        if(residual) {
            r2anim.context.fillRect(((bins[0]+binWidth*i)*R2Animation.pointToPixel)+400, 0, binWidth*R2Animation.pointToPixel,  count[i]*R2Animation.pointToPixel);
		r2anim.context.clearRect(((bins[0]+binWidth*i)*R2Animation.pointToPixel)+1+400, 1, binWidth*R2Animation.pointToPixel-2,  count[i]*R2Animation.pointToPixel-2);
        }
        else {
            r2anim.context.fillRect((bins[0]+binWidth*i)*R2Animation.pointToPixel, 0, binWidth*R2Animation.pointToPixel,  count[i]*R2Animation.pointToPixel);
			r2anim.context.clearRect((bins[0]+binWidth*i)*R2Animation.pointToPixel+1, 1, binWidth*R2Animation.pointToPixel-2,  count[i]*R2Animation.pointToPixel-2);
        }
    }
    
    return { bins: bins, count: count, binWidth: binWidth }
}

R2Animation.prototype.histogramComparison = function() {
    var histogram = r2anim.histogram(false);
    var residualHistogram = r2anim.histogram(true);
    r2anim.context.clearRect(0,0,800,800);
    r2anim.drawGrid();
    r2anim.context.beginPath();
    r2anim.context.moveTo(0,400);
    r2anim.context.strokeStyle = "#000000";
    r2anim.context.lineTo(800,400);
    r2anim.context.stroke();
    for(var i = 0; i < histogram.bins.length; i++) {     r2anim.context.fillRect((histogram.bins[0]+histogram.binWidth*i)*R2Animation.pointToPixel, 400, histogram.binWidth*R2Animation.pointToPixel,  histogram.count[i]*R2Animation.pointToPixel);
        r2anim.context.clearRect((histogram.bins[0]+histogram.binWidth*i)*R2Animation.pointToPixel+1, 401, histogram.binWidth*R2Animation.pointToPixel-2,  histogram.count[i]*R2Animation.pointToPixel-2);
	}
    for(var i = 0; i < residualHistogram.bins.length; i++) {
        r2anim.context.fillRect(((residualHistogram.bins[0]+residualHistogram.binWidth*i)*R2Animation.pointToPixel)+400, 400-residualHistogram.count[i]*R2Animation.pointToPixel, residualHistogram.binWidth*R2Animation.pointToPixel,  residualHistogram.count[i]*R2Animation.pointToPixel);
    	r2anim.context.clearRect(((residualHistogram.bins[0]+residualHistogram.binWidth*i)*R2Animation.pointToPixel)+1+400, 401-residualHistogram.count[i]*R2Animation.pointToPixel, residualHistogram.binWidth*R2Animation.pointToPixel-2,  residualHistogram.count[i]*R2Animation.pointToPixel-2);
	}
    console.log("called");
}

var r2anim = new R2Animation("r2anim", 20);