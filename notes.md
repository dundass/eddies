  # pattern table feature
  
  a table view at the bottom of the screen that updates as each active pattern progresses in time
  
  helps to view the evolution of the music for performer and audience
  
  auto scaling for the axes as the minima/maxima change
  
  see commit #231fa61 for an example table in index.html

  # sending objects as synth param args
  
  ok, so
  ```
  p0.pat([0,1,2]).clk(4).tone(mono, {cutoff:[], vol: 0.8, detune: logistic})
  ```
  an object can be sent to a call to tone after the synth object arg where u can control other aspects of the synth a la foxdot
  
  the values for these params can be supplied as a Number, an Array or a function, logistic() in the example above
  this can be achieved by duplicating the functionality of pat() by making an internal parsePattern function that pattern.get() calls as well as any other param location
  
  rather than doing it the foxdot way where a param's value is frozen once the note is played, 
  allow the patterns supplied to synth params be evaluated at all times, changing the value after a note is initiated
  
  # funcs that can be part of a chain and args within the chain
  
  try to make it so that any func u can use to form a chain can be sent in as arguments to those funcs eg to .vary(). when used in a chain.
  
  obv there will be exceptions, mostly at the start and end of the chain, but this makes me question the purpose of each chain func:
  
  can be used as both chain and arg:
  
  
  can't be used as an arg:
  pat = to act as the generator for the pattern
  clk = starts playing the pattern at the specified rate
  vary = to specify how a pattern changes (as 2 funcs, one for applying mutation, one specifying when to do it - a condition)
  tone = 
  midi = 
  every
  often
  sometimes
  
  can't be used in a chain:
  logistic
  
  markov ?? see below
  
  maybe it's best to only allow a few to b multipurpose
  
  # markov chain feature
  
  markov 
  
  there will be markov() as part of a chain, 'markov' that can be sent to functions (are they the same func?) 
  actually does it make sense to have markov() as part of a chain, as a generator ? or as an argument to pat(), so a markov() that returns a function ? 
  
  but will also have a global markov(), where u can send mappings of pattern to pattern, eg:
  ```
  markov({
	  'p0': ['p1', 'p2'],
	  'p1': 'p2',
	  'p2': ['p1', 'p1', 'p0']
  })
  ```
  so does that mean when a func is clocked, it has a chance of clocking the other funcs, as well as its own ? instead of its own ?? hmmm
  
  # pattern becoming another pattern within vary()
  
  how do i make it so u can do:
  ```
  p0.pat([0,2,3]).clk(2).tone(am)
  
  p1.pat(5).clk(8).vary(p0.get, (t) => t % 100 < 10).tone(pluck) ?
  ```
  currently .get uses internal rate for the pattern that owns it, so maybe rate has to be a parameter sent in ?? and use the transforming pattern's rate ?
  
  would it be a coded-in exception to the rule ? or another param sent into all transforms ? but probs wouldn't make sense to any other transform rly ...

  # web audio modules feature
  
  feature addition: web audio modules https://www.webaudiomodules.org/developers/api-embed/
  ```
  <script src="http://webaudiomodules.org/api/wams.min.js"></script>
  <script src="http://webaudiomodules.org/synths/webdx7/wam-webdx7.min.js"></script>
  
  var actx = new AudioContext();
   var dx7  = new DX7();
   dx7.init(actx,256).then(function (controller)
   {
      dx7.connect(actx.destination);
   });
   
  ```
   or more likely, pass in the tonejs actx
  
  # graphic editor interface
  
  include not only node graph but graphical programming interface that can be used as an alternative for non-text based musicians
  
  can alter the size of each window and the other box will shrink responsively to accommodate your desired style of mixing text with graphic
  
  maybe if split down the middle then the code lines on the left could line up with the corresponding pattern on the graphical ui on the right
  
  as u scroll or add new lines, they stay in line w each other, the graphic and the corresponding code
  
  also have the current unimplemented 'moving window' graph representation of recent (+future?) values on either side of the left, mid or right
  
  # initial problem with the pattern chaining method
  
  you can no longer make a common pattern eg:
  ```
  var patt = pat([0,1,2,5]).clk(16)

  patt.vary(x => 'sutin').midi('Saffire-6USB')
  patt.vary(x => x % 10 === 0, {every:4}).tone(synth)
  ```
  therefore, can contain some kind of node tree
  that branches off when you split the chain to another destination
  somehow, it keeps track of where this branch occurred
  if you call cut() or sever() at any point in the branch of chain,
  it removes that chain from the branching node

  to help visualise, there's a box in the bottom right
  that contains a pictorial representation of this node tree (left to right)
  that updates as your cursor moves from line to line,
  highlighting the branch that the current line is on, if chain is split.
  
  or just do:
  ```
  p0.pat([0,1,2]).clk(4).tone(bleep)
  p1.pat(p0).clk(20).tone(am)
  ```
  
  there's also trouble with the method of routing patterns to multiple destinations
  maybe at the end of the chain, use a dest() method, that takes an object
  each ky of the object is a destination name, and the value is the specifics eg:
  .dest({
    "midi": "Saffire 6USB",
    "tone": amSynth,
  })

  but then how to control multiple aspects of the same Tone.synth ? v easy in FD ...
  
  