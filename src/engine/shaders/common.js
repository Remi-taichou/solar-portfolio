// Small pieces of GLSL (the GPU's language) shared by the other shaders.
export const NOISE = `
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float h1(float n){return fract(sin(n*12.9898)*43758.5453);}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
` + [2, 3, 4, 6, 8].map(o => `float fbm${o}(vec3 p){float a=.5,t=0.;for(int i=0;i<${o};i++){t+=a*noise(p);p=p*2.03+vec3(3.1,1.7,2.3);a*=.5;}return t;}`).join("\n");

export const WARP = `
float warp(vec3 p,out vec3 q,out vec3 r){
  q=vec3(fbm4(p),fbm4(p+vec3(5.2,1.3,2.8)),fbm4(p+vec3(1.7,9.2,3.1)));
  r=vec3(fbm4(p+3.2*q+vec3(1.7,9.2,.4)),fbm4(p+3.2*q+vec3(8.3,2.8,4.1)),fbm4(p+3.2*q+vec3(2.1,6.4,7.7)));
  return fbm6(p+3.4*r);
}`;
export const BODY_VERT = `varying vec2 vUv;varying vec3 vN;varying vec3 vW;void main(){vUv=uv;vN=normal;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
// Vertex shader for anything that always faces the camera or uses plain UVs.
export const PLAIN_VERT = "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
// Vertex shader for planet rings.
export const RING_VERT = "varying vec3 vP;varying vec3 vW;void main(){vP=position;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}";
// Vertex shader that fills the whole screen. Used when painting textures and the launch sky.
export const FULLSCREEN_VERT = "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}";
