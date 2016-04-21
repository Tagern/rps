/**
 * Created by philippe_simpson on 01/10/15.
 */
"use strict";


//var url = 'https://quiet-beyond-3424.herokuapp.com/';
var socket = io();

// views
var frontView = document.querySelector('#frontView');
var waitView = document.querySelector('#waitView');
var gameView = document.querySelector('#gameView');

var consoleEl = document.querySelector('#messages');
var scoreYouEl = document.querySelector('#scoreYou');
var scoreOppEl = document.querySelector('#scoreOpponent');

var yourEnergy = document.querySelector('#energyYou');
var opponentsEnergy = document.querySelector('#energyOpponent');

var roundEl = document.querySelector('#round');

var resultEl = document.querySelector('#result');

var selectorEl = document.querySelector('#weapon-selector');

var selectorHeader1 = document.querySelector('#make-your-move');
var selectorHeader2 = document.querySelector('#waiting-for-opponent');

var weaponChosenYou = document.querySelector('#weaponYou');
var weaponChosenOpp = document.querySelector('#weaponOpponent');

var btnStart = document.querySelector('#start');
btnStart.addEventListener('click', createGame);

var btnAttack = document.querySelector('#attack');
btnAttack.addEventListener('click', on_Attack);

var btnAttack_empty = document.querySelector('#attack-empty');
btnAttack_empty.addEventListener('click', on_Empty);

var btnShield = document.querySelector('#shield');
btnShield.addEventListener('click', on_Shield);

var btnFocus = document.querySelector('#focus');
btnFocus.addEventListener('click', on_Focus);

var btnFocus = document.querySelector('#your-smash');
btnFocus.addEventListener('click', on_Smash);

function createGame(){
    socket.emit('create');
}

function on_Attack() {
    socket.emit('choice', "attack");
}
function on_Empty(){
    alert("Fuck!!!!");
}
function on_Shield() {
    socket.emit('choice', "shield");
}
function on_Focus() {
    socket.emit('choice', "focus");
}
function on_Smash() {
    socket.emit('choice', "smash");
}

function getImage(weapon) {
    var el;
    switch (weapon) {
        case "attack":
            el = '<img src="images/attack-icon.png" >';
            break;
        case "shield":
            el = '<img src="images/shield-icon.png" >';
            break;
        case "focus":
            el = '<img src="images/recharge-icon.png" >';
            break;
        default:
            el = '<img style="transform: scaleX(1);" src="images/question-mark.png" >';
    }
    return el;
}

function reset(){ // reset UI between rounds
    weaponChosenYou.innerHTML = '';
    weaponChosenOpp.innerHTML = '';
    resultEl.innerHTML = '';
    selectorEl.setAttribute('class', ''); // show
    document.querySelector("#weapon-selector").style.display='block'; //weapon-selector show
    document.querySelector("#weapons-list").style.display='block'; //weapons show

}

function countDown(){
    return new Promise(function(resolve, reject) {

        var iterator = function*(){ // Generator iterator
            yield "bow";
            yield "grimace";
            yield "fight!";
        }();

        function iterate(){
            var count = iterator.next();
            if(!count.done){
                resultEl.innerHTML = '<h1>' + count.value + '</h1>';
                setTimeout(iterate, 500);
            } else {
                resolve();
            }
        }

        iterate();
    });
}

socket.on('connect', function(){
    var session = getUrlVars()["session"];
    if(session){ // we have been invited to a game, let's join it.
        socket.emit('join', session);
    }
});

socket.on('reset', function(){
    
    reset();
});

socket.on('message', function(msg){
    consoleEl.innerHTML = msg;
});

socket.on('restart', function(){ // opponent disconnected, return to start screen
    alert("Opponent fled.");
    gameView.setAttribute('class', 'hide'); // hide
    waitView.setAttribute('class', 'hide'); // hide
    scoreYouEl.innerHTML = 0;
        if (scoreYouEl.innerHTML <= 0){
            scoreYouEl.innerHTML = 0;
        }
    scoreOppEl.innerHTML = 0;
        if (scoreOppEl.innerHTML <= 0){
            scoreOppEl.innerHTML = 0;
        }
    roundEl.innerHTML = 0;
    reset();
    frontView.setAttribute('class', ''); // show
    socket.emit('restart:done');
});

socket.on('waiting', function(sessionID){ // we're ready, let's wait for opponent
    consoleEl.innerHTML = '';
    frontView.setAttribute('class', 'hide'); // hide
    waitView.setAttribute('class', ''); // show
    var el = waitView.querySelector('.invite-url');
    el.innerHTML = "<h4>" + window.location.protocol + "//" + window.location.host + window.location.pathname + "?session=" + sessionID + "</h4>";
});

