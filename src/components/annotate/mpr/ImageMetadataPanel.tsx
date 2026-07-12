'use client';

import { useMPRStore } from '@/stores/mprStore';

export default function ImageMetadataPanel() {
  const { series, activePlane } = useMPRStore();

  // Find the metadata of the active plane's series
  const activeSeries = series[activePlane];
  const metadata = activeSeries?.metadata ?? null;

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        backgroundColor: '#0a0a0f',
        borderLeft: '1px solid #1a1a26',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: '#0e0e14',
          borderBottom: '1px solid #1a1a26',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#a78bfa',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Series Metadata
        </span>
        {activeSeries && (
          <span
            style={{
              fontSize: '10px',
              color: '#3d3d55',
              backgroundColor: '#181822',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {activeSeries.images.length} slices
          </span>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: '1.6',
          color: '#e2e8f0',
        }}
      >
        {!activeSeries ? (
          <div
            style={{
              display: 'flex',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3d3d55',
              fontSize: '12px',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            Select a series to view metadata
          </div>
        ) : !metadata ? (
          <div
            style={{
              display: 'flex',
              height: '100%',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4a5568',
              fontSize: '11px',
              textAlign: 'center',
              padding: '20px',
              gap: '6px',
            }}
          >
            <span>No metadata available for this series</span>
            <span style={{ color: '#2d3748', fontSize: '9px' }}>
              Upload DICOM, NIfTI, or NRRD formats to extract patient headers.
            </span>
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: 'none',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a26' }}>
                <th
                  style={{
                    textAlign: 'left',
                    color: '#63637e',
                    paddingBottom: '6px',
                    fontSize: '10px',
                    width: '45%',
                  }}
                >
                  TAG / PROPERTY
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    color: '#63637e',
                    paddingBottom: '6px',
                    fontSize: '10px',
                  }}
                >
                  VALUE
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metadata).map(([key, val]) => (
                <tr
                  key={key}
                  style={{
                    borderBottom: '1px solid #0f0f16',
                  }}
                >
                  <td
                    style={{
                      padding: '6px 4px',
                      color: '#9f7aea',
                      fontWeight: 600,
                      wordBreak: 'break-all',
                    }}
                  >
                    {key}
                  </td>
                  <td
                    style={{
                      padding: '6px 4px',
                      color: '#a0aec0',
                      wordBreak: 'break-all',
                    }}
                  >
                    {String(val)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
