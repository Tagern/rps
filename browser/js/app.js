/**
 * Created by philippe_simpson on 01/10/15.
 */
"use strict";


//var url = 'https://quiet-beyond-3424.herokuapp.com/';
var socket = io();

// views
var fullContainer = document.querySelector('.container');

var frontView = document.querySelector('#frontView');
var waitView = document.querySelector('#waitView');
var gameView = document.querySelector('#gameView');

var consoleEl = document.querySelector('#messages');
var scoreYouEl = document.querySelector('#scoreYou');
var scoreOppEl = document.querySelector('#scoreOpponent');

var yourEnergy = document.querySelector('#energyYou');
var opponentsEnergy = document.querySelector('#energyOpponent');

var YouenergyBar = document.querySelector("#energyBar1");
var OppenergyBar = document.querySelector("#energyBar2");

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

// THIS USES THE SAME VARIABLE! CHECK TO SEE IF THAT IS CAUSING PROBLEMS!!!

var btnFocus = document.querySelector('#your-smash');
btnFocus.addEventListener('click', on_Smash);

// AUDIO

var introSound = new Audio('../audio/8_bit_intro_voice.mp3');
var smashSound = new Audio('../audio/smash_activated.mp3');
var attackSound = new Audio('../audio/attack.mp3');
var shieldSound = new Audio('../audio/shield.mp3');
var focusSound = new Audio('../audio/focus.mp3');
var smashMoveSound = new Audio('../audio/smash.mp3');

var song = new Audio('../audio/8_bit_battle.mp3');

// var btnBothClicker = document.querySelector('#show-clicker');
// btnBothClicker.addEventListener('click', bothClicker);

function createGame(){
    socket.emit('create');
}

function on_Attack() {
    socket.emit('choice', "attack");
    attackSound.play();
}
function on_Empty(){
    alert("You need to focus!");
}
function on_Shield() {
    socket.emit('choice', "shield");
    shieldSound.play();
}
function on_Focus() {
    socket.emit('choice', "focus");
    focusSound.play();
}
function on_Smash() {
    socket.emit('choice', "smash");
    smashMoveSound.play();
}
function sendClickConfirmation(clickerCount) {
    socket.emit("confirmation", clickerCount);
}



// function bothClicker(){
//     if(result.p1Id === socket.id){
//         document.querySelector('.clicker-message-container').style.display='none'; 
//         document.querySelector('.the-clicker').style.display='block'; 
//         document.querySelector('.player1-clicker').style.display='block';         
//     }
//     else{
//         document.querySelector('.clicker-message-container').style.display='none'; 
//         document.querySelector('.the-clicker').style.display='block'; 
//         document.querySelector('.player2-clicker').style.display='block';    
//     }
// }

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
        case "smash":
            el = '<img src="images/smash-icon.png" >';
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
    
    p1Smash = 0;
    p2Smash = 0;

}

