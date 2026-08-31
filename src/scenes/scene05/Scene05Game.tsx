import {
  useState,
  useEffect,
  useRef
} from "react";
import { Scene05DeveloperPanel } from "./Scene05DeveloperPanel";

export const Scene05Game = () => {

  const spawnIndex = useRef(0);

  const countdownAudio = useRef<HTMLAudioElement | null>(null);
  const clickAudio = useRef<HTMLAudioElement | null>(null);
  const startCountdownAudio = useRef<HTMLAudioElement | null>(null);
  const backgroundAudio = useRef<HTMLAudioElement | null>(null);
  const scoreSavedRef = useRef(false);


  const playCountdownSound = () => {

  if(!countdownAudio.current){

    countdownAudio.current = new Audio(
      "/sounds/countdown.mp3"
    );

    countdownAudio.current.volume = 0.5;

    countdownAudio.current.loop = true;

  }


  if(
    countdownAudio.current.paused
  ){

    countdownAudio.current.play()
    .catch(()=>{});

  }

};

 const playClickSound = () => {

  if(clickAudio.current){

    clickAudio.current.currentTime = 0;

    clickAudio.current.play()
    .catch(()=>{});

  }

};

const playStartCountdown = () => {

  if(!startCountdownAudio.current){

    startCountdownAudio.current = new Audio(
      "/sounds/countdown-go.mp3"
    );

    startCountdownAudio.current.volume = 0.7;

  }


  startCountdownAudio.current.currentTime = 0;


  startCountdownAudio.current.play()
  .catch(()=>{});

};

const playBackgroundMusic = () => {

 

if(!backgroundAudio.current){

backgroundAudio.current = new Audio(
"/sounds/background.mp3"
);

backgroundAudio.current.loop = true;

backgroundAudio.current.volume = 0.25;

}


backgroundAudio.current.play()
.catch(()=>{});


};



// TAMBAH INI BAWAH DIA

const stopBackgroundMusic = () => {

  if(backgroundAudio.current){

    backgroundAudio.current.pause();

    backgroundAudio.current.currentTime = 0;

  }

};

const stopDialogueAudio = () => {

  if(dialogueAudio.current){

    dialogueAudio.current.pause();

    dialogueAudio.current.currentTime = 0;

    dialogueAudio.current = null;

  }

};

const finishGame = () => {


  // hentikan semua suara Tippy
  stopDialogueAudio();


  // hentikan sound semasa
  if(currentSound.current){

    currentSound.current.pause();

    currentSound.current.currentTime = 0;

  }


  // hentikan countdown
  if(countdownAudio.current){

    countdownAudio.current.pause();

    countdownAudio.current.currentTime = 0;

  }


  // hentikan background
  stopBackgroundMusic();


  setSpeechText(
    dialogue[language ?? "en"].complete
  );


  setTippyTalking(true);
  setTippyWalking(false);


  setGameFinished(true);
  setGameStarted(false);


  // celebration sahaja
  setTimeout(()=>{

    playSound(
      "celebration.mp3"
    );

  },700);


};

  const [developerMode, setDeveloperMode] = useState(false);

  const [languageLocked, setLanguageLocked] = useState(false);

  const [language, setLanguage] = useState<"en" | "bm">("en");

  const [gameStarted, setGameStarted] = useState(false);

  const [showStartButton, setShowStartButton] = useState(true);

  const [gamePaused, setGamePaused] = useState(false);

 const [timeLeft, setTimeLeft] = useState(60);

  const [dangerTime,setDangerTime]=useState(false);

  const [tenSecondWarning, setTenSecondWarning] = useState(false);

  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);

  const [draggingPlant, setDraggingPlant] = useState<string | null>(null);

  const [isHolding, setIsHolding] = useState(false);

  const holdTimer = useRef<number | null>(null);

  const [plantPosition, setPlantPosition] = useState({
    x: 50,
    y: 50
  });

  const [placedPlants, setPlacedPlants] = useState<any[]>([]);

  const [greenScore, setGreenScore] = useState(0);
  
  const [lives, setLives] = useState(3);
 const [successAnimation, setSuccessAnimation] = useState<{
x:number;
y:number;
} | null>(null);


const [scoreStar, setScoreStar] = useState<{
x:number;
y:number;
} | null>(null);

  const currentSound = useRef<HTMLAudioElement | null>(null);
  const dialogueAudio = useRef<HTMLAudioElement | null>(null);


const playSound = (
file:string,
onEnded?:()=>void
) => {

  stopDialogueAudio();

if(currentSound.current){

currentSound.current.pause();

currentSound.current.currentTime=0;

}


const audio = new Audio(
`/sounds/${file}`
);

dialogueAudio.current = audio;

audio.volume=0.5;


currentSound.current = audio;


audio.play()
.catch(()=>{});


audio.onended = ()=>{

if(onEnded){
onEnded();
}

};


};

  const [worldSpeed, setWorldSpeed] = useState(0.5);
  const [backgroundX, setBackgroundX] = useState(0);

  const [gameFinished, setGameFinished] = useState(false);

  // ID KHAS UNTUK GAME SCENE 05
const GAME_ID = "scene05_green_city";

