var lastTime = Date.now(); // last time that animation frame was drawn
var growthSpeed = 0.015; // growth speed of bacteria
var threshold = 0.30;

var bacteriaReachedThreshold = 0;
var gameStarted = false; // track if game has started


// main circle parameters
var radius = 0.8; // radius of main circle
var segments = 100; // number of triangles to approximate main circle

var bacteriaRadius = 0.001; // radius of bacteria at start
var count = 20; //  // number of bacteria to grow

var bacteriaColors = [
          // green
         [0.0, 1.0, 0.0, 1.0],
        // red
           [1.0, 0.0, 0.0, 1.0],
            // blue
             [0.0, 0.0, 1.0, 1.0],
            // pink
              [1.0, 0.0, 1.0, 1.0],
            // yellow
              [1.0, 1.0, 0.0, 1.0]

];

// mouse position variables
var mouseX = 0;
var mouseY = 0;

//scoring points variables 
var player_points = 0;
var game_points = 0;

// Drag rotation state
var dragging = false;
var lastMouseX = 0, lastMouseY = 0;
var SPHERE_RADIUS = 2.0;
var SPHERE_STACKS = 30;
var SPHERE_SLICES = 30;


function main() {

    // get rendering context 
    var canvas = document.getElementById('webgl');
    var gl = canvas.getContext('webgl');


    // check context has been rendered
    if (!gl) {
        console.log('Failed to show rendering context in webgl');
        return;
    }

    // initialize shaders using embedded shader strings
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }

    // clear canvas color (then set background to black)
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Projection matrix
    var proj = new Matrix4();
    proj.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
 
    // View matrix – camera sitting 6 units back on Z
    var view_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    view_matrix[14] = view_matrix[14] - 6;   // move camera back
 
    // Get uniform locations
    _Pmatrix = gl.getUniformLocation(prog, 'Pmatrix');
    _Vmatrix = gl.getUniformLocation(prog, 'Vmatrix');
    _Mmatrix = gl.getUniformLocation(prog, 'Mmatrix');
 
    gl.uniformMatrix4fv(_Pmatrix, false, proj.elements);
    gl.uniformMatrix4fv(_Vmatrix, false, new Float32Array(view_matrix));
    gl.uniformMatrix4fv(_Mmatrix, false, new Float32Array(mo_matrix));


        // --- Build sphere ---
    buildSphere(SPHERE_RADIUS, SPHERE_STACKS, SPHERE_SLICES);
    initBacteria(radius, bacteriaRadius, count); // This function initializes a bacteriaList array so that I'm able to pull last timestep information in animateBacteria()
    
    // Draw initial bacteria state (not growing yet)
    drawBacteria(gl);

// // Track mouse movement and update mouseX and mouseY variables
//     canvas.onmousemove = function(ev) {
//     var rect = ev.target.getBoundingClientRect();
//     var x = ev.clientX;
//     var y = ev.clientY;

//     mouseX = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
//     mouseY = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);
// };

  // --- Mouse events for sphere rotation ---
    canvas.onmousedown = function(e) {
        dragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    };
    canvas.onmouseup   = function() { dragging = false; };
    canvas.onmouseleave= function() { dragging = false; };
    canvas.onmousemove = function(e) {
        // Track mouse in canvas NDC for bacteria clicking
        var rect = canvas.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) - canvas.width/2)  / (canvas.width/2);
        mouseY = (canvas.height/2 - (e.clientY - rect.top))  / (canvas.height/2);
 
        if (!dragging) return;
 
        var dx = e.clientX - lastMouseX;
        var dy = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
 
        // Rotate model matrix around Y (dx) and X (dy)
        rotateModelMatrix(dx * 0.5, dy * 0.5);
        drawScene();
    };

// Click directly on canvas to poison bacteria at mouse position
canvas.onclick = function() {
    poisonBacteria();
};

// Start button event listener
document.getElementById("start").onclick = function() {
    if (!gameStarted) {
        gameStarted = true;
        lastTime = Date.now(); // reset time when game starts
        animateBacteria(gl, radius); // start animation loop to grow bacteria
    }
};




}

