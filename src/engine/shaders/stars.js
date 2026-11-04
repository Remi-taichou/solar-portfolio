import { NOISE } from './common.js';

// The sun, its corona, the bright star, its glow and the background star points.
export const SUN_FRAG = NOISE + `
uniform float time;varying vec3 vN;varying vec3 vW;
void main(){
  vec3 d=normalize(vN);vec3 V=normalize(cameraPosition-vW);
  float n=fbm4(d*3.2+vec3(time*.035,0.,-time*.02));float m=fbm4(d*11.-vec3(0.,time*.06,0.));float g=fbm4(d*46.+vec3(time*.09));
  float v=clamp(n*.56+m*.44+(g-.5)*.34,0.,1.);
  vec3 c=mix(vec3(.92,.34,.04),vec3(1.,.62,.13),smoothstep(.28,.48,v));
  c=mix(c,vec3(1.,.87,.42),smoothstep(.46,.62,v));c=mix(c,vec3(1.,.98,.82),smoothstep(.6,.76,v));
  float ndv=max(dot(normalize(vW),V),0.);
  c*=mix(.62,1.14,pow(ndv,.5));
  gl_FragColor=vec4(c,1.);
}`;
export const CORONA_FRAG = NOISE + `
uniform float time,power,eclipse;varying vec2 vUv;
void main(){
  vec2 p=(vUv-.5)*2.*10.;float r=length(p);float a=atan(p.y,p.x);vec2 u=vec2(cos(a),sin(a));
  float n=noise(vec3(u*2.6+5.,time*.05));float m=noise(vec3(u*15.+5.,time*.09));float k=noise(vec3(u*42.+5.,time*.07));
  float reach=.42+eclipse*1.9;
  float e=max(r-1.,0.);
  float rays=exp(-e/(reach*(.3+n*1.25+m*.5)))*(.42+.58*m)*(.7+.3*k);
  float glow=exp(-e*(1.15-eclipse*.55))*.42;
  vec3 warm=vec3(1.,.62,.28);vec3 pearl=vec3(.84,.9,1.);
  vec3 c=mix(warm,pearl,eclipse);
  float fade=smoothstep(10.,5.5,r);
  gl_FragColor=vec4(c*(rays*(.62+eclipse*.42)+glow)*power*fade,1.);
}`;
export const STAR_FRAG = NOISE + `
uniform float time;uniform vec3 tint;varying vec3 vN;varying vec3 vW;uniform mat4 modelMatrix;
void main(){
  vec3 d=normalize(vN);vec3 V=normalize(cameraPosition-vW);
  float n=fbm4(d*4.2+vec3(time*.04,0.,-time*.03));float g=fbm4(d*17.-vec3(time*.07));float f=fbm3(d*58.+vec3(time*.1));
  float v=clamp(n*.5+g*.38+f*.22,0.,1.);
  float ndv=max(dot(normalize(mat3(modelMatrix)*d),V),0.);
  // White-hot in the middle, the star's own colour toward the edge, with fine moving granules.
  vec3 c=mix(tint*mix(.72,1.05,smoothstep(.3,.65,v)),vec3(1.,.995,.98),clamp(pow(ndv,.95)*.9+smoothstep(.52,.72,v)*.3,0.,1.));
  c*=mix(.8,1.12,pow(ndv,.4));
  gl_FragColor=vec4(c,1.);
}`;
export const STAR_GLOW_FRAG = `
uniform float time,power,twinkle,phase;uniform vec3 tint;varying vec2 vUv;
void main(){
  vec2 p=(vUv-.5)*2.*15.;float r=length(p);float a=atan(p.y,p.x)+phase*.4+time*.012;float e=max(r-1.,0.);
  float pulse=1.-twinkle+twinkle*(.5+.5*sin(time*2.3+phase))*(.72+.28*sin(time*5.1+phase*2.));
  float halo=exp(-e*.82)*.95+exp(-e*.2)*.16;
  float main=pow(abs(cos(a*2.)),260.)*exp(-e*.2);
  float minor=pow(abs(cos(a*2.+.785)),560.)*exp(-e*.42)*.62;
  float fade=smoothstep(15.,8.,r);
  vec3 c=mix(tint,vec3(1.),smoothstep(3.5,0.,e)*.75);
  gl_FragColor=vec4(c*(halo+main+minor)*pulse*power*fade,1.);
}`;
export const POINT_VERT = `
attribute float aSize,aPhase,aLayer;attribute vec3 aColor;uniform float uPx,uTime,uNight,uAtten;varying vec3 vC;varying float vA;
void main(){
  vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
  gl_PointSize=uAtten>.5?clamp(aSize*uPx*60./-mv.z,.6,5.*uPx):aSize*uPx;
  vC=aColor;vA=(.62+.38*sin(uTime*(.5+aPhase)+aPhase*20.))*mix(1.,uNight,aLayer);
}`;
export const POINT_FRAG = `varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5)*2.;float a=smoothstep(1.,.4,d);gl_FragColor=vec4(vC*a*vA,1.);}`;
