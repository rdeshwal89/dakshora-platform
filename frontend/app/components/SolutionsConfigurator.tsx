"use client";

import { useMemo, useState } from "react";

type Lang = "hi" | "en";

type Solution = {
  id: string;
  icon: string;
  title: string;
  hindi: string;
  description: string;
  color: string;
  demo: string;
};

const solutions: Solution[] = [
  {
    id: "school",
    icon: "🏫",
    title: "School Website",
    hindi: "स्कूल वेबसाइट",
    description:
      "Modern school website with admissions, academics, facilities, notices and enquiry system.",
    color: "blue",
    demo: "Modern School",
  },
  {
    id: "college",
    icon: "🎓",
    title: "College Website",
    hindi: "कॉलेज वेबसाइट",
    description:
      "Professional college presence with courses, departments, admissions and campus information.",
    color: "purple",
    demo: "Modern College",
  },
  {
    id: "coaching",
    icon: "📚",
    title: "Coaching Website",
    hindi: "कोचिंग वेबसाइट",
    description:
      "High-conversion coaching website designed for courses, admissions, enquiries and results.",
    color: "orange",
    demo: "Premium Coaching",
  },
  {
    id: "business",
    icon: "🏪",
    title: "Business / MSME",
    hindi: "बिज़नेस / MSME",
    description:
      "Professional business website to showcase products, services, trust and generate leads.",
    color: "green",
    demo: "Business Pro",
  },
  {
    id: "real-estate",
    icon: "🏠",
    title: "Real Estate",
    hindi: "रियल एस्टेट",
    description:
      "Property-focused website with listings, project details, enquiry and lead generation.",
    color: "cyan",
    demo: "Real Estate Pro",
  },
  {
    id: "startup",
    icon: "🚀",
    title: "Startup Website",
    hindi: "स्टार्टअप वेबसाइट",
    description:
      "Premium startup landing page designed for product positioning, trust and conversions.",
    color: "pink",
    demo: "Startup Launch",
  },
  {
    id: "professional",
    icon: "💼",
    title: "Professional Website",
    hindi: "प्रोफेशनल वेबसाइट",
    description:
      "Personal brand website for consultants, doctors, lawyers, creators and professionals.",
    color: "indigo",
    demo: "Professional Profile",
  },
  {
    id: "custom",
    icon: "⚡",
    title: "Custom Website",
    hindi: "कस्टम वेबसाइट",
    description:
      "A completely customized digital experience designed around your exact requirements.",
    color: "gold",
    demo: "Custom Experience",
  },
];

const industries = [
  "Education",
  "Coaching",
  "Retail / Shop",
  "Services",
  "Real Estate",
  "Startup",
  "Professional",
  "Other",
];

