import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type PointerEvent } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Download,
  FileImage,
  ImageUp,
  Info,
  Lock,
  LogOut,
  Move,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import {
  DEFAULT_NUMBER_POSITION,
  drawTicket,
  TICKET_HEIGHT,
  TICKET_WIDTH,
  type NumberPosition,
} from "./ticketCanvas";
import { loadSavedArtwork, removeSavedArtwork, saveArtwork } from "./artworkStorage";
import { clearTicketRecords, loadTicketRecords, persistNewRecord, type TicketDetails, type TicketRecord } from "./ticketRecords";

type UploadedArtwork = { image: HTMLImageElement; name: string };
type ViewMode = "generator" | "admin-login" | "admin-panel";

const backgroundUrl = "/images/legato-atmosphere.jpg";
const ADMIN_USERNAME = "lsoadmin";
const ADMIN_PASSWORD = "LSO@2026";
const ADMIN_SESSION_KEY = "lso-admin-session";

function randomCode(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (value) => alphabet[value % alphabet.length]).join("");
}

function createRandomControlNumber() {
  return `LSO-${randomCode(4)}-${randomCode(4)}`;
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  if (!value) return "-";
  const [hour, minute] = value.split(":").map(Number);
  const isPm = hour >= 12;
  const readableHour = hour % 12 || 12;
  return `${readableHour}:${String(minute).padStart(2, "0")} ${isPm ? "PM" : "AM"}`;
}

