let dakshoraMessages = [];
let recognition = null;
let isListening = false;


/* =========================================
   PAGE INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  const menu = document.querySelector(".menu-btn");
  const nav = document.querySelector(".nav");

  if (menu) {
    menu.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }


  /* Smooth navigation */

  document
    .querySelectorAll('a[href^="#"]')
    .forEach(a => {

      a.addEventListener("click", e => {

        const id = a.getAttribute("href");

        if (
          id.length > 1 &&
          document.querySelector(id)
        ) {

          e.preventDefault();

          document
            .querySelector(id)
            .scrollIntoView({
              behavior: "smooth"
            });

          if (nav) {
            nav.classList.remove("open");
          }
        }

      });

    });


  /* Goal buttons */

  document
    .querySelectorAll("[data-goal]")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        const goal = btn.dataset.goal;

        const input =
          document.getElementById("heroQuestion");

        if (input) {
          input.value = goal;
        }

        document
          .getElementById("ai")
          ?.scrollIntoView({
            behavior: "smooth"
          });

        setTimeout(() => {
          sendDakshoraMessage(goal);
        }, 500);

      });

    });


  /* Hero Ask */

  document
    .getElementById("heroAsk")
    ?.addEventListener("click", () => {

      const input =
        document.getElementById("heroQuestion");

      const text =
        input?.value?.trim();

      if (text) {
        sendDakshoraMessage(text);
      } else {

        document
          .getElementById("ai")
          ?.scrollIntoView({
            behavior: "smooth"
          });

      }

    });


  /* Send button */

  document
    .getElementById("aiSend")
    ?.addEventListener("click", () => {

      sendDakshoraMessage();

    });


  /* Enter to send */

  document
    .getElementById("aiInput")
    ?.addEventListener("keydown", e => {

      if (
        e.key === "Enter" &&
        !e.shiftKey
      ) {

        e.preventDefault();

        sendDakshoraMessage();

      }

    });


  /* New chat */

  document
    .getElementById("newChatBtn")
    ?.addEventListener("click", () => {

      startNewDakshoraChat();

    });


  /* Voice */

  setupVoiceRecognition();


  /* Restore previous chat */

  loadDakshoraChat();


  /* Scroll animation */

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }

        });

      },
      {
        threshold: 0.12
      }
    );


  document
    .querySelectorAll(".reveal")
    .forEach(el => {
      observer.observe(el);
    });


  /* Existing solution buttons */

  document
    .querySelectorAll("[data-solution]")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        showToast(
          btn.dataset.solution +
          " request selected."
        );

        location.href =
          "contact.html";

      });

    });

});


/* =========================================
   SEND MESSAGE
========================================= */

async function sendDakshoraMessage(textFromOutside = null) {

  const input =
    document.getElementById("aiInput");

  const text =
    textFromOutside ||
    input?.value?.trim();


  if (!text) {

    showToast(
      "कृपया अपनी समस्या बताइए।"
    );

    return;

  }


  /* Add user message */

  addChatMessage(
    "user",
    text
  );


  if (input) {
    input.value = "";
  }


  showTyping(true);


  try {

    /*
      Send the complete conversation
      to the server.
    */

    const response =
      await fetch(
        "/api/dakshora-ai",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            messages:
              dakshoraMessages

          })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "DAKSHORA AI request failed."
      );

    }


    const answer =
      data.answer ||
      "मुझे अभी जवाब तैयार करने में समस्या हुई।";


    /* Add AI message */

    addChatMessage(
      "assistant",
      answer,
      data.language
    );


  } catch (error) {

    console.error(
      "DAKSHORA AI:",
      error
    );


    addChatMessage(
      "assistant",
      "⚠️ अभी DAKSHORA AI से connection नहीं हो पाया। कृपया थोड़ी देर बाद फिर कोशिश करें।"
    );


    showToast(
      "DAKSHORA AI connection problem."
    );

  } finally {

    showTyping(false);

  }

}


/* =========================================
   ADD CHAT MESSAGE
========================================= */

