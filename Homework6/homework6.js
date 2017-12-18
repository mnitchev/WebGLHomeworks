var STEP = 0.1;
var CIRCLE_RADIUS = 0.5;
var MAX_ANGLE = 360;
var ANGLE_STEP = 2;

var RED = [1, 0, 0];
var ORANGE = [0.8, 0.35, 0];
var GREEN = [0, 1, 0];
var LIME = [0.74, 1, 0];
var YELLOW = [1, 1, 0];
var CYAN = [0, 1, 1];
var BLUE = [0, 0, 1];
var MAGENTA = [0.5, 0, 0.5];
var PURPLE = [0.47, 0.31, 0.66];

var GRADIENT_COLORS = [RED, ORANGE, YELLOW, GREEN, CYAN, BLUE, PURPLE, MAGENTA];

class FunctionGeneratedTorus {

    constructor({
        center = [0, 0, 0],
        size = 1
    } = {}, {
        generatingFunction = (number) => ({
            x: number,
            y: number,
            z: number
        }),
        numberOfPoints = 100,
        stepSize = 1
    } = {}) {
        this.center = center;
        this.size = size;
        this.functionMetadata = {
            generatingFunction: generatingFunction,
            numberOfPoints: numberOfPoints,
            stepSize: stepSize
        };
        this.generatingFunction = generatingFunction;
        var gradientSize = Math.ceil((numberOfPoints / stepSize) / GRADIENT_COLORS.length);
        this.colorGradient = new ColorGradient(GRADIENT_COLORS, gradientSize);
        this.strips = this.createStrips();
    }

    createStrips() {
        var strips = [];
        var previousColor = this.colorGradient.nextColor();

        integerRange({
            upperBoundExclusive: this.functionMetadata.numberOfPoints - 1,
            step: this.functionMetadata.stepSize
        }).forEach(angle => {
            var nextColor = this.colorGradient.nextColor();
            var firstPoint = this.functionMetadata.generatingFunction(angle, this.size);
            var secondPoint = this.functionMetadata.generatingFunction(angle + ANGLE_STEP, this.size);
            strips.push(new Tube(firstPoint, secondPoint, previousColor, nextColor, this.center));
            previousColor = nextColor;
        })

        return strips;
    }

    draw() {
        this.strips.forEach(strip => strip.draw());
    }

}

class Tube {
    constructor(firstPoint, secondPoint, firstColor, secondColor, translationVector){
        this.firstPoint = firstPoint;
        this.secondPoint = secondPoint;
        this.firstColor = firstColor;
        this.secondColor = secondColor;
        this.translationVector = translationVector;
        this.buffer = this.generateBufferData();
    }

    generateBufferData(){
        var tubeNormalVector = vectorPoints([this.secondPoint.x, this.secondPoint.y, this.secondPoint.z], 
                    [this.firstPoint.x, this.firstPoint.y, this.firstPoint.z]);
        var planeVectors = getPlanePerpendicularVectors(tubeNormalVector);
        var firstCircleData = generateCirclePoints(this.firstPoint, planeVectors.firstVector, planeVectors.secondVector);
        var secondCircleData = generateCirclePoints(this.secondPoint, planeVectors.firstVector, planeVectors.secondVector);
        
        var data = this.createData(firstCircleData, secondCircleData);
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

        return buffer;
    }

    createData(firstCircleData, secondCircleData){
        var data = [];
        for(var i = 0; i < firstCircleData.length - 1; i++){
            var a = firstCircleData[i];
            var b = secondCircleData[i];
            var c = firstCircleData[i + 1];
            var d = secondCircleData[i + 1];
            
            this.pushWall(a, b, c, d, data);
        }
        this.pushWall(firstCircleData[firstCircleData.length - 1], secondCircleData[secondCircleData.length - 1],
            firstCircleData[0], secondCircleData[0], data)

        return data;
    }

    pushWall(a, b, c, d, data){
        var normalVector = generateNormalVector(b, a, c);
        data.push(a.x, a.y, a.z);
        data.push(normalVector[0], normalVector[1], normalVector[2]);
        data.push(this.firstColor.red, this.firstColor.green, this.firstColor.blue);

        data.push(b.x, b.y, b.z);
        data.push(normalVector[0], normalVector[1], normalVector[2]);
        data.push(this.secondColor.red, this.secondColor.green, this.secondColor.blue);
        
        data.push(c.x, c.y, c.z);
        data.push(normalVector[0], normalVector[1], normalVector[2]);
        data.push(this.firstColor.red, this.firstColor.green, this.firstColor.blue);


        data.push(b.x, b.y, b.z);
        data.push(normalVector[0], normalVector[1], normalVector[2]);
        data.push(this.secondColor.red, this.secondColor.green, this.secondColor.blue);
        
        data.push(c.x, c.y, c.z);
        data.push(normalVector[0], normalVector[1], normalVector[2]);
        data.push(this.firstColor.red, this.firstColor.green, this.firstColor.blue);

        data.push(d.x, d.y, d.z);
        data.push(normalVector[0], normalVector[1], normalVector[2]);
        data.push(this.secondColor.red, this.secondColor.green, this.secondColor.blue);
    }

