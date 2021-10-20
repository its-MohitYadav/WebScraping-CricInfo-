//its-MohitYadav
//node CricInfoScraping.js --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results
let minimist=require("minimist");
let args=minimist(process.argv);
let axios=require("axios");
let jsdom=require("jsdom");
let fs=require("fs");
let excel=require("excel4node");
let path=require("path");
let pdf=require("pdf-lib");

let htmlkapromise=axios.get(args.source);// gives promise
htmlkapromise.then(function(response){
    let html=response.data;
    let dom=new jsdom.JSDOM(html);
    let document=dom.window.document;
    let dekhteh=document.querySelectorAll("div.match-score-block");
    let TEAMS=[];
    for(let i=0;i<dekhteh.length;i++){
        site=dekhteh[i];  //now we dont have to use whole document to search..it will search for individual box
        //creating an object to collect required data and then will push it into TEAMS array
        let match={
            t1:"",
            t2:"",
            t1s:"",
            t2s:"",
            result:""
        }

        let donoteam=site.querySelectorAll("div.name-detail");
        match.t1=(donoteam[0].textContent);
        match.t2=(donoteam[1].textContent);

        let donoscores=site.querySelectorAll("span.score");
        if(donoscores.length==2){
            match.t1s=donoscores[0].textContent;
            match.t2s=donoscores[1].textContent;
        }else if(donoscores.length==1){
            match.t1s=donoscores[0].textContent;
            match.t2s="";
        }else{
            match.t1s="";
            match.t2s="";
        }

        let resultkraha=site.querySelector("div.status-text");
        match.result=resultkraha.textContent;

        TEAMS.push(match);
    }
    let TEAMSJSON=JSON.stringify(TEAMS);
    fs.writeFileSync("notArrangedWala.json",TEAMSJSON,"utf-8");
    let uniqueteam=[];
    for(let i=0;i<TEAMS.length;i++){
        helper1(TEAMS[i],uniqueteam);
        //helper1 sirf total team daal deta h uniqueteam array mein
        //objects hote h jis object mein team ka name hota h aur uske individual matches ka ek khaali 
        //array hota h
    }
    // console.log(uniqueteam);
     for(let i=0;i<TEAMS.length;i++){
        helper2(TEAMS[i],uniqueteam);
        //helper2 ab har match ke unn khaali arrays ko bharta h
    }
    //uniqueteam array is JSO ie it cant be saved(it can only be manipulated)
    let teamJSON=JSON.stringify(uniqueteam); //(JSO-->JSON) 
    fs.writeFileSync("teams.json",teamJSON,"utf-8");  

    createexcel(uniqueteam);
    createfolderforgroupmatches(uniqueteam);
    //Now only for Eliminators and Final
    let EnF=[];
    for(let i=0;i<3;i++){
        site=dekhteh[i];
        let match={
            t1:"",
            t2:"",
            t1s:"",
            t2s:"",
            result:""
        }

        let donoteam=site.querySelectorAll("div.name-detail");
        match.t1=(donoteam[0].textContent);
        match.t2=(donoteam[1].textContent);

        let donoscores=site.querySelectorAll("span.score");
        match.t1s=donoscores[0].textContent;
        match.t2s=donoscores[1].textContent;

        let resultkraha=site.querySelector("div.status-text");
        match.result=resultkraha.textContent;

        EnF.push(match);

    }
    createfolderforEnF(EnF);
    
}).catch(function(err){
    if(err){
        console.log("error!!");
    }
})

function helper1(TEAMS,uniqueteam){
    let obj={
        name:"",
        khudkmatch:[]
    }
    let dummyt1=true;
    for(let i=0;i<uniqueteam.length;i++){
        if(TEAMS.t1==uniqueteam[i].name){
            dummyt1=false;
            break;
        }
    }
    if(dummyt1==true){
        obj.name=TEAMS.t1;
        uniqueteam.push(obj);
    }
    
    let dummyt2=true;
    for(let i=0;i<uniqueteam.length;i++){
        if(TEAMS.t1==uniqueteam[i].name){
            dummyt2=false;
            break;
        }
    }
    if(dummyt2==true){
        obj.name=TEAMS.t1;
        uniqueteam.push(obj);
    }
    
}

