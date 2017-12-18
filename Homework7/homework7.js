var BLACK = [0, 0, 0];
var GRAY = [0.5, 0.5, 0.5];
var LIGHT_GRAY = [0.8, 0.8, 0.8];
var BROWN = [0.13, 0, 0];

var MAX_ANGLE = 360;
var ANGLE_STEP = 2;
var CIRCLE_RADIUS = 0.1

const BALL_SIZE = 1;
const GRAVITY_SCALE = 10;
const GRAVITY_UNIT_VECTOR = [0, 0, -1];
const FRAMES = 160;
const GRAVITY_VECTOR = dotProduct(GRAVITY_SCALE / FRAMES, GRAVITY_UNIT_VECTOR);
const RADIUS = 10;
const TRANSMISION_LOSS = 0.0026;
const NONE = {}

const BASE_SIZE = 20;
const ROPE_SIZE = BASE_SIZE / 4;

const THRESHOLD = 0.0000015;

class NewtonBall {
    constructor(center, baseCenter){
        this.center = center;
        this.baseCenter = baseCenter;
        this.sphere = new Sphere(center, BALL_SIZE);
        this.direction = [0, 0, 0];
        this.balls = [];
        this.leftString = this.getString(-ROPE_SIZE);
        this.rightString = this.getString(ROPE_SIZE);
    }

    getString(offset){
        var stringBase = [this.baseCenter[0] + offset,
            this.baseCenter[1], this.baseCenter[2]];
        return new Rope(this.center, stringBase);
    }

    registerBall(ball){
        this.balls.push(ball);
    }

    draw() {
        this.updatePosition();
        this.sphere.draw();
        this.leftString.draw();
        this.rightString.draw();
    }

    updatePosition() {
        this.updateDirection();
        this.updateCenter();
    }

    updateDirection() {
        var intermediateDirection = GRAVITY_VECTOR;
        intermediateDirection = addVectors(this.direction, GRAVITY_VECTOR);

        var newPoint = movePoint(intermediateDirection, this.center);
        var newDistance = getDistanceBetween(newPoint, this.baseCenter);
        if(newDistance > RADIUS){
            var difference = newDistance - RADIUS;
            var correctedDir = unitVector(vectorPoints(this.baseCenter, newPoint));
            correctedDir = dotProduct(difference, correctedDir);
            intermediateDirection = addVectors(intermediateDirection, correctedDir);
            newPoint = movePoint(correctedDir, newPoint);
        }
        this.direction = intermediateDirection;
        this.center = newPoint;
        this.balls.forEach(ball => this.checkForCollision(ball));
        if (closeToZero(this.direction)) {
            this.direction = [0, 0, 0];
        }
    }

    checkForCollision(other){
        if(other != NONE){
            var distance = getDistanceBetween(this.center, other.center);
            if(distance < BALL_SIZE * 2){
                var difference = (BALL_SIZE * 2) - distance;
                var correctedDir = unitVector(vectorPoints(this.center, other.center));
                correctedDir = dotProduct(difference, correctedDir);
                this.center = movePoint(correctedDir, this.center);

                other.transmitEnergy(dotProduct(1 - TRANSMISION_LOSS, this.direction));
                this.direction = dotProduct(-TRANSMISION_LOSS, unitVector(this.direction));
            }
        }
    }

    transmitEnergy(newDirection){
        this.direction = addVectors(newDirection, this.direction);
    }

    updateCenter() {
        this.sphere.updatePosition(this.center);
        this.leftString = this.getString(-ROPE_SIZE);
        this.rightString = this.getString(ROPE_SIZE);
    }

}

class Rope {
    constructor(center, base) {
        this.center = center;
        this.base = base;
        this.buffer = this.generateCone();
    }

    generateCone() {
        var direction = vectorPoints(this.base, this.center);
        var planeVectors = getPlanePerpendicularVectors(direction);
        var circle = generateCirclePoints(this.center,
            planeVectors.firstVector,
            planeVectors.secondVector);
        var basePoint = { 
            x: this.base[0],
            y: this.base[1],
            z: this.base[2]
        }

        var data = [];
        range({
            from: 0,
            to: circle.length - 1
        }, (i) => {
            var point = circle[i];
            var nextPoint = circle[i + 1];
            var normalVector = generateNormalVector(point, basePoint, nextPoint);

            data.push(point.x, point.y, point.z);
            data.push(normalVector[0] ,normalVector[1], normalVector);

            data.push(basePoint.x, basePoint.y, basePoint.z);
            data.push(normalVector[0] ,normalVector[1], normalVector[2]);
            
            data.push(nextPoint.x, nextPoint.y, nextPoint.z);
            data.push(normalVector[0] ,normalVector[1], normalVector[2]);
        });

        var point = circle[circle.length - 1];
        var nextPoint = circle[0];
        var normalVector = generateNormalVector(point, basePoint, nextPoint);

        data.push(point.x, point.y, point.z);
        data.push(normalVector[0] ,normalVector[1], normalVector[2]);

        data.push(basePoint.x, basePoint.y, basePoint.z);
        data.push(normalVector[0] ,normalVector[1], normalVector[2]);
        
        data.push(nextPoint.x, nextPoint.y, nextPoint.z);
        data.push(normalVector[0] ,normalVector[1], normalVector[2]);

        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

        return buffer;
    }

    draw() {
        pushMatrix();
        gl.vertexAttrib3fv(aColor, BLACK);
        useMatrix();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        gl.enableVertexAttribArray(aXYZ);
        gl.vertexAttribPointer(aXYZ, 3, gl.FLOAT, false, 6 * FLOATS, 0 * FLOATS);

        gl.enableVertexAttribArray(aNormal);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 6 * FLOATS, 3 * FLOATS);

        var dataCount = 3 * (MAX_ANGLE / ANGLE_STEP);
        gl.drawArrays(gl.TRIANGLES, 0,  dataCount);

        popMatrix();
    }

}

function getDistanceBetween(first, second) {
    var x = Math.pow(Math.abs(first[0] - second[0]), 2);
    var y = Math.pow(Math.abs(first[1] - second[1]), 2);
    var z = Math.pow(Math.abs(first[2] - second[2]), 2);
    return Math.sqrt(x + y + z);
}

function movePoint(direction, point){
    return addVectors(direction, point);
}

function addVectors(first, second){
    return [first[0] + second[0],
            first[1] + second[1],
            first[2] + second[2]];
}

function dotProduct(scalar, vector) {
    return vector.map(element => element * scalar);
}

function getVectorSize(vector) {
    return Math.sqrt(Math.pow(vector[0], 2) +
        Math.pow(vector[1], 2) +
        Math.pow(vector[2], 2));
}

function closeToZero(vector) {
    return Math.abs(vector[0]) < THRESHOLD &&
        Math.abs(vector[1] < THRESHOLD) &&
        Math.abs(vector[2]) < THRESHOLD;
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

function generateNormalVector(rawPoint1, rawPoint2, rawPoint3){
    var point1 = [rawPoint1.x, rawPoint1.y, rawPoint1.z];
    var point2 = [rawPoint2.x, rawPoint2.y, rawPoint2.z];
    var point3 = [rawPoint3.x, rawPoint3.y, rawPoint3.z];
    return vectorProduct(
            vectorPoints(point1, point2),
            vectorPoints(point3, point2));
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
                x: point[0] +  rCos * firstVector[0] + rSin * secondVector[0],
                y: point[1] + rCos * firstVector[1] + rSin * secondVector[1],
                z: point[2] + rCos * firstVector[2] + rSin * secondVector[2]
            });
        });
    return points;
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