const getAccessCode = () => {

  try {

    // Cuba URL page utama dahulu
    const pathname =
      window.parent.location.pathname;

    const parts =
      pathname
        .split("/")
        .filter(Boolean);

    const playIndex =
      parts.indexOf("play");

    if (
      playIndex !== -1 &&
      parts[playIndex + 1]
    ) {

      return parts[playIndex + 1];

    }

  }
  catch (error) {

    console.warn(
      "Unable to read parent URL:",
      error
    );

  }


  // Fallback: cuba URL window semasa
  const currentParts =
    window.location.pathname
      .split("/")
      .filter(Boolean);

  const currentPlayIndex =
    currentParts.indexOf("play");

  if (
    currentPlayIndex !== -1 &&
    currentParts[currentPlayIndex + 1]
  ) {

    return currentParts[
      currentPlayIndex + 1
    ];

  }


  return null;

};

// STEP 4 - SAVE GAME SCORE
const saveGameScore = async (
  finalScore: number
) => {

  const accessCode =
    getAccessCode();

  if (!accessCode) {

    console.error(
      "Access code not found"
    );

    return;

  }

  try {

    const response =
      await fetch(
        "/api/game/scores",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            access_code: accessCode,
            game_id: GAME_ID,
            score: finalScore
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data?.error ||
        "Failed to save game score"
      );

    }

    console.log(
      "GAME SCORE SAVED:",
      data
    );

  }
  catch (error) {

    console.error(
      "ERROR SAVING GAME SCORE:",
      error
    );

  }

};

// STEP 5 - AUTO SAVE SCORE BILA GAME TAMAT
useEffect(() => {

  if (!gameFinished) {
    return;
  }

  if (scoreSavedRef.current) {
    return;
  }

  scoreSavedRef.current = true;

  saveGameScore(greenScore);

}, [gameFinished, greenScore]);

  const plantQueue = [
    "tree",
    "grass",
    "flower",
    "tree",
    "grass",
    "flower"
  ];

  const MIN_PLANT_SPACING = 24;
const SAFE_SPAWN_X = 110;

const getSafeSpawnX = (
  targets: any[],
  plants: any[],
  extraPositions: number[] = []
) => {

  const occupiedPositions = [
    ...targets.map(item => item.x),
    ...plants.map(item => item.x),
    ...extraPositions
  ];

  if (occupiedPositions.length === 0) {
    return SAFE_SPAWN_X;
  }

  const rightMost = Math.max(...occupiedPositions);

  return Math.max(
    SAFE_SPAWN_X,
    rightMost + MIN_PLANT_SPACING
  );
};

const createTarget = (
  id: number,
  position: number
) => {

  const type =
    plantQueue[id % plantQueue.length];


  return {
    id: id,
    type: type,
    x: position,
    y: 82
};

};

  const [activeTargets, setActiveTargets] = useState<any[]>([]);

 const showTippyTalk = (
message:string
) => {

  setSpeechText(message);

};

const resetTippyInstruction = () => {

setSpeechText(
dialogue[language ?? "en"].instruction
);

};

  const checkPlantDrop = () => {


    if (!draggingPlant) return;


    const target = activeTargets.find((item) => {


      if (item.type !== draggingPlant)
        return false;



      const dx = item.x - plantPosition.x;

      const dy = item.y - plantPosition.y;


      const distance = Math.sqrt(
        dx * dx + dy * dy
      );

      return distance < 18;


    });


    if (target && target.type === draggingPlant) {


    const plantedId = target.id;

setPlacedPlants(prev => [
  ...prev,
  {
    id: plantedId,
    type: draggingPlant,
    x: target.x,
    y: target.y,
    isGrowing: true
  }
]);


// animation grow sahaja 700ms
// posisi plant TIDAK ditangguhkan

setTimeout(() => {

  setPlacedPlants(prev =>
    prev.map(plant =>
      plant.id === plantedId
        ? {
            ...plant,
            isGrowing: false
          }
        : plant
    )
  );

}, 700);


      setActiveTargets(prev => {

  const remaining = prev.filter(
    item => item.id !== target.id
  );

  // Cari tempat spawn yang tidak bertindih
  // dengan shadow lain atau plant yang baru ditanam
  const safeX = getSafeSpawnX(
    remaining,
    placedPlants,
    [target.x]
  );

  return [
    ...remaining,
    createTarget(
      spawnIndex.current++,
      safeX
    )
  ];

});

      setGreenScore(prev => prev + 1);

      setSuccessAnimation({
  x: target.x,
  y: target.y
});


// selepas 500ms star bergerak ke score

setTimeout(()=>{

setScoreStar({

x: target.x,

y: target.y,

});


},500);


// hilangkan star

setTimeout(()=>{

setSuccessAnimation(null);
setScoreStar(null);


},1200);


    


     // dialogue ikut plant

if (draggingPlant === "tree") {

  showTippyTalk(
dialogue[language ?? "en"].tree
);


playSound(

language === "bm"
?
"scene05/scene05_tree_success_bm.mp3"
:
"scene05/scene05_tree_success.mp3",

()=>{

resetTippyInstruction();

}

);

}

else if (draggingPlant === "grass") {

  showTippyTalk(
    dialogue[language ?? "en"].grass
  );

 playSound(

language === "bm"
?
"scene05/scene05_grass_success_bm.mp3"
:
"scene05/scene05_grass_success.mp3",

()=>{

resetTippyInstruction();

}

);

}

else if (draggingPlant === "flower") {

  showTippyTalk(
    dialogue[language ?? "en"].flower
  );

  playSound(

language === "bm"
?
"scene05/scene05_flower_success_bm.mp3"
:
"scene05/scene05_flower_success.mp3",

()=>{

resetTippyInstruction();

}

);

}
    }
  else {


setSpeechText(
  dialogue[language ?? "en"].wrong
);


setLives(prev => {



const newLife = prev - 1;


if (newLife <= 0) {

  setSpeechText(
  dialogue[language ?? "en"].complete
);

  setTippyTalking(true);
  setTippyWalking(false);

  stopDialogueAudio();

  setGameFinished(true);
  setGameStarted(false);

  stopBackgroundMusic();

  if (countdownAudio.current) {
    countdownAudio.current.pause();
    countdownAudio.current.currentTime = 0;
  }

  playSound(
"celebration.mp3"
);

}


return newLife;


});

playSound(
  language === "bm"
  ?
  "scene05/scene05_wrong_bm.mp3"
  :
  "scene05/scene05_wrong.mp3"
);


}
    setDraggingPlant(null);


    setSelectedPlant(null);

    setIsHolding(false);


  };

  const startHoldPlant = (plant: string) => {

    if (gamePaused) return;


    setSelectedPlant(plant);


    holdTimer.current = window.setTimeout(() => {


      setDraggingPlant(plant);

      setIsHolding(true);


    }, 150);


  };

  const cancelHold = () => {


    if (holdTimer.current) {

      clearTimeout(holdTimer.current);

    }


    setSelectedPlant(null);


  };


  const [countdown, setCountdown] = useState<number | null>(null);

  const startGameCountdown = () => {

    playStartCountdown();

setCountdown(3);

setTimeout(()=>{
setCountdown(2);
},1000);

setTimeout(()=>{
setCountdown(1);
},2000);

setTimeout(()=>{
setCountdown(null);
setShowGo(true);
},3000);

setTimeout(()=>{

setShowGo(false);

setGameStarted(true);

setTippyHidden(false);
setTippyTalking(false);
setTippyWalking(true);

playBackgroundMusic();

setSpeechText(
dialogue[language ?? "en"].instruction
);

},4000);

};

  const [showGo, setShowGo] = useState(false);

