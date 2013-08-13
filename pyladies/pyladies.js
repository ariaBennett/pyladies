Chatrooms = new Meteor.Collection("chatrooms");
Messages = new Meteor.Collection("messages");
Code = new Meteor.Collection("code");


// Shared Methods
Meteor.methods({
  addMessage: function(message) {
    if (Meteor.isServer) {
      if (Meteor.user() && message) {
        Messages.insert({
          userId: this.userId,
          //TODO: Make this a user chosen name.
          username: Meteor.user().username,
          message: message,
          timestamp: new Date(),
          chatroom: Meteor.user().chatroom
        });
        //console.log(Messages.find().fetch());
      }
    }
    // Handle attempts to chat when no user is detected.
    if (Meteor.isClient) {
      if (!Meteor.user()) {
        alert("Please Sign-In first.");
      }
    }
  },

  updateCode: function(code) {
    if (Meteor.isServer) {
      Code.update(code._id, {$set: {code: code.code}});
      console.log(Code.find().fetch())
    }
  }
});

if (Meteor.isClient) {
  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });
  // Client only methods.
  Meteor.startup(function() {
    // Executes specified python code
    function runSkulpt() {
      // output functions are configurable. This one just appends some text
      // to a pre element.
      function outf(text) {
        var mypre = document.getElementById("skulptOutput");
        mypre.innerHTML = mypre.innerHTML + text;
      }
      function builtinRead(x) {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
          throw "File not found: '" + x + "'";
        }

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
        try {
          Sk.importMainWithBody("<stdin>", false, prog);
        }
        catch (err) {
          outf(err.tp$str().v);
        }
      } 
      runit();
    }
    //TODO ensure autorun isn't unnecessary 
    Deps.autorun(function() {
      if (Meteor.user()) {
        Meteor.subscribe("messages");
        Meteor.subscribe("code");
        Meteor.subscribe("currentChatroom", function() {
          $(".chatbox")[0].value = "Now chatting in " 
          + Chatrooms.findOne().name + ".\n";
        });
        Session.set("messages", Messages.find());
        Session.set("code", Code.findOne());
        //TODO start here
        //TODO make this work with multiple chatrooms
        if (Code.findOne()) {
          $(".skulptbox")[0].value = Session.get('code').code;
        }
        Messages.find().observeChanges({
          added: function(id) {
            var message = Messages.findOne(id); 
            $(".chatbox")[0].value +="[" 
              + message.timestamp.toLocaleTimeString() 
              + "] " + message.username + ": " 
              + message.message + "\n";
            $(".chatbox")[0].scrollTop = $(".chatbox")[0].scrollHeight;
          }
        });
      }
    });
    // Pressing enter straight in input box
    $(".chatInput").keypress(function (event) {
      if (event.keyCode === 13) {
        Meteor.call("addMessage", 
          $(".chatInput")[0].value);
          $(".chatInput")[0].value = "";
      }
    });
    // Using the send button
    // enter
    $("#chatInputSendButton").keypress(function (event) {
      if (event.keyCode === 13) {
        Meteor.call("addMessage", 
          $(".chatInput")[0].value);
          $(".chatInput")[0].value = "";
      }
    });
    // click 
    $("#chatInputSendButton").click(function (event) {
      Meteor.call("addMessage", 
        $(".chatInput")[0].value);
        $(".chatInput")[0].value = "";
    });
    // run button
    // enter
    $("#skulptInputRunButton").keypress(function (event) {
      if (!Meteor.user()) {
        alert("Please Sign-In first.");
      }
      else if (event.keyCode === 13) {

        tmpCode = Session.get('code');
        tmpCode.code = $(".skulptbox")[0].value;
        Session.set('code', tmpCode);
        Meteor.call('updateCode', Session.get('code'));
        runSkulpt();
      }
    });
    // click 
    $("#skulptInputRunButton").click(function (event) {
      if (!Meteor.user()) {
        alert("Please Sign-In first.");
      }
      else {
        tmpCode = Session.get('code');
        tmpCode.code = $(".skulptbox")[0].value;
        Session.set('code', tmpCode);
        Meteor.call('updateCode', Session.get('code'));
        runSkulpt();
      }
    });
  });
}

if (Meteor.isServer) {
  // Publications
  Meteor.publish("messages", function() {
    if (this.userId) {
      return Messages.find({
        "chatroom._id": Meteor.users.findOne(this.userId).chatroom._id
      });
    }
  });
  Meteor.publish("currentChatroom", function() {
    if (this.userId) {
      //TODO make this work with multiple chatrooms
      return Chatrooms.find(Meteor.users.findOne(this.userId).chatroom);
    }
  });
  // code
  Meteor.publish("code", function() {
    if (this.userId) {
      return Code.find({
        "chatroomId": Meteor.users.findOne(this.userId).chatroom._id
      });
    }
  });


  // Server Methods

  Meteor.startup(function () {
    // Init chatrooms:
    if (!Chatrooms.findOne({name: "pyladiessf"})) {
      var chatroomId = Chatrooms.insert({
        name: "pyladiessf"
      });
      Code.insert({
        code: "print \"Hello World\"",
        chatroomId: chatroomId
      });
    }
  });


  Accounts.onCreateUser(function(options, user) { 
    // Server Accounts Config
    if (options.profile) {
      user.profile = options.profile;
    }
    var chatroom = Chatrooms.findOne({name: "pyladiessf"});
    user.chatroom = {};
    user.chatroom._id = chatroom._id;
    user.chatroom.name = chatroom.name;
    return user;
  });
}
