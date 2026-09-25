# Beyond Borders — Sign-In & Admin Setup Guide

This site's "Sign In" (KCL email → BB Passport number) and admin dashboard need a free Firebase project behind them. A static site alone can't verify emails or store data safely, so this guide walks you through the one-time setup. It takes about 15 minutes and costs nothing on Firebase's free (Spark) plan for a society-sized amount of traffic.

## What you're setting up

- **Firebase Authentication** — sends KCL members a passwordless sign-in link and confirms it's really their inbox.
- **Firestore** — a small database that stores each member's passport number and any feedback they submit.
- **Security rules** — the *real* gatekeeper. Even if someone tampers with the website's code in their browser, these rules (which live on Firebase's servers) are what actually stop non-KCL emails from getting a passport number or seeing other members' data.

## Step 1 — Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with a Google account (create one for the society if you don't want to use a personal one).
2. Click **Add project**, name it something like `bbsoc-beyond-borders`, and finish the wizard (Google Analytics is optional, you can turn it off).

## Step 2 — Register a web app

1. On the project's home screen, click the **`</>`** (web) icon to add a web app.
2. Give it a nickname (e.g. "Beyond Borders site"). You don't need Firebase Hosting — you're already hosting on GitHub Pages.
3. Firebase will show you a `firebaseConfig` object with keys like `apiKey`, `authDomain`, `projectId`, etc. **Copy this whole block** — you'll paste it into `firebase-config.js` in Step 6.

## Step 3 — Turn on Email Link sign-in (and Anonymous, for the Wellbeing Board)

1. In the left sidebar: **Build → Authentication → Get started**.
2. Under **Sign-in method**, click **Email/Password**.
3. Turn on the **Email/Password** toggle, then also turn on **Email link (passwordless sign-in)** below it. Save.
4. Still on **Sign-in method**, also click **Anonymous** and turn it on, then Save. This one isn't for members signing in with an email — it's what quietly lets the Wellbeing Board (`wellbeing.html`) tell "delete your own post" apart from "delete someone else's post" without ever asking a visitor to create an account or give a name.
5. Still in Authentication, go to **Settings → Authorized domains** and add the domain your site is actually hosted on (e.g. `adoreleanor.github.io`, or your custom domain if you set one up). `localhost` is already there by default, which is handy for testing.

## Step 4 — Create the Firestore database

