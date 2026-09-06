export type DeviceType =
  | "phone"
  | "tablet";


export type ResponsiveConfig = {

  // =================
  // HUD TOP LEFT
  // =================

  hudTop:string;

  scoreBoxSize:string;
  scoreIconSize:string;
  scoreTextSize:string;


  heartBoxSize:string;
  heartSize:string;
  heartGap:string;



  // =================
  // TIMER + PAUSE
  // =================

  timerBoxSize:string;
  timerIconSize:string;
  timerTextSize:string;

  pauseSize:string;
  pauseIconSize:string;



  // =================
  // INVENTORY
  // =================

  inventoryTop:string;
  inventorySize:string;
  inventoryGap:string;



  // =================
  // TIPPY
  // =================

  tippySize:string;
  tippyX:number;
  tippyY:number;

  talkingTippySize:string;
  talkingTippyX:number;
  talkingTippyY:number;



  // =================
  // DIALOGUE
  // =================

dialogueWidth:number;
dialogueX:number;
dialogueY:number;

dialoguePadding:string;
dialogueTextSize:string;
dialogueNameSize:string;


// TALKING DIALOGUE
// intro + finish

talkingDialogueWidth:number;
talkingDialogueX:number;
talkingDialogueY:number;

talkingDialoguePadding:string;
talkingDialogueTextSize:string;



  // =================
  // LANGUAGE
  // =================

languageTop:string;
languageRight:string;
languageButtonSize:string;
languageGap:string;
languageContainerSize:string;


  // =================
  // START BUTTON
  // =================

  startButtonBottom:string;
  startButtonWidth:string;
  startButtonPadding:string;
  startButtonTextSize:string;



  // =================
  // COUNTDOWN
  // =================

  countdownSize:string;
  countdownGoSize:string;
countdownOffset:string;



  // =================
  // RESULT SCREEN
  // =================

resultCardWidth:string;

resultCardPadding:string;

resultHeaderWidth:string;

resultHeaderTop:string;

resultTitleSize:string;

resultStarSize:string;

resultScoreSize:string;

resultButtonSize:string;

};


// Detect device
export const getDeviceType = (): DeviceType => {

  const width = window.innerWidth;
  const height = window.innerHeight;


  console.log(
    "SCREEN:",
    width,
    height
  );


  // PHONE LANDSCAPE
  if (
    Math.min(width,height) <= 500
  ) {

    return "phone";

  }


  return "tablet";

};


// Responsive setting
export const deviceConfig: Record<DeviceType, ResponsiveConfig> = {


  // =========================
  // iPHONE LANDSCAPE
  // Example: 844 x 390
  // =========================
phone:{


hudTop:"44px",


// SCORE

scoreBoxSize:"h-[38px] w-[78px]",
scoreIconSize:"text-lg",
scoreTextSize:"text-lg",


// HEART

heartBoxSize:"h-[38px] w-[100px]",
heartSize:"text-base",
heartGap:"gap-1",



// TIMER

timerBoxSize:"h-[38px] w-[120px]",
timerIconSize:"text-base",
timerTextSize:"text-lg",


// PAUSE

pauseSize:"h-[38px] w-[42px]",
pauseIconSize:"text-base",



// INVENTORY

inventoryTop:"34px",
inventorySize:"50px",
inventoryGap:"gap-2",



// TIPPY

tippySize:"190px",
tippyX:11,
tippyY:43,

talkingTippySize:"170px",
talkingTippyX:15,
talkingTippyY:35,



// DIALOGUE

dialogueWidth:315,
dialogueX:5.5,
dialogueY:26,
dialoguePadding:"px-7 py-10",
dialogueTextSize:"text-[10px]",
dialogueNameSize:"text-[8px]",


talkingDialogueWidth:340,
talkingDialogueX:6,
talkingDialogueY:20,
talkingDialoguePadding:
"px-6 py-10",
talkingDialogueTextSize:
"text-xs",



// =================
// LANGUAGE PHONE
// =================

languageTop:"45px",
languageRight:"15px",

languageButtonSize:"text-xs",

languageGap:"gap-0",

languageContainerSize:"p-1",


// START BUTTON

startButtonBottom:"68px",
startButtonWidth:"w-[219px]",
startButtonPadding:"py-3 px-10",
startButtonTextSize:"text-sm",



// COUNTDOWN

countdownSize:"text-[80px]",
countdownGoSize:"text-[70px]",
countdownOffset:"mt-[-20px]",



// RESULT PHONE

resultCardWidth:"w-[326px]",

resultCardPadding:"px-4 pt-12 pb-4",

resultHeaderWidth:"w-[120px]",

resultHeaderTop:"top-[-35px]",

resultTitleSize:"text-sm",

resultStarSize:"text-lg",

resultScoreSize:"text-lg",

resultButtonSize:"text-xs"



},




  // =========================
  // iPAD LANDSCAPE
  // Example: 1366 x 1024
  // =========================

tablet:{


hudTop:"80px",


// =================
// SCORE STAR
// =================

scoreBoxSize:"h-[55px] w-[120px]",

scoreIconSize:"text-2xl",

scoreTextSize:"text-2xl",



// =================
// HEART
// =================

heartBoxSize:"h-[55px] w-[150px]",

heartSize:"text-2xl",

heartGap:"gap-2",




// =================
// TIMER
// =================

timerBoxSize:"h-[55px] w-[150px]",

timerIconSize:"text-2xl",

timerTextSize:"text-2xl",




// =================
// PAUSE
// =================

pauseSize:"h-[55px] w-[60px]",

pauseIconSize:"text-2xl",




// =================
// INVENTORY
// =================

inventoryTop:"80px",

inventorySize:"80px",

inventoryGap:"gap-4",




// =================
// TIPPY
// =================

tippySize:"360px",

tippyX:14,

tippyY:48,


talkingTippySize:"390px",

talkingTippyX:12,

talkingTippyY:38,




// =================
// DIALOGUE
// =================

dialogueWidth:390,

dialogueX:13,

dialogueY:27,


dialoguePadding:"px-6 py-4",

dialogueTextSize:"text-xl",

dialogueNameSize:"text-[19px]",


// TIPPY TALKING DIALOGUE

talkingDialogueWidth:600,

talkingDialogueX:5,

talkingDialogueY:30,

talkingDialoguePadding:
"px-10 pt-8 pb-10",

talkingDialogueTextSize:
"text-xl",



// =================
// LANGUAGE TABLET
// =================

languageTop:"120px",

languageRight:"50px",

languageButtonSize:"text-xl",

languageGap:"gap-2",

languageContainerSize:"p-2",




// =================
// START BUTTON
// =================

startButtonBottom:"130px",

startButtonWidth:"w-[400px]",

startButtonPadding:"py-6 px-10",

startButtonTextSize:"text-2xl",




// =================
// COUNTDOWN
// =================

countdownSize:"text-[150px]",
countdownGoSize:"text-[130px]",
countdownOffset:"mt-[-50px]",





// =================
// RESULT SCREEN
// =================

// RESULT TABLET

resultCardWidth:"w-[520px]",

resultCardPadding:"px-7 pt-14 pb-7",

resultHeaderWidth:"w-[220px]",

resultHeaderTop:"top-[-24px]",

resultTitleSize:"text-2xl",

resultStarSize:"text-4xl",

resultScoreSize:"text-4xl",

resultButtonSize:"text-lg"


}

};