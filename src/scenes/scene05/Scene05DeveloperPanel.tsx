import React, { useState } from "react";


interface Scene05DeveloperPanelProps {

    

  tippyConfig: {
    x:number;
    y:number;
    size:number;
  };

  setTippyConfig: React.Dispatch<
    React.SetStateAction<{
      x:number;
      y:number;
      size:number;
    }>
  >;


  dialogueConfig: {
    x:number;
    y:number;
    width:number;
  };

  setDialogueConfig: React.Dispatch<
    React.SetStateAction<{
      x:number;
      y:number;
      width:number;
    }>
  >;

  speechText:string;


  setSpeechText: React.Dispatch<
    React.SetStateAction<string>
  >;

  

}


export const Scene05DeveloperPanel = ({

  tippyConfig,
  setTippyConfig,

  dialogueConfig,
  setDialogueConfig,

  speechText,
  setSpeechText

}: Scene05DeveloperPanelProps)=>{


const [collapsed,setCollapsed] = useState(false);



return (

<div
className="
absolute
top-5
right-5
z-[100]
bg-slate-900/95
text-white
p-4
rounded-2xl
w-80
shadow-2xl
border
border-green-400
text-sm
"
>


{/* HEADER */}

<div
className="
flex
justify-between
items-center
mb-3
"
>

<h2
className="
font-bold
text-green-300
"
>
🌱 Scene 5 Debug
</h2>


<button

onClick={()=>setCollapsed(!collapsed)}

className="
bg-slate-700
px-3
py-1
rounded-lg
"
>

{
collapsed
?
"OPEN"
:
"HIDE"
}

</button>


</div>



{
!collapsed && (

<div
className="
space-y-5
"
>


{/* TIPPY */}

<div>

<h3
className="
font-bold
text-yellow-300
mb-2
"
>
🐯 Tippy Position
</h3>


<label>
X : {tippyConfig.x}
</label>

<input

type="range"

min="0"

max="100"

value={tippyConfig.x}

onChange={(e)=>

setTippyConfig(prev=>({

...prev,

x:Number(e.target.value)

}))

}

className="
w-full
"
/>



<label>
Y : {tippyConfig.y}
</label>


<input

type="range"

min="0"

max="100"

value={tippyConfig.y}

onChange={(e)=>

setTippyConfig(prev=>({

...prev,

y:Number(e.target.value)

}))

}

className="
w-full
"
/>



<label>
Size : {tippyConfig.size}px
</label>


<input

type="range"

min="50"

max="400"

value={tippyConfig.size}

onChange={(e)=>

setTippyConfig(prev=>({

...prev,

size:Number(e.target.value)

}))

}

className="
w-full
"/>


</div>





{/* DIALOGUE */}

<div>

<h3
className="
font-bold
text-green-300
mb-2
"
>
💬 Dialogue Text
</h3>

<textarea
value={speechText}
onChange={(e)=>setSpeechText(e.target.value)}
className="
w-full
h-24
bg-slate-800
rounded-lg
p-2
text-white
"
/>

<h3
className="
font-bold
text-blue-300
mb-2
"
>
💬 Speech Bubble
</h3>


<label>
X : {dialogueConfig.x}
</label>


<input

type="range"

min="0"

max="100"

value={dialogueConfig.x}

onChange={(e)=>

setDialogueConfig(prev=>({

...prev,

x:Number(e.target.value)

}))

}

className="
w-full
"
/>




<label>
Y : {dialogueConfig.y}
</label>


<input

type="range"

min="0"

max="100"

value={dialogueConfig.y}

onChange={(e)=>

setDialogueConfig(prev=>({

...prev,

y:Number(e.target.value)

}))

}

className="
w-full
"
/>




<label>
Width : {dialogueConfig.width}px
</label>


<input

type="range"

min="150"

max="500"

value={dialogueConfig.width}

onChange={(e)=>

setDialogueConfig(prev=>({

...prev,

width:Number(e.target.value)

}))

}

className="
w-full
"
/>


</div>





{/* RESET */}

<button

onClick={()=>{

setTippyConfig({

x:5,

y:60,

size:180

});


setDialogueConfig({

x:20,

y:35,

width:250

});


}}

className="
w-full
bg-red-600
py-2
rounded-xl
font-bold
"
>

RESET

</button>



</div>

)

}



</div>


);


};