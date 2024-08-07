import React, { useState } from 'react';
import DeleteOutline from "@material-ui/icons/DeleteOutline"
import Clock from "@material-ui/icons/Timer"
import {
  CreateCardComponent,
  AddButtonsComponent,
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
  // ButtonOptionsRemove,
  DivText,
  DivConditional,
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

const IntervalComponent = ({ time }) => {
  return (
    <TextComponentDiv>
      <p>{time} ms</p>
      <Clock />
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
      return <ImageComponent key={index} src={component.data} />;
    case 'text':
      return <TextComponent key={index} text={component.data} />;
    case 'interval':
      return <IntervalComponent key={index} time={component.data} />;
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
  const [showButtonAddConditional, setShowButtonAddConditional] = useState(true);
  const [showConditionalInput, setShowConditionalInput] = useState(false);

  // add options states
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState([]);
  const [optionNumber, setOptionNumber] = useState('');
  const [optionText, setOptionText] = useState('');

  // add options functions
  const handleAddOption = () => {
    if (optionText.trim() !== '') {
      setOptions([...options, { number: optionNumber, text: optionText }]);
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
    const data = {
      title: title,
      options: options
    };
    
    handleAddComponent('conditional', data)
    setShowConditionalInput(false)
    setShowButtonAddConditional(false)
    
  };

  const handleAddComponent = (type, data) => {
    const newComponent = { type, data };
    setComponents([...components, newComponent]);
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
        handleAddComponent('image', src);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextSubmit = () => {
    handleAddComponent('text', textInput);
    setTextInput('');
    setShowTextInput(false);
  };
  const handleTimeSubmit = () => {
    handleAddComponent('interval', timeMiliSeconds);
    setTimeMiliSeconds(0);
    setShowIntervalInput(false);
  };
  const handleTextInputChange = (event) => {
    setTextInput(event.target.value);
  };
  const handleTimeInputChange = (event) => {
    setTimeMiliSeconds(Number(event.target.value));
  };

  return (
    <CreateCardComponent>
      
        {components.map((component, index) => renderComponent(component, index))}
        {showTextInput && (
        <DivInputText>
          <InputText type="text" value={textInput} onChange={handleTextInputChange} />
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
     
      <AddButtonsComponent>
        <ButtonLabel htmlFor="fileInput">
          Adicionar Imagem
        </ButtonLabel>
        <input id="fileInput" type="file" accept=".png, .jpeg, .jpg" onChange={handleImageUpload} />
        <Button onClick={() => setShowTextInput(true)}>Adicionar Texto</Button>
        <Button onClick={() => setShowIntervalInput(true)}>Adicionar Intervalo</Button>
        {
          showButtonAddConditional && (
            <Button onClick={() => setShowConditionalInput(true)}>Adicionar Opções</Button>
          )
        }
        
      </AddButtonsComponent>
      <ButtonSave onClick={handleSave}>Salvar</ButtonSave>
      <style jsx>{`
        #fileInput {
          display: none;
        }
      `}</style>
    </CreateCardComponent>
  );
};

export default AddCard;
