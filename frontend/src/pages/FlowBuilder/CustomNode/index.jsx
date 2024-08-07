import React from 'react';
import { Handle } from 'reactflow';

const CustomNode = ({ data }) => {
  return (
    <div style={{ padding: 10, border: '1px solid #ddd', borderRadius: 5, background: '#fff' }}>
      <strong>{data.label}</strong>
      <div>
        {data.components.map((component, index) => (
          <div key={index}>
            {component.type === 'text' && <div>{component.data.text}</div>}
            {component.type === 'image' && <img src={component.data.text.split('@@@@')[1]} alt="Imagem" style={{ width: '100%' }} />}
            {component.type === 'transferQueue' && <div>Encaminhar para: {JSON.parse(component.data.text).name}</div>}
            {component.type === 'interval' && <div>{component.data.text} ms</div>}
            {component.type === 'exit' && <div>Encerrar</div>}
            {component.type === 'conditional' && (
              <div>
                <strong>{component.data.title}</strong>
                <ul>
                  {component.data.options.map((option, i) => (
                    <li key={i}>{option.number} - {option.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
      <Handle type="source" position="right" />
    </div>
  );
};

export default CustomNode;
