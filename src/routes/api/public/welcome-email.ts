const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const FROM_EMAIL = "Your Website <welcome@yourwebsite.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const body = await req.json();

    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Recipient email is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const displayName = name || "there";

    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: "🎉 Welcome to Your Website!",
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f7fa;
  font-family:Arial,Helvetica,sans-serif;
  color:#263644;
">

  <div style="
    max-width:600px;
    margin:40px auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 4px 20px rgba(0,0,0,.08);
  ">

    <div style="
      background:#263644;
      color:#ffffff;
      padding:30px;
      text-align:center;
    ">
      <h1 style="margin:0;font-size:28px;">
        🎉 Welcome!
      </h1>
    </div>

    <div style="padding:35px 30px;">

      <h2 style="margin-top:0;">
        Hello ${escapeHtml(displayName)}!
      </h2>

      <p style="font-size:16px;line-height:1.7;">
        Congratulations! Your account has been successfully created.
      </p>

      <p style="font-size:16px;line-height:1.7;">
        Welcome to our platform. Your account is now ready and
        you can sign in and start using our services.
      </p>

      <div style="
        margin:30px 0;
        padding:20px;
        background:#f5f7fa;
        border-radius:8px;
        text-align:center;
      ">
        <strong>Your account is ready.</strong>
        <br>
        You can now log in and continue.
      </div>

      <p style="font-size:15px;line-height:1.6;">
        Thank you for joining us. We're glad to have you here.
      </p>

    </div>

    <div style="
      padding:20px 30px;
      background:#f5f7fa;
      text-align:center;
      font-size:12px;
      color:#667085;
    ">
      © ${new Date().getFullYear()} Your Website
    </div>

  </div>

</body>
</html>
          `,
        }),
      }
    );

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Email provider rejected the message.",
          details: resendData,
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id ?? null,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Welcome email error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error
          ? error.message
          : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});


function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
