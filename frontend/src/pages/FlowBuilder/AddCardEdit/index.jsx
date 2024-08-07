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
import EditIcon from "@material-ui/icons/Edit"
import DeleteIcon from "@material-ui/icons/Delete"
import {getImageAws} from '../../../helpers/getImageLink'

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
  const containsSequence = src.includes('@@@@');
  if (containsSequence) {
    return <Imagem src={src.split('@@@@')[1]} alt="Imagem" />;
  }
  const imageUri = getImageAws(src);
  return <Imagem src={imageUri} alt="Imagem" />;
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


const AddCard = ({onSaveCardEdit, dataEdit}) => {
  const [components, setComponents] = useState(dataEdit.data);
  const [textInput, setTextInput] = useState('');
  const [timeMiliSeconds, setTimeMiliSeconds] = useState(0);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showIntervalInput, setShowIntervalInput] = useState(false);
  const [queueView, setQueueView] = useState(false);
  const [showButtonAddConditional, setShowButtonAddConditional] = useState(true);
  const [showConditionalInput, setShowConditionalInput] = useState(false);
  const [selectedQueueId, setSelectedQueueId] = useState();
  const [conditionalIdDeleted, setConditionalIdDeleted] = useState([]);
  const [nodeIdDeleted, setNodeIdDeleted] = useState([]);
  const [optionIds, setOptionIds] = useState([]);
  const [removeOptionIds, setRemoveOptionIds] = useState([]);

  // add options states
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState([]);
  const [optionNumber, setOptionNumber] = useState('');
  const [optionText, setOptionText] = useState('');

  //editfeat
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingComponent, setEditingComponent] = useState(null);

  const handleEditComponent = (index) => {
    const newArr = [...components]
    console.log({index})
    const componentToEdit = newArr[index];
    newArr.splice(index, 1)
    console.log('debug4')
    setComponents(newArr)
    setEditingIndex(index);
    setEditingComponent(componentToEdit);
    setIsEditing(true);
  
    if (componentToEdit.type === 'text') {
      setTextInput(componentToEdit.data.text);
      setShowTextInput(true);
    } else if (componentToEdit.type === 'interval') {
      setTimeMiliSeconds(componentToEdit.data.text);
      setShowIntervalInput(true);
    } else if (componentToEdit.type === 'conditional') {
      setTitle(componentToEdit.data.title);

      setOptions(componentToEdit.data.options);
      setShowConditionalInput(true);
    }
  };
  const handleRemoveComponent = (index,type) => {
    const updatedComponents = components.filter((_, i) => i !== index);
    const findComponent = components.find((_, i) => i === index);
    if (findComponent.type === 'conditional') {
      const idsToRemove = [...removeOptionIds]
      findComponent.data.options.forEach(element => {
        if (element.id) {
          idsToRemove.push(element.id)
        }
      });
      setRemoveOptionIds(idsToRemove)
    }
    console.log('debug2')
    setComponents(updatedComponents);
  };

  const handleAddComponent = (type, data) => {
    if (editingIndex !== null) {
      const newComponent = { type, data };
      const array = [...components] //
      console.log({editingIndex})
      array.splice(editingIndex, 0, newComponent);
      console.log('debug0')
      setComponents(array);
      setIsEditing(false);
      setEditingIndex(null);
    } else {
      console.log('debug1')
      const newComponent = { type, data };
      setComponents([...components, newComponent]);
    }
  };
  // add options functions
  const handleAddOption = () => {
    const uid = uuidv4();
    const newArr = [...optionIds]
    newArr.push(uid)
    setOptionIds(newArr)
    if (optionText.trim() !== '') {
      setOptions([...options, { id: uid, number: optionNumber, text: optionText }]);
      setOptionNumber('');
      setOptionText('');
    }
  };

  const handleRemoveOption = (number) => {
    const newArr = [...removeOptionIds]
    const op = options.filter(option => option.number === number)
    newArr.push(op.id)
    setRemoveOptionIds(newArr)
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


  const handleSave = () => {
   
    const dt = {
      ...dataEdit,
      data: components
    }
    console.log({dataEdit, dt})
    onSaveCardEdit(dt, optionIds, removeOptionIds)
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target.result;
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

  const renderComponent = (component, index) => {
    
    return (
      <div key={index}>
        {component.type === 'image' && <ImageComponent src={component.data.text} />}
        {component.type === 'text' && <TextComponent text={component.data.text} />}
        {component.type === 'transferQueue' && <TransferQueueComponent text={component.data.text} />}
        {component.type === 'interval' && <IntervalComponent time={component.data.text} />}
        {component.type === 'exit' && <ExitComponent />}
        {component.type === 'conditional' && <OptionComponent data={component.data} />}
        <EditIcon color='blue' onClick={() => handleEditComponent(index, component.type)} />
        <DeleteIcon color='#c45' onClick={() => handleRemoveComponent(index, component.type)} />
      </div>
    );
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