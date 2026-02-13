 // Vertex shader (where points are drawn & how big)
    var VSHADER_SOURCE = 
    'attribute vec4 a_Position;\n' +
    'void main (){\n' + 
    'gl_Position = a_Position;\n' + 
    'gl_PointSize = 10.0;\n' +
    '}\n';

    //Fragment shader (what color to draw the points)
    var FSHADER_SOURCE = 
  'precision mediump float;\n' + // TODO study and ask prof why is this needed?
  'uniform vec4 u_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_Color;\n' +
  '}\n';
