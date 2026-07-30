/**
 * Generate role-fit CV PDFs from cv/src/*.html
 * Usage: node scripts/generate-cv-pdfs.js
 */
const path = require("path");
const fs = require("fs");

async function main() {
  const { chromium } = require("playwright");
  const root = path.join(__dirname, "..");
  const srcDir = path.join(root, "cv", "src");
  const outDir = path.join(root, "cv");
  fs.mkdirSync(outDir, { recursive: true });

  const jobs = [
    { src: "hr-ta.html", out: "Illes_Kristof_HR-TA_CV.pdf" },
    { src: "delivery.html", out: "Illes_Kristof_Delivery_CV.pdf" },
    { src: "build.html", out: "Illes_Kristof_Build_CV.pdf" },
    { src: "ops.html", out: "Illes_Kristof_Ops_CV.pdf" },
  ];

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const job of jobs) {
    const fileUrl = "file:///" + path.join(srcDir, job.src).replace(/\\/g, "/");
    await page.goto(fileUrl, { waitUntil: "networkidle" });
    const outPath = path.join(outDir, job.out);
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });
    console.log("Wrote", outPath);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
