# Carzlot_ChatBot
AI chatbot for car dealership

## Carzlot Vehicle Assistant Widget
This repo includes a lightweight, embeddable chatbot widget you can drop into any dealership website. It decodes VINs using the NHTSA VIN API and answers questions about the vehicle based on the decoded data.

### Quick start
1. Copy the `widget/` folder into your web project.
2. Add the stylesheet and script to your page.
3. Initialize the widget with the container ID.

```html
<link rel="stylesheet" href="/path/to/chatbot.css" />
<div id="carzlot-chatbot"></div>
<script src="/path/to/chatbot.js"></script>
<script>
  window.CarzlotChatbot.init({ containerId: "carzlot-chatbot" });
</script>
```

### Demo
Open `widget/index.html` in a browser to see the clean UI and try decoding a VIN.

### How it works
- Shoppers enter a VIN.
- The widget calls the NHTSA VIN decoder API.
- The chatbot answers questions about make, model, trim, drivetrain, engine, transmission, body style, and more.

### Customize
Edit `widget/chatbot.css` to match your dealership brand colors and typography.
