import { NOISE } from './common.js';

// The launch sky, the engine flame and the steam clouds.
export const INTRO_SKY_FRAG = NOISE + `
uniform float alt,aspect,horizon,radius;varying vec2 vUv;
void main(){
  vec2 q=vec2((vUv.x*2.-1.)*aspect,vUv.y*2.-1.);
  vec2 c=vec2(0.,horizon-radius);float dist=length(q-c)-radius;
  float dusk=1.-smoothstep(.03,.2,alt);
  float up=clamp(dist/1.75,0.,1.);
  vec3 low=mix(vec3(1.,.56,.3),vec3(.42,.66,.98),smoothstep(.03,.2,alt));
  vec3 high=mix(vec3(.1,.17,.42),vec3(.015,.04,.13),smoothstep(.04,.3,alt));
  vec3 sky=mix(low,high,pow(up,.5));
  float sd=length(q-vec2(-aspect*.62,horizon+.09));
  sky+=vec3(1.,.55,.25)*exp(-sd*3.1)*.6*dusk;
  float cir=smoothstep(.5,.78,fbm4(vec3(q*vec2(1.5,9.)+3.,1.)));
  sky=mix(sky,vec3(1.,.66,.52),cir*.3*dusk*smoothstep(.02,.3,up));
  float skyA=1.-smoothstep(.3,.5,alt);
  float glow=exp(-max(dist,0.)*mix(2.6,11.,smoothstep(.34,.6,alt)));
  vec2 e=(q-c)/radius;vec3 n=vec3(e,sqrt(max(1.-dot(e,e),0.)));
  float land=smoothstep(.47,.54,fbm4(n*7.));float cloud=smoothstep(.5,.7,fbm4(n*vec3(9.,18.,9.)+4.));
  vec3 earth=mix(vec3(.02,.1,.26),vec3(.1,.17,.09),land);earth=mix(earth,vec3(.85,.9,.96),cloud*.8);
  earth*=.25+.95*max(dot(n,normalize(vec3(-.3,.62,.7))),0.);
  earth+=vec3(.2,.42,.85)*pow(1.-n.z,3.)*.8;
  vec3 ground=mix(vec3(.05,.04,.05),earth,smoothstep(.3,.46,alt));
  float hills=(fbm3(vec3(q.x*5.,0.,2.))-.45)*.04*dusk;
  float inside=smoothstep(.004,-.004,dist-hills);
  vec3 outside=mix(vec3(.38,.64,1.),sky,skyA);
  float a=max(skyA,glow*.95);
  gl_FragColor=vec4(mix(outside,ground,inside),max(inside,a));
}`;
export const INTRO_FLAME_VERT = `uniform float time,len;varying vec2 vUv;
void main(){vUv=uv;vec3 p=position;float k=1.-uv.y;
  p.xz*=1.+sin(time*38.+k*11.)*.05*k+sin(time*23.+k*5.)*.05*k;
  p.y*=len*(1.+sin(time*47.)*.03);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
export const INTRO_FLAME_FRAG = `uniform float thrust,gain;uniform vec3 core,edge;varying vec2 vUv;
void main(){float k=vUv.y;
  vec3 c=mix(edge,core,smoothstep(.1,.85,k));
  gl_FragColor=vec4(c*gain*pow(k,1.3)*min(thrust,1.),1.);}`;
export const INTRO_PUFF_VERT = `attribute float aSize,aAlpha,aSeed,aFire;uniform float uScale;varying float vA,vS,vF;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=aSize*uScale/max(.1,-mv.z);vA=aAlpha;vS=aSeed;vF=aFire;}`;
// Steam is shaded as a lit volume: bright toward the low sun, dark underneath, orange where the engines light it.
export const INTRO_PUFF_FRAG = `uniform sampler2D noiseMap;uniform float uDay;varying float vA,vS,vF;
void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;if(r>1.)discard;
  vec2 uv=p*.62+vec2(vS,vS*3.7);float n=texture2D(noiseMap,uv).r;float m=texture2D(noiseMap,uv*2.3+.3).r;
  float h=n*.7+m*.3;float a=smoothstep(1.,.28,r+(h-.5)*1.05);
  vec2 nrm=p*2.+(vec2(m,n)-.5)*.9;float lit=clamp(dot(nrm,vec2(-.72,-.62))*.7+.55,0.,1.);
  vec3 shade=mix(vec3(.34,.33,.37),vec3(1.,.9,.8),lit);
  shade=mix(shade,mix(vec3(.5,.56,.66),vec3(1.),lit),uDay);
  shade*=.86+h*.26;
  shade=mix(shade,vec3(1.,.72,.38)*(.8+h*.5),vF);
  gl_FragColor=vec4(shade,a*vA);}`;
