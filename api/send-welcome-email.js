import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const { error } = await resend.emails.send({
    from: "Tradelines Network <no-reply@tradelinesnetwork.trade>",
    to: [email],
    subject: "Welcome to Tradelines Network",
    html: `
      <h2>Welcome to Tradelines Network!</h2>
      <p>Your account has been created successfully.</p>
      <p>
        <a href="{{ .ConfirmationURL }}">
          Click to view tradelines
        </a>
      </p>
    `,
  });

  if (error) {
    return res.status(500).json({ error: "Email could not be sent" });
  }

  return res.status(200).json({ success: true });
}
