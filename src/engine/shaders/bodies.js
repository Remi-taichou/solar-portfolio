import { NOISE } from './common.js';

// How planets, their atmospheres and their rings are lit.
export const BODY_FRAG = NOISE + `
uniform sampler2D map;uniform vec4 light;uniform float sunK,bump,emit,ambient,detail,detailBump,detailFreq,gloss;uniform vec3 atm;uniform vec2 texel;uniform mat4 modelMatrix;
varying vec2 vUv;varying vec3 vN;varying vec3 vW;
void main(){
  vec4 tex=texture2D(map,vUv,-.6);
  float hu=texture2D(map,vUv+vec2(texel.x,0.)).a-texture2D(map,vUv-vec2(texel.x,0.)).a;
  float hv=texture2D(map,vUv+vec2(0.,texel.y)).a-texture2D(map,vUv-vec2(0.,texel.y)).a;
  vec3 N=normalize(vN);vec3 T=normalize(vec3(N.z,0.,-N.x)+vec3(1e-4,0.,0.));vec3 B=cross(N,T);
  vec3 wBase=normalize(mat3(modelMatrix)*N);
  vec3 N2=N-bump*(hu*T+hv*B);
  // Close up, fine surface detail is generated per pixel so it stays sharp at any zoom.
  if(detail>.001){
    vec3 q=N*detailFreq;float h0=fbm3(q);
    N2-=detail*detailBump*((fbm3(q+T*.4)-h0)*T+(fbm3(q+B*.4)-h0)*B);
    tex.rgb*=1.+(h0-.5)*.34*detail;
  }
  vec3 wN=normalize(mat3(modelMatrix)*normalize(N2));
  vec3 L=light.w>.5?normalize(light.xyz-vW):normalize(light.xyz);
  vec3 V=normalize(cameraPosition-vW);
  float d=max(dot(wN,L),0.)*smoothstep(-.08,.12,dot(wBase,L));
  float fill=max(dot(wN,V),0.)*.13*sunK;
  vec3 c=tex.rgb*(ambient+fill+d*1.12*sunK);
  float lum=dot(tex.rgb,vec3(.3,.5,.2));
  c+=emit*tex.rgb*smoothstep(.45,.8,lum);
  c+=vec3(1.,.97,.92)*pow(max(dot(normalize(L+V),wN),0.),70.)*gloss*sunK;
  float rim=pow(1.-max(dot(wBase,V),0.),3.2)*smoothstep(-.25,.45,dot(wBase,L));
  c+=atm*rim*.75*sunK;
  gl_FragColor=vec4(c,1.);
}`;
export const HALO_FRAG = `
uniform vec4 light;uniform float sunK,edge;uniform vec3 atm;varying vec3 vN;varying vec3 vW;
void main(){
  vec3 N=normalize(vN);vec3 V=normalize(cameraPosition-vW);float f=abs(dot(N,V));
  vec3 L=light.w>.5?normalize(light.xyz-vW):normalize(light.xyz);
  float a=pow(clamp(f/edge,0.,1.),2.6)*smoothstep(-.35,.45,dot(N,L));
  gl_FragColor=vec4(atm*a*.65*sunK,1.);
}`;
export const RING_FRAG = NOISE + `
uniform vec3 sunPos,center;uniform float radius,sunK,rIn,rOut,record;varying vec3 vP;varying vec3 vW;
void main(){
  float r=length(vP.xy);float x=(r-rIn)/(rOut-rIn);
  if(record>.5){
    float ang=atan(vP.y,vP.x);float g=.5+.5*sin(x*300.);float tracks=smoothstep(.0,.02,abs(fract(x*5.)-.5)-.02);
    float sheen=pow(abs(cos(ang*1.+.7)),26.);
    vec3 vc=mix(vec3(.02,.016,.035),vec3(.1,.08,.15),g)*(.55+tracks*.45)+mix(vec3(.75,.55,1.),vec3(1.,.82,.5),x)*sheen*.75*(.55+g*.45);
    vc=mix(vec3(.98,.73,.24),vc,smoothstep(.0,.035,x-.005));
    float ra=smoothstep(0.,.008,x)*smoothstep(1.,.992,x);
    vec3 L0=normalize(sunPos-vW);vec3 q0=center-vW;float t0=dot(q0,L0);
    float s0=t0>0.?smoothstep(radius*.92,radius*1.06,length(q0-L0*t0)):1.;
    gl_FragColor=vec4(vc*(.22+s0*sunK*.95),ra*.98);return;
  }
  float b=fbm6(vec3(x*30.,1.,4.));float a=smoothstep(0.,.03,x)*smoothstep(1.,.96,x)*smoothstep(.2,.55,b)*(1.-smoothstep(.6,.625,x)*smoothstep(.69,.665,x));
  vec3 L=normalize(sunPos-vW);vec3 q=center-vW;float t=dot(q,L);
  float shade=t>0.?smoothstep(radius*.92,radius*1.06,length(q-L*t)):1.;
  vec3 c=mix(vec3(.62,.53,.38),vec3(.97,.89,.72),b);
  gl_FragColor=vec4(c*(.04+shade*sunK*1.05),a*.92*mix(.3,1.,shade));
}`;
