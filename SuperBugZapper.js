var VSHADER_SOURCE =
    'attribute vec3 position;'     +
    'uniform mat4 Pmatrix;'        +   // projection matrix
    'uniform mat4 Vmatrix;'        +   // view matrix
    'uniform mat4 Mmatrix;'        +   // model matrix
    'attribute vec3 color;'        +   // vertex colours
    'varying vec3 vColor;'         +
    'void main() {'                +
    '  gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);' +
    '  vColor = color;'            +
    '}';

var FSHADER_SOURCE =
    'precision mediump float;'  +
    'varying vec3 vColor;'      +
    'void main() {'             +
    '  gl_FragColor = vec4(vColor, 1.0);' +
    '}';


var isDragging = false;
var mouseX = 0;
var mouseY = 0;
var rotX = 0.3;
var rotY = 0.5;


var _Pmatrix, _Vmatrix, _Mmatrix;
var indexCount = 0;

function main() {

    // Get canvas and WebGL context
    var canvas = document.getElementById('webgl');
    var gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders  (cuon-utils.js initShaders)
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }

    // Set vertex information (sphere geometry vertex buffer)
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to init the vertex buffer');
        return;
    }
    indexCount = n;

    // Enable depth and clear colour
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Projection matrix 
    var proj_matrix = new Matrix4();
    proj_matrix.setPerspective(80, canvas.width / canvas.height, 1, 100);

    // View matrix 
    var mo_matrix   = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    var view_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    view_matrix[14] = view_matrix[14] - 6;

    // Pass projection and view matrices to vertex shader
    _Pmatrix = gl.getUniformLocation(gl.program, 'Pmatrix');
    _Vmatrix = gl.getUniformLocation(gl.program, 'Vmatrix');
    _Mmatrix = gl.getUniformLocation(gl.program, 'Mmatrix');

    gl.uniformMatrix4fv(_Pmatrix, false, proj_matrix.elements);
    gl.uniformMatrix4fv(_Vmatrix, false, view_matrix);
    gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix);

    // Mouse events
    canvas.onmousedown = function(ev) {
        isDragging = true;
        mouseX = ev.clientX;
        mouseY = ev.clientY;
    };

    document.onmouseup   = function()   { isDragging = false; };
    document.onmousemove = function(ev) {
        if (!isDragging) return;
        var dx = ev.clientX - mouseX;
        var dy = ev.clientY - mouseY;
        rotY += dx * 0.01;   // horizontal drag/rotate around Y axis
        rotX += dy * 0.01;   // vertical drag /rotate around X axis
        mouseX = ev.clientX;
        mouseY = ev.clientY;
    };

    // render sphere
    render(gl);
}


// Builds sphere vertices + grid-lines
// source - ColoredCube.js
function initVertexBuffers(gl) {

    var radius= 3.0;   // sphere radius
    var latitude_grids = 30;    
    var longitude_grids = 30; 

    var positions = [];
    var colors = [];
    var indices = [];

    // Generate vertices using sphere equations
    //   x = radius * sin(phi) * cos(theta)
    //   y = radius *  sin(phi) * sin(theta)
    //   z = radius * cos(phi)

    for (var i = 0; i <= latitude_grids; i++) {
        var phi = Math.PI * i / latitude_grids; // latitude angle

        for (var x = 0; x <= longitude_grids; x++) {
            var theta = 2 * Math.PI * x / longitude_grids; // longitude angle

            positions.push(
                radius* Math.sin(phi) * Math.cos(theta),   // x
                radius* Math.cos(phi),// y
               radius* Math.sin(phi) * Math.sin(theta)     // z
                
            );
            colors.push(0.6, 0.6, 0.6);  
        }
    }

    // Build lines for latitude and longitude
    for (var i2  = 0; i2 < latitude_grids; i2++) {
        for (var x2 = 0; x2 < longitude_grids; x2++) {
            var point  = i2 * (longitude_grids + 1) + x2;
            var right = point + 1;                  
            var below = point + (longitude_grids + 1);    

            indices.push(point, right);  // horizontal line 
            indices.push(point, below);  // vertical line 
        }
    }

    var vertices = new Float32Array(positions);
    var color = new Float32Array(colors);
    var index = new Uint16Array(indices);

    // Create index buffer
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) return -1;

    // Push position and color attributes
    if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'position')) 
        return -1;
    if (!initArrayBuffer(gl, color,3, gl.FLOAT, 'color'))    
        return -1;

    // Add index data
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);

    return index.length;
}

// initArrayBuffer  
function initArrayBuffer(gl, data, num, type, attribute) {
    // create buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write data into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);

    return true;
}

function render(gl) {

    // Update model matrix based on rotations
    var mo_matrix = new Matrix4();
    mo_matrix.setRotate(rotX * 180 / Math.PI, 1, 0, 0);  // X rotation
    mo_matrix.rotate(   rotY * 180 / Math.PI, 0, 1, 0);  // Y rotation
    gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix.elements);

    // Clear color and depth buffers
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear( gl.DEPTH_BUFFER_BIT);

    // Draw sphere
    gl.drawElements(gl.LINES, indexCount, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(function() { render(gl); });
}