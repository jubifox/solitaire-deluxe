/* ============ Sons synthétisés (aucun fichier externe) ============ */
var SFX = (function(){
  var ctx = null, master = null, muted = false;

  function ac(){
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
    return ctx;
  }
  function ready(){
    var c = ac(); if (!c) return null;
    if (c.state === 'suspended') c.resume();
    return c;
  }

  function tone(opt){
    if (muted) return;
    var c = ready(); if (!c) return;
    var t0 = c.currentTime + (opt.delay||0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(opt.f, t0);
    if (opt.f2) o.frequency.exponentialRampToValueAtTime(Math.max(20,opt.f2), t0 + (opt.dur||.15));
    var v = (opt.v===undefined?.5:opt.v);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (opt.a||.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (opt.dur||.15));
    o.connect(g);
    if (opt.pan !== undefined && c.createStereoPanner){
      var p = c.createStereoPanner(); p.pan.value = opt.pan; g.connect(p); p.connect(master);
    } else g.connect(master);
    o.start(t0); o.stop(t0 + (opt.dur||.15) + .05);
  }

  function noise(dur, v, hp, delay){
    if (muted) return;
    var c = ready(); if (!c) return;
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 2.2);
    var s = c.createBufferSource(); s.buffer = buf;
    var f = c.createBiquadFilter(); f.type='highpass'; f.frequency.value = hp||900;
    var g = c.createGain(); g.gain.value = v||.25;
    s.connect(f); f.connect(g); g.connect(master);
    s.start(c.currentTime + (delay||0));
  }

  var API = {
    setMuted: function(m){ muted = !!m; },
    unlock: function(){ ready(); },
    click:   function(){ tone({f:520,f2:380,type:'triangle',dur:.06,v:.28}); },
    hover:   function(){ tone({f:900,type:'sine',dur:.04,v:.09}); },
    deal:    function(i){ noise(.10,.19,1600,(i||0)*0.045); tone({f:280+Math.random()*60,f2:150,type:'sine',dur:.09,v:.14,delay:(i||0)*0.045}); },
    flip:    function(){ noise(.09,.22,1400); tone({f:640,f2:920,type:'triangle',dur:.09,v:.16}); },
    place:   function(){ noise(.07,.20,1100); tone({f:200,f2:120,type:'sine',dur:.11,v:.24}); },
    grab:    function(){ tone({f:300,f2:420,type:'sine',dur:.07,v:.13}); },
    invalid: function(){ tone({f:190,f2:110,type:'sawtooth',dur:.16,v:.2}); tone({f:150,f2:90,type:'square',dur:.18,v:.12,delay:.03}); },
    undo:    function(){ tone({f:420,f2:260,type:'triangle',dur:.14,v:.2}); },
    coin:    function(n){ n=n||0; tone({f:880,type:'triangle',dur:.09,v:.2,delay:n*.05}); tone({f:1320,type:'sine',dur:.12,v:.14,delay:n*.05+.04}); },
    foundation: function(step){
      var s = Math.min(step||0, 11);
      var base = 523.25 * Math.pow(2, s/12);
      tone({f:base,type:'triangle',dur:.16,v:.24});
      tone({f:base*1.5,type:'sine',dur:.22,v:.14,delay:.02});
      noise(.08,.14,2200);
    },
    combo: function(n){
      for (var i=0;i<3;i++) tone({f:440*Math.pow(2,(n+i*4)/12),type:'sine',dur:.14,v:.13,delay:i*.05});
    },
    recycle: function(){ noise(.3,.2,700); tone({f:160,f2:420,type:'sawtooth',dur:.3,v:.14}); },
    tick:  function(p){ tone({f:1500+ (p||0)*260, type:'square', dur:.028, v:.13}); noise(.02,.08,3000); },
    open:  function(){ tone({f:120,f2:700,type:'sawtooth',dur:.5,v:.18}); noise(.5,.14,500); },
    reveal: function(rar){
      var idx = RARITY_ORDER.indexOf(rar);
      var root = [261.6,293.7,329.6,392,440,523.25][Math.max(0,idx)];
      var chord = idx >= 4 ? [1,1.25,1.5,2,2.5] : idx >= 2 ? [1,1.25,1.5,2] : [1,1.5];
      chord.forEach(function(m,i){
        tone({f:root*m,type:'triangle',dur:.9+idx*.15,v:.16,delay:i*.05});
        if (idx>=3) tone({f:root*m*2,type:'sine',dur:1.2,v:.07,delay:i*.05+.1});
      });
      noise(.6,.18,900);
    },
    win: function(){
      var seq = [523.25,659.25,783.99,1046.5,1318.5,1568];
      seq.forEach(function(f,i){
        tone({f:f,type:'triangle',dur:.4,v:.2,delay:i*.11});
        tone({f:f*2,type:'sine',dur:.5,v:.09,delay:i*.11+.02});
      });
      noise(.9,.2,600,.1);
    },
    bounce: function(v){ tone({f:120+Math.random()*180,f2:80,type:'sine',dur:.07,v:Math.min(.18,.05+v*.02)}); }
  };
  return API;
})();
