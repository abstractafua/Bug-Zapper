//  // Vertex shader (where points are drawn & how big)
//     var VSHADER_SOURCE = 
//     'attribute vec3 a_Position;' +
//     'uniform mat4 Pmatrix;' +
//     'uniform mat4 Vmatrix;' +
//     'uniform mat4 Mmatrix;' +
//     'attribute vec3 color;' +
//     'varying vec3 vColor;' +
//     'void main() {' +
//     '  gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(a_Position, 1.0);' +
//     '  vColor = color;' +
//     '}';

//     //Fragment shader (what color to draw the points)
//     var FSHADER_SOURCE = 
//   'precision mediump float;\n' + // TODO study and ask prof why is this needed?
//    'varying vec3 vColor;\n' +
//   'void main() {\n' +
//   'gl_FragColor = vec4(vColor, 1.0);\n' +
//   '}\n';

// I Moved these Shaders into main js file 