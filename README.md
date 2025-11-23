# arizona-logo-reveal
Bridal Logo Reveal Effect


Arizona Logo Reveal — Developer Guide

A simple guide for humans of all skill levels

This project adds a “lava-lamp style” reveal effect to the Arizona logo.
When you hover your mouse (or drag your finger), the old logo “melts away” like goo, revealing the new logo underneath.

Everything is inside:

index.html

style.css

script.js ← this is where all the magic happens

If you only want to change behavior, you only modify script.js.

>>> How It Works (super simple)

Think of the effect as lots of tiny circles (“blobs”) that:

appear where your mouse moves

shrink as they get older

disappear when they get too old

together create the squishy lava effect

You don’t need to understand the math — just know you can change size, speed, and lifetime easily.

>>>> 1. Change Blob Size (how big the goo looks)

Blob size automatically adjusts to screen size.

If you want the blob bigger or smaller:

In script.js, find this:
function getBrushRadius() {
  return Math.max(50, window.innerWidth * 0.08);
}

Change the 0.08:

0.12 → bigger blob

0.10 → medium-big

0.08 → default

0.06 → smaller

0.05 → very thin

Change the 50:

This is the minimum blob size for tiny screens.

40 → thinner

60 → thicker

>>>> 2. Change Blob Speed (how fast it follows the cursor)

Find this line:

const STEP_DIVISOR = 3;

Lower number = faster and smoother
Higher number = slower and more spaced out

Examples:

2 → very fast, very smooth

3 → default

4 → slower trail

5–6 → very slow, airy spacing

>>> 3. Change How Long the Trail Stays (lifetime)

This controls how long each little blob lives before melting.

Find this:

const BLOB_LIFETIME = 60;


This means blobs live for 60 animation frames (~1 second).

Change it like this:

100 → stays longer (more goo on screen)

80 → medium

60 → default

40 → disappears faster

20 → disappears very quickly

>>> 4. Change Fade-Out Speed When You Stop Moving

We added a natural “collapse” effect based on blob age.

If you want the whole trail to disappear faster after hover ends, you can adjust age, lifetime, or add a global fade. Ask if you want to enable the optional global fade too.

>>> 5. Responsive Behavior

Desktop: blob appears when mouse moves (hover)

Mobile: blob appears when user drags (touchmove)

Blob size automatically scales by screen width

No changes needed unless requested.

>>> 6. Changing the Logos

Logos live in:

/assets/new-logo.jpg
/assets/old-logo.jpg


Just replace the files with the same names and the effect works.

>>> 7. File Structure 
arizona-logo-reveal/
│
├── index.html       <-- contains HTML structure
├── style.css        <-- page styling
├── script.js        <-- goo reveal effect
└── assets/
    ├── new-logo.jpg
    └── old-logo.jpg

🚦 8. How To Run Locally

Open your terminal inside this project folder:

python3 -m http.server


Then open:

http://localhost:8000


or if you used the 3000 command:

http://localhost:3000

>>> 9. Integration Instructions (super safe)

This effect is delivered as a self-contained module, so your existing site cannot break.

Your two steps:

1. Drop the HTML container somewhere on your page
<div class="az-logo-reveal" id="az-logo-reveal">
  <img id="az-new-logo" class="az-logo-base" src="./assets/new-logo.jpg" />
  <canvas id="az-reveal-canvas"></canvas>
</div>

<script src="script.js"></script>

2. Include style.css

Either link it or merge it into your global CSS.

That’s it.

>>> 10. If Anything Breaks

Literally only two things can cause problems:

Canvas not sized → fix by ensuring the image loads before canvas runs

Wrong file paths → make sure assets/old-logo.jpg and /new-logo.jpg exist

Everything else is self-contained and safe. 