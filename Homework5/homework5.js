// Параметрите на Sticker, който се съдържа
// в RubixCublet
var CUBELET_SIZE = 1;
var CUBE_SIZE = 2;
var STICKER_ELEVATION = 0.09
var STICKER_SLOPE = 0.11;
var OFFSET = 1;

// Цветовете на кубчето
var BLACK = [0.08, 0.08, 0.08];
var GRAY = [0.15, 0.15, 0.15];
var RED = [1, 0, 0];
var ORANGE = [0.8, 0.35, 0];
var GREEN = [0, 1, 0];
var BLUE = [0, 0, 1];
var YELLOW = [1, 1, 0];
var WHITE = [1, 1, 1];

// Идентификатори за вид завъртане
// в RotationRequest
var X_ROTATION = 1;
var Y_ROTATION = 2;
var Z_ROTATION = 3;

/* Обект представляващ лепенката. Представлява два квадрата,
* свързани във върховете. Долният квадрат има страна size, а 
* горният има страна size - slope. Горният квадрат е отместен с 
* elevation нагоре от долния. Променливата center е центъра
* на долният квадрат. Rotation е обект от тип RotationRequest,
* който съдържа по коя ос и на колко градуса да се завърти лепенката.
* Създава се и черен контур около лепенката.
*/
class Sticker{
    
    constructor(center, rotation, size, slope, elevation, color){
        this.center = center;
        this.rotation = rotation;
        this.elevation = elevation;
        this.size = size;
        this.slope = slope;
        this.color = color;
        this.buffer = this.generateBufferData();
    }

    draw(){
        pushMatrix();
        translate(this.center);
        this.rotateObject();
        useMatrix();
        // активираме буфера, създаден от конструктора
        gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
        // казваме къде са координатите
        gl.enableVertexAttribArray(aXYZ);
        gl.vertexAttribPointer(aXYZ,3,gl.FLOAT,false,9*FLOATS,0*FLOATS);
        // казваме къде са нормалите
        gl.enableVertexAttribArray(aNormal);
        gl.vertexAttribPointer(aNormal,3,gl.FLOAT,false,9*FLOATS,3*FLOATS);

        gl.enableVertexAttribArray(aColor)
        gl.vertexAttribPointer(aColor,3,gl.FLOAT,false,9*FLOATS,6*FLOATS)
        // рисуваме
        gl.drawArrays(gl.TRIANGLES,0, 60);
        gl.disableVertexAttribArray(aColor);
        popMatrix();
    }

    rotateObject(){
        switch(this.rotation.direction){
            case X_ROTATION : 
                    xRotate(this.rotation.rotationAngle); 
                    break;
            case Y_ROTATION : 
                    yRotate(this.rotation.rotationAngle);
                    break;
            case Z_ROTATION : 
                    zRotate(this.rotation.rotationAngle);
                    break;
        }
    }

    generateBufferData(){
        var bottomSide = generateSquare(this.size, 0);
        var bottomSideNormal = [0, 0, -1];
        var middleSide = generateSquare(this.size - (this.slope / 2), this.elevation / 2);
        var topSide = generateSquare(this.size - this.slope, this.elevation);
        var topSideNormal = [0, 0, 1];

        var westBotSide = [bottomSide[0], middleSide[0], middleSide[3], bottomSide[3]];
        var westBotSideNormal = generateNormalVector(bottomSide[0], middleSide[3], middleSide[0]);
        var eastBotSide = [bottomSide[1], middleSide[1], middleSide[2], bottomSide[2]];
        var eastBotSideNormal = generateNormalVector(bottomSide[1], middleSide[1], middleSide[2]);
        var northBotSide = [bottomSide[2], middleSide[2], middleSide[3],  bottomSide[3]];
        var nortBotSideNormal = generateNormalVector(bottomSide[2], middleSide[2], middleSide[3]);
        var southBotSide = [bottomSide[0], middleSide[0], middleSide[1], bottomSide[1]];
        var southBotSideNormal = generateNormalVector(bottomSide[0], middleSide[0], middleSide[1]);
        
        // Черният контур на лепенката
        var westTopSide = [middleSide[0], topSide[0], topSide[3], middleSide[3]];
        var westTopSideNormal = generateNormalVector(middleSide[0], topSide[3], topSide[0]);
        var eastTopSide = [middleSide[1], topSide[1], topSide[2], middleSide[2]];
        var eastTopSideNormal = generateNormalVector(middleSide[1], topSide[1], topSide[2]);
        var northTopSide = [middleSide[2], topSide[2], topSide[3],  middleSide[3]];
        var nortTopSideNormal = generateNormalVector(middleSide[2], topSide[2], topSide[3]);
        var southTopSide = [middleSide[0], topSide[0], topSide[1], middleSide[1]];
        var southTopSideNormal = generateNormalVector(middleSide[0], topSide[0], topSide[1]);

        var data = [];
        pushSide(data, bottomSide, bottomSideNormal, GRAY);
        pushSide(data, topSide, topSideNormal, this.color);

        pushSide(data, westBotSide, westBotSideNormal, GRAY);
        pushSide(data, eastBotSide, eastBotSideNormal, GRAY);
        pushSide(data, northBotSide, nortBotSideNormal, GRAY);
        pushSide(data, southBotSide, southBotSideNormal, GRAY);

        pushSide(data, westTopSide, westTopSideNormal, BLACK);
        pushSide(data, eastTopSide, eastTopSideNormal, BLACK);
        pushSide(data, northTopSide, nortTopSideNormal, BLACK);
        pushSide(data, southTopSide, southTopSideNormal, BLACK);

        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        return buffer;
    }

}

