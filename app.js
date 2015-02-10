function App() {
  
  var G_FACTOR = 1.0;
  
  var INITIAL_SIMULATIONSPEED = 15.0;
  var INITIAL_CAMERAZOOM = 1.0;
  var INITIAL_CAMERAPOS = vec3.fromValues(0.0, 0.0, 0.0);
  var PHYSICS_TIME_STEP = 10; // 100 fps
  var TARGET_FPS = 50.0;
  var TARGET_FRAME_TIME = 1000 / TARGET_FPS;

  
  var simulationSpeed = INITIAL_SIMULATIONSPEED;
  var cameraZoom = INITIAL_CAMERAZOOM;
  var cameraPos = vec3.clone(INITIAL_CAMERAPOS);

  var SIZE = 100.0;
  var SIZE_2 =  (2 * SIZE);
  var MINIMUM_OF_CANVAS_WIDTHHEIGHT;
  var CANVAS_X_OFFSET;
  var CANVAS_Y_OFFSET;
  var DEBUG_MODE = false;
  
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
    this.bodies.push(new body(vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 0.0, 0.0), 5000, getId()));   
    
    this.bodies.push(new body(vec3.fromValues(170, 0.0, 0.0), vec3.fromValues(0.0, 5.5, 0.0), 150, getId()));
    this.bodies.push(new body(vec3.fromValues(181, 0.0, 0.0), vec3.fromValues(0.0, 9.6, 0.0), 0.1, getId()));

    this.bodies.push(new body(vec3.fromValues(-370, -300, 0.0), vec3.fromValues(2, -2, 0.0), 300, getId()));
    this.bodies.push(new body(vec3.fromValues(-350, -292, 0.0), vec3.fromValues(4.0, -4.0, 0.0), 0.5, getId()));
    
  }

  function AddRandomBodies()
  {
    this.bodies.push(new body(vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 0.0, 0.0), 3000, getId()));   
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
    var out = vec3.create();
    return vec3.random(out, Math.random() * 400);
  }

  function RandomVelocity()
  {
   var out = vec3.create();
    return vec3.random(out, Math.random() * 1.0 + 0.5); 
  }

  function Draw() 
  {
    var grd = GetContext().createRadialGradient(Width() / 2, Height() / 2, MINIMUM_OF_CANVAS_WIDTHHEIGHT * 0.5, Width() / 2, Height() / 2, MINIMUM_OF_CANVAS_WIDTHHEIGHT);
    grd.addColorStop(0, '#000000');
    grd.addColorStop(1, '#000008');
    var ctx = GetContext();

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, Width(), Height());

    var offset = vec3.create();
    if (follow != -1 && follow < this.bodies.length)
    {
      cameraPos = vec3.fromValues(0.0, 0.0, 0.0);
    }

    for (var i = 0; i < this.bodies.length; i++)
    {
      var body = this.bodies[i];
      DrawBody(body, i == follow);      
    }
  }

  function AdjustForFollow(pos)
  {
    if (follow != -1 && follow < this.bodies.length)
    {
      pos = vec3.sub(vec3.create(), pos, this.bodies[follow].pos);
    }
    return pos;
  }

  function AdjustForFollowTrail(pos, i)
  {
    if (follow != -1 && follow < this.bodies.length)
    {
      pos = vec3.sub(vec3.create(), pos, this.bodies[follow].GetTrailPoint(i));
    }
    return pos;
  }

  function DrawBody(body, drawOutline)
  {
    var pos = WorldToCanvas(Camera(AdjustForFollow(body.pos)));
    if (pos[0] < 0 || pos[1] < 0 || pos[0] > Width() || pos[1] > Height())
    {
      return;
    }

    DrawFilledCircle(AdjustForFollow(body.pos), body.radius, drawOutline);

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
    var poscanvas = WorldToCanvas(Camera(AdjustForFollowTrail(body.GetTrailPoint(0), 0)));    
    ctx.beginPath();
    ctx.moveTo(poscanvas[0], poscanvas[1]);
    for (var i = 1; i < body.trail.length; i++)
    {
      poscanvas = WorldToCanvas(Camera(AdjustForFollowTrail(body.GetTrailPoint(i), i)));
      ctx.lineTo(poscanvas[0], poscanvas[1]);
    }
    ctx.strokeStyle = "rgb(255, 255, 255)";
    ctx.lineWidth = 0.1;
    ctx.stroke();
  }

  function DrawFilledCircle(posworld, radiusworld, drawOutline) {
    var ctx = GetContext();
    var poscanvas = WorldToCanvas(Camera(posworld));
    var radius = radiusworld / cameraZoom;
    var radiuscanvas = Math.max(WorldToCanvasForLength(radius), 2.0);
    ctx.beginPath();
    var counterClockwise = false;
    ctx.arc(poscanvas[0], poscanvas[1], radiuscanvas, 0, 2 * Math.PI, false);
    var gradient = ctx.createRadialGradient(poscanvas[0], poscanvas[1], radiuscanvas * 0.85, poscanvas[0], poscanvas[1], radiuscanvas);
    gradient.addColorStop(0, '#FFFFFF');    
    gradient.addColorStop(1, '#000000');

    ctx.fillStyle = gradient;
    ctx.fill();

    if (drawOutline)
    {
      ctx.beginPath();
      var counterClockwise = false;
      ctx.arc(poscanvas[0], poscanvas[1], radiuscanvas + 2, 0, 2 * Math.PI, false);
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = "rgb(100, 0, 100)";
      ctx.stroke();
    }

    if (DEBUG_MODE)
    {      
      ctx.fillStyle = "white";
      var text = "" + posworld[0].toFixed(0) + " " + posworld[1].toFixed(0) + " " + posworld[2].toFixed(0);      
      ctx.fillText(text, poscanvas[0] + radiuscanvas, poscanvas[1] + radiuscanvas);
    }

  }

  //[-SIZE, SIZE] x [-SIZE, SIZE] => [CANVAS_X_OFFSET, MINIMUM_OF_CANVAS_WIDTHHEIGHT + CANVAS_X_OFFSET] x [CANVAS_Y_OFFSET, MINIMUM_OF_CANVAS_WIDTHHEIGHT + CANVAS_Y_OFFSET] 

  function WorldToCanvas(pos)
  {
    return vec2.fromValues( ((pos[0] + SIZE) * MINIMUM_OF_CANVAS_WIDTHHEIGHT ) / SIZE_2 + CANVAS_X_OFFSET, ((pos[1] + SIZE) * MINIMUM_OF_CANVAS_WIDTHHEIGHT ) / SIZE_2 + CANVAS_Y_OFFSET); 
  }

  function CanvasToWorld(pos)
  {
    return vec3.fromValues( (( (pos[0] - CANVAS_X_OFFSET) * SIZE_2) / MINIMUM_OF_CANVAS_WIDTHHEIGHT) - SIZE,  (((pos[1] - CANVAS_Y_OFFSET) * SIZE_2) / MINIMUM_OF_CANVAS_WIDTHHEIGHT) - SIZE, 0.0);
  }

  function WorldToCanvasForLength(len)
  {
    return len / SIZE_2 * MINIMUM_OF_CANVAS_WIDTHHEIGHT;
  }
 
  function Camera(pos)
  {
    var ret = vec3.create();
    vec3.sub(ret, pos, cameraPos);
    vec3.scale(ret, ret, 1.0 / cameraZoom);
    return ret;
  }

  function InverseCamera(pos)
  {
    var ret = vec3.create();        
    vec3.scale(ret, pos, cameraZoom);
    vec3.add(ret, ret, cameraPos);
    return ret;
  }

  function GetAcceleration(body, newPos)
  {
    var acc = vec3.create();
    for (var i = 0; i < this.bodies.length; i++)
    {
      var body2 = this.bodies[i];
      if (body.id == body2.id)
      {
        continue;
      }
      
      var to2 = vec3.create();
      vec3.sub(to2, body2.pos, newPos);
      var distSqr = vec3.squaredLength(to2);
      var scaler = body.mass * body2.mass / distSqr * G_FACTOR;
      vec3.normalize(to2, to2);
      vec3.scale(to2, to2, scaler);

      vec3.add(acc, acc, to2);
    }

    vec3.scale(acc, acc, 1.0 / body.mass);

    return acc;
  }

  var step = 0;
  var trailFrequency = 30;
  function Simulate() 
  { 
    var elapsed = simulationSpeed * PHYSICS_TIME_STEP * 0.001;
    
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
            if (vec3.sqrDist(body.pos, otherBody.pos) < otherBody.squaredRadius)
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
      var newPos = vec3.clone(body.pos);
      vec3.scaleAndAdd(newPos, newPos, body.vel, elapsed);
      vec3.scaleAndAdd(newPos, newPos, body.acc,  0.5 * elapsedSqr);

      // 2) a(t + delta) = potential(x (t + delta))
      var newAcc = GetAcceleration(body, newPos);
      
      // 3) v(t + delta) = v(t) + 0.5 * (a(t) + a(t + delta)) * delta
      var newVel = vec3.clone(body.vel);
      var accTerm = vec3.create();
      vec3.add(accTerm, body.acc, newAcc);
      vec3.scaleAndAdd(newVel, newVel, accTerm, 0.5 * elapsed);

      var newBody = body.copy(newPos, newVel, newAcc, step == 0);

      newBodies.push(newBody);
    }
    this.bodies = newBodies;
  }
  
  var accumulator = 0;
  function tick() {
    prevDrawTime = curDrawTime;
    curDrawTime = new Date().getTime();
    var frameTime = curDrawTime - prevDrawTime;

    accumulator += frameTime;
    while (accumulator >= PHYSICS_TIME_STEP)
    {
      Simulate();
      accumulator -= PHYSICS_TIME_STEP;
    }
    Draw();
    DrawOverlay();
    
    requestAnimFrame(tick);
  }

  function Reset()
  {
    InitBodies();
    cameraZoom = INITIAL_CAMERAZOOM;
    cameraPos = vec3.clone(INITIAL_CAMERAPOS)
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
    window.onkeyup = OnKeyUp;
    window.addEventListener("touchstart", OnTouchStartCB, false);
    window.addEventListener("touchmove", OnTouchMoveCB, false);
    window.addEventListener("touchend", OnTouchEndCB, false);

    window.onresize = Resize;
    Resize();
    Reset();
    tick();
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
  function OnPointerStart(coords) {
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
    if (event.keyCode == 68)
    {
      // d
      DEBUG_MODE = true;
    }
  }

  function OnKeyUp(event) {   
    if (event.keyCode == 68)
    {
      // d
      DEBUG_MODE = false;
    }
  }

  function OnPointerEnd() {
    dragging = false;
  }
  
  function OnPointerMove(coords) {
    var prevPos = curMouseCanvas;
    curMouseCanvas = coords;
    if (dragging)
    {
      var diff = vec3.create();
      var prevWorld = CanvasToWorld(prevPos);
      var curWorld = CanvasToWorld(curMouseCanvas);
      vec3.sub(diff, prevWorld, curWorld);
      vec3.scale(diff, diff, cameraZoom);
      vec3.add(cameraPos, cameraPos, diff);
    }
  }
  
  function OnMouseDownCB(evt) {
    x = evt.clientX;
    y = evt.clientY;
    canv = ScreenToCanvas(x, y);
    OnPointerStart(canv);
  }
  
  function OnMouseUpCB(evt) {    
    OnPointerEnd();
  }
  
  function OnMouseMoveCB(evt) {
    x = evt.clientX;
    y = evt.clientY;
    canv = ScreenToCanvas(x, y);
    OnPointerMove(canv);
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
    vec3.scaleAndAdd(cameraPos, cameraPos, curMouseWorld, prevCameraZoom - cameraZoom);

  }


  function OnWheelCB(evt) {
    var delta = 0;
    if (!evt) /* For IE. */
      evt = window.event;
    if (evt.wheelDelta) { /* IE/Opera. */
      delta = evt.wheelDelta/120;
    } else if (evt.detail) { /** Mozilla case. */
    /** In Mozilla, sign of delta is different than in IE.
    * Also, delta is multiple of 3.
    */
      delta = -evt.detail/3;
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
    if (evt.preventDefault)
      evt.preventDefault();
    evt.returnValue = false;
  }

  var currentTouch = -1;
  function OnTouchStartCB(evt)
  {
    evt.preventDefault();
    x = evt.changedTouches[0].clientX;
    y = evt.changedTouches[0].clientY;
    canv = ScreenToCanvas(x, y);
    OnPointerStart(canv);

  }

  function OnTouchEndCB(evt)
  {
    OnPointerEnd();
  }

  function OnTouchMoveCB(evt)
  {
    evt.preventDefault();
    x = evt.changedTouches[0].clientX;
    y = evt.changedTouches[0].clientY;
    canv = ScreenToCanvas(x, y);
    OnPointerMove(canv);
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
  var prevDrawTime = new Date().getTime();
    
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
