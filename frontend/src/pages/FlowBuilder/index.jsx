import React, { useState, useCallback, useContext, useEffect } from "react";
import ReactFlow, { 
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
 } from 'reactflow';
import Clock from "@material-ui/icons/Timer"
import CastConnected from "@material-ui/icons/PostAdd"
import DoneIcon from "@material-ui/icons/Done"
import "reactflow/dist/style.css";
import ExitToApp from "@material-ui/icons/ExitToApp"
// import FlowIco from "@material-ui/icons/LinkOutlined"
import FlowIco from "@material-ui/icons/LinearScale"
import { AuthContext } from "../../context/Auth/AuthContext";

import AddCard from './AddCard';
import AddCardEdit from './AddCardEdit';
import Title from "../../components/Title";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import {
  Button,
  TextComponentDiv,
  Imagem,
  CreateCardComponent,
  PComponent,
  Option,
  OptionComponentDiv,
  OptionIndex,
  OptionText,
  ButtonDisable,
  TimeComponentDiv,
  InputText,
  DivInputText,
  FlowComponent,
  Flow,
  ButtonSave,
} from './styles'
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import {getImageAws} from '../../helpers/getImageLink'
import { Edit } from "@material-ui/icons";

// Componente de Imagem
const ImageComponent = ({ src }) => {
  return <Imagem src={src} alt="Imagem" />;
};

