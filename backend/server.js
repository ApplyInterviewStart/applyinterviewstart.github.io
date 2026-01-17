require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
  origin: "https://applyinterviewstart.com",
  methods: ["GET", "POST"],
}));

app.use(express.json());

// 🔑 PRICE ID → THANK YOU PAGE MAP
const PRICE_TO_SUCCESS_PAGE = {
  // Resume Writing
  "price_1SmuSIAdRfgqgRAmiM2CKoFV":
    "https://applyinterviewstart.com/thankyou-resume.html",

  // Interview Prep
  "price_1SmuSdAdRfgqgRAmLlpOEYAl":
    "https://applyinterviewstart.com/thankyou-interview.html",

  // Career Consult (REPLACE WITH YOUR REAL price_... ID)
  "price_1SqipxPFQklnj0iwLoRPC1wg":
    "https://applyinterviewstart.com/thankyou-consult.html",

  // Bundle (optional legacy — safe to keep until you fully remove it)
  "price_1SmuSoAdRfgqgRAmj6VQOjAJ":
    "https://applyinterviewstart.com/thankyou-bundle.html",
};

app.post("/create-checkout-session", async (req, res) => {
  const { priceId } = req.body;
  const successUrl = PRICE_TO_SUCCESS_PAGE[priceId];

  if (!successUrl) return res.status(400).json({ error: "Invalid price ID" });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: "https://applyinterviewstart.com/?canceled=true",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

function makeTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("Missing SMTP env vars. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

const safe = (v) => (typeof v === "string" ? v.trim() : "");

app.post("/submit-career-questions", async (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return res.status(500).json({ error: "Server misconfigured: ADMIN_EMAIL not set." });

  const b = req.body || {};

  const clientEmail = safe(b.clientEmail);
  const fullName = safe(b.fullName);

  if (!clientEmail || !fullName) {
    return res.status(400).json({ error: "Please provide your full name and email." });
  }

  const answersText =
`Resume Builder Intake Form

BASIC INFO
Full Name: ${fullName}
Email: ${clientEmail}
Phone: ${safe(b.phone)}
LinkedIn: ${safe(b.linkedin)}

WORK EXPERIENCE
Job #1 Title+Company: ${safe(b.job1Title)}
Job #1 Dates: ${safe(b.job1Dates)}
Job #1 Responsibilities/Contributions:
${safe(b.job1Resp)}

Job #2 Title+Company: ${safe(b.job2Title)}
Job #2 Dates: ${safe(b.job2Dates)}
Job #2 Responsibilities/Contributions:
${safe(b.job2Resp)}

Job #3 Title+Company: ${safe(b.job3Title)}
Job #3 Dates: ${safe(b.job3Dates)}
Job #3 Responsibilities/Contributions:
${safe(b.job3Resp)}

EDUCATION / CERTIFICATIONS
#1: ${safe(b.edu1Name)} — ${safe(b.edu1Date)}
#2: ${safe(b.edu2Name)} — ${safe(b.edu2Date)}
#3: ${safe(b.edu3Name)} — ${safe(b.edu3Date)}

SKILLS
${safe(b.skills)}

HOBBIES / INTERESTS
${safe(b.hobbies)}

QUESTIONS (STANDOUT)
Lab/Science Experience:
${safe(b.qLab)}

Computers/Data Analysis/Technical Tools:
${safe(b.qData)}

Teams/Leadership/Projects/Management:
${safe(b.qTeams)}

Certifications/Awards/Recognitions:
${safe(b.qAwards)}

Resume Template Preferences:
${safe(b.qTemplate)}
`;

  try {
    const transporter = makeTransporter();

    // Email to YOU
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: adminEmail,
      subject: `New Resume Intake Form — ${fullName}`,
      text: answersText,
      replyTo: clientEmail,
    });

    // Confirmation email to CLIENT
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: clientEmail,
      subject: "We received your Resume Builder intake ✅",
      text:
`Thanks, ${fullName} — we received your Resume Builder intake form.

If you need to update anything, just reply to this email.

ApplyInterviewStart.com`,
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Email error:", error.message);
    return res.status(500).json({ error: "Email failed to send. Please try again." });
  }
});

app.get("/", (req, res) => res.send("OK"));

app.get("/debug-prices", (req, res) => {
  res.json({ prices: Object.keys(PRICE_TO_SUCCESS_PAGE) });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