function addChatMessage(
  role,
  text,
  language = null
) {

  const messages =
    document.getElementById(
      "chatMessages"
    );


  if (!messages) return;


  /*
    Save context.
  */

  dakshoraMessages.push({
    role:
      role === "user"
        ? "user"
        : "assistant",

    content: text
  });


  /*
    Save locally.
  */

  saveDakshoraChat();


  /*
    UI
  */

  const wrapper =
    document.createElement("div");


  wrapper.className =
    `chat-message ${
      role === "user"
        ? "user-message"
        : "bot-message"
    }`;


  const avatar =
    role === "user"
      ? "👤"
      : "🤖";


  const name =
    role === "user"
      ? "You"
      : "DAKSHORA AI";


  const content =
    document.createElement("div");


  content.className =
    "message-content";


  const safeText =
    escapeHTML(text)
      .replace(/\n/g, "<br>");


  content.innerHTML = `

    <strong>
      ${name}
    </strong>

    <p>
      ${safeText}
    </p>

    ${
      role === "assistant"
        ? `
          <div class="message-actions">

            <button
              type="button"
              class="speak-message">

              🔊 सुनें

            </button>

          </div>
        `
        : ""
    }

  `;


  wrapper.innerHTML = `

    <div class="message-avatar">
      ${avatar}
    </div>

  `;


  wrapper.appendChild(
    content
  );


  messages.appendChild(
    wrapper
  );


  /*
    Speak button
  */

  const speakButton =
    content.querySelector(
      ".speak-message"
    );


  if (speakButton) {

    speakButton.addEventListener(
      "click",
      () => {

        speakText(
          text,
          language ||
          detectSpeechLanguage(text)
        );

      }
    );

  }


  /*
    Scroll to newest message
  */

  messages.scrollTop =
    messages.scrollHeight;

}


/* =========================================
   TYPING INDICATOR
========================================= */

function showTyping(show) {

  const typing =
    document.getElementById(
      "aiTyping"
    );

  if (!typing) return;

  typing.hidden = !show;

}


/* =========================================
   VOICE RECOGNITION
========================================= */

function setupVoiceRecognition() {

  const mic =
    document.getElementById("aiMic");

  const input =
    document.getElementById("aiInput");

  const status =
    document.getElementById(
      "voiceStatus"
    );


  if (!mic || !input) return;


  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    mic.disabled = true;

    if (status) {

      status.textContent =
        "🎙️ इस browser में voice input उपलब्ध नहीं है।";

    }

    return;

  }


  recognition =
    new SpeechRecognition();


  recognition.continuous = false;

  recognition.interimResults = true;


  mic.addEventListener(
    "click",
    startVoiceRecognition
  );


  recognition.onstart = () => {

    isListening = true;

    mic.classList.add(
      "recording"
    );

    if (status) {

      status.textContent =
        "🔴 सुन रहा हूँ... बोलिए";

    }

  };


  recognition.onresult = event => {

    let transcript = "";


    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {

      transcript +=
        event.results[i][0].transcript;

    }


    input.value =
      transcript;

  };


  recognition.onerror = event => {

    console.error(
      "Speech recognition error:",
      event.error
    );


    if (status) {

      status.textContent =
        "⚠️ आवाज समझने में समस्या हुई। फिर कोशिश करें।";

    }

  };


  recognition.onend = () => {

    isListening = false;

    mic.classList.remove(
      "recording"
    );


    if (status) {

      status.textContent =
        "🎙️ फिर बोलने के लिए microphone दबाएँ";

    }

  };

}


/* =========================================
   START VOICE
========================================= */

function startVoiceRecognition() {

  if (!recognition) return;

  if (isListening) {

    recognition.stop();

    return;

  }


  const language =
    document.getElementById(
      "voiceLanguage"
    )?.value ||
    "auto";


  /*
    Browser speech recognition
    needs a language.

    Auto mode uses Hindi for
    Bharat-first default.
  */

  recognition.lang =
    language === "auto"
      ? "hi-IN"
      : language;


  try {

    recognition.start();

  } catch (error) {

    console.log(
      "Voice recognition already running."
    );

  }

}


/* =========================================
   TEXT TO SPEECH
========================================= */

function speakText(
  text,
  language = null
) {

  if (
    !("speechSynthesis" in window)
  ) {

    showToast(
      "इस device में voice playback उपलब्ध नहीं है।"
    );

    return;

  }


  speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(
      text
    );


  utterance.lang =
    language ||
    "hi-IN";


  utterance.rate = 0.9;

  utterance.pitch = 1;


  speechSynthesis.speak(
    utterance
  );

}


/* =========================================
   LANGUAGE DETECTION
========================================= */