    draw(){
        pushMatrix();
        translate(this.translationVector);
        useMatrix();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        gl.enableVertexAttribArray(aXYZ);
        gl.vertexAttribPointer(aXYZ, 3, gl.FLOAT, false, 9 * FLOATS, 0 * FLOATS);

        gl.enableVertexAttribArray(aNormal);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 9 * FLOATS, 3 * FLOATS);

        gl.enableVertexAttribArray(aColor)
        gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 9 * FLOATS, 6 * FLOATS)

        var dataCount = 12 * (MAX_ANGLE / ANGLE_STEP) / 2;
        gl.drawArrays(gl.TRIANGLES, 0,  dataCount);

        popMatrix();
    }
}

class ColorGradient {

    constructor(gradientColors, gradientStripSize){
        this.gradientColors = gradientColors;
        this.gradientStripSize = gradientStripSize;
        this.colors = this.generateColors();
    }

    generateColors(){
        var colors = [];
        integerRange({
            upperBoundExclusive: this.gradientColors.length - 1
        }).forEach(index => {
            var firstColor = this.gradientColors[index];
            var secondColor = this.gradientColors[index + 1];
            var gradient = this.generateGradient(firstColor, secondColor, this.gradientStripSize);

            colors = colors.concat(gradient);
        });

        var firstColor = this.gradientColors[0];
        var lastColor = this.gradientColors[this.gradientColors.length - 1];
        var lastGradient = this.generateGradient(lastColor, firstColor, this.gradientStripSize);
        colors = colors.concat(lastGradient);

        return colors;
    }

    generateGradient(start, end, steps){
            var stepR = ((end[0] - start[0]) / (steps - 1));
            var stepG = ((end[1] - start[1]) / (steps - 1));
            var stepB = ((end[2] - start[2]) / (steps - 1));

            var colors = [];
            integerRange({
                upperBoundExclusive: steps
            }).forEach(i => {
                colors.push({
                    red: start[0] + (stepR * i),
                    green: start[1] + (stepG * i),
                    blue: start[2] + (stepB * i)
                });
            });
            return colors;
    }

    nextColor(){
        return this.colors.pop();
    }
}

function getPlanePerpendicularVectors(normalVector){
    normalVector = unitVector(normalVector);
    var firstVector = unitVector(getPerpendicularVector(normalVector));
    var secondVector = vectorProduct(firstVector, normalVector);
    return {
        firstVector: firstVector,
        secondVector: secondVector
    }
}

function getPerpendicularVector(vector){
    var x = vector[0];
    var y = vector[1];
    var z = vector[2];
    var scale = Math.abs(x) + Math.abs(y) + Math.abs(z);

    if (scale == 0){
        return [0, 0, 0];
    }
    x = vector[0] / scale;
    y = vector[1] / scale;
    z = vector[2] / scale;

    if (Math.abs(x) > Math.abs(y)){
        return [z, 0,-x];
    } else {
        return [0, z,-y];
    }
}

function generateCirclePoints(point, firstVector, secondVector) {
    var points = [];
    integerRange({ upperBoundExclusive: MAX_ANGLE,
         step: ANGLE_STEP
        }).forEach(rawAngle => {
            var angle = toRadians(rawAngle);
            var rSin = CIRCLE_RADIUS * Math.sin(angle);
            var rCos = CIRCLE_RADIUS * Math.cos(angle);
            points.push({
                x: point.x +  rCos * firstVector[0] + rSin * secondVector[0],
                y: point.y + rCos * firstVector[1] + rSin * secondVector[1],
                z: point.z + rCos * firstVector[2] + rSin * secondVector[2]
            });
        });
    return points;
}

function getTrefoilKnotTorusPoint(rawAngle, size) {
    var angle = toRadians(rawAngle);
    var x = Math.sin(angle) + 2 * Math.sin(2 * angle);
    var y = Math.cos(angle) - 2 * Math.cos(2 * angle);
    var z = -Math.sin(3 * angle)
    return {
        x: size * x,
        y: size * y,
        z: size * z
    }
}

function generateNormalVector(rawPoint1, rawPoint2, rawPoint3){
    var point1 = [rawPoint1.x, rawPoint1.y, rawPoint1.z];
    var point2 = [rawPoint2.x, rawPoint2.y, rawPoint2.z];
    var point3 = [rawPoint3.x, rawPoint3.y, rawPoint3.z];
    return vectorProduct(
            vectorPoints(point1, point2),
            vectorPoints(point3, point2));
}

function toRadians(angle){
    return angle * (Math.PI / 180)
}

function integerRange({
    upperBoundExclusive = 0,
    step =  1
} = {}) {
    var resultArray = [];
    for (var i = 0; i < upperBoundExclusive; i += step ){
        resultArray.push(i);
    }
    return resultArray;
}

function range({
    from = 0,
    to = 0
} = {}, callback) {
    for (var i = from; i < to; i++) {
        callback(i);
    }
}

function zip(first, second){
    return first.map((element, index) => [element, second[index]]);
}