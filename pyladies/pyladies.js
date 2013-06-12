Chatrooms = new Meteor.Collection("chatrooms");
Messages = new Meteor.Collection("messages");


// Shared Methods
Meteor.methods({
  addMessage: function(message) {
    if (Meteor.isServer) {
      if (Meteor.user() && message) {
        Messages.insert({
          userId: this.userId,
          //TODO: Make this a user chosen name.
          username: Meteor.user(),
          message: message,
          timestamp: new Date(),
          chatroom: Meteor.user().chatroom
        });
        //console.log(Messages.find().fetch());
      }
    }
    if (Meteor.isClient) {
      if (!Meteor.user()) {
        alert("Please Sign-In first.");
      }
    }
  }
});

if (Meteor.isClient) {
  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });
  // Client only methods.
  Meteor.startup(function() {
    Deps.autorun(function() {
      if (Meteor.user()) {
        Meteor.subscribe("messages");
        Meteor.subscribe("currentChatroom", function() {
          $(".chatbox")[0].value = "Now chatting in " 
          + Chatrooms.findOne().name + ".\n";
        });
        Session.set("messages", Messages.find());
        //TODO start here
        //TODO make this work with multiple chatrooms
        Messages.find().observeChanges({
          added: function(id) {
            var message = Messages.findOne(id); 
            $(".chatbox")[0].value +="[" 
              + message.timestamp.toLocaleTimeString() 
              + "] " + message.username.username + ": " 
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
  });
}

if (Meteor.isServer) {
  // Publications
  Meteor.publish("messages", function() {
    return Messages.find({
      "chatroom._id": Meteor.users.findOne(this.userId).chatroom._id
      });
  });
  Meteor.publish("currentChatroom", function() {
    //TODO make this work with multiple chatrooms
    return Chatrooms.find(Meteor.users.findOne(this.userId).chatroom);
  });
  // Server Methods

  Meteor.startup(function () {
    // Init chatrooms:
    if (!Chatrooms.findOne({name: "pyladiessf"})) {
      Chatrooms.insert({
        name: "pyladiessf"
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