// Walking position
const tippyConfig = {
x:11,
y:43,
size:300
};


const talkingTippyConfig = {
x:12,
y:30,
size:300
};

  useEffect(()=>{

  clickAudio.current = new Audio(
    "/sounds/click.mp3"
  );

  clickAudio.current.volume = 0.3;


},[]);

  useEffect(() => {

    if (!gameStarted || gamePaused) return;


    const timer = setInterval(() => {

      setTimeLeft(prev => {

       if (prev <= 1) {


clearInterval(timer);

finishGame();

return 0;

}

      const nextTime = prev - 1;

if (nextTime <= 10 && nextTime > 0) {

  setDangerTime(true);

  playCountdownSound();


  if (nextTime === 10 && !tenSecondWarning) {

   setTenSecondWarning(true);

setSpeechText(
  dialogue[language ?? "en"].time
);

playSound(
  language === "bm"
  ?
  "scene05/scene05_time_warning_bm.mp3"
  :
  "scene05/scene05_time_warning.mp3"
);

}

} else {

  setDangerTime(false);

  if (countdownAudio.current) {

    countdownAudio.current.pause();

    countdownAudio.current.currentTime = 0;

  }

}

return nextTime;

      });

    }, 1000);


    return () => clearInterval(timer);


  }, [gameStarted, gamePaused]);

  useEffect(() => {

    if (gameFinished) {

      if (countdownAudio.current) {

        countdownAudio.current.pause();

        countdownAudio.current.currentTime = 0;

        countdownAudio.current = null;

      }

    }

  }, [gameFinished]);

  useEffect(() => {

if (!gameStarted || gamePaused)
return;


setWorldSpeed(0.7);


const speedUp=setTimeout(()=>{

setWorldSpeed(1.0);

},10000);


return ()=>clearTimeout(speedUp);


},[gameStarted, gamePaused]);
  useEffect(() => {


    if (!gameStarted || gamePaused)
      return;


    const movement = setInterval(() => {


      // PARALLAX BACKGROUND
   setBackgroundX(prev => {

const next = prev - (worldSpeed * 3);


if(next <= -window.innerWidth){

return 0;

}


return next;

});


      setActiveTargets(prev => {


        const movedTargets = prev

          .map(target => ({

            ...target,

            x: target.x - worldSpeed

          }))

          .filter(target => target.x > 5);


        if (
          movedTargets.length < 5
        ) {

          const lastTarget =
            movedTargets[movedTargets.length - 1];


          if (
 !lastTarget ||
 lastTarget.x < 70
){

           movedTargets.push(
 createTarget(
  spawnIndex.current++,
  100
 ));

          }

        }

        return movedTargets;


      });

      setPlacedPlants(prev =>

        prev.map(plant => ({

          ...plant,

          x: plant.x - worldSpeed

        }))

          .filter(plant => plant.x > -20)

      );

    }, 50);


    return () => clearInterval(movement);


  }, [gameStarted, worldSpeed, gamePaused]);


 

const [dialogueConfig, setDialogueConfig] = useState(() => {

 const saved = localStorage.getItem(
   "scene05-dialogue"
 );

 return saved
 ?
 JSON.parse(saved)
 :
 {
   x: 8,
   y: 32,
   width: 420
 };

});

const introDialogueConfig = {
x:7.5,
y:14,
width:420
};


const gameDialogueConfig = {
x:8,
y:24,
width:380
};

const [tippyTalking, setTippyTalking] = useState(true);
const [tippyWalking, setTippyWalking] = useState(false);
const [tippyHidden, setTippyHidden] = useState(false);

