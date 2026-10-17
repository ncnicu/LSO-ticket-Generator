export type NumberPosition = { x: number; y: number };

export const DEFAULT_NUMBER_POSITION: NumberPosition = { x: 0.8865, y: 0.341 };
export const TICKET_WIDTH = 2000;
export const TICKET_HEIGHT = 647;

const serif = '"Cormorant Garamond", Georgia, serif';
const script = '"Great Vibes", cursive';

function text(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  font: string,
  options: { color?: string; align?: CanvasTextAlign; maxWidth?: number } = {},
) {
  context.font = font;
  context.fillStyle = options.color ?? "#f8fbff";
  context.textAlign = options.align ?? "left";
  if (options.maxWidth !== undefined) {
    context.fillText(value, x, y, options.maxWidth);
  } else {
    context.fillText(value, x, y);
  }
}

function drawBuiltInArtwork(context: CanvasRenderingContext2D) {
  context.save();
  context.fillStyle = "rgba(2, 13, 37, 0.12)";
  context.fillRect(0, 0, 1535, TICKET_HEIGHT);
  context.fillStyle = "rgba(34, 163, 185, 0.10)";
  context.fillRect(1537, 0, 463, TICKET_HEIGHT);

  // The soft clock numerals and silver script echo the supplied composition.
  context.save();
  context.shadowColor = "rgba(210, 248, 255, 0.6)";
  context.shadowBlur = 17;
  text(context, "VI", 435, 127, `600 75px ${serif}`, { color: "#eafaff" });
  text(context, "XII", 564, 122, `600 109px ${serif}`, { color: "#f3fbff" });
  text(context, "I", 764, 155, `600 105px ${serif}`, { color: "#f2fbff" });
  text(context, "II", 888, 272, `600 92px ${serif}`, { color: "#d4f2f6" });
  context.restore();

  context.save();
  context.translate(577, 340);
  context.rotate(-0.065);
  context.textAlign = "center";
  context.font = `400 305px ${script}`;
  context.shadowColor = "rgba(172, 233, 246, 0.72)";
  context.shadowBlur = 26;
  context.lineJoin = "round";
  context.lineWidth = 10;
  context.strokeStyle = "rgba(27, 44, 83, 0.9)";
  context.strokeText("Legato", 0, 0, 795);
  const silver = context.createLinearGradient(0, -250, 0, 50);
  silver.addColorStop(0, "#f9ffff");
  silver.addColorStop(0.22, "#8eb8cd");
  silver.addColorStop(0.43, "#f6ffff");
  silver.addColorStop(0.62, "#7798b6");
  silver.addColorStop(0.83, "#ebffff");
  silver.addColorStop(1, "#587997");
  context.fillStyle = silver;
  context.fillText("Legato", 0, 0, 795);
  context.shadowBlur = 0;
  context.lineWidth = 1.5;
  context.strokeStyle = "rgba(250, 255, 255, 0.8)";
  context.strokeText("Legato", 0, 0, 795);
  context.restore();

  context.save();
  context.shadowColor = "#d7faff";
  context.shadowBlur = 14;
  text(context, "Symphonies of the Ages", 585, 551, `400 69px ${script}`, {
    align: "center",
    color: "#e1f5f9",
    maxWidth: 625,
  });
  context.restore();

  // Small left-side orchestra lockup in the same vertical placement as the print.
  context.strokeStyle = "rgba(245, 255, 255, 0.86)";
  context.lineWidth = 2;
  [271, 329, 387].forEach((y, index) => {
    context.beginPath();
    context.arc(63, y, index === 1 ? 23 : 19, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(63, y, index === 1 ? 17 : 13, 0, Math.PI * 2);
    context.stroke();
  });
  text(context, "LSO", 63, 336, `700 18px ${serif}`, { align: "center" });
  text(context, "MUSIC", 63, 275, `700 10px ${serif}`, { align: "center" });
  text(context, "DLSU", 63, 391, `700 10px ${serif}`, { align: "center" });

  context.save();
  context.translate(139, 507);
  context.rotate(-Math.PI / 2);
  text(context, "LASALLIAN SYMPHONY ORCHESTRA", 0, 0, `700 26px ${serif}`);
  context.restore();
  context.save();
  context.translate(167, 441);
  context.rotate(-Math.PI / 2);
  text(context, "De La Salle University Dasmari\u00f1as", 0, 0, `italic 400 19px ${serif}`);
  context.restore();

  context.save();
  context.shadowColor = "rgba(0, 19, 40, 0.45)";
  context.shadowBlur = 7;
  context.strokeStyle = "rgba(245, 252, 255, 0.98)";
  context.lineWidth = 2;
  context.strokeRect(1080, 51, 395, 347);
  context.beginPath();
  context.moveTo(1080, 208);
  context.lineTo(1475, 208);
  context.moveTo(1080, 333);
  context.lineTo(1475, 333);
  context.stroke();

  text(context, "10", 1104, 161, `600 119px ${serif}`);
  text(context, "NOVEMBER", 1207, 116, `600 51px ${serif}`, { maxWidth: 250 });
  text(context, "2026", 1209, 164, `600 49px ${serif}`);
  text(context, "UNIVERSITY CHAPEL", 1278, 259, `600 49px ${serif}`, {
    align: "center",
    maxWidth: 365,
  });
  text(context, "Our Lady of the Most Holy Rosary Chapel -", 1278, 289, `italic 400 23px ${serif}`, {
    align: "center",
    maxWidth: 357,
  });
  text(context, "De La Salle University Dasmari\u00f1as", 1278, 311, `italic 400 23px ${serif}`, {
    align: "center",
    maxWidth: 357,
  });
  text(context, "SHOW 1: 2:00 PM - 4:00 PM", 1278, 378, `600 39px ${serif}`, {
    align: "center",
    maxWidth: 371,
  });

  const program = [
    "Ave Maria by Johann Sebastian Bach and Charles Gounod",
    "Partita No. 2 in D minor, Gigue by Johann Sebastian Bach",
    "Jesu, Joy of Man's Desiring by Johann Sebastian Bach",
    "Infernal Gallop by Jacques Offenbach",
    "Peer Gynt Suite No. 1 Opus 46 Morning Mood by Edvard Grieg",
    "An der sch\u00f6nen blauen Donau by Johann Strauss II",
    'The Planets "Jupiter" by Gustav Holst',
  ];
  program.forEach((line, index) => {
    text(context, line, 1278, 431 + index * 26, `italic 400 21px ${serif}`, {
      align: "center",
      maxWidth: 430,
    });
  });
  context.restore();

  // Ticket stub and perforation are part of the artwork, not an overlay.
  context.save();
  context.beginPath();
  context.setLineDash([12, 8]);
  context.moveTo(1535, 0);
  context.lineTo(1535, TICKET_HEIGHT);
  context.strokeStyle = "rgba(255, 255, 255, 0.98)";
  context.lineWidth = 4;
  context.stroke();
  context.setLineDash([]);

  context.shadowColor = "rgba(0, 24, 48, 0.48)";
  context.shadowBlur = 7;
  text(context, "CTRL #", 1773, 157, `600 51px ${serif}`, { align: "center" });
  context.shadowBlur = 0;
  context.fillStyle = "rgba(232, 248, 255, 0.76)";
  context.beginPath();
  context.roundRect(1612, 175, 323, 90, 23);
  context.fill();

  context.shadowColor = "rgba(0, 24, 48, 0.44)";
  context.shadowBlur = 7;
  text(context, "GENERAL", 1773, 330, `600 63px ${serif}`, { align: "center", maxWidth: 360 });
  text(context, "ADMISSION", 1773, 380, `600 63px ${serif}`, { align: "center", maxWidth: 380 });
  context.shadowBlur = 0;
  context.strokeStyle = "#f7fdff";
  context.lineWidth = 2;
  context.strokeRect(1607, 405, 311, 51);
  text(context, "SHOW 1: 2:00 PM - 4:00 PM", 1762, 440, `600 28px ${serif}`, {
    align: "center",
    maxWidth: 285,
  });
  text(context, "\u20b180", 1762, 516, `500 49px ${serif}`, { align: "center" });
  context.restore();
  context.restore();
}

export function drawTicket(
  canvas: HTMLCanvasElement,
  artwork: HTMLImageElement,
  useUploadedArtwork: boolean,
  controlNumber: string,
  position: NumberPosition,
) {
  const width = useUploadedArtwork ? artwork.naturalWidth : TICKET_WIDTH;
  const height = useUploadedArtwork ? artwork.naturalHeight : TICKET_HEIGHT;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(artwork, 0, 0, width, height);
  if (!useUploadedArtwork) drawBuiltInArtwork(context);

  if (controlNumber.trim()) {
    const scale = Math.min(width / TICKET_WIDTH, height / TICKET_HEIGHT);
    context.save();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#123b56";
    context.font = `700 ${Math.round(68 * scale)}px ${serif}`;
    context.fillText(controlNumber.trim(), position.x * width, position.y * height, width * 0.145);
    context.restore();
  }
}