/* ============ Habillage des cartes : enseignes SVG, faces, figures ============
   Objectif : lisibilité maximale (index large en haut à gauche, toujours visible
   dans la partie découverte d'une pile) + rendu vectoriel net à toute taille.   */
var CardArt = (function(){

  /* ---------------- tracés des enseignes (viewBox 0 0 100 100) ---------------- */
  var SUIT_D = [
    /* 0 pique */
    "M50 7C50 7 44 21 30 35C17.5 47 9 55.5 9 65C9 75 17 82 27 82C34.5 82 41 78 44.5 71.5"+
    "C44.5 80 41.5 89.5 32 95L68 95C58.5 89.5 55.5 80 55.5 71.5C59 78 65.5 82 73 82"+
    "C83 82 91 75 91 65C91 55.5 82.5 47 70 35C56 21 50 7 50 7Z",
    /* 1 coeur */
    "M50 93C50 93 8 63 8 36.5C8 20.5 20 10 32.5 10C41.5 10 47 15 50 21C53 15 58.5 10 67.5 10"+
    "C80 10 92 20.5 92 36.5C92 63 50 93 50 93Z",
    /* 2 carreau */
    "M50 5C61 27 75.5 41.5 88 50C75.5 58.5 61 73 50 95C39 73 24.5 58.5 12 50C24.5 41.5 39 27 50 5Z",
    /* 3 trefle */
    "M50 6C41.2 6 34 13.2 34 22C34 25.6 35.2 29 37.2 31.7C34.4 30 31.2 29 27.6 29"+
    "C18.8 29 11.6 36.2 11.6 45C11.6 53.8 18.8 61 27.6 61C34.8 61 40.9 56.1 42.7 49.5"+
    "C43.4 60 40.5 88 30 95L70 95C59.5 88 56.6 60 57.3 49.5C59.1 56.1 65.2 61 72.4 61"+
    "C81.2 61 88.4 53.8 88.4 45C88.4 36.2 81.2 29 72.4 29C68.8 29 65.6 30 62.8 31.7"+
    "C64.8 29 66 25.6 66 22C66 13.2 58.8 6 50 6Z"
  ];

  var installed = false;
  function installSprite(){
    if (installed || !document.body) return;
    installed = true;
    var defs = '', syms = '';
    for (var i=0;i<4;i++){
      defs += '<path id="sdp-s'+i+'" d="'+SUIT_D[i]+'" fill="currentColor"/>';
      syms += '<symbol id="sd-s'+i+'" viewBox="0 0 100 100">'+
              '<use href="#sdp-s'+i+'" xlink:href="#sdp-s'+i+'"/></symbol>';
    }
    var host = document.createElement('div');
    host.id = 'sd-sprite-host';
    host.setAttribute('aria-hidden','true');
    host.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'+
                     ' width="0" height="0"><defs>'+defs+'</defs>'+syms+'</svg>';
    document.body.insertBefore(host, document.body.firstChild);
  }

  /* enseigne réutilisable */
  function suit(s, cls){
    return '<svg class="sui'+(cls?' '+cls:'')+'" viewBox="0 0 100 100" aria-hidden="true">'+
           '<use href="#sd-s'+s+'" xlink:href="#sd-s'+s+'"/></svg>';
  }

  /* ---------------- disposition des enseignes (cartes 2..10) ---------------- */
  var PIPMAP = {
    2:[[1,0],[1,6]],
    3:[[1,0],[1,3],[1,6]],
    4:[[0,0],[2,0],[0,6],[2,6]],
    5:[[0,0],[2,0],[1,3],[0,6],[2,6]],
    6:[[0,0],[2,0],[0,3],[2,3],[0,6],[2,6]],
    7:[[0,0],[2,0],[1,1.5],[0,3],[2,3],[0,6],[2,6]],
    8:[[0,0],[2,0],[0,2],[2,2],[0,4],[2,4],[0,6],[2,6]],
    9:[[0,0],[2,0],[0,2],[2,2],[1,3],[0,4],[2,4],[0,6],[2,6]],
    10:[[0,0],[2,0],[1,1],[0,2],[2,2],[0,4],[2,4],[1,5],[0,6],[2,6]]
  };

  function pips(r, s){
    var map = PIPMAP[r] || [], h = '<div class="pips">';
    for (var i=0;i<map.length;i++){
      var x = map[i][0]*50, y = map[i][1]/6*100;
      h += '<span class="pip'+(map[i][1] > 3 ? ' flip' : '')+
           '" style="left:'+x+'%;top:'+y+'%">'+suit(s)+'</span>';
    }
    return h + '</div>';
  }

  /* ---------------- as : enseigne centrale ornée ---------------- */
  function ace(s){
    var ring = '<svg class="acering" viewBox="0 0 100 100" aria-hidden="true">'+
      '<circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".38"/>'+
      '<circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="2.6" opacity=".18"/>'+
      rosette() + '</svg>';
    return '<div class="ace">'+ring+suit(s,'abig')+'</div>';
  }
  function rosette(){
    var o = '', i, a, x, y;
    for (i=0;i<12;i++){
      a = i/12*Math.PI*2;
      x = 50 + Math.cos(a)*46; y = 50 + Math.sin(a)*46;
      o += '<circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="1.5" fill="currentColor" opacity=".32"/>';
    }
    return o;
  }

  /* ---------------- figures : valet, dame, roi ----------------
     Cadre 200x100 : c'est le rapport d'une moitie de cartouche. Le buste
     occupe le centre, deux enseignes ornementales tiennent les cotes. */
  function figure(r, s){
    var body =
      '<path class="cf-ink" d="M50 94C50 72 71 62 100 62C129 62 150 72 150 94Z"/>'+
      '<path class="cf-cut" d="M100 62 79 67 100 91 121 67Z"/>'+
      '<path class="cf-cut" d="M60 94c0-12 8-22 21-26-9 7-13 15-13 26Z"/>'+
      '<path class="cf-cut" d="M140 94c0-12-8-22-21-26 9 7 13 15 13 26Z"/>'+
      '<path class="cf-ink" d="M6 95.5h188V100H6Z"/>';
    var neck = '<path class="cf-ink" d="M90.5 53h19v11h-19z"/>';
    var head =
      '<ellipse class="cf-cut cf-line" cx="100" cy="40" rx="21" ry="23"/>'+
      '<circle class="cf-ink" cx="92.8" cy="39" r="2.6"/>'+
      '<circle class="cf-ink" cx="107.2" cy="39" r="2.6"/>';
    var mouth = '<path class="cf-line" fill="none" d="M94 50Q100 54.5 106 50"/>';
    var crest = '', extra = '';

    if (r === 13){          /* roi : couronne et barbe */
      crest = '<path class="cf-ink" d="M74 22V0l13 14 6-15 7 11 7-11 6 15 13-14v22Z"/>'+
              '<circle class="cf-cut" cx="87" cy="6" r="2.7"/>'+
              '<circle class="cf-cut" cx="100" cy="2.5" r="3.2"/>'+
              '<circle class="cf-cut" cx="113" cy="6" r="2.7"/>'+
              '<path class="cf-ink" d="M72 19h56v8H72z"/>';
      extra = '<path class="cf-ink" d="M81 46c1 21 10 28 19 28s18-7 19-28c-5.5 11-13 13.2-19 13.2S86.5 57 81 46Z"/>';
      neck = '';
    } else if (r === 12){   /* dame : diademe et chevelure */
      crest = '<path class="cf-ink" d="M77 21c0-16 10-22 23-22s23 6 23 22Z"/>'+
              '<circle class="cf-cut" cx="88" cy="12" r="2.6"/>'+
              '<circle class="cf-cut" cx="100" cy="8" r="3.1"/>'+
              '<circle class="cf-cut" cx="112" cy="12" r="2.6"/>';
      extra = '<path class="cf-ink" d="M78 27c-12 11-15 32-10 49l14-6c-4-15-4-32 1-42Z"/>'+
              '<path class="cf-ink" d="M122 27c12 11 15 32 10 49l-14-6c4-15 4-32-1-42Z"/>';
    } else {                /* valet : toque emplumee */
      crest = '<path class="cf-ink" d="M77 24c0-17 10-24 23-24s23 7 23 24Z"/>'+
              '<path class="cf-ink" d="M119 17c14-6 22-14 26-23-9 6-20 13-26 23Z"/>'+
              '<rect class="cf-cut" x="74" y="20" width="52" height="7.5" rx="3.7"/>';
    }

    var orn = '<g class="cf-orn">'+
      '<g transform="translate(12,32) scale(0.34)"><use href="#sdp-s'+s+'" xlink:href="#sdp-s'+s+'"/></g>'+
      '<g transform="translate(154,32) scale(0.34)"><use href="#sdp-s'+s+'" xlink:href="#sdp-s'+s+'"/></g>'+
      '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M29 22C13 30 13 62 29 72"/>'+
      '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M171 22c16 8 16 40 0 50"/>'+
      '</g>';

    return '<svg class="cfig" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'+
           orn + body + neck + crest + extra + head + mouth + '</svg>';
  }

  function court(r, s){
    var f = figure(r, s);
    return '<div class="court">'+
             '<div class="cframe"></div>'+
             '<div class="chalf top">'+f+'</div>'+
             '<div class="chalf bot">'+f+'</div>'+
             '<div class="cdiv"></div>'+
           '</div>';
  }

  /* ---------------- index de coin ---------------- */
  function index(pos, r, s){
    return '<div class="idx '+pos+'"><span class="r">'+RANK_CHAR[r]+'</span>'+suit(s,'is')+'</div>';
  }

  /* ---------------- face visible complète ---------------- */
  function faceHTML(c){
    var s = c.s, r = c.r, red = isRed(s);
    var h = '<div class="face front s'+s+' r'+r+' '+(red?'red':'black')+'">';
    h += '<div class="paper"></div>';
    h += index('tl', r, s) + index('br', r, s);
    if (r >= 11) h += court(r, s);
    else if (r === 1) h += ace(s);
    else h += pips(r, s);
    h += '<div class="edge"></div><div class="sheen"></div><div class="glare"></div>';
    return h + '</div>';
  }

  /* ---------------- dos ---------------- */
  function backHTML(){
    return '<div class="face back">'+
             '<div class="bfill"></div>'+
             '<div class="bframe"></div>'+
             '<div class="bmedal"><svg viewBox="0 0 100 100" aria-hidden="true">'+
               '<path d="M50 8 66 50 50 92 34 50Z" fill="none" stroke="#fff" stroke-width="2.2"/>'+
               '<path d="M8 50 50 34 92 50 50 66Z" fill="none" stroke="#fff" stroke-width="2.2"/>'+
               '<circle cx="50" cy="50" r="11" fill="none" stroke="#fff" stroke-width="2.2"/>'+
               '<circle cx="50" cy="50" r="3.4" fill="#fff"/>'+
             '</svg></div>'+
             '<div class="glare"></div>'+
           '</div>';
  }

  function cardHTML(c){ return faceHTML(c) + backHTML(); }

  /* aperçu (inventaire / caisses) */
  function previewFront(r, s){ return faceHTML({s: s === undefined ? 0 : s, r: r || 1}); }
  function previewBack(){ return backHTML(); }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', installSprite);
  else installSprite();

  return {installSprite:installSprite, suit:suit, faceHTML:faceHTML, backHTML:backHTML,
          pathData: function(i){ return SUIT_D[i & 3]; },
          cardHTML:cardHTML, previewFront:previewFront, previewBack:previewBack};
})();