const playSceneIntro = () => {

const introFile =
language === "bm"
?
"scene05/scene05_intro_bm.mp3"
:
"scene05/scene05_intro.mp3";


const instructionFile =
language === "bm"
?
"scene05/scene05_instruction_bm.mp3"
:
"scene05/scene05_instruction.mp3";

stopDialogueAudio();


const introAudio = new Audio(
`/sounds/${introFile}`
);

dialogueAudio.current = introAudio;


introAudio.play()
.catch(()=>{});


introAudio.volume = 0.5;


introAudio.play()
.catch(()=>{});


introAudio.onended = () => {


if(language === "bm"){

setSpeechText(
dialogue[language ?? "en"].help
);

}
else{

setSpeechText(
dialogue[language ?? "en"].help
);

}


playSound(
instructionFile
);


};

};

const changeLanguage = (lang:"en"|"bm") => {


setLanguage(lang);


// Tukar bubble intro

setSpeechText(
dialogue[lang].intro
);


// main intro ikut bahasa

const introFile =
lang === "bm"
?
"scene05/scene05_intro_bm.mp3"
:
"scene05/scene05_intro.mp3";


const instructionFile =
lang === "bm"
?
"scene05/scene05_instruction_bm.mp3"
:
"scene05/scene05_instruction.mp3";



const introAudio = new Audio(
`/sounds/${introFile}`
);


introAudio.volume = 0.6;


introAudio.play()
.catch(()=>{});



// bila intro habis

introAudio.onended = ()=>{


setSpeechText(
dialogue[lang].help
);


// main instruction

playSound(
instructionFile
);


};


};



// LETAK SINI
const playTryAgain = () => {


const tryAgainFile =
language === "bm"
?
"scene05/scene05_try_again_bm.mp3"
:
"scene05/scene05_try_again.mp3";


stopDialogueAudio();


const audio = new Audio(
`/sounds/${tryAgainFile}`
);


dialogueAudio.current = audio;


audio.volume = 0.5;



audio.play()
.catch(()=>{});


audio.onended = ()=>{

dialogueAudio.current = null;

};


};


const [speechText, setSpeechText] = useState(
"Let's make our city greener! 🌱"
);

  useEffect(() => {

    localStorage.setItem(
      "scene05-speech",
      speechText
    );

  }, [speechText]);

  useEffect(() => {

    localStorage.setItem(
      "scene05-dialogue",
      JSON.stringify(dialogueConfig)
    );

  }, [dialogueConfig]);


  useEffect(() => {

  const handleKey = (e: KeyboardEvent) => {

    if (
      e.ctrlKey &&
      e.shiftKey &&
      e.key === "D"
    ) {

      setDeveloperMode(prev => !prev);

    }

  };


  window.addEventListener(
    "keydown",
    handleKey
  );


  return () => {

    window.removeEventListener(
      "keydown",
      handleKey
    );

  };

}, []);


// ==============================
// RESULT SCREEN VALUES
// ==============================

const dialogue = {

en: {

intro:
"Let's make our city greener! 🌱",

instruction:
"Pick a plant and drag it to the matching spot!",

help:
"Can you please help me? Match the same plants, then drag and drop them into the correct spots! 🌱",

chooseLanguage:
"Choose Language",

play:
"LET'S PLAY!",

completeTitle:
"GREEN CITY COMPLETE!",

complete:
"Good effort! Let's keep making our city greener!",

plantsGrown:
"PLANTS GROWN!",

replay:
"REPLAY",

next:
"NEXT",

tree:
"Wonderful! Trees help absorb rainwater and keep our city green!",

grass:
"Great! Grass helps the soil absorb rainwater!",

flower:
"Beautiful! Flowers make our city greener and brighter!",

wrong:
"Oops! Try another spot!",

time:
"Ten seconds left! Keep going!"

},


bm: {

intro:
"Jom jadikan bandar kita lebih hijau! 🌱",

instruction:
"Pilih tumbuhan dan tarik ke tempat padanan yang betul! 🌱",

help:
"Mari bantu saya! Padankan tumbuhan yang sama, kemudian seret dan letakkan di tempat yang betul! 🌱",

chooseLanguage:
"Pilih Bahasa",

play:
"MARI BERMAIN!",

completeTitle:
"BANDAR HIJAU SELESAI!",

complete:
"Cubaan yang baik! Jom terus jadikan bandar kita lebih hijau!",

plantsGrown:
"TUMBUHAN DITANAM!",

replay:
"MAIN SEMULA",

next:
"SETERUSNYA",

tree:
"Hebat! Pokok membantu tanah menyerap air hujan dan menjadikan bandar kita lebih hijau!",

grass:
"Bagus! Rumput membantu tanah menyerap air hujan!",

flower:
"Cantiknya! Bunga menjadikan bandar kita lebih hijau dan ceria!",

wrong:
"Oops! Cuba tempat lain!",

time:
"Tinggal 10 saat! Teruskan!"

}
};

useEffect(() => {

setSpeechText(
  dialogue[language].intro
);

playSceneIntro();

}, []);


const resultMessage: string =
  greenScore >= 15
    ? dialogue[language ?? "en"].complete
    : greenScore >= 8
    ? dialogue[language ?? "en"].complete
    : dialogue[language ?? "en"].complete;

    