function countDown(){
    return new Promise(function(resolve, reject) {

        var iterator = function*(){ // Generator iterator
            yield "8";
            yield "BIT";
            yield "BATTLE!";
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
    alert("Wanna start another game?");
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

    song.play();
    song.volume = 0.2;
    song.loop = true;
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

socket.on('confirmation', function(data) {
    data = JSON.parse(data);
    if(data.winner == true && data.smashCount > 0) {
        //PLAYER WINS AND WAS SMASHER
        document.querySelector(".winScreen").style.display='block';
        console.log("you win!");
    } else if (data.winner == true && data.smashCount < 1) {
        //PLAYER WINS AND WAS SMASHEE
        console.log("YOU BEAT THEM IN THE CLICKER!");
        
        document.querySelector(".smasher-not-win").style.display='block';
        document.querySelector(".smasher-not-win").innerHTML="Smash was defended! You were not defeated!";
        document.querySelector(".clicker-results").style.display='none';

        setTimeout(function(){
            document.querySelector(".smasher-not-win").style.display='none';
            document.querySelector(".clicker-container").style.display='none';
            document.querySelector("#result").style.display='block';

            reset();
        }, 3000);

    } else if(data.winner == false && data.smashCount > 0) {
        //PLAYER LOSES AND SMASHER
        console.log("THEY BEAT YOU IN THE CLICKER!");

        document.querySelector(".smasher-not-win").style.display='block';
        document.querySelector(".smasher-not-win").innerHTML="Too slow! Opponent was not defeated!";
        document.querySelector(".clicker-results").style.display='none';



        setTimeout(function(){
            document.querySelector(".smasher-not-win").style.display='none';
            document.querySelector(".clicker-container").style.display='none';
            document.querySelector("#result").style.display='block';

            reset();
        }, 3000);


    } else if(data.winner == false && data.smashCount < 1) {
        //PLAYER LOSES AND SMASHEE
        document.querySelector(".loseScreen").style.display='block';
        console.log("you lose");

    } else if (data == 'draw') {
        alert("cancels everything - back to game, no damage");

        document.querySelector(".clicker-container").style.display='none';
        
        reset();
    }
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

    if(result.p1Wins > 150 || result.p2Wins > 150){
        hideGame();
        showWin();
    }



///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

//                                      YOU                                      //

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

    if(result.p1Id === socket.id){ // you
        scoreYouEl.innerHTML = result.p2Wins+"%";
        scoreOppEl.innerHTML = result.p1Wins+"%";

        // opponentsEnergy.innerHTML = result.p2Energy;
        // yourEnergy.innerHTML = result.p1Energy;

            setTimeout(function(){
            resultEl.innerHTML = result.p1Message;

            }, 1000);

        var energyTest = result.p1Energy;
        var energyTest2 = result.p2Energy;


// PLAYER 1 YOUR NRG BAR UPDATER
        if(energyTest == 0){
            YouenergyBar.value = YouenergyBar.value="0";
        }
        if(energyTest == 1){
            YouenergyBar.value = YouenergyBar.value="20";
        }
        if(energyTest == 2){
            YouenergyBar.value = YouenergyBar.value="40";
            //try to style the progress bar - so it changes color depending on value...

            //document.querySelector("#energyBar1[value]::-webkit-progress-bar").style.display='none';
        }
        if(energyTest == 3){
            YouenergyBar.value = YouenergyBar.value="60";
        }
        if(energyTest == 4){
            YouenergyBar.value = YouenergyBar.value="80";
        }
        if(energyTest == 5){
            YouenergyBar.value = YouenergyBar.value="100";
        }

// PLAYER 1 OPPONENTS NRG BAR UPDATER
        if(energyTest2 == 0){
            OppenergyBar.value = OppenergyBar.value="0";
        }
        if(energyTest2 == 1){
            OppenergyBar.value = OppenergyBar.value="20";
        }
        if(energyTest2 == 2){
            OppenergyBar.value = OppenergyBar.value="40";
        }
        if(energyTest2 == 3){
            OppenergyBar.value = OppenergyBar.value="60";
        }
        if(energyTest2 == 4){
            OppenergyBar.value = OppenergyBar.value="80";
        }
        if(energyTest2 == 5){
            OppenergyBar.value = OppenergyBar.value="100";
        }


// HIDE AND SHOW ATTACK ICON FOR PLAYER 1
    if(energyTest == 0){
        // document.querySelector(".attack-icon").classList.add("hide");
        document.querySelector(".attack-icon").style.visibility='hidden';
        document.querySelector(".attack-icon-empty").style.display='block';
    }
    else{
       // document.querySelector(".attack-icon").classList.remove("hide");   
        document.querySelector(".attack-icon").style.visibility='visible';
        document.querySelector(".attack-icon-empty").style.display='none';
    }




if (result.p1Wins && result.p1Smash > 0){

        document.querySelector("#result").style.display='none';

            document.querySelector(".clicker-container").style.display='block';
            document.querySelector(".clicker-message-container").style.display='block';
            document.querySelector(".clicker-message").style.display='block';
            document.querySelector("#show-clicker").style.display='block';
            document.querySelector(".clicker-results").style.display='none';
            document.querySelector(".clicker-ticker h2").style.display='none';

            document.querySelector(".clicker-message").innerHTML="The smash hit! Tap to win!";


}

if (result.p2Wins && result.p2Smash > 0){

        document.querySelector("#result").style.display='none';

            document.querySelector(".clicker-container").style.display='block';
            document.querySelector(".clicker-message-container").style.display='block';
            document.querySelector(".clicker-message").style.display='block';
            document.querySelector("#show-clicker").style.display='block';
            document.querySelector(".clicker-results").style.display='none';
            document.querySelector(".clicker-ticker h2").style.display='none';

            document.querySelector(".clicker-message").innerHTML="Their smash hit! Tap to defend yourself!";

}
else {

}

document.querySelector('#show-clicker').onclick = function(){
    document.querySelector('#show-clicker').style.display='none'; 
    p1smashCountDown();
      
}

var p1count = 0;
document.querySelector('.player1-clicker').onclick = function() {
   p1count++;
};



function p1smashCountDown(){
        var iterator2 = function*(){ // Generator iterator
            yield "READY";
            yield "SET";
            yield "BUTTON BASH!";
        }();

        function iterate2(){
            var count2 = iterator2.next();
            if(!count2.done){
                document.querySelector('.clicker-message').innerHTML = '<h2>' + count2.value + '</h2>';
                setTimeout(iterate2, 600);
            }else{       
                showp1clicker();
                p1ClickTimer();
            }
        }
        iterate2();
}

function showp1clicker(){
    document.querySelector('.clicker-message-container').style.display='none'; 
    document.querySelector('.the-clicker').style.display='block'; 
    document.querySelector('.player1-clicker').style.display='block';  
}

function p1ClickTimer(){

        var iterator4 = function*(){ // Generator iterator
            yield "5";
            yield "4";
            yield "3";
            yield "2";
            yield "1";
            yield "TIME UP!";
        }();

        function iterate4(){
            var count4 = iterator4.next();
            if(!count4.done){

                document.querySelector('.clicker-message').innerHTML = '<h1>' + count4.value + '</h1>';

                document.querySelector('.clicker-ticker').innerHTML = '<h2>' + count4.value + '</h2>';
                console.log("ITERATE");
                setTimeout(iterate4, 500);
            } else{   
                p1ClickerResults();
             
            }
        }

        iterate4();
}



function p1ClickerResults(){
    document.querySelector('.clicker-results').style.display='block'; 
    document.querySelector('.clicker-results').innerHTML = "Waiting for opponent";
    document.querySelector('.the-clicker').style.display='none';  
    sendClickConfirmation(p1count); //SEND CONFIRMATION + AMOUNT OF CLICKS TO OTHER PLAYER
}


// SHOW SMASH ATTACK FOR PLAYER 1
    if(result.p1Wins >= 0 && result.p1Energy >= 2){

        setTimeout(function(){
            document.querySelector(".your-smash").style.display='block'; 
            smashSound.play();

        }, 3000);

    }
    else{
        document.querySelector(".your-smash").style.display='none';         
    }


// SHOW SMASH ATTACK FOR PLAYER 2 (OPPONENT)
    if(result.p2Wins > 0 && result.p2Energy >= 2){
        document.querySelector("#opponents-smash").style.display='block';
    }
    else{
        document.querySelector("#opponents-smash").style.display='none';      
    }

// WIN GAME IF % IS OVER CERTAIN AMOUNT
    if(result.p1Wins > 170){
        document.querySelector(".winScreen").style.display='block';
    }
    else if(result.p2Wins > 170){
        document.querySelector(".loseScreen").style.display='block';
    } 


///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

//                                OPPONENT                                      //

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////



    document.querySelector('#weaponOpponent').innerHTML = getImage(result.p2Weapon);

    } else { // opponent
        scoreOppEl.innerHTML = result.p2Wins+"%";
        scoreYouEl.innerHTML = result.p1Wins+"%";

        // opponentsEnergy.innerHTML = result.p1Energy;
        // yourEnergy.innerHTML = result.p2Energy;

        setTimeout(function(){
        resultEl.innerHTML = result.p2Message;

        }, 1000);

        var energyTest = result.p1Energy;
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


// PLAYER 2 YOUR NRG BAR UPDATER
        if(energyTest2 == 0){
            YouenergyBar.value = YouenergyBar.value="0";
        }
        if(energyTest2 == 1){
            YouenergyBar.value = YouenergyBar.value="20";
        }
        if(energyTest2 == 2){
            YouenergyBar.value = YouenergyBar.value="40";
        }
        if(energyTest2 == 3){
            YouenergyBar.value = YouenergyBar.value="60";
        }
        if(energyTest2 == 4){
            YouenergyBar.value = YouenergyBar.value="80";
        }
        if(energyTest2 == 5){
            YouenergyBar.value = YouenergyBar.value="100";
        }


// PLAYER 2 OPPONENTS NRG BAR UPDATER
        if(energyTest == 0){
            OppenergyBar.value = OppenergyBar.value="0";
        }
        if(energyTest == 1){
            OppenergyBar.value = OppenergyBar.value="20";
        }
        if(energyTest == 2){
            OppenergyBar.value = OppenergyBar.value="40";
        }
        if(energyTest == 3){
            OppenergyBar.value = OppenergyBar.value="60";
        }
        if(energyTest == 4){
            OppenergyBar.value = OppenergyBar.value="80";
        }
        if(energyTest == 5){
            OppenergyBar.value = OppenergyBar.value="100";
        }





if (result.p1Wins && result.p1Smash > 0){

        document.querySelector("#result").style.display='none';

            document.querySelector(".clicker-container").style.display='block';
            document.querySelector(".clicker-message-container").style.display='block';
            document.querySelector(".clicker-message").style.display='block';
            document.querySelector("#show-clicker").style.display='block';
            document.querySelector(".clicker-results").style.display='none';
            document.querySelector(".clicker-ticker h2").style.display='none';

            document.querySelector(".clicker-message").innerHTML="Their smash hit! Tap to defend yourself!";

}
else {

}

if (result.p2Wins && result.p2Smash > 0){

        document.querySelector("#result").style.display='none';

            document.querySelector(".clicker-container").style.display='block';
            document.querySelector(".clicker-message-container").style.display='block';
            document.querySelector(".clicker-message").style.display='block';
            document.querySelector("#show-clicker").style.display='block';
            document.querySelector(".clicker-results").style.display='none';
            document.querySelector(".clicker-ticker h2").style.display='none';

            document.querySelector(".clicker-message").innerHTML="The smash hit! Tap to win!";

}
else {

}


document.querySelector('#show-clicker').onclick = function(){
    document.querySelector('.clicker-message-container').style.display='none'; 
    document.querySelector('.the-clicker').style.display='block'; 
    document.querySelector('.player2-clicker').style.display='block';    
}


document.querySelector('#show-clicker').onclick = function(){
    document.querySelector('#show-clicker').style.display='none'; 
    p2smashCountDown();
      
}

var p2count = 0;
document.querySelector('.player2-clicker').onclick = function() {
    p2count++;
};



function p2smashCountDown(){
        var iterator3 = function*(){ // Generator iterator
            yield "READY";
            yield "SET";
            yield "BUTTON BASH!";
        }();
        function iterate3(){
            var count3 = iterator3.next();
            if(!count3.done){
                document.querySelector('.clicker-message').innerHTML = '<h2>' + count3.value + '</h2>';
                console.log("ITERATE");
                setTimeout(iterate3, 600);
            }else{       
                showp2clicker();
                p2ClickTimer();
            }
        }
        iterate3();
}



function showp2clicker(){
    document.querySelector('.clicker-message-container').style.display='none'; 
    document.querySelector('.the-clicker').style.display='block'; 
    document.querySelector('.player2-clicker').style.display='block';  
}


function p2ClickTimer(){
        var iterator5 = function*(){ // Generator iterator
            yield "5";
            yield "4";
            yield "3";
            yield "2";
            yield "1";
            yield "TIME UP!";
        }();

        function iterate5(){
            var count5 = iterator5.next();
            if(!count5.done){
                document.querySelector('.clicker-ticker').innerHTML = '<h2>' + count5.value + '</h2>';
                console.log("ITERATE");
                setTimeout(iterate5, 500);
            }else{       
                p2ClickerResults();
               
            }
        }
        iterate5();
}

function p2ClickerResults(){
    document.querySelector('.clicker-results').style.display='block'; 
    document.querySelector('.clicker-results').innerHTML = "Waiting for opponent";
    document.querySelector('.the-clicker').style.display='none'; 
    sendClickConfirmation(p2count); //SEND CONFIRMATION + AMOUNT OF CLICKS TO OTHER PLAYER
}



// HIDE AND SHOW SMASH ATTACK FOR PLAYER 2 (YOU)
            if(result.p2Wins > 0 && result.p2Energy >=2){
                setTimeout(function(){
                    document.querySelector(".your-smash").style.display='block';
                    smashSound.play();                  
                }, 3000);
            }
            else{
                document.querySelector(".your-smash").style.display='none';
            }

// HIDE AND SHOW SMASH ATTACK FOR PLAYER 1(OPPONENT)

            if(result.p1Wins > 0 && result.p1Energy >=2){
                document.querySelector("#opponents-smash").style.display='block';
            }
            else{
                document.querySelector("#opponents-smash").style.display='none'; 
            }

        // WIN GAME IF % IS OVER CERTAIN AMOUNT
            if(result.p2Wins > 170){
                document.querySelector(".winScreen").style.display='block';
            }
            else if(result.p1Wins > 170){
                document.querySelector(".loseScreen").style.display='block';
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



function hideGame(){
    document.querySelector(".container").style.display='none';
}

function showGame(){
    document.querySelector(".container").style.display='block';
}

function hideWin(){
    document.querySelector(".winScreen").style.display='none';
}

function showWin(){
    document.querySelector(".winScreen").style.display='block';
}

function winScreenDisable(){
    document.querySelector(".winScreen").style.display='none';
}

function loseScreenDisable(){
    document.querySelector(".loseScreen").style.display='none';
}

function goBackToTheHomePage(){
    window.location.href = "../index.html";
}





