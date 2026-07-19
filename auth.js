// ============================================================
// Beyond Borders — KCL email sign-in + BB Passport number
// ============================================================
// Requires firebase-config.js to have run first (defines
// `firebase`, `auth`, `db`).
//
// Flow:
//   1. User enters firstname.surname@kcl.ac.uk
//   2. We email them a passwordless sign-in link (Firebase Auth
//      "email link" method)
//   3. They open the link on this device -> we finish sign-in
//   4. We look up (or create, via an atomic counter) their
//      unique BB-XXXX passport number in Firestore
//   5. Nav bar updates to show their name + passport number
// ============================================================

const KCL_EMAIL_RE = /^[a-z]+(?:-[a-z]+)*\.[a-z]+(?:-[a-z]+)*@kcl\.ac\.uk$/i;

function splitName(email) {
  const local = email.split('@')[0];
  const [first, last] = local.split('.');
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  return { first: cap(first), last: cap(last) };
}

// ---- DOM refs ----
const signInModal = document.getElementById('signInModal');
const signInStep1 = document.getElementById('signInStep1');
const signInStep2 = document.getElementById('signInStep2');
const signInStep3 = document.getElementById('signInStep3');
const kclEmailInput = document.getElementById('kclEmail');
const sendLinkBtn = document.getElementById('sendLinkBtn');
const signInError = document.getElementById('signInError');
const sentToEmail = document.getElementById('sentToEmail');
const assignedPassportNo = document.getElementById('assignedPassportNo');
const welcomeEmailLine = document.getElementById('welcomeEmailLine');

const signInNavBtn = document.getElementById('signInNavBtn');
const navUser = document.getElementById('navUser');
const navGreeting = document.getElementById('navGreeting');
const navPassportNo = document.getElementById('navPassportNo');
const signOutBtn = document.getElementById('signOutBtn');
const feedbackNavBtn = document.getElementById('feedbackNavBtn');

const feedbackModal = document.getElementById('feedbackModal');
const feedbackText = document.getElementById('feedbackText');
const feedbackError = document.getElementById('feedbackError');
const feedbackSuccess = document.getElementById('feedbackSuccess');
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');

function openModal(modal) {
  resetModalMessages();
  modal.classList.add('open');
}
function closeModal(modal) { modal.classList.remove('open'); }
function resetModalMessages() {
  [signInError, feedbackError].forEach(el => { el.classList.remove('show'); el.textContent = ''; });
  feedbackSuccess.classList.remove('show');
}

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    closeModal(signInModal);
    closeModal(feedbackModal);
  });
});
[signInModal, feedbackModal].forEach(modal => {
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
});

signInNavBtn.addEventListener('click', () => {
  signInStep1.style.display = '';
  signInStep2.style.display = 'none';
  signInStep3.style.display = 'none';
  openModal(signInModal);
});

feedbackNavBtn.addEventListener('click', () => openModal(feedbackModal));

// ---- Send sign-in link ----
sendLinkBtn.addEventListener('click', async () => {
  const email = kclEmailInput.value.trim().toLowerCase();
  signInError.classList.remove('show');

  if (!KCL_EMAIL_RE.test(email)) {
    signInError.textContent = 'Please use your KCL email in the form firstname.surname@kcl.ac.uk';
    signInError.classList.add('show');
    return;
  }

  sendLinkBtn.disabled = true;
  sendLinkBtn.textContent = 'Sending...';

  const actionCodeSettings = {
    url: window.location.origin + window.location.pathname,
    handleCodeInApp: true,
  };

  try {
    await auth.sendSignInLinkToEmail(email, actionCodeSettings);
    window.localStorage.setItem('bbEmailForSignIn', email);
    sentToEmail.textContent = email;
    signInStep1.style.display = 'none';
    signInStep2.style.display = '';
  } catch (err) {
    signInError.textContent = 'Could not send link: ' + err.message;
    signInError.classList.add('show');
  } finally {
    sendLinkBtn.disabled = false;
    sendLinkBtn.textContent = 'Send sign-in link';
  }
});

