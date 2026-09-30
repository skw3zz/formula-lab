
(() => {
  const viewport = document.getElementById('viewport');
  const model = document.getElementById('model');
  const reset = document.getElementById('reset');
  const fansBtn = document.getElementById('fans');
  const partsBtn = document.getElementById('parts');
  const legend = document.getElementById('legend');

  let yaw = -28, pitch = -17, scale = 0.92;
  let targetYaw = yaw, targetPitch = pitch, targetScale = scale;
  let fansRunning = true;
  const pointers = new Map();
  let pinchDistance = 0;

  const el = (className, x, y, z, w, h, extra = '') => {
    const d = document.createElement('div');
    d.className = 'part ' + className;
    if (w != null) d.style.width = w + 'px';
    if (h != null) d.style.height = h + 'px';
    d.style.transform = `translate3d(${x}px,${y}px,${z}px) translate(-50%,-50%) ${extra}`;
    model.appendChild(d);
    return d;
  };

  const beam = (x,y,z,w,rot='') => el('beam',x,y,z,w,14,rot);
  const column = (x,y,z,h) => el('column',x,y,z,14,h,'');
  const rail = (x,y,z,w,rot='') => el('rail',x,y,z,w,4,rot);

  const addFan = (x,z) => {
    const housing = el('fanHousing',x,72,z,150,150,'rotateX(90deg)');
    const fan = document.createElement('div');
    fan.className = 'fan';
    for(let i=0;i<4;i++){
      const blade = document.createElement('span');
      blade.className = 'blade';
      blade.style.transform = `rotate(${i*90}deg)`;
      fan.appendChild(blade);
    }
    housing.appendChild(fan);
    el('motor',x,139,z,46,82,'');
  };

  const addPipe = (x,y,z,w,h,rot='') => el('pipe',x,y,z,w,h,rot);

  const build = () => {
    const floor = document.createElement('div');
    floor.className = 'floor';
    model.appendChild(floor);

    [-300,300].forEach(x => [-145,145].forEach(z => column(x,52,z,300)));
    [-145,145].forEach(z => {
      beam(0,-92,z,620);
      beam(0,190,z,620);
      rail(0,190,z,620);
    });
    [-300,300].forEach(x => beam(x,-90,0,290,'rotateY(90deg)'));

    [-92,92].forEach(z => {
      el('bundle',0,-75,z,560,94,'');
      el('headerPipe',-294,-75,z,46,118,'');
      el('headerPipe',294,-75,z,46,118,'');
      addPipe(-332,-75,z,82,22,'');
      addPipe(332,-75,z,82,22,'');
    });

    [-155,155].forEach(x => [-92,92].forEach(z => addFan(x,z)));

    el('walkway',0,-150,175,600,44,'rotateY(0deg)');
    for(let x=-285;x<=285;x+=57){
      rail(x,-184,175,70,'rotate(90deg)');
      rail(x,-184,207,70,'rotate(90deg)');
    }
    rail(0,-220,175,600);
    rail(0,-220,207,600);

    addPipe(-354,-74,0,22,220,'rotateX(90deg)');
    addPipe(354,-74,0,22,220,'rotateX(90deg)');
    addPipe(-354,22,0,22,175,'');
    addPipe(354,-145,0,22,175,'');

    for(let y=-55;y<=185;y+=28) rail(335,y,205,54);
    rail(312,65,205,280,'rotate(90deg)');
    rail(358,65,205,280,'rotate(90deg)');

    const plate = el('deck',0,-178,-155,150,32,'');
    plate.style.background = '#d9dee2';
  };

  build();

  const apply = () => {
    model.style.transform =
      `rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${scale})`;
  };

  const animate = () => {
    yaw += (targetYaw-yaw)*0.12;
    pitch += (targetPitch-pitch)*0.12;
    scale += (targetScale-scale)*0.12;
    apply();
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  viewport.addEventListener('pointerdown', e => {
    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){
      const p=[...pointers.values()];
      pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
    }
  });

  viewport.addEventListener('pointermove', e => {
    if(!pointers.has(e.pointerId)) return;
    const prev=pointers.get(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===1){
      targetYaw += (e.clientX-prev.x)*0.35;
      targetPitch -= (e.clientY-prev.y)*0.28;
      targetPitch = Math.max(-65,Math.min(50,targetPitch));
    } else if(pointers.size===2){
      const p=[...pointers.values()];
      const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      if(pinchDistance) targetScale *= d/pinchDistance;
      pinchDistance=d;
      targetScale=Math.max(.48,Math.min(1.55,targetScale));
    }
  });

  const pointerEnd = e => {
    pointers.delete(e.pointerId);
    if(pointers.size<2) pinchDistance=0;
  };
  viewport.addEventListener('pointerup',pointerEnd);
  viewport.addEventListener('pointercancel',pointerEnd);

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    targetScale *= Math.exp(-e.deltaY*0.001);
    targetScale=Math.max(.48,Math.min(1.55,targetScale));
  },{passive:false});

  reset.addEventListener('click', () => {
    targetYaw=-28; targetPitch=-17; targetScale=.92;
  });

  fansBtn.addEventListener('click', () => {
    fansRunning=!fansRunning;
    document.querySelectorAll('.fan').forEach(f => {
      f.style.animationPlayState=fansRunning?'running':'paused';
    });
    fansBtn.textContent='Вентиляторы: '+(fansRunning?'ВКЛ':'ВЫКЛ');
    fansBtn.classList.toggle('active',fansRunning);
  });

  partsBtn.addEventListener('click', () => {
    legend.hidden=!legend.hidden;
    partsBtn.classList.toggle('active',!legend.hidden);
  });

  const style = document.createElement('style');
  style.textContent='@keyframes spinFan{to{transform:rotate(360deg)}} .fan{animation:spinFan 1.3s linear infinite}';
  document.head.appendChild(style);

  const fit = () => {
    targetScale = innerWidth < 700 ? .62 : .92;
  };
  addEventListener('resize',fit,{passive:true});
  fit();
})();
