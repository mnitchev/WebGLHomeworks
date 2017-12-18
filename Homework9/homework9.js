var MAX_VERTICES = 8; // Да не се опитва повече от 10. Това чупи браузъра.
var MAX_HEIGHTS = [0, 1, 2, 4, 8, 16, 32, 64, 100, 150, 250];
var MAX_HEIGHT = MAX_HEIGHTS[MAX_VERTICES];
var MIN_HEIGHT = -50;
var ROUGHNESS = 0.5;
var RADIUS = 40;
var DIVE_OFFSET = 5;

var BLACK = [0.1, 0.1, 0.1];
var WHITE = [1, 1, 1];
var GREEN = [0, 1, 0];
var YELLOW = [1, 1, 0];

class Bay {
    constructor() {
        this.size = Math.pow(2, MAX_VERTICES) + 1;
        this.max = this.size - 1;
        this.highest = new Point(0, 0, 0);
        this.colors = new ColorGradient();
        this.generateBayVertices();
        this.buffer = this.generateBufferData();
    }

    generateBayVertices() {
        this.heightMap = new Float32Array(this.size * this.size).fill({
            x: 0,
            y: 0,
            z: 0
        });

        this.set(0, 0, 0);
        this.set(this.max, 0, this.max / 5);
        this.set(this.max, this.max, 2);
        this.set(0, this.max, this.max / 2);

        this.divide(this.max);
    }

    generateBufferData() {
        var data = [];
        range(this.size - 1).forEach(x => {
            range(this.size - 1).forEach(y => {
                if (x == 0) {
                    var point1 = new Point(x, y, MIN_HEIGHT);
                    var point2 = new Point(x, y, this.get(x, y));
                    var point3 = new Point(x, y + 1, MIN_HEIGHT);
                    var point4 = new Point(x, y + 1, this.get(x, y + 1));

                    this.generateWallData(data, point1, point2, point3, point4, true);
                }

                if (x == this.size - 2) {
                    var point1 = new Point(x + 1, y, MIN_HEIGHT);
                    var point2 = new Point(x + 1, y, this.get(x + 1, y));
                    var point3 = new Point(x + 1, y + 1, MIN_HEIGHT);
                    var point4 = new Point(x + 1, y + 1, this.get(x + 1, y + 1));

                    this.generateWallData(data, point1, point2, point3, point4, true);
                }

                if (y == 0) {
                    var point1 = new Point(x, y, MIN_HEIGHT);
                    var point2 = new Point(x, y, this.get(x, y));
                    var point3 = new Point(x + 1, y, MIN_HEIGHT);
                    var point4 = new Point(x + 1, y, this.get(x + 1, y));

                    this.generateWallData(data, point1, point2, point3, point4, true);
                }

                if (y == this.size - 2) {
                    var point1 = new Point(x, y + 1, MIN_HEIGHT);
                    var point2 = new Point(x, y + 1, this.get(x, y + 1));
                    var point3 = new Point(x + 1, y + 1, MIN_HEIGHT);
                    var point4 = new Point(x + 1, y + 1, this.get(x + 1, y + 1));

                    this.generateWallData(data, point1, point2, point3, point4, true);
                }

                var point1 = new Point(x, y, this.get(x, y));
                var point2 = new Point(x + 1, y, this.get(x + 1, y));
                var point3 = new Point(x, y + 1, this.get(x, y + 1));
                var point4 = new Point(x + 1, y + 1, this.get(x + 1, y + 1));

                this.generateWallData(data, point1, point2, point3, point4, false);
            });
        });

        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

        return buffer;
    }

    generateWallData(data, point1, point2, point3, point4, isEdgeWall) {
        var average = Math.ceil(this.average([point1.z, point2.z, point3.z, point4.z]));
        if (average < 0) {
            average = 0;
        }
        if (isEdgeWall) {
            var color = {
                red: BLACK[0],
                green: BLACK[1],
                blue: BLACK[2]
            }
        } else {
            var color = this.colors.get(average);
        }
        var normalVector = generateNormalVector(point1, point3, point2);

        data.push(point1.x, point1.y, point1.z);
        data.push(normalVector.x, normalVector.y, normalVector.z);
        data.push(color.red, color.green, color.blue);

        data.push(point2.x, point2.y, point2.z);
        data.push(normalVector.x, normalVector.y, normalVector.z);
        data.push(color.red, color.green, color.blue);

        data.push(point4.x, point4.y, point4.z);
        data.push(normalVector.x, normalVector.y, normalVector.z);
        data.push(color.red, color.green, color.blue);

        normalVector = generateNormalVector(point1, point3, point4);
        data.push(point1.x, point1.y, point1.z);
        data.push(normalVector.x, normalVector.y, normalVector.z);
        data.push(color.red, color.green, color.blue);

        data.push(point3.x, point3.y, point3.z);
        data.push(normalVector.x, normalVector.y, normalVector.z);
        data.push(color.red, color.green, color.blue);

        data.push(point4.x, point4.y, point4.z);
        data.push(normalVector.x, normalVector.y, normalVector.z);
        data.push(color.red, color.green, color.blue);
    }


    get(x, y) {
        if (x < 0 || x > this.max || y < 0 || y > this.max) return -1;
        return this.heightMap[x + this.size * y];
    }

