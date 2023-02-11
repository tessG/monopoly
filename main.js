
//dimensions
    let total = 40;
    let circleSize = 200;
    let halfW;
    let halfH;
    let offset;
    let angle;
    let bgcolor;
    let costSize = 30; // used to diminish the initial cost value - the smaller the number the bigger the field.
    let incomeSize = 80; //used to diminish the income value - the smaller the number the bigger the field.
    let playercolors = [];
  

   const circle=[];
   const players = [];

   
    let winner = null;
   

    let next = true;

    let newPos;
    let lastPos;
    let player;
    let recording = true;



    let fielddata;
    let gamedata;
    var pdf;
    let board;

let run = false;
let roundCount = 0;
let currentPlayer;

  let buildingPrice = 4000;
    function preload() {
        
        fielddata = loadStrings('./assets/fields.txt');
        gamedata = loadStrings('./assets/data.txt');
    }




    function setup() {
        var myCanvas = createCanvas(500, 500);
        myCanvas.parent("monopolyJS");
        bgcolor = color(160, 130,91);
        halfW = width / 2;
        halfH = height / 2;
        offset = halfW; 
        angle = TWO_PI / (total * 20);  
    
        playercolors[0] = color(255, 0, 0);
        playercolors[1] = color(0, 0, 255);
        playercolors[2] = color(255, 255, 0);
        playercolors[3] = color(0, 255, 0);
        playercolors[4] = color(0);
        playercolors[5] = color(255);
        board = new Board();
        board.createFields(fielddata);
       background(160, 130,91);
        drawBoard();
        setupPlayers(gamedata);
    }

function keyPressed() {
  if (keyCode === 83) { // if "s" is pressed
    saveForPrint("sketch.jpg", "A3", 300,10);
  }else if (keyCode === 82) { // if "s" is pressed
    run = !run;
  }
}



    function draw() {
        if(run){

            if (next == true ) {
                 background(bgcolor);
                next = false;
                roundCount++;
                currentPlayer = getNextPlayer();

                if (currentPlayer != null) {
                    doTurn(currentPlayer);
                    newPos = currentPlayer.getPosition();
                    lastPos = currentPlayer.getLastPosition();

                } else {
                   endGame();
                   noLoop();
                }
                drawBoard();
            }else if(!game_ended){
                animateMove();
                lastPos++;
           }else{//game ended draw for print
                background(bgcolor);
                 drawBoard();
                 renderPlayers();
           }
    }
 }



function doTurn(){
        let f = null;
        decisionRequest = null;

        leavingField = board.getField(currentPlayer.getPosition());
        if(leavingField instanceof Visit ){
            decisionRequest = leavingField.onLeave();
            f = leavingField;

        }
        if(currentPlayer.isfree()){
            diceValue = getDiceValue();//board.getDice().throwDice();
            currentPosition =  currentPlayer.updatePosition(diceValue);
            f = board.getField(currentPosition);
            decisionRequest = f.onLand();
        }

        if(f.currentOption != null){
            let simulatedDecision=currentPlayer.getStrategyResponse(f.getOption());
            f.processesResponse(simulatedDecision,currentPlayer);
        }
     }

 function getNextPlayer() {
        if (players.length > 1){
            if (roundCount == players.length) {
                roundCount = 0;
            }
            return players[roundCount];
        }else{
            return null;
        }
    }

  function drawBoard() {
    
        
        for (let i = 0; i < total; i++) {
            placeShapeAtAngle(i, circleSize);
            f = board.getField(i + 1);
            f.render(circle[i].x, circle[i].y);
        }
    }



    function placeShapeAtAngle( i, centerProx) {
        let angle = TWO_PI /  total;
        let x1 = offset + centerProx * sin(angle * i);
        let y1 = offset - centerProx * cos(angle * i);
        circle[i] = createVector(x1, y1);


    }

   
    function setupPlayers(gamedata){

     for (let i = 0; i < gamedata.length; i++) {
            let data = gamedata[i].split(',');
            let name = data[0].trim();
            let balance = parseInt(data[1].trim());
            let position = parseInt(data[2].trim());
            
            players[i] = new Player(name, balance, position, playercolors[i]);
            players[i].setPiecePosition(circle[0].x,circle[0].y);
            players[i].render();
        }
    }
     function removePlayer(player) {
        
        for(let i = 0; i < players.length; i++){
            if(players[i] == player){
                players.splice(i,1);
            }       
        }
        player.resetProperties();
    }
    function getDiceValue(){
        return Math.floor(Math.random() * 12)+1;
    }
    function animateMove() {

      let targetX = offset + circleSize * sin(angle * map(lastPos, 0, total, 0, total * 20));
      let targetY = offset - circleSize * cos(angle * map(lastPos, 0, total, 0, total * 20));
 
      if (Math.round(targetX) == Math.round(circle[newPos-1].x) && Math.round(targetY) == Math.round(circle[newPos-1].y)) {
           
          next = true;
      }

      currentPlayer.setPiecePosition(targetX, targetY);
      renderPlayers();
       
    }

    function passedStart(currentPosition) {
        if(currentPosition > 40) {
            currentPosition = currentPosition - 40;
            let start = board.getField(1);
            start.onPass();
        }
        return currentPosition;
    }
    let game_ended = false;
    
    function endGame() {
       
        if(!game_ended){
            
            winner = players[0].getName();
            console.log("the winner is... \n" + winner);           
            game_ended = true;
            currentPlayer = winner;
            saveForPrint("final.jpg", "A2", 300,0);        
            
        }

    }

    function renderPlayers() {
      players.forEach(function(p){
          
                p.render();
        });

    }


