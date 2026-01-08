(() => {
  const DEFAULT_FIELDS = [
    { key: "Make", label: "Make", keywords: ["make", "brand"] },
    { key: "Model", label: "Model", keywords: ["model"] },
    { key: "ModelYear", label: "Model year", keywords: ["year", "model year"] },
    { key: "Trim", label: "Trim", keywords: ["trim", "package"] },
    { key: "Series", label: "Series", keywords: ["series"] },
    { key: "BodyClass", label: "Body style", keywords: ["body", "body style", "body class"] },
    { key: "VehicleType", label: "Vehicle type", keywords: ["vehicle type", "type"] },
    { key: "DriveType", label: "Drive", keywords: ["drive", "drivetrain", "awd", "fwd", "rwd"] },
    { key: "EngineCylinders", label: "Cylinders", keywords: ["cylinder", "cylinders"] },
    { key: "DisplacementL", label: "Engine size (L)", keywords: ["engine size", "displacement", "liter", "litre"] },
    { key: "FuelTypePrimary", label: "Fuel", keywords: ["fuel", "gas", "diesel", "electric"] },
    { key: "TransmissionStyle", label: "Transmission", keywords: ["transmission", "automatic", "manual"] },
    { key: "Doors", label: "Doors", keywords: ["door", "doors"] },
    { key: "PlantCountry", label: "Built in", keywords: ["plant", "built", "country", "made in"] },
  ];

  const EMPTY_MESSAGE = "Decode a VIN to start. Ask about make, model, engine, drivetrain, and more.";

  const createEl = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };

  class CarzlotChatbot {
    constructor({ containerId = "carzlot-chatbot" } = {}) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        throw new Error(`Container #${containerId} not found.`);
      }

      this.state = {
        vin: "",
        vinData: null,
        vinDecodedAt: null,
      };

      this.render();
      this.bindEvents();
      this.appendBotMessage("Hi! Enter a VIN to decode a vehicle, then ask me anything about it.");
    }

    render() {
      this.container.innerHTML = "";
      this.container.classList.add("carzlot-widget");

      const header = createEl("div", "carzlot-header");
      const title = createEl("div", "carzlot-title", "Carzlot Vehicle Assistant");
      const subtitle = createEl("div", "carzlot-subtitle", "VIN-powered answers for your inventory");
      header.append(title, subtitle);

      const vinBar = createEl("div", "carzlot-vin-bar");
      this.vinInput = createEl("input", "carzlot-vin-input");
      this.vinInput.placeholder = "Enter 17-character VIN";
      this.vinInput.maxLength = 17;
      this.vinButton = createEl("button", "carzlot-vin-button", "Decode VIN");
      this.vinStatus = createEl("div", "carzlot-vin-status", EMPTY_MESSAGE);
      vinBar.append(this.vinInput, this.vinButton);

      this.messages = createEl("div", "carzlot-messages");

      const inputRow = createEl("div", "carzlot-input-row");
      this.questionInput = createEl("input", "carzlot-question-input");
      this.questionInput.placeholder = "Ask a question about this vehicle";
      this.sendButton = createEl("button", "carzlot-send-button", "Send");
      inputRow.append(this.questionInput, this.sendButton);

      this.container.append(header, vinBar, this.vinStatus, this.messages, inputRow);
    }

    bindEvents() {
      this.vinButton.addEventListener("click", () => this.decodeVin());
      this.vinInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          this.decodeVin();
        }
      });
      this.sendButton.addEventListener("click", () => this.handleQuestion());
      this.questionInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          this.handleQuestion();
        }
      });
    }

    appendMessage(text, type = "bot") {
      const bubble = createEl("div", `carzlot-message carzlot-${type}`, text);
      this.messages.appendChild(bubble);
      this.messages.scrollTop = this.messages.scrollHeight;
    }

    appendBotMessage(text) {
      this.appendMessage(text, "bot");
    }

    appendUserMessage(text) {
      this.appendMessage(text, "user");
    }

    async decodeVin() {
      const vin = this.vinInput.value.trim().toUpperCase();
      if (!vin || vin.length < 11) {
        this.vinStatus.textContent = "Please enter a valid VIN (11-17 characters).";
        return;
      }

      this.vinStatus.textContent = "Decoding VIN...";
      this.vinButton.disabled = true;
      this.vinButton.textContent = "Decoding...";

      try {
        const response = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${vin}?format=json`
        );
        const payload = await response.json();
        const result = payload.Results && payload.Results[0];

        if (!result || result.ErrorCode !== "0") {
          this.vinStatus.textContent = "We could not decode that VIN. Double-check the number and try again.";
          this.vinButton.disabled = false;
          this.vinButton.textContent = "Decode VIN";
          return;
        }

        this.state.vin = vin;
        this.state.vinData = result;
        this.state.vinDecodedAt = new Date();

        this.vinStatus.textContent = `VIN decoded: ${result.ModelYear} ${result.Make} ${result.Model}.`;
        this.appendBotMessage(`I decoded the VIN for a ${result.ModelYear} ${result.Make} ${result.Model}. What would you like to know?`);
      } catch (error) {
        this.vinStatus.textContent = "Trouble reaching the VIN decoder. Please try again.";
      } finally {
        this.vinButton.disabled = false;
        this.vinButton.textContent = "Decode VIN";
      }
    }

    handleQuestion() {
      const question = this.questionInput.value.trim();
      if (!question) return;

      this.appendUserMessage(question);
      this.questionInput.value = "";

      if (!this.state.vinData) {
        this.appendBotMessage("Please decode a VIN first so I can answer accurately.");
        return;
      }

      const answer = this.answerQuestion(question);
      this.appendBotMessage(answer);
    }

    answerQuestion(question) {
      const normalized = question.toLowerCase();
      const matched = DEFAULT_FIELDS.find((field) =>
        field.keywords.some((keyword) => normalized.includes(keyword))
      );

      if (matched) {
        const value = this.state.vinData[matched.key];
        if (value) {
          return `${matched.label}: ${value}.`;
        }
        return `${matched.label} isn't available from this VIN.`;
      }

      if (normalized.includes("everything") || normalized.includes("details") || normalized.includes("summary")) {
        return this.buildSummary();
      }

      return "I can answer questions about make, model, trim, drivetrain, engine, transmission, body style, and more from the VIN. Try asking about one of those.";
    }

    buildSummary() {
      const details = DEFAULT_FIELDS.map((field) => {
        const value = this.state.vinData[field.key];
        return value ? `${field.label}: ${value}` : null;
      }).filter(Boolean);

      if (!details.length) {
        return "I wasn't able to pull details from this VIN.";
      }

      return `Here is a quick summary: ${details.join(", ")}.`;
    }
  }

  window.CarzlotChatbot = {
    init(options) {
      return new CarzlotChatbot(options);
    },
  };
})();
