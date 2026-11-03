# Order Caller

I had Claude Code (Opus 5.5) writing this web-app, under my description, for use of the CUED canteen staff.
Visible at https://github.io/nicoklinger/canteen-caller

A static web app for calling order numbers in a canteen. Staff type a number on
a USB numeric keypad and a customer screen shows it in large type, with the last
5 numbers underneath, a chime and a spoken "Number 42".

- `index.html`: the **staff window** (keypad input, history, sound settings)
- `display.html`: the **customer display** (current number plus the last 5)

No server, no account, no build step. Plain HTML/CSS/JS, hosted on GitHub Pages.

## How it works

Both windows run in **the same browser on the same computer** (typically a PC or
laptop with a second screen or TV facing customers, and the keypad plugged in).
They share state through `localStorage`, so the display updates the moment staff
press Enter. The state survives a page reload or browser restart.

Keypad input works in **either** window. If someone clicks on the customer
display by mistake, the keypad still works, and what they type shows as a small
hint in the corner.

## Keypad

| Key            | Action                                   |
|----------------|------------------------------------------|
| `0`–`9`        | type the number (up to 4 digits)         |
| `Enter`        | call the typed number                    |
| `+`            | call the next number (current + 1)       |
| `-`            | undo the last call (a mistake)           |
| `*`            | repeat the chime/announcement            |
| `/` or `Esc`   | clear what you've typed                  |
| `.` / `Del`    | delete the last digit                    |

It works with NumLock on or off. Calling a number that is already in the history
moves it back to "Now serving". Holding a key down does not call several numbers.

### Recommended keypad (about £8–12)

**[Manhattan Wired USB Numeric Keypad](https://www.amazon.co.uk/Manhattan-Wired-USB-Numeric-Keypad/dp/B08Q1PMZPL)**
on Amazon UK. Wired USB-A, standard 18-key layout, no drivers, no batteries,
no pairing. It's from an established brand rather than a no-name listing.

Any wired USB numeric keypad with the standard layout works the same way.
Alternatives: [Hooseng wired keypad](https://www.amazon.co.uk/Numeric-Keypad-MacBook-Desktop-Hooseng-013/dp/B08KFTGHTN)
(1.35 m cable), or a 2.4 GHz wireless one if the till is far from the PC
(wireless needs AAA batteries).

## Daily use

1. On the counter PC, open `https://<your-username>.github.io/canteen-caller/`.
2. Click **Open customer display**. Drag that window onto the customer screen.
3. Click once on the display: it goes full screen and sound turns on. (Browsers
   only allow sound after a click.)
4. Click back on the staff window and use the keypad.

The green dot ("Display connected") tells you the display window is open.
After the first visit, the app keeps working if the Wi-Fi drops.

### Optional: start the display automatically (kiosk mode)

For a screen that should come up by itself with sound, make a Windows shortcut
with this target (adjust the URL):

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --autoplay-policy=no-user-gesture-required --new-window https://<your-username>.github.io/canteen-caller/display.html
```

Kiosk mode opens full screen on the main monitor. Press `Alt+F4` to close it.

## Publishing on GitHub Pages (one-time setup)

1. Create a free account at <https://github.com/signup>.
2. Create a new repository at <https://github.com/new>:
   - Name: `canteen-caller`
   - Visibility: **Public** (free accounts only get Pages on public repos;
     nothing private is in here).
   - Leave "Add a README", .gitignore and licence off, so the repo starts empty.
3. Push this folder (git is already set up here; run these in this folder):

   ```
   git remote add origin https://github.com/<your-username>/canteen-caller.git
   git push -u origin main
   ```

   The first push opens a browser window to sign in to GitHub.
4. On GitHub, open the repo → **Settings** → **Pages**. Under "Build and
   deployment", set Source to **Deploy from a branch**, Branch to **main**,
   folder **/ (root)**, then **Save**.
5. After a minute the site is live at
   `https://<your-username>.github.io/canteen-caller/`.

To update later: change files, then `git commit -am "message"` and `git push`.

## Running locally

ES modules don't load from `file://`, so use a tiny local server:

```
python -m http.server 8765
```

Then open <http://localhost:8765/>.

## Files

```
index.html            staff window
display.html          customer display
css/base.css          shared colours and base styles
css/server.css        staff window layout
css/display.css       customer display layout
js/store.js           shared state (localStorage) and actions
js/keypad.js          key mapping (NumLock on/off)
js/sound.js           chime (Web Audio) and voice (speech synthesis)
js/server.js          staff window logic
js/display.js         display logic, full screen, keep screen awake
sw.js                 offline cache
```

## Limits

- Both windows have to be in the same browser on the same computer. A display
  on a separate device (e.g. a tablet on the wall) would need a small sync
  service. A static site can't do that on its own.
- Numbers go from 1 to 9999. `+` after 9999 wraps to 1.
