import styled from 'styled-components';

export const Button = styled.button`
padding: 15px;
border-radius: 9px;
justify-content: center;
align-items: center;
background-color: #4DDF3F;
width: 40%;
margin-left: auto;
margin-right: auto;
color: #fff;
&:hover {
  opacity: 0.5;
}
`;

export const ButtonSave = styled.button`
padding: 15px;
border-radius: 9px;
justify-content: center;
align-items: center;
background-color: transparent;
width: 40%;
margin-left: auto;
margin-right: auto;
border: solid 1px #19758E;
color: #19758E;
&:hover {
  opacity: 0.5;
}
`;

export const ButtonExit = styled.button`
padding: 15px;
border-radius: 9px;
justify-content: center;
align-items: center;
background-color: transparent;
width: 40%;
margin-left: auto;
margin-right: auto;
border: solid 1px #19758E;
color: #19758E;
&:hover {
  opacity: 0.5;
}
`;
export const ButtonDisable = styled.button`
padding: 15px;
width: 40%;
margin-left: auto;
margin-right: auto;
border-radius: 9px;
justify-content: center;
align-items: center;
background-color: #4DDF3F;
opacity: 0.5;
color: #fff;
&:hover {
  opacity: 0.3;
}
`;
export const CreateCardComponent = styled.div`
padding: 4px;
display: flex;
flex-direction: column;
border-radius: 6px;
justify-content: center;
align-items: center;
background-color: #fff;
`;
export const Imagem = styled.img`
width: 30px;
height: 30px;
`;
export const TextComponentDiv = styled.div`
display: flex;
justify-content: space-between;
align-items: center;
background-color: #D9E1ED;
border-radius: 9px;
padding: 4px;
margin: 4px;
border: none;
width: 95%;
margin-left: auto;
margin-right: auto;
`;
export const TimeComponentDiv = styled.div`
display: flex;
justify-content: space-between;
align-items: center;
background-color: #D9E1ED;
border-radius: 9px;
padding: 3px;
margin: 4px;
border: none;
width: 70%;
margin-left: auto;
  font-size: 7px;
margin-right: auto;
`;
export const PComponent = styled.p`
color: #000;
text-align: justify;
font-size: 6px;
`;

export const OptionComponentDiv = styled.div`
display: flex;
flex-direction: column;
justify-content: flex-start;
align-items: flex-start;
background-color: #D9E1ED;
border-radius: 9px;
padding: 3px;
margin: 4px;
border: none;
width: 100%;
margin-left: auto;
margin-right: auto;
`;
export const Option = styled.div`
display: flex;
flex-direction: row;
align-items: center;
justify-content: flex-start;
margin-left: auto;
width: 90%;
margin-right: auto;
background-color: #9EB7DE;
border-radius: 6px;
padding: 3px;
cursor: pointer;
margin: 4px;
`;
export const OptionIndex = styled.span`
color: #1355B5;
font-size: 6px;
font-weight: 600;
`;
export const OptionText = styled.span`
font-size: 6px;
margin-left: 3px;
margin-right: 4px;
`;
export const LabelText = styled.label`
font-size: 9px;
font-weight: 600;
margin: 3px;
`;
export const InputText = styled.input`
width: 100%;
min-height: 4vh;
margin-left: 4px;
&:focus {
  border: #fff;
}
`;
export const DivInputText = styled.div`
display: flex;
flex-direction: row;
justify-content: space-between;
align-items: center;
background-color: #fff;
border-radius: 9px;
margin: 12px;
border: 1px solid #1355B5;
width: 90%;
margin-left: auto;
margin-right: auto;
`;
export const FlowComponent = styled.div`
display: flex;
flex-direction: row;
justify-content: space-between;
align-items: center;
background-color: transparent;
border-radius: 9px;
margin: 12px;
border: none;
width: 90%;
margin-left: auto;
margin-right: auto;
`;
export const Flow = styled.span`
display: flex;
align-items: center;
padding: 12px;
background-color: transparent;
border-radius: 9px;
margin: 12px;
border: 1px solid #ADE1EF;
font-weight: 800;
color: #2B8199;
cursor: pointer;
`;