/*
* Този обект представлява лепенката на самия куб на Рубик. Той е 
* Sticker с фиксирани size, slope и elevation.
*/
class RubixCublet{
    constructor(position, rotation, color){
        this.sticker = new Sticker([position[0], position[1], position[2]], 
            rotation,
            CUBELET_SIZE, 
            STICKER_SLOPE,
            STICKER_ELEVATION, 
            color);
    }

    draw(){
        this.sticker.draw();
    }
}

/*
* Клас представящ кубът на Рубик. Съдържа всички RubixCublet-и,
* които се намират по стените му. Генерира цвета на всеки един
* с помощта на RubixCubeColorGenerator.
*/
class RubixCube{
    constructor(center){
        this.colorGenerator = new RubixCubeColorGenerator();
        this.center = center;
        this.cublets = [];
        this.pushTopWall(new RotationRequest(90, Z_ROTATION));
        this.pushBottomWall(new RotationRequest(180, X_ROTATION));
        this.pushWestWall(new RotationRequest(-90, Y_ROTATION));
        this.pushEastWall(new RotationRequest(90, Y_ROTATION));
        this.pushNorthWall(new RotationRequest(90, X_ROTATION));
        this.pushSouthWall(new RotationRequest(-90, X_ROTATION));
    }

    pushTopWall(sideRotation){
        var wallOffset = CUBE_SIZE + OFFSET;
        this.pushZAxisWall(wallOffset, sideRotation);
    }

    pushBottomWall(sideRotation){
        var wallOffset = - (CUBE_SIZE + OFFSET);
        this.pushZAxisWall(wallOffset, sideRotation);
    }

    pushWestWall(sideRotation){
        var wallOffset = - (CUBE_SIZE + OFFSET);
        this.pushXAxisWall(wallOffset, sideRotation);
    }

    pushEastWall(sideRotation){
        var wallOffset = CUBE_SIZE + OFFSET;
        this.pushXAxisWall(wallOffset, sideRotation);
    }

    pushNorthWall(sideRotation){
        var wallOffset = CUBE_SIZE + OFFSET;
        this.pushYAxisWall(wallOffset, sideRotation);
    }

    pushSouthWall(sideRotation){
        var wallOffset = - (CUBE_SIZE + OFFSET);
        this.pushYAxisWall(wallOffset, sideRotation);
    }

    pushXAxisWall(wallOffset, sideRotation){
        for (var i = -1; i <= 1; i++){
            for (var j = -1; j <=1; j++){
                var cublet = new RubixCublet([this.center[0] + wallOffset, 
                    this.center[1] + i * CUBE_SIZE, 
                    this.center[2] + j * CUBE_SIZE], 
                    sideRotation,
                    this.colorGenerator.nextColor());
                this.cublets.push(cublet);
            }
        }
    }

    pushYAxisWall(wallOffset, sideRotation){
        for (var i = -1; i <= 1; i++){
            for (var j = -1; j <=1; j++){
                var cublet = new RubixCublet([this.center[0] + i * CUBE_SIZE, 
                    this.center[1] + wallOffset, 
                    this.center[2] + j * CUBE_SIZE], 
                    sideRotation,
                    this.colorGenerator.nextColor());
                this.cublets.push(cublet);
            }
        }
    }

    pushZAxisWall(wallOffset, sideRotation){
        for (var i = -1; i <= 1; i++){
            for (var j = -1; j <=1; j++){
                var cublet = new RubixCublet([this.center[0] + i * CUBE_SIZE, 
                    this.center[1] + j * CUBE_SIZE, 
                    this.center[2] + wallOffset], 
                    sideRotation,
                    this.colorGenerator.nextColor());
                this.cublets.push(cublet);
            }
        }
    }

    draw(){
        this.cublets.forEach(cublet => cublet.draw());
    }
}

/*
* Създава масив от последователно от цветовете
* на кубчето на Рубик и след това го разбърква.
*/
class RubixCubeColorGenerator{
    constructor(){
        this.colors = [];
        this.addToColors(RED);
        this.addToColors(ORANGE);
        this.addToColors(GREEN);
        this.addToColors(BLUE);
        this.addToColors(YELLOW);
        this.addToColors(WHITE);
        this.colors = shuffle(this.colors);
    }

    nextColor(){
        return this.colors.pop();
    }

    addToColors(color){
        range(9).forEach(() => {
            this.colors.push(color);
        });
    }
}

class RotationRequest{
    constructor(rotationAngle, direction){
        this.rotationAngle = rotationAngle;
        this.direction = direction;
    }
}

class Point{
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
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

function pushSide(data, sidePoints, siteNormal, color){
    pushPoint(data, sidePoints[0], siteNormal, color);
    pushPoint(data, sidePoints[1], siteNormal, color);
    pushPoint(data, sidePoints[3], siteNormal, color);
    pushPoint(data, sidePoints[1], siteNormal, color);
    pushPoint(data, sidePoints[2], siteNormal, color);
    pushPoint(data, sidePoints[3], siteNormal, color);
}

function pushPoint(data, point, normalVector, color){
    data.push(point.x, point.y, point.z,
        normalVector[0], normalVector[1], normalVector[2],
        color[0], color[1], color[2]);
}

function generateSquare(size, z){
    return [new Point(-size, -size, z),
        new Point(size, -size, z),
        new Point(size, size, z),
        new Point(-size, size, z)];
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

function range(upperBound = 0){
    return Array.from(Array(upperBound).keys());
}
