var clk = clk || {};

(function (clk) {

  'use strict';
  
  ///////// utils /////////

  var noOp = function() {};
  
  var clamp = function(val, min, max) {
	  return Math.min(max, Math.max(min, val));
  };

  ///////// midi //////////

  var midi;

  function _onMIDISuccess( midiAccess ) {
    console.log( "MIDI ready!" );
    midi = midiAccess;  // store in the global (in real usage, would probably keep in an object instance)
    _listInputsAndOutputs(midi);
  }

  function _onMIDIFailure(msg) {
    console.log( "Failed to get MIDI access - " + msg );
  }

  const _listInputsAndOutputs = function ( midiAccess ) {
    for (var entry of midiAccess.inputs) {
      var input = entry[1];
      console.log( "Input port [type:'" + input.type + "'] id:'" + input.id +
        "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
        "' version:'" + input.version + "'" );
    }

    for (var entry of midiAccess.outputs) {
      var output = entry[1];
      console.log( "Output port [type:'" + output.type + "'] id:'" + output.id +
        "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
        "' version:'" + output.version + "'" );
        console.log(output.id);
      _sendNoteOn(midiAccess, output.id, 60, 127, 1000);
    }
  }

  const _sendNoteOn = (midiAccess, portID, note, vel, leng) => {
    note = note || 60;
    vel = vel || 127;
    let noteOnMessage = [0x90, note, vel];
    let output = midiAccess.outputs.get(portID);
    output.send(noteOnMessage);
    if(leng) _sendNoteOff(midiAccess, portID, note, leng);
  }

  const _sendNoteOff = (midiAccess, portID, note, delay) => {
    note = note || 60;
    delay = delay || 0;
    let noteOffMessage = [0x80, note, 0x00];
    let output = midiAccess.outputs.get(portID);
    output.send(noteOffMessage, delay);
  }

  var startMidi = function () {
    navigator.requestMIDIAccess().then( _onMIDISuccess, _onMIDIFailure );
  }

  ///////// Tone ///////////
  
  var masterBus = new Tone.Limiter(-1).toMaster();
	  
  var reverbBus = new Tone.Convolver('./assets/wav/Factory Hall.wav', noOp, {wet: 1}).connect(masterBus);
  
  var tonePlayers = {
	  bleep: new Tone.Synth(),
      mono: new Tone.MonoSynth({volume: -23, filter: {frequency: 1000}}),
	  duo: new Tone.DuoSynth({vibratoAmount: 0.3, vibratoRate: 2}),
      am: new Tone.AMSynth(),
	  fm: new Tone.FMSynth({volume: -10}),
	  metal: new Tone.MetalSynth(),
	  noise: new Tone.NoiseSynth({noise: {type: 'pink'}}),
	  pluck: new Tone.PluckSynth({resonance: 0.85, dampening: 6000}),
	  brane: new Tone.MembraneSynth(),
	  smp: new Tone.Sampler({
        'C0': 'kick0.wav',
        'C#0': 'snare0.wav',
        'D0': 'clap0.wav',
        'D#0': 'hat0.wav'
      }, {
        'release': 1, // ??
        'baseUrl': './assets/wav/'
      })
  };
  
  Object.keys(tonePlayers).forEach(function(name) {
	  tonePlayers[name].connect(masterBus);
	  tonePlayers[name].connect(reverbBus);
  });

  ///////// lang //////////
  
  // set up notes and scales

  var letters = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  var notes = [], octaves = 7;
  console.log(letters.length * octaves)
  for(var i = 0; i < letters.length * octaves; i++) {
    notes.push(letters[i % letters.length] +''+ ((i / letters.length)|0));
  }
  
  var globalScale = 'chromatic';
  
  function _makeScale () {
	  var i = 0, args = arguments;
	  return notes.filter(function(note, noteIdx) {
		  for(i = 0; i < args.length; i++) {
			  if(noteIdx % 12 === args[i]) return true;
		  }
		  return false;
	  });
  }
  
  var scales = {
	  chromatic: notes,
	  major: _makeScale(0, 2, 4, 5, 7, 9, 11),
	  minor: _makeScale(0, 2, 3, 5, 7, 8, 10),
	  aeolian: _makeScale(0, 2, 3, 5, 7, 8, 10),
	  dorian: _makeScale(0, 2, 3, 5, 7, 9, 10),
	  mixolydian: _makeScale(0, 2, 4, 5, 7, 9, 10),
	  diminished: _makeScale(0, 1, 3, 4, 6, 7, 9, 10),
	  blues: _makeScale(0, 3, 5, 6, 7, 10),
  };
  
  console.log(scales);
  
  var scale = function(name) {
	  globalScale = name;
  }
  
  // pattern functions
  
	var parsePattern = function (data, t) {	// consider sending in rate instead of t and internally calculating t
	  if(data.constructor === Number) {
		return data;
	  } else if(data.constructor === Array) {
		return data[(t|0) % data.length]; // TODO - recursive parsePattern to play back nested sequence arrays
	  } else if(data.constructor === String) {
		return parseFloat(data.charAt((t|0)%data.length));
	  } else if(data.constructor === Function) {
		return data(t);
	  } else {
		return 0;
	  }
	}
  
	var pattern = function(data) {
	  data = data || 0;
	  return {
		data: data,
		isPattern: true,
		isPlaying: false,
		rate: 4,
		transforms: [],
		midiInfo: {
			channel: 0,
			port: 'output-1'
		},
		tone: {
			synth: null,	// todo - make this an array to chain calls to tone() or provide array in tone([bleep, am]) ?
			opts: {}
		},
		synthOpts: {
			verb: 0.2
		},
		get: function (t) {
		  t = t / this.rate;
		  var val = parsePattern(this.data, t);
		  for(var i = 0; i < this.transforms.length; i++) {
			  if(this.transforms[i].opts.condition(t)) {
				  val = parsePattern(this.transforms[i].transform, t); // does this mean that it'll always overwrite the prev pattern val ? any way to pass the new value thru ??
				  // maybe if transform is a number or array, then it goes to that absolutely, but a func applies itself to the prev val ???? but how to distinguish between function(t){} and function(prevVal){} ? maybe pat generators take time, and transforms take prevVal (=val in this get func)
			  }
		  }
		  return val;	
		},
		pat: function (data) {	// to do chords, send in multiple data args to pattern, each corresponding to ...
		  this.data = data || 0;
		  // if another pattern supplied, use its data
		  if(data.isPattern) this.data = data.data;
		  // clear transforms array on re-eval
		  this.transforms = [];
		  return this;
		},
		clk: function (rate) {	// ... comma separated rate args to clk. if one pat and multiple clk, clk that pat. need to address many to many mapping somehow eg 2 pat 3 clks ??
		  rate = rate || 4;
		  this.isPlaying = true;
		  this.rate = rate;
		  return this;
		},
		stop: function () {
		  this.isPlaying = false;
		  return this;
		},
		vary: function (transform, opts) {		// do we need any other opts than the condition ??
		  this.transforms.push({transform: transform, opts: opts});
		  return this;
		},
		every: function (num, transform) {
			this.vary(transform, { condition: function (t) { return t % num === 0 } });
			return this;
		},
		rarely: function (transform) {
			this.vary(transform, { condition: function (t) { return Math.random() < 0.05 } });
			return this;
		},
		sometimes: function (transform) {
			this.vary(transform, { condition: function (t) { return Math.random() < 0.2 } });
			return this;
		},
		often: function (transform) {
			this.vary(transform, { condition: function (t) { return Math.random() < 0.4 } });
			return this;
		},
		env: function (source) {			// probs does nothing when in midi mode ? can an adsr for Tone synth be translated into midi on/off/vel ?
		  // source = [a,d,s,r] // all 0-1
		  // source = ref to another pattern // how to implement ?
		  return this; // not sure if env should be here, maybe it's output-specific so should be part of the opts of the tone(), midi() and osc() functions
		},
		midi: function (port, channel) {
		  this.midiInfo.channel = channel || 1; // 0 ?
		  this.midiInfo.port = port;
		  return this; // or id ?
		},
		midicc: function (port, channel) {
		  this.channel = channel || 1; // 0 ?
		  this.port = port;
		  return this;
		},
		tone: function (synth, opts) {
		  this.tone.synth = synth;
		  this.tone.opts = Object.assign({}, this.tone.opts, opts);
		  return this;
		},
		osc: function (addr) {
		  // todo - get js osc lib
		  return this;
		}
	  }
	}

  var patterns = [];
  for(var i = 0; i < 4; i++) patterns.push(pattern());

  // todo - for
  var p0 = patterns[0], p1 = patterns[1], p2 = patterns[2], p3 = patterns[3], p4 = patterns[4], p5 = patterns[5], p6 = patterns[6], p7 = patterns[7];

  ///////// timing //////////

  var t = 0, timer;

  function run () {
    t++;  // or domhirestimestamp

    for(var i = 0; i < patterns.length; i++) {
		// if the pattern is playing and has changed this timestamp
      if(((t/patterns[i].rate)|0) !== (((t-1)/patterns[i].rate)|0) && patterns[i].isPlaying) {
        var val = patterns[i].get(t);
		// check the midi settings and output if set
        if(midi && midi.outputs.size) {
          _sendNoteOn(midi, patterns[i].midiInfo.port, clamp(val, 0, 127), 120);
          _sendNoteOff(midi, patterns[i].midiInfo.port, clamp(val, 0, 127));
        }
        if(patterns[i].tone.synth !== null) {
          patterns[i].tone.synth.triggerAttackRelease(scales[globalScale][24 + (val|0)], "8n");
        } else {
          console.log(val);
        }
      }
    }

    // window.requestAnimationFrame(run);
  }
  
  ///////// global utility funcs //////////

  var start = function() {
    // window.requestAnimationFrame(run);
    timer = setInterval(run, 4);
  }

  var stop = function () {
    clearInterval(timer);
  }
  
  var hush = function() {
    for(var i = 0; i < patterns.length; i++) {
		patterns[i].stop();
	}
  }
  
  ///////// expose API /////////

  // math
  clk.sin = Math.sin;
  clk.cos = Math.cos;
  clk.abs = Math.abs;

  // patterns / notes
  clk.notes = notes;
  clk.scale = scale;
  clk.p0 = p0;
  clk.p1 = p1;
  clk.p2 = p2;
  clk.p3 = p3;

  // Tone players
  Object.keys(tonePlayers).forEach(function(name) {
	clk[name] = tonePlayers[name];
  });

  // global / mechanical
  // clk.pat = pat;
  clk.startMidi = startMidi;
  clk.t = t;
  clk.start = start;
  // expose stop ?
  clk.hush = hush;

})(typeof window === 'undefined' ? clk : window)

/*

var p = (t) => {
  if(t % 4 === 0) return (t % 12);
  else return abs(sin(t/10))*14;
}
var pp = (t) => -1 + itera.perlinfunction(t, x => abs(sin(x/20)), [0.9,0.2,0.4,0.6]) * 12;

p0.pat((t) => p(t) + pp(t) - 12).clk(50).tone(pluck);
p1.pat((t) => p(t) + pp(t) - 12).clk(400).tone(duo);
p2.pat(pp).clk(100).tone(brane)

*/
