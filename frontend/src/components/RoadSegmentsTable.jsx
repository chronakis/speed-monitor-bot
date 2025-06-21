import React from 'react'

const RoadSegmentsTable = ({ segmentData, onClose }) => {
  if (!segmentData) return null

  const { code, description, overallLength, overallSpeed, confidence, segments, units } = segmentData

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      width: '400px',
      maxHeight: '300px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: '1px solid #dee2e6',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: '14px', 
          fontWeight: '600',
          color: '#333'
        }}>
          Road Segments
        </h4>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#666',
            padding: '0',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ 
        maxHeight: '250px', 
        overflowY: 'auto',
        fontSize: '12px'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '12px'
        }}>
          {/* Column Headers */}
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '11px', fontWeight: '600' }}>
                Segment
              </th>
              <th style={{ padding: '8px', textAlign: 'right', fontSize: '11px', fontWeight: '600' }}>
                Speed ({units.speed})
              </th>
              <th style={{ padding: '8px', textAlign: 'right', fontSize: '11px', fontWeight: '600' }}>
                Confidence
              </th>
              <th style={{ padding: '8px', textAlign: 'right', fontSize: '11px', fontWeight: '600' }}>
                Length ({units.length})
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Main Road Header */}
            <tr style={{ 
              backgroundColor: '#b3b3d9', 
              color: 'black', 
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              <td style={{ padding: '10px 8px', textAlign: 'left' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>{code}</span>
                  <span style={{ fontWeight: 'normal', fontSize: '11px' }}> starting from</span>
                </div>
                <div style={{ fontWeight: 'normal', fontSize: '11px', marginTop: '2px' }}>
                  {description}
                </div>
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                {overallSpeed.toFixed(2)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                {confidence.toFixed(2)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                {overallLength.toFixed(3)}
              </td>
            </tr>

            {/* Segments */}
            {segments.map((segment) => (
              <tr key={segment.index} style={{ 
                borderBottom: '1px solid #f0f0f0'
              }}>
                <td style={{ padding: '6px 8px', fontSize: '11px' }}>
                  Segment-{segment.index}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '11px' }}>
                  {segment.speed.toFixed(2)}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '11px' }}>
                  {segment.confidence.toFixed(2)}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '11px' }}>
                  {segment.length.toFixed(3)}
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr style={{ 
              backgroundColor: '#e0e0e0', 
              fontWeight: 'bold',
              fontSize: '11px'
            }}>
              <td style={{ padding: '6px 8px' }}>Total</td>
              <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                {overallSpeed.toFixed(2)}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                {confidence.toFixed(2)}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                {overallLength.toFixed(3)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footnote */}
        <div style={{
          padding: '8px',
          fontSize: '10px',
          color: '#666',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #dee2e6'
        }}>
          Details on the metrics can be found at{' '}
          <a 
            href="https://developer.here.com/documentation/traffic/dev_guide/topics/common-acronyms.html" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#666' }}
          >
            HERE Maps documentation
          </a>
        </div>
      </div>
    </div>
  )
}

export default RoadSegmentsTable 