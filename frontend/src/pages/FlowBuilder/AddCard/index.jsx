import React, { useState } from 'react';
import DeleteOutline from "@material-ui/icons/DeleteOutline"
import { v4 as uuidv4 } from "uuid";
import Clock from "@material-ui/icons/Timer"
import ExitToApp from "@material-ui/icons/ExitToApp"
import TextFields from "@material-ui/icons/FormatColorText"
import ImageIcon from "@material-ui/icons/Image"
import Timelapse from "@material-ui/icons/Timelapse"
import Close from "@material-ui/icons/ExitToAppOutlined"
import ShortText from "@material-ui/icons/ShortText"
import QueueIcon from "@material-ui/icons/Queue"

import QueueSelect from '../QueueSelect'
import {
  CreateCardComponent,
  Button,
  ButtonSave,
  ButtonLabel,
  Imagem,
  ButtonInputText,
  DivInputText,
  InputText,
  TextComponentDiv,
  Option,
  OptionComponentDiv,
  OptionIndex,
  OptionText,
  LabelText,
  InputOptionTitle,
  QueueModal,
  DivText,
  DivConditional,
  FlootButtons,
  ButtonCancel,
  ButtonLabelImagem,
} from './styles'

// Componente de Imagem
const ImageComponent = ({ src }) => {
  return <Imagem src={src} alt="Imagem" />;
};

// Componente de Texto
const TextComponent = ({ text }) => {
  return (
    <TextComponentDiv>
      <p>{text}</p>
    </TextComponentDiv>
  );
};

const TransferQueueComponent = ({ text }) => {
  const parseString = JSON.parse(text)
  return (
    <TextComponentDiv>
      <p>Encaminhar para {parseString?.name}</p>
    </TextComponentDiv>
  );
};

const IntervalComponent = ({ time }) => {
  return (
    <TextComponentDiv>
      <p>{time} ms</p>
      <Clock />
    </TextComponentDiv>
  );
};
const ExitComponent = () => {
  return (
    <TextComponentDiv>
      <p>Encerrar</p>
      <ExitToApp />
    </TextComponentDiv>
  );
};

// Componente de Multiplas escolha
const OptionComponent = ({ data }) => {
  return (
    <OptionComponentDiv>
      <OptionText>{data?.title}</OptionText>
      {data && data.options.map((option) => {
        return (
          <Option key={option.number}>
            <OptionIndex>
              {`${option.number} - `}
            </OptionIndex>
            <OptionText>
              {option.text}
            </OptionText>
          </Option>
        )}
      )}
    </OptionComponentDiv>
  );
};

// Componente de Vídeo
const VideoComponent = ({ src }) => {
  return <video src={src} controls />;
};

const renderComponent = (component, index) => {
  switch (component.type) {
    case 'image':
      const base64 = component.data.text.split('@@@@')[1]
      return <ImageComponent key={index} src={base64} />;
    case 'text':
      return <TextComponent key={index} text={component.data.text} />;
    case 'transferQueue':
      return <TransferQueueComponent key={index} text={component.data.text} />;
    case 'interval':
      return <IntervalComponent key={index} time={component.data.text} />;
    case 'exit':
      return <ExitComponent key={index}/>;
    case 'conditional':
      return <OptionComponent key={index} data={component.data} />;
    default:
      return null;
  }
};