// taken from initShaders.js
function initShaders(gl, vertexShaderId, fragmentShaderId) {
    var vertShdr;
    var fragShdr;

    var vertElem = document.getElementById(vertexShaderId);
    if (!vertElem) {
        alert("Unable to load vertex shader " + vertexShaderId);
        return -1;
    }
    else {
        vertShdr = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShdr, vertElem.text);
        gl.compileShader(vertShdr);
        if (!gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS)) {
            var msg = "Vertex shader failed to compile.  The error log is:"
                + "<pre>" + gl.getShaderInfoLog(vertShdr) + "</pre>";
            alert(msg);
            return -1;
        }
    }

    var fragElem = document.getElementById(fragmentShaderId);
    if (!fragElem) {
        alert("Unable to load vertex shader " + fragmentShaderId);
        return -1;
    }
    else {
        fragShdr = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShdr, fragElem.text);
        gl.compileShader(fragShdr);
        if (!gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS)) {
            var msg = "Fragment shader failed to compile.  The error log is:"
                + "<pre>" + gl.getShaderInfoLog(fragShdr) + "</pre>";
            alert(msg);
            return -1;
        }
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertShdr);
    gl.attachShader(program, fragShdr);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var msg = "Shader program failed to link.  The error log is:"
            + "<pre>" + gl.getProgramInfoLog(program) + "</pre>";
        alert(msg);
        return -1;
    }

    return program;
}

function drawCircle(gl, radius, segments) {


    // create vertices (points to draw)
    var vertices = createCircle(radius, segments); // Float32Array
    var n = vertices.length / 2; // number of vertices

    // Create a buffer object 
    var vertexBuffer = gl.createBuffer();

    // Bind buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // Write vertice data to binded buffer
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);


    var a_Position = gl.getAttribLocation(gl.program, 'a_Position'); // get storage location of vertex shader attribute variable
    if (a_Position < 0) { // check location "exists"/ vertex shader is communicating 
        console.log('Failed to get a_Position');
        return;
    }

    // Instruct buffer on how to read vertex data (x,y) (float, don't approximate)
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Enable assignment to attribute variable
    gl.enableVertexAttribArray(a_Position);

    var u_Color = gl.getUniformLocation(gl.program, 'u_Color'); // get storage location of fragment shader uniform color variable
    if (u_Color < 0) { // check location "exists"/fragment shader is communicating 
        console.log('Failed to get u_Color');
        return;
    }

    // Set main circle color to white
    gl.uniform4f(u_Color, 1.0, 1.0, 1.0, 1.0);

    // draw the circle using n gl.TRIANGLES starting at index 0 of the vertex array buffer
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function createCircle(radius, segments) {

    // create storage for vertices 
    var vertices = [];
    var angle = 2 * Math.PI / segments; // angle between triangle segments (2 pi divided by number of segments)

    for (var i = 0; i < segments; i++) { // for each triangle segment create two angles
        var angle1 = i * angle; // first angle 
        var angle2 = (i + 1) * angle; // second angle

        // Center of circle
        vertices.push(0.0, 0.0);

        // First x,y points on circumference of circle
        vertices.push(
            radius * Math.cos(angle1),
            radius * Math.sin(angle1)
        );

        // Second x,y points on circumference of circle
        vertices.push(
            radius * Math.cos(angle2),
            radius * Math.sin(angle2)
        );
    }

    return new Float32Array(vertices); // convert vertice list to Float32Array

}