export default function App() {
  const [view, setView] = useState<ViewMode>("generator");
  const [builtInArtwork, setBuiltInArtwork] = useState<HTMLImageElement | null>(null);
  const [uploadedArtwork, setUploadedArtwork] = useState<UploadedArtwork | null>(null);
  const [controlNumber, setControlNumber] = useState(createRandomControlNumber);
  const [numberPosition, setNumberPosition] = useState<NumberPosition>(DEFAULT_NUMBER_POSITION);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails>({ holderName: "", eventDate: "", eventTime: "", note: "" });
  const [fontsReady, setFontsReady] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [isDropActive, setIsDropActive] = useState(false);
  const [isDraggingNumber, setIsDraggingNumber] = useState(false);
  const [isSavedArtwork, setIsSavedArtwork] = useState(false);
  const [records, setRecords] = useState<TicketRecord[]>([]);
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [adminError, setAdminError] = useState("");
  const [recordSearch, setRecordSearch] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const uploadRequestRef = useRef(0);
  const dragRef = useRef(false);

  const artwork = uploadedArtwork?.image ?? builtInArtwork;
  const width = uploadedArtwork?.image.naturalWidth ?? TICKET_WIDTH;
  const height = uploadedArtwork?.image.naturalHeight ?? TICKET_HEIGHT;
  const loggedIn = view === "admin-panel";

  const filteredRecords = useMemo(() => {
    if (!recordSearch.trim()) return records;
    const term = recordSearch.toLowerCase();
    return records.filter((record) => {
      return (
        record.controlNumber.toLowerCase().includes(term) ||
        record.holderName.toLowerCase().includes(term) ||
        record.note.toLowerCase().includes(term) ||
        record.downloadedAt.toLowerCase().includes(term)
      );
    });
  }, [recordSearch, records]);

  useEffect(() => {
    let active = true;
    const image = new window.Image();
    image.onload = () => {
      if (active) setBuiltInArtwork(image);
    };
    image.src = backgroundUrl;

    Promise.all([
      document.fonts.load('400 80px "Great Vibes"'),
      document.fonts.load('400 60px "Cormorant Garamond"'),
      document.fonts.load('500 60px "Cormorant Garamond"'),
      document.fonts.load('600 60px "Cormorant Garamond"'),
      document.fonts.load('700 60px "Cormorant Garamond"'),
      document.fonts.load('italic 400 22px "Cormorant Garamond"'),
    ]).then(
      () => {
        if (active) setFontsReady(true);
      },
      () => {
        if (active) setFontsReady(true);
      },
    );

    setRecords(loadTicketRecords());
    if (window.localStorage.getItem(ADMIN_SESSION_KEY) === "1") {
      setView("admin-panel");
    }

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      uploadRequestRef.current += 1;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const requestAtStart = uploadRequestRef.current;
    loadSavedArtwork()
      .then((saved) => {
        if (!active || !saved || uploadRequestRef.current !== requestAtStart) return;
        loadArtwork(new File([saved.image], saved.name, { type: saved.image.type }), false, true);
      })
      .catch(() => {
        // Private browsing may disallow storage; the editor still works for this session.
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current && artwork) {
      drawTicket(canvasRef.current, artwork, Boolean(uploadedArtwork), controlNumber, numberPosition);
    }
  }, [artwork, uploadedArtwork, controlNumber, numberPosition, fontsReady]);

  useEffect(() => {
    if (!exportStatus) return;
    const timeout = window.setTimeout(() => setExportStatus(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [exportStatus]);

  const loadArtwork = (file?: File, persist = true, alreadySaved = false) => {
    if (!file) return;
    setUploadError("");

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setUploadError("Please choose a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("Please choose an image smaller than 25 MB.");
      return;
    }

    const request = ++uploadRequestRef.current;
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      if (request !== uploadRequestRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      if (image.naturalWidth > 10000 || image.naturalHeight > 10000) {
        URL.revokeObjectURL(url);
        setUploadError("This artwork is too large. Please use an image under 10,000 px per side.");
        return;
      }

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = url;
      setUploadedArtwork({ image, name: file.name });
      setNumberPosition(DEFAULT_NUMBER_POSITION);
      setIsSavedArtwork(alreadySaved);
      setUploadError("");
      if (persist) {
        saveArtwork(file)
          .then(() => {
            if (request === uploadRequestRef.current) setIsSavedArtwork(true);
          })
          .catch(() => {
            // Export remains available even if this browser cannot persist files.
          });
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      if (request === uploadRequestRef.current) setUploadError("The image could not be opened. Try another file.");
    };
    image.src = url;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    loadArtwork(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDropActive(false);
    loadArtwork(event.dataTransfer.files[0]);
  };

  const removeUploadedArtwork = () => {
    uploadRequestRef.current += 1;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setUploadedArtwork(null);
    setIsSavedArtwork(false);
    setNumberPosition(DEFAULT_NUMBER_POSITION);
    setUploadError("");
    removeSavedArtwork().catch(() => {});
  };

  const refreshRandomControlNumber = () => {
    setControlNumber(createRandomControlNumber());
  };

  const getPointerPosition = (event: PointerEvent<HTMLCanvasElement>): NumberPosition => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const pointer = getPointerPosition(event);
    if (Math.abs(pointer.x - numberPosition.x) > 0.09 || Math.abs(pointer.y - numberPosition.y) > 0.14) return;
    dragRef.current = true;
    setIsDraggingNumber(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const pointer = getPointerPosition(event);
    setNumberPosition({
      x: Math.min(0.97, Math.max(0.03, pointer.x)),
      y: Math.min(0.95, Math.max(0.05, pointer.y)),
    });
  };

  const stopDraggingNumber = (event: PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = false;
    setIsDraggingNumber(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const downloadPng = () => {
    if (!artwork || !controlNumber.trim() || !fontsReady) return;
    const exportCanvas = document.createElement("canvas");
    drawTicket(exportCanvas, artwork, Boolean(uploadedArtwork), controlNumber, numberPosition);
    exportCanvas.toBlob((blob) => {
      if (!blob) {
        setExportStatus("Could not create the PNG. Please try again.");
        return;
      }
      const downloadedAt = new Date().toISOString();
      const record: TicketRecord = {
        id: downloadedAt,
        controlNumber,
        downloadedAt,
        artworkSource: uploadedArtwork ? "uploaded" : "built-in",
        artworkName: uploadedArtwork?.name ?? "Legato built-in art",
        resolution: `${exportCanvas.width} x ${exportCanvas.height}`,
        holderName: ticketDetails.holderName.trim(),
        eventDate: ticketDetails.eventDate,
        eventTime: ticketDetails.eventTime,
        note: ticketDetails.note.trim(),
      };
      const nextRecords = persistNewRecord(record);
      setRecords(nextRecords);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `legato-ticket-${controlNumber.trim().replace(/[^a-z0-9_-]+/gi, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);
      setExportStatus("PNG downloaded. Record saved in admin panel.");
      setControlNumber(createRandomControlNumber());
    }, "image/png");
  };

  const openAdmin = () => {
    if (window.localStorage.getItem(ADMIN_SESSION_KEY) === "1") {
      setView("admin-panel");
      return;
    }
    setView("admin-login");
    setAdminError("");
  };

  const handleAdminLogin = () => {
    if (adminCredentials.username === ADMIN_USERNAME && adminCredentials.password === ADMIN_PASSWORD) {
      window.localStorage.setItem(ADMIN_SESSION_KEY, "1");
      setView("admin-panel");
      setAdminError("");
      return;
    }
    setAdminError("Invalid admin credentials.");
  };

  const logoutAdmin = () => {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    setView("generator");
  };

  const handleClearRecords = () => {
    clearTicketRecords();
    setRecords([]);
  };

  if (view === "admin-login") {
    return (
      <div className="admin-shell">
        <header className="studio-header">
          <div className="brand-lockup">
            <div className="brand-monogram" aria-hidden="true">
              <span>L</span><span>S</span><span>O</span>
            </div>
            <div className="brand-wordmark">
              <strong>LASALLIAN SYMPHONY ORCHESTRA</strong>
              <span>TICKET STUDIO</span>
            </div>
          </div>
          <button type="button" className="mode-switch" onClick={() => setView("generator")}>Back to Generator</button>
        </header>

        <main className="admin-login-area">
          <motion.div
            className="admin-login-box"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="admin-title"><Shield size={18} /> Admin Login</div>
            <h1>Ticket records dashboard</h1>
            <p>Sign in to review generated control numbers and ticket details.</p>

            <label>
              Username
              <input
                type="text"
                value={adminCredentials.username}
                onChange={(event) => setAdminCredentials((current) => ({ ...current, username: event.target.value }))}
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={adminCredentials.password}
                onChange={(event) => setAdminCredentials((current) => ({ ...current, password: event.target.value }))}
                autoComplete="current-password"
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAdminLogin();
                }}
              />
            </label>
            {adminError ? <p className="admin-error">{adminError}</p> : null}

            <button type="button" className="admin-login-button" onClick={handleAdminLogin}><Lock size={16} /> Sign in</button>
            <p className="admin-hint">Default admin: {ADMIN_USERNAME} / {ADMIN_PASSWORD}</p>
          </motion.div>
        </main>
      </div>
    );
  }

  if (view === "admin-panel") {
    return (
      <div className="admin-shell">
        <header className="studio-header">
          <div className="brand-lockup">
            <div className="brand-monogram" aria-hidden="true">
              <span>L</span><span>S</span><span>O</span>
            </div>
            <div className="brand-wordmark">
              <strong>LASALLIAN SYMPHONY ORCHESTRA</strong>
              <span>ADMIN DASHBOARD</span>
            </div>
          </div>
          <div className="header-actions">
            <button type="button" className="mode-switch" onClick={() => setView("generator")}>Ticket Generator</button>
            <button type="button" className="mode-switch danger" onClick={logoutAdmin}><LogOut size={14} /> Logout</button>
          </div>
        </header>

        <main className="admin-dashboard">
          <motion.section
            className="admin-toolbar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1>Generated Tickets</h1>
            <p>{records.length} record(s) saved in this browser</p>
            <div className="admin-tools">
              <label className="admin-search">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search control number or name"
                  value={recordSearch}
                  onChange={(event) => setRecordSearch(event.target.value)}
                />
              </label>
              <button type="button" className="clear-records" onClick={handleClearRecords}><Trash2 size={14} /> Clear all</button>
            </div>
          </motion.section>

          <motion.section
            className="records-table-wrap"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <table className="records-table">
              <thead>
                <tr>
                  <th>Control #</th>
                  <th>Holder</th>
                  <th>Event Date</th>
                  <th>Event Time</th>
                  <th>Details</th>
                  <th>Artwork</th>
                  <th>Downloaded</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">No generated tickets found.</td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="control-column">{record.controlNumber}</td>
                      <td>{record.holderName || "-"}</td>
                      <td>{formatDate(record.eventDate)}</td>
                      <td>{formatTime(record.eventTime)}</td>
                      <td>{record.note || "-"}</td>
                      <td>{record.artworkSource === "uploaded" ? `Uploaded (${record.artworkName})` : "Built-in template"} ({record.resolution})</td>
                      <td>{new Date(record.downloadedAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.section>
        </main>
      </div>
    );
  }

  return (
    <div className="studio-shell">
      <header className="studio-header">
        <div className="brand-lockup">
          <div className="brand-monogram" aria-hidden="true">
            <span>L</span><span>S</span><span>O</span>
          </div>
          <div className="brand-wordmark">
            <strong>LASALLIAN SYMPHONY ORCHESTRA</strong>
            <span>TICKET STUDIO</span>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="mode-switch active">Generator</button>
          <button type="button" className="mode-switch" onClick={openAdmin}>Admin</button>
        </div>
      </header>

      <div className="studio-layout">
        <motion.aside
          className="editor-panel"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="editor-intro">
            <span className="section-kicker"><span className="kicker-mark" /> THE WORKSPACE</span>
            <h1>Ticket generator<span>.</span></h1>
            <p>Option A enabled: your artwork as template, with dynamic data overlay.</p>
          </div>

          <div className="editor-separator" />

          <section className="editor-section" aria-labelledby="control-label">
            <div className="editor-section-heading">
              <label id="control-label" htmlFor="control-number">Control number</label>
              <span>01 / RANDOM</span>
            </div>
            <div className="number-input-wrap">
              <span aria-hidden="true">#</span>
              <input id="control-number" type="text" value={controlNumber} readOnly />
            </div>
            <div className="sequence-control">
              <span>Generated automatically</span>
              <button type="button" className="randomize-button" onClick={refreshRandomControlNumber}><RefreshCw size={14} /> New random</button>
            </div>
          </section>

          <div className="editor-separator" />

          <section className="editor-section">
            <div className="editor-section-heading">
              <h2>Ticket details</h2>
              <span>02 / RECORDS</span>
            </div>
            <div className="details-grid">
              <label>
                Holder Name
                <input
                  type="text"
                  value={ticketDetails.holderName}
                  onChange={(event) => setTicketDetails((current) => ({ ...current, holderName: event.target.value }))}
                  placeholder="Guest name"
                />
              </label>
              <label>
                Event Date
                <input
                  type="date"
                  value={ticketDetails.eventDate}
                  onChange={(event) => setTicketDetails((current) => ({ ...current, eventDate: event.target.value }))}
                />
              </label>
              <label>
                Event Time
                <input
                  type="time"
                  value={ticketDetails.eventTime}
                  onChange={(event) => setTicketDetails((current) => ({ ...current, eventTime: event.target.value }))}
                />
              </label>
              <label>
                Note
                <input
                  type="text"
                  value={ticketDetails.note}
                  onChange={(event) => setTicketDetails((current) => ({ ...current, note: event.target.value }))}
                  placeholder="Example: VIP gate"
                />
              </label>
            </div>
          </section>

          <div className="editor-separator" />

          <section className="editor-section" aria-labelledby="artwork-heading">
            <div className="editor-section-heading">
              <h2 id="artwork-heading">Ticket artwork</h2>
              <span>03 / TEMPLATE</span>
            </div>

            <div className="artwork-source">
              <div className="source-symbol"><FileImage size={18} strokeWidth={1.6} /></div>
              <div className="source-details">
                <strong>{uploadedArtwork ? "Your original design" : "Legato studio layout"}</strong>
                <span>{uploadedArtwork ? (isSavedArtwork ? "Saved in this browser" : "Using uploaded artwork") : "Built-in visual recreation"}</span>
              </div>
              <Check size={16} className="source-check" strokeWidth={2} />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="visually-hidden"
              onChange={handleFileChange}
              aria-label="Upload your original ticket design"
            />
            <button
              type="button"
              className={`upload-target${isDropActive ? " is-drop-active" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDropActive(true);
              }}
              onDragLeave={() => setIsDropActive(false)}
              onDrop={handleDrop}
            >
              <ImageUp size={20} strokeWidth={1.7} />
              <span>
                <strong>{uploadedArtwork ? "Replace your design" : "Use your exact design"}</strong>
                <small>Choose or drop a PNG, JPG, or WebP</small>
              </span>
            </button>

            {uploadedArtwork && (
              <div className="uploaded-file">
                <span title={uploadedArtwork.name}>{uploadedArtwork.name}</span>
                <button type="button" onClick={removeUploadedArtwork} aria-label="Remove uploaded design"><X size={15} /></button>
              </div>
            )}
            {uploadError && <p className="upload-error" role="alert">{uploadError}</p>}
            <p className="artwork-note">Upload the original image for an exact match. The random control number is added on export.</p>
          </section>

          <div className="editor-bottom">
            <motion.button
              type="button"
              className="download-button"
              onClick={downloadPng}
              disabled={!artwork || !fontsReady || !controlNumber.trim()}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
            >
              <span>Download ticket</span>
              <Download size={19} strokeWidth={1.9} />
            </motion.button>
            <p>High-resolution PNG <span aria-hidden="true">/</span> Saved to admin records</p>
            <div className="export-message" role="status" aria-live="polite">{exportStatus}</div>
          </div>
        </motion.aside>

        <main className="workspace">
          <motion.div
            className="workspace-inner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease: "easeOut" }}
          >
            <div className="workspace-heading">
              <div>
                <span className="section-kicker"><span className="kicker-mark" /> THE CANVAS</span>
                <h2>Legato <span>/ Symphonies of the Ages</span></h2>
              </div>
              <span className="workspace-edition">{loggedIn ? "ADMIN ONLINE" : "2026 EDITION"}</span>
            </div>

            <div className="preview-area">
              <div className="preview-toolbar">
                <span className="preview-live"><span className="live-dot" /> LIVE PREVIEW</span>
                <span>CTRL#: {controlNumber}</span>
              </div>

              <div className="ticket-scroll">
                {artwork ? (
                  <motion.div
                    className="ticket-frame"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45 }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={width}
                      height={height}
                      className={`ticket-canvas${isDraggingNumber ? " is-dragging" : ""}`}
                      aria-label={`Preview of the Legato ticket with control number ${controlNumber || "blank"}`}
                      role="img"
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={stopDraggingNumber}
                      onPointerCancel={stopDraggingNumber}
                    />
                  </motion.div>
                ) : (
                  <div className="ticket-loading">Preparing your ticket...</div>
                )}
              </div>

              <div className="preview-footer">
                <span><Move size={15} strokeWidth={1.7} /> Drag the number to fine-tune its placement</span>
                <div>
                  {numberPosition.x !== DEFAULT_NUMBER_POSITION.x || numberPosition.y !== DEFAULT_NUMBER_POSITION.y ? (
                    <button type="button" onClick={() => setNumberPosition(DEFAULT_NUMBER_POSITION)}><RotateCcw size={13} /> Reset position</button>
                  ) : null}
                  <span>{width} x {height} PX <i /> PNG</span>
                </div>
              </div>
            </div>

            <div className="workspace-note">
              <div className="note-icon"><Info size={17} strokeWidth={1.6} /></div>
              <p><strong>Each download creates a new random control number.</strong> Generated tickets are logged in the admin dashboard with details.</p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}