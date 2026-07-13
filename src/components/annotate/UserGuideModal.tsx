'use client';

import { X, ChevronRight, Layers, Target, Sliders, Keyboard, FileImage, HelpCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_COLOR = '#7c3aed';
const PLANE_COLORS = { axial: '#38bdf8', sagittal: '#4ade80', coronal: '#fb923c' };

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ color: '#a78bfa', flexShrink: 0 }}>{icon}</div>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
      <div style={{
        minWidth: '24px', height: '24px', borderRadius: '50%',
        backgroundColor: `${STEP_COLOR}33`, border: `1px solid ${STEP_COLOR}88`,
        color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 700, flexShrink: 0,
      }}>
        {n}
      </div>
      <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6, paddingTop: '2px' }}
        dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

function PlaneCard({ color, title, description, visual }: { color: string; title: string; description: string; visual: string }) {
  return (
    <div style={{
      backgroundColor: '#0a0a0f',
      border: `1px solid ${color}33`,
      borderRadius: '10px',
      padding: '14px',
      flex: 1,
      minWidth: '160px',
    }}>
      <div style={{ fontSize: '22px', textAlign: 'center', marginBottom: '8px' }}>{visual}</div>
      <div style={{ fontWeight: 700, fontSize: '12px', color, textAlign: 'center', marginBottom: '6px' }}>{title}</div>
      <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5, margin: 0, textAlign: 'center' }}>{description}</p>
    </div>
  );
}


function KbShortcut({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a26' }}>
      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{desc}</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {keys.map((k) => (
          <kbd key={k} style={{
            backgroundColor: '#181822', border: '1px solid #2a2a40',
            borderRadius: '4px', padding: '2px 6px',
            fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace',
          }}>{k}</kbd>
        ))}
      </div>
    </div>
  );
}

function FormatBadge({ fmt, status }: { fmt: string; status: '✅' | '⚠️' | '❌' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      backgroundColor: '#0a0a0f', border: '1px solid #1a1a26',
      borderRadius: '5px', padding: '3px 8px',
      fontSize: '11px', color: '#cbd5e1', margin: '2px',
    }}>
      <span>{status}</span> {fmt}
    </span>
  );
}