function drawBacteria(gl) {

    for (var i = 0; i < bacteriaList.length; i++) {

        var b = bacteriaList[i];
        var segments = 50;


        // create vertices (points to draw for bacteria)
        var vertices = createBacteria(b.cx, b.cy, b.radius, segments);

        // Initialize buffer for bacteria vertices
        var buffer = gl.createBuffer();

        // bind Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        // write vertice data to binded buffer
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        var a_Position = gl.getAttribLocation(gl.program, 'a_Position'); // get storage location of vertex shader attribute variable
        if (a_Position < 0) { // check location "exists"/ vertex shader is communicating 
            console.log('Failed to get a_Position for bacteria');
            return;
        }

        // Instruct buffer on how to read vertex data (x,y) (float, don't approximate)
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

        // Enable assignment to attribute variable
        gl.enableVertexAttribArray(a_Position);

        var u_Color = gl.getUniformLocation(gl.program, 'u_Color'); // get storage location of fragment shader uniform color variable
        if (u_Color < 0) { // check location "exists"/fragment shader is communicating 
            console.log('Failed to get u_Color for bacteria');
            return;
        }

        // Set bacteria color to green, red, blue, yellow or pink
       gl.uniform4f(u_Color, b.color[0], b.color[1], b.color[2], b.color[3]);


        var n = vertices.length / 2; // total number of vertices (shouldnt be more than 10 pairs of x,y points)

        // draw the bacteria using n gl.TRIANGLES starting at index 0 of the vertex array buffer
        gl.drawArrays(gl.TRIANGLES, 0, n);
    }
}

function createBacteria(cx, cy, radius, segments) {

    var vertices = [];
    var angleStep = 2 * Math.PI / segments;

    for (var i = 0; i < segments; i++) {
        var angle1 = i * angleStep;
        var angle2 = (i + 1) * angleStep;

        // Circle center
        vertices.push(cx, cy);

        // First point
        vertices.push(
            (radius) * Math.cos(angle1) + cx,
            (radius) * Math.sin(angle1) + cy
        );

        // Second point
        vertices.push(
            (radius) * Math.cos(angle2) + cx,
            (radius) * Math.sin(angle2) + cy
        );
    }
    return new Float32Array(vertices);
}

function initBacteria(radius, bacteriaRadius, count) {

    bacteriaList = [];

    for (var i = 0; i < count; i++) {

        var angle = Math.random() * 2 * Math.PI;

        bacteriaList.push({
            angle: angle,
            cx: radius * Math.cos(angle),
            cy: radius * Math.sin(angle),
            radius: bacteriaRadius,
            color: bacteriaColors[i % bacteriaColors.length],
            counted: false
        });
    }
}

function animateBacteria(gl, mainRadius) {

    var now = Date.now();
    var elapsed = (now - lastTime) / 1000.0; // convert to seconds
    lastTime = now; // update lastTime to now

    // Grow each bacteria by multiplying their radius by growth speed by elapsed time
    for (var i = 0; i < bacteriaList.length; i++) {
        bacteriaList[i].radius += growthSpeed * elapsed;

        if (bacteriaList[i].radius >= threshold && !bacteriaList[i].counted) {
        game_points += 1;
        bacteriaList[i].counted = true;
        bacteriaReachedThreshold++;
    }
    }

    // clear color buffer
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawCircle(gl, mainRadius, 100); // I redrew main circle with same segemnt count from main()
    drawBacteria(gl);  // this function draws bacteria  

    document.getElementById('game_points').innerHTML = 
    'Game gains: ' + game_points;

document.getElementById('player_points').innerHTML = 
    'Player gains: ' + player_points;

    // Winning condition : if 2 or more bacteria reach size threshold the player loses
    if (bacteriaReachedThreshold >= 2) {
        document.getElementById('win_lose').innerHTML = 'You lose!';
        return; // stop animation
    }

    if (bacteriaList.length === 0) {
        document.getElementById('win_lose').innerHTML = 'You win!';
        return;
    }

    // continue animation if any bacteria still growing (recursive)
    requestAnimationFrame(function () {
        animateBacteria(gl, mainRadius);
    });
}

function poisonBacteria() {

    for (var i = 0; i < bacteriaList.length; i++) {

        var b = bacteriaList[i];

        var dx = mouseX - b.cx;
        var dy = mouseY - b.cy;

        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= b.radius) {

            bacteriaList.splice(i, 1); // kills bacteria
            player_points += 1;
            break;
        }
    }
}

