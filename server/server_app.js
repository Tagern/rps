/**
 * Created by philippe_simpson on 01/10/15.
 */

"use strict";

/**
 * Module dependencies.
 */
var http = require('http');
var express = require('express');
var app = express();
var debug = require('debug')('rps:server');
app.use(express.static(__dirname + '/../browser/'));

// Define a port we want to listen to
const PORT = process.env.PORT || 8080; //changed from 8080

// We need a function which handles requests and send response

/**
 * Create HTTP server.
 */
var server = http.createServer(app);

app.get('/', function(req,res) {
    res.sendFile("/browser/index.html", {"root":__dirname+"../browser/"});
});
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});
server.on('error', onError);
server.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof PORT === 'string'
        ? 'Pipe ' + PORT
        : 'Port ' + PORT;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

/**
 * Initialize an instance of socket.io by passing the HTTP server object
 */
var io = require('socket.io')(server);

io.on('connection', function (socket) {
    // socket represents a client / individual user
    //console.log(socket.id, "connected");
    var session; // reference to session object

    socket.on('create', function(){ // when client wants to create a new game
        if(session) { // we somehow already have a session stored
            socket.emit('message', 'Something went wrong. Try again.');
        } else {
            session = new sessionManager(); // store a reference to session object for future use
            session.addPlayer(socket); //createPlayer(socket, session);
            socket.emit('waiting', session.getId());
        }
    });

    socket.on('join', function(sessionID){ // when client wants to join an existing game
        if(session) { // we somehow already have a session stored
            socket.emit('message', 'Something went wrong. Try again.');
        } else {
            session = new sessionManager(sessionID); // getSession(parseInt(sessionID)); // store a reference to session object for future use

            if(session.getId() && session.joinable()){ // session exists and is neither empty nor full.
                session.addPlayer(socket); // Add joining client

                // start game for both clients:
                session.getPlayers().forEach(function(element){
                    element.socket.emit('start');
                });
            } else {
                session = null; // break reference to session object
                socket.emit('message', 'Invalid game.');
            }
        }
    });

    socket.on('disconnect', function () { // a client disconnected - reset game state
        if(session) {
            var otherPlayer = session.getPlayers().find(function(element) {
                return (element.socket.id !== socket.id);
            });
            if(otherPlayer) otherPlayer.socket.emit('restart'); // restart other player

            session.close();
        }
    });

    socket.on('choice', function (val) {
        setChoice(session, socket, val);
        socket.emit('choice:confirmed', val);

        var otherPlayer = session.getPlayers().find(function(element) {
            return (element.socket.id !== socket.id);
        });
        otherPlayer.socket.emit('choice:confirmed');
    });

    socket.on('restart:done', function() {
        session = null; // break reference to session object
    });
});





























































/**
 * Game Logic
 */
var sessions = []; // global lookup for active sessions
var sessionIDCounter = 0;

var sessionManager = function (id) { // module for managing individual sessions
    var session;

    if(id){ // join an existing session
        var index = sessions.findIndex(function(element){
            return (element.id === parseInt(id));
        });
        session = sessions[index];
    } else { // create a new session from scratch
        sessionIDCounter++;
        session = {
            id: sessionIDCounter,
            round: 0,
            players: []
        };
        sessions.push(session);
    }

    function close(){
        // remove session entry from sessions array
        var index = sessions.findIndex(function(element) {
            return (element.id === session.id);
        });
        if(index > -1){
            sessions.splice(index, 1);
        }

        session = null;
    }

    function joinable(){
        return session.players.length === 1; // a session is only joinable if exactly _one_ player is waiting.
    }

    function player( socket ) {

        var player = {
            weapon: null,
            wins: 0,
            nrg: 2,
            socket: socket

        };
        // var x = {
        //     nrg: Math.clamp(value, 0, 100)
        // };

        //result.p1Energy = Math.clamp(value, 0, 100);

        session.players.push(player);
        
        

        
         

        return player;
    }
    

    function getAllPlayers(){
        return session.players;
    }

    function getSessionId(){
        return session ? session.id : false;
    }

    function round(){
        return session.round;
    }
    function incrementRound(){
        session.round = session.round + 1;
    }

    // Reveal public pointers to private functions and properties
    return {
        getId: getSessionId,
        close: close,
        addPlayer: player,
        getPlayers: getAllPlayers,
        joinable: joinable,
        getRound: round,
        incrementRound: incrementRound
    };
};

function setChoice(session, socket, val) {
    // find player, then assign weapon choice:
    var player = session.getPlayers().find(function(element) {
        //console.log("setChoice", element.socket.id, socket.id);
        return (element.socket.id === socket.id);
    });
    player.weapon = val;
    //console.log("setChoice()", socket,id, player.weapon);
    resolveDuel(session);
}