class Player {
   
    constructor(name, balance, position, color) {
        this.name = name;
        this.isFree = true;
        this.position = position;
        this.lastPosition;
        this.isFree = true;
        this.bankAccount = new BankAccount(balance);
        this.color = color;
        this.deeds = [];
        this.monopolies = [];
        this.x;
        this.y;
        this.strategy={ "buy":"Y","pay":"Y", "payTax":"Y", "build":"Y","bailCard":"N", "bailPayment":"N", "DoubleDice":"N"};    

    }
    setColor(color){
        this.color = color;
    }

   
    getName() {
        return this.name;
    }
   
    getPosition() {
        return this.position;
    }

    updatePosition(diceRoll) {
        let newPosition = this.position + diceRoll;
        this.setPosition(passedStart(newPosition)); 
        return this.position;
    }

    setPosition(newPosition){
        this.lastPosition = this.position;
        this.position = newPosition;
     }

    withdraw(amount) {
        let successful = this.bankAccount.doTransaction(-amount);
        if(!successful){
            roundCount--;
            console.log(this.name+" out of funds: "+this.getBalance());
            removePlayer(this);
        }
    }
    buyProperty( f){
        this.deeds.push(f);
        this.withdraw(f.getCost());
    }
    recievePayment( amount){
        this.bankAccount.doTransaction(amount);
    }
    payRent(playerToPay, amount) {
        
        this.withdraw(amount);
        playerToPay.recievePayment(amount);
    }


    getWorth(){
        let worth = this.getBalance();
        this.deeds.forEach(function(d) {
            worth +=d.getCost();
            worth +=d.getBuildingsWorth();
        });

        return worth;
    }


    getBalance() {
        return this.bankAccount.getBalance();
    }

    getBailCard() {
        return false;
    }

   getStrategyResponse(option) {
       if(option == "buy"){
           if(this.getBalance()<10000){
              
               this.strategy['buy'] = "n";
                this.strategy['build'] = "n";
               
           }else{
               this.strategy['buy'] = "y";
                this.strategy['build'] = "y";
           }

       }

        return this.strategy[option];
    }
    getColor(){
        return this.color;

    }
    addMonopoly(series) {
        this.monopolies.push(series);
    }
    
    getMonopolies() {
        return this.monopolies;
    }

    
    getLastPosition() {
        return this.lastPosition;
    }

    
    resetProperties() {
        this.deeds.forEach(function(d){
            if(d instanceof Plot) {
                
                if(d.isMonopolised) {
                    d.getFieldsInSeries().forEach(function(p){
                        p.clearBuildings();
                    });
                }
            }
            d.setOwner(null);
        });
    }

    
    moveToPrison() {
        this.isFree = false;
        this.updatePosition(20);
    }

    releaseFromPrison(){
        this.isFree = true;
    }
    
    isfree() {
        return this.isFree;
    }
    
    payBail(cost) {
        this.withdraw(cost);
    }

    buyBuilding(amount) {
        this.withdraw(amount);
    }
    
    setPiecePosition(targetX, targetY) {
        this.x = targetX;
        this.y = targetY;
    }

    render(){
        noStroke();
        fill(this.getColor());
        ellipse(this.x , this.y,this.getBalance()/1000,this.getBalance()/1000);
    }
}

