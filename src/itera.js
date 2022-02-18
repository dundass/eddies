// ***prototype*** library for iterative generative procedures

// include - perlinfunction, ca, logistic (rev?), iterativecolor (generalised)

var itera = itera || {};

(function(it) {
  'use strict';

  var _createArray = function(length) {
    var arr = new Array(length || 0),
        i = length;
    if(arguments.length > 1) {
      var args = Array.prototype.slice.call(arguments, 1);
      while(i--) arr[length-1 - i] = _createArray.apply(this, args);
    }
    return arr;
  }

  var logistic = function(x, r) {
    r = typeof r !== 'undefined' ? r : 0.894;
    return 4.0 * r * x * (1.0 - x);
  }

  var ca1d = function(a, r, n) {
    r = r || [0,1,0,1,1,0,1,0];
    n = n || 2;
    var b = [];
    for(var i = a.length - 1; i < (2 * a.length) - 1; i++) {
      for(var j = 0; j < r.length; j++) {
        if(a[(i-1)%a.length] === parseInt(j/(n*n)) &&
           a[i%a.length] === parseInt(j/n)%n &&
           a[(i+1)%a.length] === j%n) b[i%a.length] = r[j];
      }
    }
    // a.map(function(x, i, arr) {
    //   r.map(function() {
    //
    //   });
    // });

    return b;
  }

  var normalise = function (arr) {  // useful for normalising CA output & any other arr ! what if CA output was normalised anyway ?
    var max = arr.reduce(function (x, a) {
      return x > a ? x : a;
    });
    return arr.map(function (x) {
      return x / max;
    });
  }

  var mutate = function (a, p, max) { // mutateBy ?
    p = p || 0.5;
    max = max || 1;
    return a.map(function (x) {
      var r = Math.random();
      return (r < p ? (Math.random() * max) : x);
    });
  }

  var deltaArray = function () {
    var prev = [];
    return function (next) {
      var delta = next.map(function (nxt, idx) {
        return nxt - prev[idx]; // or should delta be an array of bool => return (nxt === prev[idx]) ?
      });
      prev = next;
      return delta;
    }
  }

  var perlinfunction = function(x, f, amps) { // version containing no persistent state - rename furlin ?
    var sum = 0, ampsum = 0;
    for(var i = 0; i < amps.length; i++) {
      sum += (f(x * (i+1)) * amps[i]);
      ampsum += amps[i];
    }
    return (sum / ampsum);
  }

  /* var cnv = document.createElement('canvas');
  cnv.width = 600;
  cnv.height = 600;
  var ctx = cnv.getContext('2d'),
      dat = ctx.getImageData(0, 0, 600, 600);
  for(var i = 0; i < cnv.width; i++) {
    var perx = perlinfunction(i, x => Math.abs(Math.sin(x/300)), [0.9,0.5,0.2,0.4,0.1]);
    for(var j = 0; j < cnv.height; j++) {
      var pix = (j * cnv.width + i) * 4;
      dat.data[pix] = perx + perlinfunction(j, x => x % 120, [0.4,0.7,0.3,0.1,0.2]);
      dat.data[pix + 3] = 255;
    }
  }
  ctx.putImageData(dat, 0, 0);
  cnv.style.position = 'absolute';
  cnv.style.left = 0+'px';
  cnv.style.top = 0+'px';
  cnv.style.width = 100+'%';
  cnv.style.height = 100+'%';
  cnv.style.zIndex = -1;
  document.body.appendChild(cnv); */

  var lorenz = function (vec, constants, dt) {  // broked !
    constants = constants || {a: 10, b: 28, c: 8.0/3.0};
    dt = dt || 0.001;
    var dx = (constants.a * (vec.x - vec.y)) * dt,
        dy = (vec.x * (constants.b - vec.z) - vec.y) * dt,
        dz = (vec.x * vec.y - constants.c * vec.z) * dt;

    return {x: vec.x + dx, y: vec.y + dy, z: vec.z + dz};
  }

  // var v = {x: 0.01, y: 0.5, z: 0},
  //     c = {a: 10, b: 28, c: 8.0/3.0};

  // setInterval(function () {
  //   v = lorenz(v, c);
  //   console.log(v.x+' '+v.y+' '+v.z);
  // }, 100);

  // var _penAngle = 0;
  var doublependulum = function () {  // args ?
    // var p1 = {
    //   mass: 10,
    //   leng: 200,
    //   angle: 0,
    // }
    var l1 = 200, l2 = 200, m1 = 10, m2 = 10, g = 1;
    var ang1 = { angle: 0, vel: 0, acc: 0 };
    var ang2 = { angle: 0, vel: 0, acc: 0 };
    var loc1 = { x: l1 * Math.sin(a1), y: l1 * Math.cos(a1) };
    var loc2 = { x: loc1.x + l2 * Math.sin(a2), y: loc1.y + l2 * Math.cos(a2) };

    ang1.acc = ( -g*(2*m1+m2)*Math.sin(ang1.angle) - m2*g*Math.sin(ang1.angle-2*ang2.angle) - 2*Math.sin(ang1.angle-ang2.angle)*m2*(Math.pow(ang2.vel,2)*l2+Math.pow(ang1.vel,2)*l1*Math.cos(ang1.angle-ang2.angle)) )
              / ( l1*(2*m1+m2-m2*Math.cos(2*ang1.angle-2*ang2.angle)) );

    ang2.acc = ( 2*Math.sin(ang1.angle-ang2.angle)*(Math.pow(ang1.vel,2)*l1*(m1+m2) + g*(m1+m2)*Math.cos(ang1.angle) + Math.pow(ang2.vel,2)*l2*m2*Math.cos(ang1.angle-ang2.angle)) )
              / ( l2*(2*m1+m2-m2*Math.cos(2*ang1.angle-2*ang2.angle)) );

    ang1.vel += ang1.acc;
    ang1.angle += ang1.vel;
    ang2.vel += ang2.acc;
    ang2.angle += ang2.vel;

    return [loc1, loc2]; // ?? or the angles ?

  }

  var CA2D = function(opt) {
    var opt = opt || {};
    this.numStates = opt.numStates;
    this.sizeX = opt.sizeX;
    this.sizeY = opt.sizeY === 'undefined' ? opt.sizeX : opt.sizeY;
    this.cells = _createArray(this.sizeX, this.sizeY);
    this.buffer = _createArray(this.sizeX, this.sizeY);
    // for(var i = 0; i < this.sizeX; i++) {
    //   for(var j = 0; j < this.sizeY; j++) {
    //     this.cells[i][j] = 0;
    //   }
    // }
    this.ruleset = [];
    for(var i = 0; i < this.numStates * 8; i++) this.ruleset.push(0);
    this.genCount = 0;
  }

  CA2D.prototype = {
    states: function(p) {
      var r = 0;
      for(var i = 0; i < this.sizeX; i++) {
        for(var j = 0; j < this.sizeY; j++) {
          r = Math.random();
          if(r < p) this.cells[i][j] = 1 + parseInt(Math.random() * (this.numStates - 1));
          else this.cells[i][j] = 0;
        }
      }
    },
    rules: function(p) {
      this.ruleset[0] = 0;
      var r = 0, r2 = 0;
      for(var i = 1; i < this.ruleset.length; i++) {
        this.ruleset[i] = 0;
        r = Math.random();
        if(r < p) {
          r2 = Math.random();
          for(var j = 0; j < this.numStates - 1; j++) {
            if(r2 > j / this.numStates && r2 < (j + 1) / this.numStates) this.ruleset[i] = j + 1;
          }
        }
      }
    },
    update: function() {
      var tot = 0;
      for(var i = this.sizeX-1; i < (2 * this.sizeX) - 1; i++) {
        for(var j = this.sizeY-1; j < (2 * this.sizeY) - 1; j++) {
          // this.buffer[i%this.sizeX][j%this.sizeY] = 0;
          tot = 0;
          for(var k = i-1; k < i+2; k++) {
            for(var l = j-1; l < j+2; l++) {
              if((k === i && l === j) === false) tot += this.cells[k%this.sizeX][l%this.sizeY];
            }
          }
          // for(var k = 0; k < 9; k++) {
          //   if(k !== 4) tot += this.cells[(i+(k%3))%this.sizeX][(j+(k/3))%this.sizeY];
          // }
          this.buffer[j%this.sizeX][i%this.sizeY] = this.ruleset[tot];
        }
      }
      this.cells = this.buffer;
      this.genCount++;
    }
  }

  // var PerlinFunction = function(opt) {  // stateful version - keep ?
  //   var opt = opt || {};
  //   this.f = opt.f;
  //   this.amps = typeof opt.amps !== 'undefined' ? opt.amps : [1.0];
  // }
  //
  // PerlinFunction.prototype = {
  //   get: function(x) {
  //     var sum = 0, ampsum = 0;
  //     for(var i = 0; i < this.amps.length; i++) {
  //       sum += (this.f(x * (i+1)) * this.amps[i]);
  //       ampsum += this.amps[i];
  //     }
  //     return (sum / ampsum);
  //   }
  // }

  it.logistic = logistic;
  it.ca1d = ca1d;
  it.normalise = normalise;
  it.mutate = mutate;
  it.deltaArray = deltaArray;
  it.perlinfunction = perlinfunction;
  it.lorenz = lorenz;
  it.CA2D = CA2D;

})(itera);

(function(itera) {
  'use strict';
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = itera; // in nodejs
  } else if (typeof exports !== 'undefined') {
    exports = itera;  // commonjs style
  } else {
    window.itera = itera; // in ordinary browser attach library to window
  }
})(itera);