socket.on('start', function(){ // both clients are ready, let the game begin
    frontView.setAttribute('class', 'hide'); // hide
    waitView.setAttribute('class', 'hide'); // hide
    gameView.setAttribute('class', ''); // show
});

socket.on('choice:confirmed', function(weapon){
    if(weapon){ // user You
        weaponChosenYou.innerHTML = getImage(weapon);
        selectorHeader1.style.display='none';  // hide
        selectorHeader2.style.display='block'; // show.
        document.querySelector("#weapons-list").style.display='none';
        
    } else { // opponent
        weaponChosenOpp.innerHTML = getImage();
    }
});

socket.on('result', function(data){
    document.querySelector("#weapon-selector").style.display='none';
    countDown().then(function(){
        showResult(data);
    });
});

function showResult(result){
    
    // Expected result data format:
    // {
    //     round: session.round,
    //     p1Id: player1.socket.id,
    //     p1Wins: player1.wins,
    //     p1Weapon: player1.weapon,
    //     p2Id: player2.socket.id,
    //     p2Wins: player2.wins,
    //     p2Weapon: player2.weapon,
    //     resultMessage: result.msg,
    //     winnerId: result.winner ? result.winner.socket.id : null
    // };
    
    //document.querySelector("#weapons-list").style.display='block';
    selectorHeader1.style.display='block'; // show.
    selectorHeader2.style.display='none'; // hide


    if(result.p1Id === socket.id){ // you
        scoreYouEl.innerHTML = result.p2Wins+"%";
        scoreOppEl.innerHTML = result.p1Wins+"%";

        opponentsEnergy.innerHTML = result.p2Energy;
        yourEnergy.innerHTML = result.p1Energy;

            setTimeout(function(){
            resultEl.innerHTML = result.p1Message;

            }, 1000);

        var eneryTest = result.p1Energy;

// HIDE AND SHOW ATTACK ICON FOR PLAYER 1
    if(eneryTest == 0){
        // document.querySelector(".attack-icon").classList.add("hide");
        document.querySelector(".attack-icon").style.visibility='hidden';
        document.querySelector(".attack-icon-empty").style.display='block';
    }
    else{
       // document.querySelector(".attack-icon").classList.remove("hide");   
        document.querySelector(".attack-icon").style.visibility='visible';
        document.querySelector(".attack-icon-empty").style.display='none';
    }

// HIDE AND SHOW SMASH ATTACK FOR PLAYER 1
    if(result.p1Wins > 0){
        document.querySelector(".your-smash").style.display='block'; 
    }

// HIDE AND SHOW SMASH ATTACK FOR PLAYER 2 (OPPONENT)
    if(result.p2Wins > 0){
        document.querySelector(".opponents-smash").style.display='block';

    }


    document.querySelector('#weaponOpponent').innerHTML = getImage(result.p2Weapon);

    } else { // opponent
        scoreOppEl.innerHTML = result.p2Wins+"%";
        scoreYouEl.innerHTML = result.p1Wins+"%";

        opponentsEnergy.innerHTML = result.p1Energy;
        yourEnergy.innerHTML = result.p2Energy;

        setTimeout(function(){
        resultEl.innerHTML = result.p2Message;

        }, 1000);

        var energyTest2 = result.p2Energy;


// HIDE AND SHOW ATTACK ICON FOR PLAYER 2
        if(energyTest2 == 0){
            document.querySelector(".attack-icon").style.visibility='hidden';
            document.querySelector(".attack-icon-empty").style.display='block';
        }
        else{  
            document.querySelector(".attack-icon").style.visibility='visible';
            document.querySelector(".attack-icon-empty").style.display='none';
        }

// HIDE AND SHOW SMASH ATTACK FOR PLAYER 2 (YOU)
            if(result.p2Wins > 0){
                document.querySelector(".your-smash").style.display='block';

            }

// HIDE AND SHOW SMASH ATTACK FOR PLAYER 1(OPPONENT)

            if(result.p1Wins > 0){
                document.querySelector(".opponents-smash").style.display='block'; 
            }




        document.querySelector('#weaponOpponent').innerHTML = getImage(result.p1Weapon);
    }


    setTimeout(function(){
       roundEl.innerHTML = result.round;
      }, 3500);

    

    // var msg = result.resultMessage;
    // if(result.winnerId){
    //     msg = msg + (result.winnerId === socket.id ? '<h2 class="win"></h2>' : '<h2 class="lose"></h2>');
    // }

    // yourMsg.innerHTML = p1msg;
    // opponentsMsg.innerHTML = p2msg;
    
    

    // setTimeout(function(){
    //      resultEl.innerHTML = msg;
    //  }, 1000);

}


function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
        function(m,key,value) {
            vars[key] = value;
        });
    return vars;
}

// OUR JAVASCRIPT

