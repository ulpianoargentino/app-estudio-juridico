import puppeteer from "puppeteer";

export interface PdfOptions {
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  pageSize?: "A4" | "Letter" | "Legal";
  headerHtml?: string;
  footerHtml?: string;
}

const DEFAULT_OPTIONS: Required<PdfOptions> = {
  marginTop: "3cm",
  marginBottom: "2.5cm",
  marginLeft: "3cm",
  marginRight: "2cm",
  pageSize: "A4",
  headerHtml: "",
  footerHtml: `
    <div style="font-size: 9px; width: 100%; text-align: center; color: #666;">
      Página <span class="pageNumber"></span> de <span class="totalPages"></span>
    </div>
  `,
};

// Wraps the HTML content with professional legal styling
function wrapHtml(html: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; }
        body {
          font-family: "Times New Roman", Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000;
          margin: 0;
          padding: 0;
        }
        p { margin: 0 0 0.5em 0; text-align: justify; }
        h1, h2, h3 { font-family: "Times New Roman", Times, serif; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #000; padding: 4px 8px; }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `;
}

export async function generatePdf(
  html: string,
  options: PdfOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(wrapHtml(html), { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: opts.pageSize,
      margin: {
        top: opts.marginTop,
        bottom: opts.marginBottom,
        left: opts.marginLeft,
        right: opts.marginRight,
      },
      printBackground: true,
      displayHeaderFooter: !!(opts.headerHtml || opts.footerHtml),
      headerTemplate: opts.headerHtml || "<span></span>",
      footerTemplate: opts.footerHtml || "<span></span>",
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