// Componente de Texto
const TextComponent = ({ text }) => {
  return (
    <TextComponentDiv>
      <PComponent>{text}</PComponent>
    </TextComponentDiv>
  );
};
const IntervalComponent = ({ time }) => {
  return (
    <TimeComponentDiv>
      <p>{time} ms</p>
      <Clock style={{fontSize: '12px'}} color="primary" />
    </TimeComponentDiv>
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
const ExitComponent = () => {
  return (
    <TextComponentDiv>
      <p style={{fontSize: '6px'}}>Encerrar</p>
      <ExitToApp style={{fontSize: '12px'}} />
    </TextComponentDiv>
  );
};


const FlowBuilderComponent = () => {
  
  const [isCreateCard, setIsCreateCard] = useState(false);
  const [isCreateEditCard, setIsCreateEditCard] = useState(false);
  const [lastId, setLastId] = useState();
  const [optionsPendent, setOptionsPendent] = useState([]);
  const [optionsIdsDone, setOptionsIdsDone] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [currentConditionalId, setCurrentConditionalId] = useState(null);
  const [currentOptionalId, setCurrentOptionalId] = useState(null);
  const [titleCurrentOption, setTitleCurrentOption] = useState();
  const [amountOptions, setAmountOptions] = useState(0);
  const [titleFlow, setTiltleFlow] = useState();
  const [nodesToApi, setNodesToApi] = useState([]);
  const [flows, setFlows] = useState([]);
  const [flowId, setFlowId] = useState(null);

  const { user } = useContext(AuthContext);
  const { companyId } = user;
  

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // edit
  const [nodesEdit, setNodesEdit, onNodesChangeEdit] = useNodesState([]);
  const [edgesEdit, setEdgesEdit, onEdgesChangeEdit] = useEdgesState([]);
  const [viewEditFlow, setViewEditFlow] = useState(false);
  const [dataEdit, setDataEdit] = useState();
 
  const onConnect = useCallback(

    (params) => setEdges((eds) => {
      addEdge(params, eds)
    }),
    [setEdges],
  );

  const onConnectEdit = useCallback(

    (params) => setEdgesEdit((eds) => {
      addEdge(params, eds)
    }),
    [setEdgesEdit],
  );

  const createEdge = (source, target) => {
    if (!source) {
      if (edges && edges.length > 0) {
        const objctEdge = {
          id: `${edges.length + 1}`,
          source: lastId,
          target,
        }
        const newArr = [...edges]
        newArr.push(objctEdge)
        setEdges(newArr)
        setLastId(target)
      } else {
        const objctEdge = {
          id: '1',
          source: lastId,
          target,
        }
        setEdges([objctEdge])
        setLastId(target)
      }
    } else {
      if (edges && edges.length > 0) {
        const objctEdge = {
          id: `${edges.length + 1}`,
          source,
          target,
        }
        const newArr = [...edges]
        newArr.push(objctEdge)
        setEdges(newArr)
        setLastId(target)
      } else {
        const objctEdge = {
          id: '1',
          source,
          target,
        }
        setEdges([objctEdge])
        setLastId(target)
      }
    }
    
  }

  const loadFlows = async () => {
    const response = await api.get('/flowbuilder');
    if (Array.isArray(response.data?.flows) && response.data.flows.length > 0) {
      setFlows(response.data.flows)
    }
  }

  useEffect(() => {
    loadFlows()
  }, [])

  const handleCreateFlow = ({ nodeId, conditionalId, optionId, number }) => {
    // const isDone = optionsIdsDone.find(idOp => idOp === optionId)
    // if (isDone) return
    setCurrentNodeId(nodeId)
    setCurrentConditionalId(conditionalId)
    setCurrentOptionalId(optionId)
    setTitleCurrentOption(number)
    setIsCreateCard(true)
    
  }
  
  const createNode = (data) => {
    let totalOptions = 0;
    data.forEach(item => {
      if (item.type === "conditional") {
        totalOptions += item.data.options.length;
      }
    });
    setAmountOptions(prevAmount => prevAmount + totalOptions);
    
    if (nodes && nodes.length > 0) {
      const objctNode = {
        id: `${nodes.length + 1}`,
        position: { x: (nodes.length * 40), y: (nodes.length * 40) },
        nodeId: currentNodeId,
        conditionalId: currentConditionalId,
        optionId: currentOptionalId,
        dataObjects: data,
        data: { 
          label: (
            <CreateCardComponent>
              {titleCurrentOption && (
                <OptionText>Fluxo da opção [{titleCurrentOption}]</OptionText>
              )}
              {data.map((component, index) => {
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
                    return <ExitComponent key={index} />;
                  case 'conditional':
                    return (
                          <OptionComponentDiv>
                            <OptionText>{component.data?.title}</OptionText>
                            {component.data && component.data.options.map((option) => {
                              const isDone = optionsIdsDone.find(idOp => idOp === option.id)
                              let stateDone = false
                              return (
                                <Option 
                                onClick={() => {
                                  if (stateDone) return
                                  handleCreateFlow({
                                  nodeId: `${nodes.length + 1}`,
                                  conditionalId: component.data.id,
                                  optionId: option.id,
                                  number: option.number,
                                })
                                setAmountOptions(prevAmount => prevAmount - 1);
                                stateDone = true

                              }} 
                                key={option.number}>
                                  <OptionIndex>
                                    {`${option.number} - `}
                                  </OptionIndex>
                                  <OptionText>
                                    {option.text}
                                  </OptionText>
                                  {
                                    !isDone && (
                                      <CastConnected color="action" fontSize="inherit"/>
                                    )
                                  }
                                  {
                                    isDone && (
                                      <DoneIcon color="action" fontSize="inherit"/>
                                    )
                                  }
                                 
                                </Option>
                              )}
                            )}
                          </OptionComponentDiv>
                      );
                  default:
                    return null;
                }
              })}
            </CreateCardComponent>
          ),
        }
      }
      const objctNodeToApi = {
        id: `${nodes.length + 1}`,
        position: { x: (nodes.length * 40), y: (nodes.length * 40) },
        nodeId: currentNodeId,
        conditionalId: currentConditionalId,
        optionId: currentOptionalId,
        data,
      }
      
      if (!isCreateEditCard) {
        const newArr = [...nodes]
        newArr.push(objctNode)
        setNodes(newArr)
      } else {
        const newArr = [...nodesEdit]
        newArr.push(objctNode)
        setNodesEdit(newArr)
      }
      
      const newArrNodes = [...nodesToApi]
      newArrNodes.push(objctNodeToApi)
      setNodesToApi(newArrNodes)
      createEdge(currentNodeId, `${nodes.length + 1}`)
      if (currentOptionalId) {
        const newArrOptions = [...optionsIdsDone]
        newArrOptions.push(currentOptionalId)
        setOptionsIdsDone(newArrOptions)
      }
      setIsCreateCard(false)
      setCurrentNodeId(null)
      setCurrentConditionalId(null)
      setCurrentOptionalId(null)
      setTitleCurrentOption(null)
      
    } else {
      const objctNode = {
        id: '1',
        position: { x: 0, y: 0 },
        nodeId: null,
        conditionalId: null,
        optionId: null,
        dataObjects: data,
        style: {
          display: 'flex',
          height: 'auto',
          with: 'auto',
          padding: '20px',
          flexDirection: 'column',
          borderRadius: '7px',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        },
        data: { 
          label: (
            <CreateCardComponent>
              {data.map((component, index) => {
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
                    return <ExitComponent key={index} />;
                  case 'conditional':
                    return (
                          <OptionComponentDiv>
                            <OptionText>{component.data?.title}</OptionText>
                            {component.data && component.data.options.map((option) => {
                              const isDone = optionsIdsDone.find(idOp => idOp === option.id)
                              let stateDone = false
                              return (
                                <Option 
                                onClick={() => {
                                  if (stateDone) return
                                  handleCreateFlow({
                                  nodeId: '1',
                                  conditionalId: component.data.id,
                                  optionId: option.id,
                                  number: option.number,
                                })
                                setAmountOptions(prevAmount => prevAmount - 1);
                                stateDone = true
                                }}
                                key={option.number}>
                                  <OptionIndex>
                                    {`${option.number} - `}
                                  </OptionIndex>
                                  <OptionText>
                                    {option.text}
                                  </OptionText>
                                  {
                                    !isDone && (
                                      <CastConnected color="action" fontSize="inherit"/>
                                    )
                                  }
                                  {
                                    isDone && (
                                      <DoneIcon color="action" fontSize="inherit"/>
                                    )
                                  }
                                </Option>
                              )}
                            )}
                          </OptionComponentDiv>
                      );
                  default:
                    return null;
                }
              })}
            </CreateCardComponent>
          ),
        }
      }
      const objctNodeToApi = {
        id: '1',
        position: { x: 0, y: 0 },
        nodeId: null,
        conditionalId: null,
        optionId: null,
        data,
      }
      setNodesToApi([objctNodeToApi])
      if (!isCreateEditCard) {
        setNodes([objctNode])
      } else {
        setNodesEdit([objctNode])
      }
      
      setLastId('1')
      setIsCreateCard(false)

    }
  }

  const onSaveCard = async (data) => {
    if (isCreateEditCard) {
      await createNodeEdit(data)
    } else {
      createNode(data)
    }
    
  }
  const handleSubmit = async () => {
    try {
      if (!titleFlow || titleFlow.length < 3) {
        alert('Coloque o titulo Do fluxo')
      }
      const data = {
        nodes: nodesToApi,
        edges,
        title: titleFlow,
        companyId,
      }
      const response = await api.post('/flowbuilder', data);
      if (response.data) {
        setNodes([])
        setNodesEdit([])
        setNodesToApi([])
        setEdges([])
        setTitleCurrentOption(undefined)
        setLastId(undefined)
        loadFlows()
      }
    } catch (error) {
      toastError(error);
    }
    
  }

  const handleTextInputChange = (event) => {
    setTiltleFlow(event.target.value);
  };

  // edit 
  const handleEditFlowLocal = async (flowid) => {
    setNodes([])
    setEdges([])
    setNodesToApi([])
    setNodesEdit([])
    const response = await api.get(`/flowbuilder/find?id=${flowid}`);
    if (response.data?.flow) {
      setFlowId(flowid)
      const flow = response.data.flow
      setTiltleFlow(flow.title)
      setEdgesEdit(flow.edges)
      for (const flw of flow.nodes) {
        await createNodeEdit(flw);
        console.log('loop')
      }
      setTimeout(() => {
        console.log({
          nodeEditCriados: nodesEdit,
          nodesApiCriados: nodesToApi,
        })
      }, 3000)
      
      setEdges(flow.edges);
      setViewEditFlow(true);
    }
    
  };
  const handleSaveEditFlow = async () => {
    if (optionsPendent && optionsPendent.length > 0) {
      alert('Voce ainda tem opções sem fluxos definidos em uma condicional!')
      return;
    }
    const nodesTemp = []
    console.log({saveNodes: nodesEdit})
     nodesEdit.forEach(item => {
      if (item && typeof item.dataObjects === 'object' && !Array.isArray(item.dataObjects) && 'data' in item.dataObjects) {
        const obj = {
          ...item,
          data: item.dataObjects.data,
        }
        nodesTemp.push(obj)
      } else {
        const obj = {
          ...item,
          data: item.dataObjects,
        }
        nodesTemp.push(obj)
      }
     })
     console.log({saveNodes2: nodesTemp})
    const data = {
      id: flowId,
      nodes: nodesTemp,
      edges: edgesEdit,
      title: titleFlow,
      companyId,
    };
    const response = await api.put(`/flowbuilder`, data);
    if (response.data) {
      setNodesEdit([]);
      setEdgesEdit([]);
      setFlowId(null)
      setNodesToApi([])
      setViewEditFlow(false);
      loadFlows();
    }
  };
  const createEdgeEdits = (source, target) => {
    if (!source) {
      if (edgesEdit && edgesEdit.length > 0) {
        const objctEdge = {
          id: `${edgesEdit.length + 1}`,
          source: lastId,
          target,
        }
        const newArr = [...edgesEdit]
        newArr.push(objctEdge)
        setEdgesEdit(newArr)
        setLastId(target)
      } else {
        const objctEdge = {
          id: '1',
          source: lastId,
          target,
        }
        setEdgesEdit([objctEdge])
        setLastId(target)
      }
    } else {
      if (edgesEdit && edgesEdit.length > 0) {
        const objctEdge = {
          id: `${edgesEdit.length + 1}`,
          source,
          target,
        }
        const newArr = [...edgesEdit]
        newArr.push(objctEdge)
        setEdgesEdit(newArr)
        setLastId(target)
      } else {
        const objctEdge = {
          id: '1',
          source,
          target,
        }
        setEdgesEdit([objctEdge])
        setLastId(target)
      }
    }
    
  }

  const handleCreateFlowEdit = ({ id, nodeId, conditionalId, optionId, number }) => {
    if (id) {
      setLastId(id)
    }
    setCurrentNodeId(nodeId)
    setCurrentConditionalId(conditionalId)
    setCurrentOptionalId(optionId)
    setTitleCurrentOption(number)
    setIsCreateEditCard(true)
    
  }
  
  const createNodeEdit = async (data, optionIds) => {
    // console.log({createNodeEditData: data, optionIds})
    // id: data.id,
    //     position: { x: data.position.x, y: data.position.y },
    //     nodeId: data?.nodeId,
    //     conditionalId: data.conditionalId,
    //     optionId: data?.optionId,
    if (isCreateEditCard) {
      let totalOptions = 0;
      data.forEach(item => {
        if (item.type === "conditional") {
          totalOptions += item.data.options.length;
        }
      });
    setAmountOptions(prevAmount => prevAmount + totalOptions);
      const objctNode = {
        id: `${nodesEdit.length + 1}`,
        position: { x: (nodesEdit.length * 40), y: (nodesEdit.length * 40) },
        nodeId: currentNodeId,
        conditionalId: currentConditionalId,
        optionId: currentOptionalId,
        dataObjects: data,
        data: { 
          label: (
            <CreateCardComponent>
              {titleCurrentOption && (
                <OptionText>Fluxo da opção [{titleCurrentOption}]</OptionText>
              )}
              {data.map((component, index) => {
                switch (component.type) {
                  case 'image':
                    const containsSequence = component.data.text.includes('@@@@');
                    if (containsSequence) {
                      const base64 = component.data.text.split('@@@@')[1]
                      return <ImageComponent key={index} src={base64} />;
                    }
                    const imageUri = getImageAws(component.data.text);
                    return <ImageComponent key={index} src={imageUri} />;
                  case 'text':
                    return <TextComponent key={index} text={component.data.text} />;
                  case 'transferQueue':
                    return <TransferQueueComponent key={index} text={component.data.text} />;
                  case 'interval':
                    return <IntervalComponent key={index} time={component.data.text} />;
                  case 'exit':
                    return <ExitComponent key={index} />;
                  case 'conditional':
                    return (
                          <OptionComponentDiv>
                            <OptionText>{component.data?.title}</OptionText>
                            {component.data && component.data.options.map((option) => {
                              const isDone = optionsIdsDone.find(idOp => idOp === option.id)
                              let stateDone = false
                              return (
                                <Option 
                                onClick={() => {
                                  if (stateDone) return
                                  handleCreateFlow({
                                  nodeId: `${nodesEdit.length + 1}`,
                                  conditionalId: component.data.id,
                                  optionId: option.id,
                                  number: option.number,
                                })
                                setAmountOptions(prevAmount => prevAmount - 1);
                                stateDone = true

                              }} 
                                key={option.number}>
                                  <OptionIndex>
                                    {`${option.number} - `}
                                  </OptionIndex>
                                  <OptionText>
                                    {option.text}
                                  </OptionText>
                                  {
                                    !isDone && (
                                      <CastConnected color="action" fontSize="inherit"/>
                                    )
                                  }
                                  {
                                    isDone && (
                                      <DoneIcon color="action" fontSize="inherit"/>
                                    )
                                  }
                                 
                                </Option>
                              )}
                            )}
                          </OptionComponentDiv>
                      );
                  default:
                    return null;
                }
              })}
            </CreateCardComponent>
          ),
        }
      }
      const objctNodeToApi = {
        id: `${nodesEdit.length + 1}`,
        position: { x: (nodesEdit.length * 40), y: (nodesEdit.length * 40) },
        nodeId: currentNodeId,
        conditionalId: currentConditionalId,
        optionId: currentOptionalId,
        data: data,
      }
      const newArr = [...nodesEdit]
      newArr.push(objctNode)
      
      setNodesEdit(newArr)
      const newArrNodes = [...nodesToApi]
      newArrNodes.push(objctNodeToApi)
      setNodesToApi(newArrNodes)
      createEdgeEdits(currentNodeId, `${nodesEdit.length + 1}`)
      if (currentOptionalId) {
        const newArrOptions = [...optionsIdsDone]
        newArrOptions.push(currentOptionalId)
        setOptionsIdsDone(newArrOptions)
      }
      setIsCreateEditCard(false)
      setCurrentNodeId(null)
      setCurrentConditionalId(null)
      setCurrentOptionalId(null)
      setTitleCurrentOption(null)
      return;
    }
    if (optionIds && optionIds.length > 0) {
      const objctNode = {
        id: data.id,
        position: { x: data.position.x, y: data.position.y },
        nodeId: data?.nodeId,
        conditionalId: data.conditionalId,
        optionId: data?.optionId,
        dataObjects: data,
        data: { 
          label: (
            <CreateCardComponent>
              {data.data.map((component, index) => {
                switch (component.type) {
                  case 'image':
                    const containsSequence = component.data.text.includes('@@@@');
                    if (containsSequence) {
                      const base64 = component.data.text.split('@@@@')[1]
                      return <ImageComponent key={index} src={base64} />;
                    }
                    const imageUri = getImageAws(component.data.text);
                    return <ImageComponent key={index} src={imageUri} />;
                  case 'text':
                    return <TextComponent key={index} text={component.data.text} />;
                  case 'transferQueue':
                    return <TransferQueueComponent key={index} text={component.data.text} />;
                  case 'interval':
                    return <IntervalComponent key={index} time={component.data.text} />;
                  case 'exit':
                    return <ExitComponent key={index} />;
                  case 'conditional':
                    return (
                          <OptionComponentDiv>
                            <OptionText>{component.data?.title}</OptionText>
                            {component.data && component.data.options.map((option) => {
                              const isNotDone = optionIds.find(idOp => idOp === option.id)
                              let stateDone = false

                              return (
                                <Option 
                                onClick={() => {
                                  if (stateDone) return
                                  if (!isNotDone) return
                                  handleCreateFlowEdit({
                                    id: data.id,
                                    nodeId: data?.nodeId,
                                    conditionalId: component.data.id,
                                    optionId: option.id,
                                    number: option.number,
                                })
                                if (isNotDone) {
                                  const newArr = optionsPendent.filter(op => op !== isNotDone);
                                  setOptionsPendent(newArr);
                                }
                                setAmountOptions(prevAmount => prevAmount - 1);
                                stateDone = true
                                }}
                                key={option.number}>
                                  <OptionIndex>
                                    {`${option.number} - `}
                                  </OptionIndex>
                                  <OptionText>
                                    {option.text}
                                  </OptionText>
                                  {
                                    isNotDone && (
                                      <CastConnected color="action" fontSize="inherit"/>
                                    )
                                  }
                                  {
                                    !isNotDone && (
                                      <DoneIcon color="action" fontSize="inherit"/>
                                    )
                                  }
                                </Option>
                              )}
                            )}
                          </OptionComponentDiv>
                      );
                  default:
                    return null;
                }
              })}
            </CreateCardComponent>
          ),
        }
      }
      const objctNodeToApi = {
        id: data.id,
        position: { x: data.position.x, y: data.position.y },
        nodeId: data?.nodeId,
        conditionalId: data.conditionalId,
        optionId: data?.optionId,
        data: data.data,
      }
      const newArrNodes = [...nodesToApi]
      newArrNodes.push(objctNodeToApi)
      setNodesToApi(newArrNodes)
      setNodesEdit(prevNodesEdit => [...prevNodesEdit, objctNode]);  
    } else {
      const objctNode = {
        id: data.id,
        position: { x: data.position.x, y: data.position.y },
        nodeId: data?.nodeId,
        conditionalId: data.conditionalId,
        optionId: data?.optionId,
        dataObjects: data.data,
        data: { 
          label: (
            <CreateCardComponent>
              {/* {titleCurrentOption && (
                <OptionText>Fluxo da opção [{titleCurrentOption}]</OptionText>
              )} */}
              <Edit onClick={() => {
                setDataEdit(data);
                }} />
              {data.data.map((component, index) => {
                switch (component.type) {
                  case 'image':
                    const containsSequence = component.data.text.includes('@@@@');
                    if (containsSequence) {
                      const base64 = component.data.text.split('@@@@')[1]
                      return <ImageComponent key={index} src={base64} />;
                    }
                    const imageUri = getImageAws(component.data.text);
                    return <ImageComponent key={index} src={imageUri} />;
                  case 'text':
                    return <TextComponent key={index} text={component.data.text} />;
                  case 'transferQueue':
                    return <TransferQueueComponent key={index} text={component.data.text} />;
                  case 'interval':
                    return <IntervalComponent key={index} time={component.data.text} />;
                  case 'exit':
                    return <ExitComponent key={index} />;
                  case 'conditional':
                    return (
                          <OptionComponentDiv>
                            <OptionText>{component.data?.title}</OptionText>
                            {component.data && component.data.options.map((option) => {
                              
                              return (
                                <Option key={option.number}>
                                  <OptionIndex>
                                    {`${option.number} - `}
                                  </OptionIndex>
                                  <OptionText>
                                    {option.text}
                                  </OptionText>
                                  <DoneIcon color="action" fontSize="inherit"/>
                                </Option>
                              )}
                            )}
                          </OptionComponentDiv>
                      );
                  default:
                    return null;
                }
              })}
            </CreateCardComponent>
          ),
        }
      }
      console.log({data7: data, nodesEdit, nodesToApi})
      const objctNodeToApi = {
        id: data.id,
        position: { x: data.position.x, y: data.position.y },
        nodeId: data?.nodeId,
        conditionalId: data.conditionalId,
        optionId: data?.optionId,
        data: data.data,
      }
      const newArrNodes = [...nodesToApi]
      newArrNodes.push(objctNodeToApi)
      setNodesToApi(newArrNodes)
      // console.log({nodesEdit: [...nodesEdit, objctNode], newArrNodes})
      setNodesEdit(prevNodesEdit => [...prevNodesEdit, objctNode]);  
    }
    
    
  }

  // const handleEditFlow = async (id) => {
  //   const response = await api.get(`/flowbuilder/find?id=${id}`);
  //   console.log({responde: response.data})
  //   if (response.data?.flow) {
  //     setTiltleFlow(response.data.flow.title)
  //     setEdgesEdit(response.data.flow.edges)
  //     for (const flw of response.data.flow.nodes) {
  //       await createNodeEdit(flw);
  //     }
  //     setViewEditFlow(true)
  //   }
  // }

  // if (viewEditFlow) {
  //   return (
  //     <MainContainer>
  //       <MainHeader>
  //         <Title>{titleFlow}</Title>
  //         <MainHeaderButtonsWrapper></MainHeaderButtonsWrapper>
  //       </MainHeader>
  //       <ButtonExit
  //       onClick={() => {
  //         setViewEditFlow(false)
  //         setEdgesEdit([])
  //         setNodesEdit([])
  //         setTiltleFlow(undefined)
  //       }
  //       }
  //       >
  //         Sair
  //       </ButtonExit>
  //       <ReactFlow
  //       nodes={nodesEdit}
  //       onNodesChange={onNodesChangeEdit}
  //       edges={edgesEdit}
  //       // edgeTypes={edgeTypes}
  //       onEdgesChange={onEdgesChangeEdit}
  //       onConnect={onConnectEdit}
  //       fitView
  //     >
       
  //       <Background />
  //       {/* <MiniMap /> */}
  //       <Controls />
  //     </ReactFlow>
  //      </MainContainer>
  //   );
  // }

  const onSaveCardEdit = async (data, optionIds, removeOptionIds) => {
    if (removeOptionIds && removeOptionIds.length > 0) {
      let nodesTemp = [...nodesEdit];
      let nodesTempToApi = [...nodesToApi];
      nodesTemp = nodesTemp.filter(node => !removeOptionIds.includes(node.optionId));
      nodesTempToApi = nodesTempToApi.filter(node => !removeOptionIds.includes(node.optionId));
      setNodesToApi(nodesTempToApi)
      setNodesEdit(nodesTemp)
      if (optionIds && optionIds.length > 0) {
        setOptionsPendent(optionIds)
        console.log({dataA0: data, optionIds})
        await createNodeEdit(data, optionIds)
        setDataEdit(null)
      } else {
        console.log({dataA1: data})
        await createNodeEdit(data)
        setDataEdit(null)
      }
    } else {
      if (optionIds && optionIds.length > 0) {
        setOptionsPendent(optionIds)
        console.log({dataA3: data, optionIds})
        await createNodeEdit(data, optionIds)
        setDataEdit(null)
      } else {
        console.log({dataA4: data})
        await createNodeEdit(data)
        setDataEdit(null)
      }
      
    }
    
  }

  if(viewEditFlow) {
    return (
      <MainContainer>
          
          <input type="text" value={titleFlow} onChange={handleTextInputChange} />
          <ReactFlow
            nodes={nodesEdit}
            edges={edgesEdit}
            onNodesChange={onNodesChangeEdit}
            onEdgesChange={onEdgesChangeEdit}
            onConnect={onConnectEdit}
            connectionLineStyle={{ stroke: '#ddd', strokeWidth: 2 }}
            connectionLineType="bezier"
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultZoom={1.5}
          >
            <Background gap={16} />
            <Controls />
          </ReactFlow>
          {
            dataEdit && (
              <AddCardEdit onSaveCardEdit={onSaveCardEdit} dataEdit={dataEdit} />
            )
          }
          {
            isCreateEditCard && (
              <AddCard onSaveCard={onSaveCard} />
            )
          }
          <ButtonSave onClick={handleSaveEditFlow}>Salvar Edição</ButtonSave>
        </MainContainer>
    )
  }

  return (
    <MainContainer>
      <MainHeader>
        <Title>Flow Builder</Title>
        <MainHeaderButtonsWrapper></MainHeaderButtonsWrapper>
      </MainHeader>

      <DivInputText>
        <InputText placeholder="Nome do Fluxo" type="text" value={titleFlow} onChange={handleTextInputChange} />
      </DivInputText>

      {
        amountOptions === 0 && (
          <Button
          onClick={() => {
            setIsCreateCard(true)
          }
          }
          >
            Adicionar card
          </Button>
        )
      }
      {
        amountOptions !== 0 && (
          <ButtonDisable
          onClick={() => {}}
          >
            Adicionar card
          </ButtonDisable>
        )
      }
      <ReactFlow
      nodes={nodes}
      onNodesChange={onNodesChange}
      edges={edges}
      // edgeTypes={edgeTypes}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
     
      <Background />
      {/* <MiniMap /> */}
      <Controls />
    </ReactFlow>
    {
        amountOptions === 0 && (
          <Button
          onClick={() => handleSubmit()}
          >
            Salvar
          </Button>
        )
      }

    {
      isCreateCard && (
        <AddCard onSaveCard={onSaveCard} />
      )
    }
    
    {
      flows.length > 0 && (
        <FlowComponent>
          {
          flows.map(data => (
            <Flow key={data.id} onClick={() => handleEditFlowLocal(data.id)}>
              {data.title}
              <FlowIco/>
            </Flow>
          ))
          }
        </FlowComponent>
      )
    }
     </MainContainer>
  );
};

export default FlowBuilderComponent;