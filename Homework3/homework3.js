// Нямах достатъчно време да рефакторирам и съответно кодът е малко грозен :(

const CUBE_DATA = [0.5,-0.5,0.5,	// предна стена
    0.5,0.5,0.5,
   -0.5,0.5,0.5,
   -0.5,-0.5,0.5,
    0.5,-0.5,-0.5, // задна стена
    0.5,0.5,-0.5,
   -0.5,0.5,-0.5,
   -0.5,-0.5,-0.5,
   
    0.5,-0.5,0.5, // десни хоризонтални ръбове
    0.5,-0.5,-0.5,
    0.5,0.5,0.5,
    0.5,0.5,-0.5,
   -0.5,0.5,0.5,	// леви хоризонтални ръбове
   -0.5,0.5,-0.5,
   -0.5,-0.5,0.5,
   -0.5,-0.5,-0.5];

// Векторът с който скалираме кубът към тухла.
const SCALE_VECTOR = [1, 0.5, 0.5];

// Функцията която използвам за генериране на сърцето има много малък период.
// Този факт беше установен емпирично. Стъпката също.
const FUNCTION_PERIOD = 6.30;
const STEP = 0.001;

// Скалата служи за да се генерират повече точки.
const SCALE = 10;

function drawHearth(){
    // Трябва ни начална точка. Взимаме angle = 0.001, не съм сигурен защо не просто 0, но пък така работи.
    var previousCoordinates = getPolarCoordinates(getHearthFunctionRadius(STEP), STEP)
    var distance = 0;
    var offset = 0;
    var drawInSecondRow = false;

    for(var angle = STEP; angle <= FUNCTION_PERIOD; angle += STEP){
            var radius = getHearthFunctionRadius(angle);
            var coordinates = getPolarCoordinates(radius, angle);
            var curveDerivative = derivative(getHearthFunctionRadius, angle);
            var tangent = polarDerivative(curveDerivative, radius, angle);
            var rotationAngle = toDegrees(Math.atan(tangent));

            // Взимаме разстоянието по самата функция (или поне приблизително)
            // Тъй като стъпката е малка можем да вземем разстоянието от предишната и следващата точка и да ги събираме.
            distance += getDistance([previousCoordinates.x, previousCoordinates.y], [coordinates.x, coordinates.y]);
            previousCoordinates = coordinates;

            // Искаме 2 пъти повече точки за да можем да рисуваме 2 реда наведнъж.
            // Генерираме 2 пъти повече точки (дължината на една тухла е 1 и съответно взимаме distance < 0.5)
            // за да можем да изместим половината тухли надолу и долният ред да е малко изместен една половина тухла от горния.
            if(distance > 0.5){
                distance = 0;

                // Уви, тъй като взимаме приближение за distance, някои точки  ще се застъпват с други.
                // Не рисуваме такива точки.
                if(isNotRedundantPoint(angle)){
                    drawInSecondRow ? offset = 0.5 : offset = 0;
                    drawInSecondRow = !drawInSecondRow;

                    var z = 0;
                    range(10).forEach(() => {
                        z+=1
                        drawBrick([coordinates.x, coordinates.y, z + offset], -rotationAngle);
                    })
                }
            }
    }
}


// Лоши точки, които се преплитат с други.
// Установено емпирично.
// Тъй като функцията е доста гъста на двете сгъвки е трудно да се избере точка
// която да не се преплита с друга по горният подход. За това просто изключвам 
// някои които не ми харесват. 
function isNotRedundantPoint(t){
    return (t < 1.60 || t > 1.70) && 
    (t < 4.713 || t > 4.715) && 
    (t < 4.719 || t > 4.721) && 
    (t < 4.707 || t > 4.709)
}

function derivative(f, x){
    var h = 0.01
    var fX = f(x);
    var fXH = f(x + h);
    return (fXH - fX) / h;
}

function polarDerivative(rawDerivative, radius, angle){
    var numerator = rawDerivative * Math.sin(angle) + radius * Math.cos(angle);
    var denumerator = rawDerivative * Math.cos(angle) - radius * Math.sin(angle);

    return numerator / denumerator;
}

function getPolarCoordinates(r, t){
    return {
        x : r * Math.cos(t),
        y : r * Math.sin(t)
    }
}

function drawBrick(translateVector, rotateAngle){
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(CUBE_DATA), gl.STATIC_DRAW);
    
    gl.enableVertexAttribArray(aXYZ);
    gl.vertexAttribPointer(aXYZ, 3, gl.FLOAT, false, 0, 0);
    
    gl.uniform3f(uColor, 0.5, 0, 0);
    identity();
    translate(translateVector);
    zRotate(rotateAngle);
    scale(SCALE_VECTOR);
    useMatrix();
    gl.drawArrays(gl.LINE_LOOP, 0, 4);
    gl.drawArrays(gl.LINE_LOOP, 4, 4);
    gl.drawArrays(gl.LINES, 8, 8);
}

// Функцията която генерира сърцето. Има и други, но тази е удобна защото е 
// непрекъсната и се диференцира лесно.
function getHearthFunctionRadius(t){
    var firstSummandNumerator = Math.sin(t) * Math.sqrt(Math.abs(Math.cos(t)));
    var firstSummandDenumerator = Math.sin(t) + 7 / 5;
    var firstSummand = firstSummandNumerator / firstSummandDenumerator;

    var secondSummand = -2 * Math.sin(t) + 2;

    return SCALE * (firstSummand + secondSummand);
}

function toDegrees(angle) {
    return angle * (180 / Math.PI);
}

function getDistance(pointA, pointB){
    var distanceX = pointA[0] - pointB[0];
    var distanceY = pointA[1] - pointB[1];
    var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
    return distance;
}

function range(upperBound = 0){
    return Array.from(Array(upperBound).keys());
}
