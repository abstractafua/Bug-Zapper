Assignment 3
3D “Super Bug Zapper” – Sphere Generation and Rotation
This is an individual assignment. This assignment is marked out of 10 points.
Due Date: March 13 Friday, 2026, 11:59PM
In Assignment 3 and the following Assignment 4, use WebGL and JavaScript (but not three.js),
and the mathematics package that comes with the textbook (provided), to develop a threedimensional interactive game “Super Bug Zapper” with the following features:
[5 point]
1. The playing field starts as surface of a sphere centered at the origin. You need to put
some dots or grids on the surface to make it look like 3D (not a 2D circle).
(Please ignore the background color in the image)
[5 point]
2. The player can drag the sphere to rotate to look for bacteria (under interactive control).
You do not need to generate bacteria in this assignment.
(Please ignore the background color in the image)
Submission:
Electronic submission of source code and documentation will be through Canvas:
1. Submit everything as one zip file to Canvas.
COSC 414/536I Computer Graphics (W2025 T-2) Dr. Shan Du
2. This .zip file should contain all your source files plus the files specified in 3 below and
the files should be correctly placed so that the program runs from a browser.
3. Include in your submission one .doc (or .docx or .pdf) file for a gallery of screen captures
(with at most a 3-line explanation of each image). The screen captures should be
complete and illustrate all aspects of the assignment requirements sufficient for marking
needs.

How to draw a sphere? 

You need to define the radius R, one angle Phi which determines the latitude, and one angle Theta which determines the longitude. If the center of the sphere is not at the origin, you also need to define the center (x0, y0, z0).

Please use the equations in the following document to generate the vertices on the sphere surface by changing Phi and Theta.

Sphere.pdfDownload Sphere.pdf

 

Code snippet for A3:

1. You need to define model/view/projection matrices in the vertex shader. Then they will be assigned in the application code.

// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec3 position;' +
    'uniform mat4 Pmatrix;'+ // projection matrix
    'uniform mat4 Vmatrix;'+ // view matrix
    'uniform mat4 Mmatrix;'+ // model matrix
    'attribute vec3 color;'+ // the color of the vertex
    'varying vec3 vColor;'+
  'void main() {\n' +
    'gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);\n' +
    'vColor = color;'+
  '}\n';
  
// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;'+
    'varying vec3 vColor;'+
  'void main() {\n' +
  '  gl_FragColor = vec4(vColor, 1.0);\n' +
  '}\n';

 

In the function main(): 
    var proj_matrix = new Matrix4();          
    // Specify the viewing volume - define the projection matrix
    proj_matrix.setPerspective(80, canvas.width/canvas.height, 1, 100); //you can change the parameters to get the best view
    var mo_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ]; //model matrix - need to be updated accordingly when the sphere rotates
    var view_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
    view_matrix[14] = view_matrix[14]-6; // view matrix - move camera away from the object
    
    // Then, you need to pass the projection matrix, view matrix, and model matrix to the vertex shader.
    // for example:    
    _Pmatrix = gl.getUniformLocation(gl.program, "Pmatrix");
    _Vmatrix = gl.getUniformLocation(gl.program, "Vmatrix");
    _Mmatrix = gl.getUniformLocation(gl.program, "Mmatrix");
    // Pass the projection matrix to _Pmatrix
    gl.uniformMatrix4fv(_Pmatrix, false, proj_matrix.elements);
    gl.uniformMatrix4fv(_Vmatrix, false, view_matrix);
    gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix);

You can keep the view matrix and projection matrix unchanged. But you need to update the model matrix when you rotate the sphere. 

 

2. For removing the being blocked parts:
  
  gl.enable(gl.DEPTH_TEST);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

 

3. For the indices of vertices:

After generating the vertices, we need to use indices of them to form triangles (for drawing).

image.png

There is an example on how to use "indexBuffer" to save the indices of vertices.

Please check the function initVertexBuffers(gl) in "ColoredCube.js".

Reference: 

https://webglfundamentals.org/webgl/lessons/webgl-indexed-vertices.htmlLinks to an external site.


A3 Rubric

Criteria	Ratings	Pts
This criterion is linked to a Learning OutcomePlaying field
The playing field starts as surface of a sphere centered at the origin. You need to put some dots or grids on the surface to make it look like 3D (not a 2D circle).
5 pts

This criterion is linked to a Learning OutcomeRotation
The player can drag the sphere to rotate to look for bacteria (under interactive control).
5 pts
Total Points: 10