export default function UserGuideModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 20000,
        backgroundColor: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: '#0e0e14',
          border: '1px solid #2a2a40',
          borderRadius: '16px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.15)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#2a2a40 transparent',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid #1a1a26',
          background: 'linear-gradient(135deg, #111116, #0e0e18)',
          position: 'sticky', top: 0, zIndex: 10,
          borderRadius: '16px 16px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HelpCircle style={{ width: '18px', height: '18px', color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f4f4f7' }}>User Guide</h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#4a5568' }}>VAI Radiology — Multi-Planar Viewer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid #232332',
              color: '#63637e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#63637e'; }}
          >
            <X style={{ width: '15px', height: '15px' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>

          {/* ── Section 1: Workflow ────────────────────────────────────────────── */}
          <Section title="How to Use" icon={<ChevronRight size={16} />}>
            <Step n={1} text='<b>Import Files</b> → click <b>"Import Files"</b> or drag files directly onto the browser window. Supports DICOM (.dcm), NIfTI (.nii/.nii.gz), NRRD, PNG, JPEG, and ZIP archives.' />
            <Step n={2} text='<b>Load into a Panel</b> → drag an image set from the left sidebar and drop it onto the <b>Axial</b>, <b>Sagittal</b>, or <b>Coronal</b> viewer panel.' />
            <Step n={3} text='<b>Navigate Slices</b> → use the <b>scroll wheel</b>, arrow buttons ‹ ›, arrow keys, or the slider beneath the plane name.' />
            <Step n={4} text='<b>Select Class &amp; Draw</b> → pick a class (e.g. Tumor), choose a drawing tool, then draw on the image. Click <b>Save</b> to store the annotation.' />
            <Step n={5} text='<b>Adjust CT Window</b> → tick "CT Window" and select a Preset (Bone, Brain, Lung…) to optimise contrast for the tissue type you are reviewing.' />
          </Section>

          {/* ── Section 2: Planes ─────────────────────────────────────────────── */}
          <Section title="Viewing Planes" icon={<Layers size={16} />}>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: 0, marginBottom: '12px', lineHeight: 1.6 }}>
              In radiology, a 3D scan is viewed through three standard cross-section planes. Each panel can be loaded with an independent image set for comparison.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <PlaneCard
                color={PLANE_COLORS.axial}
                title="Axial"
                description="Horizontal slices — as if looking down from above. Like slicing a loaf of bread horizontally."
                visual="🔵"
              />
              <PlaneCard
                color={PLANE_COLORS.sagittal}
                title="Sagittal"
                description="Vertical left-right slices — as if looking at the body from the side."
                visual="🟢"
              />
              <PlaneCard
                color={PLANE_COLORS.coronal}
                title="Coronal"
                description="Vertical front-back slices — as if looking at the body from the front."
                visual="🟠"
              />
            </div>
            <p style={{ fontSize: '11px', color: '#374151', marginTop: '10px', marginBottom: 0 }}>
              💡 Tip: Load the same DICOM series into all three panels to review the same patient from every angle simultaneously.
            </p>
          </Section>

          {/* ── Section 3: Class & Annotation ─────────────────────────────────── */}
          <Section title="Annotation Class" icon={<Target size={16} />}>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: 0, marginBottom: '10px', lineHeight: 1.6 }}>
              The <b style={{ color: '#e2e8f0' }}>Class</b> dropdown assigns a medical label to your annotation before you draw it.
              Each class has a unique colour for easy identification.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {[
                { name: 'Tumor', color: '#FF6B6B' }, { name: 'Lesion', color: '#FF9F43' },
                { name: 'Edema', color: '#FECA57' }, { name: 'Normal', color: '#48DBFB' },
                { name: 'Background', color: '#A29BFE' }, { name: 'Vessel', color: '#55EFC4' },
              ].map((c) => (
                <span key={c.name} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  backgroundColor: `${c.color}20`, border: `1px solid ${c.color}55`,
                  borderRadius: '6px', padding: '3px 9px',
                  fontSize: '11px', color: c.color, fontWeight: 600,
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: c.color, display: 'inline-block' }} />
                  {c.name}
                </span>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#4a5568', margin: 0 }}>
              Select a Class → choose a tool → draw → click <b style={{ color: '#cbd5e1' }}>Save</b>.
            </p>
          </Section>

          {/* ── Section 4: CT Window ──────────────────────────────────────────── */}
          <Section title="CT Window &amp; Presets" icon={<Sliders size={16} />}>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: 0, marginBottom: '10px', lineHeight: 1.6 }}>
              CT images store Hounsfield Units (HU) — a scale where air = −1000, water = 0, bone = +1000.
              The <b style={{ color: '#e2e8f0' }}>CT Window</b> setting applies a brightness filter to highlight specific tissues.
            </p>
            <div style={{
              backgroundColor: '#0a0a0f', border: '1px solid #1a1a26', borderRadius: '8px',
              overflow: 'hidden', marginBottom: '8px',
            }}>
              {[
                { name: 'Bone', desc: 'Skeletal structures — high brightness', color: '#f8fafc' },
                { name: 'Soft Tissue', desc: 'Organs and muscles — balanced mid-range', color: '#94a3b8' },
                { name: 'Brain', desc: 'Brain parenchyma — narrow window', color: '#a78bfa' },
                { name: 'Lung', desc: 'Lung tissue — very dark (low HU)', color: '#60a5fa' },
              ].map((p, i) => (
                <div key={p.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderBottom: i < 3 ? '1px solid #1a1a26' : 'none',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: p.color, minWidth: '80px' }}>{p.name}</span>
                  <span style={{ fontSize: '11px', color: '#4a5568', flex: 1, marginLeft: '12px' }}>{p.desc}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#4a5568', margin: 0 }}>
              Tick <b style={{ color: '#cbd5e1' }}>CT Window</b> checkbox → select a <b style={{ color: '#cbd5e1' }}>Preset</b> → fine-tune with the slider.
            </p>
          </Section>

          {/* ── Section 5: Keyboard shortcuts ─────────────────────────────────── */}
          <Section title="Keyboard Shortcuts" icon={<Keyboard size={16} />}>
            <div style={{ backgroundColor: '#0a0a0f', border: '1px solid #1a1a26', borderRadius: '8px', padding: '4px 12px' }}>
              <KbShortcut keys={['↑', '←']} desc="Previous slice" />
              <KbShortcut keys={['↓', '→']} desc="Next slice" />
              <KbShortcut keys={['Scroll']} desc="Navigate slices in active panel" />
              <KbShortcut keys={['Ctrl', 'Z']} desc="Undo last annotation point" />
              <KbShortcut keys={['Ctrl', 'Y']} desc="Redo" />
              <KbShortcut keys={['Click panel']} desc="Set panel as active (keyboard focus)" />
            </div>
          </Section>

          {/* ── Section 6: Supported Formats ──────────────────────────────────── */}
          <Section title="Supported File Formats" icon={<FileImage size={16} />}>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: 0, marginBottom: '8px' }}>
              Upload via button, folder picker, or drag-and-drop onto the browser window. ZIP archives are automatically extracted.
            </p>
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '10px', color: '#4a5568', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Medical Formats</p>
              <FormatBadge fmt=".dcm / .dicom" status="✅" />
              <FormatBadge fmt="Multi-frame DICOM" status="✅" />
              <FormatBadge fmt=".nii / .nii.gz (NIfTI)" status="✅" />
              <FormatBadge fmt=".nrrd / .nhdr" status="✅" />
              <FormatBadge fmt=".mha / .mhd (MetaImage)" status="✅" />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '10px', color: '#4a5568', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Standard Formats</p>
              <FormatBadge fmt="PNG" status="✅" />
              <FormatBadge fmt="JPG / JPEG" status="✅" />
              <FormatBadge fmt="WebP" status="✅" />
              <FormatBadge fmt="TIFF / BMP" status="✅" />
              <FormatBadge fmt="GIF (all frames)" status="✅" />
              <FormatBadge fmt="ZIP archive" status="✅" />
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