class Board {   
    constructor() {
        this.fields = [];
        this.propertyFields = [];
    }

  
   createFields(fielddata) {

        for (let i = 0; i < fielddata.length; i++) {
            let fieldData = fielddata[i].split(",");
            let id = fieldData[0].trim();
            let fieldType = fieldData[1].trim();
            let label = fieldData[2].trim();
            let cost = parseInt(fieldData[3].trim());  
            let income = parseInt(fieldData[4].trim());
            let seriesID = parseInt(fieldData[5].trim());

             let field;
            
            switch (fieldType) {
                case 'Start':
                   
                    field = new Start(id, label, income);
                    break;
                case "Plot":
                    field = new Plot(id, label, cost, income,seriesID);
                    break;
                case "Brewery":
                    field = new Brewery(id, label, cost, income,seriesID);
                    break;
                case "ShippingLine":
                    field = new ShippingLine(id, label, cost, income,seriesID);
                    break;
                case "Chance":
                    field = new Chance(id, label);
                    break;
                case "Tax":
                    field = new Tax(id, label, cost);
                    break;
                case "Prison":
                     field = new Prison(id, label, cost);
                    break;
                case "Visit":
                    field = new Visit(id, label);
                    break;
                case "Parking":
                    field = new Consequence(id, label, 0, 0);
                    break;
                default:
                     console.log("no such type found")
            }

            if(fieldType == "ShippingLine" || fieldType == "Brewery" ||  fieldType == "Plot"){
                this.propertyFields.push(field);
            }

            this.fields.push(field);
        }
    }

   getField(index) {

        if(this.fields[index-1]!= null){
            let f = this.fields[index - 1];
            return this.fields[index-1];
        }
       return null;
    }
    getPropertyFields(){
        return this.propertyFields;
       }


}


class Field {
  
    
    constructor(id, label, cost, income) {
        this.id = id;
        this.cost = cost;
        this.income = income;
        this.currentOption ="";
        this.fieldsize = 40;
    }
 
    
    
    processesResponse(response, currentPlayer) {
       
        if(response.toLowerCase()=="n"){
           this.onReject();
        }else{
             this.onAccept();
        }
      
    }


    getCost() {
        return this.cost;
    }
    getIncome() {
        return this.income;
    }
    
    getId() {
        return this.id;
    }
    setOption(option){
        this.currentOption = option;
    }
    getOption(){
        return this.currentOption;
    }
    setIncome(i) {
        this.income = i;
    }
    
    getSize(){
        return this.fieldsize;
    }
}


class Property extends Field {
   
        constructor(id, label, cost, income, seriesID){
        super(id, label, cost, income);
        this.seriesID = seriesID;
        this.owner = null;
        this.seriesID=seriesID;
        this.isMonopolised = false;
        
        let col;
      
        switch(seriesID){
            case 1:
                col = color(118,196,242);
                break;
            case 2:col = color(242,217,247);break;
            case 3:col = color(51,183,84);break;
            case 4:col = color(160, 160, 160);break;
            case 5:col = color(255,0,0);break;
            case 6:col = color(25,255,255);break;
            case 7:col = color(255, 255, 0);break;
            case 8:col = color(180,118,242);break;
            case 9:col = color(234,212,182);break;
            case 10:col = color(104,73,15);break;
        }

         this.color = col;
    }
   

    
    onLand(){
        if (this.owner == null) {
            
            super.setOption("buy");
        } else if (this.owner == currentPlayer) {
            
             super.setOption(null);
        } else {
           
             super.setOption("pay");
        }
       
    }


    onAccept(){
        if(super.getOption()=="buy"){

            this.setOwner(currentPlayer);
            currentPlayer.buyProperty(this);
            if (this.hasMonopoly()) {
               // saveForPrint("monopoly.jpg", "A3", 300,10);
                currentPlayer.addMonopoly(this.seriesID);
            }
        }else if(super.getOption()=="pay"){
            currentPlayer.payRent(this.getOwner(), this.getIncome());
        }
    }
    
    onReject(){
       
        if(super.getOption()=="buy") {
            
            //todo: bank.putFieldUpForAuction()
        }else if(super.getOption()=="pay") {
            
            //todo: option to pawn
        }else if(super.getOption()=="build") {
            
        }
        

    }
  

    setOwner(owner) {
        this.owner = owner;
    }

   
    getFieldsInSeries() {
      
       let fieldsInSeries = [];
       
        for(let i = 0; i < board.getPropertyFields().length;i++){
            let p = board.getPropertyFields()[i];
           
            if (this.seriesID == p.seriesID) { 
                fieldsInSeries.push(p);
                }
        }
     
        return fieldsInSeries;
    }