export default function SolutionsConfigurator() {
  const [lang, setLang] = useState<Lang>("hi");
  const [selected, setSelected] = useState("business");
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    business: "",
    phone: "",
    city: "",
    industry: "",
    requirement: "",
  });

  const selectedSolution = useMemo(
    () => solutions.find((item) => item.id === selected) ?? solutions[3],
    [selected],
  );

  const isHindi = lang === "hi";

  function updateForm(field: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function nextStep() {
    if (step < 3) {
      setStep((previous) => previous + 1);
    }
  }

  function previousStep() {
    if (step > 1) {
      setStep((previous) => previous - 1);
    }
  }

  function createWhatsAppMessage() {
    const message = isHindi
      ? `नमस्ते DakshOra, मुझे ${selectedSolution.hindi} बनवानी है।

नाम: ${form.name || "Not provided"}
Business/Organization: ${form.business || "Not provided"}
Phone: ${form.phone || "Not provided"}
City: ${form.city || "Not provided"}
Industry: ${form.industry || "Not provided"}
Requirement: ${form.requirement || "Demo के अनुसार website चाहिए"}

Selected Demo: ${selectedSolution.demo}

कृपया मुझे website development के बारे में बताएं।`
      : `Hello DakshOra, I want a ${selectedSolution.title}.

Name: ${form.name || "Not provided"}
Business/Organization: ${form.business || "Not provided"}
Phone: ${form.phone || "Not provided"}
City: ${form.city || "Not provided"}
Industry: ${form.industry || "Not provided"}
Requirement: ${form.requirement || "I want a website based on the selected demo"}

Selected Demo: ${selectedSolution.demo}

Please contact me regarding website development.`;

    return encodeURIComponent(message);
  }

  return (
    <section
      id="solutions"
      className="solutions-business"
      aria-label="DakshOra Solutions"
    >
      <div className="solutions-glow solutions-glow-one" />
      <div className="solutions-glow solutions-glow-two" />

      <div className="solutions-container">
        {/* HEADER */}

        <div className="solutions-heading">
          <div className="solutions-kicker">
            <span>✦</span>
            DAKSHORA SOLUTIONS
          </div>

          <div className="solutions-heading-row">
            <div>
              <h2>
                {isHindi ? (
                  <>
                    आपके Business के लिए
                    <br />
                    <span>Perfect Website.</span>
                  </>
                ) : (
                  <>
                    A website that makes
                    <br />
                    <span>your business stand out.</span>
                  </>
                )}
              </h2>

              <p>
                {isHindi
                  ? "अपनी जरूरत बताइए, अपनी पसंद चुनिए और अपनी पसंद के अनुसार website demo देखिए।"
                  : "Tell us what you need, choose your style and preview a website designed around your business."}
              </p>
            </div>

            <div className="language-switcher">
              <button
                className={isHindi ? "active" : ""}
                onClick={() => setLang("hi")}
                type="button"
              >
                हिन्दी
              </button>

              <button
                className={!isHindi ? "active" : ""}
                onClick={() => setLang("en")}
                type="button"
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* PROGRESS */}

        <div className="solutions-progress">
          {[
            [1, isHindi ? "Website चुनें" : "Choose Website"],
            [2, isHindi ? "अपनी जानकारी दें" : "Your Details"],
            [3, isHindi ? "Demo देखें & Book करें" : "Preview & Book"],
          ].map(([number, label]) => (
            <div
              className={step >= Number(number) ? "active" : ""}
              key={number}
            >
              <span>{number}</span>
              <b>{label}</b>
            </div>
          ))}
        </div>

        {/* STEP 1 */}

        {step === 1 && (
          <div className="solutions-step">
            <div className="step-title">
              <span>01</span>

              <div>
                <h3>
                  {isHindi
                    ? "आपको किस तरह की website चाहिए?"
                    : "What type of website do you need?"}
                </h3>

                <p>
                  {isHindi
                    ? "एक option चुनें — आगे आपको उसी category का demo दिखाया जाएगा।"
                    : "Choose one option and we’ll personalize the next step for you."}
                </p>
              </div>
            </div>

            <div className="solution-options">
              {solutions.map((solution) => (
                <button
                  type="button"
                  key={solution.id}
                  className={`solution-option ${solution.color} ${
                    selected === solution.id ? "selected" : ""
                  }`}
                  onClick={() => setSelected(solution.id)}
                >
                  <span className="solution-option-icon">
                    {solution.icon}
                  </span>

                  <span className="solution-option-content">
                    <strong>
                      {isHindi ? solution.hindi : solution.title}
                    </strong>

                    <small>
                      {isHindi
                        ? solution.description
                        : solution.description}
                    </small>
                  </span>

                  <span className="solution-check">
                    {selected === solution.id ? "✓" : "→"}
                  </span>
                </button>
              ))}
            </div>

            <div className="solutions-action">
              <button
                type="button"
                className="solution-primary"
                onClick={nextStep}
              >
                {isHindi
                  ? "इस Website को चुनें →"
                  : "Continue with this →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}

        {step === 2 && (
          <div className="solutions-step">
            <div className="step-title">
              <span>02</span>

              <div>
                <h3>
                  {isHindi
                    ? "बस थोड़ी सी जानकारी दें"
                    : "Tell us a little about you"}
                </h3>

                <p>
                  {isHindi
                    ? "इन details से हम आपकी website demo को बेहतर personalize कर पाएंगे।"
                    : "These details help us personalize the website experience for your business."}
                </p>
              </div>
            </div>

            <div className="selected-service">
              <div>
                <span>{selectedSolution.icon}</span>

                <div>
                  <small>
                    {isHindi ? "Selected Service" : "Selected Service"}
                  </small>

                  <strong>
                    {isHindi
                      ? selectedSolution.hindi
                      : selectedSolution.title}
                  </strong>
                </div>
              </div>

              <button type="button" onClick={() => setStep(1)}>
                {isHindi ? "बदलें" : "Change"}
              </button>
            </div>

            <div className="client-form">
              <label>
                <span>
                  {isHindi ? "आपका नाम" : "Your Name"} *
                </span>

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                  placeholder={
                    isHindi ? "जैसे: Ranjeet Singh" : "e.g. Ranjeet Singh"
                  }
                />
              </label>

              <label>
                <span>
                  {isHindi
                    ? "Business / Organization का नाम"
                    : "Business / Organization Name"}{" "}
                  *
                </span>

                <input
                  value={form.business}
                  onChange={(event) =>
                    updateForm("business", event.target.value)
                  }
                  placeholder={
                    isHindi
                      ? "जैसे: ABC Public School"
                      : "e.g. ABC Public School"
                  }
                />
              </label>

              <label>
                <span>
                  {isHindi ? "Mobile Number" : "Mobile Number"} *
                </span>

                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateForm("phone", event.target.value)
                  }
                  placeholder="+91"
                />
              </label>

              <label>
                <span>
                  {isHindi ? "City" : "City"}
                </span>

                <input
                  value={form.city}
                  onChange={(event) =>
                    updateForm("city", event.target.value)
                  }
                  placeholder={
                    isHindi ? "जैसे: Faridabad" : "e.g. Faridabad"
                  }
                />
              </label>

              <label>
                <span>
                  {isHindi ? "आपका Business किस category में है?" : "Industry"}
                </span>

                <select
                  value={form.industry}
                  onChange={(event) =>
                    updateForm("industry", event.target.value)
                  }
                >
                  <option value="">
                    {isHindi ? "Select करें" : "Select"}
                  </option>

                  {industries.map((industry) => (
                    <option value={industry} key={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full-width">
                <span>
                  {isHindi
                    ? "Website में क्या चाहिए?"
                    : "What do you need on the website?"}
                </span>

                <textarea
                  rows={4}
                  value={form.requirement}
                  onChange={(event) =>
                    updateForm("requirement", event.target.value)
                  }
                  placeholder={
                    isHindi
                      ? "जैसे: Admission form, WhatsApp button, gallery, courses..."
                      : "e.g. Admission form, WhatsApp button, gallery, courses..."
                  }
                />
              </label>
            </div>

            <div className="solutions-action split">
              <button
                type="button"
                className="solution-back"
                onClick={previousStep}
              >
                ← {isHindi ? "Back" : "Back"}
              </button>

              <button
                type="button"
                className="solution-primary"
                onClick={nextStep}
              >
                {isHindi
                  ? "मेरी Website का Demo दिखाएँ →"
                  : "Show My Website Demo →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}

        {step === 3 && (
          <div className="solutions-step">
            <div className="step-title">
              <span>03</span>

              <div>
                <h3>
                  {isHindi
                    ? "आपके लिए एक Website direction तैयार है"
                    : "Here’s your website direction"}
                </h3>

                <p>
                  {isHindi
                    ? "यह preview आपकी चुनी हुई service के आधार पर बनाया गया है।"
                    : "This preview is based on the service and information you selected."}
                </p>
              </div>
            </div>

            <div className={`website-preview ${selectedSolution.color}`}>
              <div className="preview-browser">
                <div className="browser-dots">
                  <i />
                  <i />
                  <i />
                </div>

                <span>
                  {form.business ||
                    (isHindi ? "आपका Business" : "Your Business")}
                </span>

                <small>dakshora.site</small>
              </div>

              <div className="preview-body">
                <div className="preview-copy">
                  <small>
                    {selectedSolution.icon}{" "}
                    {isHindi
                      ? selectedSolution.hindi
                      : selectedSolution.title}
                  </small>

                  <h4>
                    {form.business ||
                      (isHindi
                        ? "आपके Business की Digital पहचान"
                        : "Your Digital Identity")}
                  </h4>

                  <p>
                    {isHindi
                      ? "एक premium, fast और mobile-friendly website जो visitors को customers में बदलने में मदद करे।"
                      : "A premium, fast and mobile-friendly website designed to turn visitors into customers."}
                  </p>

                  <div className="preview-buttons">
                    <span>
                      {isHindi ? "Contact करें" : "Get Started"}
                    </span>

                    <span>
                      {isHindi ? "Services देखें" : "Explore Services"}
                    </span>
                  </div>
                </div>

                <div className="preview-mockup">
                  <div className="mockup-top" />
                  <div className="mockup-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="mockup-cards">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>

            <div className="conversion-box">
              <div>
                <span className="conversion-icon">✦</span>

                <div>
                  <strong>
                    {isHindi
                      ? "क्या यह design पसंद आया?"
                      : "Like this direction?"}
                  </strong>

                  <p>
                    {isHindi
                      ? "DakshOra team आपकी requirement के अनुसार इसे final website में बदल सकती है।"
                      : "DakshOra can turn this direction into a complete website tailored to your requirements."}
                  </p>
                </div>
              </div>

              <div className="conversion-actions">
                <a
                  className="whatsapp-button"
                  href={`https://wa.me/?text=${createWhatsAppMessage()}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>💬</span>

                  {isHindi
                    ? "WhatsApp पर Book करें"
                    : "Book via WhatsApp"}
                </a>

                <button
                  type="button"
                  className="restart-button"
                  onClick={() => setStep(1)}
                >
                  {isHindi ? "फिर से शुरू करें" : "Start Again"}
                </button>
              </div>
            </div>

            <div className="trust-points">
              <span>✓ {isHindi ? "Mobile Responsive" : "Mobile Responsive"}</span>
              <span>✓ {isHindi ? "Premium Design" : "Premium Design"}</span>
              <span>✓ {isHindi ? "SEO Ready" : "SEO Ready"}</span>
              <span>✓ {isHindi ? "WhatsApp Integration" : "WhatsApp Integration"}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}