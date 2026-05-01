export function welcomeHtml(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Epigram</title>
</head>
<body style="margin:0;padding:0;background-color:#faf9f5;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 24px;">

    <h1 style="margin:0 0 36px 0;font-size:22px;color:#141310;letter-spacing:-0.3px;">Epigram</h1>

    <div style="color:#141310;font-size:16px;line-height:1.75;">

      <p style="margin:0 0 20px 0;">Hi ${name},</p>

      <p style="margin:0 0 20px 0;">
        Welcome to Epigram. You now have access to our free quant interview problem set — real
        questions from top funds, with structured solutions.
      </p>

      <p style="margin:0 0 8px 0;">
        To get you started, we&apos;ve attached two free cheatsheets:
      </p>
      <ul style="margin:0 0 20px 0;padding-left:20px;">
        <li style="margin-bottom:6px;"><strong>Coding Patterns Cheatsheet</strong> — the core algorithmic patterns that show up repeatedly in quant interviews</li>
        <li style="margin-bottom:6px;"><strong>Quant Interview Cheatsheet</strong> — key concepts, formulas, and frameworks across probability, stats, and finance</li>
      </ul>

      <p style="margin:0 0 20px 0;">
        We also run a free weekly newsletter —
        <strong>The Quant Signal</strong> — with real interview problems, prep tips, and strategy
        notes to help you prepare for top funds with sharper signal and less wasted effort.
      </p>

      <p style="margin:0 0 32px 0;">
        <a href="https://epigrams-the-quant-signal.beehiiv.com/"
           style="display:inline-block;background-color:#141310;color:#faf9f5;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;font-family:Georgia,serif;">
          Subscribe to The Quant Signal &rarr;
        </a>
      </p>

      <p style="margin:0 0 20px 0;">Good luck with your prep,<br/>The Epigram Team</p>

    </div>

    <div style="margin-top:48px;padding-top:24px;border-top:1px solid rgb(240,238,230);">
      <p style="margin:0;font-size:12px;color:#999;font-family:Georgia,serif;">
        You received this because you created an account at
        <a href="https://epi-gram.app" style="color:#999;">epi-gram.app</a>.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}
