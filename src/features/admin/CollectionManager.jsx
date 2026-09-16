import { useEffect, useMemo, useState } from "react";
import { recordTitle } from "./adminSchemas.js";
import { Badge, Btn, Card, ConfirmDialog, EmptyState, Field, SectionTitle, Select, TagInput, TextArea, TextInput, Toggle } from "./AdminUI.jsx";
import { inputStyle, statusColor } from "./adminUtils.js";
import { MiniStaticBoard } from "../../components/chess/MiniStaticBoard.jsx";
import { mdToHtml } from "../../lib/format/markdown.js";
import { deleteRecord, newRecordId, patchRecord, upsertRecord, validateFen, validatePuzzleSolution } from "../../services/adminContent.js";
import { loadAdminData } from "../../services/adminData.js";

// ══════════════════════════════════════════════════════════════════════════════
// ── COLLECTION MANAGER ────────────────────────────────────────────────────────
// A schema-driven list + editor for any admin collection: search, status
// filters, bulk actions, inline publish toggles, an edit drawer with live
// validation (FEN boards render as you type, puzzle solutions are played
// through the engine), keyboard save (⌘/Ctrl+S), unsaved-change protection,
// and delete with Undo.
// ══════════════════════════════════════════════════════════════════════════════

function FieldControl({ t, field, value, onChange, record }) {
  const [preview, setPreview] = useState(false);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [jsonError, setJsonError] = useState("");
  useEffect(() => { if (field.type === "json") setJsonText(JSON.stringify(value ?? {}, null, 2)); }, [record?.id, field.type]); // eslint-disable-line react-hooks/exhaustive-deps

  switch (field.type) {
    case "text": case "url":
      return <TextInput t={t} value={value} onChange={onChange} placeholder={field.type === "url" ? "https://…" : ""} />;
    case "number":
      return <TextInput t={t} type="number" value={value} onChange={v => onChange(v === "" ? "" : Number(v))} />;
    case "date":
      return <TextInput t={t} type="date" value={value} onChange={onChange} />;
    case "datetime":
      return <TextInput t={t} type="datetime-local" value={value} onChange={onChange} />;
    case "textarea":
      return <TextArea t={t} value={value} onChange={onChange} rows={field.rows || 4} />;
    case "markdown":
      return (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <Btn t={t} size="sm" kind={preview ? "default" : "primary"} onClick={() => setPreview(false)}>Write</Btn>
            <Btn t={t} size="sm" kind={preview ? "primary" : "default"} onClick={() => setPreview(true)}>Preview</Btn>
          </div>
          {preview
            ? <div style={{ ...inputStyle(t), minHeight: 120, lineHeight: 1.7, fontSize: "0.86rem" }} dangerouslySetInnerHTML={{ __html: mdToHtml(value || "*Nothing yet.*") }} />
            : <TextArea t={t} value={value} onChange={onChange} rows={field.rows || 8} />}
        </div>
      );
    case "tags":
      return <TagInput t={t} value={Array.isArray(value) ? value : []} onChange={onChange} />;
    case "toggle":
      return <Toggle t={t} checked={!!value} onChange={onChange} label={value ? "On" : "Off"} />;
    case "select": {
      const options = field.optionsFrom ? (loadAdminData()[field.optionsFrom] || []).map(o => ({ value: o.id, label: o.label || o.title || o.id })) : field.options;
      return <Select t={t} value={value} onChange={onChange} options={options} />;
    }
    case "fen": {
      const problem = value ? validateFen(value) : (field.optional ? "" : "A FEN is required.");
      return (
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <TextInput t={t} value={value} onChange={onChange} mono placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />
            <div style={{ fontSize: "0.72rem", marginTop: 6, color: problem ? t.RED : t.GREEN }}>{problem || (value ? `✓ Valid · ${value.trim().split(/\s+/)[1] === "b" ? "Black" : "White"} to move` : "")}</div>
          </div>
          {value && !problem && <MiniStaticBoard fen={value.trim()} size={128} />}
        </div>
      );
    }
    case "moves": {
      const text = Array.isArray(value) ? value.join(" ") : (value || "");
      const problem = record?.fen && !validateFen(record.fen) ? validatePuzzleSolution(record.fen, text) : "Enter a valid FEN first.";
      return (
        <div>
          <TextInput t={t} value={text} onChange={v => onChange(v.split(/[\s,]+/).filter(Boolean))} mono placeholder="e2e4 e7e5 g1f3" />
          <div style={{ fontSize: "0.72rem", marginTop: 6, color: problem ? t.AMBER : t.GREEN }}>{problem || `✓ ${text.trim().split(/\s+/).length} plies, all legal`}</div>
        </div>
      );
    }
    case "options": {
      const list = Array.isArray(value) ? value : [];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {list.map((opt, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ width: 20, fontSize: "0.72rem", color: t.muted, fontWeight: 700 }}>{String.fromCharCode(65 + i)}</span>
              <TextInput t={t} value={opt} onChange={v => onChange(list.map((o, j) => (j === i ? v : o)))} />
              <Btn t={t} size="sm" kind="ghost" onClick={() => onChange(list.filter((_, j) => j !== i))} title="Remove">×</Btn>
            </div>
          ))}
          {list.length < 6 && <Btn t={t} size="sm" onClick={() => onChange([...list, ""])}>+ Add option</Btn>}
        </div>
      );
    }
    case "optionIndex": {
      const opts = (record?.[field.optionsKey] || []).map((o, i) => ({ value: String(i), label: `${String.fromCharCode(65 + i)}. ${o || "(empty)"}` }));
      return <Select t={t} value={String(value ?? 0)} onChange={v => onChange(Number(v))} options={opts.length ? opts : [{ value: "0", label: "Add options first" }]} />;
    }
    case "json":
      return (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
            {field.template && <Btn t={t} size="sm" onClick={() => { const tpl = field.template(); setJsonText(JSON.stringify(tpl, null, 2)); setJsonError(""); onChange(tpl); }}>Insert template</Btn>}
            <span style={{ fontSize: "0.72rem", color: jsonError ? t.RED : t.GREEN }}>{jsonError || "✓ Valid JSON"}</span>
          </div>
          <TextArea t={t} value={jsonText} mono rows={field.rows || 12} onChange={txt => {
            setJsonText(txt);
            try { const parsed = JSON.parse(txt); setJsonError(""); onChange(parsed); } catch (e) { setJsonError(e.message); }
          }} />
        </div>
      );
    default:
      return <TextInput t={t} value={value} onChange={onChange} />;
  }
}