function detectSpeechLanguage(text) {

  if (!text) {
    return "hi-IN";
  }


  if (
    /[\u0900-\u097F]/.test(text)
  ) {

    return "hi-IN";

  }


  if (
    /[\u0980-\u09FF]/.test(text)
  ) {

    return "bn-IN";

  }


  if (
    /[\u0A80-\u0AFF]/.test(text)
  ) {

    return "gu-IN";

  }


  if (
    /[\u0B80-\u0BFF]/.test(text)
  ) {

    return "ta-IN";

  }


  if (
    /[\u0C00-\u0C7F]/.test(text)
  ) {

    return "te-IN";

  }


  if (
    /[\u0C80-\u0CFF]/.test(text)
  ) {

    return "kn-IN";

  }


  if (
    /[\u0D00-\u0D7F]/.test(text)
  ) {

    return "ml-IN";

  }


  return "en-IN";

}


/* =========================================
   NEW CHAT
========================================= */

function startNewDakshoraChat() {

  const confirmed =
    confirm(
      "क्या आप current conversation हटाकर नई chat शुरू करना चाहते हैं?"
    );


  if (!confirmed) return;


  dakshoraMessages = [];


  localStorage.removeItem(
    "dakshora_chat_v1"
  );


  const messages =
    document.getElementById(
      "chatMessages"
    );


  if (messages) {

    messages.innerHTML = `

      <div class="chat-message bot-message">

        <div class="message-avatar">
          🤖
        </div>

        <div class="message-content">

          <strong>
            DAKSHORA AI
          </strong>

          <p>
            नई conversation शुरू हो गई है। 👋
            बताइए, मैं आपकी किस समस्या में मदद करूँ?
          </p>

        </div>

      </div>

    `;

  }

}


/* =========================================
   SAVE CHAT
========================================= */

function saveDakshoraChat() {

  try {

    localStorage.setItem(
      "dakshora_chat_v1",
      JSON.stringify(
        dakshoraMessages
      )
    );

  } catch (error) {

    console.warn(
      "Could not save chat.",
      error
    );

  }

}


/* =========================================
   LOAD CHAT
========================================= */

function loadDakshoraChat() {

  try {

    const saved =
      localStorage.getItem(
        "dakshora_chat_v1"
      );


    if (!saved) return;


    const parsed =
      JSON.parse(saved);


    if (
      !Array.isArray(parsed)
    ) return;


    dakshoraMessages =
      parsed;


    const messages =
      document.getElementById(
        "chatMessages"
      );


    if (!messages) return;


    /*
      Keep first welcome message.
    */

    const welcome =
      messages.innerHTML;


    messages.innerHTML = "";


    parsed.forEach(message => {

      addChatMessageUI(
        message.role,
        message.content
      );

    });


  } catch (error) {

    console.warn(
      "Could not restore chat.",
      error
    );

  }

}


/* =========================================
   RENDER SAVED MESSAGE
========================================= */

function addChatMessageUI(
  role,
  text
) {

  const messages =
    document.getElementById(
      "chatMessages"
    );


  if (!messages) return;


  const wrapper =
    document.createElement("div");


  wrapper.className =
    `chat-message ${
      role === "user"
        ? "user-message"
        : "bot-message"
    }`;


  const avatar =
    role === "user"
      ? "👤"
      : "🤖";


  const name =
    role === "user"
      ? "You"
      : "DAKSHORA AI";


  wrapper.innerHTML = `

    <div class="message-avatar">
      ${avatar}
    </div>

    <div class="message-content">

      <strong>
        ${name}
      </strong>

      <p>
        ${escapeHTML(text)
          .replace(/\n/g, "<br>")}
      </p>

      ${
        role === "assistant"
          ? `
            <div class="message-actions">

              <button
                type="button"
                class="speak-message">

                🔊 सुनें

              </button>

            </div>
          `
          : ""
      }

    </div>

  `;


  messages.appendChild(
    wrapper
  );


  const speakButton =
    wrapper.querySelector(
      ".speak-message"
    );


  if (speakButton) {

    speakButton.addEventListener(
      "click",
      () => {

        speakText(
          text,
          detectSpeechLanguage(text)
        );

      }
    );

  }

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================
   TOAST
========================================= */

function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    alert(message);

    return;

  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    window.__toast
  );


  window.__toast =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 3200);

}