    hasMonopoly() {
        let fieldsInSeries = [];
        if (this.getOwner() == currentPlayer) { 
           fieldsInSeries = this.getFieldsInSeries();
           
           for(let i = 0; i < fieldsInSeries.length; i++){
                let p = fieldsInSeries[i];
             if (this != p) {
                
             if ( p.getOwner() != this.getOwner() ) { 
                return false;
            }
        }
           }
            
         
        }else{

            return false;
        }

        fieldsInSeries.forEach(function(p) { 
          
            p.isMonopolised = true;
        });
        
        return true;
    }





   render(x,  y, _income) {
       if(this.owner != null){
           this.setOwnerColor();
           if (this.getIsMonopolised()) {
              this.setMonopolyColor();
            }
        }else{
              this.setDefaultColor();
        }
           
        ellipse(x,y, this.cost/costSize+_income/incomeSize, this.cost/costSize+_income/incomeSize);
    }

  setDefaultColor(){
        noStroke();     
         this.color._array[3] =.2;
         fill(this.color);   
    }
  
    setOwnerColor() {
        this.color._array[3] =.2;
        fill(this.color);
        strokeWeight(2);
        stroke(this.owner.getColor());
      
    }

      setMonopolyColor() {
        strokeWeight(8);
        stroke(this.owner.getColor());
        this.owner.getColor()._array[3] =.3;
        fill(this.owner.getColor());
        this.owner.getColor()._array[3]= 1;
    }
   

    getOwner() {
        return this.owner;
    }

    getSeriesID() {
        return this.seriesID;
    }
   
    getIsMonopolised(){
        return this.isMonopolised;
    }

}



class Plot extends Property {
    
    constructor(id, label, cost, income, seriesID) {
        super(id, label, cost, income,  seriesID);
        this.houseCount=0;
        this.houses = [];
        this.hotel=null;
    }
 
    onLand() {
        
            if (super.getIsMonopolised()) {

                if (this.hotel==null) {
                    super.setOption("build");
                    
                    return "";
                }else{
                  super.setOption(null);
                }
                
            }
        //no monopoly- forwarding call to superclass"
        return super.onLand();
    }

    onAccept() {
        if (super.getOption()=="build" && this.hotel == null) {

            if (this.houseCount < 4) {
               
               this.addHouse();

            } else {
                
                this.addHotel();

            }
           
            currentPlayer.buyBuilding(400);

        }else{
            super.onAccept();
        }
    }

    
    addHouse() {
        this.houses[this.houseCount]= new Building(this,this.houseCount+1);
        this.houseCount++;
    }
    
    addHotel() {
        this.hotel = new Building(this,this.houseCount+1);
        this.houses = null;
        this.houseCount++;
    }

    getSize(){
        return super.getSize()+super.getCost()/100;
    }

  
    getIncome() {
        let rent = super.getIncome();
        if(this.houseCount > 0 ) {
             switch (this.houseCount) {
                case 1:
                    rent = rent * 5;
                    break;
                case 2:
                    rent = rent * 12;
                    break;
                case 3:
                    rent = rent * 34;
                    break;
                case 4:

                    rent = rent * 40;
                    break;
                case 5:
                    rent = rent*45;
                    break;
            }
        }else if (super.getIsMonopolised()) {
            rent+=rent;
        }
        return rent;
    }


    render(x, y){
        
        super.render(x,y, this.getIncome());
        if(this.hotel!=null){
            this.hotel.render();
          } else {
            for (let i = 0; i < this.houseCount;i++) {
                   this.houses[i].render();
            }
        }
    }


    clearBuildings() {
        this.houseCount = 0;
        this.houses =[];
        this.hotel = null;
    }

    
    getBuildingsWorth() {
      return buildingPrice * this.houseCount;
    }
}

class Brewery extends Property {

    constructor(id, label, cost, income, seriesID) {
        super(id, label, cost, income, seriesID);
    }
    
    getIncome() {
       
        if (super.getIsMonopolised()) {
            return (super.getIncome()*2)*getDiceValue();
        }
        return super.getIncome()*getDiceValue();
    }


    render(x, y){
        
        super.render(x,y, this.getIncome());
      }
   

}
class ShippingLine extends Property {
    constructor(id,label, cost, income,seriesID) {
        super(id, label, cost, income, seriesID);
    }


    onAccept() {
        super.onAccept();
        if (super.getOption()=="buy") {
           if(this.hasOtherShippingLines()){
                this.doubleIncome();
           }
        }


    }
   
    doubleIncome() {
        super.getFieldsInSeries().forEach(function(p) {
        
            p.setIncome(p.getIncome()*2);
        });
    }
    hasOtherShippingLines(){
       super.getFieldsInSeries().forEach(function(p) {
            if(p!=this) {
                if (p.getOwner() == currentPlayer) {
                    return true;
                }
            }
        });
        return false;
    }

