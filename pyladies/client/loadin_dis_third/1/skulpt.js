Meteor.startup(function() {
  Deps.autorun(function() {
    if (Meteor.user()) {
      // output functions are configurable. This one just appends some text
      // to a pre element.
      function outf(text) {
        var mypre = document.getElementById("skulptOutput");
        mypre.innerHTML = mypre.innerHTML + text;
      }
      function builtinRead(x) {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
        throw "File not found: '" + x + "'";
        return Sk.builtinFiles["files"][x];
      }
       
      // Here's everything you need to run a python program in skulpt
      // grab the code from your textarea
      // get a reference to your pre element for output
      // configure the output function
      // call Sk.importMainWithBody()
      function runit() {
        var prog = document.getElementsByClassName("skulptbox")[0].value;
        var mypre = document.getElementById("skulptOutput");
        mypre.innerHTML = "";
        Sk.canvas = "skulptCanvas";
        Sk.pre = "skulptOutput";
        Sk.configure({output:outf, read:builtinRead});
        Sk.importMainWithBody("<stdin>", false, prog);
      } 
      runit();
    }
  });
});