    set(x, y, val) {

        if (val > MAX_HEIGHT) {
            val = MAX_HEIGHT;
        }
        if (val < MIN_HEIGHT) {
            val = MIN_HEIGHT;
        }

        if (val >= this.highest.z) {
            this.highest = new Point(x, y, val);
        }

        this.heightMap[x + this.size * y] = val;
    }

    divide(size) {
        var middle = size / 2;
        var scale = ROUGHNESS * size;

        if (middle < 1) {
            return;
        }
        for (var y = middle; y < this.max; y += size) {
            for (var x = middle; x < this.max; x += size) {
                this.square(x, y, middle, random(-scale, scale));
            }
        }
        for (var y = 0; y <= this.max; y += middle) {
            for (var x = (y + middle) % size; x <= this.max; x += size) {
                this.diamond(x, y, middle, random(-scale, scale));
            }
        }

        this.divide(size / 2);
    }

    average(values) {
        var valid = values.filter(value => {
            return value !== -1;
        });
        var total = valid.reduce((sum, value) => {
            return sum + value;
        }, 0);
        return total / valid.length;
    }

    diamond(x, y, size, offset) {
        var ave = this.average([
            this.get(x, y - size),
            this.get(x + size, y),
            this.get(x, y + size),
            this.get(x - size, y)
        ]);
        this.set(x, y, ave + offset);
    }

    square(x, y, size, offset) {
        var average = this.average([
            this.get(x - size, y - size),
            this.get(x - size, y + size),
            this.get(x + size, y + size),
            this.get(x + size, y - size)
        ]);
        this.set(x, y, average + offset);
    }

    draw() {
        pushMatrix();
        useMatrix();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        gl.enableVertexAttribArray(aXYZ);
        gl.vertexAttribPointer(aXYZ, 3, gl.FLOAT, false, 9 * FLOATS, 0 * FLOATS);

        gl.enableVertexAttribArray(aNormal);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 9 * FLOATS, 3 * FLOATS);

        gl.enableVertexAttribArray(aColor);
        gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 9 * FLOATS, 6 * FLOATS)

        var dataCount = this.size * this.size * 6 + this.size * 11 + this.size - 24;
        gl.drawArrays(gl.TRIANGLES, 0, dataCount);

        popMatrix();
        gl.disableVertexAttribArray(aColor);
    }

}

class Bird {
    constructor(peak, direction, speed, circleOffset, heightOffset, radius) {
        this.peak = peak;
        this.radius = radius;
        this.speed = speed;
        this.direction = direction;
        this.circleOffset = circleOffset;
        this.heightOffset = heightOffset;
    }

    draw(time) {
        time = time * this.direction + this.speed;;
        var circlePoint = this.getCirclePoint(time + this.circleOffset);
        var bird = new Sphere([circlePoint.x + this.peak.x,
            circlePoint.y + this.peak.y,
            this.peak.z + (Math.sin(time + this.heightOffset) * DIVE_OFFSET) + DIVE_OFFSET * DIVE_OFFSET
        ], 0.3);
        bird.color = BLACK;
        bird.draw();
    }

    getCirclePoint(time) {
        return new Point(this.radius * Math.cos(time), this.radius * Math.sin(time), 0);
    }
}

class ColorGradient {

    constructor() {
        this.colors = this.generateColors();
    }

    generateColors() {
        var colors = [];
        var height = MAX_HEIGHT + 1;
        var yellowGradient = this.generateGradient(YELLOW, GREEN, Math.ceil(height * 10 / 100));
        var solidGreen = new Array(Math.ceil(height * 20 / 100)).fill({
            red: GREEN[0],
            green: GREEN[1],
            blue: GREEN[2]
        });
        var solidWhite = new Array(Math.ceil(height * 20 / 100)).fill({
            red: WHITE[0],
            green: WHITE[1],
            blue: WHITE[2]
        });
        var greenGradient = this.generateGradient(GREEN, WHITE, Math.ceil(height * 50 / 100));

        colors = colors.concat(yellowGradient);
        colors = colors.concat(solidGreen);
        colors = colors.concat(greenGradient);
        colors = colors.concat(solidWhite);
        return colors;
    }

    generateGradient(start, end, steps) {
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

    get(value) {
        return this.colors[value];
    }

    nextColor() {
        return this.colors.pop();
    }
}

class Point {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

function generateNormalVector(rawPoint1, rawPoint2, rawPoint3) {
    var point1 = [rawPoint1.x, rawPoint1.y, rawPoint1.z];
    var point2 = [rawPoint2.x, rawPoint2.y, rawPoint2.z];
    var point3 = [rawPoint3.x, rawPoint3.y, rawPoint3.z];

    var rawVector = vectorProduct(
        vectorPoints(point1, point2),
        vectorPoints(point3, point2));
    return new Point(rawVector[0], rawVector[1], rawVector[2]);
}

function integerRange({
    upperBoundExclusive = 0,
    step = 1
} = {}) {
    var resultArray = [];
    for (var i = 0; i < upperBoundExclusive; i += step) {
        resultArray.push(i);
    }
    return resultArray;
}

function range(upperBound) {
    return Array.from(new Array(upperBound).keys());
}