function RecordDrawer({ t, schema, record, onClose, onSaved, toast }) {
  const isNew = !record.id;
  const [draft, setDraft] = useState(() => (schema.load ? schema.load(record) : record));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const original = useMemo(() => JSON.stringify(schema.load ? schema.load(record) : record), [record, schema]);
  const dirty = JSON.stringify(draft) !== original;
  const set = (key, value) => { setDraft(d => ({ ...d, [key]: value })); setTouched(true); };

  const save = () => {
    const errs = schema.validate ? schema.validate(draft) : {};
    setErrors(errs);
    if (Object.keys(errs).length) { toast({ title: "Fix the highlighted fields first.", kind: "warn" }); return; }
    const prepared = schema.beforeSave ? schema.beforeSave(draft) : draft;
    const final = { ...prepared, id: prepared.id || newRecordId(schema.idPrefix) };
    upsertRecord(schema.key, final, { label: schema.label });
    toast({ title: `${isNew ? "Created" : "Saved"} ${schema.label.toLowerCase()} “${recordTitle(schema, final)}”`, kind: "success" });
    onSaved(final);
  };
  const [askDiscard, setAskDiscard] = useState(false);
  const close = () => { if (dirty) setAskDiscard(true); else onClose(); };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9300, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={close} style={{ position: "absolute", inset: 0, background: "rgba(2,6,16,0.55)", backdropFilter: "blur(3px)" }} />
      <aside className="admin-drawer" style={{ position: "relative", width: 620, maxWidth: "100%", height: "100%", background: t.panel, borderLeft: `1px solid ${t.border}`, boxShadow: "-20px 0 60px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", animation: "adminSlide 0.22s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>{schema.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: t.fg, fontSize: "0.95rem" }}>{isNew ? `New ${schema.label.toLowerCase()}` : `Edit ${schema.label.toLowerCase()}`}</div>
            <div style={{ fontSize: "0.7rem", color: t.faint, fontFamily: "monospace" }}>{record.id || "unsaved"}</div>
          </div>
          {dirty && <Badge t={t} color={t.AMBER}>Unsaved</Badge>}
          <Btn t={t} kind="ghost" onClick={close} title="Close (Esc)">✕</Btn>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16 }}>
            {schema.fields.map(f => (
              <div key={f.key} style={{ gridColumn: f.span === 2 ? "1 / -1" : undefined }}>
                <Field t={t} label={f.label} hint={f.hint} error={touched || errors[f.key] ? errors[f.key] : ""}>
                  <FieldControl t={t} field={f} value={draft[f.key]} onChange={v => set(f.key, v)} record={draft} />
                </Field>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.7rem", color: t.faint }}>⌘S / Ctrl+S to save · Esc to close</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn t={t} onClick={close}>Cancel</Btn>
            <Btn t={t} kind="primary" onClick={save}>{isNew ? "Create" : "Save changes"}</Btn>
          </div>
        </div>
      </aside>
      <ConfirmDialog t={t} open={askDiscard} danger title="Discard unsaved changes?" body="The edits in this drawer have not been saved." confirmLabel="Discard" onCancel={() => setAskDiscard(false)} onConfirm={() => { setAskDiscard(false); onClose(); }} />
    </div>
  );
}

function CollectionManager({ t, schema, toast, initialEditId = null, initialCreate = false }) {
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion(v => v + 1);
  const records = useMemo(() => (loadAdminData()[schema.key] || []).slice().reverse(), [schema.key, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState(() => (initialCreate ? schema.create() : initialEditId ? records.find(r => r.id === initialEditId) || null : null));
  const [selected, setSelected] = useState(() => new Set());
  const [confirm, setConfirm] = useState(null); // { ids }

  const statuses = useMemo(() => Array.from(new Set(records.map(r => schema.statusOf(r)))), [records, schema]);
  const filtered = records.filter(r => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || JSON.stringify(r).toLowerCase().includes(q);
    return matchQ && (status === "all" || schema.statusOf(r) === status);
  });

  const remove = (ids) => {
    const removed = ids.map(id => deleteRecord(schema.key, id, { label: schema.label })).filter(Boolean);
    setSelected(new Set());
    refresh();
    toast({ title: `Deleted ${removed.length} ${removed.length === 1 ? schema.label.toLowerCase() : schema.plural.toLowerCase()}`, kind: "warn", ttl: 8000, undo: () => { removed.forEach(r => upsertRecord(schema.key, r, { label: schema.label })); refresh(); } });
  };
  const toggleField = (r, field) => {
    patchRecord(schema.key, r.id, { [field]: !r[field] }, { label: schema.label, summary: `${!r[field] ? "Enabled" : "Disabled"} ${field} on ${schema.label.toLowerCase()} “${recordTitle(schema, r)}”` });
    refresh();
  };
  const bulkToggle = (field, value) => {
    selected.forEach(id => patchRecord(schema.key, id, { [field]: value }, { label: schema.label }));
    setSelected(new Set());
    refresh();
    toast({ title: `Updated ${selected.size} records`, kind: "success" });
  };
  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id));

  return (
    <div>
      <SectionTitle t={t} title={`${schema.icon} ${schema.plural}`} sub={schema.description} action={<Btn t={t} kind="primary" onClick={() => setEditing(schema.create())}>+ New {schema.label.toLowerCase()}</Btn>} />

      <Card t={t} pad={0}>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${t.border}`, flexWrap: "wrap" }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${schema.plural.toLowerCase()}…`} style={{ ...inputStyle(t), width: 260, maxWidth: "100%" }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", ...statuses].map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{ background: status === s ? `${t.G}22` : "transparent", border: `1px solid ${status === s ? t.G + "66" : t.border}`, color: status === s ? t.G_LT : t.muted, borderRadius: 999, padding: "5px 12px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>
                {s} {s === "all" ? records.length : records.filter(r => schema.statusOf(r) === s).length}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          {selected.size > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: "0.74rem", color: t.muted, fontWeight: 600 }}>{selected.size} selected</span>
              {schema.quickToggle && <Btn t={t} size="sm" onClick={() => bulkToggle(schema.quickToggle.field, true)}>{schema.quickToggle.on}</Btn>}
              {schema.quickToggle && <Btn t={t} size="sm" onClick={() => bulkToggle(schema.quickToggle.field, false)}>{schema.quickToggle.off}</Btn>}
              <Btn t={t} size="sm" kind="danger" onClick={() => setConfirm({ ids: Array.from(selected) })}>Delete</Btn>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState t={t} icon={schema.icon} title={records.length ? "Nothing matches" : `No ${schema.plural.toLowerCase()} yet`} sub={records.length ? "Try a different search or filter." : `Create the first ${schema.label.toLowerCase()} — it appears on the public site the moment it is published.`} action={!records.length && <Btn t={t} kind="primary" onClick={() => setEditing(schema.create())}>+ New {schema.label.toLowerCase()}</Btn>} />
        ) : (
          <div className="cf-table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ color: t.faint, fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  <th style={{ padding: "10px 16px", width: 32 }}><input type="checkbox" aria-label="Select all" checked={allSelected} onChange={e => setSelected(e.target.checked ? new Set(filtered.map(r => r.id)) : new Set())} /></th>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Title</th>
                  {schema.columns.map(c => <th key={c.key} style={{ textAlign: "left", padding: "10px 8px" }}>{c.label}</th>)}
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Status</th>
                  <th style={{ padding: "10px 16px" }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const st = schema.statusOf(r);
                  return (
                    <tr key={r.id} style={{ borderTop: `1px solid ${t.border}` }}
                      onMouseEnter={e => { e.currentTarget.style.background = t.dark ? "rgba(148,163,255,0.04)" : "rgba(37,99,235,0.03)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <td style={{ padding: "10px 16px" }}><input type="checkbox" aria-label={`Select ${recordTitle(schema, r)}`} checked={selected.has(r.id)} onChange={e => { const n = new Set(selected); if (e.target.checked) n.add(r.id); else n.delete(r.id); setSelected(n); }} /></td>
                      <td style={{ padding: "10px 8px", color: t.fg, fontWeight: 600, cursor: "pointer", maxWidth: 320 }} onClick={() => setEditing(r)}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recordTitle(schema, r)}</div>
                        <div style={{ fontSize: "0.66rem", color: t.faint, fontFamily: "monospace" }}>{r.id}</div>
                      </td>
                      {schema.columns.map(c => <td key={c.key} style={{ padding: "10px 8px", color: t.muted, whiteSpace: "nowrap" }}>{c.render ? c.render(r[c.key], r) : (r[c.key] ?? "—")}</td>)}
                      <td style={{ padding: "10px 8px" }}><Badge t={t} color={statusColor(t, st)}>{st}</Badge></td>
                      <td style={{ padding: "10px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        {schema.quickToggle && <Btn t={t} size="sm" kind={r[schema.quickToggle.field] ? "success" : "default"} onClick={() => toggleField(r, schema.quickToggle.field)}>{r[schema.quickToggle.field] ? schema.quickToggle.on : schema.quickToggle.off}</Btn>}
                        <Btn t={t} size="sm" style={{ marginLeft: 6 }} onClick={() => setEditing(r)}>Edit</Btn>
                        <Btn t={t} size="sm" kind="danger" style={{ marginLeft: 6 }} onClick={() => setConfirm({ ids: [r.id] })}>Delete</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && <RecordDrawer t={t} schema={schema} record={editing} toast={toast} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
      <ConfirmDialog t={t} open={!!confirm} danger title={`Delete ${confirm?.ids.length === 1 ? `this ${schema.label.toLowerCase()}` : `${confirm?.ids.length} ${schema.plural.toLowerCase()}`}?`} body="It disappears from the public site immediately. You can undo from the toast for a few seconds afterwards." confirmLabel="Delete" onCancel={() => setConfirm(null)} onConfirm={() => { remove(confirm.ids); setConfirm(null); }} />
    </div>
  );
}

export {
  CollectionManager,
  FieldControl,
};
