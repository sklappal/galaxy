function App() {
  
  var G_FACTOR = 1.0;
  
  var INITIAL_SIMULATIONSPEED = 15.0;
  var INITIAL_CAMERAZOOM = 1.0;
  var INITIAL_CAMERAPOS = vec2.fromValues(0.0, 0.0);
  
  var simulationSpeed = INITIAL_SIMULATIONSPEED;
  var cameraZoom = INITIAL_CAMERAZOOM;
  var cameraPos = vec2.clone(INITIAL_CAMERAPOS);

  var SIZE = 100.0;
  var SIZE_2 =  (2 * SIZE);
  var MINIMUM_OF_CANVAS_WIDTHHEIGHT;
  var CANVAS_X_OFFSET;
  var CANVAS_Y_OFFSET;
  
  var follow = -1;

  var DRAW_TRAIL = false;

  var curMouseCanvas = vec2.create();

  var getId = function()
  {
    var id = 0;
    return function() {
      return id++;
    };
  }();


  function AddStableSystem()
  {
    this.bodies.push(new body(vec2.fromValues(0, 0), vec2.fromValues(0, 0), 5000, getId()));   
    
    this.bodies.push(new body(vec2.fromValues(170, 0), vec2.fromValues(0, 5.5), 150, getId()));
    this.bodies.push(new body(vec2.fromValues(179, 0), vec2.fromValues(0, 9.6), 0.1, getId()));

    this.bodies.push(new body(vec2.fromValues(-370, -300), vec2.fromValues(2, -2), 300, getId()));
    this.bodies.push(new body(vec2.fromValues(-350, -292), vec2.fromValues(4.0, -4.0), 0.5, getId()));
    
  }

  function AddRandomBodies()
  {
    this.bodies.push(new body(vec2.fromValues(0, 0), vec2.fromValues(0, 0), 3000, getId()));   
    for (var i = 0; i < 250; i++)
    {
      this.bodies.push(RandomBody());
    }
  }

  function InitBodies()
  { 
    this.bodies = [];
   // AddRandomBodies();
    AddStableSystem();
  }

  function RandomBody()
  {
    var size = 1 / ( 1.0 - Math.random() ) ;
    return new body( RandomPosition(), RandomVelocity(), size, getId());
  }

  function RandomPosition()
  {
    var out = vec2.create();
    return vec2.random(out, Math.random() * 400);
  }

  function RandomVelocity()
  {
   var out = vec2.create();
    return vec2.random(out, Math.random() * 1.0 + 0.5); 
  }

  function Draw() 
  {
    var grd = GetContext().createRadialGradient(Width() / 2, Height() / 2, MINIMUM_OF_CANVAS_WIDTHHEIGHT * 0.5, Width() / 2, Height() / 2, MINIMUM_OF_CANVAS_WIDTHHEIGHT);
    grd.addColorStop(0, '#000000');
    grd.addColorStop(1, '#000008');
    var ctx = GetContext();

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, Width(), Height());

    var offset = vec2.create();
    if (follow != -1 && follow < this.bodies.length)
    {
      cameraPos = vec2.clone(this.bodies[follow].pos);
    }

    for (var i = 0; i < this.bodies.length; i++)
    {
      var body = this.bodies[i];
      DrawBody(body);
    }
  }

  function DrawBody(body)
  {
    var pos = WorldToCanvas(Camera(body.pos));
    if (pos[0] < 0 || pos[1] < 0 || pos[0] > Width() || pos[1] > Height())
    {
      return;
    }

    DrawFilledCircle(body.pos, body.radius);

    if (DRAW_TRAIL)
    {
      DrawTrail(body);  
    }
  }

  function DrawTrail(body)
  {
    if (body.trail.length == 1)
    {
      return;
    }
    var ctx = GetContext();
    var poscanvas = WorldToCanvas(Camera(body.GetTrailPoint(0)));    
    ctx.beginPath();
    ctx.moveTo(poscanvas[0], poscanvas[1]);
    for (var i = 1; i < body.trail.length; i++)
    {
      poscanvas = WorldToCanvas(Camera(body.GetTrailPoint(i)));
      ctx.lineTo(poscanvas[0], poscanvas[1]);
    }
    ctx.strokeStyle = "rgb(255, 255, 255)";
    ctx.stroke();  
  }

  function DrawFilledCircle(posworld, radiusworld) {
    var ctx = GetContext();
    var poscanvas = WorldToCanvas(Camera(posworld));
    var radius = radiusworld / cameraZoom;
    var radiuscanvas = WorldToCanvasForLength(radius);
    ctx.beginPath();
    var counterClockwise = false;
    ctx.arc(poscanvas[0], poscanvas[1], radiuscanvas, 0, 2 * Math.PI, false);
    var gradient = ctx.createRadialGradient(poscanvas[0], poscanvas[1], radiuscanvas * 0.85, poscanvas[0], poscanvas[1], radiuscanvas);
    gradient.addColorStop(0, '#FFFFFF');    
    gradient.addColorStop(1, '#000000');

    ctx.fillStyle = gradient;
    ctx.fill();
  }

  //[-SIZE, SIZE] x [-SIZE, SIZE] => [CANVAS_X_OFFSET, MINIMUM_OF_CANVAS_WIDTHHEIGHT + CANVAS_X_OFFSET] x [CANVAS_Y_OFFSET, MINIMUM_OF_CANVAS_WIDTHHEIGHT + CANVAS_Y_OFFSET] 

  function WorldToCanvas(pos)
  {
    return vec2.fromValues( ((pos[0] + SIZE) * MINIMUM_OF_CANVAS_WIDTHHEIGHT ) / SIZE_2 + CANVAS_X_OFFSET, ((pos[1] + SIZE) * MINIMUM_OF_CANVAS_WIDTHHEIGHT ) / SIZE_2 + CANVAS_Y_OFFSET); 
  }

  function CanvasToWorld(pos)
  {
    return vec2.fromValues( (( (pos[0] - CANVAS_X_OFFSET) * SIZE_2) / MINIMUM_OF_CANVAS_WIDTHHEIGHT) - SIZE,  (((pos[1] - CANVAS_Y_OFFSET) * SIZE_2) / MINIMUM_OF_CANVAS_WIDTHHEIGHT) - SIZE);
  }

  function WorldToCanvasForLength(len)
  {
    return len / SIZE_2 * MINIMUM_OF_CANVAS_WIDTHHEIGHT;
  }
 
  function Camera(pos)
  {
    var ret = vec2.create();    
    vec2.sub(ret, pos, cameraPos);
    vec2.scale(ret, ret, 1.0 / cameraZoom);
    return ret;
  }

  function InverseCamera(pos)
  {
    var ret = vec2.create();        
    vec2.scale(ret, pos, cameraZoom);
    vec2.add(ret, ret, cameraPos);
    return ret;
  }

  var prevPhysTime = undefined;
  var curPhysTime = new Date().getTime();
  
  function tickPhysics() {
    prevPhysTime = curPhysTime;
    curPhysTime = new Date().getTime();
    elapsed = curPhysTime-prevPhysTime;
    
    Simulate();
    setTimeout(tickPhysics, 1000/60);
  }
   

  function GetAcceleration(body, newPos)
  {
    var acc = vec2.create();
    for (var i = 0; i < this.bodies.length; i++)
    {
      var body2 = this.bodies[i];
      if (body.id == body2.id)
      {
        continue;
      }
      
      var to2 = vec2.create();
      vec2.sub(to2, body2.pos, newPos);
      var distSqr = vec2.squaredLength(to2);
      var scaler = body.mass * body2.mass / distSqr * G_FACTOR;
      vec2.normalize(to2, to2);
      vec2.scale(to2, to2, scaler);

      vec2.add(acc, acc, to2);
    }

    vec2.scale(acc, acc, 1.0 / body.mass);

    return acc;
  }


  var frametime = 0.016;
  var step = 0;
  var trailFrequency = 30;
  function Simulate() 
  { 
    var elapsed = simulationSpeed * frametime;
    
    step += simulationSpeed;
    if (step > trailFrequency)
    {
      step = 0;
    }
    

    var elapsedSqr = elapsed * elapsed;
    var newBodies = [];
    for (var i = 0; i < this.bodies.length; i++)
    {
      var body = this.bodies[i];      

      var remove = false;
      for (var j = 0; j < this.bodies.length; j++)
      {
        if (i != j)
        {
          var otherBody = this.bodies[j];
          if (body.mass < otherBody.mass)
          {
            if (vec2.sqrDist(body.pos, otherBody.pos) < otherBody.squaredRadius)
            {
              remove = true;
              otherBody.eaten += body.mass;
            }
          }
        }
      } 
      
      if (remove)
      {
        continue;
      }

      // 1) of verlet : x(t + delta) = x(t) + v(t) * delta + 0.5 * a(t) * deltaSqr
      var newPos = vec2.clone(body.pos);
      vec2.scaleAndAdd(newPos, newPos, body.vel, elapsed);
      vec2.scaleAndAdd(newPos, newPos, body.acc,  0.5 * elapsedSqr);

      // 2) a(t + delta) = potential(x (t + delta))
      var newAcc = GetAcceleration(body, newPos);
      
      // 3) v(t + delta) = v(t) + 0.5 * (a(t) + a(t + delta)) * delta
      var newVel = vec2.clone(body.vel);
      var accTerm = vec2.create();
      vec2.add(accTerm, body.acc, newAcc);
      vec2.scaleAndAdd(newVel, newVel, accTerm, 0.5 * elapsed);

      var newBody = body.copy(newPos, newVel, newAcc, step == 0);

      newBodies.push(newBody);
    }
    this.bodies = newBodies;
  }
  
  function tick() {
    prevDrawTime = curDrawTime;
    curDrawTime = new Date().getTime();
    
    Draw();
    DrawOverlay();
    requestAnimFrame(tick);
  }

  function Reset()
  {
    InitBodies();
    cameraZoom = INITIAL_CAMERAZOOM;
    cameraPos = vec2.clone(INITIAL_CAMERAPOS)
    simulationSpeed = INITIAL_SIMULATIONSPEED;
    DRAW_TRAIL = false;
    follow = -1;
  }

  this.Start = function() {
    GetCanvas().onmousedown = OnMouseDownCB;
    GetCanvas().onmouseup = OnMouseUpCB;
    GetCanvas().onmousemove = OnMouseMoveCB;
    if (window.addEventListener)
      /** DOMMouseScroll is for mozilla. */
      window.addEventListener('DOMMouseScroll', OnWheelCB, false);
    /** IE/Opera. */
    window.onmousewheel = document.onmousewheel = OnWheelCB;
    window.onkeydown = OnKeyDown;

    window.onresize = Resize;
    Resize();
    Reset();
    tick();
    tickPhysics();
  }
    
  function GetContext() {
    return GetCanvas().getContext("2d");
  }
  
  function GetCanvas() {
    return document.getElementById("canvas");
  }
  
  function Width() 
  {
    return GetCanvas().width;
  }

  function Height() 
  {
    return GetCanvas().height;
  }

  function Resize() {
    GetCanvas().width  = window.innerWidth;
    GetCanvas().height = window.innerHeight;
    MINIMUM_OF_CANVAS_WIDTHHEIGHT = Math.min(window.innerWidth, window.innerHeight);
    CANVAS_X_OFFSET = (window.innerWidth - MINIMUM_OF_CANVAS_WIDTHHEIGHT) * 0.5;
    CANVAS_Y_OFFSET = (window.innerHeight - MINIMUM_OF_CANVAS_WIDTHHEIGHT) * 0.5;   
  }
  
  function ScreenToCanvas(sx, sy) {
    rect = GetCanvas().getBoundingClientRect();
    return vec2.fromValues(sx - rect.left, sy - rect.top);
  }
  
  var dragging = false;
  function OnMouseDown(coords, button) {
    dragging = true;
    follow = -1;
  }
  
  function OnKeyDown(event) {
    if (event.keyCode == 109) {
    // -
      if (simulationSpeed > 0.0) {
        simulationSpeed -= 1;
      }
      simulationSpeed = Math.max(0.0, simulationSpeed);
    }
    if (event.keyCode == 107) {
      // +
      simulationSpeed += 1;
    }
    if (event.keyCode >= 49 && event.keyCode <= 57)
    {
      // 1 -> 9
      var num = event.keyCode - 49;
      follow = num == follow ? - 1 : num;
    }
    if (event.keyCode == 84)
    {
      // t
      DRAW_TRAIL = !DRAW_TRAIL;
    }
    if (event.keyCode == 82)
    {
      // r
      Reset();
    }
  }

  function OnMouseUp(button) {
    dragging = false;
  }
  
  function OnMouseMove(coords) {
    var prevPos = curMouseCanvas;
    curMouseCanvas = coords;
    if (dragging)
    {
      var diff = vec2.create();
      var prevWorld = CanvasToWorld(prevPos);
      var curWorld = CanvasToWorld(curMouseCanvas);
      vec2.sub(diff, prevWorld, curWorld);
      vec2.scale(diff, diff, cameraZoom);
      vec2.add(cameraPos, cameraPos, diff);
    }
  }
  
  function OnMouseDownCB(ev) {
    x = ev.clientX;
    y = ev.clientY;
    canv = ScreenToCanvas(ev.clientX, ev.clientY);
    OnMouseDown(canv, ev.which);
  }
  
  function OnMouseUpCB(ev) {    
    OnMouseUp(ev.which);
  }
  
  function OnMouseMoveCB(ev) {
    x = ev.clientX;
    y = ev.clientY;
    canv = ScreenToCanvas(ev.clientX, ev.clientY);
    OnMouseMove(canv);
  }


  function HandleWheel(delta) 
  {
    var zoomFac = 1.05;
    var invZoom = 1.0 / zoomFac;
    var prevCameraZoom = cameraZoom;
    if (delta < 0) {
      cameraZoom *= zoomFac;      
    } else {
      cameraZoom *= invZoom;
    }

    var curMouseWorld = CanvasToWorld(curMouseCanvas);
    vec2.scaleAndAdd(cameraPos, cameraPos, curMouseWorld, prevCameraZoom - cameraZoom);

  }


  function OnWheelCB(event) {
    var delta = 0;
    if (!event) /* For IE. */
      event = window.event;
    if (event.wheelDelta) { /* IE/Opera. */
      delta = event.wheelDelta/120;
    } else if (event.detail) { /** Mozilla case. */
    /** In Mozilla, sign of delta is different than in IE.
    * Also, delta is multiple of 3.
    */
      delta = -event.detail/3;
    }
    /** If delta is nonzero, handle it.
    * Basically, delta is now positive if wheel was scrolled up,
    * and negative, if wheel was scrolled down.
    */
    if (delta)
      HandleWheel(delta);
    /** Prevent default actions caused by mouse wheel.
    * That might be ugly, but we handle scrolls somehow
    * anyway, so don't bother here..
    */
    if (event.preventDefault)
      event.preventDefault();
    event.returnValue = false;
  }

  function DrawOverlay() {    
    var ctx = GetContext();
    ctx.fillStyle = "white";
    var text = "Simulation speed: " + simulationSpeed.toFixed(1);
    ctx.fillText(text, Width() - 120, Height() - 80);
    var text = "'+' and '-' to adjust";
    ctx.fillText(text, Width() - 120, Height() - 60);    
    var text = "FPS: " + CalculateFPS().toFixed(1);
    ctx.fillText(text, Width() - 120, Height() - 40);
  }
  
  var curDrawTime = new Date().getTime();
  var prevDrawTime = 0;
    
  function GetFrameTime() {
    return curDrawTime - prevDrawTime;
  }

  var CalculateFPS = function() {
    var fpsFilter = 0.01;
    var frameTime = 1.0/60.0 * 1000;
    
    return function() {
      var elapsed = GetFrameTime();
      frameTime = (1-fpsFilter) * frameTime + fpsFilter * elapsed;
      return 1.0 / frameTime * 1000.0;
    }
  }();

  window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           window.msRequestAnimationFrame ||
           function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
             window.setTimeout(callback, 1000/60);
           };
  })();

  return this;
}
