// The look of every planet. Each recipe returns colour in rgb and terrain height in a.
// To design a new planet, add a recipe here and use its name as `surface` in data/site.js.
export const SURFACES = {
  ocean: `
    float n=fbm8(d*2.1+seed); float land=smoothstep(.485,.51,n);
    vec3 sea=mix(vec3(.03,.13,.3),vec3(.08,.36,.56),smoothstep(.3,.49,n));
    vec3 ground=mix(vec3(.2,.36,.17),vec3(.62,.54,.34),smoothstep(.45,.72,fbm4(d*5.+seed)));
    vec3 c=mix(sea,ground,land);
    c=mix(c,vec3(.93,.95,.98),smoothstep(.76,.9,abs(d.y)+(n-.5)*.5));
    c=mix(c,vec3(.97,.98,1.),smoothstep(.5,.7,fbm8(d*vec3(3.,5.,3.)+seed+9.))*.9);
    return vec4(c,.35+land*(n-.45)*1.6);`,
  rust: `
    float n=fbm8(d*2.6+seed); float m=fbm4(d*9.+seed);
    vec3 c=mix(vec3(.3,.11,.06),vec3(.68,.3,.15),smoothstep(.28,.55,n));
    c=mix(c,vec3(.88,.58,.36),smoothstep(.5,.72,n*.6+m*.4));
    c=mix(c,vec3(.93,.91,.87),smoothstep(.84,.94,abs(d.y)+(n-.5)*.3));
    return vec4(c,n*.7+m*.3);`,
  banded: `
    float w=fbm8(d*vec3(3.,1.1,3.)+seed); float b=sin(d.y*19.+(w-.5)*6.5);
    vec3 c=mix(vec3(.46,.27,.16),vec3(.8,.58,.37),smoothstep(-.8,.2,b));
    c=mix(c,vec3(.95,.86,.7),smoothstep(.3,.95,b));
    vec3 q=normalize(vec3(.75,-.3,.58)); float s=smoothstep(.2,.06,length((d-q)*vec3(1.,2.1,1.)));
    c=mix(c,vec3(.72,.3,.17),s*.85);
    return vec4(c,.5);`,
  ringed: `
    float w=fbm4(d*vec3(3.,1.,3.)+seed); float b=sin(d.y*27.+(w-.5)*2.4);
    vec3 c=mix(vec3(.62,.52,.35),vec3(.86,.76,.55),smoothstep(-.9,.3,b));
    c=mix(c,vec3(.97,.91,.74),smoothstep(.4,1.,b));
    return vec4(c,.5);`,
  ice: `
    float n=fbm8(d*2.8+seed); float k=1.-abs(2.*fbm8(d*4.5+seed+4.)-1.); k=pow(k,14.);
    vec3 c=mix(vec3(.3,.56,.74),vec3(.8,.93,.97),smoothstep(.3,.62,n));
    c=mix(c,vec3(.13,.32,.52),k*.85);
    return vec4(c,n*.6+(1.-k)*.4);`,
  lava: `
    float n=fbm8(d*3.+seed); float k=1.-abs(2.*fbm8(d*4.+seed+5.)-1.); k=pow(k,7.);
    vec3 c=mix(vec3(.05,.03,.03),vec3(.2,.1,.08),n);
    c=mix(c,vec3(1.,.48,.1),k);
    return vec4(c,(1.-k)*.6+n*.4);`,
  circuit: `
    vec3 q,r;float f=warp(d*1.6+seed,q,r);
    float lon=atan(d.z,d.x)*9.549;float lat=asin(clamp(d.y,-1.,1.))*9.549;
    vec2 g=vec2(lon,lat)+(q.xy-.5)*1.4;vec2 cell=abs(fract(g)-.5);
    float trace=(1.-smoothstep(.02,.06,min(cell.x,cell.y)))*step(.42,noise(vec3(floor(g),seed)));
    float node=1.-smoothstep(.05,.11,length(fract(g*2.)-.5));node*=step(.7,noise(vec3(floor(g*2.),seed+3.)));
    vec3 c=mix(vec3(.01,.04,.06),vec3(.03,.12,.15),smoothstep(.3,.7,f));
    c=mix(c,vec3(.35,1.,.85),max(trace,node)*.9);
    return vec4(c,.45+f*.2-trace*.15);`,
  bleach: `
    vec3 q,r;float f=warp(d*1.9+seed,q,r);
    vec3 c=mix(vec3(.012,.01,.022),vec3(.34,.018,.05),smoothstep(.26,.58,f));
    c=mix(c,vec3(.95,.14,.07),smoothstep(.6,.9,length(r)*.82)*.95);
    c=mix(c,vec3(1.,.93,.84),smoothstep(.56,.74,q.x*.45+f*.62)*.9);
    return vec4(c,f*.7+q.x*.3);`,
  blaugrana: `
    vec3 q,r;float f=warp(d*vec3(1.5,.42,1.5)+seed,q,r);float y=d.y*11.+(f-.5)*3.1;float t=sin(y);
    vec3 c=mix(vec3(.018,.07,.34),vec3(.56,.03,.15),smoothstep(-.42,.42,t));
    c=mix(c,vec3(.97,.73,.24),smoothstep(.97,.999,sin(y+1.15))*.62);
    c*=.68+q.x*.75;
    vec3 sq=(d-normalize(vec3(.72,-.26,.64)))*vec3(1.,2.3,1.);float st=smoothstep(.24,.05,length(sq));
    c=mix(c,mix(vec3(.97,.73,.24),vec3(1.,.95,.84),st),st*.85);
    return vec4(c,.5);`,
  kombat: `
    vec3 q,r;float f=warp(d*2.1+seed,q,r);float k=1.-abs(2.*fbm8(d*3.1+r*1.3+seed+5.)-1.);float hot=pow(k,10.);float core=pow(k,34.);
    vec3 c=mix(vec3(.018,.016,.02),vec3(.11,.075,.07),smoothstep(.3,.66,f));
    c=mix(c,vec3(.75,.05,.025),hot);c=mix(c,vec3(1.,.78,.2),core);
    return vec4(c,(1.-hot)*.62+f*.38);`,
  vinyl: `
    vec3 q,r;float f=warp(d*1.7+seed,q,r);
    vec3 c=mix(vec3(.022,.018,.09),vec3(.2,.07,.42),smoothstep(.28,.58,f));
    c=mix(c,vec3(.72,.26,.82),smoothstep(.56,.84,length(q)*.78)*.85);
    c=mix(c,vec3(1.,.82,.46),smoothstep(.68,.82,r.y*.5+f*.55)*.75);
    return vec4(c,.5);`,
  moon: `
    float maria=smoothstep(.42,.58,fbm4(d*1.7+seed)); float grain=fbm8(d*14.+seed);
    float h=.5+(grain-.5)*.22-maria*.08; float v=.74-maria*.34+(grain-.5)*.28;
    for(int i=0;i<110;i++){
      float k=float(i); vec3 q=normalize(vec3(h1(k+1.)-.5,h1(k+31.)-.5,h1(k+67.)-.5));
      float sz=.012+pow(h1(k+11.),5.)*.2; float a=acos(clamp(dot(d,q),-1.,1.))/sz;
      if(a<2.6){
        float bowl=1.-smoothstep(0.,1.,a); float rim=exp(-pow((a-1.)/.2,2.));
        h+=(rim*.1-bowl*.2)*(.45+sz*3.); v+=rim*.1-bowl*.1; v+=exp(-a*1.1)*.06*step(.75,h1(k+5.));
      }
    }
    return vec4(vec3(v*.98,v,v*1.04),clamp(h,0.,1.));`,
  sky: `
    vec3 axis=normalize(vec3(.34,.86,.38)); float band=exp(-pow(dot(d,axis),2.)*13.);
    float n=fbm8(d*3.4+seed); float m=fbm4(d*8.+seed);
    float core=pow(max(dot(d,normalize(vec3(-.7,.14,-.7))),0.),3.);
    float a=band*smoothstep(.28,.72,n)*(.5+m*.6);
    vec3 c=vec3(.013,.016,.035)+a*mix(vec3(.07,.09,.18),vec3(.2,.13,.09),core);
    c+=vec3(.025,.012,.04)*smoothstep(.5,.78,fbm4(d*1.8+seed+7.));
    return vec4(c,1.);`,
};