1. Left sidebar: **Build → Firestore Database → Create database**.
2. Choose a location close to your users (e.g. `eur3 (europe-west)`).
3. Start in **production mode** (we're supplying our own rules below, not the wide-open test-mode ones).

## Step 5 — Paste in the security rules

In Firestore, go to the **Rules** tab and replace everything with this, then click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isKclEmail() {
      return request.auth != null &&
        request.auth.token.email.matches(
          '^[a-zA-Z]+([-][a-zA-Z]+)*[.][a-zA-Z]+([-][a-zA-Z]+)*@kcl[.]ac[.]uk$'
        );
    }

    function isAdmin() {
      return request.auth != null &&
        request.auth.token.email in [
          'eleanor.wang@kcl.ac.uk',
          'eleanorlinw@gmail.com',
          'fatima.rajani@kcl.ac.uk',
          'yuejia.chen@kcl.ac.uk'
        ];
    }

    // Each member can read/write only their own profile; admins can read everyone's.
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null && request.auth.uid == userId && isKclEmail();
    }

    // Shared counter used to hand out sequential BB-#### numbers.
    match /meta/passportCounter {
      allow read, write: if isKclEmail();
    }

    // Shared, publicly-readable counters behind the home page's "Society
    // Collective" numbers (total members, total experiences completed).
    // Any signed-in KCL member can increment these as they sign up or
    // earn a stamp; nobody but admins can otherwise touch the rest of
    // the site's data.
    match /meta/stats {
      allow read: if true;
      allow write: if isKclEmail();
    }

    // Members can submit feedback (once written, it can't be edited or deleted from the client).
    // Only admins can read the feedback list.
    match /feedback/{feedbackId} {
      allow create: if isKclEmail() && request.resource.data.uid == request.auth.uid;
      allow read: if isAdmin();
      allow update, delete: if false;
    }

    // Event RSVPs. Each doc is keyed "<eventId>_<uid>" so a member can only
    // ever have one RSVP per event. A member can read/delete their own RSVP,
    // and admins can read all of them (to see attendee lists in admin.html).
    match /rsvps/{rsvpId} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.uid || isAdmin());
      allow create: if isKclEmail() && request.resource.data.uid == request.auth.uid;
      allow delete: if request.auth != null && request.auth.uid == resource.data.uid;
      allow update: if false;
    }

    // Publicly-readable RSVP headcount per event (no names/emails in here,
    // just a number), so anyone browsing Events can see "X going" without
    // needing to be signed in.
    match /eventStats/{eventId} {
      allow read: if true;
      allow write: if isKclEmail();
    }

    // Post-event reflections, private to admins, same pattern as feedback.
    match /eventReflections/{reflectionId} {
      allow create: if isKclEmail() && request.resource.data.uid == request.auth.uid;
      allow read: if isAdmin();
      allow update, delete: if isAdmin();
    }

    // Shared bank of reflection questions, picked per event in admin.html.
    // Anyone can read them (needed to render the reflection form), only
    // admins can add, edit, or remove questions.
    match /reflectionQuestions/{questionId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Editable site content (About Us text, committee list, events calendar).
    // Anyone can read it (it's what the public pages display), but only
    // admins can change it — via the new editor panels in admin.html.
    match /siteContent/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /committee/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /events/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /passportCategories/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /passportLevels/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /passportMonths/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Wellbeing Board: fully anonymous to other members (no name, email or
    // account shown), but each write carries a private anonymous-auth uid
    // so people can only delete their own post/reply, and admins can always
    // moderate. Hearts and flags are just a counter going up or down by one.
    match /wellbeingPosts/{postId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.content is string
        && request.resource.data.content.size() > 0
        && request.resource.data.content.size() <= 2000
        && request.resource.data.heartCount == 0
        && request.resource.data.flagCount == 0;
      allow update: if isAdmin()
        || (request.auth != null && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['heartCount'])
            && (request.resource.data.heartCount == resource.data.heartCount + 1 || request.resource.data.heartCount == resource.data.heartCount - 1))
        || (request.auth != null && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['flagCount'])
            && request.resource.data.flagCount == resource.data.flagCount + 1);
      allow delete: if isAdmin() || (request.auth != null && request.auth.uid == resource.data.uid);

      match /replies/{replyId} {
        allow read: if true;
        allow create: if request.auth != null
          && request.resource.data.uid == request.auth.uid
          && request.resource.data.content is string
          && request.resource.data.content.size() > 0
          && request.resource.data.content.size() <= 2000
          && request.resource.data.heartCount == 0;
        allow update: if request.auth != null && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['heartCount'])
          && (request.resource.data.heartCount == resource.data.heartCount + 1 || request.resource.data.heartCount == resource.data.heartCount - 1);
        allow delete: if isAdmin() || (request.auth != null && request.auth.uid == resource.data.uid);
      }
    }
  }
}
```

The admin list above is already set to `eleanor.wang@kcl.ac.uk`, `eleanorlinw@gmail.com`, `fatima.rajani@kcl.ac.uk`, and `yuejia.chen@kcl.ac.uk` — paste the rules block as-is unless that list changes later (e.g. a new committee each year).

**If your Firebase project already existed before the Wellbeing Board moved off Supabase:** you don't need to redo this whole guide — just go to **Firestore Database → Rules** in your existing project, replace whatever's there with the full rules block above (it includes everything you already had, plus the new `wellbeingPosts` section at the bottom), click **Publish**, and also do Step 3.4 above (turn on **Anonymous** sign-in) if you haven't already. Skipping either of those two will make the Wellbeing Board fail to load or fail to post.

**Admins don't need a KCL email.** Only the regular member sign-in (on the main site, for Passport tracking) requires `@kcl.ac.uk`. Signing into `admin.html` just checks the email against `ADMIN_EMAILS` / the `isAdmin()` rule above — any email address works there, so a committee member who's graduated or left KCL can keep admin access by adding their personal email to both `ADMIN_EMAILS` in `firebase-config.js` and the `isAdmin()` list in the Firestore rules (Step 5). Their old `@kcl.ac.uk` Passport account (stamps, passport number) stays in the database either way, but they won't be able to sign back into that specific member account once they lose access to that inbox, since Firebase's email-link sign-in needs a working inbox at that address each time.

## Step 6 — Drop your config into the site files

`firebase-config.js` has already been filled in with the real `firebaseConfig` values and the same three `ADMIN_EMAILS` as above, so there's nothing left to edit here — just make sure the file is uploaded alongside the others (see Step 7).

## Step 7 — Upload everything to your site

Make sure these files all sit in the same folder as `index.html` when you publish (e.g. commit them to the same GitHub Pages repo):

- `firebase-config.js` (with your real values now)
- `auth.js`
- `admin.html`
- `about.html`

## How it works, in short

- A member clicks **Sign In**, types `firstname.surname@kcl.ac.uk`, and gets an emailed link (no password to manage).
- Opening that link on the same device signs them in via Firebase Auth.
- The site then checks Firestore for an existing passport number for that account; if there isn't one, it atomically hands out the next `BB-####` and saves it.
- Signed-in members can submit feedback from the nav bar; it's saved with their email and passport number attached.
- `admin.html` is a normal page — anyone can open it — but it only shows real data to accounts whose email is in `ADMIN_EMAILS` **and** matches the security rules. Everyone else sees "Access restricted."
- On the Events page, upcoming events show an RSVP button (signed-in members only) and a live "X going" headcount visible to everyone. Past events show a "Leave a reflection" button instead, which sends a private note straight to admin.html.