// ---- Complete sign-in if we arrived via the emailed link ----
async function completeEmailLinkSignInIfPresent() {
  if (!auth.isSignInWithEmailLink(window.location.href)) return;

  let email = window.localStorage.getItem('bbEmailForSignIn');
  if (!email) {
    email = window.prompt('Confirm your KCL email to finish signing in:');
  }
  if (!email || !KCL_EMAIL_RE.test(email.trim().toLowerCase())) {
    alert('That link needs to be opened with a valid firstname.surname@kcl.ac.uk address.');
    return;
  }
  email = email.trim().toLowerCase();

  try {
    await auth.signInWithEmailLink(email, window.location.href);
    window.localStorage.removeItem('bbEmailForSignIn');
    // clean the sign-in params out of the URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (err) {
    alert('Sign-in failed: ' + err.message);
  }
}

// ---- Passport number: read existing, or atomically assign the next one ----
async function getOrAssignPassportNumber(user) {
  const userRef = db.collection('users').doc(user.uid);
  const counterRef = db.collection('meta').doc('passportCounter');
  const { first, last } = splitName(user.email);

  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (userSnap.exists && userSnap.data().passportNo) {
      return userSnap.data().passportNo;
    }
    const counterSnap = await tx.get(counterRef);
    const next = counterSnap.exists ? (counterSnap.data().next || 1) : 1;
    const passportNo = 'BB-' + String(next).padStart(4, '0');

    tx.set(counterRef, { next: next + 1 }, { merge: true });
    tx.set(userRef, {
      email: user.email,
      firstName: first,
      lastName: last,
      passportNo,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return passportNo;
  });
}

// ---- Nav UI ----
function updateNavForUser(user, passportNo) {
  if (user) {
    const { first } = splitName(user.email);
    navGreeting.textContent = 'Hi, ' + first;
    navPassportNo.textContent = passportNo || '...';
    navUser.classList.add('visible');
    signInNavBtn.style.display = 'none';
    feedbackNavBtn.style.display = '';
  } else {
    navUser.classList.remove('visible');
    signInNavBtn.style.display = '';
    feedbackNavBtn.style.display = 'none';
  }
}

signOutBtn.addEventListener('click', async () => {
  await auth.signOut();
});

// ---- Feedback ----
submitFeedbackBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return;
  const message = feedbackText.value.trim();
  feedbackError.classList.remove('show');

  if (!message) {
    feedbackError.textContent = 'Please write something before submitting.';
    feedbackError.classList.add('show');
    return;
  }

  submitFeedbackBtn.disabled = true;
  submitFeedbackBtn.textContent = 'Sending...';

  try {
    const passportNo = navPassportNo.textContent;
    await db.collection('feedback').add({
      uid: user.uid,
      email: user.email,
      passportNo,
      message,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    feedbackText.value = '';
    feedbackSuccess.classList.add('show');
  } catch (err) {
    feedbackError.textContent = 'Could not submit feedback: ' + err.message;
    feedbackError.classList.add('show');
  } finally {
    submitFeedbackBtn.disabled = false;
    submitFeedbackBtn.textContent = 'Submit feedback';
  }
});

// ---- Auth state ----
let justSignedIn = false;

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    updateNavForUser(null);
    return;
  }
  const passportNo = await getOrAssignPassportNumber(user);
  updateNavForUser(user, passportNo);

  if (justSignedIn) {
    justSignedIn = false;
    assignedPassportNo.textContent = passportNo;
    welcomeEmailLine.textContent = user.email;
    signInStep1.style.display = 'none';
    signInStep2.style.display = 'none';
    signInStep3.style.display = '';
    openModal(signInModal);
  }
});

(async function init() {
  if (auth.isSignInWithEmailLink(window.location.href)) {
    justSignedIn = true;
    await completeEmailLinkSignInIfPresent();
  }
})();
