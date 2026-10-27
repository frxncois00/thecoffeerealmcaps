import { useEffect, useRef } from 'react'

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uStrength;
uniform vec3 uPulse;

float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){
  vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);
  float a=hash(i);float b=hash(i+vec2(1.,0.));float c=hash(i+vec2(0.,1.));float d=hash(i+vec2(1.,1.));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
float fbm(vec2 p){
  float v=0.;float a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}
  return v;
}

void main(){
  float sc=min(uRes.x,uRes.y);
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 p=(gl_FragCoord.xy-.5*uRes)/sc;
  float t=uTime*.02;

  vec2 d=p-uMouse;
  float md=length(d);
  float inf=exp(-md*md*5.)*uStrength;
  p+=normalize(d+1e-4)*inf*.07;
  p+=vec2(-d.y,d.x)*inf*.22;

  float age=uTime-uPulse.z;
  vec2 pd=p-uPulse.xy;
  float pl=length(pd);
  float front=exp(-pow((pl-age*.3)*4.5,2.))*exp(-age*.8);
  p+=normalize(pd+1e-4)*front*.05;

  vec2 s=p*1.25;
  vec2 q=vec2(fbm(s+vec2(0.,t)),fbm(s+vec2(5.2,1.3)-t));
  vec2 r=vec2(fbm(s+2.4*q+vec2(1.7,9.2)+t*1.5),fbm(s+2.4*q+vec2(8.3,2.8)-t*1.2));
  vec2 w=s+2.8*r;
  float e=.012;
  float f=fbm(w);
  float fx=fbm(w+vec2(e,0.));
  float fy=fbm(w+vec2(0.,e));

  vec3 n=normalize(vec3((f-fx)/e*.32,(f-fy)/e*.32,1.));
  vec3 L=normalize(vec3((uMouse-p)*1.2,.55));
  vec3 H=normalize(L+vec3(0.,0.,1.));
  float diff=dot(n,L);
  float spec=pow(max(dot(n,H),0.),48.);

  vec3 pearl=vec3(.973,.977,.965);
  vec3 celadon=vec3(.867,.914,.886);
  vec3 silver=vec3(.871,.890,.902);
  vec3 mist=vec3(.80,.88,.84);

  vec3 col=mix(pearl,celadon,smoothstep(.25,.75,q.x));
  col=mix(col,silver,smoothstep(.35,.85,r.y)*.85);
  col=mix(col,mist,smoothstep(.55,.95,f)*.45);

  float c=abs(fract(f*9.)-.5);
  float line=smoothstep(.455,.5,c);
  col=mix(col,vec3(.50,.60,.55),line*.055);

  col*=.96+.07*diff;
  col+=spec*.12*vec3(1.,1.,1.);
  col+=vec3(1.,.99,.97)*exp(-md*md*7.)*.06*uStrength;
  col*=1.-.04*dot(uv-.5,uv-.5)*2.;
  col+=(hash(gl_FragCoord.xy+fract(uTime))-.5)*.016;
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}
`

export default function SilkBackground({ cardRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const cardElement = cardRef?.current
    if (!canvas) return undefined

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    })

    if (!gl) {
      console.warn('SilkBackground: WebGL unavailable, using gradient fallback.')
      return undefined
    }

    const compile = (type, source) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) || 'Shader compile error'
        gl.deleteShader(shader)
        throw new Error(message)
      }
      return shader
    }

    const program = gl.createProgram()
    let vertexShader
    let fragmentShader
    try {
      vertexShader = compile(gl.VERTEX_SHADER, VERT)
      fragmentShader = compile(gl.FRAGMENT_SHADER, FRAG)
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Program link failed')
      }
    } catch (error) {
      console.warn('SilkBackground: shader unavailable, using gradient fallback.', error)
      if (vertexShader) gl.deleteShader(vertexShader)
      if (fragmentShader) gl.deleteShader(fragmentShader)
      gl.deleteProgram(program)
      return undefined
    }

    gl.useProgram(program)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const positionLocation = gl.getAttribLocation(program, 'a')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const uniforms = {}
    ;['uRes', 'uTime', 'uMouse', 'uStrength', 'uPulse'].forEach((name) => {
      uniforms[name] = gl.getUniformLocation(program, name)
    })

    let width = 2
    let height = 2
    const mouse = { x: 0.3, y: 0.15 }
    const target = { x: 0.3, y: 0.15 }
    let strength = 0.35
    let lastMove = -1e9
    const pulse = { x: 0, y: 0, time: -100 }
    let cardX = 0
    let cardY = 0
    let cardTargetX = 0
    let cardTargetY = 0
    let animationFrame = 0

    const toShaderSpace = (clientX, clientY) => {
      const scale = Math.min(window.innerWidth, window.innerHeight)
      return {
        x: (clientX - window.innerWidth / 2) / scale,
        y: (window.innerHeight / 2 - clientY) / scale,
      }
    }

    const render = (time) => {
      gl.uniform2f(uniforms.uRes, width, height)
      gl.uniform1f(uniforms.uTime, time)
      gl.uniform2f(uniforms.uMouse, mouse.x, mouse.y)
      gl.uniform1f(uniforms.uStrength, strength)
      gl.uniform3f(uniforms.uPulse, pulse.x, pulse.y, pulse.time)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const resize = () => {
      const deviceScale = Math.min(window.devicePixelRatio || 1, 2)
      const renderScale = Math.min(deviceScale, 1) * 0.7
      width = Math.max(2, Math.round(window.innerWidth * renderScale))
      height = Math.max(2, Math.round(window.innerHeight * renderScale))
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
      if (reduce) render(14)
    }

    const onPointerMove = (event) => {
      const point = toShaderSpace(event.clientX, event.clientY)
      target.x = point.x
      target.y = point.y
      lastMove = performance.now()
      if (finePointer && event.pointerType === 'mouse') {
        cardTargetX = -(event.clientX / window.innerWidth - 0.5) * 10
        cardTargetY = -(event.clientY / window.innerHeight - 0.5) * 8
      }
    }

    const onPointerDown = (event) => {
      const point = toShaderSpace(event.clientX, event.clientY)
      target.x = point.x
      target.y = point.y
      mouse.x = point.x
      mouse.y = point.y
      pulse.x = point.x
      pulse.y = point.y
      pulse.time = performance.now() / 1000
      lastMove = performance.now()
    }

    window.addEventListener('resize', resize)
    resize()
    render(reduce ? 14 : 0)
    canvas.classList.add('on')

    if (!reduce) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('pointerdown', onPointerDown, { passive: true })

      let previous = performance.now()
      const loop = (now) => {
        const delta = Math.min((now - previous) / 1000, 0.05)
        previous = now
        const active = now - lastMove < 2600

        if (!active) {
          const time = now / 1000
          target.x = Math.sin(time * 0.1) * 0.42
          target.y = Math.cos(time * 0.08) * 0.26
          cardTargetX = 0
          cardTargetY = 0
        }

        const pointerEase = 1 - Math.exp(-delta * 2.5)
        mouse.x += (target.x - mouse.x) * pointerEase
        mouse.y += (target.y - mouse.y) * pointerEase
        strength += ((active ? 1 : 0.35) - strength) * (1 - Math.exp(-delta))
        render(now / 1000)

        if (cardElement && finePointer) {
          const cardEase = 1 - Math.exp(-delta * 3)
          cardX += (cardTargetX - cardX) * cardEase
          cardY += (cardTargetY - cardY) * cardEase
          cardElement.style.transform = `translate3d(${cardX.toFixed(2)}px, ${cardY.toFixed(2)}px, 0)`
        }

        animationFrame = requestAnimationFrame(loop)
      }
      animationFrame = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      if (cardElement) cardElement.style.transform = ''
      gl.deleteBuffer(buffer)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteProgram(program)
    }
  }, [cardRef])

  return (
    <div className="silk-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="silk-canvas" />
    </div>
  )
}