## A note on security

The `firstname.surname@kcl.ac.uk` format check happens both in the browser (for a friendly error message) and in the Firestore rules (the part that can't be bypassed). Firebase's free tier doesn't let us block *sending the sign-in email itself* to a non-KCL address without a paid Cloud Functions plan — but that's fine, because even if someone signed in with a non-KCL email, the rules above stop them from ever getting a passport number, submitting feedback, or reading anyone else's data. Functionally, they're locked out.

## Testing it

Once Steps 1–7 are done, open `index.html` (locally via `localhost`, or on your published GitHub Pages URL), click **Sign In**, and use your own KCL email as a first test. Check the Firestore console (**Build → Firestore Database → Data**) — you should see a new document appear under `users` with your passport number.

## Editing site content without touching code

`admin.html` now doubles as a content editor, not just a viewer. Any of the three admin emails can sign in there and:

- Edit the **About Us** mission/what-we-do text and contact links
- Add, edit, or remove **committee members** (name, role, optional photo link, and whether they show as a featured "lead" card)
- Add, edit, or remove **events** on the calendar (which automatically updates both the Events page and the Passport's Upcoming Trips calendar, since they now share the same live data)
- Add, edit, or remove **Passport categories and their tasks** (the stamp lists under Career Explorer, Personal Growth, etc.) — including adding whole new categories, which reuse one of the five existing colour themes
- Add, edit, or remove **Passport levels and rewards** (Explorer, Adventurer, Trailblazer, Ambassador)
- Add, edit, or remove **Passport monthly challenges** (the Oct–Mar theme cards). Which one shows as "current" on the live site is worked out automatically from today's date (matched against each card's Month field), so there's nothing to toggle manually
- Edit the two manual **Society Collective** numbers (networking attendees, volunteers) on the home page. The other two numbers in that section (total members, total experiences completed) update themselves automatically as people sign up and earn stamps; they're shown read-only for reference
- **Moderate the Wellbeing Board** (delete any post or reply, see flag counts) without needing the old `?admin=` link
- **See RSVP headcounts and attendee lists per event**, and **read (and delete) members' private post-event reflections**, now shown as questions and answers rather than a single free-text block
- **Maintain a shared Reflection Question Bank** (e.g. "What went well?", "What could we improve?") and choose which of those questions apply to each event. Members then answer just those questions when they leave a reflection, instead of one open text box
- **Paste in photo links for an event** (one per line) so a small thumbnail gallery appears on that event's card, which visitors can click to enlarge. Each link must be a direct link to the image file itself, not a page that displays it. A Google Photos share link (photos.app.goo.gl/...) will not work; either upload the photo to the GitHub repo and use its raw file link, or use a Google Drive link in the form `https://drive.google.com/uc?export=view&id=FILE_ID`
- **Events move themselves into a "Past Events" section automatically**, seven days after their date. Nothing to do here, an event still shows in the main upcoming list for a week after it happens (so RSVPs and reflections can settle), then it drops down into the Past Events section further down the page, photos and all

**One-time setup:** the very first time anyone opens the updated `admin.html`, click **"Import current site content"** near the top of the dashboard. This copies whatever's currently on the live site into the editable database, so nothing is lost — it only fills in collections that are still empty, so it's safe even if someone clicks it twice.

After that, all edits happen in the browser via forms — no GitHub, no HTML, no re-uploading files. Changes save straight to Firestore and show up on the live site within a few seconds of refreshing.

**Note on committee photos:** the "Photo URL" field expects a link to an already-hosted image (e.g. uploaded to the GitHub repo, or any image host) — it doesn't handle file uploads directly. Leaving it blank keeps the colored initial-letter avatar.

**Note on reflection questions:** if an event has no questions ticked in its "Reflection questions to ask for this event" list, members leaving a reflection on that event will see one general fallback question instead of a blank form. Tick at least one question per event to use the proper question bank.

**Note on Passport tasks:** a small handful of the original tasks (e.g. "Attend a careers fair") prompt members to link the stamp to a specific event when they tick it. That linking is tied to a task's original position in its category, so reordering or deleting tasks in a category may cause that prompt to appear on a different task than before, or stop appearing. It's a minor cosmetic nicety, not something that affects stamps, levels, or progress tracking.