function helper2(TEAMS,uniqueteam){

    //create obj for team1(t1)
    let objt1={
        vs:"",
        selfscore:"",
        oppscore:"",
        parinaam:""
    }
    for(let i=0;i<uniqueteam.length;i++){
        if(TEAMS.t1==uniqueteam[i].name){
            objt1.vs=TEAMS.t2;
            objt1.selfscore=TEAMS.t1s;
            objt1.oppscore=TEAMS.t2s;
            objt1.parinaam=TEAMS.result;
            uniqueteam[i].khudkmatch.push(objt1);
        }
    }

    //create new object for team2(t2)
    let objt2={
        vs:"",
        selfscore:"",
        oppscore:"",
        parinaam:""
    }
    for(let i=0;i<uniqueteam.length;i++){
        if(TEAMS.t2==uniqueteam[i].name){
            objt2.vs=TEAMS.t1;
            objt2.selfscore=TEAMS.t2s;
            objt2.oppscore=TEAMS.t1s;
            objt2.parinaam=TEAMS.result;
            uniqueteam[i].khudkmatch.push(objt2);
        }
       
    }
}
function createexcel(uniqueteam){
    let wb=new excel.Workbook();
    for(let i=0;i<uniqueteam.length;i++){
        let sheet=wb.addWorksheet(uniqueteam[i].name);

        sheet.cell(2,1).string("vs");
        sheet.cell(2,2).string("selfscore");
        sheet.cell(2,3).string("oppscore");
        sheet.cell(2,4).string("result");

        for(let j=0; j < uniqueteam[i].khudkmatch.length; j++){
            sheet.cell(j+3,1).string(uniqueteam[i].khudkmatch[j].vs);
            sheet.cell(j+3,2).string(uniqueteam[i].khudkmatch[j].selfscore);
            sheet.cell(j+3,3).string(uniqueteam[i].khudkmatch[j].oppscore);
            sheet.cell(j+3,4).string(uniqueteam[i].khudkmatch[j].parinaam);
        }
    }
    wb.write("excel.csv");
}
function createfolderforgroupmatches(uniqueteam){
     let check=fs.existsSync("Group Matches");
     if(check==false){
        fs.mkdirSync("Group Matches");
     }

    for(let i=0;i<uniqueteam.length;i++){
        let teamfoldername=path.join("Group Matches",uniqueteam[i].name);
        let check=fs.existsSync(teamfoldername);
        if(check==false){
            fs.mkdirSync(teamfoldername);
        }
        for(let j=0; j<uniqueteam[i].khudkmatch.length; j++){
            createscorecard(uniqueteam[i],teamfoldername,uniqueteam[i].khudkmatch[j]);
        }
    }
}
function createscorecard(baseteam,teamfoldername,match){
    let matchfilename=path.join(teamfoldername, match.vs+".pdf");
     let t1=baseteam.name;
     let t2=match.vs;
     let t1s=match.selfscore;
     let t2s=match.oppscore;
     let result=match.parinaam;

    let ogbytes=fs.readFileSync("template.pdf");
    let pdfdockapromise=pdf.PDFDocument.load(ogbytes);
    pdfdockapromise.then(function(pdfdoc){
        let page=pdfdoc.getPage(0);
        page.drawText(t1,{
            x:165,
            y:684,
            size:16
        })
        page.drawText(t2,{
            x:165,
            y:652,
            size:16
        });

        page.drawText(t1s,{
            x:320,
            y:684,
            size:16
        })
        page.drawText(t2s,{
            x:320,
            y:652,
            size:16
        })
        page.drawText(result,{
            x:185,
            y:585,
            size:16,
        })
        
        let promisetosave=pdfdoc.save();
        promisetosave.then(function(changedbytes){
            fs.writeFileSync(matchfilename,changedbytes);
        })
    }).catch(function(err){
        if(err){
            console.log("Ahhhh");
        }
    })
}
function createfolderforEnF(EnF){
    let check=fs.existsSync("Eliminators and Final");
    if(check==false){
        fs.mkdirSync("Eliminators and Final");
    }
    let final=true;
    for(let i=0;i<EnF.length;i++){
        if(i==0){
            let x=path.join("Eliminators and Final","FINAL"+".pdf");
            createscorecardforEnF(EnF[i],x,final);
        }else if(i==1){
            final=false;
            let y=path.join("Eliminators and Final","Eliminator 2"+".pdf");
            createscorecardforEnF(EnF[i],y,final);
        }else{
            final=false;
            let z=path.join("Eliminators and Final","Eliminator 1"+".pdf");
            createscorecardforEnF(EnF[i],z,final);
        }
    }
}
function createscorecardforEnF(EnF,x,final){
     let t1=EnF.t1;
     let t2=EnF.t2;
     let t1s=EnF.t1s;
     let t2s=EnF.t2s;
     let result=EnF.result;
     
    
    let ogbytes=fs.readFileSync("template.pdf");
    let pdfdockapromise=pdf.PDFDocument.load(ogbytes);
    pdfdockapromise.then(function(pdfdoc){
        let page=pdfdoc.getPage(0);
        page.drawText(t1,{
            x:165,
            y:684,
            size:16
        })
        page.drawText(t2,{
            x:165,
            y:652,
            size:16
        });

        page.drawText(t1s,{
            x:320,
            y:684,
            size:16
        })
        page.drawText(t2s,{
            x:320,
            y:652,
            size:16
        })
        page.drawText(result,{
            x:185,
            y:585,
            size:16,
        })
        if(final==true){
            page.drawText("Later Super over tied. ENGLAND won the match on the boundary count ",{
                x:75,
                y:550,
                size:16,
            })
            page.drawText("back rule and lifted the cup!! ",{
                x:75,
                y:535,
                size:16,
            })
            

        }
        
        let promisetosave=pdfdoc.save();
        promisetosave.then(function(changedbytes){
            fs.writeFileSync(x,changedbytes);
        })
    }).catch(function(err){
        if(err){
            console.log("come on!!");
        }
    })
}