function fight(player1, player2){
    var weapon1 = player1.weapon,
        weapon2 = player2.weapon;

    // if(weapon1 === weapon2) return {msg: "you chose the same... "};

    // return result:


    if(weapon1 === "attack"){
        if(weapon2 === "shield"){

            return {attack_shielded: player1, p1msg: "You got blocked!", shielded_attack: player2, p2msg: "You blocked it!"};

        }
        if(weapon2 === "focus"){
            return {attack_hit: player1, p1msg: "You hit them, interupting their focus!", focus_hit: player2, p2msg: "Your were hit and your focus was interupted!"};

        }
        if(weapon2 === "attack"){
            return {attack_hit: player1, p1msg: "You both got hit!", attack_hit_also: player2, p2msg: "You both got hit!"};
        }
    }
    

    if(weapon1 === "shield"){
        if(weapon2 === "attack"){
            return {shielded_attack: player1, p1msg: "You blocked it!", attack_shielded: player2, p2msg: "You got blocked!"};
        }
        if(weapon2 === "focus"){
            return {shielded: player1, p1msg: "Your shield has no effect, they used focus.", focus: player2, p2msg: "You gained focus!"};
        }
        if(weapon2 === "shield"){
            return {shielded: player1, p1msg: "You both used shield!", shielded_also: player2, p2msg: "You both used shield!"};
        }
    }

    if(weapon1 === "focus"){
        if(weapon2 === "attack"){
            return {focus_hit: player1, p1msg: "Your were hit and your focus was interupted!", attack_hit: player2, p2msg: "You hit them, interupting their focus!"};
        }
        if(weapon2 === "shield"){
            return {focus: player1, p1msg: "You gained focus!", shielded_focus: player2, p2msg: "Your shield has no effect, they used focus."};
        }
        if(weapon2 === "focus"){
            return {focus: player1, p1msg: "You both gained focus!", focus_also: player2, p2msg: "You both gained focus!"};
        }
    }
}

function resolveDuel(session) {
    // get both players
    var player1 = session.getPlayers()[0],
        player2 = session.getPlayers()[1];

    if (player1.weapon && player2.weapon) {
        var result = fight(player1, player2);

    // if(nrg < 1){
    //     document.querySelector(".attack-icon").style.display == 'none';
    // }



    // if(nrg < 1){
    //     document.querySelector(".attack-icon").style.display == 'none';
    // }

    
   

    // ATTACKING 
        if(result.attack_hit){
            result.attack_hit.wins = result.attack_hit.wins + 17;
            result.attack_hit.nrg = result.attack_hit.nrg - 1;
            
            if(result.attack_hit.nrg < 1 ){
                result.attack_hit.nrg = result.attack_hit.nrg = 0;
            }
        }

        if(result.attack_hit_also){
            result.attack_hit_also.wins = result.attack_hit_also.wins + 17;
            result.attack_hit_also.nrg = result.attack_hit_also.nrg - 1;

            if(result.attack_hit_also.nrg < 1 ){
                result.attack_hit_also.nrg = result.attack_hit_also.nrg = 0;
            }
        }

        if(result.attack_shielded){
            result.attack_shielded.nrg = result.attack_shielded.nrg - 1;

            if(result.attack_shielded.nrg < 1 ){
                result.attack_shielded.nrg = result.attack_shielded.nrg = 0;
            }
        }




        // else tie

        //else tie


    // SHIELDING
        if(result.shielded){
        }

        if(result.shielded_also){
        }
        
        
        if(result.shielded_attack){
        }

    //RECHARGING
        if(result.focus_hit){
        }

        if(result.focus){
            result.focus.nrg = result.focus.nrg + 1;
        }

        if(result.focus_also){
            result.focus_also.nrg = result.focus_also.nrg + 1;
        }


result.winner.wins +15;
        // }



    // if (result.player1.wins.nrg <= 0){
    //     result.player1.wins.nrg = 0;
    // }
    // if (result.player2.wins.nrg <= 0){
    //     result.player2.wins.nrg = 0;
    // }
       
        

        //else tie
    
        session.incrementRound();

        session.getPlayers().forEach(function(element){
            // Try sending the object as a whole:

            var data = {
                round: session.getRound(),
                p1Id: player1.socket.id,
                p1Wins: player1.wins,
                p1Weapon: player1.weapon,
                p2Id: player2.socket.id,
                p2Wins: player2.wins,
                p1Energy: player1.nrg,
                p2Energy: player2.nrg,
                p2Weapon: player2.weapon,
                // resultMessage: result.msg,
                p1Message: result.p1msg,
                p2Message: result.p2msg,
                test: result.nrg,

                winnerId: result.winner ? result.winner.socket.id : null
            };
           element.socket.emit('result', data /*player1, player2, result, session.round*/);
            //element.socket.broadcast.emit('result', data /*player1, player2, result, session.round*/);
            

        });

        player1.weapon = player2.weapon = null; // reset weapon choices

        // // wait and emit reset
        // setTimeout(function() {
        //     reset(session);
        // }, 5500)
    }
}

function reset(session){ // tell connected clients of session to reset UI for a new round
    session.getPlayers().forEach(function(element){
        element.socket.emit('reset');
    });
}