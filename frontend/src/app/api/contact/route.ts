import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;
    const screenshot = formData.get("screenshot") as File | null;

    // Validate required fields
    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Prepare attachments if screenshot is provided
    const attachments = [];
    if (screenshot) {
      const bytes = await screenshot.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      attachments.push({
        filename: screenshot.name,
        content: buffer,
      });
    }

    // Send email using Resend
    const { error } = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>", // You'll need to verify your domain to use custom from address
      to: ["info@epi-gram.app"],
      replyTo: email,
      subject: `New Contact Form Submission from ${email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${email}</p>
            <p style="margin: 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background-color: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          ${screenshot ? '<p style="color: #666; margin-top: 20px;"><em>Screenshot attached</em></p>' : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px;">
              This message was sent from the Epigram contact form.
            </p>
          </div>
        </div>
      `,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}