     render(x, y){
        
        super.render(x,y, super.getIncome());
      }

}


class Consequence extends Field {

    constructor(id, label, cost=0, income=0) {
        super(id, label, cost, income);
    }


    onLand(){
        super.currentOption = null;
    }

    
    render(x,y){
        ellipse(x,y,super.getSize(),super.getSize());
    }

    getCost(){
        return super.getCost();
    }
     getIncome(){
        return super.getIncome();
    }


}

class Tax extends Consequence {

    
    onLand(){
        super.currentOption = "payTax";
        return "";
    }



   onAccept(){
       if(super.currentOption == "payTax"){
            currentPlayer.withdraw(super.getCost());
        }
    }
    onReject(){
        if(super.getOption()=="payTax") {
            let amount;
            if(currentPlayer.getWorth()>100000) {
                
                amount = currentPlayer.getWorth() / 30;
            }else{
                amount = currentPlayer.getWorth() / 10;
            }

           currentPlayer.withdraw(amount);
        }
        return "";
    }



render(x, y) {      
        fill(22,234,249);
        stroke(1);
        strokeWeight(1);
        super.render(x,y);
    }
}

class Prison extends Consequence {

    render(x, y) {
        noStroke();
        fill(249,7,245);
        super.render(x,y);
    }

 
   onLand() {
        if(currentPlayer.getBailCard()!=false) {
             super.setOption("bailCard");
        }else{
            super.setOption("bailPayment") ;

        }
    }



    onAccept() {

        if(super.getOption()=="bailCard"){
           
        }else if(super.getOption()=="bailPayment"){
            currentPlayer.withdraw(1000);
        }

    }

   onReject() {
        currentPlayer.moveToPrison(this);
    
    }
}


class Chance extends Consequence {
    
    
   onLand(){
        super.onLand();
        
    }
    
   render(x, y) { 
        strokeWeight(1);   
        stroke(255);
        fill(0);
        super.render(x,y);
    }
}

class Start extends Consequence {
   constructor(id, label, income) {
        super(id, label, 0,income);
        
    }
   onPass(){   
     if(currentPlayer.isfree()) {
            currentPlayer.recievePayment(super.getIncome());
            super.setOption(null);
        }
       
    } 

   render(x, y){
        fill(255,255,255);
        super.render(x,y);
    }
}
class Visit extends Consequence {
    constructor(id, label) {
        super(id, label, 0, 0);
    }
    render(x, y) {
        fill(249,144, 246);
        super.render(x,y);
    }


onLeave() {        
        super.currentOption = null;
        if(!currentPlayer.isfree()) {        
            super.currentOption = "DoubleDice";
        }
       
    }
   onAccept(){
      
    }
   
    onReject(){
      let bail = board.getField(31).getCost();
        
        currentPlayer.payBail(bail);//31 i prison field
        currentPlayer.releaseFromPrison();
        return " ";
     }
}





class Building{
  
    
    constructor(plot,id) {

      this.id = id;
      this.size = 15;
      this.price = 4000;
      this.randomx;
      this.randomy;
      if(this.id > 4 ){
          this.size = 30;
      }
       let maxX= circle[plot.getId()-1].x+ plot.getSize()/2; 
        let minX= circle[plot.getId()-1].x- plot.getSize()/2;
        let maxY= circle[plot.getId()-1].y+ plot.getSize()/2;
        let minY= circle[plot.getId()-1].y- plot.getSize()/2;

        this.randomx = random(minX-this.size,maxX+this.size);
        this.randomy = random(minY-this.size,maxY+this.size);
    }
    
    render() {
        stroke(255);
        strokeWeight(2);
        fill(0);
        rect(this.randomx, this.randomy, this.size, this.size);
        noStroke();
    }
}


class BankAccount {

    constructor(balance) {
        this.balance = balance;
    }

    withdrawAmount(amount) {
        this.balance -= amount;
        return amount;
    }

    receiveAmount(amount) {
        this.balance += amount;
    }

    doTransaction(amount){
        if (amount<0) {
           
            if (this.sufficientFunds(amount)) {
                this.balance += amount; // same as balance = balance+ amount;
                return true;
            }
        }else{
            this.balance += amount;

        }
        return false;
    }

     sufficientFunds(amount) {
      if (this.balance + amount < 0) {
            return false;
        }
        return true;
    }
    getBalance() {
        return this.balance;
    }

    
}