// Componente de Criação
const AddCard = ({onSaveCard}) => {
  const [components, setComponents] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [timeMiliSeconds, setTimeMiliSeconds] = useState(0);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showIntervalInput, setShowIntervalInput] = useState(false);
  const [queueView, setQueueView] = useState(false);
  const [showButtonAddConditional, setShowButtonAddConditional] = useState(true);
  const [showConditionalInput, setShowConditionalInput] = useState(false);
  const [selectedQueueId, setSelectedQueueId] = useState();

  // add options states
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState([]);
  const [optionNumber, setOptionNumber] = useState('');
  const [optionText, setOptionText] = useState('');

  // add options functions
  const handleAddOption = () => {
    const uid = uuidv4();
    if (optionText.trim() !== '') {
      setOptions([...options, { id: uid, number: optionNumber, text: optionText }]);
      setOptionNumber('');
      setOptionText('');
    }
  };

  const handleRemoveOption = (number) => {
    setOptions(options.filter(option => option.number !== number));
  };

  const handleSubmit = () => {
    if (!title) {
      alert('O titulo é obrigatório!')
      return
    }
    if (!options[1]?.text) {
      alert('é obrigatório no mínimo 2 opções!')
      return
    }
    const uid = uuidv4();
    const data = {
      id: uid,
      title: title,
      options: options,
    };
    
    handleAddComponent('conditional', data)
    setShowConditionalInput(false)
    setShowButtonAddConditional(false)
    
  };

  const handleAddComponent = (type, data) => {
    const newComponent = { type, data };
    setComponents([...components, newComponent]);
    if (type === 'exit') {
      onSaveCard([...components, newComponent])
    }
  };

  const handleSave = () => {
    onSaveCard(components)
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target.result;
        console.log({e: e.target, file: file.type})
        handleAddComponent('image', {text: `${file.type}@@@@${src}`});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextSubmit = () => {
    handleAddComponent('text', {text: textInput});
    setTextInput('');
    setShowTextInput(false);
  };
  const handleTimeSubmit = () => {
    handleAddComponent('interval', {text: timeMiliSeconds});
    setTimeMiliSeconds(0);
    setShowIntervalInput(false);
  };
  const handleTextInputChange = (event) => {
    setTextInput(event.target.value);
  };
  const handleTimeInputChange = (event) => {
    setTimeMiliSeconds(Number(event.target.value));
  };

  // selecionar fila
  const handleChangeQueue = (e) => {
    setSelectedQueueId(e);
    const convertToString = JSON.stringify(e); 
    handleAddComponent('transferQueue', {text: convertToString});
    setQueueView(false);
  };

  return (
    <>
    <CreateCardComponent>
      {
        queueView && (
          <QueueModal>
            <span>Selecione a Fila:</span>
            <QueueSelect
              selectedQueueId={selectedQueueId}
              onChange={(selectedIds) => handleChangeQueue(selectedIds)}
            />
            <ButtonCancel onClick={() => {
              setSelectedQueueId(undefined)
              setQueueView(false)
            }}>Cancelar</ButtonCancel>
          </QueueModal>
        )
      }
      
        {components.map((component, index) => renderComponent(component, index))}
        {showTextInput && (
        <DivInputText>
          <InputText 
          rows={5} // Defina o número de linhas que deseja mostrar
          cols={50} // Defina o número de colunas que deseja mostrar
          type="text" value={textInput} onChange={handleTextInputChange} />
          <ButtonInputText onClick={handleTextSubmit}>Ok</ButtonInputText>
        </DivInputText>
      )}
      {
        showIntervalInput && (
          <DivInputText>
            <InputText type="number" value={timeMiliSeconds} onChange={handleTimeInputChange} />
            <ButtonInputText onClick={handleTimeSubmit}>Salvar</ButtonInputText>
          </DivInputText>
        )
        }
        {
          showConditionalInput && (
            <DivConditional>
              <DivText>
              <LabelText>
                Título:
                <InputOptionTitle
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </LabelText>
              </DivText>
              <div>
                <DivText>
                <LabelText>
                  Número:
                  <InputOptionTitle
                    type="text"
                    value={optionNumber}
                    onChange={(e) => setOptionNumber(e.target.value)}
                  />
                </LabelText>
                </DivText>
                <LabelText>
                  Texto:
                  <InputOptionTitle
                    type="text"
                    value={optionText}
                    onChange={(e) => setOptionText(e.target.value)}
                  />
                </LabelText>
                <ButtonLabel onClick={handleAddOption}>Adicionar Opção</ButtonLabel>
              </div>
              <ul>
                {options.map(option => (
                  <li style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%'}} key={option.number}>
                    <Option key={option.number}>
                      <OptionIndex>
                        {option.number} - 
                      </OptionIndex>
                      <OptionText>
                        {option.text}
                      </OptionText>
                    </Option>
                    <DeleteOutline color='error' onClick={() => handleRemoveOption(option.number)}/>
                    {/* <ButtonOptionsRemove onClick={() => handleRemoveOption(option.number)}>Remover</ButtonOptionsRemove> */}
                  </li>
                ))}
              </ul>
              <ButtonLabel onClick={handleSubmit}>Criar Objeto Condicional</ButtonLabel>
            </DivConditional>
          )
        }
     
        
      <ButtonSave onClick={handleSave}>Salvar</ButtonSave>
      <style jsx>{`
        #fileInput {
          display: none;
        }
      `}</style>
    </CreateCardComponent>
    <FlootButtons>
      <ButtonLabelImagem htmlFor="fileInput">
        Adicionar Imagem
        <ImageIcon/>
      </ButtonLabelImagem>
      <input id="fileInput" type="file" accept=".png, .jpeg, .jpg" onChange={handleImageUpload} />
      <Button onClick={() => setShowTextInput(true)}>Adicionar Texto<TextFields /></Button>
      <Button onClick={() => setQueueView(true)}>Transferir para Fila<QueueIcon/></Button>
      <Button onClick={() => setShowIntervalInput(true)}>Adicionar Intervalo<Timelapse/></Button>
      <Button onClick={() => handleAddComponent('exit', {text: 'exit-flow'})}>Botão Finalizar Fluxo<Close/></Button>
      {
        showButtonAddConditional && (
          <Button onClick={() => setShowConditionalInput(true)}>Adicionar Opções<ShortText/></Button>
        )
      }
    </FlootButtons>
    </>
  );
};

export default AddCard;