function buildSphere(R, stacks, slices) {
    var vertices = [];
    var colors   = [];
    var indices  = [];
 
    // Generate (stacks+1) x (slices+1) grid of vertices
    for (var i = 0; i <= stacks; i++) {
        var phi = Math.PI * i / stacks;          // 0 … PI
        for (var j = 0; j <= slices; j++) {
            var theta = 2 * Math.PI * j / slices; // 0 … 2PI
 
            var x = R * Math.sin(phi) * Math.cos(theta);
            var y = R * Math.cos(phi);
            var z = R * Math.sin(phi) * Math.sin(theta);
 
            vertices.push(x, y, z);
 
            // Color: grid lines bright, fill dark — creates visible grid pattern
            // Make every 3rd latitude/longitude ring brighter for a grid look
            var isLatLine = (i % 3 === 0);
            var isLonLine = (j % 3 === 0);
            if (isLatLine || isLonLine) {
                colors.push(0.2, 0.8, 0.8);  // cyan grid lines
            } else {
                colors.push(0.05, 0.25, 0.35); // dark blue-green fill
            }
        }
    }
 
    // Generate triangle indices (two triangles per quad)
    for (var i = 0; i < stacks; i++) {
        for (var j = 0; j < slices; j++) {
            var a = i * (slices + 1) + j;
            var b = a + (slices + 1);
            // Triangle 1
            indices.push(a,   b,   a+1);
            // Triangle 2
            indices.push(a+1, b,   b+1);
        }
    }
 
    sphereIndexCount = indices.length;
 
    // Upload vertices
    sphereVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
 
    // Upload colors
    sphereColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
 
    // Upload indices (need Uint16Array since vertex count > 255)
    sphereIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}
 
function drawSphere() {
    var prog = gl.program;
 
    // Bind vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexBuffer);
    var aPos = gl.getAttribLocation(prog, 'a_Position');
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPos);
 
    // Bind vertex colors
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereColorBuffer);
    var aCol = gl.getAttribLocation(prog, 'a_Color');
    gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aCol);
 
    // Bind index buffer and draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.drawElements(gl.TRIANGLES, sphereIndexCount, gl.UNSIGNED_SHORT, 0);
}

/** Multiply 4x4 column-major matrix by vec4 */
function mat4Vec4(m, v) {
    var out = [0, 0, 0, 0];
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
            out[r] += m[r + c*4] * v[c];
        }
    }
    return out;
}
function animateLoop() {
    var now     = Date.now();
    var elapsed = (now - lastTime) / 1000.0;
    lastTime    = now;
 
    for (var i = 0; i < bacteriaList.length; i++) {
        var b = bacteriaList[i];
        b.radius += growthSpeed * elapsed;
 
        // --- FIX from A2: time-based scoring ---
        // Game gains 1 point every second a bacterium stays alive (not zapped)
        var timeAlive = (now - b.lastZapTime) / 1000.0;
        b.scoreAccum = (b.scoreAccum || 0) + elapsed;
        if (b.scoreAccum >= 1.0) {
            game_points += Math.floor(b.scoreAccum);
            b.scoreAccum -= Math.floor(b.scoreAccum);
        }
 
        // --- FIX from A2: count each threshold crossing once ---
        if (b.radius >= threshold && !b.counted) {
            b.counted = true;
            bacteriaReachedThreshold++;
        }
    }
 
    drawScene();
    updateHUD();
 
    // --- FIX from A2: lose when TWO DIFFERENT bacteria reach threshold ---
    if (bacteriaReachedThreshold >= 2) {
        document.getElementById('win_lose').innerHTML = '💀 You lose! 2 bacteria got too big!';
        return;
    }
    if (bacteriaList.length === 0) {
        document.getElementById('win_lose').innerHTML = '🏆 You win! All bacteria zapped!';
        return;
    }
 
    requestAnimationFrame(animateLoop);
}
 
function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(_Mmatrix, false, new Float32Array(mo_matrix));
    drawSphere();
    drawBacteria();
}
 
function updateHUD() {
    document.getElementById('game_points').innerHTML  = 'Game gains: '  + game_points;
    document.getElementById('player_points').innerHTML = 'Player gains: ' + player_points;
}