return (

<div
className="
fixed
left-0
right-0
bottom-0
top-[84px]

overflow-hidden
bg-none
"
>

<div
className="
absolute
inset-0
overflow-hidden
"
>




    <div

      onPointerMove={(e) => {



        if (!draggingPlant || !isHolding)
          return;


        const rect =
          e.currentTarget.getBoundingClientRect();


        setPlantPosition({

          x:
            ((e.clientX - rect.left)
              / rect.width) * 100,


          y:
            ((e.clientY - rect.top)
              / rect.height) * 100

        });


      }}

      onPointerUp={() => {

        checkPlantDrop();

      }}

      style={{
 touchAction:"none"
}}



className="
relative
w-full
h-full
overflow-hidden
touch-none
pt-[84px]
"
>

  

{/* LANGUAGE BUTTON */}

{
!gameStarted &&
!gameFinished &&
showStartButton &&
(
<div
className="
absolute
top-6
right-6

sm:top-10
sm:right-10

z-[999]

flex
items-center
gap-1

bg-white/90
backdrop-blur-md
rounded-full
p-1

shadow-xl
border-2
border-white
"
>


{/* ENG */}

<button

onClick={()=>{

playClickSound();

changeLanguage("en");

}}

className={`
px-5
py-2
rounded-full

font-black
text-sm

outline-none
focus:outline-none
focus:ring-0

transition-all
duration-200

${
language === "en"

?

"bg-blue-500 text-white scale-105 shadow-md"

:

"bg-transparent text-blue-600"

}

`}

>

ENG

</button>



{/* BM */}

<button

onClick={()=>{

playClickSound();

changeLanguage("bm");

}}

className={`
px-5
py-2
rounded-full

font-black
text-sm
outline-none
focus:outline-none
focus:ring-0

transition-all
duration-200


${
language === "bm"

?

"bg-orange-400 text-white scale-105 shadow-md"

:

"bg-transparent text-orange-500"

}

`}

>

BM

</button>


</div>
)
}

{/* MOVING BACKGROUND */}

<div
className="
absolute
inset-0
top-0
z-0
overflow-hidden
"
>

<div
className="
absolute
inset-0
z-0
overflow-hidden
"
>

<div
className="
absolute
top-0
left-0
h-full
w-[200%]
"
style={{

backgroundImage:
"url('/bg/bg_scene5_game.png')",

backgroundSize:
"50% 100%",

backgroundRepeat:
"repeat-x",

backgroundPosition:
"left center",

transform:
`translateX(${backgroundX}px)`

}}
/>


<div
className="
absolute
top-0
left-full
h-full
w-full
"
style={{
backgroundImage:
"url('/bg/bg_scene5_game.png')",

backgroundSize:"cover",

backgroundRepeat:"no-repeat",

backgroundPosition:"center"
}}
/>


</div>


</div>



{/* FLOATING LEAVES */}

<div
className="
absolute
top-40

left-20

text-3xl

animate-leaf

pointer-events-none

z-10
"
>
🍃
</div>


<div
className="
absolute
top-20

right-40

text-3xl

animate-leaf-slow

pointer-events-none

z-10
"
>
🍃
</div>


      {
        gameStarted && activeTargets.map((target, index) => (

          <img

            key={index}

            src={`/plants/${target.type}.png`}

            className="
absolute
z-20
w-[clamp(70px,10vw,128px)]
h-[clamp(70px,10vw,128px)]
object-contain
opacity-50
grayscale
"

            style={{

              left: `${target.x}%`,

              top: `${target.y}%`,

              transform: "translate(-50%,-75%)"

            }}

          />

        ))
      }
{
successAnimation && (

<div
className="
absolute
z-[200]

text-4xl

animate-ping

pointer-events-none
"

style={{
left:`${successAnimation.x}%`,
top:`${successAnimation.y}%`
}}

>
✨
</div>

)
}

{
scoreStar && (

<div

className="
absolute

z-[300]

text-4xl

pointer-events-none

animate-star-fly

"

style={{

left:`${scoreStar.x}%`,
top:`${scoreStar.y}%`

}}

>

⭐

</div>

)
}
      {
        placedPlants.map((plant, index) => (


          <img

            key={index}

            src={`/plants/${plant.type}.png`}

            className="
absolute
z-50

w-[clamp(70px,10vw,128px)]
h-[clamp(70px,10vw,128px)]

object-contain

"

            style={{

              left: `${plant.x}%`,

              top: `${plant.y}%`,

              transform: "translate(-50%,-75%)"

            }}


          />


        ))
      }


{
!tippyHidden && !gameFinished && (
      <img
       src={
  tippyTalking
    ? "/characters/tippy/tippy-talking.gif"
    : tippyWalking
    ? "/characters/tippy/tippy-walk-side.gif"
    : "/characters/tippy/tippy-idle.gif"
}

        alt="Tippy"

       className={`
absolute
z-50
pointer-events-none

${
tippyWalking && !tippyTalking
?
"animate-walk"
:
""
}

`}
        style={{
  left: `${
    tippyTalking
    ? talkingTippyConfig.x
    : tippyConfig.x
  }%`,

  top: `${
    tippyTalking
    ? talkingTippyConfig.y
    : tippyConfig.y
  }%`,

  width: `${
    tippyTalking
    ? talkingTippyConfig.size
    : tippyConfig.size
  }px`
}}



      />
      )
}

      {
        draggingPlant && (

          <img

            src={`/plants/${draggingPlant}.png`}

            alt="Dragging Plant"

            className="
absolute
z-[80]

w-[clamp(70px,10vw,128px)]
h-[clamp(70px,10vw,128px)]

object-contain

pointer-events-none
transition-none

"

            style={{

              left: `${plantPosition.x}%`,

              top: `${plantPosition.y}%`,

              transform: "translate(-50%,-50%)"

            }}

          />

        )

      }

      {
        gameStarted && (

          <div
className="
absolute
inset-0

z-[999]

flex
items-center
gap-2

"
>

{/* ================= GAME HUD NEW ================= */}

<div
className="
absolute
inset-0
z-[999]
pointer-events-none
"
>

{/* LEFT SIDE */}

<div
className="
absolute
top-6
left-6

flex
items-center
gap-5

"
>


{/* STAR */}

<div
className="
flex
items-center
gap-2

bg-white/80
backdrop-blur-xl

px-4
py-2

rounded-2xl

border-2
border-yellow-300/80

shadow-[0_6px_20px_rgba(0,0,0,0.15)]

transition-all
duration-300
"
>

<span
  className="
    text-3xl
    drop-shadow-md
  "
>
  ⭐
</span>


<span
className="
text-3xl
font-black
text-yellow-600
"
>

{greenScore}

</span>


</div>



{/* LIFE */}

<div

className="
flex
items-center
gap-1

bg-white/80
backdrop-blur-xl

px-4
py-2

rounded-2xl

border-2
border-red-200

shadow-[0_6px_20px_rgba(0,0,0,0.15)]

transition-all
duration-300
"

>


{
  [0, 1, 2].map((heart) => (

    <span

      key={heart}

      className={`
        text-3xl

        transition-all
        duration-500

        ${
          heart < lives
            ? "scale-100 drop-shadow-md"
            : "opacity-20 grayscale scale-75"
        }
      `}

    >
      ❤️

    </span>

  ))
}

</div>


</div>






{/* RIGHT SIDE */}


<div

className="
absolute

top-6
right-6

flex
items-center
gap-4

"

>




{/* TIMER */}

<div
  className="
    relative

    flex
    items-center
    gap-2

    px-5
    py-2

    rounded-2xl

    bg-white/80
    backdrop-blur-xl

    border-2
    border-orange-300

    shadow-[0_6px_20px_rgba(0,0,0,0.15)]

    overflow-hidden

    transition-all
    duration-300
  "
>

  {/* RED FLASH BOX - LAST 10 SECONDS ONLY */}

  {
    dangerTime && (

      <div
        className="
          absolute
          inset-0

          rounded-2xl

          bg-red-500/75
          border-2
          border-red-500

          animate-pulse

          pointer-events-none
        "
      />

    )
  }


  {/* TIMER ICON */}

  <span
    className="
      relative
      z-10

      text-3xl
    "
  >
    ⏱️
  </span>


  {/* TIME */}

  <span
    className={`
      relative
      z-10

      text-3xl
      font-black
      tracking-wide

      transition-colors
      duration-300

      ${
        dangerTime
          ? "text-white"
          : "text-orange-600"
      }
    `}
  >

    {
      Math.floor(timeLeft / 60)
        .toString()
        .padStart(2, "0")
    }

    :

    {
      (timeLeft % 60)
        .toString()
        .padStart(2, "0")
    }

  </span>

</div>




{/* PAUSE */}

<button


onClick={()=>{


setGamePaused(prev=>{


const next=!prev;


if(backgroundAudio.current){

if(next){

backgroundAudio.current.pause();

}
else{

backgroundAudio.current.play()
.catch(()=>{});

}

}


return next;


});


playClickSound();


}}



className="
pointer-events-auto

w-14
h-14

rounded-2xl

bg-white/80
backdrop-blur-xl

border-2
border-blue-200

shadow-[0_6px_20px_rgba(0,0,0,0.15)]

flex
items-center
justify-center

hover:scale-105
hover:bg-blue-50

active:scale-90

transition-all
duration-200
"
>


<span
className="
text-3xl
"
>

{
gamePaused
?
"▶️"
:
"⏸️"
}


</span>


</button>



</div>



</div>

</div>
)
}
 

 

<div

className="
absolute
inset-0
z-[200]

flex
items-center
justify-center

pointer-events-none

"

>

{
(showGo || countdown !== null) &&

<div

className={`
text-[140px]

font-black

drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]

animate-bounce

transition-all
duration-300

${
showGo
?
"text-green-400"
:
countdown===1
?
"text-red-500"
:
countdown===2
?
"text-yellow-400"
:
"text-orange-400"
}

`}

>

{
showGo
?
"GO! 🌱"
:
countdown
}

</div>

}

</div>

            {/* Speech Bubble */}


            {
!gameFinished && !tippyHidden && (

                <div

                  className="
absolute
z-[400]
 bg-gradient-to-b
from-white
to-blue-50
  rounded-3xl
  shadow-lg
  p-4
  text-center
  "
                 style={{
 left: `${
   !gameStarted
   ? introDialogueConfig.x
   : gameDialogueConfig.x
 }%`,

 top: `${
   !gameStarted
   ? introDialogueConfig.y
   : gameDialogueConfig.y
 }%`,

 width: `${
   !gameStarted
   ? introDialogueConfig.width
   : gameDialogueConfig.width
 }px`
}}
                >

                  {/* Name */}
                  <div
className="
text-green-600
font-bold
text-xs
mb-1
"
>
                  
                    TIPPY
                  </div>


                  {/* Dialogue */}
                <div
className={`
text-gray-800
font-bold
leading-relaxed

${
!gameStarted
?
"text-base"
:
"text-sm"
}

`}
>
                   {
 speechText
}
                  </div>


                  {/* Bubble Tail */}
                  <div
                    className="
    absolute
    left-1/2
    -bottom-3
    -translate-x-1/2
    w-0
    h-0
    border-l-[12px]
    border-r-[12px]
    border-t-[15px]
    border-l-transparent
    border-r-transparent
    border-t-white
    "
                  />

                </div>
              )

            }

            {/* Start Button */}

          {
 showStartButton &&
 !gameStarted &&
 !gameFinished &&
 countdown === null &&
 !showGo && (

  

                <button

                  onClick={() => {

playClickSound();

stopDialogueAudio();

if(currentSound.current){

currentSound.current.pause();

currentSound.current.currentTime = 0;

}

setShowStartButton(false);

scoreSavedRef.current = false;

setTimeLeft(60);

setTippyHidden(true);
setTippyTalking(false);
setTippyWalking(false);
setSpeechText("");

                    setGreenScore(0);
                    setPlacedPlants([]);
                    spawnIndex.current = 0;
                   setActiveTargets([

{
id:0,
type:"tree",
x:75,
y:78
},

{
id:1,
type:"grass",
x:95,
y:78
},

{
id:2,
type:"flower",
x:115,
y:78
}

]);

                    startGameCountdown();

                  }}

                  className="
absolute

bottom-[90px]

sm:bottom-[105px]
left-1/2
-translate-x-1/2

z-[999]

bg-gradient-to-b
from-lime-400
to-green-600

text-white

text-xl

font-black

px-10
py-4

rounded-full

shadow-[0_8px_0_rgba(21,128,61,0.8)]

hover:scale-105

active:scale-95

transition-all
duration-200

flex
items-center
gap-2

"

                >

                 🌱 {dialogue[language ?? "en"].play}

                </button>

              )

            }

            {/* Plant Inventory */}

            {
              gameStarted && (

                <div

                  className="
absolute

top-10
md:top-5

left-1/2
-translate-x-1/2


z-[999]
"
                >


                  {/* Title */}

                  <div

                    className="
text-center

text-sm

font-bold

text-green-700

mb-2

"

                  >


                  </div>



                  {/* Plants Row */}

                  <div
                  className="
                  flex
                  items-center
                  gap-4
                  "
                                    >

                    {/* TREE */}

                   <div
  className="
    w-[clamp(60px,8vw,96px)]
h-[clamp(60px,8vw,96px)]

    flex
    items-center
    justify-center

    rounded-3xl

    bg-white/85
    backdrop-blur-sm

    border-2
    border-green-300

    shadow-[0_0_25px_rgba(34,197,94,0.9)]
    animate-pulse
    cursor-pointer

    hover:scale-105
    transition-transform
  "
>


                      <img

                        src="/plants/tree.png"

                        alt="Tree"

                        draggable={false}

                        onPointerDown={(e) => {

e.currentTarget.releasePointerCapture?.(
e.pointerId
);

startHoldPlant("tree");

}}
                        onPointerUp={cancelHold}

                        onPointerLeave={cancelHold}

                        className={`
w-20
h-20
object-contain
rounded-full
transition-transform

${selectedPlant === "tree"
                            ?
                            "scale-125 drop-shadow-[0_0_15px_rgba(34,197,94,0.9)]"
                            :
                            ""
                          }

`}

                      />


              


                    </div>





                    {/* GRASS */}

                    <div
  className="
 w-[clamp(60px,8vw,96px)]
h-[clamp(60px,8vw,96px)]

    flex
    items-center
    justify-center

    rounded-3xl

    bg-white/85
    backdrop-blur-sm

    border-2
    border-green-300

    shadow-[0_0_25px_rgba(34,197,94,0.9)]
    animate-pulse
    cursor-pointer

    hover:scale-105
    transition-transform
  "
>


                      <img

                        src="/plants/grass.png"

                        alt="Grass"

                        draggable={false}

                       onPointerDown={(e) => {

e.currentTarget.releasePointerCapture?.(
e.pointerId
);

startHoldPlant("grass");

}}

                        onPointerUp={cancelHold}

                        onPointerLeave={cancelHold}

                        className={`
w-20
h-20

object-contain
rounded-full

transition-transform

${selectedPlant === "grass"
                            ?
                            "scale-125 drop-shadow-[0_0_15px_rgba(34,197,94,0.9)]"
                            :
                            ""
                          }

`}

                      />


                      


                    </div>





                    {/* FLOWER */}

                   <div
  className="
    w-[clamp(60px,8vw,96px)]
h-[clamp(60px,8vw,96px)]

    flex
    items-center
    justify-center

    rounded-3xl

    bg-white/85
    backdrop-blur-sm

    border-2
    border-green-300

    shadow-[0_0_25px_rgba(34,197,94,0.9)]
    animate-pulse
    cursor-pointer

    hover:scale-105
    transition-transform
  "
>


                      <img

                        src="/plants/flower.png"

                        alt="Flower"

                        draggable={false}

                       onPointerDown={(e) => {

e.currentTarget.releasePointerCapture?.(
e.pointerId
);

startHoldPlant("flower");

}}

                        onPointerUp={cancelHold}

                        onPointerLeave={cancelHold}

                        className={`
w-20
h-20

object-contain
rounded-full

transition-transform

${selectedPlant === "flower"
                            ?
                            "scale-125 drop-shadow-[0_0_15px_rgba(34,197,94,0.9)]"
                            :
                            ""
                          }

`}

                      />


                  


                    </div>



                  </div>


                </div>

              )

            }

           {
  gameFinished && (

    <div
      className="
        absolute
        inset-0
        z-[300]

        flex
        items-center
        justify-center

        bg-black/35
      "
    >

      {/* ================= RESULT CARD ================= */}

      <div
        className="
          relative

         w-[520px]
max-w-[90%]
       

          bg-[#fffaf3]

          border-[4px]
          border-green-300

          rounded-[30px]

          shadow-[0_12px_0_rgba(22,163,74,0.16),0_24px_45px_rgba(0,0,0,0.22)]

          px-7
          pt-14
          pb-7

          text-center
        "
      >


        {/* ================= COMPLETE HEADER ================= */}

        <div
          className="
            absolute

            left-1/2
            top-[-24px]
            -translate-x-1/2

            w-[220px]

            py-3

            bg-gradient-to-b
            from-yellow-300
            to-orange-400

          
           

            rounded-[18px]

            shadow-[0_6px_0_rgba(194,65,12,0.30)]

            text-orange-900
            text-[24px]
            font-black
            tracking-wide
          "
        >
          {language === "bm"
?
"TAHNIAH!"
:
"COMPLETE!"
}
        </div>


        {/* ================= STARS ================= */}

        <div
          className="
            flex
            items-center
            justify-center

            gap-3

            mt-1
          "
        >

          <span className="text-[clamp(20px,3vw,42px)]">
            ⭐
          </span>

          <span className="text-[clamp(20px,3vw,42px)]">
            ⭐
          </span>

          <span className="text-[clamp(20px,3vw,42px)]">
            ⭐
          </span>

          <span className="text-[clamp(20px,3vw,42px)]">
            ⭐
          </span>

          <span className="text-[clamp(20px,3vw,42px)]">
            ⭐
          </span>

        </div>


        {/* ================= TITLE ================= */}

        <h1
          className="
            mt-3

            text-[clamp(14px,2vw,24px)]
            leading-tight

            font-black

            text-green-600
          "
        >
          {dialogue[language ?? "en"].completeTitle}
        </h1>


        {/* ================= RESULT MESSAGE ================= */}

        <p
          className="
            mt-2

            px-2

            text-[14px]
            leading-relaxed

            font-semibold
            text-slate-600
          "
        >
          {resultMessage}
        </p>


        {/* ================= PLANTS GROWN ================= */}

        <div
          className="
            mt-5

            mx-auto

           w-[55%]
h-auto
aspect-[2/1]

            flex
            items-center
            justify-center

            gap-4

            bg-gradient-to-b
            from-green-100
            to-emerald-100

            border-[3px]
            border-green-300

            rounded-[22px]

            shadow-[0_7px_15px_rgba(34,197,94,0.14)]
          "
        >

          {/* PLANT ICON */}

          <div
            className="
              flex
              items-center
              justify-center

              text-[46px]

              leading-none
            "
          >
            🌱
          </div>


          {/* SCORE */}

          <div
            className="
              flex
              flex-col
              items-center
              justify-center

              text-center
            "
          >

            <div
              className="
                text-[40px]
                leading-none

                font-black

                text-green-600
              "
            >
              {greenScore}
            </div>

            <div
              className="
                mt-1

                text-[13px]
                leading-tight

                font-black

                text-green-700
              "
            >
              {dialogue[language ?? "en"].plantsGrown}
            </div>

          </div>

        </div>


        {/* ================= BUTTONS ================= */}

        <div
          className="
            mt-6

            flex
            items-center
            justify-center

            gap-4
          "
        >


          {/* REPLAY */}

          <button

            onClick={() => {

              playClickSound();

              scoreSavedRef.current = false;

              stopBackgroundMusic();

              if (countdownAudio.current) {

                countdownAudio.current.pause();
                countdownAudio.current.currentTime = 0;

              }

              setGameFinished(false);

              setGameStarted(false);

              setGamePaused(false);
              setShowStartButton(true);

setSpeechText(
dialogue[language ?? "en"].complete
);

setLanguageLocked(true);

              setTimeLeft(60);

              setDangerTime(false);

              setTenSecondWarning(false);

              setGreenScore(0);

              setLives(3);

              setPlacedPlants([]);

              setActiveTargets([]);

              setDraggingPlant(null);

              setSelectedPlant(null);

              setIsHolding(false);

              setTippyTalking(true);
setTippyWalking(false);
setTippyHidden(false);

         spawnIndex.current = 0;

              stopDialogueAudio();

             playTryAgain();

              setCountdown(null);
setShowGo(false);

            }}

            className="
             w-[40%]
h-auto
py-3
              rounded-[18px]

              bg-gradient-to-b
              from-lime-400
              to-green-500

            

              shadow-[0_6px_0_rgba(21,128,61,0.50)]

              text-white
              text-[16px]
              font-black

              hover:scale-105

              active:translate-y-[2px]
              active:shadow-[0_3px_0_rgba(21,128,61,0.50)]

              transition-all
              duration-150
            "
          >
            {dialogue[language ?? "en"].replay}
          </button>


          {/* NEXT */}

          <button

            onClick={() => {

              playClickSound();

              console.log("NEXT SCENE");

            }}

            className="
             w-[40%]
h-auto
py-3

              rounded-[18px]

              bg-gradient-to-b
              from-sky-400
              to-blue-500


              shadow-[0_6px_0_rgba(29,78,216,0.50)]

              text-white
              text-[16px]
              font-black

              hover:scale-105

              active:translate-y-[2px]
              active:shadow-[0_3px_0_rgba(29,78,216,0.50)]

              transition-all
              duration-150
            "
          >
            {dialogue[language ?? "en"].next}
          </button>

        </div>

      </div>

    </div>

  )
}

            {/* Developer Panel */}
            {
developerMode && (

<div
className="
absolute
inset-0
z-[9999]
pointer-events-auto
"
>


</div>

)
}

                  </div>
</div>

</div>

);

};
