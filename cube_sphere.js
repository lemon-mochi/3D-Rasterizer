import { Mat4 } from './math.js';
import { Parser } from './parser.js';
import { Scene } from './scene.js';
import { Renderer } from './renderer.js';
import { TriangleMesh } from './trianglemesh.js';


function getUVs(col, row) {
  const u0 = col / 2, u1 = (col + 1) / 2;
  const v0 = row / 3, v1 = (row + 1) / 3;

  return [
    u0, v1,  // v0: (-1, -1)
    u1, v1,  // v1: ( 1, -1)
    u1, v0,  // v2: ( 1,  1)
  
    u0, v1,  // v3: (-1, -1)
    u1, v0,  // v4: ( 1,  1)
    u0, v0   // v5: (-1,  1)
  ];
}

const back = {
  positions: [-1, -1, -1,
    1, -1, -1,
    1, 1, -1,
    -1, -1, -1,
    1,  1, -1,
    -1,  1, -1],
  normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  uvCoords: getUVs(1, 0)
}

const front = {
  positions: [
    -1, -1,  1,
     1, -1,  1,
     1,  1,  1,
    -1, -1,  1,
     1,  1,  1,
    -1,  1,  1,
  ],
  normals: [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
  uvCoords: getUVs(0, 2)
}

const top = {
  positions: [
    -1, 1,  1,
     1, 1,  1,
     1, 1, -1,
    -1, 1,  1,
     1, 1, -1,
    -1, 1, -1
  ],
  normals: [0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0],
  uvCoords: getUVs(0, 0)
};

const bottom = {
  positions: [
    -1, -1, -1,
     1, -1, -1,
     1, -1,  1,
    -1, -1, -1,
     1, -1,  1,
    -1, -1,  1
  ],
  normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  uvCoords: getUVs(1, 2)
};

const left = {
  positions: [
    -1, -1, -1,
    -1, -1,  1,
    -1,  1,  1,
    -1, -1, -1,
    -1,  1,  1,
    -1,  1, -1
  ],
  normals: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
  uvCoords: getUVs(1, 1)
};

const right = {
  positions: [
     1, -1,  1,
     1, -1, -1,
     1,  1, -1,
     1, -1,  1,
     1,  1, -1,
     1,  1,  1
  ],
  normals: [-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0],
  uvCoords: getUVs(0, 1)
};

TriangleMesh.prototype.createCube = function () {
  this.positions = [];
  this.normals = [];
  this.uvCoords = [];

  const faces = [front, back, top, bottom, left, right];

  for (const face of faces) {
    this.positions.push(...face.positions);
    this.normals.push(...face.normals);
    this.uvCoords.push(...face.uvCoords);
  }
};

TriangleMesh.prototype.createSphere = function(numStacks, numSectors) {
  // I used the function in the given link to make this.
  const radius = 1;
  const PI = Math.PI;

  // I messed around with this until it showed North America upright.
  const minStackAngle = PI / 2;   
  const maxStackAngle = -PI / 2;
  const minSectorAngle = 2 * PI;         
  const maxSectorAngle = 0;  

  const stackStep = (maxStackAngle - minStackAngle) / numStacks;
  const sectorStep = (maxSectorAngle - minSectorAngle) / numSectors;

  this.positions = [];
  this.normals = [];
  this.uvCoords = [];
  this.indices = [];

  for (let i = 0; i <= numStacks; i++) {
    const stackAngle = minStackAngle + i * stackStep;
    const xy = radius * Math.cos(stackAngle);
    const z = radius * Math.sin(stackAngle);

    for (let j = 0; j <= numSectors; j++) {
      const sectorAngle = minSectorAngle + j * sectorStep;

      const x = xy * Math.cos(sectorAngle);
      const y = xy * Math.sin(sectorAngle);

      this.positions.push(x, y, z);

      this.normals.push(x, y, z);

      const s = j / numSectors;
      const t = i / numStacks;
      this.uvCoords.push(s, t);
    }
  }

  for (let i = 0; i < numStacks; i++) {
    const k1 = i * (numSectors + 1);
    const k2 = k1 + numSectors + 1;

    for (let j = 0; j < numSectors; j++) {
      if (i !== 0) {
        this.indices.push(k1 + j, k2 + j, k1 + j + 1);
      }
      if (i !== (numStacks - 1)) {
        this.indices.push(k1 + j + 1, k2 + j, k2 + j + 1);
      }
    }
  }
};

Scene.prototype.computeTransformation = function(transformSequence) {
  let overallTransform = Mat4.create();  // identity matrix
  let len = transformSequence.length;

  for (var i = 0; i < len; i++) {
    var matrix = Mat4.create();
    var transformation = transformSequence[i];
    var type = transformation[0];

    if (type == "S") {
      var x = transformation[1];
      var y = transformation[2];
      var z = transformation[3];
      Mat4.set(matrix, x, 0.0, 0.0, 0.0,
               0.0, y, 0.0, 0.0,
               0.0, 0.0, z, 0.0,
               0.0, 0.0, 0.0, 1.0);
    }
    
    else if (type == "T") {
      var x = transformation[1];
      var y = transformation[2];
      var z = transformation[3];
      Mat4.set(matrix,
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        x, y, z, 1.0);
    }
    
    else if (type == "Rx") {
      var theta = transformation[1] * (Math.PI / 180.0);
      let c = Math.cos(theta), s = Math.sin(theta);
      Mat4.set(matrix, 1.0, 0.0, 0.0, 0.0,
               0.0, c, s, 0.0,
               0.0, -s, c, 0.0,
               0.0, 0.0, 0.0, 1.0);
    }
    
    else if (type == "Ry") {
      var theta = transformation[1] * (Math.PI / 180.0);
      let c = Math.cos(theta), s = Math.sin(theta);
      Mat4.set(matrix, c, 0.0, -s, 0.0,
               0.0, 1.0, 0.0, 0.0,
               s, 0.0, c, 0.0,
               0.0, 0.0, 0.0, 1.0);
    }
    
    else if (type == "Rz") {
      var theta = transformation[1] * (Math.PI / 180.0);
      let c = Math.cos(theta), s = Math.sin(theta);
      Mat4.set(matrix, c, s, 0.0, 0.0,
               -s, c, 0.0, 0.0,
               0.0, 0.0, 1.0, 0.0,
               0.0, 0.0, 0.0, 1.0);
    }
        
    Mat4.multiply(overallTransform, matrix, overallTransform);
  }
  return overallTransform;
}

Renderer.prototype.VERTEX_SHADER = `
precision mediump float;

attribute vec3 position, normal;
attribute vec2 uvCoord;

uniform vec3 lightPosition;
uniform mat4 projectionMatrix, viewMatrix, modelMatrix;
uniform mat3 normalMatrix;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vLightDir;
varying vec3 vViewDir;

void main() {
  // I read the FAQ for help
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec3 eyePos = vec3(viewMatrix * worldPos);
  vec3 eyeLightPos = vec3(viewMatrix * vec4(lightPosition, 1.0));

  vNormal = normalMatrix * normal;
  vLightDir = eyeLightPos - eyePos;
  vViewDir = -eyePos;

  vTexCoord = uvCoord;
  gl_Position = projectionMatrix * vec4(eyePos, 1.0);
}
`;

Renderer.prototype.FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 ka, kd, ks, lightIntensity;
uniform float shininess;
uniform sampler2D uTexture;
uniform bool hasTexture;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vLightDir;
varying vec3 vViewDir;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(vLightDir);
  vec3 V = normalize(vViewDir);
  vec3 H = normalize(L + V);

  float d = length(vLightDir);
  float d_squared = d * d;

  // Ambient term
  vec3 ca = ka * lightIntensity;

  // Diffuse term
  float diff = max(dot(N, L), 0.0);
  vec3 cd = (kd / d_squared) * diff * lightIntensity;

  // Specular term
  float spec = pow(max(dot(N, H), 0.0), shininess);
  vec3 cs = (ks / d_squared) * spec * lightIntensity;

  vec3 color = ca + cd + cs;

  // If texture is present, update colour with the texture colour
  if (hasTexture) {
    vec3 texColor = texture2D(uTexture, vTexCoord).rgb;
    color *= texColor;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

// texture for basketball: https://opengameart.org/sites/default/files/balldimpled.png
// texture for sand: https://pics.freeartbackgrounds.com/fullhd/Desert_Sand_Texture-1203.jpg
// I call this "Basketball in the desert".
const DEF_INPUT = [
  "c,myCamera,perspective,5,5,5,0,0,0,0,1,0;",
  "l,myLight,point,0,5,0,2,2,2;",
  "p,unitCube,cube;",
  "p,unitSphere,sphere,20,20;",
  "m,sandCube,0.3,0.3,0.3,0.7,0,0,1,1,1,15,Desert_Sand_Texture-1203.jpg;",
  "m,basketball,0.3,0.3,0.3,0.7,0.7,0.7,1,1,1,5,balldimpled.png;",
  "o,sc,unitCube,sandCube;",
  "X,sc,S,2.5,2.5,2.5;X,sc,T,0,-3,0;",
  "o,sc2,unitCube,sandCube;",
  "X,sc2,S,2.5,2.5,2.5;X,sc2,Ry,90;X,sc2,T,-5,-3,0;",
  "o,sc3,unitCube,sandCube;",
  "X,sc3,S,2.5,2.5,2.5;X,sc3,Rx,90;X,sc3,T,5,-3,0;",
  "o,sc4,unitCube,sandCube;",
  "X,sc4,S,2.5,2.5,2.5;X,sc4,Rz,90;X,sc4,T,0,-3,-5;",
  "o,sc5,unitCube,sandCube;",
  "X,sc5,S,2.5,2.5,2.5;X,sc5,Ry,180;X,sc5,T,-10,-3,0;",
  "o,sc6,unitCube,sandCube;",
  "X,sc6,S,2.5,2.5,2.5;X,sc6,Rx,180;X,sc6,T,-10,-3,0;",
  "o,sc7,unitCube,sandCube;",
  "X,sc7,S,2.5,2.5,2.5;X,sc7,Rz,180;X,sc7,T,0,-3,5;",
  "o,sc8,unitCube,sandCube;",
  "X,sc8,S,2.5,2.5,2.5;X,sc8,Ry,270;X,sc8,T,5,-3,5;",
  "o,sc9,unitCube,sandCube;",
  "X,sc9,S,2.5,2.5,2.5;X,sc9,Rx,270;X,sc9,T,5,-3,-5;",
  "o,sc10,unitCube,sandCube;",
  "X,sc10,S,2.5,2.5,2.5;X,sc10,Rz,270;X,sc10,T,-5,-3,5;",
  "o,sc11,unitCube,sandCube;",
  "X,sc11,S,2.5,2.5,2.5;X,sc11,Ry,90;X,sc11,Rx,90;X,sc11,T,-5,-3,-5;",
  "o,sc12,unitCube,sandCube;",
  "X,sc12,S,2.5,2.5,2.5;X,sc12,T,-15,-3,0;",
  "o,sc13,unitCube,sandCube;",
  "X,sc13,S,2.5,2.5,2.5;X,sc13,Ry,180;X,sc13,Rx,90;X,sc13,T,-10,-3,-5;",
  "o,sc14,unitCube,sandCube;",
  "X,sc14,S,2.5,2.5,2.5;X,sc14,Ry,270;X,sc14,Rx,90;X,sc14,T,-15,-3,-5;",
  "o,sc15,unitCube,sandCube;",
  "X,sc15,S,2.5,2.5,2.5;X,sc15,Rz,90;X,sc15,Rx,90;X,sc15,T,-20,-3,-5;",
  "o,sc16,unitCube,sandCube;",
  "X,sc16,S,2.5,2.5,2.5;X,sc16,Rz,180;X,sc16,Rx,90;X,sc16,T,0,-3,-10;",
  "o,sc17,unitCube,sandCube;",
  "X,sc17,S,2.5,2.5,2.5;X,sc17,Rz,270;X,sc17,Rx,90;X,sc17,T,-5,-3,-10;",
  "o,sc18,unitCube,sandCube;",
  "X,sc18,S,2.5,2.5,2.5;X,sc18,Ry,90;X,sc18,Rx,180;X,sc18,T,-10,-3,-10;",
  "o,sc19,unitCube,sandCube;",
  "X,sc19,S,2.5,2.5,2.5;X,sc19,Ry,90;X,sc19,Rx,270;X,sc19,T,-15,-3,-10;",
  "o,sc20,unitCube,sandCube;",
  "X,sc20,S,2.5,2.5,2.5;X,sc20,Rz,90;X,sc20,Ry,90;X,sc20,T,0,-3,-15;",
  "o,sc21,unitCube,sandCube;",
  "X,sc21,S,2.5,2.5,2.5;X,sc21,Rz,180;X,sc21,Ry,90;X,sc21,T,-5,-3,-15;",
  "o,sc22,unitCube,sandCube;",
  "X,sc22,S,2.5,2.5,2.5;X,sc22,Rz,270;X,sc22,Ry,90;X,sc22,T,-10,-3,-15;",
  "o,sc23,unitCube,sandCube;",
  "X,sc23,S,2.5,2.5,2.5;X,sc23,Ry,90;X,sc23,Rx,90;X,sc23,T,-5,-3,-20;",
  "o,ball,unitSphere,basketball;",
  "X,ball,S,1.25,1.25,1.25;X,ball,T,0,2,0;"
].join("\n");

export { Parser, Scene, Renderer, DEF_INPUT };
