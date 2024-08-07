import React from "react";
import { useContext } from 'react'
import Container from "@material-ui/core/Container";
import TranslationContext from "../../hooks/useTranslations/translationContext";

import './language.styles.scss'

import br from '../../assets/lang/br.svg'
import us from '../../assets/lang/us.svg'
import es from '../../assets/lang/es.svg'

const Language = ({ onClose }) => {

    const { useLanguage } = useContext(TranslationContext);

    const content = {
        pt: 'Português br',
        us: 'Inglês',
        es: 'Espanhol',
    }


    const toggleLangMenu = true

    const handleSetLanguage = (lg) => {
        useLanguage.handleSetLanguage(lg)
        onClose(false)
      }

    return (
        <Container className={`language ${toggleLangMenu ? '' : 'hide-lang'}`}>
            <ul>
                <li>
                    <div className='lang' onClick={() => handleSetLanguage('pt')}>
                        <img src={br}/>
                        <span>{content.pt}</span>
                    </div>
                </li>
                <li>
                    <div className='lang' onClick={() => handleSetLanguage('en')}>
                        <img src={us}/>
                        <span>{content.us}</span>
                    </div>
                </li>
                <li>
                    <div className='lang' onClick={() => handleSetLanguage('es')}>
                        <img src={es}/>
                        <span>{content.es}</span>
                    </div>
                </li>
            </ul>
        </Container>
    )
}

export default Language